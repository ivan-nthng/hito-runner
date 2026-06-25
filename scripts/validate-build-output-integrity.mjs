import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = process.cwd();

export function validateLocalBuildOutput(options = {}) {
  const validationRoot = options.rootDir ?? rootDir;
  const runtimeOutput = resolveLocalRuntimeOutput(validationRoot);
  const requiredPaths = [
    runtimeOutput.nitroManifest,
    resolve(runtimeOutput.publicDir, "favicon.svg"),
    resolve(runtimeOutput.publicDir, "templates/hito-training-plan-v2-template.json"),
    resolve(runtimeOutput.serverDir, "index.mjs"),
  ];

  validateRequiredPaths(validationRoot, requiredPaths);

  const importSummary = validateRelativeMjsImports(runtimeOutput.serverDir);
  return {
    mode: "local",
    runtimeServerRoot: relative(validationRoot, runtimeOutput.serverDir),
    ...importSummary,
  };
}

export function validateVercelBuildOutput(options = {}) {
  const validationRoot = options.rootDir ?? rootDir;
  const requiredPaths = [
    ".vercel/output/config.json",
    ".vercel/output/nitro.json",
    ".vercel/output/static/favicon.svg",
    ".vercel/output/static/templates/hito-training-plan-v2-template.json",
    ".vercel/output/functions/__server.func/index.mjs",
  ];

  validateRequiredPaths(validationRoot, requiredPaths);

  const importSummary = validateRelativeMjsImports(
    resolve(validationRoot, ".vercel/output/functions/__server.func"),
  );
  return {
    mode: "vercel",
    ...importSummary,
  };
}

function validateRequiredPaths(validationRoot, requiredPaths) {
  const missingPaths = requiredPaths
    .map((requiredPath) => resolve(validationRoot, requiredPath))
    .filter((requiredPath) => !existsSync(requiredPath));

  if (missingPaths.length > 0) {
    throw new Error(
      `Build output is missing required artifact(s): ${missingPaths
        .map((missingPath) => relative(validationRoot, missingPath))
        .join(", ")}`,
    );
  }
}

function resolveLocalRuntimeOutput(validationRoot) {
  const finalizedServerDir = resolve(validationRoot, "logs/build-output-finalized/server");
  const finalizedPublicDir = resolve(validationRoot, "logs/build-output-finalized/public");
  const finalizedNitroManifest = resolve(validationRoot, "logs/build-output-finalized/nitro.json");

  if (
    existsSync(resolve(finalizedServerDir, "index.mjs")) &&
    existsSync(resolve(finalizedPublicDir, "favicon.svg")) &&
    existsSync(finalizedNitroManifest)
  ) {
    return {
      serverDir: finalizedServerDir,
      publicDir: finalizedPublicDir,
      nitroManifest: finalizedNitroManifest,
    };
  }

  return {
    serverDir: resolve(validationRoot, ".output/server"),
    publicDir: resolve(validationRoot, ".output/public"),
    nitroManifest: resolve(validationRoot, ".output/nitro.json"),
  };
}

function validateRelativeMjsImports(serverRoot) {
  const mjsFiles = listMjsFiles(serverRoot);
  const mjsFileSet = new Set(mjsFiles);
  const missingImports = [];
  let relativeImportCount = 0;

  for (const filePath of mjsFiles) {
    const code = readFileSync(filePath, "utf8");

    for (const specifier of extractRelativeMjsSpecifiers(code)) {
      relativeImportCount += 1;
      const resolvedImport = resolve(dirname(filePath), stripSpecifierSuffix(specifier));

      if (!mjsFileSet.has(resolvedImport) && !existsSync(resolvedImport)) {
        missingImports.push({
          importer: relative(serverRoot, filePath),
          specifier,
          resolved: relative(serverRoot, resolvedImport),
        });
      }
    }
  }

  if (missingImports.length > 0) {
    const examples = missingImports
      .slice(0, 12)
      .map((missingImport) => `${missingImport.importer} -> ${missingImport.specifier}`)
      .join("; ");
    throw new Error(
      `Build output has missing relative .mjs import(s): ${examples}${
        missingImports.length > 12 ? `; +${missingImports.length - 12} more` : ""
      }`,
    );
  }

  return {
    mjsFileCount: mjsFiles.length,
    relativeMjsImportCount: relativeImportCount,
  };
}

function listMjsFiles(directory) {
  if (!existsSync(directory)) {
    throw new Error(`Build output server directory is missing: ${directory}`);
  }

  const files = [];
  const entries = readdirSync(directory);

  for (const entry of entries) {
    const entryPath = resolve(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      files.push(...listMjsFiles(entryPath));
    } else if (stats.isFile() && entryPath.endsWith(".mjs")) {
      files.push(entryPath);
    }
  }

  return files;
}

function extractRelativeMjsSpecifiers(code) {
  const specifiers = new Set();
  const importPatterns = [
    /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of importPatterns) {
    let match = pattern.exec(code);

    while (match) {
      const specifier = match[1];
      if (specifier.startsWith(".") && stripSpecifierSuffix(specifier).endsWith(".mjs")) {
        specifiers.add(specifier);
      }
      match = pattern.exec(code);
    }
  }

  return specifiers;
}

function stripSpecifierSuffix(specifier) {
  return specifier.split(/[?#]/, 1)[0] ?? specifier;
}

function runCli() {
  const mode = process.argv.includes("--vercel") ? "vercel" : "local";
  const summary = mode === "vercel" ? validateVercelBuildOutput() : validateLocalBuildOutput();

  console.log(
    `[build-integrity] ${summary.mode} ok: runtime=${summary.runtimeServerRoot ?? "vercel"} mjsFiles=${summary.mjsFileCount}, relativeMjsImports=${summary.relativeMjsImportCount}`,
  );
}

const executedPath = process.argv[1] ? resolve(process.argv[1]) : "";
const currentPath = fileURLToPath(import.meta.url);

if (executedPath === currentPath) {
  runCli();
}
