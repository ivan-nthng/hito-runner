# Manual Workout Constructor Taxonomy And Template Library

Date: 2026-06-09
Owner: Running Coach
Status: Proposed source-of-truth for manual workout construction and template-based user-built plans
Backlog source: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`

## Purpose

Define one coaching-owned source of truth for:

- manual workout construction inside a user-built plan path
- template-based workout insertion into an empty or existing calendar
- canonical workout-block grammar that Backend can validate
- compact structured constructor content that Frontend can render through Hito DS

This artifact does not imply:

- shipped manual workout CRUD
- database schema
- a card-only picker UI
- fake pace truth
- fake personal HR truth

## Canonical Product Contract

- Watch or app execution is assumed.
- Every non-rest workout must be watch-executable through numeric structure.
- Numeric structure is primary.
- Cue text is secondary.
- No fake precise pace.
- No fake personal HR.
- Hito default HR zones are allowed only as editable default guidance.
- Default HR guidance must never be shown as personal zone truth.
- Long runs over 60 minutes must not be stored or rendered as one anonymous single block.
- Quality sessions must preserve explicit warmup, work, recovery when relevant, and cooldown.
- Manual templates must reuse existing Hito workout identity language where possible.

## Target Truth Modes

Use only these constructor-level target truth modes in v1:

| Target truth mode | Meaning | Allowed use |
| --- | --- | --- |
| `structure_only` | duration, distance, repeats, and segment order only | default for all workouts |
| `editable_default_hr` | structure plus editable default HR label or cap | easy, steady, long, conservative tempo support, selected hill/trail blocks |
| `none` | no executable target because there is no run block | rest day only |

Forbidden as primary truth:

- exact pace from target time alone
- exact pace from watch/app ownership alone
- personalized HR claims without real personal HR truth
- freeform effort text with no numeric segment structure

## Workout Constructor Block Taxonomy

| Block key | Block family | Primary use | Required executable fields | Allowed target truth | Reorderable | Safety notes |
| --- | --- | --- | --- | --- | --- | --- |
| `warmup_block` | preparation | general aerobic preparation before substantive work | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes, but must stay before work or main blocks | required before tempo, threshold, intervals, hills, downhill control, strides-only sets |
| `cooldown_block` | finish | downshift after substantive work | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes, but must stay after work or main blocks | required after quality sessions and recommended after all non-rest sessions |
| `easy_run_block` | support | easy conversational running | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes | safe default support block |
| `steady_run_block` | support | moderate durable aerobic running | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes | not interchangeable with threshold or tempo |
| `progression_block` | quality_support | gradual rise from easy to steady or moderate | explicit ordered sub-ranges by time or distance | `structure_only` | yes | early-safe quality option when intervals are too sharp |
| `tempo_block` | quality | sustained controlled tempo work | `duration_seconds` or `distance_meters` | `structure_only`, limited `editable_default_hr` | yes | requires warmup and cooldown |
| `threshold_block` | quality | threshold durability work | `duration_seconds` or `distance_meters` | `structure_only` | yes | not for beginner_new_runner default templates |
| `interval_work_block` | quality_repeat | one explicit work repeat unit | `duration_seconds` or `distance_meters` | `structure_only` | only inside repeat group or standalone single rep use | should not exist without explicit recovery logic when repeated |
| `interval_recovery_block` | recovery_repeat | jog, walk, or stand recovery between repeats | `duration_seconds` or `distance_meters` | `structure_only` | only inside repeat group | recovery must be explicit for repeated work |
| `hill_work_block` | hill_repeat | uphill or rolling hill work | `duration_seconds`, optional slope-type label | `structure_only`, limited `editable_default_hr` | only inside repeat group or hill-specific main block | no exact grade or elevation prescription |
| `downhill_control_block` | skill_repeat | controlled downhill mechanics and durability | `duration_seconds` or descent repetition count via repeat group | `structure_only` | only inside repeat group or terrain-specific sequence | not suitable for beginner_new_runner |
| `rest_walk_jog_recovery_block` | recovery_repeat | walk, jog, or rest recovery between work segments | `duration_seconds` or `distance_meters` | `structure_only` | only inside repeat group or run-walk sequence | use for run/walk templates and hill recoveries |
| `long_run_body_block` | endurance | core long-run duration or distance | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes, but must precede long-run finish block if finish exists | long runs over 60 min must use this plus at least one more block |
| `long_run_finish_block` | endurance_finish | steady or controlled closing section | `duration_seconds` or `distance_meters` | `structure_only`, `editable_default_hr` | yes, but only after long-run body block | no fake race pace; counts as specificity load |
| `strides_block` | neuromuscular | short relaxed fast strides | repeat count plus work duration or work distance | `structure_only` | yes, usually after easy support and before cooldown | not a full interval session |
| `drills_mobility_note_block` | support_note | drills or mobility note if supported | `note_text` only | secondary only | yes | not executable target truth; never the main workout |
| `coach_cue_note_block` | support_note | freeform cue or reminder | `note_text` only | secondary only | yes | may clarify intent, never replace numeric structure |

## Loop And Repeat Model

## Repeat Group Anatomy

Every repeat group must contain:

| Field | Required | Meaning |
| --- | --- | --- |
| `repeat_count` | yes | number of rounds |
| `work_block` | yes | one executable work unit |
| `recovery_block` | conditional | required for repeated intensity, optional only for strides clusters if the stride block already contains recovery |
| `group_label` | optional | user-facing label such as `6 x 2 min` |
| `safety_kind` | yes | `intervals`, `tempo_repeats`, `hill_repeats`, `run_walk`, `strides`, `downhill_control` |

## Repeat Rules

| Rule | Contract |
| --- | --- |
| Single-level repeats | allowed |
| Nested repeats | forbidden in v1 |
| Work plus recovery pairing | required for intervals, hills, downhill control, run-walk, and repeated tempo or threshold blocks |
| Mixed unit pairs | allowed, for example distance work plus time recovery or time work plus distance recovery |
| Recovery omission | allowed only for a single non-repeated work block or when strides block stores built-in recovery |
| Repeat count floor | minimum `2` for true repeat groups |
| Repeat count cap | backend should later impose safe caps by template family and runner level |

## Canonical Repeat Examples

| Example label | Constructor shape | Notes |
| --- | --- | --- |
| `5 x 1500m / 500m jog` | repeat group: `repeat_count 5`, `interval_work_block 1500m`, `interval_recovery_block 500m jog` | advanced/reference template only |
| `6 x 2 min / 1 min easy jog` | repeat group: `repeat_count 6`, `interval_work_block 120 sec`, `interval_recovery_block 60 sec jog` | safe time-interval structure |
| `8 x 45 sec uphill / walk-jog down` | repeat group: `repeat_count 8`, `hill_work_block 45 sec uphill`, `rest_walk_jog_recovery_block walk-jog down` | no exact slope truth |
| `3 x 10 min tempo / 2 min easy jog` | repeat group: `repeat_count 3`, `tempo_block 10 min`, `interval_recovery_block 2 min jog` | supported tempo durability |
| `10 x 1 min run / 1 min walk` | repeat group: `repeat_count 10`, `easy_run_block 1 min run`, `rest_walk_jog_recovery_block 1 min walk` | adaptation or return-to-consistency safe |
| `6 strides of 20 sec with 60 sec easy jog` | repeat group: `repeat_count 6`, `strides_block 20 sec`, `interval_recovery_block 60 sec jog` | neuromuscular, not full intensity |

## Constructor Semantics

## Reordering Rules

| Block or pattern | Reorderable | Constraint |
| --- | --- | --- |
| easy, steady, long-run body, long-run finish | yes | must preserve sensible chronology |
| warmup | limited | cannot appear after quality work starts |
| cooldown | limited | cannot appear before final work block |
| progression block | limited | must move from easier to stronger internal ordering |
| repeat groups | limited | may shift within the middle of a workout, not before warmup or after cooldown |
| drills or cue notes | yes | secondary only |
| downhill control | limited | only in terrain-appropriate templates |

## Required Block Rules

| Template class | Required blocks |
| --- | --- |
| rest | no run blocks |
| recovery, easy, steady | at least opener or warmup, one main support block, one finish or cooldown block |
| long | long-run body plus finish or checkpoint plus cooldown |
| progression | warmup, progression block, cooldown |
| tempo, threshold | warmup, work block or repeat group, cooldown |
| intervals, hills, downhill control | warmup, repeat group, cooldown |
| run-walk | repeat group or ordered alternating block plus cooldown |
| strides add-on | easy or warmup support, strides repeat group, cooldown |

## Long-Run Rules

- Any long run above 60 minutes must contain more than one executable run block.
- Acceptable long-run anatomy:
  - opener plus long-run body plus cooldown
  - opener plus long-run body plus checkpoint plus cooldown
  - opener plus long-run body plus steady finish plus cooldown
- Forbidden long-run shape:
  - one anonymous `90 min long run` block with no opener, finish, or checkpoint structure

## Cue Rules

- Cues may clarify posture, fueling, rhythm, or terrain handling.
- Cues may not replace work duration, distance, repeats, or recovery structure.
- Cues may not be the only target instruction on a non-rest workout.

## Template Library Matrix

| Template key | Picker label | Primary family | Eligible runner levels | Required blocks | Optional blocks | Editable values | Fixed values | Metric mode | Recovery protection | Stack-hard warning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rest_day` | Rest day | rest | all | no run blocks | cue note | note only | no executable targets | `none` | not applicable | none |
| `recovery_jog` | Recovery jog | recovery | beginner_new_runner, sometimes_runs, runs_a_lot, professional_competitive | opener, easy block, cooldown | default HR note, cue note | total duration, opener, cooldown, note | recovery identity | `structure_only` or `editable_default_hr` | should be favored after long run or hard session | no |
| `easy_aerobic_run` | Easy aerobic run | easy | all | warmup or opener, easy block, cooldown | strides add-on, cue note, default HR note | duration or distance, optional strides count, notes | easy identity | `structure_only` or `editable_default_hr` | safe default | no |
| `steady_aerobic_run` | Steady aerobic run | steady | sometimes_runs, runs_a_lot, professional_competitive; cautious beginner only | warmup, steady block, cooldown | cue note, default HR note | duration or distance, steady block size, notes | steady identity | `structure_only` or `editable_default_hr` | avoid immediate post-long-run slot for low-support runners | soft warning |
| `easy_run_with_strides` | Easy run with strides | strides_support | sometimes_runs, runs_a_lot, professional_competitive; safe beginner after adaptation | easy support, strides repeat group, cooldown | default HR note on easy parts, cue note | easy duration, stride count, stride duration, recovery duration, notes | stride purpose | `structure_only` | mild load only | soft warning if stacked after quality |
| `progression_run` | Progression run | progression | sometimes_runs, runs_a_lot, professional_competitive; cautious beginner with support | warmup, progression block, cooldown | cue note | total duration, internal progression split, notes | progressive order | `structure_only` | not day-after-long-run for beginner/low support | yes |
| `controlled_tempo_session` | Controlled tempo session | tempo | sometimes_runs with support, runs_a_lot, professional_competitive | warmup, tempo work, cooldown | recovery jog between reps, cue note | warmup, rep count, rep duration or distance, recovery, cooldown, notes | tempo identity | `structure_only`, limited `editable_default_hr` support language | quality protection required | yes |
| `half_marathon_threshold_durability` | Threshold durability | threshold | runs_a_lot, professional_competitive; strong sometimes_runs only | warmup, threshold work or repeats, cooldown | cue note | rep count, work duration or distance, recovery, notes | threshold identity | `structure_only` | quality protection required | yes |
| `time_intervals` | Time intervals | intervals | sometimes_runs with support, runs_a_lot, professional_competitive | warmup, repeat group, cooldown | cue note | rep count, work duration, recovery duration, notes | interval identity | `structure_only` | quality protection required | yes |
| `distance_intervals` | Distance intervals | intervals | runs_a_lot, professional_competitive; limited strong sometimes_runs | warmup, repeat group, cooldown | cue note | rep count, work distance, recovery time or distance, notes | interval identity | `structure_only` | quality protection required | yes |
| `5k_sharpening_repeats` | 5K sharpening repeats | intervals_specific | runs_a_lot, professional_competitive | warmup, repeat group, cooldown | cue note | rep count, work distance, recovery, notes | 5K-specific identity | `structure_only` | quality protection required | yes |
| `10k_rhythm_intervals` | 10K rhythm intervals | intervals_specific | sometimes_runs with support, runs_a_lot, professional_competitive | warmup, repeat group, cooldown | cue note | rep count, work duration or distance, recovery, notes | 10K-specific identity | `structure_only` | quality protection required | yes |
| `long_aerobic_run` | Long aerobic run | long | all runners with distance-appropriate load | opener, long-run body, finish or checkpoint, cooldown | default HR note, cue note | total duration or distance, checkpoint note, cooldown, notes | long identity | `structure_only` or `editable_default_hr` | must not follow another hard session tightly | soft warning |
| `long_run_with_steady_finish` | Long run with steady finish | long_specific | sometimes_runs with support, runs_a_lot, professional_competitive | opener, long-run body, long-run finish, cooldown | cue note, default HR note | body size, finish size, total duration, notes | finish-after-body structure | `structure_only` or `editable_default_hr` | counts as weekly specific load | yes |
| `cutback_long_run` | Cutback long run | long_cutback | all when relevant | opener, reduced long-run body, cooldown | cue note | total duration or distance, notes | cutback identity | `structure_only` or `editable_default_hr` | lower-load week only | no |
| `taper_long_run` | Taper long run | long_taper | all when relevant | opener, reduced long-run body, cooldown | cue note | total duration or distance, notes | taper identity | `structure_only` or `editable_default_hr` | taper only | no |
| `uphill_repeats` | Uphill repeats | hills | sometimes_runs with support, runs_a_lot, professional_competitive | warmup, repeat group, cooldown | cue note | rep count, uphill duration, recovery, notes | uphill identity | `structure_only` | quality protection required | yes |
| `rolling_hills_session` | Rolling hills session | hills | sometimes_runs, runs_a_lot, professional_competitive | warmup, steady hill block, cooldown | cue note | duration, notes | rolling terrain identity | `structure_only` | moderate-load protection | soft warning |
| `controlled_downhill_durability` | Controlled downhill durability | hills_skill | runs_a_lot, professional_competitive | warmup, repeat group, cooldown | cue note | rep count, descent duration, recovery, notes | downhill control identity | `structure_only` | terrain-specific caution required | yes |
| `run_walk_adaptation` | Run-walk session | adaptation | beginner_new_runner, restart runners | repeat group, cooldown | cue note | rep count, run duration, walk duration, notes | adaptation identity | `structure_only` | safe adaptation path | no |
| `technical_trail_easy` | Technical trail easy | trail | sometimes_runs, runs_a_lot, professional_competitive; supported beginner trail only | opener, trail body, checkpoint or finish, cooldown | cue note | total duration, checkpoint size, notes | trail easy identity | `structure_only` | terrain caution | soft warning |
| `hike_run_endurance` | Hike-run endurance | trail | runs_a_lot, professional_competitive; limited supported sometimes_runs | opener, repeat or alternating hike-run body, finish, cooldown | cue note | cycle count, work/recovery durations, total time, notes | hike-run identity | `structure_only` | counts as specialty endurance | yes |
| `mountain_long_run_time_on_feet` | Mountain long run | trail_long | runs_a_lot, professional_competitive | opener, long-run body, checkpoint, finish, cooldown | cue note | total time, checkpoint size, finish, notes | mountain time-on-feet identity | `structure_only` | specialty long-run protection | yes |

## Future-Only Or Advanced-Only Templates

These should exist in source truth but not ship broadly by default in v1 picker access:

| Template key | Picker label | Why future-only or advanced-only |
| --- | --- | --- |
| `long_intervals_5x1500m_500m_jog` | Long intervals 5 x 1500m / 500m jog | too sharp for beginner and standard recreational paths |
| `cruise_intervals_4x2k_2min_jog` | Cruise intervals 4 x 2km / 2 min jog | strong threshold durability, high support only |
| `threshold_3x3k_1k_float` | Threshold 3 x 3km / 1km float | float recoveries are advanced and easy to misuse |
| `marathon_steady_blocks_3x5k_1k_easy` | Marathon steady blocks | not appropriate for current conservative manual default library |
| `alternating_threshold_2k_1k_x4` | Alternating threshold blocks | advanced specificity and fatigue management required |

## Editable Values And Fixed Values

## Editable Values

Backend and Frontend should treat these as normal editable fields when template policy allows:

- total duration
- total distance
- warmup duration or distance
- cooldown duration or distance
- repeat count
- work duration
- work distance
- recovery duration
- recovery distance
- long-run finish size
- optional cue text
- optional note text
- default HR label or cap when metric mode allows `editable_default_hr`

## Fixed Values

These should remain template-owned unless the user intentionally changes template type or backend later allows safe conversion:

- workout identity
- workout family
- safety class
- whether a workout counts as quality or support
- whether warmup is mandatory
- whether cooldown is mandatory
- whether the workout needs explicit recovery blocks
- whether a long run requires multi-block anatomy
- whether a template is hidden or warned for a runner level

## Safety And Eligibility

## Not Suitable For `beginner_new_runner`

Default template access should block or hide:

- threshold durability
- distance intervals
- 5K sharpening repeats
- 10K rhythm intervals as a default first intensity template
- uphill repeats as hard repeats
- controlled downhill durability
- long steady-finish long runs
- hike-run endurance beyond conservative trail adaptation
- mountain long run time on feet

## Recovery Protection Templates

These templates should later trigger backend spacing or warning logic:

- controlled tempo session
- threshold durability
- time intervals
- distance intervals
- 5K sharpening repeats
- 10K rhythm intervals
- uphill repeats
- controlled downhill durability
- long run with steady finish
- hike-run endurance
- mountain long run time on feet

## Stack-Hard Session Warnings

Backend should later warn or block when a user manually stacks:

- two quality templates on adjacent running days
- a quality template immediately before a long run
- a steady-finish long run immediately before a quality template
- a hard hill or downhill session after an already-fatiguing specialty long run

## Default HR Eligibility

Allowed with `editable_default_hr`:

- recovery jog
- easy aerobic run
- steady aerobic run
- long aerobic run
- cutback long run
- taper long run
- selected conservative marathon steady blocks

Allowed only as secondary support, not the primary truth:

- controlled tempo session
- rolling hills session

Not appropriate as primary truth:

- distance intervals
- time intervals
- 5K sharpening repeats
- 10K rhythm intervals
- threshold durability
- advanced repeats

## Template Examples

## Easy

| Field | Value |
| --- | --- |
| Template key | `easy_aerobic_run` |
| Picker label | Easy aerobic run |
| Editable fields | total duration or distance, warmup size, cooldown size, optional strides, note |
| Fixed fields | easy identity, support classification |
| Example anatomy | `10 min warmup -> 30 min easy -> 5 min cooldown` |

## Recovery

| Field | Value |
| --- | --- |
| Template key | `recovery_jog` |
| Picker label | Recovery jog |
| Editable fields | total duration, opener, cooldown, note |
| Fixed fields | recovery identity, very light classification |
| Example anatomy | `5 min opener -> 20 min recovery jog -> 5 min cooldown` |

## Steady

| Field | Value |
| --- | --- |
| Template key | `steady_aerobic_run` |
| Picker label | Steady aerobic run |
| Editable fields | total duration or distance, steady block size, notes |
| Fixed fields | steady identity |
| Example anatomy | `10 min warmup -> 30 min steady -> 5 min cooldown` |

## Long

| Field | Value |
| --- | --- |
| Template key | `long_aerobic_run` |
| Picker label | Long aerobic run |
| Editable fields | total duration or distance, checkpoint note, cooldown, notes |
| Fixed fields | long identity, multi-block rule |
| Example anatomy | `10 min opener -> 75 min long-run body -> 5 min fueling check -> 5 min cooldown` |

## Progression

| Field | Value |
| --- | --- |
| Template key | `progression_run` |
| Picker label | Progression run |
| Editable fields | total duration, progression split, notes |
| Fixed fields | progressive order |
| Example anatomy | `10 min warmup -> 15 min easy -> 10 min steady -> 5 min stronger controlled finish -> 5 min cooldown` |

## Tempo

| Field | Value |
| --- | --- |
| Template key | `controlled_tempo_session` |
| Picker label | Controlled tempo session |
| Editable fields | warmup, rep count, rep duration, recovery, cooldown, notes |
| Fixed fields | tempo identity, quality classification |
| Example anatomy | `15 min warmup -> 3 x 8 min tempo / 2 min jog -> 10 min cooldown` |

## Threshold

| Field | Value |
| --- | --- |
| Template key | `half_marathon_threshold_durability` |
| Picker label | Threshold durability |
| Editable fields | rep count, work duration or distance, recovery, notes |
| Fixed fields | threshold identity |
| Example anatomy | `15 min warmup -> 3 x 10 min threshold / 3 min jog -> 10 min cooldown` |

## Intervals

| Field | Value |
| --- | --- |
| Template key | `time_intervals` |
| Picker label | Time intervals |
| Editable fields | rep count, work duration, recovery duration, notes |
| Fixed fields | interval identity |
| Example anatomy | `15 min warmup -> 6 x 2 min work / 1 min easy jog -> 10 min cooldown` |

## Hills

| Field | Value |
| --- | --- |
| Template key | `uphill_repeats` |
| Picker label | Uphill repeats |
| Editable fields | rep count, uphill duration, recovery, notes |
| Fixed fields | hill-repeat identity |
| Example anatomy | `15 min warmup -> 8 x 45 sec uphill / walk-jog down -> 10 min cooldown` |

## Run-Walk

| Field | Value |
| --- | --- |
| Template key | `run_walk_adaptation` |
| Picker label | Run-walk session |
| Editable fields | repeat count, run duration, walk duration, notes |
| Fixed fields | adaptation identity |
| Example anatomy | `10 x 1 min run / 1 min walk -> 5 min cooldown walk-jog` |

## Strides

| Field | Value |
| --- | --- |
| Template key | `easy_run_with_strides` |
| Picker label | Easy run with strides |
| Editable fields | easy support duration, stride count, stride duration, recovery duration, notes |
| Fixed fields | stride add-on identity |
| Example anatomy | `10 min easy -> 6 x 20 sec strides / 60 sec jog -> 5 min cooldown` |

## Rest

| Field | Value |
| --- | --- |
| Template key | `rest_day` |
| Picker label | Rest day |
| Editable fields | note only |
| Fixed fields | no executable segments |
| Example anatomy | `Rest day; optional note only` |

## Advanced

| Field | Value |
| --- | --- |
| Template key | `long_intervals_5x1500m_500m_jog` |
| Picker label | Long intervals 5 x 1500m / 500m jog |
| Editable fields | rep count, work distance, recovery distance, notes |
| Fixed fields | advanced interval identity, advanced-only access |
| Example anatomy | `15-20 min warmup -> 5 x 1500m / 500m jog -> 10-15 min cooldown` |

## Backend Handoff Summary

Backend should later encode this artifact into:

- constructor block enums
- template eligibility rules
- repeat-group validators
- workout identity safety gates
- runner-level access rules
- stacking warnings and blocks
- review/readback formatting

Frontend should later treat this artifact as:

- canonical picker taxonomy
- constructor field grammar
- editability truth
- detail-view specimen truth

