# Hito Everyday Runner Positioning Research

Notion Task: [HITO-286 — Define Hito Positioning for Everyday Runners](https://app.notion.com/p/Define-Hito-Positioning-for-Everyday-Runners-3cafe5f58cf58106a4e9f9312a57ce91)

Decision date: 2026-08-28  
Research owner: MARKETING MANAGER  
Mode: Tracked research; no public copy, pricing, campaign, provider, analytics, UI, or product change
is approved by this document.  
Hito source receipt: `main` and `origin/main` at
`83d89c4bdf4f3c2dc063bf48588b21cb17ba5566`. Current-source inspection only; this research did not
perform browser, hosted-production, billing, provider, or release verification.

## Research Decision

Hito should not position itself as another personalised plan for every runner. That claim is crowded,
and current competitors already attach it to adaptive training, expert coaching, audio guidance,
wearable sync, beginner programmes, or a free service.

The recommended primary direction is **Run like you have a life**: a calm, runner-owned calendar for
schedule-fragmented adults who have a real running goal, some ability to run, and little appetite for
performance theatre. The product job is not to make imperfection inspirational. It is to make the
next run clear, let a runner change the calendar when life changes, preserve what actually happened,
and help them continue without inventing coaching authority.

The recommended alternative is **One week at a time**: a quieter, clarity-led position around the
current week, the next workout, and factual progress. It is more defensible from current Hito source,
but less emotionally distinctive and may be harder to monetise.

This is a research recommendation for PRODUCT, not approved public positioning. The strongest
initial audience is narrower than “ordinary people” or “everyone”:

> Schedule-fragmented adult returners and inconsistent runners who can already complete at least a
> short easy run or run-walk session, want a concrete goal, and prefer private continuity and calendar
> control to public competition or elite-coach identity.

Absolute beginners, clinical return-to-running cases, and users who need live audio or wearable-led
adaptive coaching are not the first defensible audience. Hito may serve them later, but a gentle
run-walk progression, safety boundary, and supporting proof must exist before that promise becomes
public.

## Evidence Method And Limits

- **Direct evidence** below means current first-party product pages, official support, official app
  storefronts, current Hito source/current documents, or primary public research. All external
  sources were accessed on **2026-08-28**.
- **Inference** means the implication for Hito. It is deliberately kept separate from what a source
  says.
- Storefront prices are regional snapshots and can change. A storefront SKU is a category price
  anchor, not evidence that a Hito customer will pay the same amount.
- No Hito customer interviews, lost-user interviews, pricing study, acquisition data, campaign
  test, or market-size estimate was available. The segments and willingness-to-pay conclusions are
  falsifiable hypotheses, not measured Hito demand.
- The 2024 São Paulo research is current and useful for a Brazilian direction but is not national.
  The 2015 IBGE evidence is national but old. UK evidence is used directionally and must not be
  projected onto Brazil as if it were locally measured.

## Current Hito Position: Direct Evidence Versus Inference

### Direct Current Evidence

- The canonical project promise is to help a runner understand the current week, open today's
  workout quickly, and stay oriented without fake coaching authority
  ([`docs/context.md`](../../context.md)).
- The accepted product is a runner-owned Calendar: a reviewed source proposes initial placement,
  confirmation creates Calendar workouts, and later Add, Edit, Move, Copy, Clear, result, and
  evidence actions belong to each workout rather than to a controlling plan container
  ([`docs/current-product.md`](../../current-product.md),
  [`docs/current-system.md`](../../current-system.md)).
- The current public-facing source copy is generic and login-first: “Running plan”, “Weekly plan”,
  and “Open the runner service, plans, calendar, and workout logging”
  ([`src/routes/__root.tsx`](../../../src/routes/__root.tsx),
  [`src/routes/index.tsx`](../../../src/routes/index.tsx),
  [`src/routes/hub.tsx`](../../../src/routes/hub.tsx)). There is no differentiated public marketing
  proposition or public price in the inspected source.
- Current main contains English and Brazilian Portuguese UI locale handling, but this research did
  not verify a hosted deployment or translation quality for a marketing campaign
  ([`src/lib/ui-locale.ts`](../../../src/lib/ui-locale.ts),
  [`src/lib/ui-locale-messages.ts`](../../../src/lib/ui-locale-messages.ts)).
- The product contract explicitly says there is no live Stripe billing, pricing, or subscription UI,
  and that provider sync and stream-dependent aerobic metrics remain unavailable
  ([`docs/current-product.md`](../../current-product.md),
  [`docs/current-system.md`](../../current-system.md)).

### Hito Inference

Hito's current product behaviour is more distinctive than its current public wording. “Running plan”
places Hito in the most crowded category, while the runner-owned Calendar, explicit Review/Confirm,
manual result path, and factual evidence boundaries support a more specific promise: continuity and
calendar agency without performance-status pressure. This is the useful seam to test.

Hito must not claim automatic adaptation, live coaching, wearable sync, injury prevention, a
guaranteed outcome, or affordability. It should also avoid claiming to be uniquely flexible: Runna,
Garmin, adidas Running, and Coopah all make direct flexibility or adaptation promises.

## Competitor And Category Map

| Product                                   | Direct primary evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Price/access evidence                                                                                                                                                                                                                                                                                                                                                                                                            | Hito inference — not a source claim                                                                                                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strava**                                | Strava calls itself “the app for active people” and frames progress as social: new habits through personal bests, community, goals, routes, analysis, challenges, and leaderboards. Its BR storefront also says it is for professional athletes and beginners. [About](https://press.strava.com/about); [subscription features](https://www.strava.com/features); [BR App Store](https://apps.apple.com/br/app/strava-corrida-pedal-trilha/id426826309) (accessed 2026-08-28).                                                                                                                                                                           | Official US price is US$11.99/month or US$79.99/year. The BR storefront shows subscription SKUs including R$22.90 and R$149.90, but not every scraped SKU states its billing period. [Pricing](https://www.strava.com/pricing); [BR App Store](https://apps.apple.com/br/app/strava-corrida-pedal-trilha/id426826309) (accessed 2026-08-28).                                                                                     | Social proof, broad activity capture, competition, routes, and analysis are Strava's territory. Hito can contrast private calendar continuity with status mechanics, but must not pretend Strava excludes beginners.                  |
| **Runna**                                 | “Running made simple” is paired with tailored plans, elite coaching, device sync, progress, beginners through elite athletes, and goals from first 5K to marathon. Its 2026 New to Running and Return to Running plans explicitly promise gentle progression, confidence, flexible duration, schedule changes, and continuing after missed workouts or time away. [Home](https://www.runna.com/en-gb); [2026 beginner plans](https://www.runna.com/en-gb/press/runna-introduces-updated-beginner-running-plans-for-2026); [plan catalogue](https://support.runna.com/en/articles/15443877-how-to-create-a-training-plan-in-runna) (accessed 2026-08-28). | US list price is US$19.99/month or US$119.99/year after a seven-day trial. The BR storefront lists R$39.90 and R$229.90 Premium SKUs, without a billing-period label beside each amount in the scraped list. [Pricing](https://www.runna.com/en-gb/pricing); [BR App Store](https://apps.apple.com/br/app/runna-treinador-de-corrida/id1594204443) (accessed 2026-08-28).                                                        | Generic personalisation, beginner support, return-to-running, and “fits real life” are not open territory. Hito needs a sharper distinction: the runner owns the Calendar and continuity does not require elite-coach or PB identity. |
| **Nike Run Club**                         | NRC offers six training plans, roughly 300 audio-guided runs, tracking, challenges, community, safety sharing, and wearable/Strava sync. Nike says the app helps people from a first run to a marathon and is free to Nike Members. [Nike newsroom](https://about.nike.com/en/newsroom/releases/nike-run-club-app-new-features); [BR App Store](https://apps.apple.com/br/app/nike-run-club/id387771637) (accessed 2026-08-28).                                                                                                                                                                                                                          | Free in the Brazilian App Store; no paid plan is shown. [BR App Store](https://apps.apple.com/br/app/nike-run-club/id387771637) (accessed 2026-08-28).                                                                                                                                                                                                                                                                           | Hito cannot win a broad “free guidance and motivation for all levels” claim. A paid Hito offer must solve continuity/control better than a free guided-run library.                                                                   |
| **adidas Running**                        | adidas promises tracking, statistics, challenges, leaderboards, community, training plans, and personalised support from first fitness steps to a marathon; feedback can adapt the plan. Its BR storefront speaks to people starting, returning after a pause, or pursuing a next goal. [Running app](https://www.adidas.com/us/running-app); [BR App Store](https://apps.apple.com/br/app/adidas-running-rastreador-gps/id336599882) (accessed 2026-08-28).                                                                                                                                                                                             | The BR app download is free. Official support describes Premium as paid and says upper adiClub levels may receive it free, but the inspected public official pages do not expose a current BR list price. [Premium support](https://www.adidas.com/us/help/us-adidas-runtastic/what-is-adidas-runtastic-premium); [BR App Store](https://apps.apple.com/br/app/adidas-running-rastreador-gps/id336599882) (accessed 2026-08-28). | “Start, return, build habits, stay consistent” is already explicit competitor copy. Hito should not depend on those words alone; calendar ownership and low-pressure factual continuity must do the differentiating work.             |
| **Garmin Coach**                          | Garmin offers free dynamic plans, personalised by goal, weeks, days per week, performance, recovery, and compatible-device metrics. It covers first 5K through performance goals, and some plans provide a confidence score. [Garmin Coach](https://www.garmin.com/en-US/blog/fitness/which-garmin-coach-is-right-for-you/); [technology overview](https://www.garmin.com/en-GB/garmin-technology/garmin-coach/) (accessed 2026-08-28).                                                                                                                                                                                                                  | Plans are free in Garmin Connect, but adaptive execution and sync depend on compatible Garmin products. [Garmin Coach technology](https://www.garmin.com/en-GB/garmin-technology/garmin-coach/) (accessed 2026-08-28).                                                                                                                                                                                                           | Hito cannot make a wearable-led adaptive claim. It can test the opposite convenience: a useful, device-optional Calendar with manual truth, while treating explicit file evidence as optional.                                        |
| **NHS Couch to 5K**                       | The NHS offers a simple, free nine-week programme for absolute beginners, three sessions per week, run-walk audio guidance, no pressure to keep up, and permission to take longer. It includes direct safety advice and GP escalation. [Programme](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/); [full plan](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/) (accessed 2026-08-28).                                                                                                                                                                                    | Free app, web plan, and printable PDF; UK public-health scope.                                                                                                                                                                                                                                                                                                                                                                   | A gentle absolute-beginner promise requires real run-walk content and safety proof. Hito does not earn it merely by selecting “new to running” in onboarding.                                                                         |
| **None to Run**                           | None to Run explicitly targets people who get out of breath in the first 30 seconds. It promises shorter intervals, gentler weekly jumps, time rather than distance, no pace pressure, repeatable wins, and repeating weeks without shame. [Home](https://www.nonetorun.com/); [app](https://www.nonetorun.com/app) (accessed 2026-08-28).                                                                                                                                                                                                                                                                                                               | Seven-day trial, then US$6.99/month or US$39.99/year; prices vary by country. [Home](https://www.nonetorun.com/) (accessed 2026-08-28).                                                                                                                                                                                                                                                                                          | “For people who are not runners” and “no shame” are already credible, product-backed claims. Hito should not lead with absolute beginners until it can show an equally credible on-ramp.                                              |
| **C25K by Zen Labs**                      | The official C25K app uses alternating walking/running and a modest schedule for beginners. The BR storefront is English-only. [C25K](https://c25k.com/); [BR App Store](https://apps.apple.com/br/app/c25k-5k-running-coach-map/id485971733) (accessed 2026-08-28).                                                                                                                                                                                                                                                                                                                                                                                     | Free download with BR purchases including R$12.90 ad removal, R$29.90 Pro, a R$27.90 monthly Zen pass, and a R$499.90 annual Zen pass. [BR App Store](https://apps.apple.com/br/app/c25k-5k-running-coach-map/id485971733) (accessed 2026-08-28).                                                                                                                                                                                | The beginner category has both free and low-friction paid anchors. Portuguese quality and continuation beyond a fixed programme may be opportunities, but neither is proven Hito demand.                                              |
| **Coopah**                                | Coopah directly claims training that bends around real-life interruptions, easy rescheduling, first-timer walk/run plans, “coaching without ego”, and “progress over perfection”. It combines adaptive plans, performance goals, AI/human coaching, and device sync. [Features](https://coopah.com/coopah-features/); [About](https://coopah.com/about-us/); [download FAQ](https://coopah.com/download/coopah/) (accessed 2026-08-28).                                                                                                                                                                                                                  | Official home shows £14.99/month or £79.99/year after a free trial. [Home](https://coopah.com/home/) (accessed 2026-08-28).                                                                                                                                                                                                                                                                                                      | This is the closest direct threat to the starting hypothesis. “Real life”, humility, and flexibility are insufficient differentiation unless Hito proves a different ownership model and simpler, calmer experience.                  |
| **parkrun — adjacent cultural benchmark** | parkrun is not training software. Its official material says events are free, participation may be walking, jogging, running, volunteering, or spectating, clothing and speed do not matter, and a tail walker means nobody finishes last. [parkrun magazine/about](https://magazine.parkrun.com/about/) (accessed 2026-08-28).                                                                                                                                                                                                                                                                                                                          | Free community event where available.                                                                                                                                                                                                                                                                                                                                                                                            | This is a strong inclusion and tone benchmark: belonging can be specific without calling people lesser. Hito should learn from it, not claim to replace a real community.                                                             |

### Category Decision

The category is not leaving beginners, returners, flexibility, free guidance, or humble coaching
untouched. The credible gap is narrower:

1. a runner-owned Calendar rather than a coach-owned plan container;
2. clear recovery from an imperfect week rather than a streak, leaderboard, or automatic rewrite;
3. factual private history without requiring a social identity or wearable ecosystem; and
4. a tone that punctures perfect-training culture while respecting the person's goal.

## Audience Evidence

### Direct Primary Evidence

- A 2024 Fundação Seade survey for São Paulo state reports that 43% had not practised physical
  activity; non-participation was higher among women, older people, and people with lower education
  and family income. Reported reasons were health problems (35%), lack of time (29%), no place (15%),
  and not liking it (11%). For ages 30–44, time was the leading reason. This is current but
  state-level evidence, not Brazil-wide
  ([Seade, 2024 PDF](https://spsocial.seade.gov.br/wp-content/uploads/sites/29/2024/11/SP-Social-percepcao-populacao-estado-sao-paulo-pratica-atividades-fisicas.pdf),
  accessed 2026-08-28).
- The latest national IBGE sports supplement remains old but directionally useful: in 2015, lack of
  time (38.2%) and lack of interest/desire (35%) were the leading reasons not to practise sport;
  lack of time reached 51.6% among ages 25–39. Participation rose sharply with income, from 31.1% in
  the lowest listed bracket to 65.2% at five or more minimum wages
  ([IBGE release](https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/15128-falta-de-tempo-e-de-interesse-sao-os-principais-motivos-para-nao-se-praticar-esportes-no-brasil),
  accessed 2026-08-28).
- Brazil's Vigitel 2024 telephone-survey time series reports 33.3% insufficient physical activity
  under its combined work, transport, and leisure definition. Its sample covers adults in the 26
  state capitals and Federal District, so it is a surveillance indicator, not a national
  running-app demand measure
  ([Ministry of Health Vigitel 2006–2024 PDF](https://svs.aids.gov.br/daent/cgdnt/vigitel/vigitel-2006-2024-brasil.pdf),
  accessed 2026-08-28).
- Sport England's 2024–25 Active Lives survey shows persistent inequality: 53.8% of the least
  affluent adults were active versus 73.2% of the most affluent; women, disabled people, people with
  long-term conditions, and older adults were also less likely to be active. This is England, not
  Brazil, and is used only as directional evidence that barriers compound
  ([Sport England summary](https://www.sportengland.org/news-and-inspiration/england-getting-more-active-not-everyone-benefiting),
  accessed 2026-08-28).
- Sport England's women-specific research reports practical and emotional barriers together: 33%
  too tired/low energy, 31% too little time, 29% too little motivation, 41% worried about not being
  fit enough, and 32% worried about what others think. It supports a no-judgement design hypothesis,
  but it must not be generalised to every gender or to Brazil without local research
  ([This Girl Can research summary](https://www.sportengland.org/news/girl-can-you-launches), accessed
  2026-08-28).

### Segment Decision

#### Primary: schedule-fragmented returners

Adults with a previous running habit or enough baseline for a short easy run/run-walk, but an
unpredictable work, care, weather, travel, or social calendar. They want a concrete distance or event
goal without adopting a performance-first identity.

- **Jobs:** know the next run; protect unavailable days; move or revise a workout; recover after a
  missed week; retain results and context; see whether they are continuing without public comparison.
- **Anxieties:** one missed run breaks the plan; restarting erases history; the product assumes a
  perfect week; coaching language makes them feel behind; an auto-renewing subscription becomes
  another obligation.
- **Why Hito may fit:** current Calendar ownership, scheduling preferences, explicit actions, manual
  results, and factual progress all support this job.
- **Exclusion inside the segment:** a runner seeking live pace prompts, automatic recovery decisions,
  or medical return-to-running advice needs a different current product.

#### Secondary: intimidated starters with a minimum safe baseline

Adults who do not identify as athletes, dislike competitive fitness culture, and need an
understandable first goal. Hito currently exposes a “new to running” level, but that is not enough to
prove a gentle absolute-beginner programme.

- **Jobs:** choose a credible starting point; understand run/walk or effort instructions; complete a
  first week without comparison; repeat or slow down without shame.
- **Anxieties:** being the slowest; not looking like a runner; injury; jargon; public visibility; a
  programme moving too quickly.
- **Admission condition:** a Running Coach-reviewed gentle progression, explicit safety boundary,
  and user proof must precede public absolute-beginner messaging.

#### Secondary: private, low-drama maintainers

Adults who already run casually and want structure or continuity without a race, personal best,
social feed, or deep dashboard.

- **Jobs:** keep two or three runs in a real calendar; record what happened manually; see simple
  factual continuity; avoid buying hardware.
- **Anxieties:** every app turns maintenance into performance; free tools are noisy; paid coaching is
  more than they need.
- **Admission condition:** Hito's current plan creation is distance/target-date led. A maintenance or
  consistency goal is a potential product decision, not a shipped capability.

### Explicit Audience Exclusions

The recommended first position is not for:

- performance maximisers primarily buying PB optimisation, elite coaching, race prediction, or live
  pacing;
- users primarily seeking a social network, club discovery, leaderboards, route discovery, or public
  validation;
- clinical injury rehabilitation, postpartum return, or any user needing medical judgement;
- users who require automatic device sync, live GPS/audio coaching, recovery biometrics, or
  stream-dependent aerobic metrics;
- minors until age, consent, safety, and account policy are explicitly accepted; or
- “people who drink beer” as a segment. A normal social life is context, not an alcohol identity, and
  no copy should imply that alcohol is healthy, required, harmless, or a training tool.

## Willingness-To-Pay Constraint

Direct category anchors range from free NRC, NHS Couch to 5K, parkrun, and free tiers to paid
beginner/planning products: None to Run at US$39.99/year, Strava at US$79.99/year, Coopah at
£79.99/year, and Runna at US$119.99/year. Brazilian storefronts show free NRC, paid C25K options,
Strava subscription SKUs, and Runna Premium SKUs.

The inference is not “everyday runners will only pay a little.” It is:

1. basic plans, tracking, guided runs, and community have strong free substitutes;
2. lower-income participation gaps make an expensive mandatory subscription risky for an inclusion
   position;
3. premium pricing would need proof that Hito's continuity, calendar control, and trusted history
   solve a problem the free products do not; and
4. there is currently **no evidence-backed Hito price, free tier, trial policy, or BRL willingness to
   pay**.

PRODUCT must not choose a price from competitor arithmetic. It needs direct Brazilian research on
monthly versus annual preference, acceptable free-core boundary, card-required trial aversion,
household budget competition, device ownership, and what continuity outcome feels worth paying for.

## Current Capability Inventory

These are implemented current-main source capabilities that can support a positioning decision.
They are not a hosted-production acceptance receipt, and the marketing wording remains unapproved.

| Current capability                                              | Current source evidence                                                                                                                                                                                                                                                                                                       | Defensible everyday-runner value                                                                            | Claim limit                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Saved weekly Calendar and today's workout                       | [`docs/context.md`](../../context.md); [`src/routes/index.tsx`](../../../src/routes/index.tsx); [`src/components/TodayHero.tsx`](../../../src/components/TodayHero.tsx); [`src/components/Calendar.tsx`](../../../src/components/Calendar.tsx)                                                                                | Reduces “what do I do today?” effort and keeps the current week visible.                                    | Do not call this live coaching or automatic adaptation.                                                  |
| Baseline and availability preferences                           | [`src/components/onboarding/QuickSetupPlanSetupSections.tsx`](../../../src/components/onboarding/QuickSetupPlanSetupSections.tsx); [`src/components/onboarding/TrainingPreferenceFields.tsx`](../../../src/components/onboarding/TrainingPreferenceFields.tsx); [`src/routes/settings.tsx`](../../../src/routes/settings.tsx) | A runner can state level, weekly ceiling, fixed rest days, and preferred long-run day.                      | These are plan-creation defaults; they do not automatically rewrite existing Calendar workouts.          |
| Explicit preview, Review, and Confirm                           | [`docs/current-product.md`](../../current-product.md); [`src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`](../../../src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx)                                                                                                                                  | Avoids silent schedule mutation and lets the runner inspect a proposal before it becomes Calendar truth.    | Do not imply that every imported/AI path has been re-verified in production by this research.            |
| Runner-owned workout actions                                    | [`docs/current-product.md`](../../current-product.md); [`src/lib/runner-calendar-snapshot.ts`](../../../src/lib/runner-calendar-snapshot.ts); [`src/components/Calendar.tsx`](../../../src/components/Calendar.tsx)                                                                                                           | Add, Edit, Move, Copy, and Clear support calendar agency instead of plan obedience.                         | Operation-specific safety rules still restrict protected states; “move anything anytime” would be false. |
| Manual result and context                                       | [`src/lib/workout-log-actions.ts`](../../../src/lib/workout-log-actions.ts); [`src/components/CompletionPanel.tsx`](../../../src/components/CompletionPanel.tsx)                                                                                                                                                              | Completed, partial, or skipped truth, RPE, notes, and body notes let users keep continuity without a watch. | This is factual logging, not diagnosis or performance coaching.                                          |
| Optional Garmin FIT/ZIP evidence and factual comparison         | [`docs/current-system.md`](../../current-system.md); [`src/components/CompletionPanel.tsx`](../../../src/components/CompletionPanel.tsx)                                                                                                                                                                                      | A runner may compare a saved workout with explicit file evidence while manual truth remains separate.       | No Garmin/provider sync; only explicit upload. Do not promise universal devices or aerobic metrics.      |
| Activity History and factual Progress                           | [`src/routes/progress.tsx`](../../../src/routes/progress.tsx); [`src/components/progress/ActivityHistoryPanel.tsx`](../../../src/components/progress/ActivityHistoryPanel.tsx); [`src/components/progress/FactualProgressPanel.tsx`](../../../src/components/progress/FactualProgressPanel.tsx)                               | Preserves what happened and shows supported facts without a universal readiness score.                      | Gate 5 detailed aerobic metrics remain unavailable; missing data must remain missing.                    |
| English and Brazilian Portuguese product locale in current main | [`src/lib/ui-locale.ts`](../../../src/lib/ui-locale.ts); [`src/lib/ui-locale-messages.ts`](../../../src/lib/ui-locale-messages.ts)                                                                                                                                                                                            | Creates a source seam for bilingual product comprehension.                                                  | This research did not validate hosted availability, cultural tone, or complete marketing translation.    |

### Accepted Or Visible Direction That Is Not Positioning Proof

The active roadmap describes reviewable adaptive blueprint continuation as a later/accepted Product
direction with explicit confirmation and evidence boundaries
([active roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)).
Even where current main contains continuation source, this research has no browser, provider,
persistence, launch, or hosted acceptance. Do not use “adaptive coach”, “automatically gets you back
on track”, or equivalent public copy from this document.

## Potential Feature-Opportunity Ledger

Everything in this ledger is **potential**, not shipped, approved, prioritised roadmap work, or a new
Task. PRODUCT decides whether any item is admitted.

| Priority | Potential opportunity                                       | User problem / hypothesis                                                                                                                                    | Existing seam to reuse                                                                                           | Required decision and proof                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0**   | **Non-race goal modes: Return, Consistency, Keep Moving**   | Current distance/target-date goals may force performance framing onto returners and maintainers.                                                             | Existing goal intent, runner baseline, Review/Confirm, and Calendar materialisation.                             | PRODUCT defines goal semantics and success; RUNNING COACH validates safe content; test whether the target segment prefers these goals and understands the difference.                                        |
| **P0**   | **Missed-week recovery review**                             | A disrupted week can create guilt and manual clean-up. A bounded review could offer Keep, Move, Skip, or Rebuild-next-week choices without silent rewriting. | Existing per-workout Move/Clear/Edit, explicit review, history protection, and continuation evidence boundaries. | PRODUCT defines what may change; BACKEND owns safety/persistence; DESIGNER defines the decision flow; falsify if users prefer simple per-workout edits or if safe recovery requires invented coaching facts. |
| **P0**   | **True gentle start / return plan family**                  | “New to running” does not itself prove a safe, confidence-building run-walk progression.                                                                     | Existing level selection, structured WorkoutDocument, review, Calendar, and result truth.                        | RUNNING COACH defines progression and stop rules; PRODUCT defines eligible users; legal/safety review is required; validate with true beginners and returners before making the promise.                     |
| **P0**   | **Time-budgeted availability**                              | Days available do not fully express “I have 25 minutes Tuesday and 50 Saturday.”                                                                             | Existing weekday constraints, duration-based workout documents, and schedule review.                             | PRODUCT chooses whether time is a hard constraint or preference; BACKEND/coach prove feasible scheduling; test whether added setup effort improves confidence.                                               |
| **P1**   | **Continuity readback without streak punishment**           | Streaks can turn one miss into abandonment. A neutral readback could show “returned”, “kept two of three”, or “next run ready” without moral scoring.        | Existing factual result, week status, Activity History, and Progress contracts.                                  | PRODUCT defines factual language; DESIGNER tests comprehension; no invented consistency score. Falsify if users find it patronising or less motivating than a conventional streak.                           |
| **P1**   | **Device-optional core made explicit**                      | Budget-conscious runners may assume a watch is required.                                                                                                     | Existing manual result path plus optional FIT upload.                                                            | PRODUCT decides the public promise and packaging; FRONTEND Marketing implements only after acceptance. Verify that every promised core loop works without a wearable.                                        |
| **P1**   | **Plain-language workout mode**                             | Beginners/returners may understand the calendar but still feel excluded by workout taxonomy, pace, HR, or RPE language.                                      | Existing locale/message owner and structured workout readback.                                                   | PRODUCT and RUNNING COACH define what can be simplified without losing safety; DESIGNER tests EN and PT-BR comprehension; preserve access to full detail.                                                    |
| **P1**   | **Transparent affordability/package boundary**              | Free alternatives and subscription anxiety may block trial before value is experienced.                                                                      | Existing pre-billing entitlement foundation only.                                                                | PRODUCT chooses free-core/premium boundary and trial principles; pricing and financial owners validate BRL economics; legal reviews renewal/cancellation copy. No price is recommended here.                 |
| **P2**   | **Low-pressure reminders and return invitations**           | A missed run should not trigger escalating guilt notifications.                                                                                              | Existing Calendar dates and result state.                                                                        | PRODUCT defines consent, frequency, quiet hours, and factual trigger; DESIGNER tests tone. This needs notification/provider/privacy decisions and is not admitted.                                           |
| **P2**   | **Social-plan buffer without collecting lifestyle reasons** | Dinner, family, travel, work, or a beer can displace a run; the product only needs the schedule fact, not a moral explanation.                               | Existing Move/Clear and availability seams.                                                                      | PRODUCT decides whether any buffer is needed beyond recovery review. Do not collect alcohol use or promise health neutrality.                                                                                |

## Positioning Territories

### Territory 1 — Run Like You Have A Life — Recommended

- **Promise:** Keep a real running goal moving through an imperfect calendar. Know the next run, move
  it when life moves first, and preserve the truth of what happened.
- **Target:** Schedule-fragmented adult returners and inconsistent runners with a basic running
  baseline and a concrete goal.
- **Reason to believe:** Current-week orientation, availability preferences, explicit
  Review/Confirm, runner-owned Calendar actions, manual results, and factual history.
- **English sample:** **Run like you have a life.** “Know the next run. Move it when life moves first.
  Keep the history, skip the guilt.”
- **Brazilian Portuguese sample:** **Corra como quem tem uma vida.** “Veja o próximo treino. Mude
  quando a vida mudar primeiro. Guarde o histórico, não a culpa.”
- **Humour boundary:** Joke about perfect schedules, fitness theatre, entourage, jargon, and the idea
  that training owns the calendar. Never joke about a person's body, pace, childcare, job, income,
  disability, missed run, food, or alcohol consumption.
- **Risk:** Runna and Coopah already promise flexibility around real life. Without distinctive
  Calendar agency and recovery behaviour, this becomes copycat lifestyle language.
- **Evidence gap:** No Hito user evidence shows that calendar control outranks audio guidance,
  automatic adaptation, community, or price.
- **Falsifier:** Target users consistently see manual Calendar control as work, prefer a coach to make
  every recovery decision, or interpret the line as dismissing their goal.

### Territory 2 — Running Without The Performance Theatre

- **Promise:** Serious structure without requiring athlete identity, public competition, a personal
  brand, or perfect gear.
- **Target:** Intimidated starters and returners who want to run but do not identify with performance
  culture.
- **Reason to believe:** No social leaderboard in the current product, factual rather than universal
  scores, explicit missingness, estimated-HR boundaries, and a manual path that does not require a
  watch.
- **English sample:** **Running, minus the performance theatre.** “No podium. No personal brand. Just
  the next run.”
- **Brazilian Portuguese sample:** **Corrida sem teatro de performance.** “Sem pódio. Sem personagem.
  Só o próximo treino.”
- **Humour boundary:** Target performative conventions and jargon, not ambitious runners, people who
  love sharing, brands, clothing, pace, or ability.
- **Risk:** It can sound anti-running, anti-ambition, or smug. Nike, parkrun, Coopah, and None to Run
  already communicate inclusion in credible ways.
- **Evidence gap:** It is unknown whether non-athlete identity is a stable desired identity or merely
  a temporary anxiety before someone wants to call themselves a runner.
- **Falsifier:** The target finds the territory patronising/defeatist, or aspirational runner language
  produces higher trust and intent without increasing judgement.

### Territory 3 — One Week At A Time — Recommended Alternative

- **Promise:** Turn a long goal into one understandable week and one next run, with factual history
  when the week is over.
- **Target:** Returners and low-attention maintainers who are overwhelmed by long plans and dense
  dashboards.
- **Reason to believe:** This is closest to Hito's canonical current promise: current week, today's
  workout, Calendar orientation, and factual Progress.
- **English sample:** **One week at a time.** “Open Hito, see the next run, and get on with the rest of
  your day.”
- **Brazilian Portuguese sample:** **Uma semana de cada vez.** “Abra o Hito, veja o próximo treino e
  siga com o resto do dia.”
- **Humour boundary:** Lightly puncture dashboard overload and the fantasy of planning every future
  kilometre. Do not make cognitive load or limited time the user's fault.
- **Risk:** Calm may read as basic, generic, or low value; the territory can understate the value of
  planning and evidence.
- **Evidence gap:** No comprehension or pricing test shows that reduced cognitive load is a purchase
  driver.
- **Falsifier:** Users cannot distinguish Hito from a calendar/PDF, or the calm framing materially
  lowers perceived competence and willingness to pay.

### Territory 4 — Evidence Without Ego

- **Promise:** Record what actually happened and learn from supported facts without needing a
  leaderboard, social approval, or invented readiness score.
- **Target:** Private, data-curious returners who want history and feedback but dislike social-status
  mechanics.
- **Reason to believe:** Manual completed/partial/skipped truth, optional FIT evidence, factual
  plan-vs-run comparison, Activity History, supported Progress facts, and explicit unavailable
  states.
- **English sample:** **Your run happened even if nobody liked it.** “Facts from your run. No
  leaderboard required.”
- **Brazilian Portuguese sample:** **Sua corrida aconteceu mesmo sem curtida.** “Os fatos da sua
  corrida. Sem ranking obrigatório.”
- **Humour boundary:** Target validation mechanics, not people who enjoy community or sharing. Never
  imply that private runners are morally superior.
- **Risk:** It can feel anti-social or like an attack on Strava. Current evidence value is partly
  dependent on manual input or Garmin file upload and may feel technical.
- **Evidence gap:** It is unknown how many target users want factual private progress without social
  accountability, or whether they will do the logging work.
- **Falsifier:** Community/accountability is a leading job, manual evidence completion is low, or the
  territory is understood as lonely rather than calm.

## Recommended Direction And Why

Choose **Run like you have a life** for Product validation, with **One week at a time** as the safer
alternative.

The primary direction combines the strongest audience problem — time and competing life demands —
with Hito's most unusual current product seam — a runner-owned Calendar with explicit mutation and
history. It can welcome caregivers, workers, returners, and people with a normal social life without
making any of those identities the joke. It also gives humour a safe target: perfect-training
culture.

The recommendation is conditional. “Fits your life” alone is not distinct; competitors already own
it. The direction survives only if PRODUCT preserves the specific promise of runner calendar agency
and if user research shows that people value this agency more than fully automatic coaching.

Do not lead with “for people who hate running.” Some people dislike running; others dislike the
culture, their past experience, or the pressure. The stronger line respects the goal and rejects the
pretension. Also do not lead with beer. It can appear in a carefully reviewed supporting joke about
a normal calendar only after legal/safety and bilingual tone review, never as audience definition or
health reassurance.

## Exact Decisions Still Required

### PRODUCT

1. Accept or reject the primary audience: schedule-fragmented adult returners/inconsistent runners
   with a minimum running baseline and a concrete goal.
2. Decide whether the first public goal remains distance/event-led or whether Return, Consistency,
   and Maintain modes are admitted.
3. Define the truthful promise for a disrupted week: per-workout control only, a recovery review, or
   later evidence-bounded continuation. Never blur these into automatic adaptation.
4. Define the minimum beginner capability and explicit exclusions before using “new runner” or
   “anyone can start” publicly.
5. Decide whether private/no-leaderboard framing is a core proposition or only a supporting proof.
6. Accept one English/PT-BR territory for validation; no sample line in this document is approved
   public copy.

### Pricing And Commercial

1. Decide the free-core boundary relative to free NRC/C25K/Strava alternatives.
2. Run Brazil-specific willingness-to-pay research before choosing BRL monthly/annual pricing.
3. Decide whether a trial requires a card, how renewal/cancellation is communicated, and whether an
   inexpensive continuity tier can be economically supported.
4. Confirm entitlement, tax, refund, family/household, discount, and support policy before pricing is
   public.

### Legal And Safety

1. Review beginner, progress, health, injury, adaptation, and outcome language; no injury-prevention,
   medical, guaranteed-performance, or universal-suitability claim is supported here.
2. Define age/minor eligibility, consent, and account policy.
3. Define the escalation/stop language for pain, illness, pregnancy/postpartum, or return from injury
   if beginners/returners are later admitted.
4. Review alcohol-adjacent humour and ensure it neither encourages consumption nor reassures users
   about health/training effects.
5. Review subscription, trial, cancellation, privacy, notification, and evidence-data copy before
   any campaign or checkout.

### DESIGNER

1. Translate the accepted territory into a visual direction that shows varied real schedules and
   real runners without tokenism, body judgement, wealth signals, or athlete-costume parody.
2. Test whether humour reads as warm permission rather than mockery in English and Brazilian
   Portuguese.
3. Define hierarchy for promise, product proof, safety limits, and pricing transparency before
   FRONTEND Marketing implementation.

### Implementation And Validation

1. FRONTEND Marketing implements only an accepted public surface; no marketing UI is admitted by
   this research.
2. BACKEND/FRONTEND Product work is required only for Product-accepted opportunities; reuse Calendar,
   Result/Evidence, Progress, goal-intent, locale, and entitlement owners rather than creating a
   parallel marketing truth.
3. Before launch, verify accepted copy against current hosted behaviour in EN and PT-BR, signed-out
   and authenticated states, supported devices, manual/no-watch flow, availability restrictions,
   accessibility, and pricing/entitlement truth.
4. A minimum validation set should compare the primary and alternative territories with target
   returners in Brazil; include schedule-recovery task comprehension, emotional reaction, perceived
   competence, distinctiveness versus Runna/Coopah/NRC, and unaided price expectations. This is a
   validation recommendation, not a newly created Task or campaign.

## Product Handoff

MARKETING MANAGER recommends that PRODUCT decide whether to validate **Run like you have a life**
for schedule-fragmented returners, with **One week at a time** as the alternative. PRODUCT should
accept neither public copy nor feature priority until it resolves the audience floor, interrupted-
week behaviour, non-race goals, pricing research, and safety boundary above.

No product source, UI, pricing, campaign, analytics, provider, hosted state, or public messaging was
changed during the research phase. At its original handoff, no follow-up Task had yet been admitted.

## Product Decision Follow-Up — 2026-08-28

PRODUCT accepted interrupted-week recovery as the first required feature before expanding an
unmoderated everyday-runner positioning pilot. The accepted follow-up is
[HITO-287 — Interrupted-Week Recovery Review](../backlog/2026-08-28-hito-interrupted-week-recovery-review.md).

This decision does not approve public copy, pricing, non-race goal modes, an absolute-beginner plan,
time-budgeted availability, reminders, social features, wearable sync, or automatic adaptation. It
does not widen the existing first-user production launch gate. Those boundaries remain separate
Product decisions.
