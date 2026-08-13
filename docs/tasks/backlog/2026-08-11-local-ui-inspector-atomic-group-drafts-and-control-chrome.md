# Local UI Inspector Atomic Group Drafts and Control Chrome

## Work Item ID

2026-08-11-local-ui-inspector-atomic-group-drafts-and-control-chrome

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

Lite

## Scope

Repair the local-only Inspector's grouped spacing/radius request drafting, then align the existing
expanded Color and padding group presentation. This item changes only local Inspector draft UI and
the generated request derived from it. It must never live-edit the selected page, mutate Product
data, change shared Hito Design System CSS/tokens, alter the generated semantic-colour manifest, or
change persistence, backend, Figma, or hosted state.

The preceding Color control and one-field editable-text work are accepted neighbours. Preserve their
behavior and current dirty hunks; do not reset, reimplement, or broaden either task.

## Archive Intent

retain_in_place

## Task

Make every observed Inspector property independently requestable on the same selected target,
including a target that has Color plus spacing/radius evidence. A grouped Radius or grouped Padding
selection must appear truthfully as a current-to-desired request and must survive alongside Color,
gap, chrome, typography, text, and Actions data.

Then make expanded multi-channel Color and expanded multi-side Padding groups share the same calm,
borderless local Inspector container treatment without creating a shared Design System component or
new CSS recipe.

## User Report

Ivan selected a different Radius for a Color-bearing Inspector target. The value tag only received a
focus/signal border; it did not become a current-to-desired state and did not produce a usable
request. He also asked that:

- the multi-channel `Color` chevron align on the right exactly like `Vertical padding`, while having
  no fabricated value on its right;
- the expanded Color group remove its outer left indent, retain its current top/right/bottom
  padding, use a larger existing Hito radius, remove its decorative border, and use a darker
  semantic background instead;
- Color show one colour icon at the group heading only. Its `Text`, `Fill`, and `Border` child rows
  must not repeat that icon;
- expanded padding groups use the same container geometry and borderless/darker-surface treatment,
  while retaining their child-side icons because those icons carry real directional meaning.

The primary requirement is functional: selecting Radius, Padding, Gap, or Color must not cause any
other independently observed property to disappear, reset, or fail to serialize.

## Observed Behavior

- `src/components/devtools/LocalUiTokenControls.tsx:235-237` expands one grouped selection into a
  `forEach` of one-control callbacks.
- `src/components/devtools/LocalUiTaskDraftPanel.tsx:307-317` derives every one-control update from
  the same render-time `draft.desiredTokens` snapshot and writes it through a later state update.
- Consequently a four-corner Radius choice retains only the final corner entry. The group regards a
  choice as active only when every side has the same desired token
  (`LocalUiTokenControls.tsx:198-219`), so the displayed current-to-desired state never appears.
- The exact same stale-snapshot overwrite exists for grouped horizontal and vertical padding.
- Color uses the same one canonical `desiredTokens` map but is not the cause: its per-channel
  controls are independent and must remain coexistent.
- Both existing expanded containers separately use
  `ml-2 rounded-md border border-hairline bg-surface/35 p-1`
  (`LocalUiTokenControls.tsx:93` and `:242`). That creates the unwanted left indent and decorative
  border. Color child rows additionally repeat the colour icon (`:111-116`).

## Demonstrated Cause

The first incorrect canonical owner is the local Inspector group-to-draft update seam, not Color
metadata, target evidence, Product CSS, or a selected element. A logical one-group selection is
implemented as several asynchronous updates built from a stale draft snapshot. The subsequent
group-validity rule correctly refuses to call a partial result a valid Radius/Padding request.

## Required Behavior

### 1. Atomic property drafts

- A group-level Radius choice writes the requested token for all four participating corner controls
  in one atomic update of the one existing `draft.desiredTokens` map.
- A group-level Horizontal or Vertical padding choice similarly writes both participating side
  controls in one atomic update.
- Selecting a direct side in an expanded group changes only that side. Clearing a group clears only
  that group's entries. Neither action may alter Color, Gap, chrome, typography, text, Actions, or
  other token requests.
- A single Gap choice remains independently selectable and serializes normally.
- A Color request (including clear and `Remove color`) and Radius/Padding/Gap requests accumulate in
  the same canonical map and all appear in the generated Inspector batch. No second map, reducer,
  compatibility state, or Inspector-only token registry is permitted.
- The Inspector continues to describe a request only. Computed styles, DOM content, and persistent
  state of the selected page stay byte-for-byte unchanged while it is used.

### 2. Current-to-desired truth

- For a uniform four-corner Radius target, choosing a different Hito radius visibly produces
  `current → desired` and an actionable radius selection. Choosing the original token returns the
  group to current-only state.
- The equivalent current-to-desired, restore, and payload behavior holds for uniform horizontal and
  vertical padding groups.
- Partial expanded-side edits must remain factual: only the changed side has a desired value; the
  collapsed group must not claim a uniform desired value where none exists.
- Color's presence must not make the above values unavailable. Conversely, token selections must not
  close, clear, or mislabel a Color request.

### 3. Expanded group affordance

- Keep the existing right-aligned chevron alignment used by grouped Padding. The multi-channel
  `Color` heading has no synthetic current/value tag; the chevron is its right-side affordance.
- For both expanded Color and expanded Padding groups, remove the outer left indentation only.
  Preserve the existing top/right/bottom padding; do not introduce a spacing literal or change the
  container's vertical rhythm.
- Replace the decorative hairline border with an existing darker semantic neutral surface treatment
  that remains distinguishable in Light, Dark, and System. Do not create a CSS class, custom alpha,
  token, wrapper, or local palette.
- Increase the expanded container radius using an existing Hito radius utility/token. It must be
  visibly larger than the current `rounded-md` and consistent between Color and Padding groups.
- Color retains one `color` icon in the group heading. Omit the duplicate icons from its Text, Fill,
  and Border child lines; preserve each child label, colour swatch, current/desired value, menu,
  tooltip, keyboard behavior, and remove action.
- Padding child-line directional icons remain. They are semantic evidence of Top/Bottom/Left/Right,
  not decorative duplicates.

## Existing Seams To Reuse

- `src/components/devtools/LocalUiTaskDraftPanel.tsx` — the one canonical local `draft` owner and
  existing functional `setDraft` update path.
- `src/components/devtools/LocalUiTokenControls.tsx` — token group construction, group expansion,
  Color expansion, and current-to-desired rendering.
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx` — existing `HitoValueTag`,
  `Select`, colour swatch, tooltip, and pending-change removal compositions.
- `src/components/devtools/local-ui-task-draft-view-model.ts` and
  `src/components/devtools/local-inline-change-target-utils.ts` — existing actionable/payload
  selection derivation. Do not add another serialization path.

## Reuse-First Change Budget

- New production runtime artifacts: **none**.
- Reuse the single `desiredTokens` map and existing Inspector control primitives.
- Replace the repeated stale per-control group writes with one existing-draft atomic group update;
  do not retain the broken loop as a compatibility path.
- Consolidate the equivalent existing expanded-group container composition where it can be done
  inside `LocalUiTokenControls.tsx`; do not create a global Design System primitive or stylesheet.

## What Not To Touch

- `src/components/ui/*` shared primitives, global Design System CSS/tokens, generated manifest,
  semantic colour channel metadata, Foundation pages, Product routes, backend, fixtures, Figma,
  browser-selected page styles/content, hosted state, Git lifecycle, or provider calls.
- The accepted Color semantic option set, its generated labels/channels source, its order directly
  above Actions, and its explicit `Remove color` behavior.
- The accepted one-field editable-text behavior.

## Definition Of Done

1. On one real target that exposes Radius/Padding/Gap plus multiple Color channels, a group Radius
   selection changes all four draft entries atomically and visibly shows current-to-desired.
2. Grouped horizontal and vertical padding have the same atomic behavior; a direct child-side edit
   remains intentionally partial and truthful.
3. A Color selection/clear/remove and multiple token selections coexist in one generated request;
   no property is lost or resets another one.
4. Expanded Color and Padding groups have no outer left indent or decorative border, retain their
   existing top/right/bottom padding, use one larger existing radius and a darker semantic neutral
   background in all themes.
5. Color children do not repeat the colour icon; padding children retain directional icons.
6. No Inspector interaction mutates the selected page or persistent state.

## Validation Expectations

| Check                       | Scenario / environment                                         | Required evidence                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atomic Radius discriminator | Real Color-bearing target with four equal radii                | One changed group selection yields four desired entries, current-to-desired UI, an actionable payload, and restore to current-only.                                                     |
| Grouped and direct Padding  | Uniform horizontal/vertical group plus one expanded child side | Group choice updates both sides atomically; child choice affects only its selected side.                                                                                                |
| Coexistence                 | Same target                                                    | Radius, Padding, Gap, Color selection, Color clear/Remove, chrome, and typography do not reset or hide one another; generated batch contains every request truthfully.                  |
| No live mutation            | Before/after computed-style snapshot                           | Target text, colour, padding, radius, and border remain unchanged by Inspector draft selection.                                                                                         |
| Expanded-control chrome     | Desktop and exact 375×812, Light/Dark/System                   | Right chevron alignment, no fake Color value, no left outer indent, preserved vertical padding, larger existing radius, borderless darker surface, correct icon reduction, no overflow. |
| Interaction                 | Pointer and keyboard                                           | Select menus, expand/collapse, current-to-desired removal, focus, and accessible names retain their behavior.                                                                           |
| Static                      | Task-owned source                                              | Focused Prettier, ESLint, applicable existing DevTools/DS validation, and `git diff --check`.                                                                                           |
| Fixture                     | Local server lifecycle                                         | If the task stops `qa_fixture`, restart it before the final receipt.                                                                                                                    |

## Next Recommended Role

FRONTEND — DevTools lane

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Frontend Lane: DevTools
Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-local-ui-inspector-atomic-group-drafts-and-control-chrome.md`

Read `AGENTS.md`, `agents/frontend.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. This is local Inspector work
only. Preserve accepted dirty work from the Color Property Control and Editable Text tasks; do not
reimplement either.

The confirmed root cause is grouped token writes built from a stale `draft.desiredTokens` snapshot:
the group currently invokes one parent update per side, so only the last Radius/Padding entry
survives. Repair this at the existing `LocalUiTaskDraftPanel.tsx` / `LocalUiTokenControls.tsx` draft
seam with one atomic update of the existing `desiredTokens` map per group selection. Do not add a
second state map, reducer, registry, serializer, wrapper, component primitive, CSS recipe, or
compatibility path.

Then implement only the documented Color/Padding expanded-group presentation: Color chevron right
with no fake value; no outer left indent; preserve existing top/right/bottom padding; larger existing
Hito radius; no decorative border; darker existing semantic neutral background; one Color icon at
the group heading and no duplicate child icons. Padding child directional icons remain.

Validate the exact atomic Radius/Padding discriminator, direct-side partial truth, coexistence with
Color/Gap/chrome/typography, generated request accumulation, no live target mutation, desktop and
375×812 in Light/Dark/System, keyboard/menu/focus, no overflow or console errors, focused static
checks, and a running `qa_fixture` after proof. Do not touch shared DS source, Product, Backend,
Figma, hosted state, staging, commit, push, deployment, providers, or material data. Final formal
receipt must be English.
```

## Blockers

None.

## Lite Completion Receipt

- **Task / mode:** Local UI Inspector Atomic Group Drafts and Control Chrome / Lite.
- **Outcome:** completed at the existing DevTools draft seam. A grouped Radius or Padding choice now
  reaches the parent once and is applied by one functional `setDraft` update against the current
  `desiredTokens` map. Direct-side changes remain partial, and group clearing removes only that
  group's entries.
- **Root cause closed:** the former group-level `forEach` issued multiple parent writes that each
  cloned the same render-time map. The repeated write path was removed; there is no compatibility
  branch or second state owner.
- **Presentation:** expanded Color and Padding now use the existing `rounded-lg`, `bg-muted`, and
  `p-1` utilities with no outer margin or border. Color keeps its single heading icon and child
  selects; Padding keeps its directional child icons. The Color heading has only its right-aligned
  chevron and no invented value.
- **Files changed:**
  - `src/components/devtools/LocalUiTaskDraftPanel.tsx`
  - `src/components/devtools/LocalUiTokenControls.tsx`
  - this canonical item
- **New production runtime artifacts:** none. Six task-scoped screenshots under
  `qa-artifacts/screenshots/2026-08-11/local-ui-inspector-atomic-group-drafts-and-control-chrome/`
  are local QA evidence only.
- **Preserved boundaries:** accepted Color and Editable Text behavior, one local draft map, shared
  Design System source, Product, Backend, persistence, Figma, hosted state, and unrelated dirty work
  were not changed.

| Check                                 | Scenario / environment                         | Result                       | Evidence                                                                                                                                                                                                                             |
| ------------------------------------- | ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Atomic Radius                         | `/`, Color-bearing profile card, 1440x900 Dark | Passed                       | One `--radius-xl` choice produced all four corner entries and `Radius 10px -> 12`; Keep current restored `Radius 10px`.                                                                                                              |
| Atomic and partial Padding            | Same target                                    | Passed                       | Horizontal group produced left/right and Vertical produced top/bottom in one draft. A direct Top change retained Bottom at `--space-2`; collapsed partial state showed only current `12px`.                                          |
| Group clear and coexistence           | `Today` button, exact 375x812 Light            | Passed                       | Clearing Horizontal padding removed only left/right; Radius, Gap, an active UI page title request, Remove Fill, Text `Today`, Border, and Actions remained.                                                                          |
| Color lifecycle and generated request | Profile card, 1440x900 Dark                    | Passed                       | Semantic Fill selection, clear-to-current, and Remove Fill all passed; final generated batch included Radius, Padding, Gap, and remove-background requests together.                                                                 |
| No live mutation                      | Before/after computed-style snapshots          | Passed                       | Text, text/fill color, padding, radius, and border were identical before and after draft interaction on both exercised targets.                                                                                                      |
| Expanded-control chrome               | 1440x900 and 375x812; Dark, Light, and System  | Passed                       | Both containers computed `margin-left: 0`, 4px padding, 0px borders, 8px radius, and the theme-resolved muted background. Color chevron right delta was 0; no Color child icon remained; Padding child icons remained.               |
| Responsive and console                | Six browser scenarios                          | Passed                       | Document/body overflow delta was 0 and page-error/console-error inventories were empty. Screenshots were captured for each scenario.                                                                                                 |
| Keyboard, focus, and menus            | Real Inspector controls                        | Passed                       | Enter expanded/collapsed Color and Padding with truthful `aria-expanded`; Radix token/color menus, pending-change removal, and focus remained usable.                                                                                |
| Static and build                      | Task-owned source and managed runtime          | Passed                       | Focused Prettier and ESLint, Hito DS component validator, `git diff --check`, and the production client/SSR/Nitro compilation passed.                                                                                                |
| Fixture lifecycle                     | Managed loopback runtime                       | Passed with environment note | `qa_fixture` remained managed, loopback-only, and healthy after browser proof. Repository-wide Admin snapshot digest churn from unrelated concurrent backlog writes can mark artifact freshness stale; no Admin workaround was made. |

This Lite implementation is complete and was not promoted. Global QA Acceptance and release
readiness are not claimed.
