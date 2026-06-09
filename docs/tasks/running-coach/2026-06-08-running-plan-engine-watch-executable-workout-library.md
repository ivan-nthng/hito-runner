# Running Plan Engine Watch-Executable Workout Library

## Source-Of-Truth Boundary

This docs-owned artifact is the canonical Running Coach source of truth for watch-executable workout
day anatomy in Slice R1.

Important boundary:

- the untracked files under
  `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-creation-engine/`
  are not accepted as canonical by this Running Coach slice
- they contain stale/conflicting contract language around benchmark-backed pace truth, personal
  HR-zone truth, and old runner-level labels
- Architect and Backend may decide later whether to archive, replace, or translate those files, but
  this doctrine does not depend on them

## Accepted V1 Metric Contract

For the rebuilt normal running-plan engine:

- watch/app execution is assumed
- user-provided 5K benchmark is removed from the normal happy path
- no fake precise pace
- no fake personal HR
- Hito default HR zones may guide workouts as conservative editable defaults
- Hito default HR zones must never be shown as personal HR truth
- effort and coaching cues remain secondary

## Segment Prescription Model

| Segment mode | Primary fields | Allowed in v1 | Watch-executable | Truth mode | Notes |
|---|---|---|---|---|---|
| `time` | `duration_seconds`, `intensity_label` | yes | yes | structure-only | default support primitive |
| `distance` | `distance_meters`, `intensity_label` | yes | yes | structure-only | default distance primitive |
| `time_with_default_hr_cap` | `duration_seconds`, `default_hr_zone_label_or_cap` | yes | yes | editable default HR | must say editable default, not personal truth |
| `distance_with_default_hr_cap` | `distance_meters`, `default_hr_zone_label_or_cap` | yes | yes | editable default HR | only for conservative aerobic use |
| `repeat` | `repeat_count`, explicit work, explicit recovery | yes | yes | structure-only or editable default HR | never implied |
| `recovery_time` | `recovery_duration_seconds` | yes | yes | structure-only | easy jog or walk recovery |
| `recovery_distance` | `recovery_distance_meters` | yes | yes | structure-only | easy jog recovery |
| `open_warmup` | `duration_seconds` | yes | yes | structure-only | flexible route, fixed cap |
| `open_cooldown` | `duration_seconds` | yes | yes | structure-only | flexible route, fixed cap |
| `free_run_with_cap` | `duration_seconds_or_distance_meters`, explicit cap | yes | yes | structure-only or editable default HR | allowed for trail/hill freedom only if a real cap exists |

## Canonical Workout Day Examples

### Recovery Run

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| opener | `5 min easy` | start relaxed |
| main | `20-30 min easy` | softer than normal easy run |
| cooldown | `5 min easy` | finish fresher than mid-run |

Truth mode:
- structure-only
- optional editable default HR cap only if the UI labels it as default

### Easy Aerobic Run

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| opener | `10 min easy` | settle gradually |
| main | `30-45 min easy` | conversational rhythm |
| cooldown | `5 min easy` | smooth finish |

Truth mode:
- structure-only
- or `time_with_default_hr_cap` using editable default HR guidance

### Long Run

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| opener | `10 min easy` | start patient |
| main | `60-120+ min easy` | durable, not rushed |
| checkpoint | `3-5 min posture/fueling check` | stay calm through the middle |
| finish | `5 min easy` | finish controlled |

Truth mode:
- structure-only
- optional editable default HR cap for conservative aerobic control

### Cutback Long Run

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| opener | `10 min easy` | lighter week mindset |
| main | `reduced long run block` | clearly easier than prior peak |
| finish | `5 min easy` | finish fresh |

Truth mode:
- structure-only
- optional editable default HR cap

### Easy Run With Strides

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `10 min easy` | open up gradually |
| support block | `10-20 min easy` | keep it relaxed |
| repeats | `4-8 x 20 sec quick stride` | quick feet, relaxed body |
| recovery | `60 sec easy jog after each stride` | reset fully |
| cooldown | `5 min easy` | finish calm |

Truth mode:
- structure-only

### Tempo Run

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `12-15 min easy` | prepare fully |
| work | `2-3 x 8-12 min controlled tempo` | strong and smooth |
| recovery | `2-3 min easy jog between blocks` | recover enough to repeat cleanly |
| cooldown | `8-10 min easy` | finish composed |

Truth mode:
- structure-only in v1 normal path
- optional editable default HR guidance only if labelled default, never personal

### Threshold Intervals

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `15 min easy` | arrive calm |
| work | `3 x 8-10 min threshold-like block` | strong but controlled |
| recovery | `3 min easy jog` | fully reset |
| cooldown | `10 min easy` | bring effort down gradually |

Truth mode:
- structure-only in v1 normal path
- optional editable default HR guidance only if clearly labelled default

### Short Intervals

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `15 min easy` | prepare fully |
| work | `6 x 400m controlled repeat` | repeat the same controlled rhythm |
| recovery | `200m easy jog` or `90 sec easy jog` | reset before the next rep |
| cooldown | `10 min easy` | finish relaxed |

Truth mode:
- structure-only in v1 normal path
- no precise pace target in the normal happy path

### Long Intervals

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `15 min easy` | settle before the main work |
| work | `4 x 1 km controlled repeat` | durable repeatable effort |
| recovery | `2 min easy jog` | recover enough to hold form |
| cooldown | `10 min easy` | smooth finish |

Truth mode:
- structure-only in v1 normal path

### Hill Repeats

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `15 min easy` | warm fully before the hill |
| work | `6-10 x 45 sec uphill repeat` | strong push, relaxed upper body |
| recovery | `75-90 sec walk/jog down` | control the descent |
| cooldown | `10 min easy` | finish calm |

Truth mode:
- structure-only
- optional editable default HR cap for conservative hill versions

### Final 10K Day

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `10-12 min easy` | start calm |
| main | `10 km completion block` | complete the full distance honestly |
| finish | `3 min easy settle` | downshift before stopping |
| cooldown | `5-8 min easy` | finish confident |

Truth mode:
- structure-only
- selected-distance endpoint is the primary contract

### Final Half Marathon Day

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `10-12 min easy` | start patient |
| main | `21.1 km completion block` | complete the full distance honestly |
| finish | `3 min easy settle` | regain calm control |
| cooldown | `5-8 min easy` | finish confident |

Truth mode:
- structure-only
- selected-distance endpoint is the primary contract

### Marathon Base Endpoint

| Segment | Primary prescription | Secondary cue |
|---|---|---|
| warmup | `10 min easy` | start patient |
| main | `40-60 min durable steady block` | calm durable composure |
| finish | `5 min easy settle` | let the effort come down |
| cooldown | `5-10 min easy` | finish durable, not depleted |

Truth mode:
- structure-only
- optional editable default HR guidance only if clearly labelled default

## Forbidden Primary Output

These are not acceptable as the primary runner-facing contract:

- `Effort: threshold steady`
- `Tempo feel`
- `Run by feel` with no explicit duration or distance
- default HR shown as if it were personal HR truth
- precise pace targets in the normal happy path

## Backend Translation Notes

Backend should later encode this file into:

- typed workout-day templates
- typed segment models
- target-mode labels
- endpoint quality gates
- review/readback formatting rules
