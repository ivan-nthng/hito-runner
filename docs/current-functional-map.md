# Current Functional Map

- Status: canonical route / presentation / truth-owner / verifier map
- Last updated: 2026-08-28
- Owner: ARCHITECT

Use this file to locate the first owner and proof class without replaying historical plans. Confirm
live imports before editing: a route facade is not automatically the domain owner behind it.

| Scope                            | Routes / entrypoints                            | Presentation owner                     | Truth owner                                             | First proof                                                                |
| -------------------------------- | ----------------------------------------------- | -------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| Public entry and authentication  | `/`, `/login`, `/api/auth/*`                    | FRONTEND Marketing / Product           | Identity/Profile                                        | Product source/browser; Backend auth/database when authority changes       |
| Runner profile and settings      | `/`, `/settings`, profile upload                | FRONTEND Product                       | Identity/Profile                                        | Product contract; Backend persistence when reached                         |
| Source proposal and Saved review | setup, Plans, import/manual entry               | FRONTEND Product                       | Source Authoring/Provenance                             | Authoring/compiler contract; persistence for retained review               |
| Review and Confirm               | review surfaces and confirmation actions        | FRONTEND Product                       | Source Authoring, then Runner Calendar                  | Server contract; database readback for materialisation                     |
| Calendar lifecycle               | `/`, `/workout/$date`; Add/Edit/Move/Copy/Clear | FRONTEND Product                       | Runner Calendar                                         | Calendar policy plus mutation/readback                                     |
| Result and evidence              | workout result/upload/remove routes             | FRONTEND Product                       | Result/Evidence and Activity lifecycle                  | Result contract; database/runtime for FIT lifecycle                        |
| Activity History and Progress    | `/progress`, activity APIs                      | FRONTEND Product                       | Runner Activity/Progress                                | Product DTO and affected factual validator                                 |
| Adaptive continuation            | Blueprint/check-in/review/confirm               | FRONTEND Product                       | Training Decision and Source Authoring                  | Deterministic decision/compiler; reviewed provider path only when admitted |
| Entitlement and commercial facts | account/admin capability surfaces               | FRONTEND Product/Admin                 | Entitlement/Commercial backend                          | Backend persistence and financial provenance                               |
| Admin                            | `/admin/*`, capture and analytics APIs          | FRONTEND Product                       | Admin/Identity backend                                  | Admin validator; database/runtime when authority changes                   |
| Public marketing and history     | `/hub`, public marketing, `/changelog`          | FRONTEND Marketing                     | Route content and `docs/history/changelog.md`           | Product browser; documentation proof for history                           |
| Shared Design System             | `/hitoDS`, `src/components/ui/*`                | FRONTEND Design System                 | Hito tokens/primitives                                  | DS validator and representative Product proof                              |
| Local DevTools                   | `LocalDevtoolMount`                             | FRONTEND DevTools                      | Loopback-gated DevTools                                 | Loopback and non-loopback browser proof                                    |
| QA, scripts and release          | `scripts/*`, managed QA runtime                 | No Product presentation                | BACKEND tooling; QA acceptance                          | Affected leaf check, then current release runbook                          |
| Documentation and lifecycle      | `docs/current-*`, linked evidence, Notion       | ARCHITECT / named document owner       | Notion lifecycle; Markdown technical truth              | Links, instruction resolution, Prettier and diff hygiene                   |
| Running Coach doctrine           | coaching doctrine and training language         | RUNNING COACH policy; FRONTEND renders | Accepted doctrine plus Backend compiler/document owners | Doctrine fixture and visible Product proof when output changes             |

## Verification Boundary

- Product proof means affected source reachability, focused lint/validator, representative browser
  states and accessibility/focus where visible behavior changes.
- Backend proof adds local database, runtime or release validation only when the changed contract
  reaches those boundaries.
- Design System proof uses the existing DS validator and representative Product reuse.
- Documentation proof checks local links, instruction authority, Prettier, whitespace and diff.

Supporting plans, specs, briefs, Admin mirrors, repository receipts, current documents and history
cannot dispatch work. The selected Notion Task alone owns current Status, Phase, Owner and handoff.
