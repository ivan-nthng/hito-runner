# HITO-290 — Reconcile Documentation Truth and Business Processes

- Work Item ID: HITO-290
- Status: Tracked — In progress / Verification
- Type: Maintenance
- Priority: High
- Owner: ARCHITECT
- Primary Area: Platform
- Task: [Live Notion Task](https://app.notion.com/p/Reconcile-Documentation-Truth-and-Business-Processes-3cafe5f58cf581e0abf0d074bbafd367)

## Outcome

Reconcile documentation around four authorities without creating a mirror:

- Notion owns Task lifecycle and routing.
- Markdown owns technical contracts, current facts, runbooks and evidence.
- Git owns code history.
- Supabase and server domain contracts own runtime truth.

Ivan accepted all four evidence-led cleanup slices on 2026-08-28. Runtime source, schema, data,
providers, deployment and Git lifecycle remain outside this Task.

## Implemented Reconciliation

- Compacted the eight current documentation owners from 777 to 460 lines. The Product document now
  maps every enduring business process to PRODUCT plus one system/domain owner.
- Removed Markdown lifecycle authority from the backlog README, current functional map, context and
  state documents. Current release truth now points to accepted HITO-280 evidence and
  `main == origin/main == 0f17b71ee871e32ef1448cfc6ad8e8ea7272df55` at the audit snapshot.
- Replaced active-plan ownership wording with Source Authoring, Runner Calendar, Result/Evidence,
  Runner Activity/Progress, Training Decision, Identity, Commercial and Admin boundaries.
- Moved both terminal/unlinked plans from `docs/plans/active/` to the existing
  `docs/plans/archive/` convention. Repaired 58 references across 41 files; `docs/plans/active/` is
  empty.
- Recoverably retired 12 obsolete Markdown files (1,712 lines): five duplicate/empty authority
  documents and seven superseded dated plan-creation QA records. Their accepted May outcome already
  exists in the compact Changelog and Technical Log.
- Recoverably retired 53 screenshots referenced only by those superseded QA records. No live
  technical contract or Notion Task consumed them.
- Replaced 14 obsolete iCloud checkout occurrences across 11 documents with repository-relative
  paths. The compatibility symlink is no longer documentation authority.

## Retained Truth

- All 400 task/evidence documents remain unless one of the seven explicitly superseded process QA
  records above owned it.
- Current environment, release, routing, logging, QA-artifact, test-user, Camelot and portable
  operating-model runbooks remain.
- HITO-279 source/proof and HITO-287, HITO-288 and HITO-289 documents were not cleanup targets.
- Physical names such as `plan_cycles`, `planned_workouts` and `active-plan-*` remain documented only
  as implementation facts, never current Product or Calendar authority.
- HITO-285 remains the only live nonterminal Notion Task without a Repository document. PRODUCT
  must either link technical evidence or record it as an intentional lifecycle-only Task.

## Recovery

External recovery root:

`/Users/ivan/Developer/hito-running-hito290-recovery/HITO-290-2026-08-28`

`MANIFEST.md` records two archived plans, 65 retired files, 60 editable rollback snapshots, original
paths, modes, SHA-256 values and explicit restore instructions. `PRECHANGE-SNAPSHOT.json` is the
machine-readable readback. No file was deleted with `rm` and no new repository archive hierarchy or
registry was created.

## Acceptance Boundary

Implementation proof must establish:

1. every current authority statement resolves to Notion, current Markdown, Git or Supabase exactly
   once;
2. all local Markdown links resolve after plan archival and file retirement;
3. no old iCloud checkout or active-plan authority wording remains in current documents;
4. recovery hashes, modes and paths match the recovered files;
5. protected active work remains outside the cleanup diff; and
6. independent QA reviews authority, business-process ownership, links and rollback evidence.

No runtime, browser, database, hosted, release or Global QA claim belongs to this documentation-only
Task.
