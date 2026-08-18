# Hito Paid Plans, Usage Credits, And Cost Attribution

Work Item ID: `2026-08-15-hito-paid-plans-usage-credits-and-cost-attribution`
Status: backlog
Type: Tracked
Priority: high
Owner: PRODUCT
Epic: commercial-financial-foundation
Scope: Product and Backend contract for paid-plan capability access, internal usage credits,
AI-generated-plan charging, user-visible balance/history, and cost attribution into the Admin
financial model. Implementation must be split into separately owned slices after Product accepts the
commercial and user contract.
Archive Intent: Retain until the commercial policy, authoritative ledger contract, paid generation
lifecycle, user/account experience, billing boundary, financial reconciliation, and independent
acceptance are completed or explicitly superseded.
Evidence From: `2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign`

## Task

Define and implement Hito's first paid-capability system around AI-generated running plans. Decide
whether runners need any visible credit abstraction at launch or should instead buy a subscription
with included generations/fair-use access while Hito keeps cost units internal. Establish how many
complimentary and paid-plan generations Hito can afford, how allowances behave, and how the user sees
their plan, remaining usage or policy limit, reset, and an auditable history of generated outcomes.

Connect the same canonical usage events to Hito's Admin financial model so the operator can reconcile
credits granted and consumed with provider usage, loaded generation cost, free-tier subsidy, paid
unit economics, and plan contribution. Internal credits are a product budgeting/usage unit. They are
not LLM tokens, cash, stored value, an investment asset, or a substitute for billing/accounting truth.

The first implementation target is AI-generated-plan preview because that is where the current paid
provider call and cost occur. Saving an already reviewed draft must not charge the user again. Manual
plan creation, deterministic product truth, access to saved plans, workout logging, and deterministic
feedback remain outside the credit charge unless Product separately changes that durable Basic/Pro
contract.

## User Report

Ivan requested a separate implementation task for paid functionality. Hito must determine:

- how many free AI plan generations or internal units a user receives;
- the internal-unit price of creating an AI-generated plan;
- whether the user-facing unit should be credits, crystals, marks, or another branded term;
- where the account shows the current balance;
- how the user can inspect what consumed or returned units; and
- how the internal-unit activity maps back to real provider costs and Hito's financial model.

Ivan subsequently proposed a simpler commercial model: for example, a USD 5 monthly subscription
that includes a bounded allowance, without selling internal coins or tokens separately. Product must
compare that model with subscription fair use, direct generation limits, visible included credits,
add-on credits, one-time plan passes, and tiered subscriptions before selecting the launch package.

No free allowance, paid price, credit denomination, expiry, reset, billing provider, tax policy, or
commercial launch decision has yet been accepted.

## 2026-08-15 Accepted Commercial Direction

Ivan accepted **Option B, subscription with a direct generation allowance and no separately sold
coins**, as the launch baseline for product and financial-sandbox modeling. The initial sandbox may
use USD 5/month as an explicitly labeled price assumption, not as an approved public price. The
included generation count remains unresolved until Hito has measured P95 loaded cost and an accepted
provider-cost/contribution-margin budget.

Options A and C-F remain scenario alternatives in the Admin financial sandbox. They are not launch
entitlements, public promises, or implementation scope unless Product records a later decision.

## Intake And Architecture Preflight

- **Classification:** Tracked. The work crosses pricing, entitlement, auth, persistence, provider
  usage, billing, financial data, migrations, Product UI, privacy, and independent acceptance.
- **Existing task check:** no canonical paid-credit or monetization implementation item existed in
  `docs/tasks/backlog/`. The Admin financial-model item is evidence and a downstream consumer, not
  the lifecycle owner for runner credits or billing.
- **Observed owner:** PRODUCT owns the commercial/user contract and sequence. CHIEF FINANCIAL
  OFFICER owns cost/formula advice. BACKEND owns entitlement, grants, ledger, balance, reservations,
  idempotency, provider-cost attribution, billing synchronization, and read models. FRONTEND Product
  lane owns account/generation interactions. External billing configuration belongs to the accepted
  integration owner. QA owns independent acceptance.
- **Existing seams to reuse:** `runner_entitlements`, `runner_capability_usage`,
  `previewRunningPlanDraft`, `confirmRunningPlanDraft`, the reviewed AI-generated-plan lifecycle,
  `AiPlanGenerationLedgerTrace`, current Product account/settings patterns, and the Admin Backend read
  model.
- **Required new runtime artifact:** a durable, auditable credit/grant/transaction responsibility is
  likely required because the existing aggregate usage counter cannot represent balance provenance,
  expiry, reservation, reversal, refund, or idempotency. BACKEND must prove the smallest schema and
  whether the existing counter becomes a derived aggregate, retained compatibility read, or removed
  responsibility; this intake does not prescribe a migration.
- **No parallel truth:** provider token receipts, a billing-provider balance, Admin forecasts, and a
  client-visible number cannot independently own Hito credit balance. One Backend ledger/read model
  must project all Product and Admin views.
- **No implementation in intake:** no source, schema, migration, fixture, provider call, billing
  mutation, hosted data, or Git action is authorized by this task creation.

## Evidence

- `docs/current-product.md` and `docs/current-system.md` for current commercial and owner boundaries.
- `docs/tasks/product-briefs/2026-05-18-basic-vs-pro-capability-gating-brief.md` for the retained
  pre-billing Basic/Pro decisions.
- `supabase/migrations/20260518183000_basic_pro_entitlement_foundation.sql` for the current
  entitlement and aggregate capability-usage shape.
- `src/lib/running-plan-engine-actions.ts` for the preview/confirm provider and persistence boundary.
- `src/lib/ai-plan-generation-ledger.ts` and `src/lib/ai-first-plan-draft-service.ts` for current
  provider/token/outcome observability.
- [Admin financial-model item](./2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md)
  for cost, margin, subsidy, and scenario formulas.
- The current primary-source comparable-product research linked below.

## Source Investigation

### Current Hito Source

- `docs/current-product.md` records a Backend-owned but pre-billing Basic/Pro foundation. Missing
  entitlement rows currently resolve as effective Pro, and no billing, pricing, subscription, or
  public commercial UI is live.
- `runner_entitlements` stores only user, Basic/Pro tier, source, and active/inactive status.
- `runner_capability_usage` stores an aggregate `used_count` by user, capability, and `period_key`.
  No current production source writes it for AI plan generation, and it has no grant, balance,
  operation, money, provider-unit, reservation, reversal, or expiry truth.
- `previewRunningPlanDraft` invokes the AI-generated-plan preview path. This is the cost-bearing
  operation and currently does not require a persisted authenticated user before entering the
  preview service.
- `confirmRunningPlanDraft` requires an authenticated persisted user, verifies the signed reviewed
  draft, and persists that reviewed plan without another OpenAI call.
- `AiPlanGenerationLedgerTrace` records local/runtime diagnostic facts including provider kind,
  paid-call flag, model, response ID/status, input/output/total token usage, pipeline outcome, and
  sanitized hashes/summaries. It writes expiring local observability artifacts; it is not durable
  per-user product, balance, billing, or finance truth.
- The existing product brief preserves manual and deterministic Basic flows, requires Backend-owned
  auditable usage counters, forbids surprise lockouts, and leaves pricing, included usage, subscription
  copy, downgrade behavior, and the Pro feature set undecided.

### Comparable Product And Platform Research

Research was performed on 2026-08-15 against current primary documentation:

| Reference                                                                                                                                                                                                                 | Observed pattern                                                                                                                                              | Hito implication                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [Adobe generative credits](https://helpx.adobe.com/ie/creative-cloud/apps/generative-ai/generative-credits-faq.html)                                                                                                      | One named generative-credit unit, monthly plan allocation, visible balance/reset date, different feature costs, and no monthly rollover in common plans       | Use one understandable unit and expose the allowance, reset/expiry, and rate before generation.                                                 |
| [Runway credits](https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work) and [usage history](https://help.runwayml.com/hc/en-us/articles/26116703542803-How-to-troubleshoot-a-credit-discrepancy) | Plan and purchased credit sources, a visible rate card, account balance, and a usage table naming where credits were spent                                    | Hito needs one account-level balance/read model with grant-source details and capability-level spend history.                                   |
| [Runway generation refunds](https://help.runwayml.com/hc/en-us/articles/34266159290003-Can-I-have-credits-refunded)                                                                                                       | Platform generation errors restore credits; a completed generation normally remains consumed even if the user dislikes the output                             | Define settlement on a valid Hito reviewable draft and exact release/refund outcomes; subjective dissatisfaction is a separate support policy.  |
| [OpenAI flexible credits](https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-free-go-plus-pro-sora)                                                                                 | Included plan usage is consumed first, add-on credits can extend usage, balance/recent usage are visible, and credits are non-transferable with no cash value | Keep subscription entitlement separate from credit balance, define spend order, and avoid presenting credits as money.                          |
| [Runna pricing](https://www.runna.com/pricing)                                                                                                                                                                            | A running-coach product sells monthly/annual access to personalized plans and coaching as a subscription without a public virtual-currency layer              | Subscription access is a credible runner-facing baseline; Hito does not need to expose credits merely because AI has an internal variable cost. |
| [Stripe immutable balance ledger](https://docs.stripe.com/billing/customer/balance)                                                                                                                                       | Balance is computed from immutable debit/credit transactions; corrections use reversing entries                                                               | Hito's user balance must be auditable and corrected by reversal, not by rewriting or deleting spend history.                                    |
| [Stripe usage events](https://docs.stripe.com/billing/subscriptions/usage-based/how-it-works)                                                                                                                             | Usage events carry customer, amount, timestamp, dimensions, and a unique identifier for idempotency                                                           | Every Hito charge/reservation needs one operation ID and must survive duplicate requests/retries without double-spend.                          |
| [Stripe billing credits](https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits) and [Entitlements](https://docs.stripe.com/billing/entitlements)                                                      | Feature access, credit grants, balance transactions, expiry, and metered billing are related but distinct contracts                                           | Keep `Can use AI plan generation?`, `How many credits are available?`, and `What is billed?` as separate authoritative decisions.               |

These products are reference patterns, not Hito prices, allowances, legal conclusions, or provider
selection.

## Observed Behavior

Hito currently lets real users behave effectively as Pro without live commercial enforcement. The
generated-plan preview may make a paid provider call and return a reviewable plan, but there is no
account credit quote, reservation, debit, refund, balance, rate card, spend history, subscription,
or financial reconciliation.

The local AI generation trace can prove some provider/token facts during an admitted runtime, but it
expires and is not linked into a durable user credit contract. The aggregate capability table is
dormant for this operation and cannot reconstruct individual activity or balance. Therefore neither
source may be promoted into a paid wallet by presentation-only code.

## Expected Behavior

When the paid-capability system is accepted and implemented:

- an authenticated runner sees one clear unit label, available balance, grant sources, expiry/reset,
  and the credit price before starting an AI generation;
- the server quotes and reserves the exact policy-versioned amount before any paid provider call;
- one user action and all safe internal retries share one idempotent operation identity;
- a valid reviewable generated plan settles the reservation exactly once, even if the runner later
  declines to save it;
- preflight rejection, provider error, timeout, empty/non-JSON output, normalization failure, or
  compiler rejection that yields no reviewable plan releases/restores the reservation according to
  the accepted policy;
- confirming/persisting an already reviewed draft never charges again;
- the user can inspect a paginated history of grants, reservations, settled spends, releases,
  refunds/reversals, expiries, purchases, promotions, and support adjustments;
- each history row states date, plain-language capability, credit amount, state, grant source where
  relevant, policy/rate version, and resulting available balance without exposing prompts, secrets,
  or raw provider payloads;
- Admin financial readback can reconcile generated operations, credits consumed, actual provider
  usage/cost, failure subsidy, and revenue allocation without treating credits as cash; and
- manual plans and preserved deterministic Basic functionality continue to work without credits.

## Recommended Unit And Naming Contract For Product Acceptance

### Working Recommendation

- **Recommended launch default:** do not expose a virtual currency while AI plan generation is the
  only metered capability. Show the natural unit, for example `2 plan generations remaining this
month`, or no quota at all when the accepted policy is subscription fair use.
- **Internal identifier:** use an implementation-neutral allowance/cost unit until Product accepts
  a visible wallet. `usage_credit` / `usage_credits` is appropriate only if a multi-capability rate
  card is selected; it must not force user-facing coins into the first release.
- **Fallback user-facing label:** if Product accepts visible generic units, use `Hito credits` in
  explanatory copy and `credits` in compact UI.
- **Do not use `tokens` as the default:** Hito also needs to measure provider input/output tokens;
  using the same word for the user unit would make financial and support explanations ambiguous.
- **Do not call it money or currency:** credits meter product capacity. They have no guaranteed cash
  conversion in the user UI.
- **Branded candidates:** crystals, marks, sparks, strides, or another Hito-specific noun may be
  explored by PRODUCT/COPY/DESIGNER, but the accepted term must always ship with a first-use
  explanation such as `Used to create AI-generated plans` and must test better than plain credits.
- **One unit type:** do not create separate plan coins, AI gems, voice tokens, and provider credits.
  One credit unit may have a versioned capability rate card with different costs.

Before public commercial use, Product must decide non-transferability, resale/gifting, withdrawal,
cash value, refund, expiry, regional consumer-law, tax, minor/user, and terms disclosure with the
appropriate legal/accounting authority. This task is not legal or accounting advice.

## Commercial Packaging Options For Product Acceptance

The cost-bearing implementation and financial attribution are required in every option, but a
user-visible wallet is not. Product should choose the smallest package that matches actual runner
behavior and measured cost variance.

| Option                                                        | Runner sees and buys                                                                                              | Benefits                                                                                                                                         | Risks / when not to use                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Subscription fair use**                                  | One monthly/annual subscription; AI plans are included subject to a plainly disclosed reasonable-use boundary     | Simplest runner proposition; no wallet anxiety or microtransaction feel; monetizes the continuing coaching product rather than one provider call | Use only if natural plan-generation frequency and P95 cost make abuse financially bounded; hidden arbitrary throttling is unacceptable                  |
| **B. Subscription with direct generation allowance**          | One subscription including `N plan generations` or `N full regenerations` per billing period; no credit purchases | Recommended launch candidate when cost needs a hard guardrail; the unit is concrete and supportable; no invented currency                        | Can feel restrictive if routine edits consume a full generation; Product must distinguish full plan creation, adaptation, and provider/system retry     |
| **C. Subscription with included generic credits, no top-ups** | Subscription grants monthly `Hito credits`; capabilities consume a visible rate card; credits cannot be bought    | Useful when several AI capabilities with different costs are expected soon; one shared allowance                                                 | Unnecessary abstraction for one capability; expiry and rate changes add education/support burden even without purchases                                 |
| **D. Subscription plus purchasable top-ups**                  | Included monthly usage first, then optional credit packs or capped overage                                        | Captures heavy-user demand without forcing a higher tier; protects base-plan margin                                                              | Expands payment, refund, expiry, consumer-law, support, and wallet-reconciliation scope; not recommended for initial launch without demonstrated demand |
| **E. One-time plan pass / pay per successful plan**           | Purchase one reviewable AI plan or a small pack; saved plan remains usable                                        | Matches a low-frequency outcome and avoids subscription resistance; revenue and generation cost are easy to relate                               | Weak recurring revenue and retention; users may expect adaptations/support to be included; store/payment fixed fees weigh heavily on low prices         |
| **F. Tiered subscriptions**                                   | Free/Basic plus one or more paid tiers with different feature access and generation limits                        | Supports segmentation and an upgrade ladder; higher tier can absorb high-cost features                                                           | More pricing, entitlement, downgrade, copy, analytics, and QA complexity; premature before one paid tier has usage/retention evidence                   |

### Recommended Launch Sequence

1. **Use accepted Option B as the planning baseline:** one paid monthly subscription, with a small
   number of full AI plan generations/regenerations stated in natural units and no separately
   purchasable coins. The USD 5 amount remains an assumption to model, not an accepted public price.
2. **Prefer Option A if measurement proves it safe:** if legitimate monthly generation frequency is
   naturally low and P95 loaded generation cost remains comfortably inside the cost guardrail,
   remove the visible allowance and sell ongoing coaching access under a disclosed fair-use policy.
3. **Keep the ledger internal:** show the user subscription status, successful plan-generation
   history, remaining natural-unit allowance when applicable, and reset date. Do not show a cash-like
   balance solely because Finance needs cost attribution.
4. **Defer Options C/D:** introduce visible credits only after multiple cost-bearing capabilities or
   demonstrated top-up demand make a shared rate card easier to understand than direct operation
   counts.
5. **Evaluate Option E separately:** if users create one long-lived plan and do not value ongoing
   coaching enough to retain monthly, a plan pass may be more honest than a subscription.

Annual billing may be offered only after monthly price/value and retention are measured. An annual
subscriber should normally receive allowance in monthly service periods rather than one annual lump
that creates abuse, refund, and cost-timing exposure.

### USD 5 Monthly Scenario, Illustrative Only

Channel fees must be removed before deciding the provider-cost allowance:

`NetSubscriptionRevenue = ListPrice - IndirectTax - StoreOrPaymentFee - RefundsAndChargebacks - Discounts`

At a USD 5 list price, before tax, refunds, currency conversion, or country-specific adjustments:

- a web card transaction using Stripe's currently published US standard domestic-card example of
  `2.9% + USD 0.30` yields approximately `USD 4.56`;
- an eligible Apple Small Business or Google Play subscription scenario at a 15% platform fee yields
  approximately `USD 4.25`.

These are channel illustrations, not Hito's accepted processor, market, fee, or proceeds. Current
official references are [Stripe pricing](https://stripe.com/pricing),
[Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/), and
[Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622).

For a deliberately hypothetical 15% AI-provider-cost budget from the channel net receipt:

| P95 loaded cost per successful plan | Maximum included plans from USD 4.56 web net | Maximum included plans from USD 4.25 store net |
| ----------------------------------- | -------------------------------------------: | ---------------------------------------------: |
| USD 0.05                            |                                           13 |                                             12 |
| USD 0.10                            |                                            6 |                                              6 |
| USD 0.20                            |                                            3 |                                              3 |
| USD 0.40                            |                                            1 |                                              1 |

The table is sensitivity analysis, not a recommendation. The 15% assumption must compete with
non-AI infrastructure, support, free-user subsidy, refunds, required contribution margin, and other
variable costs. The accepted included amount must use Hito's measured P95 loaded cost and actual
channel mix.

## Credit Sources And Spend Order

If Product selects a grant/balance option, model one unit with distinct grant lots rather than
unrelated balances. Options A/B may expose subscription access or natural generation counts while
retaining the same auditable operation/cost events internally:

1. **Complimentary onboarding grant:** optional one-time credits for the first successful AI plan.
2. **Free/Basic recurring grant:** optional monthly credits only if the measured free subsidy is
   affordable and abuse controls are accepted.
3. **Paid-plan included grant:** recurring credits linked to a successful subscription/entitlement
   period.
4. **Promotional/support grant:** explicit reason, owner, effective/expiry dates, and audit trail.
5. **Purchased add-on grant:** created only after confirmed billing-provider payment and subject to
   the accepted expiry/refund policy.
6. **Reversal/restoration:** compensating credit transaction linked to the original spend; not a
   generic new promotion.

Recommended spend order is earliest-expiring eligible credits first, normally monthly/included
credits before purchased add-ons. The ledger must retain which grant funded each settled spend.
Product must decide rollover and expiry separately for complimentary, included, promotional, and
purchased grants; one blanket rule is not assumed.

## Cost And Rate-Card Model

Credits deliberately do not equal provider tokens one-to-one. A versioned Hito rate card maps a
runner-facing capability to a stable credit quote while the internal cost model tracks variable
provider economics.

### Loaded Generation Cost

For generation operation `g` under provider/model price version `v`:

`ProviderCost[g] = InputTokens[g] * InputUnitPrice[v] + CachedInputTokens[g] * CachedInputUnitPrice[v] + OutputTokens[g] * OutputUnitPrice[v] + OtherProviderUnits[g] * OtherUnitPrice[v]`

`LoadedGenerationCost[g] = ProviderCost[g] + AllocatedVariableInfrastructure[g] + AllocatedVariableSupport[g] + FailureAndRetryReservePerSuccessfulPlan`

The reserve is not invented margin. It allocates measured costs from failed/retried operations that
Hito chooses not to charge to users across successful reviewable plans.

### Rate Card

`CreditsPerCapability[capability, policyVersion] = ceil(ReferenceLoadedCost / InternalCostValuePerCredit)`

- `ReferenceLoadedCost` should use a measured percentile such as P90/P95, not only the cheapest or
  average call, until usage stabilizes.
- `InternalCostValuePerCredit` exists only for finance/cost attribution and may change through a new
  policy version. It is not displayed as redeemable cash value.
- The runner sees the fixed quoted credits for the selected operation before generation. A provider
  token spike inside that quoted operation must not create a surprise post-generation debit.
- If different plan-generation modes materially change cost, the rate card may expose a small number
  of understandable tiers. It must not mirror every provider/model/token detail.

### Complimentary Allowance

`AffordableFreeSuccessfulPlansPerUser = floor(FreeMonthlyProviderCostBudgetPerUser / P95LoadedCostPerSuccessfulPlan)`

`FreeCreditsGranted = AffordableFreeSuccessfulPlansPerUser * CreditsPerPlanGeneration`

The model must also test a one-time first-plan grant because recurring free credits may not be
required to demonstrate Hito's core value. A result of zero is valid if measured P95 cost, abuse,
conversion, and free-subsidy limits do not support a free AI generation. Manual plan creation remains
the non-AI path.

### Paid Included Allowance

`ProviderCostBudgetPerPaidUser = NetPlanRevenuePerUser * AcceptedProviderCOGSShare`

`AffordableIncludedSuccessfulPlans = floor(ProviderCostBudgetPerPaidUser / P95LoadedCostPerSuccessfulPlan)`

`IncludedCredits = AffordableIncludedSuccessfulPlans * CreditsPerPlanGeneration`

The final allowance must also preserve payment fees, non-AI service costs, free-tier subsidy,
support, target gross/contribution margin, and churn/refund risk from the linked Admin financial
model. `Subscription price / provider cost` alone is not sufficient.

### Financial Reconciliation Outputs

- credits granted, expired, reserved, released, settled, restored, and purchased by period/source;
- successful and failed generation operations by policy/provider/model version;
- provider input/output/cached tokens and actual provider cost where authoritative;
- loaded cost per successful reviewable plan at P50/P90/P95;
- credit redemption rate and unused included-credit amount;
- free AI subsidy per free user and per converted paid user;
- paid included-credit cost, add-on revenue, and provider gross/contribution margin;
- revenue per redeemed credit and cost per redeemed credit, explicitly separate; and
- reconciliation gap between operation usage, provider invoice/receipt, billing settlement, and
  financial-model period.

Credit consumption can estimate service cost only when the rate version is known. Provider invoices
and authoritative token/usage receipts remain the source for actual cash/provider cost.

## Required Authoritative Lifecycle

### Separate Responsibilities

1. **Entitlement:** whether this account may use `ai_plan_generation` at all.
2. **Grant:** why credits became available, in what amount, under which plan/purchase/promotion, and
   when they become effective or expire.
3. **Rate card:** how many credits the quoted capability costs under an immutable policy version.
4. **Operation:** one runner intent to generate, its authenticated user, quote, reservation,
   generation/review identity, provider trace reference, and final state.
5. **Ledger transaction:** append-only credit/debit/reservation/release/reversal/expiry history.
6. **Balance projection:** available, reserved, included, purchased, and next-expiring amounts derived
   from authoritative transactions.
7. **Billing:** external subscription/payment/invoice/settlement truth that may create or void grants.
8. **Financial attribution:** provider cost and revenue allocation derived for Admin reporting.

These responsibilities may share a bounded Backend model, but must not be collapsed into one mutable
`balance` number or one aggregate `used_count`.

### AI Plan Generation State Machine

`quote -> reserve -> provider_not_started/provider_started -> reviewable_draft_ready -> settle`

Alternative terminal paths:

- `quote/reject`: unauthenticated, invalid input, entitlement denied, or insufficient credits; no
  provider call and no debit;
- `reserve -> release`: cancellation before paid provider start or safe server preflight failure;
- `reserve -> provider_started -> restore/reverse`: accepted provider/system/normalization/compiler
  failure with no reviewable canonical draft;
- `settled`: valid canonical reviewable draft delivered; later refusal to confirm does not silently
  erase the spend;
- `settled -> support_reversal`: exceptional separately authorized correction linked to the original
  transaction; and
- `confirm`: persists the reviewed draft with zero additional credits and the same generation ID.

Internal automatic retries belong to the same operation and quote. An explicit user retry after a
terminal result creates a new quote and operation. The UI must state whether the new attempt can
consume credits.

## User Experience Contract

### Generation Surface

- show either the accepted natural allowance (`2 generations remaining`) or, only under a visible
  credit package, `Your balance` and `This generation costs`, before the final Generate action;
- explain that the charge occurs when a valid AI plan is prepared for review, not when it is saved;
- prevent duplicate clicks while one operation is pending and recover truthfully after reconnect;
- show `Reserved`, `Used`, `Restored`, or `No credits used` based on Backend state;
- when allowance is exhausted, preserve entered setup data and offer only accepted paths such as
  manual plan creation, wait for reset, or upgrade; show `buy credits` only if Option D is separately
  accepted;
- never reveal raw prompts, provider keys, hidden model routing, or internal cost-margin values.

### Account `Plan & Usage` Or `Credits & Usage`

- use `Plan & Usage` for subscription/fair-use/direct-count packages and reserve `Credits & Usage`
  for an accepted visible-credit package;
- show remaining natural-unit allowance or available credits, plus any currently reserved amount;
- breakdown by included/complimentary/purchased/promotional source when materially different;
- next reset/expiry date and amount at risk of expiry;
- current plan/entitlement readback without making credits the entitlement source;
- rate card for eligible capabilities in plain language;
- paginated activity history with date, action, amount, status, grant source, reference, and balance
  after transaction;
- filters for grants, spend, restorations, purchases, and expiry;
- link from a plan-generation spend to the safe generated-plan reference when it still exists;
- accessible zero, loading, stale, error, insufficient, pending, and disputed states; and
- support/reconciliation path for a balance discrepancy without exposing private financial data.

### Admin Readback

- aggregate credits and operation economics by real-user classification, plan, capability, rate
  version, provider/model version, and period;
- individual support lookup only under accepted authority and privacy rules;
- no raw prompt/output or payment credential exposure;
- local/admin/QA/disposable identities excluded from commercial conversion and revenue counts;
- fixture/provider modes visibly separated from actual paid-provider usage; and
- exact reconciliation status rather than inferred cost from credits alone.

## Abuse, Safety, And Commercial Boundaries

- Require a stable authenticated persisted identity before any credit-bearing paid provider call.
- Define whether email verification or another anti-abuse threshold is required before complimentary
  grants; do not use device fingerprinting or hidden personal-data expansion without Product/privacy
  acceptance.
- Prevent account recreation, duplicate webhook delivery, concurrent requests, refresh/replay, and
  retry storms from duplicating grants or spending one balance twice.
- Never permit a negative available balance by normal Product operations. Any billing delay/overage
  policy must be an explicit later decision.
- Credits are non-transferable and cannot be gifted, pooled, withdrawn, resold, or exchanged unless
  Product explicitly opens and legally reviews one of those capabilities.
- Billing-provider objects do not replace Hito's product entitlement/usage truth; Hito does not
  invent payment success from client callbacks.
- Refunds, chargebacks, cancellations, upgrades, downgrades, plan renewal, failed renewal, grace
  periods, and account deletion each need explicit grant and entitlement behavior.
- Purchased and included grants must not be silently conflated. Downgrade must preserve saved plans
  and deterministic runner truth.
- Current effective-Pro users require an explicit migration/grace/communication decision; launch
  must not silently convert previously available AI generation into an unexplained zero balance.
- Material financial transaction retention/deletion is an accepted legal/accounting/privacy policy,
  not a routine user-row cascade assumption.

## Required Discriminator And Product Decisions

Implementation is blocked until Product accepts or obtains authoritative answers for:

1. Visible unit name: plain `Hito credits` or a tested branded alternative.
2. First charged capability: AI plan preview only, or another explicitly bounded list.
3. Settlement point and the exact failure/refund matrix.
4. Complimentary policy: one-time first plan, recurring Basic allowance, both, or none.
5. Paid packaging: subscription fair use, subscription with a direct generation allowance,
   subscription with visible included credits, subscription plus add-ons, one-time plan pass, tiered
   subscriptions, or an explicitly bounded combination.
6. Expiry/rollover and spend order for each grant source.
7. Current-user transition and downgrade behavior.
8. Stable base currency, provider price source, P90/P95 measured generation cost, free-subsidy budget,
   paid-plan price assumption, provider COGS share, and target contribution margin from the Admin
   financial-model item.
9. Billing provider and markets only after pricing/package acceptance; hosted provider configuration
   and paid/test transactions require separate explicit authority.
10. Tax, refunds, stored-value wording, terms, minors, privacy, transaction retention, and regional
    consumer requirements with appropriate professional review.
11. Whether credits are strictly promotional/included capacity at first launch or also purchasable;
    purchasable credits materially expand billing/refund/legal scope.
12. Exact current preview reachability for unauthenticated/non-persisted users and the safe transition
    to an authenticated credit-bearing operation.

## Likely Root Cause Or Required Discriminator

This is a new commercial capability, not a defect with a confirmed root cause. The first missing
discriminator is measured, attributable AI plan-generation cost distribution across successful,
failed, retried, fixture, and abandoned operations, reconciled to current provider pricing/receipts.
Without that distribution and an accepted margin/free-subsidy target, no free allowance, credit
denomination, generation rate, or public price is decision-grade.

The first incorrect implementation owner would be any client-only balance, mutable counter, or
billing-provider projection used as Hito credit truth. The existing seam to investigate is the
Backend AI preview plus entitlement/usage foundation before adding any persistence.

## What Not To Touch

- No runtime code, route, component, CSS, schema, migration, RLS, fixture, provider configuration,
  secret, hosted data, billing object, webhook, or payment.
- No public price, free allowance, paid-plan promise, credit pack, auto top-up, renewal, expiry, or
  refund claim before Product acceptance and authoritative cost inputs.
- No charge for manual plan creation, saved-plan access, workout logging, deterministic Garmin/FIT
  processing, or deterministic product truth under this item.
- No repurposing `runner_capability_usage.used_count` as a wallet balance.
- No repurposing local `AiPlanGenerationLedgerTrace` artifacts as durable user or accounting data.
- No balance stored only in React/local storage or calculated from an external billing dashboard.
- No separate wallet per capability, spreadsheet-as-runtime, generic payments framework, crypto,
  blockchain, transferable token, cash-equivalent promise, or speculative marketplace.
- No paid provider QA, tax/legal conclusion, hosted mutation, staging, commit, push, deploy, or
  release action without the exact separate authority.

## Planned Owner Slices After Product Acceptance

This parent coordinates the retained outcome. Each cross-owner implementation slice requires its own
bounded child item and one active owner.

1. **CHIEF FINANCIAL OFFICER / DATA QUALITY read-only evidence:** measure accepted generation usage
   and cost distributions, reconcile provider price versions/receipts, and propose allowance/rate
   ranges with confidence and missing evidence.
2. **PRODUCT:** accept naming, charged capabilities, grant/expiry/refund/transition policy, package
   shape, target economics, and exact user disclosure.
3. **ARCHITECT / BACKEND read-only contract audit:** map existing entitlement, capability usage,
   preview/confirm, generation trace, auth, and Admin consumers; decide the minimal durable
   grant/operation/ledger/read-model shape and the fate of the aggregate counter.
4. **BACKEND:** implement the accepted authoritative contract, migration/RLS, idempotent quote/
   reserve/settle/release/reversal lifecycle, authenticated preview integration, balance/history
   projections, fixtures, and Admin financial attribution.
5. **INTEGRATION MANAGER / BACKEND:** only after provider selection and explicit external authority,
   connect subscription/payment/webhook truth to entitlement and grants without exposing secrets or
   trusting client callbacks.
6. **COPY / DESIGNER:** validate the unit name and specify generation, insufficient-credit, account
   balance/history, reset/expiry, rate-card, purchase/upgrade, pending/refund, and downgrade states.
7. **DESIGN SYSTEM:** only for demonstrated shared balance, transaction-row, rate-card, or status
   contracts missing from the library.
8. **FRONTEND, Product lane:** implement the approved backend-shaped generation quote/state and
   account `Credits & Usage` experience without client-authoritative calculations.
9. **QA:** independently validate deterministic credit lifecycle, auth/privacy, commercial UI,
   provider/billing boundaries, responsive/accessibility states, and later explicitly authorized
   provider/payment acceptance.
10. **CHIEF FINANCIAL OFFICER / DATA QUALITY:** reconcile the released usage/billing/provider outputs
    into the Admin financial model; this is not Global QA or accounting acceptance.

## Validation Expectations

| Check                    | Scenario / environment                                                                            | Required evidence                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Identity and entitlement | signed-out, unpersisted, Basic, Pro, inactive, admin/test/QA                                      | no credit-bearing provider call without eligible persisted identity; exclusions preserved           |
| Grant lifecycle          | onboarding, monthly included, promo, purchased, reversal                                          | exact effective/expiry behavior, source, priority, and append-only transactions                     |
| Concurrency              | double click, refresh, parallel tabs, network retry, server retry                                 | one operation ID, one reservation, at most one settlement, no negative/duplicate spend              |
| Generation settlement    | preflight reject, provider timeout/error, invalid output, compiler reject, valid reviewable draft | exact release/restore/settle state and user copy for every terminal outcome                         |
| Confirm boundary         | accepted preview confirmed once/retried                                                           | persisted plan created with zero second charge and matching generation reference                    |
| User refusal/retry       | valid preview declined; explicit new retry                                                        | accepted spend remains or support policy applies; new attempt receives a new quote visibly          |
| Grant spend order        | included plus purchased/promotional lots                                                          | earliest-expiring accepted lot ordering and correct remaining-source balances                       |
| Renewal/downgrade/cancel | monthly/annual, failed renewal, grace, Pro to Basic                                               | accepted entitlement/grant transition without deleting saved plans or purchased truth               |
| Billing replay           | duplicated/out-of-order webhook, refund, chargeback                                               | idempotent grant/reversal and no client-trusted payment success                                     |
| History/readback         | grants, reserve, settle, release, reverse, expire                                                 | user and Admin projections reconcile exactly to ledger transactions                                 |
| Provider cost            | fixture, successful paid call, failed/retried call, price-version change                          | authoritative token/usage receipt, policy version, actual/estimated cost distinction, invoice gap   |
| Financial reconciliation | credits, usage, provider invoice, billing settlement, Admin month                                 | revenue per credit and cost per credit remain separate and reconcile within declared freshness      |
| Privacy/security         | normal user, another user, admin support, logs/export                                             | RLS/authority isolation; no prompts, secrets, payment credentials, or raw provider payloads         |
| Browser/accessibility    | desktop/mobile, Light/Dark, keyboard, slow/pending/error                                          | readable balance/rate/history and no hidden charge, overflow, focus, or state ambiguity             |
| Cleanup/fixture          | disposable local user and fixture provider                                                        | all task-owned rows removed deterministically; no real credits, cost, or commercial counts affected |

Deterministic local fixture proof must not call paid providers or payment systems. A later live
provider/billing acceptance uses the smallest explicitly authorized transaction inventory and is
separate from source/build/browser proof. Global QA, financial/accounting acceptance, legal/tax
acceptance, hosted readiness, release, and production rollout remain separate gates.

## Next Condition

This item remains `backlog` with PRODUCT as lifecycle owner. The launch packaging baseline is
accepted, but implementation becomes ready only after Ivan/Product accept the exact included
generation count, first charged capability, complimentary policy, renewal/reset and failure/refund
behavior, and the first measured cost/margin inputs from the linked Admin financial-model item.
PRODUCT then selects one bounded first owner; this intake does not dispatch implementation.

## 2026-08-15 Product Direction: Complimentary Lifetime Premium

Ivan requires that selected early users may receive Premium access permanently without ever paying.
This is a **complimentary lifetime Premium grant**, not the normal free tier and not an implicit
result of a missing subscription. Its future authoritative contract must preserve the grant source,
granting actor/reason, effective date, no-expiry policy, and auditable transition/revocation policy.
It must remain distinguishable from paid subscriptions, promotional time-limited grants, admin/QA
fixtures, and ordinary free accounts.

Stripe or another payment provider is not yet selected or authorized for implementation. The first
commercial implementation must therefore establish the entitlement/grant contract before any
checkout, webhook, or live payment integration. The financial Owner Console may begin with manual,
explicitly sourced revenue and expense facts; it must not infer customer receipts from entitlement
state.
