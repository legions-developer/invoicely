import { setTimeout as delay } from "node:timers/promises";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { parse } from "devalue";

// An explicit URL tests an existing preview; otherwise start and stop our own.
const base = new URL(process.env.CLOUDFLARE_PREVIEW_URL || "http://127.0.0.1:8787");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Smoke checks must target a local preview");

let preview;
let previewError;
let previewOutput = "";
let checks = 0;

async function request(path) {
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(20_000) });
}

async function html(path, status, text) {
  const response = await request(path);
  assert.equal(response.status, status, path);
  assert.match(response.headers.get("content-type") || "", /text\/html/, path);
  const body = await response.text();
  const visibleText = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
  if (text) assert.ok(visibleText.includes(text), `${path}: expected ${text}`);
  console.log(`PASS ${path} (${status})`);
  checks++;
  return body;
}

async function png(path) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type") || "", /image\/png/, path);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], path);
  console.log(`PASS ${path} (PNG)`);
  checks++;
}

try {
  if (!process.env.CLOUDFLARE_PREVIEW_URL) {
    const yarn = fileURLToPath(new URL("../../../.yarn/releases/yarn-4.9.1.cjs", import.meta.url));
    const cwd = fileURLToPath(new URL("../", import.meta.url));
    const env = {
      ...process.env,
      WRANGLER_SEND_METRICS: "false",
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
    };
    const cache = spawnSync(process.execPath, [yarn, "opennextjs-cloudflare", "populateCache", "local"], {
      cwd,
      env,
      stdio: "inherit",
    });
    assert.equal(cache.status, 0, "Local OpenNext cache initialization");

    // Invoke Wrangler directly so runtime errors reach stderr immediately.
    // The OpenNext preview wrapper buffers stderr until the process exits.
    preview = spawn(process.execPath, [yarn, "wrangler", "dev", "--env", "", "--port", base.port], {
      cwd,
      env,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    preview.on("error", (error) => {
      previewError = error;
    });
    for (const stream of [preview.stdout, preview.stderr]) {
      stream.on("data", (chunk) => {
        previewOutput += chunk.toString();
        process.stdout.write(chunk);
      });
    }
  }

  const deadline = Date.now() + 60_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (previewError) throw previewError;
    if (preview?.exitCode != null) throw new Error(`Worker preview exited with code ${preview.exitCode}`);
    try {
      const response = await request("/");
      await response.arrayBuffer();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The local runtime is still starting. */
    }
    await delay(500);
  }
  assert.ok(ready, "Worker preview did not become ready within 60 seconds");

  const landing = await html("/", 200, "Create Beautiful Invoices");
  await html("/blogs", 200, "Blogs");
  for (const slug of [
    "invoicely",
    "create-first-invoice",
    "create-professional-invoices",
    "invoice-without-limits",
    "why-choose-invoicely",
  ]) {
    await html(`/blog/${slug}`, 200);
  }
  await html("/create/invoice", 200, "Create Invoice");
  await html("/invoices", 200, "Invoices");
  await html("/assets", 200, "Manage Assets");
  await html("/cloudflare-smoke-missing", 404);
  await html("/blog/cloudflare-smoke-missing", 404);

  const session = await request("/api/auth/get-session");
  assert.equal(session.status, 200, "Session route");
  assert.equal(await session.json(), null, "A preview request without cookies must be logged out");
  console.log("PASS logged-out Better Auth session");
  checks++;

  for (const procedure of ["invoice.list", "cloudflare.listImages"]) {
    const response = await request(`/api/trpc/${procedure}`);
    assert.equal(response.status, 401, procedure);
    const payload = await response.json();
    assert.equal(parse(payload.error).data.code, "UNAUTHORIZED", procedure);
    console.log(`PASS ${procedure} rejects unauthenticated access`);
    checks++;
  }

  const scriptPath = landing.match(/src="([^"]*\/_next\/static\/[^"]+\.js)"/)?.[1];
  assert.ok(scriptPath, "Landing page must reference built JavaScript");
  const asset = await request(scriptPath);
  assert.equal(asset.status, 200, "Built JavaScript asset");
  assert.match(asset.headers.get("cache-control") || "", /max-age=31536000.*immutable/, "Static asset caching");
  await asset.arrayBuffer();
  console.log("PASS immutable Next.js static assets");
  checks++;

  await png("/_next/image?url=%2Fofficial%2Flogo-icon.png&w=64&q=75");
  await png("/api/og?title=Cloudflare%20smoke%20check&link=smoke");

  // Next.js caches unknown generated routes for 30 seconds. Exercise the stale
  // 404 as well: a missing OpenNext queue otherwise only fails in the background.
  await delay(31_000);
  await html("/blog/cloudflare-smoke-missing", 404);
  await delay(2_000);
  assert.doesNotMatch(previewOutput, /FatalError|\[ERROR\]|✘/, "Worker runtime errors");
  console.log(`${checks} Cloudflare Worker smoke checks passed`);
} finally {
  if (preview?.pid && preview.exitCode == null) {
    try {
      if (process.platform === "win32") preview.kill("SIGTERM");
      else process.kill(-preview.pid, "SIGINT");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}
