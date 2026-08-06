# Current Functional Map

Status: canonical route / owner / verifier map
Last Updated: 2026-08-06
Owner: ARCHITECT

## Purpose

Use this file to move from a route or entrypoint to its presentation owner, truth owner, and first
verification class without reconstructing Hito from historical plans. It also supplies the current
service-domain slugs used by new backlog records.

- Product meaning: [current-product.md](current-product.md)
- Implemented architecture and unavailable states: [current-system.md](current-system.md)
- Released and blocked status: [current-state.md](current-state.md)
- Operational lifecycle: [`docs/tasks/backlog/`](tasks/backlog/)
- Evidence and Definition-of-Done policy: [`AGENTS.md`](../AGENTS.md)
- Proportional verification program:
  [Developer Velocity And Proportional Verification](tasks/backlog/2026-08-05-developer-velocity-and-proportional-verification.md)

This map does not dispatch work, redefine Product behavior, or replace source reachability. A route
transport facade is not automatically the domain owner behind it.

## Route, Owner, And Verifier Index

| Scope slug                                        | Routes / entrypoints                                                                                                      | Presentation owner                                                         | Truth owner and first source seam                                                                                                                      | First verifier                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `auth-app-shell-admin-boundary`                   | `src/routes/__root.tsx`, `/`, `/login`, `/api/auth/*`                                                                     | Frontend Marketing for public entry; Frontend Product for saved shell      | Backend auth/session owners under `src/lib/auth-*`, `src/lib/supabase/*`, and request middleware                                                       | `P`; `B:S`; add `B:DB` / `B:RT` when session or saved authority changes                          |
| `public-entry-and-history`                        | `/hub`, `/changelog`, `/change-log`, `/body` redirect                                                                     | Frontend Marketing                                                         | Route-owned static/history readback; `docs/history/changelog.md` owns public highlights                                                                | `P`; `DOC` when history changes                                                                  |
| `runner-profile-settings-onboarding`              | `/`, `/settings`, `/api/profile-avatar/upload`                                                                            | Frontend Product                                                           | `src/lib/training-api.ts` is the transport facade; profile/settings actions, `runner-training-preferences.ts`, and profile persistence own truth       | `P` + `PC`; add `B:S` / `B:DB` when validation or persistence changes                            |
| `generated-plan-creation-engine`                  | `/` setup; active-plan Add dialog                                                                                         | Frontend Product                                                           | `use-generated-plan-setup-state.ts` owns shared setup state; running-plan action/review/compiler and active-plan persistence owners own reviewed truth | `P` + `PC` + affected `B:S`; `B:DB` for confirm persistence                                      |
| `active-plan-lifecycle-calendar-planned-workouts` | `/`, `/workout/$date`                                                                                                     | Frontend Product                                                           | `training-api.ts` transport; active-plan lifecycle, transition, schedule-edit, persistence, and `active-plan-workout-editing/policy.ts`                | `P` + affected `B:S`; `B:DB` for mutation/readback                                               |
| `manual-workout-authoring`                        | `/`, `/workout/$date`; Add/Edit/Move/Copy/Clear                                                                           | Frontend Product                                                           | `src/lib/manual-workout-authoring/*` plus operation-specific active-plan policy and reviewed persistence                                               | `P` + affected manual validator; `B:DB` for mutation/readback                                    |
| `runner-workout-results-and-fit`                  | `/workout/$date`, `/api/workout-result/upload`, `/api/workout-result/remove`                                              | Frontend Product                                                           | `src/lib/workout-result-import/*`, workout-log actions, canonical activity/source/revision lifecycle, result projections                               | `P` + affected `B:S`; FIT/lifecycle changes require `B:DB` + `B:RT`                              |
| `athlete-profile-progress`                        | `/progress`, `/api/runner-activities*`, `/api/runner-activity-progress`                                                   | Frontend Product                                                           | `src/lib/runner-activity/product-contract.ts` is the Product DTO boundary; Runner Activity repositories/read models/snapshots own truth                | `P` + affected Runner Activity validator; persisted lifecycle requires `B:DB` + `B:RT`           |
| `import-export-provider-evidence`                 | `/integrations`, `/api/plan/export`; Product import/export dialogs                                                        | Frontend Product                                                           | Backend import, replacement, export, provider-evidence, and comparison owners                                                                          | `P` + affected `B:S`; add deeper groups only when persistence/provider boundaries are reached    |
| `shared-design-system`                            | `/hitoDS`, `/hitoDS/components`, `/hitoDS/foundations`, `/hitoDS/patterns`, `/hitoDS/export/figma`; `src/components/ui/*` | Design System                                                              | Hito tokens/primitives; `hito-selection-mechanics.ts` and `workbench-settings-controls.tsx` are current shared owners                                  | `DS` + representative `P`; manifest parity when its source changes                               |
| `local-devtools-inspector`                        | `LocalDevtoolMount`; no standalone Product route                                                                          | Frontend DevTools                                                          | `src/components/devtools/*` behind the canonical loopback gate; non-persisting by contract                                                             | `P` with loopback and non-loopback browser proof                                                 |
| `admin-work-items-capture-analytics`              | `/admin/*`, `/api/admin/auth/*`, Markdown importer                                                                        | Admin presentation owner remains an explicit Product/Architecture decision | Backend/Admin tooling owns auth, view models, capture persistence, and read-only backlog projection                                                    | `ADMIN` + affected `B:S`; add `B:DB` / `B:RT` for authority or persistence                       |
| `scripts-validators-qa-infrastructure`            | `scripts/*`, managed QA server, build/finalize lifecycle                                                                  | No Product presentation owner                                              | Backend/tooling owns executable validation and managed runtime lifecycle; QA owns acceptance execution                                                 | Affected leaf check first; grouped `B:*` only at the reached boundary                            |
| `docs-and-source-of-truth`                        | `docs/current-*.md`, `docs/tasks/backlog/*`, supporting/history docs                                                      | Architect or named document owner                                          | Backlog metadata alone owns operational lifecycle; current docs own implemented/status summaries                                                       | `DOC`                                                                                            |
| `running-coach-doctrine-and-workout-identity`     | Running Coach doctrine; workout identity/language consumers                                                               | Running Coach for policy; Frontend Product renders Backend-shaped language | Accepted doctrine plus backend workout-document, language, and compiler owners                                                                         | Affected doctrine/language check within `B:S`; Product browser proof when visible output changes |

`src/lib/training-api.ts` is the route-facing server-function facade. It is never a second domain
model: follow the called focused action/read owner before changing behavior. Likewise,
`src/lib/runner-activity/product-contract.ts` owns the Product DTO boundary, not persisted activity
truth.

The role model currently has no persistent Admin presentation lane. Backend/Admin tooling remains the
truth owner, but `/admin/*` UI work must not be silently assigned to Frontend Product, Marketing, or
DevTools until Product/Architecture names that presentation owner.

## Verifier Legend

- `P` — owner/source reachability, affected-file ESLint, direct Vite HMR for iteration, targeted
  browser states/viewports, and independent owner-level QA. Run one fresh production build before
  browser-visible acceptance or integration.
- `PC` — `npm run validate-product-contracts`.
- `DS` — `npm run validate-hito-ds-components`; run manifest parity only when the manifest source or
  projection changes.
- `B:S` — affected Backend validator first; `npm run validate:backend` for a shared source boundary.
- `B:DB` — `npm run validate:backend:local-db` for persistence/readback/RLS/lifecycle truth.
- `B:RT` — fresh managed built runtime plus `npm run validate:backend:runtime`.
- `B:REL` — `npm run validate:backend:release` only for the release boundary; it includes build,
  integrity, and linked deployment parity.
- `ADMIN` — `npm run validate-admin-capture-backlog`; add the canonical importer dry-run when
  Markdown work-item lifecycle is affected.
- `DOC` — canonical metadata when applicable, local links, Prettier check, and scoped diff hygiene.

There is no canonical standalone `typecheck` command. Do not claim file-scoped TypeScript proof or
invent an alias; current integration typing is exercised by the affected validator/import boundary
and the required production build.

`AGENTS.md` owns the risk-based test inventory, independent-review, browser, and release rules. This
legend only points to existing commands; it does not weaken or duplicate that policy.

## Truth And Availability Boundaries

- Direct `npm run dev` is the iteration/HMR path. The managed production-built QA server is the
  browser-acceptance/runtime path. Neither substitutes for persistence, security, or release proof.
- Backend FIT completion truth is released. Runner-facing FIT-backed Product presentation remains
  separately blocked until native browser attachment, upload, and readback are honestly proven.
- Runner Activity Gates 1-4 are released. Gate 5 remains unavailable as
  `normalized_stream_not_persisted`; provider sync remains future work.
- `/hitoDS` is a public reference, not runner Product truth. Local DevTools remain loopback-only and
  non-persisting.
- Supporting plans, specs, briefs, Admin mirrors, current docs, and history cannot dispatch work.

## Navigation Boundary

Start with the row above, then confirm live imports/consumers before editing. Product behavior stays
in `current-product.md`; architecture and unavailable states stay in `current-system.md` and
`current-state.md`; validation policy stays in `AGENTS.md`; operational work stays only in the
backlog; accepted history stays in the technical log, changelog, and Git.
