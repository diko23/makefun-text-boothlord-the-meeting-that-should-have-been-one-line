import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MIN_ENTRY_CHARS = 1;
const MAX_ENTRY_CHARS = 200;
const OUTPUT_FILENAME = "entry.txt";
const OUTPUT_MODE = 0o644;

const ENTRY_LINE: string =
  "Nothing has changed since yesterday's email, the deadline is still Friday, and we are now an hour closer to missing it because of this alignment call.";

function validateEntry(text: string): void {
  const charCount: number = [...text].length;
  if (charCount < MIN_ENTRY_CHARS || charCount > MAX_ENTRY_CHARS) {
    throw new Error(`Entry length ${charCount} outside [${MIN_ENTRY_CHARS}, ${MAX_ENTRY_CHARS}]`);
  }
  if (/[\r\n\x00-\x1f\x7f]/.test(text)) {
    throw new Error("Entry must be a single line without control characters");
  }
  if (text.trim().length === 0) {
    throw new Error("Entry must not be whitespace only");
  }
}

function resolveOutputDir(envValue: string | undefined): string {
  const trimmed: string = envValue?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "/output";
}

function writeVerifiedOutput(outputPath: string, payload: Buffer): void {
  writeFileSync(outputPath, payload, { mode: OUTPUT_MODE });
  chmodSync(outputPath, OUTPUT_MODE);

  const written: Buffer = readFileSync(outputPath);
  if (!written.equals(payload)) {
    throw new Error("Written entry verification failed");
  }
}

function main(): void {
  validateEntry(ENTRY_LINE);
  const outputDir: string = resolveOutputDir(process.env.MAKEFUN_OUTPUT_DIR);
  const outputPath: string = join(outputDir, OUTPUT_FILENAME);
  const payload: Buffer = Buffer.from(ENTRY_LINE, "utf8");

  mkdirSync(outputDir, { recursive: true });
  writeVerifiedOutput(outputPath, payload);
}

try {
  main();
} catch (error: unknown) {
  const message: string = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
