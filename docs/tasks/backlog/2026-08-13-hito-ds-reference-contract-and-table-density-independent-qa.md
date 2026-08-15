# Hito DS Reference Contract And Table Density Independent QA

## Work Item ID

2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa

## Status

completed

## Type

Tracked — independent focused browser acceptance

## Priority

high

## Owner

QA

## Stage

Completed — the retry admitted a current, healthy, fresh managed `qa_fixture` artifact and passed
the focused desktop/mobile Dark/Light browser matrix.

## Next Recommended Role

PRODUCT — close or reroute the parent batch's historical browser-admission blocker using this
terminal independent QA receipt.

## Parent

[Reference contract and table-density batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md)

## Scope

Independently validate the implemented `/hitoDS` reference-contract and Tables batch. Runtime source,
DS source, Product/Admin source, manifests, fixtures, Figma, hosted state, and Git lifecycle are
read-only.

## Accepted Implementation Evidence

- The Brand validator blocker is closed by
  [Brand favicon label validator reconciliation](./2026-08-13-hito-ds-brand-favicon-label-validator-reconciliation.md).
- The implementation owner reports source/static/build proof for Metadata Tag default Light,
  Reference Link adoption, contained desktop App Shell header anatomy, and Tables hierarchy,
  all-cell anatomy, actions, and reference-only density.

## Task

First establish whether a fresh, healthy, loopback-bound managed `qa_fixture` artifact can be
admitted without colliding with another build/runtime owner. If yes, independently replay the
batch at exact 1470×801 and 375×812 in Dark and Light. If not, preserve the source and report the
exact runtime-admission evidence and browser coverage gap; do not use a stale or ad hoc server.

## Validation Inventory

- Metadata Tags are Light by default; Accent is explicit only, and their semantic meaning remains
  readable in both themes.
- Every Used-in route link and specimen anchor exposes the documented native Reference Link
  contract, including hover/focus-visible, deep-link, tab, browser-history, and keyboard behaviour.
- The contained desktop App Shell reference presents Today/date at start and Week status at end,
  without the fictional Training header or language control.
- Tables has one Tables H2 with Headers, Controls, Rows & values, and Table subjects; no stale
  Facts/Actions chooser; row anatomy includes identity/email, date/time, metric, status, checkbox,
  and accessible action; SM/MD/LG alters reference-only density; the local table owns horizontal
  scrolling rather than the page.
- No task-owned horizontal overflow, browser warning/error, focus-return, Escape, menu, action,
  search/filter/sort, or responsive regression.

## What Not To Touch

- Do not implement or repair a defect, edit source/fixtures, restart a runtime while an existing
  build-output owner holds the lifecycle, modify data, or use hosted/production services.
- Do not elevate focused acceptance to Global QA, release readiness, or deployment acceptance.

## Stop Conditions

- The current QA artifact is stale, missing, unhealthy, non-loopback, or cannot be freshly admitted.
- Another active role owns the build-output/runtime lifecycle.
- Evidence reveals a task-owned defect: report the reproduction and return it to PRODUCT with the
  demonstrated first incorrect owner; do not implement it.

## Handoff Prompt

```text
ROLE: QA

Task: Hito DS Reference Contract And Table Density Independent QA
Mode: Tracked — independent focused browser acceptance
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa.md
Parent implementation: docs/tasks/backlog/2026-08-13-hito-ds-reference-contract-and-table-density-batch.md

Read AGENTS.md, agents/qa.agent.md, and skills/hito-qa-browser-regression/SKILL.md before acting.
This is read-only QA. Do not implement or modify production source, task-owned UI, fixtures, data,
Figma, hosted state, Git state, or deployment configuration.

The Brand validator gate is closed. Independently determine whether a current, healthy,
loopback-bound `qa_fixture` artifact can be admitted without colliding with another active
build/runtime owner. If it can, replay the parent batch at exact 1470×801 and 375×812 in Dark and
Light. Cover Light-default Metadata Tags; native Used-in/specimen Reference Links and
hover/focus/deep-link/history behaviour; contained desktop App Shell Today/date and Week status;
and the Tables family, all row/cell anatomy, accessible actions, SM/MD/LG reference-only density,
search/filter/sort, menus, Escape/focus return, local horizontal scrolling, page containment, and
console health.

If a fresh managed artifact cannot be admitted, or another role owns its lifecycle, do not restart
or bypass it. Record the exact evidence and browser coverage consequence. If you find a
task-owned defect, provide reproduction, first incorrect owner, and evidence; do not repair it.

Write an English Tracked QA receipt in this canonical item with verdict and coverage gaps. Do not
claim Global QA, release readiness, hosted, or deployment acceptance.
```

## Blockers

None. The earlier runtime-admission blocker is preserved in the historical receipt below and was
cleared by the admitted retry.

## Tracked QA Receipt — 2026-08-13

### Task, stage, and validation layer

- **Task:** Hito DS Reference Contract And Table Density Independent QA.
- **Stage:** managed-runtime admission followed by independent focused browser acceptance.
- **Validation layer:** focused Design System browser acceptance only. This is not Implementation
  DoD, Global QA Acceptance, hosted parity, release readiness, or deployment acceptance.
- **Role and procedure:** QA read `AGENTS.md`, `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, this complete item, and the complete parent
  implementation item. No subagent was used.

### Browser Path Preflight and admission decision

- `HEAD` and `origin/main` both resolved to
  `74607987885ca40f33658c79fba174d173d45646`; the Git index was empty. The completed release retry
  is terminal, so no admitted release-candidate freeze was found.
- The parent batch's nine admitted seams were stable across two consecutive SHA-256 reads. QA did
  not modify them.
- The Brand favicon label validator-reconciliation item currently reports `completed`; its accepted
  gate was not reopened.
- `npm run qa:server:status` reported the only canonical loopback server as `managed: true` and
  `providerMode: qa_fixture`, but `compatible: false`, `healthy: false`, `build: broken`,
  `artifactFreshness: stale`, and `freshnessReason: artifact_missing`. The exact missing-artifact
  receipt before the permitted QA-item write was: `Build output is missing the private Admin
repository snapshot marker, generation, or digest
09da2a06e4fc3849ca36a184d5efa04187301b1bcbe18742a573085639db798a.` After this receipt was
  written, the expected repository-document snapshot digest recomputed to
  `86b5b7ac8a808314c89000d074898970563b14e7d72fe6fc22a15185b79e8222`; the runtime remained in
  the same stale/broken admission state. That expected receipt-owned change is not reported as
  unexplained external source movement.
- A separate Design System item,
  `2026-08-13-hito-ds-inline-editable-header-text-anchor-and-affordance.md`, remains `in_progress`
  at `Canonical shared-owner implementation and focused cross-surface validation`. It changed
  `src/styles/controls-fields.css` at `2026-08-13T17:26:47-03:00` and explicitly reserves a fresh
  production build plus managed browser matrix for its own closure. That active owner shares the
  repository build/runtime lifecycle even though it does not overlap the parent batch's nine
  admitted source seams.
- Both task stop conditions therefore apply: the available artifact is stale/unhealthy/broken, and
  another active role owns the next build/runtime lifecycle. QA did not restart, rebuild, stop,
  bypass, or replace that lifecycle and did not navigate a stale bundle.

### Validation inventory

| Check                          | Scenario / environment                                               | Result                   | Evidence                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release/index boundary         | Current `main` checkout                                              | Passed                   | `HEAD == origin/main == 7460798…d45646`; index empty; no active admitted release freeze found.                                                                                                                               |
| Parent candidate stability     | Nine parent runtime/CSS seams, two consecutive reads                 | Passed                   | Every SHA-256 value matched between reads; no parent-source write occurred.                                                                                                                                                  |
| Brand prerequisite             | Canonical Brand validator-reconciliation lifecycle                   | Passed as entry evidence | The prerequisite item currently reports `completed`; QA did not rerun or alter the validator.                                                                                                                                |
| Managed runtime admission      | Canonical `qa:server:status`, loopback `qa_fixture`                  | Failed                   | Both reads returned `compatible:false`, `healthy:false`, `build:broken`, stale `artifact_missing`; expected private Admin snapshot digest moved from `09da…798a` to `86b5…e8222` only after this permitted QA receipt write. |
| Concurrent lifecycle isolation | Active work items and shared build/output boundary                   | Failed admission         | Separate DESIGN SYSTEM work remains `in_progress` and requires its own fresh build/browser closure; QA could not take over or restart the shared lifecycle.                                                                  |
| Metadata Tag visual contract   | 1470×801 and 375×812, Dark/Light                                     | Not run                  | No admissible current browser artifact. Light-default versus explicit Accent and semantic readability remain visually unverified.                                                                                            |
| Reference Link interaction     | Used-in/specimen anchors, hover, focus, keyboard, deep link, history | Not run                  | No admissible current browser artifact. Native navigation, focus-visible, back/forward, and tab/hash behaviour remain unverified.                                                                                            |
| Contained App Shell            | Desktop Today/date and Week status anatomy                           | Not run                  | No admissible current browser artifact. Absence of fictional Training/language controls remains unverified in current rendered output.                                                                                       |
| Tables hierarchy and anatomy   | Headers, Controls, Rows & values, Table                              | Not run                  | No admissible current browser artifact. H2/H3 hierarchy, seven cell types, checkbox, status, and accessible action remain unverified in current rendered output.                                                             |
| Density and table behaviour    | SM/MD/LG, search/filter/sort, menu, Escape/focus return              | Not run                  | No admissible current browser artifact. Reference-only density and all interactive state transitions remain unverified.                                                                                                      |
| Responsive containment         | Exact desktop/mobile, local table scroll and page width              | Not run                  | No admissible current browser artifact. Local-versus-page horizontal overflow ownership remains unverified.                                                                                                                  |
| Browser console health         | Required routes and all four viewport/theme cells                    | Not run                  | No admissible current browser artifact; no console or page-error pass is claimed.                                                                                                                                            |
| Preservation boundary          | Entire QA attempt                                                    | Passed                   | No source, fixture, data, Figma, hosted state, dependency, Git state, runtime lifecycle, provider, or deployment mutation occurred.                                                                                          |

### Issues and coverage gaps

- **Admission blocker, not a demonstrated parent defect:** the current managed artifact cannot be
  accepted as evidence, and QA cannot safely create a new one while another Design System owner is
  active. The exact first incorrect source owner for the missing private Admin snapshot artifact was
  not investigated in this read-only browser assignment; PRODUCT must route or serialize that
  external boundary without treating it as a Reference Contract/Table defect.
- **Browser coverage consequence:** every required visual, responsive, interactive, history,
  focus, menu, Escape, local-scroll, overflow, and console check remains unproven. The parent's
  source/static/build receipt remains implementation-owner evidence only and cannot substitute for
  this independent browser gate.
- **Required retry condition:** rerun this unchanged matrix only after the competing Design System
  lifecycle is terminal and `qa:server:status` proves one current managed artifact with
  `providerMode: qa_fixture`, loopback binding, `compatible:true`, `healthy:true`, `build:ok`, and
  `artifactFreshness:fresh`.

### Verdict

**Verdict: Failed.** The required managed-runtime admission gate failed, so independent focused
browser acceptance cannot pass. No task-owned Product or Design System presentation defect was
established because no current browser artifact was admissible. This verdict does not claim Global
QA, hosted, release, production, or deployment acceptance.

## Retry Tracked QA Receipt — 2026-08-13

### Task, stage, and validation layer

- **Task:** Hito DS Reference Contract And Table Density Independent QA.
- **Stage:** admitted retry after the competing runtime owner completed.
- **Validation layer:** independent focused local browser acceptance for the parent Design System
  batch only. It is not Global QA Acceptance, hosted parity, release readiness, or deployment
  acceptance.
- **Role and procedure:** QA read `AGENTS.md`, `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, this complete item, and the complete parent item.
  The supported browser-control procedures were used for real loopback runtime, DOM, keyboard,
  viewport, history, and screenshot evidence. No subagent was used.

### Execution and Browser Path Preflight

- The prior competing Design System lifecycle was terminal. No current build/runtime owner or
  build-output lock remained; `HEAD == origin/main == 74607987885ca40f33658c79fba174d173d45646`
  and the Git index was empty. The existing dirty checkout was inventoried and preserved.
- The current Brand/Design System prerequisite was rerun rather than inherited:
  `npm run validate-hito-ds-components` passed with 327 scanned files, 43 primitive contracts, 41
  semantic contracts, and 14 text roles.
- QA published an Execution preflight before the only runtime mutation and then executed one
  serialized `npm run qa:server:restart -- --provider-mode qa_fixture`. No duplicate server or
  second restart was created.
- Admission and the final pre-receipt recheck both reported PID `96310`, `managed:true`,
  `compatible:true`, `loopbackBind:true`, `healthy:true`, `build:present`,
  `providerMode:qa_fixture`, `artifactFreshness:fresh`, `freshnessReason:receipt_matches`, and
  `lastArtifactDecision:rebuilt`. The runtime remained bound to `http://127.0.0.1:3000/`.
- The standalone `agent-browser` CLI was unavailable and was not installed. QA pivoted to the
  supported in-app browser and Chrome control surfaces without a platform dialog. The in-app bridge
  proved DOM, hover, and focus-visible state but did not execute native Enter/default hash
  navigation; Chrome independently completed native Enter navigation and back/forward history, so
  this path limitation left no acceptance gap.
- Exact viewport overrides were `1470x801` and `375x812`. Both were reset and both browser sessions
  were finalized after evidence capture.

### Validation inventory

| Check                                   | Scenario / environment                                                                   | Result | Evidence                                                                                                                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand prerequisite                      | Current checkout, local Design System validator                                          | Passed | `npm run validate-hito-ds-components` passed: 327 scanned files, 43 primitive contracts, 41 semantic contracts, 14 text roles.                                                                                                                              |
| Managed artifact admission              | One serialized local restart, final status recheck                                       | Passed | Managed, compatible, healthy, loopback-only `qa_fixture`; present fresh build with `receipt_matches`; PID `96310`; no active build lock.                                                                                                                    |
| Candidate preservation                  | Nine parent TSX/CSS seams before and after browser replay                                | Passed | SHA-256 values remained byte-identical; no parent, runtime source, fixture, data, dependency, Figma, hosted, provider, or Git-lifecycle mutation.                                                                                                           |
| Metadata Tag contract                   | `/hitoDS/components#metadata-tag`; desktop and 375x812 Light, rendered Dark/Light checks | Passed | Unspecified `Plan first` rendered `data-variant="light"`; Light tones stayed quiet/readable; only `Ready`, `Live sync`, and `Core control` examples rendered explicit Accent; mobile page width remained `375 == 375`.                                      |
| Reference Link semantics                | `/hitoDS/components#reference-link`; Used-in and specimen examples                       | Passed | Rendered examples were native `A` elements with truthful `href`, no redundant role, and `tabIndex=0`; route and hash links remained contained on desktop and mobile.                                                                                        |
| Reference Link interaction              | 1470x801 Dark Chrome plus in-app cross-check                                             | Passed | Hover changed quiet surface/border feedback; keyboard focus produced `:focus-visible` and a 2 px signal outline; native Enter navigated `#reference-link -> #buttons`; back returned to `#reference-link`; forward restored `#buttons`.                     |
| Deep-link tab semantics                 | `/hitoDS/components#metadata-tag`                                                        | Passed | Hash target held focus; Status `Variants` was selected with `aria-selected=true`, `tabIndex=0`, and the Variants tabpanel visible while Demo was unselected.                                                                                                |
| Contained App Shell                     | `/hitoDS/patterns#app-shell`, 1470x801 Dark and Light                                    | Passed | `Today` plus `Thursday, August 13` occupied the start group; `Week` plus `On track` occupied the end group; no fictional `Training` or language control; page width was `1470 == 1470`.                                                                     |
| Tables hierarchy                        | `/hitoDS/components#data-table`, desktop/mobile                                          | Passed | Exactly one `Tables` H2; H3 subjects were exactly `Headers`, `Controls`, `Rows & values`, and `Table`; no `Facts` or `Actions` subheading.                                                                                                                  |
| Table anatomy and actions               | Interactive table and approved row specimen                                              | Passed | Seven columns exposed select, runner/email, plan/week, date/time, workouts metric, status, and actions; row checkboxes and action triggers had per-runner accessible names.                                                                                 |
| Search, filter, and sort                | Interactive table, 1470x801 Dark; search repeated at 375x812 Dark                        | Passed | Search reduced the table to the named runner; clear restored it; Active filter returned two Active rows and `1 active table filters`; Runner descending set `aria-sort=descending` and ordered Mara before Eli.                                             |
| Menus, Escape, and focus return         | Mara action menu, desktop and 375x812 Dark                                               | Passed | Menu exposed `Runner actions`, `View runner`, and `Copy email`; Escape closed it, reset `aria-expanded=false`, returned focus to the trigger, and preserved `:focus-visible`.                                                                               |
| Reference-only table density            | Interactive table SM, MD, and LG                                                         | Passed | The same `hito-data-table hito-data-table-min-md` table changed only `data-hito-reference-table-density`; measured row/padding states were SM `56.90/8 px`, MD `67.52/12 px`, and LG `111.30/16 px`.                                                        |
| Responsive containment and local scroll | 1470x801 and exact 375x812, Dark and Light                                               | Passed | Desktop document width remained `1470 == 1470`; mobile remained `375 == 375`. The table scroll owner was `overflow-x:auto`; mobile `clientWidth=271`, `scrollWidth=928`, and a real horizontal gesture changed `scrollLeft 0 -> 320` without page overflow. |
| Browser console health                  | All visited component/pattern routes and four viewport/theme cells                       | Passed | Final Chrome console query returned zero errors and zero warnings.                                                                                                                                                                                          |

### Saved evidence

Browser screenshots are saved under
[qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/),
including:

- `1470x801-dark-reference-link-focus.png`;
- `1470x801-dark-app-shell.png` and `1470x801-light-app-shell.png`;
- `1470x801-dark-tables-lg-filtered.png` and `1470x801-light-tables-contained.png`;
- `375x812-light-metadata-tags-variants.png`;
- `375x812-light-table-local-scroll.png`;
- `375x812-dark-reference-link-focus.png`; and
- `375x812-dark-table.png`.

### Issues and coverage gaps

- No task-owned Product or Design System defect was found.
- No required focused check was omitted. The unavailable standalone browser CLI and the in-app
  bridge's native-key/history limitation were exhausted with an independent Chrome replay, leaving
  no browser coverage consequence.
- Hosted state, production, release, deployment, provider calls, Product/Admin acceptance outside
  the bounded reference batch, and Global QA remain intentionally out of scope and unclaimed.

### Verdict

**Verdict: Passed.** The current parent candidate passes this independent focused local browser
acceptance against a fresh managed loopback `qa_fixture` artifact. The historical failed-admission
receipt above remains factual for its earlier attempt and is superseded for this retry only.
