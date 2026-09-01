import {
  buildInvoiceFromTemplate,
  calculateInvoiceTotals,
  createInvoiceJsonSchema,
  invoiceGenerationInputSchema,
  namedInvoiceTemplateSchema,
  type NamedInvoiceTemplate,
} from "@invoicely/invoice-core";
import { assertOutputAvailable, type CliIo, readJsonFile, writeBinaryFile } from "./io";
import { renderInvoicePdfToBuffer } from "@invoicely/invoice-pdf/node";
import { parseArgs, type ParseArgsOptionsConfig } from "node:util";
import { CliError, createValidationError } from "./errors";
import { withTemplateStore } from "./template-store";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { CLI_HELP } from "./help";

interface CommandContext {
  io: CliIo;
  json: boolean;
}

interface CommandResult {
  human: string;
  value: Record<string, unknown>;
}

const invoicePdfFontDirectory = fileURLToPath(new URL("../../web/public/fonts", import.meta.url));

export async function executeCli(args: string[], io: CliIo): Promise<number> {
  const json = args.includes("--json");
  const commandArgs = args.filter((argument) => argument !== "--json");
  const context = { io, json };

  try {
    const result = await dispatchCommand(commandArgs, context);

    if (result) {
      writeResult(context, result);
    }

    return 0;
  } catch (error) {
    const cliError = normalizeError(error);
    writeError(context, cliError);
    return cliError.exitCode;
  }
}

async function dispatchCommand(args: string[], context: CommandContext): Promise<CommandResult | null> {
  const [command, action, ...rest] = args;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    context.io.stdout(CLI_HELP.trimEnd());
    return null;
  }

  if (command === "template") {
    return runTemplateCommand(action, rest, context);
  }

  if (command === "validate") {
    return runValidateCommand(action, rest, context);
  }

  if (command === "serial") {
    return runSerialCommand(action, rest);
  }

  if (command === "generate") {
    return runGenerateCommand(
      [action, ...rest].filter((value): value is string => value !== undefined),
      context,
    );
  }

  throw usageError(`Unknown command "${command}"`);
}

async function runTemplateCommand(
  action: string | undefined,
  args: string[],
  context: CommandContext,
): Promise<CommandResult> {
  if (action === "list") {
    assertNoArguments(args);
    const templates = await withTemplateStore((store) => store.listLocalInvoiceTemplates());
    const summaries = templates.map(toTemplateSummary);

    return {
      human: summaries.length
        ? summaries.map((template) => `${template.name}\t${template.nextSerialNumber}`).join("\n")
        : "No local invoice templates found.",
      value: { ok: true, templates: summaries },
    };
  }

  if (action === "show") {
    const name = requireSinglePositional(args, "template show requires a template name");
    const template = await getRequiredTemplate(name);

    return {
      human: `${template.name}\nNext serial: ${template.nextSerialNumber}\nSchema version: ${template.schemaVersion}`,
      value: { ok: true, template },
    };
  }

  if (action === "save") {
    const { values, positionals } = parseCommandArgs(args, {
      file: { type: "string" },
      force: { type: "boolean", default: false },
    });
    assertNoPositionals(positionals);
    const file = requireStringOption(values.file, "template save requires --file <template.json>");
    const candidate = await readJsonFile(context.io, file);
    const result = namedInvoiceTemplateSchema.safeParse(candidate);

    if (!result.success) {
      throw createValidationError("Invoice template", result.error.issues);
    }

    const template = await withTemplateStore(async (store) => {
      const existingTemplate = await store.getLocalInvoiceTemplate(result.data.name);

      if (existingTemplate && values.force !== true) {
        throw new CliError(
          5,
          "TEMPLATE_EXISTS",
          `Invoice template "${result.data.name}" already exists. Pass --force to replace it.`,
        );
      }

      return store.saveLocalInvoiceTemplate(result.data);
    });

    return {
      human: `Saved template ${template.name} (next serial ${template.nextSerialNumber}).`,
      value: { ok: true, template: toTemplateSummary(template) },
    };
  }

  if (action === "delete") {
    const name = requireSinglePositional(args, "template delete requires a template name");
    const deleted = await withTemplateStore((store) => store.deleteLocalInvoiceTemplate(name));

    if (!deleted) {
      throw notFoundError(name);
    }

    return {
      human: `Deleted template ${name}.`,
      value: { deleted: true, name, ok: true },
    };
  }

  throw usageError("template requires one of: list, show, save, delete");
}

async function runValidateCommand(
  subject: string | undefined,
  args: string[],
  context: CommandContext,
): Promise<CommandResult> {
  const { values, positionals } = parseCommandArgs(args, { file: { type: "string" } });
  assertNoPositionals(positionals);
  const file = requireStringOption(values.file, "validate requires --file <data.json>");
  const candidate = await readJsonFile(context.io, file);

  if (subject === "invoice") {
    const result = createInvoiceJsonSchema.safeParse(candidate);

    if (!result.success) {
      throw createValidationError("Invoice", result.error.issues);
    }

    const totals = calculateInvoiceTotals(result.data);
    return {
      human: `Invoice is valid (${result.data.items.length} items, total ${totals.total.toFixed(2)} ${result.data.invoiceDetails.currency}).`,
      value: {
        invoice: {
          currency: result.data.invoiceDetails.currency,
          itemCount: result.data.items.length,
          serialNumber: result.data.invoiceDetails.serialNumber,
          subtotal: totals.subtotal.toFixed(2),
          total: totals.total.toFixed(2),
        },
        ok: true,
        valid: true,
      },
    };
  }

  if (subject === "input") {
    const result = invoiceGenerationInputSchema.safeParse(candidate);

    if (!result.success) {
      throw createValidationError("Invoice generation input", result.error.issues);
    }

    return {
      human: `Invoice generation input is valid (${result.data.items.length} items).`,
      value: {
        input: {
          clientName: result.data.clientDetails.name,
          date: result.data.date.toISOString(),
          itemCount: result.data.items.length,
        },
        ok: true,
        valid: true,
      },
    };
  }

  if (subject === "template") {
    const result = namedInvoiceTemplateSchema.safeParse(candidate);

    if (!result.success) {
      throw createValidationError("Invoice template", result.error.issues);
    }

    return {
      human: `Invoice template ${result.data.name} is valid.`,
      value: { ok: true, template: toTemplateSummary(result.data), valid: true },
    };
  }

  throw usageError("validate requires one of: invoice, input, template");
}

async function runSerialCommand(action: string | undefined, args: string[]): Promise<CommandResult> {
  if (action === "peek") {
    const name = requireSinglePositional(args, "serial peek requires a template name");
    const template = await getRequiredTemplate(name);

    return serialResult(name, template.nextSerialNumber, false);
  }

  if (action === "next") {
    const name = requireSinglePositional(args, "serial next requires a template name");
    const reserved = await withTemplateStore(async (store) => {
      if (!(await store.getLocalInvoiceTemplate(name))) {
        throw notFoundError(name);
      }

      return store.reserveLocalInvoiceTemplateSerial(name);
    });

    return serialResult(name, reserved.serialNumber, true, reserved.template.nextSerialNumber);
  }

  if (action === "set") {
    if (args.length !== 2) {
      throw usageError("serial set requires <template> <digits>");
    }

    const [name = "", nextSerialNumber = ""] = args;
    const serialResultValue = namedInvoiceTemplateSchema.shape.nextSerialNumber.safeParse(nextSerialNumber);

    if (!serialResultValue.success) {
      throw createValidationError("Serial number", serialResultValue.error.issues);
    }

    const template = await withTemplateStore(async (store) => {
      if (!(await store.getLocalInvoiceTemplate(name))) {
        throw notFoundError(name);
      }

      return store.setLocalInvoiceTemplateSerial(name, serialResultValue.data);
    });

    return serialResult(name, template.nextSerialNumber, false);
  }

  throw usageError("serial requires one of: peek, next, set");
}

async function runGenerateCommand(args: string[], context: CommandContext): Promise<CommandResult> {
  const { values, positionals } = parseCommandArgs(args, {
    force: { type: "boolean", default: false },
    input: { type: "string" },
    output: { type: "string" },
    serial: { type: "string" },
    template: { type: "string" },
  });
  assertNoPositionals(positionals);
  const templateName = requireStringOption(values.template, "generate requires --template <name>");
  const inputFile = requireStringOption(values.input, "generate requires --input <input.json>");
  const outputFile = requireStringOption(values.output, "generate requires --output <invoice.pdf>");
  const inputCandidate = await readJsonFile(context.io, inputFile);
  const inputResult = invoiceGenerationInputSchema.safeParse(inputCandidate);

  if (!inputResult.success) {
    throw createValidationError("Invoice generation input", inputResult.error.issues);
  }

  const explicitSerial = values.serial;
  if (explicitSerial !== undefined) {
    const serialResultValue = namedInvoiceTemplateSchema.shape.nextSerialNumber.safeParse(explicitSerial);
    if (!serialResultValue.success) {
      throw createValidationError("Serial number", serialResultValue.error.issues);
    }
  }

  await assertOutputAvailable(context.io, outputFile, values.force === true);

  const { serialNumber, template } = await loadTemplateForGeneration(templateName, explicitSerial);
  const invoice = buildInvoiceFromTemplate(template, {
    ...inputResult.data,
    serialNumber,
  });
  const buffer = await renderInvoicePdfToBuffer({
    fontDirectory: invoicePdfFontDirectory,
    invoiceData: invoice,
  });
  const absoluteOutput = await writeBinaryFile(context.io, outputFile, buffer, values.force === true);
  const totals = calculateInvoiceTotals(invoice);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const invoiceNumber = `${invoice.invoiceDetails.prefix}${serialNumber}`;

  return {
    human: `Generated ${invoiceNumber} at ${absoluteOutput}`,
    value: {
      invoice: {
        currency: invoice.invoiceDetails.currency,
        invoiceNumber,
        serialNumber,
        subtotal: totals.subtotal.toFixed(2),
        total: totals.total.toFixed(2),
      },
      ok: true,
      output: absoluteOutput,
      sha256: checksum,
      template: templateName,
    },
  };
}

async function loadTemplateForGeneration(
  name: string,
  explicitSerial: string | undefined,
): Promise<{ serialNumber: string; template: NamedInvoiceTemplate }> {
  return withTemplateStore(async (store) => {
    if (explicitSerial !== undefined) {
      const template = await store.getLocalInvoiceTemplate(name);
      if (!template) throw notFoundError(name);
      return { serialNumber: explicitSerial, template };
    }

    if (!(await store.getLocalInvoiceTemplate(name))) {
      throw notFoundError(name);
    }

    const reserved = await store.reserveLocalInvoiceTemplateSerial(name);
    return { serialNumber: reserved.serialNumber, template: reserved.template };
  });
}

async function getRequiredTemplate(name: string): Promise<NamedInvoiceTemplate> {
  const template = await withTemplateStore((store) => store.getLocalInvoiceTemplate(name));

  if (!template) {
    throw notFoundError(name);
  }

  return template;
}

function parseCommandArgs<const Options extends ParseArgsOptionsConfig>(args: string[], options: Options) {
  try {
    return parseArgs({ args, allowPositionals: true, options, strict: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw usageError(message);
  }
}

function requireSinglePositional(args: string[], message: string): string {
  if (args.length !== 1 || !args[0] || args[0].startsWith("-")) {
    throw usageError(message);
  }
  return args[0];
}

function requireStringOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || !value) {
    throw usageError(message);
  }
  return value;
}

function assertNoArguments(args: string[]): void {
  if (args.length > 0) {
    throw usageError(`Unexpected arguments: ${args.join(" ")}`);
  }
}

function assertNoPositionals(positionals: string[]): void {
  if (positionals.length > 0) {
    throw usageError(`Unexpected arguments: ${positionals.join(" ")}`);
  }
}

function toTemplateSummary(template: NamedInvoiceTemplate): Record<string, unknown> {
  return {
    name: template.name,
    nextSerialNumber: template.nextSerialNumber,
    schemaVersion: template.schemaVersion,
  };
}

function serialResult(name: string, serialNumber: string, reserved: boolean, nextSerialNumber?: string): CommandResult {
  return {
    human: nextSerialNumber
      ? `${name}: reserved ${serialNumber}; next ${nextSerialNumber}`
      : `${name}: ${serialNumber}`,
    value: { name, nextSerialNumber, ok: true, reserved, serialNumber },
  };
}

function writeResult(context: CommandContext, result: CommandResult): void {
  context.io.stdout(context.json ? JSON.stringify(result.value, null, 2) : result.human);
}

function writeError(context: CommandContext, error: CliError): void {
  if (context.json) {
    context.io.stderr(
      JSON.stringify(
        {
          error: {
            code: error.code,
            issues: error.issues,
            message: error.message,
          },
          ok: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  context.io.stderr(`Error [${error.code}]: ${error.message}`);
  for (const issue of error.issues ?? []) {
    context.io.stderr(`  ${issue.path || "(root)"}: ${issue.message}`);
  }
}

function normalizeError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new CliError(5, "RUNTIME_ERROR", message);
}

function usageError(message: string): CliError {
  return new CliError(2, "USAGE_ERROR", `${message}. Run "invoicely help" for usage.`);
}

function notFoundError(name: string): CliError {
  return new CliError(4, "TEMPLATE_NOT_FOUND", `Invoice template "${name}" was not found`);
}
