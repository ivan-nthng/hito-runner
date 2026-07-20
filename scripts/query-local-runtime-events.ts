#!/usr/bin/env node
import {
  queryLocalRuntimeEvents,
  resolveLocalRuntimeRoot,
  type LocalRuntimeEventQuery,
} from "../src/lib/local-runtime-observability";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const query: LocalRuntimeEventQuery = {
  root: readOption("--root"),
  includeArchive: args.includes("--include-archive"),
  since: readOption("--since"),
  until: readOption("--until"),
  requestId: readOption("--request-id"),
  generationId: readOption("--generation-id"),
  route: readOption("--route"),
  outcomeCode: readOption("--outcome"),
  limit: readIntegerOption("--limit"),
};

const events = await queryLocalRuntimeEvents(query);
for (const event of events) {
  console.log(JSON.stringify(event));
}

if (events.length === 0) {
  console.error(
    `[local-runtime-events] no matching active events under ${resolveLocalRuntimeRoot(query.root)}`,
  );
}

function readOption(name: string) {
  const equalsEntry = args.find((entry) => entry.startsWith(`${name}=`));
  if (equalsEntry) {
    return equalsEntry.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? null) : null;
}

function readIntegerOption(name: string) {
  const raw = readOption(name);
  if (!raw) return undefined;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage: npm run local:logs -- [filters]

Reads only the latest three active calendar-day partitions by default.

Filters:
  --since <ISO timestamp>
  --until <ISO timestamp>
  --request-id <id>
  --generation-id <id>
  --route <pathname>
  --outcome <safe outcome code>
  --limit <1-1000>
  --include-archive
  --root <local observability root>`);
}
