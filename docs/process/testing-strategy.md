# Testing Strategy

Normative process rules are defined in `AGENTS.md`.

## Smoke Tests

Recommended for every significant change:

- main route loads
- core workflow loads
- one key action succeeds

## Critical Flows

Run before release when affected:

- intake/creation path
- transformation/normalization path
- review/moderation path
- publish/trusted-output path

## Regression Tests

Use targeted scripts and UI checks for:

- changed interactions
- changed validations
- changed workflows

## Data Validation

Validate:

- completeness
- consistency
- correctness
- trusted-output integrity
