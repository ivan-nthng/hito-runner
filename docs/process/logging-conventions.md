# Logging Conventions

Normative execution/debugging rules are defined in `AGENTS.md`.

## Recommended Format

- JSON Lines (`.jsonl`)
- one valid JSON object per line

## Recommended Fields

- `timestamp`
- `run_id`
- `entity_id`
- `action`
- `status`
- `step`
- `error`
- `details`

## Debugging Usage

- start from log evidence before proposing fixes
- trace from run-level event to entity-level event to failing step
