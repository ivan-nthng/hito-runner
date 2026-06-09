# Running Plan Engine Scenario Matrix

## Purpose

This matrix translates the coach doctrine into backend-ready scenario rules for the rebuilt Hito
running plan creation engine.

## Families

| Family | Runner level | Days/week | Goal promise | Weekly rhythm | Long-run shape | Endpoint rule | Metric mode bias | Quality-gate focus |
|---|---|---:|---|---|---|---|---|---|
| `10K` | `beginner_new_runner` | 3 | complete 10K safely | mostly easy + one light development touch some weeks | small progressive long run with frequent cutbacks | explicit 10K completion or checkpoint | structure-first; default HR optional only as editable default | no support-only endpoint |
| `10K` | `sometimes_runs` | 3-4 | complete 10K with visible growth | easy/recovery backbone + one moderate touch max | clear long-run growth with cutbacks | explicit 10K completion or checkpoint | structure-first; editable default HR optional only | no generic final long run |
| `10K` | `runs_a_lot` | 4-5 | complete 10K with clearer 10K specificity | one quality touch max + strong support stack | stronger but still bounded long-run growth | explicit 10K completion or checkpoint | structure-first; editable default HR optional only | no vague final week |
| `10K` | `professional_competitive` | 4-5 | conservative 10K base only | one quality touch max, not a sharp race block | maintained long-run rhythm | explicit 10K checkpoint or completion marker | structure-first; editable default HR optional only | no advanced race-peak simulation |
| `Half Marathon` | `beginner_new_runner` | 3 | only if product allows a conservative completion build | easy/steady dominant with very careful specificity | long-run emphasis and conservative growth | explicit 21.1K completion or checkpoint | structure-first; default HR optional only as editable default | no readiness-only endpoint |
| `Half Marathon` | `sometimes_runs` | 3-4 | complete Half with visible specific development | easy/steady + one moderate touch max | clear long-run progression, cutbacks, occasional specific finish | explicit 21.1K completion or checkpoint | structure-first; editable default HR optional only | no rest-day ending |
| `Half Marathon` | `runs_a_lot` | 4-5 | complete Half with stronger half-specific rhythm | one moderate or threshold-like touch max | long-run growth plus selective specific finish | explicit 21.1K completion or checkpoint | structure-first; editable default HR optional only | no generic support-only last week |
| `Half Marathon` | `professional_competitive` | 4-5 | conservative Half base only unless future advanced track exists | one quality touch max only | durable long-run rhythm | explicit 21.1K checkpoint or completion marker | structure-first; editable default HR optional only | no pseudo-elite race block |
| `Marathon Base` | `beginner_new_runner` | 4 | only if product keeps it clearly base-building | support-heavy with no aggressive specificity | slow long-run progression with frequent cutbacks | explicit base endpoint, not race endpoint | structure-first; default HR optional only as editable default | no fake marathon readiness |
| `Marathon Base` | `sometimes_runs` | 4-5 | honest base-building | easy/recovery dominance + one specific touch max | stronger long-run growth with cutbacks | explicit base endpoint | structure-first; editable default HR optional only | no race-peak language |
| `Marathon Base` | `runs_a_lot` | 4-5 | durable marathon base | one specific touch max or long-run specific finish | strong long-run progression, visible cutbacks | explicit base endpoint | structure-first; editable default HR optional only | no endpoint overclaim |
| `Marathon Base` | `professional_competitive` | 4-5 | conservative base only, not full marathon prep | one touch max with strong recovery protection | high but bounded durability block | explicit base endpoint | structure-first; editable default HR optional only | no full-race implication |

## Runner-Level Translation

| Input label | Backend meaning | Early-week bias | Specificity ceiling | Review note |
|---|---|---|---|---|
| `beginner/new runner` | low durability, low support tolerance | short support days, gradual long-run growth | strides or progression before real quality | explain conservative build and editable defaults |
| `sometimes runs` | some durability but inconsistent support | stable support rhythm first | one moderate touch max | explain that support evidence outranks ambition |
| `runs a lot` | durable recreational runner | faster entry into specific rhythm | one quality touch max | explain stronger specificity is allowed but still bounded |
| `professional/competitive` | advanced runner profile | conservative base only in this engine slice | still one touch max unless future advanced path exists | explain that this path stays intentionally conservative |

## Load And Progression Translation

| Condition | Backend effect | Review language |
|---|---|---|
| higher age/load context | extend horizon, increase cutbacks, reduce ramp speed | `Hito chose a more conservative build to keep the plan repeatable.` |
| lower days/week | extend horizon and reduce weekly specificity density | `Because you run fewer days per week, the plan uses a longer runway.` |
| fixed rest days | preserve them as hard placement constraints | `Your fixed rest days stay protected.` |
| preferred long-run day | anchor long run there when viable | `Long run stays on your preferred day when possible.` |
| no precise pace truth in v1 | keep structure-only or editable-default-HR mode | `This plan stays watch-executable without inventing pace targets.` |

## Watch-Executable Workout Atom Rules

| Workout atom | Allowed primary structure | Allowed target truth | Forbidden primary output |
|---|---|---|---|
| recovery | time or distance | optional default HR only if labelled editable default | cue-only recovery prose |
| easy | time, distance, time with editable default HR cap, distance with editable default HR cap | editable default HR only | fake pace or fake personal HR |
| long run | time or distance with explicit opener/main/finish | optional editable default HR cap | anonymous `long aerobic run` with no structure |
| cutback long run | time or distance with visibly reduced load | optional editable default HR cap | disguised normal long run |
| strides | explicit repeated short reps plus explicit recoveries | structure-only | vague `add strides if you want` |
| tempo | explicit time or distance work blocks | structure-only or editable default HR guidance | `threshold steady` as primary output |
| threshold | explicit blocks plus explicit recoveries | structure-only or editable default HR guidance | cue-only threshold description |
| intervals | explicit reps plus explicit recoveries | structure-only | implied recoveries |
| hills | explicit uphill work plus explicit recoveries | structure-only or editable default HR cap | terrain-vague hill session |
| final selected-distance day | explicit selected-distance main block plus finish/cooldown | structure-first only in v1 normal path | metadata-only endpoint |

## Weekly Rhythm Rules By Family

| Family | Easy/recovery balance | Quality spacing | Cutback rhythm | Taper or endpoint behavior | Minimum recovery rule |
|---|---|---|---|---|---|
| `10K` | support days must dominate | one touch max; never adjacent to long run in conservative cases | every 3rd or 4th load cycle | final week must foreground explicit 10K endpoint | next running slot after long run stays easy or recovery |
| `Half Marathon` | easy + steady dominate | one touch max; long-run specific finish may replace midweek touch | every 3rd or 4th load cycle | final week must foreground explicit 21.1K endpoint | no threshold plus hard long-run finish stack in the same week |
| `Marathon Base` | recovery and easy dominate | one touch max or long-run specific finish, not both hard | every 3rd or 4th load cycle | endpoint must read as durability/base, not race taper | after long run, next actual run stays recovery or easy in conservative variants |

## Default HR-Zone Rules

| Use case | Allowed | Label | Not allowed |
|---|---|---|---|
| easy/recovery cap | yes | `Hito default HR zone` or `editable default HR cap` | calling it personal zone truth |
| steady aerobic guidance | yes | `editable default HR guidance` | implying lab-tested or measured truth |
| threshold/tempo prescription | only if product chooses conservative default behavior and labels it clearly | `default HR guidance, not personal zone truth` | framing it as precise individualized threshold truth |
| runner-facing summary | yes | `editable default` | `your HR zone` unless real personal truth exists |

## Backend Acceptance Matrix

| Check | Must pass | Must fail |
|---|---|---|
| 10K endpoint | final output shows explicit 10K completion/checkpoint | final week ends on generic long/easy/recovery |
| Half endpoint | final output shows explicit 21.1K completion/checkpoint | final week ends on readiness-only label, rest, or generic support |
| Marathon Base endpoint | output shows honest base endpoint | output implies full marathon race readiness |
| Workout structure | every non-rest workout has numeric segment anatomy | vague effort-only primary output |
| Pace truth | no precise pace appears in the normal happy path | pace from target time alone or from stale benchmark doctrine |
| HR truth | default HR is clearly labelled editable default | default HR presented as personal truth |
| Weekly rhythm | one touch max and protected recovery spacing | stacked specificity or compressed long-run adjacency |

## QA Fixture Expectations

| Family | Minimum proof fixture |
|---|---|
| `10K` | one beginner or sometimes-runs 10K showing explicit final 10K day |
| `Half Marathon` | one Half showing explicit 21.1K final day, not a readiness-only label |
| `Marathon Base` | one Marathon Base showing honest base endpoint and no race-peak overclaim |
| all families | one watch-executable detail example where primary text is structured and cue text is secondary |

## Translation To Source Files

Backend should later split this matrix into:

- typed family contracts
- weekly placement rules
- endpoint quality gates
- HR default labeling rules
- watch-executable workout-day templates from docs-owned coaching artifacts only

## R1 Canonical Boundary Note

This matrix does not treat the untracked files under
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/plan-creation-engine/`
as canonical.

For Slice R1, the accepted canonical coaching source of truth lives under:

- `docs/tasks/running-coach/`
