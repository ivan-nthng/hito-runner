# Local UI Inspector Editable Text Single Field

## Work Item ID

2026-08-11-local-ui-inspector-editable-text-single-field

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

Replace the Local UI Inspector's two-field editable-text control with one directly editable
current-text field. This is local DevTools draft authoring only: editing, pasting, or clearing
the field changes the Inspector draft and generated batch request, never the inspected page's DOM,
CSS, persisted state, Product data, or Design System source.

This item follows the currently in-progress
\`2026-08-11-local-ui-inspector-color-property-control\` task. It must not overwrite, reimplement,
or broaden that task's Color work.

## Archive Intent

retain_in_place

## Task

For a target with captured visible text, render exactly one text-editing control:

- the existing typography icon and \`Text\` label;
- one existing controlled text field, prefilled with the captured current text;
- a clear icon action on the right whenever that field is non-empty.

The field itself is the desired text. Clicking it must permit ordinary selection, typing, deletion,
and paste. There must be no separate visible \`Current\`, \`Proposed\`, \`Optional replacement text\`,
or read-only duplicate field.

Clearing the input is an intentional proposed replacement with empty text. It must remain distinct
from making no edit at all, and must serialize truthfully as a request to remove the selected
target's text. Clearing must not immediately remove text from the inspected page.

## User Report

The current Inspector presents two confusing fields: a read-only current-text field and another
field where a replacement must be entered. Ivan wants a single field containing the current text.
He must be able to click it, replace or paste text, or use a clear affordance; no second text field
is acceptable.

## Observed Behavior

- \`src/components/devtools/LocalUiTextControlRow.tsx:23-30\` renders a \`Current\` read-only
  \`Textarea\` beside a separate empty \`Proposed\` \`Textarea\`.
- \`src/components/devtools/local-ui-inspector-session.ts:45-56\` initializes every
  \`draft.proposedText\` to \`""\`, instead of the captured visible text.
- \`src/components/devtools/local-ui-task-draft-view-model.ts:128-136\` counts a proposed text
  change only when the normalized proposal is non-empty, so clearing text cannot be actionable.
- \`src/components/devtools/local-inline-change-target-utils.ts:381-382\` normalizes an empty
  \`proposedText\` to \`null\`; \`local-ui-inspector-session.ts:127-131\` likewise has no remove-text
  summary path.

## Demonstrated Cause

The first incorrect canonical owner is the existing DevTools text-control and draft-payload seam,
not the selected Product element. It models the current value and the desired value as two UI
fields, while its empty-string normalization cannot distinguish an untouched draft from an
intentional clear.

## Required Behavior

### 1. One field only

- Reuse the existing \`Textarea\` as the one controlled field; do not add a new primitive, wrapper,
  local editor framework, or parallel text state.
- It starts with \`target.visibleText\` exactly as captured. Whitespace remains editable; action
  comparisons may normalize only under the current payload contract.
- Its accessible name makes clear it edits the selected target's text. Do not expose the words
  \`Current\` or \`Proposed\` as a second UI hierarchy.
- At narrow widths, the same one field may wrap below the icon/label only when needed for
  containment; it must not duplicate into a second field.

### 2. Clear and replacement

- Reuse the existing ghost/icon-only \`HitoButton\` plus existing \`close\` icon pattern for the
  clear action. It is visible only while this field contains text and has an explicit accessible
  name such as \`Clear text draft\`.
- Clear sets the same draft field to \`""\`; it does not reset it to the original capture and does
  not mutate the inspected document.
- Typing or pasting after clear uses that same field and replaces the empty draft normally.
- Returning the field exactly to its captured value removes the pending text change and restores
  the normal disabled/clean draft state.

### 3. Draft and generated-batch truth

- Initialize the one existing \`draft.proposedText\` value from the captured text for editable
  targets. Do not add \`desiredText\`, an \`isCleared\` compatibility flag, or a second draft model.
- A non-empty replacement serializes through the existing \`proposedText\` payload field.
- An intentional empty replacement must serialize as an explicit empty text request rather than
  \`null\`/\`Not requested\`, and the summary/generated prompt must say \`Remove text\` (or equally
  factual language), not \`Replace text with “”.\`
- An untouched or restored-to-original field serializes as \`null\`, so unchanged inspector items
  do not acquire a false text request.
- Preserve existing non-text actions, comments, scope, Color draft data from the preceding task,
  and target evidence exactly as they are.

### 4. Boundaries

- Do not live-edit, preview-edit, or write back to the selected page.
- Do not change Product routes, shared Design System CSS/tokens, icon registry, generated Hito DS
  manifest, Figma, backend, persistence, fixture data, or hosted state.
- Do not change the shape of any unrelated Inspector request. The only payload distinction added
  is the existing \`proposedText\` field retaining an explicit empty replacement when the current
  target text was non-empty.

## Existing Seams To Reuse

- \`src/components/devtools/LocalUiTextControlRow.tsx\` — replace the two-field rendering with one
  controlled text field and the existing clear-button composition.
- \`src/components/devtools/local-ui-inspector-session.ts\` — initialize and summarize the existing
  \`proposedText\` draft field.
- \`src/components/devtools/LocalUiTaskDraftPanel.tsx\` — pass the current draft through the existing
  payload construction; do not add state.
- \`src/components/devtools/local-ui-task-draft-view-model.ts\` — determine dirty/actionable state by
  comparing the one field with captured text, including an intentional empty replacement.
- \`src/components/devtools/local-inline-change-target-utils.ts\` and
  \`src/components/devtools/local-ui-inspector-batch-prompt.ts\` — preserve the existing payload and
  batch formats while making explicit text removal factual.
- \`src/components/ui/editable-value-field.tsx:401-413\` — existing local example of the canonical
  ghost, icon-only clear affordance. Reuse its primitive composition only; do not import or force
  the unrelated field lifecycle into the Inspector.

## Reuse-First Change Budget

- Existing owners only: \`LocalUiTextControlRow\`, Inspector draft/session/view-model, and current
  payload/prompt format.
- New production runtime artifacts: **none**.
- Remove the duplicate \`Current\` / \`Proposed\` field rendering and its field-label helper rather
  than retaining it as an alternate or compatibility path.
- Keep one \`proposedText\` draft value; do not introduce parallel desired/current/cleared stores.

## Definition Of Done

1. An editable-text target displays one field populated with its current captured text, plus the
   existing icon and one conditional clear action.
2. There is no \`Current\` / \`Proposed\` pair or \`Optional replacement text\` placeholder anywhere in
   the Inspector text control.
3. Typing, paste, clear, and restoring the original text produce the correct clean/dirty state.
4. Generated batch output distinguishes unchanged text, replacement text, and \`Remove text\`.
5. The selected page remains unchanged until a later human-routed implementation task; no local
   Inspector interaction mutates DOM style/content or persistence.

## Validation Expectations

| Check                      | Scenario / environment                             | Required evidence                                                                                                           |
| -------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Source/draft discriminator | Captured non-empty text target                     | Default equals captured text; original is clean, replacement is dirty, clear is a distinct dirty removal, restore is clean. |
| Generated batch            | replacement and clear cases                        | Replacement shows proposed text; clear shows factual remove-text request; neither says \`Not requested\` when changed.      |
| Interaction                | Local Inspector, keyboard and paste                | One focusable text field accepts typing/paste; clear is accessible and focuses/preserves the expected control flow.         |
| UI containment             | Desktop and exact 375×812, available themes        | One-field composition is contained; no duplicate field, overflow, or console/page error.                                    |
| Regression boundary        | Existing Color-capable target after preceding task | Existing Color and other property controls remain present; no live target mutation.                                         |
| Static                     | Task-owned source                                  | Focused Prettier, ESLint, relevant existing DevTools validation, and \`git diff --check\`.                                  |
| Fixture                    | Local server lifecycle                             | If the task stops \`qa_fixture\`, restart it before the final receipt.                                                      |

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

\`\`\`text
ROLE: FRONTEND

Frontend Lane: DevTools
Mode: Lite

Execute the ready canonical item exactly as written:
\`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-local-ui-inspector-editable-text-single-field.md\`

Read \`AGENTS.md\`, \`agents/frontend.agent.md\`, and the applicable local DevTools source before the
first write. The preceding Color Property Control task has already changed the same Inspector
surface: preserve those accepted hunks and do not reimplement, reset, or broaden Color behavior.

Implement only the existing editable-text control, draft, payload, and prompt seams identified in
the item. Reuse the existing \`Textarea\`, ghost icon-only clear-button pattern, one
\`draft.proposedText\` value, and local Inspector request flow. Remove the two-field Current/Proposed
UI completely. The one field begins with captured text; clear is an intentional empty replacement;
restoring original text clears the pending request.

Do not add a new runtime artifact, text state model, live DOM mutation, Product/DS/Backend change,
dependency, route, fixture, hosted access, staging, commit, push, or deployment. Leave the
managed \`qa_fixture\` server running after proof.

Validate the source discriminator, replacement/clear/restored generated batch output, desktop and
375px containment, keyboard/paste and clear access, no selected-page mutation, no console error,
and focused static checks. Use a bounded independent review only if it materially improves the
proof; otherwise perform the focused check yourself. Final formal receipt must be English.
\`\`\`

## Blockers

None.

## Frontend DevTools Lite Receipt — 2026-08-11

### Outcome

- Replaced the duplicate read-only Current and editable Proposed controls with one controlled
  `Textarea` prefilled from the captured target text.
- Reused the existing typography icon, `HitoButton` ghost/icon-only composition, close icon, one
  `draft.proposedText` value, payload, summary, and generated-batch seams.
- The clear action appears only while the draft contains text, sets that same field to `""`, and
  returns focus to the text field. No parallel text state or runtime artifact was added.
- Unchanged/restored text serializes as `null`, replacement text serializes factually, and an
  intentional clear serializes as explicit empty text with `Remove text` summary/prompt language.
- Existing Color, typography, Actions, target evidence, and all non-text draft behavior remain
  available. Inspector interaction did not mutate the selected page or persisted state.

### Files Changed

- `src/components/devtools/LocalUiTextControlRow.tsx`
- `src/components/devtools/LocalUiTaskDraftPanel.tsx`
- `src/components/devtools/local-ui-inspector-session.ts`
- `src/components/devtools/local-ui-task-draft-view-model.ts`
- `src/components/devtools/local-inline-change-target-utils.ts`
- `src/components/devtools/local-ui-inspector-batch-prompt.ts`
- `docs/tasks/backlog/2026-08-11-local-ui-inspector-editable-text-single-field.md`

### Focused Proof

| Check                 | Scenario / environment                          | Result | Evidence                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Draft discriminator   | Direct source/runtime function replay           | Passed | Default and restored values were clean; replacement and clear were dirty. Payload values were respectively `null`, replacement text, and `""`.                                             |
| Generated batch       | Replacement and clear requests                  | Passed | Replacement retained its proposed text; clear produced `Remove text` in the item summary and `Proposed text: Remove text` in the generated prompt, never `Not requested`.                  |
| One-field interaction | Real `/` text target, desktop                   | Passed | Exactly one field was prefilled with `Tempo execution.`; real clipboard paste updated the draft; the conditional clear action removed the draft text and returned focus to the same field. |
| Keyboard/restore      | Exact `375x812`, Dark                           | Passed | Tab reached `Clear text draft`; Enter cleared it and refocused the editor. Restoring the captured text disabled submission again.                                                          |
| Responsive/theme      | `1280x720` and exact `375x812`, Dark and Light  | Passed | One field, clear action, composer, and Color row were contained; no duplicate field, horizontal overflow, console error, or page error occurred.                                           |
| No live mutation      | Replacement, paste, clear, and generated prompt | Passed | The inspected paragraph remained `Tempo execution.` throughout; proof drafts were discarded after inspection.                                                                              |
| Static/build          | Task-owned source and production runtime        | Passed | Focused Prettier and ESLint, DS component validation, rejected-path source search, `git diff --check`, and the production client/SSR/Nitro build passed.                                   |
| Fixture lifecycle     | Managed loopback runtime                        | Passed | `qa_fixture` remained managed, healthy, current, and fresh after the rebuilt browser proof.                                                                                                |

Required focused checks were completed. This receipt claims the Lite implementation result only;
it does not claim Global QA Acceptance, hosted verification, release readiness, or deployment.
