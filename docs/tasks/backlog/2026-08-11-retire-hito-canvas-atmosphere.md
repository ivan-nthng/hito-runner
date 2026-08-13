# Retire Hito Canvas Atmosphere

## Work Item ID

2026-08-11-retire-hito-canvas-atmosphere

## Status

closed

## Type

source-cleanup

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Remove the exact decorative `hito-canvas-atmosphere` background gradient everywhere it is currently
live, then delete its now-dead canonical Design System definition and Hito DS foundations demo.

The execution is deliberately staged because current consumers span Frontend Product and Design
System ownership.

## Stage

The runtime retirement is complete. The remaining reference-canvas elevation correction is
superseded on 2026-08-11 by the combined DESIGN SYSTEM execution item
[`Hito DS Foundations Color Truth, Context, And Reference Canvas`](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas.md).
Keep this item as the immutable evidence for atmosphere deletion; do not repeat either stage here.

## Archive Intent

retain_in_place

## Task

Ivan has rejected this exact gradient as a design role. Retire it completely rather than remove it
only from the selected Hito DS `main` and leave the legacy role live elsewhere.

Stage 1 — FRONTEND Product:

- Remove the existing `hito-canvas-atmosphere` usage only from
  `src/components/AppShell.tsx`, `src/routes/admin.capture.tsx`, and
  `src/routes/admin.analytics.tsx`.
- Preserve existing `bg-background`, structure, layout, behavior, authentication, and all other
  class tokens. Do not substitute a custom background or a new wrapper.

Stage 2 — DESIGN SYSTEM, after Stage 1 proves zero Product/Admin consumers:

- Remove the Hito DS page usage from `src/components/hito-ds/reference-page.tsx`.
- Delete the now-dead `.hito-canvas-atmosphere` and unused `.canvas-grain` gradient rules in
  `src/styles/foundations.css`.
- Remove only the now-false foundations token/demo/copy references in
  `src/components/hito-ds/reference-foundations-page.tsx`.
- Apply the final two-theme page/card/sidebar elevation correction recorded below. It supersedes
  the earlier same-role `bg-surface` wording, which was correct for Dark but collapsed the intended
  difference in Light. Reuse existing semantic roles only; no colour or token is invented.

## User Report

Inspector item `88ba25bc-60ce-4802-baca-39a8f0d900ed` captured `/hitoDS`, dark, `1470×801`,
targeting `main.hito-workbench-main`. Ivan requested removal of this specific gradient everywhere,
and a simple existing-token page background lighter than the cards.

## Evidence And Demonstrated Cause

- The selected `main.hito-workbench-main` itself contains no background rule at
  `src/styles/reference-workbench.css:273-276`.
- Its visual gradient is inherited from the outer `hito-canvas-atmosphere` class in
  `src/components/hito-ds/reference-page.tsx:61`.
- The exact class is also live in `AppShell.tsx:87`, `admin.capture.tsx:442,508`, and
  `admin.analytics.tsx:127`.
- The canonical gradient is defined in `src/styles/foundations.css:883-889` and has a light-theme
  companion at `943-955`; its Hito DS demo/token documentation is in
  `reference-foundations-page.tsx`.
- Existing dark tokens are `background=stone-900` and `surface=stone-850`; light tokens are
  `background=linen-100` and `surface=linen-50`. Existing showcase cards already use
  `background` in dark. The requested contrast can therefore reuse tokens rather than add a colour.

The demonstrated root cause is the shared `hito-canvas-atmosphere` design role, not a property of
the selected `main` element.

## What Not To Touch

- Any other gradient role, especially auth-photo overlays, editorial washes, or unrelated
  color-mix backgrounds.
- Product behavior, data, APIs, persistence, Admin behavior, Hito DS primitives, token values,
  Figma, hosted state, or unrelated dirty work.
- Do not replace the removed gradient with a new gradient, image, opacity recipe, custom colour,
  new token, compatibility class, or shadow.

## Validation Expectations

- Before Stage 2, a source map proves no remaining Product/Admin use of
  `hito-canvas-atmosphere`.
- After Stage 2, repository search proves no `hito-canvas-atmosphere` or `canvas-grain` runtime
  definition/consumer remains.
- Verify AppShell, both Admin routes, `/hitoDS` Overview, and one non-Overview Hito DS page in
  available themes/desktop and narrow layout appropriate to their surfaces; no unexpected
  background-image, overflow, console error, or behavior change.
- Focused DS/static checks and an uncontended build. Product and DS each report their assigned
  evidence; Global QA is not implied.

## Next Recommended Role

design_system

## Product Correction — Two-Theme Reference Elevation

Ivan's light-theme Inspector report authorizes the previously excluded
`src/styles/reference-workbench.css` seam and corrects the prior generic page-background direction.
The requested reference library has a deliberate three-layer hierarchy, using already defined
semantic values rather than a custom colour:

| Theme | Sidebar | Right-hand reference canvas | Showcase cards |
| --- | --- | --- | --- |
| Dark | `sidebar` / `stone-950` — darkest | `surface` / `stone-850` — lighter working field | `background` / `stone-900` — dark visual stage |
| Light | `sidebar` / `linen-75` — intermediate | `background` / `linen-100` — slightly darker field | `surface` / `linen-50` — lightest visual stage |

This is the intended theme-aware reversal:

- in Dark, the black sidebar anchors the page, the main field opens up, and black showcase stages
  remain legible inside it;
- in Light, cards become the lightest objects, the main reference canvas becomes slightly darker,
  and the existing sidebar stays between them. The current `70%` semantic sidebar treatment may
  remain only if the rendered intermediate layer still measures as visibly distinct.

### Demonstrated Cause

- `reference-page.tsx` currently gives the entire Hito DS shell `bg-surface`.
- `reference-workbench.css` correctly gives Dark showcase cards `background` but overrides Light
  showcase cards to `surface`.
- In Light, both shell and card therefore resolve to `surface` / `linen-50` (the Inspector measured
  the card as `#FDFBF7`), so the cards visually disappear into the right-hand canvas.
- The current Light sidebar already resolves from `sidebar` / `linen-75`; it is a meaningful middle
  layer once the right canvas uses `background` / `linen-100`.

### Required Final Edit

- Keep the current ShowcaseCard composition, its borderless outer surface, internal header divider,
  radius, padding, preview stage, links, and all specimens unchanged.
- Preserve Dark: right canvas `surface`; showcase-card stage `background`; sidebar `sidebar`.
- Make Light: right canvas `background`; showcase-card stage `surface`; sidebar `sidebar`.
- Establish the theme-aware canvas assignment at the existing `reference-page.tsx` /
  `reference-workbench.css` composition seam. The implementation owner may choose the smallest
  existing class or existing stylesheet composition that follows canonical `data-hito-theme`
  resolution; do not introduce a global token, literal colour, opacity, gradient, new surface
  component, card variant, or product-facing class.
- Do not treat the Inspector's reported radius request as authorization for geometry work: Ivan's
  request is the colour/elevation relationship only.

### Validation Addition

- On `/hitoDS` Overview at desktop and exact `375×812`, in Dark and Light, prove the computed
  three-layer values and visual relationship above; no outer-card border or new background image.
- Verify sidebar navigation, card deep links, a compact centered specimen and an intrinsic-width
  specimen, keyboard focus, page containment, and console health remain unchanged.

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked — final two-theme elevation correction and closure only
Task: Complete the ready canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-retire-hito-canvas-atmosphere.md`

Read AGENTS.md, agents/design-system.agent.md, skills/hito-frontend-design-system/SKILL.md,
skills/hito-qa-browser-regression/SKILL.md, the complete item, and the existing canonical seams:
- src/components/hito-ds/reference-page.tsx
- src/styles/reference-workbench.css
- src/styles/foundations.css
- src/components/hito-ds/reference-overview-page.tsx (read-only unless a source map proves a
  class-composition change is strictly required).

The atmosphere gradient is already retired. Do not repeat or broaden that work. Fix only the
remaining demonstrated Light elevation collapse: `reference-page.tsx` puts the shell on `surface`,
while the existing Light showcase-card override also resolves cards to `surface` / #FDFBF7.

Required existing-token ladder:
- Dark: sidebar `sidebar` / stone-950; right canvas `surface` / stone-850; showcase card
  `background` / stone-900.
- Light: sidebar `sidebar` / linen-75; right canvas `background` / linen-100; showcase card
  `surface` / linen-50.

Keep current card geometry, borderless outer chrome, inner divider, preview stage, links, specimens,
navigation, tokens, values, alpha ladder, Product, Figma, Backend, and unrelated dirty work. Do
not introduce a literal colour, token, opacity recipe, gradient, component, variant, or a change to
the Inspector-reported radius. Use the smallest existing reference-page/reference-workbench
composition seam and canonical data-hito-theme resolution.

After your focused source proof, use one bounded read-only QA browser subagent. Validate `/hitoDS`
Overview desktop and exact 375×812 in Dark and Light: computed three-layer values, visible
relationship, no outer-card border/background image, sidebar nav, card deep links, compact and
intrinsic specimen layouts, keyboard focus, overflow, and console health. Run relevant DS
validator, focused format/lint/diff, and an uncontended build or report contention. If the fixture
QA server is stopped, restart it before the English final receipt.

On pass, mark this overall item completed. Do not stage, commit, push, deploy, mutate hosted state,
or call providers. Use Russian for visible in-progress commentary.
```

## Blockers

None. Product explicitly authorized the existing Design System CSS seam. The task is queued for
DESIGN SYSTEM after its active semantic-manifest contract task; do not interrupt that active work.

## Frontend Product Stage 1 Execution Preflight — 2026-08-11

- Stage outcome: remove only the live `hito-canvas-atmosphere` class usage from the authenticated
  AppShell and the two named Admin routes, leaving `bg-background` and all behavior/composition
  intact.
- Demonstrated cause and owner: the canonical item/source map identifies one AppShell instance,
  two Admin Capture instances, and one Admin Analytics instance as the complete Product/Admin
  consumer set; Frontend Product owns those consumers.
- Existing seam: delete the class token in place from the four existing class strings.
- New production runtime artifacts: none.
- Removed responsibility: Product/Admin surfaces stop opting into the rejected gradient role; the
  canonical role, Hito DS consumer/demo, and deletion remain exclusively in Stage 2.
- Focused proof: exact zero-Product/Admin-consumer search, preserved remaining DS-only map, focused
  formatting/lint/diff hygiene, and the fresh production build already available for the pre-edit
  queue baseline. A new build will run only if the shared output remains uncontended.
- Stop boundary: do not edit shared CSS, Hito DS reference consumers, tokens, or any other gradient;
  return to Product after the zero-consumer receipt for Design System dispatch.

## Frontend Product Stage 1 Receipt — 2026-08-11

- Task and stage: Retire Hito Canvas Atmosphere — Tracked, Stage 1 Frontend Product only.
- Product outcome: the authenticated AppShell and both named Admin routes no longer opt into the
  rejected `hito-canvas-atmosphere` gradient. Their existing `bg-background`, structure, content,
  and behavior remain unchanged.
- Root cause: the canonical source map demonstrated that the shared atmosphere role remained live
  through four Product/Admin class-string usages; those consumer opt-ins were the Frontend-owned
  portion of the retirement.
- Files changed in Stage 1: `src/components/AppShell.tsx`, `src/routes/admin.capture.tsx`,
  `src/routes/admin.analytics.tsx`, and this canonical item.
- New runtime artifacts: none.
- Preserved boundaries: the unrelated pre-existing AppShell header hunk was preserved; no shared
  CSS, Hito DS reference/demo, token, other gradient, behavior, authentication, data, or persistence
  source was changed.
- Lifecycle result: Stage 1 is complete and the item is `ready` with Product as the next owner for
  bounded Design System Stage 2 dispatch. The overall item is not completed.

| Check                             | Scenario / environment                                         | Result  | Evidence                                                                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/Admin consumer retirement | Repository source map across `src/components` and `src/routes` | Passed  | Zero `hito-canvas-atmosphere` occurrences remain outside `src/components/hito-ds/`.                                                                                                                                       |
| Stage 2 boundary                  | Hito DS and foundations source map                             | Passed  | Remaining occurrences are confined to `reference-page.tsx`, `reference-foundations-page.tsx`, and `foundations.css`, exactly the deferred Design System seams.                                                            |
| Preserved semantic background     | Four edited class strings                                      | Passed  | Each retains `min-h-screen`, `bg-background`, and `text-foreground`; no substitute gradient, wrapper, or visual token was added.                                                                                          |
| Formatting and lint               | Prettier check + ESLint on the three implementation files      | Passed  | Both commands exited 0.                                                                                                                                                                                                   |
| Diff hygiene                      | Repository `git diff --check`                                  | Passed  | Exit 0; the unrelated existing AppShell header diff remains untouched.                                                                                                                                                    |
| Production compilation            | Fresh local canonical `npm run build` after Stage 1            | Passed  | Client, SSR, Nitro, and postbuild completed with exit 0; only existing dependency/chunk-size warnings were emitted.                                                                                                       |
| Rendered theme/layout replay      | AppShell and Admin desktop/narrow themes                       | Not run | The supported in-app browser URL policy blocked local DOM inspection during this queue and prohibited an alternate browser bridge; computed background-image, overflow, and console coverage remains for later visual QA. |

Frontend Product Stage 1 Implementation DoD is satisfied. Design System Stage 2, Global QA
Acceptance, release readiness, and the overall item completion remain unclaimed.

## Design System Stage 2 Receipt — 2026-08-11

- Task and stage: Retire Hito Canvas Atmosphere — Tracked, Stage 2 Design System only.
- Preflight: reuse the existing `bg-surface` page composition, remove the last DS consumer and the
  exact dead shared definitions/demo, add no runtime artifact, and preserve every other gradient
  role and unrelated dirty hunk.
- Product outcome obtained: no runtime definition or consumer of `hito-canvas-atmosphere` or
  `canvas-grain` remains under `src/`; all Hito DS reference pages now use the existing semantic
  `bg-surface` page background; false foundations token/demo/copy references are removed.
- Root cause: after the accepted Stage 1 zero-Product/Admin-consumer proof, the rejected shared role
  remained live only through the outer Hito DS reference wrapper, its shared CSS definition/alias,
  and its foundations documentation.
- Files changed in Stage 2: `src/components/hito-ds/reference-page.tsx`,
  `src/styles/foundations.css`, `src/components/hito-ds/reference-foundations-page.tsx`, and this
  canonical item.
- New runtime artifacts: none.
- Preserved boundaries: auth-photo overlays, editorial/color-mix backgrounds, token values,
  Product/Admin source, shared primitives, `bg-background` showcase base composition, Figma, data,
  APIs, and unrelated dirty work were not changed.
- Lifecycle result: Stage 2 runtime retirement is implemented, but the item remains blocked rather
  than completed because the existing light-theme showcase-card override collapses the required
  surface/background contrast and is outside the authorized file list.

| Check                         | Scenario / environment                                                       | Result  | Evidence                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 2 before map            | Repository `src/` search before the edit                                     | Passed  | All remaining `hito-canvas-atmosphere` / `canvas-grain` occurrences were confined to the three authorized Design System files.                                                                                                    |
| Runtime retirement            | Repository `src/` search after the edit                                      | Passed  | Zero definitions or consumers remain for either retired selector.                                                                                                                                                                 |
| DS page composition           | `reference-page.tsx` source inspection                                       | Passed  | The outer reference page now uses `min-h-screen bg-surface text-foreground` with no replacement image, gradient, opacity, wrapper, or token.                                                                                      |
| Dead demo and copy            | Foundations reference source                                                 | Passed  | The false semantic entry, live specimen, instructional copy, and preview branch were removed; remaining overlay roles are unchanged.                                                                                              |
| Shared DS contract            | `npm run validate-hito-ds-components`                                        | Passed  | Validator exited 0 with the current shared component/foundation/reference contract.                                                                                                                                               |
| Formatting and lint           | Scoped Prettier and ESLint                                                   | Passed  | Prettier and ESLint exited 0 for the three implementation files.                                                                                                                                                                  |
| Diff hygiene                  | Scoped `git diff --check` and source diff review                             | Passed  | No whitespace error; only the assigned class swap and exact retired-role deletions were added to the pre-existing dirty files.                                                                                                    |
| Production build              | Uncontended local `npm run build`; explicit `npm run postbuild` confirmation | Passed  | Vite client, SSR, and Nitro compilation completed; postbuild exited 0. Existing dependency directive and large-chunk warnings remain warnings only.                                                                               |
| Managed browser readiness     | `npm run qa:server:status` after build                                       | Not run | No fresh managed runtime was available: status remained stopped with `artifactFreshness: stale` and `receipt_missing_or_invalid`. Browser theme/viewport, overflow, background-image, and console proof is therefore not claimed. |
| Two-theme page/card elevation | Current semantic token and showcase CSS source                               | Blocked | Dark uses page `surface` against card `background`; light currently assigns both page and card `surface`. Correcting the accepted card override requires the excluded `reference-workbench.css` seam.                             |

Stage 2 source retirement and Implementation DoD for the authorized files are satisfied. Overall
task completion, two-theme visual parity, browser acceptance, Global QA Acceptance, and release
readiness remain unclaimed.
