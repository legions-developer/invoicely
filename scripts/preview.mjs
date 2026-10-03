import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";

export const migrationLifecycleVersion = 1;

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultStatePath = join(repoRoot, "apps/web/.wrangler/neon-preview.json");
const devEndpointId = "ep-royal-lab-a1j1ksvy";
const databaseName = "invoicely";
const roleName = "invoicely_owner";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function required(env, name) {
  if (!env[name]?.trim()) throw new Error(`${name} is required.`);
  return env[name];
}

export function previewNames(branch) {
  if (typeof branch !== "string" || !/^[^\x00-\x20\x7f]{1,255}$/.test(branch)) {
    throw new Error("A valid preview git branch name is required.");
  }
  const slug =
    branch
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "branch";
  const hash = createHash("sha256").update(branch).digest("hex").slice(0, 12);
  return { cloudflare: branch, neon: `preview/${slug}-${hash}` };
}

export function previewBranchName(branch, buildUuid) {
  if (typeof buildUuid !== "string" || !buildUuid.trim()) throw new Error("WORKERS_CI_BUILD_UUID is required.");
  const generation = createHash("sha256").update(buildUuid).digest("hex").slice(0, 12);
  return `${previewNames(branch).neon}/build-${generation}`;
}

function isNativeBuild(env) {
  const hasMarkers = ["WORKERS_CI", "WORKERS_CI_BRANCH", "WORKERS_CI_COMMIT_SHA", "WORKERS_CI_BUILD_UUID"].some(
    (key) => env[key] !== undefined,
  );
  if (hasMarkers && env.WORKERS_CI !== "1") throw new Error("Native Cloudflare build context requires WORKERS_CI=1.");
  return hasMarkers;
}

function nativeIdentity(env) {
  const branch = required(env, "WORKERS_CI_BRANCH");
  const build = required(env, "WORKERS_CI_BUILD_UUID");
  const names = { cloudflare: branch, neon: previewBranchName(branch, build) };
  return {
    branch,
    commit: required(env, "WORKERS_CI_COMMIT_SHA"),
    build,
    names,
  };
}

export function validateDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be the generated Neon preview connection string.");
  }
  const endpoint = url.hostname.split(".")[0].replace(/-pooler$/, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    [devEndpointId, "ep-wispy-thunder-a1jhwivm"].includes(endpoint) ||
    url.pathname !== `/${databaseName}` ||
    !url.password ||
    !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode"))
  ) {
    throw new Error("DATABASE_URL must target an isolated preview database, with SSL enabled.");
  }
  return url;
}

function neonConfig(env) {
  const project = required(env, "NEON_PROJECT_ID");
  const parent = required(env, "NEON_PARENT_BRANCH_ID");
  const key = required(env, "NEON_API_KEY");
  return { project, parent, key, base: `https://console.neon.tech/api/v2/projects/${encodeURIComponent(project)}` };
}

export async function requestJson(url, key, { method = "GET", body, missingOK = false, fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("Neon request failed before a response was received; retry the build.");
  }
  if (missingOK && response.status === 404) return null;
  if (!response.ok) {
    const message = [401, 403].includes(response.status)
      ? "authentication was rejected; update NEON_API_KEY before retrying"
      : "request failed";
    throw new Error(`Neon ${message} (HTTP ${response.status}).`);
  }
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    throw new Error("Neon returned an invalid response.");
  }
}

export async function verifyParent(env, fetchImpl = fetch) {
  const { base, parent, key } = neonConfig(env);
  const data = await requestJson(`${base}/endpoints`, key, { fetchImpl });
  if (!data.endpoints?.some((endpoint) => endpoint.id === devEndpointId && endpoint.branch_id === parent)) {
    throw new Error(
      "The configured Neon parent does not own the selected development endpoint. Check the Neon variables.",
    );
  }
}

function assertPreviewBranch(branch, name, parent) {
  if (
    !branch?.id ||
    branch.id === parent ||
    branch.name !== name ||
    branch.parent_id !== parent ||
    branch.default ||
    branch.protected
  ) {
    throw new Error("Refusing to modify a Neon branch outside the configured preview parent.");
  }
}

async function listBranches(config, search, fetchImpl) {
  let cursor;
  const branches = [];
  const seen = new Set();
  do {
    const query = new URLSearchParams({ search, limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const data = await requestJson(`${config.base}/branches?${query}`, config.key, { fetchImpl });
    if (!Array.isArray(data.branches)) throw new Error("Neon did not return a branch list.");
    branches.push(...data.branches);
    cursor = data.pagination?.next;
    if (cursor && seen.has(cursor)) throw new Error("Neon returned a repeated branch-list cursor.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return branches;
}

async function waitOperations(config, operations, fetchImpl, sleep) {
  for (const operation of operations ?? []) {
    let current = operation;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (current.status === "finished" || current.status === "skipped") break;
      if (["failed", "cancelled"].includes(current.status))
        throw new Error("Neon could not prepare the preview database.");
      if (!current.id || attempt === 59) throw new Error("Timed out waiting for the Neon preview database.");
      await sleep(2000);
      const result = await requestJson(`${config.base}/operations/${encodeURIComponent(current.id)}`, config.key, {
        fetchImpl,
      });
      current = result.operation;
      if (!current) throw new Error("Neon did not return operation details.");
    }
  }
}

export async function prepareDatabase(env, { fetchImpl = fetch, sleep = delay } = {}) {
  const identity = nativeIdentity(env);
  const config = neonConfig(env);
  await verifyParent(env, fetchImpl);
  let branch = (await listBranches(config, identity.names.neon, fetchImpl)).find(
    (item) => item.name === identity.names.neon,
  );
  if (branch) {
    assertPreviewBranch(branch, identity.names.neon, config.parent);
  } else {
    const result = await requestJson(`${config.base}/branches`, config.key, {
      method: "POST",
      body: {
        branch: { name: identity.names.neon, parent_id: config.parent },
        endpoints: [{ type: "read_write", suspend_timeout_seconds: 300 }],
      },
      fetchImpl,
    });
    branch = result.branch;
    assertPreviewBranch(branch, identity.names.neon, config.parent);
    await waitOperations(config, result.operations, fetchImpl, sleep);
  }
  const urls = {};
  for (const pooled of [false, true]) {
    const query = new URLSearchParams({
      branch_id: branch.id,
      database_name: databaseName,
      role_name: roleName,
      pooled: String(pooled),
    });
    const data = await requestJson(`${config.base}/connection_uri?${query}`, config.key, { fetchImpl });
    validateDatabaseUrl(data.uri);
    urls[pooled ? "pooled" : "direct"] = data.uri;
  }
  const direct = validateDatabaseUrl(urls.direct);
  const pooled = validateDatabaseUrl(urls.pooled);
  if (direct.hostname !== pooled.hostname.replace("-pooler.", ".")) {
    throw new Error("Neon returned different endpoints for preview migrations and runtime.");
  }
  return { ...identity, branchId: branch.id, ...urls };
}

function childEnv(env) {
  const result = { ...env };
  for (const key of [
    "NEON_API_KEY",
    "NEON_PROJECT_ID",
    "NEON_PARENT_BRANCH_ID",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
  ])
    delete result[key];
  return result;
}

function redactions(env, ...urls) {
  const values = [env.NEON_API_KEY, env.CLOUDFLARE_API_TOKEN, ...urls];
  for (const value of urls) {
    if (value) {
      try {
        const password = new URL(value).password;
        values.push(password, decodeURIComponent(password));
      } catch {
        // An obsolete dashboard DATABASE_URL is replaced by the generated URL.
      }
    }
  }
  return values.filter(Boolean).sort((a, b) => b.length - a.length);
}

function runYarn(args, env, secrets = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("yarn", args, { env, cwd: repoRoot, stdio: ["inherit", "pipe", "pipe"] });
    for (const [stream, destination] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      let pending = "";
      const emit = (text) => {
        for (const secret of secrets) text = text.replaceAll(secret, "[REDACTED]");
        destination.write(text);
      };
      stream.setEncoding("utf8");
      stream.on("data", (text) => {
        pending += text;
        const end = pending.lastIndexOf("\n");
        if (end >= 0) {
          emit(pending.slice(0, end + 1));
          pending = pending.slice(end + 1);
        }
      });
      stream.on("end", () => emit(pending));
    }
    child.once("error", () => reject(new Error("Could not start the preview command.")));
    child.once("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`Preview command failed (exit ${code ?? "signal"}).`)),
    );
  });
}

export async function build(
  env,
  { fetchImpl = fetch, run = runYarn, statePath = defaultStatePath, sleep = delay, args = [] } = {},
) {
  await rm(statePath, { force: true });
  if (!isNativeBuild(env) || env.CLOUDFLARE_PREVIEW !== "true") {
    await run(["turbo", "run", "build:cloudflare", "--filter=web", ...args], childEnv(env));
    return;
  }
  const database = await prepareDatabase(env, { fetchImpl, sleep });
  const secrets = redactions(env, database.direct, database.pooled, env.DATABASE_URL);
  const commandEnv = { ...childEnv(env), CLOUDFLARE_PREVIEW: "true" };
  console.log("Prepared an isolated Neon preview branch. Applying committed migrations.");
  await run(["workspace", "@invoicely/db", "db:migrate"], { ...commandEnv, DATABASE_URL: database.direct }, secrets);
  console.log(`Preview database migrations succeeded for commit ${database.commit}.`);
  await run(
    ["turbo", "run", "build:cloudflare", "--filter=web", ...args],
    { ...commandEnv, DATABASE_URL: database.pooled },
    secrets,
  );
  await mkdir(dirname(statePath), { recursive: true, mode: 0o700 });
  await writeFile(
    statePath,
    JSON.stringify({
      branch: database.branch,
      commit: database.commit,
      build: database.build,
      project: env.NEON_PROJECT_ID,
      parent: env.NEON_PARENT_BRANCH_ID,
      branchId: database.branchId,
      DATABASE_URL: database.pooled,
    }),
    { mode: 0o600 },
  );
}

export async function deploy(env, { run = runYarn, statePath = defaultStatePath, args = [] } = {}) {
  const commandEnv = { ...childEnv(env), CLOUDFLARE_PREVIEW: "true" };
  let state;
  if (isNativeBuild(env)) {
    if (env.CLOUDFLARE_PREVIEW !== "true") throw new Error("Hosted preview uploads require CLOUDFLARE_PREVIEW=true.");
    const identity = nativeIdentity(env);
    try {
      state = JSON.parse(await readFile(statePath, "utf8"));
    } catch {
      throw new Error("Preview database state is missing. Run the preview build successfully before uploading.");
    }
    if (
      state.branch !== identity.branch ||
      state.commit !== identity.commit ||
      state.build !== identity.build ||
      state.project !== env.NEON_PROJECT_ID ||
      state.parent !== env.NEON_PARENT_BRANCH_ID ||
      !state.branchId ||
      state.branchId === env.NEON_PARENT_BRANCH_ID
    ) {
      throw new Error("Preview database state belongs to a different branch or build. Rebuild before uploading.");
    }
    validateDatabaseUrl(state.DATABASE_URL);
    commandEnv.DATABASE_URL = state.DATABASE_URL;
    if (args.length)
      throw new Error("Hosted preview names and secrets are managed by the build; remove extra upload arguments.");
  }
  const secrets = redactions(env, commandEnv.DATABASE_URL);
  await run(["workspace", "web", "opennextjs-cloudflare", "populateCache", "local"], commandEnv, secrets);
  const uploadEnv = {
    ...commandEnv,
    CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
  };
  if (!state) {
    await run(["workspace", "web", "wrangler", "preview", ...args], uploadEnv, secrets);
    return;
  }
  const directory = await mkdtemp(join(tmpdir(), "invoicely-preview-"));
  try {
    const secretsPath = join(directory, "secrets.json");
    await writeFile(secretsPath, JSON.stringify({ DATABASE_URL: state.DATABASE_URL }), { mode: 0o600 });
    await run(
      ["workspace", "web", "wrangler", "preview", "--name", state.branch, "--secrets-file", secretsPath],
      uploadEnv,
      secrets,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(statePath, { force: true });
  }
}

export async function cleanup(env, { fetchImpl = fetch, sleep = delay } = {}) {
  const names = previewNames(required(env, "PREVIEW_BRANCH"));
  const config = neonConfig(env);
  await verifyParent(env, fetchImpl);
  const prefix = `${names.neon}/build-`;
  // Collect every page before deleting: deletion can change pagination order.
  const branches = (await listBranches(config, prefix, fetchImpl)).filter(
    (branch) => branch.name?.startsWith(prefix) && /^[a-f0-9]{12}$/.test(branch.name.slice(prefix.length)),
  );
  for (const branch of branches) assertPreviewBranch(branch, branch.name, config.parent);
  if (!branches.length) {
    console.log("No Neon preview databases remain to clean up.");
    return;
  }
  for (const branch of branches) {
    const result = await requestJson(`${config.base}/branches/${encodeURIComponent(branch.id)}`, config.key, {
      method: "DELETE",
      missingOK: true,
      fetchImpl,
    });
    await waitOperations(config, result?.operations, fetchImpl, sleep);
  }
  console.log("Deleted the git branch's Neon preview databases.");
}

async function main(command, env, args) {
  switch (command) {
    case "build":
      return build(env, { args });
    case "deploy":
      return deploy(env, { args });
    case "cleanup":
      return cleanup(env);
    case "verify-parent":
      return verifyParent(env);
    default:
      throw new Error("Expected build, deploy, cleanup, or verify-parent.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2], process.env, process.argv.slice(3)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
