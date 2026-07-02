# Hito DS External Reuse And Theme Contract

## Status

backlog

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Define and implement a safe external reuse layer for Hito DS so other projects can use Hito primitives and tokens without destabilizing the Hito product.

## Stage

ARCHITECT plan / external reusable themeable Hito DS contract.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Define the implementation-ready architecture for Hito DS external reuse and theming.

Stage:
ARCHITECT plan / external reusable themeable Hito DS contract.

Plan:
docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md

Context:
Product wants to reuse Hito's design system in other projects without breaking the internal Hito product. The immediate goal is not to extract a full npm package. The first goal is a documented reuse layer inside /hitoDS that explains which primitives, tokens, and recipes are stable enough to copy or consume, and how another project can customize colors, radii, typography, spacing, shadows, density, and focus states through theme tokens.

Root cause:
Visible symptom: another project wants Hito-like UI consistency but cannot safely know what to copy, customize, or avoid.
Underlying cause: Hito DS currently exists as an app-owned internal system, not as a documented external reuse contract.
Canonical owner: Hito DS architecture/specimen layer first, then Frontend/Designer implementation. Do not start by creating a package or changing product runtime.

Scope:
1. Audit current Hito DS sources: src/styles.css, src/routes/hitoDS.tsx, src/components/ui/*, src/components/hito-ds/*, and existing DS plans/specs.
2. Classify primitives as reusable core, Hito-product-specific, workout-specific, internal-only, or not ready.
3. Define the theme token contract:
   - color tokens;
   - surface and border tokens;
   - typography tokens;
   - spacing and density tokens;
   - radius tokens;
   - shadow/elevation tokens;
   - focus and motion tokens.
4. Define the external customization model: another project may override theme tokens, but should not fork component anatomy or hardcode local visual values.
5. Define the custom-component rule: if a reusable component does not exist, build the custom component from Hito tokens first.
6. Define the /hitoDS Reuse section:
   - overview;
   - install/copy guidance;
   - theming guide;
   - token tables;
   - Button as the first component example;
   - examples of good token-based custom components;
   - examples of bad hardcoded local components;
   - public vs internal-only boundaries.
7. Decide whether phase 1 is documentation/specimen-only or includes light token normalization in src/styles.css.
8. Define a later package-extraction path only as a future phase, not as the first implementation.

Do not:
- Do not extract a package in the first slice unless Product explicitly approves it later.
- Do not rename or restructure current product classes just for external reuse.
- Do not move Hito app runtime to a new package yet.
- Do not mix workout-specific tokens or training-plan semantics into the generic external core.
- Do not create a broad enterprise design system.
- Do not break existing /hitoDS deep links or product screens.

Validation:
- Source audit with exact reusable/internal classifications.
- A compact implementation-ready spec or plan update.
- Scoped git diff --check for docs changes.
- If source changes are proposed for a later role, include exact FRONTEND/DESIGNER handoff and validation expectations.

Expected output:
Return one implementation-ready next-role prompt and a compact architecture decision record. Name what stays internal, what becomes reusable, and what is deferred.
```

## Owner

ARCHITECT / DESIGNER / FRONTEND

## Last Updated

2026-06-29

## Context

Hito already has a working internal design system: shared CSS tokens/classes in
`src/styles.css`, shared UI primitives, and the `/hitoDS` reference route. That internal system
should remain the source of truth for Hito product work.

The new product need is different: another project should be able to reuse the Hito visual language
without copying random app code, breaking Hito, or freezing stale styles. The outside project needs
clear instructions for:

- which Hito primitives are stable enough to reuse;
- which tokens can be overridden;
- how to create custom components that still feel consistent;
- what must remain Hito-product-specific.

## Problem Definition

Visible symptom:

- External projects can like Hito's visual language, but there is no safe public/reuse contract.
- A developer might copy random `styles.css` fragments, route-local classes, workout-specific colors,
  or one-off product surfaces and create drift immediately.

Underlying cause:

- Hito DS is currently app-owned and internal. It has strong primitives, but no documented external
  boundary, no theme override contract, and no public/internal classification.

Canonical owner:

- Hito DS architecture and specimen documentation first.
- Frontend implementation later, only after the public/internal contract is clear.

## Product Decision

Create an external reuse layer inside Hito DS before extracting a package.

Phase 1 should be documentation/specimen-first:

- keep Hito product runtime unchanged;
- add or plan a `/hitoDS` reuse section;
- document theme tokens and component recipes;
- show how another project can override theme values;
- show how to build custom components from tokens.

Do not start with an npm package. A package can become a later phase after the reuse contract proves
useful and stable.

## Core Principles

1. Hito product must keep working exactly as it does today.
2. External reuse should be opt-in and documented, not a hidden dependency on internal app code.
3. Components should read theme tokens, not hardcoded Hito brand values.
4. Another project may customize theme tokens, but should preserve component anatomy and interaction
   rules.
5. If a component does not exist, build the custom component from Hito tokens first.
6. Workout/training semantics are Hito-specific and must not leak into the generic external core.
7. Prefer a small useful reuse layer over a generic enterprise component library.

## Proposed Reusable Core

Initial reusable candidates:

- Button
- Link/button-like action
- Text field
- Date/time field wrapper
- Select/menu/popover shell
- Dialog/sheet shell
- Card/surface
- Status marker/pill
- Editable value chip
- Tabs/segmented choices
- Tooltip/help copy anatomy

Initial token families:

- color: text, muted text, accent, critical, success, surface, backdrop, border
- typography: display, title, body, caption, technical/mono
- spacing: page, section, row, control, compact control
- radius: control, card, dialog, menu, pill/dot exception
- elevation: surface, popover, dialog
- focus: ring color, ring width, outline behavior
- density: compact, default, spacious
- motion: duration/ease for simple hover/focus/reveal states

Internal-only candidates:

- workout type color taxonomy
- workout section color taxonomy
- training-plan readback semantics
- manual workout constructor behavior
- calendar workout persistence rules
- route-specific Hito onboarding and plan-management copy
- admin-only capture/debugger implementation details

## External Theme Model

External projects should be able to use a default Hito theme or define their own theme by overriding
CSS variables.

Example direction:

```css
:root {
  --hito-color-accent: #f97316;
  --hito-color-surface: #10100f;
  --hito-color-text: #f8f4ec;
  --hito-radius-card: 18px;
  --hito-radius-control: 12px;
  --hito-font-display: "Your Display Font";
  --hito-font-body: "Your Body Font";
}
```

This example is illustrative. The actual variable names must come from the current source audit and
should not be invented without checking `src/styles.css`.

## Custom Component Rule

If another project needs a component that Hito DS does not provide, the project should build it from
Hito tokens instead of hardcoding local values.

Good direction:

```css
.custom-feature-card {
  background: var(--hito-surface-base);
  border: 1px solid var(--hito-border-subtle);
  border-radius: var(--hito-radius-card);
  padding: var(--hito-space-6);
  color: var(--hito-text-primary);
}
```

Bad direction:

```css
.custom-feature-card {
  background: #111;
  border-radius: 999px;
  padding: 37px;
}
```

The exact token names should be corrected during the architecture/source audit.

## Phased Plan

### Phase 0: Hold Until Current Critical Gates Are Done

Do not interrupt:

- unified AI-generated plan creation readiness;
- manual template contract correction;
- any active blocker preventing normal product use.

This plan is high priority, but not higher than restoring core plan creation.

### Phase 1: Architecture And Classification

Owner: ARCHITECT.

Deliverables:

- reusable vs internal classification table;
- token-family map from live source;
- first external reuse boundary;
- decision on whether any token names need normalization before documentation;
- next role prompt for DESIGNER or FRONTEND.

### Phase 2: Designer Reuse Spec

Owner: DESIGNER.

Deliverables:

- `/hitoDS Reuse` IA;
- theme customization guide;
- component anatomy rules;
- Button example as the first fully documented reusable component;
- custom-component token usage examples;
- copy for public/internal warnings.

### Phase 3: Frontend Documentation/Specimen Implementation

Owner: FRONTEND.

Deliverables:

- `/hitoDS` Reuse section or page;
- default theme specimen;
- alternate theme specimen;
- copyable token examples;
- Button recipe and usage examples;
- at least one custom component example built only from tokens;
- no runtime behavior change to normal Hito product screens.

### Phase 4: QA / External Consumer Dry Run

Owner: QA.

Deliverables:

- browser proof for `/hitoDS Reuse`;
- desktop and 375px coverage;
- no console/page errors;
- token override example visually works;
- no internal workout/product tokens presented as generic external core.

### Phase 5: Package Extraction Decision

Owner: ARCHITECT / PRODUCT.

Only after the reuse section proves useful, decide whether to extract:

- no package yet, docs-only reuse;
- copyable CSS bundle;
- private npm package;
- monorepo package;
- Figma/library bridge.

## Acceptance Criteria

- Hito product behavior is unchanged.
- `/hitoDS` clearly distinguishes reusable core from Hito-specific internals.
- Another project can understand how to reuse Button and theme tokens without reading product route
  source.
- Theme overrides cover color, radius, typography, spacing/density, and focus at minimum.
- Custom component guidance exists and explicitly requires token-first construction.
- No broad package extraction happens before Product approves it.
- Future package extraction has a smaller, proven source contract.

## Risks

- Over-extracting too early and destabilizing Hito product work.
- Accidentally documenting route-local or workout-specific styles as reusable public API.
- Creating two design systems: internal Hito DS and external Hito DS.
- Theme overrides becoming too flexible and letting external projects break consistency.
- Naming tokens before checking live source, then forcing churn later.

## What Not To Touch

- Do not change runner-facing product UI in this planning slice.
- Do not change workout colors or training-plan semantics.
- Do not create a package yet.
- Do not rename live classes or variables without a later implementation owner and QA plan.
- Do not treat Figma as runtime truth.

## QA Expectations

Future QA should verify:

- `/hitoDS Reuse` loads on desktop and exact 375px;
- default and alternate theme specimens render correctly;
- copyable code examples match current source;
- no page-level horizontal overflow;
- no console/page errors;
- public/internal warnings are visible and understandable.

## Exit Criteria

This plan can close when:

- external reuse architecture is accepted;
- `/hitoDS Reuse` is implemented and QA-passed;
- the first component recipe and theme override examples are documented;
- Product has decided whether package extraction is still needed.

## Suggested Next Step

After the current critical plan-creation blockers are resolved, route the `Exact Handoff Prompt` to
ARCHITECT.
