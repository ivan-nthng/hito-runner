# Hito Running Calendar Page Refinement Spec

## Status

Draft

## Owner

Designer Agent

## Last Updated

2026-05-07

## Context

The saved-mode home route at `/` is now the effective Calendar page for Hito Running. It already has a strong primary structure:

- one large main card for today's workout
- one supporting right-side column
- one weekly or month calendar surface below

This pass should refine that page without redesigning it. The goal is to preserve the strongest parts of the current page while reducing clutter, tightening the supporting information, and preparing one future-facing seam for training insight from previous-run analysis.

This spec applies only to the saved-mode home or calendar page area the user described. It does not redefine workout detail, auth, onboarding, or the broader app shell.

## Goals

- preserve the current strong main workout card
- make the right-side support column feel intentional and unified instead of fragmented
- reduce low-value sections and repetitive card framing
- remove the lower metadata strip or section that behaves like unnecessary clutter
- define a clearer visual completed-day state for calendar cells
- establish one future-facing placeholder seam for training insight without designing the AI system itself
- keep the page calm, useful, and low-friction

## Affected Surfaces

- home route saved-mode hero area
- main `Today` workout card
- right-side supporting column currently containing `Planning Note`, `Week Status`, and `Tomorrow`
- lower metadata strip under the hero area
- weekly/calendar section below the hero
- day-cell completed state inside the calendar

## Before / After Intent

### Current Intent

- the main workout card carries most of the page value correctly
- the right side uses multiple separate cards for supporting information
- the hero area ends with an extra lower metadata strip that adds little user value
- completed-state signals exist in the calendar, but they can become more intentional and easier to read at a glance

### Target Intent

- the main card remains stable and familiar
- the right column becomes one grouped support card with dividers
- the `Planning Note` block clearly suggests a future previous-run insight seam
- the lower clutter strip is removed
- completed days are easier to distinguish without visually overpowering today/current states

## Main Card Rules

### Canonical Rule

Keep the main workout card largely as-is.

### Preserve Without Rework

- `Today`
- weekday / month / date framing
- workout title such as `Easy Run`
- short workout description
- `Distance`
- `Duration`
- `Target`
- `Pace Hint`
- `Open Workout`
- `Mark Complete`

### Refinement Rules

- preserve current overall composition, proportions, and visual weight
- do not collapse the main card into a tighter utility panel
- do not replace the current hero hierarchy with a denser dashboard style
- keep the main card as the page anchor

### Main Card Copy Direction

Reduce only where copy is repetitive or system-explanatory.

Keep:

- one short workout description that explains the day

Reduce or remove:

- implementation-facing or seam-explaining copy
- repeated `saved` versus `preview` explanation inside the main card when not necessary for primary comprehension

### Rest-Day Compatibility Note

This spec is for the calendar page refinement pass, not for redefining the workout-detail rest-day treatment. However, the home main card must remain compatible with calm rest-day logic later:

- if today's day is a rest day, the main card may stay visually quiet
- it should not break the preserved card composition
- it should not force metrics that do not exist

## Right Column Consolidation

### Current Blocks

- `Planning Note`
- `Week Status`
- `Tomorrow`

### Canonical Change

These should become one single grouped card, not three separate cards.

### Required Structure

One shared outer card containing:

1. `Planning Note`
2. divider
3. `Week Status`
4. divider
5. `Tomorrow`

### Layout Rules

- one outer frame only
- internal dividers only
- no repeated separate card borders
- tighter internal spacing than the current three-card stack
- consistent section padding
- quiet section labels

### Visual Rules

- keep the darker backdrop and elevated hero-side feel
- preserve subtle colored emphasis where helpful:
  signal accent for `Planning Note`
  week-status semantic color in the status section
- `Tomorrow` should remain the lightest-weight section

### Intent

The right side should read as one supporting module for the main card, not as three independent boxes competing for attention.

## Planning Note Placeholder Contract

### Future Role

`Planning Note` remains, but its meaning shifts.

This is the future placeholder seam for previous-run training insight.

### Future Flow Direction

Later flow:

1. user completes a workout
2. user may add a comment
3. later the user may upload a screenshot or photo of results
4. OpenAI compares planned vs actual
5. resulting insight appears in `Planning Note`

### Current Placeholder Contract

For now:

- do not design the full AI system
- do not imply live intelligence already exists
- do not show fake deep analysis

The block should visually communicate:

- this is where future training insight will live
- the insight will be related to the previous run or recent execution
- this is a placeholder seam, not an active coaching engine

### Placeholder Content Rules

Use copy shaped like:

- `Previous-run insight`
- `Future training insight`
- `Post-run analysis will appear here`

Avoid copy shaped like:

- current fake coaching certainty
- adaptation claims
- pseudo-smart recommendations without real data

### Future Data Dependency Note

This block will later depend on:

- saved workout completion
- optional runner comment
- optional uploaded screenshot or photo
- planned-vs-actual comparison output

Until those inputs exist, the block should stay honest and quiet.

## Completed Day Calendar State

### Goal

Calendar cells should show completed days more clearly, but without making the grid noisy or collapsing the distinction between `today`, `selected/current`, `future`, and `rest`.

### Required Visual Signal

Completed days should use a clearer success treatment, combining:

- green accent or green state
- check icon
- green lower border or strong green completion line

### Recommended Placement

Preferred options:

- small check icon near the date number
- or integrated into the date-number corner cluster

Keep the bottom completion bar as the main structural completion signal.

The check icon should support the state, not replace the bar.

### State Definitions

- `default`
  planned day, not yet completed, not today
- `today`
  current day highlight remains the primary today signal
- `completed`
  planned day completed and visually confirmed
- `partial`
  partial completion remains warn-toned
- `skipped`
  skipped remains destructive-toned and more muted
- `rest`
  quiet, low-information cell
- `future`
  upcoming planned day with minimal emphasis
- `outside current month`
  reduced opacity remains

### Coexistence Rules

If a day is both `today` and `completed`:

- today highlight remains the primary frame-level signal
- completed check and green bar remain visible as secondary confirmation
- do not replace today amber emphasis entirely with green

If a day is currently selected through hover or manual attention:

- selection or hover treatment should not erase completion treatment
- completion remains encoded through the bar and icon

If a day is `rest`:

- do not show completion styling by default
- keep rest visually quiet

### Overload Prevention Rules

To avoid overloading the cell:

- do not add large filled badges
- do not use both large green fills and large icons
- keep the check icon small
- do not introduce multiple new labels inside the cell
- preserve the existing text hierarchy

## Section Removal Notes

### Remove Lower Hero Section

The lower hero strip currently acting like a metadata row or `Surface / Source / JSON export comes later` section should be removed in this refinement pass.

### Rationale

- it adds clutter without helping the user decide what to do
- it repeats system-seam information that does not belong in the main page focal area
- it weakens the visual finish of the hero

### Scope Note

This removal applies to the lower section under the hero card area, not to the calendar grid below.

### What Stays

- the weekly/calendar section below the hero remains
- the main workout card remains
- the right-side support content remains, but consolidated

## Copy Reduction Notes

Reduce or remove from the calendar page:

- seam-explaining copy that talks about imported baseline structure
- repeated `saved` versus `preview` implementation language inside the hero
- low-value metadata strips under the hero
- placeholder copy that sounds like system narration instead of runner-facing UI

Prefer:

- short workout-oriented description in the main card
- short honest placeholder in `Planning Note`
- concise `Week Status` helper text
- compact `Tomorrow` preview

### Specific Tone Rule

The page should feel like a calm training surface, not a debug surface and not an AI product teaser page.

## Open Questions / Edge Cases

- If the main card is showing a rest day later, should the right column still include `Tomorrow` when tomorrow is also rest?
- Should the grouped right-side card stay fixed-height relative to the main card, or just size naturally to content?
- If a day is both `today` and `completed`, is the current amber today framing strong enough once the green check and bar are added?
- Should `Planning Note` placeholder copy differ between preview mode and saved mode, or remain one honest neutral placeholder?
- If future post-run insight is unavailable because the user completed a workout without comment or screenshot, should `Planning Note` show an empty placeholder or a generic “no insight yet” state?

## Out Of Scope

- redesigning the main workout card structure
- redesigning workout-detail pages
- implementing AI insight generation
- implementing screenshot analysis UX end-to-end
- redesigning the entire calendar component
- changing week-status logic
- changing onboarding
- changing runner profile dropdown behavior outside the calendar page
- changing broader app-shell navigation

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement this saved-mode calendar page refinement pass by preserving the current main card, consolidating the right-side support column into one grouped card, removing the lower hero clutter strip, and refining completed-day calendar state so it is clearer without overriding today/current emphasis.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical UI refinement spec for the saved-mode Calendar page, focused on preserving the strong main workout card, consolidating the right-side support column, removing lower clutter, and clarifying completed-day state inside the calendar grid.

### Key Decisions

- Kept the main `Today` workout card intentionally stable while treating the right-side support content as one grouped card with internal dividers.
- Defined `Planning Note` as the future placeholder seam for previous-run insight and specified that completed calendar days should use a green confirmation treatment without overriding today/current highlighting.

### Current State

- A narrow implementation-driving frontend spec now exists in `docs/tasks/frontend-specs/`.
- Frontend has a clear next-pass target for the saved-mode home/calendar surface without needing a broader redesign.

### Constraints

- Do not redesign the full app or replace the current strong main card hierarchy.
- Do not implement or imply a full AI system now; keep `Planning Note` as an honest future-facing placeholder seam only.

### Risks / Open Questions

- Completed-day styling must be clearer while still coexisting cleanly with today and hover states.
- The future previous-run insight block will later depend on saved completion, optional comments, and optional screenshot/photo inputs that are not yet live.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the calendar page refinement pass and verify that the grouped right column, removed lower clutter, and completed-day state all improve clarity without disrupting the current saved-mode flow.
```
