# Hito DS Inline Editable Header Text Anchor And Out-Of-Flow Affordance

- **Status:** `completed`
- **Owner:** DESIGN SYSTEM
- **Evidence From:** [Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces](./2026-08-13-hito-ds-components-header-signal-cleanup.md)
- **Outcome:** The header read trigger now has zero padding, border, and minimum width with a transparent rest background. Its hover/focus canvas is the existing semantic chrome rendered by an absolute pseudo-element outside layout. The existing edit affordance is absolute…
- **Sources:** [controls-fields.css](../../../src/styles/controls-fields.css); [inline-editable-text.tsx](../../../src/components/ui/inline-editable-text.tsx); [reference-pattern-inline-editing.tsx](../../../src/components/hito-ds/reference-pattern-inline-editing.tsx)
- **Validation:** Product inheritance, Truncation, containment, and console, Independent QA passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** No work or acceptance beyond the recorded terminal scope is claimed; any successor remains separately owned.
