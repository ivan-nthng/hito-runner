# Hito Admin DS Consumer And Runtime Admission Audit

## Work Item ID

2026-08-13-hito-admin-ds-consumer-and-runtime-admission-audit

## Status

completed

## Type

Tracked — Admin presentation audit and implementation routing

## Priority

high

## Owner

designer

## Mode

Tracked

## Scope

Read-only source and rendered-surface audit of the Admin UI against implemented Hito Design System
contracts. Cover the current Admin login, capture, analytics, operational panels, and workspace
navigation owners, including their shell, typography, colour/surface hierarchy, fields, buttons,
tags/statuses, tables, menus, dialogs, spacing, radius, responsive containment, and focus/state
treatment.

This item establishes the factual adoption map and the smallest owner-bounded implementation
slices. It does not redesign Admin, mutate Admin/runtime source, or alter the build snapshot
mechanism.

## Archive Intent

retain_in_place

## User Report

Ivan wants the existing Admin UI brought onto the implemented Hito Design System, with an
evidence-backed review of anything outdated. He also wants the current fresh-runtime admission
blocker removed, but does not authorize treating a visual colour/layout change as a substitute for
the build-integrity cause.

## Evidence

- The existing Admin typography adoption slice completed with accepted Poppins UI/body/label
  ownership and narrowly retained Technical mono for identifiers and measured data:
  `2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`.
- The accepted shell ladder is already implemented for `/hitoDS`, the contained reference, the
  authenticated Runner shell, and Admin reference coverage. It is not permission to flatten
  Admin-owned cards, state surfaces, overlays, or domain data views.
- `scripts/lib/admin-repo-work-item-snapshot.mjs` hashes every Markdown document in the configured
  backlog, brief, and plan roots. `scripts/validate-build-output-integrity.mjs` requires that
  exact private digest in server output. Therefore a receipt or plan write after a build makes the
  existing artifact stale until one fresh managed rebuild; UI token adoption cannot itself remove
  that lifecycle condition.
- The latest Product mobile-density slice compiled client, SSR, and Nitro, then stopped only at
  the missing private Admin repository snapshot digest. No Admin presentation source diagnostic
  preceded that stop.

## Observed Behavior

Admin visual adoption has been performed in bounded earlier slices, but no current end-to-end
consumer census establishes whether every Admin-owned surface now reuses the canonical DS owner or
whether local legacy colour, chrome, typography, radius, spacing, and state recipes remain.

The managed browser artifact is currently unavailable after the expected repository snapshot
digest moved during active backlog receipts. It must not be accepted as fresh until a clean managed
rebuild occurs after all writers settle.

## Expected Behavior

- Every Admin consumer either reuses an implemented Hito DS primitive/token/canonical CSS contract
  or has a source-backed reason to remain a bounded route/domain exception.
- The audit distinguishes an outdated local consumer from valid structural/domain/Admin-specific
  presentation rather than normalizing by screenshot resemblance.
- Any required shared primitive/token/CSS repair is routed to DESIGN SYSTEM; route-local
  presentation adoption is routed to LAYOUT; behavioral/data/auth changes are routed to their
  true owner.
- Browser/runtime acceptance happens only from one fresh, managed, loopback `qa_fixture` artifact
  built after all task and receipt writers are idle.

## Source Investigation

Start with the current Admin source owners identified by prior work:

- `src/routes/admin.login.tsx`
- `src/routes/admin.capture.tsx`
- `src/routes/admin.analytics.tsx`
- `src/components/admin/AdminAnalyticsPanels.tsx`
- `src/components/admin/AdminOperationalComponents.tsx`
- `src/components/admin/AdminWorkspaceNav.tsx`
- their direct canonical CSS/primitive consumers only when source reachability proves ownership.

Compare them to current Design System owners and live `/hitoDS` references. Do not treat a
computed semantic alias as a raw/non-token violation without authorship evidence.

## Required Discriminator

For each finding, provide:

1. Admin route/surface and current source owner;
2. observable/structural role and the exact local recipe or consumer use;
3. canonical DS primitive, token, CSS contract, or reference that should own it — or the factual
   reason it is a valid exception;
4. whether the repair is route-local Layout, shared Design System, or a different owner; and
5. the smallest replacement/deletion boundary, affected consumers, and focused proof.

For runtime admission, state separately whether the only missing condition is a clean rebuild
after writers stop, or show a reproducible source/build defect. Do not infer this from visual
findings.

## What Not To Touch

- No runtime source, CSS, tokens, manifests, validators, generated output, migration, profile,
  auth, provider, fixture, hosted state, Figma, Git lifecycle, or build-script mutation.
- Do not change the Admin snapshot collector or integrity gate in this audit.
- Do not treat the old completed typography work as automatically correct or automatically wrong;
  re-evaluate it through current source reachability.
- Do not start a browser/build/restart or accept a stale runtime as evidence.
- Preserve all unrelated dirty work byte-for-byte.

## Validation Expectations

- Current source inventory and consumer reachability are recorded, not guessed from screenshots.
- Each proposed token/primitive replacement is checked against both themes, state/focus meaning,
  typography truth, responsive containment, and existing Admin functionality.
- The audit clearly separates implementation findings from valid exceptions and from the
  independent snapshot/rebuild lifecycle condition.
- Format the canonical item and run `git diff --check`; no runtime/build/browser proof is claimed.

## Stage

DESIGNER read-only adoption and runtime-admission audit completed on 2026-08-13. No Admin,
Design System, build, runtime, fixture, or hosted implementation was performed.

## Next Recommended Role

PRODUCT — sequence the bounded owner slices below, first reconciling concurrent shared-source work
and the separate Quick Note behavior decision. Do not dispatch a rebuild until all repository
document writers are idle.

## Original Designer Handoff

```text
ROLE: DESIGNER

Task: Hito Admin DS Consumer And Runtime Admission Audit
Mode: Tracked read-only discovery
Canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-admin-ds-consumer-and-runtime-admission-audit.md`

Read `AGENTS.md`, `agents/designer.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` completely before acting.

Outcome:
Create an implementation-ready, source-backed adoption map for the current Admin UI. Determine
which Admin consumers already use canonical Hito DS contracts, which local recipes are truly
outdated, and which apparent differences are justified structural/domain exceptions. Separately
explain the private Admin snapshot/runtime-admission boundary; do not imply that UI restyling fixes
it.

Inspect the admitted Admin owners:
- `src/routes/admin.login.tsx`
- `src/routes/admin.capture.tsx`
- `src/routes/admin.analytics.tsx`
- `src/components/admin/AdminAnalyticsPanels.tsx`
- `src/components/admin/AdminOperationalComponents.tsx`
- `src/components/admin/AdminWorkspaceNav.tsx`
- direct reachable DS/CSS owners and `/hitoDS` references only as required to prove a finding.

Audit shell hierarchy, structural and semantic colour use, typography, fields/buttons, tags/status,
tables, menus/dialogs, spacing/radius, responsive composition, and focus/state treatment. Reuse
current Hito contracts as the comparison point. A computed alias is not evidence of raw token
misuse without authored source evidence.

For every proposed change, record source owner, consumer, canonical DS replacement, exact smallest
seam, affected consumers, deletion/reuse opportunity, focused proof, and real implementation owner:
`LAYOUT` for route-local presentation, `DESIGN SYSTEM` for shared primitive/token/canonical CSS,
or another named role only with source evidence. Record valid exceptions explicitly.

The private Admin snapshot fact is already source-proven: backlog/plan document writes move the
digest that postbuild expects. State whether the current blocker is only the need for one clean
post-writer managed rebuild or identify a reproducible distinct build defect. Do not alter scripts,
runtime, fixtures, source, Figma, hosted state, or Git lifecycle.

Append one concise English decision/audit report and lifecycle receipt to the canonical item. Run
only scoped formatting and `git diff --check`. Return findings to PRODUCT. Do not dispatch
implementation, browser QA, or a rebuild.
```

## Designer Decision And Audit Report — 2026-08-13

### Decision

The current Admin UI does **not** require a broad Design System migration or visual rewrite. The
six admitted render owners already consume the implemented Hito shell, typography, Field, Button,
Tabs, Dropdown Menu, surface, status, metadata, and data-table contracts. Current source contains
one authored raw colour utility (`bg-black/35`) and no remaining legacy typography classes in the
six-file inventory.

The remaining work is a short set of owner-bounded reductions:

1. shared focus and ordinary chrome recipes already proved noncanonical by the completed token
   census;
2. one duplicated Data Table toolbar variant with identical output;
3. two route-local colour/text recipes and missing async-feedback semantics; and
4. a separate Product reconciliation for Quick Note behavior, which must not be disguised as a
   colour or surface cleanup.

### Audit Snapshot And Concurrent Boundary

- Audit snapshot: branch `main`, `HEAD 74607987885ca40f33658c79fba174d173d45646`.
- All six admitted Admin TSX owners were clean at preflight and remained byte-identical through the
  audit. Only this canonical item was written by the Designer.
- Shared Design System owners were already dirty from concurrent work, including
  `reference-workbench.css`, `shell-admin-analytics.css`, `controls-lists.css`, and
  `metadata-tag.tsx`. The current status-pill border removal and Metadata Tag `light | accent`
  implementation are foreign work and were preserved byte-for-byte.
- The existing 2026-08-12 Admin Light/Dark desktop/mobile screenshots were inspected only as
  historical rendered evidence. They support the broad adoption finding but cannot prove the
  current dirty shared contract or fresh runtime state; no current browser claim is made.

### Current Adoption Map

| Current owner                                         | Source-backed adoption                                                                                                                                                                       | Retained responsibility / exception                                                                                                                                                                                   | Decision                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/routes/admin.login.tsx`                          | `bg-background`, auth hero/overlay, `hito-auth-alpha-surface`, `hito-surface-flat`, accepted UI/Body/Label roles, canonical Fields and Buttons                                               | The image, photo overlay, and auth containment are structural/brand composition. One `text-foreground/92` consumer is noncanonical ordinary attenuation.                                                              | Retain the auth composition; make the one route-local text correction.          |
| `src/routes/admin.capture.tsx`                        | Shared workbench shell/header/nav, route stack, Tabs, `AdminDataTableToolbar`, `HitoNativeSelectField`, Hito Fields/Buttons, Metadata Tags/Menus, status/state surfaces, row/table contracts | Internal table scrolling, prompt scroll region, source-path Technical text, and repo/status tones are factual Admin anatomy. One prompt surface is raw `bg-black/35`; async messages lack explicit live semantics.    | Retain domain layout; repair the two bounded consumer seams.                    |
| `src/routes/admin.analytics.tsx`                      | Same shell/navigation contract; shared analytics panels, table toolbar/header/menu, status/state surfaces, Hito controls, semantic tones                                                     | Chart geometry, table minimum widths/internal scroll, visualization colours, IDs/dates/counts in Technical, and local test-account data states are domain truth. Async delete feedback lacks explicit live semantics. | Retain analytics/domain composition; add only route-level status semantics.     |
| `src/components/admin/AdminAnalyticsPanels.tsx`       | `hito-surface-flat`, `hito-state-surface`, Hito Label/Body/Technical, status pills and semantic icons                                                                                        | Metric values, units, tabular numerals, and compact chart/list anatomy are intentional component/domain roles, not ordinary UI copy.                                                                                  | No migration.                                                                   |
| `src/components/admin/AdminOperationalComponents.tsx` | Canonical Hito Field/Button, Radix Dropdown Menu with Hito menu contract, Metadata Tag, sortable/filterable table header semantics                                                           | Despite its filename, this is shared: it is reached by Admin, Product Saved Plan, and `/hitoDS` specimens. Its `admin` versus `data-table` toolbar variant currently emits two identical CSS recipes.                 | DESIGN SYSTEM owns one net-reducing toolbar repair; do not patch Admin locally. |
| `src/components/admin/AdminWorkspaceNav.tsx`          | Shared workbench shell/sidebar/topbar, Hito Logo/Icon/Avatar, canonical shell navigation and Radix account menu, factual active/current state                                                | Logo height and avatar semantic alpha utilities are instance/structural composition. Shared shell focus/chrome formulas are canonical-CSS debt, not an Admin consumer bypass.                                         | Retain the consumer; DESIGN SYSTEM repairs the shared CSS owner.                |

The Admin-authored class census found no raw hex/RGB/OKLCH values, arbitrary geometry utilities, or
legacy typography classes in the admitted TSX owners. `rounded-xl`, table widths, semantic alpha
aliases such as `border-hairline/80`, and calculated/instance logo geometry are not defects merely
because they are numeric or translucent.

### Actionable Findings And Exact Owner Map

| Priority / classification                      | First incorrect source and consumer                                                                                                                                                  | Canonical replacement                                                                                                                        | Smallest deletion/reuse seam and affected consumers                                                                                                                                                                                             | Focused later proof                                                                                                                                                          | Later owner   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| High — shared focus-role bypass                | `shell-admin-analytics.css:49-51,620-622,660-665` and `reference-workbench.css:347-349`; live in Admin sidebar links, mobile quick links, table search and sortable headers          | Existing solid `--color-ring`; preserve separate active/selected backgrounds and any required surface-separation shadow                      | Replace only attenuated `signal` focus cues with the solid ring contract; delete the focus-only percentage formulas. This also affects Runner shell and `/hitoDS`, so no Admin override is allowed.                                             | Keyboard Tab through desktop sidebar/account, mobile section rail, search and table header menus in Dark/Light; visible ring, no clipped cue, unchanged active/hover meaning | DESIGN SYSTEM |
| Medium — shared neutral chrome/text bypass     | `shell-admin-analytics.css:44-55,271-326,651-656`; live shell/nav/menu/table-header consumers                                                                                        | `--color-chrome-subtle`/purpose-correct chrome state and `foreground` or `--color-text-secondary`, as already classified by the token census | Replace exact formula copies and ordinary hover/text attenuation in the shared selector; delete local 6/7/8/86% recipes. Stop on a primary-versus-secondary ambiguity rather than minting another level.                                        | Source equality/deletion plus Admin/Runner/DS menu and header hover/open/active checks in both themes                                                                        | DESIGN SYSTEM |
| Medium — route text attenuation                | `admin.login.tsx:50`, lead explanatory copy                                                                                                                                          | `text-foreground`; the next paragraph already owns the supporting `text-muted-foreground` level                                              | Replace `text-foreground/92` with `text-foreground`; delete the percentage utility. Only Admin login is affected.                                                                                                                               | Login at desktop and 375x812 in Dark/Light; hierarchy remains lead plus supporting copy and no overflow                                                                      | LAYOUT        |
| Medium — route prompt surface and keyboard cue | `admin.capture.tsx:1215-1217`, focusable prompt `<pre>`                                                                                                                              | Existing `hito-surface-flat` plus the existing solid ring utility/contract                                                                   | Replace `rounded-xl bg-black/35` with `hito-surface-flat`; retain Technical, padding and scroll geometry; add a solid `ring`/outline focus-visible cue without a new CSS recipe. Only the expanded capture detail is affected.                  | Desktop/mobile Dark/Light prompt readability, scroll containment, keyboard focus visibility, copy fallback and no layout shift                                               | LAYOUT        |
| Medium — async feedback semantics              | `admin.capture.tsx:787-791,1127-1135` and `admin.analytics.tsx:765-775`; messages appear after client-side mutations                                                                 | Existing semantic text tones plus native `role="alert"` for errors and `role="status" aria-live="polite"` for success; no new component      | Add attributes to the existing message nodes only; do not change mutation state, copy, loaders, APIs or visual recipes.                                                                                                                         | Validation error without a write plus disposable local-fixture success/error replays; accessibility tree exposes alert/status and visual layout stays unchanged              | LAYOUT        |
| Low — confirmed duplicate shared variant       | `AdminOperationalComponents.tsx:43-88`, `admin.capture.tsx:643-664`, and identical `.hito-data-table-utility-row` / `.hito-admin-utility-row` at `shell-admin-analytics.css:515-529` | The existing single `hito-data-table-utility-row` contract                                                                                   | Remove the `variant` prop and conditional, delete the `variant="admin"` call and `.hito-admin-utility-row`. Preserve the existing Data Table class. Affected reachability: Admin Capture/Analytics, Product Saved Plan and `/hitoDS` specimens. | Zero reachability for the prop/class; toolbar search/filter/row-count wrap and keyboard menu checks at desktop/375px                                                         | DESIGN SYSTEM |

These findings reuse existing owners and delete local recipes or branches. They require no token,
primitive, file, framework, registry, fixture path, compatibility layer, or new CSS owner.

### Retained Exceptions And Non-Findings

- The Admin and DS workbenches intentionally share the existing sidebar/background/canvas/sticky
  header ladder. Dark `surface` versus Light `background` for the main canvas is an accepted
  theme-resolved shell decision, not an inconsistency.
- `hito-surface-flat`, `hito-state-surface`, auth overlays, Quick Note elevation, popover/menu blur,
  hairline edges, and semantic status fills express containment, elevation, or intent. They are not
  candidates for blanket transparency or one neutral fill.
- Analytics metrics, chart bars/legends/tooltips, status/entitlement colours, tabular Technical
  text, table minimum widths and internal horizontal scrolling are domain/component facts. Preserve
  them unless a separate measured domain audit proves a defect.
- Data Table uppercase header anatomy and compact status typography are accepted component-bound
  roles. They do not reintroduce the retired generic micro-label role.
- Admin Metadata Tag consumers currently omit `variant` and therefore resolve to quiet `light`,
  which is appropriate for dense metadata. The concurrently dirty shared implementation still has
  its own accepted typed-contract/migration work; do not create an Admin-only accent or tone API,
  and refresh that owner before any consumer migration.
- The native `window.confirm` used before quick-note deletion is behavioral confirmation, not an
  authored Admin surface recipe. Replacing it would require a Product/interaction decision and an
  admitted behavior owner; this audit does not infer that decision from visual consistency.

### Quick Note Stop And Product Reconciliation

`2026-06-13-admin-capture-bug-01-add-quick-note-dialog-dismissal-and-shell-reuse.md` already owns a
high-priority behavioral decision for Quick Note dismissal and Dialog reuse. Its current prompt is
partly stale: `admin.capture.tsx:801-807` now proves that Cancel resets state and closes the panel,
while the current header disclosure still has no outside-click/Escape/focus-management contract.

PRODUCT must first decide whether Quick Note remains a non-modal responsive disclosure or becomes
the already available Radix `Dialog` + `hito-product-dialog` composition. If Dialog remains the
accepted outcome, refresh and supersede the stale implementation prompt, reuse the existing
Dialog/header/body/footer/focus owner, and delete the unreachable `inline` branch/variant while
preserving persistence behavior. If disclosure is accepted instead, close or rewrite the old bug
item and specify its dismissal semantics. Do not dispatch its present prompt unchanged, create a
new dialog framework, or ask LAYOUT to change hooks/state. The current Frontend lane taxonomy has no
Admin lane, so PRODUCT must also name the admitted behavior owner before dispatch.

### Runtime Admission Decision

No distinct reproducible build defect is proved. The current blocker is the need for **one clean,
managed rebuild after this report and every other backlog/plan writer is idle**:

1. `scripts/admin-backlog-import/sources.json` admits backlog, briefs, specs, active plans and
   archived plans.
2. `admin-repo-work-item-snapshot.mjs` hashes each admitted Markdown path, source type and complete
   content.
3. `vite-admin-repo-work-items-plugin.mjs` embeds that snapshot, marker and generation into the
   private server bundle when the virtual module loads.
4. `validate-build-output-integrity.mjs` recomputes the checkout digest during postbuild and
   requires the marker, generation and exact current digest in private server output while
   rejecting a public leak.

Therefore a document write between virtual-module load and postbuild changes the expected digest
without changing Admin presentation. The latest Product evidence passed client, SSR and Nitro and
failed only this final digest assertion. That sequence is consistent with writer movement and does
not prove a plugin, Nitro, or validator defect.

If one uncontended post-writer managed rebuild still fails, stop and capture this exact
discriminator before changing scripts: checkout digest immediately before build, digest immediately
before postbuild, embedded server marker/generation/digest, and whether any admitted Markdown path
moved between those reads. An unchanged source digest plus a missing embedded value would prove a
distinct build/plugin defect for PRODUCT to route; a changed digest proves another writer race.
Do not bypass the gate or accept `artifact_missing` as fresh.

### Rollout Order, Rollback And Stop Conditions

1. **PRODUCT reconciliation:** let active Metadata Tag/status/reference CSS writers finish; refresh
   the shared diff; decide Quick Note disclosure versus Dialog. No implementation starts on a dirty
   overlapping owner.
2. **DESIGN SYSTEM slice A:** repair the shared focus-role bypasses. Roll back only these selector
   changes if any cue clips or loses contrast; do not restore attenuated signal as the sole focus
   cue.
3. **DESIGN SYSTEM slice B:** remove the duplicate toolbar variant/class and then apply the already
   admitted shared chrome/text substitutions. Each deletion is independently searchable and
   revertible.
4. **LAYOUT slice:** correct Admin login text, prompt surface/focus, and existing async message
   semantics without changing hooks, loaders, mutations, auth or data. Rollback is the isolated
   class/attribute diff.
5. **Behavior slice only after Product decision:** use the existing Dialog contract or explicitly
   retain disclosure. This is not part of the LAYOUT or DESIGN SYSTEM slices above.
6. **Runtime admission last:** once source and canonical receipts stop moving, run one canonical
   managed `qa_fixture` rebuild and then the owner-specific browser matrix. A receipt written after
   that proof will truthfully make the reusable artifact stale again; record that boundary instead
   of starting a rebuild loop.

Stop and return to PRODUCT if an implementation needs a new token/component/file, changes Admin
data/auth/mutation behavior, overlaps active shared hunks, cannot preserve table/overlay
containment, requires an unlisted Frontend lane, or the post-writer digest remains unchanged while
the newly built private bundle still omits it.

### Lifecycle Receipt

- **Task and mode:** Hito Admin DS Consumer And Runtime Admission Audit; Tracked read-only Designer
  discovery.
- **Outcome:** broad Admin adoption is confirmed; five bounded repair families, one exact shared
  duplicate, retained exceptions, a Quick Note Product gate, and the independent rebuild condition
  are recorded above.
- **Files inspected:** all six admitted Admin owners, their reachable shared shell/surface/field/
  button/tag/table/menu owners, relevant `/hitoDS` references, the completed typography/token/card
  decisions, the existing Quick Note backlog item, and the snapshot/plugin/postbuild sources.
- **Files changed:** this canonical item only. Runtime source and every concurrent dirty hunk were
  preserved byte-for-byte.
- **Validation:** scoped Prettier and final `git diff --check` passed. No build, browser, runtime,
  fixture, hosted, Figma, Global QA, release, deployment, stage, commit or push proof is claimed.
- **Next owner:** PRODUCT. No implementation or rebuild was dispatched.
- **Role file:** `agents/designer.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md`.
- **Subagents used:** none.
