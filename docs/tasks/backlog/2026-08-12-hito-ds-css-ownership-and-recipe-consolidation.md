# Hito DS CSS Ownership And Recipe Consolidation

## Work Item ID

2026-08-12-hito-ds-css-ownership-and-recipe-consolidation

## Status

completed

## Type

design-system-architecture

## Priority

high

## Owner

design-system

## Mode

Tracked

## Scope

Establish one authoritative ownership hierarchy for Hito CSS tokens and reusable visual recipes,
without merging all styles into one monolithic stylesheet. The work owns shared Design System CSS,
its import boundary, token/recipe classification, and `/hitoDS` evidence. Product route behavior,
copy, Backend state, persistence, Figma, and unrelated dirty work remain outside scope.

## Archive Intent

retain_in_place

## Task

Reduce ambiguity between global Hito Foundation tokens, component contracts, and domain-local CSS
variables. Preserve domain-separated CSS files where each has one clear owner; remove only
duplicated or globally leaking definitions after source-backed reachability proof. The desired
result is an explicit CSS hierarchy, not a cosmetic reformat or rewrite.

## User Report

Ivan reports that the application appears to have too many CSS files and no clear single source of
truth. The Design System must be authoritative for shared colour, typography, spacing, radius,
motion, edge, and reusable component recipes, while local composition remains visibly bounded.

## Product Source Audit — 2026-08-12

### Confirmed facts

- `src/styles.css` is the sole stylesheet entrypoint. It imports nine domain files in one explicit
  order: Foundations, reference workbench, overlays, typography/layout, fields, onboarding,
  lists, shell/admin, and calendar states.
- The CSS surface is not nine independently loaded systems: it is one cascade entrypoint with
  `8,919` stylesheet lines.
- `src/styles/foundations.css` is the existing primitive/semantic foundation owner. It contains
  active `:root`/theme mappings and `523` custom-property declarations.
- Extra global declaration sites exist in `layout-typography.css` (`40` declarations),
  `forms-onboarding.css` (`65`), and `shell-admin-analytics.css` (`28`). All three use `:root` for
  some owner-local geometry or domain recipes.
- Three custom properties are declared by more than one CSS module:
  `--hito-dual-range-accent`, `--hito-inline-header-min-width`, and the provenance marker
  `--hito-typography-role`. Their equivalence is unproven; matching names are not enough to merge.
- `forms-onboarding.css` has a large Manual Workout variable ladder, including local
  `color-mix()` surface/edge/hover recipes. It is the first candidate for neutral-chrome convergence
  after the accepted Foundation overlay ladder, but only after consumer/state proof.
- Some TSX renderers declare custom properties inline. They may be valid instance data; none is
  promoted to a global token without repeated cross-owner need.

### Decision

The diagnosis is partly confirmed.

1. Multiple CSS files are correct when each owns a distinct layer or component family. A single
   massive stylesheet would not create a single source of truth.
2. The authoritative boundary is incomplete because owner-local values and reusable recipes leak
   through several `:root` blocks and partially repeat Foundation vocabulary.
3. The root fix is an ownership and reachability-based consolidation, not component-by-component
   restyling or a mechanical file merge.

## Designer Review Gate — CSS Ownership And Interface-Conflict Audit

This stage is a read-only design/architecture decision gate. It must distinguish the confirmed
ownership risk from a demonstrated causal explanation for a specific visual conflict. Multiple CSS
modules and a single CSS entrypoint are not, by themselves, a defect. The review must identify
which current patterns can plausibly cause cascade or token-recipe divergence, which are simply
well-bounded domain composition, and which source/DOM discriminator would be required before
claiming a visible conflict has this cause.

The DESIGNER must research current primary design-system guidance on token layering, component
contracts, scoping, and cascade management, then record a Hito-specific recommendation in this
item. The recommendation must be incremental and reuse the existing Foundation/semantic-token
system; it must not propose a CSS mega-file, a new styling framework, CSS-in-JS, a parallel token
registry, or a visual rewrite.

Required decision evidence:

1. Assess the four-level hierarchy in this item — Foundation, canonical component contract, domain
   composition, and instance data — against current practice, with direct source links for any
   external guidance used.
2. Review the actual candidates: non-Foundation `:root` declarations, the Manual Workout
   `color-mix()` ladder, the dual-range and inline-header duplicate names, imported cascade order,
   and TSX inline custom-property cases. Separate confirmed duplication/leakage from name-only
   coincidence or valid renderer data.
3. Identify the smallest safe ownership rules: when an external `:root` declaration is justified;
   when a reusable recipe belongs in Foundation versus a canonical component; and when it must stay
   scoped to a product domain. Explain how the rules prevent the observed class of UI conflict.
4. Propose a prioritized, net-reducing implementation sequence for DESIGN SYSTEM, including
   explicit deletion conditions and the exact facts that should stop the work from moving a
   non-equivalent domain state.
5. State whether any currently reported visual conflict is proved to arise from CSS ownership. If
   not, list the exact browser/source discriminator required; do not turn an architectural risk into
   a false causal claim.

This review may update only this canonical task's decision/stage/next-owner material. It must not
edit runtime source, CSS, validators, generated manifests, Figma, or history, and it must not
dispatch implementation. PRODUCT will route the accepted recommendation to DESIGN SYSTEM.

## Required CSS Hierarchy

1. **Foundation (`foundations.css`)** — sole source for raw primitives, semantic theme mappings,
   alpha/overlay roles, spacing, radius, typography families, motion, and shared edge values.
2. **Canonical component contracts** — existing component-family files consume Foundation roles and
   define component anatomy. They do not define a parallel primitive/semantic palette or global
   typography/radius/edge scale.
3. **Domain composition** — onboarding, shell/admin, calendar, and reference workbench own layout
   geometry and state composition only when it is not a reusable Design System decision. Such
   variables are scoped to their actual owner rather than `:root`, unless consumer proof shows they
   are genuinely cross-owner.
4. **Instance data** — inline CSS custom properties remain local when they encode calculated
   positions, percentages, or renderer-specific data. They are not system tokens by default.

## Existing Seams To Reuse

- `src/styles.css` — one import-order owner; retain one intentional entrypoint.
- `src/styles/foundations.css` — primitive, semantic, theme, alpha, typography-family, spacing,
  radius, motion, and shared edge authority.
- `src/styles/controls-fields.css`, `controls-lists.css`, `overlays-feedback.css` — component
  family contracts.
- `src/styles/forms-onboarding.css`, `shell-admin-analytics.css`,
  `calendar-state-surfaces.css`, `layout-typography.css`, and `reference-workbench.css` — domain
  composition and current global-leak candidates.
- Existing Hito DS manifest generator and component-contract validator — extend only if a repaired
  ownership invariant cannot otherwise be protected. Do not add a parallel CSS registry.
- `/hitoDS/foundations` and existing component specimens — live proof for changed shared contracts.

## Required Execution Sequence

1. **Ownership map:** classify every non-Foundation custom-property declaration as Foundation,
   canonical component, domain composition, instance-data support, duplicate candidate, or dead.
   Record the decision, consumers, and replacement/removal condition in this item.
2. **Root-leak discriminator:** for each `:root` declaration outside Foundations, prove whether it
   has cross-owner consumers. Move it to Foundations only when it is a shared DS role; otherwise
   scope it to the real CSS owner or remove it after zero-reachability proof.
3. **Recipe convergence:** inspect repeated neutral surface/edge/hover formulas, starting with
   Manual Workout and dual-range aliases. Reuse existing semantic overlay/edge roles only where the
   parent surface and state match. Keep a domain formula when a measured distinction requires it.
4. **Deletion:** remove obsolete aliases, duplicate declarations, and superseded local recipes only
   after zero-reachability evidence. Do not retain compatibility variables without a factual
   consumer and removal condition.
5. **Guardrail:** add the smallest existing-validator or manifest assertion only for an ownership
   rule that was actually repaired; do not add literal bans or style-count targets.
6. **Reference:** update `/hitoDS` only when an exposed shared token or component contract changes.
   Do not turn it into an internal CSS debugger.

## What Not To Touch

- Do not merge the nine CSS modules into a mega-file or reorder imports without a demonstrated
  cascade dependency.
- Do not introduce a new token for every current local variable, a parallel token file, Tailwind
  config layer, CSS-in-JS system, compatibility alias layer, generic audit utility, or generated CSS.
- Do not alter Product behavior, DOM structure, copy, Backend/auth/persistence, provider logic,
  Figma, hosted state, deployment, Git history, or unrelated dirty work.
- Do not make a local route appearance canonical merely because it is repeated.
- Do not replace theme-specific accessibility pairings with a one-theme raw-colour shortcut.

## Definition Of Done

1. `foundations.css` demonstrably owns all shared primitive/semantic roles; domain files have
   explicit scoped composition responsibility.
2. Every external `:root` declaration is moved to a proven shared owner, scoped to its true owner,
   or retained with documented cross-owner evidence.
3. Proven duplicate surface/edge/hover recipes converge on existing semantic tokens and the old path
   is deleted. Non-equivalent domain states remain distinct.
4. No CSS-file merge, styling framework, or unbounded token growth occurs.
5. Focused Dark/Light desktop and exact 375×812 proof covers each changed shared contract, with no
   overflow or console errors.
6. Existing DS validator/manifest parity, focused formatting/lint, `git diff --check`, and an
   uncontended build pass. Global QA, release readiness, and Figma parity remain separate.

## Validation Expectations

| Check | Scenario / environment | Required evidence |
| --- | --- | --- |
| Ownership discriminator | All CSS custom-property declarations | Consumer map and classification; no name-only merge decisions |
| Root leakage | Each external `:root` declaration | Cross-owner proof, scoped owner, or zero-reachability deletion |
| Recipe equivalence | Surface, edge, hover, active, and theme contexts | Same semantic parent/state before convergence; distinct cases retained |
| Shared contract | Foundation and component owners | Existing DS validator/manifest parity plus minimal guardrail if justified |
| Browser | Changed DS/product consumers | Desktop and 375×812, Light/Dark, interaction/overflow/console proof |
| Safety | Shared dirty checkout | No unrelated hunk overwritten, staged, committed, pushed, deployed, or hosted mutation |

## Stage

Design System implementation completed on 2026-08-12. The accepted ownership hierarchy is now
enforced by the repaired source owners and focused validator guardrails.

## Next Recommended Role

PRODUCT

## Designer Review Decision — 2026-08-12

### Decision summary

Accept the four-level hierarchy as Hito's ownership model, with one important refinement: it is a
semantic/source-ownership hierarchy, not a requirement to introduce four new CSS cascade layers.
The current `@layer components` arrangement can remain while ownership is repaired through narrow
selectors and explicit component inputs. Adding cascade sublayers, reordering imports, or splitting
another stylesheet is stopped unless matched-rule evidence proves that selector scoping and owner
consolidation cannot resolve a real conflict.

The architectural risk is confirmed, but no currently reported visual inconsistency is proved to be
caused by CSS ownership. Source inspection proves globally exposed owner-local variables and shared
runtime recipes living in a reference-named module. It also proves intentional component-input and
instance-data patterns that must not be removed merely because names repeat. A visual root-cause
claim still requires the browser discriminator defined below.

### Current primary guidance used

- The stable [Design Tokens Community Group Format 2025.10](https://www.designtokens.org/TR/2025.10/format/)
  defines tokens as human-readable design decisions and supports references/aliases. Hito should
  therefore preserve named semantic decisions and reuse references; a CSS custom property is not
  automatically a global design token merely because it has a name.
- [Adobe Spectrum design tokens](https://spectrum.adobe.com/page/design-tokens/) recommends a
  focused token set, semantic aliases where they apply, and component-specific tokens only for
  their owning component. This supports keeping Hito's component inputs out of Foundation and
  prevents a percentage- or route-named token explosion.
- [Carbon colour tokens and layering](https://carbondesignsystem.com/elements/color/overview/)
  keeps role names stable across themes, assigns values by theme, and distinguishes core roles from
  component tokens. This supports Hito's existing theme-resolved Foundation roles and the rule that
  component recipes should consume them rather than copy raw values.
- MDN documents that [custom properties inherit and are scoped by the selector that declares them](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)
  and that [`@layer` order controls precedence between layers](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40layer).
  Hito should use `:root` only for intentionally document-wide contracts and should not treat file
  separation as isolation inside the shared `components` layer.

### Accepted Hito ownership contract

| Level | Canonical responsibility | Allowed custom-property pattern | Rejected pattern |
| --- | --- | --- | --- |
| Foundation | Shared primitives and semantic roles whose meaning survives component, route, parent surface, and theme changes | One semantic name with Light/Dark values or aliases in `foundations.css` | Route geometry, component anatomy, percentage-named aliases, or a local visual recipe promoted only because it repeats |
| Canonical component contract | Component anatomy, states, sizes, and documented input variables that consume Foundation roles | A default on the component root plus bounded consumer overrides, for example `--hito-dual-range-accent` | A parallel primitive palette, unrelated consumers borrowing the component variable, or a `:root` default without cross-owner need |
| Domain composition | Product-specific layout and combinations of canonical components | Variables on the nearest stable domain root, including theme-specific composition when it expresses a measured domain distinction | Owner-local geometry at `:root`, or a local formula presented as a universal DS role without state/parent equivalence |
| Instance data | Calculated position, progress, renderer identity, or a documented component input for one instance | Inline custom properties whose values come from runtime data or existing semantic token references | Inline hard-coded theme colours, backgrounds, borders, or local semantic alternatives that bypass the canonical component contract |

Foundation remains the authority for the value vocabulary; a canonical component remains the
authority for how that vocabulary forms a component state. Domain CSS may set a component input but
must not redefine the component's internal state model. Instance data may choose a documented input
value but must not create a second styling API.

### Source-backed classification

#### Non-Foundation `:root` declarations

The earlier file-level counts include all custom-property declarations in those files. The actual
external `:root` surface is 24 declarations: four in `forms-onboarding.css`, seven in
`layout-typography.css`, and thirteen in `shell-admin-analytics.css`.

| Classification | Current declarations | Evidence and decision |
| --- | --- | --- |
| Confirmed owner-local global-scope leakage | `--hito-manual-workout-title-min-width`, `--hito-manual-workout-step-summary-min-width`, `--hito-manual-workout-menu-width-add`, `--hito-manual-workout-menu-width-step`; six layout aliases for route support, two skeleton heights, form label width, and two readback widths; eleven shell/admin aliases for three shell menu widths, standard menu width, quick-note width, three data-table code widths, action width, note width, and tooltip width | Each has declarations and consumers in one current CSS owner and no TS/TSX setter. A document-wide scope is not justified. Scope it to the nearest owner when inheritance is useful, or delete the one-use alias and keep the value in its owning selector. Do not move these 21 values to Foundation. |
| Justified cross-owner structural contract, pending tighter canonical owner | `--hito-shell-sidebar-width`, `--hito-mobile-bottom-nav-height` | The shell owner consumes both; Manual Workout uses them for sheet offset/safe bottom space, and the workbench aliases the sidebar width. They express App Shell geometry, not Foundation primitives. Retain them until the implementing owner proves a common ancestor or a component API that can replace document scope. |
| Justified cross-owner component/layout contract, pending owner decision | `--hito-form-section-avatar-width` | `layout-typography.css` uses it for the avatar grid while `shell-admin-analytics.css` uses it for avatar tile/profile dimensions. Do not inline two copies or promote it as a general spacing token. The implementation must either give the avatar/form contract one canonical owner or retain the root declaration with these consumers documented. |

No external-root name currently collides with a Foundation declaration. Therefore the source proves
scope ambiguity and future collision risk, not a present value override.

#### Shared recipes in `reference-workbench.css`

This is confirmed ownership leakage rather than a name-only concern:

- `.hito-surface` is consumed by login, completion, and the canonical popover in addition to DS
  reference pages.
- `.hito-surface-flat` is consumed by Auth, Admin, Settings, Completion, workout-completion, and DS
  references.
- `.hito-shell-profile-trigger` has its visual, hover, and focus recipe grouped with
  `.hito-surface-quiet` in `reference-workbench.css`, while its layout and disabled behavior live
  later in `shell-admin-analytics.css`.
- `.hito-icon`, `.hito-logo`, and `.hito-logo-mark` are canonical runtime component recipes whose
  definitions also live in the reference-named file.

The first two are established shared surface contracts, not reference-only composition. The shell
trigger is a split owner. `.hito-surface-quiet` itself currently has only DS-reference consumers and
may remain reference-scoped until a runtime consumer or explicit shared decision appears. Do not
move the whole file or manufacture a generic surface-token family; relocate each proved runtime
contract to its existing canonical owner and delete only its old rule.

#### Manual Workout `color-mix()` ladder

The ladder is correctly scoped to `.hito-manual-workout-editor` and
`.hito-manual-workout-document-preview`, with a Light-theme override on the same domain roots. It is
not a global token leak. It composes editor canvas, surface, muted surface, rows, repeat blocks, add
strips, nested surfaces, fields, and edges from existing Hito semantic roles.

The risk is divergence, not scope: the editor overrides `.hito-field-secondary` default, hover, and
focus backgrounds and maintains parallel Dark/Light recipes. Numeric mixes such as 42% are not, by
themselves, evidence of a bad design decision. Convergence is allowed only one semantic state at a
time after computed-colour, contrast, and containment evidence shows the same parent/state meaning
as an existing Foundation or Field role. Canvas and real containment/elevation remain absolute
semantic surfaces when that distinction is intentional.

#### Repeated custom-property names

| Name | Classification | Decision |
| --- | --- | --- |
| `--hito-dual-range-accent` | Valid canonical component input plus domain override | `controls-lists.css` owns the default. Heart-rate lanes set a workout semantic colour on an ancestor so the range and zone marker inherit one identity. Keep; do not merge workout semantics into the control default. |
| `--hito-inline-header-min-width` | Valid canonical size/input contract plus domain override | `controls-fields.css` defines size defaults; the Manual Workout title wrapper supplies its bounded title width. Keep while the domain value remains necessary. |
| `--hito-typography-role` | Proven provenance metadata, not a value token | Multiple canonical type/component classes intentionally stamp the role inspected through `HITO_TYPOGRAPHY_PROVENANCE_PROPERTY`. Keep declarations per role. Exempt this marker from duplicate-token checks. |

Matching names therefore do not demonstrate duplicated authority. None of the three is eligible for
deletion without first removing or replacing its distinct consumer contract.

#### Cascade and inline renderer variables

`src/styles.css` is one deterministic import entrypoint. Most Hito rules append to the same named
`components` layer, so equal-origin/equal-specificity conflicts are resolved by selector specificity
and then source order across imports. The split `.hito-shell-profile-trigger` contract is therefore
coupled to the fact that `shell-admin-analytics.css` is imported after `reference-workbench.css`, but
the current declarations are complementary; a wrong computed value has not been demonstrated.
Import order must remain unchanged during ownership repair.

Current inline custom properties are valid inputs:

- button progress and slider/dual-range positions encode calculated percentages;
- selected-plan calendar tone and the DS comparison-bar sample reference existing workout semantic
  colours;
- logo-height utility values are per-instance component sizing inputs.

Because inline declarations have high cascade precedence, the allowed boundary is narrow: they may
set documented input/data variables only. An inline raw background, border, text, hover, focus, or
theme recipe would stop this task and return to the canonical component or Foundation owner.

### Smallest ownership rules

1. A non-Foundation `:root` declaration is justified only when at least two runtime owners consume
   one semantic or structural contract and no stable shared ancestor can carry it. Record those
   consumers beside the declaration. Otherwise scope or delete it; do not promote it to Foundation.
2. Foundation owns roles that preserve meaning across components and themes. A reusable component
   recipe belongs to the component owner even when it consumes multiple Foundation tokens.
3. A domain formula stays on its domain root when it expresses containment or workflow hierarchy
   not shared by another component. Repetition or visual similarity alone is not promotion proof.
4. A component input has one default owner. Domains and instances may override that same input at a
   bounded ancestor/element; they may not redefine the component's internal states.
5. A reference stylesheet may demonstrate contracts but may not be the only runtime owner for
   Product, Auth, Admin, or shared UI recipes.
6. Import order is a compatibility boundary, not an ownership mechanism. A repaired contract must
   work because selectors and inputs express ownership, not because an unrelated later file wins.

### Prioritized DESIGN SYSTEM implementation sequence

Each slice is independently reviewable and must reduce global scope, split ownership, or redundant
recipes. PRODUCT may route only one slice at a time.

1. **Shell-trigger owner consolidation.** Move the `.hito-shell-profile-trigger` visual/state rules
   from the grouped reference recipe into `shell-admin-analytics.css`; retain the reference specimen
   as a consumer. Delete the shell selectors from `reference-workbench.css`. Stop if computed
   default/hover/focus/disabled properties differ in either theme or if a non-shell consumer is
   discovered.
2. **Forms root-scope deletion.** Remove the four owner-local Manual Workout root aliases by scoping
   them to the exact editor/menu/title/summary owners or inlining a one-use value. Delete the root
   block when empty. Stop if repository/DOM evidence finds an external setter or consumer.
3. **Layout and shell single-owner root cleanup.** Process one file at a time: remove/scope the six
   layout-only and eleven shell/admin-only aliases. Explicitly retain the two App Shell geometry
   variables and avatar-width contract until their cross-owner consumers are migrated to a proved
   component/ancestor contract. Do not duplicate their values.
4. **Shared runtime recipe relocation.** Move `.hito-surface`, `.hito-surface-flat`, icon, and logo
   rules out of the reference-only ownership boundary into their existing canonical runtime
   component owners, then delete the old rules. If no existing owner can truthfully carry a recipe,
   stop and return the source-ownership question to PRODUCT rather than create a catch-all file.
5. **Manual Workout recipe convergence, one state family at a time.** Start with the secondary Field
   default/hover/focus family. Compare Dark/Light on canvas, surface, and elevated parent contexts,
   including disabled, read-only, invalid, and focus-visible states. Replace local formulas with the
   existing Field/Foundation roles only when role, computed result, contrast, and state ordering are
   equivalent; then delete both theme-local formulas for that state. Preserve non-equivalent canvas,
   row, repeat, nested, or containment recipes. Stop on any lost hierarchy, contrast regression, or
   parent-surface mismatch.
6. **Minimal guardrail after a repair.** Extend the existing validator/manifest seam only for the
   invariant actually repaired, such as prohibiting a Product-consumed selector from having its sole
   definition in a reference owner or recording the retained external-root allowlist. Do not add a
   raw-literal ban, CSS-file-count target, or parallel registry. Update `/hitoDS` only when the
   exposed shared contract changes.

Rollback for every slice is the task-owned slice itself: restore the deleted declaration/rule and
its original import position. Do not reorder imports or add compatibility aliases as rollback
machinery.

### Required equivalence and causal discriminators

Before claiming a visual issue is caused by ownership/cascade, capture all of the following on one
reproducible element:

1. route/component, viewport, Light/Dark theme, parent surface, and interaction/state;
2. the incorrect computed CSS property and every custom property in its resolved value chain;
3. DevTools matched rules with source file, selector specificity, cascade layer, and source order;
4. proof that an out-of-owner declaration wins or supplies the wrong inherited value; and
5. a controlled replay where removing/re-scoping only that declaration restores the canonical DS
   specimen without changing DOM or data.

Without this five-part replay, the result remains an ownership risk or visual-difference report, not
a confirmed CSS root cause. No browser QA, Global QA, implementation acceptance, release readiness,
or Figma parity was established by this review.

### Intentionally unresolved facts and Product return

- Whether any current route has a visible wrong state from cascade ownership remains unknown; no
  element-level matched-rule replay was part of this decision stage.
- Manual Workout's canvas/row/repeat/field recipes are not yet proved equivalent to existing neutral
  chrome roles across both themes and parent surfaces.
- The three cross-owner structural variables are proven shared, but their final non-root ancestor or
  component ownership cannot be selected from stylesheet reachability alone.
- No Product choice is required for the first three implementation slices. PRODUCT should return
  only if a measured Manual Workout distinction or the shared-surface semantic contract requires a
  user-facing design decision.

### Designer tracked research receipt

- **Task:** Designer Review Gate for CSS ownership and recipe consolidation.
- **Stage:** Research and design decision completed; implementation not started.
- **User problem:** Make the Design System authoritative without turning the CSS entrypoint into a
  mega-file or mistaking all local variables for tokens.
- **Accepted design decision:** Use the four-level Foundation/component/domain/instance ownership
  model, repair scope and split owners incrementally, and require semantic/state equivalence before
  recipe convergence. Do not add cascade sublayers without causal evidence.
- **Affected states:** Light/Dark; canvas/surface/elevated parents; default, hover, focus,
  focus-visible, active where present, disabled, read-only, and invalid.
- **Hito contracts to reuse:** Foundation semantic colour/chrome/edge/theme roles, Field state
  contract, Dual Range input contract, Inline Header sizing contract, typography provenance marker,
  single stylesheet entrypoint, existing validator/manifest, and `/hitoDS` specimens.
- **Files inspected:** `src/styles.css`, all nine imported CSS owners, relevant TSX setters/consumers,
  typography provenance owner, the current dirty diff, and this canonical item.
- **Files changed:** this canonical backlog item only.
- **Preserved boundaries:** no runtime CSS/source, validator, manifest, Figma, history, hosted state,
  dependency, staging, commit, push, deployment, or unrelated dirty hunk changed.
- **Next recommended owner:** PRODUCT to accept the decision and route one bounded DESIGN SYSTEM
  slice; the deferred handoff below remains unchanged.
- **Subagent:** none; independent delegation was not required.

| Review check | Result | Evidence / consequence |
| --- | --- | --- |
| Ownership and reachability inventory | Passed for the decision stage | All nine imported CSS owners, 24 external-root declarations, repeated names, shared reference recipes, and current TSX custom-property setters were classified. |
| Current primary guidance | Passed | DTCG, Spectrum, Carbon, and MDN sources are linked above. |
| Dirty-work preservation | Passed | Only this untracked canonical item was edited; the existing runtime, CSS, generated, validator, history, and Product hunks remain untouched. |
| Browser/computed-style replay | Not run by design | No specific visual root cause is claimed; the required five-part discriminator is recorded above. |
| Implementation/validator/build/Global QA | Not run by design | This was a research-and-decision gate only; no implementation or acceptance claim follows. |

## Exact Designer Handoff

```text
ROLE: DESIGNER

Mode: Tracked — research and decision stage only

Execute the Designer Review Gate in:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md`

Read `AGENTS.md`, `agents/designer.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before making a task-owned write. Read the complete
canonical item, `src/styles.css`, `src/styles/foundations.css`, each named CSS owner, and the current
dirty diff. Use current primary design-system guidance when researching style-layering practice.

This is read-only design/architecture work. Do not edit runtime source, CSS, validators, generated
manifests, Figma, history, or any unrelated dirty hunk. Do not dispatch implementation or ask a
same-discipline subagent to investigate. If independent evidence is genuinely necessary, use only
an existing named Hito role for a bounded read-only review, with its role and instructions named.

The visible concern is possible UI inconsistency from unclear CSS authority. The existing source
audit proves one CSS entrypoint and incomplete ownership boundaries; it does not prove that every
visual conflict comes from CSS files. Confirm or refute the causal risk with evidence. Evaluate the
existing four-layer proposal (Foundation, canonical component contract, domain composition, instance
data), external `:root` declarations, Manual Workout `color-mix()` recipes, the duplicate custom
property names, cascade import order, and inline renderer variables.

Record in the canonical item an English decision that: cites any external primary guidance; separates
real leakage/duplication from valid local composition; defines the smallest incremental ownership
rules; recommends a prioritized, net-reducing DESIGN SYSTEM implementation sequence with deletion
and stop conditions; and names the exact discriminator still needed for any unproven visual cause.

Preserve the task’s existing Design System handoff as deferred. Return the task to PRODUCT with an
English tracked research receipt naming the user problem, accepted design decision, affected states,
Hito DS primitives/contracts to reuse, next-owner recommendation, and remaining uncertainty. Do not
claim implementation, browser QA, Global QA, or release readiness.
```

## Proposed Design System Handoff — Requires Fresh Product Routing

```text
ROLE: DESIGN SYSTEM

Mode: Tracked

Do not execute this prompt until PRODUCT separately routes it after Ivan gives fresh explicit
confirmation. This proposal must not be treated as a queue behind another active task.

Execute the canonical CSS ownership task:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-css-ownership-and-recipe-consolidation.md`

Read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and
`skills/hito-architecture-audit/SKILL.md` before the first write. Read the complete task, the CSS
entrypoint, all named CSS owners, current validator/manifest seams, and the dirty tree.

This is not a CSS-file merger or visual rewrite. `src/styles.css` is the single deterministic
entrypoint; `foundations.css` already owns primitives and theme-resolved semantic roles. The proven
root problem is incomplete authority: owner-local values escape via non-Foundation `:root`, and
runtime component recipes are defined in `reference-workbench.css` rather than their canonical
owner. Preserve domain-separated files where they own one bounded concern.

You own all DESIGN SYSTEM source implementation yourself. Do not delegate DESIGN SYSTEM or
FRONTEND source work. You may use only existing named Hito roles for bounded, read-only evidence:
`ROLE: DESIGNER` to confirm a semantic/state decision before a risky convergence, and `ROLE: QA`
for an independent browser replay after your stable implementation. Do not create generic or
same-discipline implementation subagents.

Execute the demonstrated repair sequence in this item, re-running the listed reachability
discriminator before every deletion:

1. Consolidate `.hito-shell-profile-trigger` visual/default/hover/focus ownership into
   `src/styles/shell-admin-analytics.css`; retain the reference as a consumer and delete only the
   moved reference-workbench selector.
2. Remove the four Manual Workout owner-local `:root` aliases from
   `src/styles/forms-onboarding.css` by scoping them to their exact existing owner or deleting a
   zero-reachability one-use alias. Do not promote them to Foundations.
3. Process the proved single-owner aliases in `layout-typography.css` and
   `shell-admin-analytics.css`, one CSS owner at a time. Scope or delete only the six layout and
   eleven shell/admin values identified in the item. Retain the two App Shell geometry contracts
   and the avatar-width contract until a common ancestor/component owner is proven; do not clone
   their values.
4. Relocate each proved shared runtime recipe (`.hito-surface`, `.hito-surface-flat`, `.hito-icon`,
   `.hito-logo`, `.hito-logo-mark`) from `reference-workbench.css` only into its already existing
   canonical runtime owner, then remove the old rule. Do not create a catch-all stylesheet, a new
   component family, a compatibility alias, a raw-value recipe, or a Foundation role for a
   component-only responsibility.
5. Treat Manual Workout neutral-chrome convergence as conditional, not assumed. It may proceed one
   state family at a time only after the exact Light/Dark, parent-surface, computed-value, contrast,
   interaction-order, disabled/read-only/invalid discriminator proves equivalence with an existing
   Field/Foundation role. If it is not equivalent, leave the domain recipe intact and record that
   factual no-change outcome; do not hide the distinction with an approximation.
6. Add a minimal validator guard only for an invariant actually repaired. Do not add a CSS-file
   count rule, raw-literal ban, parallel registry, or broad lint framework.

Reuse existing Foundation semantic colour, alpha/overlay, edge, typography, spacing, radius, and
motion contracts. Preserve import order, Product routes and behavior, Backend, DevTools, Figma,
hosted state, and unrelated dirty hunks byte-for-byte. Stop and return to PRODUCT only if a genuine
Product-owned route change, a new cross-owner semantic role, or an unresolved state/contrast
discriminator requires a product decision.

Validate every repaired selector's reachability and computed-state contract, existing DS validator
and manifest parity, focused formatting/lint, and `git diff --check`. Independently replay affected
contracts in Dark/Light at desktop and exact 375×812 with no overflow or console errors. Use an
uncontended build only; never overwrite another owner's build/runtime. Append an English Tracked
implementation receipt to this canonical item with each deletion, retained exception, independent
DESIGNER/QA evidence, and any conditional convergence left unchanged. Do not claim Global QA,
release readiness, Figma parity, or Product adoption.
```

## Blockers

No task-owned blocker remains. The repository-wide DS validator is still red on two unrelated
Foundations/Mark inventory and specimen-classification assertions; the CSS ownership guardrails
added by this task pass before those failures. Disabled shell-profile rendering and the independent
QA Manual Workout state matrix remain bounded browser coverage gaps because the current references
do not expose those states. Global QA, release readiness, and Figma parity remain separate.

## Design System Implementation Receipt — 2026-08-12

### Stage and preflight

- **Mode:** Tracked implementation.
- **Existing seam reused:** the sole `src/styles.css` import boundary, existing Foundation roles,
  existing component-family CSS owners, the current Field contract, and the existing DS validator.
- **Smallest behavior change:** restore canonical CSS ownership, remove proven one-owner document
  globals, and stop the Manual Workout domain recipe from overriding canonical protected Field
  states.
- **New runtime artifacts:** none.
- **Removed responsibility:** reference-only CSS no longer owns runtime surfaces, Icon/Logo, or the
  shell profile trigger; one-use geometry values no longer escape through document-global aliases.

### Root cause and ownership result

The single CSS entrypoint and nine ordered modules were not the defect. The demonstrated authority
problem was that runtime component recipes were defined in `reference-workbench.css`, while 21
single-owner geometry aliases escaped into non-Foundation `:root` blocks. The later Manual Workout
domain selectors also suppressed canonical Field focus, disabled/read-only, error, and success
states.

The repaired hierarchy is:

| Responsibility | Canonical owner after this task | Result |
| --- | --- | --- |
| Primitive and semantic roles | `src/styles/foundations.css` | Unchanged; no token or value added. |
| Shared `.hito-surface` / `.hito-surface-flat` | `src/styles/overlays-feedback.css` | Relocated unchanged; removed from the reference workbench. |
| Shared `.hito-icon`, `.hito-logo`, `.hito-logo-mark` | `src/styles/layout-typography.css` | Relocated unchanged; removed from the reference workbench. |
| Shell profile default/hover/focus/disabled | `src/styles/shell-admin-analytics.css` | Complete component contract now lives with the shell; the reference keeps only its narrow specimen geometry override. |
| Manual Workout neutral fields | `src/styles/forms-onboarding.css` | Quiet eligible default/hover remains domain-owned; focus/open, disabled, read-only, invalid, error, and success fall through to `controls-fields.css`. |
| Cross-owner geometry | Existing layout/shell declarations | Retained only `--hito-form-section-avatar-width`, `--hito-mobile-bottom-nav-height`, and `--hito-shell-sidebar-width`, each with a proven consumer in another module. |
| Renderer/component inputs | Existing scoped declarations | `--hito-dual-range-accent`, `--hito-inline-header-min-width`, and inline instance data remain intentionally scoped; matching names were not merged by name alone. |

Twenty-one proven single-owner aliases were deleted and their exact existing values were applied at
their sole consumers: four Manual Workout aliases, six layout/readback aliases, and eleven
shell/menu/table/tooltip aliases. Import order was not changed.

### Files changed

- `src/styles/reference-workbench.css`
- `src/styles/overlays-feedback.css`
- `src/styles/layout-typography.css`
- `src/styles/shell-admin-analytics.css`
- `src/styles/forms-onboarding.css`
- `scripts/validate-hito-ds-component-contracts.ts`
- this canonical item

No Product component, route, Foundation token value, manifest, dependency, Backend, Figma, hosted
state, or unrelated dirty hunk was intentionally changed.

### Independent review outcomes

- **DESIGNER:** approved the source relocations as presentation-equivalent. It rejected wholesale
  Manual Workout neutral-fill convergence because the domain default/hover is deliberately quieter
  than canonical secondary Field chrome, and approved restoring only the protected state ordering.
- **QA:** passed the focused CSS-consolidation slice. It independently confirmed shared
  surface/Icon/Logo rendering, shell default/hover/focus, Dark/Light desktop/mobile containment,
  console health, the three retained root variables, and the new guardrails. It reported no
  task-owned defect.

### Validation inventory

| Check | Scenario / environment | Result | Evidence / consequence |
| --- | --- | --- | --- |
| Reachability and root ownership | All non-Foundation document globals | Passed | 21 single-owner aliases removed; exactly 3 cross-owner geometry variables retained. |
| Shared recipe relocation | Source and rendered Hito DS/Login consumers | Passed | Surface, Icon/Logo, and shell declarations remain byte-equivalent in their new owners; import order is unchanged. |
| Manual Workout state order | Real Calendar scratch editor, Dark/Light desktop and 375×812 | Passed with bounded gaps | Real eligible default/hover and focus-visible were rendered; focus restored the 2px semantic ring. Disabled/read-only/error/success are source-proven exclusions but the fixture exposes no live controls for all of those states. |
| Shell interaction | `/hitoDS/patterns#app-shell`, Dark/Light, 1470×801 and 375×812 | Passed with bounded gap | Default, hover, and keyboard focus-visible passed; no disabled shell-profile specimen exists. |
| Responsive and console | Hito DS Patterns and Manual Workout | Passed | No document/dialog/editor horizontal overflow and no console warnings or errors. |
| Designer review | Read-only source and contrast discriminator | Passed | Non-equivalent quiet domain fill retained; canonical protected states restored without a token. |
| Independent QA | Managed local browser plus source review | Passed for focused slice | No task-owned defect; QA's setup-gated Manual Workout route and missing disabled shell specimen are recorded above. |
| Manifest parity | `node scripts/generate-hito-ds-manifest.mjs --check` | Passed | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`. |
| CSS ownership guardrails | `npm run validate-hito-ds-components` | Task assertions passed; overall command red elsewhere | The only emitted failures are the pre-existing Mark inventory and Foundations specimen-count assertions. This task did not add a compatibility marker or repair unrelated reference work. |
| Focused formatting and lint | Prettier on five CSS owners and validator; ESLint on validator | Passed | No task-owned format/lint error. The retained long canonical Markdown artifact is not reformatted wholesale. |
| Diff hygiene | `git diff --check` | Passed | No whitespace error. |
| Production build and runtime restoration | Fresh uncontended build through `npm run qa:server:restart` after stable CSS source | Passed | Vite/Nitro build and postbuild completed successfully; the canonical managed loopback server was restored as compatible, healthy, and artifact-fresh. |

### Closure

Implementation DoD for the CSS ownership slice is complete. Next owner is **PRODUCT** for normal
integration sequencing. This receipt does not claim Global QA Acceptance, release readiness, Figma
parity, deployment, or Product adoption.
