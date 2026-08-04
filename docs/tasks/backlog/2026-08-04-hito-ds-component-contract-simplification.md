# Hito DS Component Contract Simplification

## Work Item ID

2026-08-04-hito-ds-component-contract-simplification

## Status

in_progress

## Type

plan

## Priority

high

## Owner

design_system

## Scope

design-system-and-figma-bridge

## Archive Intent

retain_in_place

## Task

Simplify Hito DS component contracts and their product adoption without changing Hito's visual
language, product behavior, persistence, or accessibility. Reduce only source-proven variant, size,
API, CSS ownership, and reference-surface complexity, then migrate product consumers one component
family at a time with shared-owner and consumer-level regression proof.

## Stage

DESIGN SYSTEM shared-contract implementation and integrated QA. Slice 0 through Slice 5 shared
owners are being completed in the accepted order. Calendar's CVA/shadcn Button boundary remains
deferred. Product-route migrations remain Frontend Product work and are not silently absorbed by
this owner.

## Product Review Summary

The foundations are no longer the primary source of Hito DS complexity. The accepted foundation
slice already provides a code-owned token and reusable typography manifest. The next meaningful
cleanup boundary is the component contract above those foundations:

- shared CSS offers broad size, hierarchy, tone, state, and theme combinations;
- product consumers usually assemble those contracts through raw class strings;
- some shared React components use Hito classes, while the legacy shadcn/CVA `Button` remains a
  separate compatibility owner;
- `/hitoDS` can present a larger theoretical matrix than current Product use proves necessary;
- shared control CSS and domain-specific onboarding/manual-workout CSS still coexist in very large
  files, making ownership harder to inspect;
- several size tiers appear unused in literal source scans, but dynamic reference construction means
  they cannot be deleted from counts alone.

The recommended program is not a redesign and not a one-shot rewrite. Product should approve a
sequence of bounded component-family slices. Every slice first proves current reachability, updates
the shared owner, migrates representative consumers, validates behavior and visuals, then removes
the superseded path only after zero-consumer proof.

## Accepted Product Direction

The user has accepted the following direction for Product review:

1. Keep the implemented Hito product stable while simplifying the system behind it.
2. Prefer fewer supported component variants and sizes when current Product usage proves they are
   unnecessary.
3. Establish one readable component variant grammar rather than repeating unclear class recipes.
4. Move Product consumers toward canonical shared component APIs without creating a second Hito UI
   library.
5. Separate canonical reusable control ownership from route/domain composition where source files
   currently mix both.
6. Keep `/hitoDS` catalog examples aligned to supported Product truth instead of displaying an
   unbounded Cartesian product of possible combinations.
7. Add automated conformance checks before deleting compatibility paths.
8. Make every retained component reusable from the canonical Hito primitive contract rather than
   from one Product route, reference specimen, or application-specific CSS recipe.

## Relationship To Existing Work

### Accepted prerequisite

- [Hito DS Code-To-Figma Foundation Cleanup](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md)
  remains the prerequisite foundation record. Its code-owned manifest, primitive/semantic token
  contract, and reusable typography export boundary are accepted at owner level and must not be
  reopened by this program.

### Current source and reference truth

- `src/styles.css` and its imported `src/styles/*.css` files own canonical runtime styling.
- `src/components/ui/*` owns shared interactive primitives and compatibility wrappers.
- `src/components/hito-ds/*` and `src/routes/hitoDS*.tsx` own the live internal reference.
- Product routes and components prove which contracts are actually used.
- Figma remains downstream and is not part of this component cleanup until component contracts are
  stable.

### Supporting context

- [Hito DS Information Architecture And Specimen Contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Hito DS Discoverability, Agent Contract, And Safe Reuse Plan](../../plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md)
- [Hito DS Component Adoption And Custom UI Audit](../frontend-specs/2026-06-23-hito-ds-component-adoption-and-custom-ui-audit.md)
- [Service-Wide Hito DS Conformance Audit](../frontend-specs/2026-07-18-service-wide-hito-ds-conformance-audit.md)
- [Hito Primitive Token Consistency Audit](../frontend-specs/2026-06-22-hito-primitive-token-consistency-audit.md)

## Evidence Snapshot

Source observations were taken on revision `329f45c27ff25928c4daad963f24f967e197200c` in a dirty
working tree. Counts are audit evidence, not deletion authorization; each implementation slice must
refresh its own reachability proof and preserve unrelated concurrent changes.

### Repository scale

- `src/components/ui` currently contains 29 files.
- `src/components/hito-ds` currently contains 25 files.
- The two roots contain approximately 183 exported or named component/function declarations by a
  broad text scan. This is a navigation signal, not a semantic component count.
- `src/styles/controls-lists.css` contains the main Button, Tab, binary selection, Choice Toggle,
  list, and metadata contracts.
- `src/styles/forms-onboarding.css` is larger than 2,200 lines and contains both reusable field
  ownership and onboarding/manual-workout domain anatomy.

### Literal size reachability

The following table counts files containing literal size-class names. `Product files` excludes
`src/components/hito-ds/**`. `Reference files` includes Hito DS reference owners. Dynamic class
construction can make the reference count incomplete.

| Family / tier           | Product files | Reference files | Audit classification                                      |
| ----------------------- | ------------: | --------------: | --------------------------------------------------------- |
| `hito-button-xs`        |            15 |               4 | Canonical, heavily used                                   |
| `hito-button-sm`        |            25 |               9 | Canonical, heavily used                                   |
| `hito-button-md`        |            22 |               5 | Canonical, heavily used                                   |
| `hito-button-lg`        |             8 |       0 literal | Canonical Product use; reference parity must be checked   |
| `hito-button-xl`        |             0 |       0 literal | Conditional deletion candidate                            |
| `hito-field-xs`         |             1 |       0 literal | Low-use tier; keep until the exact consumer is classified |
| `hito-field-sm`         |             8 |               2 | Canonical                                                 |
| `hito-field-md`         |             9 |               2 | Canonical                                                 |
| `hito-field-lg`         |             2 |       0 literal | Product-used; reference parity must be checked            |
| `hito-field-xl`         |             0 |       0 literal | Conditional deletion candidate                            |
| `hito-choice-toggle-xs` |             2 |               4 | Canonical compact tier                                    |
| `hito-choice-toggle-sm` |             3 |               3 | Canonical common tier                                     |
| `hito-choice-toggle-md` |             0 |       0 literal | Conditional deletion candidate                            |
| `hito-choice-toggle-lg` |             2 |       0 literal | Product-used large choice tier                            |
| `hito-choice-toggle-xl` |             0 |       0 literal | Conditional deletion candidate                            |

These values do not justify deletion by themselves. `/hitoDS` builds several matrices from arrays
such as `BUTTON_SIZES`, `FIELD_SIZES`, and `CHOICE_TOGGLE_SIZES`, and helper components may compose
class names dynamically. A deletion gate must inspect both static and generated reachability.

### Button contract evidence

`src/styles/controls-lists.css` currently exposes:

- base `hito-button` behavior;
- sizes `xs`, `sm`, `md`, `lg`, and `xl`;
- hierarchies `primary`, `secondary`, `outlined`, and `ghost`;
- semantic tones `default`, `success`, and `error` across multiple hierarchies;
- native and demo-only hover, active, focus, disabled, loading, success, error, pressed, and timed
  progress presentations;
- theme-specific overrides for parts of the matrix.

This is a coherent visual language, but it creates a large theoretical combination surface. Product
source confirms that semantic success/error buttons are real, including admin destructive actions
and status-dependent actions. Product source does not yet prove every hierarchy x tone x state
combination. The first Button slice therefore needs an exact matrix, not an assumption that all or
none should remain.

### Split React ownership evidence

- Product surfaces commonly render raw class strings such as
  `hito-button hito-button-primary hito-button-lg`.
- `src/components/ui/input.tsx` already resolves a default Hito field recipe through a shared React
  wrapper.
- `src/components/ui/select.tsx`, `dropdown-menu.tsx`, Dialog, Popover, Slider, editable fields, and
  related primitives already combine shared behavior with Hito classes.
- `src/components/ui/button.tsx` remains a shadcn/CVA Button with a different visual variant and size
  vocabulary. `src/components/ui/calendar.tsx` uses this compatibility boundary.

The correct direction is one canonical Hito Button API for normal Hito Product use, but Calendar's
existing CVA/shadcn dependency must not be silently absorbed or broken. Its replacement proof is a
separate compatibility gate inside the Button family, not an opportunistic rename.

### Choice-toggle evidence

The current contract separates:

- base anatomy: `hito-choice-toggle`;
- optional presentation: `hito-choice-toggle-card`;
- size: `hito-choice-toggle-{tier}`;
- runtime truth: `data-selected`, `aria-checked`, `aria-pressed`, `disabled`, and invalid state;
- local composition: `flex-1`, `min-w-0`, width, wrapping, and alignment utilities.

This separation is technically valid, but wrapper call sites can make it noisy. For example, a
shared group may add the base class while a caller passes
`hito-choice-toggle-xs min-w-0 flex-1`. The size class is component configuration; the width and flex
classes are legitimate local composition. The target is a clearer public API, not moving route
layout into the shared primitive.

### Typography evidence

`src/lib/hito-typography-roles.ts` is the central role inventory used by Hito DS, Inspector, and the
generated foundation manifest. It currently defines 19 roles:

- 14 reusable Text Style roles eligible for downstream export;
- 5 component-bound roles that remain inside Button, menu, metric, status, and feedback component
  families.

The role source is already canonical. Simplification should improve grouping, discoverability, and
provenance coverage without renaming stable classes or treating component-bound text as generic Text
Styles.

### Composition and exception evidence

- `hito-row-group`, `hito-list-row`, `hito-list-row-title`, `hito-list-row-copy`,
  `hito-state-surface`, and `hito-surface-flat` are broadly reused and should remain distinct.
- Route-local padding such as `p-4` or `p-6` on a semantic state surface is often valid local
  composition. It should become a component variant only when repeated anatomy proves a shared
  behavior.
- Calendar-cell sizing, body-map coordinates, workout timeline geometry, chart dimensions, skeleton
  placeholders, and DevTools overlays contain local measurements that represent geometry rather
  than ordinary component chrome. They remain documented exceptions.
- Raw values inside a shared primitive can be valid for optical alignment or constrained geometry;
  raw values in route-level control chrome remain suspected drift.

## Current DS Classification

### Canonical and keep

- Code-owned primitive and semantic token manifest.
- Stable semantic token names and dark/light theme meanings.
- The 14 reusable typography roles and their provenance contract.
- Shared icon registry and icon sizing contract.
- Shared surface, row, divider, status, menu, overlay, slider, editable-value, date/time, and calendar
  day primitives where current consumers already use them.
- Button tiers `xs`, `sm`, `md`, and `lg` until a later exact matrix proves a narrower family.
- Field tiers `sm`, `md`, and current Product-used `xs`/`lg` cases.
- Choice tiers `xs`, `sm`, and Product-used `lg`.
- Semantic runtime state represented through native attributes, ARIA, and bounded `data-*` state.
- Layout utilities such as `min-w-0`, `flex-1`, grid columns, and responsive stacking when they
  describe the consumer's composition rather than component behavior.

### Noisy but currently acceptable

- Base class plus one explicit size and one hierarchy class in raw Product markup.
- Demo-only `data-demo-state` in inert `/hitoDS` Variants specimens.
- Route-local padding on open semantic surfaces when the route owns section density.
- Shared primitives that expose small compatibility props while Product migration remains
  incomplete.

### Simplification candidates

- Replace normal Product raw Button class assembly with one shared Hito Button prop-to-class owner.
- Give shared Choice/selection wrappers typed size and presentation inputs so callers do not pass
  component modifier classes as strings.
- Align Field/Input/Textarea/NativeSelect size vocabulary and defaults behind shared APIs.
- Separate reusable field/control CSS ownership from onboarding/manual-workout domain anatomy while
  preserving byte-equivalent presentation in the extraction slice.
- Reduce `/hitoDS` controls and matrices to supported combinations plus purposeful state examples.
- Group typography reference roles by display, reading, control, metadata, and technical purpose
  without changing their runtime class names.
- Add one conformance validator for retired modifiers, unsupported combinations, raw route chrome,
  and reference/runtime parity.

### Conditional deletion candidates

- `hito-button-xl`.
- `hito-field-xl`.
- `hito-choice-toggle-md`.
- `hito-choice-toggle-xl`.
- Any hierarchy x tone x state Button recipe that has no Product, shared primitive, reference,
  Inspector, fixture, or generated consumer after dynamic reachability analysis.
- Any reference-only control or caption path removed by a simplified supported-variants catalog.
- Any compatibility class after every known consumer has migrated and the replacement passes
  browser and build validation.

None of these candidates is approved for deletion by this audit.

### Preserve as domain or visualization exceptions

- Workout taxonomy colors and their semantic meanings.
- Calendar day and workout row geometry.
- Workout structure visualization dimensions and plotted geometry.
- Body-map coordinates and silhouettes.
- Skeleton sizes that model content layout rather than shared control chrome.
- Editorial/changelog rail geometry.
- Local DevTools overlay geometry and capture masks.

## Demonstrated Root Cause

The visible problem is that Hito DS feels larger and harder to reason about than the Product needs.
The first incorrect owner is not one route and not the foundation token layer. It is the distributed
component configuration contract:

1. Component semantics live in canonical CSS classes.
2. Product call sites manually compose those classes.
3. Some shared React wrappers expose a separate prop vocabulary.
4. `/hitoDS` documents both real combinations and theoretical combinations.
5. Large CSS owner files mix reusable primitives and domain composition.

That distribution makes it difficult to answer which variants are supported, which are merely
possible, and which can be deleted. A route-local restyle would patch the symptom. The root-cause
program must make supported component contracts explicit and then retire proven duplicate paths.

## Proposed Target Contract

Every interactive component family should expose the same conceptual grammar, even when its public
implementation differs:

| Layer             | Owns                                                        | Must not own                            |
| ----------------- | ----------------------------------------------------------- | --------------------------------------- |
| Component         | Base anatomy, semantics, accessibility, behavior            | Route layout                            |
| Size              | One supported control tier                                  | Tone, validation, selection             |
| Variant           | Hierarchy or presentation role                              | Runtime state                           |
| Tone              | Semantic meaning such as signal, success, warn, destructive | Arbitrary color preference              |
| State             | Native/ARIA/product lifecycle truth                         | Reference-only fake behavior in Product |
| Local composition | Width, flex/grid placement, wrapping, responsive position   | Component chrome                        |

Recommended naming behavior:

- Public React consumers should prefer typed `size`, `variant`, and `tone` inputs where a shared
  primitive exists.
- Canonical CSS classes remain stable implementation hooks during migration; do not rename every
  class merely to make DevTools shorter.
- `data-*` attributes represent semantic state or bounded demo-only state, not general styling
  configuration.
- `data-demo-state` remains allowed only in inert/static reference specimens and must never pin a
  live interactive demo into a pseudo-state.
- Layout utilities remain at the consumer because `flex-1` and `min-w-0` describe placement, not
  Choice Toggle anatomy.
- A compatibility class or wrapper must record owner, current consumers, reason, and exact removal
  condition.

## Product Decisions Requested

Product should review and explicitly accept or revise these decisions before the first code slice:

1. **Program boundary:** simplify contracts and adoption without changing the current visual
   language, copy, flows, or data behavior.
2. **Migration strategy:** one component family at a time; no repository-wide class rename.
3. **API direction:** normal Product consumers move toward shared typed Hito component APIs while
   canonical CSS remains the styling owner.
4. **Deletion rule:** apparent zero-use sizes and combinations remain until dynamic reachability,
   browser proof, and replacement proof pass.
5. **Compatibility rule:** Calendar's current CVA/shadcn Button boundary remains intact until a
   dedicated Button compatibility discriminator proves a safe replacement.
6. **Reference rule:** `/hitoDS` shows only supported variants and purposeful states, while
   intentionally custom/domain geometry stays documented as an exception.
7. **Validation cost:** each cross-surface family migration includes owner-level independent QA;
   broad Global QA remains a later release gate.

Recommended Product answer: accept all eight as the default program contract.

## Product Decision

Product accepts the eight proposed program decisions without changing the current visual language,
Product behavior, or data lifecycle. Slice 0 is the first selected task. Calendar Button
compatibility remains explicitly deferred during the first Button-family work. The order after an
accepted baseline is Button, then Field, then Choice; no later family is authorized until the prior
slice has its owner-level receipt. Every retained component must be reusable from the canonical Hito
primitive contract, with no route-owned clone presented as a shared capability.

## Reuse And Distribution Contract

Hito DS has one reusable composition direction: canonical tokens and typography roles -> shared Hito
primitives -> component families -> Product consumers and `/hitoDS` reference. A Product route,
fixture, Inspector surface, Figma board, or external consumer may compose these contracts but may
not become an alternative primitive or component owner.

The public reuse surface is the canonical shared primitives, their documented APIs, `/hitoDS`, and
the generated downstream manifest. This keeps the system consumable by future applications without
making Figma or a route-local CSS recipe the source of truth. Packaging the system for an external
repository is a later delivery decision; it must reuse this same surface rather than create a forked
library or second build of Hito DS.

## Autonomous Design System Execution

Design System executes its shared-contract program without returning to Product after each ordinary
slice. It progresses in this order: Slice 0 baseline, Button shared contract, Field shared contract,
Choice shared contract, typography presentation/provenance, then catalog and conformance closeout.
For each slice it establishes evidence, implements only its shared-owner boundary, runs the complete
owner validation and an independent QA review, fixes forward, and records the receipt here before
moving on.

The owner may use up to four active, non-nested subagents per slice for independent consumer
reachability, compatibility review, browser QA, or architecture review. It must not open duplicate
workers, delegate further, or leave unfinished review work behind.

The program stops and returns only for a real owner boundary: a required Product-route migration, a
Calendar compatibility change, a change to Product visual language or supported semantics, a Figma
file/import decision, an active concurrent owner on a required file, or a failed required proof that
cannot be fixed inside Design System ownership. No stop is permitted merely because an ordinary
cleanup or QA step remains.

## Rollout Plan

### Slice 0: Contract and reachability baseline

Owner: `design_system` with read-only Product-consumer and architecture review.

Outcome:

- generate an exact component-family inventory for Button, Field, and Choice;
- classify every size, variant, tone, state, wrapper, and dynamic `/hitoDS` path;
- record the Calendar Button compatibility boundary;
- produce deterministic checks that fail if an unsupported or retired recipe returns.

Primary files:

- `src/styles/controls-lists.css`
- `src/styles/forms-onboarding.css`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/native-select-field.tsx`
- `src/components/hito-ds/reference-components-controls.tsx`
- `src/components/hito-ds/specimen-previews.tsx`
- `src/components/ui/calendar.tsx`

Required proof:

- static and dynamic consumer matrix;
- exact unsupported/retired candidate list;
- no source or rendered behavior changes;
- validator determinism and scoped diff hygiene.

Stop condition:

- any candidate has an unresolved shared, Product, DevTools, reference, fixture, or generated
  consumer.

### Slice 1: Button contract consolidation

Owner: `design_system`; Product route migration is a separate `frontend` Product-lane slice after
the shared API is accepted.

Outcome:

- establish one canonical Hito Button React API backed by existing Hito CSS;
- preserve supported sizes, hierarchy, tones, motion states, icon-only behavior, loading guards,
  native attributes, and polymorphic/link needs proven by consumers;
- keep a documented compatibility boundary for `src/components/ui/calendar.tsx` unless replacement
  proof is part of this slice;
- update `/hitoDS` to present only supported combinations;
- remove only superseded DS demo helpers and zero-consumer CSS recipes.

Representative Product consumers for later migration:

- `src/components/AuthEntryScreen.tsx`
- `src/components/AppShell.tsx`
- `src/components/TodayHero.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/PlanManagementDialog.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/plan-management/*`
- `src/components/manual-workout/*`
- `src/routes/login.tsx`
- `src/routes/settings.tsx`
- `src/routes/admin.login.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`

Required proof:

- source matrix for each retained variant/tone/size/state;
- no one-click/one-dispatch, loading, success/error, disabled, or link behavior regression;
- dark/light, desktop, exact 375px, keyboard, focus-visible, and Safari-sensitive proof where a
  visible interaction changes;
- production build and independent owner-level QA.

### Slice 2: Field family ownership and extraction

Owner: `design_system`; representative Product consumers are reviewed before broad migration.

Outcome:

- align Input, Textarea, native Select, date/time, editable value, and related field sizing around
  the existing supported Hito control tiers;
- keep helper/error/success, readonly, disabled, invalid, clear, and focus contracts explicit;
- extract shared field/control CSS ownership from onboarding/manual-workout domain anatomy without a
  visual change in the extraction step;
- retire `field-xl` only if dynamic and runtime reachability are both zero;
- update `/hitoDS` with real shared primitives rather than duplicate reference-only inputs.

Representative Product consumers:

- `src/routes/login.tsx`
- `src/routes/settings.tsx`
- `src/routes/admin.login.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`
- `src/components/OnboardingGate.tsx`
- `src/components/onboarding/*`
- `src/components/manual-workout/*`
- `src/components/CompletionPanel.tsx`
- `src/components/workout-completion/BodyNotesEditor.tsx`

Required proof:

- input value, validation, blur, Enter, Tab, Escape, clear, disabled, readonly, selection, and
  persistence behavior remains owned by the existing consumer/primitive;
- geometry parity before and after extraction;
- desktop and exact 375px no-overflow proof;
- targeted lint, build, and independent owner-level QA.

### Slice 3: Choice and selection contract consolidation

Owner: `design_system`; Product migrations use the Product Frontend lane.

Outcome:

- preserve one base Choice Toggle anatomy with typed size and optional card presentation;
- keep radio/checkbox/toggle semantics and roving/keyboard behavior in their existing shared owners;
- keep consumer layout utilities local;
- remove unsupported `md` or `xl` tiers only after dynamic reference and Product reachability proof;
- align `/hitoDS` Demo and Variants to the real supported family.

Representative consumers:

- `src/components/Calendar.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/onboarding/TrainingPreferenceFields.tsx`
- `src/components/onboarding/onboarding-choice-controls.tsx`
- `src/components/onboarding/PlanPresetPanel.tsx`
- `src/components/settings/ThemePreferenceSection.tsx`
- `src/components/settings/theme-preference-controls.tsx`
- `src/components/devtools/LocalUiChromeControls.tsx`

Required proof:

- click, Space, Enter where applicable, arrow navigation for radio groups, selected/current
  announcement, disabled and invalid states, focus-visible, wrapping, and 375px containment;
- calendar view switching, completion outcome/interval selection, onboarding preferences, and theme
  selection preserve Product truth;
- no local compatibility selectors are added.

### Slice 4: Typography presentation and provenance completion

Owner: `design_system`.

Outcome:

- keep the current central inventory and stable class names;
- group reusable roles by display, reading, control label, metadata, and technical use;
- keep component-bound roles visibly separate from reusable Text Styles;
- confirm all generic Product typography either carries canonical provenance or is an intentional
  domain/route exception;
- simplify `/hitoDS` typography navigation and examples without adding a second registry.

Required proof:

- central inventory remains the only Hito role registry;
- 14 reusable Text Styles remain manifest-parity unless a separately accepted semantic decision
  changes the set;
- Inspector and `/hitoDS` ownership remains truthful;
- no visual typography regression on representative Product surfaces.

### Slice 5: Catalog and conformance closeout

Owner: `design_system` with independent QA.

Outcome:

- `/hitoDS` lists only supported variants and purposeful inert state specimens;
- real Demos use real interactive primitives and are not pinned into fake pseudo-states;
- retired controls, captions, matrix paths, and CSS recipes are deleted after consumer migration;
- one conformance validator protects the accepted contract.

Validator coverage should include:

- forbidden retired classes or modifiers;
- unsupported variant/tone/size combinations;
- raw colors/radii/shadows in ordinary Product component chrome;
- manual control recipes where a canonical shared primitive is required;
- `data-demo-state` outside Hito DS static reference ownership;
- `/hitoDS` sizes/variants that do not match the supported runtime contract;
- explicit allowlists for visualization, calendar geometry, skeleton, editorial, and DevTools
  exceptions.

Required proof:

- validator fails on a controlled discriminator and passes on accepted source;
- zero consumer reachability for every removed path;
- `/hitoDS` desktop and exact 375px, dark/light, browsing, Demo/Variants, keyboard, focus, and no
  page-level overflow;
- representative Product browser smoke coverage for every migrated family;
- production build, integrity, and independent owner-level QA.

## Product Rollout Order

Use this order after each shared family is accepted:

1. `/hitoDS` real Demo plus one low-risk internal/admin consumer.
2. Settings and authentication forms where lifecycle is bounded and observable.
3. Onboarding choices and fields, preserving plan-authoring inputs.
4. Completion controls, preserving workout-log payload and status truth.
5. Calendar and active-plan controls, preserving date/workout/editability truth.
6. Remaining manual-workout, progress, integrations, admin, and DevTools consumers.
7. Compatibility deletion and final conformance validator enforcement.

Do not migrate all routes in one diff. Two or three representative consumers per family should prove
the shared contract before a broader mechanical migration.

## Guardrails

### Do not touch in the first implementation slice

- primitive or semantic token values already accepted by the foundation cleanup;
- the spacing scale or core radius scale;
- dark palette, light semantic meanings, or broad theme architecture;
- workout taxonomy colors;
- Dialog, Sheet, Popover, Select, Dropdown, Toast, or motion behavior unless a fresh source-backed
  defect in that family receives its own task;
- Calendar day/workout row geometry;
- `HitoDualRange`, `HitoSlider`, editable-value lifecycle, date/time masking, or product validation;
- Product copy, product state, navigation IA, backend data, persistence, auth, provider calls, or
  generated-plan lifecycles;
- Figma file mutation, component export, bidirectional synchronization, or Code Connect.

### Never do as cleanup shortcuts

- delete a class because `rg` finds zero literal strings while a dynamic builder exists;
- replace semantic classes with raw Tailwind utilities;
- hide compatibility behind route-local overrides;
- move consumer width or grid rules into a shared component just to shorten markup;
- rename all stable classes for cosmetic DevTools brevity;
- preserve two public component APIs indefinitely without an owner and removal condition;
- treat every local geometry value as a missing global token;
- present a simplified `/hitoDS` specimen as proof that Product consumers were migrated.

## Required Per-Slice Evidence

Every implementation slice must publish an Execution preflight and end with one integrated receipt:

| Check                    | Scenario / environment                                  | Required result                             | Evidence                                             |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| Root-cause discriminator | Current revision and named family                       | First incorrect shared owner is proven      | Source graph, failing validator, or browser evidence |
| Reachability             | Static, dynamic, reference, generated, fixture          | Every deletion candidate is classified      | Exact consumer matrix                                |
| Shared primitive         | `/hitoDS` real Demo                                     | Supported API and state truth work          | Source and browser evidence                          |
| Product consumers        | Named representative routes                             | Behavior/copy/data unchanged                | Browser and source evidence                          |
| Accessibility            | Keyboard, focus-visible, labels, ARIA, disabled/invalid | Existing semantic contract remains truthful | DOM/browser evidence                                 |
| Responsive               | Desktop and exact 375px                                 | No component or page-level overflow         | Browser evidence                                     |
| Themes                   | Dark and light                                          | Semantic hierarchy remains coherent         | Browser/computed-style evidence                      |
| Safari risk              | Visible interaction or overlay-sensitive changes        | No Safari-specific regression               | Safari proof when required                           |
| Static checks            | Touched files                                           | Targeted lint/format/validator pass         | Command output                                       |
| Build integrity          | Fresh production build                                  | Build and integrity pass                    | Command output                                       |
| Diff hygiene             | Scoped changed-file manifest                            | No unrelated work absorbed                  | `git diff`, `git diff --check`                       |
| Independent QA           | Same owner-level slice                                  | Required inventory passes                   | Independent QA report                                |

Any failed, blocked, flaky, or omitted required check keeps that slice open. Owner-level acceptance
is `Implementation DoD`; broad release acceptance remains `Global QA Acceptance: Pending` until a
separate release matrix passes.

## Documentation Contract

For every accepted component-family change:

- update `/hitoDS` in the same slice;
- update the generated manifest only if the accepted exportable foundation or typography contract
  changes;
- update `docs/current-product.md` or `docs/current-system.md` only when implemented truth changes;
- update this work item with the accepted slice receipt and remaining candidates;
- add changelog history only after a user-visible or maintainer-visible outcome is implemented and
  QA-passed;
- do not create a new supporting spec when this canonical backlog item plus source evidence is
  sufficient.

## Role Context

### PRODUCT

Owns acceptance of the program boundary, sequencing, and any decision that would alter visible
Product hierarchy, supported control sizes, or compatibility lifetime. Product converts one bounded
slice to `ready`, records one exact handoff, and dispatches only after explicit user authorization.

### DESIGN SYSTEM

Owns shared component APIs, canonical DS CSS, `/hitoDS`, conformance validation, compatibility
documentation, shared-primitives implementation, and integrated independent QA for each bounded
slice.

### FRONTEND, Product lane

Owns migration of runner/admin Product consumers after the shared contract is accepted. It must not
invent route-local compatibility recipes or change Product lifecycle truth.

### FRONTEND, DevTools lane

Owns only Local Inspector consumer adoption when an accepted shared contract affects DevTools. It
must not alter Product components to accommodate Inspector.

### ARCHITECT

Provides read-only review when public API consolidation, source-file ownership, or compatibility
deletion could create a parallel library or hidden dependency.

### QA

Provides bounded independent owner-level validation inside each implementation slice. Global QA is
separate and should run only after the selected cross-surface rollout is complete.

## Definition Of Done For This Program

This program is complete only when:

- every retained Button, Field, and Choice size/variant/tone/state has a current consumer or an
  explicit reusable contract reason;
- normal Product consumers use the accepted shared API rather than manual repeated component-chrome
  recipes;
- compatibility APIs either have documented owners/removal conditions or have been safely removed;
- reusable control CSS and domain composition have clear source ownership;
- the typography registry remains singular and easier to browse;
- `/hitoDS` matches supported runtime truth and no obsolete matrix/caption path remains;
- conformance validation prevents retired drift from returning;
- every product migration preserves behavior, persistence, accessibility, themes, and responsive
  layout;
- all selected slices have `Implementation DoD: Passed` receipts;
- any required broader release check reports `Global QA Acceptance` separately.

## Current Blockers

- The exact dynamic variant/size reachability matrix is intentionally deferred to Slice 0 and must
  precede any deletion.
- Calendar's CVA/shadcn Button compatibility lifetime requires explicit source proof before it can be
  changed.

## Product Review Questions

1. Does Product accept the eight proposed program decisions without changing visible Product
   behavior or visual language?
2. Should the first executable slice be the evidence-only contract/reachability baseline, as
   recommended?
3. Does Product want Calendar Button compatibility to remain explicitly deferred during the first
   Button API slice?
4. After the baseline, should Product prioritize Button migration before Field and Choice, as
   recommended by current reachability and repeated raw class usage?

## Handoff Context

### Summary

The foundation token and typography export layer is accepted. The next root-cause cleanup is the
distributed component contract across CSS, React wrappers, Product class strings, and `/hitoDS`
matrices. This work item defines a safe multi-slice program and does not authorize implementation.

### Key Decisions

- Preserve visual and Product behavior while simplifying component ownership.
- Prove every deletion through dynamic and runtime reachability.
- Move one component family at a time toward a shared typed API.
- Keep route layout local and documented geometry exceptions out of generic DS cleanup.

### Current State

- Foundation manifest and reusable typography truth already exist.
- Button, Field, and Choice contracts are broadly reused but expose a larger and noisier public
  surface than Product use currently proves necessary.
- No component class, size, variant, or compatibility API is approved for deletion yet.

### Constraints

- Preserve unrelated dirty worktree changes.
- No Product logic, persistence, backend, auth, provider, Figma, or broad visual redesign work.
- `/hitoDS` is reference truth but not proof of Product migration.

### Risks / Open Questions

- Dynamic class generation can hide reference consumers from literal scans.
- The legacy CVA Button still owns a Calendar compatibility seam.
- A broad migration would make regressions hard to localize; rollout must stay family-bounded.

### Next Recommended Role

PRODUCT

### Suggested Next Step

Review and accept or revise the seven Product decisions, then select Slice 0 as the first bounded
execution task and add one exact Design System handoff only after explicit dispatch approval.
