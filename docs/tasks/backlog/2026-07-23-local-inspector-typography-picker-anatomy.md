# Local Inspector Typography Picker Anatomy

## Work Item ID

2026-07-23-local-inspector-typography-picker-anatomy

## Status

completed

## Type

change_request

## Priority

high

## Owner

frontend

## Scope

local-devtools-inspector

## Archive Intent

retain_in_place

## Frontend Lane

devtools

## Task

Record the accepted Local Inspector typography picker anatomy without changing typography
provenance or replacement semantics.

## Stage

FRONTEND implementation and integrated QA complete. Broader Global QA remains a separate release
gate.

## Parent Reference

`docs/tasks/frontend-specs/2026-07-23-hito-typography-provenance-and-inspector-preview-contract.md`
is accepted for provenance, the 19-role inventory, and the 14-role replacement boundary. This task
changes only the picker anatomy that followed that accepted work.

## Demonstrated Root Cause

The accepted picker renders a vertical label followed by a word-based sample and deliberately omits
technical metadata. That is truthful but inefficient for rapid visual comparison: the selected
element's content and the central role samples dominate the menu rather than the typeface itself.

## Product Decision

Every picker option uses one compact, stable two-column anatomy:

```text
[ Ab ]  [ Page title / Custom ]
        [ Fraunces - 28px - 400 - lh 1.1 ]
```

- The left specimen is always the literal glyph pair `Ab`, with an uppercase `A` and lowercase `b`.
  It never uses the selected element's copy or a role's sentence-length sample.
- The specimen is a font sample, not a rendered-copy simulation. It preserves the literal case of
  `Ab`; any role case treatment remains visible in the technical descriptor instead.
- The first item stays first and represents `Keep current`. Its right-side label is the confirmed
  Hito role name, recognition-only component role name, or `Custom`; it must not use visible
  `Current` as the style name.
- A confirmed current item renders `Ab` through its actual computed typography. `Custom` does the
  same, but remains `Custom` unless inherited provenance confirms a canonical role.
- Each of the existing 14 safe replacement options renders `Ab` through its real central role class,
  uses its existing central label, and displays its central technical specification.
- The technical line is concise and readable. It may express family, size, weight, line height,
  tracking, style, or case as applicable, but never class names, role ids, diagnostics, or a new
  local token model.
- `Ab` must remain visibly uppercase `A` and lowercase `b` for every current and replacement
  specimen. It is a font specimen, so role or current `text-transform` must not alter those glyphs.
- The five recognition-only component roles remain absent from the replacement list. Their current
  first-item preview remains truthful when selected.

## Preserved Boundaries

- Keep `HITO_TYPOGRAPHY_ROLES` as the sole 19-role inventory and the existing 14-role selectable
  subset.
- Preserve inherited `--hito-typography-role` provenance; computed values and visual similarity do
  not confirm ownership.
- Do not add a typography role, registry, matcher, generic DS primitive, persistence path, or prompt
  behavior.
- Do not change selected product typography. This remains a prompt-only Inspector selection.

## Definition Of Done

- Current confirmed, current component-owned, and current Custom states all show literal `Ab`, the
  truthful label, and one concise descriptor.
- All 14 replacement options show literal `Ab`, their central label, and central technical spec.
- The menu remains keyboard-accessible, contained, legible, and scrollable on desktop and exact
  `375px` in both themes.
- Existing selection, clear, Escape, focus return, pending change, and prompt behavior remain
  unchanged.
- Required owner validation covers source truth, current/role/custom anatomy, accessibility,
  responsive containment, targeted lint, production build, integrity, runtime health, cleanup, and
  scoped diff hygiene.

## Stop Conditions

Stop and report if this anatomy requires a new typography role, expands the safe replacement subset,
changes provenance rules, or conflicts with an active concurrent migration of the Inspector owners.

## Accepted Completion

The active Inspector path now renders literal `Ab` in every current and replacement specimen, with
case preserved independently of source `text-transform`. The first item exposes a truthful confirmed
role, component-owned role, or `Custom` label and computed descriptor; the 14 replacement options
use their existing central labels, classes, and specifications. No role, registry, CSS recipe,
prompt path, persistence path, or replacement boundary was added.

Owner-level browser, responsive, keyboard, accessibility, prompt, runtime, build, integrity,
cleanup, and scoped-diff evidence passed. The accepted proof folder is
`qa-artifacts/screenshots/2026-07-23/local-inspector-typography-picker-anatomy-followup/`.
