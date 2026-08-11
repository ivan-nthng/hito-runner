# Onboarding Generated-Plan Eight-Item Visual Cleanup

## Work Item ID

2026-08-11-onboarding-generated-plan-layout-polish

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

`/` authenticated onboarding, generated-plan branch only.

## Stage

Frontend Product implementation and independent focused browser review.

## Next Recommended Role

FRONTEND

## Archive Intent

retain_in_place

## Task

Complete the eight compatible local Inspector corrections below in the two existing onboarding
components. This is an instance-only visual and copy cleanup. Reuse the current Hito Design System
classes, tokens, and composition utilities. Do not add CSS, primitives, tokens, helpers, wrappers,
or a new layout abstraction.

## User Report

Ivan supplied the Inspector batch captured at `2026-08-11T05:09:34.307Z`, route `/`, dark theme,
1470×801 viewport, with eight requested changes:

1. Remove `Share a recent result or training circumstance for this plan request.`
2. Remove `Choose what you are training for.`
3. Remove the top divider before generated-plan content.
4. Centre the existing plan-creation tab control and make it hug its two labels.
5. Remove `Generated plan`.
6. Remove `What are you training for?`.
7. Remove `Race day and finish time stay optional for every generated goal.`.
8. Centre the captured generated-plan heading group.

Ivan additionally required that all resulting UI use existing Design System primitives/tokens only:
no literal radii, one-off borders, custom spacing, or route-local visual recipes.

## Evidence

- Inspector source: `/Users/ivan/.codex/attachments/44487d10-a6e5-4dfa-b255-e0b42e3f46ef/pasted-text.txt`.
- Item 3 targets only the generated panel; it does **not** authorize changing the Manual tab panel.
- Item 4 identifies the current DS tab primitive: `hito-tabs hito-tabs-enclosed`, including its
  existing `--radius-lg` 8px frame. That primitive is not to be changed.
- Item 8 targets the single-child heading-group wrapper, not goal-card layout or the plan-context
  field.

## Source Investigation And Radius Discriminator

The reported 10px main-card radius is not an invented literal or a custom route style:

- `src/components/OnboardingGate.tsx:388` renders the method card with the shared
  `hito-surface-flat` class.
- `src/styles/reference-workbench.css:36-40` defines `hito-surface-flat` with
  `border-radius: var(--radius-xl)`.
- `src/styles/foundations.css:16` defines `--radius-xl` as `calc(var(--radius) + 2px)`, and
  `src/styles/foundations.css:101` defines `--radius: 8px`; the computed DS value is therefore
  exactly 10px.

The current eight-item Inspector batch does not request a card-radius change. Preserve this shared
DS consumer unchanged. The earlier 16px/`--radius-2xl` request is superseded for this item and must
not block the eight corrections.

## Exact Existing Seams And Required Edits

Only these two Product-owned files may change.

### `src/components/OnboardingGate.tsx`

- **Current target:** lines 388-407, the sole method-card instance and its
  `div[aria-label="Plan creation method"]` tablist.
- Preserve the enclosing `section` class `hito-surface-flat`, its DS radius/background/border,
  all buttons, all ARIA props, `useHitoTabs` state, keyboard behavior, and Generated/Manual logic.
- Change only the tablist instance composition so it is centred and content-hugging at desktop and
  narrow widths. Reuse the existing `hito-tabs hito-tabs-enclosed` primitive and existing project
  composition utilities; do not edit the primitive or its shared CSS.
- Do not modify the Manual branch at lines 481-486, including its separate
  `hito-section-divider`.

### `src/components/onboarding/PlanPresetPanel.tsx`

- **Item 3:** at line 143, remove only `hito-section-divider` from the generated-stage section
  class. Retain the existing `hito-plan-preset-stage` and `pt-8`; do not add a replacement border
  or custom spacing.
- **Item 8:** at lines 144-155, centre this exact generated-plan heading group using existing
  composition utilities. Preserve its current `gap-4`, `max-w-2xl`, `Choose your goal.` heading,
  and factual helper copy about reviewed previews being saved in Plans. Do not alter goal cards.
- **Item 5:** remove only the `hito-micro-label` node at lines 146-148. Remove its now-unneeded
  top margin from `Choose your goal.` so no empty vertical gap remains; retain the existing
  `hito-ui-panel-title` typography role.
- **Item 1:** at lines 172-186, remove only the `hito-field-helper` span and the matching
  `aria-describedby={runnerCommentHelperId}` usage. Remove `runnerCommentHelperId` only if it has
  no remaining consumer. Retain the label, `Textarea`, name, placeholder, rows, value, and change
  handler exactly as they are.
- **Items 6 and 7:** at lines 270-276, remove the now-empty wrapper containing exactly
  `What are you training for?` and `Race day and finish time stay optional for every generated
goal.`. Preserve the goal radio group beginning at line 278.
- **Item 2:** remove only the conditional `hito-field-helper` at line 297. Do not alter the
  separate validation error in `selected-running-plan-flow-utils.ts`.

## Expected Behavior

- All eight Inspector requests are visibly satisfied in the generated tab at `/`.
- The card continues to use the existing `hito-surface-flat` Design System contract, including its
  current 10px `--radius-xl` value; no new radius appears.
- The enclosed tab control stays accessible and fully functional but is centred and hugs content.
- The generated heading group is centred; goal cards, controls, validation, plan context, preview,
  persistence, baseline/BPM behavior, and the Manual tab remain unchanged.

## What Not To Touch

- `src/styles/foundations.css`, `src/styles/reference-workbench.css`, all other shared DS CSS,
  tokens, primitives, Hito DS registration, or Figma.
- The `hito-surface-flat`, `hito-tabs-enclosed`, and `hito-section-divider` definitions or any
  other consumer.
- Backend, schema, auth, persistence, providers, preview generation, BPM formulas/presentation,
  manual onboarding behavior, data, or unrelated dirty work.
- The `Generated plan` labels in preview dialogs, the validation text in
  `selected-running-plan-flow-utils.ts`, and the Manual panel divider.

## Reuse-First Change Budget

- Existing seams: `OnboardingGate`, `PlanPresetPanel`, existing Hito tab/surface/typography
  primitives and project composition utilities.
- New production runtime artifacts: none.
- Required deletion: five route-local text nodes, one route-local generated-stage divider usage,
  and only now-orphaned accessibility/reference code.
- Required simplification: no hidden text, no overrides, no compatibility layer, and no custom
  visual value.

## Focused Validation Expectations

| Check              | Scenario / environment                                                                           | Required evidence                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Source map         | Exact two files and named line-level targets                                                     | No other runtime source changes; shared DS source remains untouched               |
| Generated behavior | Accepted baseline, goal selection, plan context and review entry                                 | Existing user flow and validation remain intact                                   |
| Tabs               | Generated/Manual selection and keyboard navigation                                               | Existing ARIA/keyboard behavior retained; instance is centred and content-hugging |
| Visual             | Desktop and exact 375×812, available light/dark themes                                           | No generated top divider, no removed copy, no overflow, no custom card radius     |
| Independent QA     | One read-only QA/browser subagent                                                                | Independently verifies the rendered eight-item outcome and no console errors      |
| Static             | Focused lint, formatter and `git diff --check`; build only when no concurrent build owner exists | Clean task-owned result                                                           |

Global QA, hosted/release proof, provider calls, staging, commits, pushes, and deployment are not
part of this Lite work.

## Promotion Condition

Promote and stop only if an exact requested change cannot be made through the named Product
consumer seams without changing a shared DS contract. A shared token's existing value, including
the confirmed 10px `--radius-xl`, is not by itself a blocker because this item does not request a
token change.

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-onboarding-generated-plan-layout-polish.md`

Read `AGENTS.md`, `agents/frontend.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and
`skills/hito-qa-browser-regression/SKILL.md` before the first write.

This is one small route-local cleanup. Implement only the eight exact line-level changes in the
item's `Exact Existing Seams And Required Edits` section. Treat that section as the complete source
map and scope boundary.

Use only the already-existing Hito Design System classes/tokens and existing project composition
utilities. Do not add CSS, a literal value, a new class, a wrapper, a primitive, a token, a helper,
or a compatibility path. In particular, do not change `hito-surface-flat`, its 10px
`--radius-xl` contract, any shared DS file, the Manual branch, preview-dialog labels, or the
separate goal validation error.

New runtime artifacts: none. Remove the specified route-local nodes/usages rather than hiding
them. Preserve baseline/BPM, goals, plan context, generated/manual tabs, ARIA/keyboard behavior,
preview/review, persistence, and unrelated dirty work.

Use one bounded read-only QA/browser subagent after your own focused check. It must not edit files
or mutate persisted data. Verify the eight requested rendered outcomes, desktop and exact 375×812,
available light/dark themes, generated/manual keyboard tabs, no horizontal overflow, and no console
errors. Run focused formatter, lint, and diff hygiene. Run a production build only when no other
owner controls a concurrent build.

Promote and stop only if the named source edits require modifying a shared DS definition. Do not
turn an existing DS token value into a blocker when this item does not ask to change that token.

Do not stage, commit, push, deploy, access hosted state, call providers, or delete material data.
Use Russian for in-progress commentary. Final formal receipt must be English and include the exact
files changed, confirmation that shared DS source was untouched, the radius discriminator result,
focused checks, independent QA verdict, and any remaining boundary.
```

## Supersession Record — 2026-08-11

The previous blocked wording combined an unrelated request for `--radius-2xl` to resolve to 16px
with this simple Inspector batch. That conflict has been removed from the active task. The
previous source trial was reverted; no Product runtime edit was accepted from it. This revision
retains the factual 10px-radius discriminator and routes only the eight requested visual fixes.

## Frontend Lite Receipt — 2026-08-11

### Outcome

Completed the eight route-local generated-plan cleanup edits through the existing `OnboardingGate`
and `PlanPresetPanel` seams. The method tablist is centred and content-hugging, the generated-stage
divider and five specified copy nodes are removed, and the retained heading group is centred.
Shared Design System source and the computed 10px `hito-surface-flat` radius were unchanged.

### Change Boundary

- `src/components/OnboardingGate.tsx`: changed only the existing plan-method tablist instance to
  compose `mx-auto w-fit max-w-full` with `hito-tabs hito-tabs-enclosed`. Existing unrelated dirty
  onboarding work in this file was preserved.
- `src/components/onboarding/PlanPresetPanel.tsx`: removed the named generated-stage divider usage,
  five copy nodes, the orphaned helper ID/ARIA reference, and centred the retained heading group.
- `docs/tasks/backlog/2026-08-11-onboarding-generated-plan-layout-polish.md`: lifecycle and receipt.
- New production runtime artifacts: none. Shared CSS, primitives, tokens, Manual behavior, preview,
  persistence, Backend, and providers were not changed.

### Validation

| Check                    | Scenario / environment                         | Result | Evidence                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source boundary          | Exact Product seams                            | Passed | `OnboardingGate` uses `hito-tabs hito-tabs-enclosed mx-auto w-fit max-w-full`; generated stage retains only `hito-plan-preset-stage pt-8`; Manual retains `hito-section-divider pt-6`.                                                                                                             |
| Removed copy and ARIA    | Generated branch                               | Passed | All five specified strings and `runnerCommentHelperId` are absent; the Plan context label, textarea name, placeholder, rows, value, and handler remain.                                                                                                                                            |
| Desktop visual           | 1440×1000, dark, managed loopback runtime      | Passed | Tablist 235.30px within a 1024px card, centre delta 0.008px; generated border-top 0px; heading centred; horizontal overflow 0; no console/page errors. Screenshot: `qa-artifacts/screenshots/2026-08-11/onboarding-generated-plan-layout-polish/desktop-dark-generated.png`.                       |
| Narrow visual            | Exact 375×812, light, same runtime and account | Passed | Tablist 235.30px within a 343px card, centre delta 0.008px and no internal overflow; generated border-top 0px; heading centred; page overflow 0; no console/page errors. Screenshot: `qa-artifacts/screenshots/2026-08-11/onboarding-generated-plan-layout-polish/mobile-375-light-generated.png`. |
| Surface discriminator    | Both viewport/theme samples                    | Passed | Computed `hito-surface-flat` radius remained exactly 10px.                                                                                                                                                                                                                                         |
| Generated flow           | 10K selection and Plan context client state    | Passed | Goal selection and context input remained functional; generated Create plan became enabled. Preview/Create was intentionally not invoked, so no provider or plan-persistence action occurred.                                                                                                      |
| Tabs and Manual boundary | Keyboard ArrowRight/ArrowLeft                  | Passed | Focus, `aria-selected`, and roving `tabindex` switched between Generated and Manual and restored correctly; Manual copy and its 1px divider/24px top padding remained.                                                                                                                             |
| Independent review       | Read-only `/root/layout_polish_qa`             | Passed | Independently repeated desktop dark and 375×812 light DOM/computed-style, keyboard, overflow, and console checks; verdict Passed for focused Lite implementation only.                                                                                                                             |
| Static                   | Focused Product files                          | Passed | Prettier check, ESLint, and `git diff --check` passed.                                                                                                                                                                                                                                             |
| Runtime/build freshness  | Existing managed loopback server               | Passed | Freshness receipt matched the current Product source build; the server was reused and not restarted or stopped. A separate production build was omitted because another owner controlled the managed build.                                                                                        |
| Fixture cleanup          | Disposable local acceptance identity           | Passed | Browser sessions were closed; the disposable auth/profile account was deleted. All task-owned database counts were 0 after cleanup; no plan or workout rows were created.                                                                                                                          |

### Coverage And Handoff

The focused route-local Implementation DoD is complete. Provider-backed preview generation was not
invoked, because this task changed only composition/copy and the existing client gate was exercised;
there is no resulting coverage gap for the claimed layout, accessibility, or branch-preservation
outcome. A separate production build was not run under the concurrent build-owner boundary; current
managed runtime freshness plus focused static/browser evidence supports this Lite receipt. Global QA
Acceptance and release readiness remain unclaimed. Next owner: Product. Blockers: none.
