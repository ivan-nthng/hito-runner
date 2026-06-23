# Universal Selected-Distance No-Dead-End UX Taxonomy

Date: 2026-06-11
Owner: Product
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Status

closed

## Type

product_brief

## Priority

high

## Next Recommended Role

architect

## Task

Preserve the accepted selected-distance no-dead-end taxonomy unless a fresh selected-plan regression
appears.

## Stage

PRODUCT accepted contract / selected-distance taxonomy.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve the accepted selected-distance no-dead-end taxonomy unless a fresh selected-plan regression
appears.

Stage:
ARCHITECT source-of-truth guard / selected-distance taxonomy.

Context:
This product brief is an accepted product contract: selected-distance plans should not dead-end just
because a runner is beginner, conservative, low-volume, slow, or needs a longer honest horizon. Do
not reopen implementation unless source or QA proof shows the accepted taxonomy regressed.
```

## Accepted Product Law

If the runner selects a distance and gives constraints, Hito should produce an honest
selected-distance plan whenever coaching is plausible. Beginner, conservative, low-volume, slow, or
long-horizon needs are not normal reasons to block preview or creation. Hito should extend the
runway, bridge safely, or label the plan honestly rather than dead-ending.

## Valid And Invalid Unavailable States

Invalid normal blocking reasons:

- beginner status;
- low current fitness;
- conservative schedule;
- longer honest horizon;
- slower paces;
- lack of target time.

Valid structural unavailable reasons:

- unsupported family mapping for a future/custom distance;
- impossible target date or fixed endpoint date below the minimum honest family floor;
- missing required inputs that prevent safe plan construction;
- backend validation failure that is specific, explainable, and recoverable.

## Family Taxonomy

| Runner intent | Product family | Endpoint promise |
| --- | --- | --- |
| Run 10K | `10K selected-distance plan` | exact `10000m` finish/checkpoint |
| Run a half marathon | `Half Marathon selected-distance plan` | exact `21100m` finish/checkpoint |
| Finish a marathon | `Marathon Completion selected-distance plan` | exact `42195m` completion path |
| Build marathon durability | `Marathon Base plan` | no selected-distance `42195m` endpoint promise |

`Marathon Completion` and `Marathon Base` must never collapse into one card, label, or endpoint
promise.

## Runner-Facing Rules

- Use clear labels such as `Run a 10K`, `Run a Half Marathon`, `Finish a Marathon`, and
  `Build Marathon Base`.
- Long-horizon plans may say they were extended because of the runner's current rhythm.
- Review/confirm must show plan family, endpoint distance where applicable, horizon, training-day
  rhythm, and any unavailable-state reason.
- Future custom distances should follow the same no-dead-end law and show exact endpoint distance
  only when the product promises selected-distance completion.

## What Not To Change

- Do not merge `Marathon Completion` into `Marathon Base`.
- Do not add fake pace or fake personal HR.
- Do not add target-time readiness or race-pace copy.
- Do not expose selected-distance cards before the relevant create/confirm path is accepted.
- Do not mix this taxonomy with manual workout authoring, Plan Presets cleanup, or unrelated UI
  redesign.
