Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Implemented

Owner

Frontend

Last Updated

2026-05-15

Context

The saved-mode calendar was intentionally simplified to remove dashboard-like cell clutter. That simplification was directionally correct, but the current month-cell scan now under-expresses workout semantics. The goal of this correction pass is not to bring back inline metrics, stacked cues, or mini dashboards. The goal is to restore fast scanning for workout type and feedback presence using the smallest useful semantic layer.

Current Problem

What useful signals were lost:

- workout-type identity is now too dependent on small text
- interval and tempo identity are not visible enough at a glance
- feedback or evidence presence exists, but the cue is easy to miss in the month grid
- semantic workout colors are present in the system but not doing enough work inside cells

What was correctly simplified:

- month cells no longer behave like mini overview cards
- inline metric clutter is gone
- completion truth is clearer than before
- today highlight remains stronger than secondary status cues

What now feels under-informative:

- non-rest training days can look too similar in quick month scanning
- `easy`, `long`, `quality`, `tempo`, and `intervals` are not separable enough from one another
- feedback or evidence presence does not read as part of the scan rhythm unless the user looks for it intentionally

What We Keep From Simplification

- no inline dashboard metrics in month cells
- no multi-line metadata stacks
- no dense badge clusters
- no large status pills inside the grid
- date and completion truth remain easy to read first
- today highlight remains the dominant frame-level emphasis

Signals To Restore

Smallest useful v1 set for month cells:

- keep date number
- keep completion marker
- restore one workout-type glyph
- keep one short workout-type label
- keep one secondary feedback or evidence marker
- keep restrained semantic color on type identity only

Do not restore for month cells:

- distance
- duration
- target data
- long titles beyond the current compact title treatment

Decision by requested signal:

- workout type icon:
  yes
- short workout type label:
  yes
- distance:
  no in month cells
- completion marker:
  yes
- evidence or feedback marker:
  yes
- semantic color:
  yes, but only on type identity and not as broad cell fill

Terminology Recommendation

Calendar-facing visible terminology should stay short and consistent with the existing workout identity model.

Month-cell visible labels:

- `Easy`
- `Recovery`
- `Long`
- `Tempo`
- `Intervals`
- `Progression`
- `Race`
- `Quality`
- `Rest`

Terminology rules:

- show `Recovery` only when the current saved workout already resolves to recovery identity
- show `Intervals`, `Tempo`, `Progression`, or `Race` when the current saved workout already resolves to that more specific quality subtype
- show generic `Quality` only when no more specific subtype is available
- show `Long` instead of `Long run` in tiny cells
- show `Rest` only as a muted secondary identity, not as a loud event state

Tiny-cell versus hover or detail split:

- month cell:
  short type label only
- hover tooltip and workout detail:
  full label, title, distance, duration, and target context

Icon Policy

Each workout day should regain a small workout-type glyph, but not a full icon library.

Policy:

- use distinct glyphs for broad workout families, not a unique pictogram for every subtype
- let subtype wording carry the distinction between `Tempo`, `Intervals`, `Progression`, and `Race`

Recommended broad glyph family:

- `Easy`, `Recovery`, `Steady`:
  one calm round glyph
- `Long`:
  one elongated or stretched glyph
- `Quality` family:
  one sharper or segmented glyph
- `Rest`:
  one hollow or reduced glyph

Feedback or evidence icon policy:

- keep one feedback/evidence marker
- do not bring back text labels like `Evidence` or `Feedback` inside month cells
- keep text labels only in tooltip, hero, or week strip where space is larger

Completion plus feedback coexistence:

- yes, both should coexist
- completion stays in the date/status row
- feedback/evidence stays as a quieter separate corner or edge marker
- they must not share the same visual language

Layout Hierarchy

Primary in a month cell:

- date
- today state
- completion truth
- workout-type identity

Secondary in a month cell:

- feedback or evidence presence
- one-line workout title support

Hierarchy model:

- top row:
  date first, completion marker beside it
- identity row:
  workout-type glyph plus short label
- content row:
  compact title line
- secondary corner:
  feedback/evidence marker only

What must never compete at the same level inside one cell:

- completion marker and feedback marker
- type color and today highlight
- workout-type label and long title
- feedback state and completion truth

What Must Stay Secondary

- feedback/evidence marker
- long workout title
- rest-day tone
- any hover-only metrics
- any subtype nuance beyond the short label

What We Do Not Bring Back

- inline distance in month cells
- inline duration in month cells
- metric triplets
- multi-badge status stacks
- lower progress bars or meter strips
- dashboard-style title plus metric plus state combinations
- large feedback labels inside the month grid

Risks

- Adding both glyph and label could feel redundant if their visual contrast is too strong.
- If semantic color is applied too broadly, the calendar will drift back toward noisy cells.
- If feedback markers become more visible than completion markers, the grid will misprioritize secondary evidence over primary workout truth.
- If interval identity is over-specified in the cell, cells will start competing with tooltip and detail surfaces again.

QA Notes

- Verify that `today` remains the strongest state even when the workout type is `quality` or feedback is ready.
- Verify that completed-day green treatment still reads first, while feedback remains clearly secondary.
- Verify that non-rest workout families are distinguishable at a glance without opening tooltips.
- Verify that `Intervals`, `Tempo`, `Long`, `Easy`, and `Rest` can be told apart in a full month view.
- Verify that the month grid does not reintroduce metric clutter at desktop or tablet widths.
- Verify that week strip and hero can stay richer without forcing the month cell to match their density.

Open Questions For Frontend

- Resolved:
  month-cell workout-type glyph sits before the short type label.
- Resolved:
  feedback/evidence marker stays bottom-right as a quiet secondary corner cue.
- Resolved:
  rest days keep an explicit muted `Rest` identity with the hollow rest glyph.
- Resolved:
  one-line compact workout titles remain for non-rest days, while distance, duration, and target data stay out of month cells.

Implementation Update

- `Calendar.tsx` now maps saved workout identity into the approved tiny-cell terminology:
  `Easy`, `Recovery`, `Long`, `Tempo`, `Intervals`, `Progression`, `Race`, `Quality`, and `Rest`.
- Month cells now render one broad-family glyph plus short type label before the compact title.
- Completion marker remains in the date/status row.
- Feedback/evidence marker remains a separate bottom-right cue with no text label inside the month cell.
- Restrained semantic color is applied only to the type identity, not the full cell.
- `/hitoDS` now includes the implemented calendar type identity examples.
- Distance, duration, target data, metric triplets, progress bars, and dashboard-style stacks remain intentionally excluded from month cells.

Exit Criteria

- [x] month cells restore workout-type glyph treatment
- [x] month cells restore short type label treatment
- [x] feedback/evidence marker is visible as a secondary cue
- [x] completion truth remains visually separate and primary
- [x] semantic color is limited to type identity
- [x] month cells do not reintroduce distance, duration, target, or metric stacks
- [x] `/hitoDS` reflects the implemented calendar type identity pattern

Next Recommended Role

QA

Suggested Next Step

Verify the saved-mode month calendar in Safari, confirming workout types scan clearly, feedback/evidence markers remain secondary, completion truth stays primary, and no metric/dashboard density returned.
