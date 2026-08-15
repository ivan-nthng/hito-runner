# Hito Admin DS Bounded Consumer Remediation

## Work Item ID

2026-08-13-hito-admin-ds-bounded-consumer-remediation

## Status

completed

## Type

Tracked — bounded Admin Design System consumer remediation

## Priority

high

## Owner

frontend

## Frontend Lane

Product — explicit Ivan-authorized Admin internal exception

## Mode

Tracked

## Evidence From

2026-08-13-hito-admin-ds-consumer-and-runtime-admission-audit

## Scope

Implement only the five source-proven, non-behavioral Admin/DS consumer repairs returned by the
completed Admin audit. Ivan explicitly assigned this bounded cross-owner slice to the FRONTEND
sidebar role. The work reuses existing canonical Hito DS contracts and deletes proven duplicate or
local formula paths; it does not create new primitives, tokens, component families, or compatibility
recipes.

## Archive Intent

retain_in_place

## User Report

Ivan wants Admin brought into the existing Hito Design System, but the audit demonstrated that a
broad rewrite would be unnecessary. He explicitly directed the frontend engineer to implement the
remaining bounded corrections, then resume mobile adaptation work.

## Evidence

- [Admin audit](2026-08-13-hito-admin-ds-consumer-and-runtime-admission-audit.md) proves that the
  six Admin render owners broadly reuse the current Hito shell, typography, Fields, Buttons, Tabs,
  Dropdown Menu, surface, status, metadata, and table contracts.
- The audit identifies exactly five repair seams: two shared focus/chrome formula owners, one
  duplicated Data Table toolbar variant, one Admin-login text attenuation, one Capture prompt
  surface/focus treatment, and existing asynchronous feedback semantics.
- The snapshot/runtime blocker is independent: Markdown writes change the private Admin snapshot
  digest, so a built artifact is fresh only until the next admitted document write. UI repairs do
  not bypass or remove that integrity contract.

## Observed Behavior

The shared Admin/Runner/DS CSS retains attenuated local focus/chrome recipes rather than the
canonical solid ring/chrome roles. The Data Table toolbar exposes two classes/variants with
identical output. Three route-level Admin consumers retain a local text alpha, a raw prompt fill,
or async feedback without programmatic live semantics.

## Expected Behavior

- Shared focus uses the existing solid ring contract, while active/selected/hover meaning remains
  separate and visible in both themes.
- Shared ordinary chrome/text reuses the existing semantic chrome/text roles, deleting exact
  redundant formula copies.
- One canonical Data Table toolbar class remains; all current callers preserve their behavior.
- The scoped Admin route consumers reuse existing DS surface/text/focus and native alert/status
  semantics without changing data, mutations, navigation, interaction flows, or copy.
- A fresh managed build/browser proof is used only before the terminal receipt write; no stale
  runtime is accepted as current after backlog movement.

## Source Investigation And Admitted Seams

### Shared existing-contract corrections

- `src/styles/shell-admin-analytics.css:44-55,271-326,515-529,620-622,651-665`
- `src/styles/reference-workbench.css:347-349`
- `src/components/admin/AdminOperationalComponents.tsx:43-88`
- `src/routes/admin.capture.tsx:643-664`

Use the existing solid `--color-ring`, `--color-chrome-subtle`, purpose-correct text roles, and
the existing `hito-data-table-utility-row` class. Delete only the identified focus formula copies,
ordinary local chrome/text formulas, `variant` prop/conditional, `variant="admin"` call, and
`.hito-admin-utility-row` when reachability confirms exact duplication.

### Route-local existing-contract corrections

- `src/routes/admin.login.tsx:50`: replace only `text-foreground/92` with `text-foreground`.
- `src/routes/admin.capture.tsx:1215-1217`: replace only `rounded-xl bg-black/35` on the focusable
  prompt `<pre>` with `hito-surface-flat` plus the existing solid focus-visible ring/outline
  contract. Preserve Technical text, padding, scroll, copy, and containment.
- `src/routes/admin.capture.tsx:787-791,1127-1135` and `src/routes/admin.analytics.tsx:765-775`:
  add only native `role="alert"` to errors and `role="status" aria-live="polite"` to success
  nodes that appear after existing client mutations. Do not alter state, loaders, requests, or
  user-facing copy.

## Demonstrated Root Cause

These are consumer-level drift paths: exact local formula copies bypass shared DS focus/chrome
roles; duplicate toolbar branches preserve identical CSS; and three Admin route seams retain local
presentation/accessibility details despite equivalent canonical contracts already existing.

The private Admin snapshot admission issue is not caused by these visual consumers. A stable,
unchanged digest plus a missing embedded private snapshot value is the required discriminator before
any build/plugin repair may be considered.

## What Not To Touch

- Quick Note behavior, Dialog/disclosure choice, hooks, state, loaders, mutations, auth,
  persistence, data, user copy, provider behavior, or `window.confirm`.
- Shared primitives, tokens, registries, manifests, generated outputs, Figma, migrations,
  build/plugin scripts, Admin snapshot collector/integrity validator, hosted state, or Git lifecycle.
- Analytics domain charts/metrics/colours, table widths and local scroll contracts, status meanings,
  popover/menu blur, auth overlays, meaningful hairlines, or accepted semantic alpha aliases.
- Any unrelated dirty work. Preserve it byte-for-byte.

## Validation Expectations

- Preflight all admitted consumers and exact old-class/formula reachability before edits.
- Prove deleted toolbar prop/class/formula paths have zero reachability and the intended canonical
  replacements are the sole source owners.
- Run focused Prettier, ESLint, relevant Admin/Product/DS validators, and `git diff --check`.
- Build one fresh production/managed `qa_fixture` artifact only after current writers are quiet.
  Browser proof covers Admin login, Capture prompt/feedback/table toolbar, Analytics table/menu,
  desktop and 375×812 in Light/Dark, focus/keyboard, scroll/overflow, and console health.
- If an independent named QA review would materially increase confidence, FRONTEND may request a
  bounded read-only review through the existing QA sidebar role.
- Record any post-receipt snapshot freshness drift as expected lifecycle evidence; do not rebuild
  in a loop or claim final runtime freshness after the receipt changes the digest.

## Stage

FRONTEND implementation and focused Capture acceptance complete; implementation terminal.

## Next Recommended Role

product

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Lane: Product — explicit Ivan-authorized Admin internal exception
Task: Hito Admin DS Bounded Consumer Remediation
Mode: Tracked implementation
Canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-admin-ds-bounded-consumer-remediation.md`
Evidence:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-admin-ds-consumer-and-runtime-admission-audit.md`

Read `AGENTS.md`, `agents/frontend.agent.md`, and the complete
`skills/hito-frontend-design-system/SKILL.md` before acting. Ivan explicitly assigned this bounded
Admin/shared-consumer remediation to the FRONTEND sidebar role. Do not delegate same-lane code.
You may request a named, read-only QA review only when it adds material browser evidence.

Implement only the five source-proven findings in the canonical item:
1. Replace attenuated shared focus-role formulas in `shell-admin-analytics.css` and
   `reference-workbench.css` with the existing solid ring contract; preserve active/selected and
   required surface-separation treatment.
2. Replace only the documented shared ordinary chrome/text formula copies with existing canonical
   chrome/text roles; stop if a primary/secondary semantic decision is not source-proven.
3. Remove the duplicate Data Table toolbar `admin` variant/conditional/caller and
   `.hito-admin-utility-row`, retaining the existing `hito-data-table-utility-row` contract.
4. Correct only Admin Login's `text-foreground/92`, Capture's raw prompt surface/focus treatment,
   and existing async message live semantics as specified in the task.
5. Preserve every excluded behavior and foreign dirty hunk exactly.

Reuse all current Hito tokens, primitives, CSS and route seams. Add no file, token, component,
helper, registry, compatibility path, framework, build-script change, fixture, migration, or
product state. Do not make a local Admin substitute for a shared DS contract.

Before source write, refresh consumer census and dirty boundaries. If an admitted source overlap
has moved, re-establish the exact current owner; do not overwrite it. If the work requires a new
shared primitive/token/validator or Quick Note behavior choice, stop and return the exact boundary
to PRODUCT.

Validate with focused source reachability/deletion assertions, Prettier, ESLint, relevant
Admin/Product/DS validators and `git diff --check`. For browser proof, first admit a fresh managed
loopback `qa_fixture` artifact after writers are quiet; never use stale output. Test Admin Login,
Capture prompt/feedback/table toolbar, and Analytics table/menu at desktop and 375×812 in Light/Dark
with keyboard focus, scroll containment, overflow and console checks. An owner proof before the
terminal receipt is valid; a post-receipt snapshot drift must be reported, not rebuilt in a loop.

Keep the canonical item truthful with one English implementation receipt. Do not stage, commit,
push, deploy, mutate hosted state, change Figma, or claim Global QA/release readiness.
```

## Frontend Execution Preflight — 2026-08-13

- **Assigned outcome:** implement only the five source-proven Admin/shared-consumer reductions from
  the completed audit under Ivan's explicit FRONTEND Product-lane exception, preserving behavior,
  data, auth, layout, and every excluded shared/domain seam.
- **Current source discriminator:** all admitted legacy seams remain reachable: four attenuated
  focus recipes, the documented neutral 6/7/8% chrome and 86% primary-text formulas, the duplicate
  `admin` Data Table toolbar branch/class/caller, Admin Login `text-foreground/92`, Capture
  `bg-black/35`, and the named asynchronous message nodes without explicit live-region semantics.
- **Existing seams reused:** canonical `--color-ring`, `--color-chrome-subtle`,
  `--color-chrome-edge-emphasis`, `--color-foreground`, `hito-surface-flat`, the existing
  `hito-data-table-utility-row`, and native alert/status semantics. The sortable-header focus ring
  keeps its existing background separation layer; active/open selectors and all existing control
  primitives remain in place.
- **Primary/secondary decision:** the four 86% shared selectors render menu/navigation names or
  actions and therefore use `--color-foreground`. Existing supporting metadata remains on its
  separate muted/secondary role. No ambiguous ordinary text consumer is admitted.
- **New production/runtime artifacts:** none. No file, token, component, helper, registry,
  compatibility path, framework, fixture, validator, or state owner is proposed.
- **Net deletion:** remove the toolbar `variant` prop/default/conditional, its sole
  `variant="admin"` caller, the duplicate `.hito-admin-utility-row`, and the exact local percentage
  formulas superseded by existing semantic roles.
- **Dirty boundary:** `reference-workbench.css` contains accepted concurrent reference-link,
  App-Shell, and reference-table-density hunks; `shell-admin-analytics.css` contains accepted
  borderless status-pill hunks. The admitted TSX owners are otherwise clean. These foreign hunks
  are byte-preserved and are not evidence for this task.
- **Runtime boundary:** no build/runtime writer is active. The managed server is stopped and the
  existing artifact is broken/`artifact_missing`; it is not admissible browser evidence. One fresh
  managed `qa_fixture` build will be attempted only after implementation/static proof and before
  the terminal receipt.
- **Focused proof:** exact old-path zero reachability; Prettier, focused ESLint, Admin/Product/DS
  validators and checkout diff hygiene; then, only from a fresh managed artifact, Admin Login,
  Capture and Analytics at desktop/375x812 in Light/Dark with keyboard focus, table/menu behavior,
  local scroll, page overflow, live semantics, and console health.
- **Stop boundary:** return to PRODUCT before any new shared primitive/token/validator, Quick Note
  behavior decision, auth/data/mutation change, unlisted source owner, or inability to preserve a
  foreign dirty hunk.

## Frontend Tracked Implementation Receipt — 2026-08-13

### Stage And Outcome

FRONTEND completed the admitted source implementation and the available fresh-runtime proof. The
five source-proven consumer repairs are implemented without a new runtime artifact, state owner,
token, primitive, CSS recipe, or behavior path. The item remains `blocked` because the fresh managed
runtime returns `capture_load_failed` before the Capture toolbar, item detail, Prompt surface, or
Capture feedback nodes can render. That remaining discriminator is outside the admitted visual
consumer seams and returns to PRODUCT.

### Demonstrated Cause And Existing Owners

- The implementation cause remained the audited consumer drift: local percentage formulas bypassed
  canonical focus/chrome/text roles, two toolbar branches emitted equivalent structure, and the
  named Admin route nodes retained local presentation/accessibility details.
- `shell-admin-analytics.css` and `reference-workbench.css` now consume the existing solid ring and
  semantic chrome/text roles at the exact admitted selectors. The sortable header retains its
  background-separation ring layer.
- `AdminDataTableToolbar` now has one `hito-data-table-utility-row` owner; the `admin` prop,
  conditional, caller, and `.hito-admin-utility-row` recipe are deleted.
- Admin Login, Capture Prompt, and the existing async message nodes now consume the admitted
  foreground, surface/focus, and native alert/status contracts.
- The remaining browser blocker is the Admin Capture loader's live repository-mirror/Supabase
  synchronization path. A safe source-only importer dry run scanned 359 eligible items with zero
  duplicate work-item IDs, while the fresh runtime emitted `capture_load_failed`. No frontend DOM,
  fixture, data, build-plugin, or persistence workaround was added.

### Files Changed

- `src/styles/shell-admin-analytics.css`
- `src/styles/reference-workbench.css`
- `src/components/admin/AdminOperationalComponents.tsx`
- `src/routes/admin.login.tsx`
- `src/routes/admin.capture.tsx`
- `src/routes/admin.analytics.tsx`
- `docs/tasks/backlog/2026-08-13-hito-admin-ds-bounded-consumer-remediation.md`

Foreign reference-workbench, App Shell, table-density, and borderless status-pill hunks remain
outside this receipt and were preserved.

### Validation

| Check                        | Scenario / environment                                                        | Result                | Evidence                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source deletion              | Exact admitted old selectors, prop, caller, classes, and local route formulas | Passed                | Zero reachability for `hito-admin-utility-row`, `variant="admin"`, the toolbar variant type, Admin Login `text-foreground/92`, and Capture `rounded-xl bg-black/35` in the admitted owners.                                                             |
| Formatting                   | Focused Prettier on six source owners and this canonical item                 | Passed                | Prettier write/check completed without drift.                                                                                                                                                                                                           |
| Lint                         | Focused ESLint on the four touched TSX owners                                 | Passed                | No focused ESLint findings.                                                                                                                                                                                                                             |
| Admin validator              | `npm run validate-admin-capture-backlog`                                      | Passed                | All deterministic Admin Capture/backlog contract checks passed.                                                                                                                                                                                         |
| DS validator                 | `npm run validate-hito-ds-components`                                         | Passed                | Component contract validation passed.                                                                                                                                                                                                                   |
| Product validator            | `npm run validate-product-contracts`                                          | Passed                | Relevant Product contracts passed.                                                                                                                                                                                                                      |
| Diff hygiene                 | Checkout `git diff --check` plus untracked canonical-item check               | Passed                | No whitespace errors.                                                                                                                                                                                                                                   |
| Production build             | Managed `qa_fixture` restart after writers were quiet                         | Passed                | Client, SSR, Nitro, and postbuild completed; managed loopback runtime started healthy with `artifactFreshness: fresh`, `freshnessReason: receipt_matches`.                                                                                              |
| Admin Login                  | 1470x801 and 375x812, Light and Dark                                          | Passed                | Canonical foreground computed in both themes; fields and actions remained focusable; page width equalled viewport width and console warning/error logs were empty.                                                                                      |
| Analytics table/menu         | Test accounts, 1470x801 and 375x812, Light and Dark                           | Passed                | Canonical toolbar and sortable-header menu rendered; Escape dismissed the menu; theme menu remained keyboard/focus operable; table overflow stayed local (`1150/1629` desktop and `335/1629` mobile) while page width stayed `1470/1470` and `375/375`. |
| Capture route                | 1470x801 and 375x812, Light and Dark                                          | Blocked               | Authenticated fresh runtime rendered factual `Work items unavailable` and emitted `capture_load_failed` before the admitted toolbar/Prompt/feedback owners mounted. The unavailable state itself had no page overflow or console errors.                |
| Capture source discriminator | `npm run import-admin-backlog-work-items -- --dry-run --debug`                | Passed, non-mutating  | Scanned 359 eligible repository items, reported zero duplicate work-item IDs, and performed zero writes. This does not replace the failed live loader proof.                                                                                            |
| Live feedback semantics      | Existing Capture and Analytics mutation-result nodes                          | Source/build only     | Roles compile at the existing nodes. Runtime success/error replay was not claimed: Capture never mounted and no destructive/disposable data mutation was authorized for this visual task.                                                               |
| Runtime preservation         | Managed fixture after focused replay                                          | Passed before receipt | Server remained healthy and running. This receipt changes the private snapshot digest, so any subsequent stale status is expected lifecycle drift and is not rebuilt in a loop.                                                                         |

### Coverage Consequence, Boundary, And Next Owner

Capture Prompt surface/focus, Capture toolbar coexistence, and rendered Capture alert/status semantics
remain unproven in a live browser. That missing evidence prevents terminal completion even though the
admitted source implementation and the Login/Analytics browser matrix pass. PRODUCT must route the
existing Admin Capture live repository-mirror/Supabase loader boundary to its canonical runtime owner,
then return this item for the remaining read-only Capture replay. No Global QA, hosted, release,
deployment, or Figma acceptance is claimed.

## Frontend Tracked Continuation Closure Receipt — 2026-08-14

### Stage, Preflight, And Outcome

FRONTEND resumed only the missing Capture acceptance after the completed Backend repository-mirror
loader recovery and terminal Design System remediation dependencies. The six admitted source/style
owners reconcile exactly with the recorded implementation: every receipt-named canonical replacement
is present, every deleted legacy path remains unreachable, and the byte identities recorded before
runtime replay remained unchanged after browser and static validation. No production source was
rewritten in this continuation; this canonical lifecycle/receipt update is the only task-owned write.

The current fresh managed `qa_fixture` mounted the real repository-mirror Capture list, the target
work item detail, and its Backend-generated Prompt. The previously missing toolbar, Prompt, focus,
containment, and safely observable feedback evidence passed, so the Frontend implementation is now
terminal.

### Source Identity And Preserved Boundaries

| Existing owner                                        | Pre/post replay SHA-256                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `src/styles/shell-admin-analytics.css`                | `c4e9f99f4e78eb984600b57c7b5b957890217a4c3bb9ef844bd5bcf26fabad7c` |
| `src/styles/reference-workbench.css`                  | `2bac922ffdf13939193c8f058546e7fe63fa2896745bb7eb4e71d6e4cd718a37` |
| `src/components/admin/AdminOperationalComponents.tsx` | `4a64269e1516ea534fa80ece4da127fb7809298d71a9050660b4b7eba823bbbe` |
| `src/routes/admin.login.tsx`                          | `6a47d2fda6b7c6e54bfb65dfcb64bc5596307a590b550e43eca401118deb7de5` |
| `src/routes/admin.capture.tsx`                        | `8d361e4471bd8c2d24e4417cffc69db7d19d44763f6740bf8b8b1b065a047ad5` |
| `src/routes/admin.analytics.tsx`                      | `7d76f2cb41216f4dca830626983dab5ada1fd63526c305d1bcc1408c907e4e54` |

Zero reachability was reconfirmed for `.hito-admin-utility-row`, the Data Table toolbar `admin`
variant/caller/type, Admin Login `text-foreground/92`, and Capture `rounded-xl bg-black/35`. The
single toolbar owner remains `.hito-data-table-utility-row`; the Prompt remains the existing
`hito-surface-flat` plus solid focus-ring composition; the existing error/success nodes retain only
their admitted native alert/status semantics. Backend, persistence, fixtures, shared DS contracts,
auth, mutations, data, unrelated dirty hunks, and hosted/Git lifecycle state were not changed.

### Validation

| Check                    | Scenario / environment                                                                             | Result                          | Evidence                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency discriminator | Completed Backend loader recovery plus six terminal DS remediation records                         | Passed                          | The managed Capture route no longer returned `capture_load_failed`; repository-backed items and the target work-item detail mounted from the current fresh artifact.                                                                                                                                                 |
| Fresh runtime admission  | `npm run qa:server:restart -- --provider-mode qa_fixture`, before browser replay and receipt write | Passed                          | Client, SSR, Nitro, and postbuild completed; managed loopback PID `93191` was healthy, compatible, `artifactFreshness: fresh`, and `freshnessReason: receipt_matches`.                                                                                                                                               |
| Toolbar reuse            | `/admin/capture`, target item mounted                                                              | Passed                          | Exactly one `.hito-data-table-utility-row` and zero `.hito-admin-utility-row` nodes rendered. Search opened its existing focused searchbox without changing data or causing page overflow.                                                                                                                           |
| Prompt surface and focus | 1470x801 and exact 375x812, Light and Dark                                                         | Passed                          | Prompt rendered as focusable `PRE` with `tabIndex=0`, canonical 10px flat-surface radius, theme-semantic background, local `overflow: auto`, and a visible 2px solid ring with 2px offset when focused in both themes.                                                                                               |
| Desktop containment      | 1470x801, Light and Dark                                                                           | Passed                          | Page width remained `1470/1470`; Prompt measured `1150px` with `1148px` client/scroll width. No page or Prompt horizontal overflow was introduced.                                                                                                                                                                   |
| Mobile containment       | 375x812, Light and Dark                                                                            | Passed                          | Page width remained `375/375`; Prompt measured `335px` with `333px` client/scroll width. Toolbar width was contained at `335px`; no page-level horizontal overflow occurred.                                                                                                                                         |
| Feedback semantics       | Safe client-only empty Quick Note discriminator                                                    | Passed within mutation boundary | A whitespace-only note returned before the server caller and rendered `Add a note before saving.` in the existing `role="alert"` node. No fixture row was created. The success node remains source/build-proven as `role="status" aria-live="polite"`; it was not forced because that would require a data mutation. |
| Keyboard/focus           | Toolbar search and Prompt                                                                          | Passed                          | Search activation moved focus to the existing searchbox; the Prompt was present in the native tab order and its focused computed ring was visible in Light/Dark at both tested widths.                                                                                                                               |
| Console health           | Complete focused Capture replay                                                                    | Passed                          | Browser warning/error log was empty.                                                                                                                                                                                                                                                                                 |
| Source and formatting    | Six admitted owners plus canonical item                                                            | Passed before receipt write     | Pre/post SHA-256 identities matched; focused Prettier and ESLint passed; deleted-path assertions remained zero.                                                                                                                                                                                                      |
| Contract validators      | Admin, DS, and Product focused scripts                                                             | Passed                          | `validate-admin-capture-backlog`, `validate-hito-ds-components`, and `validate-product-contracts` all passed.                                                                                                                                                                                                        |
| Diff hygiene             | Checkout `git diff --check`                                                                        | Passed before receipt write     | No whitespace errors.                                                                                                                                                                                                                                                                                                |

### Coverage Consequence, Audit Reconciliation, And Next Owner

Runtime success-status presentation was not triggered because creating a Quick Note would mutate
fixture data; its native live semantics remain source/build-proven while the non-mutating error path
is rendered-browser-proven. This is the only focused coverage limitation and does not keep the
consumer remediation open.

All six Frontend Product source/style conflicts named by the exhaustive release-owner audit now map
to this terminal implementation owner. The separate Design System remediation records referenced by
that audit are also terminal. This closes the audit's Frontend Product source/style conflict cluster;
it does not claim repository-wide release admission, Global QA, hosted, deployment, or Figma
acceptance. Next owner: PRODUCT for any broader release orchestration.

The managed fixture was healthy and fresh immediately before this receipt. This Markdown write
changes the private snapshot digest, so subsequent artifact staleness is expected lifecycle drift;
the server is intentionally left running without a rebuild loop.
