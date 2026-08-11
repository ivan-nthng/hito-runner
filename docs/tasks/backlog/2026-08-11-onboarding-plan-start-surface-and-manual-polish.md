# Onboarding Plan-Start Surface And Manual-Mode Polish

## Work Item ID

2026-08-11-onboarding-plan-start-surface-and-manual-polish

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

The existing onboarding plan-start section on `/`, including only its introductory micro-label,
surface instance, and Manual-mode explanatory branch.

## Stage

Frontend Product route-local composition cleanup — dark-surface fix-forward.

## Next Recommended Role

FRONTEND

## Archive Intent

retain_in_place

## Task

Apply three compatible Inspector corrections to existing `OnboardingGate` consumer markup. Reuse
existing Hito Design System semantic color/radius tokens and existing composition utilities only.
No shared DS definition, primitive, CSS, token, or Product behavior changes are authorized. The
earlier completed `bg-surface` outcome is superseded only for this one surface's dark-theme colour.

## User Report

Inspector batches on `/`, dark, `1470×801` requested:

1. Remove only the introductory `Create a plan` micro-label.
2. In Manual mode, centre `Create workouts independently, or use a workout from a coach or friend.`
   and remove only its top divider.
3. For only this plan-start section, remove the `hito-surface-flat` perimeter/card treatment,
   increase the radius using an existing DS radius token, use a black semantic surface in dark mode,
   and use the corresponding existing semantic surface that remains distinct from page background in
   light mode. Do not invent a color or literal radius.
4. Follow-up Inspector batch `ec9fd7a4-d530-405f-90ff-746129f739f1` corrects the previous dark
   theme result: the plan-start section must use Hito's darkest existing semantic background in
   dark mode, while keeping the light theme's light, contrasting semantic surface.

## Evidence

- Inspector batches captured at `2026-08-11T11:13:39.719Z` and `2026-08-11T11:15:49.329Z`.
- The captured section is `section.hito-surface-flat.grid.min-w-0`, with computed 10px radius and
  a `1px solid` hairline border.
- The captured Manual copy is the sole paragraph at
  `p.hito-body.text-foreground/85`.
- The follow-up capture targets the same section after the earlier Lite implementation. It has the
  expected 16px radius and no border, but its dark `bg-surface` resolves lighter than the page's
  `--color-background`.

## Source Investigation And Demonstrated Cause

- `src/components/OnboardingGate.tsx:357-365` owns the introductory `Create a plan` micro-label.
- `src/components/OnboardingGate.tsx:388` is the sole plan-start section instance using the shared
  `hito-surface-flat` class.
- `src/components/OnboardingGate.tsx:482-486` owns only the Manual-mode divider and explanatory
  paragraph.
- The 10px radius is not custom: `src/styles/reference-workbench.css:36-40` gives
  `hito-surface-flat` `var(--radius-xl)`, and `src/styles/foundations.css:16,101` resolves it to
  `8px + 2px = 10px`.
- The existing Design System already provides the required larger token:
  `--radius-3xl` is `calc(var(--radius) + 8px)`, resolving to 16px. The existing semantic
  `--color-surface` provides the requested light-theme counterpart.
- The prior implementation used `bg-surface` in both themes. In dark Hito, `--surface` is a
  lighter surface than `--background`; the exact requested dark appearance is the existing
  `bg-background` utility. Hito already exposes the existing `.dark` variant, so the smallest
  theme-correct composition is `bg-surface dark:bg-background`.

The first incorrect owner is FRONTEND Product composition: the shared `hito-surface-flat` definition
is correct for its other consumers and must remain unchanged.

## Exact Existing Seams And Required Edits

Only `src/components/OnboardingGate.tsx` may change.

1. **Intro label — lines 357-365**
   - Remove only the `p.hito-micro-label` node whose text is `Create a plan`.
   - Remove only the now-unnecessary top margin on the following `h1`; retain its current
     `hito-ui-page-title` role, text, and all remaining introductory copy.

2. **Plan-start surface — line 388**
   - Remove `hito-surface-flat` from this one section instance; do not override its border with a
     local `border-0` rule.
   - Use existing semantic composition only: `rounded-3xl` for the existing 16px DS radius token
     and `bg-surface dark:bg-background` for the theme-aware surface color. This keeps the
     light-theme surface light and contrasted, while using Hito's darkest semantic background in
     dark mode. Preserve existing grid, min-width, gap, padding, and responsive padding utilities.
   - This is a borderless, theme-aware surface instance, not a new card/surface variant. Do not
     alter `hito-surface-flat` or any other consumer.

3. **Manual explanatory branch — lines 482-486**
   - Remove only `hito-section-divider` from this Manual-branch wrapper; retain `pt-6`.
   - Centre only the existing paragraph with an existing composition utility. Retain its text,
     typography role, Manual behavior, and surrounding tab/panel semantics.

## Expected Behavior

- The introductory `Create a plan` label no longer renders, with no artificial gap before the page
  title.
- The plan-start section has no perimeter border and uses the existing 16px DS radius. In dark mode
  it uses Hito's darkest semantic background; in light mode it uses the existing light semantic
  surface, visibly distinct from the page background. Neither theme uses a custom colour.
- Manual copy is centred with no divider above it.
- Generated/Manual tabs, baseline/BPM content, generated goal/preview flow, Manual creation,
  keyboard/ARIA behavior, persistence, and all other `hito-surface-flat` consumers are unchanged.

## Reuse-First Change Budget

- Existing seam: `OnboardingGate` route-local composition.
- Existing DS contracts: `--radius-3xl`, `--color-surface`, `--color-background`, the established
  `.dark` variant, `hito-ui-page-title`, `hito-body`, and current spacing utilities.
- New runtime artifacts: none.
- Removed responsibility: one shared-surface consumer use, two route-local label/divider nodes,
  and only now-unneeded margin/chrome.

## What Not To Touch

- `src/styles/reference-workbench.css`, `src/styles/foundations.css`, all shared DS CSS/tokens,
  Hito DS registration, Figma, or any other `hito-surface-flat` consumer.
- `PlanPresetPanel`, shared tabs, slider/BPM work, generated preview/persistence, Manual creation
  action, backend, auth, providers, data, or unrelated dirty work.
- No literal pixel, arbitrary color, custom class, new wrapper, primitive, helper, or compatibility
  style.

## Focused Validation Expectations

| Check                     | Scenario / environment                                               | Required evidence                                                                  |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Source ownership          | Only `OnboardingGate`                                                | Shared DS definitions and unrelated consumers unchanged                            |
| Generated/Manual behavior | Existing tabs and panels                                             | Both remain keyboard-accessible and behave identically                             |
| Visual                    | Desktop and exact 375×812, light/dark                                | No label/divider/border; 16px token radius; semantic surface contrast; no overflow |
| Static                    | Focused formatter, lint, and diff hygiene; build only if uncontended | Clean task-owned source                                                            |

This Lite task does not claim Global QA, hosted/release readiness, provider execution, staging,
commit, push, or deployment.

## Promotion Condition

Promote and stop only if `rounded-3xl`, `bg-surface`, or `dark:bg-background` does not resolve to
the documented existing Design System token contract, or if the requested instance behavior
requires changing shared DS source. Do not create a local substitute.

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-onboarding-plan-start-surface-and-manual-polish.md`

Read `AGENTS.md`, `agents/frontend.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. Read
`skills/hito-qa-browser-regression/SKILL.md` only for the required visual proof.

Implement only the four exact `OnboardingGate.tsx` source edits in the canonical item. Reuse the
existing `rounded-3xl`, `bg-surface`, and `dark:bg-background` DS composition for the one
plan-start section. The earlier completed `bg-surface`-only result is superseded: the section class
must be `grid min-w-0 gap-6 rounded-3xl bg-surface p-5 dark:bg-background lg:p-6` (equivalent
utility ordering is acceptable). Remove the shared surface class from that consumer rather than
overriding its border. Do not write CSS or an arbitrary visual value.

Do not edit any shared DS source, shared tabs, PlanPresetPanel, BPM/slider/persistence/backend work,
or unrelated dirty files. Add no component, token, wrapper, helper, state, artifact, or compatibility
path. Preserve all Generated/Manual behavior and accessibility.

Run focused static checks and browser proof at desktop and exact 375×812 in light/dark, including
tab keyboard navigation, no overflow, the exact dark/background versus light/surface computed
colour discriminator, and console health. Build only when no concurrent owner controls it. Do not
stage, commit, push, deploy, access hosted state, call providers, or delete data. Russian
commentary; English final receipt.
```

## Product Fix-Forward — 2026-08-11

The previous Lite receipt remains factual for border removal, radius, layout, Manual copy, and
behaviour. Its dark-theme colour result is superseded by the direct Inspector correction above:
`bg-surface` alone made the dark plan-start section lighter than Hito's darkest semantic
background. The reopen changes exactly one class composition to `bg-surface dark:bg-background`.
No shared Design System source, token, colour value, behaviour, or second surface is authorized.

## Frontend Lite Receipt — 2026-08-11

### Outcome And Boundary

Completed the three exact `OnboardingGate` consumer edits. The introductory micro-label and its
route-local title margin are removed; the plan-start section now composes the existing
`rounded-3xl bg-surface` utilities without `hito-surface-flat`; and the existing Manual copy is
centred in a `pt-6` wrapper without the divider class. Generated/Manual state, tabs, ARIA, actions,
baseline/BPM, preview, persistence, shared Design System source, and unrelated dirty hunks remain
unchanged. New production runtime artifacts: none.

### Files Changed

- `src/components/OnboardingGate.tsx`: three route-local markup/class edits only. Existing unrelated
  dirty onboarding work in the file was preserved.
- `docs/tasks/backlog/2026-08-11-onboarding-plan-start-surface-and-manual-polish.md`: lifecycle and
  this receipt.

### Focused Proof

| Check                    | Scenario / environment                  | Result | Evidence                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source ownership         | Exact `OnboardingGate` seams            | Passed | Intro label and `mt-3` are absent; the section uses `grid min-w-0 gap-6 rounded-3xl bg-surface p-5 lg:p-6`; Manual uses `pt-6` plus `hito-body text-center text-foreground/85`. No shared DS file changed in this slice. |
| Desktop light surface    | 1440×1000, authenticated onboarding     | Passed | Label count 0; border widths 0; computed radius 16px; semantic surface `oklch(0.988 0.006 82)` differs from page `oklch(0.972 0.01 78)`; horizontal overflow 0.                                                          |
| Desktop dark surface     | 1440×1000, authenticated onboarding     | Passed | Label count 0; border widths 0; computed radius 16px; semantic surface `oklch(0.19 0.005 60)` differs from page `oklch(0.16 0.005 60)`; horizontal overflow 0.                                                           |
| Exact mobile themes      | 375×812 light and dark                  | Passed | Plan-start section remained contained from x=16 to x=359 with width 343; tablist remained inside it; radius 16px, borders 0, semantic background contrast, and overflow 0 held in both themes.                           |
| Manual presentation      | Desktop light and 375×812 dark          | Passed | Existing copy remained exact and computed `text-align:center`; wrapper class is only `pt-6`, with 24px top padding and 0px top border.                                                                                   |
| Tab accessibility        | Generated/Manual keyboard replay        | Passed | ArrowRight/ArrowLeft moved focus and selection between both tabs; `aria-selected`, roving `tabindex`, and generated/manual panel visibility updated correctly.                                                           |
| Browser health           | Managed loopback `qa_fixture` runtime   | Passed | Console and page-error inventories were empty; no horizontal overflow or framework overlay; browser session closed.                                                                                                      |
| Data/provider boundary   | Existing `qa-saved-plan` local identity | Passed | Existing runner profile remained; plan/workout/log/evidence/provider usage counts stayed 0. No Create, preview, persistence, hosted, provider, reset, or delete action ran.                                              |
| Static checks            | Focused source and task item            | Passed | Prettier, ESLint, exact source assertions, and `git diff --check` passed.                                                                                                                                                |
| Production build/runtime | Canonical managed server, `qa_fixture`  | Passed | Client, SSR, Nitro, post-build integrity, and managed startup passed; only existing dependency-directive and chunk-size warnings remained.                                                                               |

### Acceptance Boundary

The focused Lite Implementation DoD is complete. No subagent was used because the direct
source/browser discriminator covered the complete three-edit contract without independent
rediscovery. Global QA Acceptance and release readiness remain unclaimed. Next owner: Product.
Blockers: none.

## Frontend Lite Fix-Forward Receipt — 2026-08-11

### Outcome And Boundary

Completed the current dark-surface decision at the existing route-local owner. The one plan-start
section now composes `bg-surface dark:bg-background`; every previously completed label, divider,
radius, tab, generated/manual, baseline/BPM, and action change remains intact. No shared Design
System source, CSS, token, component, state, persistence path, or runtime artifact was added.

### Files Changed

- `src/components/OnboardingGate.tsx`: added only the existing `dark:bg-background` utility to the
  task-owned plan-start section class list. All unrelated dirty hunks in the file were preserved.
- This canonical lifecycle item: fix-forward status and receipt only.

### Focused Proof

| Check                             | Scenario / environment                    | Result  | Evidence                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact consumer composition        | `OnboardingGate` plan-start section       | Passed  | Exact class is `grid min-w-0 gap-6 rounded-3xl bg-surface p-5 dark:bg-background lg:p-6`; no other source location changed in this fix-forward.                                                                                                                                                                                                                                                       |
| Existing token contract           | `src/styles/foundations.css` source audit | Passed  | `--color-background` maps to `--background`; dark `--background` maps to `--stone-900`, while light keeps the existing `bg-surface` mapping. `--radius-3xl` remains the existing 16px contract.                                                                                                                                                                                                       |
| Static hygiene                    | Focused TSX validation                    | Passed  | Prettier, ESLint, exact source search, and `git diff --check` passed.                                                                                                                                                                                                                                                                                                                                 |
| Final rendered dark discriminator | Fresh hydrated loopback                   | Not run | The direct dev path failed hydration on an unrelated server-only import, then shared production output became owned by two concurrent external builds. Per the task boundary, no competing build was forced. The prior receipt remains factual for geometry, light/mobile containment, tabs, Manual presentation, and behavior; only the final computed dark background lacks a fresh runtime replay. |

Implementation is complete without promotion: the documented existing utility supports the exact
decision and no shared DS change is required. The remaining browser coverage gap is explicit and
does not claim Global QA Acceptance or release readiness. Next owner: Product. Blockers: none.
