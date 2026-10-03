import { assertCurrentMain, deploy, validateProductionDatabaseUrl, withProductionLock } from "./production.mjs";
import { access, readFile, stat, mkdtemp, rm, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { execFile } from "node:child_process";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const direct =
  "postgresql://Invoicely-prod_owner:test-production-password@ep-wispy-thunder-a1jhwivm.ap-southeast-1.aws.neon.tech/Invoicely-prod?sslmode=require";
const pooled = direct.replace("ep-wispy-thunder-a1jhwivm.", "ep-wispy-thunder-a1jhwivm-pooler.");
const commit = "a".repeat(40);
const env = (values = {}) => ({
  WORKERS_CI: "1",
  WORKERS_CI_BRANCH: "main",
  WORKERS_CI_COMMIT_SHA: commit,
  WORKERS_CI_BUILD_UUID: "test-production-build",
  DATABASE_URL: pooled,
  CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
  NEON_API_KEY: "test-neon-token",
  ...values,
});

function hooks({ run, checkHead } = {}) {
  const calls = [];
  let locked = false;
  return {
    calls,
    withLock: async (url, task) => {
      assert.equal(url, direct);
      locked = true;
      calls.push("lock");
      try {
        return await task(new AbortController().signal);
      } finally {
        locked = false;
        calls.push("unlock");
      }
    },
    checkHead: async (...args) => {
      assert.ok(locked);
      calls.push("check");
      if (checkHead) await checkHead(...args);
    },
    run: async (...args) => {
      assert.ok(locked);
      calls.push(args[0][2] === "db:migrate" ? "migrate" : "deploy");
      if (run) await run(...args);
    },
  };
}

test("production URL derives direct connection and rejects alternate database/endpoint/override options", () => {
  assert.equal(validateProductionDatabaseUrl(pooled), direct);
  assert.equal(validateProductionDatabaseUrl(direct), direct);
  for (const value of [
    "broken",
    direct.replace("ep-wispy-thunder-a1jhwivm", "ep-royal-lab-a1j1ksvy"),
    direct.replace("/Invoicely-prod?", "/invoicely?"),
    direct.replace("sslmode=require", "sslmode=disable"),
    direct.replace("Invoicely-prod_owner:", "another_owner:"),
    `${direct}&host=evil.example`,
    `${direct}&options=endpoint%3Dep-elsewhere`,
    direct.replace(".neon.tech/", ".neon.tech.evil.example/"),
    direct.replace(".tech/", ".tech:1234/"),
  ])
    assert.throws(() => validateProductionDatabaseUrl(value), /Production DATABASE_URL/);
});

test("local staging deployment forwards arguments without production migrations or locks", async () => {
  const calls = [];
  await deploy(
    { DATABASE_URL: "local database", NEON_API_KEY: "remove-me" },
    {
      args: ["--env", "staging"],
      run: async (args, environment) => {
        calls.push(args);
        assert.equal(environment.NEON_API_KEY, undefined);
      },
      withLock: () => assert.fail("Must not lock"),
      checkHead: () => assert.fail("Must not query GitHub"),
    },
  );
  assert.deepEqual(calls, [["workspace", "web", "opennextjs-cloudflare", "deploy", "--env", "staging"]]);
});

test("malformed/native preview/non-main deploy contexts fail before mutation", async () => {
  for (const overrides of [
    { WORKERS_CI: "true" },
    { WORKERS_CI: undefined },
    { WORKERS_CI_BRANCH: "feature" },
    { WORKERS_CI_COMMIT_SHA: "short" },
    { WORKERS_CI_BUILD_UUID: "" },
    { CLOUDFLARE_PREVIEW: "true" },
    { CLOUDFLARE_PREVIEW: "FALSE" },
    { CLOUDFLARE_ENV: "staging" },
    { WRANGLER_ENV: "staging" },
  ])
    await assert.rejects(
      deploy(env(overrides), {
        run: () => assert.fail("Must not run"),
        withLock: () => assert.fail("Must not lock"),
      }),
      /require the native main build/,
    );
  await assert.rejects(
    deploy(env(), { args: ["--dry-run"], withLock: () => assert.fail("Must not lock") }),
    /no deploy overrides/,
  );
});

test("migration and deploy share a lock; direct migration and pooled secret upload stay consistent", async () => {
  let secretsPath;
  const fake = hooks({
    run: async (args, environment, secrets, signal) => {
      assert.equal(environment.NEON_API_KEY, undefined);
      assert.ok(secrets.includes("test-production-password"));
      assert.ok(secrets.includes(pooled));
      assert.ok(signal instanceof AbortSignal);
      if (args[2] === "db:migrate") {
        assert.equal(environment.DATABASE_URL, direct);
        assert.equal(environment.CLOUDFLARE_API_TOKEN, undefined);
      } else {
        assert.equal(environment.DATABASE_URL, pooled);
        assert.equal(environment.CLOUDFLARE_API_TOKEN, "test-cloudflare-token");
        assert.equal(args.at(-2), "--secrets-file");
        secretsPath = args.at(-1);
        assert.deepEqual(JSON.parse(await readFile(secretsPath, "utf8")), { DATABASE_URL: pooled });
        assert.equal((await stat(secretsPath)).mode & 0o777, 0o600);
      }
    },
  });
  await deploy(env(), fake);
  assert.deepEqual(fake.calls, ["lock", "check", "migrate", "check", "deploy", "unlock"]);
  await assert.rejects(access(secretsPath));
});

test("failed migrations release lock and cannot upload", async () => {
  const fake = hooks({
    run: async () => {
      throw new Error("migration failed");
    },
  });
  await assert.rejects(deploy(env(), fake), /migration failed/);
  assert.deepEqual(fake.calls, ["lock", "check", "migrate", "unlock"]);
});

test("failed deployments remove temporary secret file and release lock", async () => {
  let secretsPath;
  const fake = hooks({
    run: async (args) => {
      if (args[2] !== "db:migrate") {
        secretsPath = args.at(-1);
        throw new Error("upload failed");
      }
    },
  });
  await assert.rejects(deploy(env(), fake), /upload failed/);
  await assert.rejects(access(secretsPath));
  assert.equal(fake.calls.at(-1), "unlock");
});

test("a stale commit cannot migrate; a commit superseded during migration cannot deploy", async () => {
  for (const failAt of [1, 2]) {
    let checks = 0;
    const fake = hooks({
      checkHead: async () => {
        if (++checks === failAt) throw new Error("stale build");
      },
    });
    await assert.rejects(deploy(env(), fake), /stale build/);
    assert.ok(!fake.calls.includes("deploy"));
    assert.equal(fake.calls.includes("migrate"), failAt === 2);
  }
});

test("lock loss after migration prevents upload even if the migration child just exited successfully", async () => {
  const controller = new AbortController();
  const calls = [];
  await assert.rejects(
    deploy(env(), {
      withLock: async (_, task) => task(controller.signal),
      checkHead: async () => {},
      run: async (args) => {
        calls.push(args);
        controller.abort(new Error("lock lost"));
      },
    }),
    /lock lost/,
  );
  assert.equal(calls.length, 1);
});

test("main-head lookup uses only fixed public repository and verifies exact ref/SHA", async () => {
  await assertCurrentMain(commit, {
    exec: (command, args, options, callback) => {
      assert.equal(command, "git");
      assert.deepEqual(args.slice(-2), ["https://github.com/legions-developer/invoicely.git", "refs/heads/main"]);
      assert.equal(options.env.GIT_TERMINAL_PROMPT, "0");
      callback(null, `${commit}\trefs/heads/main\n`);
    },
  });
  for (const stdout of [`${"b".repeat(40)}\trefs/heads/main`, `${commit}\trefs/heads/other`, ""]) {
    await assert.rejects(assertCurrentMain(commit, { exec: (_, __, ___, cb) => cb(null, stdout) }), /no longer/);
  }
  await assert.rejects(
    assertCurrentMain(commit, { exec: (_, __, ___, cb) => cb(new Error("sensitive error")) }),
    (error) => {
      assert.match(error.message, /Could not verify/);
      assert.ok(!error.message.includes("sensitive"));
      return true;
    },
  );
});

function fakePostgres({ acquired = [true], query } = {}) {
  const calls = [];
  let options;
  let ended = false;
  const reserved = {
    unsafe: async (sql, params) => {
      calls.push({ sql, params });
      if (query) await query(sql);
      return [{ acquired: acquired.length > 1 ? acquired.shift() : acquired[0] }];
    },
  };
  return {
    calls,
    get options() {
      return options;
    },
    get ended() {
      return ended;
    },
    postgresFactory: (url, opts) => {
      assert.equal(url, direct);
      options = opts;
      return {
        unsafe: async () => [],
        reserve: async () => reserved,
        end: async () => {
          ended = true;
          opts.onclose();
        },
      };
    },
  };
}

test("advisory lock uses dedicated non-recycling connection, waits before running, closes after work", async () => {
  const fake = fakePostgres({ acquired: [false, true] });
  let waits = 0;
  await withProductionLock(
    direct,
    async (signal) => {
      assert.equal(waits, 1);
      assert.equal(fake.ended, false);
      assert.equal(signal.aborted, false);
    },
    {
      postgresFactory: fake.postgresFactory,
      sleep: async () => {
        waits++;
      },
    },
  );
  assert.equal(fake.options.max, 1);
  assert.equal(fake.options.idle_timeout, 0);
  assert.equal(fake.options.max_lifetime, null);
  assert.ok(fake.calls.every((call) => call.sql.includes("pg_try_advisory_lock")));
  assert.deepEqual(fake.calls[0].params, fake.calls[1].params);
  assert.equal(fake.ended, true);
});

test("lock contention times out without migration and closes the session", async () => {
  const fake = fakePostgres({ acquired: [false] });
  await assert.rejects(
    withProductionLock(direct, () => assert.fail("Must not run"), {
      postgresFactory: fake.postgresFactory,
      sleep: async () => {},
      acquireAttempts: 2,
    }),
    /Timed out waiting/,
  );
  assert.equal(fake.ended, true);
});

test("lock connection loss aborts active work without reconnecting", async () => {
  const fake = fakePostgres();
  await assert.rejects(
    withProductionLock(
      direct,
      async (signal) => {
        fake.options.onclose();
        assert.equal(signal.aborted, true);
        signal.throwIfAborted();
      },
      { postgresFactory: fake.postgresFactory },
    ),
    /lock connection was interrupted/,
  );
  assert.equal(fake.ended, true);
});

test("heartbeat failure aborts work and sanitizes raw database errors", async () => {
  const fake = fakePostgres({
    query: async (sql) => {
      if (sql === "SELECT 1") throw new Error(pooled);
    },
  });
  await assert.rejects(
    withProductionLock(
      direct,
      async (signal) => {
        await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }));
        signal.throwIfAborted();
      },
      { postgresFactory: fake.postgresFactory, heartbeatMs: 1 },
    ),
    (error) => {
      assert.match(error.message, /lock connection was interrupted/);
      assert.ok(!error.message.includes("password"));
      return true;
    },
  );
  assert.equal(fake.ended, true);
});

test("stalled lock queries and database auth errors fail closed and release resources", async () => {
  const stalled = fakePostgres({ query: () => new Promise(() => {}) });
  await assert.rejects(
    withProductionLock(direct, () => assert.fail("Must not run"), {
      postgresFactory: stalled.postgresFactory,
      queryTimeoutMs: 5,
    }),
    /lock connection was interrupted/,
  );
  assert.equal(stalled.ended, true);
  const auth = fakePostgres({
    query: async () => {
      throw Object.assign(new Error(pooled), { code: "28P01" });
    },
  });
  await assert.rejects(
    withProductionLock(direct, () => assert.fail("Must not run"), {
      postgresFactory: auth.postgresFactory,
    }),
    /authentication was rejected \(28P01\)/,
  );
  assert.equal(auth.ended, true);
});

test("external build cancellation propagates to protected work", async () => {
  const fake = fakePostgres();
  const controller = new AbortController();
  await assert.rejects(
    withProductionLock(
      direct,
      async (signal) => {
        controller.abort();
        await delay(0);
        signal.throwIfAborted();
      },
      { postgresFactory: fake.postgresFactory, signal: controller.signal },
    ),
    /lock connection was interrupted/,
  );
  assert.equal(fake.ended, true);
});

test("real child output redacts secrets across chunks and abort terminates Yarn's process group", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "invoicely-production-runner-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const yarn = join(directory, "yarn");
  const moduleUrl = new URL("./production.mjs", import.meta.url).href;
  await writeFile(
    yarn,
    `#!/usr/bin/env node
process.stdout.write('test-production-');
setTimeout(() => { process.stdout.write('password\\n'); process.stderr.write('test-production-password\\n'); }, 5);
`,
    { mode: 0o700 },
  );
  const execute = promisify(execFile);
  const childEnv = { ...process.env, PATH: `${directory}:${process.env.PATH}` };
  const output = await execute(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { runYarn } from ${JSON.stringify(moduleUrl)};
    await runYarn([], process.env, ['test-production-password']);
  `,
    ],
    { env: childEnv, timeout: 5000 },
  );
  assert.equal(output.stdout.trim(), "[REDACTED]");
  assert.equal(output.stderr.trim(), "[REDACTED]");

  const readyPath = join(directory, "child-pid");
  await writeFile(
    yarn,
    `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'inherit' });
writeFileSync(process.env.TEST_CHILD_PID_PATH, String(child.pid));
process.on('SIGTERM', () => {});
setInterval(() => {}, 1000);
`,
    { mode: 0o700 },
  );
  await execute(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { runYarn } from ${JSON.stringify(moduleUrl)};
    import { access } from 'node:fs/promises';
    import { setTimeout as delay } from 'node:timers/promises';
    const controller = new AbortController();
    const task = runYarn([], process.env, [], controller.signal);
    const observed = task.catch(error => error);
    for (let attempt = 0; ; attempt++) {
      try { await access(process.env.TEST_CHILD_PID_PATH); break; }
      catch { if (attempt === 100) throw new Error('Child did not start'); await delay(10); }
    }
    controller.abort();
    const result = await observed;
    if (!(result instanceof Error) || !result.message.includes('stopped')) throw new Error('Command was not aborted');
  `,
    ],
    { env: { ...childEnv, TEST_CHILD_PID_PATH: readyPath }, timeout: 8000 },
  );
  const pid = Number(await readFile(readyPath, "utf8"));
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});

test("aborted Yarn parent cannot leave a SIGTERM-ignoring grandchild with closed stdio", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "invoicely-production-closed-stdio-test-"));
  const readyPath = join(directory, "child-pid");
  t.after(async () => {
    try {
      process.kill(Number(await readFile(readyPath, "utf8")), "SIGKILL");
    } catch {
      /* Already terminated. */
    }
    await rm(directory, { recursive: true, force: true });
  });
  const grandchild = `
    const { writeFileSync } = require('node:fs');
    process.on('SIGTERM', () => {});
    writeFileSync(process.env.TEST_CHILD_PID_PATH, String(process.pid));
    setInterval(() => {}, 1000);
  `;
  await writeFile(
    join(directory, "yarn"),
    `#!/usr/bin/env node
const { spawn } = require('node:child_process');
spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}], { stdio: 'ignore' });
setInterval(() => {}, 1000);
`,
    { mode: 0o700 },
  );
  await promisify(execFile)(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { runYarn } from ${JSON.stringify(new URL("./production.mjs", import.meta.url).href)};
    import { access } from 'node:fs/promises';
    import { setTimeout as delay } from 'node:timers/promises';
    const controller = new AbortController();
    const observed = runYarn([], process.env, [], controller.signal).catch(error => error);
    for (let attempt = 0; ; attempt++) {
      try { await access(process.env.TEST_CHILD_PID_PATH); break; }
      catch { if (attempt === 100) throw new Error('Grandchild did not start'); await delay(10); }
    }
    controller.abort();
    const result = await observed;
    if (!(result instanceof Error) || !result.message.includes('stopped')) throw new Error('Command was not aborted');
  `,
    ],
    {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, TEST_CHILD_PID_PATH: readyPath },
      timeout: 5000,
    },
  );
  const pid = Number(await readFile(readyPath, "utf8"));
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});
