# Hito Logo, Wordmark, Symbol, And Favicon Update

## Work Item ID

2026-08-13-hito-logo-wordmark-symbol-and-favicon-update

## Status

completed

## Type

brand-asset-and-frontend-adoption

## Priority

high

## Owner

frontend

## Lane

Product

## Mode

Tracked

## Stage

Frontend Product implementation and focused browser acceptance complete.

## Next Recommended Role

PRODUCT — accept this completed Frontend slice and decide any later independent Global QA or release
sequence separately.

## Scope

Replace the current Hito wordmark and compact `H` mark with Ivan’s supplied identity artwork,
without copying SVG path data between service, admin, reference, and marketing consumers.

The resulting system must provide:

1. a theme-aware full Hito Running wordmark for service, auth, admin, and brand reference use;
2. a compact new symbol for short brand placements and favicon derivation, replacing the current
   letter-`H` short mark;
3. a complete lockup for larger marketing/identity use; and
4. one static favicon that crops/scales the new symbol into a rounded-square canvas without losing
   the recognisable mark at small sizes.

## User-Supplied Source Artwork

The supplied vectors are authoritative artwork inputs, not inline-code templates for every consumer:

| Asset          | Supplied source                                                                                                                            | Intended role                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Text wordmark  | Inline SVG, `viewBox="0 0 608 256"`, black paths                                                                                           | Service wordmark artwork                |
| Compact symbol | Inline SVG, `viewBox="0 0 219 222"`, black path                                                                                            | Compact mark and favicon source artwork |
| Full lockup    | [provided vector attachment](/Users/ivan/.codex/attachments/aa34eafa-28c3-409c-9e2a-510e4a87e1f2/pasted-text.txt), `viewBox="0 0 888 259"` | Large marketing/identity lockup         |

Before runtime adoption, FRONTEND must preserve these supplied vectors once at the existing
canonical brand-asset owner. It must not paste their paths into multiple React components, routes,
pages, or the generic Icon registry.

## Existing Canonical Seams

- `src/components/ui/hito-logo.tsx` — existing shared `HitoLogo` and `HitoLogoMark` source.
- `src/styles/layout-typography.css` — existing `hito-logo` sizing contract.
- `public/favicon.svg` and `src/routes/__root.tsx` — static browser icon and registration.
- `src/components/hito-ds/reference-brand-page.tsx` — truthful brand/favion reference specimen.
- Current shared consumers include `AppShell.tsx`, `AuthEntryScreen.tsx`, `AdminWorkspaceNav.tsx`,
  `routes/hub.tsx`, `routes/admin.login.tsx`, and Hito DS reference pages.
- `src/components/ui/hito-mark.tsx` is the workout/product-mark library and is explicitly separate.

## Demonstrated Root Cause

The current artwork is already centralized, but it represents the retired Hito wordmark and a
letter-based short mark. Its path data is duplicated independently in `public/favicon.svg`.
Changing individual routes would produce the exact copy-paste and divergent-brand ownership the
user wants to avoid. The first incorrect seam is therefore the shared brand-asset primitive and
favicon derivative, not any individual route.

## Required Design Decisions

The new compact-symbol favicon must have a rounded canvas and remain legible at 16px. The supplied
brief allows a white canvas or an inverse dark canvas, but a static favicon cannot reliably follow
the Hito page theme. FRONTEND may request one bounded read-only DESIGNER recommendation if needed,
then must choose one stable, high-contrast pair and prove it. Do not add theme-switching favicon
machinery, a gradient, or an unmeasured third colour scheme. The service component itself remains
theme-aware through its existing foreground contract.

## Required Outcome

- One canonical source owns each supplied vector; shared components reference or render that source.
- `HitoLogo` and `HitoLogoMark` retain their current accessibility API (`decorative`, `label`) and
  sizing-variable contract unless a source-backed migration is needed.
- Existing Product/Admin/auth/reference consumers update through the shared primitive rather than
  receiving copied SVG paths.
- The large lockup is available only through a named shared brand primitive/asset with an actual
  marketing or brand-reference consumer; do not create unused artwork APIs.
- `public/favicon.svg` derives from the new compact symbol exactly once, has a rounded canvas, and
  contains the mark clearly at its native 64px and browser-small usage.
- The Brand reference uses the same canonical wordmark, compact symbol, full lockup (if adopted),
  and favicon asset; it is a reference, not a duplicate artwork owner.

## What Not To Touch

- `HitoMark`, workout-type artwork, workout tokens, icon registry, generic UI `Icon`, colors/tokens,
  component geometry beyond the existing logo sizing contract, Product workflows, auth behavior,
  provider/persistence code, Figma, hosted state, Git lifecycle, or unrelated dirty hunks.
- Do not redesign the supplied paths, substitute a text font, convert the artwork to a letter mark,
  add a second asset pipeline, introduce SVG copying across components, or expand this into broad
  marketing-page work.
- Do not claim the full lockup has a production consumer until one is actually added and verified.

## Required Preflight

1. Read `AGENTS.md`, `agents/frontend.agent.md`,
   `skills/hito-frontend-design-system/SKILL.md`, this item, and the current `HitoLogo`, CSS,
   favicon, root-route, and Brand-reference seams.
2. Capture the dirty worktree and existing artwork consumer inventory before editing.
3. Preserve the raw supplied artwork exactly once before any scaling, masking, or runtime
   normalization. If colour polarity needs a decision, use only the existing DESIGNER sidebar role
   for a bounded read-only contrast recommendation.
4. Identify whether a real direct consumer for the full lockup exists. If none exists, retain its
   canonical asset and reference specimen only; do not create speculative marketing UI.

## Validation Expectations

| Check            | Required proof                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership | One defined owner per supplied vector; no copied path data across route/component consumers; old logo path authority removed or retained only where explicitly justified. |
| Accessibility    | Decorative and labelled logo usages retain truthful accessible names and no duplicate announcement.                                                                       |
| Favicon          | The new symbol is centred, rounded, and recognisable at native 64px and favicon-scale rendering.                                                                          |
| Browser matrix   | Shared service/admin/auth/brand specimens in Dark and Light at desktop and exact 375px retain sizing, contrast, containment, and no console errors.                       |
| Static/build     | Applicable Brand/DS checks, formatting, lint, `git diff --check`, and production build.                                                                                   |

## Stop Conditions

- A proposed consumer requires a new product/marketing composition rather than shared-brand adoption.
- The supplied vectors cannot be preserved or contain malformed/non-renderable SVG data.
- Concurrent work overlaps the shared logo/favion seam.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Implement the tracked logo update in:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-13-hito-logo-wordmark-symbol-and-favicon-update.md`

Lane:
Product.

Read before the first write:
- `AGENTS.md`
- `agents/frontend.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- the complete canonical task
- the current `src/components/ui/hito-logo.tsx`, `src/styles/layout-typography.css`,
  `public/favicon.svg`, `src/routes/__root.tsx`, and `src/components/hito-ds/reference-brand-page.tsx`

Stage:
Tracked implementation and focused browser acceptance.

Outcome:
Replace the existing wordmark, compact letter mark, and favicon with the three supplied Hito vectors
through one canonical brand-asset seam. Every existing consumer must adopt through that seam; SVG
paths must not be copied into routes, pages, or the generic Icon registry.

Scope:
- Preserve the supplied wordmark, compact symbol, and full-lockup inputs once at the existing shared
  `HitoLogo` / `HitoLogoMark` owner, then use those artifacts from the existing API.
- Update the static favicon from the compact symbol, centring/cropping it in a rounded canvas that is
  visibly legible at small size. Use one stable contrast pair: do not build theme-switching favicon
  machinery.
- Retain the current accessibility API and logo sizing variables unless a source-backed migration is
  necessary.
- Update all current service/admin/auth/brand-reference consumers through the shared primitive; add
  the full lockup only where the reference or a genuine marketing consumer uses it.
- Keep the Brand reference truthful: it must show the same wordmark, compact symbol, full lockup if
  adopted, and favicon source rather than duplicate artwork.

Boundaries:
- Do not redesign supplied paths, substitute a text font, reintroduce the letter mark, edit
  `HitoMark`/workout icons/tokens, add a generic icon, create a second asset pipeline, change
  workflow/auth/provider behavior, edit Figma, or touch hosted/Git lifecycle state.
- Preserve all unrelated dirty work byte-for-byte.
- If a direct Marketing-only composition is required outside the shared adoption seam, return it to
  PRODUCT as a separate lane handoff; do not implement it as a subtask.

Collaboration:
- You implement all Frontend source yourself.
- If colour polarity needs independent judgement, use only the existing DESIGNER sidebar role for a
  bounded, read-only recommendation: pick one high-contrast static favicon pair that is legible at
  16px. Do not delegate implementation.
- After source is stable, use the existing QA sidebar role only for one bounded read-only browser
  review if it adds independent confidence. Do not use a Frontend implementation subagent.

Validation:
- Prove one canonical source per vector and no route/component SVG-path duplication.
- Verify decorative and labelled logo uses, favicon legibility/rounded canvas at native 64px and
  small favicon scale, all reachable logo placements and Brand reference in Light/Dark desktop and
  exact 375px, plus containment and console health.
- Run applicable static checks, formatting/lint, `git diff --check`, and a production build.

Return only when the canonical task has a truthful English tracked receipt: preflight, actual asset
owner, files changed, vector-consumer inventory, chosen favicon contrast pair and evidence, browser
matrix, omitted-proof consequence, blockers, and next owner. Do not claim Global QA, hosted,
release, or deployment readiness.
```

## Product Dispatch

The primary `FRONTEND (ds)` sidebar role is finishing a separately dispatched Product
token-remediation task. To avoid interrupting that active source writer, this disjoint task is
dispatched to the existing idle `FRONTEND` sidebar role under the same `ROLE: FRONTEND`, Product-lane
contract. It must coordinate around any shared build/runtime rather than starting a competing one.

## Frontend Product Tracked Implementation Receipt — 2026-08-13

### Preflight And Outcome

- Role: `agents/frontend.agent.md`; skills: `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- The existing shared owner remained `src/components/ui/hito-logo.tsx`; no route-local artwork,
  generic Icon entry, asset pipeline, production file, state, or compatibility path was added.
- The supplied full-lockup attachment (`viewBox="0 0 888 259"`, SHA-256
  `798bb0413ab5ef0150fa1cca3134212b29e881b018a38858a3e0a5895bb15a61`) demonstrated that its first
  five paths are the supplied wordmark and its sixth path is the compact symbol. The shared owner now
  stores those six exact inputs once and composes `HitoLogo`, `HitoLogoMark`, and
  `HitoLogoLockup` from them.
- The retired wordmark and two-path letter mark were removed. `HitoLogo` and `HitoLogoMark` retain
  their `decorative` / `label` accessibility API and `--hito-logo-height` sizing contract.
- The full lockup received one factual consumer in the Brand reference only. No separate Marketing
  composition was required.

### Actual Asset Owner And Files Changed

- `src/components/ui/hito-logo.tsx` — canonical wordmark and compact-symbol path authority plus the
  composed full-lockup primitive.
- `src/styles/layout-typography.css` — existing logo sizing seam extended with the exact supplied
  viewBox ratios for wordmark, compact symbol, and lockup.
- `public/favicon.svg` — allowed static derivative of the canonical compact symbol, on one rounded
  high-contrast canvas.
- `src/components/hito-ds/reference-brand-page.tsx` — truthful wordmark, compact-symbol, full-lockup,
  and `/favicon.svg` specimens; no duplicated paths.
- This canonical item — lifecycle and receipt only. `src/routes/__root.tsx` was inspected and left
  untouched because its existing `/favicon.svg` registration was already correct.

### Vector And Consumer Inventory

- Source audit found all five wordmark paths and the compact-symbol path exactly once in the shared
  React owner. The compact-symbol path occurs once more only in `public/favicon.svg`, the required
  static browser derivative. No route, page, consumer component, or Icon registry contains supplied
  path data.
- Eighteen rendered uses across `AppShell`, `AuthEntryScreen`, `AdminWorkspaceNav`, Hub, Admin login,
  and Hito DS reference surfaces continue to import `HitoLogo` / `HitoLogoMark`; the sole
  `HitoLogoLockup` use is the Brand reference.
- Labelled uses retain `role="img"` and `aria-label="Hito"`. Adjacent-label specimens remain
  decorative with `aria-hidden="true"`. Runtime computed fill followed inherited `currentColor` in
  Light and Dark.

### Favicon Decision

The static pair is near-black `#151412` with warm off-white `#F2F0EB`. It measures 16.16:1 contrast.
The supplied symbol was centred and scaled inside the existing 64×64 rounded (`rx="14"`) canvas.
Native 64×64 and rasterized 16×16 inspection both retained the recognisable compact shape. No
theme-switching, gradient, border, or third colour scheme was introduced. A DESIGNER subagent was
not needed because the measured pair and direct small-size render gave an unambiguous discriminator.

### Validation

| Check                        | Scenario / environment                                                                                | Result        | Evidence                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership             | Checkout-wide path and consumer reachability audit                                                    | Passed        | Six supplied paths have one React owner; only the permitted favicon derivative repeats the compact path; 18 uses import shared primitives.                                                                                                                                                                |
| Formatting / lint / SVG      | Focused Prettier, ESLint, and `xmllint --noout`                                                       | Passed        | All task-owned TSX/CSS matched Prettier; focused ESLint and SVG parse exited 0.                                                                                                                                                                                                                           |
| DS contract / diff hygiene   | `npm run validate-hito-ds-components`; `git diff --check`                                             | Passed        | Component contract reported `contract ok`; no whitespace errors.                                                                                                                                                                                                                                          |
| Production build             | Shared managed `qa_fixture` manager after source stabilization                                        | Passed        | A concurrent owner already controlled the build, so no competing build was started. The manager rebuilt successfully in 51.8 s and reported `artifactFreshness: fresh`, `receipt_matches`.                                                                                                                |
| Service / public / reference | AppShell, Hub, Admin login, and `/hitoDS/brand`; 1280×720; Light / Dark where the route exposes theme | Passed        | New wordmark rendered with supplied viewBox/path count and inherited foreground; Brand reference rendered symbol and six-path lockup. No horizontal overflow.                                                                                                                                             |
| Exact narrow viewport        | Same reachable route set at 375×812; Light / Dark                                                     | Passed        | All visible logo rectangles remained contained; document and body width stayed 375 px; no horizontal overflow.                                                                                                                                                                                            |
| Accessibility                | Labelled shell/public uses and decorative Brand specimens                                             | Passed        | Runtime DOM retained truthful `role`, accessible label, and `aria-hidden` states without duplicate announcements.                                                                                                                                                                                         |
| Favicon                      | `/favicon.svg`, Brand specimen, 64×64 and 16×16 raster inspection                                     | Passed        | Rounded canvas, centred supplied symbol, 16.16:1 static contrast, and legibility confirmed at both sizes.                                                                                                                                                                                                 |
| Console                      | Focused browser route matrix and post-build replay                                                    | Passed        | Browser log collection returned no warnings or errors.                                                                                                                                                                                                                                                    |
| Independent review           | Existing `ROLE: QA`, bounded read-only source and dark-desktop review                                 | Passed        | QA confirmed canonical ownership, consumer adoption, semantics/currentColor, Brand specimens, favicon contrast, containment, and no console issue; no mutations were made.                                                                                                                                |
| Managed runtime handoff      | `node scripts/qa-local-server.mjs status --provider-mode qa_fixture`                                  | Coverage note | Server was left running at `http://127.0.0.1:3000`, managed, healthy, loopback-bound, and compatible. After this task's accepted build/browser proof, unrelated concurrent Admin snapshot bytes moved and the manager truthfully reported the checkout-wide artifact stale/broken against the new digest. |

### Coverage Notes And Boundaries

- The existing runner session is authenticated, so `/login` resolves to the service shell rather
  than rendering `AuthEntryScreen`; the separate auth hero was not visually replayed. An admin
  workspace session was not created, so `AdminWorkspaceNav` was not visually replayed. Both remain
  source-proven shared-primitive consumers, and their logo behavior contains no route-local artwork.
- The Admin login route's canonical redirect uses the separate `localhost` origin and does not expose
  the runner theme control. Its reachable Light/static presentation passed at desktop and 375×812;
  Dark inheritance was proven through the same primitive on the service and Brand surfaces, not by
  fabricating cross-origin theme state.
- Independent QA observed an existing-browser cached favicon in one unchanged-URL Brand specimen
  until opening a cache-busted asset. Direct source, primary fresh runtime, and 64/16 raster proof
  are current; no cache-busting product machinery was added for a local cache artifact.
- The task-owned logo source passed a production build and post-build browser replay while the
  managed artifact was fresh. The final checkout-wide status later became stale because the
  separately owned Admin snapshot digest changed. No competing rebuild was started while that
  concurrent owner remained in scope. This limits checkout-wide freshness at handoff, but does not
  invalidate the recorded logo build or focused browser result.
- These omissions limit the claim to Frontend implementation DoD and focused local acceptance. No
  Global QA, hosted parity, release readiness, deployment, or Figma parity is claimed.

### Blockers And Next Owner

No task-owned blocker remains. Next owner: PRODUCT for acceptance and any separately authorized
Global QA or release sequencing.
