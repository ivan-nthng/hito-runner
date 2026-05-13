Status

Active — implemented

Owner

Designer

Last Updated

2026-05-12

Implemented Note

The loaded attached-evidence `Feedback` state is now implemented in the current frontend:

- upload-first framing no longer leads once Garmin evidence is attached
- the top area now shows an attached-file owner row with quiet metadata and hover/focus remove treatment
- `Plan vs run` now carries the stronger primary hierarchy with one verdict row, one compact `Evidence / Confidence / Checks` strip, calmer run-summary deltas, divider-based checks, and one quieter `Comparison notes` disclosure
- recommendation remains below that evidence layer as a secondary bounded note

Context

This pass covers only the loaded-state `Feedback` surface on workout detail after a Garmin result is already attached in saved mode.

The current product truth is:

- FIT/ZIP upload is live
- deterministic comparison is live
- recommendation is live and secondary
- screenshot OCR is still later
- comparison currently relies on the live backend-owned facts that already exist today

The redesign goal is not to change capability. It is to make the already-loaded state feel calmer, clearer, and more premium while keeping deterministic comparison primary and recommendation secondary.

Current UX Problems

- The surface still opens with upload-intro framing even when the runner already attached a Garmin file.
- The top explanation repeats the upload story instead of switching to attached-evidence ownership.
- `Plan vs run` has the right content, but the current hierarchy is too flat and too label-heavy.
- `Evidence`, `Confidence`, `Checks`, run summary, and signal rows still read like adjacent diagnostic widgets instead of one coherent review surface.
- Run-summary deltas are factual but visually noisy, especially for large percent changes.
- Check rows still feel technical and mildly defensive, especially where `mismatch`, `missing actual`, or caveat text stays visible all at once.
- Recommendation is already secondary in logic, but the visual hierarchy does not yet make that obvious enough.

Design Goals

- Make loaded-state feel attached-first, not upload-first.
- Keep `Compare your run with the plan` as the main promise.
- Keep one `Ready` pill on the right in loaded state.
- Make deterministic comparison the clear primary review layer.
- Keep recommendation visibly secondary, calmer, and easier to scan.
- Replace mini-card accumulation with one flatter divided reading experience.
- Reduce technical copy leakage without hiding factual limits.

Loaded-State Information Hierarchy

1. Header
   `Compare your run with the plan`
   Right side: `Ready` pill

2. Attached file owner row
   One compact attached-file card replaces the upload-intro block when a Garmin file is present.

3. Plan vs run
   Main evidence section.
   Larger section heading.
   Final verdict shown opposite the heading, for example `Matched`, `Off plan`, or `Needs review`, based only on current live comparison states.

4. Run summary
   Short metric-delta summary presented as an interpretation aid for the comparison, not as a separate dashboard.

5. Checks
   Divided rows for each current comparison signal.
   One optional quieter disclosure for technical caveats when needed.

6. Recommendation
   One bounded next-step note, clearly secondary to the evidence above.

Attached File Card Recommendation

Before:

- upload explainer copy remains visible above the attached file
- upload CTA framing still owns the top of the surface
- remove action is always visually present and competes with the review state

After:

- if a Garmin file is attached, replace the upload-intro copy block with one attached-file card
- card content:
  - file name
  - asset type if useful only as a quiet sublabel, not as the headline
  - added time
  - extracted file name only when it differs materially
  - run date if current live actual metrics provide it
- card action behavior:
  - `Remove file` stays hidden by default
  - reveal `Remove file` on hover or row focus
  - after removal, the upload CTA and upload explainer can return
- tone:
  - calm, already-attached, evidence-owned
  - not instructional
  - not celebratory

Plan vs Run Layout Recommendation

Before:

- small all-caps heading
- verdict separated from the section identity
- meta strip, run summary, and checks read as separate internal widgets
- too many local borders create visual fragmentation

After:

- section heading becomes a stronger editorial heading
- verdict sits opposite the heading on the same row
- use one continuous section with dividers, not multiple bordered mini-cards
- keep `Evidence`, `Confidence`, and `Checks`, but treat them as one compact summary strip
- keep run summary directly beneath that strip
- keep checks rows beneath run summary with quiet dividers

Recommended internal order:

1. Section header
   Left: `Plan vs run`
   Right: final verdict pill or text-status

2. Summary strip
   `Evidence`
   `Confidence`
   `Checks`

3. Run summary
   Duration
   Distance
   Workout day
   Structured steps
   Only show values that current live comparison already computes.

4. Checks list
   One row per current signal.
   Use human labels and status language.

5. Optional technical details disclosure
   One collapsible area for caveats, non-comparable cases, and deeper factual wording if needed.

Run summary presentation rules:

- de-emphasize raw percentage strings as standalone facts
- pair deltas with directional arrows and semantic color
- preferred read pattern:
  - arrow
  - absolute delta
  - percent delta as secondary support
- examples of presentation intent:
  - `↑ 8.5 min` with `27% longer` as quieter support
  - `↓ 0.80 km` with `12% shorter` as quieter support
- `On target` should read as the strongest simple state when delta is effectively zero
- tooltip or hover help may explain what each metric means, but the default visible text should stay short

Recommendation Block Recommendation

Before:

- recommendation is already secondary in logic, but caveat language still feels too technical and distributed

After:

- keep `Recommendation`
- keep `Suggested next step`
- use one calm grouped block
- main note stays visible
- supporting explanation stays below it
- caution or caveat content becomes quieter and, when mixed evidence exists, collapsible
- technical caveat wording should be translated into runner-facing language first

Recommended block order:

1. Section heading `Recommendation`
2. Main note label `Suggested next step`
3. Recommendation text
4. Short support line reminding that this note is secondary to factual comparison
5. Optional collapsible `Use with care` or `Why this is cautious`

What To Remove

- the extra upload-intro paragraph above the loaded-state file area
- upload CTA visibility while a file remains attached
- always-visible top-level `Remove file` button treatment
- mini-card feeling around comparison subparts
- excessive borders around checks rows
- overly technical visible words when a more human equivalent exists
- persistent visible technical caveat blocks when a single disclosure would do

What To Keep

- `Compare your run with the plan`
- one `Ready` pill on the right in loaded state
- deterministic comparison as the primary section
- `Evidence`, `Confidence`, `Checks`
- `Recommendation`
- `Suggested next step`
- current live comparison scope only:
  - workout day
  - duration
  - distance
  - structured steps when available
- current live constraint that recommendation must never outrank factual comparison

Do Not Fake Future Comparison Fields

- Do not redesign the surface as if `warm-up`, `run`, and `cooldown` comparison already exists.
- Do not introduce visible `heart rate`, `pace`, or richer segment-comparison modules in the main loaded state yet.
- Do not remove the current date or workout-day comparison from the live UI unless Backend and product explicitly change the comparison contract first.
- Do not present placeholder labels for future metrics inside the active comparison table.

What Requires Backend/Comparison Changes Later

- comparison by `warm-up / run / cooldown`
- comparison by `heart rate`
- comparison by `pace`
- any richer duration logic beyond today’s live deterministic contract
- any product decision to drop current `Workout day` or `Date` comparison from the live engine
- any new verdict taxonomy beyond what current deterministic comparison can honestly support

Hierarchy Tokens To Use

- Page-level section promise:
  `Compare your run with the plan`
  Use current strong display/section heading scale, not tiny label treatment.

- Section headers:
  `Plan vs run`
  `Recommendation`
  These should read like `h4` or `h5` equivalents in the current Hito DS rhythm.

- Supporting metadata:
  `Evidence`, `Confidence`, `Checks`
  Use compact metric-label treatment.

- Row labels:
  `Duration`, `Distance`, `Workout day`, `Structured steps`
  Use normal readable title case, not dense all-caps.

- Quiet helper/caveat text:
  Use current caption/support-copy scale only.

Open Questions For Frontend

- Should `Remove file` appear on whole-card hover only, or as a right-edge affordance with opacity transition?
- Should the final verdict be rendered as a status pill, or as larger text plus a quieter pill treatment?
- For mobile, does the attached-file row collapse metadata under file name, or stack into a two-row structure?
- Should technical comparison details use native `details/summary`, or a small existing Hito disclosure primitive if one already exists?
- Is the current run-summary help best handled through `title` tooltip behavior only, or should `/hitoDS` gain one small quiet help-icon pattern first?

Risks

- If the verdict language is visually strengthened too much, it could overstate certainty relative to the current deterministic comparison model.
- If caveats are hidden too aggressively, the recommendation may look more authoritative than the product intends.
- If the attached-file row becomes too utility-heavy, it may reintroduce a settings-like feel instead of a calm evidence owner.
- If run-summary deltas are over-colored, the section could start reading like analytics chrome instead of workout review.

QA Notes

- Verify loaded-state starts with attached-evidence ownership when a Garmin file exists.
- Verify upload CTA is absent while a file is attached and reappears only after removal.
- Verify `Ready` pill remains visible in loaded state.
- Verify `Plan vs run` remains visually primary over `Recommendation`.
- Verify no future-only fields appear in the loaded state.
- Verify technical caveat content, if collapsed, remains reachable and readable.
- Verify mobile stacking preserves the same hierarchy without reintroducing nested cards.
- Verify removal flow does not imply manual workout log deletion.

Next Recommended Role

FRONTEND

Suggested Next Step

Implement a narrow loaded-state-only refinement in `WorkoutFeedbackPanel`: swap the upload-intro block for an attached-file owner card when evidence exists, strengthen `Plan vs run` hierarchy, flatten the comparison substructure with dividers, and quiet recommendation caveats without changing the live comparison contract.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined a focused redesign proposal for the loaded-state workout-detail `Feedback` surface after a Garmin file is already attached, keeping deterministic comparison primary and recommendation secondary.

### Key Decisions

- Loaded state should switch from upload-first framing to attached-evidence ownership.
- Future comparison asks like warm-up/run/cooldown, heart rate, pace, or removal of workout-day comparison are explicitly later and must not be faked in this pass.

### Current State

- FIT/ZIP upload, deterministic comparison, and bounded recommendation are already live.
- The current loaded-state UI still carries too much upload-first and mini-card diagnostic framing.

### Constraints

- Do not invent backend metrics or future comparison fields.
- Keep factual comparison above recommendation and preserve current live data truth.

### Risks / Open Questions

- Stronger verdict styling could accidentally overstate certainty if visual tone gets too assertive.
- Frontend still needs to choose the exact mobile stacking and remove-action reveal behavior.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the loaded-state-only hierarchy cleanup inside `WorkoutFeedbackPanel`, then run Safari QA on attached-file, comparison-ready, and recommendation-ready states.
```
