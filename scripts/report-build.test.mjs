import {
  cloudflareAppId,
  environmentMatches,
  githubClient,
  hooksPresent,
  isCloudflareCheck,
  matchingPullRequests,
  observationTarget,
  observeBuild,
  renderReport,
  reportBuild,
} from "./report-build.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const repository = "example/invoicely";
const sha = "a".repeat(40);
const app = { id: cloudflareAppId, slug: "cloudflare-workers-and-pages" };
const branch = "feature/invoices";
const check = {
  id: 123,
  app,
  name: "Workers Builds: invoicely-web",
  head_sha: sha,
  status: "completed",
  conclusion: "success",
  check_suite: { id: 456 },
  started_at: "2026-10-03T09:00:00Z",
  details_url:
    "https://dash.cloudflare.com/account/workers/services/view/invoicely-web/production/previews/feature-invoices/builds/build-1",
};
const pull = {
  number: 7,
  state: "open",
  merged_at: null,
  head: { ref: branch, sha, repo: { full_name: repository } },
  base: { ref: "main", repo: { full_name: repository } },
};
const rootPackage = { scripts: { "build:cloudflare": "node scripts/preview.mjs build" } };
const webPackage = {
  scripts: {
    "deploy:cloudflare:preview": "node ../../scripts/preview.mjs deploy",
    "deploy:cloudflare": "node ../../scripts/production.mjs deploy",
  },
};
const source = "export const migrationLifecycleVersion = 1;\nthrow new Error('Never execute checked source');";

function fixture(overrides = {}) {
  const data = {
    check: structuredClone(check),
    suite: { id: 456, app, head_branch: branch, head_sha: sha },
    checks: [check],
    pulls: [pull],
    freshPull: pull,
    comments: [],
    source,
    ...overrides,
  };
  const writes = [];
  const reads = [];
  const api = async (path, options = {}) => {
    if (options.method && options.method !== "GET") {
      writes.push({ path, ...options });
      return {};
    }
    reads.push(path);
    if (path === "/check-runs/123") return data.check;
    if (path === "/check-suites/456") return data.suite;
    if (path.includes("/check-runs?")) return { check_runs: data.checks };
    if (path.startsWith(`/commits/${sha}/pulls?`)) return data.pulls;
    if (path === "/pulls/7") return data.freshPull;
    if (path.startsWith("/issues/7/comments?")) return data.comments;
    if (path.startsWith("/contents/")) {
      const text = path.includes(".mjs?")
        ? data.source
        : JSON.stringify(path.includes("apps/web/") ? webPackage : rootPackage);
      return text === null ? null : { encoding: "base64", content: Buffer.from(text).toString("base64") };
    }
    throw new Error(`Unexpected API path ${path}`);
  };
  return { data, writes, reads, run: () => reportBuild({ checkId: 123, repository, api }) };
}

test("trusts the actual Cloudflare app and worker check only", () => {
  assert.equal(isCloudflareCheck(check), true);
  assert.equal(isCloudflareCheck({ ...check, app: { ...app, id: 1 } }), false);
  assert.equal(isCloudflareCheck({ ...check, name: "Workers Builds: other-worker" }), false);
  assert.equal(isCloudflareCheck({ ...check, head_sha: "main" }), false);
});

test("matches independently verified branch and Cloudflare environment URL", () => {
  assert.equal(environmentMatches(check, branch), true);
  assert.equal(environmentMatches(check, "main"), false);
  const production = { ...check, details_url: check.details_url.replace("/previews/feature-invoices", "") };
  assert.equal(environmentMatches(production, "main"), true);
  assert.equal(environmentMatches(production, branch), false);
  assert.equal(environmentMatches({ ...check, details_url: "https://attacker.example/build" }, branch), false);
});

test("only current same-repository PR heads receive preview reports", () => {
  assert.equal(matchingPullRequests([pull], check, branch, repository).length, 1);
  for (const changed of [
    { ...pull, state: "closed" },
    { ...pull, head: { ...pull.head, sha: "b".repeat(40) } },
    { ...pull, head: { ...pull.head, ref: "other-branch" } },
    { ...pull, head: { ...pull.head, repo: { full_name: "fork/invoicely" } } },
  ])
    assert.equal(matchingPullRequests([changed], check, branch, repository).length, 0);
});

test("production reports require the exact merged commit on main", () => {
  const merged = { ...pull, state: "closed", merged_at: "2026-10-03T09:00:00Z", merge_commit_sha: sha };
  assert.equal(matchingPullRequests([merged], check, "main", repository).length, 1);
  assert.equal(
    matchingPullRequests(
      [{ ...merged, head: { ...merged.head, repo: { full_name: "fork/invoicely" } } }],
      check,
      "main",
      repository,
    ).length,
    1,
  );
  assert.equal(matchingPullRequests([pull], check, "main", repository).length, 0);
  assert.equal(
    matchingPullRequests([{ ...merged, merge_commit_sha: "b".repeat(40) }], check, "main", repository).length,
    0,
  );
});

test("migration success eligibility requires both marker and wired commands", () => {
  assert.equal(hooksPresent("preview", source, rootPackage, webPackage), true);
  assert.equal(hooksPresent("production", source, rootPackage, webPackage), true);
  assert.equal(hooksPresent("preview", "", rootPackage, webPackage), false);
  assert.equal(hooksPresent("preview", source, {}, webPackage), false);
  assert.equal(
    hooksPresent("production", source, rootPackage, {
      scripts: { "deploy:cloudflare": "opennextjs-cloudflare deploy" },
    }),
    false,
  );
});

test("failed overall build never asserts that migration failed", () => {
  const body = renderReport({ ...check, conclusion: "failure" }, "preview", true);
  assert.match(body, /does not identify which step failed/);
  assert.doesNotMatch(body, /migration failed/i);
  assert.match(body, /Cloudflare build logs/);
});

test("creates one explicit inferred success report using checked source as data", async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.updated, 1);
  assert.equal(f.writes[0].method, "POST");
  assert.equal(f.writes[0].path, "/issues/7/comments");
  assert.match(result.body, /Migration command and Cloudflare build\/deploy completed successfully/);
  assert.match(result.body, /Migration status is inferred/);
  assert.ok(f.reads.includes(`/contents/scripts/preview.mjs?ref=${sha}`));
});

test("old commits without migration hooks remain explicitly unverified", async () => {
  const f = fixture({ source: null });
  const result = await f.run();
  assert.match(result.body, /Migration execution is unverified/);
  assert.doesNotMatch(result.body, /Migration command and Cloudflare build\/deploy completed successfully/);
});

test("ignores spoofed app, incomplete check, and mismatched branch metadata", async () => {
  for (const overrides of [
    { check: { ...check, app: { ...app, id: 1 } } },
    { check: { ...check, status: "in_progress" } },
    { suite: { id: 456, app, head_branch: "main", head_sha: sha } },
  ]) {
    const f = fixture(overrides);
    assert.ok((await f.run()).skipped);
    assert.equal(f.writes.length, 0);
  }
});

test("newer queued build suppresses completion from an older attempt", async () => {
  const f = fixture({ checks: [check, { ...check, id: 124, status: "queued", started_at: null }] });
  assert.match((await f.run()).skipped, /newer/);
  assert.equal(f.writes.length, 0);
});

test("rechecks PR head before commenting", async () => {
  const f = fixture({ freshPull: { ...pull, head: { ...pull.head, sha: "b".repeat(40) } } });
  assert.equal((await f.run()).updated, 0);
  assert.equal(f.writes.length, 0);
});

test("updates existing bot comment and never edits a user comment", async () => {
  const body = renderReport({ ...check, conclusion: "failure" }, "preview", false);
  const f = fixture({
    comments: [
      { id: 11, body, user: { login: "someone", type: "User" } },
      { id: 12, body, user: { login: "github-actions[bot]", type: "Bot" } },
    ],
  });
  assert.equal((await f.run()).updated, 1);
  assert.equal(f.writes[0].method, "PATCH");
  assert.equal(f.writes[0].path, "/issues/comments/12");
});

test("manual older backfill cannot overwrite newer comment", async () => {
  const newerCheck = { ...check, id: 124, head_sha: "b".repeat(40), started_at: "2026-10-03T09:05:00Z" };
  const f = fixture({
    comments: [
      { id: 12, body: renderReport(newerCheck, "preview", true), user: { login: "github-actions[bot]", type: "Bot" } },
    ],
  });
  assert.equal((await f.run()).updated, 0);
  assert.equal(f.writes.length, 0);
});

test("production uses separate marker and exact merged PR", async () => {
  const merged = { ...pull, state: "closed", merged_at: "2026-10-03T09:00:00Z", merge_commit_sha: sha };
  const f = fixture({
    check: { ...check, details_url: check.details_url.replace("/previews/feature-invoices", "") },
    suite: { id: 456, app, head_branch: "main", head_sha: sha },
    pulls: [merged],
    freshPull: merged,
  });
  const result = await f.run();
  assert.equal(result.environment, "production");
  assert.match(result.body, /invoicely-cloudflare-report:production/);
  assert.ok(f.reads.includes(`/contents/scripts/production.mjs?ref=${sha}`));
});

test("GitHub client rejects authentication failure without exposing response or token", async () => {
  const api = githubClient({ GITHUB_REPOSITORY: repository, GH_TOKEN: "secret-token" }, async () => ({
    ok: false,
    status: 401,
  }));
  await assert.rejects(api("/check-runs/123"), /^Error: GitHub report request failed \(HTTP 401\)\.$/);
  await assert.rejects(api("//attacker.example/path"), /Invalid GitHub API path/);
});

function observerFixture(overrides = {}) {
  const event = { action: "synchronize", repository: { full_name: repository }, pull_request: pull };
  let elapsed = 0;
  let polls = 0;
  const requests = [];
  const data = {
    eventName: "pull_request_target",
    event,
    snapshots: [[], [check]],
    currentPull: () => pull,
    suite: { id: 456, app, head_sha: sha, head_branch: branch },
    ...overrides,
  };
  const api = async (path) => {
    requests.push(path);
    if (path === "/pulls/7") return data.currentPull(polls);
    if (path.startsWith(`/commits/${sha}/check-runs?`)) {
      const checks = data.snapshots[Math.min(polls, data.snapshots.length - 1)];
      polls++;
      return { check_runs: checks };
    }
    if (path === "/check-suites/456") return data.suite;
    throw new Error(`Unexpected observer API path ${path}`);
  };
  return {
    data,
    requests,
    run: () =>
      observeBuild({
        eventName: data.eventName,
        event: data.event,
        repository,
        api,
        timeoutMs: 300,
        pollMs: 100,
        now: () => elapsed,
        sleep: async (ms) => {
          elapsed += ms;
        },
      }),
  };
}

test("observer only accepts same-repository PRs and main push commits", async () => {
  const f = observerFixture();
  assert.deepEqual(observationTarget(f.data.eventName, f.data.event, repository), { sha, branch, pullNumber: 7 });
  const fork = observerFixture({
    event: {
      ...f.data.event,
      pull_request: { ...pull, head: { ...pull.head, repo: { full_name: "fork/invoicely" } } },
    },
  });
  assert.ok((await fork.run()).skipped);
  assert.equal(fork.requests.length, 0);
  assert.equal(
    observationTarget(
      "push",
      { repository: { full_name: repository }, ref: "refs/heads/other", after: sha },
      repository,
    ),
    null,
  );
  assert.equal(
    observationTarget(
      "push",
      { repository: { full_name: repository }, ref: "refs/heads/main", after: "main" },
      repository,
    ),
    null,
  );
});

test("observer waits for actual matching completion and emits only check identity", async () => {
  const f = observerFixture({ snapshots: [[], [{ ...check, status: "in_progress" }], [check]] });
  assert.deepEqual(await f.run(), { checkId: 123, sha });
  assert.equal(f.requests.filter((path) => path.includes("/check-runs?")).length, 3);
  assert.equal(f.requests.filter((path) => path.includes("/check-suites/")).length, 1);
  assert.equal(
    f.requests.some((path) => path.includes("/contents/") || path.includes("/comments")),
    false,
  );
});

test("observer ignores older completed attempt while newer one is queued", async () => {
  const queued = { ...check, id: 124, status: "queued", started_at: null };
  const f = observerFixture({
    snapshots: [
      [check, queued],
      [check, { ...queued, status: "completed", conclusion: "failure", started_at: "2026-10-03T09:05:00Z" }],
    ],
  });
  assert.deepEqual(await f.run(), { checkId: 124, sha });
});

test("missing queued start timestamp still suppresses an older success", async () => {
  const queued = { ...check, id: 124, status: "queued" };
  delete queued.started_at;
  const reporting = fixture({ checks: [check, queued] });
  assert.match((await reporting.run()).skipped, /newer/);
  assert.equal(reporting.writes.length, 0);
  const observer = observerFixture({ snapshots: [[check, queued]] });
  await assert.rejects(observer.run(), /Timed out/);
});

test("observer never accepts checks for a different SHA or environment", async () => {
  const wrongSha = observerFixture({ snapshots: [[{ ...check, head_sha: "b".repeat(40) }], [check]] });
  assert.deepEqual(await wrongSha.run(), { checkId: 123, sha });
  assert.equal(wrongSha.requests.filter((path) => path.includes("/check-runs?")).length, 2);
  const wrongBranch = observerFixture({
    snapshots: [[check]],
    suite: { id: 456, app, head_sha: sha, head_branch: "another-branch" },
  });
  await assert.rejects(wrongBranch.run(), /Timed out/);
});

test("observer skips a superseded or closed PR without posting", async () => {
  const f = observerFixture({
    snapshots: [[]],
    currentPull: (polls) =>
      polls === 0
        ? pull
        : {
            ...pull,
            head: { ...pull.head, sha: "b".repeat(40) },
          },
  });
  assert.match((await f.run()).skipped, /superseded/);
  assert.equal(f.requests.filter((path) => path.includes("/check-runs?")).length, 1);
});

test("observer timeout leaves migration outcome explicitly unverified", async () => {
  const f = observerFixture({ snapshots: [[]] });
  await assert.rejects(f.run(), /Migration and deployment results remain unverified/);
  assert.equal(f.requests.filter((path) => path.includes("/check-runs?")).length, 3);
});

test("main push observer selects production check without reading any PR code", async () => {
  const production = { ...check, details_url: check.details_url.replace("/previews/feature-invoices", "") };
  const f = observerFixture({
    eventName: "push",
    event: { repository: { full_name: repository }, ref: "refs/heads/main", after: sha },
    suite: { id: 456, app, head_sha: sha, head_branch: "main" },
    snapshots: [[production]],
  });
  assert.deepEqual(await f.run(), { checkId: 123, sha });
  assert.equal(
    f.requests.some((path) => path.startsWith("/pulls/")),
    false,
  );
});
