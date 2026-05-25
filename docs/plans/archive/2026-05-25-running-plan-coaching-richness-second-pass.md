Status

Complete / Closed

Owner

Architect / Backend / QA

Last Updated

2026-05-25

Closeout Note

This plan is archived after QA-green completion of Slices 1-5.

Completed scope:

- Slice 1: taper/phase consistency
- Slice 2: long-distance honesty assumptions
- Slice 3: mountain/trail doctrine v2
- Slice 4: goal-family workout identity sharpening
- Slice 5: fixture expansion and closeout matrix

QA verdict: passed with no blocking findings.

No immediate follow-up coaching slice is recommended. Future coaching work should start only from a new concrete Running Coach finding, product request, or QA regression rather than continuing this track by inertia.

Context

The first major plan-authoring hardening pass is QA-green.

Implemented truth that this plan must preserve:

- structured first-plan generation uses the hardened backend doctrine
- text and voice authoring feed the same bounded structured authoring contract
- active-plan refresh proposal/apply uses explicit review/confirm safety
- proposal generation creates an exact non-mutating future refresh draft
- apply validates stale/off-day/draft-checksum truth before persistence
- fixed rest-day invariants remain hard constraints
- pace targets require watch/app access, pace or mixed guidance, and usable recent 5K truth
- HR targets stay suppressed without runner-level HR-zone truth
- protected past/logged/evidence-backed refresh history is not silently rewritten

Running Coach audit verdict:

Hito is materially better than before. Basic 5K/10K, balanced half marathon, and some marathon plans are now coach-credible enough.

Complex goals still need a second coaching pass before Hito should feel consistently strong for ambitious, long-distance, ultra, mountain, and low-frequency runners.

Problem Definition

The current generator is credible but still has four coaching-quality gaps:

- taper logic can disagree with phase logic, allowing a week labeled `Taper` to still contain peak long-run durability stress
- long-distance plans with low weekly frequency, weak benchmark truth, or low current load need stronger honesty assumptions
- mountain/trail specificity includes hills but not enough downhill/eccentric durability, controlled descents, hike/run allowance, technical terrain caution, time-on-feet framing, or progressive hill exposure
- personalization still relies too coarsely on frequency, age, benchmark, watch/app, terrain, and goal family; ambition, current load, target pressure, and fitness level need more influence without inventing precision

Canonical Coaching Rule

Backend owns coaching truth.

Plan generation and refresh must encode coaching doctrine as deterministic backend rules and bounded authoring constraints, not as frontend copy or route-local interpretation.

The second pass should improve the real generator and refresh draft output, not only improve review wording.

Checklist

- [x] Slice 1: fix taper/phase consistency
- [x] Slice 2: add long-distance honesty assumptions
- [x] Slice 3: add mountain/trail doctrine v2
- [x] Slice 4: sharpen goal-family workout identity
- [x] Slice 5: expand deterministic QA fixture matrix
- [x] Preserve safe active-plan refresh/apply draft architecture
- [x] Preserve fixed rest-day invariants
- [x] Preserve pace gating
- [x] Preserve HR suppression without HR-zone truth
- [x] Preserve protected-history refresh safety
- [x] Keep all coaching rules backend-owned

Slice 5 closeout evidence:

- deterministic fixture coverage now checks supported and limited-support 5K behavior, 10K rhythm work, half-marathon threshold durability, marathon steady specificity, ultra durability/time-on-feet, and mountain terrain/downhill/hike-run/time-on-feet doctrine
- the matrix now explicitly checks weak-support marathon, ultra, and mountain honesty assumptions; taper peak prevention; cutback reduction; fixed rest days; pace target gating; and HR suppression without zone truth
- refresh-draft fixtures now check improved shallow-marathon long-run structure, goal-family identity parity, fixed/logged/evidence-backed boundary metadata, mutable guard behavior, and mountain/trail doctrine in refreshed future schedules
- no frontend routes, live Supabase data, or product mutation paths changed in this slice

Slice 1 - Taper / Phase Consistency

Goal:

No taper-labeled week should contain peak durability stress.

Backend work:

- align long-run reduction rules with `phaseForWeek`
- prevent any `Taper` phase week from containing the plan's peak long run
- ensure peak long run occurs before taper begins
- ensure taper weeks reduce long-run stress meaningfully for half marathon, marathon, ultra, and mountain goals
- make taper reductions explicit in generated workout identity or notes only when useful
- ensure active-plan refresh drafts obey the same taper rule

Rules to encode:

- peak long run must belong to Build or Specific phase, not Taper
- first taper week may retain some specificity but must not be the highest durability load
- final taper week should be visibly reduced and confidence-oriented
- cutback and taper are different concepts and should not be conflated

QA fixtures:

- marathon target-time plan with enough horizon
- half marathon balanced plan
- ultra/mountain plan
- active-plan refresh of an older plan whose final week currently contains peak long-run load

Exit criteria:

- deterministic fixtures prove no `Taper` phase week contains the maximum long-run distance or time-on-feet load
- refresh draft output also passes the same invariant

Slice 2 - Long-Distance Honesty Assumptions

Goal:

Long-distance plans should be honest when the runner context is durability-limited.

Backend work:

- identify low-frequency marathon, ultra, and mountain contexts
- identify weak benchmark or weak current-load contexts
- add conservative, finish-oriented, or durability-limited assumptions into review output
- keep target-time honesty intact and stronger for aggressive goals
- avoid pretending a 2-day/week marathon or mountain plan is equivalent to a normal higher-frequency build

Rules to encode:

- 2 days/week for marathon, ultra, or mountain is finish-oriented by default
- 3 days/week for marathon, ultra, or mountain is conservative unless current load and benchmark truth strongly support more
- weak benchmark truth should suppress precise target-time confidence
- low current load should reduce intensity density before increasing ambition
- ambition may adjust progression, but cannot erase durability limits

Do not encode:

- weight or height as direct intensity/load heuristics
- medical risk prediction
- injury diagnosis
- fake physiology precision

QA fixtures:

- marathon, 2 days/week, no benchmark
- marathon, 3 days/week, weak benchmark
- ultra, 3 days/week, unknown current load
- mountain running, low frequency, target-time style

Exit criteria:

- review assumptions clearly label conservative/finish-oriented/durability-limited plans
- generated plans avoid overconfident target-time or aggressive intensity language
- metric gating behavior is unchanged

Slice 3 - Mountain / Trail Doctrine V2

Goal:

Mountain and trail plans should feel mountain-specific without requiring exact elevation or route matching.

Backend work:

- add controlled descent and downhill durability session identities
- add progressive hill exposure across Base, Build, Specific, and Taper phases
- add hike/run allowance for ultra and mountain contexts
- add time-on-feet cues where distance precision is less useful
- add technical terrain caution copy where relevant
- keep exact elevation targets out of v1 unless real route/elevation truth exists

Rules to encode:

- mountain plans should not be only flat running plus generic hill reps
- downhill/eccentric durability should appear progressively and conservatively
- controlled descents should be described as controlled skill/durability work, not reckless downhill racing
- hike/run can be valid training for mountain/ultra contexts
- time-on-feet can be a better long-run cue than exact distance for mountain/ultra plans
- taper should reduce downhill/eccentric stress

QA fixtures:

- mountain running, balanced, 4 days/week
- mountain running, ambitious, 5 days/week, watch/app pace preference
- ultra marathon with mountain terrain
- old mountain/trail active plan refresh

Exit criteria:

- generated workout identities include mountain-specific work beyond generic hills
- no exact elevation target is required
- safety language remains training-oriented and non-medical

Slice 4 - Goal-Family Sharpening

Goal:

Ambitious and race-specific plans should express clearer goal-family coaching identity.

Backend work:

- sharpen 5K work with safe short reps, strides, neuromuscular cues, and race-rhythm progression
- sharpen 10K work with rhythm, controlled intervals, tempo/threshold bridge sessions, and sustained effort
- sharpen half marathon work with threshold/steady durability and late-run control
- sharpen marathon work with controlled steady work, long-run specificity, and fueling/time-on-feet cues where appropriate
- sharpen ultra/mountain work with durability, time-on-feet, hike/run, climbing/descending exposure, and conservative intensity density

Rules to encode:

- not every quality workout should collapse to `Quality`
- compact calendar family can stay simple, but workout title/source identity should be specific
- ambitious does not mean random harder workouts; it means appropriate specificity when runner truth supports it
- repetition is acceptable when it serves phase progression, not when it is lazy generation

QA fixtures:

- ambitious 5K, 4 days/week, usable 5K benchmark
- ambitious 10K, 4 days/week, usable benchmark
- balanced half marathon, 4 days/week
- marathon with target time and weak benchmark
- ultra/mountain with no pace support

Exit criteria:

- exact workout identity improves without making every workout verbose
- broad calendar families remain stable
- pace/HR gating remains unchanged

Slice 5 - Fixture Expansion

Goal:

Make the coaching improvements testable and hard to regress.

Backend QA fixture matrix:

| Fixture | Must Prove |
| --- | --- |
| Taper-phase marathon | no peak long run inside `Taper` |
| Taper-phase ultra/mountain | no peak time-on-feet or downhill durability stress inside `Taper` |
| Low-frequency marathon | conservative or finish-oriented honesty appears |
| Low-frequency mountain | durability-limited honesty appears |
| Mountain balanced plan | controlled descent, hill exposure, and terrain caution appear |
| Mountain ambitious plan | specificity increases without unsafe downhill overload |
| Ambitious 5K | short reps or neuromuscular cues appear where safe |
| 10K race-specific plan | rhythm/threshold-like identity appears |
| Half marathon plan | steady durability and threshold support appear |
| Refresh old mountain/trail plan | future draft improves while protected history stays fixed |
| Fixed rest days | no generated workout lands on blocked weekdays |
| Pace gating | pace appears only with watch/app + pace/mixed + usable recent 5K |
| HR gating | HR targets remain absent without HR-zone truth |
| Protected refresh history | logged/evidence-backed workouts are preserved |

QA expectations:

- fixture validation can be deterministic/source-level where possible
- live OpenAI calls are not required unless a slice explicitly changes an OpenAI-facing contract
- no Safari/UI regression pass is required unless frontend review fields change

Architecture Guardrails

- backend owns coaching truth
- frontend renders backend-shaped review and plan data only
- no coaching rules move into route components
- no second planner is introduced
- no existing plan is mutated without explicit review/confirm
- no past/logged/evidence-backed workout is silently rewritten
- fixed rest-day invariants remain hard constraints
- runner-level defaults can inform future generation, but do not silently rewrite active-plan truth
- deterministic plan structure comes before AI explanation
- review language must state uncertainty instead of pretending confidence

Metric Guardrails

Pace targets:

- allowed only with watch/app access
- allowed only when guidance preference is pace or mixed
- allowed only with usable recent 5K truth
- should remain broad ranges, not false precision

HR targets:

- suppressed unless runner-level HR-zone truth exists
- no numeric HR target should be inferred from age alone
- no HR target should be inferred from broad fitness level alone

Effort language:

- remains the fallback when pace/HR truth is not strong enough
- should still be specific enough to guide the runner

Mountain / Trail Boundaries

This pass may add:

- controlled descents
- downhill durability
- hike/run allowance
- technical terrain caution
- time-on-feet cues
- progressive hill exposure

This pass must not require:

- exact elevation targets
- route matching
- GPS profile prediction
- medical/rehab claims
- injury-risk scoring

Backend Responsibilities

- encode taper/phase consistency in the deterministic generator
- encode long-distance honesty assumptions
- encode mountain/trail doctrine v2
- sharpen workout identity by goal family
- keep refresh draft generation on the same doctrine
- add deterministic fixture coverage
- preserve import/export compatibility for existing `training-plan-v2` fields

Frontend Responsibilities

No frontend work is required for the first backend slices unless backend adds new review fields.

If review fields change later:

- render backend-provided honesty assumptions and plan-shape summaries
- do not infer coaching meaning locally
- keep `Open plan` review/confirm boundaries unchanged

Risks

- overcorrecting could make normal beginner plans too complex
- mountain specificity could become unsafe if downhill work is too aggressive
- long-distance honesty could sound discouraging if copy is too blunt
- goal-family sharpening could produce verbose workouts that are hard to scan
- fixture assertions could overfit to exact text rather than stable coaching facts

Risk controls:

- keep beginner and relaxed plans simple
- make mountain downhill work progressive and controlled
- use calm runner-facing honesty language
- assert stable structured facts where possible
- keep compact calendar family labels stable

What Must Stay Preserved

- safe refresh/apply draft architecture
- explicit review/confirm before mutation
- fixed rest-day invariants
- pace gating
- HR suppression without HR-zone truth
- protected past/logged/evidence-backed history
- canonical `training-plan-v2` output
- source workout identity preservation
- frontend as renderer, not coaching-rule owner

What We Leave For Later

- exact elevation/route-aware planning
- HR-zone automation
- medical/rehab programming
- injury prediction
- full race strategy planning
- nutrition/fueling system beyond light runner-facing cues
- per-workout drag/drop editor
- coach chat product

Exit Criteria

- taper-phase fixtures prove peak durability stress cannot appear in taper-labeled weeks
- low-frequency marathon/ultra/mountain fixtures produce honest conservative or durability-limited assumptions
- mountain/trail fixtures include downhill durability, controlled descents, hike/run or time-on-feet cues where appropriate
- ambitious 5K/10K/HM fixtures show clearer goal-family specificity without fake precision
- refresh fixtures prove old future schedules can improve while protected history remains fixed
- fixed rest-day, pace-gating, and HR-suppression fixtures continue to pass
- no frontend coaching-rule ownership is introduced

Next Recommended Role

BACKEND

Suggested Next Step

Implement Slice 1 only: taper/phase consistency.

Backend should inspect `src/lib/structured-plan-authoring.ts` and the active-plan refresh draft path, then add the smallest deterministic rule and fixture coverage that prevents peak long-run or peak time-on-feet durability stress from appearing in any `Taper` phase week.
