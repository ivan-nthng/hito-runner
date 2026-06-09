# Hito DS Workout Library Specimen Matrix

Date: 2026-06-09
Owner: Running Coach
Status: Proposed source-of-truth for `/hitoDS#workout-library-playground`
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`

## Purpose

Define one coaching-owned specimen matrix for the static Hito DS workout-library calendar and detail playground.

This artifact exists so:

- Product can review every canonical workout identity without generating a real plan
- Design can inspect labels, glyph expectations, segment anatomy, and provider overlays
- Frontend can render static specimens without inventing coaching content
- QA can validate identity coverage and visual states without touching Supabase, real plans, or provider uploads

## Canonical Rules

- Watch/app execution is assumed.
- Numeric structure is primary.
- Cues are secondary.
- No fake precise pace.
- No fake personal HR.
- If default HR is used, it must be labelled as an editable default, never as personal HR truth.
- Long runs over 60 minutes must not be rendered as one anonymous main block.
- Every non-rest specimen should show opener or warmup, main or work, and finish or cooldown anatomy unless a safer alternative is explicitly noted.
- Provider overlays in this playground are visual states only.
- Garmin states may reuse real product evidence/feedback labels.
- Strava and generic provider states must be marked future or specimen only.

## Overlay Vocabulary

Use these overlay keys in the playground data.

| Key | Label | Meaning |
| --- | --- | --- |
| `none` | No evidence | default static specimen, no provider input |
| `garmin_evidence_attached` | Garmin evidence attached | current product language; visual specimen may show file attached state |
| `garmin_feedback_ready` | Garmin feedback ready | current product language; visual specimen may show deterministic comparison available |
| `future_strava_attached` | Strava activity attached (future/specimen-only) | fake connected-provider state only; no real sync implied |
| `future_provider_comparison_ready` | Provider comparison ready (future/specimen-only) | fake future non-Garmin compare-ready state only |

## Result-State Vocabulary

Use these assumptions for static specimen switching only.

| Key | Meaning |
| --- | --- |
| `planned` | untouched specimen workout |
| `completed` | completed truth shown visually only |
| `partial` | partial completion specimen |
| `skipped` | skipped specimen |

## Segment Anatomy Contract

### Segment Sequence Shorthand

- `WU` = warmup
- `OP` = opener
- `SUP` = support aerobic block
- `MAIN` = sustained main block
- `WORK` = repeat or quality work block
- `REC` = recovery block
- `CHK` = posture or fueling checkpoint
- `FIN` = short settle-down finish
- `CD` = cooldown
- `END` = explicit endpoint distance block

### Target Truth Modes

Use only these specimen truth labels:

- `none`
- `structure_only`
- `editable_default_hr`

### Provider Overlay Expectations

Default allowed overlays by identity type:

- Rest: `none`, `garmin_evidence_attached`, `future_strava_attached`
- Standard run and quality sessions: all overlay keys allowed
- Endpoint markers and readiness markers: all overlay keys allowed, but comparison-ready overlays remain specimen-only unless explicitly labelled Garmin

### What Specimens Must Not Imply

All specimens must not imply:

- a real saved plan
- a real provider connection
- a real uploaded FIT file unless the overlay explicitly says Garmin evidence and is presented as specimen state
- real AI insight
- active-plan mutation
- manual workout CRUD
- provider sync

## Matrix

### Rest, Recovery, Easy, Steady

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rest_and_recovery` | `rest` | Rest and recovery | Rest | Rest and recovery day | show a true no-run day | none | no segments; optional quiet note only | rest, recover, no make-up work | `none` | none | `none`, `garmin_evidence_attached`, `future_strava_attached` | `planned`, `skipped` | rest cells and quiet detail state exist | a hidden run, provider compare, or active recovery workout |
| `recovery_jog` | `recovery` | Recovery jog | Recovery | Recovery jog | very light post-load aerobic reset | `OP -> MAIN -> CD` | `OP 5 min easy`; `MAIN 20-30 min easy`; `CD 5 min easy` | softer than normal easy; finish fresher | `structure_only` | optional product copy may mention editable default cap only as secondary | all | `planned`, `completed`, `partial`, `skipped` | recovery identity is distinct from easy | hard recovery, fake pace, personal HR truth |
| `easy_aerobic_run` | `easy` | Easy aerobic run | Easy | Easy aerobic run | conversational aerobic support | `WU -> MAIN -> CD` | `WU 10 min`; `MAIN 30-45 min easy`; `CD 5 min` | settle gradually; conversational rhythm | `editable_default_hr` | "Editable default HR cap, not personal HR truth." | all | all | standard easy-run anatomy and default-HR readback | target-time pace or personalized HR |
| `cutback_aerobic_run` | `easy` | Cutback aerobic run | Cutback | Cutback aerobic run | lighter support day in reduced-load week | `WU -> MAIN -> FIN -> CD` | `WU 8-10 min`; `MAIN 20-35 min reduced easy`; `FIN 3 min settle`; `CD 5 min` | clearly lighter than prior support day | `editable_default_hr` | same editable-default note | all | all | cutback easy differs from generic easy | hidden intensity or volume peak |
| `easy_run_with_strides` | `easy` | Easy run with strides | Strides | Easy run with strides | neuromuscular sharpening without hard quality | `WU -> SUP -> WORK -> REC -> CD` | `WU 10 min`; `SUP 10-20 min easy`; `WORK 4-8 x 20 sec`; `REC 60 sec easy jog`; `CD 5 min` | quick feet, relaxed body, fully reset | `structure_only` | none | all | all | stride anatomy and repeat readback | formal interval session or fake pace target |
| `steady_aerobic_run` | `steady` | Steady aerobic run | Steady | Steady aerobic run | moderate durable aerobic support | `WU -> MAIN -> FIN -> CD` | `WU 10 min`; `MAIN 25-45 min steady`; `FIN 5 min controlled settle`; `CD 5 min` | controlled, not pressing | `editable_default_hr` | "Default HR guidance is editable and advisory." | all | all | steady reads differently from easy | race-pace precision or threshold overclaim |
| `marathon_steady_specificity` | `steady` | Marathon steady | Marathon | Marathon steady specificity | marathon-specific durability, not tempo | `WU -> MAIN -> CHK -> FIN -> CD` | `WU 10 min`; `MAIN 35-60 min durable steady`; `CHK 3 min posture/fueling`; `FIN 5 min controlled`; `CD 5-8 min` | calm durable composure; never forced | `editable_default_hr` | same editable-default note | all | all | marathon-specific steady identity exists | full-race readiness, tempo hardness, target-time pace |

### Long, Endpoint, Ultra

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `long_aerobic_run` | `long` | Long aerobic run | Long | Long aerobic run | core endurance and durability | `OP -> MAIN -> CHK -> FIN -> CD` | `OP 10 min`; `MAIN 60-120 min easy`; `CHK 3-5 min fueling/posture`; `FIN 5 min easy settle`; `CD 5 min` | patient start; durable not rushed | `editable_default_hr` | same editable-default note | all | all | long run is not an anonymous one-block shell | race effort, hidden fast finish, fake pace |
| `long_run_with_steady_finish` | `long` | Long run with steady finish | Long finish | Long run with steady finish | long-run specificity with controlled closing segment | `OP -> MAIN -> CHK -> FIN -> CD` | `OP 10 min`; `MAIN 60-90 min easy`; `CHK 3 min fueling`; `FIN 15-25 min steady`; `CD 5 min` | hold form through the close, not race | `editable_default_hr` | easy and finish blocks may both use editable default guidance visually | all | all | distinct long-run finish structure | threshold finish, race simulation, exact pace |
| `base_endpoint_marker` | `long` | Base endpoint | Base end | Base endpoint marker | honest durability closeout for base block | `WU -> MAIN -> FIN -> CD` | `WU 10 min`; `MAIN 40-60 min durable steady`; `FIN 5 min settle`; `CD 5-10 min easy` | finish durable, not depleted | `editable_default_hr` | same editable-default note | all | `planned`, `completed`, `partial` | base endpoint is visible and distinct | full-marathon readiness or selected-distance race endpoint |
| `cutback_long_run` | `long` | Cutback long run | Cutback long | Cutback long run | lighter long-run week | `OP -> MAIN -> FIN -> CD` | `OP 10 min`; `MAIN 40-80 min reduced long`; `FIN 5 min easy settle`; `CD 5 min` | clearly easier than prior peak | `editable_default_hr` | same editable-default note | all | all | cutback long is visibly different from normal long | disguised peak week |
| `taper_long_run` | `long` | Taper long run | Taper long | Taper long run | reduced long-run touch during taper | `OP -> MAIN -> FIN -> CD` | `OP 8-10 min`; `MAIN 35-60 min light long`; `FIN 3 min settle`; `CD 5 min` | reduce stress, keep rhythm | `editable_default_hr` | same editable-default note | all | all | taper long specimen exists | pre-race overload or peak long run |
| `ultra_time_on_feet_durability` | `long` | Ultra durability | Ultra TOF | Ultra time-on-feet durability | prolonged endurance and fueling discipline | `OP -> MAIN -> CHK -> FIN -> CD` | `OP 10 min`; `MAIN 90-180 min time-on-feet`; `CHK 5 min fueling/equipment`; `FIN 10 min easy settle`; `CD 5 min walk-jog` | durable movement, not speed | `editable_default_hr` | same editable-default note | all | all | ultra specimen shows time-on-feet identity | exact elevation, pace precision, race readiness |

### Tempo

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `controlled_tempo_session` | `tempo` | Controlled tempo | Tempo | Controlled tempo session | sustained controlled quality | `WU -> WORK -> REC -> CD` | `WU 12-15 min`; `WORK 2-3 x 8-12 min`; `REC 2-3 min easy jog`; `CD 8-10 min` | strong and smooth, repeatable | `structure_only` | optional default HR mention only as secondary | all | all | tempo session anatomy and repeat logic | precise pace prescription or personal HR |
| `half_marathon_threshold_durability` | `tempo` | Half threshold | Threshold | Half marathon threshold durability | longer sustainable half-specific work | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 3 x 8-10 min threshold-like`; `REC 3 min easy jog`; `CD 10 min` | controlled strength, no racing | `structure_only` | optional default HR note only as clearly default | all | all | Half-specific threshold specimen exists | target-time threshold pace or aggressive race simulation |
| `half_readiness_marker` | `tempo` | Half marker | Half marker | Half readiness marker | specimen of older half-specific checkpoint style | `WU -> MAIN -> FIN -> CD` | `WU 10 min`; `MAIN 30-45 min controlled half-specific rhythm`; `FIN 5 min settle`; `CD 5-8 min` | checkpoint, not verdict | `structure_only` | none | all | a legacy/readiness-style identity can be rendered honestly | exact race readiness, selected-distance endpoint, pace truth |

### Intervals And Progression

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `distance_intervals` | `intervals` | Distance intervals | Intervals | Distance intervals | repeatable distance-based quality | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 4-6 x 400-1000m`; `REC 200m easy jog`; `CD 10 min` | same controlled rhythm each rep | `structure_only` | none | all | distance-first interval anatomy | fake race pace or official provider-step fidelity |
| `time_intervals` | `intervals` | Time intervals | Time reps | Time intervals | repeatable time-based quality | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 4-7 x 3 min`; `REC 2 min easy jog`; `CD 10 min` | hold form across reps | `structure_only` | none | all | time-first interval anatomy | benchmark-derived pace truth |
| `5k_sharpening_repeats` | `intervals` | 5K sharpening repeats | 5K reps | 5K sharpening repeats | short controlled 5K-specific sharpening | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 6-10 x 400m`; `REC 2 min easy jog`; `CD 10 min` | quick, controlled, not sprinting | `structure_only` | none | all | 5K-specific repeat specimen exists | guaranteed race-pace exactness |
| `10k_rhythm_intervals` | `intervals` | 10K rhythm intervals | 10K reps | 10K rhythm intervals | sustained controlled 10K rhythm | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 4-6 x 3 min`; `REC 2 min easy jog`; `CD 10 min` | durable rhythm, no pressing | `structure_only` | none | all | 10K-specific interval specimen exists | target-time 10K pace |
| `quality_session` | `intervals` | Quality session | Quality | Quality session | generic fallback quality specimen | `WU -> WORK -> REC -> CD` | `WU 12-15 min`; `WORK 4-6 repeats of bounded quality block`; `REC easy jog recovery`; `CD 8-10 min` | generic quality only when exact identity is unknown | `structure_only` | none | all | fallback quality can still be rich and executable | that generic quality is preferable to specific identities |
| `progression_run` | `progression` | Progression run | Progression | Progression run | gradual rise from easy to moderate | `WU -> MAIN -> FIN -> CD` | `WU 10 min`; `MAIN 20-30 min easy-to-steady progression`; `FIN 8-12 min stronger controlled close`; `CD 5 min` | lift gradually, never surge | `structure_only` | none | all | progression is distinct from tempo and steady | race effort or exact pace ladder |

### Race, Tune-Up, Endpoint

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `race_pace_session` | `race` | Race pace session | Race pace | Race pace session | race-rhythm specimen without fake precision | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 2-4 x bounded race-rhythm block`; `REC 2-3 min easy`; `CD 10 min` | rhythm and posture over numbers | `structure_only` | none | all | race-identity can render without fake pace | exact race pace target, official race readiness |
| `taper_tuneup_run` | `race` | Taper tune-up | Tune-up | Taper tuneup run | light sharpening during taper | `WU -> WORK -> REC -> CD` | `WU 10-12 min`; `WORK 4-6 x 20-60 sec light opener`; `REC easy jog`; `CD 8 min` | stay sharp, keep stress low | `structure_only` | none | all | tune-up identity exists and stays light | hard interval workout |
| `tenk_completion_or_checkpoint` | `race` | Final 10K day | Final 10K | 10K completion or checkpoint | selected-distance endpoint specimen | `WU -> END -> FIN -> CD` | `WU 10-12 min`; `END 10000m`; `FIN 3 min easy settle`; `CD 5-8 min` | complete the full distance honestly | `structure_only` | none | all | exact 10K endpoint specimen and endpoint anatomy | target-time promise, real race result, plan mutation |

### Hills

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `uphill_repeats` | `hills` | Uphill repeats | Uphill | Uphill repeats | repeatable uphill strength | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 6-10 x 45 sec uphill`; `REC 75-90 sec jog/walk down`; `CD 10 min` | relaxed upper body, controlled drive | `structure_only` | optional default HR note only for secondary readback | all | all | uphill repeat anatomy is explicit | exact grade or elevation prescription |
| `rolling_hills_session` | `hills` | Rolling hills | Rolling hills | Rolling hills session | hill rhythm on rolling terrain | `WU -> MAIN -> FIN -> CD` | `WU 12-15 min`; `MAIN 25-40 min rolling steady`; `FIN 5 min controlled`; `CD 8-10 min` | flow over terrain, not attack | `structure_only` | optional default HR note secondary only | all | all | rolling-hills identity differs from repeats | mapped route or exact climb profile |
| `controlled_downhill_durability` | `hills` | Controlled downhill | Downhill | Controlled downhill durability | careful downhill skill and durability | `WU -> WORK -> REC -> CD` | `WU 15 min`; `WORK 4-8 controlled descents`; `REC easy climb-back or flat reset`; `CD 10 min` | quick feet, soft landings | `structure_only` | none | all | downhill-specific specimen exists | exact gradient or aggressive downhill racing |
| `climbing_steady_run` | `hills` | Climbing steady | Climbing | Climbing steady run | sustained uphill or rolling climb rhythm | `WU -> MAIN -> FIN -> CD` | `WU 12 min`; `MAIN 20-35 min steady climbing`; `FIN 5 min settle`; `CD 8 min` | durable climbing posture | `structure_only` | optional default HR note secondary only | all | all | climbing steady is distinct from repeats | exact ascent target or mountain race block |

### Trail And Mountain

| Identity key | Family | Display label | Calendar label | Detail title | Primary purpose | Segment sequence | Segment prescription values | Secondary cues | Target truth mode | Editable default HR note | Allowed provider overlays | Result-state assumptions | What this specimen proves | What this specimen must not imply |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `technical_trail_easy` | `trail` | Technical trail easy | Trail | Technical trail easy | easy terrain-specific movement | `OP -> MAIN -> CHK -> FIN -> CD` | `OP 10 min`; `MAIN 30-50 min easy trail`; `CHK 3 min footing/posture`; `FIN 5 min easy settle`; `CD 5 min` | short steps, stay smooth | `structure_only` | none | all | trail easy identity exists | exact route, elevation, or mountain race effort |
| `hike_run_endurance` | `trail` | Hike-run endurance | Hike-run | Hike-run endurance | mixed hike/run durability | `OP -> WORK -> REC -> FIN -> CD` | `OP 10 min`; `WORK 4-8 x hike-run cycle`; `REC easy walk/jog reset`; `FIN 10 min smooth trail`; `CD 5 min` | power-hike when terrain says so | `structure_only` | none | all | hike-run identity is explicit | exact elevation gain or real mountain route |
| `mountain_long_run_time_on_feet` | `trail` | Mountain long run | Mountain long | Mountain long run time on feet | long mountain-specific time-on-feet durability | `OP -> MAIN -> CHK -> FIN -> CD` | `OP 10 min`; `MAIN 90-180 min mountain time on feet`; `CHK 5 min fueling/equipment`; `FIN 10 min easy descent/settle`; `CD 5 min walk-jog` | durable movement, terrain caution | `structure_only` | none | all | mountain long specimen shows long-form trail identity | exact elevation, route match, or race readiness |

## Specimen Coverage Checklist

Covered canonical identities:

- `rest_and_recovery`
- `recovery_jog`
- `easy_aerobic_run`
- `cutback_aerobic_run`
- `easy_run_with_strides`
- `steady_aerobic_run`
- `marathon_steady_specificity`
- `long_aerobic_run`
- `long_run_with_steady_finish`
- `base_endpoint_marker`
- `cutback_long_run`
- `taper_long_run`
- `ultra_time_on_feet_durability`
- `controlled_tempo_session`
- `half_marathon_threshold_durability`
- `half_readiness_marker`
- `distance_intervals`
- `time_intervals`
- `5k_sharpening_repeats`
- `10k_rhythm_intervals`
- `quality_session`
- `progression_run`
- `race_pace_session`
- `taper_tuneup_run`
- `tenk_completion_or_checkpoint`
- `uphill_repeats`
- `rolling_hills_session`
- `controlled_downhill_durability`
- `climbing_steady_run`
- `technical_trail_easy`
- `hike_run_endurance`
- `mountain_long_run_time_on_feet`

## Notes For Designer And Frontend

- Calendar labels should stay short and scan-friendly; detail title carries the richer identity.
- Every non-rest specimen should visibly show at least one numeric watch-executable target line.
- Garmin overlay states may reuse current product language:
  - `Evidence`
  - `Feedback`
- Strava and generic provider overlays must explicitly say future or specimen-only somewhere in the detail context.
- Do not derive any additional coaching text beyond this matrix.
