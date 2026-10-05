import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";

const require = createRequire(import.meta.url);
const micromatch = require("micromatch");
const braces = require("braces");
const nestingError = { name: "SyntaxError", message: /Input nesting exceeds maximum depth/ };

// Isolate hostile patterns so a regression cannot hang or exhaust the test runner.
function runAdversarial(source) {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=commonjs",
      "-e",
      `const assert = require("node:assert/strict");
       const braces = require(${JSON.stringify(require.resolve("braces"))});
       const micromatch = require(${JSON.stringify(require.resolve("micromatch"))});
       const nestingError = { name: "SyntaxError", message: /Input nesting exceeds maximum depth/ };
       ${source}`,
    ],
    { encoding: "utf8", timeout: 5_000, maxBuffer: 64 * 1024 },
  );
  assert.ifError(result.error);
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test("braces preserves ordinary alternation, ranges, and nested globs", () => {
  assert.deepEqual(braces.expand("src/{api,web}/file-{1..3}.ts"), [
    "src/api/file-1.ts",
    "src/api/file-2.ts",
    "src/api/file-3.ts",
    "src/web/file-1.ts",
    "src/web/file-2.ts",
    "src/web/file-3.ts",
  ]);
  assert.equal(braces.compile("src/{api,{web,worker}}/*.ts"), "src/(api|(web|worker))/*.ts");
  assert.deepEqual(
    micromatch(
      ["src/api/index.ts", "src/web/page.tsx", "src/worker/task.js", "readme.md"],
      "src/{api,web}/**/*.{ts,tsx}",
    ),
    ["src/api/index.ts", "src/web/page.tsx"],
  );
  assert.deepEqual(micromatch.braceExpand("src/{api,web}/*.ts"), ["src/api/*.ts", "src/web/*.ts"]);
});

test("the nesting limit accepts 100 levels and rejects the next block", () => {
  for (const [open, close] of [
    ["{", "}"],
    ["(", ")"],
  ]) {
    const allowed = open.repeat(100) + "a" + close.repeat(100);
    for (const method of ["parse", "compile", "expand", "stringify"]) {
      assert.doesNotThrow(() => braces[method](allowed));
      assert.throws(() => braces[method](open + allowed + close), nestingError);
    }
  }
});

test("quoted, escaped, and bracketed brace characters stay literal", () => {
  const literal = "{".repeat(150) + "x" + "}".repeat(150);
  assert.equal(braces.compile(`"${literal}"`), literal);
  assert.equal(braces.compile(`[${literal}]`), `[${literal}]`);
  assert.equal(braces.compile("\\{".repeat(150) + "x" + "\\}".repeat(150)), literal);
});

for (const method of ["parse", "compile", "expand", "stringify"]) {
  test(`braces.${method} rejects deeply nested input before exhausting the stack`, () => {
    runAdversarial(`
      const inputs = [
        "{".repeat(4900) + "a" + "}".repeat(4900),
        "(".repeat(4900) + "a" + ")".repeat(4900),
        "{(".repeat(2400) + "a" + ")}".repeat(2400),
        "{".repeat(4900),
      ];
      for (const input of inputs) {
        assert.ok(input.length < 10000);
        assert.throws(() => braces[${JSON.stringify(method)}](input), nestingError);
      }
    `);
  });
}

test("micromatch's brace compilation and expansion reject hostile nesting", () => {
  runAdversarial(`
    const input = "{".repeat(4900) + "a,b" + "}".repeat(4900);
    assert.throws(() => micromatch.braces(input), nestingError);
    assert.throws(() => micromatch.braceExpand(input), nestingError);
    assert.throws(() => micromatch.braces(input, { expand: true }), nestingError);
  `);
});

test("direct AST inputs cannot bypass the parser's nesting bound", () => {
  runAdversarial(`
    function nestedAst() {
      const ast = { type: "root", nodes: [] };
      let parent = ast;
      for (let i = 0; i < 4900; i++) {
        const child = { type: "paren", nodes: [], parent };
        parent.nodes.push(child);
        parent = child;
      }
      parent.nodes.push({ type: "text", value: "a" });
      return ast;
    }
    for (const method of ["compile", "expand", "stringify"]) {
      assert.throws(() => braces[method](nestedAst()), nestingError);
    }
  `);
});
