# Hito DS Navigation Card Quiet Surface Composition

## Work Item ID

2026-08-17-hito-ds-navigation-card-quiet-surface-composition

## Status

completed

## Type

Lite — shared Design System recipe consolidation

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

Make the existing `hito-surface-quiet` the one canonical visual recipe for the existing
`HitoNavigationCard`. The navigation component remains a semantic native-anchor composition; it
must not retain its own duplicate outer surface chrome.

## Archive Intent

Retain through the focused shared-recipe proof and then compact to the canonical owner,
composition, removed duplicate chrome, and validation result.

## Task

Move the existing quiet surface recipe out of reference-only CSS and colocate it with the canonical
surface recipes. Then compose it in `HitoNavigationCard`, deleting its duplicate radius,
background, hover, transition, and focus surface styling while preserving its link anatomy,
directional content, and accessible focus behavior.

## User Report

Ivan observed that Navigation Card can reuse quiet surface instead of becoming another visual card
entity. He requested one source of truth for design recipes and asked why a shared recipe currently
lives in reference CSS.

## Source Investigation

- [styles.css](../../../src/styles.css) is the one stylesheet entry point, but imports focused
  owner files. That is not a second theme or alternate runtime style path.
- `hito-surface`, `hito-surface-flat`, and `hito-surface-wash` already share
  [overlays-feedback.css](../../../src/styles/overlays-feedback.css).
- `hito-surface-quiet` is instead in
  [reference-workbench.css](../../../src/styles/reference-workbench.css), despite defining a shared
  interactive surface recipe.
- [HitoNavigationCard](../../../src/components/ui/hito-navigation-card.tsx) separately hard-codes
  the same outer concerns: `rounded-xl`, background, hover background, transition, and focus ring.
  It does not currently compose `hito-surface-quiet`.

## Expected Behavior

- `hito-surface-quiet` has one canonical shared CSS owner beside the other surface recipes.
- `HitoNavigationCard` composes quiet for its outer visual treatment and owns only its native-link
  semantics, previous/next anatomy, layout, dates, labels, arrows, and content alignment.
- `/hitoDS` quiet samples and Navigation Card remain visually and behaviorally coherent in Light and
  Dark without a second card API or a route-specific override.

## What Not To Touch

- Do not merge or rename `hito-surface-flat`, `hito-surface`, or semantic `hito-surface-wash` in
  this Lite slice. Wash carries tone/state meaning and is not an ordinary card recipe.
- Do not collapse all stylesheets, add a global Card abstraction, introduce a new component API,
  change Product-owned `.hito-nav-card`, alter Local Inspector, tokens, persistence, fixtures,
  Figma, hosted state, dependencies, or Git lifecycle.
- Do not alter Navigation Card's native anchor semantics, direction, text, arrow content, hit area,
  hover/focus accessibility, or route behavior.

## Lite Preflight

- **Decision / evidence:** direct Product decision plus source-proven duplicate outer chrome and an
  incorrectly located shared quiet recipe.
- **Existing seams:** `styles.css`, `overlays-feedback.css`, `reference-workbench.css`, existing
  `HitoNavigationCard`, existing `/hitoDS` Patterns references, and the existing DS validator.
- **Smallest change:** relocate the one existing quiet recipe to the existing surface-recipe owner;
  make Navigation Card compose it; delete only the now-duplicate component-level outer chrome.
- **New runtime artifacts:** none.
- **Simplification:** one quiet visual owner and no component-specific surface recipe.
- **Focused proof:** source reachability confirms one quiet declaration and Navigation Card
  composition; desktop/mobile Light/Dark samples preserve link, hover, focus-visible, containment,
  and console health.
- **Promotion:** promote to Tracked if source inspection proves that another production owner needs
  a behavior change, or if unifying the recipe requires a surface API, token, or cross-owner visual
  migration.

## Definition Of Done

1. Exactly one canonical `hito-surface-quiet` declaration remains, colocated with the other shared
   surface recipes rather than reference-only CSS.
2. `HitoNavigationCard` composes quiet and has no duplicate outer radius, fill, hover, transition,
   or focus surface recipe.
3. Existing quiet reference samples and Navigation Card retain native-link, hover, focus-visible,
   Light/Dark, desktop/mobile, containment, and console contracts.
4. No generic Card abstraction, compatibility selector, second quiet recipe, or unrelated surface
   consolidation is introduced.

## Lite Implementation Receipt — 2026-08-17

- **Task / mode:** Hito DS Navigation Card Quiet Surface Composition; Lite shared Design System
  recipe consolidation.
- **Outcome and root cause:** `hito-surface-quiet` was a shared interactive recipe incorrectly
  owned by reference-only CSS while `HitoNavigationCard` duplicated its radius, fill, hover,
  transition, and focus chrome. The complete quiet recipe now has one canonical owner in
  `overlays-feedback.css`, beside the existing shared surface recipes. No new runtime artifact,
  token, selector alias, component, API, or compatibility path was introduced.
- **Files changed:**
  - `src/styles/overlays-feedback.css` — now owns the unchanged quiet base, interactive transition,
    hover fill, and focus-visible ring declarations.
  - `src/styles/reference-workbench.css` — deleted the superseded quiet recipe; reference-only
    layout remains.
  - `src/components/ui/hito-navigation-card.tsx` — composes `hito-surface-quiet` and retains only
    native-anchor layout/anatomy classes; duplicate radius, fill, hover, transition, and focus
    utilities were removed.
  - `scripts/validate-hito-ds-component-contracts.ts` — now enforces the shared quiet owner,
    reference-owner absence, Navigation Card composition, and duplicate-chrome deletion.
  - This canonical item — recorded the focused proof and terminal lifecycle.
- **Source proof:** repository search finds one quiet base declaration, in
  `overlays-feedback.css`. The Navigation Card root class contains `hito-surface-quiet` and no
  duplicate outer visual utilities. Existing Brand and shell specimens remain consumers; no
  Product route or Product-owned `.hito-nav-card` changed.
- **Static proof:** focused Prettier and ESLint passed; manifest parity passed with 43 primitive
  colours, 41 semantic colours, and 14 text styles; `git diff --check` passed. The task-owned Design
  System validator assertions passed. The full validator remains red only on the unrelated existing
  documentation assertion: `Current product, system, and state docs must record the
production-shipped /hitoDS role.`
- **Build and browser proof:** a fresh managed `qa_fixture` production build passed and was admitted
  as managed, compatible, healthy, build-present, and `fresh/receipt_matches`. At 1470x801 and
  375x812 in Light and Dark, both Navigation Cards and the Brand quiet reference computed the same
  borderless 10px-radius quiet surface, remained contained, and showed the canonical quiet hover
  fill. Physical keyboard focus produced the existing visible whole-card ring, and the previous
  card remained one native anchor whose click navigated to `#notice-surface`. Console warn/error
  output was empty.
- **Remaining boundary / promotion:** no promotion was required. `hito-surface`,
  `hito-surface-flat`, semantic `hito-surface-wash`, Product-owned `.hito-nav-card`, Product routes,
  Local Inspector, tokens, fixtures, Figma, hosted state, and Git lifecycle remain unchanged. No
  Global QA or release readiness is claimed.
- **Operating record:** role file `agents/design-system.agent.md`; project skills
  `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`; Browser control skill used for focused local proof;
  no subagent used.
