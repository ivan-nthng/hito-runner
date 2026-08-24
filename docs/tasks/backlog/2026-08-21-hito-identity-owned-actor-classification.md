# Hito Identity-Owned Actor Classification

Work Item ID: `2026-08-21-hito-identity-owned-actor-classification`
Notion Task: [HITO-237](https://app.notion.com/p/Establish-Identity-Owned-Actor-Classification-3c3fe5f58cf5817fabe6db79fdf0fe17)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Evidence And Progress Product Contract](./2026-08-21-hito-evidence-progress-product-contract.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#phase-5--identity-and-admin-classification-direction)

## Scope

Complete Phase 5 of the accepted modular-monolith plan. Actor classification is an Identity
decision shared by Runner and Admin; it must no longer be owned by an Admin-named module. The work
is serialized: a narrow Frontend Admin presentation migration, one Backend ownership move, then
independent focused acceptance only where the changed contract requires it.

## Archive Intent

Retain the final identity-owned actor-classification contract, removed Admin-owned authority and
focused proof as technical input for HITO-218. Operational lifecycle, delivery steps, handoffs and
history live only in the linked Notion task.

## Task

`src/lib/admin-user-classification.ts` currently owns an account/actor classification decision used
by both Admin Analytics and Runner persisted-user resolution. Preserve current classification
behaviour while moving the shared decision to `src/lib/actor-classification.ts`, under the Backend
Identity boundary. Admin becomes a consumer of Identity's explicit result.

The first slice is Frontend Product only: remove
`admin-analytics-view-model.ts`'s direct import of `admin-user-classification.ts` by deriving its
presentation classification type from the existing `AdminAnalyticsView`/row DTO. No visible Admin
classification behaviour changes in that slice.

The Backend slice then moves the shared decision, updates `request-persisted-user.ts`, Admin
Analytics, local test-account owners and `scripts/lib/qa-test-user-lifecycle.mjs`, and deletes the
Admin-named owner with no alias or re-export. It must preserve authenticated subject resolution,
test/admin classification and Admin's own analytics DTO.

## What Not To Touch

Do not change classification policy, hosted authentication, credentials, account mutation,
Supabase schema/RLS/RPC, runner profile/settings/locale behaviour, Calendar, authoring, Evidence,
Progress, commercial policy, Design System, provider/storage state, Git lifecycle, or accepted
HITO-224/HITO-232/HITO-235/HITO-236 boundaries. Do not add a compatibility export, a second
classifier, a new persistence shape or a dependency framework.

## Proof

Before each owner write, map direct production and focused-proof consumers and verify runtime plus
type-only dependency direction. The Frontend slice proves the Admin presentation type remains
lossless against the existing Admin Analytics DTO. The Backend slice proves Runner persisted-user
resolution and Admin both consume the Identity-owned contract, the retired Admin module has zero
live imports/exports, and existing Admin auth, QA test-user lifecycle, local admin/test-account
protection and Runner persisted-user cases remain valid.

Stop and return to PRODUCT if classification policy changes, hosted auth/credentials or account
mutation is required, an existing DTO cannot represent the Frontend need losslessly, or the move
requires a compatibility projection or a third-domain implementation.
