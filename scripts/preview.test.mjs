import {
  build,
  cleanup,
  deploy,
  prepareDatabase,
  previewBranchName,
  previewNames,
  requestJson,
  validateDatabaseUrl,
  verifyParent,
} from "./preview.mjs";
import { access, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import test from "node:test";

const devEndpoint = "ep-royal-lab-a1j1ksvy";
const prodEndpoint = "ep-wispy-thunder-a1jhwivm";
const directUrl =
  "postgresql://invoicely_owner:test-preview-password@ep-test-preview.us-east-1.aws.neon.tech/invoicely?sslmode=require";
const pooledUrl = directUrl.replace("ep-test-preview.", "ep-test-preview-pooler.");
const oldDatabaseUrl = directUrl.replace("ep-test-preview.", `${prodEndpoint}.`);

function environment(overrides = {}) {
  return {
    WORKERS_CI: "1",
    WORKERS_CI_BRANCH: "feature/invoice-layout",
    WORKERS_CI_COMMIT_SHA: "a".repeat(40),
    WORKERS_CI_BUILD_UUID: "test-build-id",
    CLOUDFLARE_PREVIEW: "true",
    NEON_PROJECT_ID: "test-project",
    NEON_PARENT_BRANCH_ID: "br-test-dev",
    NEON_API_KEY: "test-neon-management-token",
    DATABASE_URL: oldDatabaseUrl,
    BETTER_AUTH_SECRET: "test-app-auth-secret",
    BETTER_AUTH_URL: "https://invoicely.gg",
    SENTRY_AUTH_TOKEN: "test-sentry-upload-token",
    ...overrides,
  };
}

function previewBranch(env = environment(), overrides = {}) {
  return {
    id: "br-test-preview",
    name: previewBranchName(env.WORKERS_CI_BRANCH, env.WORKERS_CI_BUILD_UUID),
    parent_id: env.NEON_PARENT_BRANCH_ID,
    ...overrides,
  };
}

function localEnvironment(overrides = {}) {
  const env = environment(overrides);
  for (const key of ["WORKERS_CI", "WORKERS_CI_BRANCH", "WORKERS_CI_COMMIT_SHA", "WORKERS_CI_BUILD_UUID"])
    delete env[key];
  return env;
}

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return data;
    },
  };
}

function parentResponse(env = environment()) {
  return response({ endpoints: [{ id: devEndpoint, branch_id: env.NEON_PARENT_BRANCH_ID }] });
}

function responses(...items) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: new URL(url), ...options });
    assert.ok(items.length, "Unexpected additional provider request");
    return items.shift();
  };
  return { calls, fetchImpl };
}

function preparation(env = environment(), { existing = false, direct = directUrl, pooled = pooledUrl } = {}) {
  const branch = previewBranch(env);
  return responses(
    parentResponse(env),
    response({ branches: existing ? [branch] : [] }),
    ...(!existing ? [response({ branch, operations: [{ id: "op-create", status: "finished" }] })] : []),
    response({ uri: direct }),
    response({ uri: pooled }),
  );
}

async function stateFile(t) {
  const directory = await mkdtemp(join(tmpdir(), "invoicely-preview-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, "neon-preview.json");
}

async function saveState(path, env = environment(), overrides = {}) {
  const state = {
    branch: env.WORKERS_CI_BRANCH,
    commit: env.WORKERS_CI_COMMIT_SHA,
    build: env.WORKERS_CI_BUILD_UUID,
    project: env.NEON_PROJECT_ID,
    parent: env.NEON_PARENT_BRANCH_ID,
    branchId: "br-test-preview",
    DATABASE_URL: pooledUrl,
    ...overrides,
  };
  await writeFile(path, JSON.stringify(state), { mode: 0o600 });
  return state;
}

test("preview names retain native branch identity and avoid slug collisions", () => {
  const branch = "Feature/Invoice_Layout";
  const names = previewNames(branch);
  assert.equal(names.cloudflare, branch);
  assert.match(names.neon, /^preview\/feature-invoice-layout-[a-f0-9]{12}$/);
  assert.deepEqual(previewNames(branch), names);
  assert.notEqual(previewNames("feature/invoice").neon, previewNames("feature-invoice").neon);
  assert.notEqual(previewNames("Feature/invoice").neon, previewNames("feature/invoice").neon);
  assert.ok(previewNames("a".repeat(255)).neon.length <= 61);
  for (const invalid of [undefined, "", "feature name", "feature\nname", "feature\0name", "a".repeat(256)])
    assert.throws(() => previewNames(invalid), /valid preview git branch name/);
});

test("concurrent build generations have distinct names while same-build retries keep their identity", () => {
  const branch = "feature/invoice-layout";
  const first = previewBranchName(branch, "build-first");
  assert.equal(previewBranchName(branch, "build-first"), first);
  assert.notEqual(previewBranchName(branch, "build-second"), first);
  assert.notEqual(previewBranchName("feature-invoice-layout", "build-first"), first);
  assert.ok(first.startsWith(`${previewNames(branch).neon}/build-`));
  assert.match(first, /\/build-[a-f0-9]{12}$/);
});

test("database URLs must use isolated Neon endpoints, the app database, and SSL", () => {
  assert.equal(validateDatabaseUrl(directUrl).href, directUrl);
  assert.equal(validateDatabaseUrl(pooledUrl).href, pooledUrl);
  for (const endpoint of [devEndpoint, `${devEndpoint}-pooler`, prodEndpoint, `${prodEndpoint}-pooler`])
    assert.throws(
      () => validateDatabaseUrl(directUrl.replace("ep-test-preview.", `${endpoint}.`)),
      /isolated preview database/,
    );
  for (const invalid of [
    "not a URL",
    directUrl.replace("postgresql:", "https:"),
    directUrl.replace(".neon.tech", ".neon.tech.example.test"),
    directUrl.replace("/invoicely?", "/other?"),
    directUrl.replace(":test-preview-password", ""),
    directUrl.replace("sslmode=require", "sslmode=disable"),
  ])
    assert.throws(() => validateDatabaseUrl(invalid));
});

test("parent verification requires the configured branch to own the selected development endpoint", async () => {
  const env = environment();
  const good = responses(parentResponse(env));
  await verifyParent(env, good.fetchImpl);
  assert.match(good.calls[0].url.pathname, /\/projects\/test-project\/endpoints$/);
  assert.equal(good.calls[0].headers.Authorization, `Bearer ${env.NEON_API_KEY}`);
  for (const endpoints of [
    [],
    [{ id: devEndpoint, branch_id: "br-other" }],
    [{ id: prodEndpoint, branch_id: env.NEON_PARENT_BRANCH_ID }],
  ])
    await assert.rejects(verifyParent(env, responses(response({ endpoints })).fetchImpl), /does not own/);
});

test("new database provisioning creates only a child of the selected dev parent", async () => {
  const env = environment();
  const mock = preparation(env);
  const result = await prepareDatabase(env, mock);
  assert.equal(result.direct, directUrl);
  assert.equal(result.pooled, pooledUrl);
  assert.equal(result.branchId, "br-test-preview");
  assert.equal(mock.calls.length, 5);
  assert.equal(
    mock.calls[1].url.searchParams.get("search"),
    previewBranchName(env.WORKERS_CI_BRANCH, env.WORKERS_CI_BUILD_UUID),
  );
  const writes = mock.calls.filter((call) => call.method !== "GET");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, "POST");
  assert.ok(writes[0].url.pathname.endsWith("/branches"));
  const body = JSON.parse(writes[0].body);
  assert.deepEqual(body.branch, {
    name: previewBranchName(env.WORKERS_CI_BRANCH, env.WORKERS_CI_BUILD_UUID),
    parent_id: env.NEON_PARENT_BRANCH_ID,
  });
  assert.equal(body.endpoints[0].type, "read_write");
  for (const call of mock.calls.slice(3)) {
    assert.equal(call.url.searchParams.get("branch_id"), "br-test-preview");
    assert.equal(call.url.searchParams.get("database_name"), "invoicely");
    assert.equal(call.url.searchParams.get("role_name"), "invoicely_owner");
  }
  assert.equal(mock.calls[3].url.searchParams.get("pooled"), "false");
  assert.equal(mock.calls[4].url.searchParams.get("pooled"), "true");
});

test("same-build retries reuse their isolated generation without resetting it or the parent", async () => {
  const env = environment();
  const mock = preparation(env, { existing: true });
  await prepareDatabase(env, mock);
  const writes = mock.calls.filter((call) => call.method !== "GET");
  assert.equal(writes.length, 0);
  assert.equal(mock.calls.length, 4);
});

test("new builds leave earlier generations intact even if the branch search returns them", async () => {
  const env = environment({ WORKERS_CI_BUILD_UUID: "new-build" });
  const earlier = previewBranch(environment({ WORKERS_CI_BUILD_UUID: "previous-build" }), { id: "br-earlier-build" });
  const mock = responses(
    parentResponse(env),
    response({ branches: [earlier] }),
    response({ branch: previewBranch(env), operations: [] }),
    response({ uri: directUrl }),
    response({ uri: pooledUrl }),
  );
  await prepareDatabase(env, mock);
  const writes = mock.calls.filter((call) => call.method !== "GET");
  assert.equal(writes.length, 1);
  assert.ok(writes[0].url.pathname.endsWith("/branches"));
  assert.equal(
    JSON.parse(writes[0].body).branch.name,
    previewBranchName(env.WORKERS_CI_BRANCH, env.WORKERS_CI_BUILD_UUID),
  );
  assert.ok(mock.calls.every((call) => !call.url.pathname.includes("br-earlier-build")));
});

test("preparation refuses wrong-parent, parent, default, or protected branches before mutation", async () => {
  const env = environment();
  for (const override of [
    { parent_id: "br-other" },
    { id: env.NEON_PARENT_BRANCH_ID },
    { default: true },
    { protected: true },
  ]) {
    const mock = responses(parentResponse(env), response({ branches: [previewBranch(env, override)] }));
    await assert.rejects(prepareDatabase(env, mock), /Refusing to modify/);
    assert.equal(mock.calls.length, 2);
    assert.ok(mock.calls.every((call) => call.method === "GET"));
  }
});

test("preparation validates a newly created branch before requesting its credentials", async () => {
  const env = environment();
  const mock = responses(
    parentResponse(env),
    response({ branches: [] }),
    response({ branch: previewBranch(env, { parent_id: "br-other" }) }),
  );
  await assert.rejects(prepareDatabase(env, mock), /Refusing to modify/);
  assert.equal(mock.calls.length, 3);
});

test("preparation waits for Neon operations before retrieving connection strings", async () => {
  const env = environment();
  const sleeps = [];
  const mock = responses(
    parentResponse(env),
    response({ branches: [] }),
    response({ branch: previewBranch(env), operations: [{ id: "op-create", status: "running" }] }),
    response({ operation: { id: "op-create", status: "finished" } }),
    response({ uri: directUrl }),
    response({ uri: pooledUrl }),
  );
  await prepareDatabase(env, { ...mock, sleep: async (ms) => sleeps.push(ms) });
  assert.deepEqual(sleeps, [2000]);
  assert.ok(mock.calls[3].url.pathname.endsWith("/operations/op-create"));
  assert.ok(mock.calls[4].url.pathname.endsWith("/connection_uri"));
});

test("failed Neon operations stop provisioning without fetching connection strings", async () => {
  const env = environment();
  const mock = responses(
    parentResponse(env),
    response({ branches: [] }),
    response({ branch: previewBranch(env), operations: [{ id: "op-create", status: "failed" }] }),
  );
  await assert.rejects(prepareDatabase(env, mock), /could not prepare/);
  assert.equal(mock.calls.length, 3);
});

test("preparation rejects production URLs and mismatched migration/runtime endpoints", async () => {
  await assert.rejects(
    prepareDatabase(environment(), preparation(environment(), { direct: oldDatabaseUrl })),
    /isolated preview database/,
  );
  await assert.rejects(
    prepareDatabase(
      environment(),
      preparation(environment(), { pooled: pooledUrl.replace("ep-test-preview-", "ep-other-preview-") }),
    ),
    /different endpoints/,
  );
});

test("production and local builds keep the existing build command without calling Neon", async (t) => {
  const statePath = await stateFile(t);
  for (const env of [environment({ CLOUDFLARE_PREVIEW: undefined }), localEnvironment()]) {
    await saveState(statePath);
    const mock = responses();
    const calls = [];
    await build(env, {
      ...mock,
      statePath,
      args: ["--env=staging"],
      run: async (args, commandEnv) => calls.push({ args, env: commandEnv }),
    });
    assert.equal(mock.calls.length, 0);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].args, ["turbo", "run", "build:cloudflare", "--filter=web", "--env=staging"]);
    assert.equal(calls[0].env.DATABASE_URL, env.DATABASE_URL);
    await assert.rejects(access(statePath), { code: "ENOENT" });
  }
});

test("malformed native markers and incomplete preview identity fail before any build or provider request", async (t) => {
  const statePath = await stateFile(t);
  for (const overrides of [
    { WORKERS_CI: "true" },
    { WORKERS_CI: "true", CLOUDFLARE_PREVIEW: undefined },
    { WORKERS_CI: undefined },
    { WORKERS_CI_BRANCH: undefined },
    { WORKERS_CI_COMMIT_SHA: undefined },
    { WORKERS_CI_BUILD_UUID: undefined },
  ]) {
    const env = environment(overrides);
    const mock = responses();
    let ran = false;
    const run = async () => {
      ran = true;
    };
    await assert.rejects(build(env, { ...mock, statePath, run }));
    await assert.rejects(deploy(env, { statePath, run }));
    assert.equal(mock.calls.length, 0);
    assert.equal(ran, false);
  }
});

test("preview build migrates a direct URL, builds with pooled URL, and persists only successful state", async (t) => {
  const env = environment({ CLOUDFLARE_API_TOKEN: "test-cf-upload-token", CLOUDFLARE_ACCOUNT_ID: "test-account" });
  const statePath = await stateFile(t);
  const calls = [];
  const logs = [];
  t.mock.method(console, "log", (...args) => logs.push(args.join(" ")));
  await build(env, {
    ...preparation(env),
    statePath,
    run: async (args, commandEnv, secrets) => calls.push({ args, env: { ...commandEnv }, secrets }),
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, ["workspace", "@invoicely/db", "db:migrate"]);
  assert.equal(calls[0].env.DATABASE_URL, directUrl);
  assert.equal(calls[1].env.DATABASE_URL, pooledUrl);
  for (const call of calls) {
    assert.equal(call.env.CLOUDFLARE_PREVIEW, "true");
    assert.equal(call.env.BETTER_AUTH_SECRET, env.BETTER_AUTH_SECRET);
    for (const key of [
      "NEON_API_KEY",
      "NEON_PROJECT_ID",
      "NEON_PARENT_BRANCH_ID",
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
    ])
      assert.ok(!(key in call.env), `${key} must not reach app commands`);
    for (const secret of [
      env.NEON_API_KEY,
      env.CLOUDFLARE_API_TOKEN,
      directUrl,
      pooledUrl,
      oldDatabaseUrl,
      "test-preview-password",
    ])
      assert.ok(call.secrets.includes(secret));
  }
  assert.equal((await stat(statePath)).mode & 0o777, 0o600);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.DATABASE_URL, pooledUrl);
  assert.equal(state.branch, env.WORKERS_CI_BRANCH);
  assert.equal(state.commit, env.WORKERS_CI_COMMIT_SHA);
  assert.equal(state.build, env.WORKERS_CI_BUILD_UUID);
  assert.ok(!("NEON_API_KEY" in state));
  for (const secret of [
    env.NEON_API_KEY,
    env.BETTER_AUTH_SECRET,
    env.CLOUDFLARE_API_TOKEN,
    directUrl,
    pooledUrl,
    "test-preview-password",
  ])
    assert.ok(!logs.join("\n").includes(secret));
});

test("migration and build failures remove old state and never leave a new uploadable database state", async (t) => {
  const statePath = await stateFile(t);
  for (const failAt of [1, 2]) {
    await saveState(statePath);
    let calls = 0;
    await assert.rejects(
      build(environment(), {
        ...preparation(),
        statePath,
        run: async () => {
          calls++;
          if (calls === failAt) throw new Error("test command failed");
        },
      }),
      /test command failed/,
    );
    assert.equal(calls, failAt);
    await assert.rejects(access(statePath), { code: "ENOENT" });
  }
});

test("native upload uses the exact build database and uploads only DATABASE_URL as a runtime secret", async (t) => {
  const env = environment();
  const statePath = await stateFile(t);
  await build(env, { ...preparation(env), statePath, run: async () => {} });
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const calls = [];
  let secretPath;
  await deploy(env, {
    statePath,
    run: async (args, commandEnv, secrets) => {
      calls.push({ args, env: { ...commandEnv }, secrets });
      assert.equal(commandEnv.DATABASE_URL, state.DATABASE_URL);
      assert.ok(!("NEON_API_KEY" in commandEnv));
      if (args.includes("--secrets-file")) {
        secretPath = args[args.indexOf("--secrets-file") + 1];
        assert.equal((await stat(secretPath)).mode & 0o777, 0o600);
        assert.equal((await stat(dirname(secretPath))).mode & 0o777, 0o700);
        assert.deepEqual(JSON.parse(await readFile(secretPath, "utf8")), { DATABASE_URL: state.DATABASE_URL });
      }
    },
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, ["workspace", "web", "opennextjs-cloudflare", "populateCache", "local"]);
  assert.deepEqual(calls[1].args.slice(0, 6), [
    "workspace",
    "web",
    "wrangler",
    "preview",
    "--name",
    env.WORKERS_CI_BRANCH,
  ]);
  await assert.rejects(access(secretPath), { code: "ENOENT" });
  await assert.rejects(access(dirname(secretPath)), { code: "ENOENT" });
  await assert.rejects(access(statePath), { code: "ENOENT" });
});

test("native upload rejects stale branch, commit, build, project, parent, or database state", async (t) => {
  const env = environment();
  const statePath = await stateFile(t);
  for (const override of [
    { branch: "other-branch" },
    { commit: "other-commit" },
    { build: "other-build" },
    { project: "other-project" },
    { parent: "other-parent" },
    { branchId: env.NEON_PARENT_BRANCH_ID },
    { DATABASE_URL: oldDatabaseUrl },
  ]) {
    await saveState(statePath, env, override);
    let ran = false;
    await assert.rejects(
      deploy(env, {
        statePath,
        run: async () => {
          ran = true;
        },
      }),
    );
    assert.equal(ran, false);
  }
});

test("native upload requires successful build state and rejects extra upload arguments", async (t) => {
  const statePath = await stateFile(t);
  let ran = false;
  const run = async () => {
    ran = true;
  };
  await assert.rejects(deploy(environment(), { statePath, run }), /state is missing/);
  await saveState(statePath);
  await assert.rejects(
    deploy(environment(), { statePath, run, args: ["--name", "production"] }),
    /remove extra upload arguments/,
  );
  await assert.rejects(
    deploy(environment({ CLOUDFLARE_PREVIEW: undefined }), { statePath, run }),
    /CLOUDFLARE_PREVIEW=true/,
  );
  assert.equal(ran, false);
});

test("failed uploads remove the temporary credentials and consumed build state", async (t) => {
  const statePath = await stateFile(t);
  await saveState(statePath);
  let secretPath;
  await assert.rejects(
    deploy(environment(), {
      statePath,
      run: async (args) => {
        if (args.includes("--secrets-file")) {
          secretPath = args[args.indexOf("--secrets-file") + 1];
          await access(secretPath);
          throw new Error("test upload failed");
        }
      },
    }),
    /test upload failed/,
  );
  assert.ok(secretPath);
  await assert.rejects(access(dirname(secretPath)), { code: "ENOENT" });
  await assert.rejects(access(statePath), { code: "ENOENT" });
});

test("local preview upload preserves manual Wrangler arguments without provisioning a database", async () => {
  const calls = [];
  await deploy(localEnvironment({ DATABASE_URL: directUrl }), {
    args: ["--name", "manual-preview"],
    run: async (args) => calls.push(args),
  });
  assert.deepEqual(calls[1], ["workspace", "web", "wrangler", "preview", "--name", "manual-preview"]);
});

test("cleanup is Neon-only and safe to repeat when the exact preview branch is missing", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const mock = responses(
    parentResponse(env),
    response({ branches: [] }),
    parentResponse(env),
    response({ branches: [] }),
  );
  await cleanup(env, mock);
  await cleanup(env, mock);
  assert.equal(mock.calls.length, 4);
  assert.ok(mock.calls.every((call) => call.method === "GET" && call.url.hostname === "console.neon.tech"));
});

test("cleanup follows pagination, matches exact names, and tolerates deletion races", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const mock = responses(
    parentResponse(env),
    response({
      branches: [previewBranch(env, { id: "br-unrelated", name: `${previewNames(env.PREVIEW_BRANCH).neon}-other` })],
      pagination: { next: "next page/value" },
    }),
    response({ branches: [previewBranch(env)] }),
    response(null, 404),
  );
  await cleanup(env, mock);
  assert.equal(mock.calls.length, 4);
  assert.equal(mock.calls[2].url.searchParams.get("cursor"), "next page/value");
  assert.equal(mock.calls[3].method, "DELETE");
  assert.ok(mock.calls[3].url.pathname.endsWith("/branches/br-test-preview"));
});

test("cleanup collects every generation before deleting and ignores unrelated or malformed names", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const first = previewBranch(env, { id: "br-first" });
  const second = previewBranch({ ...env, WORKERS_CI_BUILD_UUID: "second-build" }, { id: "br-second" });
  const prefix = `${previewNames(env.PREVIEW_BRANCH).neon}/build-`;
  const mock = responses(
    parentResponse(env),
    response({
      branches: [first, { ...first, id: "br-malformed", name: `${prefix}not-a-build-hash` }],
      pagination: { next: "next-page" },
    }),
    response({
      branches: [
        second,
        previewBranch({ ...env, WORKERS_CI_BRANCH: "unrelated-branch" }, { id: "br-unrelated" }),
        { ...first, id: "br-extra-suffix", name: `${first.name}-extra` },
      ],
    }),
    response(null, 204),
    response(null, 204),
  );
  await cleanup(env, mock);
  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ["GET", "GET", "GET", "DELETE", "DELETE"],
  );
  assert.equal(mock.calls[1].url.searchParams.get("search"), prefix);
  assert.deepEqual(
    mock.calls.slice(3).map((call) => call.url.pathname.split("/").at(-1)),
    ["br-first", "br-second"],
  );
});

test("cleanup stops remaining generation deletions when authentication is rejected", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const mock = responses(
    parentResponse(env),
    response({
      branches: [
        previewBranch(env, { id: "br-first" }),
        previewBranch({ ...env, WORKERS_CI_BUILD_UUID: "second-build" }, { id: "br-second" }),
      ],
    }),
    response(null, 403),
  );
  await assert.rejects(cleanup(env, mock), /Neon authentication was rejected/);
  assert.equal(mock.calls.length, 3);
  assert.ok(mock.calls[2].url.pathname.endsWith("/branches/br-first"));
});

test("cleanup refuses wrong-parent, parent, default, or protected branches", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  for (const override of [
    { parent_id: "br-other" },
    { id: env.NEON_PARENT_BRANCH_ID },
    { default: true },
    { protected: true },
  ]) {
    const mock = responses(parentResponse(env), response({ branches: [previewBranch(env, override)] }));
    await assert.rejects(cleanup(env, mock), /Refusing to modify/);
    assert.ok(mock.calls.every((call) => call.method === "GET"));
  }
});

test("cleanup terminates repeated pagination cursors instead of looping", async () => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const page = { branches: [], pagination: { next: "same-cursor" } };
  const mock = responses(parentResponse(env), response(page), response(page));
  await assert.rejects(cleanup(env, mock), /repeated branch-list cursor/);
  assert.equal(mock.calls.length, 3);
});

test("provider failures never echo credentials or untrusted response bodies", async () => {
  const secret = "test-secret-that-must-never-be-logged";
  for (const status of [401, 403, 500]) {
    const mock = responses({
      ok: false,
      status,
      async json() {
        throw new Error(secret);
      },
    });
    await assert.rejects(requestJson("https://console.neon.tech/test", secret, mock), (error) => {
      assert.ok(error.message.includes(`HTTP ${status}`));
      assert.ok(!error.message.includes(secret));
      if (status !== 500) assert.match(error.message, /authentication was rejected/);
      return true;
    });
  }
  await assert.rejects(
    requestJson("https://console.neon.tech/test", secret, {
      fetchImpl: async () => {
        throw new Error(secret);
      },
    }),
    /failed before a response/,
  );
  await assert.rejects(
    requestJson("https://console.neon.tech/test", secret, {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        async json() {
          throw new Error(secret);
        },
      }),
    }),
    /invalid response/,
  );
});

test("authentication rejection stops provisioning and cleanup without subsequent provider operations", async (t) => {
  const env = environment({ PREVIEW_BRANCH: environment().WORKERS_CI_BRANCH });
  const statePath = await stateFile(t);
  for (const task of ["build", "cleanup"]) {
    for (const firstResponse of [true, false]) {
      const mock = firstResponse ? responses(response(null, 401)) : responses(parentResponse(env), response(null, 403));
      let ran = false;
      const operation =
        task === "build"
          ? build(env, {
              ...mock,
              statePath,
              run: async () => {
                ran = true;
              },
            })
          : cleanup(env, mock);
      await assert.rejects(operation, /Neon authentication was rejected/);
      assert.equal(mock.calls.length, firstResponse ? 1 : 2);
      assert.equal(ran, false);
      assert.ok(mock.calls.every((call) => call.method === "GET"));
    }
  }
});
