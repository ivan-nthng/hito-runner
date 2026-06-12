# Running Plan Universal Richness Bar Audit

Date: 2026-06-12
Owner: Running Coach
Status: Root-cause audit after confirmed `Marathon Base` export proved runner-facing flat
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
Incident export: `/Users/ivan/Downloads/marathon-base-2026-06-12.json`

## Scope

This audit defines a universal runner-facing richness bar for:

- selected-plan previews
- confirmed selected plans
- exported plans
- structured first-plan outputs
- AI-authored first-plan outputs when they emit the same canonical workout identity taxonomy

It does not judge:

- pace truth
- HR truth
- endpoint truth
- DB/persistence correctness
- browser/UI rendering correctness

Those may still pass while runner-facing coaching quality fails.

## Root Cause

Visible symptom:

- a confirmed/exported `Marathon Base` plan is safe and technically valid, but reads flat to a real runner

Underlying cause:

- prior Running Coach acceptance over-weighted backend-internal composition signals and scenario-level proof
- prior acceptance under-weighted the actual runner-facing exported sequence of titles and identities across the full horizon
- the accepted richness bar was too scenario-specific and too preview-internal

Canonical owner:

- Running Coach doctrine first
- Backend composition and validator policy second
- QA export/confirm-path coverage third

## The Incident That Broke Prior Acceptance

Confirmed export:

- `source_kind: running_plan_engine_marathon_base_builder_v1`
- `source_status: confirmed_selected_plan`
- `24 weeks`
- `117` non-rest rows

Non-rest identity mix:

- `65` `easy_aerobic_run`
- `22` `recovery_jog`
- `18` `long_aerobic_run`
- `5` `cutback_long_run`
- `3` `easy_run_with_strides`
- `3` `controlled_tempo_session`
- `1` `base_endpoint_marker`

Missing entirely:

- `steady_aerobic_run`
- `progression_run`
- `threshold`
- `hills`
- `intervals`

Runner-facing weekly pattern:

- many weeks read as `easy / long / recovery / easy / easy`
- only weeks `3`, `10`, and `13` contain `Tempo Run`
- only weeks `2`, `6`, and `23` contain `Easy Run With Strides`
- weeks `14-22` collapse into repeated `easy / long / recovery / easy / easy` with no visible non-long-run phase change at all

This is not a metric-truth failure.

It is a runner-facing richness and phase-meaning failure.

## Why Previous Running Coach Acceptance Missed It

### 1. The audit was too preview-internal

Previous acceptance looked at:

- scenario JSON
- composition grammar week archetypes
- development sequences
- long-run role sequences

But it did not require final acceptance to inspect:

- the confirmed/exported `training-plan-v2` shape
- runner-facing `title` repetition across the full horizon
- whether backend richness survived into the actual saved/exported calendar readback

### 2. The audit accepted the wrong richness proxy

The accepted `sometimes_runs_marathon_base` scenario already contained the same weak visible pattern as the bad export:

- `2:strides`
- `3:tempo`
- `6:strides`
- `10:tempo`
- `13:tempo`
- `23:strides`

That sequence looked acceptable when judged abstractly.

It is not acceptable when judged as the actual runner-facing 24-week calendar:

- too few non-long-run identity changes
- too much repeated easy filler in the middle and late block
- no visible steady-support bridge
- no later midweek specificity beyond a rare tempo

### 3. Long-run richness was over-credited

The old acceptance treated richer long-run anatomy as enough to carry the family.

That was incorrect.

Long-run richness is necessary, but it is not sufficient.

If the visible week still reads like:

- `easy / long / recovery / easy / easy`

for long spans, the plan is still flat.

### 4. The audit was too family-local

The anti-flatness repair was accepted as a long-horizon `Marathon Base` fix.

The actual problem is broader:

- Hito lacked a universal richness bar that every plan path must satisfy
- no validator was explicitly scanning confirmed/exported runner-facing repetition

## Universal Quality Split

All plan paths must now be judged on five separate layers.

### 1. Safety

- safe density
- safe recovery spacing
- conservative injury-risk posture

### 2. Metric truth

- no fake pace
- no fake personal HR
- honest default HR labeling

### 3. Endpoint truth

- exact selected distance where promised
- honest non-race endpoint where base-only

### 4. Phase meaning

- visible movement across the horizon
- different parts of the plan feel different for a reason

### 5. Runner-facing richness

- the actual saved/exported titles and identities do not collapse into repetitive filler

A plan may pass the first three and still fail the last two.

## Universal Richness Law

Any generated, selected, confirmed, or exported plan fails coaching quality if:

- most non-rest visible weeks repeat the same `easy/recovery/long` shell for too long
- non-long-run identity is too sparse for the horizon length
- family-specific identity exists only in backend grammar, not in runner-facing calendar reality
- long-run richness is forced to carry the entire family alone

Richness must be judged from the runner-facing plan sequence, not only from hidden composition metadata.

---

## 1. Universal Richness Threshold

Every plan must satisfy all of the following:

### A. Family truth must be visible

A runner should be able to tell, from the plan itself, whether this is:

- `10K`
- `Half Marathon`
- `Marathon Base`
- `Marathon Completion`

without reading internal source kind metadata.

### B. Non-long-run identity must recur

The plan must contain recurring non-long-run identity signals such as:

- strides
- steady support
- progression
- tempo
- threshold
- intervals
- hills
- marathon steady specificity
- half-specific durability

depending on family and runner level.

### C. Long-run identity must evolve

Long runs must rotate meaningful roles:

- support
- cutback
- durability checkpoint
- steady finish
- taper
- endpoint

### D. The middle of the plan cannot go dead

The second and third thirds of the block must still show meaningful family signals.

No plan may front-load all visible variety and then drift into filler until taper.

### E. Visible row labels matter

Validator logic must consider:

- `workout_identity`
- `source_workout_type`
- runner-facing `title`
- week-by-week visible sequence

not just internal archetype tags.

---

## 2. Horizon Buckets And Minimum Phase Signals

| Horizon | Definition | Minimum phase signals required |
| --- | --- | --- |
| `short` | `8-12 weeks` | opener/base distinction, at least one development signal, at least one lighter or taper phase, clear endpoint |
| `medium` | `13-20 weeks` | early support phase, mid-block development phase, cutback rhythm, late sharpening/taper or endpoint prep |
| `long` | `21-32 weeks` | early support, middle bridge, later family-specific phase, visible cutbacks, late taper/endpoint |
| `very_long` | `33-52+ weeks` | adaptation/base, bridge, later specific phase, recurring reintroduced identity in the second half, taper/endpoint |

### Horizon floor rule

A plan fails if its visible weeks do not show these phase signals, even if internal metadata says they exist.

---

## 3. Maximum Allowed Identity Desert

Definition:

- an `identity desert` is a span of consecutive weeks with no meaningful non-long-run family identity beyond generic `easy` or `recovery`

Long-run variation alone does not erase an identity desert.

| Family | Runner level / context | Short | Medium | Long | Very long |
| --- | --- | --- | --- | --- | --- |
| `10K` | beginner/conservative | max `2` weeks | max `3` weeks | max `4` weeks | max `4` weeks |
| `10K` | supported standard load | max `2` weeks | max `2` weeks | max `3` weeks | max `3` weeks |
| `Half Marathon` | beginner bridge | max `3` weeks | max `4` weeks | max `4` weeks | max `5` weeks |
| `Half Marathon` | supported standard load | max `2` weeks | max `3` weeks | max `3` weeks | max `4` weeks |
| `Marathon Base` | beginner/conservative | max `3` weeks | max `4` weeks | max `4` weeks | max `5` weeks |
| `Marathon Base` | supported standard load | max `2` weeks | max `3` weeks | max `4` weeks | max `4` weeks |
| `Marathon Completion` | beginner/conservative | max `3` weeks | max `4` weeks | max `4` weeks | max `5` weeks |
| `Marathon Completion` | supported standard load | max `2` weeks | max `3` weeks | max `4` weeks | max `4` weeks |

### Important note

These are maximum deserts for non-long-run identity.

A family may still fail even inside the desert cap if the only recurring non-long-run signal is too weak for the family.

---

## 4. Minimum Non-Long-Run Identity By Horizon

| Horizon | Minimum required visible non-long-run identity over the block |
| --- | --- |
| `12 weeks` | at least `2` distinct non-long-run identities |
| `16 weeks` | at least `2` distinct non-long-run identities with at least `3` total placements |
| `20 weeks` | at least `3` total placements and at least `2` distinct identities |
| `24 weeks` | at least `4` total placements and at least `3` distinct identities for supported plans, `2` for beginner bridge/conservative only if long-run roles are also richer |
| `32 weeks` | at least `5` total placements and at least `3` distinct identities |
| `40 weeks` | at least `6` total placements, not all front-loaded, and at least `3` distinct identities |
| `52 weeks` | at least `8` total placements across the year, including at least `2` after the midpoint, and at least `3` distinct identities |

The `marathon-base-2026-06-12.json` export fails this bar:

- `24 weeks`
- only `6` non-long-run placements
- only `2` distinct non-long-run identities (`strides`, `tempo`)
- none of `steady`, `progression`, `threshold`, `hills`
- no placements at all from weeks `14-22`

That is runner-facing flatness.

---

## 5. Long-Run Richness: Necessary But Insufficient

Long-run richness is required, but it does not by itself make a plan rich.

### Minimum long-run richness

Every applicable family must show:

- ordinary long runs
- cutback long runs
- later durability checkpoints or finish-role change where the family allows it
- taper long run or honest endpoint preparation

### Why it is insufficient

A plan still fails if:

- long runs evolve
- but midweek identity does not evolve at all

This is exactly what happened in the poor `Marathon Base` export.

---

## 6. Family-Specific Richness Rules

### 10K

Required family feel:

- turnover
- rhythm
- repeatability

#### Required / allowed / forbidden

| Runner level | Required | Allowed | Forbidden |
| --- | --- | --- | --- |
| `beginner_new_runner` | strides | easy/recovery/long/cutback | tempo-heavy calendar, intervals, hills, threshold |
| `sometimes_runs` | strides and tempo and intervals over the block | hills later for stronger support only if doctrine opens it | threshold-dominant structure |
| `runs_a_lot` | strides, tempo, intervals, hills | extra tempo or stronger interval variety | threshold by default in current selected-plan engine |
| `professional_competitive` | strides, tempo, repeated interval expression, hills | richer repeatability variant | hidden second-hard-week density |

### Half Marathon

Required family feel:

- sustained durability
- long-run role meaning
- one unmistakable half-specific signal beyond generic tempo

| Runner level | Required | Allowed | Forbidden |
| --- | --- | --- | --- |
| `beginner_new_runner` bridge | strides and late durability support | steady, progression, soft tempo-like support | intervals-heavy, threshold-heavy, hills-heavy |
| `sometimes_runs` | strides, tempo, one half-specific durability signal | one bounded interval-like session only if half durability is also present | generic tempo copies as the whole family |
| `runs_a_lot` | threshold or clearly stronger half-specific durability | tempo, long-run steady finish | generic tempo-only block |
| `professional_competitive` | threshold plus sharper half-specific support | long intervals or stronger durability variants | two hard touches in one week |

### Marathon Base

Required family feel:

- time on feet
- aerobic durability
- later support/steady bridge

| Runner level | Required | Allowed | Forbidden |
| --- | --- | --- | --- |
| `beginner_new_runner` | strides and/or steady support over the block | progression only later if truly soft | threshold, intervals, race-like specificity |
| `sometimes_runs` | at least `3` non-long-run identity types over `24+` weeks, typically strides + tempo + steady/progression | long-run steady finish, selective later progression | easy/recovery/long/tempo-only pattern for 20+ weeks |
| `runs_a_lot` | strides + tempo + one stronger bridge signal | threshold or hills in standard load | intervals, Marathon Completion drift |
| `professional_competitive` | strides + tempo + threshold/hills plus stronger long-run role | richer steady specificity | intervals, race pace, completion leakage |

### Marathon Completion

Required family feel:

- exact `42195m`
- durability bridge
- completion-specific marathon steady progression

| Runner level | Required | Allowed | Forbidden |
| --- | --- | --- | --- |
| `beginner_new_runner` | steady bridge, long-run durability, long runway | strides, progression late | performance marathon logic |
| `sometimes_runs` | steady support, progression, controlled tempo, later marathon-specific steady identity | long-run steady finish | intervals, race pace |
| `runs_a_lot` | repeated marathon steady specificity and long-run finish progression | controlled tempo support | target-time pace simulation |
| `professional_competitive` | strongest completion-family specificity without becoming a performance family | hills support where honest | race-pace or target-time readiness |

---

## 7. Are Easy/Recovery/Long/Tempo-Heavy Plans Ever Acceptable?

Yes, but only under strict conditions.

### Acceptable only when all are true

- the runner is beginner, conservative, or otherwise low-support
- the family is inherently softer (`Marathon Base`, beginner Half bridge, conservative long-horizon base)
- the horizon still shows recurring non-long-run identity
- long-run roles clearly evolve
- tempo is not the only meaningful midweek signal for the entire block

### Not acceptable when any are true

- medium or long supported plan with only `easy/recovery/long/tempo`
- no `steady` or `progression` bridge in `Marathon Base`
- no half-specific durability signal in `Half Marathon`
- no intervals or hills where supported `10K` should clearly have them
- visible second-half identity desert

The incident export is therefore not acceptable.

---

## 8. Validator Scope To Add

Backend validation must stop checking only preview-shape safety.

It must also scan runner-facing richness across:

- `draft.calendarRows`
- confirmed/persisted/exported `training-plan-v2`
- `planned_workouts`
- runner-facing `title`
- `workout_identity`
- `source_workout_type`
- week-by-week phase distribution
- non-long-run identity placements
- long-run role distribution

### Required validator classes

1. `identity_desert_scan`
   - detect long spans with no meaningful non-long-run identity

2. `family_signal_floor_scan`
   - ensure required family signals exist for the family and runner level

3. `runner_facing_title_repetition_scan`
   - detect visible plan calendars that repeat the same shells too long even if internal metadata differs

4. `long_run_only_richness_scan`
   - fail plans where long-run variety is carrying all of the richness alone

5. `preview_confirm_export_parity_scan`
   - ensure accepted preview richness survives confirmed/exported shape

6. `source_workout_type_fallback_scan`
   - detect flattening where multiple different backend roles all export as the same visible source type or title

---

## 9. QA Coverage Changes Required

QA must no longer accept richness from preview JSON alone.

### QA must inspect

- preview scenario JSON
- confirmed selected-plan samples
- exported JSON/Markdown samples
- saved/persisted row sequences where available

### Required new QA fixture coverage

At minimum QA should include:

- one confirmed/exported sample for each current selected/generated family
- at least one conservative medium-horizon sample
- at least one supported medium-horizon sample
- one sample where preview richness and export richness are compared directly

### Why

The bad `Marathon Base` export proves that preview acceptance alone can create false positives.

---

## 10. Universal Rules Backend Must Encode

1. No family may pass with long visible identity deserts.
2. Long-run richness cannot be the only richness.
3. Runner-facing titles must preserve family meaning.
4. Medium and long plans need visible middle-phase identity, not just early and late signals.
5. Supported plans need richer identity bars than beginner/conservative ones.
6. Conservative plans may soften specificity, but may not become blank.
7. Quality validators must run on preview and confirmed/exported plan truth.
8. Any path that emits the canonical workout taxonomy must satisfy the same richness bar:
   - selected-plan engine
   - structured deterministic first-plan
   - AI blueprint confirmed output
   - saved/exported `training-plan-v2`

---

## 11. Cleanup / Code-Freeze Decision

Cleanup and code-freeze signoff for running-plan generation should stay paused until:

- this universal richness bar is encoded in Backend composition/diversity validators
- QA proves it on preview plus confirmed/export path samples

Reason:

- a confirmed accepted runner-facing plan was still poor
- the current richness gate is therefore not trustworthy enough for freeze-signoff on this subsystem

This pause applies to:

- running-plan generation cleanup
- selected/generated plan quality signoff
- broader rollout confidence for selected-distance creation

It does not automatically block unrelated isolated cleanup outside running-plan composition, if that cleanup does not depend on claiming plan-quality signoff.

---

## 12. Recommended Next Role

`BACKEND`

Backend should encode the universal richness bar and add confirmed/export-path parity validation before another broad acceptance pass.
