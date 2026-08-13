# Hito DS Foundations Token Specimen Surface Contract

## Work Item ID

2026-08-11-hito-ds-foundations-token-specimen-surface-contract

## Status

completed

## Type

design-system-contract

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Make the repeated clickable token-specimen surfaces in `/hitoDS/foundations` use one truthful,
borderless Hito Design System surface treatment. The treatment must read as the darkest existing
semantic background in Dark mode and as a distinct existing semantic surface in Light mode, while
the actual colour swatch remains an intentionally coloured visual sample.

## Archive Intent

retain_in_place

## Task

Remove perimeter-border chrome and the current washed transparent background from the repeated
semantic and primitive token-specimen buttons in Foundations. Reuse an existing DS surface/token
contract when it meets both themes; otherwise establish exactly one canonical DS reference-surface
owner only after the required consumer audit proves the existing generic class cannot own this
meaning without changing Product surfaces.

This is not a Product-wide `hito-surface-flat` migration and not a colour-token redesign.

## User Report

Local Inspector batch `b23e8be4-84f0-4e19-9afb-9c40a53d99f2` captured `/hitoDS/foundations` in
Dark at `1470×801`.

- Target: `button[aria-label="Copy background semantic token"]`
- Reused element class: `hito-surface-flat`
- Observed: `349.33×160px`, `16px` padding, `10px` radius, and `1px solid oklch(1 0 0 / 0.06)`
  perimeter border.
- Request: remove the border and give this and matching DS reference objects a darker existing DS
  background. Do not make hundreds of custom treatments. Exclude specimens whose coloured
  background is required to demonstrate a token or state.

## Product Correction And Final Radius Decision

Inspector batch `b58fd00a-3f2c-4cde-bb8c-1d3cb35333ce` rechecked the exact semantic token target on
`/hitoDS/foundations` in Dark at `1470×801`. Its metadata incorrectly described `--radius-2xl` as
the 16px radius contract. Canonical source truth defines `--radius-2xl` as 12px and the existing
`--radius-3xl` as 16px. Product confirmed that the 16px visual result is authoritative and that the
selected corner represents one shared outer-surface contract across every matching primitive and
semantic token-copy specimen:

- all four outer corners use the existing `--radius-3xl` contract (16px), superseding both the
  earlier `--radius-xl` rest-chrome wording and the incorrect Inspector token label;
- rest has no visible perimeter border;
- hover or focus may add a semantic perimeter cue only without changing geometry, while
  focus-visible remains distinct;
- the Dark outer surface must render visibly darker than the page canvas, and Light must retain an
  existing distinguishable semantic surface;
- the existing 16px padding and gaps, copy behavior, accessible names, swatches, token truth, and
  all stated exclusions remain unchanged.

## Observed Behavior

The semantic token copy button currently renders with the generic `hito-surface-flat` recipe:
a hairline perimeter border, `--radius-xl`, and a translucent `--color-background` mix. It reads
as a light outlined panel rather than a calm semantic reference surface.

## Expected Behavior

- Semantic and primitive token copy buttons have no perimeter border in either theme.
- Their outer reference surface uses one existing semantic dark/light treatment: the darkest
  existing canvas/background role in Dark and an existing contrasting surface role in Light.
- The card treatment is reused across matching token specimens, not repeated as route-local
  recipes.
- Colour swatches and specimens whose background itself demonstrates a semantic colour, alpha
  overlay, state, or layer relationship retain their intentional visual background.
- All four outer corners use the existing `--radius-3xl` contract; no literal value or one-off
  radius is introduced.

## Source Investigation

### Demonstrated shared class boundary

`src/styles/reference-workbench.css:36-40` defines `hito-surface-flat` with the observed border,
`--radius-xl`, and translucent background. It is not Foundations-only: it has Product/Auth/Admin
consumers including `src/components/CompletionPanel.tsx`,
`src/components/workout-completion/BodyNotesEditor.tsx`,
`src/components/settings/HeartRateProfileSection.tsx`, `src/components/AuthEntryScreen.tsx`, and
`src/routes/admin.login.tsx`.

A global edit to `hito-surface-flat` would therefore change Product behavior outside the Inspector
scope and is prohibited by this item.

### Proven Foundations candidates

- `src/components/hito-ds/reference-foundations-page.tsx:1167-1215` — `SemanticColorCard`, the
  exact Inspector target owner, uses `hito-surface-flat` on its clickable outer button.
- `src/components/hito-ds/reference-foundations-page.tsx:1136-1165` — `PrimitiveColorCard` is the
  matching clickable primitive token inventory surface and uses the same generic class.

### Explicit exclusions pending source classification

- `SemanticColorPreview` and primitive swatches: their background is the factual colour being
  demonstrated.
- Foundations Context layer modules at lines `536`, `565`, and `588`: their backgrounds make live
  semantic-layer relationships legible.
- The alpha-overlay reference at line `402` and every Product/Auth/Admin consumer of
  `hito-surface-flat`.
- Other `/hitoDS` examples until an audit proves they are the same token-specimen contract, rather
  than a real component or scenario demonstration.

## Demonstrated Cause

The generic `hito-surface-flat` class is overloaded: it supplies a quiet container treatment to
Product, Admin, Auth, and several different reference specimens. The exact token cards have no
dedicated semantic reference-surface ownership, so they inherit Product-oriented border and
transparent chrome. Recolouring the generic class would treat the symptom while leaking this
Foundations presentation decision into unrelated routes.

## Reuse-First Change Budget

- Existing seams to inspect first: `SemanticColorCard`, `PrimitiveColorCard`,
  `hito-surface-flat`, `hito-surface-quiet`, and the existing semantic canvas/surface tokens in
  `src/styles/foundations.css`.
- New production artifacts: none by default.
- A single new DS reference-surface selector is permitted only if the audit proves neither existing
  surface contract can meet the exact Dark/Light requirement without modifying Product consumers.
  It must replace both candidate card recipes; multiple per-card selectors are forbidden.
- Removed responsibility: the token-card dependence on the overloaded generic Product container
  chrome, plus its perimeter border and transparent mix.

## What Not To Touch

- Do not modify the values or Dark/Light mappings of primitive or semantic colours.
- Do not change global `hito-surface-flat`, Product, Admin, Auth, Backend, persistence, Figma,
  manifest semantics, or unrelated dirty work.
- Do not alter swatches, Context demonstration backgrounds, alpha-overlay demonstrations, action
  state colours, or contrast pairings.
- Do not add an opacity value, literal colour, literal radius, wrapper component, token family,
  component API, compatibility layer, or a second palette.
- Do not reopen or amend the completed
  `2026-08-11-hito-ds-foundations-color-information-architecture.md`; this is a subsequent
  Inspector batch with a narrower chrome contract.

## Definition Of Done

1. The exact semantic token target and matching primitive token cards share one source-backed
   outer-surface contract.
2. That contract removes perimeter borders and resolves as required under the existing global Dark
   and Light controls, using existing semantic tokens.
3. Intentional colour/layer demonstration backgrounds and all Product consumers are unchanged.
4. No new card family, duplicated recipe, custom colour, or Product-facing change exists.

## Validation Expectations

| Check                  | Scenario / environment                                             | Required evidence                                                                                                        |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Consumer discriminator | Source audit                                                       | Exact consumer map proves the chosen owner does not alter Product/Auth/Admin surfaces.                                   |
| DS contract            | Existing validator and manifest parity                             | Foundations token cards and current manifest contract remain truthful.                                                   |
| Browser                | `/hitoDS/foundations`, desktop and exact `375×812`, Dark and Light | Semantic + primitive copy cards are borderless, readable, theme-reactive, and contained; actual swatches remain visible. |
| Interaction            | Existing copy buttons                                              | Keyboard focus and copy action remain accessible; no console errors.                                                     |
| Hygiene                | Focused format, lint, diff                                         | Task-owned source only.                                                                                                  |
| Build                  | Fresh production build only if uncontended                         | Build result or factual contention boundary.                                                                             |

## Stage

Design System implementation complete; focused radius proof passed.

## Execution Preflight

- Product outcome: the semantic and primitive token-copy cards become calm, opaque, borderless
  reference surfaces while their factual colour samples remain unchanged.
- First incorrect owner: both card functions consumed `hito-surface-flat`, whose Product/Auth/Admin
  container contract supplies the reported border and transparent background mix.
- Existing seam: `PrimitiveColorSwatchButton`, `SemanticColorCard`, and
  `src/styles/reference-workbench.css` remain the only implementation owners.
- Reuse decision: `--color-background` already maps to `stone-900` in Dark and `linen-100` in
  Light. Against the `/hitoDS` page's `--color-surface` canvas, it is the darker Dark canvas and a
  distinct Light surface. No token value or theme mapping changes.
- Existing-contract discriminator: `hito-surface-quiet` retains transparent-border box chrome and
  a transparent surface mix; `hito-ds-showcase-card` maps Light back to the page's own surface.
  Neither fulfills this exact token-specimen contract.
- New runtime artifacts: no file, component, token, API, or dependency. One permitted scoped CSS
  selector owns both existing token-card consumers.
- Removed responsibility: the two token-card functions no longer depend on Product-oriented
  `hito-surface-flat` chrome or its hover-border treatment.
- Promotion/stop boundary: any Product/Auth/Admin edit, token remap, or interaction change remains
  out of scope.

## Consumer And Exclusion Audit

- `hito-surface-flat` remains unchanged for its 11 source-file consumer groups, including Product
  completion/settings/workout surfaces, Auth, Admin, and unrelated `/hitoDS` scenarios.
- The only clickable Foundations colour-token inventory owners are
  `PrimitiveColorSwatchButton` and `SemanticColorCard`; both now consume
  `hito-ds-token-specimen-surface`.
- Primitive swatches retain their inline token background and internal hairline separator.
- `SemanticColorPreview`, Context layer modules, the alpha-overlay specimen, workout role samples,
  and all other scenario surfaces remain outside the new selector.

## Implementation

- `src/styles/reference-workbench.css` defines one `hito-ds-token-specimen-surface` contract with
  `border: 0`, the existing 16px `--radius-3xl`, and opaque `--color-background`.
- `src/components/hito-ds/reference-foundations-page.tsx` replaces `hito-surface-flat` only on the
  primitive and semantic token-copy buttons and removes their now-obsolete hover-border utility.
- Copy handlers, accessible names, focus rings, card content, semantic contrast metadata, and
  colour previews are unchanged.

## Validation Receipt

Validation layer: focused Design System implementation proof only. This is not Global QA,
release readiness, hosted proof, deployment evidence, or Figma parity.

| Check                     | Scenario / environment                                 | Result            | Evidence                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Final Product decision    | Inspector batch `b58fd00a-3f2c-4cde-bb8c-1d3cb35333ce` | Passed            | Product made the 16px visual result authoritative. The Inspector token label was incorrect: source truth defines `--radius-2xl` as 12px and the reused `--radius-3xl` as 16px.                                                                              |
| Consumer discriminator    | Repository source audit                                | Passed            | The scoped selector has exactly two runtime consumers: `PrimitiveColorSwatchButton` and `SemanticColorCard`. `hito-surface-flat` remains unchanged for its 11 source-file consumer groups.                                                                  |
| Radius source contract    | `foundations.css` and `reference-workbench.css`        | Passed            | `--radius` remains 8px; `--radius-3xl` remains `calc(var(--radius) + 8px)`; the scoped token-specimen selector consumes that existing token. No global token, literal, alias, file, API, or component was added.                                            |
| DS contract               | `npm run validate-hito-ds-components`                  | Passed            | Fresh final-decision run completed with 43 primitive colours, 41 semantic colours, and 18 text styles.                                                                                                                                                      |
| Manifest parity           | Existing completed non-radius proof                    | Passed (retained) | Generated manifest parity had already passed. It was not rerun because the final change consumes an existing radius token without changing a manifest source, token value, or mapping.                                                                      |
| Focused static            | Prettier check and `git diff --check`                  | Passed            | The changed CSS and canonical item passed Prettier; repository diff had no whitespace errors. ESLint was not rerun because no TS/TSX changed in the final radius correction.                                                                                |
| Production build          | Canonical `npm run qa:server:start`                    | Passed            | After the competing raw build settled, the owner canonical build completed Vite client, SSR, Nitro, and postbuild. The managed loopback runtime reached `current`, `healthy`, `fresh`, and `receipt_matches` before this final canonical receipt write.     |
| Rest surface and contrast | `/hitoDS/foundations`, 1470x801, Light and Dark        | Passed            | All 41 semantic and 43 primitive cards retained zero-width/no-style borders and existing backgrounds. Light remained `oklch(97.2% .01 78)` against surface `oklch(98.8% .006 82)`; Dark remained `oklch(16% .005 60)` against surface `oklch(19% .005 60)`. |
| Spacing and samples       | Existing completed non-radius browser proof            | Passed (retained) | Semantic padding/gap and primitive detail padding remain 16px; swatches and the primitive internal separator remain unchanged. This was not replayed because the final one-line radius correction cannot change spacing, content, or swatch ownership.      |
| Hover, focus, copy        | Existing completed interaction proof                   | Passed (retained) | Geometry-stable hover, signal focus-visible, pointer copy, and physical keyboard copy had passed before the final decision. They were not replayed because no interaction or state selector changed.                                                        |
| Responsive and themes     | Exact 375x812, Light and Dark                          | Passed            | Both families computed 16px on all four corners, retained zero-width/no-style borders and theme backgrounds, and had `scrollWidth === clientWidth` (375px).                                                                                                 |
| Console                   | Focused in-app browser replay                          | Passed            | Error-level browser logs were empty after desktop, responsive, and theme checks.                                                                                                                                                                            |
| Radius contract           | Both families, both themes, both viewports             | Passed            | All 41 semantic and 43 primitive specimens computed 16px for top-left, top-right, bottom-right, and bottom-left at both 1470x801 and exact 375x812.                                                                                                         |

## Completion Boundaries And Omitted-Check Consequence

Product resolved the only implementation blocker by selecting the 16px visual result and the
existing source-truth `--radius-3xl` token. No Product, Auth, Admin, Figma, manifest, primitive,
global token, or shared `hito-surface-flat` contract changed.

The final canonical task write changes the repository-backed Admin snapshot after the successful
build receipt. The managed fixture server remained running, but final post-receipt artifact
freshness is not claimed. No screenshot artifact was required because computed-style, DOM,
overflow, and console evidence directly proved the final radius decision, while the unchanged
interaction evidence was retained from the completed pre-decision proof.

Subagents: none. Ivan directed the primary Design System owner to execute the task itself. The
final focused replay used the in-app browser; the earlier completed interaction proof used the
in-app browser and Chrome.

## Next Recommended Role

none

## Original Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Give the repeated Foundations token-specimen cards one borderless semantic surface treatment
without changing the overloaded Product surface class.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-token-specimen-surface-contract.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/styles/reference-workbench.css`
- `src/styles/foundations.css`
- the existing DS validator and manifest seams touched by Foundations.

Outcome:
The clickable Semantic Colors and Primitives token cards in `/hitoDS/foundations` are calm,
borderless reference surfaces. In Dark they use the existing darkest semantic canvas/background
role; in Light they use an existing contrasting semantic surface role. They remain theme-reactive
through the global System/Dark/Light control. Their actual colour swatches remain intentionally
coloured and visible.

First prove the consumer boundary. `hito-surface-flat` is shared by Foundations and Product/Auth/
Admin. Do not edit it globally. The known candidate owners are `SemanticColorCard` at
`src/components/hito-ds/reference-foundations-page.tsx:1167-1215` and `PrimitiveColorCard` at
`1136-1165`. Audit only other `/hitoDS` candidates that demonstrably share this exact token-copy
card responsibility. Exclude swatches, Context layer demonstrations, alpha-overlay demonstrations,
and any specimen whose background is factual visual evidence.

Reuse an existing Hito DS surface contract if it fulfills the required Dark/Light result. Add one
reference-specific shared DS selector only if the audit proves that existing contracts cannot do so
without changing Product consumers. One reusable owner may replace both candidate card recipes;
do not introduce per-card classes, a component family, a wrapper, token, literal colour, literal
radius, opacity recipe, or compatibility path.

Preserve token values/mappings, semantic card content, swatches, contrast pairings, copy behavior,
focus semantics, manifest semantics, Product/Admin/Auth source, Figma, Backend, and unrelated
dirty work. Do not reopen the completed Foundations IA task or modify the global `hito-surface-flat`
contract.

Use a bounded read-only Designer review before writing to confirm the semantic dark/light surface
choice and a bounded read-only QA review after your own focused validation. Verify source consumer
isolation; DS validator/manifest parity; `/hitoDS/foundations` at desktop and exact 375×812 in Dark
and Light; semantic and primitive card borders/backgrounds, visible swatches, keyboard copy/focus,
no overflow, and no console errors. Run a production build only when uncontended. If the fixture QA
server is stopped for proof, restart it before the final receipt. Do not stage, commit, push,
deploy, access hosted state, alter Figma, call providers, or delete material data.

Use Russian for visible in-progress commentary. Record the final formal receipt in English in the
canonical item with source hierarchy, changed files, validation table, omitted-check consequences,
and blockers.
```
