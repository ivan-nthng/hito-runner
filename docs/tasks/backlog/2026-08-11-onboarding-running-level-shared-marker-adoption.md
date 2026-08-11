# Onboarding Running-Level Shared Marker Adoption

## Work Item ID

2026-08-11-onboarding-running-level-shared-marker-adoption

## Status

completed

## Type

product_ui

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

Onboarding Running level consumer only.

## Stage

Design System prerequisite completed; Frontend Product adoption ready.

## Next Recommended Role

FRONTEND

## Archive Intent

retain_in_place

## Task

Replace the old route-local Running level pseudo-dot recipe with the accepted shared `HitoSlider`
passive-marker API after the Design System cursor-affordance correction completes.

## User Report

On `/`, Running level displayed dots above or through its orange handle, unlike BPM guidance. Ivan
requires one coherent slider family: the only intended difference is one Running-level handle versus
two BPM handles.

## Evidence

- Audit: `/Users/ivan/.codex/attachments/238e3d65-9faf-48f0-9b84-a3efa7c866fb/pasted-text.txt`.
- `src/components/onboarding/QuickSetupPlanSetupSections.tsx:144-154` passes a long `className`
  containing two `::before`/`::after` dots at one-third and two-thirds with `z-[2]`.
- `src/components/ui/hito-slider.tsx:19` already accepts the shared `markers` prop. For the
  Running-level range `min={0}`, `max={3}`, the same two scale positions are `markers={[1, 2]}`.
- Shared marker visuals are already `z-index:1`; the shared current handle is `z-index:2`, so a
  coincident marker is truthfully occluded.

## Observed Behavior

The route-local pseudo-elements occupy a higher stacking layer than the shared visual track and can
paint over the Running-level handle.

## Expected Behavior

Running level uses the current HitoSlider marker API. Distinct markers are visible; a marker under a
coincident orange handle is fully occluded. No route-local pseudo-element recipe remains.

## Required Discriminator

The Design System prerequisite completed on 2026-08-11 with the shared cursor contract: rail/click
region `pointer`, draggable thumb `grab`, active thumb or rail drag `grabbing`, and disabled
surfaces `not-allowed`. Verify the current authenticated onboarding instance at the existing range
values: marker/handle centers and z-index ordering must match the accepted shared contract.

## Exact Existing Seam

Only `src/components/onboarding/QuickSetupPlanSetupSections.tsx:144-159` may change:

- remove the full route-local pseudo-element `className` recipe;
- pass `markers={[1, 2]}` to the existing `HitoSlider` call;
- retain min/max/step/value, labels, accessibility, state callback, section layout, and all other
  Running-level behavior byte-for-byte.

## What Not To Touch

Do not edit HitoSlider/HitoDualRange, shared CSS, Design System tokens, BPM guidance,
HeartRateProfileSection, persistence, baseline logic, backend, generated/manual onboarding, or
unrelated dirty work. No new component, CSS, helper, token, wrapper, state, or artifact.

## Validation Expectations

- Focused authenticated onboarding browser replay after the DS prerequisite: Running level dark/light
  desktop and exact 375×812, marker stacking, cursor, native pointer/keyboard value behavior, no
  overflow, and console health.
- Focused formatting/lint/diff hygiene; build only if no concurrent owner controls it.
- One bounded read-only QA/browser subagent may independently confirm that the pseudo-element recipe
  is gone and that the rendered consumer adopts the shared marker contract.

## Prior Blocker Resolution — 2026-08-11

The shared Design System cursor-affordance correction is completed and recorded in
`2026-08-11-hito-ds-slider-marker-lane-and-smooth-motion`. This consumer task is now ready.

## Exact Future Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Lite

Execute this item only after its named Design System prerequisite has a completed receipt:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-onboarding-running-level-shared-marker-adoption.md`

Read `AGENTS.md`, `agents/frontend.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and
`skills/hito-qa-browser-regression/SKILL.md` before the first write.

At `src/components/onboarding/QuickSetupPlanSetupSections.tsx:144-159`, delete the entire
route-local pseudo-element `className` recipe and pass `markers={[1, 2]}` to the existing
`HitoSlider`. Preserve every other prop and callback exactly.

Do not edit shared slider source/CSS/tokens, BPM, persistence, backend, or unrelated onboarding
behavior. Add no CSS, component, helper, wrapper, state, token, or artifact. Verify the real
onboarding consumer after the DS prerequisite: the old pseudo-dots are absent, shared markers are
used, a coincident marker is occluded by the handle, the cursor contract is coherent, and no
overflow or console error occurs. Use one bounded read-only QA/browser subagent only for independent
rendered confirmation. Do not stage, commit, push, deploy, use hosted state, call providers, or
delete data. Russian commentary; English final receipt.
```

## Frontend Lite Receipt — 2026-08-11

### Outcome And Boundary

Completed the Product consumer adoption at the existing Running-level `HitoSlider`: the full
route-local `::before`/`::after` marker recipe was deleted and replaced with `markers={[1, 2]}`.
Every other slider prop and callback remains unchanged. No production artifact, helper, wrapper,
state, CSS, token, shared primitive, BPM, persistence, Backend, or unrelated onboarding change was
added by this slice.

### Files Changed

- `src/components/onboarding/QuickSetupPlanSetupSections.tsx`: one prop substitution in the existing
  Running-level slider call. Earlier accepted dirty card-to-slider work in this file was preserved.
- `docs/tasks/backlog/2026-08-11-onboarding-running-level-shared-marker-adoption.md`: lifecycle and
  this receipt.

### Focused Proof

| Check                       | Scenario / environment                   | Result | Evidence                                                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source adoption             | Exact Product seam                       | Passed | `markers={[1, 2]}` is present; the route-local pseudo-element `className` is absent; label, min/max/step/value, value labels, ARIA value text, bound labels, and `onValueChange` remain.                                                                           |
| Shared marker geometry      | Authenticated onboarding, 1440×1000 dark | Passed | Exactly two 6×6 `.hito-slider-marker` nodes render at 33.333% and 66.667%; no control `::before`/`::after` content remains.                                                                                                                                        |
| Coincident occlusion        | Default value 2                          | Passed | Marker 2 and the 20×32 handle share the same center with 0px delta; marker z-index is 1 and handle z-index is 2.                                                                                                                                                   |
| Cursor and pointer truth    | Desktop dark native range                | Passed | Resting rail/input reports `pointer`; held drag reports `:active=true` and `grabbing`; release returns to `pointer`. Shared source retains the accepted native-thumb `grab` rule. Pointer changed `2 / Running regularly → 1 / Beginning → 2 / Running regularly`. |
| Keyboard truth              | Focused native range                     | Passed | ArrowLeft/ArrowRight changed `2 → 1 → 2` while focus remained on the native range and `aria-valuetext` followed the controlled value.                                                                                                                              |
| Responsive themes           | Exact 375×812 light and dark             | Passed | Two shared markers, 0px coincident-center delta, z-index 1/2 ordering, no pseudo-content, and horizontal overflow delta 0 in both factual theme states.                                                                                                            |
| Generated/Manual regression | Client-only valid baseline               | Passed | ArrowRight/ArrowLeft switched `Create a plan ↔ Build myself`; focus, `aria-selected`, roving `tabindex`, and the corresponding panel changed correctly. No Create/preview/provider action was invoked.                                                             |
| Browser health              | Desktop/mobile loopback sessions         | Passed | Browser console and page-error inventories were empty; browser sessions were closed.                                                                                                                                                                               |
| Independent review          | Read-only `/root/layout_polish_qa`       | Passed | Independently confirmed source adoption, marker positions/stacking/occlusion, pseudo removal, cursor, pointer/keyboard value truth, exact 375×812 light/dark containment, and clean runtime. Its omitted tab replay is covered by the primary-owner check above.   |
| Static checks               | Focused source and task item             | Passed | Prettier, ESLint, source assertions, and `git diff --check` passed.                                                                                                                                                                                                |
| Production build/runtime    | Canonical managed loopback server        | Passed | Client, SSR, Nitro, post-build integrity, and managed startup passed; runtime is healthy/current with `artifactFreshness: fresh` and `receipt_matches`. Existing dependency-directive and chunk-size warnings were unchanged.                                      |

### Local Data And Acceptance Boundary

Normal local login auto-provisioned an otherwise empty `runner_profiles` row for the existing
`qa-baseline` pool identity. No plan cycle, workout, log, evidence, entitlement, provider, or hosted
row was created, and no product persistence action was invoked. The row was not reset or deleted in
accordance with the explicit no-deletion boundary. The managed local server remains healthy and
running. This receipt proves the focused Lite Implementation DoD only; Global QA Acceptance and
release readiness remain unclaimed. Next owner: Product. Blockers: none.
