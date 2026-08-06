# Hito DS Neutral Selection Mechanics

## Work Item ID

2026-08-05-hito-ds-neutral-selection-mechanics

## Status

completed

## Type

change_request

## Priority

high

## Owner

design_system

## Scope

shared-design-system

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Consolidate only the neutral selection-item, safe-ID, enabled-item tab-stop, and ring-movement
mechanics shared by Hito Tabs and Radio while preserving their distinct component semantics and
public hook contracts.

## Stage

Completed Design System implementation, integrated independent QA, and exact release preparation,
Slice 8C.

## Next Recommended Role

design_system

## Exact Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Complete Slice 8C by replacing the demonstrated Tabs/Radio mechanics duplication with one small
internal neutral owner, preserving component-specific semantics and proving the result through the
canonical DS validator, Product/reference browser checks, independent QA, and an exact release.
```

## Execution Preflight

- Evidence: `hito-tabs.ts` and `hito-radio-group.ts` duplicate the selection-item shape, ID
  sanitizer, enabled-item fallback, and ring movement; Radio imports its item type from Tabs even
  though the components have separate contracts.
- Canonical owner: an internal neutral selection-mechanics module under `src/components/ui`, with
  recurrence protection in `validate-hito-ds-component-contracts.ts`.
- Outcome: both hooks consume only shared neutral mechanics; Tab/Radio role, ARIA, activation,
  suffix, orientation, key-map, focus, form, and controlled-state behavior remain local and exact.
- Proof: disabled/wrap/empty/ID deterministic assertions, consumer reachability, Product and
  `/hitoDS` pointer/keyboard/ARIA checks, light/dark desktop and exact 375px browser proof, static
  checks, build/integrity/runtime health, and independent QA.
- Stop: do not consolidate if the shared owner must absorb Tab- or Radio-specific semantics.

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Completion Receipt

- Root cause: Tabs and Radio separately owned the same item shape, ID sanitizer, enabled-item
  fallback, and wrap movement; Radio also imported its item type from Tabs. Existing DS validation
  passed despite that duplication, so recurrence protection was missing.
- Outcome: `hito-selection-mechanics.ts` is the sole neutral owner. Tabs and Radio retain separate
  roles, ARIA, ID suffixes, key maps, DOM activation, focus, and controlled-state behavior.
- Deleted: both duplicate mechanics blocks, the cross-contract Radio-to-Tabs type import, and one
  zero-use Radio hook import in the Hito DS reference.
- Guardrail: the canonical component validator now proves disabled, wrap, first/last, empty,
  all-disabled, nullable/unmatched, and ID behavior; exact importer, implementation-marker, type
  owner, key-map, role, suffix, and focus/click assertions include negative self-tests.

| Check                         | Scenario / environment                                | Result | Evidence                                                                                      |
| ----------------------------- | ----------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Root-cause discriminator      | Released baseline `df796cc`                           | Pass   | Exact duplicate blocks and Radio-to-Tabs type import; no external item-type consumer          |
| DS component contract         | Canonical validator, 327 files                        | Pass   | Shared owner, behavior matrix, importer allowlist, negative recurrence tests                  |
| Manifest/foundation           | Generated manifest check and cleanup proof            | Pass   | 38 primitive colors, 29 semantic colors, 14 text styles; retired residue remains absent       |
| Product/reference interaction | Built runtime, pointer and keyboard                   | Pass   | `/changelog` Tabs and `/hitoDS` Tabs/Radio preserve selection, focus, panel linkage, and ARIA |
| Responsive/themes             | 1470x801 and exact 375x812, light/dark                | Pass   | No page overflow; controls remain reachable and interactive                                   |
| Build/runtime                 | Fresh production build, integrity, real-mode loopback | Pass   | 207 runtime MJS files, 3,252 relative imports, routes return 200                              |
| Independent review            | ARCHITECT fix-forward plus QA source/check audit      | Pass   | Recurrence and dead-import findings fixed; final QA reports no findings                       |

`Implementation DoD: Passed` for Slice 8C. `Global QA Acceptance: Pending`.
