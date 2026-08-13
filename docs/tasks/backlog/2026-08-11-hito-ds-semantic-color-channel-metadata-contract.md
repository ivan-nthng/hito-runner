# Hito DS Semantic Color Channel Metadata Contract

## Work Item ID

2026-08-11-hito-ds-semantic-color-channel-metadata-contract

## Status

completed

## Type

design-system-contract

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Add a single canonical, generated Design System metadata contract for every existing semantic
colour role. The generated manifest must expose a human-readable role label and the channels for
which that role is an allowed choice: `text`, `fill`, and/or `border`.

This is the upstream prerequisite for the blocked local Inspector Color property control. It owns
the existing semantic-color manifest/generator and necessary validation only. It does **not**
implement the Inspector UI or its draft state, change colour values, alter Product CSS, or update
Figma.

## Archive Intent

retain_in_place

## Task

Make the semantic-colour manifest capable of answering two factual questions from one canonical
Design System source:

1. What is this semantic role called in a human interface?
2. Is it an allowed semantic option for Text, Fill, and/or Border?

The contract must be generated alongside the existing `id`, `cssVariable`, and Dark/Light values.
It must let a downstream local tool offer only channel-appropriate semantic options without
inferring meaning from a token name or importing a private Foundations catalogue.

The contract is descriptive metadata. It does not say that a selected page element currently uses
the role, does not apply a style, and does not change any current semantic/primitive value.

## User Report

Ivan asked to resume the Inline Inspector's Color control: a selected element can expose factual
Text, Fill, and Border channels; one direct channel is selected directly, while several use the
existing expand/collapse affordance. The control must offer existing Hito semantic colours, show a
human name and preview, and serialise an explicit channel-level `Remove color` request without
changing the inspected DOM.

The previous Frontend DevTools attempt correctly stopped because the generated manifest did not
know either the semantic role's human label or its Text/Fill/Border applicability. A DevTools
token-name heuristic and a second `desiredColors` state map were rejected as non-canonical.

## Observed Behavior

- `src/generated/hito-ds-manifest.ts` and `.json` semantic-colour records currently contain only
  `id`, `cssVariable`, and per-theme `value` / `alias`.
- `scripts/generate-hito-ds-manifest.mjs` creates those records through
  `combineSemanticModes()`; it has no role-label or channel-applicability owner.
- `src/components/hito-ds/reference-foundations-page.tsx` has private
  `SEMANTIC_COLOR_SECTIONS` display grouping. It is not an exported semantic-choice contract and
  cannot be copied or imported by DevTools.
- The blocked downstream task is
  [Local UI Inspector Color Property Control](2026-08-11-local-ui-inspector-color-property-control.md).
- The queued Foundations provenance task is
  [Foundations Color Provenance And Context Readability](2026-08-11-hito-ds-foundations-color-provenance-and-context-readability.md).
  It may later consume this metadata, but it must not be silently implemented as part of this
  prerequisite.

## Demonstrated Root Cause

Semantic values alone do not encode permitted UI-channel usage. A current computed CSS value may
be matched to a manifest value, but it cannot truthfully determine whether the matching semantic
role is a Text, Fill, or Border choice. The first missing owner is therefore the Design System
semantic-role/manifest contract, not the DevTools renderer.

## Accepted Product Direction

### Canonical metadata

- Every generated semantic-colour record receives a stable human `label` and a stable channel
  applicability field, using the exact existing semantic role IDs as the public identifiers.
- Use a deliberately small closed vocabulary: `text`, `fill`, `border`. Do not add Inspector
  concepts, CSS property names, selected-element state, or a generic arbitrary-property taxonomy.
- A role can be applicable to more than one channel only when that is a real approved semantic
  use. Do not make every role universally selectable merely to avoid classification.
- The source must be canonical and Design-System-owned. If CSS declarations alone cannot convey
  permitted usage, a compact semantic-role metadata declaration at the existing generator/manifest
  seam is acceptable. It must be the only such declaration, must be consumed to generate the
  manifest, and must not be duplicated in DevTools or Foundations.
- Generate labels deterministically from the canonical metadata/role where that is sufficient;
  do not create a second hand-maintained human-name catalogue merely for title case.

### Classification criteria

- `text` means the role is an intentional foreground/content choice on a compatible existing
  surface. It is not an assertion that every foreground role can replace text everywhere.
- `fill` means the role is an intentional background/solid/tinted/chrome fill choice.
- `border` means the role is an intentional visible edge, divider, outline, or ring choice.
- Preserve semantic meaning: structural surfaces, neutral chrome/overlays, action roles, text
  hierarchy, and status/intent roles must not become interchangeable merely because their
  resolved colour happens to match in one theme.
- Existing Dark/Light values, alpha formulas, aliases, contrast decisions, workout semantic
  slots, and global theme resolution remain exactly as they are. This task classifies roles; it
  does not recolour them.

### Downstream contract

- The generated TypeScript and JSON manifests must contain the same metadata and remain in parity.
- The local Inspector may later filter semantic options from this generated metadata only. It must
  not infer channels from token-ID substrings, borrow `SEMANTIC_COLOR_SECTIONS`, or maintain a
  second mapping.
- Unknown/computed page colours remain `Custom (computed)` downstream; this task does not invent
  a semantic match for them.
- `Remove color` remains a downstream per-channel draft request. It is not a semantic colour role
  and does not belong in this manifest.

## Existing Seams To Reuse

- `src/styles/foundations.css` — canonical primitive and semantic Dark/Light token definitions;
  read only for this task unless an existing export annotation is demonstrably the smallest
  canonical metadata seam.
- `scripts/generate-hito-ds-manifest.mjs` — canonical manifest construction and the required
  semantic metadata owner.
- `src/generated/hito-ds-manifest.ts` and `.json` — generated downstream contract; never edit by
  hand.
- `scripts/validate-hito-ds-component-contracts.ts` — existing manifest/Design System validation
  owner.
- `src/components/hito-ds/reference-foundations-page.tsx` — inspect only to establish that its
  private display grouping is not reused as a second registry. A no-behaviour-change migration to
  generated metadata is permitted only if it removes this exact duplicate without expanding the
  task into the separate Foundations provenance work.
- `docs/tasks/backlog/2026-08-11-local-ui-inspector-color-property-control.md` — blocked
  downstream consumer; do not implement it here.

## Reuse-First Change Budget

- Reuse the existing generator, semantic-colour records, generated output, validator, canonical
  role IDs, and theme values.
- New production runtime artifacts: **none**. A small build-time metadata declaration is allowed
  only if the generator cannot derive applicability from canonical CSS; it must replace the
  rejected DevTools-only predicate, not create a parallel role system.
- Do not add a component, CSS recipe, route, colour picker, persistence, Figma mapping, second
  manifest, primitive collection, or product consumer.
- Simplify rather than duplicate: remove any task-owned, newly introduced role-to-channel mapping
  outside the chosen canonical DS owner. Preserve unrelated dirty candidates byte-for-byte and
  identify them rather than deleting them.

## What Not To Touch

- Do not implement or edit `src/components/devtools/**`, local Inspector draft/payload state, or
  the supplied `color` icon; those remain with the blocked Frontend DevTools task.
- Do not alter semantic or primitive colour values, alpha ladder, CSS theme selectors, contrast
  policy, workout colour slots, Product CSS/components/routes, Backend, persistence, fixtures,
  dependencies, Figma, hosted state, or release/Git state.
- Do not expose raw primitive hue choices to Product or DevTools.
- Do not create a generic token capability engine, arbitrary CSS-property model, static second
  Light palette, or compatibility mapping.

## Definition Of Done

1. Every semantic-colour manifest record has a truthful human label and canonical `text` / `fill`
   / `border` applicability metadata in both generated JSON and TypeScript outputs.
2. Classification is single-source and auditable. It neither depends on DevTools substring
   heuristics nor treats private Foundations display data as the semantic-option API.
3. Existing Dark/Light `value` / `alias` output, semantic IDs, primitive collection, and manifest
   consumers remain compatible or have an explicit, validated additive schema migration.
4. The validator proves manifest parity, complete semantic-role coverage, valid closed-vocabulary
   channels, and absence of a newly task-owned duplicate mapping outside the canonical owner.
5. The blocked Inspector item can be truthfully advanced to `ready` with no source edit to its
   runtime control. Its existing requirements for observed channel detection and no live style
   mutation remain unchanged.

## Validation Expectations

| Check                     | Scenario / environment                                                          | Required evidence                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Contract inventory        | Every current generated semantic role                                           | Label is present; channel list uses only `text`, `fill`, `border`; no role is silently omitted.                                      |
| Classification review     | Surfaces, borders/rings, text hierarchy, neutral chrome, actions, status/intent | Each role's permitted channels are semantically defensible in Dark and Light; same resolved value does not erase role distinction.   |
| Generator parity          | Generator → JSON → TypeScript                                                   | Generated files match, deterministic output passes check mode, and existing consumers compile.                                       |
| Duplicate/ownership audit | DevTools and Foundations sources                                                | No DevTools predicate/private-Foundation import becomes the canonical data source; any task-owned duplicate is removed.              |
| DS validation             | Existing manifest/component checks                                              | Updated contract assertions pass without weakening unrelated checks.                                                                 |
| Browser                   | `/hitoDS/foundations`, desktop and `375×812`, Dark/Light                        | Required only if a task-owned Foundations consumer changes; preserve current Foundations interaction/containment and console health. |
| Hygiene/build             | Task-owned source                                                               | Focused format, ESLint, `git diff --check`, and an uncontended production build or factual shared-build boundary.                    |
| Runtime boundary          | Fixture QA server                                                               | If stopped during proof, restart the managed `qa_fixture` server before the final receipt.                                           |

## Stage

Completed. The generated semantic-colour manifest now owns stable labels and channel applicability;
the Inspector Color control is unblocked but remains a separate Frontend DevTools implementation.

## Next Recommended Role

frontend

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Add the single canonical semantic-color label and Text/Fill/Border applicability metadata
contract to the generated Hito DS manifest. This is the prerequisite for the blocked local
Inspector Color control; do not implement Inspector UI.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-semantic-color-channel-metadata-contract.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `docs/tasks/backlog/2026-08-11-local-ui-inspector-color-property-control.md`
- `docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-provenance-and-context-readability.md`
- `src/styles/foundations.css`
- `scripts/generate-hito-ds-manifest.mjs`
- `src/generated/hito-ds-manifest.ts` and `.json`
- `scripts/validate-hito-ds-component-contracts.ts`
- current manifest consumers, including Foundations and local Inspector sources, read-only.

Preflight: preserve unrelated dirty work. The demonstrated root cause is that the generated
semantic-colour manifest provides id, CSS variable and Dark/Light values but no human label or
channel applicability. The first incorrect owner is the canonical DS manifest/generator seam, not
DevTools. Reuse that generator and manifest; proposed runtime artifacts: none. A compact
build-time metadata declaration is permitted only if CSS cannot express applicability; it must be
the sole canonical owner and replace—not duplicate—the rejected DevTools token-name predicate.

Implement a stable, generated label and closed-vocabulary channel metadata (`text`, `fill`,
`border`) for every existing semantic role. Classify deliberately: text/content roles, structural
and neutral/action fills, and visible edges/rings are not automatically interchangeable. Do not
make every semantic role selectable in every channel. Preserve exact role IDs, Dark/Light values,
aliases, alpha/mix formulas, contrast decisions, global theme resolution, primitive data, workout
semantic slots, Product consumers, Figma, and all unrelated dirty work.

Generated TypeScript and JSON must carry identical metadata. Update the existing DS validator to
prove full semantic coverage, valid channels, generated parity, and single canonical ownership.
Do not modify `src/components/devtools/**`, the Inspector icon, draft/payload logic, Product CSS,
backend, or token values. Do not build a generic capability framework, a raw primitive option
palette, or a second manifest.

Use one bounded read-only DESIGNER subagent to review semantic classification only, and one
bounded read-only QA/source subagent after your own proof to review generated parity and existing
consumer safety. Integrate their findings; do not delegate implementation.

Validate generator check mode, manifest/DS validator, focused format/lint/diff, and an
uncontended production build. Run `/hitoDS/foundations` desktop and exact 375×812 in Dark/Light
only if a task-owned Foundations consumer changes; otherwise explain why browser scope was not
needed. If proof stops the fixture QA server, restart it before final receipt.

When successful, mark this item completed and advance
`2026-08-11-local-ui-inspector-color-property-control.md` to `ready` by updating only its
lifecycle/blocker facts. Do not implement that Frontend DevTools task. Use Russian for visible
in-progress commentary and an English formal receipt in the canonical task. Do not stage, commit,
push, deploy, access hosted state, call providers, or delete material data.
```

## Blockers

None. The prior absence of a canonical label/applicability contract is this task's work, not a
reason to leave it in Product or DevTools.

## Tracked Implementation Receipt — 2026-08-11

### Preflight and outcome

- Reused the existing semantic token export, manifest generator, generated TypeScript/JSON
  artifacts, and Design System validator. New runtime artifacts: none.
- Root cause confirmed by red proof: all 41 generated semantic-colour records lacked both `label`
  and `channels`, while the pre-existing generator parity check passed.
- Added one generator-owned `SEMANTIC_COLOR_CHANNELS` declaration and deterministic Title Case
  labels derived from stable role IDs. The manifest schema advances additively to version 2.
- Final applicability inventory: 18 text roles, 17 fill roles, and 11 border roles. The five intent
  roles `destructive`, `signal`, `info`, `warn`, and `success` intentionally support both fill and
  border. Raw intent roles are not text options; their foreground/content roles remain distinct.
- The existing semantic IDs, CSS variables, Dark/Light values, aliases, alpha/mix formulas,
  primitive collection, workout exclusions, and theme resolution remain unchanged.

### Files changed

- `scripts/generate-hito-ds-manifest.mjs`
- `src/generated/hito-ds-manifest.ts`
- `src/generated/hito-ds-manifest.json`
- `scripts/validate-hito-ds-component-contracts.ts`
- this canonical item
- `docs/tasks/backlog/2026-08-11-local-ui-inspector-color-property-control.md` — lifecycle and
  blocker facts only

No Foundations, Figma-board, DevTools runtime, Product, token-value, Backend, persistence, provider,
or hosted source was changed by this task.

### Validation inventory

| Check                            | Scenario / environment                                            | Result            | Evidence                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red/green contract discriminator | Generated JSON semantic inventory                                 | Passed            | Before: 41/41 missing labels and channels. After: 41/41 complete, with non-empty closed-vocabulary channel lists.                                                                                   |
| Classification review            | All semantic role families                                        | Passed            | Read-only DESIGNER approved the 41-role map, including `input` as border, `chrome-clear` as fill, and intent roles as fill plus border.                                                             |
| Generator parity                 | `node --import tsx scripts/generate-hito-ds-manifest.mjs --check` | Passed            | 43 primitive colours, 41 semantic colours, and 18 text styles; generated artifacts match the canonical generator.                                                                                   |
| DS manifest/component contract   | `npm run validate-hito-ds-components`                             | Passed            | 321 source files scanned; generated TS/JSON structural parity, schema v2, export coverage, valid channels, and single metadata ownership passed.                                                    |
| Formatting and lint              | Focused Prettier check and ESLint on changed source/generated TS  | Passed            | All focused files matched formatting and lint rules.                                                                                                                                                |
| Diff hygiene                     | `git diff --check`                                                | Passed            | No whitespace errors; unrelated dirty work remained preserved.                                                                                                                                      |
| Production build                 | Fresh uncontended `npm run build`                                 | Passed            | Client, SSR, and Nitro production bundles completed; existing non-fatal chunk-size and dependency directive warnings remained warnings.                                                             |
| Managed local runtime            | Build restoration and status                                      | Passed            | The build stopped the canonical server as designed; `qa:server:start` restored the existing `real` provider mode and `qa:server:status` reported managed, loopback, compatible, healthy, and fresh. |
| Independent source QA            | Generated parity and consumer safety                              | Passed            | Reviewer confirmed the additive schema, one canonical metadata owner, unchanged values/modes, preserved consumers, and no task-owned DevTools/Foundations edit.                                     |
| Browser matrix                   | `/hitoDS/foundations`                                             | Not run by design | No task-owned rendered Foundations or other consumer source changed. Static parity, compile/build, and consumer review cover this additive data contract; no visual claim is made.                  |

### Preserved boundary and next owner

The pre-existing dirty DevTools token-name predicate was not edited or accepted as canonical by this
task. The generated manifest now supersedes that inference source; FRONTEND DevTools owns removing
the predicate and consuming `label` / `channels` while completing the ready Inspector item. This is
focused Implementation DoD only, not Global QA Acceptance, hosted validation, release readiness, or
deployment evidence.
