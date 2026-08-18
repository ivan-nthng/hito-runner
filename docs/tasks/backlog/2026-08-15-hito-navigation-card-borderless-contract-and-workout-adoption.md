# Hito Navigation Card Borderless Contract And Workout Adoption — 2026-08-15

## Work Item ID

2026-08-15-hito-navigation-card-borderless-contract-and-workout-adoption

## Status

backlog

## Type

Tracked — shared Design System contract followed by Product adoption

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

Correct the canonical `HitoNavigationCard` chrome, then replace the sole Workout previous/next
route-local recipe with that component. The Design System owns the first primitive/reference stage;
FRONTEND Product owns the later route adoption and deletion of the retired local recipe.

## Archive Intent

Compact terminal closeout after Design System contract proof, Product adoption, and independent
focused QA.

## Task

The Navigation Card must be a borderless navigation surface. Its previous/next arrows are bare
decorative icons: no arrow border, no arrow fill, and no independent arrow-button chrome. Preserve a
whole-card native-link hit target, hover/focus/active behavior, direction, date, label, title, and
keyboard access.

After the shared component is corrected, adopt it for the Workout detail Previous/Next links and
delete the now-superseded local `NavCard` markup and `.hito-nav-card*` CSS recipe.

## User Report

Inspector item `2c6e3365-29a3-4067-85db-9afccdecfb03`, captured
`2026-08-15T18:56:51.765Z` on `/workout/2026-08-15?tab=overview`, Light `1470×801`, selected
`a.hito-nav-card`.

Ivan reiterates that the card border and the border/background around the arrow must be removed, and
that this reusable component must exist in the Design System. The report preserves the selected
Product route, `a.hito-nav-card` selector, `16px` padding evidence, `10px` observed radius, observed
border, and Design System-level scope from the Inspector packet.

## Observed Behavior

- Workout still renders its route-local `NavCard` in `src/routes/workout.$date.tsx` and applies the
  old `.hito-nav-card*` rules from `src/styles/calendar-state-surfaces.css`.
- That legacy rule supplies the outer card border and `.hito-nav-card-arrow` supplies a `28px`
  bordered arrow box; Light mode also supplies arrow background chrome.
- The browser-visible Workout surface therefore did not change when the new shared component was
  introduced.

## Source Investigation

- `src/components/ui/hito-navigation-card.tsx` exists and is the canonical shared component. It is
  physically documented in `/hitoDS/patterns#navigation-card` through two previous/next examples in
  `src/components/hito-ds/reference-patterns-page.tsx`; the reference explicitly says “Product
  adoption pending.”
- Its icons are already bare (`data-hito-navigation-card-arrow`, no `hito-nav-card-arrow` wrapper),
  but the shared anchor itself still carries `border border-hairline`. That violates the current
  instruction for a borderless card.
- The existing component-contract validator confirms the native anchor, directional metadata,
  bare decorative arrows, focus ring, and physical reference. The guard must be aligned to the
  borderless treatment, rather than preserving the retired Product recipe.
- The Workout route is the sole remaining `.hito-nav-card` consumer. Its local recipe can be
  deleted only after the route uses the shared component and navigation behavior is proven.

## Demonstrated Root Cause

The Design System primitive and its reference were created, but the Product route was deliberately
left pending adoption. In parallel, the primitive retained an outer border. Consequently, the
visible Workout card is still the obsolete local implementation and even the new reference is not
yet fully aligned with Ivan's borderless decision.

## Expected Behavior

- `/hitoDS/patterns#navigation-card` visibly documents both directions as borderless navigation
  cards with bare arrows, a full-card link target, and accessible focus treatment.
- Workout Previous/Next uses that exact shared component; the legacy local card and arrow-box CSS
  are absent.
- No card border, arrow border, or arrow background appears at rest, hover, active, or focus.
- Focus visibility and semantic/native-link keyboard activation remain intact; hover treatment
  applies to the card, not as a separate arrow control.

## Stage Plan

1. **DESIGN SYSTEM:** correct `HitoNavigationCard` and its direct validator/reference expectation
   using existing tokens and primitives. Do not add a token, CSS file, compatibility component, or
   route-specific override.
2. **FRONTEND — Product:** adopt the corrected component in `src/routes/workout.$date.tsx`. Preserve
   TanStack route semantics; if the current anchor-only API cannot do so without a downstream
   workaround, return that exact shared-component contract gap to PRODUCT rather than recreating a
   local recipe. Delete the one-use `NavCard` and `.hito-nav-card*` CSS only when no consumer remains.
3. **QA:** independently replay the reference and Workout Previous/Next links in Light/Dark at
   desktop and narrow widths, including pointer, physical Enter, focus-visible, history/navigation,
   containment, and console health.

## What Not To Touch

Workout sidebar data work tracked in
`2026-08-15-hito-workout-sidebar-week-summary-and-latest-insight`, the currently separate iPad
Calendar recovery, unrelated navigation surfaces, shared `hito-row-group` chrome, data/persistence,
Figma, hosted services, staging, commit, push, or deployment.

## Validation Expectations

Design System proof must cover its physical reference, the borderless component contract, and
focused static checks. Product proof must cover previous and next destinations, browser Back, focus
and physical Enter activation, responsive overflow, and the absence of legacy selectors. QA follows
only after both stages complete. No Global QA, release, or deployment claim belongs to this item.

## Promotion Condition

The task remains Tracked because it crosses the shared primitive and Product route owners. Return to
PRODUCT if route semantics require a new shared API decision or if any other consumer of the legacy
recipe is discovered.
