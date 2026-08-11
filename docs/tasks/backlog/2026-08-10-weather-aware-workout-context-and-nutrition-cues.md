# Weather-Aware Workout Context And Nutrition Cues

- **Work Item ID:** `weather-aware-workout-context-and-nutrition-cues`
- **Status:** `ready`
- **Type:** `product-discovery`
- **Priority:** `medium`
- **Owner:** `product`
- **Scope:** `future weather context, runner location choice, and useful workout-day coaching cues`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Product decision after Running Coach discovery`
- **Next Recommended Role:** `product`

## Task

Research and define a future weather-aware workout-day context without coupling weather to plan
generation, Calendar truth, or provider ingestion. Replace generic, low-value workout hints only
after a Running Coach review defines safe, specific cues.

## User Report / Product Direction

- A runner should be able to see current weather context for the city where they train on the day of
  a workout.
- The product may ask the runner for their city when it is needed. Automatic location is not assumed
  to be available, correct, consented to, or persistent.
- The future feature needs two useful cue categories: nutrition/fueling timing and
  weather/conditions. Nutrition is the minimum first category; examples include whether a particular
  workout is compatible with a normal meal gap, a light pre-run meal, or a morning fasted run. These
  are examples for coaching research, not implemented prescriptions.
- Weather may later inform useful conditions-oriented advice, but the coupling, safety constraints,
  and user wording are intentionally undecided.

## Evidence

- The imported baseline explicitly deferred weather as optional enrichment and kept it separate from
  core plan/log behavior in
  [`2026-05-05-full-baseline-import-and-stabilization-plan.md`](../../plans/archive/2026-05-05-full-baseline-import-and-stabilization-plan.md).
- Existing workout language includes generic cues and historical fueling terminology, but no current
  weather provider, city preference, geolocation contract, or weather-to-coaching decision rule was
  found in the source scan.
- The user reports that current generic hints are not useful enough. This is accepted product
  feedback, not a demonstrated code defect.

## Discovery Questions

1. Which weather API is reliable, available in the intended markets, privacy-appropriate, and viable
   for the expected product scale and cost? Research must compare current terms, rate limits,
   attribution, accuracy, caching, and failure behavior before selecting one.
2. What is the runner-controlled location contract: city search/selection, optional coarse browser
   location, fallback/error state, timezone relationship, update behavior, consent, and retention?
3. What precise weather observation/forecast is useful at workout time, and when should the product
   show unavailable rather than stale or false weather?
4. Which nutrition/fueling and conditions cues are safe, specific, non-medical, and appropriate for
   a workout's intensity, duration, time of day, and user context? RUNNING COACH must define these
   criteria before copy or implementation begins.
5. Where should the two cue categories appear in the workout-day experience without adding a second
   coaching system or conflicting with stored workout prescription/cues?

## Expected Future Outcome

After discovery and explicit Product decisions, a runner can opt into an accurate city-based weather
context on the workout day and see at most a small, useful set of factual/coach-reviewed cues. The
first useful content must include nutrition/fueling timing; weather advice is added only when its
rules are proven safe and meaningful. Weather never silently changes a plan, schedule, workout
prescription, or recorded activity.

## What Not To Do Yet

- Do not select or call an API, add credentials, geolocation, a city field, a migration, caching,
  persistence, provider SDK, browser permission prompt, or weather UI.
- Do not delete or rewrite current hints, generate medical/nutrition advice, add OpenAI behavior, or
  infer a runner's location from timezone.
- Do not alter Calendar/workout persistence, plans, FIT/activity history, providers, authentication,
  Design System, hosted state, or deployment.

## Future Validation Expectations

- A later Running Coach discovery receipt defines the bounded cue criteria, contraindications,
  wording limits, and explicit non-medical boundary.
- A later Backend feasibility receipt establishes one chosen weather/location source, privacy and
  failure contract, ownership, and whether existing persisted profile shape can represent an
  explicit city choice without a new model.
- Only after those decisions may Product split implementation into bounded Backend, Frontend Product,
  and QA work items. No implementation or Global QA claim follows from this backlog capture.

## Running Coach Discovery Receipt — 2026-08-10

### Tracked Preflight

- **Task / mode:** weather-aware workout context and nutrition cues / Tracked discovery.
- **Role evidence:** `AGENTS.md`, `agents/running-coach-agent.md`, and
  `skills/hito-running-coach-audit/SKILL.md` were read before the task-owned write.
- **Existing seam reused:** this canonical backlog item is the only changed artifact. The smallest
  change is a coaching-criteria and lifecycle receipt; no product/runtime seam is changed.
- **New runtime artifacts:** none.
- **Obsolete path removed:** none. Current hints and all product behavior remain unchanged because
  Product has not approved replacement copy or implementation.
- **Accepted problem statement:** generic hints are not useful enough. This is accepted Product
  feedback, not a demonstrated code defect. The missing canonical owner is the approved coaching
  rule set, which this discovery narrows but does not implement.

### Coaching Finding

A useful first version does not need generated advice. It needs a small deterministic selector that
uses known workout demand plus, only where necessary, one explicit runner timing choice. Nutrition
should ship before conditions. A qualifying workout gets at most one fueling action; ordinary short
easy runs get no invented advice. Conditions may add at most one preparation or official-safety
action and must never rewrite the workout.

The recommended initial scope is for generally healthy adult runners. Hito must not imply that this
scope covers children, pregnancy/postpartum, diabetes or another glucose-management condition,
current or previous eating-disorder/REDs concerns, medically prescribed diets, renal/cardiac
conditions, medication-sensitive hydration, acute illness, or individualized clinician/dietitian
plans. When one of those contexts is known, product-generated nutrition or hydration advice should
abstain and the established professional plan should take precedence.

### Evidence Versus Recommendation

The sources below support scenario-specific fueling, individualization, and conservative weather
safety. The thresholds and display limits in the following matrices are Hito recommendations, not
clinical prescriptions:

- The 2016 Academy of Nutrition and Dietetics / Dietitians of Canada / ACSM position statement says
  nutrition type, amount, and timing depend on the sporting scenario and recommends a registered
  dietitian for personalized plans
  ([PubMed](https://pubmed.ncbi.nlm.nih.gov/26891166/)).
- The World Athletics consensus supports carbohydrate availability for performance-focused
  endurance work, makes within-run carbohydrate increasingly relevant in events over about 90
  minutes, and describes deliberate low-carbohydrate training as a highly individualized strategy
  involving athlete, coach, and nutrition specialists
  ([official consensus PDF](https://worldathletics.org/download/download?filename=23fb9de0-6699-4d5b-b075-42f5da5518f5.pdf&urlslug=Nutrition+for+Athletics+-+2019+IAAF+Consensus+Statement)).
- A systematic review and meta-analysis found that pre-exercise feeding improved prolonged aerobic
  performance but not shorter-duration performance; it also says more research is needed on the
  adaptations attributed to fasted exercise
  ([PubMed](https://pubmed.ncbi.nlm.nih.gov/29315892/)).
- The 2023 IOC REDs consensus describes problematic low energy availability as a health and
  performance risk. That supports omitting weight-loss, body-composition, and universal fasting
  claims from a generic product cue
  ([BJSM](https://bjsm.bmj.com/content/57/17/1073)).
- CDC identifies hot-day exercise as increasing dehydration and heat-illness risk and recommends
  practical precautions, while NWS notes that heat index is shade-based and that WBGT is more suited
  to active populations; NWS also says geographic acclimatization matters
  ([CDC](https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html),
  [NWS](https://www.weather.gov/tbw/heatindex)).
- NWS says there is no safe outdoor place when a thunderstorm is in the area and recommends waiting
  at least 30 minutes after the last thunder before resuming outdoor activity
  ([NWS lightning safety](https://www.weather.gov/safety/lightning-sports)).
- WHO recommends sun protection from UV Index 3, and US EPA activity guidance changes by regional
  AQI category and sensitive-group status
  ([WHO](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index),
  [US EPA](https://www3.epa.gov/airnow/mobile/AQItable.htm)).

These references do not validate Hito copy, a weather provider, a global warning system, or an
individual runner's nutrition plan.

### Compact Cue Taxonomy And Required Inputs

#### Nutrition / Fueling

| Cue | Eligibility and required inputs | Recommended action boundary |
| --- | --- | --- |
| **Start fed** | Planned duration over 60 minutes, **or** a quality/race session (tempo, intervals, hills, race-specific work). Requires canonical duration and workout intent. An explicit runner-selected timing context may tailor the wording but is not required to establish eligibility. | One sentence: start with familiar food that fits the available time and usual tolerance. Do not name foods, calories, grams, or imply that more is always better. |
| **Plan fuel during** | Planned duration over 90 minutes. Requires canonical duration and should supersede the separate “start fed” row so only one nutrition action appears. | One sentence: start fed and carry a familiar carbohydrate source using an approach already practiced. Do not calculate grams per hour or introduce supplements. |
| **Close-to-start option** | Only after the runner explicitly says the run starts close to eating time and the session qualifies for “start fed.” Requires runner-selected timing context; never infer from clock time alone. | The wording may offer a **small familiar snack if normally tolerated**, not prescribe a “light meal” or a universal time gap. Exact timing labels remain a Product decision. |
| **Fluid access** | Prolonged session, or a later approved heat-risk rule. Requires duration and, for a weather-triggered cue, a time-matched approved heat-risk input. | May say “plan fluid access.” Never output a fixed fluid, sodium, or electrolyte dose without an individualized plan. This action should be folded into the single highest-priority nutrition or conditions cue, not create a third row. |

Deterministic nutrition precedence:

1. If an individualized clinician, sports-dietitian, or coach fueling instruction is present, do not
   generate a conflicting cue; the existing instruction wins.
2. If duration is over 90 minutes, show **Plan fuel during**.
3. Otherwise, if duration is over 60 minutes or intent is quality/race, show **Start fed**.
4. For an easy/recovery run of 60 minutes or less, show no fueling cue. This means “no generic cue,”
   not “fasted training approved.”
5. If duration or workout intent is unknown/ambiguous, show no specific cue. If Product insists on
   a placeholder, the maximum safe fallback is: “Use your familiar fueling routine.”

Morning/fasted handling is deliberately asymmetric: a prolonged or quality workout receives the
same **Start fed** or **Plan fuel during** action; a short easy workout receives no recommendation
for or against fasting. Hito must never promote fasting for fat loss, body composition, metabolic
adaptation, or superior training. Deliberate fasted/low-carbohydrate training requires a later human
coaching decision and is outside this product cue.

Post-run recovery timing is also outside the smallest first version. It should return only if
Product later establishes a distinct user problem such as two demanding sessions in close
succession and obtains a separate coaching criterion.

#### Weather / Conditions

| Cue | Eligibility and required inputs | Recommended action boundary |
| --- | --- | --- |
| **Official hazard / thunder** | Outdoor workout plus a time- and place-matched official warning or approved thunder/lightning signal. Requires the target workout window, source timestamp/freshness, and official status. | Highest priority. Tell the runner to check/follow official local alerts; if thunder is heard, get indoors and wait at least 30 minutes after the last thunder. Never present Hito as a live all-clear system. |
| **Heat preparation** | Outdoor workout plus an elevated **locally validated activity heat-risk** category or official heat alert. Requires duration, target time, air and apparent temperature, and the approved heat indicator; humidity is supporting input only when required by that indicator. | One preparation action: plan shade/cooler timing and fluid access, and use established stop-safety copy. Do not change pace targets, duration, schedule, or prescription. Raw temperature or apparent temperature alone may be shown as fact but must not create a universal “safe/unsafe” threshold. |
| **Rain / gust preparation** | Outdoor workout plus time-matched precipitation or gust conditions above Product-approved practical thresholds. Requires precipitation type/probability/intensity and sustained wind/gust. Route or terrain is unknown, so no surface-specific claim is allowed. | Neutral preparation only: familiar visibility, grip, or weather-layer check. No cancellation instruction from ordinary rain/wind data. |
| **UV protection** | Outdoor daylight workout and time-matched UV Index at least 3. Requires UV at the workout window, not only the daily maximum. | One brief sun-protection reminder using official public-health language. It yields to any higher-priority hazard/heat/air cue. |
| **Air-quality context** | Outdoor workout plus a regionally authoritative AQI category and official category wording. Requires index system/region, category, dominant pollutant where required by that system, target time, source/freshness, and sensitive-group status only if explicitly supplied. | Show the official category and link/route to local guidance. Without runner sensitivity context, do not turn a “sensitive groups” category into a personalized medical instruction. At a category unhealthy for everyone, an official-guidance action may take priority over routine conditions. |

Conditions precedence is: official immediate hazard, air/heat category with public-health action,
rain/wind preparation, then UV. Only the single highest-priority action is shown. Other approved
values may remain as compact facts; they do not generate additional advice.

### Smallest Weather Facts Worth Considering Later

Minimum baseline inputs, independent of provider choice:

1. Workout target local time/window, whether it is outdoors, forecast/observation valid time, and
   source update/freshness. Without these, show weather unavailable rather than mismatched advice.
2. Air temperature plus apparent temperature. Use them as facts; do not infer exercise safety from
   an unvalidated universal threshold.
3. Precipitation type, probability, and practical intensity for the workout window.
4. Sustained wind and gust speed. Direction is not required for the first cue set.
5. An official severe-weather/thunder status where trustworthy regional coverage exists.
6. Time-matched UV Index and a regionally authoritative AQI category only when Product chooses to
   support those public-health surfaces and their attribution/failure rules.

Relative humidity is not independently actionable when a validated apparent-temperature/WBGT/heat
risk input already incorporates it. Request it only as a transparent supporting component of the
chosen heat interpretation. The first version does not need barometric pressure, dew point, cloud
cover, a generic weather icon/description, wind direction, visibility, precipitation accumulation,
historical normals, pollen, or raw pollutant concentrations. Any of these should enter scope only
after Product approves a concrete runner action they can support. WBGT or a local heat-risk category
is more exercise-relevant than inventing a Hito heat formula, but availability and geographic
validity are later Backend research questions, not this review's provider decision.

### Abstention And Language Boundaries

Show **no cue** when the workout is indoors; workout duration/intent is missing; start/location/time
cannot be matched; conditions are stale or unavailable; ordinary conditions do not cross an
approved action threshold; a generic action would conflict with an existing individualized note;
or a known sensitive context makes generic advice misleading.

Use a **neutral preparation reminder** only when demand/risk eligibility is known but personalization
is not: familiar food, practiced fuel, fluid access, familiar gear, or official local guidance. Do
not fill the gap with generated text or a probability-based “coach” opinion.

The copy must never:

- diagnose injury, heat illness, dehydration, hypoglycemia, REDs, or any medical condition;
- prescribe treatment, supplements, caffeine, electrolytes, calories, macro targets, or body-weight
  change;
- claim fat loss, metabolic superiority, or body-composition benefit from fasted training;
- declare a session safe, guarantee performance, or hide forecast/source uncertainty;
- use precise pace/HR adjustments or silently edit the workout because of food or weather; or
- override symptoms, official alerts, a clinician/dietitian plan, allergies/intolerances, religious
  practice, or the runner's established tolerance.

Food-specific and dose-specific guidance can be unsafe or misleading with allergies, GI disorders,
diabetes/glucose-management needs, pregnancy/postpartum, eating-disorder/REDs history, prescribed
diets, medications, or renal/cardiac conditions. Fixed hydration advice can also be unsafe. Hito
should not collect sensitive health data merely to make this small cue system appear personalized;
Product must decide whether to exclude those cases by scope, accept an explicit “follow my existing
plan” override, or commission a separate qualified-clinician review.

### Workout-Day Information Budget And Placement

- Place one compact **Workout context** block after the core workout identity/prescription and before
  optional notes. It must never interrupt steps or resemble a plan change.
- Maximum two rows: **Fueling** first and **Conditions** second. Each row has one label and one action
  sentence (two visual lines maximum). Omit a non-qualifying row rather than fill it with generic
  advice.
- Conditions may show at most three compact factual values relevant to the chosen action, plus a
  visible valid/update time and source/official-guidance affordance. Do not expose an internal score.
- When several condition rules qualify, show one highest-priority action. No carousel, generated
  explanation, expandable coaching lesson, recovery module, or competing “coach” voice.
- The stored workout identity, duration, intensity, steps, schedule, completion, and activity truth
  remain unchanged. The block is contextual and dismissible/ignorable, not a confirmation gate.

### Exact Unanswered Product Questions

1. Is the initial audience explicitly generally healthy adults, and what non-medical override or
   exclusion is offered for an individualized clinician/dietitian plan?
2. Does phase one ask an optional fueling-timing choice? If yes, are the only options “normal meal,”
   “close to start,” “overnight/no meal,” and “not sure,” and how is that choice described without
   persisting sensitive diet history?
3. Does Product accept the recommended demand thresholds: over 60 minutes or quality/race for
   **Start fed**, and over 90 minutes for **Plan fuel during**? Which canonical workout intents count
   as quality/race?
4. Does an existing workout-specific fueling note always suppress the generic nutrition row? The
   recommendation is yes.
5. Is **fluid access** part of the one nutrition action or the one conditions action when both could
   qualify? It must not become a third category.
6. Are conditions initially factual only, or may they include official public-safety actions for
   thunder, heat, UV, and air quality? Which countries/regions and official index systems are in
   scope?
7. What workout-time window and freshness limit make conditions valid, and what happens when the
   runner has flexible timing rather than a planned start? The recommendation is factual unavailable
   or no cue, never an all-day inference.
8. How does the runner mark an indoor workout, and does that suppress the conditions row entirely?
9. Which Product-approved thresholds make rain/wind actionable, and are cold, snow/ice, trail
   exposure, and low visibility intentionally deferred?
10. Does Product accept one action per category, the stated precedence, and omission of ordinary
    short/easy-run fueling text?
11. What final source attribution, localization, units, and emergency/symptom wording receive legal
    or qualified health review before release?

### Future Ownership Boundaries

- **PRODUCT — next owner:** decide the audience, allowed runner input, thresholds, rule precedence,
  health/safety scope, markets, information budget, and approved copy boundary. Product then decides
  whether discovery is sufficient to route technical feasibility; this receipt does not dispatch it.
- **BACKEND — later feasibility owner:** evaluate provider/location/privacy/freshness constraints and
  propose one canonical factual input and deterministic cue-output contract with explicit
  unavailable/stale states. It must preserve the invariant that conditions cannot mutate plan,
  schedule, prescription, completion, or activity truth. This is an ownership boundary, not a
  technical design or provider selection.
- **FRONTEND, Product lane — later presentation owner:** render only the approved canonical facts and
  selected cue, source/freshness/unavailable state, priority, and two-row information budget. It must
  not infer location, thresholds, safety, fueling eligibility, or plan changes locally.
- **RUNNING COACH — later review only if Product changes the rule/copy:** verify final coaching wording
  and abstention behavior. It does not select technical owners or implement.

### Validation Inventory

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Role and evidence boundary | Repository instructions, role file, skill, canonical item | Passed | Read before the only write; no product/runtime source was inspected or changed. |
| Nutrition criteria | Generally healthy adult runner; short/easy, quality, prolonged, and explicit fasted examples | Passed for discovery | Deterministic precedence and abstention rules above; supported by cited position/consensus/review literature. |
| Safety/language boundary | Sensitive health contexts, fake precision, body composition, universal fasting | Passed for discovery | Explicit suppress/abstain list and prohibited claims above. |
| Conditions criteria | Heat, thunder, rain/wind, UV, air quality, stale/unknown context | Passed for discovery | One-action precedence, authoritative-index requirement, and no-all-clear/no-plan-mutation invariant above. |
| Product information budget | Workout-day context | Passed for discovery | At most two rows and one action per category; nutrition first. |
| Technical/browser/provider validation | Not in Running Coach scope | Not run — required omission | No code, browser QA, weather API/provider, SQL, hosted project system, or user data was used; no implementation or Global QA claim is possible. |

### Discovery Outcome

The Running Coach discovery slice is complete and the item remains `ready` for Product decisions.
There is no implementation, technical feasibility, provider selection, copy approval, browser proof,
or Global QA Acceptance. **Recommended next owner: PRODUCT. Blockers: the eleven Product questions
above must be decided before Backend feasibility or Frontend implementation is routed.**

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the Running Coach discovery receipt in this canonical item. Decide the eleven listed Product
questions, especially adult-audience scope, fueling inputs and thresholds, existing-note precedence,
weather market/safety scope, freshness, and the two-row information budget. Do not dispatch Backend
or Frontend until those decisions make one bounded feasibility owner and invariant unambiguous.
Running Coach recommends nutrition first, deterministic rules only, explicit abstention, and no
weather-driven mutation of plan, schedule, workout prescription, completion, or activity truth.
```
