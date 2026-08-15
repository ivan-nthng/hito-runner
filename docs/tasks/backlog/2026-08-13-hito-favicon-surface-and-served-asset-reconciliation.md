# Hito Favicon Surface And Served-Asset Reconciliation

- **Work Item ID:** `2026-08-13-hito-favicon-surface-and-served-asset-reconciliation`
- **Status:** `completed`
- **Type:** Tracked — rendered brand-asset reconciliation
- **Priority:** P1
- **Owner:** FRONTEND
- **Lane:** Product
- **Stage:** Superseding Product visual decision completed.
- **Next Recommended Role:** `PRODUCT` — lifecycle closeout only.
- **Scope:** The static favicon and the `Favicon` specimen only.
- **Archive Intent:** Retain the source-to-rendered reconciliation and focused proof.

## User report and demonstrated fact

The Brand reference screenshot shows the retired letter-based `h.` in `Favicon surface`. Current source instead points that specimen at `/favicon.svg`, and the current asset contains the new compact Hito symbol on the already accepted static dark/ivory rounded canvas. The screenshot therefore proves a rendered mismatch, but not whether its cause is stale browser/cache state, a served-asset path, or a remaining runtime source owner.

## Outcome

`Favicon surface` and the actual browser favicon must resolve to the same current compact-symbol asset. Prove the served result at native `64px` and small favicon scale. If source and cold rendered result already agree, close as a source-backed no-op rather than adding a workaround.

## Existing seams and boundaries

- `public/favicon.svg` — one static browser asset owner.
- `src/routes/__root.tsx` — favicon registration.
- `src/components/hito-ds/reference-brand-page.tsx` — `Favicon surface` specimen.
- `src/components/ui/hito-logo.tsx` — shared compact symbol; do not duplicate its paths.

Keep the accepted `#151412` canvas and `#F2F0EB` symbol unless a rendered discriminator proves those files are not the asset shown. Do not add cache-busting, theme-switched favicon logic, a new palette, gradients, copied SVG paths, or unrelated Brand/wordmark/layout changes.

## Definition of Done

- The first incorrect source/served/cache owner is demonstrated, or a cold rendering proves no source defect.
- The static favicon and `Favicon surface` resolve to the same compact symbol and stable canvas.
- The old letter mark has no reachable source in those two paths.
- Focused browser proof covers Brand in Light/Dark and the static asset at `64px` and favicon-small scale; no page overflow or console errors.
- Run focused formatting/lint, `git diff --check`, and build only if runtime source/assets change.

## Execution Preflight — 2026-08-13

- **Observable mismatch:** the reported Brand screenshot displays the retired letter artwork, while
  the current static source contains the compact symbol. The screenshot alone does not identify a
  current source defect.
- **Existing ownership:** `src/routes/__root.tsx` registers `/favicon.svg`, and
  `src/components/hito-ds/reference-brand-page.tsx` renders that exact same URL. The static asset is
  the only served owner; `src/components/ui/hito-logo.tsx` remains the canonical React symbol owner.
- **Dirty-worktree boundary:** all four allowed seams contain completed logo-adoption or concurrent
  Product receipt work. Their current bytes and unrelated hunks are preserved; this reconciliation
  will not rewrite them unless a cold served-asset mismatch proves one is still incorrect.
- **Reuse and artifact budget:** reuse `/favicon.svg` and the existing Brand `<img>` consumer. New
  runtime artifacts, cache busters, paths, files, helpers, theme machinery, or compatibility layers:
  none.
- **Proof:** refresh the stale managed artifact without another build owner, compare cold-served SVG
  bytes/headers to `public/favicon.svg`, inspect native 64 px and favicon-small rendering, then replay
  Brand in Light/Dark with overflow and console checks. A cold match closes this as a source no-op.

## Exact handoff prompt

```text
ROLE: FRONTEND

Task: Hito Favicon Surface And Served-Asset Reconciliation
Lane: Product
Mode: Tracked — rendered brand-asset reconciliation.

Read before the first write:
- AGENTS.md
- agents/frontend.agent.md
- skills/hito-frontend-design-system/SKILL.md
- skills/hito-qa-browser-regression/SKILL.md
- docs/tasks/backlog/2026-08-13-hito-favicon-surface-and-served-asset-reconciliation.md

User-visible symptom:
The Brand reference screenshot shows the retired `h.` artwork in `Favicon surface`. Current source uses `/favicon.svg`, whose current content is the new compact symbol. Establish whether this is stale/cache state, served-asset ownership, or a real remaining source defect before editing.

Outcome:
The static browser favicon and the `Favicon surface` specimen resolve to the same new compact Hito symbol. Prove it at 64px and favicon-small scale. If a cold rendering already agrees, close with no source workaround.

Reuse only these seams:
- public/favicon.svg
- src/routes/__root.tsx
- src/components/hito-ds/reference-brand-page.tsx
- src/components/ui/hito-logo.tsx

Preserve the accepted static #151412 canvas and #F2F0EB mark unless a demonstrated rendered mismatch requires changing one of those exact owners. Do not add cache busters, theme-switching favicon machinery, a new palette/gradient, duplicated SVG paths, new files, generic icon entries, or any wordmark/lockup/layout change. Do not modify active unrelated work.

Validate focused formatting/lint and git diff --check. Perform focused Brand Light/Dark browser proof and direct static-asset evidence at native 64px and favicon-small scale. Run a production build only if runtime source/assets change. A QA read-only review is optional only if it adds independent evidence; do not use a Frontend subagent.

Final receipt in English: demonstrated cause or no-op discriminator, files changed or none, served-asset/Brand proof, validation, and residual boundary. Do not claim Global QA, hosted, release, or deployment readiness.
```

## Tracked Superseding Completion Receipt — 2026-08-13

This is the authoritative final receipt for the later **Superseding Product Decision** section in
this item. The older no-op receipt that follows is retained as superseded historical evidence.

### Preflight And Demonstrated Cause

The current asset, registration, and compact-symbol geometry were already correct. The remaining
source defect was the Brand label `Favicon surface`. The fresh browser discriminator also explained
why the retired artwork could still be observed after the asset update:

1. A new managed `qa_fixture` document registered `/favicon.svg`, and the Brand image resolved to
   that same URL at intrinsic and rendered 64×64.
2. A cache-disabled loopback request was byte-identical to `public/favicon.svg` and rendered the
   compact symbol at 64×64 and 16×16.
3. The persistent Chromium browser profile initially rendered the retired `h.` from its image cache
   even for a direct `/favicon.svg` document.
4. An ordinary reload of that exact URL, without a cache buster or alternate asset, revalidated the
   resource against its current ETag/Last-Modified response and immediately rendered the compact
   symbol. Reloading Brand then rendered the same compact asset.

The demonstrated rendered mismatch was therefore browser cache state, not current asset content,
document registration, served bytes, or small-scale sizing. No cache workaround was added. The
first incorrect current source owner was only the route-local Brand specimen label.

### Files Changed And Reuse

- `src/components/hito-ds/reference-brand-page.tsx` — changed the existing `LogoSpecimen` label
  from `Favicon surface` to `Favicon`; its direct `/favicon.svg` image is unchanged.
- This canonical item — superseding preflight, lifecycle, and completion receipt.

Inspected and unchanged by this continuation:

| Existing owner                    | Final SHA-256                                                      |
| --------------------------------- | ------------------------------------------------------------------ |
| `public/favicon.svg`              | `889d0e536c4a7e50b6ee6c49dcb0d876dac24ad9a606174f97b7373a60f76add` |
| `src/routes/__root.tsx`           | `a308aea127d6ae918b8921f792e22032ae8f9cea1fed6e52a19b7b43e768d242` |
| `src/components/ui/hito-logo.tsx` | `1a848141e757b198eeea21f978d9de1767613af4f235337e21e32f8df5637e29` |

New files, runtime artifacts, helpers, CSS, tokens, SVG paths, icon registrations, cache busters,
theme favicon logic, compatibility branches, or generic Icon entries: none. Existing unrelated
dirty hunks in every allowed seam were preserved.

### Validation Inventory

| Check                  | Scenario / environment                                    | Result | Evidence                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership       | Four allowed seams                                        | Passed | Root registration and Brand image both resolve to `/favicon.svg`; the Brand label is exactly `Favicon`; `Favicon surface` has zero runtime-source matches.                                        |
| Served asset           | Managed loopback, cache-disabled request                  | Passed | HTTP 200 `image/svg+xml`; served SHA-256 equals source SHA-256 `889d0e…6add`; current response exposes ETag and Last-Modified.                                                                    |
| Native and small scale | Current served SVG at 64×64 and 16×16                     | Passed | Both fresh rasters visibly retain the compact ivory symbol on the accepted `#151412` rounded canvas.                                                                                              |
| Cache discriminator    | Persistent Chromium profile                               | Passed | First direct document showed cached retired artwork; ordinary same-URL reload revalidated and showed the compact symbol. No URL or source workaround was used.                                    |
| Brand Dark             | `/hitoDS/brand`, 1440×900, managed `qa_fixture`           | Passed | Exactly one `Favicon` card, no old label, current compact asset at 64×64, document width 1440/1440.                                                                                               |
| Brand Light            | `/hitoDS/brand`, 1440×900, managed `qa_fixture`           | Passed | The same static compact asset and exact label remain visible, with document width 1440/1440.                                                                                                      |
| Browser health         | Brand Dark/Light                                          | Passed | Zero Brand-page browser warnings or errors. The pure SVG inspection tab produced two browser-control harness exceptions; the SVG has no application script and the Brand document remained clean. |
| Focused formatting     | Task and allowed TSX seams                                | Passed | Scoped Prettier check passed.                                                                                                                                                                     |
| Focused lint           | Brand, root route, and shared logo owner                  | Passed | ESLint completed with zero errors.                                                                                                                                                                |
| SVG validity           | `public/favicon.svg`                                      | Passed | `xmllint --noout` passed.                                                                                                                                                                         |
| Diff hygiene           | Four allowed runtime seams                                | Passed | Scoped `git diff --check` passed.                                                                                                                                                                 |
| Production build       | Canonical `qa:server:start -- --provider-mode qa_fixture` | Passed | One serialized build completed and started a managed, compatible, loopback-only, healthy, fresh `receipt_matches` runtime used for browser acceptance.                                            |

### Runtime Receipt Boundary

After the fresh build and browser acceptance, the unrelated concurrent item
`2026-08-13-hito-ds-foundations-validator-count-and-runtime-admission.md` changed at 01:17:34,
three minutes after this task's canonical build snapshot. Because private Admin integrity hashes all
backlog documents, final manager status became stale with a changed repository-snapshot digest even
though all four favicon seams and this task's runtime source remained unchanged. A second build is
not run over that concurrent owner, and this documentation-only completion update would itself
change the same snapshot again. The consequence is no final whole-workspace fresh-runtime receipt;
the task's source build and browser proof were completed while the artifact was fresh.

### Residual Boundary And Handoff

Previously loaded browser profiles may continue to display the retired favicon until the same
`/favicon.svg` resource is revalidated or the page is reloaded. That is observed browser cache
state, not a remaining Hito source path. No source blocker remains for this task.

Next owner: PRODUCT for lifecycle closeout only. This receipt does not claim Global QA, hosted,
release, deployment, or Figma readiness.

## Tracked Completion Receipt — 2026-08-13

### Demonstrated Cause And No-Op Discriminator

The reported screenshot is stale relative to the current implemented asset. It does not reproduce
from the current source or a cold request to the managed loopback runtime. The source-to-served
chain has one URL:

- `src/routes/__root.tsx` registers `/favicon.svg` as the browser icon;
- `src/components/hito-ds/reference-brand-page.tsx` renders `/favicon.svg` in `Favicon surface`;
- the cold-served SVG is byte-for-byte identical to `public/favicon.svg`; and
- the current static SVG contains one compact-symbol path, the accepted `#151412` canvas and
  `#F2F0EB` mark, and no retired gradient or letter-mark path.

Therefore there is no current source or served-asset defect to patch. No cache buster, second asset,
theme machinery, copied path, or compatibility workaround was added. The exact historical mechanism
behind the screenshot cannot be distinguished between a pre-update capture and browser cache from
that screenshot alone; the meaningful discriminator is that a cold current render agrees.

### Files Changed

- Runtime source/assets: none.
- Task artifact: this canonical lifecycle, preflight, and completion receipt only.

The four allowed seam hashes remained unchanged from preflight through acceptance:

| Owner                                             | SHA-256                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `public/favicon.svg`                              | `889d0e536c4a7e50b6ee6c49dcb0d876dac24ad9a606174f97b7373a60f76add` |
| `src/routes/__root.tsx`                           | `a308aea127d6ae918b8921f792e22032ae8f9cea1fed6e52a19b7b43e768d242` |
| `src/components/hito-ds/reference-brand-page.tsx` | `9e663d5259717d568caed1d225562c7e8390bc435114a14d4dc6ddccb978171d` |
| `src/components/ui/hito-logo.tsx`                 | `1a848141e757b198eeea21e32f8df5637e21e32f8df5637e29`               |

### Served-Asset And Brand Proof

| Check                        | Scenario / environment                       | Result | Evidence                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Static ownership             | Four allowed seams                           | Passed | Browser registration and Brand specimen both reference `/favicon.svg`; retired `hito-favicon-bg` and former letter paths have zero reachable matches.                    |
| Cold served bytes            | Managed `qa_fixture`, cache-disabled request | Passed | HTTP 200, `content-type: image/svg+xml`; served SHA-256 equals source SHA-256 `889d0e…6add`.                                                                             |
| Native asset                 | Direct browser render                        | Passed | `viewBox`, width, and height are `0 0 64 64`, `64`, and `64`; one path, no gradient, canvas `#151412`, mark `#F2F0EB`.                                                   |
| Favicon-small scale          | Local SVG rasterization at 16×16             | Passed | The compact silhouette remains recognizable against the rounded dark canvas; no retired letter artwork appears. Temporary raster evidence stayed outside the repository. |
| Brand Dark                   | `/hitoDS/brand`, managed loopback            | Passed | `Favicon surface` loads `/favicon.svg` at rendered and intrinsic 64×64; the document has no horizontal overflow.                                                         |
| Brand Light                  | `/hitoDS/brand`, managed loopback            | Passed | The same 64×64 static asset remains loaded and unchanged; the document has no horizontal overflow.                                                                       |
| Browser favicon registration | `/hitoDS/brand`                              | Passed | The live document icon link resolves to `/favicon.svg`, the same URL as the specimen.                                                                                    |
| Browser health               | Brand Light/Dark                             | Passed | Zero browser warnings or errors observed.                                                                                                                                |

### Static Validation And Build Boundary

| Check                   | Result                     | Evidence                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TSX/Markdown formatting | Passed                     | Scoped Prettier check passed.                                                                                                                                                                                                                                                            |
| SVG validity            | Passed                     | `xmllint --noout public/favicon.svg`.                                                                                                                                                                                                                                                    |
| Focused lint            | Passed                     | ESLint passed for the root route, Brand reference, and shared logo owner.                                                                                                                                                                                                                |
| Diff hygiene            | Passed                     | Scoped `git diff --check` passed.                                                                                                                                                                                                                                                        |
| Production build        | Passed after serialization | The first attempt correctly failed postbuild because a concurrent documentation writer changed the private Admin repository snapshot during the build. After all shared writers completed, one clean canonical rebuild/start passed and provided the fresh asset used for browser proof. |

The task-owned receipt changes repository documentation after that browser proof. Per the explicit
boundary, no additional production rebuild is run solely for a documentation-only lifecycle update;
runtime source and asset bytes did not change.

### Residual Boundary

No source blocker remains. If the retired artwork is observed again after a verified cold request,
the next task must capture the exact browser, URL, response headers/body digest, and screenshot time
to distinguish browser cache from another served origin. This receipt makes no Global QA, hosted,
release, deployment, or Figma claim.

## Superseding Product Decision — 2026-08-13

Ivan has rejected the presentation accepted by the prior no-op receipt. This decision supersedes
the prior outcome without invalidating its source-to-served evidence:

1. The browser favicon must visibly be the current **compact Hito symbol**, not the retired letter
   mark, on the intended dark/black favicon canvas.
2. The Brand reference must call the item **`Favicon`**, not `Favicon surface`.
3. The Brand reference must demonstrate the actual favicon asset directly; it is not a separate
   decorative specimen, surface recipe, or theme-dependent artwork.
4. The task is limited to favicon identity, registration, and the corresponding Brand reference.
   Do not alter wordmark, lockup, mark library, general card surfaces, theme tokens, or unrelated
   Brand layout.

The prior source evidence indicates that this may be a visibility, sizing, or served-document
registration problem rather than an asset-content problem. FRONTEND must re-establish that exact
discriminator from the current runtime before selecting the smallest existing owner to change.

### Required focused acceptance

- A fresh document must load `/favicon.svg` through the registered document icon link and visibly
  show the compact symbol at favicon-small scale.
- The Brand item is labelled `Favicon` and renders the same actual `/favicon.svg` asset.
- Favicon and Brand are checked in Light and Dark; no page overflow or console error is introduced.
- Preserve the existing dark/black favicon canvas unless direct evidence shows it prevents the
  compact symbol from reading at small scale.

## Superseding Execution Preflight — 2026-08-13

- **Fresh discriminator:** a newly loaded managed `qa_fixture` document registers
  `/favicon.svg`; the Brand specimen loads that same URL at intrinsic and rendered 64×64. A
  cache-disabled current request is byte-identical to `public/favicon.svg`, and fresh 64×64 and
  16×16 rasters visibly retain the compact symbol on the accepted `#151412` canvas.
- **First incorrect owner:** asset content, document registration, served bytes, and favicon-small
  sizing are current. The remaining Product mismatch is the route-local `LogoSpecimen` label
  `Favicon surface` in `src/components/hito-ds/reference-brand-page.tsx`.
- **Existing seam and smallest change:** reuse the existing Brand `LogoSpecimen` and its direct
  `/favicon.svg` image; change only the accepted label to `Favicon`.
- **Reuse and artifact budget:** new runtime artifacts, files, helpers, CSS, tokens, copied SVG
  paths, registrations, cache busters, or compatibility branches: none. The superseded `Favicon
surface` wording is removed; the current asset, registration, and compact-symbol owner remain
  unchanged.
- **Preservation boundary:** preserve all unrelated completed logo adoption and concurrent Product
  work in the four allowed seams byte-for-byte. The shared mark, wordmark, lockup, favicon canvas,
  and general Brand layout are not edited.
- **Focused proof:** rebuild once after the runtime label change with no competing build owner,
  then replay a new Light/Dark Brand document, registered icon URL, 64×64 specimen, 16×16 served
  raster, overflow, console, focused static checks, and managed-runtime freshness.

### Exact superseding handoff prompt

```text
ROLE: FRONTEND

Task: Hito Favicon Surface And Served-Asset Reconciliation — superseding Product visual decision
Lane: Product (FRONTEND DS specialization)
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-13-hito-favicon-surface-and-served-asset-reconciliation.md

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and
skills/hito-qa-browser-regression/SKILL.md before work.

The prior no-op receipt proved source and served bytes at that time, but Product has superseded the
accepted presentation: the browser favicon must visibly be the compact Hito symbol on its intended
dark/black canvas, and the Brand reference label must be `Favicon`, not `Favicon surface`.

First establish the current visual discriminator from a fresh local document:
- inspect public/favicon.svg, the icon registration in src/routes/__root.tsx, and the Brand
  reference in src/components/hito-ds/reference-brand-page.tsx;
- prove whether the remaining defect is asset content, document registration, served stale bytes,
  or small-scale visibility/sizing; do not rely on the old no-op conclusion as present visual proof.

Then make the smallest source-backed change in the existing owner only. Reuse:
- public/favicon.svg;
- src/routes/__root.tsx;
- src/components/hito-ds/reference-brand-page.tsx; and
- src/components/ui/hito-logo.tsx when it is the canonical compact-symbol artwork owner.

Do not add cache busters, a second favicon, theme-switched favicon logic, gradients, copied SVG
paths, a generic Icon entry, new files, wordmark/lockup changes, or general Brand/card redesign.
Do not touch unrelated active work.

Validate: focused formatting/lint, git diff --check; fresh document favicon evidence at small scale;
Brand Light/Dark evidence; no overflow or console errors. Run a production build only when runtime
source/assets actually change. If a browser or environment condition prevents a true fresh document
replay, state the exact gap and do not report the prior asset-byte proof as visual acceptance.

Use a QA subagent only for a bounded independent read-only browser review if it materially improves
confidence; do not use a FRONTEND subagent. Update the canonical item with an English receipt and
preserve all unrelated dirty work byte-for-byte.
```
