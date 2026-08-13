import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getChangelogEntryCount,
  groupChangelogByMonth,
  groupMonthsByYear,
  parseChangelog,
  getTechnicalLogEntryCount,
  getTechnicalLogLastUpdated,
  groupTechnicalLogByMonth,
  parseTechnicalLog,
} from "../src/lib/changelog-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PUBLIC_CHANGELOG_PATH = path.join(repoRoot, "docs/history/changelog.md");
const TECHNICAL_LOG_PATH = path.join(repoRoot, "docs/history/technical-log.md");
const PRODUCT_HISTORY_DIGEST_PATH = path.join(repoRoot, "docs/history/product-history-digest.md");
const CHANGELOG_ROUTE_PATH = path.join(repoRoot, "src/routes/changelog.tsx");
const CHANGE_LOG_ROUTE_PATH = path.join(repoRoot, "src/routes/change-log.tsx");
const REQUIRED_TECHNICAL_PERIODS = [
  "2026-08-11",
  "2026-08-10",
  "2026-08-06",
  "2026-08-05",
  "2026-08-03",
  "2026-07-23",
  "2026-07-21",
  "2026-07",
  "2026-05 to 2026-06",
] as const;
const TECHNICAL_LOG_LAST_UPDATED = "2026-08-11";
const HISTORICAL_MIRROR_LABEL = "HISTORICAL / migrated public changelog mirror";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readFile(filePath: string) {
  assert(fs.existsSync(filePath), `Missing required file: ${path.relative(repoRoot, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function assertLocalMarkdownLinks(markdown: string, sourcePath: string) {
  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];

    if (/^(?:https?:|mailto:|#)/i.test(href)) {
      continue;
    }

    const targetPath = path.resolve(path.dirname(sourcePath), href.split("#", 1)[0]);
    assert(
      fs.existsSync(targetPath),
      `Broken Markdown link in ${path.relative(repoRoot, sourcePath)}: ${href}`,
    );
  }
}

const publicMarkdown = readFile(PUBLIC_CHANGELOG_PATH);
const technicalMarkdown = readFile(TECHNICAL_LOG_PATH);
const productHistoryDigestMarkdown = readFile(PRODUCT_HISTORY_DIGEST_PATH);
const changelogRoute = readFile(CHANGELOG_ROUTE_PATH);
const changeLogAliasRoute = readFile(CHANGE_LOG_ROUTE_PATH);

const publicDays = parseChangelog(publicMarkdown);
const technicalSections = parseTechnicalLog(technicalMarkdown);
const technicalPeriods = new Set(technicalSections.map((section) => section.period.source));
const technicalMonths = groupTechnicalLogByMonth(technicalSections);
const technicalYears = groupMonthsByYear(technicalMonths);

assert(publicDays.length > 0, "Public changelog parsed zero dated sections.");
assert(technicalSections.length > 0, "Technical log parsed zero compact decision sections.");
assert(technicalMonths.length > 0, "Technical log would render zero months.");
assert(technicalYears.length > 0, "Technical log would render zero years.");
assert(
  getTechnicalLogEntryCount(technicalSections) > 0,
  "Technical log parsed zero durable decisions.",
);
assert(
  getTechnicalLogLastUpdated(technicalMarkdown) === TECHNICAL_LOG_LAST_UPDATED,
  `Technical log Last Updated must be ${TECHNICAL_LOG_LAST_UPDATED}.`,
);

for (const period of REQUIRED_TECHNICAL_PERIODS) {
  assert(technicalPeriods.has(period), `Technical log is missing required period ${period}.`);
}

assert(
  !publicMarkdown.includes(HISTORICAL_MIRROR_LABEL),
  `Public changelog must not contain internal mirror label "${HISTORICAL_MIRROR_LABEL}".`,
);
assert(
  !technicalMarkdown.includes(HISTORICAL_MIRROR_LABEL),
  `Technical log must not retain retired mirror label "${HISTORICAL_MIRROR_LABEL}".`,
);
assert(
  technicalMarkdown.includes("Status: active durable decision index"),
  "Technical log must remain the compact durable decision index.",
);
assert(
  publicMarkdown.includes("For the compact internal decision index"),
  "Public changelog must describe the technical log as a compact decision index.",
);
assert(
  productHistoryDigestMarkdown.includes("curated public shipped-history source") &&
    productHistoryDigestMarkdown.includes("durable internal decision index"),
  "Product history digest must preserve the distinct public and technical history roles.",
);
assert(
  changelogRoute.includes(
    'import technicalLogMarkdown from "../../docs/history/technical-log.md?raw"',
  ),
  "Changelog route must import docs/history/technical-log.md?raw.",
);
assert(
  changelogRoute.includes("parseTechnicalLog(technicalLogMarkdown)"),
  "Changelog route must parse technicalLogMarkdown with the shared compact parser.",
);
assert(
  changelogRoute.includes("<TechnicalTimeline years={technicalLogYears} />"),
  "Changelog route Technical log tab must render technicalLogYears.",
);
assert(
  changelogRoute.includes("getHighlightMonths(publicChangelogDays)"),
  "Changelog route Highlights must derive from publicChangelogDays.",
);
assert(
  changelogRoute.includes("function TimelineDayGutter") &&
    (changelogRoute.match(/<TimelineDayGutter\b/g)?.length ?? 0) === 2 &&
    changelogRoute.includes('section.period.kind === "day"') &&
    !changelogRoute.includes("formatTechnicalLogPeriod"),
  "Highlights and day-kind Technical sections must share the route-owned TimelineDayGutter.",
);
assert(
  changeLogAliasRoute.includes('createFileRoute("/change-log")') &&
    changeLogAliasRoute.includes('to: "/changelog"'),
  "/change-log route must redirect to /changelog.",
);

for (const [markdown, sourcePath] of [
  [publicMarkdown, PUBLIC_CHANGELOG_PATH],
  [technicalMarkdown, TECHNICAL_LOG_PATH],
  [productHistoryDigestMarkdown, PRODUCT_HISTORY_DIGEST_PATH],
] as const) {
  assertLocalMarkdownLinks(markdown, sourcePath);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      public: {
        source: "docs/history/changelog.md",
        dates: publicDays.length,
        entries: getChangelogEntryCount(groupChangelogByMonth(publicDays)),
        latest: publicDays[0]?.date ?? null,
      },
      technical: {
        source: "docs/history/technical-log.md",
        sections: technicalSections.length,
        entries: getTechnicalLogEntryCount(technicalSections),
        lastUpdated: getTechnicalLogLastUpdated(technicalMarkdown),
        periods: technicalSections.map((section) => section.period.source),
        requiredPeriods: REQUIRED_TECHNICAL_PERIODS,
      },
      route: {
        alias: "/change-log -> /changelog",
        highlightsSource: "publicChangelogDays",
        technicalSource: "technicalLogYears",
      },
    },
    null,
    2,
  ),
);
