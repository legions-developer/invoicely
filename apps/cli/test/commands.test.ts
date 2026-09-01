import { describe, expect, test } from "bun:test";
import { executeCli } from "../src/commands";
import type { CliIo } from "../src/io";
import { resolve } from "node:path";

const fixtureDirectory = resolve(import.meta.dir, "fixtures");

function createMemoryIo(): { io: CliIo; stderr: string[]; stdout: string[] } {
  const stderr: string[] = [];
  const stdout: string[] = [];

  return {
    io: {
      cwd: fixtureDirectory,
      stderr: (message) => stderr.push(message),
      stdout: (message) => stdout.push(message),
    },
    stderr,
    stdout,
  };
}

describe("validation commands", () => {
  test("validates a JSON invoice and reports Decimal-backed totals", async () => {
    const output = createMemoryIo();
    const exitCode = await executeCli(["validate", "invoice", "--file", "example-invoice.json", "--json"], output.io);

    expect(exitCode).toBe(0);
    expect(JSON.parse(output.stdout[0] ?? "{}")).toMatchObject({
      invoice: { itemCount: 1, subtotal: "251.00", total: "276.10" },
      ok: true,
      valid: true,
    });
  });

  test("validates a synthetic named template", async () => {
    const output = createMemoryIo();
    const exitCode = await executeCli(["validate", "template", "--file", "example-template.json", "--json"], output.io);

    expect(exitCode).toBe(0);
    expect(output.stderr).toEqual([]);
    expect(JSON.parse(output.stdout[0] ?? "{}")).toMatchObject({
      ok: true,
      template: { name: "example-studio", nextSerialNumber: "0042" },
      valid: true,
    });
  });

  test("accepts ISO dates in agent-oriented generation input", async () => {
    const output = createMemoryIo();
    const exitCode = await executeCli(["validate", "input", "--file", "example-input.json", "--json"], output.io);

    expect(exitCode).toBe(0);
    expect(JSON.parse(output.stdout[0] ?? "{}")).toMatchObject({
      input: { clientName: "Sample Customer", itemCount: 1 },
      ok: true,
      valid: true,
    });
  });

  test("returns structured validation failures and exit code 3", async () => {
    const output = createMemoryIo();
    const exitCode = await executeCli(["validate", "input", "--file", "invalid-input.json", "--json"], output.io);

    expect(exitCode).toBe(3);
    expect(output.stdout).toEqual([]);
    expect(JSON.parse(output.stderr[0] ?? "{}")).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
      ok: false,
    });
  });
});

test("returns a stable usage error for unknown commands", async () => {
  const output = createMemoryIo();
  const exitCode = await executeCli(["unknown", "--json"], output.io);

  expect(exitCode).toBe(2);
  expect(JSON.parse(output.stderr[0] ?? "{}")).toMatchObject({
    error: { code: "USAGE_ERROR" },
    ok: false,
  });
});
