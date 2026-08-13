# Local UI Inspector Color Property Control

## Work Item ID

2026-08-11-local-ui-inspector-color-property-control

## Status

completed

## Type

devtools-inspector

## Priority

high

## Owner

frontend

## Lane

DevTools

## Mode

Tracked

## Scope

Add one factual **Color** property control to the local-only Inline Inspector. It identifies the
selected element's eligible **Text**, **Fill**, and **Border** colour channels; shows truthful
current evidence; lets Ivan select an existing semantic Hito colour or request that one channel's
colour be removed; and serializes that request into the existing local Inspector draft.

This task is local DevTools only. Selection must not alter the selected page's DOM, CSS, product
state, Design System token values, or persisted data.

Ivan explicitly authorizes the narrow shared exception of registering the supplied `color` icon in
the existing `src/components/ui/icon.tsx` registry, because that registry is the single existing
icon seam consumed by the Inspector. No other Design System primitive, CSS, token, gallery,
manifest, or Figma work belongs to this task.

## Archive Intent

retain_in_place

## Task

Extend the existing Inspector property-evidence and draft-payload path with a colour property
control. Reuse its current spacing/radius grouping, `HitoValueTag` / `Select`, tooltip/focus,
icon, and local draft mechanisms; do not invent a picker, a second token registry, or a live
style-editor path.

The new control is a request authoring aid. It records factual observed state and a requested
semantic token or removal. The generated Inspector batch must express that request for the
eventual implementation owner; it must never recolour the selected element in the browser.

Color is a lower-priority property. It must sit immediately above **Actions**, after every existing
observed Text, chrome, spacing/radius, and typography control; it must never push those controls
out of the Inspector or replace their current-to-desired evidence.

## User Report

Ivan needs an Inspector control for colour comparable to the existing radius/spacing controls:

- an icon for colour;
- a compact swatch and a readable current colour name;
- a grouped expansion when Text, Fill, and Border are all applicable;
- options from the existing Hito colour system, with previews;
- full source/token/value/HEX/opacity evidence on hover/focus and a touch-equivalent path;
- an explicit per-channel **Remove color** request.

The supplied icon geometry is the source art. Its hard-coded blue is reference-only; the registered
icon must use `currentColor` so it inherits canonical icon colour.

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.71589 0.857697C6.46218 0.603146 6.05063 0.602951 5.79667 0.857263C5.54271 1.11158 5.54251 1.52409 5.79623 1.77864L6.62499 2.61012L1.23395 8.01886C0.477517 8.77772 0.477517 10.0079 1.23395 10.7669L4.88567 14.4305C5.64245 15.1898 6.86969 15.1898 7.62649 14.4305L13.482 8.57566C13.6002 8.45746 13.6733 8.29692 13.666 8.12992C13.6738 7.95372 13.6106 7.77499 13.4765 7.64039L6.71589 0.857697ZM3.58118 7.50752L7.54383 3.53189L11.5064 7.50752H3.58118Z" fill="#3B82F6"/>
  <path d="M12.8227 10.8037C13.0156 10.621 13.3177 10.621 13.5106 10.8037L13.5157 10.8091C13.652 10.9508 14.0451 11.3595 14.2205 11.5741C14.3966 11.7897 14.5828 12.0415 14.7273 12.2982C14.8644 12.5415 15 12.8511 15 13.1667C15 14.1792 14.1792 15 13.1666 15C12.1541 15 11.3333 14.1792 11.3333 13.1667C11.3333 12.8511 11.4689 12.5415 11.606 12.2982C11.7505 12.0415 11.9367 11.7897 12.1128 11.5741C12.2904 11.3567 12.8227 10.8037 12.8227 10.8037Z" fill="#3B82F6"/>
</svg>
```

## Observed Behavior

- `src/components/devtools/local-ui-inspector-targets.ts` currently derives only spacing and
  radius evidence from `getComputedStyle`.
- `src/components/devtools/local-inline-change-target-utils.ts` models only `spacing` and
  `radius` token controls and serializes their desired values.
- `src/components/devtools/LocalUiTokenControls.tsx` already owns the reusable single-row versus
  expanded-group behavior used by Inspector property controls.
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx` already owns `HitoValueTag` and
  `Select` composition.
- `src/components/devtools/LocalUiTaskDraftPanel.tsx` and
  `src/components/devtools/local-ui-task-draft-view-model.ts` own Inspector draft action/payload
  derivation.
- `src/components/ui/icon.tsx` is the only icon registry. `HITO_ICON_META` feeds the existing
  Foundations icon reference and Figma export board automatically.

## Demonstrated Cause

The Inspector's canonical evidence model has no colour channel, colour token option, desired
colour selection, or removal state. Consequently it cannot distinguish Text/Fill/Border truth,
show colour provenance, or emit a scoped colour request. This is a missing capability in the
DevTools evidence/draft seam, not a Product or Calendar style defect.

## Required Behavior

### 1. Eligible observed channels

Inspect only an actual, rendered channel on the selected element:

- **Text**: the element itself paints visible text or a `currentColor` icon.
- **Fill**: it has one observable background colour. Do not pretend that a transparent,
  image-only, gradient-only, or multi-layer background is one selectable fill.
- **Border**: it has a nonzero visible border. A uniform border is one `Border` channel; distinct
  sides remain truthfully mixed/read-only rather than silently choosing one side.

If no channel is eligible, render no Color control. Never infer an inherited text colour for an
empty/container-only target just to fill the UI.

### 2. Grouping and affordance

- One eligible channel: render that direct `Text`, `Fill`, or `Border` property row with
  `Icon name="color"`. Do **not** add a separate Color-group chevron. The existing canonical
  value-selection affordance may still open its own menu; do not render a second arrow.
- Two or three eligible channels: render one `Color` group with the single existing expand/collapse
  chevron pattern, then direct child rows named `Text`, `Fill`, and/or `Border`.
- Reuse the existing Inspector row, ValueTag, Select, Dropdown, tooltip/focus, Hito spacing/radius,
  and surface primitives. Do not add a picker, palette editor, generic form framework, new route,
  or a custom Design System recipe.

### 2a. Property hierarchy and coexistence

- Render the Inspector's observed properties in this order: existing editable Text; existing chrome
  controls; existing spacing/radius token controls; existing typography; **Color**; then the
  existing **Actions** row. Color is immediately above Actions.
- The presence of any eligible colour channel must not conditionally hide, replace, reset, collapse,
  or make unavailable the selected target's existing chrome, spacing/radius, typography, text, or
  Actions controls. Those controls continue to derive from their own observed evidence.
- Before any change, a colour leaf must visibly show its factual current swatch and label through
  the same existing compact value-control pattern. After a pending choice, it must show the factual
  current swatch/label **→** the requested choice; clearing restores the current-only state without
  a stale pending value. Do not invent a desired state just to display an arrow.
- A replay must distinguish a real absence of spacing/radius evidence on a selected element from a
  Color-control layout/state regression. Do not report the former as a Color implementation defect
  or hide the latter behind the selected element's Fill.

### 3. Current state and options

Each direct channel displays a compact swatch and a human-readable current label. If a precise
mapping to an existing semantic Hito token is demonstrable through the existing generated manifest
and computed style, use that semantic role's human label. Otherwise say `Custom (computed)` and
show only truthful computed evidence; do not invent a token mapping.

The choice list contains only existing semantic Hito colour roles appropriate to the channel. Each
option shows a preview and human-readable role label. Do not expose primitive hues as Product
choices and do not create a second hard-coded option registry. Derive options from canonical
manifest/token data or stop with the exact missing canonical discriminator.

For translucent/composite colours, preview over a small checkerboard and show the alpha percentage.
Use the existing generated source/formula metadata when it exists. Do not fabricate one primitive
for a multi-source `color-mix()`.

### 4. Detail disclosure

Desktop hover/focus and the narrow/touch-equivalent path must disclose the same factual detail:

- a larger swatch (checkerboard when alpha is present);
- human role label;
- semantic token variable;
- canonical source primitive or formula when known;
- resolved active-theme HEX/HEX-alpha; and
- opacity/alpha contribution when applicable.

Use existing Tooltip/Select/Dropdown semantics. At `375px`, details must be visible inside the
opened choice interaction or inline; they may not rely only on hover.

### 5. Requested change and removal

Every selectable direct channel offers:

1. **Keep current** — no draft request.
2. Existing semantic Hito colour choices — a desired semantic-token request.
3. **Remove color** — a desired request to remove that channel's source declaration at the
   eventual canonical implementation seam.

`Remove color` is channel-specific: Text removes Text, Fill removes Fill, Border removes Border.
It is **not** `color: transparent`, `unset`, a DOM mutation, or an immediate preview. It must be
serialised explicitly in the Inspector payload and generated batch so a later owner knows exactly
which declaration class/property to locate and remove. A clear/remove affordance restores `Keep
current` and removes only that pending request.

## Existing Seams To Reuse

- `src/components/ui/icon.tsx` — add exactly `color` to `HITO_ICON_META` and its component map;
  preserve registry metadata conventions and use the supplied geometry with `currentColor`.
- `src/components/devtools/local-ui-inspector-targets.ts` — detected computed channel evidence.
- `src/components/devtools/local-inline-change-target-utils.ts` and
  `local-ui-inspector-token-evidence.ts` — Inspector evidence, selection, normalization, and
  payload types.
- `src/components/devtools/LocalUiTokenControls.tsx` — single versus expanded property grouping.
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx` — existing value-tag/select/menu
  composition.
- `src/components/devtools/LocalUiTaskDraftPanel.tsx` and
  `src/components/devtools/local-ui-task-draft-view-model.ts` — draft state and prompt output.
- `src/generated/hito-ds-manifest.ts` / `.json` — existing semantic colour truth only.

## Reuse-First Change Budget

- Reuse the existing `Icon` registry, Inspector evidence model, control grouping, ValueTag/Select,
  tooltip/focus behavior, generated manifest, and batch payload format.
- New production runtime artifacts: **none**. A small local helper is allowed only when it removes
  duplication across the three channel rows and cannot fit coherently in the existing DevTools
  owners; explain it in the receipt.
- Remove/simplify the new colour request cleanly when the user clears it. Do not leave parallel
  `desiredColors` and `desiredTokens` sources that disagree.

## What Not To Touch

- Do not recolour a selected page element, mutate Product CSS, change any Hito token value,
  primitive, semantic mapping, manifest-generation rule, foundation view, Figma, backend,
  persistence, fixture data, or hosted state.
- Do not add a colour picker, CSS editor, raw primitive palette, free-form HEX input, opacity
  slider, saved preference, server API, route, dependency, or compatibility layer.
- Do not touch unrelated Inspector controls, Product routes, or shared DS CSS. The sole shared
  exception is the `color` icon registration described above.

## Definition Of Done

1. `Icon name="color"` resolves through the existing registry, inherits `currentColor`, and appears
   in the existing icon reference path without a manual second catalogue.
2. The Inspector emits only truthful eligible Text/Fill/Border controls; one channel has no group
   chevron and multiple channels use the existing expandable group behavior.
3. Current evidence, semantic choices, alpha/checkerboard preview, detail disclosure, requested
   semantic choice, and per-channel `Remove color` are recorded in the existing local draft and
   generated batch payload.
4. No selection changes the inspected page's computed styles or persistent state.
5. Unknown/custom, gradient/image, and mixed-border cases remain honest rather than guessed.
6. A Fill-bearing target still exposes every independently observable existing property control;
   Color is immediately above Actions and does not suppress existing current/desired transitions.

## Validation Expectations

| Check                 | Scenario / environment                  | Required evidence                                                                                                                           |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon registry         | Existing `/hitoDS` icon reference       | `color` renders, has canonical metadata, and is not hard-coded blue.                                                                        |
| Channel discriminator | Local Inspector targets                 | Text-only, fill-only, border-only, multi-channel, transparent/gradient/image, mixed-border, and no-channel cases are classified truthfully. |
| Draft/payload         | Local Inspector                         | Semantic selection, `Remove color`, and clear-to-current create the correct scoped generated request without live page mutation.            |
| Detail access         | Desktop and `375×812`                   | Token/source/HEX/alpha facts are available through hover/focus and touch-equivalent interaction.                                            |
| Coexistence/order     | Fill-bearing Inspector target           | Existing Text/chrome/spacing-radius/typography controls remain independently observable and editable; Color is immediately above Actions.   |
| UI safety             | Desktop and `375×812`, available themes | Existing grouping, keyboard/focus, menus, containment, and console health remain intact.                                                    |
| Static                | Task-owned source                       | Focused format, ESLint, relevant DevTools/DS validation, and `git diff --check`.                                                            |
| Runtime               | Fixture QA server                       | If this task stops it, restart the managed `qa_fixture` server before the final receipt.                                                    |

## Stage

Frontend DevTools implementation and focused browser acceptance completed on 2026-08-11. The
generated Hito DS manifest provides canonical semantic-colour labels and Text/Fill/Border
applicability. The Fill-bearing replay confirmed that spacing/radius evidence was present and that
the rejected candidate's incorrect Color placement and parallel draft map were the local defects.

## Product Correction — Color Priority And Control Visibility

The visible current DevTools candidate places `ColorControlRows` before the existing
`TokenControlRows` in `LocalUiTaskDraftPanel`. It also uses a separate `desiredColors` map even
though this item requires the existing one-source draft mechanism. Ivan reports that selecting a
Fill-bearing card makes the other controls and their “current → desired” state unavailable in the
Inspector.

The source order proves Color is currently too high in the panel. It does not prove that Color is
the cause of missing spacing/radius evidence for a particular card, because those controls are
constructed and filtered independently. The implementation must therefore fix the confirmed order,
remove the rejected parallel draft state, and run the required Fill-bearing browser discriminator
before claiming the visibility symptom is resolved.

## Execution Preflight

- Product outcome: one factual Color control authors Text, Fill, and Border semantic-token or
  channel-removal requests without changing the inspected page.
- Demonstrated cause and first incorrect owner: the existing DevTools evidence/draft contract has
  no colour channel or colour request shape; Product CSS and global Design System tokens are not
  incorrect.
- Existing seams: `inspectLocalUiTarget`, the current Inspector `desiredTokens` draft map,
  `LocalUiTokenControls`, `LocalUiPropertyControlPrimitives`, `buildInlineChangePayload`, and the
  existing batch prompt remain the owners. No parallel `desiredColors` source will be added.
- Reused Design System contracts: `Icon`, `HitoValueTag`, `Select`, `Tooltip`, semantic manifest
  colours, current spacing/radius classes, and existing Inspector layer/focus behavior.
- New runtime artifacts: none. No file, token, primitive, route, dependency, CSS recipe, picker,
  registry, storage path, or compatibility layer is proposed.
- Simplified responsibility: one colour request map feeds the draft, payload, and generated batch;
  `Remove color` is an explicit channel request rather than transparent CSS or a live style path.
- Promotion/stop boundary: any need to change Product CSS, shared DS CSS/tokens, manifest generation,
  persistence, Figma, or selected-page behavior stops this implementation.

## Source-Backed Stop Finding

The required semantic option set cannot be derived truthfully from the currently permitted source:

| Evidence                                                                          | Finding                                                                                                                                         | Consequence                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/generated/hito-ds-manifest.ts` semantic colour records                       | Records contain only `id`, `cssVariable`, and per-theme `value` / `alias`. They do not contain a human label or Text/Fill/Border applicability. | The Inspector cannot produce a channel-appropriate semantic option set from the manifest alone.        |
| `scripts/generate-hito-ds-manifest.mjs` `combineSemanticModes`                    | The generator emits the same value/alias-only contract.                                                                                         | The missing discriminator is upstream of the DevTools renderer.                                        |
| `src/components/hito-ds/reference-foundations-page.tsx` `SEMANTIC_COLOR_SECTIONS` | The only role grouping is a private hand-maintained Foundations catalogue, outside this task and not an applicability contract.                 | Importing, exporting, or copying it would violate the no-second-registry and Foundations boundaries.   |
| Concurrent in-progress `local-ui-inspector-targets.ts` change                     | `isColorRoleAvailableForChannel` guesses applicability from token-id substrings.                                                                | This is the prohibited hand-maintained mapping and is not accepted as canonical evidence.              |
| Concurrent in-progress draft change                                               | A separate `desiredColors` map was added beside `desiredTokens`.                                                                                | This contradicts the task's one-source requirement and was not accepted as a completed draft contract. |

The same source review also found that the concurrent detector reads a root `dark` class instead of
the canonical `data-hito-theme`, checks whether the resolved HTML target itself is an SVG even
though SVG/path hits are lifted to their parent, and requires all four border sides to match before
emitting a border channel. Those issues are locally correctable, but correcting them would not
resolve the upstream semantic applicability blocker.

The task therefore stops at its explicit condition: do not add or retain an invented Inspector
colour registry when the generated manifest lacks the canonical discriminator. The concurrent
source edits remain preserved in the shared dirty tree, but they are not claimed as an accepted or
validated implementation by this receipt.

## Validation Receipt

| Check                                 | Scenario / environment                                     | Result            | Evidence                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical option-source discriminator | Generated manifest and generator                           | Blocked           | Neither source owns semantic human labels or Text/Fill/Border applicability.                                                                            |
| Reuse / ownership review              | DevTools detector, draft, payload, Foundations catalogue   | Failed acceptance | Current in-progress code introduces a hard-coded applicability predicate and a parallel `desiredColors` state.                                          |
| Detector review                       | Theme, current-colour icon, one-side/mixed border evidence | Failed acceptance | The current in-progress detector uses the wrong theme owner and unreachable/incomplete eligibility checks.                                              |
| Documentation and diff hygiene        | Canonical item plus current task source diff               | Passed            | Prettier formatting and `git diff --check` passed after the blocker receipt update.                                                                     |
| Production build                      | Shared local build output                                  | Not accepted      | A concurrent build left the managed runtime stopped with `artifactFreshness: stale` and `receipt_missing_or_invalid`; it is not evidence for this task. |
| Browser interaction and visual QA     | Desktop and `375x812`, light/dark                          | Not run           | The canonical stop condition occurs before a valid semantic option contract exists; browser proof could not establish the required behaviour.           |

Omitted-check consequence: icon rendering, grouping, draft serialization, touch disclosure, live-style
non-mutation, responsive containment, theme presentation, console health, and fixture-runtime health
remain unproven. This task is not complete and makes no Global QA, hosted, release, Figma, or
deployment claim.

## Next Recommended Role

product

## Exact Frontend DevTools Handoff

```text
ROLE: FRONTEND

Frontend Lane: DevTools
Mode: Tracked
Task: Add one factual Color property control to the local Inline Inspector. It must record
Text/Fill/Border semantic-colour or removal requests in the existing Inspector draft; it must not
recolour the inspected page.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-local-ui-inspector-color-property-control.md`

Read before the first write:
- `AGENTS.md`
- `agents/frontend.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `src/components/ui/icon.tsx`
- `src/components/devtools/local-ui-inspector-targets.ts`
- `src/components/devtools/local-inline-change-target-utils.ts`
- `src/components/devtools/local-ui-inspector-token-evidence.ts`
- `src/components/devtools/LocalUiTokenControls.tsx`
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx`
- `src/components/devtools/LocalUiTaskDraftPanel.tsx`
- `src/components/devtools/local-ui-task-draft-view-model.ts`
- `src/generated/hito-ds-manifest.ts` and `.json`

Preflight: preserve every unrelated dirty hunk. Reuse the existing Icon registry, Inspector
evidence/draft model, property grouping, ValueTag/Select/Dropdown/Tooltip, and generated semantic
manifest. The only authorized shared-DS edit is adding the supplied `color` icon to the existing
`src/components/ui/icon.tsx` registry with `currentColor`; do not edit shared DS CSS, tokens,
Foundations, Figma, Product code, Backend, or data.

Apply the Product correction in the canonical item. The current candidate has Color before
`TokenControlRows` and a parallel `desiredColors` map; neither is accepted. Keep one existing draft
source of truth, render Color after Text/chrome/spacing-radius/typography and immediately above
Actions, and ensure a Fill-bearing target cannot suppress independent observable controls. Before a
colour request, show factual current swatch/label; after one, show current → desired; clearing must
restore current-only. First reproduce the reported Fill-bearing card case and distinguish missing
underlying token evidence from a panel composition/state defect.

Implement the item exactly. Do not delegate implementation. You may use one bounded read-only QA
or source-evidence review only if it materially improves proof.

The key contract is: one eligible channel is a direct Text/Fill/Border row with no separate group
chevron; multiple eligible channels are one expandable Color group with Text/Fill/Border children.
Each leaf can keep current, choose an existing semantic Hito role, or request `Remove color` for
that exact leaf. Selection only changes the local Inspector draft/generated batch; it never applies
CSS or mutates the selected page. Unknown, gradient/image, transparent, and mixed-border cases
must remain factual.

Use existing semantic token/manifest truth only; no primitive palette, picker, free-form HEX,
opacity control, invented mapping, or second registry. Use Russian for visible in-progress
commentary. The final formal receipt and canonical-item update must be English.

Run the item's focused discriminator, Inspector draft/payload proof, desktop and `375×812`
interaction/focus/containment checks in available themes, including a Fill-bearing target with
independently observable properties, relevant static checks, and a production build only if
uncontended. If the task stops the fixture QA server, restart it before reporting.
Do not stage, commit, push, deploy, use hosted services, call providers, or delete material data.
```

## Blockers

None. The Design System prerequisite is completed: generated semantic-colour records now provide
canonical `label` and `channels` metadata. Frontend must consume that generated contract, remove the
rejected token-name predicate, and resume at the existing DevTools evidence/draft seams.

## Frontend DevTools Final Implementation Receipt — 2026-08-11

### Task And Stage

- Role: Frontend, DevTools lane.
- Mode: Tracked.
- Stage completed: implementation and focused local browser acceptance.
- Acceptance scope: Implementation DoD only. Global QA, hosted, release, deployment, and Figma
  acceptance remain unclaimed.

### Preflight, Cause, And Outcome

- Existing seam reused: `inspectLocalUiTarget` supplies evidence to the existing Inspector draft,
  payload, batch-prompt, and property-row composition.
- New runtime artifacts: none. The existing icon registry is the sole authorized shared seam.
- Demonstrated original cause: the DevTools evidence/draft contract had no factual colour channel or
  scoped semantic-colour/removal request.
- Demonstrated candidate defects: Color rendered above spacing/radius, and colour requests used a
  parallel `desiredColors` map. A real Fill-bearing profile card still supplied padding and radius
  evidence, proving the reported missing-control symptom was not caused by absent target evidence.
- Result: the existing `desiredTokens` map is now the only draft source for token and colour
  requests; Color renders after typography and immediately above Actions without suppressing Text,
  chrome, spacing/radius, or typography. Current, current-to-desired, clear-to-current, and Remove
  color states remain factual and do not mutate the inspected page.

### Files Changed

- `src/components/devtools/local-ui-inspector-targets.ts`
- `src/components/devtools/local-inline-change-target-utils.ts`
- `src/components/devtools/local-ui-inspector-session.ts`
- `src/components/devtools/LocalUiTokenControls.tsx`
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx`
- `src/components/devtools/LocalUiTaskDraftPanel.tsx`
- `src/components/devtools/local-ui-task-draft-view-model.ts`
- `src/components/devtools/local-ui-inspector-batch-prompt.ts`
- `src/components/ui/icon.tsx`
- `docs/tasks/backlog/2026-08-11-local-ui-inspector-color-property-control.md`

### Validation Inventory

| Check                        | Scenario / environment                                          | Result                               | Evidence                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fill-bearing discriminator   | Real `.hito-shell-profile-trigger`, Inspector on                | Passed                               | The target reported 12 px padding, 10 px radius, Fill, and independent chrome/token controls. Before correction Color preceded those controls; after correction the order is chrome, spacing/radius, Color, Actions.                                                                                                        |
| Property coexistence/order   | Dark and Light, desktop and exact `375x812`                     | Passed                               | Text/chrome/spacing-radius/typography remained available; grouped or direct Color rendered immediately above Actions with no horizontal overflow.                                                                                                                                                                           |
| Channel grouping             | Real multi-channel profile card and direct text target          | Passed                               | Text plus Fill used one expandable Color group; the text-only target rendered one direct Text colour row with no extra group chevron.                                                                                                                                                                                       |
| Current and desired truth    | Fill channel, semantic Surface request, clear, and Remove color | Passed                               | Current swatch/label appeared first; selection showed current to desired; clear restored current-only; Remove color produced the exact `background-color` removal request.                                                                                                                                                  |
| Draft and batch payload      | Local in-memory Inspector draft                                 | Passed                               | Semantic and removal requests serialized from `desiredTokens`; the generated batch included current HEX/alpha and the requested scoped change. No parallel colour state remains.                                                                                                                                            |
| No live mutation             | Computed style snapshot before and after select/remove/clear    | Passed                               | Text, background, border, padding, and radius values were byte-equal; no DOM/CSS or persisted product state changed.                                                                                                                                                                                                        |
| Manifest and theme truth     | Generated semantic metadata, Light/Dark/System                  | Passed                               | Options use generated `label` and `channels`; theme values follow `data-hito-theme`; semantic token/source/HEX/alpha details changed factually with the active theme.                                                                                                                                                       |
| Eligibility honesty          | Real gradient target plus detector source audit                 | Passed                               | Gradient did not expose a false Fill channel. Transparent/no-colour, image backgrounds, and mixed visible border colours are excluded by explicit detector predicates rather than guessed.                                                                                                                                  |
| Icon registry                | `/hitoDS/foundations` icon specimen                             | Passed                               | `color` rendered at 20 px with the supplied geometry and `currentColor`; no hard-coded blue remained.                                                                                                                                                                                                                       |
| Keyboard, focus, and menus   | Desktop and exact `375x812`                                     | Passed                               | Keyboard opened the native Select composition; option details and touch-equivalent disclosure remained accessible; the 320 px menu stayed inside the mobile viewport.                                                                                                                                                       |
| Responsive/theme safety      | Desktop and exact `375x812`, Dark/Light/System                  | Passed                               | Inspector sheet and menus were contained, no horizontal overflow occurred, and browser console output was empty.                                                                                                                                                                                                            |
| Static validation            | Task-owned source                                               | Passed                               | Prettier check, focused ESLint, `validate-hito-ds-components`, rejected-state source search, and `git diff --check` passed.                                                                                                                                                                                                 |
| Production build and fixture | Managed local QA runtime                                        | Passed with later shared-output note | A production client/SSR/Nitro rebuild passed and the fresh managed runtime served the accepted candidate for browser proof. The fixture remained healthy and running; a later unrelated shared-output change made the artifact status stale, so final freshness was rechecked separately without changing unrelated source. |

### Preserved Boundaries And Coverage Note

Product and shared Design System CSS/tokens, Backend, persistence, Figma, hosted state, provider
calls, and selected-page behavior were unchanged. No picker, primitive palette, opacity control,
generic capability framework, route, component, dependency, or compatibility path was added.

Image-only, mixed-border, and no-channel classification were source-audited against explicit
predicates rather than created as persisted fixture content. Consequently those cases do not have
separate browser screenshots; the reachable real gradient case and all user-facing interaction,
ordering, payload, no-mutation, responsive, theme, and console requirements were exercised.

Next owner: Product. Blockers: none.
