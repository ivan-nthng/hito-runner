# Current Candidate Git Release And Vercel Verification — Retry 7

## Work Item ID

2026-08-15-current-candidate-git-release-and-vercel-verification-retry-7

## Status

in_progress

## Type

release and deployment verification

## Priority

high

## Owner

BACKEND

## Mode

Tracked

## Stage

Fresh candidate freeze after complete hosted UI-locale migration parity.

## Parent

[Release Candidate Exhaustive Owner Map And Remediation Audit](./2026-08-14-release-candidate-exhaustive-owner-map-and-remediation-audit.md)

## Depends On

[Hosted UI Locale Migration Parity Reconciliation](./2026-08-15-hito-hosted-ui-locale-migration-parity-reconciliation.md)

## Scope

Reconstruct the candidate from the current shared checkout. If and only if every fresh admission,
staging, source, build, integrity, hosted-parity, Git, and Vercel gate passes, create exactly one
commit on `main`, push once to `origin/main`, and verify the matching Git-backed production
deployment.

## Archive Intent

retain_in_place

## Task

Retry 6 proved all local gates and stopped only at the hosted migration gap. The exact committed
migration is now applied and hosted parity is 41/41. This retry starts from zero and must not reuse
any earlier candidate identity, local result, remote baseline, staging, or deployment evidence.

## User Report

Ivan explicitly authorizes exactly one commit, one push, and matching Git-backed Vercel deployment
verification if every fresh gate passes.

## Evidence

- [Retry 6](./2026-08-15-current-candidate-git-release-and-vercel-verification-retry-6.md)
  passed whole-file admission, exact staging, history, DS, Product, Backend, production build, and
  build integrity before hosted parity stopped it.
- [Hosted UI Locale Migration Parity Reconciliation](./2026-08-15-hito-hosted-ui-locale-migration-parity-reconciliation.md)
  applied only `20260813124903` to project `dltfjwexyctmihclcjqj` and proved 41/41 remote/local
  migration parity plus hosted locale type readback.
- [Exhaustive Owner Map And Remediation Audit](./2026-08-14-release-candidate-exhaustive-owner-map-and-remediation-audit.md)
  remains the terminal source for current candidate ownership and the exact queued exclusions.

## Explicit Release Exclusions

Do not stage or terminalize these queued-only documents unless a fresh snapshot proves they have
become terminal independently:

- `docs/tasks/backlog/2026-08-12-hito-ds-navigation-and-async-toast-demo-clarity.md`
- `docs/tasks/backlog/2026-08-13-hito-ds-reference-link-inspector-registration-and-compact-geometry.md`
- `docs/tasks/backlog/2026-08-13-hito-local-inspector-spacing-readback-and-custom-geometry-clarity.md`
- `docs/tasks/backlog/2026-08-13-hito-public-landing-google-pagespeed-audit.md`

## Required Discriminator

Fresh fetched remote baseline, empty index, two matching current path/content snapshots, and a
complete current whole-file owner map. Any new or moving nonterminal/mixed/unmapped path ends this
freeze before staging.

## What Not To Touch

- Do not repair source, docs, styles, validators, migrations, hosted state, configuration,
  dependencies, fixtures, generated output, or Figma during the freeze.
- Do not partially stage, force-push, manually deploy, apply a migration, mutate hosted data, call
  paid providers, create a branch, or create more than one commit.
- Do not stage an explicit release exclusion.

## Validation Expectations

- Sole-writer proof, fresh fetch/baseline, empty index, matching snapshots, and whole-file owner
  admission before staging.
- Exact staged identity plus `git diff --cached --check`.
- Existing source, build, integrity, and read-only hosted-parity gates after admission.
- One commit, one push, local/origin SHA equality, and matching Git-backed Vercel production
  `READY` verification.

## Next Recommended Role

BACKEND

## Product Dispatch — 2026-08-15

```text
ROLE: BACKEND

Mode: Tracked release
Stage: fresh candidate freeze after complete hosted UI-locale migration parity
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-15-current-candidate-git-release-and-vercel-verification-retry-7.md
Evidence dependencies:
- /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-14-release-candidate-exhaustive-owner-map-and-remediation-audit.md
- /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-15-hito-hosted-ui-locale-migration-parity-reconciliation.md

Ivan explicitly authorizes exactly one commit on main, one push to origin/main, and verification of the matching Git-backed Vercel production deployment only if this fresh candidate passes every required gate.

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the complete canonical item, exhaustive audit, Retry 6, hosted-parity receipt, all terminal remediation receipts, and the existing Vercel release procedure before writing, staging, fetching, or checking release state.

Start from zero. Verify every repository/runtime writer is idle; fetch origin/main; prove branch, HEAD, remote baseline, ahead/behind and empty index; then obtain two fresh matching complete path/content snapshots. Rebuild the whole-file owner map without reusing earlier candidate identities or outcomes.

Admit only current terminal canonical owners, historical release receipts, the terminal audit as its explicit integration dependency, or another directly proven terminal shared integration dependency. Explicitly exclude and do not stage the four queued documents listed in this item. Preserve their nonterminal status. Stop before staging on any new nonterminal, mixed, missing, unexpected, or moving path.

Only after complete admission: stage the exact whole-file inventory; prove staged path/content identity; run git diff --cached --check; then run the existing source, build, integrity and read-only hosted-parity gates. If all pass, create exactly one commit, push once, prove local HEAD and origin/main equal the resulting SHA, and inspect the matching Git-backed Vercel production deployment until READY.

On the first failed gate or unexpected movement: stop, restore an empty index without changing working-tree bytes, and update only this receipt. Do not repair another owner, partially stage, force-push, manually deploy, mutate hosted data, apply a migration, call paid providers, or create a second commit. No generic child agents; use an existing named Hito role only for a bounded read-only ambiguity if genuinely required.

Return an English tracked release receipt: candidate identity, complete owner/exclusion map, staging proof, every actual gate, exact Git/Vercel result or stop, and unclaimed acceptance layers.
```

## Blockers

No pre-dispatch blocker is known. Fresh current admission remains authoritative.

## BACKEND Execution Preflight — 2026-08-15

- **Mode / owner / serialization:** Tracked release owned by BACKEND. BACKEND is the only active
  Hito repository/runtime writer; PRODUCT and FRONTEND are idle, the other named Hito roles are not
  loaded, and the local subagent tree contains only BACKEND. No subagent is used.
- **Required reads:** `AGENTS.md`, `agents/backend.agent.md`, the project Backend/Supabase skill,
  the installed Supabase and Vercel deployment procedures, this complete item, Retry 6, the hosted
  locale-parity receipt, the exhaustive owner audit, and all eight terminal remediation receipts
  were read before any task-owned write, fetch, staging, or release-state check.
- **Existing seams reused:** current Git worktree/index and freshly fetched `origin/main`; direct
  canonical lifecycle receipts; the terminal exhaustive audit as an explicit integration
  dependency; existing source/build/integrity gates; read-only hosted Supabase parity; and the
  existing Git-backed Vercel deployment integration.
- **New artifacts:** none. No production file, migration, helper, validator, fixture, compatibility
  path, configuration, state owner, deployment mechanism, or release workaround is proposed.
- **Candidate and exclusion rule:** compute a new complete path/content inventory and owner map from
  current bytes without reusing any prior snapshot, digest, or admission conclusion. Stage only
  complete admitted files. Preserve and exclude exactly the four queued-only documents unless
  fresh direct evidence proves they independently became terminal.
- **Focused proof:** fresh fetch and branch/baseline/index facts; two matching complete snapshots;
  current whole-file owner mapping; exact staged path/content identity and cached diff hygiene;
  existing source, build, integrity, and read-only hosted-parity gates; then one commit, one push,
  exact SHA equality, and matching Git-backed Vercel production `READY` verification.
- **Stop boundary:** candidate/index/remote movement, a nonterminal/mixed/unmapped admitted path, a
  failed gate, hosted-parity delta, push failure, or terminal Vercel failure stops the release
  without source repair, partial staging, manual deployment, hosted mutation, or a second commit.

## Fresh Pre-Staging Admission Record — 2026-08-15

### Baseline And Initial Snapshots

- Sole writer: BACKEND. PRODUCT and FRONTEND were idle, the other named Hito roles were not loaded,
  and the local subagent tree contained only BACKEND.
- Branch: `main`.
- Freshly fetched local `HEAD` and `origin/main`:
  `74607987885ca40f33658c79fba174d173d45646`; ahead/behind `0 / 0`.
- Index: empty.
- Two new complete snapshots taken five seconds apart matched at 141 dirty/untracked paths.
- Initial path digest:
  `54536b35cbe47f0bb35cbdcfa5778aa4864242aac024cc5cfe0d9a8b33ed0b2f`.
- Initial path/content digest:
  `59adc44a1462df42f6b6091129875a9d54cda127729792068b7054ddb5103219`.
- This admission record changes only the Retry 7 receipt. Two new matching complete snapshots are
  required after this write and immediately before staging.

### Complete Backlog Partition — 76 Paths

- 64 paths parse as `completed`, `closed`, or `archived` and are admitted through their current
  terminal canonical lifecycle records.
- Seven `blocked` paths are the historical 2026-08-14 release receipts through Retry 5 plus Retry 6. They are admitted only through the release-policy historical-receipt category and own no
  production source.
- This Retry 7 item is the sole current `in_progress` release owner.
- Exactly four `backlog` or `ready` queued-only documents are excluded below. No other current
  backlog path is nonterminal.

### Complete Non-Backlog Whole-File Owner Map — 65 Paths

| Current terminal owner evidence                              | Exact current paths                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical Work Loop policy and lifecycle reconciliation      | `AGENTS.md`; `skills/hito-prompt-handoff/SKILL.md`; `docs/history/technical-log.md`                                                                                                                                                                                                                                                                                                           |
| Technical Log derived-date validator repair                  | `scripts/validate-changelog-history-sync.ts`                                                                                                                                                                                                                                                                                                                                                  |
| Logo, favicon, and Brand reconciliation                      | `public/favicon.svg`; `src/components/ui/hito-logo.tsx`; `src/components/hito-ds/reference-brand-page.tsx`                                                                                                                                                                                                                                                                                    |
| Admin Capture repository-mirror recovery                     | `scripts/admin-backlog-import/contract-proof.ts`; `scripts/admin-backlog-import/markdown.ts`; `scripts/import-repo-work-items-to-admin-backlog.ts`; `scripts/validate-admin-capture-backlog.ts`; `src/lib/admin-capture.server.ts`                                                                                                                                                            |
| Backend locale preference and server resolution              | `scripts/validate-backend.mjs`; `scripts/validate-ui-locale-profile.ts`; `src/lib/supabase/database.ts`; `src/lib/user-settings-actions.ts`; `supabase/migrations/20260813124903_runner_ui_locale_preference.sql`                                                                                                                                                                             |
| Shared locale catalog and menu integration                   | `src/components/ui/dropdown-menu.tsx`; `src/components/ui/hito-language-menu.tsx`; `src/lib/ui-locale-messages.ts`; `src/lib/ui-locale.ts`                                                                                                                                                                                                                                                    |
| Completed Design System validator contracts                  | `scripts/validate-hito-ds-component-contracts.ts`                                                                                                                                                                                                                                                                                                                                             |
| Product App Shell ladder and mobile Product slice            | `src/components/AppShell.tsx`                                                                                                                                                                                                                                                                                                                                                                 |
| Frontend Product token remediation                           | `src/components/Calendar.tsx`; `src/components/CompletionPanel.tsx`; `src/components/OnboardingGate.tsx`; `src/components/TodayHero.tsx`; `src/components/progress/ActivityHistoryPanel.tsx`; `src/components/progress/SavedPlanLibraryPanel.tsx`; `src/components/workout-structure/WorkoutStructureTimeline.tsx`; `src/router.tsx`; `src/routes/__root.tsx`; `src/routes/workout.$date.tsx` |
| Terminal mobile Product integration                          | `src/components/progress/RunnerActivityProgressExperience.tsx`; `src/routes/index.tsx`; `src/routes/progress.tsx`; `src/routes/settings.tsx`                                                                                                                                                                                                                                                  |
| Local Inspector radius reconciliation                        | `src/components/devtools/local-ui-inspector-targets.ts`                                                                                                                                                                                                                                                                                                                                       |
| Calendar square-corner reconciliation                        | `src/components/hito-ds/calendar-workout-playground.tsx`                                                                                                                                                                                                                                                                                                                                      |
| Figma export surface and Metadata Tag                        | `src/components/hito-ds/figma-export-board.tsx`                                                                                                                                                                                                                                                                                                                                               |
| Reference Contract and Data Table                            | `src/components/hito-ds/reference-components-controls.tsx`; `src/components/hito-ds/reference-model.ts`; `src/components/hito-ds/reference.tsx`; `src/components/hito-ds/specimen-previews.tsx`                                                                                                                                                                                               |
| Contained reference App Shell                                | `src/components/hito-ds/reference-components-structure.tsx`                                                                                                                                                                                                                                                                                                                                   |
| Header Search and compact header                             | `src/components/hito-ds/reference-navigation.tsx`; `src/components/hito-ds/reference-page.tsx`                                                                                                                                                                                                                                                                                                |
| Mobile reference overview                                    | `src/components/hito-ds/reference-overview-page.tsx`                                                                                                                                                                                                                                                                                                                                          |
| State Surface and Data Table patterns                        | `src/components/hito-ds/reference-patterns-page.tsx`                                                                                                                                                                                                                                                                                                                                          |
| Metadata Tag shared contract                                 | `src/components/ui/metadata-tag.tsx`                                                                                                                                                                                                                                                                                                                                                          |
| Terminal mobile Calendar state surfaces                      | `src/styles/calendar-state-surfaces.css`                                                                                                                                                                                                                                                                                                                                                      |
| Inline Editable and token/chrome contracts                   | `src/styles/controls-fields.css`                                                                                                                                                                                                                                                                                                                                                              |
| Metadata Tag, Reference, workout, and token/chrome contracts | `src/styles/controls-lists.css`                                                                                                                                                                                                                                                                                                                                                               |
| App Shell, radius, mobile, and token/chrome contracts        | `src/styles/foundations.css`                                                                                                                                                                                                                                                                                                                                                                  |
| Mobile density, typography, and logo contracts               | `src/styles/layout-typography.css`                                                                                                                                                                                                                                                                                                                                                            |
| State Surface and token/chrome contracts                     | `src/styles/overlays-feedback.css`                                                                                                                                                                                                                                                                                                                                                            |
| Remediated Foundations Compact and Icons Usage               | `src/components/hito-ds/playground.tsx`; `src/components/hito-ds/reference-foundations-page.tsx`                                                                                                                                                                                                                                                                                              |
| Remediated Hub Mark adoption                                 | `src/routes/hub.tsx`                                                                                                                                                                                                                                                                                                                                                                          |
| Remediated Admin consumer acceptance                         | `src/components/admin/AdminOperationalComponents.tsx`; `src/routes/admin.login.tsx`; `src/routes/admin.capture.tsx`; `src/routes/admin.analytics.tsx`; `src/styles/shell-admin-analytics.css`; `src/styles/reference-workbench.css`                                                                                                                                                           |

The fresh map contains 28 owner groups and 65 unique non-backlog paths and exactly matches the
current inventory: zero missing, extra, duplicate, mixed, or unmapped path.

### Exact Exclusions

| Queued-only document                                                                                  | Current status | Frozen SHA-256                                                     |
| ----------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| `docs/tasks/backlog/2026-08-12-hito-ds-navigation-and-async-toast-demo-clarity.md`                    | `backlog`      | `33eb885d02053459a6eeac457b0994d3248502e2247921cf46982ee55ead9932` |
| `docs/tasks/backlog/2026-08-13-hito-ds-reference-link-inspector-registration-and-compact-geometry.md` | `ready`        | `72b4a0c5c08cd81e1982d2f60fcf3e67831b1b84e3072059fe99581ad91c93fd` |
| `docs/tasks/backlog/2026-08-13-hito-local-inspector-spacing-readback-and-custom-geometry-clarity.md`  | `ready`        | `26f4aaf516abffb25998e4d68a220e1bc7110a09bdb3aefd77ab0e175e237464` |
| `docs/tasks/backlog/2026-08-13-hito-public-landing-google-pagespeed-audit.md`                         | `backlog`      | `676d21bdacd794a1f0bb16ecbd5d747b4723c9292951f6bac415c49eca27b7d3` |

All four exclusions are documentation-only, own no current source hunk, and were byte-stable across
the initial snapshots and owner census. They remain outside release staging and retain their
nonterminal lifecycle truth.
