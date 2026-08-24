# Hito DS Foundations Light Token Specimen Surface Contrast Batch

Work Item ID: `2026-08-17-hito-ds-foundations-light-token-specimen-surface-contrast-batch`
Status: backlog
Type: Bug batch — Design System Foundations reference surface contrast
Priority: medium
Owner: FRONTEND / Design System
Scope: Correct the shared Light-theme fill for every existing `.hito-ds-token-specimen-surface` reference card; retain its current shared selector and semantic token model.
Archive Intent: Retain through one DESIGN SYSTEM fix and focused Light/Dark reference acceptance; compact to cause, affected shared selector, token choice, and proof.
Evidence From: [Foundations Reference Specimen Surface Unification](./2026-08-11-hito-ds-foundations-reference-specimen-surface-unification.md)

## Task

Make Foundation token-specimen cards visibly distinct from the Light reference canvas without adding
borders, literal colours, a component-specific override, or a second card recipe. The shared token
surface should use the existing semantic Surface role in Light; Dark must retain an intentional,
validated semantic result.

## User Report

On `/hitoDS/foundationsfoundations` at 1470×801 Light, Ivan selected `Copy ring semantic token` and
reported that its card is invisible against the page background. He requested the lightest existing
surface treatment across all equivalent cards, not a one-instance fix.

## Inspector Evidence

- Item: `f8628c78-868e-448c-853b-a4677d22324c`.
- Target: `button[aria-label="Copy ring semantic token"]` with
  `.hito-ds-token-specimen-surface`.
- Observed fill: `--background` / `#FAF5EE`.
- Requested fill: existing `--surface` / `#FDFBF7`.
- The selector appears across Foundations, Brand, and Figma reference consumers; this batch covers
  that shared Light reference recipe only.

## Observed Behavior

The shared selector in `src/styles/reference-workbench.css` sets
`background: var(--color-background)`. The selected semantic token card and its surrounding
reference canvas therefore resolve to the same Light fill.

## Expected Behavior

Every existing token-specimen card using the shared selector resolves to the semantic Surface fill
in Light and remains visibly separate without decorative chrome. It remains keyboard-accessible and
does not alter token values, copied text, reference data, or the Dark palette by assumption.

## Source Investigation

The first incorrect owner is the shared `.hito-ds-token-specimen-surface` declaration in
`src/styles/reference-workbench.css`. `SemanticColorCard` in
`src/components/hito-ds/reference-foundations-page.tsx` is a consumer; it must not acquire a local
class or inline override.

## Batch Admission

Add later Inspector findings only when they concern the same shared selector, the same Light
reference-surface contrast outcome, and the same focused proof. A different component recipe,
Dark-only issue, control state, or data problem is a separate work item.

## What Not To Touch

- Do not add literal white, a new token, a border, shadow, or a second reference-card class.
- Do not change semantic token values, copied payloads, Figma, Product routes, Admin, runtime data,
  fixture, importer, or hosted state.
- Do not reopen the completed terminal receipts named above.

## Validation Expectations

Prove the shared selector’s semantic resolution and all admitted reference consumers in Light and
Dark, keyboard focus/copy behavior, responsive containment, focused Design System validation, and
diff hygiene. Promote to Tracked before implementation if another shared surface owner, changed
token contract, or failed focused proof is found.
