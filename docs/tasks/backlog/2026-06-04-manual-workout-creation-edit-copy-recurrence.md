# Manual Workout Creation, Editing, Copy, Templates, And Recurrence

- **Work Item ID:** `2026-06-04-manual-workout-creation-edit-copy-recurrence`
- **Status:** `closed`
- **Type:** `change_request`
- **Priority:** `high`
- **Owner:** `PRODUCT`
- **Scope:** `manual-workout-authoring`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Define the runner path for building a plan manually: begin with an empty Calendar, add a structured
workout or accepted template, reuse workout prescriptions, and treat recurrence as a separately
reviewed capability rather than a hidden scheduling side effect.

## Final Decision

This request was closed after its broad architecture was superseded by the accepted manual-workout
authoring plan and coaching taxonomy. The durable ownership split is:

- BACKEND owns typed workout blocks, validation, normalization, review/confirm, mutation safety,
  and persistence.
- FRONTEND owns the constructor and Calendar interaction over backend-shaped truth.
- RUNNING COACH owns workout identity, template doctrine, and safe training semantics.
- DESIGN SYSTEM owns shared controls and visual primitives.
- A workout is composed from structured ordered blocks, including bounded Repeat children; it is
  not a collection of unrelated per-part cards.
- Copy reuses prescription truth only. Recurrence was intentionally excluded from the first
  authoring contract and requires its own accepted behavior and persistence proof.

## Durable Sources

- [Manual Workout Authoring And User-Built Plans](../../plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- [Manual Workout Constructor Taxonomy And Template Library](../running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md)

## Evidence And Residual Boundary

This item records a superseded request and contains no independent implementation or QA receipt.
The linked plan and coaching source own the accepted architecture; later canonical implementation
items own current runtime status. Do not use the deleted historical handoff prompts as executable
instructions. Any remaining recurrence work needs a new Product decision and canonical owner.
