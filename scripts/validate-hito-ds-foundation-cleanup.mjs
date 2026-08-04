import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceFiles = await walk(path.join(rootDir, "src"));
const searchableFiles = sourceFiles.filter((filePath) => /\.(css|ts|tsx)$/.test(filePath));
const sources = await Promise.all(
  searchableFiles.map(async (filePath) => ({ filePath, source: await readFile(filePath, "utf8") })),
);

const retiredTokens = ["--easy", "--long", "--quality", "--rest"];
const retiredSelectors = [
  "hito-ui-card",
  "hito-ui-sidebar-panel",
  "hito-analytics-grid",
  "hito-chart-hover-note",
  "hito-calendar-mobile-date-main",
  "hito-manual-workout-menu-template",
  "hito-onboarding-option-row-button",
  "hito-window-scroll-fill",
  "hito-window-header",
  "hito-window-header-compact",
  "hito-window-header-large",
  "hito-window-close",
  "hito-window-body",
  "hito-window-body-scroll",
  "hito-window-footer",
  "hito-window-footer-actions",
  "hito-window-footer-note",
];

for (const token of retiredTokens) assertNoTokenReference(token);
for (const selector of retiredSelectors) assertNoSourceReference(selector);

const foundations = await readFile(path.join(rootDir, "src/styles/foundations.css"), "utf8");
const geometryDefinitions = [
  ...foundations.matchAll(/(--hito-[a-z0-9-]*(?:width|height)[a-z0-9-]*)\s*:/gi),
].map((match) => match[1]);
if (geometryDefinitions.length > 0) {
  throw new Error(
    `Component geometry remains in foundations.css: ${geometryDefinitions.join(", ")}`,
  );
}

const figmaBoard = await readFile(
  path.join(rootDir, "src/components/hito-ds/figma-export-board.tsx"),
  "utf8",
);
const foundationsPage = await readFile(
  path.join(rootDir, "src/components/hito-ds/reference-foundations-page.tsx"),
  "utf8",
);
const lightPaletteReference = await readFile(
  path.join(rootDir, "src/components/hito-ds/light-palette-reference.tsx"),
  "utf8",
);
for (const [label, source] of [
  ["Figma board", figmaBoard],
  ["Foundations page", foundationsPage],
  ["Light palette reference", lightPaletteReference],
]) {
  if (!source.includes("HITO_DS_MANIFEST")) {
    throw new Error(`${label} does not consume the generated HITO_DS_MANIFEST.`);
  }
}

const manifest = JSON.parse(
  await readFile(path.join(rootDir, "src/generated/hito-ds-manifest.json"), "utf8"),
);
const exportedTokenNames = JSON.stringify(manifest.collections);
if (exportedTokenNames.includes("hito-workout")) {
  throw new Error("Workout-domain colors leaked into the shared foundation manifest.");
}
if (manifest.textStyles.length !== 14) {
  throw new Error(`Expected 14 reusable text styles, received ${manifest.textStyles.length}.`);
}
if (!manifest.sourceDigest?.startsWith("sha256:")) {
  throw new Error("Generated manifest is missing its deterministic source digest.");
}

for (const [index, spacing] of manifest.collections.primitiveSpacing.entries()) {
  const expectedAlias = `--spacing-hito-${spacing.id.replace("space-", "")}: var(${spacing.cssVariable});`;
  if (!foundations.includes(expectedAlias)) {
    throw new Error(`Tailwind spacing alias mismatch at manifest index ${index}: ${expectedAlias}`);
  }
}

console.log(
  `[hito-ds-foundation] cleanup ok: retiredTokens=${retiredTokens.length}, retiredSelectors=${retiredSelectors.length}, foundationGeometry=0`,
);

function assertNoTokenReference(token) {
  const tokenPattern = new RegExp(`${escapeRegExp(token)}(?![a-z0-9-])`, "i");
  const matches = sources.filter(({ source }) => tokenPattern.test(source));
  if (matches.length > 0) {
    throw new Error(
      `Retired token ${token} remains in: ${matches.map(({ filePath }) => path.relative(rootDir, filePath)).join(", ")}`,
    );
  }
}

function assertNoSourceReference(value) {
  const matches = sources.filter(({ source }) => source.includes(value));
  if (matches.length > 0) {
    throw new Error(
      `Retired selector ${value} remains in: ${matches.map(({ filePath }) => path.relative(rootDir, filePath)).join(", ")}`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const filePath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(filePath) : [filePath];
    }),
  );
  return nested.flat();
}
