# Hito DS Workbench Controls And Validation Convergence

## Work Item ID

2026-08-05-hito-ds-workbench-controls-and-validation-convergence

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

Consolidate the duplicated generic Choice and Select settings controls used by the Calendar and
Workout Library reference playgrounds, and make the evergreen foundation-cleanup proof reachable
through the canonical package-owned Hito DS validator.

## Stage

Design System implementation and integrated independent QA completed; exact Slice 8D release.

## Next Recommended Role

product

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the completed Slice 8D receipt and admit the next evidence-gated parent-program slice only
when its canonical owner is idle. Preserve the active Frontend FIT work and do not reopen the
released Design System boundary without a new failing discriminator.
```

## Execution Preflight

- Evidence: Calendar and Workout Library each declare the same generic Choice/Select composition;
  their only presentation difference is the Workout Library's layout-safe `min-w-0`. The evergreen
  foundation proof is a standalone manual script that package scripts do not reach.
- Canonical owners: one reference-only workbench settings module under `src/components/hito-ds`, and
  `scripts/validate-hito-ds-component-contracts.ts` as the package-reachable DS validation root.
- Outcome: both playgrounds consume one narrow settings composition; all retired-token, retired-
  selector, geometry, manifest-owner, domain-color, text-style, digest, and spacing-alias assertions
  run through `npm run validate-hito-ds-components`; duplicate controls and the old root disappear.
- Proof: source/import reachability and negative recurrence checks, assertion parity, manifest check,
  32-identity preservation, pointer/keyboard/ARIA/width proof at desktop and exact 375px in both
  themes, lint/format, build/integrity/runtime, independent review, and exact release.
- Stop: do not proceed through any branch that requires a public component API, broad workbench
  framework, parallel validator, Calendar semantic/geometry change, or Workout Library identity
  change.

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Current Evidence

- `calendar-workout-playground.tsx` and `workout-library-playground.tsx` each own local
  `ChoiceControl` and `SelectControl` functions built from the same Hito Choice Toggle, Radio hook,
  form label, and Select primitives.
- `validate-hito-ds-foundation-cleanup.mjs` proves four retired tokens, 17 retired selectors, zero
  foundation geometry, three manifest-backed reference owners, no workout-domain manifest leak, 14
  text styles, a deterministic digest, and spacing-alias parity, but no `package.json` script reaches
  it.

## Completion Receipt

- One reference-only owner now composes the existing Hito Choice Toggle, Radio, form-label, and
  Select primitives for Calendar and Workout Library playground settings. The four expected
  consumer imports are exact-set validated; no Product route imports this owner.
- Calendar and Workout Library no longer carry local Choice/Select implementations or separate
  option shapes. Calendar meaning and geometry remain distinct from the 32-identity Workout
  Library; the shared owner contains no domain branch or variant API.
- All evergreen assertions from the deleted standalone foundation-cleanup proof now run through
  `npm run validate-hito-ds-components`. Generation remains separate through
  `generate-hito-ds-manifest.mjs --check`; TypeScript and JSON manifest consumers are unchanged.
- The first independent review found that a global function-name guard could reject an unrelated
  Product component and miss a renamed local copy. Fix-forward scoped the discriminator to the two
  former owners, detects direct primitive bypasses independent of wrapper names, permits unrelated
  same-name controls, and reports the actual four-file importer set. Independent recheck passed.

## Deletion Ledger

- Deleted two local `ChoiceControl` implementations and two local `SelectControl` implementations.
- Deleted the Calendar `Option` and Workout Library `WorkoutLibraryOption` duplicates.
- Deleted `scripts/validate-hito-ds-foundation-cleanup.mjs` after assertion parity and canonical
  package reachability passed.
- Retained the historical mention of the old proof root in an unrelated Runner Activity inventory;
  it is documentation history, not an executable or package-reachable validation path.

## Validation Receipt

| Check                    | Scenario / environment                               | Result                 | Evidence                                                                                                       |
| ------------------------ | ---------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator | Source and importer graph                            | Pass                   | Two former owners had duplicate primitive compositions; one standalone proof had no package entrypoint         |
| Shared settings owner    | Calendar and Workout Library source                  | Pass                   | One reference-only owner, exact four importers, no Product dependency or domain branch                         |
| Recurrence guard         | Validator self-tests                                 | Pass                   | Renamed former-owner bypass fails; unrelated same-name Product control passes; missing or extra importer fails |
| Canonical DS proof       | `npm run validate-hito-ds-components`                | Pass                   | 328 files; 4 workbench consumers; 32 identities; 4 retired tokens; 17 retired selectors; 14 text styles        |
| Manifest parity          | `node scripts/generate-hito-ds-manifest.mjs --check` | Pass                   | 38 primitive colors, 29 semantic colors, 14 text styles                                                        |
| Calendar controls        | Chrome, 1470x801 and 375x812, light/dark             | Pass                   | Arrow and pointer selection, truthful ARIA, Select choice and focus return; 368px/327px contained width        |
| Workout Library          | Chrome, 1470x801 and 375x812, light/dark             | Pass                   | `32 of 32`, family filter `3 of 32`, Choice/Select focus return, no overflow                                   |
| Browser/runtime health   | Built loopback runtime                               | Pass                   | `/hitoDS/components` and `/hitoDS/patterns` return 200; no browser warning/error; provider mode remains `real` |
| Static quality           | Scoped ESLint, Prettier, and diff checks             | Pass                   | All commands exited 0                                                                                          |
| Production build         | Fresh `npm run build`                                | Pass                   | 7,732 client modules plus SSR/Nitro/postbuild completed; known chunk-size warning only                         |
| Build integrity          | `node scripts/validate-build-output-integrity.mjs`   | Pass                   | 207 runtime MJS files and 3,252 relative imports verified                                                      |
| Independent review       | Architecture review then independent DS QA           | Pass after fix-forward | Brittle global guard corrected; final QA found no P1-P3 issue                                                  |

## Preserved Boundaries And Omissions

- No Product route, Calendar data/geometry, Workout Library identity, manifest representation,
  backend, auth, provider, persistence, fixture, DevTools, package, or dependency contract changed.
- Safari was not required because this slice did not change a shared cross-engine primitive or CSS
  behavior; native Chrome covered the changed reference composition. Global QA Acceptance remains
  pending and is not claimed by this owner-level receipt.
- No paid-provider call, hosted mutation, staging environment mutation, or unrelated cleanup ran.

## Implementation DoD

Passed for Slice 8D. Exact source-control and production release evidence is recorded by the owner
report for the commit containing this receipt. Global QA Acceptance: Pending.
