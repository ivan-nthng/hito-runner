# Logging Conventions

Normative execution/debugging rules are defined in `AGENTS.md`.

## Local Runtime Contract

- JSON Lines (`.jsonl`)
- one valid JSON object per line
- ignored root: `logs/local-runtime-observability/`
- active search window: latest three calendar days under `active/`
- older days: moved to `archive/` and excluded from normal searches
- query: `npm run local:logs -- --request-id <id>|--generation-id <id>|--route <path>|--outcome <code>`
- archived evidence is searched only with `--include-archive`
- archive deletion is not automatic

## Allowed Fields

- `timestamp`
- `category`
- `event`
- `status`
- `phase`
- `outcomeCode`
- `requestId`
- `generationId`
- sanitized `route`, `method`, and server-function identifier
- bounded timing, row-count, provider-kind, response-ID, parse/normalization status, and diagnostic-code metadata

Never record request bodies, query values, headers, cookies, credentials, auth tokens, raw prompts,
provider payloads, database rows, runner free text, PII, or raw error messages. The canonical writer
is enabled only when the managed server supplies an actual loopback runtime URL.

## Debugging Usage

- start from log evidence before proposing fixes
- search the active window by request, generation, route, or outcome before reading transport logs
- correlate request and server-action events by `requestId`
- correlate provider, parse, compiler, review, and persistence phases by `generationId`
- use safe reason and compiler diagnostic codes to locate the failing canonical owner
