import { setTimeout as delay } from "node:timers/promises";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, execFile } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const migrationLifecycleVersion = 1;

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const requireDatabase = createRequire(new URL("../packages/db/package.json", import.meta.url));
const productionHost = "ep-wispy-thunder-a1jhwivm.ap-southeast-1.aws.neon.tech";
const repositoryUrl = "https://github.com/legions-developer/invoicely.git";
const lockKeys = [1768846959, 1886547812];

export function validateProductionDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Production DATABASE_URL must be a valid Neon connection string.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    ![productionHost, productionHost.replace(".", "-pooler.")].includes(url.hostname) ||
    url.pathname !== "/Invoicely-prod" ||
    decodeURIComponent(url.username) !== "Invoicely-prod_owner" ||
    !url.password ||
    (url.port && url.port !== "5432") ||
    url.hash ||
    !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode")) ||
    [...url.searchParams.keys()].some((key) => !["sslmode", "channel_binding"].includes(key))
  ) {
    throw new Error("Production DATABASE_URL must target the configured production database and owner with SSL.");
  }
  url.hostname = productionHost;
  return url.toString();
}

function nativeProduction(env, args) {
  const markers = ["WORKERS_CI", "WORKERS_CI_BRANCH", "WORKERS_CI_COMMIT_SHA", "WORKERS_CI_BUILD_UUID"];
  if (!markers.some((key) => env[key] !== undefined)) return false;
  if (
    env.WORKERS_CI !== "1" ||
    env.WORKERS_CI_BRANCH !== "main" ||
    !/^[a-f0-9]{40}$/i.test(env.WORKERS_CI_COMMIT_SHA ?? "") ||
    !env.WORKERS_CI_BUILD_UUID?.trim() ||
    (env.CLOUDFLARE_PREVIEW !== undefined && env.CLOUDFLARE_PREVIEW !== "false") ||
    env.CLOUDFLARE_ENV ||
    env.WRANGLER_ENV ||
    args.length
  ) {
    throw new Error(
      "Automatic production migrations require the native main build, no preview flag, and no deploy overrides.",
    );
  }
  return true;
}

function childEnv(env) {
  const result = { ...env };
  for (const key of ["NEON_API_KEY", "NEON_PROJECT_ID", "NEON_PARENT_BRANCH_ID"]) delete result[key];
  return result;
}

function redactions(env, ...urls) {
  const secrets = [env.NEON_API_KEY, env.CLOUDFLARE_API_TOKEN, ...urls];
  for (const value of urls) {
    if (!value) continue;
    try {
      const password = new URL(value).password;
      secrets.push(password, decodeURIComponent(password));
    } catch {
      /* Invalid URLs are rejected separately without echoing their contents. */
    }
  }
  return secrets.filter(Boolean).sort((a, b) => b.length - a.length);
}

export function runYarn(args, env, secrets = [], signal) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn("yarn", args, {
      env,
      cwd: repoRoot,
      detached: process.platform !== "win32",
      stdio: ["inherit", "pipe", "pipe"],
    });
    let forceKill;
    const kill = (kind) => {
      try {
        if (process.platform === "win32") child.kill(kind);
        else process.kill(-child.pid, kind);
      } catch {
        /* The process may have exited between the abort and the signal. */
      }
    };
    const abort = () => {
      kill("SIGTERM");
      forceKill = setTimeout(() => kill("SIGKILL"), 2000);
      forceKill.unref();
    };
    signal?.addEventListener("abort", abort, { once: true });
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
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      clearTimeout(forceKill);
    };
    child.once("error", () => {
      finish();
      reject(new Error("Could not start the production command."));
    });
    child.once("close", (code) => {
      // Yarn can exit before a grandchild that ignored SIGTERM and closed its stdio.
      // Kill the entire group before releasing the deployment lock in the caller.
      if (signal?.aborted) kill("SIGKILL");
      finish();
      if (signal?.aborted)
        reject(new Error("Production command stopped because its deployment lock or build was interrupted."));
      else if (code !== 0) reject(new Error(`Production command failed (exit ${code ?? "signal"}).`));
      else resolve();
    });
    if (signal?.aborted) abort();
  });
}

export function assertCurrentMain(commit, { exec = execFile, signal } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    exec(
      "git",
      ["-c", "credential.helper=", "ls-remote", "--exit-code", repositoryUrl, "refs/heads/main"],
      {
        cwd: repoRoot,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        timeout: 30_000,
        maxBuffer: 4096,
        signal,
      },
      (error, stdout) => {
        if (error)
          return reject(new Error("Could not verify the current main commit; production deployment was stopped."));
        const [remoteSha, ref, ...extra] = stdout.trim().split(/\s+/);
        if (ref !== "refs/heads/main" || extra.length || remoteSha?.toLowerCase() !== commit.toLowerCase()) {
          return reject(
            new Error("This production build is no longer the current main commit; deploy the latest build."),
          );
        }
        resolve();
      },
    );
  });
}

export async function withProductionLock(
  directUrl,
  task,
  {
    postgresFactory = (...args) => requireDatabase("postgres")(...args),
    sleep = delay,
    acquireAttempts = 150,
    heartbeatMs = 10_000,
    queryTimeoutMs = 15_000,
    signal,
  } = {},
) {
  const controller = new AbortController();
  const stopped = new Error("Production deployment lock connection was interrupted; the build was stopped.");
  const abort = () => controller.abort(stopped);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  let closing = false;
  let sql;
  let reserved;
  let heartbeat;
  let checking = false;
  const guarded = async (operation) => {
    controller.signal.throwIfAborted();
    let timer;
    let onAbort;
    try {
      return await Promise.race([
        Promise.resolve(operation),
        new Promise((_, reject) => {
          onAbort = () => reject(stopped);
          controller.signal.addEventListener("abort", onAbort, { once: true });
          timer = setTimeout(() => {
            abort();
            reject(stopped);
          }, queryTimeoutMs);
        }),
      ]);
    } catch (error) {
      abort();
      if (["28P01", "28000"].includes(error?.code)) {
        throw new Error(
          `Production database authentication was rejected (${error.code}); update DATABASE_URL before retrying.`,
        );
      }
      throw stopped;
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", onAbort);
    }
  };
  try {
    sql = postgresFactory(directUrl, {
      max: 1,
      idle_timeout: 0,
      max_lifetime: null,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
      connection: { application_name: "invoicely-production-deploy", statement_timeout: 10_000 },
      onclose: () => {
        if (!closing) abort();
      },
    });
    await guarded(sql.unsafe("SELECT 1"));
    reserved = await guarded(sql.reserve());
    let acquired = false;
    for (let attempt = 0; attempt < acquireAttempts; attempt++) {
      const rows = await guarded(reserved.unsafe("SELECT pg_try_advisory_lock($1, $2) AS acquired", lockKeys));
      if (rows[0]?.acquired === true) {
        acquired = true;
        break;
      }
      await sleep(2000, undefined, { signal: controller.signal });
    }
    if (!acquired) throw new Error("Timed out waiting for the production deployment lock; retry the latest build.");
    heartbeat = setInterval(async () => {
      if (checking || controller.signal.aborted) return;
      checking = true;
      try {
        await guarded(reserved.unsafe("SELECT 1"));
      } catch {
        abort();
      } finally {
        checking = false;
      }
    }, heartbeatMs);
    const result = await task(controller.signal);
    controller.signal.throwIfAborted();
    return result;
  } finally {
    clearInterval(heartbeat);
    closing = true;
    signal?.removeEventListener("abort", abort);
    // Closing this dedicated session releases its advisory lock, even after an error.
    if (sql) await sql.end({ timeout: 2 }).catch(() => {});
  }
}

export async function deploy(
  env,
  { run = runYarn, withLock = withProductionLock, checkHead = assertCurrentMain, args = [], signal } = {},
) {
  const commandEnv = childEnv(env);
  if (!nativeProduction(env, args)) {
    await run(
      ["workspace", "web", "opennextjs-cloudflare", "deploy", ...args],
      commandEnv,
      redactions(env, env.DATABASE_URL),
      signal,
    );
    return;
  }
  const directUrl = validateProductionDatabaseUrl(env.DATABASE_URL);
  const secrets = redactions(env, env.DATABASE_URL, directUrl);
  await withLock(
    directUrl,
    async (lockSignal) => {
      lockSignal.throwIfAborted();
      await checkHead(env.WORKERS_CI_COMMIT_SHA, { signal: lockSignal });
      const migrationEnv = { ...commandEnv, DATABASE_URL: directUrl };
      delete migrationEnv.CLOUDFLARE_API_TOKEN;
      delete migrationEnv.CLOUDFLARE_ACCOUNT_ID;
      console.log("Applying committed production migrations.");
      await run(["workspace", "@invoicely/db", "db:migrate"], migrationEnv, secrets, lockSignal);
      lockSignal.throwIfAborted();
      console.log("Production migrations completed successfully.");
      await checkHead(env.WORKERS_CI_COMMIT_SHA, { signal: lockSignal });
      lockSignal.throwIfAborted();
      const directory = await mkdtemp(join(tmpdir(), "invoicely-production-"));
      try {
        const secretsPath = join(directory, "secrets.json");
        await writeFile(secretsPath, JSON.stringify({ DATABASE_URL: env.DATABASE_URL }), { mode: 0o600 });
        await run(
          ["workspace", "web", "opennextjs-cloudflare", "deploy", "--secrets-file", secretsPath],
          commandEnv,
          secrets,
          lockSignal,
        );
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
    { signal },
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const controller = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => controller.abort());
  const run =
    process.argv[2] === "deploy"
      ? deploy(process.env, { args: process.argv.slice(3), signal: controller.signal })
      : Promise.reject(new Error("Expected deploy."));
  run.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
