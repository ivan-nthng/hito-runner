# Running Plan Engine Pattern Library And Composition Grammar

## Task

Expand the selected-plan stimulus contract into a full running-plan pattern library and composition grammar.

## Stage

RUNNING COACH doctrine / full training pattern system before backend implementation.

## Artifact Created

- `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md`

## Root Coaching Problem

The current engine has progressed beyond endpoint failure and fake-metric problems, but it still
acts too often like a safe calendar filler:

- deterministic policies decide whether a week gets `tempo`, `intervals`, `threshold`, or `hills`
- workout templates define anatomy for those labels
- but the engine still lacks a reusable training grammar for how real running plans are composed

Because of that, Backend is still solving quality issues symptom-by-symptom:

- one Half Marathon case is too bland
- one long-run pattern is too repetitive
- one supported 10K case needs stronger variety

That is not enough.

The engine needs a coach-owned pattern system that defines:

- what kinds of weeks exist
- what kinds of workouts exist
- how those workouts change by family and runner level
- how strong or weak a week is allowed to be
- how compressed or unrealistic goals are handled honestly without becoming empty

This artifact is that source of truth.

## Pattern Taxonomy

| Pattern type | Purpose | Required signal | Too weak when | Too aggressive when |
| --- | --- | --- | --- | --- |
| `adaptation` | teach routine, durability, and execution habits | short support runs, frequent recovery, conservative long-run growth | it is just random easy days with no progression at all | it introduces repeated hard work before the runner is durable |
| `base` | expand aerobic support and repeatable volume | easy/recovery backbone, steady progression, stable long run | it never progresses or varies support rhythm | it starts acting like race prep too early |
| `build` | deepen goal-relevant stimulus | one meaningful development touch and stronger long-run role | it repeats the same moderate label with no change in role | it stacks multiple hard demands in the same week |
| `specific` | sharpen the family promise | explicit goal-family identity, visible long-run purpose, stronger but still controlled stimulus | it still looks like generic support plus one random workout | it turns into advanced race-peak logic or fake pace work |
| `cutback` | absorb work and protect continuity | reduced long run, lighter support volume, no hidden hard surprise | it looks identical to a normal build week | it keeps threshold/interval/hill stress unchanged |
| `taper` | reduce fatigue while keeping rhythm | lighter week, small sharpening cue if relevant, preserved endpoint honesty | it becomes dead empty filler | it sneaks in a second hard stimulus or race-pace fantasy |
| `endpoint_checkpoint` | express the family promise honestly | explicit endpoint row or honest base checkpoint | endpoint is hidden behind generic support rows | endpoint implies unsupported race readiness |
| `recovery_reset` | protect the runner after demanding load or compressed context | recovery/easy placement, lower support volume, calm long-run behavior | it is only a relabelled normal week | it still contains demanding work with recovery branding |
| `compressed_goal_response` | produce the best honest structure under unrealistic requests | modified goal promise, explicit compromise, protected recovery | it turns into empty “no” output | it pretends the original aggressive ask is still realistic |

## Week Archetypes

| Week archetype | Purpose | Allowed families | Allowed runner levels | Required workouts | Forbidden workouts | Development touch count | Recovery placement | Long-run role | Too weak/bland when | Too aggressive when |
| --- | --- | --- | --- | --- | --- | ---:| --- | --- | --- | --- |
| `easy_support_week` | stabilize routine and aerobic support | 10K, Half Marathon, Marathon Base | all eligible levels | easy, recovery, long run or cutback long run | extra hard touches | `0` or `1` light touch only | after long run, next run easy/recovery | support-led, not specific | it repeats forever with no progression | it sneaks in tempo plus demanding long run |
| `turnover_week` | improve rhythm and mechanics safely | 10K, Half Marathon, Marathon Base | beginner_new_runner, sometimes_runs, runs_a_lot, professional_competitive | strides, support stack, long run | threshold, overloaded intervals | `1` | next run after strides can still be easy, not another hard day | normal long run | strides are cosmetic and unsupported by enough easy volume | strides are stacked with another development touch |
| `tempo_support_week` | add sustained moderate work with strong support around it | 10K, Half Marathon, Marathon Base | sometimes_runs, runs_a_lot, professional_competitive | one tempo session, easy/recovery support, long run | second hard workout | `1` | easy/recovery after long run and after tempo | long run usually easy unless it becomes the week’s main signal | tempo is generic and identical every time | tempo plus long-run steady finish plus compressed recovery |
| `threshold_support_week` | add stronger sustained durability | Half Marathon, Marathon Base | runs_a_lot, professional_competitive | one threshold session, support stack, long run | intervals in same week, cutback disguise | `1` | next running slot after threshold must be easy/recovery | long run remains supportive, not second hard day | threshold is too short or indistinguishable from tempo | threshold is used for weak-support or conservative runners |
| `interval_week` | deliver controlled repeatability and pace-change stress | 10K, Half Marathon | sometimes_runs 10K, runs_a_lot, professional_competitive | one interval session, support stack, long run | threshold in same week, random hills in same week | `1` | next running slot after intervals must be easy/recovery | long run stays supportive unless interval week is replaced by long-run-specific week | intervals are too generic for family identity | intervals are given to conservative or low-support cases |
| `hill_strength_week` | build strength, mechanics, and controlled force | 10K, Half Marathon, Marathon Base | runs_a_lot, professional_competitive, selective conservative high-support only if mild | one hill session, easy/recovery support, long run | threshold or intervals in same week | `1` | next running slot after hills must be easy/recovery | long run remains steady and controlled | hills are too short to matter or too vague | hills are added on top of another demanding touch |
| `long_run_durability_week` | make the long run the clear training signal | Half Marathon, Marathon Base | sometimes_runs, runs_a_lot, professional_competitive | long run with specific checkpoint/finish role, support stack | midweek threshold/interval if long run already carries the signal | `0` or `1` with long run counting as the touch | next run after long run must be easy/recovery | long run is the week’s main purpose | long run is anonymous easy time with no role | long run gets too race-specific or too hard for the level |
| `long_run_steady_finish_week` | teach durable late-run control | Half Marathon, Marathon Base future higher-support only | runs_a_lot, professional_competitive, selective sometimes_runs only when very controlled | long run with explicit steady finish, support stack | threshold/intervals in same week | `1` with long run as the touch | immediate next running slot easy/recovery | long run is the specific stimulus | steady finish is too tiny to matter | steady finish becomes race effort or is used too early |
| `cutback_week` | unload fatigue while preserving rhythm | 10K, Half Marathon, Marathon Base | all eligible levels | cutback long run, easy/recovery support, optional strides or light tempo only if doctrine allows | threshold, hard intervals, heavy hills | `0` or `1` light only | recovery remains intact | reduced long run is mandatory | it looks like a normal build week | it keeps full long-run and quality stress |
| `taper_sharpening_week` | reduce fatigue while keeping the runner awake | 10K, Half Marathon, Marathon Base | all eligible levels | strides or very small tune-up only if family allows, easy/recovery support | threshold, hard intervals, overloaded hills | `0` or `1` light only | easy/recovery dominates | long run shrinks or disappears into endpoint prep | it becomes dead filler | it behaves like another build week |
| `endpoint_week` | make the family promise explicit | 10K, Half Marathon, Marathon Base | all eligible levels | exact endpoint/checkpoint row, easy/recovery support | hidden second hard workout | `0` or `1` only if tiny and clearly taper-safe | preserve recovery before endpoint | endpoint or base checkpoint is the whole point | endpoint is buried under generic support | endpoint week carries hard training density |

## Workout Pattern Library

| Pattern | Purpose | Segment anatomy | Watch-executable structure | Family fit | Runner-level fit | Progression behavior | Minimum useful version | Stronger version | Recovery requirement | Too aggressive when | Too weak/bland when | What not to fake |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `recovery` | restore freshness after long run or quality | opener, easy main, cooldown | exact time or distance, optional editable default HR cap | all families | all eligible | grows slightly with level but stays softer than easy | 20 min easy main | 30 min easy main | none beyond normal schedule | it turns into steady running | it is indistinguishable from easy every time | do not call default HR personal truth |
| `easy_aerobic` | aerobic support backbone | warmup, easy main, cooldown | exact time or distance, optional editable default HR cap | all families | all eligible | grows by duration first | 30 min main | 45+ min main | none beyond normal schedule | it becomes moderate without being declared | every easy day is structurally identical forever | no fake pace |
| `steady` | moderate aerobic support without full quality load | opener, steady main, cooldown | exact time or distance, optional editable default HR guidance | Half Marathon, Marathon Base, selective 10K support | sometimes_runs, runs_a_lot, professional_competitive | used later or under stronger support | 20 min steady main | 35-45 min steady main | next harder touch still needs space | it behaves like threshold but is labelled steady | it is just easy with a new name | no race-pace implication |
| `strides` | turnover, neuromuscular freshness, mechanics | warmup, easy support, short repeats, explicit recovery, cooldown | repeat structure with exact reps and recoveries | all families | all eligible | more reps or more easy support by level | 4 x 20 sec | 8 x 20 sec with longer support block | can be followed by normal easy day | it is paired with another real hard touch | it is token 2 strides with no purpose | no fake speed target |
| `tempo` | sustained moderate stress | warmup, repeated tempo blocks, explicit recoveries, cooldown | explicit repeat time structure | 10K, Half Marathon, Marathon Base | sometimes_runs, runs_a_lot, professional_competitive | progresses by number/length of blocks, not by random intensity jumps | 2 x 8 min | 3 x 12 min | next running slot may stay normal only if long run spacing is safe | it becomes threshold volume for weak-support runner | every tempo session is the same 2 x 8-10 forever | no threshold truth claim unless explicit and honest |
| `threshold` | stronger durability and clearance | warmup, threshold-like blocks, explicit recoveries, cooldown | explicit repeat time or distance structure | Half Marathon, Marathon Base | runs_a_lot, professional_competitive | progresses by longer or more durable blocks, not by stacking weeks | 3 x 8 min | cruise intervals like 4 x 2km | next running slot must be easy/recovery | it is given to weak-support or conservative case | it is too short to differ from tempo | do not present default HR as measured threshold |
| `short_intervals` | controlled repeatability, economy, rhythm | warmup, short reps, explicit recoveries, cooldown | exact repeat distance/time with exact recovery | 10K, selective Half | sometimes_runs 10K, runs_a_lot, professional_competitive | can move from 400m to 1km style reps | 6 x 400m | 6 x 1km or 5 x 1200m | next running slot easy/recovery | it appears in Marathon Base or conservative Half | it is just one generic interval day with no family meaning | no pace fantasy |
| `long_intervals` | durable repeatability and family-specific specific work | warmup, longer reps, explicit recoveries, cooldown | exact distance reps plus exact jog recovery | 10K, Half Marathon high-support | runs_a_lot, professional_competitive | progresses by rep length or count, not by chaos | 4 x 1km | 5 x 1500m or 4 x 1600m | next running slot easy/recovery | it is used too early or in weak-support plans | it is still labelled generic intervals with no distinct role | no fake race pace |
| `hills` | strength, climbing economy, force under control | warmup, uphill reps, explicit downhill/jog recoveries, cooldown | exact repeat time plus exact recovery time | 10K, Half Marathon, Marathon Base | runs_a_lot, professional_competitive | can progress from 45 sec to 90 sec repeats | 6 x 45 sec uphill | 8-10 x 90 sec uphill | next running slot easy/recovery | it is combined with another demanding touch | it is too short or too vague to matter | no exact elevation claims |
| `progression` | build controlled change of effort inside one run | opener, easier first block, stronger second block, cooldown | exact staged durations or distances | 10K, Half Marathon, Marathon Base | sometimes_runs strong-support, runs_a_lot, professional_competitive | becomes more structured later in cycle | 20 min easy + 10 min moderate | longer two- or three-step progression | use as the week’s only development touch | it becomes race simulation | it is just easy plus a token faster finish | no fake race pace |
| `long_run` | time-on-feet and endurance | opener, main, checkpoint, finish | exact time or distance with explicit sub-roles | all families | all eligible | grows by family and level | 60 min for 10K / 70 min for Half / 75 min for Marathon Base | 85 / 115 / 120 min family peaks in current doctrine | next running slot easy/recovery | it is too long too early | it is anonymous every week | no overclaim about readiness |
| `long_run_with_steady_finish` | late-run durability and controlled support | opener, long easy main, checkpoint, steady finish, cooldown | exact time structure with explicit finish block | Half Marathon, Marathon future stronger family, selective Marathon Base high-support later | runs_a_lot, professional_competitive, selective sometimes_runs only when mild | appears late and counts as the week’s touch | 15-20 min steady finish | 30 min steady finish | next running slot easy/recovery | it coexists with threshold or intervals in same week | finish block is too tiny to change the session | no race-pace language |
| `cutback_long_run` | unload while preserving long-run rhythm | opener, reduced main, finish | exact reduced time/distance | all families | all eligible | reduction remains visible every cutback | clearly shorter than last peak | slightly more detailed finish cue only | next running slot easy/recovery | it is only 5 min shorter than normal peak | it looks identical to normal long run | no fake “cutback” label with same load |
| `taper_tuneup` | keep the legs awake without rebuilding fatigue | warmup, brief controlled work or strides, cooldown | exact short structure | 10K, Half Marathon, Marathon Base only when family allows | runs_a_lot, professional_competitive, selective sometimes_runs | appears very late and stays small | strides-only sharpening | short controlled tune-up block | easy/recovery surrounding it | it becomes real threshold or interval load | taper week is dead empty | no pace overclaim |
| `endpoint_checkpoint_day` | express final promise honestly | warmup, exact endpoint main block, settle, cooldown | explicit exact distance or explicit honest base endpoint duration | 10K, Half Marathon, Marathon Base | all eligible | endpoint differs by family promise, not by fake intensity | 10K exact / 21.1K exact / 40-60 min base endpoint | future richer endpoint only after family expansion | preceding days must be easy/recovery | endpoint week hides a second hard day | endpoint is only metadata | no fake readiness claim |

## Family Composition Rules

### 10K

What makes a 10K plan feel real:

- visible rhythm and turnover
- at least one true repeatability stimulus for supported runners
- long run present but not pretending to be the whole plan
- taper sharpening that stays light

Composition rules:

| Runner level / load | Required patterns across the block | Optional richer patterns | Forbidden patterns |
| --- | --- | --- | --- |
| `beginner_new_runner` any load | easy, recovery, long run, cutback long run, strides, endpoint | none | tempo, threshold, hills, intervals-heavy block |
| `sometimes_runs` standard | easy, recovery, long run, cutback, strides, tempo, short intervals, endpoint | progression | threshold |
| `runs_a_lot` standard | easy, recovery, long run, cutback, strides, tempo, intervals, hills, endpoint | long intervals later | threshold in current v1 |
| `professional_competitive` standard | same as `runs_a_lot` plus one stronger interval expression | long intervals or second interval week | threshold in current v1 |
| supported conservative | strides, tempo, support stack, endpoint | none | intervals, hills, threshold |

When intervals are required:

- 10K supported standard-load `sometimes_runs`, `runs_a_lot`, and `professional_competitive`
  cannot pass as real 10K blocks without at least one interval-style week

When hills are required:

- 10K `runs_a_lot` and `professional_competitive` standard-load previews should contain `hills`
  because that is the easiest safe way to widen the plan’s identity without adding a second hard day

When strides and tempo are enough:

- beginner plans
- conservative load supported plans
- very early adaptation-heavy starts

Why threshold is excluded in v1:

- 10K already gets enough richness from `tempo`, `intervals`, and `hills`
- adding threshold now would widen intensity vocabulary before the engine has enough composition
  discipline for family clarity
- current v1 should sharpen 10K through repeatability and turnover, not through threshold inflation

### Half Marathon

What makes a Half Marathon plan feel real:

- sustained work, not only generic moderate touches
- visible durability signal
- long-run role that matters beyond duration
- threshold or threshold-adjacent development when support allows it

Composition rules:

| Runner level / load | Required patterns across the block | Optional richer patterns | Forbidden patterns |
| --- | --- | --- | --- |
| `sometimes_runs` standard | easy, recovery, long run, cutback, strides, tempo, one half-specific durability signal, endpoint | one carefully bounded generic interval week if half-specific durability exists elsewhere | threshold by default, aggressive hill/interval mix |
| `runs_a_lot` standard | easy, recovery, long run, cutback, strides, tempo, threshold, endpoint | long intervals, long-run steady finish | support-only generic tempo repetition |
| `professional_competitive` standard | easy, recovery, long run, cutback, strides, tempo, threshold, sharper half-specific second signal, endpoint | long intervals, stronger steady-finish long run | two hard touches in one week |
| supported conservative | easy, recovery, long run, cutback, strides, tempo, endpoint | none | threshold, intervals, hills |

How `sometimes_runs` becomes rich without default aggressive threshold:

- use richer tempo identities
- use long-run durability weeks with meaningful checkpoint/finish roles
- allow one long-interval or controlled intervals week only if the rest of the block already reads as
  Half, not 10K

When threshold is required:

- `runs_a_lot` standard
- `professional_competitive` standard

When long intervals are better than generic intervals:

- when the family needs sustained repeatability and not just turnover
- when the runner is strong enough that generic 400m-600m style intervals would feel too 10K-like
- when the block needs a sharper specific week without defaulting to threshold every time

How long-run steady finish should work:

- late build or specific only
- counts as the week’s development touch
- should stay clearly below race-claim language
- should not coexist with threshold or intervals in the same week

How to avoid generic tempo repetition:

- do not use the same tempo pattern three times with only numeric scaling
- rotate between classic tempo-support weeks, durability tempo weeks, and long-run-durability weeks
- a Half block fails if it reads like support days plus three copies of generic tempo

### Marathon Base

What makes base credible:

- durable aerobic support
- visible time-on-feet progression
- meaningful cutbacks
- some stronger support for higher-support runners, but never race simulation

Composition rules:

| Runner level / load | Required patterns across the block | Optional richer patterns | Forbidden patterns |
| --- | --- | --- | --- |
| `sometimes_runs` standard | easy, recovery, long run, cutback, strides, tempo, honest base endpoint | later additional steady or tempo-support week | threshold, intervals |
| `runs_a_lot` standard | easy, recovery, long run, cutback, strides, tempo, one stronger durability signal, endpoint | hills or threshold depending on phase | intervals, race-pace work |
| `professional_competitive` standard | easy, recovery, long run, cutback, strides, tempo, threshold, hills, endpoint | richer long-run durability or base-steady finish detail | intervals, full marathon race plan behavior |
| supported conservative | easy, recovery, long run, cutback, strides, selective tempo, endpoint | none | threshold, intervals |

Why intervals are excluded:

- they push Marathon Base toward a race-prep identity the current product does not promise
- the safer way to enrich Marathon Base is through threshold, hills, steady durability, and long-run role

When hills/threshold/steady durability are allowed:

- `threshold`: higher-support standard-load only
- `hills`: higher-support standard-load only
- `steady durability`: useful for standard-load higher-support and selective mid-support late base

How to stay base-only:

- no exact marathon race endpoint
- no race-pace wording
- no target-time implication
- no compressed final-sharpening logic that pretends this is a full race block

## Runner-Level Composition Rules

| Runner level | Development touch frequency | Allowed intensity ceiling | Required variety | Progression ceiling | Must be blocked or reframed | Conservative/heavy-load change |
| --- | --- | --- | --- | --- | --- | --- |
| `beginner_new_runner` | `0-1` light touch in selected weeks only | strides first, no true hard quality in these families | support rhythm, strides, visible long-run growth where allowed | short safe ladders | Half Marathon and Marathon Base selected-plan generation blocked in current v1 | even simpler long runs, slower ramp, no pressure to “look rich” via intensity |
| `sometimes_runs` | `1` touch max, not every week | tempo first, then selective intervals or long-run-specific touch depending on family | more than labels: at least two development pattern types across the block | no advanced threshold default, no two-hard logic | unrealistic advanced asks must be reframed into strongest honest sub-maximal structure | remove sharper patterns, keep tempo/support, extend runway |
| `runs_a_lot` | `1` touch max weekly in current v1 | threshold, intervals, hills depending on family | family-specific variety must be visible | no two-hard weeks in current deterministic engine | advanced or compressed goals still need honest caps | remove threshold/interval pairings, soften long-run finish work |
| `professional_competitive` | `1` touch max weekly in current v1 normal path | strongest allowed within family, but still not a pseudo-elite race block | must differ visibly from `runs_a_lot` in stimulus quality or progression shape | current engine still conservative; advanced track not yet open | compressed or impossible goals still need honest compromise, not fake peak plans | hold onto rich support structure while removing highest-end sharpness |

## Compressed / Impossible-Goal Handling

| Scenario | Produce / modify / block | What the plan optimizes for | Honest copy should say | Engine must not pretend |
| --- | --- | --- | --- | --- |
| marathon in 2 weeks | produce modified plan, not normal Marathon Base create promise | damage limitation, freshness, routine, honest completion support only if appropriate | `Hito cannot build real marathon readiness in this time. This plan protects recovery and gives you the strongest honest short runway available.` | that the runner is now marathon-ready |
| half marathon with low base | produce modified Half if runner is still eligible, otherwise route away or block if current family contract cannot stay honest | safe completion support, durability, conservative long-run handling | `This plan prioritizes safe completion structure over aggressive half-specific intensity.` | threshold-rich half prep for weak support |
| advanced distance for beginner | block current family when family contract is not honest, or reframe to shorter/safer family | habit, durability, safe support structure | `This engine cannot honestly turn a true beginner into a ready Half/Marathon plan in this path yet.` | advanced-distance readiness |
| low availability with high goal | produce modified plan | strongest repeatable structure under low frequency, extended runway if family supports it | `Because your available running days are limited, Hito uses a longer, more conservative structure.` | dense hard-work substitution |
| high body load plus aggressive timeline | produce modified plan when possible, block only if family contract becomes dishonest | conservative load management and continuity | `Hito is reducing ramp speed and protecting recovery because the current timeline is aggressive for the load context.` | that ambition alone overrules support evidence |

Blocking rule:

- block only when the family promise itself becomes dishonest
- otherwise produce the best honest modified structure possible

## Backend-Ready Composition Contract

### Required week-archetype sequence by family

#### 10K

- must start with `easy_support_week`
- must include at least one `turnover_week`
- supported standard-load must include at least one `tempo_support_week`
- supported standard-load must include at least one `interval_week`
- higher-support standard-load must include at least one `hill_strength_week`
- must include cutback weeks
- must include `taper_sharpening_week`
- must end with `endpoint_week`

#### Half Marathon

- must start with `easy_support_week`
- must include at least one `turnover_week`
- must include at least one `tempo_support_week`
- `sometimes_runs` standard must include at least one `long_run_durability_week` or Half-specific
  richer tempo week
- `runs_a_lot` and `professional_competitive` standard must include at least one
  `threshold_support_week`
- higher-support may include one `interval_week` or `long_intervals` specific week
- must include cutback weeks
- must include `taper_sharpening_week`
- must end with `endpoint_week`

#### Marathon Base

- must start with `easy_support_week`
- must include `turnover_week`
- standard-load supported blocks must include `tempo_support_week`
- higher-support standard may include `threshold_support_week` or `hill_strength_week`
- must include `long_run_durability_week`
- must include cutback weeks
- may include a light taper-like endpoint lead-in, but not a race taper
- must end with honest `endpoint_week`

### Minimum pattern counts by family and runner level

| Family | Runner level | Minimum block-wide pattern counts |
| --- | --- | --- |
| `10K` | `beginner_new_runner` | `strides >= 1`, `long_run >= 1`, `cutback_long_run >= 1`, exact endpoint |
| `10K` | `sometimes_runs` | `strides >= 1`, `tempo >= 1`, `short_intervals or long_intervals >= 1`, `cutback_long_run >= 1`, exact endpoint |
| `10K` | `runs_a_lot` | above plus `hills >= 1` |
| `10K` | `professional_competitive` | above plus stronger second interval-like expression or clearly stronger interval progression |
| `Half Marathon` | `sometimes_runs` | `strides >= 1`, `tempo >= 1`, `half-specific durability signal >= 1`, `cutback_long_run >= 1`, exact endpoint |
| `Half Marathon` | `runs_a_lot` | above plus `threshold >= 1` |
| `Half Marathon` | `professional_competitive` | above plus stronger second half-specific signal |
| `Marathon Base` | `sometimes_runs` | `strides >= 1`, `tempo >= 1`, `long_run >= 1`, `cutback_long_run >= 1`, honest base endpoint |
| `Marathon Base` | `runs_a_lot` | above plus one stronger durability signal such as `threshold` or `hills` |
| `Marathon Base` | `professional_competitive` | above plus both `threshold` and `hills` or equally strong differentiated support |

### Forbidden pattern combinations

- `threshold` plus `long_run_with_steady_finish` in the same week
- `intervals` plus `hills` in the same week
- `intervals` in any `Marathon Base` week
- `threshold` for `10K` in current v1
- `threshold` for `Half Marathon sometimes_runs` in current v1 default path
- `threshold` in conservative load Half or Marathon Base
- any second development touch in the same week
- endpoint week plus serious development touch

### Development stimulus gates

- fail if supported `10K` standard-load has no interval-style week
- fail if supported higher-support `10K` has no hills
- fail if `Half Marathon sometimes_runs` has no clear half-specific durability signal
- fail if higher-support `Half Marathon` has no threshold
- fail if standard-load `Marathon Base` supported preview has no tempo
- fail if higher-support `Marathon Base` is indistinguishable from mid-support block

### Long-run progression gates

- each family must show visible long-run growth across the block
- cutback long run must be visibly reduced from prior peak
- long runs beyond ninety minutes should rotate meaningful checkpoint and finish roles
- long-run-specific finish work counts as the week’s development touch
- Marathon Base long runs must never imply full-race simulation

### Cutback / taper gates

- cutback week required at least every third or fourth load cycle
- cutback week cannot contain threshold/interval/hill intensity
- taper-sharpening week must stay light
- endpoint week must not carry hidden quality load

### Endpoint gates

- `10K`: exact `10000m`
- `Half Marathon`: exact `21100m`
- `Marathon Base`: honest base endpoint only, no `42195m`, no race-readiness wording

### Scenario JSON expectations

Scenario JSON should expose enough metadata to prove:

- week archetype sequence or equivalent derived proof
- development touch counts by week
- long-run role variety
- family-specific durability signals
- absence of forbidden combinations

### Validator expectations

Validator should fail when:

- a family collapses into generic support-only structure
- a supported preview lacks its required family signal
- a week contains more than one development touch
- post-long-run or post-quality recovery placement is violated
- Marathon Base implies marathon race readiness
- fake pace or fake personal HR appears

## Relationship To Current Stimulus Contract

Current artifact:

- [Running Plan Engine Selected-Plan Stimulus Contract](2026-06-09-running-plan-engine-selected-plan-stimulus-contract.md)

What remains valid from the current stimulus contract:

- one development touch max per week
- recovery-after-long-run and recovery-after-hard-day rules
- 10K / Half Marathon / Marathon Base family identity boundaries
- Half-specific concern about bland `sometimes_runs` composition
- no-fake-metric rules
- create-path blocker status

What this artifact supersedes:

- narrow week-by-week stimulus thinking as the main source of truth
- treating workout labels alone as enough
- solving richness by patching one runner-level family case at a time

New canonical use:

- use the stimulus contract as the narrower selected-plan quality gate
- use this pattern-library artifact as the broader backend composition source of truth

## Next Recommended Role

BACKEND

## Blockers

Backend should not continue with isolated family symptom patches until it encodes this pattern
grammar into one reusable composition layer.
