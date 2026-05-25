Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status: Implemented
Owner: FRONTEND
Last Updated: 2026-05-18

# 2026-05-18 Workout-Type Glyph Semantics

## Summary

Month cells currently collapse too much workout identity into broad glyph families: easy, long, quality, and rest. Visible labels such as Tempo, Intervals, Progression, and Race need distinct tiny-cell-safe glyphs so labels are not carrying all semantic recognition alone.

## Product Boundary

- This slice improves frontend glyph semantics only.
- No backend schema, import contract, or canonical `WorkoutType` expansion is included.
- Do not add `Strength` or `OFP` as a real calendar workout identity in this slice.
- Future runner-facing strength label should be `Strength`, not `OFP`, but it requires a separate backend/import contract slice before becoming top-level product truth.

## Supported Visible Labels

- Easy
- Recovery
- Long
- Tempo
- Intervals
- Progression
- Race
- Quality
- Rest

## Glyph Direction

- Easy: open circle
- Recovery: lower arc or soft crescent
- Long: long horizontal arrow with small arrow head
- Tempo: upward arrow
- Intervals: repeated vertical bars or repeat blocks
- Progression: stair-step rising mark
- Race: simplified medal or rosette mark
- Quality: diamond or focus mark
- Rest: short horizontal dash

## Color Policy

- Easy, Recovery, and Steady use easy color.
- Long uses long color.
- Tempo, Intervals, Progression, Race, and Quality use quality color.
- Rest uses rest color.
- No new Strength color in this slice.

## Checklist

- [x] Update month-cell glyph mapping so visible workout labels can render distinct glyphs.
- [x] Keep glyphs one-color, tiny-cell safe, calm, and secondary to completion markers.
- [x] Align `WorkoutGlyph.tsx` with the same visible label mapping.
- [x] Ensure `Calendar.tsx` passes enough visible type information for the right glyph.
- [x] Update `/hitoDS` examples to document the distinct glyph mapping.
- [x] Update current docs and changelog with implemented behavior only.
- [x] Run targeted ESLint, `git diff --check`, and `npm run build`.

## Implementation Update

- `src/lib/workout-glyph.ts` now owns the shared visible-label glyph mapping, and `WorkoutGlyph.tsx` renders the tiny one-color glyphs for Easy, Recovery, Long, Tempo, Intervals, Progression, Race, Quality, and Rest.
- `Calendar.tsx` passes the resolved visible workout identity into that shared glyph renderer instead of collapsing month cells into only easy, long, quality, and rest shapes.
- `/hitoDS` now documents the distinct label-to-glyph mapping while keeping the existing semantic family color policy.
- No backend schema, import contract, or real Strength/OFP workout identity was added.

## Exit Criteria

- Month cells no longer rely on one generic quality glyph for Tempo, Intervals, Progression, Race, and Quality.
- Current visible workout labels keep existing semantic family colors.
- No new backend/import type is introduced.
- No distance, duration, target, or dashboard metric clutter returns to month cells.
