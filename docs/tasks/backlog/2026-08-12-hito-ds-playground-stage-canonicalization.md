# Hito DS Playground Stage Canonicalization

## Work Item ID

2026-08-12-hito-ds-playground-stage-canonicalization

## Status

completed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Canonicalize every shared `HitoDsPlayground` Demo stage so it is a quiet visual field for the
actual component, not a nested piece of documentation:

1. remove the generic Demo-stage radial gradient and perimeter border at their shared owner;
2. make the shared Demo stage resolve to the existing dark semantic canvas/background in Dark and a
   token-governed contrasting surface in Light — no raw black or local colour recipe;
3. raise its shared outer radius to the existing 16px `--radius-3xl` contract; and
4. remove stage-local explanatory chrome/copy across all `HitoDsPlayground` consumer families,
   while retaining only the rendered component, any genuine component state/content, and its
   required semantics.

This is an `/hitoDS` reference-shell and reference-content task. It does not alter Product routes,
the actual shared primitives being demonstrated, or their visual/behavioral contracts.

## Archive Intent

retain_in_place

## User Evidence

Inspector batch `03a9f382-055d-4806-b2aa-436a8e0a41cf`, captured 2026-08-12 at 02:42:15:

| Field             | Captured fact                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route             | `/hitoDS/componentsapp-shell` (Inspector route string; selector is the source authority)                                                                                |
| Theme / viewport  | Dark, `1470×801`                                                                                                                                                        |
| Target            | `article.hito-ds-playground-stage`                                                                                                                                      |
| Selector          | `#dropdowns > div:nth-of-type(2) > div:nth-of-type(2) > article`                                                                                                        |
| Scope             | All cards like this — shared source owner                                                                                                                               |
| Observed chrome   | 56px padding; 10px radius; 1px `#FFFFFF07` border; gradient-backed stage                                                                                                |
| Requested outcome | Keep only the necessary component in the sandbox; remove explanatory noise, gradient and border; use a dark background and a larger radius across matching playgrounds. |

Product clarification: **all explanation copy inside similar playground stages is to be removed.**
Documentation above the stage and interactive controls beside it are not stage content and remain
unless their own separate task says otherwise.

## Observed Behavior

- `src/styles/reference-workbench.css:181-195` applies one Demo-stage recipe to all
  `HitoDsPlayground` instances: radial signal gradient, translucent background, perimeter border,
  `--radius-xl` and large padding.
- `src/components/hito-ds/playground.tsx:153-161` makes that stage the shared shell around every
  Demo/Variants payload.
- There are 34 `HitoDsPlayground` uses across eleven Hito DS source modules. Several stage payloads
  repeat scaffolding such as Demo/Variants labels, current-state headings, descriptive sentences,
  status pills, instruction rows and separators around the real component.
- The captured Dropdown source is one demonstrated example:
  `src/components/hito-ds/dropdown-family-playground.tsx:116-128` emits a Demo/Variants label,
  explanatory heading, status pill and border before the actual dropdown. The Async action toasts
  stage has the analogous copied labels at
  `src/components/hito-ds/reference-components-overlays.tsx:325-357`.

## Demonstrated Root Cause

The generic stage contract currently treats every demo as an atmospheric documentation card, while
individual family stages also place their instructional narration inside that card. The result is
two competing documentation layers around a component that is already described by the shared
`HitoDsPlayground` header and its adjacent properties panel.

The first incorrect shared owner is the canonical Demo-stage rule in
`src/styles/reference-workbench.css`; individual stage payloads are the second owner of duplicated
instructional material. Removing copy only in Dropdown would leave the root chrome and every other
playground unchanged.

## Accepted Product Direction

### Shared stage appearance

- The Demo stage becomes a calm, flat visual field: no radial gradient, no perimeter border, and
  16px radius through existing `--radius-3xl`.
- In Dark, the field uses the existing darkest semantic canvas/background role. In Light, it uses
  the corresponding existing semantic contrast role selected from the current DS palette after the
  designer verifies the reference hierarchy. It must never introduce raw black, raw white, a new
  opacity formula, a new colour token, or per-page CSS.
- Variants remains a content matrix rather than receiving a fake card treatment. Its current
  borderless/transparent outer treatment remains unless source evidence proves a specific shared
  correction is needed.

### Stage content

- Each Demo stage shows only the actual canonical component(s) needed to demonstrate that component
  and the minimum live state/value that makes its behavior factual.
- Remove labels, headings, pills, helper sentences, instruction rows, separators and wrappers whose
  sole purpose is to narrate `Demo`, `Variants`, current state, anatomy, implementation status,
  placement or wrapper ownership. The Dropdown’s `Demo`, `One real trigger, one real dropdown`, and
  `Shared wrapper` are explicit deletion examples.
- Keep user-operable labels, button/menu item text, field labels/placeholders, selected values,
  component-visible feedback, error content, loading state when it is the component state under
  demonstration, keyboard/ARIA semantics and required overlay content. Do not turn a factual
  component into an unlabeled or inaccessible mock.
- The outer `HitoDsPlayground` header, its purpose/use/avoid/accessibility documentation, tabs,
  anchors and properties controls are not inside the sandbox and remain. The separate generic
  `Component` eyebrow task is not expanded here.

## Existing Seams To Inspect

- `src/styles/reference-workbench.css:181-201` — shared stage Demo/Variants appearance; this is the
  first canonical owner and the permitted shared CSS edit.
- `src/components/hito-ds/playground.tsx:153-161` — shared shell; inspect before adding any API.
- All direct families that provide the `demo`/`variants` payload, beginning with:
  `dropdown-family-playground.tsx`, `reference-components-overlays.tsx`,
  `reference-components-controls.tsx`, `reference-components-structure.tsx`,
  `calendar-workout-playground.tsx`, `slider-playground.tsx`,
  `editable-value-field-sandbox.tsx`, `motion-system-playground.tsx`,
  `workout-library-playground.tsx`, `reference-pattern-inline-editing.tsx`, and
  `reference-patterns-page.tsx`.
- `src/styles/foundations.css:16-18` — read-only proof that `--radius-3xl` is the existing 16px
  scale. The Inspector’s `--radius-2xl = 16px` label is not authoritative.

## Reuse-First Change Budget

- Reuse the current `HitoDsPlayground` shell, its Demo/Variants panel model, existing semantic
  surface tokens, `--radius-3xl`, existing components, Hito typography and composition utilities.
- New runtime artifacts, component APIs, wrapper recipes, tokens, CSS files/classes, literals,
  registries and compatibility paths: **none**.
- The only permitted CSS edit is simplifying the existing canonical Demo-stage selector at its
  existing shared owner. Do not duplicate it with a per-family selector or override.
- Delete superseded stage narration and its now-empty wrapper/divider where safe. Do not leave a
  hidden or second documentation path active.

## What Not To Touch

- No Product route, public UI, Backend, persistence, provider, Auth, Figma, generated manifest,
  token values, primitive contracts, dependencies, build configuration or hosted state.
- No changes to the actual `DropdownMenu`, Toast/Sonner, Dialog, Calendar, Field, Slider, Tabs,
  Selection, Data Table, App Shell, row or other primitive behavior merely because its reference
  wrapper becomes simpler.
- No removal of required content labels, ARIA names, error messages, selected values, state feedback
  or live component copy.
- Do not modify the generic `Component` eyebrow/header or sidebar wording owned by
  `2026-08-12-hito-ds-navigation-and-async-toast-demo-clarity.md`.
- Preserve all unrelated dirty work byte-for-byte.

## Definition Of Done

1. All `HitoDsPlayground` Demo stages use one simplified shared flat stage rule: semantic background,
   no gradient, no perimeter border, existing 16px radius; no route-local stage CSS exists.
2. Each direct Playground consumer is audited. Its Demo content contains the real component and
   factual state only; all duplicated explanatory stage chrome is deleted, while real component
   semantics/content remain.
3. The Dropdown stage exposed by the Inspector has no Demo/Variants narration, wrapper/status pill
   or divider around its actual dropdown; controls, component behavior and variants remain truthful.
4. The Async Toast demonstration’s staged instructional content is handled under the same rule, so
   its older unexecuted scoped stage requirement is not implemented twice.
5. Dark resolves to the canonical darkest semantic background, Light remains visibly separated using
   only approved existing semantic roles, and both layouts are readable without a border.
6. Variants matrices remain readable and interactive; no overlay is clipped and no page-level
   horizontal overflow or console error is introduced.

## Validation Expectations

| Check                  | Scenario / environment                                             | Required evidence                                                                                                     |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Root owner             | Source/diff                                                        | One shared Demo-stage recipe changes; no per-family CSS override, token or raw colour/radius appears.                 |
| Content audit          | All 34 Playground uses / 11 source modules                         | Each Demo/Variants payload classified as retained factual content or deleted stage narration; no unexplained residue. |
| Captured Dropdown      | `/hitoDS/components#dropdowns`, Dark/Light, desktop and `375×812`  | Actual trigger/menu remains; captured narration, border and gradient are absent; controls/tabs work.                  |
| Representative variety | Toast, Dialog/Sheet, Field, Slider, Calendar, Data Table/App Shell | Required interaction/state labels remain while stage narration is gone; overlays are not clipped.                     |
| Themes/layout          | `/hitoDS`, `1470×801` and exact `375×812`, Dark/Light              | Dark flat background, Light contrast, 16px corners, no page overflow.                                                 |
| Accessibility          | Keyboard tabs, trigger/focus, Escape where relevant                | Existing control semantics and focus behavior remain intact.                                                          |
| Static/build           | Current checkout                                                   | DS validator, focused Prettier/ESLint, `git diff --check`, production build or exact contention boundary.             |

Global QA, Figma parity, release readiness and product adoption are outside scope.

## Stage

Design System implementation completed with focused local verification.

## Next Recommended Role

product

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked

Execute the canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-playground-stage-canonicalization.md`

Read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and the canonical item before the first write.
Read `skills/hito-qa-browser-regression/SKILL.md` before browser proof. Read
`skills/hito-architecture-audit/SKILL.md` only if source investigation changes the demonstrated
shared owner.

Own the shared `/hitoDS` `HitoDsPlayground` Demo-stage repair. Reuse the canonical stage rule in
`src/styles/reference-workbench.css` and the current shell in
`src/components/hito-ds/playground.tsx`; audit all direct Demo/Variants payload families named in
the item. Remove the shared gradient and perimeter border, use only the existing semantic theme
roles, retain the existing 16px `--radius-3xl` contract, and delete only stage-local narration that
duplicates documentation already outside the sandbox. Keep the real interactive component, its
meaningful state/value, labels, ARIA semantics, feedback, and overlay content.

Use the existing sidebar roles as bounded read-only subagents where they materially improve the
work: obtain a DESIGNER review of the Dark/Light semantic hierarchy before finalising the shared
stage decision, and an independent QA browser review after your focused proof. You remain
accountable for the source owner, final integration, and receipt. Do not create a parallel stage,
token, component family, registry, or per-family CSS override.

Do not change Product routes, primitives being demonstrated, generated manifests, Figma, Backend,
persistence, Auth, dependencies, hosted state, or unrelated dirty work. Do not stage, commit,
push, deploy, call providers, or access hosted state.

Validate the captured Dropdown and representative Toast, Dialog/Sheet, Field, Slider, Calendar,
Data Table/App Shell examples at 1470×801 and exact 375×812 in Dark and Light. Prove keyboard and
overlay behaviour, no overflow or console errors, focused static checks, and a production build or
the exact contention boundary. Russian in-progress commentary; English formal receipt. Do not claim
Global QA or release readiness.
```

## Blockers

None for the Design System implementation slice. Exact `1470×801` and `375×812` replay remains an
environment coverage gap because the available in-app browser was fixed at `1280×720`, Chrome could
not reach the loopback runtime, and the fresh Vite client hit an unrelated server-only import
protection error. This does not demonstrate a task-owned Playground failure.

## Implementation Receipt — 2026-08-12

### Preflight and outcome

- Reused the existing `.hito-ds-playground-stage[data-mode="demo"]` owner and the unchanged
  `HitoDsPlayground` shell. New runtime artifacts, component APIs, tokens, wrappers, registries,
  compatibility paths and dependencies: **none**.
- Simplified the shared Demo stage to one flat semantic field: Dark uses `--color-background`, Light
  uses `--color-surface`, the perimeter border and radial gradient are removed, and the existing
  `--radius-3xl` resolves the required 16px radius. Variants remains transparent and borderless.
- Removed only duplicated stage narration and stage-only framing from Dropdown, Field/Status, Toast,
  App Shell, Workout Library and Inline Editing demonstrations. Real controls, factual values,
  feedback, labels, ARIA semantics and overlay content remain.
- The current source map contains **19** `HitoDsPlayground` shells across **11** modules, not the
  work item's stale 34-use observation. Independent QA classified 17 tabbed shells plus two
  preview-only shells, covering 36 current payloads.

### Source hierarchy

Changed:

- `src/styles/reference-workbench.css`
- `src/components/hito-ds/dropdown-family-playground.tsx`
- `src/components/hito-ds/reference-components-controls.tsx`
- `src/components/hito-ds/reference-components-overlays.tsx`
- `src/components/hito-ds/reference-components-structure.tsx`
- `src/components/hito-ds/workout-library-playground.tsx`
- `src/components/hito-ds/reference-pattern-inline-editing.tsx`

Inspected and retained unchanged for this task: `src/components/hito-ds/playground.tsx`, all other
direct payload families, generated manifests, package files and shared primitives being
demonstrated. Material source growth: none; the task is a net responsibility/copy reduction plus
one semantic Light-theme companion rule.

### Validation inventory

| Check                      | Scenario / environment                       | Result                         | Evidence                                                                                                                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shared owner               | Source discriminator                         | Passed                         | One Demo selector owns `border: 0`, `var(--radius-3xl)` and Dark background; one Light-theme companion selects surface. No gradient, raw colour or family override remains.                                                                                                                                        |
| Consumer audit             | Current 19 shells / 11 modules               | Passed                         | Source search and independent QA covered all 36 current payloads; stale narration discriminators are absent from changed families.                                                                                                                                                                                 |
| DS validator               | `npm run validate-hito-ds-components`        | Passed                         | Contract validator scanned 323 files and returned `contract ok`.                                                                                                                                                                                                                                                   |
| Focused lint               | Task-owned TSX files                         | Passed                         | ESLint exited 0.                                                                                                                                                                                                                                                                                                   |
| Focused format             | Task-owned CSS/TSX files                     | Passed                         | Prettier check exited 0.                                                                                                                                                                                                                                                                                           |
| Diff hygiene               | Task-owned paths                             | Passed                         | `git diff --check` exited 0.                                                                                                                                                                                                                                                                                       |
| Build compilation          | Fresh uncontended `npm run build`            | Passed through compilation     | Client, SSR and Nitro compilation completed. The command then failed only at the unrelated private Admin repository snapshot integrity marker/digest check.                                                                                                                                                        |
| Components rendering       | `/hitoDS/components`, Dark/Light, `1280×720` | Passed                         | All 13 rendered Demo stages had zero border, no background image, 16px radius, semantic theme contrast, visible overflow and zero page overflow.                                                                                                                                                                   |
| Representative interaction | Hydrated Components runtime                  | Passed with one narrow gap     | Dropdown, Toast, Dialog, Sheet, Field, Calendar mobile renderer and Data Table menu were exercised; overlays remained visible, Escape closed modal overlays, and console logs were empty. Slider focus/value/restoration UI remained present, but native keyboard value mutation was not independently attributed. |
| Patterns rendering         | `/hitoDS/patterns`, Light, `1280×720`        | Passed for SSR/source geometry | Five rendered Demo stages had the canonical chrome and zero overflow; App Shell, Inline Editing and current content remained. Fresh hydration was blocked by the unrelated `runner-calendar-context.ts` server-only import reaching the client graph.                                                              |
| Exact requested matrix     | `1470×801` and `375×812`, Dark/Light         | Not run — environment gap      | In-app Browser exposes a fixed `1280×720` viewport; the alternative Chrome path could not reach loopback. Exact mobile containment and exact target-size screenshots therefore remain unverified.                                                                                                                  |
| Independent reviews        | DESIGNER and QA                              | Passed with stated gaps        | DESIGNER approved the Dark/Light semantic hierarchy and narration boundary. QA found no task-owned failure and returned `Passed with environment coverage gaps`.                                                                                                                                                   |

### Preserved boundaries and closure

Product routes, demonstrated primitive behavior, generated manifests, token values, Figma, Backend,
persistence, Auth, dependencies and unrelated dirty hunks were not changed. The temporary task-owned
Vite runtime was stopped after review; no managed fixture QA server was stopped. This receipt proves
the focused Design System implementation slice only. It does not claim exact responsive browser
acceptance, Global QA, release readiness or deployment readiness.
