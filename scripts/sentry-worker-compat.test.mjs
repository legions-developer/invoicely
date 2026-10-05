import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const sdkRoot = dirname(require.resolve("@sentry/nextjs/package.json"));
const utilPath = join(sdkRoot, "build/cjs/config/util.js");
const sdkRequire = createRequire(utilPath);
const utilSource = readFileSync(utilPath, "utf8");
const nextVersion = sdkRequire("next/package.json").version;

function loadConfigUtil({ filename = utilPath, cwd = process.cwd() } = {}) {
  const createRequireCalls = [];
  const exports = {};
  runInNewContext(utilSource, {
    exports,
    __filename: filename,
    process: { cwd: () => cwd },
    require(id) {
      if (id === "module") {
        return {
          createRequire(base) {
            createRequireCalls.push(base);
            return createRequire(base);
          },
        };
      }
      return sdkRequire(id);
    },
  });
  return { exports, createRequireCalls };
}

test("Sentry's config barrel can load with the empty filename used by the Worker bundle", () => {
  // Sentry's runtime barrel also imports this build helper. Worker startup must
  // not call Node's createRequire, which rejects the bundled empty filename.
  const { createRequireCalls } = loadConfigUtil({ filename: "" });
  assert.deepEqual(createRequireCalls, []);
});

test("Sentry resolves the installed Next.js version when its build helper is called", () => {
  const { exports, createRequireCalls } = loadConfigUtil();
  assert.deepEqual(createRequireCalls, []);
  assert.equal(exports.getNextjsVersion(), nextVersion);
  assert.ok(createRequireCalls.includes(utilPath));
});

test("Sentry retains SDK-relative Next.js resolution when the working directory has no packages", () => {
  const { exports } = loadConfigUtil({ cwd: "/__sentry_worker_compat_missing_project__" });
  assert.equal(exports.getNextjsVersion(), nextVersion);
});
