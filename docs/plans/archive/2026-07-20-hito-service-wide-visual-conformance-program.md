# Hito Service-Wide Visual Conformance Program

## Status

archived

## Type

plan

## Priority

high

## Owner

designer

## Last Updated

2026-07-20

## Next Recommended Role

designer

## Task

Preserve the accepted Hito service-wide visual-conformance program as historical DS evidence.

## Stage

DESIGNER archived-plan reference / accepted visual-conformance history.

## Archive Note

The service-wide ledger and its two bounded correction batches were accepted on 2026-07-20. This
artifact is historical evidence, not an instruction to keep polishing without fresh runner-facing
evidence.

## Context

The July 18 service-wide DS audit and the first two post-freeze polish batches are accepted history:
they established the Hito DS baseline and corrected concrete timeline and shell defects. They do not
replace a durable, current inventory that classifies every live surface, shared component, and visual
exception against the frozen Runner Core.

The program classified every covered surface group against existing Hito DS ownership, corrected
two repeated shared-owner gaps, and preserved documented domain geometry rather than normalizing it
speculatively.

## Final Surface Ledger

| Surface group | Final classification | Canonical evidence / disposition |
| --- | --- | --- |
| Foundations | conformant | Semantic color, typography, spacing, radius, focus, and dark/light theme remain owned by shared CSS tokens and `/hitoDS`. |
| Shared UI and Hito DS | conformant after correction | Shared `Skeleton`, `useHitoTabs`, and `useHitoRadioGroup` own loading and one-of-many behavior; stale interactive reference specimens were made presentational. |
| Public and auth | conformant after correction | Login/signup tabs consume the shared tab contract; signed-out visual anatomy remains Hito DS-owned. |
| Runner setup and plan creation | conformant after correction | Running level, availability, goal, guidance, terrain, benchmark, and plan-mode choices use shared radio behavior and existing choice-toggle visuals. |
| Saved runner flows | conformant after correction | Home/workout/progress loading tones, workout tabs, completion controls, settings tabs/theme, and Body Notes use shared owners. |
| Manual authoring and templates | intentional exception | Workout timelines, repeat geometry, segment markers, and drag/drop anatomy remain domain-owned Hito recipes; no duplicate general control family was found. |
| Admin and internal surfaces | conformant after correction | Admin Capture status tabs use shared tab behavior with client-side route search; `/hitoDS` interactive and static specimens now describe behavior truthfully. |
| Responsive, theme, keyboard, and states | conformant | Dark/light desktop and exact 375px, focus, selection, disabled skipping, panel relationships, overflow, and console health passed. A stable live shared-Skeleton specimen now proves the canonical loading tone in all four viewport/theme combinations. |

## Accepted Correction Batches

1. Removed route-local Skeleton color overrides from home, workout detail, and progress, and removed
   the duplicate route-panel Skeleton background so the existing semantic shared owner controls
   loading tone.
2. Added the smallest shared tab and radio behavior owners, migrated live consumers and reference
   examples, corrected benchmark choice anatomy, made static state matrices non-interactive, and
   preserved Admin Capture tab focus through existing client-side routing.
3. Added the existing shared `Skeleton` to the existing `/hitoDS` States loading example so its
   semantic tone has stable browser-verifiable reference coverage without delaying product routes.

QA evidence: `qa-artifacts/screenshots/2026-07-20/service-wide-visual-conformance-qa/`.

## Cross-Owner Evidence

The saved calendar correctly retains continuous `Rest` dates after the last scheduled workout, but
the home hero can still say that the plan has ended. That is a rendering-view-model/product-contract
conflict, not Hito DS drift, and was intentionally not patched in this visual program.

## Closeout

All eight surface groups are classified and both evidence-backed DS batches are accepted. Frozen
Runner Core behavior, auth, route/query truth, persistence, provider, review/confirm, editability,
and continuous `Rest` semantics were preserved. Disposable local testers were deleted with zero
remaining plan/workout/log rows. This internal DS/accessibility correction is technical-log
material, not a public changelog highlight.

## Product Boundary

This is visual-system work only. Preserve all runner lifecycle, plan creation, review/confirm,
persistence, editability, provider, auth, import/export, logging, evidence, and access-control
behavior. Do not introduce product features, change business rules, mutate hosted data, call OpenAI,
or turn a visual review into a backend or schema project.

An active schedule remains continuous: dates without a workout, including dates after the last
scheduled workout, render as `Rest`. Do not introduce an after-plan or outside-plan product state.

## Coverage

The program must classify and inspect:

1. Foundations: color, spacing, radius, elevation, typography, motion/focus, and theme behavior.
2. Shared UI and Hito DS: primitives, wrappers, specimen/reference parity, and duplicated recipes.
3. Public and auth surfaces: launcher, login, callback-visible states, and signed-out flows.
4. Runner setup and plan creation: Quick, Advanced, review, confirm, import, and errors.
5. Saved runner flows: home, calendar, workout detail, logging, feedback, progress, settings, and
   plan management.
6. Manual authoring and templates: constructor, reviewed edit, catalog, dialogs, and readback.
7. Admin and internal surfaces: admin routes, capture/backlog, and `/hitoDS` reference.
8. Responsive, theme, keyboard, and state surfaces: desktop, exact 375px, dark/light, loading,
   empty, error, selected, disabled, destructive, and focus-visible states.

## Execution Rules

- Start with source and browser inventory, then keep a compact surface ledger in this plan with
  `conformant`, `intentional exception`, or `needs correction` status and the canonical owner.
- Split correction work by real shared owner and validation story, not by individual files or CSS
  values. Prefer one shared correction that removes repeated drift.
- Reuse one small subagent pool across the program: at most one FRONTEND implementation subagent,
  one QA/browser subagent, and only additional read-only specialists when genuinely independent.
  Never create per-file, per-route, or per-validator agents.
- Frontend corrections must reuse Hito DS tokens, primitives, and reference patterns before creating
  anything. If a shared primitive is truly missing, prove repeated consumers, add it at the DS owner,
  migrate those consumers, and delete replaced local recipes in the same batch.
- Do not remove intentional visualization geometry, browser-native constraints, or domain-specific
  workout color semantics merely because they are not ordinary spacing/radius tokens. Record the
  reason and owner instead.
- Continue through safe same-owner batches autonomously. Stop only for a real functional boundary,
  a missing product decision, or a cross-owner defect that visual work cannot safely resolve.

## Acceptance

The program is complete only when:

- every covered surface has a current ledger classification;
- shared and route-level controls use Hito DS anatomy, tokens, typography, spacing, radius, color,
  borders, elevation, and focus behavior, or carry an explicit intentional-exception reason;
- unnecessary cards, wrappers, borders, local controls, and duplicate recipes are deleted rather
  than restyled in place;
- any new primitive has multiple real consumers and replaces the corresponding local recipes;
- each changed batch passes targeted source scans, lint/build as relevant, scoped diff checks, and
  desktop plus exact 375px browser proof in required themes/states;
- UI behavior, backend-shaped truth, and frozen Runner Core contracts remain unchanged;
- accepted batches are recorded compactly in the technical log, while this plan remains a useful
  current ledger rather than a transcript.

## Exact Handoff Prompt

```text
ROLE: DESIGNER

Task:
Preserve the archived Hito service-wide visual-conformance program as historical DS evidence.

Stage:
DESIGNER archived-plan reference / accepted visual-conformance history.

Context:
This program is complete and archived. Do not reopen broad conformance work without fresh visible
evidence. Start from current Hito DS and product source truth, and route the separate plan-ended hero
wording conflict to its rendering/product owner rather than treating it as a DS regression.
```

## Exit

Close only after the acceptance criteria are met. Future visual work must begin from fresh runner
evidence, not reopen this program for speculative redesign.
