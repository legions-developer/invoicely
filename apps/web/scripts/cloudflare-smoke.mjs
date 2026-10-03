#!/usr/bin/env node

// Run against an already-started Workers preview, never the production origin:
// node apps/web/scripts/cloudflare-smoke.mjs
// BASE_URL=http://127.0.0.1:8787 node apps/web/scripts/cloudflare-smoke.mjs
import assert from "node:assert/strict";

const baseUrl = new URL(process.env.BASE_URL ?? "http://localhost:8787");
assert.ok(
  ["http:", "https:"].includes(baseUrl.protocol) && ["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname),
  "BASE_URL must point to a local Workers preview (localhost, 127.0.0.1, or [::1]).",
);
assert.ok(
  !baseUrl.username && !baseUrl.password && !baseUrl.search && !baseUrl.hash && baseUrl.pathname === "/",
  "BASE_URL must be an origin without credentials, a path, query parameters, or a fragment.",
);

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 30_000);
assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, "SMOKE_TIMEOUT_MS must be a positive integer.");

const checks = [];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let landingHtml;

function check(name, run) {
  checks.push({ name, run });
}

async function get(path, expectedStatus, contentType, headers = {}) {
  const url = new URL(path, baseUrl);
  assert.equal(url.origin, baseUrl.origin, "Smoke requests must stay on the preview origin.");
  const response = await fetch(url, {
    // No cookies or redirects: unauthenticated requests must not escape to production.
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, expectedStatus, `${path}: expected HTTP ${expectedStatus}, got ${response.status}`);
  assert.match(response.headers.get("content-type") ?? "", contentType, `${path}: unexpected Content-Type`);
  return { response, body };
}

function assertNoSharedApiCache(response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  assert.doesNotMatch(
    cacheControl,
    /\b(?:public|immutable)\b/i,
    "Anonymous API responses must not be publicly cached.",
  );
  for (const match of cacheControl.matchAll(/(?:^|,)\s*(?:s-maxage|max-age)\s*=\s*"?(\d+)/gi)) {
    assert.equal(Number(match[1]), 0, "Session and authorization responses must not have a positive cache lifetime.");
  }
}

function assertPng(body, width, height) {
  assert.ok(body.length > 24, "PNG response must contain an image.");
  assert.deepEqual(body.subarray(0, 8), pngSignature, "Response must have a PNG signature.");
  assert.equal(body.toString("ascii", 12, 16), "IHDR", "PNG must contain its IHDR chunk.");
  if (width !== undefined) assert.equal(body.readUInt32BE(16), width, "Unexpected PNG width.");
  if (height !== undefined) assert.equal(body.readUInt32BE(20), height, "Unexpected PNG height.");
}

for (const [path, expectedText] of [
  ["/", /Create\s+Beautiful\s+Invoices/],
  ["/blogs", /Recent Blogs/],
  ["/blog/invoicely", /Discover Invoicely\.gg: Privacy-First Invoice Generator/],
]) {
  check(`HTML ${path}`, async () => {
    const { body } = await get(path, 200, /^text\/html\b/i);
    const html = body.toString("utf8");
    assert.match(html, /<!doctype html>/i, `${path}: expected an HTML document`);
    assert.match(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "), expectedText, `${path}: page content is missing`);
    if (path === "/") landingHtml = html;
  });
}

for (const path of ["/__cloudflare_smoke_missing_route__", "/blog/__cloudflare_smoke_missing_post__"]) {
  check(`404 ${path}`, async () => {
    const { body } = await get(path, 404, /^text\/html\b/i);
    assert.match(body.toString("utf8"), /404|not found/i, `${path}: expected a not-found page`);
  });
}

check("Anonymous Better Auth session", async () => {
  const { response, body } = await get("/api/auth/get-session", 200, /^application\/json\b/i);
  assert.equal(JSON.parse(body.toString("utf8")), null, "A request without a cookie must not have a session.");
  assertNoSharedApiCache(response);
});

for (const procedure of ["invoice.list", "cloudflare.listImages"]) {
  check(`Authorization ${procedure}`, async () => {
    const { response, body } = await get(`/api/trpc/${procedure}`, 401, /^application\/json\b/i);
    const payload = JSON.parse(body.toString("utf8"));
    assert.ok(payload.error, "tRPC must return an error envelope.");
    assert.equal(payload.result, undefined, "An unauthorized request must not return data.");
    // This app serializes tRPC errors with devalue, so error may be a string.
    const error = typeof payload.error === "string" ? JSON.parse(payload.error) : payload.error;
    const errorText = JSON.stringify(error);
    assert.match(errorText, /"UNAUTHORIZED"/, "Expected the UNAUTHORIZED error code.");
    assert.match(errorText, /-32001/, "Expected the tRPC unauthorized error number.");
    assertNoSharedApiCache(response);
  });
}

check("OG image rendering", async () => {
  const { body } = await get("/api/og?title=Workers%20smoke%20test&link=preview", 200, /^image\/png\b/i);
  assertPng(body, 1200, 630);
});

check("Public PNG asset", async () => {
  const { response, body } = await get("/official/logo-icon.png", 200, /^image\/png\b/i);
  assertPng(body);
  assert.equal(response.headers.get("set-cookie"), null, "A public asset must not set a session cookie.");
});

check("Next.js image optimization", async () => {
  const { body } = await get("/_next/image?url=%2Fofficial%2Flogo-icon.png&w=64&q=75", 200, /^image\/png\b/i, {
    Accept: "image/png",
  });
  // Confirm the Images binding resized the source, rather than returning it unchanged.
  assertPng(body, 64, 64);
});

for (const path of [
  "/fonts/instrument-serif/InstrumentSerif-Regular.ttf",
  "/fonts/jetbrains/JetBrainsMono-Regular.ttf",
  "/fonts/geist/Geist-Regular.ttf",
]) {
  check(`TrueType font ${path}`, async () => {
    const { body } = await get(path, 200, /^(?:font\/ttf|application\/(?:x-font-ttf|font-sfnt|octet-stream))\b/i);
    assert.ok(body.length > 12, "Font must not be empty.");
    assert.deepEqual(body.subarray(0, 4), Buffer.from([0, 1, 0, 0]), "Expected a TrueType font signature.");
  });
}

check("CJK fallback WOFF2 font", async () => {
  const { body } = await get(
    "/fonts/notosanssc/NotoSansSC-Regular.woff2",
    200,
    /^(?:font\/woff2|application\/(?:font-woff2|octet-stream))\b/i,
  );
  assert.ok(body.length > 48, "Font must not be empty.");
  assert.equal(body.toString("ascii", 0, 4), "wOF2", "Expected a WOFF2 font signature.");
});

check("Emitted Next.js JavaScript asset", async () => {
  assert.ok(landingHtml, "Landing page must load before checking its JavaScript asset.");
  const asset = landingHtml.match(/<script\b[^>]*\bsrc="([^"]*\/_next\/static\/[^"]+\.js(?:\?[^"]*)?)"/i)?.[1];
  assert.ok(asset, "Landing page must reference a built Next.js JavaScript asset.");
  const { response, body } = await get(asset.replaceAll("&amp;", "&"), 200, /^(?:application|text)\/javascript\b/i);
  assert.ok(body.length > 0, "JavaScript asset must not be empty.");
  assert.equal(response.headers.get("set-cookie"), null, "A static JavaScript asset must not set a session cookie.");
  const cacheControl = response.headers.get("cache-control") ?? "";
  assert.match(cacheControl, /(?:^|,)\s*immutable\s*(?:,|$)/i, "Hashed JavaScript assets must be immutable.");
  assert.match(
    cacheControl,
    /(?:^|,)\s*max-age=31536000\s*(?:,|$)/i,
    "Hashed JavaScript assets must be cached for one year.",
  );
});

console.log(`Workers smoke checks: ${baseUrl.origin} (${timeoutMs}ms timeout per request)`);
let failures = 0;
for (const { name, run } of checks) {
  const started = performance.now();
  try {
    await run();
    console.log(`PASS ${name} (${Math.round(performance.now() - started)}ms)`);
  } catch (error) {
    failures += 1;
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
    console.error(`FAIL ${name}: ${error.message}${cause}`);
  }
}
console.log(`${checks.length - failures}/${checks.length} checks passed.`);
if (failures > 0) process.exitCode = 1;
