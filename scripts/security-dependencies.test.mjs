import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { transformSync } from "@esbuild-kit/core-utils";
import remarkFrontmatter from "remark-frontmatter";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { evaluate } from "@mdx-js/mdx";
import Decimal from "decimal.js";
import test from "node:test";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));

async function loadTypeScript(relativePath, globals = {}) {
  const url = new URL(relativePath, import.meta.url);
  const { code } = transformSync(await readFile(url, "utf8"), fileURLToPath(url));
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, require: createRequire(url), ...globals });
  return module.exports;
}

test("the app data transformer preserves invoice precision, dates, and large integers", async () => {
  const { superjsonTransformer } = await loadTypeScript("../apps/web/src/trpc/transformer/index.ts");
  const invoice = {
    issuedAt: new Date("2026-10-05T08:30:00.000Z"),
    sequence: 9007199254740993n,
    items: [{ quantity: new Decimal("3"), unitPrice: new Decimal("1234567890.123456789") }],
    discount: new Decimal("0"),
    paidAt: null,
  };

  const restored = superjsonTransformer.deserialize(superjsonTransformer.serialize(invoice));

  assert.ok(restored.issuedAt instanceof Date);
  assert.equal(restored.issuedAt.toISOString(), invoice.issuedAt.toISOString());
  assert.equal(restored.sequence, invoice.sequence);
  assert.ok(Decimal.isDecimal(restored.items[0].quantity));
  assert.ok(Decimal.isDecimal(restored.items[0].unitPrice));
  assert.equal(restored.items[0].unitPrice.toString(), "1234567890.123456789");
  assert.equal(restored.items[0].quantity.toString(), "3");
  assert.ok(Decimal.isDecimal(restored.discount));
  assert.equal(restored.discount.toString(), "0");
  assert.equal(restored.paidAt, null);
  assert.equal(superjsonTransformer.deserialize(invoice), invoice);
});

test("the app data transformer rejects serialized prototype pollution", async () => {
  const { superjsonTransformer } = await loadTypeScript("../apps/web/src/trpc/transformer/index.ts");

  assert.throws(
    () => superjsonTransformer.deserialize('[{"__proto__":1},{"securityRegressionPolluted":2},true]'),
    /__proto__/,
  );
  assert.equal(Object.prototype.securityRegressionPolluted, undefined);
});

test("the MDX frontmatter plugin compiles TOML metadata with its patched parser", async () => {
  const source = `+++
title = "Invoice & receipt"
slug = "invoice-without-limits"
summary = "Create a professional invoice."
thumbnail = "/blogs/invoice.png"
tags = ["invoices", "freelancers"]
+++

# Invoice & receipt
`;
  const compiled = await evaluate(source, {
    ...webRequire("react/jsx-runtime"),
    remarkPlugins: [[remarkFrontmatter, ["yaml", "toml"]], remarkMdxFrontmatter],
  });

  assert.deepEqual(
    { ...compiled.frontmatter },
    {
      title: "Invoice & receipt",
      slug: "invoice-without-limits",
      summary: "Create a professional invoice.",
      thumbnail: "/blogs/invoice.png",
      tags: ["invoices", "freelancers"],
    },
  );
  const { createElement } = webRequire("react");
  const { renderToStaticMarkup } = webRequire("react-dom/server");
  assert.equal(renderToStaticMarkup(createElement(compiled.default)), "<h1>Invoice &amp; receipt</h1>");
});

test("Drizzle's legacy TypeScript loader accepts the app config with patched esbuild", async () => {
  const databaseUrl = "postgresql://test:test@localhost:5432/security_test";
  const config = await loadTypeScript("../packages/db/drizzle.config.ts", {
    process: { env: { DATABASE_URL: databaseUrl } },
    require: (specifier) => {
      // The test supplies its own environment and must not read local .env files.
      assert.equal(specifier, "dotenv/config");
      return {};
    },
  });

  assert.equal(config.default.dialect, "postgresql");
  assert.equal(config.default.schema, "./src/schema/index.ts");
  assert.equal(config.default.dbCredentials.url, databaseUrl);
});

test("S3 image listings deserialize XML with the SDK's supported parser", async (t) => {
  const requests = [];
  const client = new S3Client({
    endpoint: "https://r2.example.invalid",
    region: "auto",
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: { accessKeyId: "test-access-key", secretAccessKey: "test-secret-key" },
    requestHandler: {
      handle: async (request) => {
        requests.push(request);
        return {
          response: {
            statusCode: 200,
            headers: { "content-type": "application/xml" },
            body: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>images</Name><Prefix>user-123/</Prefix><KeyCount>2</KeyCount><IsTruncated>false</IsTruncated>
  <Contents><Key>user-123/logo&amp;signature.png</Key><LastModified>2026-10-05T08:30:00.000Z</LastModified><Size>1234</Size></Contents>
  <Contents><Key>user-123/logo.png</Key><LastModified>2026-10-04T08:30:00.000Z</LastModified><Size>5678</Size></Contents>
</ListBucketResult>`),
          },
        };
      },
    },
  });
  t.after(() => client.destroy());

  const result = await client.send(new ListObjectsV2Command({ Bucket: "images", Prefix: "user-123/" }));

  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].query.prefix, "user-123/");
  assert.equal(result.IsTruncated, false);
  assert.equal(result.KeyCount, 2);
  assert.equal(result.Contents.length, 2);
  assert.equal(result.Contents[0].Key, "user-123/logo&signature.png");
  assert.equal(result.Contents[0].Size, 1234);
  assert.ok(result.Contents[0].LastModified instanceof Date);
  assert.equal(result.Contents[0].LastModified.toISOString(), "2026-10-05T08:30:00.000Z");
});
