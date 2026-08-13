# Canonical Loopback Local Inspector Availability

## Work Item ID

2026-08-04-canonical-loopback-local-inspector-availability

## Status

completed

## Type

bug

## Priority

medium

## Owner

frontend

## Scope

local-devtools-inspector

## Archive Intent

retain_in_place

## Frontend Lane

devtools

## Task

Make the local-only Inspector directly usable on the canonical managed QA origin
`http://127.0.0.1:3000` without weakening its loopback-only and non-persistent boundary.

## Stage

Frontend DevTools browser acceptance completed on 2026-08-12. The current canonical gate and
enabled-state owner already satisfy the contract, so no runtime source change was required.

## Next Recommended Role

product

## Exact Handoff Prompt

None. The implementation owner completed the focused browser acceptance without a runtime source
change.

## Root Cause

The Inspector host gate already accepts `127.0.0.1`, but its enabled state is stored in
origin-scoped `localStorage`. A toggle previously enabled on `localhost` is therefore absent on
the canonical managed QA origin, leaving the Inspector unmounted there.

## Preserved Boundaries

- The Inspector remains loopback-only, local-only, lazy, and non-mutating.
- It must not load or appear on deployed, preview, or other non-loopback origins.
- No Product, Admin, auth, provider, fixture, persistence, or Backend behavior changes.
- Existing explicit Inspector exit and ordinary runner UI behavior remain intact.

## Acceptance

The Inspector can be intentionally reached and used on the canonical `127.0.0.1:3000` QA origin,
while remaining absent on a non-loopback origin. Both browser discriminators are proven without a
second DevTools state path.

## Tracked Completion Receipt — 2026-08-12

- **Task and lane:** Canonical Loopback Local Inspector Availability; Frontend / DevTools; Tracked.
- **Outcome:** completed as a source-backed runtime no-op. The current implementation makes the
  Inspector deliberately available on the canonical managed QA origin and keeps it absent on a
  non-loopback origin.
- **Historical root cause:** Inspector state is origin-scoped. A preference written on `localhost`
  does not exist on `127.0.0.1`.
- **Current discriminator:** `canLoadLocalDevtool` accepts loopback hostnames, while
  `readLocalUiInspectorEnabled` uses the existing storage owner and defaults an unset preference to
  enabled only on `http://127.0.0.1:3000`. The existing profile-menu checkbox writes that same
  preference and dispatches the existing synchronization event. No second state path exists.
- **Existing seams reused:** `local-devtool-boundary.ts`, `local-devtool-gate.ts`, the lazy
  `LocalDevtoolMount` / `LocalDevtoolMenuItem`, and the existing Pencil Inspector exit control.
- **New runtime artifacts:** none.
- **Files changed:** this canonical lifecycle item only. Runtime source and concurrent DevTools,
  Product, Design System, typography, and Inspector work remained untouched.
- **Browser Path Preflight:** the canonical managed runtime at `127.0.0.1:3000` was current,
  managed, compatible, loopback-bound, healthy, and fresh with `receipt_matches`; no rebuild,
  restart, fixture mutation, auth action, provider call, or hosted access was needed.

| Check                     | Scenario / environment                          | Result          | Evidence                                                                                                                                                          |
| ------------------------- | ----------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical availability    | `http://127.0.0.1:3000`                         | Passed          | Existing `Dev tool On` profile-menu control and `Open local UI task tools` launcher rendered.                                                                     |
| Deliberate enable/use     | Canonical runner Calendar                       | Passed          | The existing checkbox changed On → Off → On; the launcher disappeared and returned through the same state owner. `Pencil` opened the labelled Inspector controls. |
| Inspector exit            | Canonical runner Calendar                       | Passed          | `Exit Pencil Inspector and discard draft` removed the Inspector controls. Calendar heading and `Open day` remained available after menu dismissal.                |
| Non-loopback absence      | `http://0.0.0.0:3000`                           | Passed          | The same local runtime rendered no Inspector launcher or DevTools control; the hostname is rejected by the existing loopback gate.                                |
| Lazy/local boundary       | Source and rendered DOM                         | Passed          | The root mount returns before loading the lazy runtime outside the loopback boundary; no alternate state, persistence, or Product path was introduced.            |
| Overflow                  | Both exercised origins, 1280px browser viewport | Passed          | `documentElement.clientWidth` equalled `scrollWidth` (`1280`).                                                                                                    |
| Runtime health            | Both exercised origins                          | Passed          | Browser warning/error logs were empty; no hydration or uncaught interaction error was observed.                                                                   |
| Source change requirement | Current checkout                                | Passed as no-op | Current source already resolves the historical origin-scoped preference gap; changing it would duplicate the accepted seam.                                       |

- **Focused static proof:** targeted ESLint, Prettier, and scoped `git diff --check` passed. No
  implementation build was required because runtime source is unchanged and browser acceptance used
  a fresh managed artifact. After the lifecycle receipt changed the private Admin snapshot digest,
  the canonical server start rebuilt that snapshot; final status was current, managed, compatible,
  loopback-bound, healthy, and fresh with `receipt_matches`.
- **Independent QA:** not required because no runtime source changed. This focused owner-level
  browser acceptance is not Global QA or release readiness.
- **Next owner:** Product for normal backlog lifecycle; no implementation follow-up remains.
- **Blockers:** none.
- **Role file:** `agents/frontend.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none.
