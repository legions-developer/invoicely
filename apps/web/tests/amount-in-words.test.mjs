import currencies from "currency-symbol-map/map.js";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import Module from "node:module";
import test from "node:test";
import path from "node:path";
import ts from "typescript";
import fs from "node:fs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Load these standalone TypeScript modules with the project's existing compiler.
function loadTypeScript(relativePath) {
  const filename = path.resolve(testDirectory, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled._compile(outputText, filename);
  return compiled.exports;
}

const { formatAmountInWords, getAmountInWordsSuffix } = loadTypeScript("../src/lib/invoice/amount-in-words.ts");
const { createInvoiceSchema, createInvoiceSchemaDefaultValues } = loadTypeScript(
  "../src/zod-schemas/invoice/create-invoice.ts",
);

test("issue #78: title case and spaces use the invoice currency's wording", () => {
  assert.equal(formatAmountInWords(85, "USD"), "Eighty Five US Dollars Only");
  assert.equal(formatAmountInWords(1, "USD"), "One US Dollar Only");
  assert.equal(formatAmountInWords(0, "USD"), "Zero US Dollars Only");
  assert.equal(formatAmountInWords(1085, "USD"), "One Thousand Eighty Five US Dollars Only");
});

test("automatic currency names handle singular, plural, and irregular forms", () => {
  const cases = [
    ["USD", "US Dollar", "US Dollars"],
    ["EUR", "Euro", "Euros"],
    ["INR", "Indian Rupee", "Indian Rupees"],
    ["SEK", "Swedish Krona", "Swedish Kronor"],
    ["JPY", "Japanese Yen", "Japanese Yen"],
    ["KWD", "Kuwaiti Dinar", "Kuwaiti Dinars"],
    ["BHD", "Bahraini Dinar", "Bahraini Dinars"],
  ];
  for (const [currency, singular, plural] of cases) {
    assert.equal(formatAmountInWords(1, currency), `One ${singular} Only`, currency);
    assert.equal(formatAmountInWords(2, currency), `Two ${plural} Only`, currency);
    assert.equal(getAmountInWordsSuffix(currency, 1), `${singular} Only`, currency);
    assert.equal(getAmountInWordsSuffix(currency, 2), `${plural} Only`, currency);
  }
});

test("decimal words preserve both displayed decimal places without assuming minor-unit names", () => {
  assert.equal(formatAmountInWords(85.5, "USD"), "Eighty Five Point Five Zero US Dollars Only");
  assert.equal(formatAmountInWords(0.05, "INR"), "Zero Point Zero Five Indian Rupees Only");
  assert.equal(formatAmountInWords(1.25, "JPY"), "One Point Two Five Japanese Yen Only");
  assert.equal(formatAmountInWords(1.234, "KWD"), "One Point Two Three Kuwaiti Dinars Only");
});

test("decimal rounding agrees with the two-place numeric invoice total", () => {
  assert.equal(formatAmountInWords(1.005, "USD"), "One Point Zero One US Dollars Only");
  assert.equal(formatAmountInWords(1.999, "USD"), "Two US Dollars Only");
  assert.equal(formatAmountInWords(0.999, "USD"), "One US Dollar Only");
  assert.equal(formatAmountInWords(85.999, "USD"), "Eighty Six US Dollars Only");
});

test("currency wording uses the rounded full amount, including fractions and negative amounts", () => {
  assert.equal(formatAmountInWords(1.01, "USD"), "One Point Zero One US Dollars Only");
  assert.equal(formatAmountInWords(1.004, "USD"), "One US Dollar Only");
  assert.equal(formatAmountInWords(-1, "USD"), "Minus One US Dollar Only");
  assert.equal(formatAmountInWords(-1.01, "USD"), "Minus One Point Zero One US Dollars Only");
  assert.equal(formatAmountInWords(-2, "USD"), "Minus Two US Dollars Only");
});

test("rounded negative zero is rendered as zero", () => {
  assert.equal(formatAmountInWords(-0, "USD"), "Zero US Dollars Only");
  assert.equal(formatAmountInWords(-0.004, "USD"), "Zero US Dollars Only");
  assert.equal(formatAmountInWords(-0.005, "USD"), "Minus Zero Point Zero One US Dollars Only");
});

test("changing currency updates the wording for the same invoice total", () => {
  const amount = 85;
  assert.equal(formatAmountInWords(amount, "USD"), "Eighty Five US Dollars Only");
  assert.equal(formatAmountInWords(amount, "INR"), "Eighty Five Indian Rupees Only");
  assert.equal(formatAmountInWords(amount, "EUR"), "Eighty Five Euros Only");
  assert.equal(formatAmountInWords(amount, "JPY"), "Eighty Five Japanese Yen Only");
});

test("currency codes are case-insensitive and tolerate surrounding whitespace", () => {
  assert.equal(formatAmountInWords(85, " usd "), "Eighty Five US Dollars Only");
  assert.equal(formatAmountInWords(1, "\tinr\n"), "One Indian Rupee Only");
});

test("currency fallback handles unknown and malformed codes", () => {
  assert.equal(formatAmountInWords(85, "BTC"), "Eighty Five BTC Only");
  assert.equal(formatAmountInWords(85, "INVALID"), "Eighty Five INVALID Only");
  assert.equal(formatAmountInWords(85, ""), "Eighty Five Only");
});

test("all currencies offered by the selector can render whole and fractional totals", () => {
  assert.ok(Object.keys(currencies).length > 100);
  for (const currency of Object.keys(currencies)) {
    for (const amount of [1, 85, 85.5]) {
      const result = formatAmountInWords(amount, currency);
      assert.ok(result.length > 0, `${currency}: ${amount}`);
      assert.match(result, / Only$/, `${currency}: ${amount}`);
    }
  }
});

test("amounts beyond safe integer precision retain numeric text without crashing the PDF", () => {
  assert.doesNotThrow(() => formatAmountInWords(Number.MAX_SAFE_INTEGER + 1, "USD"));
  assert.match(formatAmountInWords(Number.MAX_SAFE_INTEGER + 1, "USD"), /\d/);
  assert.doesNotThrow(() => formatAmountInWords(Number.MAX_VALUE, "USD"));
  assert.match(formatAmountInWords(Number.MAX_VALUE, "USD"), /\d/);
});

test("nonfinite totals do not produce misleading amount-in-words text", () => {
  for (const amount of [NaN, Infinity, -Infinity]) {
    assert.equal(formatAmountInWords(amount, "USD"), "");
  }
});

test("existing invoices need only their existing currency code to produce wording", () => {
  for (const [currency, expected] of [
    ["USD", "Eighty Five US Dollars Only"],
    ["INR", "Eighty Five Indian Rupees Only"],
    ["BTC", "Eighty Five BTC Only"],
  ]) {
    const legacy = createInvoiceSchema.parse({
      ...createInvoiceSchemaDefaultValues,
      invoiceDetails: { ...createInvoiceSchemaDefaultValues.invoiceDetails, currency },
    });
    assert.equal(formatAmountInWords(85, legacy.invoiceDetails.currency), expected);
  }
});
