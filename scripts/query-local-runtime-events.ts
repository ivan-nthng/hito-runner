#!/usr/bin/env node
import {
  queryLocalRuntimeEvents,
  readLocalRuntimeArtifact,
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
  providerResponseId: readOption("--provider-response-id"),
  route: readOption("--route"),
  outcomeCode: readOption("--outcome"),
  limit: readIntegerOption("--limit"),
};

const events = await queryLocalRuntimeEvents(query);
if (args.includes("--raw-transcript")) {
  await printSelectedRawTranscript(events, query);
  process.exit(0);
}

for (const event of events) {
  console.log(JSON.stringify(event));
}

if (events.length === 0) {
  console.error(
    `[local-runtime-events] no matching active events under ${resolveLocalRuntimeRoot(query.root)}`,
  );
}

async function printSelectedRawTranscript(
  events: Awaited<ReturnType<typeof queryLocalRuntimeEvents>>,
  eventQuery: LocalRuntimeEventQuery,
) {
  if (!eventQuery.requestId && !eventQuery.generationId && !eventQuery.providerResponseId) {
    throw new Error(
      "--raw-transcript requires --request-id, --generation-id, or --provider-response-id.",
    );
  }

  const paths = [
    ...new Set(
      events.map((event) => event.rawArtifactPath).filter((path): path is string => !!path),
    ),
  ];
  if (paths.length === 0) {
    throw new Error("No raw provider transcript matches the selected correlation ID.");
  }
  if (paths.length > 1) {
    throw new Error("The selected correlation ID matches more than one raw provider transcript.");
  }

  const artifact = await readLocalRuntimeArtifact({
    rawArtifactPath: paths[0]!,
    root: eventQuery.root,
  });
  process.stdout.write(artifact.contents);
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
  --provider-response-id <id>
  --route <pathname>
  --outcome <safe outcome code>
  --limit <1-1000>
  --include-archive
  --raw-transcript  Explicitly print one selected raw provider sidecar
  --root <local observability root>`);
}
