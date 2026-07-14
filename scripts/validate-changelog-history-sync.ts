import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getChangelogEntryCount,
  groupChangelogByMonth,
  groupMonthsByYear,
  parseChangelog,
} from "../src/lib/changelog-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PUBLIC_CHANGELOG_PATH = path.join(repoRoot, "docs/history/changelog.md");
const TECHNICAL_LOG_PATH = path.join(repoRoot, "docs/history/technical-log.md");
const CHANGELOG_ROUTE_PATH = path.join(repoRoot, "src/routes/changelog.tsx");
const CHANGE_LOG_ROUTE_PATH = path.join(repoRoot, "src/routes/change-log.tsx");
const TECHNICAL_LOG_CUTOFF = "2026-07-08";
const REQUIRED_TECHNICAL_DATES = ["2026-07-13", "2026-07-07", "2026-05-05"] as const;
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

const publicMarkdown = readFile(PUBLIC_CHANGELOG_PATH);
const technicalMarkdown = readFile(TECHNICAL_LOG_PATH);
const changelogRoute = readFile(CHANGELOG_ROUTE_PATH);
const changeLogAliasRoute = readFile(CHANGE_LOG_ROUTE_PATH);

const publicDays = parseChangelog(publicMarkdown);
const technicalDays = parseChangelog(technicalMarkdown);
const publicDates = new Set(publicDays.map((day) => day.date));
const technicalDates = new Set(technicalDays.map((day) => day.date));
const technicalMonths = groupChangelogByMonth(technicalDays);
const technicalYears = groupMonthsByYear(technicalMonths);
const missingPublicDates = Array.from(publicDates).filter((date) => !technicalDates.has(date));
const oldestTechnicalDate = technicalDays
  .map((day) => day.date)
  .sort((left, right) => left.localeCompare(right))[0];

assert(publicDays.length > 0, "Public changelog parsed zero dated sections.");
assert(technicalDays.length > 0, "Technical log parsed zero dated sections.");
assert(technicalMonths.length > 0, "Technical log would render zero months.");
assert(technicalYears.length > 0, "Technical log would render zero years.");
assert(
  missingPublicDates.length === 0,
  `Technical log is missing public changelog date(s): ${missingPublicDates.join(", ")}`,
);
assert(
  oldestTechnicalDate < TECHNICAL_LOG_CUTOFF,
  `Technical log must include history before ${TECHNICAL_LOG_CUTOFF}; oldest parsed date is ${oldestTechnicalDate}.`,
);

for (const date of REQUIRED_TECHNICAL_DATES) {
  assert(technicalDates.has(date), `Technical log is missing required date ${date}.`);
}

assert(
  !publicMarkdown.includes(HISTORICAL_MIRROR_LABEL),
  `Public changelog must not contain internal mirror label "${HISTORICAL_MIRROR_LABEL}".`,
);
assert(
  technicalMarkdown.includes(HISTORICAL_MIRROR_LABEL),
  `Technical log must retain internal mirror label "${HISTORICAL_MIRROR_LABEL}" for migrated history.`,
);
assert(
  changelogRoute.includes(
    'import technicalLogMarkdown from "../../docs/history/technical-log.md?raw"',
  ),
  "Changelog route must import docs/history/technical-log.md?raw.",
);
assert(
  changelogRoute.includes("parseChangelog(technicalLogMarkdown)"),
  "Changelog route must parse technicalLogMarkdown with the shared parser.",
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
  changeLogAliasRoute.includes('createFileRoute("/change-log")') &&
    changeLogAliasRoute.includes('to: "/changelog"'),
  "/change-log route must redirect to /changelog.",
);

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
        dates: technicalDays.length,
        entries: getChangelogEntryCount(technicalMonths),
        latest: technicalDays[0]?.date ?? null,
        oldest: oldestTechnicalDate,
        requiredDates: REQUIRED_TECHNICAL_DATES,
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
