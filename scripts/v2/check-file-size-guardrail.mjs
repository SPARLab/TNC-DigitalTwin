import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const targetRoot = path.resolve(repoRoot, "src/v2");

const WARN_THRESHOLD = Number.parseInt(process.env.V2_FILE_SIZE_WARN ?? "800", 10);
const REVIEW_THRESHOLD = Number.parseInt(process.env.V2_FILE_SIZE_REVIEW ?? "950", 10);

const INCLUDED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_SUFFIXES = [".d.ts", ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

async function walkFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    if (EXCLUDED_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function countLines(content) {
  if (content.length === 0) {
    return 0;
  }
  return content.split(/\r?\n/).length;
}

function severityForLineCount(lineCount) {
  if (lineCount >= REVIEW_THRESHOLD) {
    return "REVIEW";
  }
  if (lineCount >= WARN_THRESHOLD) {
    return "WARN";
  }
  return null;
}

async function analyzeFile(filePath) {
  const fileInfo = await stat(filePath);
  if (fileInfo.size === 0) {
    return null;
  }

  const contents = await readFile(filePath, "utf8");
  const lineCount = countLines(contents);
  const severity = severityForLineCount(lineCount);
  if (!severity) {
    return null;
  }

  return {
    filePath,
    relativePath: path.relative(repoRoot, filePath),
    lineCount,
    severity,
  };
}

function printResults(results) {
  const title = "V2 File Size Guardrail (warning-only)";
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
  console.log(`Target: ${path.relative(repoRoot, targetRoot)}/**/*`);
  console.log(`Thresholds: WARN >= ${WARN_THRESHOLD}, REVIEW >= ${REVIEW_THRESHOLD}`);

  if (results.length === 0) {
    console.log("\nNo files exceeded configured thresholds.");
    return;
  }

  const reviewResults = results.filter((result) => result.severity === "REVIEW");
  const warnResults = results.filter((result) => result.severity === "WARN");

  if (reviewResults.length > 0) {
    console.log("\nREVIEW (highest priority):");
    for (const result of reviewResults) {
      console.log(`- ${result.relativePath} (${result.lineCount} lines)`);
    }
  }

  if (warnResults.length > 0) {
    console.log("\nWARN:");
    for (const result of warnResults) {
      console.log(`- ${result.relativePath} (${result.lineCount} lines)`);
    }
  }

  console.log("\nNote: This script is warning-only and always exits 0.");
}

async function main() {
  const targetExists = await stat(targetRoot).then(
    (fileInfo) => fileInfo.isDirectory(),
    () => false,
  );

  if (!targetExists) {
    console.error(`Target directory not found: ${targetRoot}`);
    process.exitCode = 0;
    return;
  }

  const files = await walkFiles(targetRoot);
  const analyses = await Promise.all(files.map((filePath) => analyzeFile(filePath)));
  const results = analyses
    .filter((result) => result !== null)
    .sort((a, b) => b.lineCount - a.lineCount);

  printResults(results);
  process.exitCode = 0;
}

main().catch((error) => {
  console.error("Failed to run V2 file-size guardrail.");
  console.error(error);
  process.exitCode = 0;
});
