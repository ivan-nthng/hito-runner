# Owner Console Financial And Commercial Foundation

## Status

active

## Canonical Work Items

- [Admin Overview, Financial Model, And QA Fixture Redesign](../../tasks/backlog/2026-08-15-hito-admin-overview-information-architecture-and-qa-fixture-redesign-intake.md)
- [Paid Plans, Usage Credits, And Cost Attribution](../../tasks/backlog/2026-08-15-hito-paid-plans-usage-credits-and-cost-attribution.md)

## Product Outcome

Turn Admin Analytics into an internal Owner Console that separates dated business facts from
scenario forecasts. It must allow Ivan to retain a trustworthy history of expenses, cash, and
customer receipts; expose factual product and usage trends; and safely model future outcomes without
mistaking assumptions for actual financial state.

## Accepted Direction

- Historical charts use dated, attributable source records. Missing data is unavailable, not zero.
- Forecast Lab is separate from actuals, starts from an explicit as-of baseline, and uses a custom
  monthly horizon.
- Expenses and cash/revenue history are durable. Manual operator entries retain provenance and may
  later be supplemented, not overwritten, by automated sources.
- Selected early users receive an explicit complimentary lifetime Premium grant. It is distinct from
  Free, paid subscription, promotional grants, and QA identities.
- Local QA uses isolated synthetic runner and financial datasets. Neither enters real-business
  denominators.
- Payment provider, public price, base currency, tax policy, break-even target, and scenario
  persistence remain Product decisions. Stripe is not assumed.

## Owner Console Information Architecture

### Overview: the 30-second decision surface

1. **Data health:** as-of date, source freshness, truth class, and the most material missing input.
2. **Cash and runway:** available cash, actual monthly cash movement/burn, minimum-cash date when
   enough facts exist.
3. **Revenue and paid base:** gross collections, net receipts, refunds, fees, paid users, MRR only
   when billing truth exists.
4. **Expenses and operating result:** total by category, monthly change, direct service cost,
   free-tier subsidy, and derived operating result.
5. **Product and AI economics:** active users, confirmed plans, first workouts, generation outcomes,
   P50/P95 operation cost, and usage-to-invoice reconciliation state.
6. **Decision strip:** largest variance, break-even gap, top sensitivity, or the data source needed
   before a decision.

### Drill-down sections

- Money History — expenses, receipts, fees, refunds, cash movements, sources, and reconciliation.
- Customers and Product — factual user, plan, workout, activation, retention, and paid-movement
  readback once commercial truth exists.
- AI Economics — successful/failed operations, provider cost, allowance utilization, and variance.
- Forecast Lab — named Base/Downside/Growth scenarios, custom monthly horizon, and formula inputs.
- Data Health — owner, freshness, coverage, formula version, missing-source and conflict states.

Marketing and CAC drill-downs are deferred until acquisition attribution has an authoritative source.

## Delivery Sequence

1. **ARCHITECT audit:** establish existing financial, entitlement, usage, Admin, and fixture truth;
   recommend the smallest durable boundaries. No runtime change.
2. **PRODUCT decisions:** accept the audit's minimum model, base currency, close convention,
   first expense/revenue inputs, target break-even, forecast persistence policy, and payment-provider
   direction.
3. **BACKEND financial facts:** implement the admitted durable manual expense/revenue/cash history,
   provenance, read model, and synthetic finance fixture.
4. **BACKEND commercial foundation:** implement the accepted Free, complimentary lifetime Premium,
   and future paid entitlement/grant contract without checkout.
5. **INTEGRATION MANAGER / BACKEND:** only with explicit authority, connect the selected payment
   provider's settlement and subscription/webhook truth.
6. **DESIGNER then FRONTEND Product:** design and adopt the approved backend-shaped Owner Console
   inside the existing Admin shell; reuse Hito Design System contracts.
7. **QA:** independently exercise formula boundaries, source labels, fixture isolation, financial
   history, scenarios, responsive states, and later payment behavior.

## Boundaries

- No client-side financial authority, implicit provider-price calculation, or duplicate ledger.
- No checkout, webhook, provider, bank, advertising, or hosted mutation before separate approval.
- Forecasts never alter actuals, entitlements, billing, or another scenario.
- A commercial entitlement is not evidence of a cash receipt; revenue uses settlement truth.
- Preserve current Admin health readback until its replacement has accepted source/provenance rules.

## Proof And Exit Conditions

- Every displayed value has a truth class, source, period, currency when relevant, and unavailable
  meaning.
- Fixture rows are deterministic, disposable, and excluded from real denominators.
- Formula cases cover zero/missing denominators, exact break-even, negative contribution, cash timing,
  FX/provider-cost changes, and scenario isolation.
- Payment, accounting, Global QA, hosted, release, and production readiness remain separate gates.

## Immediate Next Action

[Financial And Commercial Source-Of-Truth Audit](../../tasks/backlog/2026-08-15-hito-financial-and-commercial-source-of-truth-audit.md)
is assigned to ARCHITECT for read-only discovery. PRODUCT chooses the first Backend implementation
only after the audit returns.
