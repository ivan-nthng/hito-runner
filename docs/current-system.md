# Current System

This document owns implemented architecture and unavailable capability boundaries. Product behavior
belongs in [current-product.md](current-product.md), release state in
[current-state.md](current-state.md), and operational lifecycle only in Notion under
[`AGENTS.md`](../AGENTS.md).

## Runtime And Authority

- One TanStack Start/Router React application uses Vite, Nitro and Vercel.
- Supabase owns saved identity, Postgres truth and private Storage. RLS and server-owned actions
  protect runner data; browser code never receives service authority.
- `npm run build` is the production build. Managed loopback QA uses the repository lifecycle; Vite
  development is iteration evidence only.
- Repository migrations are append-only and must match the admitted hosted environment before a
  release or destructive data action.
- The `Hito Running` Notion database is the sole Task lifecycle writer. Markdown, Admin mirrors and
  dashboards cannot change lifecycle.

## Domain Ownership

| Domain                      | Sole current truth                                                                            | Public consumers and boundary                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Identity/Profile            | Authenticated subject, actor classification, profile, locale, timezone and stable constraints | Runner and Admin consume explicit identity results; neither reconstructs policy                           |
| Source Authoring/Provenance | Reviewed source, `WorkoutDocument`, Saved review, Blueprint and immutable origin              | Supplies review/confirm input; never controls a confirmed Calendar workout                                |
| Runner Calendar             | Confirmed workout identity, schedule, content mutations, protection and snapshot              | Product routes consume Calendar DTOs; `planned_workouts` is a physical legacy name only                   |
| Result/Evidence             | Manual results, FIT/source lineage, completion/protection, comparison and insight facts       | Calendar consumes protection/completion; Product consumes provider-neutral projections                    |
| Runner Activity/Progress    | Activity/source/revision truth, factual snapshots, records, load and missingness              | Progress consumes `runner-activity/product-contract.ts`, never private formulas or provider models        |
| Training Decision           | Versioned deterministic continuation input and bounded authoring brief                        | Source Authoring may call the admitted provider/compiler pipeline; Calendar remains downstream of Confirm |
| Entitlement/Commercial      | Grants, capability usage and future paid actuals                                              | Absence is not revenue, payment or a free-tier inference                                                  |
| Admin                       | Admin auth, analytics view models and capture/triage persistence                              | FRONTEND Product presents Admin; Notion remains the work lifecycle owner                                  |

## Dependency Direction

`Identity/Profile → Source Authoring → Runner Calendar → Result/Evidence → Runner Activity/Progress`

Training Decision consumes immutable Blueprint/lineage, explicit runner input and provider-neutral
factual projections; it produces an authoring brief, not Calendar rows. Route functions in
`training-api.ts` and composition in `route-data-actions.ts` are transport/facade seams, not domain
owners. `training.ts` may retain shared public types and utilities but cannot own persistence or
presentation labels.

Manual, template, AI and file-import routes converge on the reviewed `WorkoutDocument` contract.
Explicit confirmation is the only normal materialisation path. Origin remains provenance; physical
`plan_cycles`, `planned_workouts` and `active-plan-*` names do not grant plan-container authority.

## Result, Evidence And Historical Compatibility

- Manual results own runner-authored status, notes, RPE and supported actuals.
- FIT/ZIP is one ingestion adapter into immutable source/revision and provider-neutral Activity
  truth. It never manufactures subjective input.
- Factual projections carry formula/contract versions, input identity and explicit missingness.
- Accepted runner facts, Calendar workouts, source lineage and historical results are preserved
  through additive or explicitly reversible migrations. Frontend and AI never repair legacy rows.
- Derived data is not deletion authority: rebuild and same-version parity must pass before any
  historical projection can be replaced.

## Product, Design System, DevTools And Admin

- Authenticated Product routes consume public domain contracts and do not own persistence or
  formulas.
- `/hitoDS` is the public reference for canonical Hito tokens and primitives. Its specimen state is
  not runner truth.
- Local Inspector/DevTools is lazy, loopback-gated and absent from production behavior. Its only
  task capture boundary is the approved local Notion seam.
- Admin capture is intake/triage, not a second Task queue or runner-data authority.

## Validation Owners

Backend validation is risk-grouped by source, local database, runtime and release boundaries.
Product/Design System changes require focused source, browser, accessibility and independent QA
evidence. Persistence, auth, FIT, provider and release work retains the stronger database, RLS,
migration, privacy and hosted parity gates in current runbooks.

## Unavailable Boundaries

- persisted normalized activity streams and Gate 5 aerobic metrics;
- automatic Garmin or other provider synchronization beyond explicit upload;
- screenshot/OCR plan import and automatic prescription changes from evidence;
- any framework/service split or representation deletion without consumer and replacement proof.

Unavailable evidence stays unavailable. A future Task or historical receipt does not make it current
system behavior.
