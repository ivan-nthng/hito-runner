# Hito DS Typography Scale Consolidation And Adoption

## Work Item ID

2026-08-11-hito-ds-typography-scale-consolidation-and-adoption

## Status

completed

## Type

design-system-consolidation

## Priority

high

## Owner

product

## Mode

Tracked

## Scope

Audit and specify the smallest reusable Hito typography scale, then define a safe staged migration
for the canonical Design System, `/hitoDS`, generated Text Styles, Local Inspector typography
provenance and selection, component-bound typography, authenticated Product, Admin, DevTools,
public/editorial surfaces, and remaining legacy font-family consumers.

This is a Product-owned, cross-owner implementation programme. Product owns lifecycle truth,
slice ordering, receiving-role selection, and final acceptance routing; each named execution role
owns only its assigned source slice. Product does not implement runtime source, CSS, DevTools,
manifests, validators, Figma, Product behavior, dependencies, data, or hosted state.

## Archive Intent

retain_in_place

## Task

Replace the current use-case-shaped typography inventory with a compact, source-backed semantic
scale. Context names such as page, modal, panel, helper, error, and success must not remain separate
reusable Text Styles when an existing size/family role plus a component or semantic colour owner can
express the same contract.

The final implementation must:

- retain truthful Poppins UI, Fraunces editorial/display, and JetBrains Mono technical ownership;
- reduce duplicate or contextual reusable roles without inventing a complete Cartesian size matrix;
- remove the global `micro-label` role after classifying every consumer to a real shared or
  component-owned replacement;
- preserve one explicit Metric role;
- treat positive, negative, accent, warning, and disabled as semantic text tones rather than new
  typography roles;
- migrate legacy font-family consumers through canonical roles or deliberate component ownership;
- keep Local Inspector provenance, Current/Custom recognition, replacement choices, prompt output,
  keyboard behavior, and responsive anatomy correct throughout the migration; and
- delete superseded role definitions, aliases, manifest entries, validator expectations, and
  consumer classes only after zero-reachability proof.

## Execution Preflight

- **Outcome:** one high-priority, implementation-ready typography consolidation audit with bounded
  owner slices and no runtime change in the Designer stage.
- **Evidence:** the current central registry exposes 23 roles, including 18 Inspector-selectable
  reusable roles and five component-bound recognition-only roles. Completed predecessor work already
  established shared provenance, four Poppins UI title counterparts, generated-manifest ownership,
  and a compact Inspector picker.
- **Canonical seam:** `src/lib/hito-typography-roles.ts`, canonical typography CSS,
  `src/components/devtools/local-ui-inspector-targets.ts`, the existing generated manifest and
  validator, and the canonical `/hitoDS/foundations` typography specimen.
- **New runtime artifacts:** none proposed. This stage creates only this canonical task artifact.
- **Removal target:** contextual and duplicate typography roles are replaced through the existing
  registry and component owners; compatibility aliases must have a measured removal condition and
  must not become permanent parallel truth.
- **Focused proof:** current role/spec census, consumer and font-family reachability, DevTools
  provenance/replacement impact, manifest/validator impact, implementation sequencing, and a
  two-theme responsive validation matrix.
- **Stop condition:** do not implement, dispatch, mutate Figma, or edit any current dirty runtime,
  manifest, validator, Product, DevTools, or Design System hunk during this Designer audit.

## Stage

Typography Slices 1–7 are complete. Independent Slice 7 cross-surface acceptance passed on
2026-08-12.

### Product Coordination Record — 2026-08-12

This work item is the parent programme, not an implementation task for one engineer. Its current
state is intentionally explicit:

| Slice                                      | Canonical owner                    | Status    | Product coordination result                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — target registry and bounded bridge     | DESIGN SYSTEM                      | completed | Established 14 reusable roles, four component-bound roles, and temporary bridges.                                                                                                                        |
| 2 — DevTools adoption                      | FRONTEND / DevTools                | completed | Inspector presentation migrated without changing the shared role contract.                                                                                                                               |
| 3 — authenticated runner adoption          | FRONTEND / Product                 | completed | Product inventory migrated and browser-proven.                                                                                                                                                           |
| 4 — public/auth/editorial adoption         | FRONTEND / Marketing               | completed | Public and auth inventory migrated; intentional Display and timeline exceptions retained.                                                                                                                |
| 5 — Admin/internal adoption                | LAYOUT, presentation-only boundary | completed | The clean six-file Admin inventory now uses accepted UI, Body, Label, and Technical roles. Focused source/build proof and independent desktop/mobile Light/Dark QA passed without a shared-owner change. |
| 6 — retired-role deletion and font cleanup | DESIGN SYSTEM                      | completed | Fresh census proved zero generic runtime and provenance reachability; all 19 temporary bridges and unused font weights are deleted while live component anatomy emits target provenance.                 |
| 7 — independent cross-surface acceptance   | QA                                 | completed | Independent static, build, managed-runtime, desktop/mobile, Light/Dark, interaction, containment, and console acceptance passed.                                                                         |

The active `DESIGN SYSTEM` CSS-ownership task is a separate backlog item. It may improve CSS
authority but does not execute or close any typography slice.

## Next Recommended Role

PRODUCT — review the completed programme receipt. Any later Figma alignment remains a separately
approved and dispatched downstream task; it is not implied by this code-side acceptance.

## Blockers

None. This bounded typography programme is complete. Hosted parity, deployment, release readiness,
production readiness, and Figma parity remain outside this item.

## User Direction

Ivan accepted a compact tiered typography model and asked for a high-priority task plus a complete
audit. The requested outcome is implementation across the codebase, including legacy font
consumers, without breaking Local Inspector or the wider DevTools typography workflow.

The accepted direction is:

- use tier names such as XL, LG, MD, SM, and XS instead of naming reusable text styles after pages,
  dialogs, panels, or status outcomes;
- preserve a deliberate distinction between Poppins UI titles and Fraunces Display titles;
- keep Metric as a meaningful measured-truth role;
- remove `micro-label` as a global reusable role;
- express error, success, accent, warning, and disabled through existing semantic text tones, not
  separate typography roles; and
- avoid filling every family with every size when current consumers do not prove the need.

## Designer Audit — 2026-08-11

### Verified current contract

The current working-tree source resolves to:

| Contract                               |                                    Current verified value | Owner/evidence                                    |
| -------------------------------------- | --------------------------------------------------------: | ------------------------------------------------- |
| Central role inventory                 |                                                  23 roles | `src/lib/hito-typography-roles.ts`                |
| Reusable/Figma Text Styles             |                                                        18 | `figmaTextStyle: true`; generated manifest parity |
| Local Inspector selectable roles       |                                                        18 | `HITO_INSPECTOR_TYPOGRAPHY_ROLES`                 |
| Component-bound recognition-only roles |                                                         5 | Button, Nav/Menu, Metric, Status, Error/Success   |
| UI title roles                         |                                                         4 | Page, modal, section, panel                       |
| Editorial/display roles                |                                                         5 | Display, page, modal, section, panel              |
| Current generated parity               | 43 primitive colours, 41 semantic colours, 18 Text Styles | `generate-hito-ds-manifest.mjs --check` passed    |
| Current DS package validation          |                           Passed across 321 scanned files | `validate-hito-ds-components` passed              |

The 18 reusable roles are grouped as 4 UI titles, 5 mirrored editorial titles, 3 reading roles,
3 control-label roles, 2 metadata roles, and 1 technical role. The five component-bound roles sit
beside them in the same registry but are excluded from Figma export and Inspector replacement.

The current source census also found:

- 28 unique source files using `hito-micro-label` or its same-role alias
  `hito-section-subtitle`;
- 13 unique source files containing a serif title/direct display-family owner, including CSS;
- 24 `font-mono-num` occurrences across 13 files, frequently composed with another reusable role;
- 56 files in the current contextual-title family and 76 files in the body/helper/caption family;
- 14 typography role classes with direct local geometry overrides such as `text-base`, `text-xs`,
  `text-xl`, `text-2xl`, or `text-4xl/lg:text-5xl`; and
- explicit validator assertions that preserve exactly four UI title roles, five editorial roles,
  18 Inspector choices, and 18 generated Text Styles.

These are current source facts, not estimates from the screenshot.

### Demonstrated cause

The first incorrect owner is the central typography taxonomy, not an individual page. It combines
three different dimensions as peer reusable roles:

1. **visual voice and geometry** — Poppins, Fraunces, JetBrains Mono, size, weight, leading;
2. **component context** — page, modal, section, panel, list row, field helper; and
3. **semantic state/tone** — error and success.

That produces mirrored UI/editorial role sets, identical `label` and `form-label` Text Styles,
context-only `helper` and `list-row-title` styles, and a `micro-label` role shared by unrelated menu,
calendar, form, eyebrow, shell, Admin, Product, and reference anatomy.

It also makes provenance misleading when a canonical class is combined with a geometry/family
override. Verified examples include:

- `Calendar` uses `hito-ui-section-title text-4xl lg:text-5xl`, so the declared section role does
  not describe the rendered size;
- Today and Workout hero headings repeat a Poppins 36–48 px recipe without a shared role;
- two list-row-title consumers override the role to `text-base`;
- Metric consumers override the component-bound value to `text-2xl`;
- DS specimens use `hito-ui-modal-title text-xl` and `hito-display-title font-sans`;
- technical readbacks combine `hito-technical-mono` with `text-xs`/`text-sm`; and
- many captions/body roles add `font-mono-num`, changing family while retaining non-mono role
  provenance.

The screenshot symptom — a long list of page/modal/section/panel/list/helper/caption/micro and state
roles — is therefore a truthful rendering of a taxonomy problem, not merely poor reference layout.

### Existing seams to reuse

- `src/lib/hito-typography-roles.ts` remains the single registry and role-id owner.
- Canonical CSS remains in the existing typography/component stylesheets already parsed by
  `scripts/generate-hito-ds-manifest.mjs`.
- The manifest generator continues to derive Text Styles from registry roles and their existing CSS
  owner; no second token file or Figma-only typography model is introduced.
- `--hito-typography-role` remains the only provenance property.
- Local Inspector continues to derive selectable options, current-role recognition, preview class,
  label, descriptor, and batch prompt output from the central registry.
- Existing semantic text tokens (`text-secondary`, `text-tertiary`, `text-disabled`,
  `text-accent`, `text-positive`, `text-negative`, `text-informative`, `text-warning`) own tone.
- Button, Nav/Menu, Metric, and Status remain component anatomy, not generic Text Styles.

### Target semantic scale

The target is **14 reusable Text Styles plus 4 component-bound recognition roles**. This reduces
the registry from 23 to 18 final roles and the generated/Inspector-replacement set from 18 to 14.

Tier names are local to typography. `MD` does not imply the same numeric value as an MD control or
spacing token. The existing central registry plus canonical CSS remains the token owner; do not add
a parallel primitive typography framework merely to store the same values twice.

| Target role id     | Figma/display label  | Family and source-backed geometry                                           | Primary use                                                             |
| ------------------ | -------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ui-title-xl`      | UI / Title / XL      | Poppins; current UI page 48–72 px; 400; lh 1                                | Top-level authenticated route identity                                  |
| `ui-title-lg`      | UI / Title / LG      | Poppins; repeated Product hero 36–48 px; 400; lh 1.05                       | Today/workout/month hero headings                                       |
| `ui-title-md`      | UI / Title / MD      | Poppins; current UI modal 28–32 px; 400; lh 1.1                             | Dialog/sheet and bounded major headings                                 |
| `ui-title-sm`      | UI / Title / SM      | Poppins; current UI section 24 px; 400; lh 1.15                             | Section orientation                                                     |
| `ui-title-xs`      | UI / Title / XS      | Poppins; current UI panel 20–22 px; 400; lh 1.18                            | Panel/card/review headings                                              |
| `display-title-xl` | Display / Title / XL | Fraunces; current display 56–80 px; 400; lh 1                               | Editorial/marketing hero only                                           |
| `display-title-lg` | Display / Title / LG | Fraunces; current editorial page 48–72 px; 400; lh 1                        | Editorial page identity only                                            |
| `body-lg`          | Body / LG            | Poppins; current repeated lead copy 18 px; 400; target lh 1.55              | Short lead/support copy, not headings                                   |
| `body-md`          | Body / MD            | Poppins; current body 14 px; 400; lh 1.58                                   | Default readable copy and row titles with component emphasis            |
| `body-sm`          | Body / SM            | Poppins; current body-small 13 px; 400; lh 1.5                              | Dense supporting copy and metadata                                      |
| `body-xs`          | Body / XS            | Poppins; current helper 12 px; 400; lh 1.45                                 | Helper, caption, timestamp, compact support; minimum reusable body size |
| `label-md`         | Label / MD           | Poppins; current label/form-label 12 px; 600; normal case; lh 1.25          | Field ownership and compact orientation                                 |
| `label-sm`         | Label / SM           | Poppins; current compact label 11 px; 500; normal case; restrained tracking | Short non-body orientation only                                         |
| `technical-sm`     | Technical / SM       | JetBrains Mono; current technical 12 px; tabular; lh 1.45                   | Identifiers, fixed-format readback, JSON/code metadata                  |

`label-sm` does not globally enforce uppercase or the current `0.18em` tracking. Calendar weekday,
menu-group, status, or deliberate editorial eyebrow anatomy may own uppercase locally when the
component requires it. The reusable role itself remains readable and neutral.

No `Body / XL` is approved. Current source does not prove a repeated body-copy need above 18 px; a
future addition requires real consumers and a replacement path. No Display MD/SM/XS mirror is
approved: small headings use the UI hierarchy even inside editorial surfaces so Fraunces remains a
deliberate large-scale voice.

### Current-to-target migration decision

| Current role                                  | Target                                         | Treatment                                                                                                                              |
| --------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-page-title`                               | `ui-title-xl`                                  | Geometry-preserving rename. Page remains component context, not Text Style name.                                                       |
| repeated raw 36–48 px Product hero recipes    | `ui-title-lg`                                  | Consolidate the proven repeated gap and delete local `font-sans text-4xl lg:text-5xl` recipes.                                         |
| `ui-modal-title`                              | `ui-title-md`                                  | Geometry-preserving rename; Dialog/Sheet anatomy aliases it.                                                                           |
| `ui-section-title`                            | `ui-title-sm`                                  | Geometry-preserving rename; remove contradictory local size overrides.                                                                 |
| `ui-panel-title`                              | `ui-title-xs`                                  | Geometry-preserving rename.                                                                                                            |
| `display-title`                               | `display-title-xl`                             | Geometry-preserving rename.                                                                                                            |
| `page-title`                                  | `display-title-lg`                             | Retain only intentional editorial page/hero consumers.                                                                                 |
| `modal-title`, `section-title`, `panel-title` | matching UI title tier                         | Remove the small serif mirror; migrate Product/Admin/DevTools/DS/auth consumers.                                                       |
| `list-row-title`                              | `body-md` + component foreground/emphasis      | List row is anatomy, not a reusable title size. Delete local `text-base` overrides or route the exceptional heading to a real UI tier. |
| `body`                                        | `body-md`                                      | Rename, preserving geometry.                                                                                                           |
| `body-small`                                  | `body-sm`                                      | Rename, preserving geometry.                                                                                                           |
| `helper`                                      | `body-xs` + secondary/negative/positive tone   | Helper is placement plus tone, not unique geometry.                                                                                    |
| `caption`                                     | `body-xs` + tertiary/secondary tone            | Consolidate 11 px captions upward to the 12 px reusable body floor; component-only 11 px labels use `label-sm`.                        |
| `label`, `form-label`                         | `label-md`                                     | Merge identical geometry; field association stays with the Field component/markup.                                                     |
| `micro-label`, `section-subtitle`             | `label-sm`, `label-md`, or component anatomy   | Classify all 28 files; no global blind replacement and no retained micro alias at completion.                                          |
| `technical-mono`                              | `technical-sm`                                 | Rename, preserving geometry; remove local size overrides or classify the consumer as component-bound Metric.                           |
| `error-success`                               | `body-md` plus `text-positive`/`text-negative` | Delete the state-named typography role and keep state in semantic tone.                                                                |
| `metric`                                      | Metric component-bound role                    | Retain; document default/prominent size anatomy through the existing component seam and delete raw `text-2xl` overrides.               |
| `button`, `nav-menu`, `status`                | unchanged component-bound roles                | Keep recognition-only; do not export or expose as generic Inspector replacement choices.                                               |

### Text tone contract

Reusable typography defines family, size, weight, leading, tracking, and case. Semantic tone remains
an independent axis. A consumer may pair any appropriate reusable role with:

| Tone purpose      | Existing Hito owner |
| ----------------- | ------------------- |
| Primary/default   | `foreground`        |
| Secondary support | `text-secondary`    |
| Tertiary/caption  | `text-tertiary`     |
| Disabled          | `text-disabled`     |
| Accent            | `text-accent`       |
| Positive/success  | `text-positive`     |
| Negative/error    | `text-negative`     |
| Informative       | `text-informative`  |
| Warning           | `text-warning`      |

Do not create `Body success`, `Label error`, `Disabled caption`, or equivalent Text Styles. Field
feedback becomes Body MD (or Body XS for compact helper anatomy) plus the semantic tone. Status
pills keep their own component-bound typography and tone contract.

### `micro-label` consumer classification

The current 28-file reachability divides into distinct owners:

| Consumer family                       | Current examples                                                                   | Required target                                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field/edit labels                     | `editable-value-field.tsx`, `hito-date-time-input.tsx`, `inline-editable-text.tsx` | Field/component label anatomy using `label-md`; preserve accessible labels and edit focus.                                                                       |
| Calendar weekday/compact day metadata | `Calendar.tsx`, `hito-calendar-day.tsx`, workout-library playground                | Calendar-owned compact label; use `label-sm` only where its geometry is exact. Dense 10 px exceptions stay component-bound and must not claim shared provenance. |
| Menu group labels                     | theme preference controls and Admin operational menus                              | Dropdown/Menu component anatomy, not global micro typography.                                                                                                    |
| Section orientation/eyebrow           | Workout, Today, Progress, Integrations, Quick Setup, Auth                          | `label-sm` or `label-md` based on actual hierarchy; uppercase remains local only where intentional.                                                              |
| Shell/chrome labels                   | AppShell, Admin workspace                                                          | Nav/Menu or Label role according to component anatomy.                                                                                                           |
| DS specimen metadata                  | playground, overview, component references, editable sandbox                       | `label-sm`/`body-xs`; specimens must demonstrate target roles rather than preserve legacy naming.                                                                |
| Editorial metadata                    | Changelog and login                                                                | `label-sm` or `body-xs`; no generic micro role.                                                                                                                  |

The implementation owner must refresh the exact 28-file map because several listed files currently
carry concurrent dirty work. Completion requires zero `hito-micro-label`, `hito-section-subtitle`,
and `micro-label` provenance reachability.

### Legacy font and local-override policy

`--font-sans`, `--font-display`, and `--font-mono` remain the three canonical families. Fraunces is
not removed; it is narrowed to the two Display roles plus an explicitly documented editorial
component exception if current Changelog timeline evidence still requires it.

| Current family drift                                                                                                    | Decision                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin `hito-page-title`, `hito-modal-title`, `.hito-admin-brand`, workbench location, and direct `font-display` heading | Migrate to matching UI title/label roles. Admin is functional UI, not editorial display.                                                             |
| Local Inspector batch-review `hito-panel-title`                                                                         | Migrate to `ui-title-xs`; preserve focusable heading semantics.                                                                                      |
| Login/auth small serif modal title                                                                                      | Migrate to `ui-title-md`; reserve Fraunces for large display moments.                                                                                |
| Hub/Changelog page titles                                                                                               | Retain as `display-title-lg`; they are explicit public/editorial identity.                                                                           |
| Hub/Changelog small serif panel titles                                                                                  | Migrate to `ui-title-xs`; do not keep a full small Display mirror.                                                                                   |
| Changelog timeline year/month/day                                                                                       | Retain only as a component-bound editorial exception if refreshed browser evidence supports the voice; it is not a reusable Text Style.              |
| DS `hito-display-title font-sans`                                                                                       | Replace with a truthful UI tier; never override a Display role's family while keeping Display provenance.                                            |
| Product direct Poppins title recipes                                                                                    | Adopt the exact target UI tier where current geometry matches; otherwise remain truthful component-bound Custom until Product accepts a size change. |
| `font-mono-num` combined with Body/Caption/UI title roles                                                               | Replace with `technical-sm`, Metric anatomy, or a truthful component-bound numeric label. Do not keep mismatched non-mono provenance.                |

The Google Fonts import currently requests Fraunces 300/400/500, JetBrains Mono 400/500, and Poppins
300/400/500/600. Current source contains no `font-weight: 300` or `font-light` consumer. After final
zero-reachability, remove unused weight 300 from Poppins and unused Fraunces 300/500 if refreshed
Marketing/editorial evidence still proves only Fraunces 400. Keep the font asset/family itself.

### Local Inspector and DevTools preservation contract

Local Inspector is downstream of the registry but is a critical migration consumer:

- current role recognition reads the computed `--hito-typography-role` id through a map of all
  central roles;
- replacement choices come from `HITO_INSPECTOR_TYPOGRAPHY_ROLES`;
- the picker renders each role's real class, label, and descriptor;
- pending selection stores the role id and resolves it against the current options;
- normalized batch payloads freeze id/class/label/spec evidence; and
- generated prompts name the current and desired role and desired CSS class.

The migration must therefore preserve all of the following:

1. Current confirmed, component-bound, and Custom detection remains truthful.
2. The replacement list contains exactly the 14 target reusable roles, in family then descending
   size order; the four component roles remain recognition-only.
3. Every option still renders literal `Ab`, keeps case independent from role transform, and shows
   the target label and technical descriptor.
4. Select, clear, Escape, scroll containment, focus return, pending draft, batch review, item
   summary, and generated prompt continue to work at desktop and exact 375 px in both themes.
5. No removed role id can remain selectable or be serialized by a newly captured item.
6. During the cross-owner bridge, retired roles may remain recognition-only only when an existing
   consumer still emits that exact provenance. They must be `figmaTextStyle: false` and
   `inspectorSelectable: false`, and the final cleanup must remove them after zero reachability.
7. Do not add a second registry, id translation table, persisted migration layer, or Inspector-only
   typography truth. In-memory drafts are ephemeral; a fresh session after a deployed registry
   change is sufficient.

DevTools also renders many legacy `hito-caption`, `hito-label`, `hito-technical-mono`,
`hito-list-row-title`, and one serif panel-title consumer. The Frontend DevTools slice must migrate
those consumers to the target classes while preserving the active Inspector's anatomy and behavior.

### `/hitoDS/foundations` information architecture

Replace the use-case list in the supplied screenshot with one tiered scale ordered as:

1. UI Titles — XL, LG, MD, SM, XS;
2. Display Titles — XL, LG;
3. Body — LG, MD, SM, XS;
4. Labels — MD, SM;
5. Technical — SM;
6. Component-bound examples — Button, Nav/Menu, Metric, Status; and
7. Tone combinations — representative Body/Label examples using neutral, accent, positive,
   negative, warning, and disabled semantic text tokens.

Do not filter Display roles out of the typography reference. Do not keep the parallel hand-authored
`TYPOGRAPHY_FAMILIES` summary when the central group registry can render the same truth. Context
guidance such as Page, Dialog, Section, Panel, list row, or helper appears as usage mapping beneath
the tier, not as another Text Style.

### Staged implementation ownership

The final outcome is cross-owner; it must not be implemented as one oversized Design System diff.

#### Slice 1 — DESIGN SYSTEM: target registry and bounded bridge

- Reconcile current dirty ownership before writing.
- Add the 14 target reusable roles and four retained component-bound roles through the existing
  registry/CSS seam.
- Add the proven `ui-title-lg` from repeated 36–48 px Product consumers.
- Update `/hitoDS/foundations`, generated manifest output, and existing validator assertions.
- Export exactly 14 target Text Styles and expose exactly 14 Inspector replacement options.
- Keep only still-reachable legacy roles as explicitly recognition-only, non-exported bridge
  entries. Reuse grouped CSS declarations where geometry is identical; do not create a new file or
  second registry.
- Do not edit Product, Marketing, Admin, or DevTools consumers in this slice.

#### Slice 2 — FRONTEND, DevTools lane: Inspector and local tooling adoption

- Migrate DevTools-rendered legacy classes to target roles.
- Verify current/Custom/component recognition, all 14 options, picker keyboard/focus behavior,
  pending selection, batch review, and generated prompt.
- Delete any DevTools-local typography override made obsolete by the target role.
- Keep inspector capture, colour/chrome/token controls, session behavior, and local-only boundary
  unchanged.

#### Slice 3 — FRONTEND, Product lane: authenticated runner adoption

- Migrate authenticated routes and shared Product components by the source-backed mapping above.
- Consolidate Today/Workout/Calendar 36–48 px headings on `ui-title-lg`.
- Remove `micro-label`/section-subtitle use by actual component meaning.
- Replace caption/helper/list-row/error-success and mixed mono compositions without changing copy,
  heading semantics, state truth, interaction, layout ownership, or data visualization geometry.
- Adopt Metric component sizing for the repeated prominent-value use and delete raw `text-2xl`.

#### Slice 4 — FRONTEND, Marketing lane: public/auth/editorial adoption

- Keep only Display XL/LG at intentional large editorial moments.
- Migrate login/auth small titles and Hub/Changelog small headings to UI tiers.
- Preserve editorial copy, route meaning, timeline component anatomy, responsive composition, and
  public navigation.

#### Slice 5 — Product-assigned existing role: Admin/internal adoption

- Product must assign this work to an existing named sidebar role and a valid lane/boundary before
  implementation. Do not invent an `Admin` subagent or silently fold Admin routes into DevTools.
- Migrate Admin title/brand/workbench/menu/feedback consumers and delete serif UI drift while
  preserving internal workflows and accessibility.

##### Slice 5 execution handoff — 2026-08-12

```text
ROLE: LAYOUT

Mode: Tracked
Stage: Typography Slice 5 — Admin/internal presentation adoption

Execute only Slice 5 of this canonical parent item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`

Read `AGENTS.md`, `agents/layout.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, the complete parent item, the current dirty tree,
and these exact source owners before the first write:

- `src/routes/admin.login.tsx`
- `src/routes/admin.capture.tsx`
- `src/routes/admin.analytics.tsx`
- `src/components/admin/AdminAnalyticsPanels.tsx`
- `src/components/admin/AdminOperationalComponents.tsx`
- `src/components/admin/AdminWorkspaceNav.tsx`

Outcome: Admin/internal functional UI must use the already accepted Poppins UI, Body, Label, and
Technical typography roles. Remove the remaining serif/legacy typography drift from Admin page and
dialog headings, workspace heading/brand presentation, dropdown/menu labels, list-row labels, and
feedback. Keep Technical mono for identifiers and measured data where it is semantically truthful.
Use existing Hito classes and component anatomy only; no new CSS, literal geometry, token, helper,
registry, wrapper, or compatibility path.

This is presentation-only. Preserve all route state, loaders, mutations, authentication,
authorisation, Admin data/readback truth, menu/dialog handlers, focus contracts, tables, API and
Backend contracts, Product/Marketing/DevTools/Design System sources, Figma, fixtures, providers,
hosted state, and unrelated dirty work. Do not rewrite copy or change heading semantics. Stop and
return to PRODUCT if a shared role/token/CSS change, new state/prop, workflow/auth/API behavior, or
non-presentation layout change is required.

Before editing, record the exact legacy/provenance and direct-display inventory in only the six
named files. Remove or replace only entries proved to be consumer-level typography drift. Keep
component-bound timeline, data-table, field, and Technical anatomy where their existing role is
truthful. Do not migrate any `src/components/hito-ds/` surface in this Slice.

Use one existing named ROLE: QA only for a bounded read-only independent replay after your source is
stable; do not delegate LAYOUT or FRONTEND implementation. Validate exact scoped legacy
zero-reachability, no contradictory local family/size/line-height/tracking override on adopted
roles, focused Prettier/ESLint, the applicable Product/DS validators, `git diff --check`, and an
uncontended production build. Replay Admin sign-in, analytics, capture, menus, dialogs, feedback
and tables at desktop and exact 375×812 in Light/Dark, including keyboard/focus, overflow and
console health. Append an English Tracked implementation receipt to this parent item. Do not claim
Global QA, release readiness, deployment, Figma parity, or closure of later typography slices.
```

#### Slice 6 — DESIGN SYSTEM: zero-reachability deletion and font cleanup

- Refresh repository-wide reachability after all consumer slices.
- Delete every retired role entry, legacy selector, alias, provenance id, manifest entry, old
  validator expectation, and obsolete rendered specimen.
- Remove unused Google font weights only after refreshed source evidence.
- Final required state: 14 reusable/Inspector/Figma Text Styles, 4 component-bound roles, zero
  legacy compatibility entries, and zero contradictory shared-role geometry/family overrides.

#### Slice 7 — QA and optional Figma downstream alignment

- QA receives a separate cross-surface acceptance inventory after all code-owner slices pass.
- DESIGN SYSTEM INTEGRATION may update an explicitly approved Figma target only after code-side
  acceptance, exact target/role registration, font availability, and Product dispatch. It removes
  obsolete Text Styles and creates/maps only the 14 accepted target styles; Figma never becomes the
  migration source of truth.

### Implementation validation matrix

| Check                   | Scenario/environment                                                                                         | Acceptance                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry                | Central source after bridge and final cleanup                                                                | Bridge: 14 target selectable/exported plus only proven recognition-only legacy roles. Final: exactly 14 reusable and 4 component-bound roles. |
| Provenance              | All selectors setting `--hito-typography-role`                                                               | Every id exists and truthfully describes the computed family/geometry; final zero retired ids.                                                |
| Geometry override audit | Reusable role combined with local family/size/leading/tracking utilities                                     | Zero contradictory overrides. Component-bound Custom exceptions are explicit and do not claim shared provenance.                              |
| Manifest                | Generator check and TypeScript/JSON parity                                                                   | Exactly 14 target Text Styles; no legacy labels/classes; code/Figma direction preserved.                                                      |
| Validator               | Existing DS contract script                                                                                  | Exact target ids/order/counts, role CSS owners, fonts, Inspector boundary, retired-role zero reachability, and no second registry.            |
| Foundations             | `/hitoDS/foundations`, desktop and 375 px, Light/Dark                                                        | All five families/sections render in target order; Display is visible; no micro/context/state role duplicates; samples wrap without overflow. |
| Inspector recognition   | Confirmed target, component-bound, inherited, and Custom text                                                | Correct current label/spec; no false match from visual similarity.                                                                            |
| Inspector replacement   | All 14 options                                                                                               | `Ab`, correct family/size, keyboard navigation, select/clear/Escape/focus return, scroll containment.                                         |
| Inspector batch         | Pending selection through batch review and generated prompt                                                  | New id/label/class retained; removed id absent; unrelated Color/Text/chrome/token controls unaffected.                                        |
| Product                 | Today, Workout, Calendar, Progress, Settings, onboarding, dialogs, fields, list rows, metric/readback states | Correct hierarchy and tone, no copy/state/layout regression, responsive containment, both themes.                                             |
| Marketing/editorial     | Login/Auth, Hub, Changelog and timeline                                                                      | Only approved large Display moments use Fraunces; small functional headings use UI tiers.                                                     |
| Admin/internal          | Admin navigation, login, analytics/capture overlays and feedback                                             | Poppins UI hierarchy, preserved workflows/focus/menu/dialog behavior, no serif UI drift.                                                      |
| Technical/Metric        | Identifiers, JSON/code, workout metrics, sliders, readbacks, prominent metrics                               | Technical and Metric ownership is truthful; no Body/Caption role with mono-family override; tabular alignment preserved.                      |
| Tone                    | Primary, secondary, tertiary, disabled, accent, positive, negative, informative, warning                     | Tone composes independently with Body/Label and meets current two-theme contrast contract.                                                    |
| Font loading            | Current final consumer reachability                                                                          | Only used weights requested; Poppins, Fraunces, JetBrains Mono resolve without synthetic required weights in accepted states.                 |
| Accessibility           | Heading semantics, browser zoom, keyboard, responsive reflow                                                 | DOM hierarchy unchanged unless separately approved; no essential body copy below Body XS; focus and accessible names preserved.               |
| Build/QA boundary       | Fresh uncontended local artifact                                                                             | Focused implementation proof passes; Global QA/release/hosted readiness is claimed only by the separate assigned gate.                        |

### Rollout and rollback

- Do not start Slice 1 on top of unresolved overlapping dirty ownership. Reconcile task identity and
  current lifecycle immediately before the first write.
- Each owner records the exact consumer map it changed and leaves unrelated owners byte-for-byte
  unchanged.
- Legacy recognition-only bridge entries are allowed only between Slice 1 and Slice 6. The task
  cannot be completed while any remains.
- If a slice makes a confirmed role appear as Custom, drops a pending Inspector selection, changes
  heading semantics, clips at 375 px, loses a required font weight, or requires a route-local
  compatibility recipe, roll back that complete slice to the last coherent shared contract.
- Do not restore readability or Inspector behavior through a local raw font/size override. Fix the
  canonical registry/CSS/provenance seam or keep the item open.

### Success criteria

1. The final registry contains exactly 14 reusable roles and four component-bound roles.
2. Generated Text Styles and Inspector replacement choices contain the same 14 target roles in the
   same semantic order.
3. `micro-label`, `section-subtitle`, contextual title ids/classes, separate label/form-label,
   helper/caption roles, `error-success`, and all legacy bridge entries have zero reachability.
4. Page/Dialog/Section/Panel remain component usage mappings, not reusable Text Style names.
5. Fraunces appears only in Display XL/LG and any explicitly accepted editorial component anatomy;
   no Admin, DevTools, authenticated Product, small auth, or DS UI heading uses it accidentally.
6. Metric remains a documented component-bound measured-truth role; Error/Success uses Body plus
   semantic tone.
7. No reusable role is combined with a contradictory local family/size/line-height/tracking override.
8. Local Inspector recognition, selection, pending draft, batch review, prompt output, keyboard,
   focus return, and responsive containment pass with the target registry.
9. `/hitoDS/foundations` presents the tiered scale and semantic tone combinations without a second
   hand-authored family inventory.
10. Product, Marketing/editorial, Admin/internal, DevTools, and Design System acceptance inventories
    pass at their owner boundaries before separate cross-surface QA.

### Explicit non-goals

- No new font family, component framework, typography primitive file, second registry, Figma-first
  truth, persisted Inspector migration, product-copy rewrite, heading-level rewrite, data/state
  change, or general layout redesign.
- Do not remove Fraunces or JetBrains Mono as families.
- Do not make every numeric value Metric or every small label a reusable Text Style.
- Do not use this consolidation to alter chart/visualization geometry or component control sizing.
- Do not mutate Figma, hosted state, dependencies, data, Git lifecycle, or active release work from
  this Designer task.

## Design System Slice 1 Execution — 2026-08-12

### Execution preflight

- **Outcome:** establish the accepted 14-role reusable/exported/selectable target in the existing
  registry and CSS, retain the four component-bound recognition roles, and keep only source-proven
  legacy provenance bridges while other owners remain read-only.
- **Existing seam and smallest change:** reuse `src/lib/hito-typography-roles.ts`, canonical
  typography CSS, `HITO_TYPOGRAPHY_GROUPS`, the existing Foundations renderer, manifest generator,
  and package validator. Add the target roles and UI Title LG at those owners; mark legacy entries
  recognition-only instead of changing any consumer.
- **New runtime artifacts:** none.
- **Removal/simplification:** remove `error-success` from the component-bound contract and remove
  every legacy role from Figma export, Inspector replacement choices, and the visible target role
  gallery. Runtime recognition bridges remain only because their current selectors/provenance are
  still reachable; Slice 6 deletes them after the named owner migrations prove zero reachability.
- **Dirty ownership:** the registry is currently clean. The typography CSS, Foundations page,
  generator/manifest, and validator contain existing unrelated work; Slice 1 edits only the named
  typography seams and preserves all other hunks. DevTools consumers remain read-only.
- **Focused proof:** exact target order/count, bridge flags, CSS provenance and geometry, generated
  14-style parity, Inspector-derived options/recognition, Foundations target order/tone examples,
  static/build proof, and desktop/exact-375 Light/Dark browser containment.
- **Promotion/stop condition:** stop if the single registry cannot represent target and bridge truth,
  Inspector recognition requires a DevTools edit, any consumer must migrate in this slice, or a new
  artifact/API/abstraction is required.

### Source-backed bridge inventory before implementation

All counts below exclude the central registry and generated manifest. They are direct current
TS/TSX references; CSS aliases such as `hito-page-copy`, `hito-support-copy`, and
`hito-section-subtitle` add further provenance reachability and therefore reinforce, rather than
weaken, the bridge requirement.

| Legacy bridge ids                                                       | Current direct runtime reachability                                                           | Target responsibility                                                        | Deletion owner/condition                                                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ui-page-title`, `ui-modal-title`, `ui-section-title`, `ui-panel-title` | 11/12/19/9 files; 15/17/42/27 references                                                      | UI Title XL/MD/SM/XS; UI Title LG is added as the missing source-backed tier | Product Slice 3, Admin Slice 5, DevTools Slice 2, then Slice 6 after zero provenance reachability |
| `display-title`, `page-title`                                           | 1/4 files; 2/4 references                                                                     | Display Title XL/LG                                                          | Marketing Slice 4 and remaining DS migration, then Slice 6 after zero reachability                |
| `modal-title`, `section-title`, `panel-title`                           | 6/1/4 files; 8/1/7 references                                                                 | UI Title MD/SM/XS or a demonstrated editorial component owner                | Product/Marketing/Admin/DevTools owner slices, then Slice 6 after zero reachability               |
| `list-row-title`, `body`, `body-small`, `helper`, `caption`             | 40/39/20/20/44 files; 135/119/48/56/211 references                                            | Body MD/MD/SM/XS/XS                                                          | Product/Marketing/Admin/DevTools owner slices, then Slice 6 after zero reachability               |
| `label`, `form-label`, `micro-label`                                    | 45/20/22 files; 207/43/43 references                                                          | Label MD/MD/SM or a demonstrated component owner                             | Product/Marketing/Admin/DevTools owner slices, then Slice 6 after zero reachability               |
| `technical-mono`                                                        | 19 files; 59 references                                                                       | Technical SM                                                                 | Product/Marketing/Admin/DevTools owner slices, then Slice 6 after zero reachability               |
| `error-success`                                                         | `hito-field-success` in 5 files/6 references and `hito-field-error` in 17 files/30 references | Body MD/XS plus the existing semantic text tone                              | Product/Admin/DevTools owner slices, then Slice 6 after zero provenance reachability              |

Each bridge entry remains in the one canonical registry with `figmaTextStyle: false` and
`inspectorSelectable: false`. It remains available to the Inspector's all-role provenance map but
cannot appear in the 14 replacement options or generated Text Styles.

## Design System Slice 1 Completion Receipt — 2026-08-12

- **Task and mode:** Hito DS typography scale consolidation and adoption; Tracked.
- **Stage:** Typography Slice 1 completed. The parent item remains `in_progress`; Product must route
  the separate owner migrations before final zero-reachability cleanup.
- **Preflight result:** the accepted 14+4 model fit the existing registry, CSS, Foundations,
  manifest, generator, validator, and Inspector provenance seams. Existing unrelated dirty hunks
  were reconciled without adding a runtime artifact, API, wrapper, second registry, compatibility
  framework, token, route, dependency, or consumer edit.
- **Product outcome:** the canonical reusable scale now exposes exactly 14 ordered roles to the
  generated manifest and Local Inspector replacement picker; exactly four component-bound roles
  remain recognition-only; the Foundations page presents the same target tiers and actual Poppins,
  Fraunces, and JetBrains Mono family specimens.
- **Root cause addressed:** the previous registry exported contextual aliases and semantic-tone
  roles as peer reusable Text Styles. Slice 1 makes the target scale the sole selectable/exported
  truth while retaining only the still-reachable legacy ids required for exact current provenance
  recognition.
- **Canonical source hierarchy:** `src/lib/hito-typography-roles.ts` owns target order, family
  metadata, component-bound recognition, and temporary bridges; canonical typography CSS owns
  geometry; the existing Foundations renderer consumes those owners; the existing generator and
  validator enforce 14-style parity. Local Inspector continues to derive replacement options from
  `HITO_INSPECTOR_TYPOGRAPHY_ROLES` and all-role recognition from `HITO_TYPOGRAPHY_ROLES` without a
  DevTools edit.
- **Files changed:** `src/lib/hito-typography-roles.ts`, `src/styles/layout-typography.css`,
  `src/components/hito-ds/reference-foundations-page.tsx`,
  `src/generated/hito-ds-manifest.ts`, `src/generated/hito-ds-manifest.json`,
  `scripts/validate-hito-ds-component-contracts.ts`, and this canonical item.
- **Preserved boundaries:** Product, Marketing, Admin/internal, and DevTools runtime consumers;
  Showcase lifecycle; shared component APIs; Figma; hosted state/data; dependencies; providers;
  and Git lifecycle were not changed.
- **Temporary bridge inventory:** 19 ids remain non-selectable and non-exported:
  `ui-page-title`, `ui-modal-title`, `ui-section-title`, `ui-panel-title`, `display-title`,
  `page-title`, `modal-title`, `section-title`, `panel-title`, `list-row-title`, `body`,
  `body-small`, `helper`, `caption`, `label`, `form-label`, `micro-label`, `technical-mono`, and
  `error-success`. DevTools Slice 2, Product Slice 3, Marketing Slice 4, and Product-routed
  Admin/internal Slice 5 own consumer migration; Design System Slice 6 deletes a bridge only after
  exact zero runtime and provenance reachability.
- **Browser path preflight:** the canonical managed loopback runtime was reused only after
  `artifactFreshness: fresh`, `freshnessReason: receipt_matches`, and
  `lastArtifactDecision: reused`. Focused browser proof used the local Chrome control surface and
  reset its temporary viewport after the four-case matrix.

| Check                             | Scenario / environment                                  | Result                   | Evidence                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry target                   | Current source                                          | Passed                   | Exactly 14 `figmaTextStyle: true` roles in the accepted order: five UI Title, two Display, four Body, two Label, and one Technical.                                                                 |
| Inspector derivation              | Read-only DevTools source                               | Passed                   | `HITO_TYPOGRAPHY_ROLE_OPTIONS` maps `HITO_INSPECTOR_TYPOGRAPHY_ROLES`; its exact 14-role order equals the exported target. The all-role map retains truthful current/custom and bridge recognition. |
| Component-bound contract          | Current source and Foundations                          | Passed                   | Button, Nav/Menu, Metric, and Status are the only four component-bound roles; none is selectable or exported, and all four examples render in the dedicated gallery.                                |
| Bridge contract                   | Current source                                          | Passed                   | Exactly 19 legacy bridges; every entry has `figmaTextStyle: false` and `inspectorSelectable: false`. Exact deletion owners and conditions are recorded above.                                       |
| Manifest parity                   | Generator `--check`                                     | Passed                   | 43 primitive colours, 41 semantic colours, and exactly 14 Text Styles. TypeScript and JSON outputs are in parity.                                                                                   |
| DS contract validator             | `npm run validate-hito-ds-components`                   | Passed                   | 324 scanned files; `textStyles: 14`, `uiTitleRoles: 5`; all existing DS contracts passed.                                                                                                           |
| Targeted lint                     | Registry, Foundations, validator                        | Passed                   | ESLint returned zero findings for the task-owned TypeScript/TSX source.                                                                                                                             |
| Type filtering                    | Touched source against repository `tsc --noEmit` output | Passed for touched files | No type error referenced a Slice 1 file. The repository-wide command still reports unrelated pre-existing errors, so this receipt does not claim a clean global type gate.                          |
| Build and runtime freshness       | Source-complete build plus managed runtime receipt      | Passed                   | Build completed during source proof. Final runtime status is healthy on `127.0.0.1:3000`, build present, `receipt_matches`, `lastArtifactDecision: reused`; no competing rebuild was forced.        |
| Foundations desktop               | 1440×900, Light and Dark, `#typography`                 | Passed                   | All 14 target cards render in order; Display is visible; four component-bound cards and all three actual-family specimens render; fonts report loaded; no document or section overflow.             |
| Foundations mobile                | Exact 375×812, Light and Dark, `#typography`            | Passed                   | Target/component order is unchanged; family and role samples wrap safely; no horizontal overflow; the typography anchor resolves under the compact header.                                          |
| Browser runtime health            | Four focused cases                                      | Passed                   | Console warning/error log was empty; no hydration or anchor error was observed. Evidence: `qa-artifacts/screenshots/2026-08-12/hito-ds-typography-slice-1-final/`.                                  |
| Diff hygiene                      | Task-owned files                                        | Passed                   | `git diff --check` returned no whitespace error.                                                                                                                                                    |
| Global QA, hosted, release, Figma | Cross-owner/downstream gates                            | Not run                  | Out of Slice 1 scope; no Global QA, hosted parity, release readiness, deployment, or Figma parity claim is made.                                                                                    |

- **Omitted-check consequence:** the unrelated repository-wide TypeScript failures prevent a global
  clean-type claim. Targeted lint, touched-file type filtering, manifest/validator parity, the
  source-complete build, and the fresh managed browser runtime cover the Slice 1 owners only.
- **Next owner:** Product, to route the already-defined Slice 2 Frontend DevTools adoption without
  merging later Product, Marketing, Admin/internal, cleanup, QA, or Figma gates.
- **Blockers:** none for Slice 1. Nineteen bridges remain intentionally reachable until their named
  consumer owners migrate; they are not a second selectable/exported typography truth.
- **Role file:** `agents/design-system.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none; the bounded source and four-case browser proof were completed by the owning
  Design System role.

## Frontend DevTools Slice 2 Execution — 2026-08-12

### Execution preflight

- **Outcome:** migrate the Local Inspector and local DevTools presentation from the still-reachable
  legacy typography classes to the accepted target roles while preserving recognition, selection,
  ephemeral draft/session, batch-review, prompt, colour, chrome, token, capture, and local-only
  behavior.
- **Existing seam and smallest change:** keep Inspector recognition and the 14 replacement options
  derived from `src/lib/hito-typography-roles.ts` through the existing
  `local-ui-inspector-targets.ts` map. Change only rendered DevTools class consumers to the exact
  accepted target class and independent semantic tone; do not change the upstream 14+4 registry or
  its CSS/manifest/validator owners.
- **New runtime artifacts:** none.
- **Removal/simplification:** current DevTools reachability is 56 legacy class references across ten
  files: 41 `hito-caption`, five `hito-label`, seven `hito-technical-mono`, and one each of
  `hito-body-small`, `hito-list-row-title`, and serif `hito-panel-title`. The migration removes those
  references and the seven redundant `text-xs` plus six contradictory `leading-5` overrides from
  the technical-role consumers; it adds no translation, compatibility, or local typography layer.
- **Dirty ownership:** concurrent DevTools colour/text-control work exists in
  `LocalUiPropertyControlPrimitives.tsx`, `LocalUiTaskDraftPanel.tsx`,
  `LocalUiTextControlRow.tsx`, and `LocalUiTokenControls.tsx`, with related utility/session/prompt
  hunks. Slice 2 changes only typography class strings inside the four overlapping presentation
  files and preserves all other concurrent hunks byte-for-byte. The remaining six typography
  consumer files are clean at preflight.
- **Focused proof:** exact DevTools legacy zero reachability and target-role/tone composition;
  unchanged 14-option derivation and all-role recognition; targeted format/lint/type/DS validation;
  an uncontended source-complete build and managed loopback freshness; and desktop/exact-375 Light
  and Dark Inspector browser proof for confirmed, component-bound, inherited, and Custom roles,
  picker keyboard/focus/scroll behavior, pending selection, batch review, generated prompt,
  containment, and console health.
- **Stop condition:** stop and route back to Product/Design System if a registry/CSS/manifest/
  validator change is required, an overlapping dirty hunk cannot be preserved, another Frontend
  lane must change, or persistence/API/hosted behavior is reached.

### Completion receipt

- **Task and mode:** Hito DS typography scale consolidation and adoption; Tracked, Frontend Lane:
  DevTools.
- **Stage:** Typography Slice 2 completed. The parent item remains `in_progress`; this receipt does
  not include the separate Product, Marketing, Admin/internal, zero-reachability cleanup,
  independent QA, Figma, hosted, release, or deployment gates.
- **Preflight result:** the migration fit the existing Local Inspector target/provenance,
  property-control, draft/session, batch-review, and prompt seams. No shared registry, canonical CSS,
  manifest, validator, route, dependency, persistence, API, wrapper, or new runtime artifact was
  required.
- **Product outcome:** DevTools presentation now uses accepted target typography roles and
  independent semantic tones. The existing Inspector continues to recognize confirmed current,
  inherited, component-bound, and Custom typography truth; replacement selection remains exactly
  the 14 accepted roles in canonical order.
- **Root cause addressed:** ten DevTools renderers still presented local-tooling chrome through 56
  legacy class references even after those roles became non-selectable/non-exported provenance
  bridges. The first incorrect owners were the route-local DevTools class consumers; the canonical
  14+4 registry was already correct and remained read-only.
- **Removal evidence:** 41 `hito-caption`, five `hito-label`, seven `hito-technical-mono`, and one
  each of `hito-body-small`, `hito-list-row-title`, and `hito-panel-title` were replaced in place.
  Exact DevTools-lane reachability for those class forms is now zero. Seven redundant `text-xs` and
  six contradictory `leading-5` overrides were deleted from Technical SM consumers. No replacement
  mapping or compatibility layer was added.
- **Files changed:** `src/components/devtools/LocalScreenCaptureFlow.tsx`,
  `LocalUiChromeControls.tsx`, `LocalUiComponentActions.tsx`,
  `LocalUiInspectorBatchReview.tsx`, `LocalUiInspectorModeBar.tsx`,
  `LocalUiPropertyControlPrimitives.tsx`, `LocalUiTaskDraftPanel.tsx`,
  `LocalUiTextControlRow.tsx`, `LocalUiTokenControls.tsx`,
  `LocalUiTypographyControls.tsx`, and this canonical item.
- **Dirty-hunk preservation:** concurrent colour, text-editing, token-group, Inspector utility,
  session, target, draft-view-model, and prompt work was preserved. Slice 2 changed only typography
  presentation classes in overlapping files and did not claim ownership of those concurrent
  behaviors.
- **Preserved boundaries:** Inspector capture, colour/chrome/token controls, ephemeral session and
  route reset, batch review, generated prompt, local-only behavior, the upstream 14+4 registry/CSS/
  Foundations/manifest/validator contract, Product/Marketing/Admin consumers, Product routes,
  Showcase, Backend/auth/persistence, Figma, hosted state/data, providers, dependencies, and Git
  lifecycle were not changed.
- **Browser path preflight:** the managed `qa_fixture` loopback runtime was rebuilt through the
  existing lifecycle command and verified healthy, local, compatible, provider-safe, and fresh
  before replay. Focused browser proof used the local Chrome control surface, then reset the
  temporary viewport and closed the task-owned tab.

| Check                             | Scenario / environment                                 | Result                   | Evidence                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DevTools legacy reachability      | `src/components/devtools/` source discriminator        | Passed                   | The 56 scoped legacy class references are zero; the ten touched renderers now contain 41 Body XS, five Label MD, seven Technical SM, and one each of Body SM, Body MD, and UI Title XS target-role consumers.                                                                           |
| Technical override deletion       | Touched DevTools renderers                             | Passed                   | No Technical SM consumer retains the seven redundant `text-xs` or six contradictory `leading-5` overrides.                                                                                                                                                                              |
| Upstream role contract            | Current registry/source contract                       | Passed                   | Exactly 14 target roles remain selectable/exported in canonical order; Button, Nav/Menu, Metric, and Status remain the only four recognition-only component roles; all 19 legacy bridges remain non-selectable/non-exported for other owners.                                           |
| Targeted formatting and lint      | Ten touched DevTools source files plus canonical item  | Passed                   | Prettier check and targeted ESLint returned no findings.                                                                                                                                                                                                                                |
| Type filtering                    | Touched files against repository `tsc --noEmit` output | Passed for touched files | No TypeScript diagnostic referenced a Slice 2 file. The repository-wide command still reports unrelated pre-existing errors, so this is not a global clean-type claim.                                                                                                                  |
| DS validator                      | `npm run validate-hito-ds-components`                  | Passed                   | 324 files scanned; 43 primitive colours, 41 semantic colours, exactly 14 Text Styles, and five UI Title roles; no shared contract changed.                                                                                                                                              |
| Build and managed runtime         | Source-complete local build and `qa_fixture` lifecycle | Passed                   | The uncontended build completed. Final managed status was healthy on `127.0.0.1:3000`, provider mode `qa_fixture`, build present, artifact freshness `fresh`, and `receipt_matches`.                                                                                                    |
| Recognition truth                 | Inspector on `/hitoDS/foundations#typography`          | Passed                   | Actual composer replay reported Body MD for a confirmed specimen, Body MD for inherited computed provenance, Button for the component-bound example, and Custom for unresolved computed typography. Button did not become selectable.                                                   |
| Replacement inventory             | Desktop 1440×900, Light and Dark                       | Passed                   | Picker exposed Keep current plus exactly 14 target options. Every option rendered its `Ab` preview, accepted role label, family, size, weight, and line-height descriptor; there was no document overflow.                                                                              |
| Keyboard and pending state        | Desktop and exact 375×812                              | Passed                   | Arrow Down opened at the current option; End reached Technical SM; Enter selected and returned focus; Escape closed and returned focus; pending removal restored current truth and disabled unchanged add/generate actions. Closing the composer returned focus to the Pencil mode bar. |
| Draft, review, and prompt         | Desktop and exact 375×812                              | Passed                   | Label SM survived composer-to-draft review. The generated local-only batch prompt preserved the route, viewport/theme context, selector/evidence, and exact `Custom -> Label SM (hito-label-sm)` request with no scoped legacy role id.                                                 |
| Responsive containment            | Exact 375×812, Light and Dark                          | Passed                   | Document `clientWidth` equalled `scrollWidth` at 375; the picker remained within the viewport; mobile composer/review used the existing 375×812 modal and contained scroll body; desktop review remained within 1440×900.                                                               |
| Session and route boundary        | Inspector mode then `/hitoDS/components` navigation    | Passed                   | Pencil state reset on route change; no Inspector draft or mutation crossed the local route boundary.                                                                                                                                                                                    |
| Browser health                    | Desktop/mobile, Light/Dark focused matrix              | Passed                   | Warning/error console log was empty and no hydration error text was observed. Screenshots: `qa-artifacts/screenshots/2026-08-12/hito-ds-typography-slice-2-devtools/`.                                                                                                                  |
| Diff hygiene                      | Task-owned files                                       | Passed                   | Scoped `git diff --check` returned no whitespace error.                                                                                                                                                                                                                                 |
| Global QA, hosted, release, Figma | Cross-owner/downstream gates                           | Not run                  | Outside Slice 2; no Global QA, hosted parity, release readiness, deployment, or Figma parity claim is made.                                                                                                                                                                             |

- **Omitted-check consequence:** unrelated repository-wide TypeScript failures prevent a global
  clean-type claim. Focused source reachability, targeted lint/type filtering, DS validation,
  source-complete build, fresh managed runtime, and the browser matrix prove only this DevTools
  slice.
- **Next owner:** Product, to route the already-defined Frontend Product Slice 3 without merging
  Marketing, Admin/internal, final bridge cleanup, QA, or Figma work.
- **Blockers:** none for Slice 2. Nineteen legacy bridges remain intentionally available only for
  other still-unmigrated runtime/provenance consumers.
- **Role file:** `agents/frontend.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the local browser-control skill for focused
  loopback replay.
- **Subagents:** none; no independent bounded review was necessary for this single-lane migration.

## Frontend Product Slice 3 Execution — 2026-08-12

### Execution preflight

- **Outcome:** migrate authenticated runner routes and shared Product components from contextual
  legacy typography provenance to the accepted target roles while preserving copy, DOM semantics,
  interaction, responsive composition, visualization geometry, and backend-shaped state.
- **Existing seam and smallest change:** reuse the 14 accepted classes, existing semantic text
  tones, the component-bound Metric owner, and each current Product renderer. Change only class
  composition at the existing element; do not alter the registry, CSS, primitive, route, data, or
  behavior owner.
- **New runtime artifacts:** none.
- **Exact Product inventory:** 476 legacy/provenance class references across 40 Product files: 13 UI
  Page, 14 UI Modal, 24 UI Section, six UI Panel, 50 Body, 16 Body Small, 68 Caption, 63 Label, 28
  Form Label, 59 List Row Title, 48 List Row Copy, 19 Field Helper, 13 Field Error, one Field
  Success, 11 Page Copy, 14 Support Copy, ten Technical Mono, seven Micro Label, ten Section
  Subtitle, and two route-local Helper references.
- **Source-backed mapping:** UI Page/Modal/Section/Panel become UI Title XL/MD/SM/XS; Today, Workout,
  and Calendar's proven 36–48 px headings become UI Title LG; Body/Body Small become Body MD/SM plus
  secondary tone; Caption and helpers become Body XS plus tertiary/secondary tone; Label/Form Label
  become Label MD; short orientation labels become Label SM with their existing intentional local
  uppercase/tracking; list titles/copy become Body MD/SM plus foreground/secondary tone; field
  feedback becomes Body MD/XS plus existing negative/positive/secondary tone; Technical Mono and
  mixed caption/body mono readbacks become Technical SM with their existing tone; the two proven
  prominent Metric consumers remove contradictory raw `text-2xl` and retain the existing
  component-bound Metric class.
- **Layout alias treatment:** `hito-page-copy`, `hito-list-row-copy`, and `hito-support-copy` are
  replaced at their Product consumers by the target role plus the same existing margin/max-width/
  tone composition. This removes legacy provenance without changing shared CSS or adding a local
  style owner.
- **Dirty ownership:** `Calendar.tsx`, `TodayHero.tsx`,
  `ManualWorkoutAuthoringControls.tsx`, and `routes/workout.$date.tsx` contain unrelated concurrent
  workout-semantic/manual-workout hunks. Slice 3 changes only typography class tokens in those files
  and preserves every other dirty line byte-for-byte. All other Product candidates are clean at
  preflight.
- **Preserved cross-owner boundaries:** shared primitives under `src/components/ui`, DevTools,
  `/hitoDS`, Marketing/public/auth, Admin/internal, canonical registry/CSS/Foundations/manifest/
  validator, Backend/auth/persistence, Figma, hosted state/data, providers, dependencies, and Git
  lifecycle remain read-only.
- **Focused proof:** exact Product-lane legacy zero reachability; target-role and contradictory
  geometry audit; targeted format/lint/type/DS validation; uncontended fresh managed build; and
  representative Today, Workout, Calendar, Progress, Settings, onboarding, dialog/field/list/metric
  browser replay at desktop and exact 375×812 in Light and Dark.
- **Stop condition:** stop before expansion if a shared Design System change, another Frontend lane,
  Admin/internal ownership, auth/persistence/API behavior, irreconcilable dirty overlap, or an
  unapproved visual approximation is required.

## Frontend Product Slice 3 Completion Receipt — 2026-08-12

- **Task and mode:** Typography Slice 3 authenticated Product adoption; Tracked.
- **Stage:** Slice 3 complete. The parent work item remains `in_progress` for Marketing, Admin,
  final Design System cleanup, and independent QA/Figma stages.
- **Role file:** `agents/frontend.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the local browser-control skill for focused
  loopback replay.
- **Task artifact:** this canonical backlog item. No supporting plan or new runtime artifact was
  added.
- **Subagents:** none. The instruction prohibited same-discipline assistance, and a separate QA
  review was not necessary after the bounded implementation and browser matrix stabilized.
- **Preflight and dirty-tree reconciliation:** the hidden Product candidate was treated as
  unaccepted. Each hunk was mapped to the exact 40-file Slice 3 inventory. Only rendered Product
  typography class composition was accepted; unrelated concurrent workout-semantic,
  manual-workout, slider/body-note, shared Design System, DevTools, Marketing, Admin, Backend, and
  generated-source hunks were preserved.
- **Product outcome:** all 476 exact legacy/provenance references in the stated authenticated
  Product inventory now resolve through the accepted UI Title, Body, Label, Technical, and Metric
  owners. Product copy, DOM semantics, interaction, state, route behavior, spacing, max-width,
  semantic tones, local uppercase/tracking, and responsive layout composition remain unchanged.
- **Root cause and owner:** contextual legacy classes survived at Product renderers after the
  canonical typography scale was established. Several candidate compositions also retained a
  redundant geometry utility, assigned a mono readback to Body/Caption provenance, or composed a
  conflicting tone. The first incorrect owner was the Product element's class composition; the
  existing renderer remained the smallest correct seam.
- **Files changed:** class composition only in the 40 files named by the Slice 3 execution
  inventory: AppShell, Calendar, CompletionPanel, OnboardingGate, TodayHero,
  CalendarOverflowActions, nine manual-workout components, seven onboarding components, four
  Progress components, four Settings components, three workout-completion components, two
  workout-structure components, and the authenticated index, integrations, progress, settings, and
  workout routes. This canonical item was updated for lifecycle and receipt.
- **Preserved boundaries:** the typography registry, canonical CSS, manifests, validators,
  Foundations, `/hitoDS`, all DevTools owners, public/editorial/auth surfaces, Admin/internal,
  Backend/auth/persistence, data and fixtures, providers, dependencies, Figma, hosted state, and Git
  lifecycle were not changed by this slice.

| Check                                   | Scenario / environment                                                            | Result                           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source mapping and reachability         | Exact 40-file Product inventory, corrected token-boundary search                  | Passed                           | `HEAD` contained 476 exact legacy/provenance tokens; working tree contains zero. A broad prefix search was rejected because it incorrectly counted target classes such as `hito-body-md` as `hito-body`.                                                                                                                                                                                                                                                                                                                            |
| Target ownership and geometry           | Current Product class composition                                                 | Passed                           | 13 UI Title XL, four LG, 14 MD, 23 SM, six XS, 148 Body MD, 63 Body SM, 79 Body XS, 91 Label MD, 17 Label SM, 21 Technical SM, and two Metric owners; zero contradictory family/size/line-height utilities.                                                                                                                                                                                                                                                                                                                         |
| Formatting and lint                     | Exact Slice 3 files                                                               | Passed                           | Focused Prettier and ESLint completed without findings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Design System and Product validators    | Current checkout                                                                  | Passed                           | `validate-hito-ds-components` passed across 324 files with 43 primitive colours, 41 semantic colours, 14 Text Styles, and five UI title tiers; `validate-product-contracts` passed its heart-rate guidance and Workout comparison contracts.                                                                                                                                                                                                                                                                                        |
| Type diagnostics                        | `npx tsc --noEmit --pretty false`                                                 | Baseline failure, classified     | 497 checkout-wide diagnostic lines; 76 mention Slice 3 files, all at existing router search, unknown action-return, nullable FIT asset, or result-union branches rather than typography class composition. Therefore no checkout-wide type-green claim is made.                                                                                                                                                                                                                                                                     |
| Production build                        | Fresh uncontended managed build                                                   | Passed                           | Client, SSR, Nitro, and postbuild completed successfully. A second fresh build was used after shared source changed during the first run; only existing warnings remained.                                                                                                                                                                                                                                                                                                                                                          |
| Desktop visual proof                    | 1440×900, Light and Dark, managed `qa_fixture`                                    | Passed                           | Today/Calendar, completed Workout metrics/readback, Progress Plans/list state, Settings, onboarding, and manual-workout dialog rendered with the target Poppins/JetBrains roles, correct hierarchy/tone, and no horizontal overflow.                                                                                                                                                                                                                                                                                                |
| Mobile visual proof                     | Exact 375×812, Light and Dark, managed `qa_fixture`                               | Passed                           | The same representative Product surfaces and onboarding/dialog states contained without horizontal overflow. Evidence is under `qa-artifacts/screenshots/2026-08-12/typography-slice-3-product/`, including `mobile-375x812-dark-workout-viewport.png`.                                                                                                                                                                                                                                                                             |
| Accessibility and interaction           | Theme controls, dialog, navigation, responsive routes                             | Passed                           | Existing radio keyboard navigation and focus followed selection; dialog Tab reached the enabled title action and Escape closed it; links/tabs and DOM semantics remained intact.                                                                                                                                                                                                                                                                                                                                                    |
| Console, runtime, and provider boundary | Fresh clean browser tab and local observability during the focused fixture replay | Passed with final freshness note | Representative Product routes produced zero browser warnings/errors. During proof the managed runtime was current, healthy, loopback-only, artifact-fresh, and running in `qa_fixture`; 31 local request/action events had zero failures, zero provider events, and zero provider kinds. A final manager refresh/build also passed and restarted `qa_fixture`, but a concurrent Admin snapshot digest changed afterward: the live runtime still answers HTTP 200 in `qa_fixture`, while checkout-wide artifact status is now stale. |
| Global QA, hosted, Figma, release       | Out of Slice 3                                                                    | Not run                          | This receipt proves only the Frontend Product implementation slice; no Global QA, hosted parity, Figma alignment, release readiness, or deployment claim is made.                                                                                                                                                                                                                                                                                                                                                                   |

- **Omitted-proof consequence:** checkout-wide TypeScript health remains unproven because the existing
  non-typography diagnostic baseline is red. Runtime legacy bridges observed in nested renderers
  outside the exact 40-file Product inventory remain intentional later-slice/final-cleanup work and
  are not hidden by this receipt.
- **Next owner:** Product, to route the already-defined Slice 4 Marketing work without absorbing it
  into this Frontend Product result.
- **Blockers:** none for the Slice 3 source or focused browser proof. The managed `qa_fixture`
  server was left running and healthy; checkout-wide artifact freshness is stale because a
  concurrent Admin snapshot owner changed the expected digest after the successful final rebuild.

## Frontend Marketing Slice 4 Execution — 2026-08-12

### Execution preflight

- **Outcome:** migrate the bounded public/auth/editorial consumer inventory to the established
  target typography roles while retaining deliberate large Fraunces identity and the existing
  Changelog timeline editorial anatomy.
- **Existing seam and smallest change:** reuse the accepted target classes and existing semantic
  tones directly at `src/routes/hub.tsx`, `src/routes/changelog.tsx`, `src/routes/login.tsx`, and
  `src/components/AuthEntryScreen.tsx`. Change only each rendered element's typography class
  composition; no route, parser, auth, data, shared component, registry, CSS, or behavior owner is
  changed.
- **New runtime artifacts:** none.
- **Exact Marketing inventory:** 32 legacy/provenance class references across four files: three
  Body, eight Body Small, four Field Error, one Field Success, four Label, four Micro Label, one
  serif Modal Title, two editorial Page Title, and five serif Panel Title references. Nine direct
  geometry recipes are also in scope: six standalone `text-sm`/`text-lg` public-auth consumers and
  three `leading-relaxed` overrides on legacy Body Small timeline copy.
- **Source-backed mapping:** Hub and Changelog page identity retain Fraunces through Display Title
  LG; the authenticated Login state title becomes UI Title MD; Hub/Changelog functional card and
  entry headings become UI Title XS; Body/Body Small and direct 14/18 px copy become Body MD/SM/LG
  with their current tones; Label becomes Label MD; editorial/auth orientation metadata becomes
  Label SM; and auth feedback becomes Body MD plus the existing medium emphasis and negative or
  positive semantic tone. Redundant direct size/line-height utilities are deleted where the target
  role owns that geometry.
- **Editorial exception:** `hito-timeline-year`, `hito-timeline-month`, and `hito-timeline-day`
  remain unchanged as the documented Changelog component-bound Fraunces anatomy. They are not
  registered as reusable roles or used to justify a small Display role.
- **Dirty ownership:** `src/routes/changelog.tsx` already contains unrelated accepted history
  parser/read-model, shared day-gutter, link-rendering, and copy changes. Slice 4 changes only
  typography class strings in that file and preserves every other dirty line byte-for-byte. The
  other three Marketing owners are clean at preflight.
- **Removal/simplification:** the scoped 32 legacy tokens and nine direct size/line-height recipes
  are removed at their rendered owners. No alias, raw replacement recipe, wrapper, helper, local
  CSS, second registry, or compatibility path is added.
- **Preserved boundaries:** central registry and canonical typography CSS, manifests, validators,
  Foundations, `/hitoDS`, DevTools, authenticated Product, Admin/internal, Backend/auth contracts,
  data/persistence, providers, Figma, hosted state, dependencies, and Git lifecycle remain
  read-only.
- **Focused proof:** exact scoped legacy zero reachability; target-role contradiction audit;
  focused format/lint/touched-file type filtering and DS/product validation; uncontended build only;
  and Hub, Changelog/timeline, and Login/Auth browser replay at desktop and exact 375×812 in Light
  and Dark with keyboard/focus, overflow, and console evidence.
- **Stop condition:** stop and return to Product if a shared Design System or timeline contract,
  Admin/internal or another Frontend lane, non-typography layout change, auth/backend behavior, or
  an unpreservable dirty overlap is required.

### Completion receipt

- **Task and mode:** Typography Slice 4 public/auth/editorial adoption; Tracked, Frontend Lane:
  Marketing.
- **Stage:** Slice 4 complete. The parent item remains `in_progress` for Admin/internal adoption,
  final Design System bridge deletion/font cleanup, and separate QA/Figma gates.
- **Role file:** `agents/frontend.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the local in-app browser-control skill for the
  focused loopback matrix.
- **Task artifact:** this canonical backlog item. No supporting plan or new runtime artifact was
  added.
- **Subagents:** none. The owning Frontend Marketing role implemented and tested the slice directly;
  a separate read-only QA review was not necessary after the focused matrix stabilized.
- **Preflight and dirty-tree reconciliation:** the exact public/auth inventory was bounded to Hub,
  Changelog, Login, and AuthEntryScreen. The existing Changelog history read-model, shared day
  gutter, evidence-link, redirect, and copy hunks were preserved; Slice 4 changed only typography
  class composition there. All Design System, DevTools, Product, Admin, Backend, and unrelated dirty
  files remained outside the source edit.
- **Product outcome:** Hub and Changelog retain Fraunces only for their deliberate Display Title LG
  page identities. Login/auth and all Hub/Changelog functional headings, bodies, labels, metadata,
  and feedback now resolve through the accepted UI/Body/Label roles and independent semantic tones.
  Changelog year/month/day remains the unchanged component-bound editorial exception.
- **Root cause and owner:** four Marketing renderers still emitted 32 non-selectable/non-exported
  legacy provenance classes and nine local size/line-height recipes after the canonical target
  scale was established. The first incorrect owner was each public/auth element's route-local class
  composition; the registry, shared CSS, and timeline anatomy were already correct and remained
  read-only.
- **Files changed:** `src/routes/hub.tsx`, `src/routes/changelog.tsx`, `src/routes/login.tsx`,
  `src/components/AuthEntryScreen.tsx`, and this canonical item.
- **Preserved boundaries:** editorial copy and route meaning; heading levels; Hub links; Changelog
  source/read-model/order, tabs, timeline anatomy, evidence links, and redirect; auth actions and
  unavailable states; responsive composition; shared typography/DS source; Product, Admin,
  DevTools, Backend/auth contracts, data/persistence, fixtures, providers, Figma, hosted state,
  dependencies, and Git lifecycle.
- **Browser path preflight:** browser work was focused implementation DoD, not Global QA. The sole
  managed loopback runtime was rebuilt/restarted through the canonical lifecycle in `qa_fixture`
  mode and verified current, compatible, healthy, and artifact-fresh before navigation. The local
  in-app browser used exact viewport overrides, which were reset afterward; the named local QA
  identity and Light theme were restored through ordinary UI controls.

| Check                              | Scenario / environment                                                                     | Result                       | Evidence                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing reachability             | Exact four-file public/auth inventory                                                      | Passed                       | 32 legacy/provenance tokens and nine direct size/line-height recipes became zero. Target census: two Display Title LG, one UI Title MD, five UI Title XS, one Body LG, 13 Body MD, eight Body SM, four Label MD, and four Label SM consumers.                                                      |
| Font and provenance truth          | Rendered computed styles                                                                   | Passed                       | Hub and Changelog page identities resolve to Fraunces with `display-title-lg`; functional headings/body/labels resolve to Poppins with their exact target ids. No adopted target retains a family, size, line-height, tracking, mono, or conflicting tone recipe.                                  |
| Timeline exception                 | Highlights and Technical log                                                               | Passed                       | `hito-timeline-year`, `hito-timeline-month`, and `hito-timeline-day` remain unchanged and component-bound. Both timelines render the shared 2026 → August → 11 hierarchy; no reusable small Display role or timeline rewrite was introduced.                                                       |
| Formatting, lint, and diff hygiene | Four source owners plus canonical item                                                     | Passed                       | Focused Prettier, ESLint, and `git diff --check` returned no findings.                                                                                                                                                                                                                             |
| Changelog and Product validators   | Current checkout                                                                           | Passed                       | `validate-changelog-history` passed with 54 public dates/362 entries and nine Technical sections/15 decisions; `validate-product-contracts` passed both existing proofs.                                                                                                                           |
| Design System validator            | Current checkout                                                                           | Unrelated baseline failure   | `validate-hito-ds-components` reports the current Foundations Mark-inventory and reference-surface classification assertions. Neither failure names or depends on a Marketing owner; no shared DS fix was attempted.                                                                               |
| Type diagnostics                   | Repository `tsc --noEmit`, touched-file filter                                             | Baseline failure, classified | The checkout reports 497 diagnostic lines. The touched filter finds only the pre-existing Changelog `TechnicalLogMonth` union mismatch and Login search-status narrowing; neither is on a typography class composition or was introduced by this slice. No checkout-wide type-green claim is made. |
| Production build                   | Uncontended current source                                                                 | Passed                       | Client, SSR, Nitro, and postbuild completed successfully; the managed lifecycle rebuild also passed before browser proof. Only existing bundler/chunk warnings remained.                                                                                                                           |
| Desktop browser                    | Hub, Changelog Highlights/Technical, signed-in Login, signed-out Auth; 1440×900 Light/Dark | Passed                       | Correct Fraunces/Poppins ownership, functional hierarchy, auth states, public navigation, and zero horizontal overflow. Screenshots: `qa-artifacts/screenshots/2026-08-12/typography-slice-4-marketing/`.                                                                                          |
| Mobile browser                     | Same public/auth inventory; exact 375×812 Light/Dark                                       | Passed                       | Hub cards, Changelog header/timeline/cards, signed-in Login, and both auth tabs remain contained with zero horizontal overflow. Representative evidence includes `mobile-375x812-dark-changelog-highlights.png` and `mobile-375x812-light-auth-entry-login.png`.                                   |
| Keyboard, focus, redirect, console | Both themes and viewports                                                                  | Passed                       | Changelog and Auth tabs changed selection with ArrowRight/ArrowLeft; signed-in and signed-out Login branches remained reachable; `/change-log` redirected to `/changelog`; browser warning/error logs stayed empty.                                                                                |
| Local-only/provider boundary       | Managed runtime events since final fixture start                                           | Passed                       | 49 request/action events, zero failures, zero provider events, and zero provider kinds. No hosted state or paid provider was accessed.                                                                                                                                                             |
| Final runtime freshness            | After completed browser proof                                                              | External freshness note      | The proof ran on current/fresh `qa_fixture`. A concurrent Admin snapshot digest changed afterward; the process remains running in `qa_fixture`, but the manager now marks the shared artifact stale/broken. Rebuilding repeatedly over that active cross-owner drift was intentionally avoided.    |
| Global QA, Figma, hosted, release  | Out of Slice 4                                                                             | Not run                      | No Global QA Acceptance, Figma parity, hosted parity, release readiness, deployment, staging, commit, or push claim is made.                                                                                                                                                                       |

- **Omitted-check consequence:** checkout-wide type and DS-validator green remain unproven because of
  the classified cross-owner baselines above. Focused source, lint, validators, build, and browser
  evidence prove only the Marketing implementation slice.
- **Next owner:** Product, to route the separately defined Admin/internal Slice 5 to an existing
  named role and valid lane without absorbing that work into Marketing.
- **Blockers:** none for Slice 4. The remaining validator/type/runtime-freshness issues are
  demonstrated outside this slice and remain with their current owners.

## Exact Product Handoff

```text
ROLE: PRODUCT

Mode: Tracked routing and lifecycle only — no implementation or QA

Continue this single canonical work item after completed Typography Slices 1 and 2:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`

Read `AGENTS.md`, `agents/product.agent.md`, `skills/hito-prompt-handoff/SKILL.md`, the complete
canonical item and both completion receipts, current dirty-tree ownership, and the current state of
the existing FRONTEND sidebar role. Slice 1 established exactly 14 reusable roles, four
component-bound roles, and 19 non-selectable/non-exported provenance bridges. Slice 2 removed all 56
legacy DevTools presentation references while preserving truthful Inspector recognition,
replacement, draft, batch, prompt, responsive, and local-only behavior.

Do not implement, edit runtime source, run implementation validation, mutate Figma, or dispatch a
custom subagent. Report the completed Slice 2 and propose only Slice 3 — authenticated Product
consumer adoption through the existing Frontend Product lane and canonical Product seams described
in this item. Preserve DevTools byte-for-byte, the 14+4 registry/CSS/Foundations/manifest/validator
contract, Marketing/Admin consumers, Showcase, Backend/auth/persistence, Figma, hosted state/data,
dependencies, providers, and Git lifecycle. Keep Marketing, Admin/internal, final
zero-reachability cleanup, independent QA, and gated Figma work separate. Provide one exact English
`ROLE: FRONTEND` / `Frontend Lane: Product` prompt and follow the current Product
dispatch-confirmation rule.
```

## Designer Completion Receipt

- **Task and mode:** Hito typography scale consolidation and adoption; Tracked Designer audit.
- **Stage:** Audit complete; implementation not started.
- **Role file:** `agents/designer.agent.md`.
- **Skill used:** `skills/hito-frontend-design-system/SKILL.md`.
- **Task artifact:** This canonical backlog item only; no supporting plan was needed.
- **Subagents:** None.
- **Product outcome:** One 14-role reusable scale, four retained component-bound roles, explicit
  legacy/font/tone decisions, DevTools preservation contract, and bounded owner sequence.
- **Root cause:** use-case context and semantic tone are encoded as peer Text Styles beside actual
  family/geometry roles; local family/size overrides then make provenance drift from rendering.
- **Files inspected:** operating/role/skill instructions; completed typography foundation,
  authenticated Product QA, DS reference adoption, and Inspector anatomy items; current typography
  registry and CSS owners; Foundations renderer; DevTools Inspector/picker/draft/session/prompt
  seams; generated manifest/generator; DS validator; relevant Product/Marketing/Admin/DS consumers;
  and font loading/source reachability.
- **File changed:** This canonical backlog item only.
- **Preserved boundaries:** no runtime, CSS, DevTools, Product, manifest, validator, Figma,
  dependency, data, hosted, stage, commit, push, deploy, or deletion mutation.

| Check                         | Scenario/environment                                         | Result            | Evidence                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing-item reconciliation  | Completed foundation, Product, DS-reference, Inspector items | Passed            | New task supersedes none; it consumes their established source/provenance contracts and plans the later taxonomy reduction.                                   |
| Registry census               | Current working-tree source                                  | Passed            | 23 total, 18 reusable/selectable, five component-bound.                                                                                                       |
| Consumer/font census          | Current `src` reachability                                   | Passed            | 28 micro/section-subtitle files, 13 serif/direct-display files, 24 mono-modifier uses across 13 files, and representative contradictory overrides identified. |
| Manifest baseline             | Current generator `--check`                                  | Passed            | 43 primitives, 41 semantics, 18 current Text Styles.                                                                                                          |
| DS validator baseline         | Current package validator                                    | Passed            | 321 files; current 18-style/four-UI-title contract is coherent before migration.                                                                              |
| DevTools impact map           | Registry → provenance/options/picker/draft/batch/prompt      | Passed            | Exact role-id and behavior dependencies recorded above.                                                                                                       |
| Browser implementation replay | Target roles and migrated consumers                          | Not run by design | No runtime values or consumers changed; required per-slice and cross-surface browser proof is specified.                                                      |
| Global QA/release/Figma       | Hosted or downstream acceptance                              | Not run           | Separate owner/gate; no readiness claim.                                                                                                                      |

- **Next owner:** Product, to inspect current role state and propose the first bounded DESIGN SYSTEM
  dispatch under the confirmation rule.
- **Blockers:** no design decision remains. Dirty-source ownership reconciliation and Admin/internal
  lane assignment are implementation routing gates.

## Layout Slice 5 Completion Receipt — 2026-08-12

- **Task and mode:** Typography Slice 5 — Admin/internal presentation adoption; Tracked.
- **Stage:** Slice 5 completed. The parent item remains `in_progress` for the separately routed
  Design System zero-reachability deletion/font cleanup and later independent cross-surface
  acceptance.
- **Role file:** `agents/layout.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` for consumer adoption and
  `skills/hito-qa-browser-regression/SKILL.md` for the required focused browser proof.
- **Task artifact:** this canonical parent item. No supporting plan, new runtime artifact, helper,
  wrapper, token, registry entry, CSS recipe, fixture, or compatibility path was added.
- **Subagent:** one existing named `ROLE: QA` performed the required bounded read-only independent
  replay after the source stabilized. It did not edit product source, task artifacts, fixtures, or
  Git state and did not spawn another agent.
- **Execution preflight and evidence:** the six named Admin owners started clean. The source
  discriminator found 86 exact legacy/provenance class references: 11 Body, four Field Error, 20
  Field Helper, one Field Success, 21 Label, one List Row Copy, two List Row Title, seven Micro
  Label, six Modal Title, one Page Title, and 12 Technical Mono. It also found 26 direct
  family/size/leading/tracking utilities plus functional serif presentation through the raw
  `font-display`, Admin brand, and workbench-location seams.
- **Product outcome:** Admin sign-in, workspace identity, analytics, capture, menus, rows, feedback,
  and technical readbacks now render through accepted Poppins UI/Body/Label roles and truthful
  JetBrains Mono or component-bound measured-data anatomy. No Admin functional serif presentation
  remains in the scoped consumers.
- **Root cause and canonical owner:** the shared 14+4 typography contract was already correct. The
  first incorrect owners were the six Admin renderers, which still composed non-selectable legacy
  classes or direct serif/geometry overrides. The fix reuses the accepted target classes directly at
  those elements; shared CSS, registry, primitives, and component contracts remain read-only.
- **Removal and replacement:** all 86 scoped legacy references and the contradictory adopted-role
  family/size/line-height/tracking utilities were removed. The final six-file target census is one
  Body LG, 26 Body MD, one Body SM, 26 Body XS, 23 Label MD, seven Label SM, 12 Technical SM, seven
  UI Title MD, one UI Title XL, and two UI Title XS consumers. `hito-admin-brand` and
  `hito-workbench-location-title` retain their existing layout anatomy while an accepted role on the
  same rendered owner makes their typography provenance and computed family truthful.
- **Files inspected:** `AGENTS.md`, `agents/layout.agent.md`, both matching project skills, the
  complete canonical item, the current dirty tree, the six named Admin files, canonical target-role
  CSS, relevant Admin/workbench/menu/data-table/field component anatomy, and the focused diff.
- **Files changed:** `src/routes/admin.login.tsx`, `src/routes/admin.capture.tsx`,
  `src/routes/admin.analytics.tsx`, `src/components/admin/AdminAnalyticsPanels.tsx`,
  `src/components/admin/AdminOperationalComponents.tsx`,
  `src/components/admin/AdminWorkspaceNav.tsx`, and this canonical item.
- **Preserved boundaries:** route state, loaders, mutations, authentication, authorization, Admin
  data/readback truth, copy, heading semantics, menu/dialog handlers, focus contracts, tables, API
  and Backend contracts, Product/Marketing/DevTools/Design System/Figma sources, fixtures, providers,
  hosted state, dependencies, Git lifecycle, and unrelated dirty work were not changed.
- **Browser path preflight:** focused Implementation DoD used the fresh managed production artifact
  in local `qa_fixture` mode. The built-in browser covered the authenticated desktop/mobile and
  Light/Dark matrix; Chrome supplied independent physical-key evidence for sign-in focus order and
  password visibility. No hosted state, provider, real user data, deletion, or Admin data creation
  was used.

| Check                                           | Scenario / environment                                                                         | Result  | Evidence                                                                                                                                                                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped legacy reachability                      | Exact six named Admin files                                                                    | Passed  | The 86 exact legacy/provenance class references and scoped raw `font-display`/legacy menu metadata forms are zero.                                                                                                                  |
| Target ownership and override audit             | Current class composition                                                                      | Passed  | 106 accepted role consumers; zero adopted role combined with a contradictory local family, size, line-height, or tracking utility. Existing Nav/Menu, Status, data-table, field, and measured-data anatomy remains component-owned. |
| Formatting and lint                             | Exact six source files                                                                         | Passed  | Focused Prettier check and ESLint returned no findings.                                                                                                                                                                             |
| Product and Design System validators            | Current checkout                                                                               | Passed  | `validate-product-contracts` passed both existing product proofs; `validate-hito-ds-components` passed across 324 files with 14 Text Styles and five UI Title roles.                                                                |
| Production build                                | Uncontended current source                                                                     | Passed  | Client, SSR, Nitro, and postbuild completed successfully. The build intentionally stopped the older built server before QA restarted the fresh artifact. Existing chunk-size/import warnings remained non-gating.                   |
| Desktop browser                                 | Sign-in, all six analytics sections, tables/menus, capture and quick-note feedback; Light/Dark | Passed  | Poppins UI/Body/Label and truthful JetBrains Mono computed styles; safe feedback, visibility control, sorting/filtering/theme/account menus, 73 capture rows, detail expansion, contained overlays, and zero document overflow.     |
| Mobile browser                                  | Exact 375×812 on the same Admin inventory; Light/Dark                                          | Passed  | Workspace/header/nav, sign-in, analytics tables with internal scrolling, capture rows/detail/overlay, typography, and document containment passed.                                                                                  |
| Keyboard and focus                              | Login plus capture status tabs                                                                 | Passed  | Physical Tab/Enter proved login field and visibility-control focus; ArrowRight moved capture status selection, URL state, focus, and roving `tabindex`. Source focus contracts were unchanged.                                      |
| Console and provider boundary                   | Managed loopback `qa_fixture`                                                                  | Passed  | 170 observed events, zero failures, zero provider events, and zero browser warnings/errors. Final server state was managed, compatible, loopback-bound, healthy, and artifact-fresh.                                                |
| Diff hygiene                                    | Current dirty tree                                                                             | Passed  | `git diff --check` returned no whitespace error. Only the six clean Admin source owners and this task-owned receipt were changed by Slice 5.                                                                                        |
| Global QA, hosted, release, Figma, later slices | Cross-owner/downstream gates                                                                   | Not run | Outside Slice 5. No Global QA Acceptance, hosted parity, release readiness, deployment, Figma parity, Slice 6 completion, staging, commit, or push claim is made.                                                                   |

- **Independent QA verdict:** Passed. Screenshots are local-only under
  `qa-artifacts/screenshots/2026-08-12/typography-slice-5-admin/` (20 desktop/mobile Light/Dark
  captures). The managed server was left healthy in `qa_fixture` mode.
- **Coverage gap and consequence:** the available authenticated browser surfaces could not inject a
  physical Escape/focus-return sequence into Radix menus, and Chrome detached after local login.
  Menu opening, selection, dismissal, focus-bearing triggers, unchanged source focus contracts,
  capture status-tab keyboard behavior, and physical login/password-control paths were verified;
  independent physical Radix-menu Escape replay remains unproven. This receipt therefore proves the
  focused presentation slice only and does not establish broad interaction regression coverage.
- **Omitted-check consequence:** checkout-wide TypeScript health was not required or claimed for
  class-only presentation changes; focused lint, validators, build, source reachability, computed
  typography, and browser evidence cover only the named Admin owners.
- **Implementation DoD:** Passed for Slice 5 with the explicit Radix-menu keyboard evidence
  limitation above. Global QA Acceptance remains pending.
- **Next owner:** Product, to review this receipt and route Slice 6 to the existing DESIGN SYSTEM
  owner only after confirming availability and requiring a fresh repository-wide consumer census.
- **Blockers:** none for Slice 5. Parent completion remains blocked by the separately owned Slice 6
  cleanup and Slice 7 independent cross-surface acceptance.

## Design System Slice 6 Execution — 2026-08-12

### Execution preflight

- **Outcome:** remove the temporary typography bridge after a fresh repository-wide census while
  retaining only source-backed component anatomy and the accepted 14 reusable + four
  component-bound role contract. The parent remains open for independent Slice 7 acceptance.
- **Existing seam and smallest change:** reuse `src/lib/hito-typography-roles.ts`, canonical
  typography/component CSS, the generated-manifest path, existing Inspector registry derivation,
  the DS validator and `/hitoDS` references. Migrate only the remaining Design System/shared UI
  consumers, remove zero-reachable generic aliases and registry bridges, and make retained
  component selectors emit target provenance.
- **New runtime artifacts:** none. No role, token, helper, wrapper, registry, compatibility layer,
  Product behavior, Figma mapping, or dependency is added.
- **Fresh runtime census:** excluding the registry/generated output, every remaining legacy class
  consumer is confined to `src/components/hito-ds/` or `src/components/ui/`; Product, Marketing,
  Admin and DevTools presentation contain zero. The exact direct-reference totals are 2 UI Page,
  3 UI Modal, 17 UI Section, 20 UI Panel, 2 Display, 1 editorial Page/Modal/Section/Panel each,
  72 list-row titles, 24 Body aliases, 73 Body Small/list-row-copy references, 17 Field helpers,
  99 Captions, 103 Labels, 19 Form Labels, 26 Micro/section-subtitle labels, 30 Technical Mono and
  13 Field error/success references.
- **Deletion discriminator:** all 19 registry bridges remain non-selectable/non-exported despite
  manifest parity already containing only the 14 target styles. Generic title/body/caption/label/
  micro/technical aliases are migration-only and will be deleted after their DS consumers reach
  zero. `hito-list-row-title`, `hito-list-row-copy`, Field helper/error/success,
  Dialog/Sheet/Menu and shell label selectors remain live component anatomy; their legacy
  provenance ids will be replaced with the appropriate Body/UI/Label target rather than deleting
  a real component contract.
- **Font discriminator:** repository source has zero `font-weight: 300`, `font-light`,
  `font-[300]` or equivalent consumers. Fraunces is used at weight 400 only; Poppins still requires
  400/500/600 and JetBrains Mono still requires 400/500. The Google request can therefore remove
  Poppins 300 and Fraunces 300/500 without synthetic weight loss.
- **Baseline proof:** manifest check passed at 14 Text Styles, the full DS validator passed across
  324 files, and `git diff --check` was clean before Slice 6 source edits.
- **Stop condition:** preserve any bridge whose refreshed runtime or provenance reachability does
  not become zero; stop before a Product/Marketing/Admin behavior edit, new shared contract,
  persistence/provider/hosted boundary, Figma mutation or incompatible dirty-hunk rewrite.

### Tracked implementation receipt

- **Task and stage:** Typography Scale Consolidation And Adoption, Slice 6 — zero-reachability
  deletion and font cleanup. Slice 6 is complete; the parent remains `in_progress` for Slice 7.
- **Product outcome:** the canonical typography owner now contains exactly 14 reusable roles and
  four recognition-only component roles. Temporary bridge metadata, generic legacy CSS aliases,
  obsolete DS specimens and stale Inspector recognition paths no longer present removed roles as
  current or selectable truth.
- **Demonstrated root cause:** the earlier owner slices had removed Product, Marketing, Admin and
  DevTools presentation consumers, but the central registry still retained 19 temporary bridges and
  `/hitoDS` plus shared UI source still consumed their generic classes/provenance. The refreshed
  census proved those final consumers were migration residue at the shared Design System owner, not
  a remaining Product requirement.
- **Source census:** before deletion the remaining direct references were 2 UI Page, 3 UI Modal, 17
  UI Section, 20 UI Panel, 2 Display, one editorial Page/Modal/Section/Panel each, 72 list-row
  titles, 24 Body aliases, 73 Body Small/list-row-copy references, 17 Field helpers, 99 Captions,
  103 Labels, 19 Form Labels, 26 Micro/section-subtitle labels, 30 Technical Mono and 13 Field
  error/success references. Product, Marketing, Admin and DevTools presentation were already zero.
  The final exact-boundary census reports zero retired generic class consumers and zero retired
  provenance ids across runtime CSS, TypeScript/TSX, manifests, Inspector recognition, validator
  expectations and rendered Foundations specimens.
- **Deleted inventory:** 19 `legacy-bridge` registry entries; generic contextual title aliases;
  `hito-page-copy`, Body/Body Small/support/caption aliases; separate form/micro/technical aliases;
  stale timeline rules tied to removed aliases; the obsolete Figma export filter that hid valid
  target styles; and Poppins 300 plus Fraunces 300/500 from the Google Fonts request. No manifest
  record for a retired role remains.
- **Retained reachable inventory:** UI Title XL/LG/MD/SM/XS, Display Title XL/LG, Body
  LG/MD/SM/XS, Label MD/SM and Technical SM remain the 14 reusable roles. Button, Nav/Menu, Metric
  and Status remain the four non-selectable component roles. Live list-row title/copy, Field
  helper/error/success, editable feedback, Dialog/Sheet title/description, menu label and shell
  brand selectors remain component anatomy, now emitting the matching Body/UI/Label target
  provenance. Technical mono remains reserved for factual identifiers and measurements; approved
  editorial Display and timeline exceptions remain unchanged.
- **Files changed:** the central typography registry; root font import; canonical typography,
  Field, list, overlay, shell and onboarding CSS; existing `/hitoDS` renderers and Figma export
  board; seven shared UI renderers; two existing Local Inspector recognition seams; the generated
  TypeScript/JSON manifests; and the existing Design System validator. No runtime file, role,
  token, helper, wrapper, registry or compatibility layer was added.
- **Preserved boundaries:** Product behavior/copy, Backend, persistence, providers, hosted state,
  Figma, shared component semantics and unrelated dirty work were not changed. No staging, commit,
  push or deployment occurred.

| Check                                | Scenario / environment                                                                    | Result  | Evidence                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero reachability                    | Repository runtime source, CSS, registry, generated provenance, Inspector and Foundations | Passed  | Retired generic class search and all 19 retired provenance ids are zero; validator guards exact-boundary class and provenance reachability.                                                              |
| Retained anatomy                     | Shared list, Field, overlay and shell selectors                                           | Passed  | Live selectors remain and resolve only through Body MD/SM/XS, UI Title MD, Label MD/SM or the four component-bound ids.                                                                                  |
| Font cleanup                         | Current source and Google request                                                         | Passed  | No 300-weight consumer exists. Request is exactly Poppins 400/500/600, Fraunces 400 and JetBrains Mono 400/500; rendered family specimens reported loaded.                                               |
| Manifest generation/parity           | Generator write then `--check`                                                            | Passed  | 43 primitive colours, 41 semantic colours and exactly 14 Text Styles; TypeScript/JSON parity passed.                                                                                                     |
| DS contract                          | Full `validate-hito-ds-components`                                                        | Passed  | 324 files scanned; exact 14 reusable/four component roles and no bridge/provenance return.                                                                                                               |
| Formatting and lint                  | Focused Prettier and ESLint                                                               | Passed  | All task-touched TS/TSX/CSS paths passed.                                                                                                                                                                |
| Diff hygiene                         | `git diff --check`                                                                        | Passed  | No whitespace errors.                                                                                                                                                                                    |
| Production build                     | Fresh uncontended `npm run build`                                                         | Passed  | Client, SSR, Nitro and postbuild finalization completed. Existing chunk-size warning is informational and outside this typography slice.                                                                 |
| Foundations browser matrix           | `/hitoDS/foundations#typography`, 1470×801 and exact 375×812, Light/Dark                  | Passed  | Independent QA completed all four cells: 14 reusable cards, four component examples, three family specimens, no obsolete specimen, overflow or console warning/error.                                    |
| Inspector provenance and interaction | Canonical embedded Inspector specimen, desktop/mobile                                     | Passed  | Body MD and component-bound Button were recognized; picker exposed Keep current plus exactly 14 targets and excluded Button. Arrow navigation, selection, clear, Escape and visible focus return passed. |
| Foundations copy action              | Typography/provenance specimen, desktop Light                                             | Passed  | Copying `text-secondary` produced `Copied color token text-secondary: var(--text-secondary)`; subsequent Tab focus remained visible on `Find in Hito DS`, with no console warning/error.                 |
| Managed runtime                      | Canonical loopback QA server after proof                                                  | Passed  | Healthy/current artifact restored on `127.0.0.1:3000` in `qa_fixture` mode.                                                                                                                              |
| Global QA, hosted, release and Figma | Cross-owner/downstream gates                                                              | Not run | Outside Slice 6. This receipt does not claim Global QA Acceptance, hosted parity, release readiness, deployment, Product adoption or Figma parity.                                                       |

- **Independent review:** existing ROLE QA performed a bounded read-only source and browser review.
  It found no task-owned defect and passed the focused Slice 6 Implementation DoD matrix.
- **Remaining gaps:** no required Slice 6 source, build or responsive browser check is omitted.
  The final bounded Foundations Copy activation result is recorded above. Programme-level
  cross-surface acceptance remains intentionally unclaimed and is the independent Slice 7
  responsibility.
- **Next owner:** QA for Slice 7 cross-surface acceptance.
- **Blockers:** none for Slice 6. The parent task remains open only for Slice 7.

## QA Typography Slice 7 Independent Cross-Surface Acceptance — 2026-08-12

- **Task / mode / stage:** Hito DS Typography Scale Consolidation And Adoption; Tracked; Slice 7
  independent cross-surface acceptance.
- **Validation layer:** independent programme-level local QA for the completed typography slices.
  This is not hosted, deployment, release, production, Figma, or repository-wide Global QA.
- **Execution preflight:** `HEAD` and `origin/main` were both
  `ee4fde5c1bda4a7cb5477bcf1a8ce90d9e50674d`. The accepted multi-slice dirty checkout was inventoried
  before testing and preserved. Its content fingerprint remained
  `6e687113e953155776db458e90c48747a874560c9ae3697f5a885392fa6fb1db` immediately before this receipt;
  no concurrent source-content movement was detected. QA changed only this lifecycle receipt and
  saved screenshots.
- **Browser path preflight:** one managed loopback runtime at `http://127.0.0.1:3000` was used. After
  the fresh build it was restarted through the canonical manager in `qa_fixture` mode before Product
  browser replay. Final status was `current`, `managed: true`, `compatible: true`, `loopbackBind:
true`, `healthy: true`, `providerMode: qa_fixture`, `artifactFreshness: fresh`, and
  `freshnessReason: receipt_matches`. The supported in-app browser supplied desktop 1440×900 and
  exact 375×812 control without a platform prompt.
- **Product outcome:** the retired typography system is fully replaced by exactly 14 reusable roles
  and four component-bound roles across the accepted Design System, Local Inspector, Product,
  Marketing, and Admin representatives. No typography defect was found.
- **Evidence root:**
  `qa-artifacts/screenshots/2026-08-12/hito-ds-typography-slice-7-cross-surface/`.

| Check                                 | Scenario / environment                                                                                      | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate freeze and runtime          | Current dirty checkout; managed loopback `qa_fixture`                                                       | Passed | `HEAD == origin/main == ee4fde5c`; source-content fingerprint was unchanged through final pre-receipt recheck. Final `qa:server:status` was current, managed, healthy, loopback-only, fresh, and `qa_fixture`.                                                                                                                                                                                                                   |
| Canonical role registry               | Runtime registry plus generated TypeScript/JSON manifests                                                   | Passed | Exact reusable order/count was 14: five UI Title, two Display Title, four Body, two Label, and Technical SM. Exact component-bound order/count was Button, Nav/Menu, Metric, and Status. TypeScript and JSON manifests agreed on the same 14 selectable/exported Text Styles.                                                                                                                                                    |
| Retired reachability                  | Registry, CSS/TS/TSX, generated provenance, Inspector choices, and rendered Foundations                     | Passed | Exact-boundary census returned zero retired role/class/provenance/selector hits. Inspector exposed only `Keep current` plus the 14 targets; no component-bound or retired target was selectable.                                                                                                                                                                                                                                 |
| Static contracts                      | Generator check, full DS validator, Product contracts, and Changelog/history contract                       | Passed | Generator reported 43 primitive colours, 41 semantic colours, and 14 Text Styles. DS validation scanned 324 files and confirmed 14 reusable roles/five UI title tiers. Product-contract and Changelog/history validation passed.                                                                                                                                                                                                 |
| Formatting and diff hygiene           | Focused Prettier plus checkout diff                                                                         | Passed | All directly relevant registry/manifest/validator/DS/DevTools/Product/Marketing/Admin paths passed Prettier; `git diff --check` passed before and after browser work.                                                                                                                                                                                                                                                            |
| Production artifact                   | Fresh `npm run build` plus output-integrity gate                                                            | Passed | Client, SSR, Nitro, and postbuild completed. Integrity reported 210 runtime `.mjs` files, 3,183 relative imports, 303 repository documents, and digest `437af7a95e42211001ac1fe81da7740b84449431cde617ee04c2e66567c55a12`. The existing chunk-size warning was informational and not typography-owned.                                                                                                                           |
| Design System typography              | `/hitoDS/foundations#typography`; desktop Light and exact 375×812 Dark                                      | Passed | All 14 reusable and four component-bound examples rendered with truthful Poppins/Fraunces/JetBrains families and role geometry. Display remained visible; samples wrapped; document width equalled viewport width. Evidence: `desktop-1440x900-light-foundations-typography.png`, `mobile-375x812-dark-typography-scale.png`.                                                                                                    |
| Local Inspector recognition           | Confirmed Body MD, component-bound Button, inherited text, and Custom specimen                              | Passed | Current labels/specs were correct; component recognition did not become a selectable Text Style; visually similar Custom text remained Custom. Mobile inspector stayed within 375×812. Evidence: `mobile-375x812-dark-inspector-body-md.png`.                                                                                                                                                                                    |
| Local Inspector interaction           | Replacement picker, native keyboard, clear, Escape, and focus                                               | Passed | Picker contained `Keep current` plus exactly 14 target options. Native Enter selected Technical SM and returned focus to the trigger; pending Remove typography restored Body MD without changing the saved draft; Escape dismissed the picker.                                                                                                                                                                                  |
| Product hierarchy and anatomy         | Authenticated Calendar shell/menu/dialog at 375×812 Dark; desktop Settings Fields and History list in Light | Passed | Calendar/page headings, shell Nav/Menu, Manual workout Dialog, Field labels/helpers, list rows, status, dates, and measured values resolved to the intended roles. Menu and Dialog remained contained; Escape paths were usable; no Product data was saved. Evidence: `mobile-375x812-dark-product-calendar-shell.png`, `desktop-1440x900-light-product-settings-fields.png`, `desktop-1440x900-light-product-history-list.png`. |
| Marketing and editorial exceptions    | Desktop Dark Changelog; exact 375×812 Light Hub                                                             | Passed | Approved Changelog Display/timeline anatomy used Fraunces; functional card headings used Poppins UI tiers; Hub Display and Body roles were truthful and contained. Evidence: `desktop-1440x900-dark-marketing-changelog.png`, `mobile-375x812-light-marketing-hub.png`.                                                                                                                                                          |
| Admin sign-in and authenticated views | Exact 375×812 Light sign-in/Overview; desktop Dark Overview                                                 | Passed | Sign-in and analytics hierarchy/navigation used Poppins; generated timestamp used Technical SM; document containment passed. Native Escape dismissed the authenticated account menu and returned focus. The temporary Admin session was signed out. Evidence: `mobile-375x812-light-admin-sign-in.png`, `mobile-375x812-light-admin-authenticated-overview.png`, `desktop-1440x900-dark-admin-authenticated-overview.png`.       |
| Technical, Metric, and tone truth     | Product measurements/dates, Admin timestamp, component specimens, and two-theme representatives             | Passed | JetBrains Mono was limited in observed states to factual identifiers/measurements; Metric remained component-bound; ordinary body copy did not acquire mono styling. Status and semantic tones composed independently from typography.                                                                                                                                                                                           |
| Responsive and browser health         | Cross-surface desktop/mobile Light/Dark matrix                                                              | Passed | All tested documents had no page-level horizontal overflow; permitted Admin navigation/table internals stayed inside their owners. Final accumulated browser warning/error log was empty. Browser viewport was reset and QA tabs were closed.                                                                                                                                                                                    |
| Data and ownership preservation       | Existing local authenticated Product fixture and temporary Admin authentication                             | Passed | No Product record, fixture lifecycle, provider, source, dependency, generated file, Figma object, hosted state, Git stage, commit, push, or deployment was changed. The existing Product session was preserved.                                                                                                                                                                                                                  |

- **Defects:** none.
- **Coverage gaps and consequences:** browser replay was risk-derived and representative, not an
  exhaustive visual pass over every route or every consumer in all four viewport/theme
  permutations. Static reachability and the completed owner-slice receipts cover the wider consumer
  inventory, but unvisited route-specific visual drift is not independently claimed. Browser zoom
  was not separately replayed, so this receipt makes no zoom-specific visual claim. Figma and hosted
  environments were intentionally not accessed; no Figma or hosted parity follows from this pass.
- **Independent review:** no subagent was used; the assigned QA owner performed the independent
  static, build, runtime, and browser replay directly.
- **Role file and skill:** `agents/qa.agent.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Canonical artifact:**
  `docs/tasks/backlog/2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`.
- **Next owner:** PRODUCT for programme review only. Optional Figma alignment requires a separate
  explicitly approved DESIGN SYSTEM INTEGRATION handoff.
- **Blockers:** none.
- **Verdict: Passed.**
