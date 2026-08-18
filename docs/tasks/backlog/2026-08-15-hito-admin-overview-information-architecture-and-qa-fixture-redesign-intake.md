# Hito Admin Overview, Financial Model, And QA Fixture Redesign

Work Item ID: `2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign`
Status: in_progress
Type: Tracked
Priority: high
Owner: PRODUCT
Epic: owner-analytics-and-scenario-lab
Scope: Admin Analytics overview, financial decision model, scenario builder, and funnel readback at
`/admin/analytics`, beginning with accepted metric definitions, authoritative-input boundaries,
local QA-fixture contracts, and visual-design direction. It may grow only through recorded Product
decisions and separately owned implementation slices.
Archive Intent: Retain until the accepted overview and financial decision model, fixture contracts,
implementation slices, and their focused acceptance are recorded.

## Task

Define what an Hito operator must learn and safely act on from Admin Analytics before changing the
UI. Extend the current product-health readback with an internal, driver-based financial model that
can answer how price, paid/free user mix, acquisition, retention, provider usage, and operating costs
affect revenue, margin, cash burn, runway, and break-even over short and long horizons.

The financial surface is an internal decision-support tool. It is not public pricing UI, a billing
system, an accounting ledger, or permission to present forecasts as actual financial state. It must
accept explicit operator inputs, preserve their provenance, separate observed values from
assumptions, and compare a small number of named scenarios without creating a spreadsheet-as-runtime
or a second analytics source of truth.

Establish truthful local QA-fixture scenarios for fake users and synthetic financial inputs, then
replace the current decorative statistics-card treatment through existing Hito Design System owners
rather than adding another Admin-local card system.

## User Report

Ivan reported that Admin Analytics must become useful for real operating and pricing decisions. He
wants to provide the amounts paid for software, infrastructure, advertising, providers, and other
costs, then vary user price, paid and free user counts, conversion, retention, and usage to see:

- how much Hito spends and earns now, once authoritative actuals exist;
- what monthly price or paid-user count is required to cover the free tier and operating costs;
- what happens in short-term and long-term scenarios;
- when the business reaches operating break-even and how cash/runway changes; and
- which inputs and formulas produce every displayed result.

This extends the earlier request for an Admin Overview redesign, QA-fixture fake users, and a clear
definition of what the panel should show. No actual Hito revenue, cash, cost, price, conversion,
churn, or profitability value was supplied or calculated in this discovery.

## 2026-08-15 Owner Cockpit And Packaging Decision

Ivan accepted the paid launch baseline from
`2026-08-15-hito-paid-plans-usage-credits-and-cost-attribution`: one monthly subscription with a
direct included AI plan-generation allowance, expressed to runners in natural units, and no
separately sold coins. USD 5/month is a sandbox assumption, not an approved public price. Subscription
fair use, visible included credits, credit top-ups, one-time plan passes, and tiered subscriptions
remain financial-sandbox variants rather than discarded options.

The Admin redesign must serve Ivan as business owner, not only an analytics operator. The landing
surface should explain business health in approximately 30 seconds, show what changed and why, and
identify the next decision or missing source. Detailed product, subscription, cost, marketing,
cohort, and scenario evidence belongs in drill-down sections rather than an undifferentiated wall of
cards.

## 2026-08-15 CFO Discovery Preflight

- **Outcome:** add an evidence-backed financial decision model and scenario-builder contract to this
  existing item; do not create a second task, model, spreadsheet, dashboard, or runtime owner.
- **Evidence:** current Admin source, current product/system truth, the entitlement/capability
  foundation, and the external research below. Current Hito has product counts and lifetime
  capability counters, but no live billing, approved pricing, financial actuals, or cost attribution.
- **Owner and boundary:** CHIEF FINANCIAL OFFICER owns advisory metric/formula/scenario definitions.
  PRODUCT remains this item's lifecycle and product-decision owner. BACKEND owns any future persisted
  financial input, billing, entitlement, usage-cost, or read-model contract. FRONTEND/DESIGN SYSTEM
  own separately accepted presentation work. QA owns independent acceptance.
- **Existing seam to reuse:** `/admin/analytics` -> `AdminAnalyticsView` ->
  `admin-analytics.server.ts` Backend read model, plus the existing Hito Admin/Design System
  presentation owners. The financial model must extend an accepted backend-shaped contract rather
  than calculate authoritative financial truth in React.
- **New runtime artifacts:** none in this discovery. Any later persisted scenario/input shape must be
  justified and separately owned; the existing lifetime capability counter is not silently repurposed
  as a provider-cost ledger.
- **Simplification/removal:** keep product-health actuals separate from financial assumptions and
  remove decorative or unactionable overview metrics when Product accepts the final operator-question
  hierarchy. Do not keep an old and new formula for the same metric.
- **Focused proof:** bounded source inspection plus formula/provenance review. No runtime, fixture,
  browser, provider, hosted, billing, or financial acceptance occurred.

## Evidence

- [Current Funnel & Usage capture](./assets/2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake/admin-funnel-usage-current.png)
- Captured route: `/admin/analytics?section=funnel`; Light; desktop `1470x801`; 2026-08-15.
- `src/components/admin/AdminAnalyticsSummarySections.tsx` renders six metric cards plus four
  empty/count-list surfaces for the Funnel & Usage section.
- `src/components/admin/AdminAnalyticsPanels.tsx` renders `null` percentages as the literal
  `Unavailable` through the generic `MetricCard` value slot.
- `src/styles/shell-admin-analytics.css` owns `.hito-analytics-stat`: local bordered, rounded
  background cards. `KeyCountList` separately uses `hito-surface-flat`, which is also bordered.
- `src/lib/admin-analytics.server.ts` reads Backend-owned Supabase product truth and excludes local,
  admin, QA, disposable, and suspected-test users from real-user counts.
- `runner_entitlements` is a pre-billing Basic/Pro foundation. A missing row currently resolves as
  effective Pro, and there is no live subscription or approved price truth.
- `runner_capability_usage` stores `capability_key`, `period_key`, and `used_count`; the current Admin
  read model aggregates counts without provider/model/unit-cost attribution. Those counts cannot
  prove actual AI or provider spend.
- No accounting, bank, billing, payment settlement, advertising-attribution, payroll, invoice,
  provider-cost, tax, or FX source is connected to the current Admin view model.

### Source Snapshot Before Any Future Implementation

The CFO discovery inspected these pre-implementation source bytes. Any later implementation owner
must take a fresh snapshot because concurrent work may change them.

| Source                                                   | SHA-256 on 2026-08-15                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/lib/admin-analytics.ts`                             | `cfbc76aeace1d3f7baa4d324f6a8671660027e23da5ffe66668ce21524a5d15c` |
| `src/lib/admin-analytics.server.ts`                      | `ec598c465af6f50443f5ce858c2fd0a8e4db3bdf68c9f8032e220320c053bb4f` |
| `src/components/admin/AdminAnalyticsSummarySections.tsx` | `2ad532d023866cd8201188f767018b312d8f9443306648a99313f1144145afd9` |
| `src/components/admin/AdminAnalyticsPanels.tsx`          | `3e72220fac774fa200122e4e85da8c00e19d4d1c7ce92b703a055b305c75b88b` |
| `src/routes/admin.analytics.tsx`                         | `7d76f2cb41216f4dca830626983dab5ada1fd63526c305d1bcc1408c907e4e54` |

## External Research Synthesis

Research was performed on 2026-08-15 against primary product/documentation sources. The useful
pattern is a compact driver-based operating model, not a wall of unrelated KPI cards.

| Reference                                                                                                                                                                    | Reusable pattern                                                                                                                                   | Hito implication                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ChartMogul SaaS metrics library](https://chartmogul.com/saas-metrics/)                                                                                                      | Standard definitions for MRR, ARR, ARPA, churn, retention, and LTV                                                                                 | Give every metric one formula, time window, denominator, and recurring-revenue inclusion rule.                                                        |
| [ChartMogul segmentation](https://help.chartmogul.com/article/281-working-with-segmentation) and [cohort analysis](https://help.chartmogul.com/article/161-cohort-analysis)  | High-level totals become actionable when segmented by plan, channel, and acquisition cohort                                                        | Compare Basic/Pro, monthly/annual, and acquisition channels only when those dimensions have authoritative truth. Do not average incompatible cohorts. |
| [Stripe SaaS analytics](https://stripe.com/en-sg/resources/more/saas-analytics) and [essential SaaS metrics](https://stripe.com/en-mx/resources/more/essential-saas-metrics) | Revenue alone is incomplete; acquisition, conversion, churn, retention, gross margin, LTV, and burn must be connected                              | Admin should answer a small set of operating questions and expose the drivers beneath them.                                                           |
| [Stripe Billing analytics](https://docs.stripe.com/billing/subscriptions/analytics)                                                                                          | MRR, subscriber movements, churn, trial conversion, and cohort retention depend on configurable definitions and support drill-down reports         | Preserve Hito's definitions and expose the MRR/user movement bridge; never copy a provider total without reconciling its inclusion rules.             |
| [Stripe usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based)                                                                                      | Flat recurring fees, metered use, credits, and thresholds require explicit usage and billing contracts                                             | Hito may model flat, allowance, overage, or credit scenarios, but no simulated option becomes a billing entitlement or public price.                  |
| [OpenAI Usage API](https://platform.openai.com/docs/api-reference/usage)                                                                                                     | Detailed token/request usage and invoice-oriented cost reporting are distinct; financial cost should reconcile against the Costs view/endpoint     | Show operational usage beside authoritative billed cost and surface their reconciliation gap instead of inferring cash spend from token counts alone. |
| [PostHog activation methodology](https://newsletter.posthog.com/p/wtf-is-activation-and-why-should)                                                                          | An activation event is useful when reaching it predicts later retention within a product-appropriate window                                        | Hito must validate a runner-value activation milestone; signup or login counts alone do not prove product value.                                      |
| [Baremetrics Forecast](https://help.baremetrics.com/en/articles/5380028-forecast) and [Forecasting](https://baremetrics.com/features/forecasting)                            | Start from customer/MRR state, vary growth and churn, compare scenarios, and keep cash-flow timing visible                                         | Separate starting actuals from editable forecast drivers and show 3/6/12/24/36-month outcomes.                                                        |
| [Causal Budget vs. Actuals](https://new.docs.causal.app/guide/budget-vs-actuals)                                                                                             | Driver-based assumptions and hardcoded inputs can coexist, but actual, budget, version, and variance remain distinct                               | Every Hito value needs a truth class, source, version/effective date, and variance against the selected baseline.                                     |
| [Runway driver-based planning](https://runway.com/blog/driver-based-planning-choose-the-drivers-your-model-needs)                                                            | Customer count, pricing, retention, fixed/variable costs, and headcount form a shallow driver tree; 3-5 scenarios and ranges avoid false precision | Keep the initial model small, show sensitivity and confidence, and reject opaque or duplicated formulas.                                              |
| [OpenView CAC payback](https://openviewpartners.com/blog/cac-payback-basics-what-it-is-how-to-calculate-it-and-why-it-matters/)                                              | CAC payback must include fully loaded acquisition cost and gross-margin impact                                                                     | Advertising spend alone is not CAC; acquisition overhead, time lag, and paid-user gross profit must be explicit.                                      |

## Observed Behavior

The current zero-data local fixture produces mostly zero values, three `No rows yet.` lists, and a
large `Unavailable` word that collides with the adjacent metric/helper at desktop width. The screen
does not yet make clear which operating question each metric answers, whether it is actionable, or
whether unavailable data is expected, incomplete, stale, assumption-only, or failing.

The current Admin model can answer product-health questions from existing Supabase rows. It cannot
answer actual revenue, cash, spend, gross margin, CAC, LTV, runway, price sufficiency, or break-even.
Treating missing financial sources as `0` would falsely report a profitable or cost-free business.

## Expected Behavior

Admin Analytics should be a compact, decision-oriented operational and financial readback:

- every displayed metric answers a named operator question and states its window, denominator,
  currency, source, and unavailable/empty meaning;
- actuals, operator-entered values, assumptions, forecasts, and unavailable data are visibly and
  structurally distinct;
- the operator can change a bounded set of drivers and compare named scenarios without changing
  actuals, entitlements, billing, or production data;
- the model shows how free and paid users, price, conversion, churn, advertising, provider usage,
  fixed expenses, and cash produce revenue, contribution, burn, runway, and break-even;
- realistic disposable local fixture users and synthetic financial inputs make activation,
  paid/free mix, break-even, profitable, downside, stale, and unavailable states testable without
  mixing fixture data with real users or real financial information;
- empty, zero, unavailable, stale, assumption-only, and error states are visually distinct and never
  collide or masquerade as one another;
- cards, tables, scenario controls, and state surfaces reuse the existing Hito Design System and its
  borderless-card direction; no Admin-local finance UI kit is introduced; and
- public pricing, billing, entitlements, provider integrations, persistence, permissions, privacy,
  and accounting classification are explicitly decided by their canonical owners rather than
  implied by the simulator.

## Recommended Owner Questions

The Overview should answer at most these six questions, with detail below or in dedicated sections:

1. **Can I trust these numbers?** What is actual, assumed, stale, unreconciled, or missing as of the
   selected date?
2. **Is the business growing?** What changed in paid users, recurring revenue, conversion, churn,
   collections, and refunds?
3. **Is the product creating repeat value?** Are new runners reaching the accepted activation
   milestone, completing the first value cycle, and remaining active by cohort?
4. **Are the unit economics healthy?** What does one active free user, paid user, and successful AI
   plan cost; what contribution remains from one paid user?
5. **How much time and room do we have?** What are current cash, monthly operating result/burn,
   dynamic runway, and the gap to sustained break-even?
6. **What should I decide next?** Which material variance, threshold breach, sensitivity driver, or
   missing source has the highest financial impact?

Until billing and financial actuals exist, financial questions must render `Not configured` or
`Assumption-only`, not zero-valued actuals. Until activation and retained-value definitions are
accepted, product-health cards must render `Definition required`, not use generic logins as value.

## Owner Metric Inventory And Decision Use

Every metric must have an owner question and a possible decision. A value with no defined response
belongs in a drill-down or should be removed.

| Domain                     | Primary metrics                                                                                                                                                   | Decision supported                                                                            | Normal review cadence            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------- |
| Data confidence            | last reconciled period, source freshness, coverage, reconciliation gap, assumption share                                                                          | whether any other number is decision-grade                                                    | every visit / close              |
| Cash and survival          | available cash, net burn or cash generation, dynamic runway, minimum cash-floor date                                                                              | reduce spend, raise funding, change price/growth pace                                         | weekly and monthly               |
| Revenue and subscriptions  | net MRR, MRR bridge, net collections, active paid users, realized ARPPU, refunds/chargebacks, failed renewals                                                     | pricing, packaging, retention, collection recovery                                            | weekly and monthly               |
| Growth and conversion      | eligible signups, activation, free-to-paid conversion by cohort/channel, new paid users, paid churn, reactivation                                                 | improve onboarding/value, change acquisition allocation, investigate churn                    | weekly and cohorts               |
| Product value              | first reviewable/confirmed plan, first completed workout, accepted retained-value event, cohort retention, active-plan adherence                                  | determine whether Hito repeatedly solves the runner's problem                                 | weekly and monthly cohorts       |
| Paid unit economics        | net revenue per paid user, paid variable cost, paid contribution, gross/contribution margin                                                                       | whether growth creates or destroys cash                                                       | monthly                          |
| Free-tier economics        | active free users, cost per active free user, free subsidy, free-to-paid funding ratio, conversion by grant cohort                                                | change complimentary allowance or qualification without surprise lockout                      | monthly                          |
| AI and allowance economics | successful/failed generation operations, P50/P95 loaded cost per successful plan, retry/failure subsidy, allowance utilization, exhaustion rate, unused allowance | set included generations, provider guardrails, fair-use eligibility, later top-up/tier demand | daily anomaly and monthly policy |
| Acquisition efficiency     | spend by channel, attributable activated and new paid users, fully loaded CAC, payback, contribution ROAS                                                         | continue, reduce, or reallocate marketing spend                                               | weekly and cohort-matured        |
| Operating costs            | fixed/variable cost by category/vendor, actual vs plan, cost change, renewal date, top cost drivers                                                               | cancel/renegotiate software, control infra/provider and hiring timing                         | monthly / renewal                |
| Forecast and sensitivity   | Base/Downside/alternative operating result, cash, runway, required paid users/price, top sensitivity drivers                                                      | choose price, allowance, acquisition pace, and cost plan                                      | when assumptions change          |

### Priority And Maturity Gates

- **P0 owner control:** data state, cash/runway, costs, paid users, net revenue/collections, operating
  result, paid/free unit contribution, AI cost per successful plan, and break-even gap. Missing source
  states are acceptable; fabricated zeroes are not.
- **P1 growth learning:** activation funnel, conversion, churn, product/value retention cohorts,
  allowance utilization, failure cost, and acquisition-channel cohorts after the necessary dated
  events and definitions exist.
- **P2 scale metrics:** LTV:CAC, net/gross revenue retention, expansion/contraction analysis,
  benchmarks, statistical anomaly detection, and complex attribution only after sample size and
  history make them decision-grade.

Do not put projected LTV, blended CAC, or benchmark percentiles on the launch Overview merely because
other SaaS dashboards show them. Early estimates remain in drill-downs with their prerequisites and
confidence.

### Exact Product And Allowance Metrics

Product/Running Coach must accept the runner-value events and time windows; CFO defines only the
financial use of those accepted events.

| Metric                          | Formula / boundary                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activation rate                 | `EligibleNewUsersReachingAcceptedActivationWithinWindow / EligibleNewUsers`; signup or login alone is not activation                                                            |
| First-plan funnel               | eligible setup started -> reviewable AI plan -> confirmed plan -> first due workout completed; show count, rate, and median time between stages                                 |
| Cohort retention                | users in one admitted signup/activation cohort who perform the accepted retained-value event in period `n` divided by that cohort's eligible users                              |
| Plan adherence                  | accepted completed due workouts divided by accepted due workouts; future, cancelled, injury-deferred, and invalid sessions need explicit treatment                              |
| Generation success rate         | reviewable canonical drafts divided by paid-provider-started operations; fixture and preflight rejects are separate                                                             |
| Loaded cost per successful plan | all attributable successful plus accepted failure/retry costs divided by reviewable canonical drafts; show P50 and P95 operation cost distributions as well as the period ratio |
| Paid allowance utilization      | settled included generation units divided by granted included units for eligible paid service periods                                                                           |
| Allowance exhaustion rate       | paid users reaching the period allowance divided by eligible paid users; show whether exhaustion precedes an explicit regenerate intent                                         |
| Unused allowance                | expired unused included units divided by granted included units; breakage is not cash revenue and may also signal weak perceived value                                          |
| Free grant conversion           | eligible complimentary-grant users who become paid inside the accepted conversion window divided by eligible grant recipients                                                   |

### Business Alerts Without Universal Benchmarks

Alerts compare Hito against an accepted budget, target, prior period, cohort, or source invariant;
they must not hard-code generic startup benchmarks as truth.

- runway crosses the accepted minimum cash floor earlier than the selected scenario;
- paid unit contribution is zero/negative or deteriorates beyond the accepted variance;
- free subsidy or AI-provider cost exceeds its monthly budget;
- P95 successful-plan cost, failure rate, or provider/invoice reconciliation gap spikes;
- paid conversion, activation, or retained-value cohort performance falls materially;
- paid churn, failed renewal, refund, or chargeback rate rises materially;
- one acquisition channel's payback exceeds the accepted horizon or remains unavailable after its
  attribution window; or
- a critical source is stale, conflicting, or no longer reconciles.

Each alert must link to the exact driver, affected period/cohort, source state, and candidate owner;
it must not autonomously change price, allowance, provider, marketing spend, or entitlement.

### Metrics To Exclude From The Owner Overview

- lifetime registered users without active, paid, cohort, or exclusion context;
- raw page views, sessions, clicks, or token totals without a named decision and cost/value bridge;
- one blended average that hides free/paid, channel, plan, provider, or P95 cost behavior;
- MRR presented as collected cash, internal allowance units presented as revenue, or provider usage
  estimates presented as invoiced cost;
- LTV, CAC, ROAS, retention, or conversion without the denominator, window, attribution rule, and
  minimum cohort sufficiency; and
- forecasts mixed into actual cards without visible scenario and truth-class labeling.

## Financial Truth Classes

Every input and output must carry one of these non-overlapping classes:

| Class                   | Meaning                                                     | Required evidence                                                          |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `observed_reconciled`   | Closed-period actual tied to an authoritative source        | source owner, source reference, period, currency, reconciliation timestamp |
| `observed_unreconciled` | Imported or entered actual not yet reconciled               | source reference, period, currency, warning, responsible owner             |
| `operator_input`        | Explicit manual value supplied for planning                 | author, effective dates, cadence/unit, currency, last-reviewed timestamp   |
| `assumption`            | Scenario-only hypothesis                                    | scenario, rationale, range/confidence, effective dates                     |
| `derived`               | Formula output                                              | formula version, input versions, scenario, calculation timestamp           |
| `unavailable`           | Required input absent, invalid, stale, or outside the model | reason code and exact missing discriminator                                |

`0` is a valid value only when a source proves zero for the stated period. Missing, not connected,
not applicable, and failed reads are not zero.

## Required Input Contract

The model must first accept manual, explicitly sourced inputs. Automated integrations are later
options, not prerequisites for the formula design.

| Input group                 | Minimum fields                                                                                                                 | Canonical source required for actual state                     | Current Hito state                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Model context               | base currency, timezone, monthly model start, horizon, scenario, last actual month                                             | Product/CFO-approved model policy                              | absent                                                         |
| Cash and financing          | opening cash, restricted cash, debt/funding inflows, payment dates                                                             | reconciled bank/accounting aggregate                           | absent                                                         |
| Subscription revenue        | plan, billing cadence, active paid subscriptions, net recurring price, discounts, refunds, failed collections, start/end dates | billing invoices/subscriptions and settlement records          | no live billing or price                                       |
| User base                   | active free, trial, paid by plan, excluded test/admin/QA users                                                                 | Backend classification plus billing/entitlement reconciliation | product counts exist; commercial status does not               |
| User movements              | signups, free-to-paid, reactivation, upgrade, downgrade, paid churn, free inactivity                                           | billing lifecycle plus canonical cohort rules                  | absent                                                         |
| Product usage               | active users and capability units by period, plan, and user class                                                              | Backend metering with dated, auditable units                   | lifetime capability counts only; insufficient for cost actuals |
| Provider/AI cost            | provider, model/service, unit, unit price, included credits, tiering, currency, effective dates, invoice total                 | provider invoice/usage export and approved contract            | absent                                                         |
| Infrastructure and software | vendor/category, fixed or variable behavior, amount, cadence, tax, currency, effective dates                                   | invoice/accounting record or explicit operator input           | absent                                                         |
| Labor and contractors       | role/category, fully loaded monthly cost, start/end dates                                                                      | payroll/accounting aggregate or approved operator input        | absent                                                         |
| Acquisition                 | channel, spend, creative/agency/labor allocation, leads/signups/new paid users, attribution window                             | ad invoice plus approved attribution policy                    | absent                                                         |
| Payment and tax             | processor percentage/fixed fee, chargebacks, indirect tax treatment, remittance timing                                         | settlement/tax/accounting policy                               | absent                                                         |
| FX and escalation           | source/base currencies, FX rate source, effective date, inflation/vendor increase                                              | approved finance policy and source                             | absent                                                         |
| Targets                     | target gross/contribution margin, target cash floor, target operating result                                                   | Ivan/Product/CFO decision                                      | absent                                                         |

Every operator-entered cost row needs: `name`, `category`, `amount`, `currency`, `cadence`,
`fixed_or_driver_based`, optional `unit_driver`, `effective_from`, optional `effective_to`, tax
treatment, source note, confidence, and last-reviewed timestamp. A recurring monthly cost must not
be represented as twelve copied values.

## Model Conventions To Accept Before Implementation

- **Granularity:** monthly core model. Daily billing data may roll up to months; do not forecast with
  fake daily precision.
- **Horizons:** 3 and 6 months for short-term liquidity; 12, 24, and 36 months for planning.
- **Currency:** one selected base currency for outputs. Preserve source currency and applied FX rate
  for every converted input.
- **Timing:** distinguish opening, movement, average, and ending user balances. Use exact service
  days for observed subscription revenue when available; midpoint averages are forecast fallbacks.
- **Revenue vs. cash:** annual prepayment changes cash immediately but recurring revenue is
  normalized/recognized across the service period. Never use MRR as cash collected.
- **Tax:** indirect taxes collected for remittance are not revenue. Whether displayed price is
  tax-inclusive is an explicit market/policy input.
- **Cost classification:** paid-service COGS, free-tier subsidy, acquisition spend, and operating
  expenses remain separate. The accounting classification of free-tier costs must be accepted and
  applied consistently; the operational subsidy remains visible either way.
- **Rounding:** calculate with full precision, round display to the confidence of the inputs, and do
  not show cents on low-confidence multi-year forecasts.
- **Formula versions:** one canonical version per metric. Formula or classification changes create a
  visible version boundary; historical results do not silently change meaning.

## Canonical Formula Specification

Notation uses month `t`, plan/tier `p`, acquisition channel `c`, and usage/cost driver `k`. Rates are
decimal values. All divisions return `unavailable` when the denominator is zero or missing.

### User And Subscription Movement

| Metric                    | Formula                                                                                                                 | Boundary                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Ending paid users by plan | `PaidEnd[p,t] = PaidStart[p,t] + NewPaid[p,t] + Reactivated[p,t] + UpgradesIn[p,t] - Churned[p,t] - DowngradesOut[p,t]` | Upgrades/downgrades must balance across plans and never create users.                                                     |
| Ending active free users  | `FreeEnd[t] = FreeStart[t] + NewFree[t] + PaidToFree[t] - FreeToPaid[t] - FreeInactive[t]`                              | Total accounts are not active free users. Define the activity window.                                                     |
| Average paid users        | `AvgPaid[p,t] = (PaidStart[p,t] + PaidEnd[p,t]) / 2`                                                                    | Forecast fallback only; observed actuals prefer exact service days.                                                       |
| Average free users        | `AvgFree[t] = (FreeStart[t] + FreeEnd[t]) / 2`                                                                          | Same timing rule as paid users.                                                                                           |
| Free-to-paid conversion   | `FreeToPaid[t] / EligibleFreeOrTrialCohort[t]`                                                                          | Name the cohort, eligibility rule, and conversion window. Same-month total free users are not a safe default denominator. |
| Paid customer churn       | `ChurnedPaidCustomers[t] / PaidCustomersAtStart[t]`                                                                     | Exclude upgrades/downgrades; segment by plan/cohort when sample size permits.                                             |
| Gross paid-user growth    | `(PaidEnd[t] - PaidStart[t]) / PaidStart[t]`                                                                            | Show new and churned movements beside the net rate.                                                                       |

### Revenue And Collections

| Metric                 | Formula                                                                                                 | Boundary                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Ending MRR             | `sum(PaidEnd[p,t] * NetMonthlyRecurringPrice[p,t])`                                                     | Normalize annual contracts to one month; exclude tax, one-time fees, and non-recurring credits. |
| MRR bridge             | `MRREnd = MRRStart + NewMRR + ExpansionMRR + ReactivationMRR - ContractionMRR - ChurnMRR`               | The bridge must reconcile exactly to ending MRR.                                                |
| ARR run rate           | `EndingMRR[t] * 12`                                                                                     | Run rate, not a forecast or cash balance.                                                       |
| Net recognized revenue | `RecognizedSubscriptionRevenue + RecognizedUsageRevenue + OtherRecognizedRevenue - Discounts - Refunds` | Exclude remitted tax; use the accepted service-period convention.                               |
| Gross cash collections | `MonthlyPlanCollections + AnnualRenewalCollections + UsageCollections + OtherCollections`               | Based on payment dates, not revenue recognition.                                                |
| Net cash collections   | `GrossCashCollections - RefundCash - Chargebacks - ProcessorFees - TaxRemitted`                         | Settlement timing must be modeled explicitly.                                                   |
| Net ARPPU              | `NetRecognizedRevenueFromPaidUsers / AvgPaidUsers`                                                      | Segment by plan; do not blend free users into the denominator.                                  |

### Service Cost And Profitability

| Metric                          | Formula                                                                                                 | Boundary                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Usage/provider cost             | `sum(UsageUnits[k,p,t] * EffectiveUnitCost[k,t])`                                                       | Unit, provider/model, tier, credits, FX, and effective date are mandatory. Invocation counts alone are insufficient. |
| Paid variable cost              | `PaidProviderCost + PaidInfrastructureCost + PaidVariableSupport + ProcessorFees + OtherPaidDirectCost` | Direct cost to serve paid users only.                                                                                |
| Free-tier subsidy               | `FreeProviderCost + FreeInfrastructureCost + FreeVariableSupport + OtherFreeDirectCost`                 | Keep visible even if accounting later classifies it as COGS or acquisition spend.                                    |
| Paid service COGS               | `PaidVariableCost + AllocatedPaidFixedServiceCost`                                                      | Allocation rule and included support/hosting categories must be explicit.                                            |
| Gross profit                    | `NetRecognizedRevenue - PaidServiceCOGS`                                                                | Free subsidy is reported separately unless accepted accounting policy includes it in COGS.                           |
| Gross margin                    | `GrossProfit / NetRecognizedRevenue`                                                                    | Unavailable when net revenue is zero.                                                                                |
| Paid unit contribution          | `NetARPPU - PaidVariableCostPerPaidUser`                                                                | State whether allocated fixed service cost is included.                                                              |
| Contribution after free subsidy | `NetRecognizedRevenue - PaidVariableCost - FreeTierSubsidy`                                             | Before fixed OpEx and acquisition spend.                                                                             |
| Free subsidy per paid user      | `FreeTierSubsidy / AvgPaidUsers`                                                                        | Makes the paid-to-free funding burden visible.                                                                       |
| Total operating cost            | `PaidServiceCost + FreeTierSubsidy + AcquisitionSpend + FixedOperatingExpense + OtherOperatingCost`     | One cost row belongs to exactly one category to prevent double counting.                                             |
| Operating result                | `NetRecognizedRevenue + OtherOperatingIncome - TotalOperatingCost`                                      | This is a planning result, not accounting profit unless reconciled to closed books.                                  |
| AI/provider cost ratio          | `AIAndProviderCost / NetRecognizedRevenue`                                                              | Also show cost per active free/paid user and per capability unit.                                                    |

### Cash, Runway, And Break-Even

| Metric                             | Formula                                                                                                                               | Boundary                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Net cash flow                      | `CashInflows[t] - CashOutflows[t]`                                                                                                    | Uses payment timing and includes financing separately from operations.                                                                            |
| Ending cash                        | `CashStart[t] + NetCashFlow[t]`                                                                                                       | Restricted cash is not available runway cash.                                                                                                     |
| Monthly net burn                   | `max(0, OperatingCashOutflows[t] - OperatingCashInflows[t])`                                                                          | If inflows exceed outflows, show cash generation rather than negative burn.                                                                       |
| Static runway                      | `AvailableOpeningCash / CurrentMonthlyNetBurn`                                                                                        | Only when burn is positive and expected to remain roughly stable.                                                                                 |
| Dynamic runway                     | first modeled month where `AvailableEndingCash <= MinimumCashFloor`                                                                   | Preferred when price, users, costs, annual collections, or funding change over time.                                                              |
| Sustained operating break-even     | first month where `OperatingResult >= TargetOperatingResult` for three consecutive months                                             | The consecutive-month rule is a Product/CFO setting; one exceptional month does not qualify.                                                      |
| Required paid users                | `ceil((FixedOperatingCost + FreeTierSubsidy + TargetOperatingProfit - OtherGrossContribution) / PaidUnitContribution)`                | Only when unit contribution is positive and all numerator terms share one monthly convention.                                                     |
| Required paid conversion           | `RequiredPaidUsers / EligibleActiveUserBase`                                                                                          | Show `not reachable in current base` when the result exceeds 100%.                                                                                |
| Required net ARPPU                 | `PaidVariableCostPerPaid + (FixedOperatingCost + FreeTierSubsidy + TargetOperatingProfit - OtherGrossContribution) / TargetPaidUsers` | A decision-support result, not a recommended public price.                                                                                        |
| Minimum displayed price before tax | `(RequiredNetProceedsPerPaid + FixedProcessorFeePerPaid) / (RealizationRate * (1 - ProcessorPercentFee))`                             | `RealizationRate` must include recurring discounts, refunds, and failed-collection assumptions; annual payment timing needs a separate cash view. |

### Acquisition And Lifetime Economics

| Metric                       | Formula                                                     | Boundary                                                                                                               |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Fully loaded CAC by channel  | `AttributableAcquisitionSpend[c,t] / NewPaidCustomers[c,t]` | Include advertising, agency/creative, allocated growth labor/overhead, attribution window, and lag policy.             |
| CAC payback months           | `CAC[c] / PaidUnitGrossProfitPerMonth[c]`                   | Paid unit gross profit must reflect gross margin/direct service cost.                                                  |
| Approximate gross-margin LTV | `(NetARPPU * GrossMargin) / MonthlyPaidCustomerChurn`       | Label `rough estimate`; valid only with stable, positive churn and coherent cohorts. Prefer observed cohort LTV later. |
| LTV:CAC                      | `GrossMarginLTV / FullyLoadedCAC`                           | Display both inputs and confidence; never substitute a benchmark for Hito actuals.                                     |
| Advertising ROAS             | `AttributedNetRevenue / AdvertisingSpend`                   | Revenue attribution is not contribution or cash payback. Show CAC/payback beside it.                                   |

## Scenario Engine Contract

Scenarios are versioned overlays on one baseline. They change only named drivers and never mutate
actuals, billing, entitlements, or another scenario.

### Default Scenario Set

1. **Base:** current best explicit assumptions, with all unavailable actuals visible.
2. **Downside:** lower acquisition/conversion, higher churn, and cost escalation.
3. **Efficient growth:** bounded acquisition growth with improved conversion/retention; no invented
   improvement without an explicit assumption.
4. **Pricing and packaging:** use the accepted direct-generation subscription as Base, and vary
   monthly/annual realized price, included generations, discount, free allowance, paid mix, fair use,
   visible credits, top-ups, plan passes, or tiered packages without changing the public product or
   entitlement contract.
5. **Provider-cost shock:** vary AI/provider unit cost, FX, and free/paid usage intensity.

The UI may support custom scenarios later, but should compare no more than 3-5 at once. A scenario
records its baseline version, changed drivers, author, rationale, horizon, created/updated time, and
confidence. No probability is required unless Ivan explicitly supplies one.

### Primary Drivers

- starting active free and paid users by plan;
- new free users, free-to-paid conversion, paid churn, upgrade/downgrade, and reactivation;
- realized monthly-equivalent price by plan and billing cadence;
- advertising/acquisition spend and channel-specific CAC or funnel assumptions;
- free and paid usage units per active user;
- provider/model unit costs, included credits, thresholds, and FX;
- fixed software, infrastructure, labor/contractor, legal/accounting, and other operating costs;
- processor fees, refunds, failed collections, tax handling, and cash timing; and
- opening cash, funding events, minimum cash floor, and target operating result.

Do not let the model accept both a directly entered `new paid users` value and a second
`ad spend / CAC` derivation for the same users without choosing which driver is authoritative. That
would double count acquisition.

### Required Scenario Outputs

- monthly free/paid users and paid mix by plan;
- MRR bridge, ARR run rate, recognized revenue, and cash collections;
- paid service cost, free subsidy, fixed OpEx, acquisition spend, and total cash outflow;
- gross profit/margin, paid unit contribution, operating result, burn, ending cash, and runway;
- required paid users, required conversion, and required realized/displayed price for the selected
  target;
- CAC, CAC payback, rough LTV and LTV:CAC only when their prerequisites are present;
- Base vs scenario variance at 3/6/12/24/36 months; and
- the top three sensitivity drivers, missing-source warnings, and confidence/range.

## Constructor And Admin Information Architecture

The recommended interaction model is an internal driver editor plus comparison readback, not a
general spreadsheet.

### 1. Overview

- as-of month, base currency, selected scenario, last reconciled month, and model confidence;
- no more than six decision cards/groups: cash/runway, net revenue and paid base, operating
  result/burn, paid/free unit economics plus AI cost, conversion/churn, and activation/retention;
- a visible `actual`, `operator input`, `assumption`, `derived`, `stale`, or `unavailable` badge on
  every value; and
- one decision strip with the break-even gap, largest material variance/alert, most important data
  gap, and top sensitivity driver, not decorative counts.

Product health metrics such as activation, plan usage, workout logging, and provider-pipeline health
remain a separate readback. They may act as model inputs only through an accepted Backend contract.

### 2. Cost And Input Ledger

- grouped recurring and one-time rows for software, infrastructure, AI/providers, labor,
  contractors, marketing, payment fees, tax, and other costs;
- amount, currency, cadence/unit, fixed or driver-based behavior, effective dates, provenance,
  confidence, and current/scenario applicability;
- one editable source row, with all derived monthly values read-only; and
- totals by direct paid service, free subsidy, acquisition, and fixed OpEx.

### 3. Unit Economics

- one row per plan/tier and optional acquisition channel;
- active paid users, realized price, net ARPPU, cost per paid user, gross/unit contribution, CAC,
  payback, and rough LTV where valid;
- free-user cost, free-to-paid ratio, and free subsidy per paid user; and
- drill-down to exact formula inputs and their sources.

### 4. Scenario Builder

- copy Base into a named scenario;
- edit only the primary drivers through bounded controls;
- show the baseline value, scenario override, range, and resulting delta together;
- compare monthly tables/lines for users, revenue, cost, operating result, and cash; and
- allow reset/discard without changing actuals. Persistence and collaboration require a separately
  accepted Backend contract.

### 5. Price And Break-Even Explorer

This is the central constructor Ivan requested:

- row axis: candidate monthly displayed price or realized ARPPU;
- column axis: paid-user count or paid conversion rate;
- side inputs: active free users, paid/free usage intensity, churn, acquisition spend, provider cost,
  fixed OpEx, opening cash, and target result;
- cell output toggle: monthly operating result, contribution margin, break-even gap, or dynamic
  runway; and
- markers for current assumption, first sustainable break-even, unreachable conversion, negative
  unit contribution, and insufficient/unknown source data.

The matrix must use a bounded range and documented step size. It is a sensitivity tool, not a price
recommendation or experiment assignment.

### 6. Actual vs. Plan And Provenance

- monthly Actual / Base / selected-scenario / variance table;
- source freshness, reconciliation state, formula version, and input owner;
- change history for model assumptions only after an accepted persistence contract exists; and
- explicit reasons for unavailable, stale, conflict, or partial coverage.

## State Taxonomy

- `not_configured`: no accepted source or manual input exists;
- `assumption_only`: every required value is scenario input;
- `partial_actual`: some actual sources exist but the metric cannot fully reconcile;
- `unreconciled_actual`: source values exist but closed-period reconciliation is absent;
- `reconciled_actual`: authoritative source and period reconcile;
- `stale`: the source/input is older than its accepted freshness window;
- `unavailable`: denominator, authority, policy, or prerequisite is absent;
- `error`: a previously available source or calculation failed; and
- `zero`: the authoritative source proves a value of zero for the period.

## Deterministic QA Fixture Inventory

All values are synthetic, disposable, loopback-only, and excluded from real-user and actual-finance
counts.

1. **No financial sources:** product users exist; every financial output is `not_configured`, not zero.
2. **Assumption-only pre-revenue:** free users and costs exist, no paid users; negative unit economics
   and finite runway render without division errors.
3. **Break-even boundary:** the selected price/user cell exactly meets the accepted target and the
   adjacent cells fall on either side.
4. **Healthy paid mix:** positive paid unit contribution, free subsidy covered, and cash grows.
5. **Negative unit contribution:** paid price is below direct paid-user cost; adding paid users makes
   the loss worse and the UI warns instead of producing a fake break-even count.
6. **Free-tier pressure:** free users/usage grow faster than paid users and surface subsidy per paid
   user plus required conversion.
7. **Acquisition shock:** advertising spend increases without matching new paid users; CAC/payback
   deteriorate.
8. **Provider/FX shock:** AI/provider unit cost or FX changes at an effective month and affects only
   subsequent periods.
9. **Annual billing timing:** annual cash collection and monthly recognized revenue/MRR remain
   different but reconcilable.
10. **Stale/conflicting input:** a cost row expires or two sources disagree; dependent outputs become
    stale/unavailable rather than silently choosing one.
11. **Scenario isolation:** editing/discarding Downside leaves Base and observed inputs byte-for-byte
    unchanged.
12. **Excluded identities:** admin, QA, local tester, and disposable fixture users never enter
    real-user, paid/free, CAC, or revenue denominators.

## Required Discriminator And Product Decisions

The financial decision model is now proposed, but not yet accepted for implementation. Product and
Ivan must decide:

1. Which base currency, tax treatment, monthly close convention, and first forecast horizon apply?
2. Which six Overview questions and which detailed sections are accepted?
3. Which costs Ivan will enter first, with amount, cadence, currency, effective date, and whether
   each is fixed, per-user, per-capability, threshold, or one-time?
4. Whether the first constructor is session-only/local or must persist scenarios; persistence makes
   the first implementation slice Backend-owned and Tracked.
5. Which inputs may later become reconciled actuals, and which authoritative billing/accounting/
   provider/ad sources own them?
6. **Accepted for modeling:** direct-generation monthly subscription as Base; fair use, visible
   included credits, top-ups, one-time plan passes, tiers, annual discount, and free allowance as
   alternatives. Exact price, included count, and scenario ranges remain unresolved.
7. Whether free-tier service cost is classified as COGS or growth/acquisition expense for reporting;
   the operational subsidy remains visible either way.
8. Which target defines break-even: operating result `>= 0`, a cash floor, a target owner salary,
   reinvestment budget, or another explicit amount?
9. Which current product metrics support the model, which are intentionally absent, and which should
   be removed from Overview rather than approximated?
10. Which existing DS surface, input, table, chart, state, and status contracts render the accepted
    hierarchy, and what genuinely missing shared contract requires DESIGN SYSTEM ownership?

## What Not To Touch Yet

- No Admin production UI, CSS, route, data query, formula code, database schema, RLS,
  authentication, hosted data, or current entitlement behavior.
- No billing, price, checkout, payment, invoice, subscription, public pricing, or paywall behavior.
- No fixture creation, account deletion, provider call, accounting/ad connection, bank access,
  spreadsheet, test-account mutation, or browser acceptance.
- No new financial truth store, analytics framework, event table, generic Card primitive,
  client-side authoritative metric, or duplicated Design System recipe.
- No inferred actual financial state from product counts, lifetime capability usage, public vendor
  prices, or benchmark assumptions.
- No legal, tax, investment, or accounting conclusion. Accounting classifications and tax treatment
  require the accepted authoritative policy.
- No claim that the screenshot proves a Backend analytics defect; it proves a current presentation,
  decision-model, and fixture-coverage gap only.

## Planned Slices After Product Acceptance

1. **PRODUCT:** accept the operator questions, internal-only scope, input policy, financial truth
   classes, pricing shapes to simulate, target definition, and implementation sequence.
2. **CHIEF FINANCIAL OFFICER:** resolve any remaining formula/classification decisions against the
   first real input inventory; no runtime implementation.
3. **ARCHITECT / BACKEND read-only contract audit:** map each accepted input and output to canonical
   existing truth, prove the missing persistence/read-model boundaries, and reject duplicate truth
   paths.
4. **DESIGNER:** specify the Overview hierarchy, cost ledger, unit-economics table, scenario
   comparison, price/break-even matrix, responsive behavior, and full state taxonomy.
5. **BACKEND:** only after acceptance, implement the smallest admitted financial-input/scenario/read-
   model contract and any fixture capability; never infer billing or actual provider cost.
6. **DESIGN SYSTEM:** only for a demonstrated shared input/table/chart/state contract missing from
   the current library.
7. **FRONTEND, Product lane:** adopt the approved backend-shaped readback and scenario interactions
   inside the existing Admin route/shell.
8. **QA:** execute the accepted synthetic user/financial scenario inventory against an admitted
   local fixture; independently verify formula outputs, provenance, scenario isolation, privacy,
   cleanup, states, responsive containment, themes, keyboard interaction, and console/overflow
   health.

## Validation Expectations

Before implementation, take fresh source hashes and record the accepted formula/input/fixture
contract. Future validation must include:

| Check                    | Scenario / environment                                                         | Required evidence                                                                             |
| ------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Formula fixtures         | deterministic unit inputs, including denominator-zero and threshold boundaries | exact expected outputs for every canonical formula version                                    |
| Revenue/cash separation  | monthly and annual billing scenarios                                           | reconciled MRR, recognized revenue, collections, fees, tax, and cash timing                   |
| Cost classification      | paid COGS, free subsidy, acquisition, fixed OpEx                               | every input included exactly once; accepted classification visible                            |
| Break-even solver        | positive, zero, and negative paid contribution                                 | exact boundary cell, unreachable state, and no invalid division                               |
| Scenario isolation       | Base plus 3-5 overlays                                                         | only named driver overrides affect the scenario; Base/actuals unchanged                       |
| Provenance and staleness | observed, manual, assumed, derived, missing, stale, conflict                   | correct state, source, period, version, and dependent-output behavior                         |
| User exclusions          | real, admin, QA, tester, disposable identities                                 | excluded identities absent from all commercial denominators                                   |
| Privacy/authority        | authenticated Admin boundary                                                   | no secrets, raw provider payloads, bank/payment credentials, or personal finance rows exposed |
| Browser presentation     | admitted loopback fixture, desktop/mobile, Light/Dark                          | no collision, overflow, inaccessible controls, or misleading zero/unavailable state           |
| Regression               | current Admin operations                                                       | product-health, users, entitlements, feedback, and Test Accounts remain truthful              |

Global QA, hosted parity, billing acceptance, financial/accounting acceptance, public pricing,
release readiness, and Figma parity remain separate gates. A passing synthetic scenario does not
prove Hito actuals.

## Next Condition

This item remains `backlog` with PRODUCT as lifecycle owner. The launch packaging baseline, retained
financial-sandbox alternatives, owner-question hierarchy, and metric inventory are accepted as
discovery direction; no UI, persistence, instrumentation, billing, or provider implementation is
accepted or dispatched by this write. PRODUCT must next accept the P0 Overview subset, runner
activation/retained-value definitions, first manual financial inputs, base currency, scenario
horizon, and persistence boundary, then either reduce the first slice to a session-only design
contract or route a separately bounded ARCHITECT/BACKEND source-of-truth audit before runtime
mutation.

## 2026-08-15 Product Direction: Facts, Forecasts, And Fixtures

Ivan confirmed that the Owner Console has two deliberately separate layers:

- **Actuals:** every historical chart is sourced from a dated, attributable Hito or operator record.
  It covers users, plans, workouts, expenses, cash movements, customer receipts, refunds, fees, and
  AI/provider cost. A missing source is `not_configured` or `unavailable`, never a zero actual.
- **Forecast Lab:** a separate sandbox starts from an explicit as-of baseline and projects a chosen
  custom monthly horizon. It may support one, five, twelve, or another bounded number of months;
  its outputs are assumptions/derived values and never replace history.

The first financial-input scope is a durable Expense and Revenue/Cash history. Ivan can enter
operator-sourced spending for agents, AI APIs, software, infrastructure, advertising, and other
costs; later automated imports may add dated provider/payment facts without replacing manual
provenance. Every recurring cost is one cadence-aware row, not copied monthly entries. Customer
receipts must eventually come from authoritative payment/settlement truth, with gross amount, fees,
refunds, tax treatment, currency, date, and source preserved separately.

The local QA fixture needs two isolated datasets: synthetic runner identities for product funnels
and a synthetic business ledger/scenario set for finance. Both are loopback-only and excluded from
real-user, customer, revenue, and finance denominators. A fake owner account is acceptable only in
that isolated fixture.

This direction does not select a payment provider, public price, base currency, tax policy,
break-even target, or forecast-persistence policy. Those remain Product decisions before BACKEND
implementation.

## 2026-08-16 Designer Admin-Surface Audit Stage

Stage: DESIGNER read-only discovery
Current Stage Owner: DESIGNER
Next Recommended Role: PRODUCT

### Outcome

Produce one source-backed design recommendation for the current Admin experience before any Admin
runtime, fixture, financial-model, or Design System implementation. The recommendation must make
the present Admin readable and decision-oriented while retaining the accepted borderless,
near-black-surface direction rather than introducing another local card system.

### Required Audit

1. Inventory every current Admin route/section and identify which surfaces are decision-bearing,
   redundant, decorative, misleading, empty, or visually broken. Include the present overview
   cards, unavailable/zero states, tables/lists, navigation, and responsive states.
2. Map each retained surface to an existing Hito Design System contract and specify the exact
   typography role, spacing, padding, margin, radius, background, chrome, and Dark/Light behavior.
   Borders should be removed wherever the hierarchy remains clear; use existing canonical
   near-black/surface tokens instead of Admin-local black recipes.
3. State which cards should disappear, which information should become a row/table/chart/empty
   state instead, and which genuinely missing shared contract would require a later DESIGN SYSTEM
   task. Do not design an Admin-local replacement component.
4. Create a factual data-availability map from the current Admin read model: what product facts
   already exist, what is empty or unavailable by design, and which future financial questions lack
   an authoritative source. Treat absent financial sources as `not_configured`/`unavailable`, never
   as zero or synthetic actuals.
5. Recommend the smallest future QA-fixture dataset needed to show the retained product-health
   states and future financial-design states. It is a proposal only: do not create users, fixtures,
   ledger rows, or calculations.

### Boundaries

- Read-only discovery. Change only this canonical Markdown item with the findings, visual
  direction, source/data map, and an implementation-ready handoff.
- Do not change Admin runtime source, CSS, tokens, `/hitoDS`, fixtures, schemas, financial facts,
  formulas, billing, entitlements, hosted state, or generated artifacts.
- Reuse the accepted four-authority boundary: product facts, financial actuals, commercial grants,
  and forecast scenarios are separate. Do not make the current visual audit imply that finance
  implementation or an approved price exists.
- Preserve all concurrent dirty work. This stage must not claim browser acceptance, Global QA,
  financial correctness, Figma parity, release, or deployment readiness.

### Validation Expectations

Record inspected routes and source owners; validate local Markdown links, scoped Prettier, and
`git diff --check`. Runtime/build/browser/fixture checks are not part of this read-only stage.

### Exact Handoff Prompt

```text
ROLE: DESIGNER

Task: Hito Admin Overview visual and data-readiness audit
Mode: Tracked, read-only discovery
Canonical item: docs/tasks/backlog/2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md
Stage: Designer Admin-Surface Audit Stage

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md. Work
only in the canonical item. Do not edit runtime source, CSS, tokens, /hitoDS, fixtures, schemas,
financial data, billing, hosted state, or generated outputs.

Audit the current Admin experience, especially /admin/analytics, across its current sections and
responsive states. Establish the actual source owners before making recommendations. Deliver:
1) an inventory of decision-bearing, redundant, decorative, misleading, empty, and broken surfaces;
2) a borderless, near-black canonical-surface direction using existing Hito DS contracts, with exact
typography, padding/margin, radius, tone/chrome, and Dark/Light behavior; 3) what should be removed
or converted to rows, tables, charts, or truthful states; 4) a current data-availability map for
product facts versus missing financial actuals, grants, and forecasts; and 5) the smallest proposed
synthetic QA-fixture state set for later implementation.

Never treat missing financial sources as zero actuals, invent a local Admin card system, or imply
that billing/finance is implemented. Reuse existing DS owners first and identify any genuinely
missing shared contract for a later separate DESIGN SYSTEM task. Record a compact
implementation-ready recommendation in the canonical item. Validate local Markdown links, scoped
Prettier, and git diff --check. Return the next owner, preserved boundaries, and every validation
layer not run. No browser, fixture, build, hosted, Global QA, release, or Figma acceptance claim.
```

## 2026-08-16 Designer Admin-Surface Audit Decision

### Stage Receipt And Source Boundary

The DESIGNER read-only stage is complete. The audit used the saved Light desktop capture and the
current authored source; it did not run a browser or treat computed appearance as proof of a source
defect. The source snapshot was `abd4fe8355e3c644095111a654c1560aa265d104` on `main`, with broad
pre-existing dirty work. Only this canonical item is changed by this stage.

| Current responsibility                                    | Canonical owner inspected                                                                                                                                                          | Audit conclusion                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin route, section selection, responsive content gutter | `src/routes/admin.analytics.tsx`                                                                                                                                                   | One shell hosts Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, and Test accounts. The route is the later FRONTEND composition seam, not a source of financial truth.                                                          |
| Sidebar, mobile rail, sticky header, account menu         | `src/components/admin/AdminWorkspaceNav.tsx`; `src/components/admin/admin-workspace-nav-model.ts`                                                                                  | The shared workbench shell and navigation are valid. The desktop sidebar edge and sticky-header edge express containment and should remain.                                                                                                  |
| Summary groups, metrics, lists, and pipeline steps        | `src/components/admin/AdminAnalyticsSummarySections.tsx`; `src/components/admin/AdminAnalyticsPanels.tsx`                                                                          | The local `MetricCard`/`KeyCountList` presentation gives too many facts equal card weight and permits availability copy in a numeric value slot.                                                                                             |
| User/Test-account operations                              | `src/routes/admin.analytics.tsx`; `src/components/admin/AdminOperationalComponents.tsx`                                                                                            | These are operational tables with real actions and filters. Keep them outside Overview and preserve table semantics, focus, and horizontal containment.                                                                                      |
| Work-item operations                                      | `src/routes/admin.capture.tsx`                                                                                                                                                     | A separate Admin workbench destination, not an Overview metric source.                                                                                                                                                                       |
| Authentication                                            | `src/routes/admin.login.tsx`                                                                                                                                                       | A separate entry boundary. Its visual redesign is not part of this item.                                                                                                                                                                     |
| Product analytics read model                              | `src/lib/admin-analytics.ts`; `src/lib/admin-analytics.server.ts`; `src/components/admin/admin-analytics-format.ts`                                                                | Real/test identity exclusion is useful, but several activation/plan metrics are derived from legacy `plan_cycles` and `planned_workouts`. `formatNullableCount` and `formatNullablePercent` turn `null` into the large string `Unavailable`. |
| Shared visual contracts                                   | `src/styles/foundations.css`; `src/styles/layout-typography.css`; `src/styles/reference-workbench.css`; `src/styles/overlays-feedback.css`; `src/styles/shell-admin-analytics.css` | The shell, typography, spacing, semantic surfaces, state surfaces, metric roles, status, table, and focus contracts already exist. No Admin card family or raw near-black colour is needed.                                                  |

The first incorrect owner for the legacy runner-lifecycle claims is the server/view contract in
`src/lib/admin-analytics.server.ts` and `src/lib/admin-analytics.ts`, which elevates `plan_cycles`,
`planned_workouts`, and `activePlanUserIds` into current activation authority. The summary UI only
renders that downstream shape. Under the accepted Runner Calendar boundary, source plans are
provenance artifacts and calendar workouts are independently runner-owned. A visual repair must not
rename or polish those legacy aggregates into new product authority.

### Current Surface Census

| Surface                                                                                                     | Classification                                            | Decision                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop sidebar and mobile section rail                                                                     | Decision-bearing navigation                               | Retain. Preserve `aria-current`, keyboard focus, and the structural desktop edge. Increase the mobile target to at least 44px when the rail is next touched; the current 2rem quick-link height is too compressed for the intended touch contract.          |
| Sticky section header                                                                                       | Decision-bearing orientation, partly redundant            | Retain one route title and description. Remove the repeated panel eyebrow when it merely repeats the selected navigation label. Keep the blurred background and bottom structural edge.                                                                     |
| Floating `Generated` block                                                                                  | Useful provenance presented too prominently               | Move to the relevant group/source meta row. A generation timestamp is not source freshness or reconciliation proof.                                                                                                                                         |
| Six equal Overview stat cards                                                                               | Redundant/decorative hierarchy                            | Replace with a small number of question-led groups and bare metric readbacks inside one group surface. Do not retain one perimeter surface per number.                                                                                                      |
| `Auth users`, `Profiles`, `Workout logs`                                                                    | Decision-bearing product facts when their owner succeeded | Retain with explicit source/period. `Auth users` needs a separate availability state; lifetime counts must not imply a period trend.                                                                                                                        |
| `Active plans`, `Archived plans`, `Planned workouts`                                                        | Misleading current-product authority                      | Remove from Overview. If migration diagnostics still require them, place them in a clearly labelled legacy provenance table outside the owner cockpit until the canonical read model is migrated.                                                           |
| `Users with/without active plan`, `Setup to active`, `Active users without logs`, `No logs in last 30 days` | Misleading activation proxy                               | Remove pending a Product-approved activation and retained-value definition backed by the standalone calendar model. Do not substitute signup, login, profile completion, or a legacy active-plan row.                                                       |
| `Completion rate`                                                                                           | Potentially decision-bearing, presently unfit             | Do not show the current ratio as an accepted completion KPI: its denominator is legacy planned non-rest rows and `null` becomes a giant `Unavailable` value. Re-admit only after the canonical workout population, period, and outcome policy are accepted. |
| `Workout outcomes`                                                                                          | Decision-bearing operational distribution                 | Convert to compact labelled rows or an accessible small distribution only when the population and time window are shown. `No rows yet` becomes a successful-empty statement with source and period.                                                         |
| `Plan source mix` and `Plan schema versions`                                                                | Diagnostic, not owner Overview                            | Move to a legacy source/provenance table; never treat schema versions as business health. Remove when the migration no longer needs them.                                                                                                                   |
| Garmin/evidence counts and four pipeline steps                                                              | Decision-bearing pipeline health, currently duplicated    | Keep one staged pipeline readback plus exception rows. Do not show the same upload/parse/metrics/comparison/AI counts once as cards and again as steps. A pipeline is not a conversion funnel unless cohort semantics are proven.                           |
| Entitlement tiers/statuses and capability usage                                                             | Decision-bearing operational facts                        | Keep as rows/table with clear lifetime/period wording. They do not prove subscriptions, paid users, grants remaining, revenue, or provider cost.                                                                                                            |
| Users and Test accounts tables                                                                              | Decision-bearing operations                               | Retain as separate destinations. Preserve real/test separation, filters, table headers, action states, and horizontal scrolling; do not compress these operations into Overview cards.                                                                      |
| Route-level unavailable/auth states                                                                         | Truthful state surface                                    | Retain the canonical borderless `hito-state-surface`, status pill, and recovery actions.                                                                                                                                                                    |
| Per-card hairlines, 8rem minimum stat height, low-opacity row boxes                                         | Decorative chrome                                         | Delete where spacing and the parent surface already establish grouping. Keep only structural shell edges, focus rings, table/row separation needed for scanning, and semantic selection/status evidence.                                                    |
| Saved Light capture: overlapping `Unavailable` values                                                       | Visually broken and semantically misleading               | The source-backed cause is a status string rendered through the fluid numeric `.hito-analytics-value` role across equal-width cards. Model state separately from value; never fix this with smaller text or clipping.                                       |

### Recommended Information Architecture

The Overview should answer at most these six owner questions, in this order. Only groups with an
accepted source render numeric facts; an unimplemented authority renders one truthful state surface,
not placeholder zero cards.

1. **Data readiness:** which product sources loaded, their as-of/period, and which are unavailable or
   stale.
2. **Runner activity:** accepted activation/retained-value and workout participation after Product
   defines them against independently owned calendar workouts. Until then, show only admitted auth,
   profile, and log facts without an activation claim.
3. **Workout evidence:** upload-to-insight pipeline health, failures, and backlog.
4. **AI and entitlement operations:** explicit entitlement rows and metered capability use, without
   commercial or revenue inference.
5. **Financial actuals:** one `not_configured`/`unavailable` state until an attributable financial
   ledger exists; later actuals remain separate from product facts and scenarios.
6. **Forecast Lab:** one unavailable/assumption-labelled entry until Product admits scenario inputs,
   horizon, target, and persistence. Forecast output never fills an Actuals group.

Detailed breakdowns remain in Funnel & Usage, Feedback, AI & Entitlements, Users, Test accounts, and
Work items. Overview links to those destinations rather than duplicating their complete tables.
Current point-in-time counts do not justify a time-series chart. The evidence pipeline may use a
stage view because ordered stages exist; trends, cohorts, finance charts, and forecast bands wait for
dated, attributable series and an accessible table equivalent.

### Canonical Borderless Visual Contract

This is an assignment of existing semantic roles, not a new colour system. The near-black Dark
appearance comes from Hito Foundation tokens: `--color-surface` resolves to `--stone-850` for the
main canvas and `--color-background` resolves to `--stone-900` for contained readback groups. Light
uses `--color-background` (`--linen-100`) for the canvas and `--color-surface` (`--linen-50`) for
contained groups. No authored `black`, hex, or Admin-only alpha recipe is admitted.

| Element                  | Exact role and geometry                                                                                                                                                                      | Dark                                                               | Light                                                 | Edge rule                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/sidebar            | Existing `hito-workbench-shell`, 15rem desktop sidebar, `--color-sidebar`                                                                                                                    | `--stone-950` sidebar beside `--color-surface` main                | `--linen-75` sidebar beside `--color-background` main | Keep the one sidebar divider because it separates navigation from content.                                                                                 |
| Sticky header            | Existing `hito-workbench-topbar`; horizontal gutter below; title `hito-ui-title-md`, description `hito-body-md`                                                                              | Existing 76% `--color-background` mix plus 18px blur               | Same semantic recipe resolves through Light tokens    | Keep one bottom hairline as sticky-position evidence. No shadow/card border.                                                                               |
| Content frame            | `hito-route-gutter`: 16px inline below 640px and 24px from 640px; 24px vertical on narrow screens, 32px at desktop; max width 80rem                                                          | Transparent on main canvas                                         | Transparent on main canvas                            | No perimeter edge. Replace the current 20/32/40px route-specific gutter ladder with the canonical gutter.                                                  |
| Page/section rhythm      | 24px gap on narrow screens, 32px on desktop; no duplicate eyebrow; section title `hito-ui-title-xs`; support copy `hito-body-md`; provenance `hito-technical-sm` with secondary text         | Semantic text roles                                                | Semantic text roles                                   | Spacing establishes hierarchy.                                                                                                                             |
| Decision group           | One parent surface per owner question; `--radius-xl` = 10px; 16px padding on narrow screens, 24px from 768px; 12px internal gap narrow, 16px wide                                            | `--color-background` on `--color-surface` canvas                   | `--color-surface` on `--color-background` canvas      | `border: 0`; no shadow. This mirrors the accepted borderless semantic pairing without reusing a reference-only class.                                      |
| Metric readback          | Label `hito-label-md`; numeric value only through the canonical metric/mono role with tabular numbers; unit/helper `hito-body-xs` or `hito-technical-sm`; state/provenance outside the value | Foreground value, secondary/tertiary support                       | Same semantic roles                                   | No individual card/min-height. Desktop may use the existing auto-fit 10.5rem metric grid inside the group; narrow screens use label-left/value-right rows. |
| Breakdown row            | 12px block padding narrow, 16px wide; 12px gap; label `hito-body-md`; value `hito-technical-sm`                                                                                              | Clear or `--color-chrome-subtle` only for selectable/stateful rows | Same semantic token                                   | No decorative perimeter. Use a divider only when needed to preserve row association.                                                                       |
| Availability/empty/error | Existing `hito-state-surface`, `data-size="md"`; title `hito-body-md`, explanation `hito-body-xs`, status pill for the truth class                                                           | Canonical neutral/signal/warning/destructive fill                  | Theme-resolved canonical fill                         | Borderless; canonical focus ring remains on actions. `zero` is a number, `unavailable` and `error` are states.                                             |
| Operational table        | Existing Admin toolbar/table contracts; 16px cells at desktop, 12px compact target for narrow compositions; horizontal containment retained                                                  | Semantic row fill/chrome                                           | Semantic row fill/chrome                              | Header/row separators may remain where they preserve column and action association. Do not wrap a second card around the table.                            |
| Chart or stage view      | Existing chart/legend semantics only after source semantics are accepted; always pair with text/table readback                                                                               | Existing semantic chart roles                                      | Existing theme-resolved roles                         | No chart as decoration and no colour-only state.                                                                                                           |

Responsive behavior is content-led: below 768px, summary metrics become full-width rows, long labels
wrap, state copy receives its own row, and values never overlap helpers. From 768px, retained
readbacks may use two columns; from 1024px, the existing auto-fit grid may fill the group. Tables keep
horizontal scroll rather than shrinking controls or truncating decision text. The mobile navigation
rail remains horizontally scrollable with visible focus and a minimum 44px target. No breakpoint
changes typography meaning; `hito-ui-title-md`, `hito-ui-title-xs`, body, label, technical, and
metric roles remain stable across themes and sizes.

### State And Data-Availability Contract

| Authority                | Current factual availability                                                                                                                                                                                                                                                                  | Admitted presentation                                                                                                                                                     | Missing authority / prohibited inference                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product facts            | Auth count when Admin lookup is available; real runner profiles; workout logs/outcomes; result assets and parse state; actual-metric/comparison/AI-insight row counts; explicit entitlement rows; capability-usage aggregates; classified real/excluded identities; per-user operational rows | Number only after the source succeeded, with explicit lifetime/period and as-of metadata. Successful empty collections may render zero plus a specific empty explanation. | No accepted activation, retained-value, cohort, trend, or canonical standalone-calendar participation readback is present. Legacy plan/workout tables cannot fill that gap.                                                                 |
| Product source readiness | Auth explicitly exposes `available`, `unavailable`, or `lookup_failed`; other table failures currently fail the analytics result as a whole                                                                                                                                                   | Separate source status/readiness row or route-level error state                                                                                                           | The generated timestamp is not freshness proof. Current sources do not expose per-table partial/stale metadata.                                                                                                                             |
| Financial actuals        | None in the inspected Admin read model                                                                                                                                                                                                                                                        | `not_configured` or `unavailable` only                                                                                                                                    | No cash, collections, recognized revenue, refunds, fees, tax, FX, provider invoice cost, advertising spend, payroll/software cost, reconciliation, or forecast baseline. Product counts and public vendor prices are not financial actuals. |
| Commercial grants        | Explicit entitlement rows and aggregate capability use exist as operational product facts                                                                                                                                                                                                     | Label as entitlement/usage operations only                                                                                                                                | No approved price, paid subscription, settled allowance, grant ledger, remaining credits, top-up, invoice, or billing authority exists. Do not translate entitlements into revenue or grants remaining.                                     |
| Forecast scenarios       | None                                                                                                                                                                                                                                                                                          | Unavailable until accepted; later all values visibly `assumption` or `derived` with an as-of baseline                                                                     | No accepted horizon, currency, tax policy, target, scenario persistence, or formula version. Forecasts never backfill Actuals.                                                                                                              |

State rules are exact:

- `zero` requires a successful authoritative read for the named population and period;
- `not_configured` means the authority/source has not been connected or admitted;
- `unavailable` means a required source, denominator, or policy is absent;
- `error` means an admitted read/calculation failed;
- `stale` requires a defined freshness window and an older source;
- `assumption` and `derived` are Forecast Lab truth classes, never Actuals; and
- no state word is passed to a numeric typography slot.

### Smallest Later Synthetic QA State Set

Use four deterministic, isolated state packs. This replaces a screen-per-edge-case fixture strategy;
individual rows within the finance truth matrix cover multiple truth classes without claiming real
actuals.

1. **`product_empty__finance_not_configured`:** all admitted product reads succeed, zero real users
   exist, and only excluded Admin/QA/test identities are present. Product values are truthful zeros;
   finance and forecasts are `not_configured`. Proves zero-versus-missing and exclusion.
2. **`product_mixed__finance_not_configured`:** a minimal real-runner cohort has profiles,
   independently owned calendar workouts with provenance, completed/missed logs, parsed and failed
   evidence, a comparison/insight, explicit entitlement rows, and capability usage. Include one long
   label/value to exercise responsive containment. Do not create or require a runner-facing active
   plan container.
3. **`product_degraded`:** replay the same product cohort with two deterministic response modes:
   auth lookup unavailable while admitted table facts remain readable, and full analytics-load
   error. Proves partial readiness versus route-level failure without turning either into zero.
4. **`synthetic_finance_truth_matrix`:** a separately labelled fixture ledger contains a reconciled
   non-zero actual, a reconciled zero, an unreconciled row, a stale row, and a missing authority;
   separate Base and Downside scenarios supply assumption/derived values and one unreachable or
   negative-contribution boundary. Product identities remain excluded from financial authority,
   scenario edits do not mutate observed rows, and no value is presented as real Hito finance.

The fixture owner must later prove cleanup, deterministic dates, source labels, period/as-of values,
and exclusion from real-user/customer/financial denominators. This stage did not create fixture
records or accept finance formulas.

### Reuse, Deletion, And Owner Sequence

There is no demonstrated need for a new Card family, Admin theme, surface token, table, status pill,
or state surface. The only demonstrated shared gap is a **status-aware metric readback contract**:
the current local Admin `MetricCard` and the DS reference metric composition both use metric visuals,
but no canonical contract prevents `unavailable`/`error` copy from occupying a numeric value slot or
binds value, unit, state, period, and provenance. A bounded later DESIGN SYSTEM slice may admit that
contract only after PRODUCT accepts the Overview questions. It must reuse the existing metric,
typography, status, and state roles; converge the existing consumers; and delete the superseded
`hito-analytics-stat*` card recipe rather than add another card abstraction. If a second accepted
consumer is not present, FRONTEND should compose the one Admin surface from existing roles and no
new shared primitive should be created.

Implementation order and stop conditions:

1. **PRODUCT:** accept the initial Overview question set, exact activation/retained-value definition,
   admitted periods, and whether Financial Actuals/Forecast Lab placeholders should appear before
   their sources exist. Stop if any metric meaning remains unresolved.
2. **ARCHITECT/BACKEND contract stage:** map accepted runner facts to the standalone calendar owner,
   remove legacy plan authority from the Admin read shape, and add source/period/readiness metadata
   only where canonical owners can provide it. Stop before a new analytics store or duplicate truth
   path.
3. **DESIGN SYSTEM, conditional bounded slice:** implement the status-aware metric readback only if
   the accepted consumers prove shared reuse; delete/reduce the local stat recipe. No Card family,
   colour token, or Admin-only framework.
4. **FRONTEND, Product lane:** reduce the current equal-card layout to the accepted groups, reuse the
   shell/state/table contracts, move diagnostics out of Overview, and preserve Users/Test accounts/
   Work items behavior. Stop if a missing Backend field would require a client-derived authority.
5. **BACKEND and QA, separately dispatched:** implement only accepted finance/fixture contracts, then
   verify the four state packs, formulas where admitted, themes, responsive containment, keyboard
   operation, exclusions, and cleanup. No browser or fixture work is admitted by this receipt.

Rollback is slice-local: retain the current route selection and operational tables while each group
is migrated; do not dual-write analytics truth. A failed shared-readback slice reverts the consumer
to existing typography/state composition without restoring misleading legacy metrics. A failed data
contract returns to its canonical owner instead of being replaced by route-local calculations.

### Stage Validation And Lifecycle

| Check                       | Scenario / environment                           | Result | Evidence                                                                                                                                            |
| --------------------------- | ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role/skill preflight        | DESIGNER read-only stage                         | Passed | `AGENTS.md`, `agents/designer.agent.md`, and `skills/hito-frontend-design-system/SKILL.md` read before this task-owned write.                       |
| Source and visual inventory | Current checkout and saved Light desktop capture | Passed | Named routes/components/read-model/CSS owners inspected; saved capture confirms the `Unavailable` collision and equal-card hierarchy.               |
| Runtime-source preservation | Hash inventory before/after documentation write  | Passed | All 16 inspected runtime/DS owner hashes are unchanged.                                                                                             |
| Local Markdown links        | This canonical item                              | Passed | Every local Markdown target resolves on disk.                                                                                                       |
| Scoped Prettier             | This canonical item only                         | Passed | `npx prettier --write` completed for this file only.                                                                                                |
| Diff hygiene                | Current dirty checkout                           | Passed | `git diff --check` returned 0; the no-index check emitted no whitespace errors (status 1 only because the untracked file differs from `/dev/null`). |

Stage outcome: **Designer Admin-Surface Audit complete; larger item remains `in_progress` under
PRODUCT lifecycle ownership.** Next recommended role: **PRODUCT**. PRODUCT must decide the admitted
Overview questions and runner activation/retained-value semantics before routing any implementation.
No runtime implementation, CSS/token/DS mutation, fixture, schema, browser, build, hosted, financial,
billing, Figma, Global QA, release, or deployment acceptance is claimed.

## 2026-08-16 Product Acceptance: Initial Overview And Backend Read Model

Stage: BACKEND standalone-calendar read-model reconciliation
Current Stage Owner: BACKEND
Next Recommended Role: PRODUCT

### Accepted Initial Overview

The first implementation renders these groups in this order and only from their admitted authority:

1. **Data readiness** — source availability, period/as-of metadata, and truthful unavailable/error
   state.
2. **Runner activity** — only directly supported runner/profile/calendar-workout facts. Activation,
   retained value, cohort, and trend claims remain `definition_required` or absent until separately
   accepted.
3. **Workout evidence** — evidence pipeline facts and exception states only.
4. **AI and entitlement operations** — explicit entitlement and capability-use facts only, without
   paid-user, grant-balance, revenue, or provider-cost inference.
5. **Financial Actuals** — one truthful `not_configured` state; no money fact, ledger, currency,
   billing, or formula is admitted in this stage.
6. **Forecast Lab** — one truthful unavailable/assumption-labelled entry; no scenario inputs,
   persistence, horizon, or calculation is admitted in this stage.

The current legacy active-plan metrics, activation proxies, completion-rate denominator, plan source
mix, and schema-version metrics are not admitted to Overview. They may remain only as explicitly
labelled migration diagnostics outside the owner Overview if a canonical consumer still requires
them. A missing canonical standalone-calendar fact must render a structured unavailable state, never
fall back to `plan_cycles`, `planned_workouts`, `activePlanUserIds`, a client calculation, or zero.

### Backend Outcome

Reconcile the Admin Analytics server/view contract with the accepted standalone Calendar boundary:
runner-owned workouts are the current product authority, while plans are immutable source provenance
only. Remove legacy plan authority from the Overview-facing read shape, map admitted current facts to
their canonical owners, and make source availability/period semantics truthful enough for the later
Frontend composition. Reuse the existing Admin analytics server/read-model seam. Do not add a second
analytics store, a compatibility projection, a financial model, fixture data, or a client-side truth
path.

### Definition Of Done

- Overview-facing Admin read data contains no current activation, completion, active-plan, plan-source,
  or plan-schema claim derived from legacy container authority.
- Every retained numeric product fact has a canonical source plus explicit population and as-of/period
  semantics; missing authority is an explicit nonnumeric state.
- Existing Admin operational destinations, User/Test-account operations, evidence pipeline truth, and
  entitlements/capability-use operations remain behaviourally intact.
- No finance, billing, grant history, price, forecast, fixture, schema, RLS, hosted, or provider
  mutation is introduced.
- The implementation is covered by focused local read-model/fixture proof and proportional static
  validation. Use a bounded read-only ARCHITECT source-authority review and a bounded read-only QA
  regression review if runtime/fixture proof is run; the BACKEND owner remains the only writer.

### Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Admin Analytics standalone-Calendar read-model reconciliation
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md
Stage: BACKEND standalone-calendar read-model reconciliation

Read AGENTS.md, agents/backend.agent.md, and skills/hito-backend-supabase-contract/SKILL.md. This is
the first implementation stage after accepted Admin Overview direction. Read the Designer audit and
the 2026-08-16 Product Acceptance section in the canonical item before writing.

Outcome: reconcile the existing Admin analytics server/view contract with the accepted Runner
Calendar boundary. Calendar workouts are runner-owned current truth; plans are immutable source
provenance only. Remove legacy plan-container authority from the Overview-facing read shape and map
admitted groups to canonical sources with truthful availability and as-of/period semantics.

The initial Overview supports only: Data readiness; direct Runner/profile/calendar-workout facts;
Workout evidence; explicit AI and entitlement operations; Financial Actuals as not_configured; and
Forecast Lab as unavailable/assumption-only. Activation, retained value, cohorts, trends,
completion-rate denominators, paid-user/revenue/grant-balance/provider-cost facts, and forecasts are
not accepted in this stage. Do not fall back to plan_cycles, planned_workouts, activePlanUserIds,
client-derived truth, or zero when a standalone-calendar authority is missing.

Reuse the existing Admin analytics server/read-model seam. Do not add a new analytics store,
compatibility projection, financial model, schema/migration, RLS change, fixture rows, provider or
hosted action. Preserve Admin operations, user/test-account tables, evidence pipeline truth, and
entitlement/capability-use operations.

Before editing, record the existing seam, proposed new runtime artifacts (or none), and any
superseded legacy responsibility. Validate with focused local source/read-model/fixture proof,
types or generated contracts affected by the change, lint/format/diff hygiene, and a build only if
the task-owned seam requires it. Use an existing named ARCHITECT for a bounded read-only source
authority review and existing named QA for a bounded read-only regression review if runtime/fixture
proof runs; remain the sole implementation writer. Stop and return to PRODUCT if canonical
standalone workout facts cannot represent a required accepted readback without a new persistence
contract, if a second production owner is required, or if a financial/activation definition becomes
necessary. Update only the canonical item with the truthful receipt and next owner. Do not claim
browser, Global QA, hosted, release, or deployment acceptance unless separately assigned.
```

## 2026-08-16 Backend Standalone-Calendar Read-Model Preflight And Stop Receipt

Stage: BACKEND standalone-calendar read-model reconciliation
Stage outcome: stopped before production-source mutation at a demonstrated cross-owner boundary
Next Recommended Role: PRODUCT

### Execution Preflight

- **Mode / owner:** Tracked / BACKEND for a server read-model authority correction. The larger
  canonical item remains `in_progress` under PRODUCT lifecycle ownership.
- **Existing seam reused:** `src/lib/admin-analytics.ts` and
  `src/lib/admin-analytics.server.ts`, with runner-owned Calendar rows read through the established
  standalone Calendar persistence seam; current profile, workout-log, evidence, entitlement, and
  capability-use tables remain the admitted factual owners.
- **New runtime artifacts:** none. No table, migration, RPC, store, fixture, financial model,
  compatibility projection, dependency, or parallel analytics path is admitted.
- **Superseded responsibility:** Overview-level `plan_cycles` authority, `activePlanUserIds`, active-
  plan activation proxies, rough completion denominator, plan source/schema mix, and duplicated
  evidence-funnel interpretation must be removed rather than renamed or aliased.
- **Focused proof:** current source/type consumer map, accepted standalone Calendar source map,
  independent read-only ARCHITECT review, local-link validation, scoped Markdown formatting, and
  diff hygiene. Production source validation was not admitted after the cross-owner stop.
- **Serialization:** the named QA role owns the shared managed `qa_fixture` and runtime for a separate
  Runner Core retry. This stage performed no build, start/stop, reset, seed, fixture, browser, or
  database mutation and did not request a QA subtask.
- **Stop condition reached:** a truthful Backend contract removal breaks current FRONTEND Product
  consumers. Retaining the rejected fields or adding a second `overview` shape would preserve the
  forbidden authority as a compatibility projection. The task therefore stops before source changes
  and returns the coordinated consumer decision to PRODUCT.

### Demonstrated Authority And Consumer Boundary

The physical `planned_workouts` table is already the current standalone Calendar store. It may be
queried as `calendarWorkouts` by runner identity and ordered by date/display order without joining or
filtering through plan status. `origin_kind` and nullable `plan_cycle_id` remain provenance only. It
must not be grouped as active-plan membership or reused as an activation/completion denominator.

The current Admin contract instead requires and returns:

- `accountsActivation.usersWithActivePlan`, `usersWithoutActivePlan`, and
  `setupToActivePlanRate`;
- the entire `plans` group, including active/archived/source/schema aggregates;
- `workoutUsage.roughCompletionRate`, `activePlanUsersWithoutLogs`, and
  `activePlanUsersWithoutRecentLogs30d`; and
- plan-authority fields in `perUserRows`.

`AdminAnalyticsSummarySections.tsx` directly renders those Overview and Funnel fields. Removing or
renaming them in Backend breaks compilation; retaining them keeps rejected product claims visible.
The Users table also renders `Active plan` and `Plans` as ordinary operational columns rather than
explicit legacy migration diagnostics. PRODUCT must decide whether those columns are removed or
retained only in a separately labelled legacy diagnostic destination before a coordinated Frontend
consumer migration.

### Smallest Accepted Backend Contract For The Coordinated Slice

The future Backend-shaped `overview` should contain only:

1. **Data readiness:** one source entry for Auth users, profiles, Calendar workouts, workout logs,
   result assets, actual metrics, comparisons, AI insights, entitlements, and capability usage. Each
   entry carries `available`, `unavailable`, or `error`, plus source, population, lifetime/as-of
   period, and `asOf`; a generated timestamp is not freshness proof.
2. **Runner activity:** structured facts for classified real Auth users, runner profiles,
   `calendarWorkouts`, non-Rest Calendar workouts, workout logs, and outcome counts. Activation,
   retained value, cohorts, trends, and completion rate remain absent or `definition_required`.
3. **Workout evidence:** one non-duplicated factual group for result-asset total/parsed/failed rows,
   actual metrics, comparisons, and AI insights. It is a stage/readiness set, not a conversion
   funnel.
4. **AI and entitlement operations:** explicit entitlement tier/status rows, capability usage with
   truthful period semantics, and insight rows. No paid-user, remaining-grant, revenue, or provider-
   cost inference.
5. **Financial Actuals:** `{ status: "not_configured" }` only.
6. **Forecast Lab:** `{ status: "unavailable", reason: "definition_required" }` only.

Every available numeric fact must include its canonical source, classified-real-runner population,
period, and as-of value. Missing authority remains a structured nonnumeric state, never `null` or a
state word passed to a numeric formatter.

### Validation And Boundary Inventory

| Check                                 | Scenario / environment                                     | Result                       | Evidence                                                                                                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical item and accepted decisions | Complete Designer audit and 2026-08-16 Product Acceptance  | Passed                       | The admitted six groups, prohibited activation/completion/finance inferences, and standalone Calendar boundary were read before any write.                                                                       |
| Legacy Backend discriminator          | Current `admin-analytics.ts` / `admin-analytics.server.ts` | Passed / red cause confirmed | The view contract and server query `plan_cycles`, derive `activePlanUserIds`, active-plan activation, rough completion, plan source/schema groups, and duplicated evidence funnel values.                        |
| Standalone Calendar authority         | Current Calendar persistence/snapshot seams, read-only     | Passed                       | Calendar reads select physical `planned_workouts` by runner/date/order without active-plan status; snapshots expose `planMeta: null`, while optional plan identity is provenance only.                           |
| Frontend consumer reachability        | Current summary, panel, route, and Users-table source      | Failed / cross-owner         | Mandatory consumers render every rejected Overview/Funnel field and label the timestamp `Generated`; Users renders unlabelled active-plan authority. Backend removal alone cannot compile or present truthfully. |
| Compatibility budget                  | Backend-only alternatives                                  | Rejected                     | Retained aliases or an additive parallel `overview` would keep the obsolete path active and violate the explicit no-compatibility-projection boundary.                                                           |
| Persistence/schema requirement        | Current Supabase schema                                    | Passed / none required       | Accepted direct facts already have canonical table owners; no schema, migration, RLS, store, fixture, financial, or forecast contract is required for this stage.                                                |
| Independent authority review          | Named ARCHITECT, read-only                                 | Passed                       | Review independently confirmed the standalone table distinction, exact fields to remove, smallest future shape, and the mandatory Frontend consumer boundary. No mutation occurred.                              |
| Shared runtime/fixture                | Active QA-owned lifecycle                                  | Deferred by coordination     | No local database, `qa_fixture`, runtime, build, or browser action ran. This avoids contaminating the active Runner Core QA retry.                                                                               |
| Source/static checks                  | Production source                                          | Not applicable               | No production source was changed after the demonstrated stop. Source validators, TypeScript, ESLint, and build would not close the cross-owner contract.                                                         |
| Documentation hygiene                 | This canonical item only                                   | Passed                       | The local-link check found one local target and zero missing; scoped Prettier passed; `git diff --check` and the untracked-file no-index whitespace check emitted no errors.                                     |

### Outcome And Next Owner

- **Backend production files changed:** none.
- **Canonical file changed:** this item only, with this preflight and stop receipt.
- **Preserved boundaries:** Admin authentication/operations, Users/Test-account behavior, evidence
  pipeline truth, entitlement/capability-use operations, standalone Calendar persistence, Frontend,
  Design System, fixtures, local database, runtime, hosted state, providers, dependencies, and Git
  state remain unchanged.
- **Product decision required:** decide whether the Users-table plan columns are removed or retained
  solely in a clearly labelled legacy migration-diagnostics destination, then authorize a coordinated
  FRONTEND Product consumer adoption with the Backend contract removal. No financial, activation,
  retention, cohort, trend, or completion definition is required for the accepted initial Overview;
  those values remain absent/unavailable.
- **Implementation DoD:** Not passed because the required cross-owner consumer migration is outside
  this Backend-only dispatch. **Global QA Acceptance:** not run and not claimed.
- **Role / skills / review:** `agents/backend.agent.md`;
  `skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase procedure; one existing
  named ARCHITECT role was reused for bounded read-only review. QA was not reused because its active
  sidebar task owns the shared lifecycle and no runtime/fixture proof ran.
