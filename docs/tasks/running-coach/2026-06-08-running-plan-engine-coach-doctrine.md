# Running Plan Engine Coach Doctrine

## Purpose

This file is the first coach-authored doctrine layer for the rebuilt Hito running plan creation
engine.

It defines:

- selected-distance family promises
- runner-level interpretation
- load and progression moderation
- weekly rhythm rules
- watch-executable workout structure
- default HR-zone handling
- backend acceptance rules

This is source-of-truth for Backend and Architect. It is not implemented product behavior by itself.

## Failure Evidence This Doctrine Must Prevent

Negative fixtures showed product-failing behavior:

- `10K Foundation` ended on `long_aerobic_run` instead of explicit 10K endpoint behavior.
- `Half Marathon Balanced` ended with `half_readiness_marker` instead of explicit 21.1K endpoint
  behavior.
- another Half Marathon export ended on `rest_and_recovery`, which is unacceptable as a selected-distance endpoint.
- some key workouts read like primary effort labels rather than watch-executable structured
  prescriptions.

The rebuilt engine must fail generation or review before repeating any of those outcomes.

## Canonical Product Rules

- AI does not directly author normal running plans.
- The engine builds from deterministic coach-owned recipes and hard rules.
- Watch/app execution is assumed for supported new-plan creation.
- User-provided 5K benchmark is removed from the normal happy path.
- No precise pace is allowed in the normal happy path unless a future approved pace-truth source is
  explicitly adopted.
- Hito default HR zones are editable defaults, not personal biometric truth.
- Coaching cue text is secondary; structured prescription is primary.

## Source-Of-Truth Boundary

This Running Coach slice does not treat the untracked files under
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-creation-engine/`
as canonical.

Reason:

- they contain stale/conflicting contract language around benchmark pace, personal HR truth, and
  old runner-level labels
- they may remain useful as later implementation candidates, but they are not the accepted source of
  truth for Slice R1

Accepted docs-owned canonical source for workout-day anatomy:

- [Running Plan Engine Watch-Executable Workout Library](2026-06-08-running-plan-engine-watch-executable-workout-library.md)

## Supported Distance Families

| Family | Product meaning | Final promise |
|---|---|---|
| `10K` | selected-distance completion build with visible 10K-specific development | explicit 10K completion or checkpoint behavior |
| `Half Marathon` | selected-distance completion build with visible 21.1K-specific development | explicit 21.1K completion or checkpoint behavior |
| `Marathon Base` | honest marathon durability and base-building block, not full race-peak prep | explicit base endpoint, unless product later ships a separate full Marathon endpoint family |

## Selected-Distance Endpoint Doctrine

### 10K

Accepted final behavior:

- explicit `10K completion day`
- explicit `10K checkpoint day`
- explicit `10K continuous endpoint block`

Rejected final behavior:

- final `long_aerobic_run`
- final generic easy day
- final recovery day
- endpoint hidden only in metadata while output rows stay generic

### Half Marathon

Accepted final behavior:

- explicit `21.1K completion day`
- explicit `Half Marathon checkpoint day`
- explicit `21.1K continuous endpoint block`

Rejected final behavior:

- final `half_readiness_marker` if it is not a real selected-distance endpoint
- final rest day
- final generic easy or long day with no 21.1K behavior

### Marathon Base

Accepted final behavior:

- explicit `Marathon Base endpoint`
- explicit durability endpoint long run or steady durability endpoint with honest base language

Rejected final behavior:

- false full-marathon race-readiness claim
- fake taper-peak language
- target-time implication

## Runner-Level Interpretation

| Runner level | Meaning | Intensity ceiling | Typical engine bias |
|---|---|---|---|
| `beginner_new_runner` | very new or not yet durable | no aggressive specificity; first variety comes from structure, strides, progression, and careful long-run growth | habit, safety, consistency |
| `sometimes_runs` | some continuity but not highly stable | one moderate touch max when earned | completion and repeatable development |
| `runs_a_lot` | recreationally durable and supportable | one quality touch max with clearer distance-specific work | clearer specificity and stronger long-run rhythm |
| `professional_competitive` | advanced runner profile, but normal product path stays conservative | still no fake performance block in this engine slice | conservative base unless a future advanced track exists |

Interpretation rule:

- support evidence outranks ambition
- the engine should never use a higher-intensity profile merely because the runner picked a longer
  or more ambitious distance

## Load And Progression Interpretation

### Real Inputs

The engine must use these as real inputs:

- age
- height
- weight
- runner level
- days/week
- fixed rest days
- preferred long-run day

They must affect:

- duration range
- long-run growth speed
- cutback frequency
- early specificity delay
- support-day density

They must not affect:

- fake metric precision
- body-shaming language
- injury inference

### Progression Moderation Rules

| Input pressure | Engine effect |
|---|---|
| older age band | slower ramp, more cutbacks, fewer abrupt long-run jumps |
| higher load context from age/height/weight combination | longer runway, more conservative progression |
| fewer days/week | longer total horizon, less weekly specificity density |
| more fixed rest days | preserve off-days and reduce available slot compression |
| long-run day preference | place long run there when viable; if not viable, correct before review |

## Weekly Rhythm Rules

### Global Rhythm

- one specific touch maximum per week in the normal engine path
- if the long run has a specific finish block, it may count as the week’s specific touch
- easy and recovery days must clearly outnumber quality days
- cutbacks are mandatory, not optional polish

### Recovery Rules

- the next actual running slot after a long run must be recovery or easy in conservative variants
- low-frequency plans must not compress long run and specific work into unsafe adjacency
- a cutback week must be visibly lighter, not disguised as a normal support week

### Taper Rules

- taper or endpoint weeks must reduce fatigue
- taper must not create a second hard stimulus
- selected-distance endpoint weeks must not hide the endpoint below generic support days

## Watch-Executable Segment Anatomy

The canonical workout-day and segment source for this Running Coach slice is:

- [Running Plan Engine Watch-Executable Workout Library](2026-06-08-running-plan-engine-watch-executable-workout-library.md)

Summary rules:

- every non-rest workout requires numeric structure
- every segment needs explicit duration or distance unless it is a repeat container
- repeat work must declare work plus recovery
- cues explain intent but cannot replace the prescription

### Canonical Workout Types

| Workout type | Required structure shape |
|---|---|
| recovery | warmup or opener, easy main block, cooldown |
| easy | warmup or opener, easy main block, cooldown |
| long run | opener, long main block, optional checkpoint, easy finish |
| cutback long run | opener, reduced long main block, easy finish |
| strides | easy running plus explicit repeated stride units and recoveries |
| tempo | warmup, explicit tempo work blocks, recoveries if split, cooldown |
| threshold | warmup, explicit threshold blocks, explicit recoveries, cooldown |
| intervals | warmup, explicit repeated work units, explicit recoveries, cooldown |
| hills | warmup, explicit uphill work units, explicit downhill/jog recoveries, cooldown |
| final selected-distance day | warmup, explicit selected-distance main block, easy finish, cooldown |

## Default HR-Zone Handling

Hito default HR zones are allowed only as conservative defaults.

They must be labelled as:

- `Hito default HR zones`
- `editable default zones`
- `not personal HR-zone truth`

They may guide:

- conservative easy-day HR caps
- steady aerobic guardrails
- long-run HR ceilings in conservative contexts

They must not be described as:

- personal zones
- measured threshold truth
- individualized biometric certainty

Backend rule:

- if a workout uses default HR guidance, runner-facing text must explicitly say it is a default
  editable starting point
- if the product later supports personal HR truth, that must be a separate higher-trust mode

## UI And Readback Guidance

Runner-facing order must be:

1. primary structured prescription
2. target mode or cap if valid
3. secondary coaching cue
4. secondary safety note

Accepted example:

- `6 x 400m controlled repeat with 200m jog recovery`
- secondary cue: `Repeat the same controlled rhythm each rep`

Rejected example:

- `Effort: threshold steady`

Internal labels such as taxonomy names or effort tags must never be the primary execution truth.

## Backend Acceptance Rules

### A generated workout must contain

- at least one non-rest segment row
- explicit duration or distance structure for each runnable segment
- explicit repeat and recovery anatomy when repeats exist
- selected-distance endpoint behavior for selected-distance families
- target-mode classification such as structure-only or editable default HR guidance
- secondary cue only after primary structure is clear

### A generated workout must fail quality gates when

- the primary output is only vague effort wording
- the final week of 10K lacks explicit 10K endpoint behavior
- the final week of Half Marathon lacks explicit 21.1K endpoint behavior
- Half or 10K ends on rest or generic support behavior
- Marathon Base implies full race readiness
- precise pace appears in the normal happy path
- HR appears as personal truth when it is only a default estimate

### A generated draft should route to custom or review when

- the distance promise cannot be met honestly
- the week structure would violate rest-day or recovery logic
- the selected-distance endpoint cannot be expressed in watch-executable structure
- metric truth is insufficient for the requested specificity

## What Must Stay Preserved

- deterministic backend-owned generation
- review/confirm boundary
- watch/app assumption for supported generation
- no fake precise pace
- no fake personal HR
- secondary coaching cues only
- no body-shaming or medical language

## Recommended Backend Translation Order

1. distance family contract
2. runner-level interpretation
3. load/progression moderation
4. weekly rhythm
5. workout-day atoms
6. endpoint rules
7. quality gates
