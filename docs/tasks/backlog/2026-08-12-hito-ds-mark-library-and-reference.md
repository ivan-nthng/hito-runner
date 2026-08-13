# Hito DS Mark Library And Reference

## Work Item ID

2026-08-12-hito-ds-mark-library-and-reference

## Status

completed

## Type

design-system-library

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Turn the supplied Hito vector artwork into one canonical reusable Design System **Mark** library:

- eleven workout-family identity marks;
- four Hito-surface marks for Hito Running, Admin, Design System and Changelog;
- two reusable presentation shapes: a highly rounded tile and a circle;
- one set of five documented Mark sizes that serves identity/marketing, large content, medium
  decoration, compact navigation and small supporting placements; and
- a live `/hitoDS` reference that proves theme-aware foreground/background and perceived optical
  weight.

This first slice creates and documents the shared library only. It does **not** replace current
product navigation icons, `WorkoutGlyph`, Calendar glyphs, empty-state icons or hub cards. Those
are separate Product adoption decisions after the library is accepted visually.

## Archive Intent

retain_in_place

## Task

Build the smallest canonical Design System owner for these supplied artwork marks. The mark must be
usable by the product and public site later without each consumer recreating a coloured SVG plus its
own tile/circle treatment. It must preserve the supplied glyph geometry while consistently framing
it, resolving its foreground/background through existing semantic/workout tokens in Dark and Light,
and exposing exactly five named sizes.

## User Input And Visual Reference

The original SVG payload is preserved unchanged at:

`docs/tasks/backlog/assets/2026-08-12-hito-ds-mark-library/supplied-svg-source.md`

The supplied labels normalize to the following stable library identifiers. The source spellings
`Seady` and `Progressinon` are input labels only; the library must use the existing canonical names
`steady` and `progression`.

| Family  | Canonical Mark identifier | Supplied artwork label | Existing truth           |
| ------- | ------------------------- | ---------------------- | ------------------------ |
| Workout | `rest`                    | Rest                   | `CanonicalWorkoutFamily` |
| Workout | `recovery`                | Recovery               | `CanonicalWorkoutFamily` |
| Workout | `easy`                    | Easy                   | `CanonicalWorkoutFamily` |
| Workout | `steady`                  | Seady                  | `CanonicalWorkoutFamily` |
| Workout | `long`                    | Long                   | `CanonicalWorkoutFamily` |
| Workout | `tempo`                   | Tempo                  | `CanonicalWorkoutFamily` |
| Workout | `intervals`               | Intervals              | `CanonicalWorkoutFamily` |
| Workout | `progression`             | Progressinon           | `CanonicalWorkoutFamily` |
| Workout | `race`                    | Race                   | `CanonicalWorkoutFamily` |
| Workout | `hills`                   | Hills                  | `CanonicalWorkoutFamily` |
| Workout | `trail`                   | Trail                  | `CanonicalWorkoutFamily` |
| Surface | `hito-running`            | Hito Running           | `/hub` destination       |
| Surface | `admin`                   | Admin                  | `/hub` destination       |
| Surface | `design-system`           | Design System          | `/hub` destination       |
| Surface | `changelog`               | Changelog              | `/hub` destination       |

The user’s approved visual reference is the supplied Figma node:

<https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7798-648&t=MkHjjP2fXfjbmsC5-1>

It establishes the visual character only: large abstract glyphs framed in very-rounded tiles,
coloured through Hito identity tones. It is not a license to copy raw Figma URLs, to add Figma
runtime dependency, or to change Figma source.

## Observed System Facts

- `src/components/ui/icon.tsx` is the canonical compact, line-icon registry. Its existing sizes are
  `xs=14`, `sm=16`, `md=20` and `lg=24`; the supplied solid artwork is not a Tabler interface-icon
  entry and must not be forced into that registry.
- `src/components/WorkoutGlyph.tsx` is a Product-owned 12px calendar/execution glyph. It is used by
  Calendar, manual authoring and workout views. It is visually and semantically separate from this
  marketing/identity Mark task.
- Workout-family truth is `CANONICAL_WORKOUT_FAMILY_VALUES` in
  `src/lib/rich-workout-model.ts`; its existing Dark/Light semantic slots include each family’s
  `base`, `foreground`, `content`, `surface`, `hover`, `active`, `border` and `ring` in
  `src/styles/foundations.css`.
- `/hub` currently uses compact `Icon` entries (`workout`, `shield-alert`, `cog`, `file-text`) for
  the four supplied surface labels. They are a later adoption candidate, not this task’s mutation.

The root problem is absence of a canonical owner for large branded/identity marks. Consumers would
otherwise duplicate asset geometry, optical scaling, tile/circle presentation and theme rules.

## Required Contract

### 1. Canonical shared owner

- Establish one Design System Mark primitive at the canonical shared-component seam. A new component
  is explicitly authorized because neither `Icon` nor `WorkoutGlyph` can own the supplied filled,
  identity-scale vectors and two-frame treatment without corrupting their current responsibility.
- Keep raw glyph definitions data-local to that one owner. Do not distribute inline copies into
  route, product or reference files.
- Convert the supplied white glyph fills to `currentColor`; do not bake light or dark colours into
  path data.
- Preserve each supplied `viewBox` and geometry. Never stretch a glyph to fake equal visual mass.
- Expose decorative behavior by default. When a Mark carries semantic meaning without adjacent
  visible text, its accessible name must be explicit through the component’s existing React/ARIA
  convention; a visual-only Mark must not create duplicate screen-reader wording.

### 2. Shapes and optical weight

- Support exactly two frame variants: `tile` (very rounded) and `circle`.
- Centre the glyph inside the frame and normalize **perceived** visual weight across all fifteen
  supplied viewBoxes. Do this with one documented, data-owned optical-fit rule at the Mark owner;
  do not add per-consumer transform, magic margins, duplicate wrappers or CSS recipes.
- The frame and glyph must scale together. Every Mark at a given named size uses the same outer
  footprint, while preserving the native aspect ratio of the supplied glyph.
- The approximately 256px artwork/reference scale is the hero/identity end of the five-size range.
  First audit the existing DS dimensional contracts. Reuse them when they can express all five
  sizes. Do not add a raw `256px`, arbitrary Tailwind value or a parallel spacing scale. If no
  existing semantic sizing seam can represent that largest Mark honestly, stop and return the one
  minimal token decision required rather than introducing an undocumented literal.

### 3. Theme and colour ownership

- Mark colours resolve only through existing semantic tokens and canonical workout-family slots;
  never raw hex values, isolated alpha recipes or product-local CSS.
- Workout marks derive their identity frame from their existing family semantics. The designer must
  identify the correct frame and glyph slot that preserves family recognition and readable contrast
  in Dark and Light; do not assume `base` is always both.
- `race` and `trail` are canonical workout families in this library but currently lack presentation
  roles. The DESIGNER must define their distinct, recognizable theme-aware identity treatment from
  the existing Hito primitive palette and contrast requirements; DESIGN SYSTEM must then add the
  minimal canonical semantic workout slots needed to make that treatment real. They must not be
  silently aliased to `long-run` or `hills`, and this is not a further Product decision.
- The new Race and Trail semantic slots must use the existing shared workout-role grammar and
  resolve intentionally in both Dark and Light. Extend generated manifest/validator truth only if
  their existing canonical generation path requires it; do not create a parallel Mark-only map or
  raw-colour registry.
- The four surface marks must use existing semantic intent/identity roles selected from present Hito
  tokens. Do not add a new colour palette or surface-specific primitives merely for this library.
- Each frame must expose its actual foreground/background token provenance in the reference. The
  reference is not a colour editor or raw primitive palette.
- Existing `primary-foreground`, intent foreground, workout `foreground` and `content` roles remain
  authoritative. Do not alter their values as part of a Mark-library task.

### 4. Five sizes

- Define exactly five names aligned with existing Hito naming where the scale permits. They must
  cover: identity/marketing hero, large content, medium decorative, compact navigation, and small
  supporting placement.
- Document each intended placement and physical resolved size in the `/hitoDS` reference.
- Do not create sixth aliases, responsive duplicate APIs or different size sets for tile and circle.

### 5. `/hitoDS` reference

- Add the live Mark reference under the canonical Icon/Brand Foundations discovery location, not a
  second Design System route, registry, playground shell or Figma export board.
- It must show all fifteen marks, both shapes, all five sizes, light/dark resolution, and token
  provenance. It should make optical alignment and contrast directly reviewable without surrounding
  product copy.
- Keep the reference compact and visual: mark name, family, shape/size controls if needed, and
  factual token provenance. Do not add marketing prose, a colour picker, editable SVG code, runtime
  editor or another gallery framework.

## Explicit Non-Goals / What Not To Touch

- Do not replace `Icon`, Tabler mappings, `HITO_ICON_SIZES`, `WorkoutGlyph`, canonical
  workout-family identity, Calendar/manual-authoring glyphs, hub route icons, Product empty states,
  action/status icons, existing navigation or any product consumer.
- Do not edit Product routes, Backend, persistence, generated manifests, Figma, Design System
  Integration source, dependencies, build configuration, migrations or hosted state.
- Do not introduce a generic asset pipeline, sprite, network fetch, image bitmap, external URL,
  Figma URL or browser-only import mechanism.
- Do not add new primitive hues, theme-specific hard-coded fills, literal colours, arbitrary size
  values, per-page CSS, broad `any` mapping, compatibility layer or a second DS icon registry. The
  only colour-contract exception is the narrowly authorized canonical Race and Trail workout slots
  selected by the Designer under the Theme and colour ownership rule above.
- Preserve unrelated dirty work byte-for-byte.

## Reuse-First Change Budget

- Existing seams to inspect first: `src/components/ui/icon.tsx`,
  `src/components/WorkoutGlyph.tsx`, `src/lib/rich-workout-model.ts`,
  `src/styles/foundations.css`, and the current Foundations Icon/Brand reference locations.
- New runtime artifact: exactly one canonical shared Mark primitive only if the source audit
  confirms that neither existing icon owner can carry this responsibility. Its glyph data stays in
  the same owner unless an existing DS asset owner already exists.
- New CSS/class/token/size scale: none by default. Reuse existing DS composition and tokens. A
  missing size contract is a stop condition requiring Product’s explicit minimal-token decision.
- Remove no current product icon path in this first slice; no duplicate consumer path is introduced.

## Definition Of Done

1. A single canonical DS Mark primitive renders the fifteen supplied marks with `currentColor`,
   two frame shapes and exactly five documented sizes.
2. All workout marks source their identity from existing canonical family slots; all surface marks
   source their frame/glyph from existing semantic roles; Dark and Light both keep marks recognizable
   and text/adjacent labels readable.
3. Every mark uses one data-owned optical-fit strategy, maintains its native viewBox/aspect ratio,
   and reads as equal intentional weight at every shared size.
4. `/hitoDS` visibly documents every mark, both frames, five sizes and resolved provenance without
   a new gallery framework or static-theme duplicate.
5. `Icon` and `WorkoutGlyph`, their consumers and current Product UI are unchanged.
6. No literal visual values, raw Figma assets, routes, product CSS, new primitive palette,
   dependencies or parallel registry were added. Only the Designer-approved canonical Race and
   Trail semantic workout slots, and required existing generator/validator parity changes, may
   extend the colour contract.

## Validation Expectations

| Check              | Scenario / environment                            | Required evidence                                                                                              |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Source ownership   | Shared checkout                                   | One Mark owner; no source duplication; `Icon` and `WorkoutGlyph` consumers are unchanged.                      |
| Asset integrity    | All 15 supplied SVGs                              | Paths preserve supplied geometry; only fill conversion / accessibility-safe wrapper changes are made.          |
| Optical sizing     | Each mark × both shapes × five sizes              | Common outer footprint, no stretch/crop, no per-consumer recipe, visually comparable weight.                   |
| Theme/contrast     | `/hitoDS`, Dark/Light, 1470×801 and exact 375×812 | Frame/glyph tokens resolve through canonical roles; labels/provenance remain legible; no overflow.             |
| Interaction/a11y   | Reference controls and semantics                  | Keyboard focus/order works; decorative and labelled use are truthful; no duplicate accessible labels.          |
| Regression         | Existing Icon/WorkoutGlyph and `/hub` source      | No source or behavior change in excluded owners.                                                               |
| Existing DS checks | Current checkout                                  | Existing DS validator, focused format/lint, `git diff --check`, production build or exact contention boundary. |

Global QA, Product adoption, Figma update, release readiness and hosted verification are out of scope.

## Stage

Design System implementation completed with focused local and independent QA verification. Product
adoption remains a separate decision.

## Next Recommended Role

product

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Implement the canonical Mark library and live reference exactly within:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-mark-library-and-reference.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item and its `assets/2026-08-12-hito-ds-mark-library/supplied-svg-source.md`
- `src/components/ui/icon.tsx`
- `src/components/WorkoutGlyph.tsx`
- `src/lib/rich-workout-model.ts`
- `src/styles/foundations.css`
- the existing Foundations Icon/Brand reference owners.

Outcome:
Create the smallest canonical Design System Mark primitive for the 11 canonical workout-family
marks and four Hito-surface marks supplied by Product. It must own their raw glyph data once,
render through `currentColor`, offer only `tile` and `circle`, use exactly five documented sizes,
normalize optical weight without stretching viewBoxes, resolve Dark/Light colours through existing
semantic/workout slots, and document all marks/shapes/sizes/provenance in the canonical `/hitoDS`
Foundations location.

Root cause:
There is no shared owner for large branded identity marks. `Icon` is the compact Tabler registry and
`WorkoutGlyph` is a Product 12px execution glyph; neither can safely own the supplied filled artwork
or its theme-aware presentation.

Hard boundaries:
Do not modify `Icon`, `WorkoutGlyph`, their consumers, Product routes, Calendar/manual authoring,
hub cards, empty states, canonical workout-family values, Figma, Backend, persistence,
dependencies, hosted state or unrelated dirty work. The only colour-contract exception is the
Designer-approved minimal canonical Race and Trail semantic workout slots and their required
existing manifest/validator parity; do not widen the primitive palette or create a Mark-only
colour map.
Do not use raw hex, raw Figma URLs, arbitrary/literal visual values, per-page CSS, new palettes,
generic asset pipelines, sprite/network imports, duplicate registries or product-specific wrappers.
The first task creates/document the shared library only; adoption is a separate Product decision.

Race and Trail colour decision:
Do not stop or return this decision to Product. Use the existing DESIGNER role for a bounded
read-only review before implementation. The Designer must select distinct recognizable Race and
Trail identity treatments from the existing primitive palette, prove Dark/Light label and
frame/glyph contrast, and document the canonical slot pairing. DESIGN SYSTEM then implements the
minimal shared workout semantic resolution through the existing Foundations grammar and generation
path. Do not silently alias Race to Long run or Trail to Hills; do not add a primitive hue, raw
hex, duplicate registry, or product-local fallback.

Reuse-first:
Audit current DS icon/reference/dimensional seams before introducing any size mapping. One new
canonical shared Mark primitive is authorized only because the current icon/glyph owners cannot
carry its responsibility. No new token/CSS/class is authorized by default except the Race and Trail
semantic extension above. If existing dimensional contracts cannot honestly express the roughly
256px hero end and all five sizes, stop before adding a literal and return the one minimal
semantic-token decision required.

Use the existing DESIGNER role for one bounded read-only review before the implementation decision:
it must approve theme pairing, the two shapes, five-size nomenclature, optical-weight strategy and
the first reference composition. Use the existing QA role for a bounded read-only independent
review after focused implementation proof. Do not create custom roles or delegate runtime edits.

Validate all fifteen supplied paths × both shapes × five sizes in `/hitoDS`, at 1470×801 and exact
375×812 in Dark/Light. Prove native aspect-ratio preservation, token provenance, contrast/readable
labels, keyboard/focus, no overflow/no console errors, excluded owner byte stability, existing DS
validator, focused formatting/lint/diff, and a production build or an exact contention boundary.
If you stop the fixture QA server, restart it before the English final receipt. Do not stage,
commit, push, deploy, mutate hosted state, delete material data or call providers.

Use Russian for in-progress commentary. Return only with the completed Definition of Done or an
evidence-backed stop condition, and update this canonical item in English.
```

## Blockers

None for the focused Design System implementation slice. The fresh production build completed its
client, SSR and Nitro compilation, then failed only at the unrelated private Admin repository
snapshot marker/digest postbuild gate. This is recorded as a build-integrity coverage boundary, not
as a Mark-library failure.

## Implementation Receipt — 2026-08-12

### Preflight and product outcome

- Demonstrated cause: the supplied filled identity artwork had no shared owner. `Icon` remains the
  compact Tabler interface-icon registry and `WorkoutGlyph` remains the Product-owned 12px execution
  glyph, so neither could truthfully own identity-scale filled vectors, optical fitting and the
  shared tile/circle frame.
- Reused the existing Foundations Icon/Brand discovery location, canonical workout-family truth,
  shared workout colour grammar, semantic surface roles, Hito composition utilities, choice-toggle
  radio mechanics and DS validator.
- Added exactly one new runtime artifact: `src/components/ui/hito-mark.tsx`. No CSS class, global
  size token, primitive hue, route, wrapper, registry framework, dependency, compatibility path,
  asset pipeline or Product adoption was added.
- The primitive owns all 15 definitions and 23 supplied paths once, converts glyph fill to
  `currentColor`, preserves each native viewBox with `xMidYMid meet`, and applies one data-owned
  unitless optical-fit value per mark. A redundant secondary workout-name set was removed before
  closure, leaving the definition table as the single classification owner.
- Exactly two shapes are exposed: `tile` (`rounded-2xl`) and `circle` (`rounded-full`). Exactly five
  sizes reuse existing utilities: `xs/sm/md/lg/hero` = `size-8/10/16/32/64` =
  `32/40/64/128/256px`. The numeric values are documentation metadata for resolved existing
  utilities, not a second dimensional scale.
- Decorative marks are silent by default. Non-decorative use requires an explicit label and the
  primitive owns `role`/`aria-hidden`, preventing passthrough overrides of that contract.

### Theme and colour decision

- DESIGNER selected distinct existing-palette identities rather than aliases: Race uses the
  lavender base with stone-950 glyph; Trail uses the mint base with stone-950 glyph.
- Race content resolves to `80% base / 20% sand-50` in Dark and
  `60% base / 40% stone-950` in Light. Trail resolves to `82% base / 18% sand-50` in Dark and
  `55% base / 45% stone-950` in Light. Both reuse the existing 8/16/24/32 state grammar, 78%
  content-derived border and content ring.
- Measured frame/glyph contrast is 8.71:1 for Race and 10.73:1 for Trail. The minimum adjacent
  content contrast is 4.97:1 Race and 4.82:1 Trail in Light; Dark results are 10.02:1 and 11.54:1.
- Surface marks reuse existing semantic pairings: Hito Running = Signal, Admin = Primary, Design
  System = Accent and Changelog = Info. No Mark-only colour map was created.

### Source hierarchy

Task-owned source changes:

- `src/components/ui/hito-mark.tsx` — one canonical Mark primitive and data owner.
- `src/lib/workout-color-tokens.ts` — canonical-family-to-existing-workout-token resolver.
- `src/styles/foundations.css` — narrowly added Race and Trail roles through the existing workout
  grammar and theme resolution.
- `src/components/hito-ds/reference-foundations-page.tsx` — one compact fixed size/shape overview
  and one controlled 15-mark gallery with factual token provenance.
- `scripts/validate-hito-ds-component-contracts.ts` — focused inventory, geometry, ownership,
  accessibility and reference assertions.
- This canonical item — lifecycle and receipt.

The shared CSS, Foundations page and validator already contained unrelated dirty work; this receipt
claims only the Mark and Race/Trail hunks above. `Icon`, `WorkoutGlyph`, canonical workout-family
values, generated manifests, `/hub`, Calendar/manual authoring and Product consumers retained their
preflight hashes and gained no Mark dependency.

### Validation inventory

| Check               | Scenario / environment                         | Result                                             | Evidence                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership    | Current shared checkout                        | Passed                                             | One exported `HitoMark` owner and one `HITO_MARK_DEFINITIONS` table; Foundations is its only current consumer. No parallel registry or per-consumer recipe.                                     |
| Asset integrity     | Supplied record vs primitive                   | Passed                                             | Exactly 15 viewBoxes and all 23 supplied paths match; runtime paths use `currentColor`; no raw hex appears in the Mark owner.                                                                   |
| Shape/size matrix   | `/hitoDS/foundations`, interactive controls    | Passed                                             | All 150 controlled combinations (15 marks × 2 shapes × 5 sizes) were selected; each had the expected common footprint, shape and size data, with zero aspect or geometry mismatch.              |
| Optical geometry    | All marks                                      | Passed                                             | Every SVG retained its native viewBox and `preserveAspectRatio="xMidYMid meet"`; one canonical unitless optical fit is applied per definition without per-consumer transforms.                  |
| Keyboard/a11y       | Shape and size radio groups                    | Passed                                             | Arrow/Home navigation updated real focus, roving `tabIndex`, `aria-checked` and gallery state. Decorative gallery marks are silent; labelled overview specimens expose one explicit image name. |
| Responsive/themes   | `1470×801` and exact `375×812`, Dark/Light     | Passed                                             | Independent QA verified all four modes. At 375px, 15 hero/circle marks retained 256×256 footprints with document/body width 375px, no horizontal overflow and no console warning/error.         |
| Theme contrast      | Race, Trail and four surface marks             | Passed                                             | Race/Trail ratios met the documented normal-text and frame/glyph requirements. Surface pair frame/glyph contrast ranged from 6.15:1 to 18.19:1 across themes.                                   |
| DS validator        | `npm run validate-hito-ds-components`          | Passed                                             | `contract ok`; 324 files scanned, 12 workout domain bases, 41 semantic colours.                                                                                                                 |
| Focused format/lint | Task-owned TS/TSX/validator/task files         | Passed                                             | Prettier check and focused ESLint exited 0.                                                                                                                                                     |
| Diff hygiene        | Task-owned paths                               | Passed                                             | `git diff --check` exited 0.                                                                                                                                                                    |
| Excluded owners     | Preflight/final SHA-256 and reachability       | Passed                                             | `Icon`, `WorkoutGlyph`, rich-workout truth, generated TS/JSON manifest and `/hub` retained their recorded hashes; no Product Mark adoption was introduced.                                      |
| Production build    | Fresh uncontended `npm run build`              | Passed through compilation; postbuild external gap | Client (7.53s), SSR (3.70s) and Nitro (2m41s) compiled. The final command failed only because the unrelated private Admin snapshot marker/generation/digest was absent.                         |
| Independent reviews | DESIGNER before implementation; QA after proof | Passed                                             | DESIGNER approved pairing, contrast, shape/size, optical strategy and reference hierarchy. QA found no task-owned issue and returned `Passed` for focused Implementation DoD.                   |

### Closure

The task-owned compiled loopback runtime was stopped after QA. No fixture QA server, hosted system,
provider, Figma source, Product data or repository publication state was changed. This receipt proves
the focused Design System implementation only; it does not claim Product adoption, Global QA
Acceptance, release readiness, hosted verification or deployment readiness.

## Blockers

None. On 2026-08-12, Product superseded the prior stop condition: the existing DESIGNER role now
owns the Race/Trail colour decision within this task, and DESIGN SYSTEM is authorized to implement
the resulting minimal canonical semantic slots without a new Product approval.

## Tracked Preflight Stop Receipt

### Source Hierarchy And Reuse Decision

- `src/components/ui/icon.tsx` remains the compact Tabler interface-icon registry at 14/16/20/24px.
- `src/components/WorkoutGlyph.tsx` remains the Product-owned 12px execution glyph.
- `src/lib/rich-workout-model.ts` owns the eleven canonical family identifiers.
- `src/styles/foundations.css` and `src/lib/workout-color-tokens.ts` own the current ten
  runner-facing workout presentation roles.
- One future `Mark` primitive remains the correct new shared owner for the supplied filled paths,
  optical-fit metadata, shapes and accessibility contract. No runtime artifact was created during
  this blocked preflight.

### Demonstrated Discriminator

| Check                         | Scenario / environment                         | Result                         | Evidence                                                                                                                                                                                                                                           |
| ----------------------------- | ---------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical family inventory    | `CANONICAL_WORKOUT_FAMILY_VALUES`              | 11 required                    | Includes `race` and `trail`; does not include `run-walk`.                                                                                                                                                                                          |
| Presentation-colour inventory | `WORKOUT_TYPE_TOKEN_NAMES` and Foundations CSS | 10 available                   | Includes `run-walk`; has no `race` or `trail` token family. Repository search returned no `--hito-workout-type-race-*` or `--hito-workout-type-trail-*` declaration.                                                                               |
| Existing product fallback     | Planned-workout language                       | Contextual, not Mark authority | Family fallback maps `race` to `long_run` and `trail` to `hills`, while race identities may resolve to `tempo` or `intervals` when workout structure is available. A context-free family Mark cannot select among these without Product authority. |
| Dimensional contract          | Existing Tailwind utilities and Hito scales    | Not blocked                    | DESIGNER approved exactly `xs/sm/md/lg/hero` at 32/40/64/128/256 using existing `size-8/10/16/32/64`; no new token, raw pixel value or arbitrary utility is required.                                                                              |
| Surface-mark pairing          | Existing semantic roles                        | Approved                       | Hito Running `signal/signal-foreground`; Admin `primary/primary-foreground`; Design System `accent/accent-foreground`; Changelog `info/info-foreground`.                                                                                           |
| Shape and optical strategy    | Read-only DESIGNER review                      | Approved                       | Exactly `tile` and `circle`; preserve every supplied viewBox with `xMidYMid meet` and one unitless, data-owned uniform optical-fit value per glyph.                                                                                                |
| Runtime/static/browser/QA     | Implementation validation                      | Not run                        | No implementation exists to validate. Browser and independent QA would not prove the missing identity decision and therefore were intentionally not performed.                                                                                     |

### Preserved Boundaries

No runtime source, CSS, tokens, manifests, Product consumers, Figma, dependencies, Backend,
persistence or hosted state were changed. Preflight hashes were recorded for `Icon`, `WorkoutGlyph`,
canonical workout-family truth, Foundations tokens and generated manifests. The required DESIGNER
review was read-only. The QA review remains correctly deferred until a complete implementation can
exist.

### Superseded Stop Condition

The original preflight correctly identified that Race and Trail had no presentation roles. Its
requirement for a separate Product choice is superseded by the Product decision above: Designer
research and a minimal Design System semantic extension are part of this same Mark-library task.
