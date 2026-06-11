# Running Plan Rich Composition Matrix

Date: 2026-06-09
Owner: Running Coach
Status: Proposed gold-standard training composition source of truth for deterministic running-plan engine
Plan: `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

## Purpose

Define the coach-owned composition canon that Backend must encode deterministically for normal-path plan generation.

This artifact exists because:

- the engine can now generate technically valid plans
- but technical validity alone still permits safe-but-flat output
- Backend needs richer deterministic doctrine before create-path implementation

This artifact is not:

- product code
- frontend layout
- a persistence contract
- an AI prompt
- permission to fake pace, fake personal HR, or overclaim readiness

## Scope

Goal families:

- `10K`
- `Half Marathon`
- `Marathon Base`

Runner levels:

- `beginner_new_runner`
- `sometimes_runs`
- `runs_a_lot`
- `professional_competitive`

Load contexts:

- `standard_load`
- `conservative_load`
- `low_availability`
- `compressed_schedule`

---

## 1. Coaching Philosophy

### Richness Standard

The engine must pursue training richness, not decorative variety.

Richness means:

- each family carries a real training promise
- weeks have recognizable roles
- development touches are intentional
- long runs do more than occupy space
- softer plans still preserve family identity

### Quality Definitions

| Mode | Definition | Acceptable use | Failure mode |
| --- | --- | --- | --- |
| `safe_but_flat_filler` | technically valid calendar with low-risk labels but weak training identity | never the desired normal output | generic `easy/tempo/long` repetition with no family promise |
| `credible_conservative_training` | softened plan that still preserves goal-family logic | conservative load, weak support, cautious runway | removing identity instead of reshaping identity |
| `ambitious_but_honest_training` | richer plan that uses all safe goal-relevant signals without pretending unsupported precision | stronger support, better availability, stronger runner levels | hidden second-hard-week logic, fake pace, race-readiness overclaim |
| `impossible_goal_response` | best honest modified structure when the requested goal cannot be delivered literally | compressed or unrealistic asks | empty plan, fake optimism, or silent collapse to generic filler |

### Philosophy Rules

- Safety must not be used as an excuse for emptiness.
- A conservative plan still needs a recognizable family identity.
- If identity cannot be preserved honestly, the plan should modify or block rather than flatten silently.
- Long runs are training signals, not filler placeholders.
- Development richness must come from composition, not from forcing intervals everywhere.

---

## 2. Plan-Family Composition Standards

| Family | Core training promise | Required workout variety | Required week archetypes | Required long-run behavior | Development stimulus expectation | Too bland when | Too aggressive when | Must never be faked |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `10K` | rhythm, repeatability, turnover, exact endpoint honesty | strides, tempo, intervals for supported standard load, hills for higher support, cutback long run, taper sharpening | easy support, turnover, tempo support, cutback, interval, taper sharpening, endpoint | present but not dominant; supportive long run, visible cutbacks, no fake marathon-style long-run meaning | one touch max per week; standard-load supported plans must show real repeatability | only `strides + tempo`, no intervals in supported standard load, long run does all the work | threshold inflation, multiple hard demands, pseudo-5K sharpness every week | exact pace, personal HR, threshold in beginner paths, fake race-readiness |
| `Half Marathon` | sustained work, durability, long-run role, exact endpoint honesty | strides, tempo, one clear half-specific durability signal for `sometimes_runs`, threshold for higher support, bounded intervals only when they support durability | easy support, turnover, tempo support, threshold support where allowed, long-run durability, steady-finish long run where safe, cutback, taper sharpening, endpoint | must move beyond duration-only; checkpoint/finish roles should rotate meaningfully in supported plans | one touch max per week; long run may count as the touch; conservative paths still need durability identity | generic `tempo + tempo + interval + tempo`, long run has no role, family reads like generic distance plan | threshold plus interval plus long-run finish compression, 10K-like turnover instead of durability | race-pace specificity, personal HR, fake threshold precision, unsupported half readiness |
| `Marathon Base` | durable aerobic base, time on feet, steady endurance growth, honest non-race endpoint | strides, tempo support, richer long-run roles, threshold and hills only for higher support, cutback long run, honest base endpoint | easy support, turnover, tempo support, long-run durability, steady-finish long run where safe, threshold support/hills for higher support, cutback, taper sharpening, endpoint | visible time-on-feet growth, checkpoint rotation, durable but non-race-like finish behavior | one touch max per week; long run often carries the key signal; higher-support standard load should feel richer than `sometimes_runs` | only `strides + tempo + endpoint`, long runs repeat one shell, base feels empty | race-plan leakage, intervals, race-pace behavior, hidden marathon readiness | full marathon race readiness, target-time precision, fake pace, personal HR |

### Family Identity Minimums

| Family | Required family identity signals in a credible plan |
| --- | --- |
| `10K` | `turnover`, `tempo_support`, `repeatability`, exact endpoint |
| `Half Marathon` | `sustained_support`, `durability`, meaningful long-run role, exact endpoint |
| `Marathon Base` | `tempo_support`, `time_on_feet`, meaningful long-run role, honest non-race endpoint |

---

## 3. Runner-Level Matrix

| Runner level | Expected weekly intensity richness | Acceptable development touches | Required variety over the block | Progression ceiling | Minimum meaningful plan content | Block / modify / warn rules |
| --- | --- | --- | --- | --- | --- | --- |
| `beginner_new_runner` | light only; not every week | strides, safe run-walk adaptation where relevant, simple long-run growth where family is allowed | support weeks, turnover weeks, cutbacks, endpoint honesty | no true threshold, no intervals, no hills | support backbone, long-run progression if applicable, explicit cutbacks, exact endpoint | auto-extend supported families when coach-plausible; block only structural impossibility or missing family mapping; warn if user expects high-performance density |
| `sometimes_runs` | one touch max; moderate only | tempo, strides, selective intervals only in family-appropriate standard-load cases, long-run-specific development | at least two development pattern types across the block; long-run role cannot stay anonymous | no two-hard weeks, no default threshold unless family and support justify it | support rhythm plus one unmistakable family-specific signal | modify when load or availability is limited; block when compressed schedule breaks recovery after key sessions |
| `runs_a_lot` | one touch max weekly; richer than `sometimes_runs` | tempo, threshold where family allows, intervals where family allows, hills where family allows, long-run-specific work | at least three meaningful pattern types in standard load; one meaningful family-specific long-run signal | still deterministic and conservative; no two-hard logic | visible distinction from `sometimes_runs`, not just more easy days | modify under conservative load but preserve family identity; block if compression makes quality fall into long run |
| `professional_competitive` | one touch max weekly in v1, but strongest allowed within family | everything allowed for `runs_a_lot`, plus one sharper or second richer expression where the family supports it | must differ visibly from `runs_a_lot` in progression quality or stimulus type | no pseudo-elite advanced track, no second hard day in same week | clear richness, sharper but honest structure, stronger long-run role | modify or soften under conservative load; block when recovery spacing becomes dishonest |

### Minimum Meaningful Content By Family And Runner Level

| Family | `beginner_new_runner` | `sometimes_runs` | `runs_a_lot` | `professional_competitive` |
| --- | --- | --- | --- | --- |
| `10K` | strides, cutbacks, exact endpoint | strides, tempo, intervals, exact endpoint | strides, tempo, intervals, hills, exact endpoint | strides, tempo, intervals, second interval expression, hills, exact endpoint |
| `Half Marathon` | auto-extended bridge plan with run-walk adaptation, strides, steady or progression durability, long-run durability, exact endpoint | strides, tempo, one half-specific durability signal, exact endpoint | strides, tempo, threshold, long-run durability, exact endpoint | strides, tempo, threshold, sharper durable-repeatability or long-interval signal, exact endpoint |
| `Marathon Base` | auto-extended base bridge with run-walk adaptation where needed, strides, steady durability, long-run durability, honest endpoint | strides, tempo, long-run durability, honest endpoint | strides, tempo, threshold or hills, time on feet, honest endpoint | strides, tempo, threshold, hills, richer long-run role, honest endpoint |

---

## 4. Load-Context Matrix

| Load context | What changes | What must remain | Softened family-preserving patterns | Wrong softening behavior |
| --- | --- | --- | --- | --- |
| `standard_load` | full supported family expression is allowed | all family identity minimums | normal standard-load family ladder | none |
| `conservative_load` | reduce sharpness, volume aggression, and repeated demanding touches | family identity, long-run role, exact/honest endpoint, one meaningful development idea | 10K: tempo plus strides; Half: durability tempo, conservative long-run durability checkpoints, one softer sustained signal; Marathon Base: tempo support, time-on-feet, checkpoint rotation, softer durable finish | deleting threshold/hills/intervals and leaving only generic support labels with no family-specific substitute |
| `low_availability` | fewer sessions, wider spacing, more work done by long-run role and one strong midweek touch only if safe | family promise, cutbacks, recovery after long run or hard day | 10K: strides or tempo or intervals, not everything; Half: tempo plus durability long run; Marathon Base: tempo plus time-on-feet | compressing quality into the run before or after the long run |
| `compressed_schedule` | may require modify or block | honesty about the compromise | softer family-specific support or blocked preview | pretending that a broken recovery pattern is still acceptable because the calendar fits |

### Conservative-Load Preservation Rules

| Family | Conservative-load preservation rule |
| --- | --- |
| `10K` | may remove intervals or hills, but must keep `tempo_support` plus `turnover` and exact endpoint |
| `Half Marathon` | may remove threshold and sharper repeatability, but must keep at least one soft durability signal and at least one meaningful long-run role beyond plain duration |
| `Marathon Base` | may remove threshold and hills, but must keep `tempo_support` or turnover plus time-on-feet or durable long-run role beyond plain long-run repetition |

### Low-Availability 3-Day Rule

Three-day plans may still be rich, but only if:

- one development touch exists in a recoverable slot
- the long run has a real role
- the next running slot after a stressor is not another stressor

Three-day plans should be blocked when:

- intervals or hills push directly into the long run
- threshold pushes directly into the long run
- the family promise requires more recovery room than the weekly calendar can honestly provide

---

## 5. Exemplar Week-Sequence Templates

Week legend:

- `Dev touch` = the week’s main development stimulus
- `LR role` = long-run role
- `Support pattern` = support/recovery rhythm
- `Watch exec` = what the watch should see as the executable core

### 10K Beginner

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | simple aerobic blocks |
| 2 | turnover_week | strides | support | easy around strides | easy plus 4-6 x 20 sec strides |
| 3 | easy_support_week | none | support | easy plus recovery | simple aerobic blocks |
| 4 | cutback_week | none | cutback | reduced support | reduced long run |
| 5 | turnover_week | strides | support | easy around strides | easy plus strides |
| 6 | easy_support_week | none | support | recovery after long run | aerobic support |
| 7 | turnover_week | strides | support | easy around strides | easy plus strides |
| 8 | cutback_week | none | cutback | reduced support | reduced long run |
| 9 | taper_sharpening_week | strides | support | mostly easy | short strides-only tune-up |
| 10 | endpoint_week | none | endpoint | easy and recovery | exact 10000m endpoint |

### 10K Sometimes Runs

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | 2-3 x tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | interval_week | intervals | support | recovery next running slot | short controlled intervals |
| 6 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 7 | tempo_support_week | tempo | support | easy after tempo | controlled tempo blocks |
| 8 | cutback_week | none | cutback | lighter week | cutback long run |
| 9 | taper_sharpening_week | strides | support | mostly easy | strides-only tune-up |
| 10 | endpoint_week | none | endpoint | easy and recovery | exact 10000m endpoint |

### 10K Runs A Lot

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | recovery after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | reduced support | cutback long run |
| 5 | interval_week | intervals | support | recovery next running slot | controlled interval reps |
| 6 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 7 | hill_strength_week | hills | support | recovery next running slot | uphill repeat session |
| 8 | cutback_week | none | cutback | reduced support | cutback long run |
| 9 | taper_sharpening_week | strides | support | mostly easy | short sharpening strides |
| 10 | endpoint_week | none | endpoint | easy and recovery | exact 10000m endpoint |

### 10K Professional Competitive

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | reduced support | cutback long run |
| 5 | interval_week | intervals | support | recovery next running slot | controlled intervals |
| 6 | interval_week | stronger intervals | support | recovery next running slot | second repeatability session, sharper but honest |
| 7 | hill_strength_week | hills | support | easy after hills | uphill repeat session |
| 8 | cutback_week | none | cutback | reduced support | cutback long run |
| 9 | taper_sharpening_week | strides | support | mostly easy | short sharpening strides |
| 10 | endpoint_week | none | endpoint | easy and recovery | exact 10000m endpoint |

### Half Sometimes Runs

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | controlled tempo blocks |
| 4 | cutback_week | none | cutback | lighter support | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | tempo_support_week | durability tempo | support | easy after tempo | longer tempo blocks |
| 7 | long_run_durability_week | none | durability checkpoint | easy before and after long run | long run with checkpoint role |
| 8 | cutback_week | none | cutback | lighter support | cutback long run |
| 9 | interval_week | bounded repeatability | durability checkpoint | recovery next running slot | one bounded interval session |
| 10 | long_run_steady_finish_week | long run counts as touch | steady finish | easy after long run | long run with steady finish |
| 11 | tempo_support_week | half-specific durability tempo | durability checkpoint | easy after tempo | rich durability tempo blocks |
| 12 | cutback_week | none | cutback | reduced support | cutback long run |
| 13 | taper_sharpening_week | strides | durability checkpoint | mostly easy | short sharpening strides |
| 14 | endpoint_week | none | endpoint | easy and recovery | exact 21100m endpoint |

### Half Runs A Lot

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | reduced support | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | threshold_support_week | threshold | support | recovery next running slot | threshold session |
| 7 | long_run_durability_week | none | durability checkpoint | easy before and after | long run with durability checkpoint |
| 8 | cutback_week | none | cutback | reduced support | cutback long run |
| 9 | tempo_support_week | tempo | durability checkpoint | easy after tempo | durable tempo support |
| 10 | long_run_steady_finish_week | long run counts as touch | steady finish | easy after long run | long run with steady finish |
| 11 | threshold_support_week | threshold | durability checkpoint | recovery next running slot | threshold session |
| 12 | cutback_week | none | cutback | lighter week | cutback long run |
| 13 | taper_sharpening_week | strides | durability checkpoint | mostly easy | short sharpening strides |
| 14 | endpoint_week | none | endpoint | easy and recovery | exact 21100m endpoint |

### Half Professional Competitive

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | threshold_support_week | threshold | support | recovery next running slot | threshold session |
| 7 | long_run_durability_week | none | durability checkpoint | easy around long run | long run with checkpoint role |
| 8 | cutback_week | none | cutback | reduced support | cutback long run |
| 9 | interval_week | durable repeatability | durability checkpoint | recovery next running slot | long intervals or strong intervals |
| 10 | long_run_steady_finish_week | long run counts as touch | steady finish | easy after long run | long run with steady finish |
| 11 | threshold_support_week | threshold | durability checkpoint | recovery next running slot | stronger threshold session |
| 12 | cutback_week | none | cutback | reduced support | cutback long run |
| 13 | taper_sharpening_week | strides | durability checkpoint | mostly easy | short sharpening strides |
| 14 | endpoint_week | none | endpoint | easy and recovery | exact 21100m endpoint |

### Marathon Base Sometimes Runs

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | controlled tempo blocks |
| 4 | cutback_week | none | cutback | lighter support | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | turnover_week | strides | support | easy around strides | easy plus strides |
| 7 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 8 | cutback_week | none | cutback | lighter week | cutback long run |
| 9 | long_run_durability_week | none | durability checkpoint | easy after long run | long run with time-on-feet checkpoint |
| 10 | tempo_support_week | tempo | durability checkpoint | easy after tempo | tempo support |
| 11 | long_run_steady_finish_week | long run counts as touch | steady finish | recovery next running slot | long run with gentle durable finish |
| 12 | cutback_week | none | cutback | reduced support | cutback long run |
| 13 | tempo_support_week | tempo | durability checkpoint | easy after tempo | richer tempo support |
| 14 | long_run_steady_finish_week | long run counts as touch | steady finish | recovery next running slot | long run with durable finish |
| 15 | taper_sharpening_week | strides | durability checkpoint | mostly easy | strides-only taper touch |
| 16 | endpoint_week | none | endpoint | easy and recovery | honest base endpoint |

### Marathon Base Runs A Lot

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | easy_support_week | none | support | aerobic support | easy plus recovery |
| 6 | threshold_support_week | threshold | support | recovery next running slot | threshold session |
| 7 | easy_support_week | none | support | aerobic support | easy plus recovery |
| 8 | cutback_week | none | cutback | reduced support | cutback long run |
| 9 | long_run_durability_week | none | durability checkpoint | easy after long run | long run with fueling/posture checkpoint |
| 10 | tempo_support_week | tempo | durability checkpoint | easy after tempo | tempo support |
| 11 | long_run_steady_finish_week | long run counts as touch | steady finish | recovery next running slot | long run with durable steady finish |
| 12 | cutback_week | none | cutback | lighter week | cutback long run |
| 13 | hill_strength_week | hills | durability checkpoint | easy after hills | uphill repeat session |
| 14 | long_run_durability_week | none | durability checkpoint | recovery after long run | long run with durable checkpoint role |
| 15 | taper_sharpening_week | strides | durability checkpoint | mostly easy | strides-only sharpening |
| 16 | endpoint_week | none | endpoint | easy and recovery | honest base endpoint |

### Marathon Base Professional Competitive

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | richer tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | threshold_support_week | threshold | support | recovery next running slot | threshold session |
| 7 | easy_support_week | none | support | aerobic support | easy plus recovery |
| 8 | cutback_week | none | cutback | lighter week | cutback long run |
| 9 | long_run_durability_week | none | durability checkpoint | easy after long run | long run with richer checkpoint role |
| 10 | tempo_support_week | tempo | durability checkpoint | easy after tempo | tempo support |
| 11 | long_run_steady_finish_week | long run counts as touch | steady finish | recovery next running slot | long run with durable steady finish |
| 12 | cutback_week | none | cutback | reduced support | cutback long run |
| 13 | hill_strength_week | hills | durability checkpoint | easy after hills | hill strength session |
| 14 | threshold_support_week | threshold | durability checkpoint | recovery next running slot | second threshold durability session |
| 15 | taper_sharpening_week | strides | durability checkpoint | mostly easy | strides-only sharpening |
| 16 | endpoint_week | none | endpoint | easy and recovery | honest base endpoint |

### Conservative Half Higher-Support

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | durability tempo | support | easy after tempo | softer tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 6 | tempo_support_week | tempo | support | easy after tempo | shorter sustained tempo |
| 7 | long_run_durability_week | none | durability checkpoint | easy after long run | conservative long run checkpoint |
| 8 | cutback_week | none | cutback | lighter support | cutback long run |
| 9 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 10 | long_run_steady_finish_week | long run counts as touch | mild steady finish | recovery next running slot | gentle steady-finish long run |
| 11 | tempo_support_week | durability tempo | durability checkpoint | easy after tempo | softer durability tempo |
| 12 | cutback_week | none | cutback | reduced support | cutback long run |
| 13 | taper_sharpening_week | strides | support | mostly easy | strides-only sharpening |
| 14 | endpoint_week | none | endpoint | easy and recovery | exact 21100m endpoint |

### Conservative Marathon Base Higher-Support

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 2 | turnover_week | strides | support | easy around strides | easy plus strides |
| 3 | tempo_support_week | tempo | support | easy after tempo | softer tempo blocks |
| 4 | cutback_week | none | cutback | lighter week | cutback long run |
| 5 | easy_support_week | none | support | aerobic support | easy plus recovery |
| 6 | turnover_week | strides | support | easy around strides | easy plus strides |
| 7 | easy_support_week | none | support | aerobic support | easy plus recovery |
| 8 | cutback_week | none | cutback | lighter week | cutback long run |
| 9 | long_run_durability_week | none | durability checkpoint | recovery after long run | long run with time-on-feet checkpoint |
| 10 | tempo_support_week | tempo | durability checkpoint | easy after tempo | tempo support |
| 11 | long_run_steady_finish_week | long run counts as touch | mild durable finish | recovery next running slot | long run with gentle steady finish |
| 12 | cutback_week | none | cutback | lighter support | cutback long run |
| 13 | easy_support_week | none | durability checkpoint | easy plus recovery | aerobic support |
| 14 | long_run_durability_week | none | durability checkpoint | recovery after long run | long run with fueling/form checkpoint |
| 15 | taper_sharpening_week | strides | support | mostly easy | strides-only sharpening |
| 16 | endpoint_week | none | endpoint | easy and recovery | honest base endpoint |

### Low-Availability 3-Day Scenarios

| Week | Archetype | Dev touch | LR role | Support pattern | Watch exec |
| --- | --- | --- | --- | --- | --- |
| 1 | easy_support_week | none | support | one easy plus one recovery | simple aerobic support |
| 2 | turnover_or_tempo_week | strides or tempo only | support | easy after dev touch | one bounded touch only |
| 3 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 4 | cutback_week | none | cutback | reduced support | cutback long run |
| 5 | family_specific_week | one family-appropriate touch only if recovery remains honest | support or durability checkpoint | recovery next running slot mandatory | single bounded watch-executable key session |
| 6 | easy_support_week | none | support | easy plus recovery | aerobic support |
| 7 | long_run_signal_week | long run counts as touch if needed | durability checkpoint or steady finish if safe | no second dev touch that week | long run with clear role |
| 8 | cutback_or_taper | none or light strides | cutback or support | reduced support | reduced long run or short sharpening |

Low-availability rule:

- if the only possible quality placement would push directly into the long run, block or modify the scenario rather than forcing it preview-ready

---

## 6. Workout Richness Library

| Pattern | Purpose | Segment anatomy | Minimum useful version | Stronger version | Conservative version | Family fit | Runner-level fit | Recovery requirement | Fake or bland when |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `strides` | turnover and neuromuscular freshness | easy support plus short reps plus explicit jog recoveries | `4 x 20 sec` after easy support | `8 x 20 sec` with longer support block | `4-6 x 20 sec` only | all families | all eligible | next running slot may be normal easy | token 2 strides, no support block, no explicit recovery |
| `tempo` | sustained moderate stress | warmup, repeated tempo blocks, cooldown | `2 x 8 min / 2 min jog` | `3 x 12 min / 2 min jog` | `2 x 6-8 min` softer blocks | 10K, Half, Marathon Base | sometimes_runs+ | easy/recovery next running slot if long run is close | identical every time, no growth, or vague “tempo feel” only |
| `durability_tempo` | softer half-specific or endurance-specific sustained work | warmup, longer controlled tempo blocks, cooldown | `2 x 10 min / 2 min jog` | `3 x 12-15 min / 2 min jog` | `2 x 8-10 min` with easier close | Half, Marathon Base selective | sometimes_runs+, conservative higher-support | easy/recovery next running slot | just generic tempo with new label and no role |
| `threshold` | stronger durability and clearance | warmup, threshold blocks, explicit recovery, cooldown | `3 x 8 min / 3 min jog` | cruise intervals or longer blocks | `not default in conservative load` | Half, Marathon Base | runs_a_lot, professional | easy/recovery next running slot | fake threshold pace or no recovery after it |
| `short_intervals` | rhythm and repeatability | warmup, short reps, explicit recoveries, cooldown | `6 x 400m` or `6 x 2 min` | `6 x 1km` in stronger 10K paths | replace with tempo/strides in conservative load | 10K, selective Half | sometimes_runs 10K+, stronger levels | easy/recovery next running slot | appears in Marathon Base or unsupported low-support Half |
| `long_intervals` | durable repeatability | warmup, longer reps, explicit recoveries, cooldown | `4 x 1km` | `5 x 1500m` or `4 x 1600m` | replace with durability tempo in conservative load | 10K high-support, Half high-support | runs_a_lot, professional | easy/recovery next running slot | used just to look rich without family need |
| `hills` | strength and mechanics | warmup, uphill reps, jog-down or walk-jog recoveries, cooldown | `6 x 45 sec uphill` | `8-10 x 90 sec uphill` | `4-6 x 45 sec` mild hills or remove and preserve identity elsewhere | 10K, Half selective, Marathon Base higher-support | runs_a_lot, professional | easy/recovery next running slot | no explicit recovery, fake elevation claims, random one-off hill label |
| `progression` | controlled change of effort | opener, easier block, stronger block, cooldown | `20 min easy + 10 min stronger` | longer two-step progression | shorter two-step progression | 10K, Half, Marathon Base | sometimes_runs+ | counts as the week’s touch | just easy run with marketing language |
| `steady_aerobic` | moderate support | opener, steady main, cooldown | `20 min steady` | `35-45 min steady` | `15-20 min controlled steady` | Half, Marathon Base, selective 10K | sometimes_runs+ | still needs spacing from bigger load | indistinguishable from easy or threshold |
| `long_run` | endurance and durability | opener, main, checkpoint, cooldown or settle finish | one clear checkpoint role | longer main plus richer checkpoint rotation | shorter main with one clear checkpoint | all families | all eligible | next running slot easy/recovery | one anonymous block, no role, no checkpoint |
| `long_run_with_steady_finish` | late-run durable control | opener, easy main, checkpoint, steady finish, cooldown | `15-20 min steady finish` | `25-30 min steady finish` | `10-15 min mild finish` | Half, Marathon Base selective | sometimes_runs selective, runs_a_lot, professional | counts as the week’s touch | paired with threshold/intervals in same week or race-like finish |
| `cutback_long_run` | unload while keeping rhythm | opener, reduced main, finish | visibly shorter than prior peak | richer but still reduced structure | clearly reduced conservative version | all families | all eligible | next running slot easy/recovery | only 5 min shorter than peak or identical shell with fake cutback label |
| `taper_tuneup` | keep rhythm awake | warmup, very small sharpening block, cooldown | strides-only sharpening | tiny controlled tune-up | strides-only for conservative runners | all families late | stronger levels selective, sometimes_runs selective | easy on both sides | becomes another real workout |
| `endpoint_checkpoint_day` | express the promise honestly | warmup, exact endpoint or honest base endpoint, settle, cooldown | 10K exact / Half exact / Marathon Base honest duration endpoint | future richer endpoint readback only | no sharper version in conservative load, just honest endpoint | family specific | all eligible | preceding days easy/recovery | hidden endpoint, generic final long run, fake readiness copy |

---

## 7. Impossible Or Aggressive Goal Handling

| Scenario | Produce / modify / block | What the plan optimizes instead | How to keep richness without pretending | Eventual runner-facing language |
| --- | --- | --- | --- | --- |
| `marathon from zero in a short timeline` | block normal Marathon Base or route to modified survival/support structure only if product later supports it | habit, durability, safe routine | keep structured support weeks, conservative long-run growth, explicit compromise | `Hito cannot honestly build marathon readiness from your current base in this timeline.` |
| `3:30 marathon from no base` | block as race-goal promise | foundational durability | if anything is shown later, it should be a base-building alternative, not a marathon-race plan | `This request needs more base and time than this path can support honestly.` |
| `Half Marathon with weak base` | modify and auto-extend when runner is still coach-plausible; otherwise block | safe completion support and durability | durability tempo or steady/progression bridge, conservative long-run role, exact endpoint without threshold inflation | `Hito is building a conservative completion-focused half plan, not an aggressive performance build.` |
| `Marathon Base with weak base` | modify and auto-extend when runner is still coach-plausible; otherwise block | long runway durability and honest base-building | long base, cutbacks, time-on-feet growth, honest base endpoint | `Hito is building a longer base plan because your current setup needs more runway before stronger marathon-specific work would be honest.` |
| `high ambition with only 3 days/week` | modify or block depending on recovery spacing | strongest honest structure under low frequency | use one key family signal, stronger long-run role, and more cutback discipline | `With 3 running days, Hito prioritizes the strongest honest structure rather than dense intensity.` |
| `higher-support runner under conservative/heavy load` | produce modified plan, not generic support-only | continuity, durability, reduced stress | preserve family-specific soft signals rather than deleting identity | `Hito is softening stress while preserving the goal-specific shape of the plan.` |

### Impossible-Goal Rules

- Do not answer unrealistic goals with dead filler.
- Do not answer unrealistic goals with fake optimism.
- Modify first when the family promise can still be preserved honestly.
- Block when the family promise itself becomes dishonest.

---

## 8. Backend-Ready Rules

### Minimum Pattern Counts By Family And Runner Level

| Family | Runner level | Standard-load minimum | Conservative-load minimum |
| --- | --- | --- | --- |
| `10K` | `beginner_new_runner` | `strides >= 3`, `cutback_long_run >= 2`, exact endpoint | same |
| `Half Marathon` | `beginner_new_runner` | auto-extended horizon, run-walk adaptation, `strides >= 2`, steady or progression durability, repeated long-run durability, exact endpoint | auto-extended horizon, run-walk adaptation, `strides >= 2`, repeated long-run durability, exact endpoint |
| `Marathon Base` | `beginner_new_runner` | auto-extended horizon, run-walk adaptation, `strides >= 2`, repeated long-run durability, honest endpoint | auto-extended horizon, run-walk adaptation, repeated long-run durability, explicit cutbacks, honest endpoint |
| `10K` | `sometimes_runs` | `strides >= 2`, `tempo >= 2`, `intervals >= 1`, exact endpoint | `strides >= 3`, `tempo >= 2`, exact endpoint |
| `10K` | `runs_a_lot` | `strides >= 2`, `tempo >= 1`, `intervals >= 1`, `hills >= 1`, exact endpoint | `strides >= 3`, `tempo >= 2`, exact endpoint |
| `10K` | `professional_competitive` | `strides >= 2`, `tempo >= 1`, `intervals >= 2`, `hills >= 1`, exact endpoint | `strides >= 3`, `tempo >= 2`, exact endpoint |
| `Half Marathon` | `sometimes_runs` | `strides >= 2`, `tempo >= 2`, `half-specific durability >= 1`, long-run role variety, exact endpoint | `strides >= 2`, `tempo >= 2`, `soft durability signal >= 1`, exact endpoint |
| `Half Marathon` | `runs_a_lot` | `strides >= 2`, `tempo >= 1`, `threshold >= 2`, long-run role variety, exact endpoint | `strides >= 2`, `tempo >= 2`, `soft durability signal >= 1`, long-run role variety, exact endpoint |
| `Half Marathon` | `professional_competitive` | `strides >= 2`, `tempo >= 1`, `threshold >= 2`, sharper repeatability or long intervals >= 1, exact endpoint | `strides >= 2`, `tempo >= 2`, `soft durability signal >= 1`, long-run role variety, exact endpoint |
| `Marathon Base` | `sometimes_runs` | `strides >= 3`, `tempo >= 3`, `time_on_feet >= 1`, honest endpoint | `strides >= 3`, `tempo >= 1` or `time_on_feet >= 1`, honest endpoint |
| `Marathon Base` | `runs_a_lot` | `strides >= 2`, `tempo >= 2`, `threshold or hills >= 1`, `time_on_feet >= 1`, honest endpoint | `strides >= 3`, `tempo >= 2`, `time_on_feet or rich long-run role >= 1`, honest endpoint |
| `Marathon Base` | `professional_competitive` | `strides >= 2`, `tempo >= 2`, `threshold >= 2`, `hills >= 1`, `time_on_feet >= 1`, honest endpoint | `strides >= 3`, `tempo >= 2`, `time_on_feet or rich long-run role >= 1`, honest endpoint |

### Required Family Identity Signals

| Family | Required signals |
| --- | --- |
| `10K` | `turnover`, `tempo_support`, `exact_endpoint`; plus `repeatability` in supported standard load; plus `hill_strength` for higher support standard load |
| `Half Marathon` | `turnover`, `sustained_support`, `exact_endpoint`; plus at least one of `half_specific_durability`, `half_long_run_durability`, `half_long_run_steady_finish`; threshold for higher support standard load |
| `Marathon Base` | `turnover` or `tempo_support`, `honest_endpoint`; plus at least one of `time_on_feet`, `steady_finish`, `rich long-run durability role` in supported paths |

### Conservative-Load Preservation Rules

- Conservative load may remove sharper patterns.
- Conservative load must not erase all family-specific signals.
- Conservative Half must not collapse to `tempo + strides + endpoint`.
- Conservative Marathon Base higher-support must not collapse to `tempo + strides + endpoint`.

### Long-Run Role Rotation Rules

If a preview-ready plan contains long runs over 90 minutes:

- standard-load Half and Marathon Base should rotate at least 3 checkpoint intents and 3 finish intents across the block
- conservative-load higher-support plans should rotate at least 2 checkpoint or 2 finish intents unless the scenario is explicitly too compressed for that richness
- repeating one identical checkpoint/finish shell across every long run is a validator failure for higher-support scenarios

### Development-Touch Placement Rules

- maximum one development touch per week
- development touch may be midweek or long-run-specific, never both
- next running slot after `intervals`, `threshold`, `hills`, or development long run must be `easy` or `recovery`
- three-day scenarios must block when the only possible next running slot after the stressor is the long run

### Blocked / Unavailable Conditions

Block or mark preview unavailable when:

- runner level is unsupported for the family
- preferred long-run day is a fixed rest day
- recovery spacing after a stressor becomes dishonest
- family identity cannot be preserved honestly in the compressed scenario
- endpoint or watch-executable gates fail

### Validator Expectations

Fail when:

- supported 10K standard-load has no intervals
- higher-support 10K standard-load has no hills
- supported Half standard-load lacks any clear half-specific durability signal
- supported Marathon Base standard-load lacks any time-on-feet or richer long-run role
- conservative higher-support Half or Marathon Base lose all family-specific identity
- any preview-ready plan has more than one development touch in a week
- any preview-ready plan places the long run as the next running slot after threshold, intervals, or hills

### Dynamic Scenario Matrix Expectations

The dynamic matrix should prove:

- standard-load and conservative-load paths are visibly different
- conservative-load paths still preserve family identity
- 3-day higher-support cases are blocked when recovery is not honest
- human review subset includes:
  - good standard-load case
  - weak conservative-load preview-ready case
  - `builder_validation_failed` case
  - `long_run_day_blocked` case

---

## 9. What Not To Change

Preserve all of the following:

- no fake precise pace
- no fake personal HR
- no 5K benchmark dependency in the normal path
- no no-watch/no-app branches
- no AI-authored normal-path plans
- no hidden Marathon Base race plan
- no forced intervals every week just for visual richness
- no medical or injury diagnosis
- one canonical backend-owned engine

---

## Backend Handoff Summary

Backend should treat this artifact as the deterministic composition canon for:

- week archetype selection
- development touch selection
- long-run role assignment
- conservative-load softening without identity loss
- validator failure conditions
- dynamic scenario matrix review expectations
