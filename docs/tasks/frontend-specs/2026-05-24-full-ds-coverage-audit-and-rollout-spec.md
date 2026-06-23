# Hito Full DS Coverage Audit And Rollout Spec

## Status

completed

## Type

frontend_spec

## Priority

low

## Next Recommended Role

frontend

## Task

Keep this completed full-coverage DS audit as historical context; reopen only for concrete product drift.

## Stage

DESIGNER audit + specification / completed DS coverage history.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use this completed full-coverage DS audit only when a future concrete product drift or QA finding
requires a bounded DS coverage cleanup.

Stage:
FRONTEND implementation / future bounded DS coverage cleanup.

Context:
This spec is completed/paused history. Current DS coverage truth lives in src/styles.css, /hitoDS,
current docs, and the active Hito DS IA/specimen plan.

Stop if:
- the task would restart broad DS rollout by inertia;
- the task belongs to product runtime behavior;
- the task touches Hito DS/Figma bridge work without the active IA plan.
```

## Owner

Design System Designer

## Last Updated

2026-06-20

## Compression Note

This file was compressed during ARCHITECT Slice D4. It preserves the accepted coverage decisions,
completed slices, known exceptions, and future-trigger boundaries while removing long audits,
duplicated rollout prompts, and superseded local inventories.

## Final Outcome

This rollout is paused after the first four QA-green slices because the visible product became good
enough from a DS-coverage perspective.

Completed slices:

- `/changelog` editorial timeline family adopted into Hito DS;
- gradient and overlay role classes formalized and documented;
- shared `src/components/ui/*` wrappers aligned to Hito DS defaults;
- `/progress` visualization chrome moved to DS-owned chart chrome classes.

No immediate implementation slice is recommended from this historical spec. Remaining items are
backlog candidates or documented geometry exceptions, not active blockers.

## Audit Conclusion

The product was not missing a design system. The remaining problem was coverage drift in a few
specific areas:

- editorial/timeline patterns;
- gradient and alpha-overlay rules;
- visualization-adjacent UI wrappers and compact chart/readback recipes;
- generic shared UI wrappers that still reflected baseline defaults.

The accepted direction was small coverage slices, not a new component system.

## Decisions To Preserve

- Treat `src/styles.css`, `/hitoDS`, and current source as stronger truth than this historical spec.
- Prefer shared DS classes/components over route-local recipes.
- Preserve visualization geometry as a special-case exception where appropriate.
- Do not normalize every imported surface equally; prioritize real product drift.
- Do not make DS cleanup a reason to redesign product routes or change behavior.
- Reopen only when a concrete QA/product issue proves drift.

## Known Exceptions And Future Triggers

Future work may be useful when a specific issue appears in:

- visualization geometry and chart/data density;
- secondary utility surfaces;
- stale wrappers that still expose generic defaults;
- DS/Figma export contract mismatch;
- repeated route-local recipes that current Hito DS primitives already cover.

These are not active blockers.

## Validation Shape For Future Reuse

Future DS coverage cleanup should validate:

- source/static checks for touched files;
- browser proof when visible UI changes;
- `/hitoDS` reference updates when canonical DS behavior changes;
- no behavior/copy drift in product routes;
- desktop and mobile/narrow overflow when layout is affected.

## Links

- Current DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Stop Conditions

Stop if a future task tries to use this completed audit as permission for broad frontend rewrite,
Hito DS feature implementation, product runtime redesign, `/test-calendar` work, or unrelated
Admin/manual/running-plan changes.
