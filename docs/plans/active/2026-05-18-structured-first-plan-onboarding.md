Status

Implemented baseline, refinement plan active

Owner

Architect / Backend / Frontend / QA

Last Updated

2026-05-18

Context

The structured first-plan onboarding path is now functionally QA-green.

This plan does not reopen the product decision or treat the current constructor as broken.

What is already working and must stay preserved:

- structured constructor is the normal first-plan creation path
- old free-text-first onboarding is no longer the visible default
- optional comment is supporting context only
- no sex/gender field appears
- Advanced JSON remains demoted
- valid structured submission succeeds
- target-time missing value shows bounded error
- mountain context can influence generated workouts
- fixed rest-day invariants persist and are respected
- age, weight, and height persist
- benchmark, terrain, and comment do not leak into long-lived profile truth
- mobile layout is already bounded and has no known horizontal overflow at the QA baseline

The remaining work in this plan is refinement of:

- input controls
- required-field policy
- conditional goal and terrain behavior
- DS alignment
- sticky submit behavior
- targeted QA completion for the still-unsubmitted benchmark branches and untouched Advanced apply path

Implementation Update

2026-05-18 baseline slices already delivered:

- backend structured onboarding contract exists in `src/lib/structured-first-plan-onboarding.ts`
- authenticated onboarding mutation exists through `completeStructuredFirstPlanOnboarding`
- visible `OnboardingGate` is already structured-first
- fixed rest days already flow into weekday invariant truth
- direct structured generation is already the primary generation path

This plan now refines that live baseline instead of replacing it.

2026-05-18 backend tightening slice delivered:

- `profile.age`, `profile.weightKg`, and `profile.heightCm` are now required by the backend contract with bounded ranges
- visible goal distance accepts `ultra_marathon` and `mountain_running`
- `mountain_running` normalizes terrain to `mountain`
- omitted or hidden terrain defaults to `standard` for normal goals and stays generation context only
- `targetTime` remains required only for `target_time`; valid non-target-time target fields are ignored by the generated authoring input
- fixed rest days still persist through existing plan preferences and weekday invariant truth
- Advanced JSON import remains unchanged

2026-05-18 frontend refinement slice delivered:

- age, weight, and height are now required native numeric controls with the approved visible ranges and Hito field styling
- benchmark and strength/mobility options now use compact row-like selector rhythm instead of tall cards
- visible availability now asks only for fixed rest days through a compact weekday selector; the frontend sends a conservative hidden `runningDaysPerWeek` value capped at four and constrained by available weekdays
- goal distance now includes `Ultra marathon` and `Mountain running`
- target time/date fields appear only for `Target time` style, with target time required and target date optional
- terrain selection appears only for marathon and ultra marathon; mountain running implies mountain terrain automatically
- the optional supporting textarea label is now `Comment`
- the constructor has a sticky `Create plan` footer disabled until required fields and conditional target-time requirements are complete

Checklist

- [x] Keep structured onboarding as the only normal first-plan path
- [x] Keep Advanced JSON available and demoted
- [x] Preserve weekday rest-day invariant behavior
- [x] Preserve terrain-aware mountain workout generation
- [x] Tighten profile basics from optional free-type inputs into required structured controls
- [x] Add explicit control policy for age, weight, and height
- [x] Align benchmark choices with row-like DS selection treatment
- [x] Refine fixed rest-day UI into a weekday calendar-style selector
- [x] Expand goal options to include `Ultra marathon` and `Mountain running`
- [x] Make target inputs conditional on `Target time`
- [x] Make terrain focus conditional on relevant goal types only
- [x] Make `Mountain running` imply mountain terrain by default
- [x] Rename optional text field label to `Comment`
- [x] Add sticky disabled-until-valid `Create plan` footer behavior
- [ ] Complete targeted QA for 5K time, 5K pace, and Advanced apply regression

Product Decision

The structured constructor remains the only normal first-plan creation path.

Visible free-text-only plan creation stays retired from onboarding.

The only free-text field in the normal onboarding flow remains:

- `Comment`

JSON import remains only under `Advanced`.

The live constructor should now collect:

1. Profile basics
2. Current fitness benchmark
3. Availability
4. Goal
5. Comment
6. Strength / general preparation preference
7. Advanced JSON import as a demoted path

Required profile basics in the normal constructor:

- age
- weight
- height

These are now product-required for first-plan generation.

Visible Free-Text Retirement

The following must stay true:

- `OnboardingGate` must not restore the old large free-text-first plan prompt
- `completeTextOnboarding` must not reappear as the normal onboarding action
- optional `Comment` must not be reframed as free-text plan generation

The following may still exist only as backend compatibility seams:

- `completeTextOnboarding`
- `generateCanonicalPlanFromText`

They are not the visible onboarding product.

Current QA-Green Baseline

Live code and QA now confirm:

- the constructor already submits structured onboarding data
- benchmark mode supports:
  - `recent_5k_time`
  - `recent_5k_pace`
  - `unknown`
- availability already uses:
  - `runningDaysPerWeek`
  - `fixedRestDays`
- goal already supports:
  - distance
  - style
  - target time
  - target date
  - terrain focus
- backend already persists only:
  - `age`
  - `weight_kg`
  - `height_cm`

The remaining gap is mainly UX policy and validation tightening, not architectural uncertainty.

Backend Contract Summary

Canonical visible request contract remains:

- `structuredFirstPlanOnboardingInputV1`

Canonical top-level shape remains:

- `profile`
- `benchmark`
- `availability`
- `goal`
- `strength`
- `comment`

Implemented backend field model after this refinement:

- `profile.age: number`
- `profile.weightKg: number`
- `profile.heightCm: number`
- `benchmark.kind: "recent_5k_time" | "recent_5k_pace" | "unknown"`
- `benchmark.recent5kTime: string | null`
- `benchmark.recent5kPace: string | null`
- `availability.runningDaysPerWeek: 1..7`
- `availability.fixedRestDays: WeekdayName[]`
- `goal.goalDistance: "build_consistency" | "5k" | "10k" | "half_marathon" | "marathon" | "ultra_marathon" | "mountain_running"`
- `goal.goalStyle: "relaxed" | "balanced" | "ambitious" | "target_time"`
- `goal.targetTime: string | null`
- `goal.targetDate: ISODate | null`
- `goal.terrainFocus: "standard" | "rolling" | "mountain" | null`
- `strength.preference: "none" | "mobility" | "strength_mobility" | null`
- `comment: string | null`

Required validation rules after this refinement:

- age required
- weight required
- height required
- one benchmark mode only
- `targetTime` required only when `goalStyle === "target_time"`
- `targetDate` shown and accepted only when `goalStyle === "target_time"`
- `terrainFocus` shown only for:
  - `marathon`
  - `ultra_marathon`
  - `mountain_running`
- `terrainFocus` defaults to:
  - `mountain` when `goalDistance === "mountain_running"`
  - `standard` for the other relevant goal types unless the runner changes it
- `fixedRestDays` may be empty
- `runningDaysPerWeek` must fit outside fixed rest days
- constructor must not collect sex/gender in v1

Current Mismatch To Keep Resolved

The live backend authoring seam is still internally oriented around:

- `preferredRunningDays`
- `unavailableDays`
- `maxRunningDaysPerWeek`
- `preferredLongRunDay`

The visible product model remains:

- `runningDaysPerWeek`
- `fixedRestDays`

Frontend must not invent schedule mapping.

Backend must continue to translate visible constructor inputs into the existing structured authoring contract.

Age / Weight / Height Control Policy

Recommended v1 control choice:

- use native numeric inputs styled with Hito DS field primitives
- do not use free-form text inputs
- do not build a custom wheel picker
- do not use very long dropdowns for age, weight, or height

Reason:

- native number inputs keep precise values easy to edit
- mobile numeric keyboard is available
- DS field styling already exists
- this is the smallest clean improvement over the current free-type text fields

Recommended field policy:

### Age

- control: native numeric input
- typed value: yes
- integer only: yes
- range: `13..100`
- unit label: none in the value; helper copy can say `years`
- step: `1`
- placeholder: `34`
- required: yes

### Weight

- control: native numeric input
- typed value: yes
- unit: `kg`
- range: `30..250` for product-level UX validation
- backend hard safety range may stay wider if desired, but UX should guide to realistic runner values
- decimal allowed: yes
- step: `0.5`
- placeholder: `72.0`
- required: yes

### Height

- control: native numeric input
- typed value: yes
- unit: `cm`
- range: `120..230`
- decimal allowed: no in v1
- step: `1`
- placeholder: `178`
- required: yes

Mobile usability notes:

- all three controls should use numeric input mode
- avoid long selects that require excessive scrolling
- keep fields in a responsive layout:
  - three columns on wider widths
  - one column on narrow mobile widths
- keep helper text short and unit-specific

Backend Impact

Backend contract shape does not need a structural rewrite.

The current contract already accepts numeric fields and already validates bounded numeric input.

Required backend changes are only tightening and extension:

1. Make `profile.age`, `profile.weightKg`, and `profile.heightCm` required in the structured onboarding schema.
2. Tighten or confirm UX-aligned numeric bounds:
   - frontend practical bounds should be mirrored or safely accepted by backend validation
3. Extend `goal.goalDistance` to support:
   - `ultra_marathon`
   - `mountain_running`
4. Allow `goal.terrainFocus` to be nullable or omitted when the selected goal does not require terrain UI.
5. Preserve the current translation seam into `structuredPlanAuthoringInput` rather than creating a second generation model.

Recommended backend rule:

- contract still accepts numbers
- frontend changes control style
- backend remains the source of truth for required-ness and impossible values

Translation Into Existing Structured Authoring

### Availability mapping

This remains the most important alignment rule.

Backend must continue to:

1. treat `fixedRestDays` as the stronger truth
2. derive allowed weekdays as `all weekdays - fixedRestDays`
3. derive internal `preferredRunningDays` from those allowed weekdays plus `runningDaysPerWeek`

Frontend must not ask for exact run weekdays in v1.

### Benchmark mapping

Recommended v1 mapping remains:

- `recent_5k_time` -> race-result style current-level input
- `recent_5k_pace` -> bounded pace-based current-level summary
- `unknown` -> benchmark-related current-level fields left empty

Do not infer fake race results from pace-only input.

### Goal mapping

Goal label should remain backend-generated from distance + style.

Recommended visible goal distances:

- `Build consistency`
- `5K`
- `10K`
- `Half marathon`
- `Marathon`
- `Ultra marathon`
- `Mountain running`

Recommended backend rule:

- `mountain_running` is a distinct goal type, not just a terrain toggle
- `mountain_running` should imply `terrainFocus = mountain` by default
- `ultra_marathon` can still expose visible terrain choice because it may be road-leaning or mountain-leaning depending on runner intent

### Goal style mapping

Goal style remains:

- `relaxed`
- `balanced`
- `ambitious`
- `target_time`

Visible contract rule:

- only `target_time` reveals `targetTime` and `targetDate`
- `relaxed`, `balanced`, and `ambitious` show a small hint instead of empty target fields

### Terrain mapping

Terrain focus stays bounded planning context, not a route or elevation engine.

Show terrain only when goal distance is:

- `marathon`
- `ultra_marathon`
- `mountain_running`

Recommended terrain behavior:

- `mountain_running` defaults to `mountain`
- `marathon` and `ultra_marathon` can choose:
  - `standard`
  - `rolling`
  - `mountain`

Do not model:

- climb meters
- exact elevation targets
- route matching
- surface-specific GPS logic

### Optional comment mapping

Recommended use remains:

- supporting nuance only
- may feed bounded caution or schedule context
- must not become the primary authoring source

### Strength preference mapping

Recommended v1 mapping remains:

- `none`
- `mobility`
- `strength_mobility`

This slice still does not broaden into detailed gym programming.

Persistence Policy

Persist now:

- `runner_profiles.age`
- `runner_profiles.weight_kg`
- `runner_profiles.height_cm`

Persist in active plan preferences / invariant source:

- fixed rest days as `blocked_days`
- any resolved weekday rest-day source needed by the current invariant system

Do not persist as long-lived profile truth in v1:

- benchmark text or pace strings
- optional comment
- terrain focus as standalone runner-profile truth
- target-time phrasing

Benchmark remains generation context first.

Comment remains generation context first.

Terrain remains plan-generation context first.

OpenAI Context Policy

Normal onboarding remains structured-first, not prompt-first.

If any AI layer remains in the path, it should receive only bounded structured context:

- profile basics
- benchmark fields
- availability
- goal
- terrain intent
- strength preference
- optional comment

It should not receive:

- unrelated settings dump
- free text as the main contract
- extra sensitive or unnecessary profile fields

Recommended architectural rule remains:

- keep deterministic structured generation as the canonical plan-generation contract
- keep any AI use bounded upstream of that contract rather than as a second free-text primary path

Frontend Flow Summary

`OnboardingGate` should stay one vertically stacked structured constructor.

Required Frontend changes in the next refinement slice:

1. Profile basics
   - replace free-type text fields with required DS-styled numeric inputs
   - show units clearly
   - keep responsive one-column / three-column layout
2. Benchmark
   - change option treatment from tall square blocks to calmer row-like selectable options
   - keep three options:
     - recent 5K time
     - recent 5K pace
     - I do not know
3. Availability
   - ask only for fixed rest days
   - use a weekday calendar-style selector with Hito DS controls and spacing
   - send a conservative hidden `runningDaysPerWeek` value that fits outside fixed rest days
4. Goal
   - add `Ultra marathon`
   - add `Mountain running`
   - show `targetTime` only for `Target time`
   - show `targetDate` only for `Target time`
   - show small explanatory hint for relaxed / balanced / ambitious
   - show terrain selector only for:
     - Marathon
     - Ultra marathon
     - Mountain running
   - auto-default mountain terrain for `Mountain running`
5. Comment
   - section title can remain contextual
   - field label must become simply `Comment`
6. Primary CTA
   - keep `Create plan`
   - place it in a sticky or pinned footer area
   - keep disabled until required fields are complete and current conditional requirements are satisfied
7. Advanced
   - keep as-is and demoted

Advanced Path Policy

JSON import remains:

- available
- demoted
- secondary to the constructor

Advanced should continue using:

- current import validation
- current chosen-start-date behavior
- current weekday rest-day invariant behavior

Do not broaden Advanced with:

- a restored free-text-only creation path
- competing onboarding paradigms

What Must Stay Preserved

- successful structured path creation
- weekday rest-day invariant persistence
- mountain workout context generation
- bounded target-time validation
- no sex/gender field
- no free-text-only visible creation path
- no mobile overflow regression
- no profile leakage of benchmark, terrain, or optional comment

QA Checklist

- [x] structured onboarding can still create a first plan successfully
- [x] old free-text-first onboarding remains absent
- [x] Advanced JSON remains visible only under disclosure
- [x] rest-day invariant persistence remains intact
- [x] mountain context still influences generated workouts
- [x] target-time missing value still shows bounded error
- [x] age control uses required numeric input behavior
- [x] weight control uses required numeric input behavior with `kg`
- [x] height control uses required numeric input behavior with `cm`
- [x] impossible numeric values are blocked:
  - age below range
  - age above range
  - weight below range
  - weight above range
  - height below range
  - height above range
- [x] decimal weight submission works with accepted precision
- [x] integer-only height behavior is enforced
- [ ] 5K time branch submits successfully
- [ ] 5K pace branch submits successfully
- [ ] `I do not know` benchmark still submits successfully
- [x] fixed rest-day calendar selector is implemented with compact weekday controls
- [ ] `Ultra marathon` option generates successfully
- [x] `Mountain running` defaults or implies mountain terrain correctly
- [x] terrain control stays hidden for non-relevant goal types
- [x] `targetTime` and `targetDate` appear only for `Target time`
- [x] relaxed / balanced / ambitious show hint copy instead of empty target inputs
- [x] `Comment` label is visible and correct
- [x] `Create plan` remains disabled until required fields are complete
- [x] sticky footer is implemented for mobile and desktop viewport reachability
- [ ] Advanced JSON can still open and apply without regression

Exit Criteria

- required profile basics are enforced through a clear mobile-usable control policy
- backend contract remains canonical and only tightens where necessary
- goal options and conditional terrain rules match the approved product direction
- visible target inputs appear only when relevant
- sticky submit behavior is clear and safe
- structured path remains the only normal first-plan path
- Advanced JSON remains secondary and working
- QA passes all benchmark branches plus Advanced regression

Suggested Role Sequence

1. Architect contract refinement
2. Backend validation and goal-contract tightening
3. Frontend onboarding control and conditional-UI refinement
4. QA structured generation, benchmark branches, and sticky-footer behavior
5. QA Advanced JSON regression
