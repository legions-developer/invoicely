import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const cloudflareAppId = 85455;
export const cloudflareCheckName = "Workers Builds: invoicely-web";
const productionBranch = "main";
const marker = (environment) => `<!-- invoicely-cloudflare-report:${environment} -->`;

export function isCloudflareCheck(check) {
  return (
    check?.app?.id === cloudflareAppId &&
    check.app.slug === "cloudflare-workers-and-pages" &&
    check.name === cloudflareCheckName &&
    /^[a-f0-9]{40}$/.test(check.head_sha ?? "") &&
    Number.isSafeInteger(check.id)
  );
}

function buildLink(check) {
  try {
    const url = new URL(check.details_url);
    if (
      url.protocol === "https:" &&
      url.hostname === "dash.cloudflare.com" &&
      url.pathname.includes("/workers/services/view/invoicely-web/") &&
      !url.username &&
      !url.password
    )
      return url.href;
  } catch {
    /* Missing or unexpected links are omitted. */
  }
  return null;
}

export function matchingPullRequests(pulls, check, branch, repository) {
  const production = branch === productionBranch;
  return pulls.filter((pull) => {
    if (pull.base?.repo?.full_name !== repository) return false;
    if (production) {
      return Boolean(pull.merged_at) && pull.base.ref === productionBranch && pull.merge_commit_sha === check.head_sha;
    }
    return (
      pull.head?.repo?.full_name === repository &&
      pull.state === "open" &&
      pull.head.ref === branch &&
      pull.head.sha === check.head_sha
    );
  });
}

export function hooksPresent(environment, source, rootPackage, webPackage) {
  if (!/^export const migrationLifecycleVersion = 1;$/m.test(source ?? "")) return false;
  if (environment === "preview") {
    return (
      rootPackage?.scripts?.["build:cloudflare"] === "node scripts/preview.mjs build" &&
      webPackage?.scripts?.["deploy:cloudflare:preview"] === "node ../../scripts/preview.mjs deploy"
    );
  }
  return webPackage?.scripts?.["deploy:cloudflare"] === "node ../../scripts/production.mjs deploy";
}

export function environmentMatches(check, branch) {
  const link = buildLink(check);
  if (!link) return false;
  const path = new URL(link).pathname;
  // Cloudflare includes /production/ in both native URL types. The /previews/
  // segment, plus the independently fetched Git branch, identifies a preview.
  return branch === productionBranch
    ? /\/invoicely-web\/production\/builds\/[^/]+$/.test(path)
    : /\/invoicely-web\/production\/previews\/[^/]+\/builds\/[^/]+$/.test(path);
}

export function renderReport(check, environment, migrationsVerified) {
  const title = environment === "production" ? "Production" : "Preview";
  let result;
  if (check.conclusion === "success") {
    result = migrationsVerified
      ? "Migration command and Cloudflare build/deploy completed successfully. There may have been no pending migrations."
      : "Cloudflare build/deploy completed successfully. Migration execution is unverified because this commit does not contain the recognized migration hooks.";
  } else if (["cancelled", "skipped", "neutral"].includes(check.conclusion)) {
    result = `Cloudflare build/deploy was ${check.conclusion}. Migration execution is unverified; inspect the build logs.`;
  } else {
    result =
      "Cloudflare build/deploy failed. This does not identify which step failed; inspect the build logs for migration results.";
  }
  const link = buildLink(check);
  return [
    marker(environment),
    `<!-- check-run:${check.id};started:${check.started_at};sha:${check.head_sha} -->`,
    `**${title} database and deployment**`,
    "",
    `Commit: \`${check.head_sha.slice(0, 12)}\``,
    "",
    result,
    ...(link ? ["", `[Cloudflare build logs](${link})`] : []),
    "",
    "Migration status is inferred from the required migration hook and the overall Cloudflare result. Build logs contain the individual migration output.",
  ].join("\n");
}

function newer(a, b) {
  const time = Date.parse(a.started_at) - Date.parse(b.started_at);
  return time > 0 || ((!Number.isFinite(time) || time === 0) && a.id > b.id);
}

export function staleComment(comment, check) {
  const previous = comment.body?.match(/<!-- check-run:(\d+);started:([^;]+);sha:([a-f0-9]{40}) -->/);
  return previous ? newer({ id: Number(previous[1]), started_at: previous[2] }, check) : false;
}

export function githubClient(env, fetchImpl = fetch) {
  const repository = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? "")) throw new Error("GITHUB_REPOSITORY is required.");
  if (!env.GH_TOKEN) throw new Error("GH_TOKEN is required.");
  // The workflow runs on github.com. Never forward the token to a payload URL.
  const root = `https://api.github.com/repos/${repository}`;
  return async (path, { method = "GET", body, missingOK = false } = {}) => {
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid GitHub API path.");
    const response = await fetchImpl(`${root}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    if (missingOK && response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub report request failed (HTTP ${response.status}).`);
    return response.status === 204 ? null : response.json();
  };
}

async function allPages(api, path, key) {
  const result = [];
  for (let page = 1; page <= 20; page++) {
    const data = await api(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    const items = key ? data[key] : data;
    if (!Array.isArray(items)) throw new Error("GitHub returned an invalid list.");
    result.push(...items);
    if (items.length < 100) return result;
  }
  throw new Error("GitHub report exceeded its pagination limit; no report was posted.");
}

export function observationTarget(eventName, event, repository) {
  if (event.repository?.full_name !== repository) return null;
  let target;
  if (eventName === "push" && event.ref === `refs/heads/${productionBranch}` && !event.deleted) {
    target = { sha: event.after, branch: productionBranch };
  } else if (eventName === "pull_request_target" && ["opened", "synchronize", "reopened"].includes(event.action)) {
    const pull = event.pull_request;
    if (
      pull?.head?.repo?.full_name !== repository ||
      pull.base?.repo?.full_name !== repository ||
      pull.state !== "open" ||
      !Number.isSafeInteger(pull.number)
    )
      return null;
    target = { sha: pull.head.sha, branch: pull.head.ref, pullNumber: pull.number };
  }
  return target && /^[a-f0-9]{40}$/.test(target.sha ?? "") && target.branch ? target : null;
}

export async function observeBuild({
  eventName,
  event,
  repository,
  api,
  timeoutMs = 30 * 60_000,
  pollMs = 30_000,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const target = observationTarget(eventName, event, repository);
  if (!target) return { skipped: "This event is not a trusted repository branch build." };
  const deadline = now() + timeoutMs;
  const suites = new Map();
  while (now() < deadline) {
    if (target.pullNumber) {
      const current = await api(`/pulls/${target.pullNumber}`);
      if (!matchingPullRequests([current], { head_sha: target.sha }, target.branch, repository).length) {
        return { skipped: "The PR was closed or its head was superseded; no report was posted." };
      }
    }
    const checks = await allPages(api, `/commits/${target.sha}/check-runs?filter=all`, "check_runs");
    let latest;
    for (const check of checks) {
      if (!isCloudflareCheck(check) || check.head_sha !== target.sha || !Number.isSafeInteger(check.check_suite?.id))
        continue;
      const suiteId = check.check_suite.id;
      if (!suites.has(suiteId)) suites.set(suiteId, await api(`/check-suites/${suiteId}`));
      const suite = suites.get(suiteId);
      if (suite.app?.id !== cloudflareAppId || suite.head_sha !== target.sha || suite.head_branch !== target.branch)
        continue;
      if (!latest || newer(check, latest)) latest = check;
    }
    if (latest?.status === "completed" && environmentMatches(latest, target.branch)) {
      return { checkId: latest.id, sha: target.sha };
    }
    await sleep(Math.min(pollMs, Math.max(0, deadline - now())));
  }
  throw new Error(
    "Timed out waiting for this commit's Cloudflare build. Migration and deployment results remain unverified; inspect Cloudflare or backfill the report after completion.",
  );
}

async function sourceAt(api, path, sha) {
  const file = await api(`/contents/${path}?ref=${sha}`, { missingOK: true });
  return file?.encoding === "base64" ? Buffer.from(file.content, "base64").toString("utf8") : null;
}

async function verifiedHooks(api, sha, environment) {
  const sources = await Promise.all([
    sourceAt(api, `scripts/${environment === "preview" ? "preview" : "production"}.mjs`, sha),
    sourceAt(api, "package.json", sha),
    sourceAt(api, "apps/web/package.json", sha),
  ]);
  try {
    return hooksPresent(environment, sources[0], JSON.parse(sources[1]), JSON.parse(sources[2]));
  } catch {
    return false;
  }
}

export async function reportBuild({ checkId, repository, api }) {
  if (!/^\d+$/.test(String(checkId))) throw new Error("A numeric Cloudflare check run ID is required.");
  const check = await api(`/check-runs/${checkId}`);
  if (!isCloudflareCheck(check) || check.status !== "completed")
    return { skipped: "Not a completed Invoicely Cloudflare check." };
  if (!Number.isFinite(Date.parse(check.started_at))) throw new Error("Cloudflare check start time is missing.");
  const suite = await api(`/check-suites/${check.check_suite.id}`);
  if (
    suite.app?.id !== cloudflareAppId ||
    suite.head_sha !== check.head_sha ||
    !suite.head_branch ||
    !environmentMatches(check, suite.head_branch)
  ) {
    return { skipped: "The Cloudflare check's branch could not be verified." };
  }
  const environment = suite.head_branch === productionBranch ? "production" : "preview";
  const checks = await allPages(api, `/commits/${check.head_sha}/check-runs?filter=all`, "check_runs");
  if (checks.some((other) => isCloudflareCheck(other) && other.check_suite?.id === suite.id && newer(other, check))) {
    return { skipped: "A newer Cloudflare build exists for this commit and branch." };
  }
  const pulls = await allPages(api, `/commits/${check.head_sha}/pulls`);
  const matches = matchingPullRequests(pulls, check, suite.head_branch, repository);
  const verified = check.conclusion === "success" && (await verifiedHooks(api, check.head_sha, environment));
  const body = renderReport(check, environment, verified);
  let updated = 0;
  for (const candidate of matches) {
    // Re-read immediately before writing so an event for an old PR head is skipped.
    const pull = await api(`/pulls/${candidate.number}`);
    if (!matchingPullRequests([pull], check, suite.head_branch, repository).length) continue;
    const comments = await allPages(api, `/issues/${pull.number}/comments`);
    const existing = comments.find(
      (comment) =>
        comment.user?.login === "github-actions[bot]" &&
        comment.user?.type === "Bot" &&
        comment.body?.startsWith(marker(environment)),
    );
    if (existing && (staleComment(existing, check) || existing.body === body)) continue;
    await api(existing ? `/issues/comments/${existing.id}` : `/issues/${pull.number}/comments`, {
      method: existing ? "PATCH" : "POST",
      body: { body },
    });
    updated++;
  }
  return { body, updated, environment };
}

async function main(env) {
  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, "utf8"));
  const api = githubClient(env);
  if (process.argv[2] === "observe") {
    console.log("Waiting up to 30 minutes for this commit's native Cloudflare build.");
    const result = await observeBuild({
      eventName: env.GITHUB_EVENT_NAME,
      event,
      repository: env.GITHUB_REPOSITORY,
      api,
    });
    if (result.checkId && env.GITHUB_OUTPUT) {
      await appendFile(env.GITHUB_OUTPUT, `check_id=${result.checkId}\nhead_sha=${result.sha}\n`);
    }
    if (result.skipped && env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `${result.skipped}\n`);
    console.log(result.skipped ?? "The matching Cloudflare build completed; the report job will record its result.");
    return;
  }
  const checkId = env.CHECK_RUN_ID || event.check_run?.id;
  const result = await reportBuild({ checkId, repository: env.GITHUB_REPOSITORY, api });
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `${result.body ?? result.skipped}\n`);
  console.log(result.skipped ?? `Reported the ${result.environment} build; updated ${result.updated} PR comment(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.env).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
