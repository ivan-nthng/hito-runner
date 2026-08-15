# Hito DS Foundations Validator Count And Runtime Admission

- **Work Item ID:** `2026-08-13-hito-ds-foundations-validator-count-and-runtime-admission`
- **Status:** `completed`
- **Type:** `Tracked — Design System validator reconciliation`
- **Priority:** `P1`
- **Owner:** `DESIGN SYSTEM`
- **Stage:** Current Foundations validator contract reconciled; terminal lifecycle ownership
  established for a later fresh release freeze.
- **Next Recommended Role:** `PRODUCT`
- **Scope:** the Foundations structural classification assertion in
  `scripts/validate-hito-ds-component-contracts.ts`, its direct `/hitoDS` source evidence, and
  the canonical item's stale nonterminal lifecycle. Legacy cleanup is limited to this demonstrated
  validator contract; it does not authorize a repository-wide deletion pass.
- **Archive Intent:** Retain the authoritative count decision that unblocks existing Foundations and
  Hub focused acceptance.

## Task

Reconcile the Foundations surface-count validator with the accepted current Foundations structure,
then obtain a fresh managed local artifact for the already-implemented Hub and Foundations browser
replays. This is a validator/runtime-admission task, not a visual Foundations or Hub implementation
task.

## Product Reopening — 2026-08-14

The new release retry found that this item remains `blocked` while its `12 / 4` validator hunk is
present in the shared validator. That nonterminal lifecycle makes the entire path mixed ownership
and prevents whole-path candidate admission. The former Brand-label and InlineEditableText blockers
were subsequently resolved in their own completed items, so the prior boundary is historical rather
than current.

DESIGN SYSTEM must now perform a bounded legacy/reachability pass over the Foundations validator
contract. The goal is one strong current contract and no live assertion, diagnostic, branch, or
task lifecycle that still represents a retired Foundations composition. Historical receipts remain
evidence and must not be erased or rewritten. The current `12 / 4` assertion must be retained only
if direct source proof still establishes it; this is not permission to relax a count solely for a
release.

## Execution Preflight — 2026-08-13

- **Outcome and discriminator:** the pre-change validator fails only with `expected 12 / 5; found
12 / 4`. A direct source census proves 10 token-specimen references and three flat-surface
  references in Foundations, plus two token-specimen references and one flat-surface reference in
  Brand. The accepted Icons Usage receipt identifies the missing fifth flat surface as the
  deliberately removed `data-hito-ds-icon-preview` block and forbids restoring dead UI for the
  count.
- **Owner and existing seam:** DESIGN SYSTEM owns the exact aggregate classification assertion in
  `scripts/validate-hito-ds-component-contracts.ts`. Foundations, Brand, Hub, shared CSS, tokens,
  and generated manifests remain read-only.
- **Smallest behavior change:** retain the exact aggregate assertion and change only its stale flat
  surface expectation and diagnostic from five to four. All Mark, gallery/provenance, retired
  preview, Typography, token-surface, and Brand assertions remain unchanged.
- **New runtime artifacts:** none. The obsolete responsibility removed is validator enforcement of
  the retired Icons preview as a fifth flat surface.
- **Proof and stop boundary:** run the full DS validator, manifest check, focused format/lint and
  diff hygiene; only after they pass, attempt admission through the existing managed QA runtime.
  Do not bypass or repair the private Admin snapshot gate if it remains the first runtime blocker.

## Demonstrated Cause

The exact validator assertion at
`scripts/validate-hito-ds-component-contracts.ts:1599` requires **12 token specimens and 5 flat
surfaces**. Current accepted source contains **12 token specimens and 4 distinct flat surfaces**.
The fifth flat surface was removed when the redundant Icons preview block was deliberately removed
from `reference-foundations-page.tsx`; its retained size selector, five Usage cards, and following
playground remain. The count now fails both the completed Icons Usage cleanup and the independent
Hub Mark adoption task despite their source assertions passing.

The first incorrect canonical owner is therefore the stale static count in the Design System
validator, not Hub cards, `HitoDsPlayground`, generic surfaces, or Product routes.

## Existing Seams And Boundaries

- Reuse `scripts/validate-hito-ds-component-contracts.ts`; do not create a second validator,
  compatibility condition, fixture, or count registry.
- Inspect `src/components/hito-ds/reference-foundations-page.tsx` and
  `src/components/hito-ds/reference-brand-page.tsx` solely to establish the current structural
  count and retained reference obligations.
- Preserve the current validated requirements for Mark metadata, gallery/provenance, retired
  preview absence, Typography picker cases, token surfaces, and Brand tone assertions.
- Do not change rendered Foundations, Hub, Product/Admin, tokens, CSS, generated manifests, or
  Figma as part of count reconciliation.
- Do not repair the private Admin snapshot integrity gate. If it prevents a fresh managed artifact,
  record the exact gate evidence and return the runtime boundary to PRODUCT rather than bypassing it.

## Implementation Requirements

1. Reproduce the current validator failure before writing.
2. Establish whether `12 / 4` is the accepted structure from source and current canonical receipts.
3. Change only the stale assertion and any directly coupled explanatory text, if needed, to express
   the accepted structure structurally. Do not weaken unrelated validators or replace a precise
   assertion with an unbounded comparison.
4. Run the full DS validator, manifest parity, focused formatting/lint, and `git diff --check`.
5. If the validator passes, build/start through the existing managed QA procedure and prove the
   artifact is current, healthy, and fresh. No alternative ad hoc server or stale runtime is
   eligible for browser acceptance.
6. Do not claim Hub or Foundations browser acceptance yourself. Report fresh-runtime availability to
   PRODUCT so their owning tasks can run the prescribed replays.

## Acceptance

| Check                 | Required result                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failure discriminator | Pre-change failure names only the `12 / 5` versus `12 / 4` Foundations classification.                                                             |
| Source contract       | Current source and accepted prior work prove 12 token specimens and exactly four retained flat surfaces.                                           |
| Validator             | Full DS validator passes without disabling unrelated structural checks.                                                                            |
| Static hygiene        | Manifest parity, focused Prettier/ESLint, and `git diff --check` pass.                                                                             |
| Runtime admission     | Existing managed local QA artifact is current, healthy, fresh, and ready for a separate browser replay; otherwise record the exact integrity gate. |
| Boundaries            | No rendered-source, Hub, Product, token, CSS, generated-manifest, Figma, hosted, or release mutation.                                              |

## Historical Blocker And Product Return — 2026-08-13

The assigned Foundations count repair is complete: the exact aggregate assertion now retains 12
token-specimen references and requires the accepted four flat-surface references. The full validator
no longer reports the former `12 / 5` versus `12 / 4` failure.

Runtime admission cannot truthfully continue because a concurrent FRONTEND task changed the direct
Brand specimen label from `Favicon surface` to the accepted `Favicon` while the preserved Brand
validator assertion still requires the retired literal. A fresh full-validator replay now fails
only on `Brand background samples must own one truthful on-light and one on-dark tone while the
favicon specimen reuses the canonical asset directly.` This task explicitly preserves Brand
assertions and does not authorize a second validator repair.

The first managed admission attempt also correctly rejected freshness because executable inputs
changed during the build; the concurrent Brand source write was timestamped inside that build
window. A subsequent managed lifecycle restored a compatible loopback `qa_fixture` process, but its
current status is still `stale`: the process is healthy while build integrity is `broken` and
freshness is `artifact_missing` because the private Admin repository snapshot marker, generation,
or digest is absent. No ad hoc server, stale-artifact acceptance, or private Admin snapshot bypass
was used.

PRODUCT must route the narrow Brand-label validator alignment to its canonical Design System owner
and retain the existing private Admin snapshot integrity gate as the runtime-owner boundary, then
rerun managed admission from a stable checkout. Hub and Foundations browser acceptance remains
outside this item and unclaimed.

## Tracked Implementation Receipt — 2026-08-13

- **Task and stage:** Hito DS Foundations Validator Count And Runtime Admission; Foundations count
  reconciliation complete, runtime admission blocked by a new cross-task Brand assertion mismatch.
- **Root cause and source census:** the accepted Icons Usage cleanup removed the sole redundant
  `data-hito-ds-icon-preview` flat surface. Current direct renderers contain 10 Foundations plus two
  Brand token-specimen references and three Foundations plus one Brand flat-surface references. The
  stale fifth flat surface had no retained responsibility.
- **Files changed:** `scripts/validate-hito-ds-component-contracts.ts` and this canonical item only.
  The validator changed one exact expected count and its diagnostic from five to four. Rendered
  Foundations, Brand, Hub, CSS, tokens, manifests, Product/Admin, Figma, hosted, and release source
  were not edited by this task.
- **Preserved contracts:** all Mark metadata/shapes/sizes/gallery/provenance and retired-matrix
  assertions; Typography playground/picker coverage; token-surface declarations; Brand tone and
  direct-asset assertions; and every unrelated validator hunk remain intact.

| Check                     | Scenario / environment                                            | Result  | Evidence                                                                                                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-change discriminator  | Full DS validator before write                                    | Passed  | Failed only with `expected 12 / 5; found 12 / 4`.                                                                                                                                                                                                               |
| Source contract           | Direct Foundations/Brand census plus accepted Icons Usage receipt | Passed  | `10 + 2` token specimens, `3 + 1` flat surfaces; removed preview is explicitly retired.                                                                                                                                                                         |
| Foundations count repair  | Full DS validator immediately after the narrow edit               | Passed  | Contract reported `ok`; the aggregate 12/4 assertion held.                                                                                                                                                                                                      |
| Manifest parity           | Generated manifest check                                          | Passed  | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`.                                                                                                                                                                                                     |
| Focused hygiene           | Prettier, ESLint, `git diff --check`                              | Passed  | Changed validator/task files format and lint clean; repository diff hygiene clean.                                                                                                                                                                              |
| Stable-checkout replay    | Full DS validator after concurrent Brand write                    | Blocked | Foundations count remains satisfied; only the preserved Brand literal assertion fails after `Favicon surface` became `Favicon`.                                                                                                                                 |
| Managed runtime admission | Canonical start plus final managed status                         | Blocked | The task-owned attempt refused freshness after executable-input movement. Current process is managed, compatible, loopback and healthy, but remains stale/broken with `artifact_missing` because the private Admin snapshot marker/generation/digest is absent. |

- **Omitted-proof consequence:** no current/healthy/fresh runtime was admitted, so this item provides
  no Hub or Foundations browser, responsive, focus, overflow, console, Global QA, release, hosted,
  deployment, or Figma acceptance.
- **Subagents:** none; direct managed-runtime status and source timestamps provided sufficient
  evidence, so an additional QA reviewer would not change the blocker.

## Historical Handoff Prompt — 2026-08-13

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Foundations Validator Count And Runtime Admission
Mode: Tracked — validator reconciliation and local runtime admission
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-foundations-validator-count-and-runtime-admission.md

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, and
skills/hito-qa-browser-regression/SKILL.md before work.

Root cause already demonstrated:
scripts/validate-hito-ds-component-contracts.ts requires 12 accepted token specimens and 5 flat
surfaces, but current accepted Foundations source has 12 and 4 after the deliberate redundant Icons
preview removal. This blocks otherwise unrelated Hub and Foundations browser proof.

Do:
1. Reproduce the exact count failure.
2. Inspect only the direct Foundations/Brand renderers and canonical receipts needed to prove whether
   12/4 is the accepted structure.
3. Update only the stale structural assertion and tightly coupled explanation, preserving all other
   Mark, gallery/provenance, retired-preview, Typography, token-surface, and Brand assertions.
4. Run DS validator, manifest parity, focused Prettier/ESLint, and git diff --check.
5. If validation passes, use only the existing managed QA runtime procedure to admit a current,
   healthy, fresh artifact. Do not use an ad hoc server, bypass the private Admin snapshot gate, or
   claim Hub/Foundations browser acceptance; return fresh-runtime availability to PRODUCT.

Do not edit rendered Foundations/Hub source, CSS, tokens, generated manifests, Product/Admin, Figma,
hosted state, or release state. Do not create a second validator, registry, fixture, compatibility
branch, or runtime artifact. Preserve all unrelated dirty work byte-for-byte.

Use a QA subagent only for a bounded independent read-only runtime-status check if it materially
improves confidence; do not use a DESIGN SYSTEM subagent. Update the canonical item with an English
receipt, including the exact runtime-admission outcome and omitted-proof consequences.
```

## Superseded Handoff Prompt — 2026-08-14

```text
ROLE: DESIGN SYSTEM

Task: Close the demonstrated Foundations validator legacy and lifecycle boundary that blocks release admission.
Mode: Tracked — Design System source-of-truth and legacy reconciliation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-foundations-validator-count-and-runtime-admission.md

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md, the complete canonical item (including historical receipts), the current dirty diff, scripts/validate-hito-ds-component-contracts.ts, and the direct Foundations/Brand sources before the first write.

Release evidence has established a specific ownership defect: this item remains nonterminal while its 12 / 4 Foundations validator hunk is present in the shared validator. Do not treat the release stop as a reason to weaken assertions or partially stage a path.

First, make a current reachability/census of every Foundations-related assertion, count, diagnostic, retired marker, and direct source seam. Distinguish current contractual coverage from legacy assumptions such as retired Mark/static matrices, former one-playground structure, former 11 / 6 and 12 / 5 surface counts, removed Icons preview, and former Brand label wording. Direct source, not historical text, is authoritative. Preserve historical backlog receipts as evidence.

Then make the smallest same-owner repair needed for one strong current validator contract. Retain the exact 12 / 4 assertion only if current source proves it. Delete only dead validator code or stale active lifecycle that is superseded by the current accepted contract; do not add a registry, compatibility branch, loose comparison, rendered UI, CSS, token, manifest, Product/Admin, DevTools, Figma, fixture, provider, hosted, or release change.

When current source and the full DS validator agree, update this item to a truthful terminal status so the whole validator path has terminal ownership for a later fresh release freeze. Run the full DS validator, manifest parity, focused Prettier/ESLint, and git diff --check. A browser/build is not required if runtime source/assets remain byte-stable; state that omission precisely. If a rendered-source change becomes necessary, stop and return to PRODUCT. Do not stage, commit, push, deploy, mutate runtime/fixtures/hosted data, or alter concurrent dirty work.

You are the sole implementation writer. You may use an existing named Hito QA or DESIGNER role only for bounded read-only evidence if it materially resolves a real ambiguity; do not delegate implementation or use generic child agents. Return an English tracked receipt with the current census, legacy removals or no-op proof, exact assertions retained, validations, and remaining release boundary.
```

## Tracked Legacy Reconciliation Receipt — 2026-08-14

- **Task and stage:** Hito DS Foundations Validator Count And Runtime Admission; current
  source-of-truth census, validator reconciliation, and terminal lifecycle closure.
- **Preflight and root cause:** release admission was blocked because this item remained
  nonterminal while its accepted `12 / 4` assertion was present in the shared validator. Direct
  source now proves the assertion: Foundations contains 10 token-specimen and three flat-surface
  references; Brand contains two token-specimen and one flat-surface reference. The validator and
  rendered source already agree, so changing either would have weakened or duplicated the current
  contract.
- **Reuse and artifacts:** retained the existing aggregate count, Mark, Typography, provenance,
  retired-marker, token-surface, and Brand assertions in
  `scripts/validate-hito-ds-component-contracts.ts`. New runtime artifacts: none. The superseded
  active responsibility removed in this pass is the item's nonterminal lifecycle and active
  handoff, not any current validator coverage.
- **Files changed in this pass:** this canonical item only. Validator, Foundations, Brand, CSS,
  tokens, generated manifests, Product/Admin/DevTools, fixtures, runtime, hosted state, Figma, and
  release source remained byte-stable during this reconciliation.

### Current Foundations validator census

| Contract area                     | Current direct source                                                                                                                                                                                   | Active validator contract                                                                                      | Legacy disposition                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Reference surfaces                | Foundations `10 / 3`; Brand `2 / 1`                                                                                                                                                                     | Exact aggregate `12` token specimens and `4` distinct flat surfaces, with an explicit found-count diagnostic   | Former `11 / 6` and `12 / 5` expectations are absent from active validator/source; historical receipts remain unchanged |
| Marks inventory                   | One `#marks` playground, one retained gallery, 15 definitions (`11` workout + `4` surface), two shapes, five sizes                                                                                      | Exact metadata, path, currentColor, aspect-ratio, owner, gallery, provenance, shape, and size assertions       | Retired static `data-hito-ds-mark-size-shape-matrix` is absent from source and explicitly rejected                      |
| Playground structure              | Two playgrounds in source: Marks followed by Typography Inspector                                                                                                                                       | Exact count/order assertion; Typography requires three picker cases and one selected control-row seam          | Former one-playground assumption and `foundationMarkPlaygroundCount` are absent                                         |
| Icons preview                     | Size control, registry, five Usage cards, and following Marks content remain; `data-hito-ds-icon-preview` is absent                                                                                     | Surface count no longer depends on the retired preview                                                         | Removed preview remains deleted; no compatibility marker was added                                                      |
| Brand truth                       | One `on-light`, one `on-dark`, direct `<LogoSpecimen label="Favicon">`, and `/favicon.svg` reuse                                                                                                        | Exact tone union/mapping, one-per-tone count, current Favicon label, and direct asset assertion                | Former `Favicon surface` wording is absent from active validator/source                                                 |
| Foundation legacy guards          | Four retired tokens, 17 retired selectors, six retired workout API markers, four retired workout reference markers, and the retired standalone proof path                                               | Zero-leak assertions plus self-tests; 12 workout bases, zero shade declarations, and exact theme-slot coverage | Guards remain active because they prevent retired contracts from returning; they are not legacy implementation branches |
| Foundation truth and presentation | Manifest-backed primitives, semantic ordering/context/provenance, border/ring rendering, zero Foundation geometry definitions, canonical workbench ladder, typography roles, and quiet-surface evidence | Exact source/manifest/CSS assertions remain enabled                                                            | No broad comparison, alternate registry, or duplicate validator was introduced                                          |

| Check                   | Scenario / environment                               | Result | Evidence                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct census           | Current Foundations and Brand source                 | Passed | `10 + 2 = 12` token-specimen references; `3 + 1 = 4` flat-surface references; two playgrounds; one gallery; three Typography cases; retired Mark matrix and Icons preview absent                              |
| Legacy discriminator    | Active validator plus direct source                  | Passed | No active `11 / 6`, `12 / 5`, one-playground, `foundationMarkPlaygroundCount`, or `Favicon surface` assumption remains; the retired Mark matrix appears only as an explicit absence guard                     |
| Full DS validator       | `npm run validate-hito-ds-components`                | Passed | Contract reported `ok`; foundation inventory includes 17 retired selectors, four retired tokens, zero retired workout shades, 12 workout bases, 43 primitive colours, 41 semantic colours, and 14 text styles |
| Manifest parity         | `node scripts/generate-hito-ds-manifest.mjs --check` | Passed | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`                                                                                                                                                    |
| Focused formatting/lint | Canonical item and unchanged validator               | Passed | Recorded after the terminal lifecycle edit below                                                                                                                                                              |
| Diff hygiene            | Shared dirty checkout                                | Passed | Recorded after the terminal lifecycle edit below; no unrelated hunk was modified by this pass                                                                                                                 |

- **Browser/build omission:** intentionally not run. This pass changes only backlog lifecycle and
  receipt text; rendered source, assets, validator behavior, manifests, and runtime inputs are
  unchanged. Browser or build replay would add no coverage for the lifecycle correction.
- **Subagents:** none. Direct source, validator output, and exact legacy-literal searches resolved
  the contract without a material ambiguity requiring independent review.
- **Remaining boundary:** PRODUCT may admit the now-terminal validator path into a later fresh
  release freeze. This receipt does not stage, commit, push, deploy, mutate hosted state, claim
  Global QA, or establish release readiness.

## Current Blockers

None at dispatch. If the source census cannot prove the current structure, or a rendered-source
change is required, stop and return that exact discriminator to PRODUCT rather than broadening this
legacy-cleanup task.
