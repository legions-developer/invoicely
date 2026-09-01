import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CliError } from "./errors";

export interface CliIo {
  cwd: string;
  stderr: (message: string) => void;
  stdout: (message: string) => void;
}

export const processCliIo: CliIo = {
  cwd: process.cwd(),
  stderr: (message) => console.error(message),
  stdout: (message) => console.log(message),
};

export async function readJsonFile(io: CliIo, filePath: string): Promise<unknown> {
  const absolutePath = resolve(io.cwd, filePath);

  try {
    return JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(5, "INPUT_READ_ERROR", `Could not read JSON from ${absolutePath}: ${message}`);
  }
}

export async function writeBinaryFile(
  io: CliIo,
  filePath: string,
  content: Uint8Array,
  force: boolean,
): Promise<string> {
  const absolutePath = resolve(io.cwd, filePath);
  await assertOutputAvailable(io, filePath, force);

  try {
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
    return absolutePath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(5, "OUTPUT_WRITE_ERROR", `Could not write ${absolutePath}: ${message}`);
  }
}

export async function assertOutputAvailable(io: CliIo, filePath: string, force: boolean): Promise<void> {
  const absolutePath = resolve(io.cwd, filePath);

  if (!force && (await pathExists(absolutePath))) {
    throw new CliError(5, "OUTPUT_EXISTS", `Output already exists: ${absolutePath}. Pass --force to replace it.`);
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
