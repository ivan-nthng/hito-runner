# Generated Plan Review Title And Start-Date Spacing

## Work Item ID

2026-08-11-generated-plan-review-title-start-spacing

## Status

completed

## Type

visual-polish

## Priority

medium

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

Only the ready/review generated-plan dialog header on `/`, at
`src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`. The change applies only to the
stack between the plan title and its existing start-date copy.

## Archive Intent

retain_in_place

## Task

Give the existing plan title and the existing `Starts …` copy a clear vertical separation in the
ready/review dialog. Reuse an existing Hito spacing utility; do not change the shared Dialog
component or its shared CSS.

## User Report

Local Inspector batch `329550c5-81b3-4e5c-9467-4eea5dcb19f7`, captured on 2026-08-11 at
12:39:24, route `/`, dark theme, 1470×745, targets
`div.hito-ui-dialog-header.hito-product-dialog-header.border-b-0`. Ivan reports that the plan
name and when the plan starts are visually stuck together and requests a gap between them.

## Evidence

- The Inspector identifies the Dialog primitive positively, but scopes the request to this one
  rendered dialog instance.
- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx:342-346` renders the ready review
  header. `DialogTitle` and the unchanged `header.startCopy` paragraph are consecutive children of
  its route-local `div.min-w-0`.
- The title currently has `mt-2`; the following start-copy paragraph has no top-spacing utility.
- The shared `DialogHeader` only provides the outer dialog header element in
  `src/components/ui/dialog.tsx`; shared `.hito-product-dialog-header` owns outer padding and
  divider treatment in `src/styles/overlays-feedback.css:381-390`. Neither owns this sibling gap.

## Source Investigation And Demonstrated Cause

The previous ready-dialog hierarchy cleanup intentionally moved `header.startCopy` beneath the
title. It left the two route-local siblings without a vertical gap. This is a Product composition
issue, not a shared Dialog or Design System defect. The first incorrect canonical owner is
FRONTEND Product in `GeneratedPlanReadyReviewHeader`.

## Exact Existing Seam And Required Edit

Only `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx` may change.

- At the existing ready header's `p.hito-ui-section-title`, immediately beneath
  `DialogTitle`, add only the existing `mt-2` composition utility.
- Retain the title and start-copy text, typography roles, `min-w-0`, `break-words`, outer
  `hito-product-dialog-header border-b-0`, factual range/modifier copy, focus behavior, and all
  ready/loading/error/compact branches.

## Expected Behavior

- In the ready/review dialog, the plan title and the `Starts …` copy have an 8px Hito spacing
  interval at desktop and narrow widths.
- No other dialog header, product route, shared Dialog primitive, shared CSS, or data behavior
  changes.

## Reuse-First Change Budget

- Existing seam: `GeneratedPlanReadyReviewHeader` in the existing dialog component.
- Existing Design System contract: `mt-2` / `--space-2` (8px).
- New production artifacts: none.
- Removed or simplified responsibility: none; this is one missing composition utility.

## What Not To Touch

- `src/components/ui/dialog.tsx`, `src/styles/overlays-feedback.css`, shared Dialog/typography
  classes, `/hitoDS`, Figma, or any other dialog consumer.
- `GeneratedPlanReadyReviewHeader` model text, divider handling, Add-to-Calendar action/focus,
  preview data, persistence, backend, auth, providers, or unrelated dirty work.
- Do not add CSS, literal values, a new class, wrapper, helper, state, token, or compatibility
  path.

## Focused Validation Expectations

| Check            | Scenario / environment                      | Required evidence                                                             |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Ready header     | Existing ready preview, desktop and 375×812 | Title/start copy remain factual and are separated by the existing 8px utility |
| Branch isolation | Source audit                                | Loading, compact, and error headers are unchanged                             |
| Dialog behavior  | Existing keyboard and close flow            | Semantics and focus behavior remain intact                                    |
| Static           | Focused formatter, lint, and diff hygiene   | Only the named TSX plus lifecycle item change                                 |

## Promotion Condition

Promote and stop only if the requested local sibling spacing cannot be composed with an existing
utility and would require a shared Dialog or Design System contract change.

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-generated-plan-review-title-start-spacing.md`

Read `AGENTS.md`, `agents/frontend.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write.

Change only `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`, in the existing
`GeneratedPlanReadyReviewHeader` ready/review header. Add only the existing `mt-2` utility to the
existing start-copy paragraph directly below `DialogTitle`, creating the required 8px vertical
separation.

This is a route-local Product composition fix. Do not change `src/components/ui/dialog.tsx`,
shared Dialog CSS, typography source, /hitoDS, Figma, model text, any other dialog consumer,
ready divider/focus behavior, preview data, persistence, backend, auth, providers, or unrelated
dirty work. Add no CSS, literal value, wrapper, helper, state, token, or compatibility path.

Verify the ready header at desktop and 375×812 using the current local `qa_fixture` runtime when
available; verify loading/compact/error branch isolation, normal dialog keyboard/close behavior,
and focused static checks. Do not stage, commit, push, deploy, access hosted state, call
providers, or mutate product data. Use Russian for in-progress commentary and an English final
receipt.
```

## Frontend Lite Receipt — 2026-08-11

### Outcome And Boundary

Added only the existing `mt-2` utility to the existing ready-review start-copy paragraph in
`GeneratedPlanReadyReviewHeader`. The title, factual start copy, typography roles, divider removal,
range/modifier copy, Add-to-Calendar focus, compact/loading/error branches, shared Dialog/CSS, and
all Product behavior remain unchanged. New production runtime artifacts: none.

### Files Changed

- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`: one task-owned class-list addition.
- This canonical lifecycle item: status and receipt only.

### Focused Proof

| Check                      | Scenario / environment                   | Result  | Evidence                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ---------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact spacing seam         | Ready-review header source               | Passed  | The start-copy paragraph directly beneath `DialogTitle` is now `hito-ui-section-title mt-2 min-w-0 break-words`; no other ready-header node changed in this item.                                                                                                                                                                                               |
| Branch isolation           | Component source audit                   | Passed  | Loading and compact `DialogDescription` nodes remain; error `Try again` remains bound to the existing retry path; ready focus still targets Add to Calendar.                                                                                                                                                                                                    |
| Static hygiene             | Focused TSX checks                       | Passed  | Prettier, ESLint, exact source search, and `git diff --check` passed.                                                                                                                                                                                                                                                                                           |
| Production build/runtime   | Canonical managed `qa_fixture`           | Passed  | Client, SSR, Nitro, post-build integrity, freshness receipt, and loopback startup passed.                                                                                                                                                                                                                                                                       |
| Rendered 8px discriminator | Ready preview, desktop and exact 375x812 | Not run | The only current local identity with a complete baseline routes to Calendar; onboarding QA identities lack the baseline required to mount this dialog. Mutating profile/product data was prohibited, so no fixture was changed. The exact `mt-2` consumer adoption is source-proven, but final computed margin and dialog keyboard replay were not re-observed. |

Implementation is complete without promotion because the existing spacing utility owns the exact
request and no shared contract is needed. The focused browser coverage gap is explicit. Global QA
Acceptance and release readiness remain unclaimed. Next owner: Product. Blockers: none.
