# Current State

Last updated: 2026-08-30

## Released And Live Revision Boundaries

- Live Git truth: resolve the exact `main` and `origin/main` revisions from Git at execution or
  release time and reconcile them through the live
  [HITO-303 release receipt](https://app.notion.com/p/3ccfe5f58cf5819e8173ee9df4d48c32). This
  versioned document does not embed its containing commit as a current-revision claim.
- Immutable HITO-302 release truth: commit `28cddb8f90b094c66eacae3d9a903a0889336b2b`, parent
  `fca161507e9dd344a141712d48d799b4204091d8`, removed `pnpm-lock.yaml` from `.prettierignore`. It was
  not deployed and changed no product runtime or migration source.
- Deployed runtime truth: the accepted Git-backed Vercel deployment
  `dpl_2u1gAPpRMVgwDg9dWcKnJWVtWjCd` remains at
  `fca161507e9dd344a141712d48d799b4204091d8`; `www` returned HTTP 200 and the apex redirected with
  HTTP 307. The accepted deployment is application evidence, not hosted Supabase migration or data
  parity.
- The admitted HITO-303 recovery release changes documentation/tooling only. It is not deployed and
  carries no product behavior or runtime claim.
- The earlier accepted
  [first-user production launch receipt](tasks/backlog/2026-08-25-hito-first-user-production-launch-readiness.md)
  records a READY Git-backed deployment, HTTP 200, plan Create/Review/Confirm and Saved Review
  restore, standalone Calendar materialisation, FIT/RPE, History/Progress/profile coherence,
  English/Portuguese presentation, responsive/focus proof and exact disposable-data cleanup.
- The live HITO-280 Task later withdrew the monitored-invite acceptance after reported production
  failures. Notion owns whether first-user admission is currently open. Physical iPhone/iPad
  post-fix replay was not claimed and remains a disclosed evidence omission.
- Work after the released baseline is not released merely because it exists in this checkout.
  Notion owns its current lifecycle.

## Current Product And Architecture

- Hito is one React/TanStack Start application with Supabase-backed saved mode and an explicitly
  untrusted signed-out preview.
- Manual, template, AI and imported content uses one reviewed `WorkoutDocument` path. Explicit
  Confirm materialises runner-owned Calendar workouts; sources remain provenance only.
- Result/Evidence owns provider-neutral outcomes and protection facts. Runner Activity/Progress owns
  factual history, records, load and missingness. Identity owns actor classification.
- `/hitoDS` is the shared Frontend Design System reference. Local Inspector remains loopback-only.
- Notion is operational lifecycle truth; Markdown is technical truth; Git is code history; Supabase
  is runtime truth.

## Durable Data Boundary

The accepted
[production compatibility contract](tasks/backlog/2026-08-25-hito-production-data-compatibility-and-supabase-lifecycle-gate.md)
classifies current runner tables as retained truth, provenance, versioned projection or operational
infrastructure. No current runner table is approved for deletion. Physical legacy names are not
evidence of obsolete meaning.

## Unavailable Or Future

- Gate 5 sample-stream aerobic metrics remain `normalized_stream_not_persisted` until their own
  retention/reprocessing work is implemented and accepted.
- Automatic provider synchronization, paid subscriptions and financial operations are not current
  product capabilities.
- Future Blueprint projections are non-workout intent; they cannot receive Calendar mutations or
  evidence before reviewed confirmation.
- Global QA, a provider call or a physical-device pass is never inferred from source/build evidence.

## Canonical Routes

- [Product context](context.md)
- [Current product and business processes](current-product.md)
- [Current system](current-system.md)
- [Functional ownership map](current-functional-map.md)
- [Glossary](glossary.md)
- [Technical history](history/technical-log.md)
