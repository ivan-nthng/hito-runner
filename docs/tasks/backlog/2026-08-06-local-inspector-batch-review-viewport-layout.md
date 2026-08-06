# Local Inspector Batch Review Viewport Layout

## Work Item ID

2026-08-06-local-inspector-batch-review-viewport-layout

## Status

in_progress

## Stage

Frontend DevTools implementation and integrated QA

## Type

change_request

## Priority

high

## Owner

frontend

## Frontend Lane

DevTools

## Scope

local-ui-inspector-batch-review

## Parent

[Developer Velocity And Proportional Verification](2026-08-05-developer-velocity-and-proportional-verification.md)

## Task

Make the loopback-only Local Inspector Batch Review fit entirely within the available viewport while
preserving its existing local-draft behavior. Replace the visually nested item container with a
plain, border-separated list: the header and action footer remain fixed inside the review surface,
and only the content between them scrolls.

## Product Input

- Keep the header with `Draft N of 8`, `Clear draft`, and the close action at the top.
- Remove the surrounding card/container treatment around saved draft items.
- Give the draft list no side padding. The items themselves are separated by borders rather than
  appearing as cards.
- Keep the footer at the bottom with `Generate prompt` / `Prompt copied`, `Continue selecting`,
  and the existing generated-prompt inspection path.
- The review surface must remain contained in the viewport; the middle content area owns the
  internal vertical scroll.
- Preserve all existing behavior, including edit, remove, clear, copy fallback, generated-prompt
  inspection, keyboard focus, focus restoration, and continued selection.

## Demonstrated Cause

The Batch Review root grid and its scroll body apply the height/grid-row/overflow constraints only
under `max-md`. At desktop width a multi-item draft grows to its content height, pushing the action
footer outside the visible review surface. The captured `1470x801` Local Inspector review with four
items shows this overflow.

Canonical owner: `src/components/devtools/LocalUiInspectorBatchReview.tsx`, with any required
containing-surface constraint discovered through its existing Local Inspector composition. This is a
DevTools layout contract, not a Product route, persistence, or shared Design System primitive change.

## Boundaries

- Local Inspector remains loopback-only and lazy-mounted; do not change its availability gate,
  session model, prompt generation, clipboard contract, or Product UI behavior.
- Reuse existing Hito primitives and tokens. Do not create a new DS component or alter shared
  `hito-list-row` behavior globally for this DevTools-only surface.
- Do not mutate Product data, fixtures, APIs, auth, providers, hosted state, or deployment.
- Preserve concurrent Design System and Product work.

## Definition Of Done

The Batch Review has a fixed header and footer, a single middle scroll region, and no outer
card-like container around the bordered item list. It remains fully usable and contained at desktop
and exact `375x812` viewports, with all existing local-draft interactions and focus behavior
preserved. This item is not Global QA acceptance.

## Required Evidence

- Root-cause replay at desktop with a multi-item draft before and after the owner correction.
- Desktop and exact `375x812` browser checks in light and dark themes: containment, internal scroll,
  no horizontal overflow, header/footer visibility, and draft-item interaction.
- Keyboard/focus checks for close, clear, item edit, item actions, generated prompt, copy state, and
  continue selection.
- Targeted static checks, the proportional DevTools build/runtime proof, and one independent
  bounded QA review.

## Next Recommended Role

frontend
