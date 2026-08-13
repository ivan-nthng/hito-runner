# Workout Semantic Color Theme Contrast Decision

## Work Item ID

2026-08-11-workout-semantic-color-theme-contrast-decision

## Status

completed

## Type

design-decision-discovery

## Priority

high

## Owner

designer

## Mode

Tracked

## Scope

Research and document the canonical Light/Dark theme contract for the existing workout semantic
colour roles. The decision must preserve recognisable workout hues while ensuring readable
foreground and state labels over every rendered base/surface/hover/active/border/ring treatment.

This is design discovery and a handoff specification only. It must not change CSS token values,
runtime source, generated manifests, Product surfaces, Figma, or theme behavior.

## Archive Intent

retain_in_place

## Task

Define how every existing workout type semantic colour resolves in Light and Dark. The resulting
decision must state whether a role needs theme-specific base values, theme-specific derived state
values, a foreground/inverse rule, or a combination — and demonstrate contrast without erasing the
recognisable hue family.

The following outcome is mandatory for the later implementation owner: each existing workout
semantic role has intentional Light and Dark resolved values for the contexts it actually uses. A
colour must not become unreadable simply because the global theme switched.

## User Report

Inspector batch `4437c07f-7db4-41fe-8754-89d00f297aee` captured the Recovery semantic-role card on
`/hitoDS/foundations` in Light at `1470×801`. Recovery's `surface`, `hover`, `active`, `border`,
and `ring` labels are nearly invisible against their rendered pale blue backgrounds.

Ivan's decision request:

- every workout colour must have a Light and a Dark version;
- text must be readable in every theme and state;
- colour identity must remain recognisable, not collapse into grey or arbitrary replacement hues;
- the designer must propose and document the decision before implementation.

## Observed Behavior

- `src/styles/foundations.css:191-510` defines the existing workout type role sets:
  `rest`, `recovery`, `easy`, `steady`, `long-run`, `progression`, `tempo`, `intervals`, `hills`,
  and `run-walk`.
- Every set currently exposes `base`, `muted`, `surface`, `hover`, `active`, `border`, `ring`, and
  `foreground` roles. The inspected Recovery base is `--hito-workout-ice-blue-base`; its state
  roles are derived from that same base with fixed mixes.
- The available source map shows one shared workout-type definition family, rather than a documented
  Light/Dark decision table for all role slots. The Light screenshot demonstrates that at least one
  real rendered state fails legibility.
- `src/components/hito-ds/reference-foundations-page.tsx:930-1115` renders Work type and semantic
  role specimens from `WORKOUT_SECTION_COLOR_ROLES` and
  `workoutSectionColorVar(...)`; this is the correct visual decision surface, not a product-only
  exception.
- Runtime product consumers read the same semantic variables through
  `src/lib/workout-color-tokens.ts` and `src/lib/training.ts`; a later token change is therefore
  cross-surface and must be deliberate.

## Required Discovery Questions

1. For every current workout type and slot, what resolves in Light and Dark now, and where does
   contrast fail for text, border, ring, and state samples?
2. Which roles require two theme-resolved source values to retain hue identity and contrast? Do not
   assume every slot needs a new primitive if an existing semantic foreground/derived state rule
   suffices.
3. What foreground rule applies over each base/derived state: `on-light`, `on-dark`, or a
   theme-specific semantic foreground? Identify threshold/contrast reasoning for the actual
   backgrounds, not a visual guess.
4. Can the existing Hito primitive palette and semantic theme mapping express the solution with the
   fewest new roles? If a new token is genuinely unavoidable, name the exact invariant that current
   roles cannot represent; otherwise propose none.
5. What must `/hitoDS/foundations` display so developers can see the Light/Dark role resolution and
   contrast without duplicating a separate palette?
6. Which Product consumer states must the later Design System implementation verify so Foundations
   is not the only readable surface?

## Required Decision Artifact

Append an English design decision to this canonical item containing:

- current-state audit table for all 10 workout types × used semantic slots in Light and Dark;
- recorded contrast/legibility findings, including the Recovery discriminator from the screenshot;
- the recommended minimal theme-resolution model, with a clear source-of-truth owner;
- role-by-role treatment for foreground/inverse text and state surfaces;
- preserved hue-family intent and any non-goals;
- a later DESIGN SYSTEM implementation plan with exact existing seams, deletion/reuse boundaries,
  validation matrix, rollback condition, and one exact handoff prompt.

The document must distinguish verified computed/rendered facts from recommendations. Do not present
an unmeasured colour as approved implementation truth.

## Boundaries

- No source/CSS/token/manifest/route/DS/Figma/Product/Backend changes in this task.
- Do not create a new palette, recolour by visual preference, add raw consumer primitives, create a
  Light palette tab, or duplicate semantic role collections.
- Do not use a one-off Foundations override to hide a cross-theme token defect.
- Preserve the current global System/Dark/Light control and existing workout role names until a
  later implementation audit proves a zero-reachability removal.

## Validation Expectations

| Check | Scenario / environment | Required evidence |
| --- | --- | --- |
| Source audit | Canonical foundations and workout token helpers | Every current role/slot and consumer classifies to an existing source. |
| Rendered discriminator | Recovery and representative light/dark hues | Light Recovery failure reproduced/measured; Dark comparison retained. |
| Contrast review | All actual text-on-state combinations | Tables distinguish pass/fail/unknown and record the backing surface. |
| Product impact map | Existing shared consumers | No route-local fix is proposed for a shared token decision. |
| Decision quality | Canonical item | One minimal model, explicit non-goals, and an implementable DS handoff. |

## Stage

Designer decision complete. No implementation performed.

## Next Recommended Role

product

## Blockers

None. If the current source cannot expose an exact rendered/composited value for a state, record
the named backing layer and required measurement instead of inventing a HEX or contrast pass.

## Designer Decision Artifact — 2026-08-11

### Decision

Keep the ten existing raw workout hue anchors and the existing semantic role family. Resolve every
semantic slot intentionally in both Light and Dark, but permit a Light/Dark value to alias the same
raw anchor when the measured pairing passes. A theme version is an intentional semantic resolution,
not a requirement to invent a second raw palette.

The minimal missing invariant is one additional semantic slot:
`--hito-workout-type-<role>-content`. It means hue-identifying text or icon content on a neutral or
soft workout-colour surface. The existing `foreground` slot remains the inverse/on-solid-base
foreground. This is not representable by the current slots because `base` is a solid identity fill,
while `foreground` is already the text paired with that fill. Reusing either for both contexts
produces the measured failures below.

All `muted`, `surface`, `hover`, `active`, `border`, and `ring` roles must be theme-resolved against
their allowed parent surfaces. Fixed alpha percentages are not part of the semantic contract and
must not become token names. An implementation may reuse an identical measured recipe across hues
or themes, but it must not assume that the current 52/16/24/34/54/36 recipe works universally.

### Canonical ownership and current source facts

- `src/styles/foundations.css` owns the raw workout hue anchors and the semantic role resolution.
- `src/lib/workout-color-tokens.ts` is the canonical typed access layer for workout type and section
  slots. It currently exposes `base`, `muted`, `surface`, `hover`, `active`, `border`, `ring`, and
  `foreground` for all ten workout types.
- `src/lib/training.ts` maps workout-domain meaning to those shared variables. It does not own
  colour values.
- `src/components/hito-ds/reference-foundations-page.tsx` is the canonical decision specimen. Its
  `SemanticRoleCard` currently renders `base` as label colour over `surface`, `hover`, and `active`,
  and also uses `base` as the label colour for the `border` and `ring` samples.
- The generated manifest is not evidence for this decision: the workout-domain variables are
  outside the current semantic-colour export markers and the Foundations page reads them through
  the workout token helpers. Expanding the manifest is a separate proven-export decision, not an
  automatic part of this colour fix.
- Dark and Light currently receive the same workout declarations from `:root`; the source comment
  explicitly says the workout slots inherit until a theme split exists. Alpha states therefore
  composite differently only because their structural parents differ.

### Evidence method and thresholds

The user-provided inspector capture is the rendered discriminator. The source audit then reproduced
its pairing from the current renderer and CSS. Ratios below are source-computed WCAG contrast ratios
using the declared HEX/OKLCH values, CSS alpha compositing, and the actual structural parent roles:
`background`, `surface`, `surface-elevated`, and `popover`. A ratio shown for a theme is the weakest
of those four parents unless the row says otherwise.

- Normal label text target: **4.5:1**. The current 11 px specimen labels do not qualify as large
  text.
- Essential icons, component boundaries, selected-state outlines, and focus indicators target:
  **3:1** against the adjacent colour.
- Hover/active fill deltas do not receive an invented WCAG ratio. They must be monotonic and visibly
  distinguishable in the implementation review, while their paired text still passes 4.5:1.
- A source-computed pass is design evidence, not browser acceptance. The implementation owner must
  read final `getComputedStyle()` values in a real browser because gamut mapping and actual nesting
  can change the effective result.

`P` means the applicable threshold passes; `F` means it fails. `S/H/A` are `surface`, `hover`, and
`active`; `B/R` are `border` and `ring`. `Solid` is current `foreground` on `base`; `Muted` is current
`foreground` on `muted`; `content` is the current `base` used as text on a structural parent.

### Current 10-role × 8-slot audit

| Workout type | Current identity / inverse | Solid text | Muted text | Light: content; S/H/A text; B/R | Dark: content; S/H/A text; B/R | Required treatment |
| --- | --- | ---: | ---: | --- | --- | --- |
| Rest | Slate / sand-50 | 4.56 P | 1.98 F | 4.46 F; 3.68/3.32/2.91 F/F/F; 2.04/1.57 F/F | 3.58 F; 3.04/2.76/2.42 F/F/F; 1.94/1.50 F/F | Retain hue; verify the narrow solid margin; add Light/Dark `content`; resolve all states per theme. |
| Recovery | Ice blue / stone-950 | 15.45 P | 17.49 P | 1.19 F; 1.16/1.14/1.12 F/F/F; 1.10/1.07 F/F | 13.44 P; 8.78/6.84/5.01 P/P/P; 4.78/2.81 P/F | Retain hue/base; Light needs a darker same-hue `content`; resolve states and ring per theme. |
| Easy | Maya blue / stone-950 | 10.53 P | 14.51 P | 1.74 F; 1.60/1.53/1.45 F/F/F; 1.35/1.22 F/F | 9.16 P; 6.60/5.42/4.20 P/P/F; 3.57/2.25 P/F | Retain hue/base; add measured Light/Dark `content`; resolve active and ring per theme. |
| Steady | Azure / stone-950 | 6.83 P | 11.89 P | 2.69 F; 2.33/2.16/1.96 F/F/F; 1.67/1.40 F/F | 5.94 P; 4.68/4.05/3.34 P/F/F; 2.63/1.82 F/F | Retain hue/base; add measured Light/Dark `content`; resolve all state boundaries. |
| Long run | Deep indigo / sand-50 | 4.41 F | 1.94 F | 4.31 F; 3.51/3.15/2.74 F/F/F; 2.12/1.62 F/F | 3.71 F; 3.18/2.90/2.55 F/F/F; 1.93/1.49 F/F | Preserve indigo hue, but tune the solid base/inverse pair; add `content`; resolve all states per theme. |
| Progression | Orchid / sand-50 | 3.97 F | 1.85 F | 3.87 F; 3.20/2.90/2.55 F/F/F; 1.99/1.56 F/F | 4.12 F; 3.46/3.12/2.70 F/F/F; 2.07/1.56 F/F | Preserve orchid; use a measured on-base inverse (existing stone-950 computes to 4.74); add `content`; resolve all states. |
| Tempo | Tiger flame / stone-950 | 6.65 P | 11.51 P | 2.76 F; 2.34/2.15/1.93 F/F/F; 1.77/1.46 F/F | 5.79 P; 4.64/4.04/3.35 P/F/F; 2.55/1.78 F/F | Retain hue/base; add measured Light/Dark `content`; resolve all state boundaries. |
| Intervals | Coral / stone-950 | 6.43 P | 11.28 P | 2.85 F; 2.40/2.20/1.97 F/F/F; 1.81/1.48 F/F | 5.60 P; 4.53/3.96/3.30 P/F/F; 2.48/1.74 F/F | Retain hue/base; add measured Light/Dark `content`; resolve all state boundaries. |
| Hills | Burnt orange / stone-950 | 8.46 P | 12.97 P | 2.17 F; 1.91/1.80/1.66 F/F/F; 1.53/1.33 F/F | 7.36 P; 5.58/4.72/3.78 P/P/F; 3.04/2.01 P/F | Retain hue/base; add measured Light/Dark `content`; resolve active and ring per theme. |
| Run/walk | Sunflower gold / stone-950 | 11.36 P | 15.03 P | 1.62 F; 1.49/1.43/1.36 F/F/F; 1.31/1.20 F/F | 9.89 P; 7.00/5.69/4.36 P/P/F; 3.78/2.35 P/F | Retain hue/base; add measured Light/Dark `content`; resolve active and ring per theme. |

This table covers all current slots: `base` and `foreground` are represented by Solid,
`muted` by Muted, and the six remaining state/boundary uses by content, S/H/A, and B/R.

### Recovery Light discriminator

The Foundations card has `background: var(--color-background)`. In Light that resolves to
`linen-100`; Recovery resolves to ice blue `#bee9ff`. The current renderer uses the ice-blue `base`
as the label colour, including over alpha tints of that same blue.

| Recovery pairing on the actual DS specimen parent | Light | Dark comparison |
| --- | ---: | ---: |
| Base as text on `background` | 1.19 F | 15.06 P |
| Base text on surface / hover / active | 1.16 / 1.14 / 1.12 F/F/F | 10.36 / 8.02 / 5.73 P/P/P |
| Border / ring against `background` | 1.10 / 1.07 F/F | 4.93 / 2.81 P/F |

This proves the reported Light symptom and identifies the first incorrect contract: `base` is being
treated as universally readable content. The pale state recipes amplify that mistake. It is not a
Foundations-only visual override candidate.

The screenshot binary was not available in the checkout or retained local capture cache during
this audit, so no pixel sampling was claimed. The canonical inspector report remains the rendered
evidence; the ratios above are independently reproduced from the exact current source pairings.

### Minimal semantic contract

| Slot | Canonical meaning | Light/Dark resolution rule | Paired content and acceptance |
| --- | --- | --- | --- |
| `base` | Solid identity fill, marker, chart/schedule identity swatch | Resolve explicitly in both themes. Alias the current raw anchor when its solid pair passes. Change lightness/chroma, not hue family, only where needed (currently Long run requires adjustment). | Pair only with `foreground`; normal text 4.5:1. |
| `foreground` | Inverse/on-solid-base text and icon | Reuse existing Hito foreground primitives when measured. Progression can use existing stone-950; Long run needs a measured same-hue base or foreground solution. Keep the current name until a zero-reachability audit supports a rename. | Used only on `base`; 4.5:1 for normal text and 3:1 for essential icons. |
| `content` **new** | Hue-identifying text/icon on neutral, muted, or soft workout-colour surfaces | Resolve per role in Light and Dark from the same hue anchor. Prefer lightness/chroma adjustment; no consumer raw colour. An intentional theme alias is allowed only after all parent/state pairings pass. | Pair with `background`, `surface`, `surface-elevated`, `popover`, `muted`, `surface`, `hover`, and `active`; 4.5:1 for normal text. |
| `muted` | Low-emphasis, non-interactive workout identity surface | Derive against the actual theme parent, not universally toward white. It may share a measured recipe with `surface`, but only if their purposes remain distinguishable. | Pair with `content`, never assume the solid inverse works. |
| `surface` | Resting soft identity surface | Resolve per theme and allowed parent. Alpha is an implementation tool, not the semantic name or guaranteed shared value. | Pair with `content`; text 4.5:1. |
| `hover` | Hover soft surface | Monotonic and perceptible relative to `surface` on each allowed parent without losing text contrast. | Pair with `content`; text 4.5:1. |
| `active` | Pressed/selected soft surface | Strongest soft state before a solid `base` treatment. A persistent selected boundary must also meet 3:1. | Pair with `content`; text 4.5:1. |
| `border` | Component or selection boundary | Resolve per theme/parent; do not inherit the current 54% recipe when it fails. | 3:1 when the boundary is required to identify the component/state; otherwise it remains decorative and cannot carry meaning alone. |
| `ring` | Focus indicator | Resolve independently from border and against both the component and its adjacent parent. Do not reuse a weak translucent ring solely for hue consistency. | 3:1 focus indication; retain a non-colour focus shape/offset. |

The same `content` versus `foreground` invariant applies to workout section roles. It should be
extended through the existing section helper in a later independent slice, rather than creating a
second section-only recipe. This decision does not add a colour role for `repeat_set`; its ordered
children remain the semantic colour owners.

### Hue-family preservation

The identity sequence remains: Rest/slate, Recovery/ice blue, Easy/maya blue, Steady/azure, Long
run/deep indigo, Progression/orchid, Tempo/tiger flame, Intervals/coral, Hills/burnt orange, and
Run/walk/sunflower gold. Theme resolution may change lightness, chroma, and alpha. It must keep the
same named raw anchor as the source and must not replace a role with grey or another workout hue.
Any deliberate hue-angle change is a Product decision, not an implementation convenience.

Colour never carries workout meaning alone. Existing labels, glyphs, and structural markers remain
present, which also protects colour-vision-deficient users and cases where two hues converge under
display or accessibility conditions.

### Existing consumer classification and required migration

| Consumer family | Current use | Later contract |
| --- | --- | --- |
| `SemanticRoleCard` and Foundations state labels | `base` as text on neutral/tinted surfaces | Use `content`; keep the solid Aa sample as `base` + `foreground`; show measured contrast. |
| `TodayHero`, `routes/workout.$date.tsx`, and `Calendar` workout labels | `workoutTypeMeta().color`, which is `base`, as text on structural surfaces | Frontend Product migration to the shared `content` slot; keep adjacent dots/markers on `base`. |
| DS pattern/playground labels | `workoutTypeColorVar(role)` defaulting to `base` | Text/icons use `content`; solid specimen fills and identity swatches stay `base`. |
| Calendar projection and manual-workout markers | `base` as marker/fill | Keep `base`; do not convert solid identity markers to text colour. |
| Workout structure timeline and generated-plan bars | Section `base` as solid fill with `foreground` text | Keep `base` + `foreground`; verify Long run is not relevant to section roles and audit each section pair separately. |
| Repeat-set section labels on soft section surfaces | Section `base` as text on `surface` | Migrate to section `content` in the independent section slice. |

The token contract belongs to DESIGN SYSTEM. Route/component usage belongs to the Frontend Product
lane. The Design System implementation must not hide Product debt with a compatibility override;
Product should dispatch a separate bounded Frontend Product migration after the shared slot exists.

### `/hitoDS/foundations` decision display

Keep one semantic role grid and the existing global System/Dark/Light control. Do not add a Light
palette tab or duplicate role collection. Each role card should show real pairings rather than raw
token names alone:

1. solid `base` + `foreground`;
2. neutral parent + `content`;
3. `muted`/`surface`/`hover`/`active` + `content`;
4. `border` and `ring` against each allowed structural parent;
5. compact computed ratio and pass/fail metadata for the active global theme.

The card may cycle or nest `background`, `surface`, `surface-elevated`, and `popover` parents inside
the same specimen. It must not hard-code a preview-only colour and must read the same helpers as
Product consumers.

### Later implementation sequence

1. **DESIGN SYSTEM — workout type contract.** In `foundations.css`, replace the inherited one-theme
   workout type state recipes with explicit Light/Dark semantic resolutions for all ten roles; add
   only the proven `content` slot; update `WORKOUT_COLOR_STATE_SLOTS` and the existing token helper.
   Reuse the current raw hue anchors and existing Hito foreground primitives. Do not leave the old
   recipe active behind aliases or a compatibility path. Resolve Long run's solid pair and
   Progression's inverse from measured values, not visual preference.
2. **DESIGN SYSTEM — canonical specimen and existing validation.** Update
   `SemanticRoleCard` to pair each surface with the correct content role and expose the active-theme
   contrast matrix. Extend the existing validator/test seam only; do not create a parallel colour
   framework or standalone fixture. Prove all ten roles over the four parents in both themes.
3. **DESIGN SYSTEM — section parity as an independent, net-reducing slice.** Apply the same single
   `content` invariant to the six existing section roles and remove `base`-as-soft-surface text from
   `RepeatSetStructureCard`. Keep `repeat_set` without a standalone colour.
4. **FRONTEND Product — bounded consumer migration.** Product dispatches the Product lane to replace
   textual/icon `base` use with the shared `content` slot in Today, workout detail, calendar, and
   selected plan surfaces. Solid dots, bars, and identity markers remain on `base`. No route-local
   raw values or overrides.
5. **QA — focused two-theme acceptance.** Verify Foundations and the mapped Product states at the
   real parents and responsive sizes. Global QA/release readiness remains a separate assignment.

Each slice must delete or replace a demonstrated misuse and must not increase the number of local
colour recipes. Do not land a partially resolved theme where a role has `content` but retains an
unmeasured failing ring or solid inverse.

### Validation matrix for implementation

| Layer | Matrix | Acceptance |
| --- | --- | --- |
| Token source | 10 workout types × 9 slots × Light/Dark | Every slot resolves; no undefined value; no local raw consumer colour; intentional aliases documented. |
| Text pairings | Four structural parents plus muted/surface/hover/active | Normal labels >=4.5:1; qualified large text only may use 3:1. |
| Solid pairings | Every `base` + `foreground` | >=4.5:1 for normal text. Rest's narrow margin and Long run/Progression failures receive explicit browser evidence. |
| UI boundaries | Border, selected outline, ring on all allowed parents | Required boundary/focus indicator >=3:1; focus shape/offset remains visible. |
| Foundations | System/Dark/Light at desktop and 375 px | No clipped ratios; every specimen uses canonical variables; Recovery Light labels are readable. |
| Product map | Today hero, workout detail, calendar day/tooltip, selected plan, patterns, timeline, manual authoring | Text/icon consumers use `content`; solid fills use `base`; timeline uses `base` + `foreground`; no hue meaning is lost. |
| Accessibility | Keyboard focus, forced-colour/high-contrast sanity, colour-vision non-colour cues | Focus remains locatable and labels/glyphs preserve meaning without hue alone. |

### Rollout and rollback

- Land Design System slices before Product consumer migration; keep each slice source-coherent and
  independently auditable.
- Capture browser-computed values and screenshots for both themes before accepting a slice. A
  source-only calculation cannot close implementation QA.
- Roll back the complete failing slice if any role loses its named hue family, any required pairing
  falls below its threshold on an allowed parent, the helper returns an undefined role, or a local
  compatibility recipe is required to keep a Product surface readable.
- Do not roll back by restoring a route-local `base` text override. Restore the previous coherent
  source and keep the implementation item open for a corrected shared resolution.

### Intentionally unresolved implementation values and non-goals

- No new HEX/OKLCH values are approved here. The exact Light/Dark `content`, state, border, ring,
  and Long run solid-pair values require browser-computed measurement in the implementation slice.
- Rest's 4.56 source-computed solid ratio is too close to the threshold to accept without final
  browser evidence and rounding/gamut review.
- Progression's existing stone-950 candidate is source-computed at 4.74 on the current base, but it
  remains a measured implementation candidate until browser verification.
- This is not a new palette, hue redesign, chart redesign, Figma mutation, manifest expansion,
  route-local override, general colour-system rewrite, or Product semantics change.
- Workout state alpha values are not required to equal the neutral-chrome alpha vocabulary; these
  are domain colours with different contrast constraints.

### Exact later DESIGN SYSTEM handoff

Product should retain this completed decision as the design source, create
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contract-implementation.md`
as the tracked implementation item before dispatch, and send exactly this prompt:

```text
ROLE: DESIGN SYSTEM

Mode: Tracked implementation — shared workout colour contract only

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contract-implementation.md`

Use the completed design decision as the canonical design source:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-workout-semantic-color-theme-contrast-decision.md`

Before the first write, read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, the complete decision item, current dirty-tree state,
`src/styles/foundations.css`, `src/lib/workout-color-tokens.ts`, and
`src/components/hito-ds/reference-foundations-page.tsx`. Re-establish the Recovery Light
discriminator from current browser-computed values.

Implement only the canonical shared contract and Foundations proof: preserve the ten existing raw
hue anchors; add the single semantic `content` slot for hue-identifying text/icons on neutral and
soft surfaces; retain `foreground` as the on-solid-base pair; explicitly resolve every workout type
slot in Light and Dark; and replace the demonstrated fixed inherited recipes where they fail. Tune
Long run's solid pair and Progression's inverse only from measured contrast. Update the existing
typed helper, canonical Foundations specimen, and existing validation seam. Do not create a second
palette, percentage-named tokens, local raw consumer colours, compatibility aliases, a new colour
framework, or a route-only override.

Keep Frontend Product routes read-only. Return an exact consumer migration map to Product for a
separate FRONTEND Product slice; solid markers/fills must remain `base`, while textual/icon identity
consumers will move to `content`. Treat section-role parity as a separate independently auditable
Design System slice after the ten workout types pass.

Validate all 10 roles across background/surface/elevated/popover and muted/surface/hover/active in
both themes, plus solid base/foreground and border/ring/focus pairings. Normal text must reach 4.5:1
and required UI/focus boundaries 3:1. Use browser-computed evidence and the global theme control;
do not invent a separate Light palette tab. Preserve unrelated dirty hunks byte-for-byte. Do not
stage, commit, push, deploy, access hosted state, mutate Figma, or edit the generated manifest unless
the current canonical export contract independently proves that workout roles belong there.
```

### Designer completion receipt

- **Task and mode:** Workout semantic colour Light/Dark decision; Tracked discovery.
- **Stage:** Designer decision complete; no implementation performed.
- **Preflight:** Reused the canonical foundations/helper/specimen seam; proposed one later semantic
  slot only because the existing slots cannot represent both solid inverse and hue-coloured content;
  no runtime artifact was created in this task.
- **Product outcome:** One theme-resolved semantic model preserves all ten hue identities and defines
  readable solid, neutral, soft-state, boundary, and focus pairings.
- **Root cause:** `base` owns both solid identity and text accent responsibilities, while the
  Foundations renderer places it over same-hue translucent states; the one-theme fixed-alpha family
  then composites differently across themes.
- **Files inspected:** `AGENTS.md`, `agents/designer.agent.md`,
  `skills/hito-frontend-design-system/SKILL.md`, this canonical item, `foundations.css`,
  `workout-color-tokens.ts`, `training.ts`, and `reference-foundations-page.tsx`. The generated
  manifest was intentionally not used because the current export contract does not truthfully own
  these workout roles.
- **File changed:** This canonical backlog item only.
- **Preserved boundaries:** No CSS, token, helper, runtime, Product, manifest, validator, Figma,
  data, hosted state, dependency, stage, commit, push, or deployment mutation.

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Source audit | Current canonical CSS, typed helpers, domain map, DS specimen | Passed | All ten types and eight current slots traced to one shared owner family. |
| Recovery discriminator | Supplied Light inspector report plus exact source pairings | Passed for decision evidence | 1.19 base-as-content; 1.16/1.14/1.12 state labels; 1.10/1.07 border/ring on the actual Light DS parent. |
| Full contrast audit | Ten roles; four parents; Light/Dark; text/state/boundary pairings | Passed for discovery | The 10-role table records every current slot and identifies threshold failures. |
| Product impact map | Shared Product and DS consumers | Passed | Text/icon versus solid-fill responsibilities are classified above. |
| Browser implementation replay | Final proposed values | Not run by design | No values were implemented; all numeric candidates remain unapproved until DESIGN SYSTEM browser verification. |
| Global QA / release | Cross-flow or hosted acceptance | Not run | Outside discovery scope; no readiness claim. |

- **Next owner:** Product, to create and dispatch the bounded DESIGN SYSTEM implementation item if
  this decision is accepted.
- **Blockers:** None for the decision. Exact implementation values intentionally remain open to
  measured Design System work.
