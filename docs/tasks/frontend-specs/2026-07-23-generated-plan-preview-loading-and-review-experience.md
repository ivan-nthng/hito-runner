# Generated Plan Preview Loading And Review Experience

## Work Item ID

2026-07-23-generated-plan-preview-loading-and-review-experience

## Status

completed

## Type

frontend_spec

## Priority

high

## Owner

frontend

## Scope

generated-plan-creation-engine

## Archive Intent

retain_in_place

## Frontend Lane

product

## Task

Make initial generated-plan waiting a compact, focused preparation surface while preserving the
existing review dialog for ready, refresh, unavailable/error, and confirm-pending states.

## Stage

FRONTEND fix-forward and integrated QA complete. Global QA Acceptance remains a separate release gate.

## Implementation Closeout

- Reduced motion now transitions directly from loading to ready review; the ordinary completion
  transition remains unchanged.
- Full keyboard traversal, Escape/Cancel focus return, and exact `375px` containment passed in
  WebKit with the accepted frozen fixture.
- A deterministic correctable unavailable outcome is exercised before provider dispatch and does
  not expose Create or persist any plan.
- One independent QA subagent reviewed the complete owner-level inventory.

Implementation DoD: Passed. Global QA Acceptance: Pending as a separate release-level gate.

## Last Updated

2026-07-24

## Track Tags

`plan-creation`, `preview-loading`, `local-design-suite`

## Plan File

None. This is a new bounded design task; closed running-plan engine and historical preview-readback
plans remain closed.

## Historical Implementation Prompt

```text
ROLE: FRONTEND

Task:
Implement the revised canonical generated-plan preview loading and review experience.

Stage:
FRONTEND implementation with independent QA support.

Frontend lane: Product

Specification:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-23-generated-plan-preview-loading-and-review-experience.md

Demonstrated root cause:
The first pass retained the stable review header and too much explanatory copy during
`previewing_plan`. The result is a loading state that still reads like an empty plan-review dialog
rather than one focused preparation moment. Separately, fixture-mode provider authorization has a
Backend-owned fail-closed repair; do not conceal or work around that runtime boundary in the UI.

Required outcome:
- Initial loading is a compact content-fit preparation surface. Hide the review eyebrow, review
  title, description, and top-right close affordance only while no draft exists. Keep the normal
  header and close affordance for ready review, refresh, unavailable/error, and confirm-pending.
- Use the existing Hito `workout` (Activity) icon as the temporary marker, calmly changing between
  existing foreground and signal colors. No GIF, video, Lottie, Rive, custom SVG artwork, new
  animation dependency, or second modal/state system.
- The only loading heading is `Preparing your {Goal} plan`; remove the duplicate calendar/workout
  explanation and the `Nothing is being saved yet` line from the visual surface.
- Add a decorative, unlabelled waiting bar using the existing Hito progress track/fill treatment.
  It must progress substantially more slowly than the first pass, plateau before completion, and
  complete only when a valid draft arrives. It remains local presentation: never show a numeric
  percentage, duration, stage, or estimate, and never wait artificially after a valid draft exists.
- Rotate one approved playful waiting line under the bar. The lines must be obviously playful and
  never claim external data access, medical analysis, or a real backend action.
- Add one quiet `Cancel` command in the loading footer. It dismisses the local preview attempt and
  returns the runner to setup without persistence; it must not claim to abort a server/provider
  request unless that cancellation is actually implemented and proven.
- Preserve the existing non-persisting preview -> explicit review -> confirm -> persistence
  lifecycle and all backend-shaped review truth.
- Keep refresh and confirm-pending visibly distinct from initial generation. Do not present the
  decorative waiting bar as real percentage, stage completion, elapsed time, cancellation, or
  hidden persistence.
- Reuse the existing Hito Dialog, Button, typography, state surface, status pill, icon, toast,
  light/dark token, and responsive contracts. Do not add route-local dialog chrome.
- Keep the shared behavior correct for both no-active-plan Quick setup and the active-plan create
  surface that reuse `PlanPresetPanel`.
- Do not materially grow the existing 700+ line preview-dialog hotspot without preserving a focused
  responsibility seam. Delete any loading-only local recipe superseded by the accepted composition.

Definition of Done:
- Every state in the specification is visually and semantically distinguishable.
- Initial loading no longer appears as a small card inside a mostly empty fill-height dialog.
- The loading marker is calm, theme-safe, decorative, reduced-motion-safe, and does not trigger
  React rerenders for every color change.
- The decorative waiting bar never completes successfully before a valid draft exists; success is
  brief, clear, and only follows that actual transition.
- Ready review, refresh, retry, confirm-pending, close/dismiss, review token, and persistence
  behavior remain unchanged except for the specified presentation and honest status treatment.
- Desktop and exact 375px light/dark browser evidence, reduced-motion proof, keyboard/focus and
  screen-reader status behavior, no overflow, targeted lint, fresh production build, build
  integrity, runtime health, cleanup, and scoped diff hygiene all pass.

Use one reusable QA subagent for independent acceptance and integrate the complete required check
inventory in the final report. Stop if implementation requires new backend progress truth, provider
behavior, persistence semantics, or an animation runtime.
```

## Root Cause

### Visible symptom

The initial generated-plan wait is a small `hito-surface-wash` inside a review-size dialog whose
body is forced to fill a large bounded height. Most of the modal appears empty, so the wait feels
unfinished rather than intentional.

### Demonstrated underlying cause

`SelectedRunningPlanPreviewDialog` currently combines:

- `hito-dialog-size-review`;
- `hito-dialog-height-review`;
- `hito-product-dialog-body-scroll-fill`;
- a loading branch containing only a short title and sentence.

The dialog body mode is correct for the long calendar/workout review, but it is applied before
review content exists. This is a rendering-composition mismatch, not missing provider progress.

### Canonical owner

The first incorrect owner is the generated-plan preview rendering composition using the existing
Hito product-dialog body modes. Backend and provider state are not incorrect.

## Preserved Product Truth

- Preview generation is non-persisting.
- A successful preview contains backend-shaped canonical review truth and review token/checksum.
- Creating a plan requires an explicit runner action after the preview is ready.
- Confirm revalidates and persists the reviewed plan without another AI call.
- `previewing_plan` is indeterminate. No provider percentage, item count, stage, queue position,
  or time estimate is available. The waiting bar is local presentation only and has no backend
  meaning.
- Refresh creates a new review attempt; confirm-pending is a separate persistence action.
- Existing unavailable outcome types and blocked confirm reasons remain backend-shaped.
- The shared dialog is consumed by no-active-plan Quick setup and active-plan create/transition
  contexts through the existing shared plan setup surfaces.

## Experience Principles

1. **The dialog body mode follows content truth.** Compact states use content-fit; the real review
   uses scroll-fill.
2. **Waiting treatment remains honest.** The icon color, decorative bar, and playful line make
   waiting feel intentional, but only the arrival of a valid draft permits visual completion.
3. **The dialog itself is the state surface.** Initial loading is not wrapped in another bordered
   card.
4. **Review remains primary.** Illustration disappears when review truth arrives; it never competes
   with the plan.
5. **Refresh is not first generation.** Keep an existing review visible while refresh is pending
   when current frontend state still owns that draft.
6. **Confirm is not generation.** Confirmation uses the existing Button/toast busy language and
   leaves the reviewed content visible.
7. **Dismiss is not cancel.** Closing a pending preview or confirm surface never claims to cancel
   the server action.

## Canonical State Model

| UI state | Existing truth | Dialog mode | Body owner | Primary action |
| --- | --- | --- | --- | --- |
| `initial_loading` | `status === "previewing_plan"` and no draft | wide, content-fit | Loading marker, decorative wait, and copy | None |
| `ready_for_review` | valid draft and idle create/preview state | review, scroll-fill | Existing summary/calendar/workout review | Create plan |
| `refreshing` | `previewing_plan` while a draft remains visible | review, scroll-fill | Existing review plus compact pending notice | None until refreshed |
| `unavailable` | typed non-success preview result | standard/wide, content-fit | Typed state message | Retry when retryable |
| `error` | caught/request error | standard/wide, content-fit | Destructive state message | Try again |
| `confirm_pending` | `createStatus === "creating"` and draft | review, scroll-fill | Existing review plus confirm status | Creating plan |
| `confirm_blocked` | non-success confirm result | review when draft remains | Existing review plus typed blocked notice | Depends on reason |

Do not add a route-local state enum if the same view can be derived from existing props. The table
is a rendering grammar, not new product truth.

## Shared Dialog Anatomy

### Header

Ready review, refresh, unavailable/error, and confirm-pending keep the stable header:

- eyebrow: `Generated plan`;
- title: `{Goal} plan preview`;
- description: `Review the plan before creating it. Nothing is saved until you confirm.`;
- existing top-right close affordance.

Initial loading does not show this header. Its single preparation heading uses the selected goal
label available from `PlanPresetPanel`; do not show the fallback title `Selected plan preview`.

### Body modes

- `initial_loading`, `unavailable`, and request `error` use existing
  `hito-product-dialog-content-fit` anatomy.
- `ready_for_review`, `refreshing`, and `confirm_pending` use existing review width,
  viewport-bounded height, and `hito-product-dialog-body-scroll-fill`.
- Do not fake compactness by keeping a fill-height body and vertically centering one small bordered
  card.
- Do not introduce a second Dialog, Sheet, or overlay family.

### Footer

- Initial loading has no disabled `Refresh preview` / `Review required` pair and no top close
  affordance. Its only dismissal action is the quiet footer `Cancel` command.
- Ready review uses one secondary `Refresh preview` and one primary `Create plan`.
- Footer status uses `Ready to review` plus `Not saved`, not the ambiguous runner-facing label
  `Reviewed`.
- Refresh disables Create until a current valid review is available.
- Confirm-pending keeps the primary button in its existing loading state and disables refresh.
- Error/unavailable uses at most one retry/correction action plus Close when a footer action is
  needed. Do not show a disabled create action.

## Initial Loading

### Composition

Use one compact, centered stack inside the content-fit dialog body:

1. temporary runner activity marker;
2. `Preparing your {goal} plan`;
3. decorative waiting bar;
4. one rotating playful waiting line;
5. footer-aligned `Cancel` command.

Maximum text measure is approximately `30rem`. Do not add skeleton cards, numbered percentage,
elapsed timer, fake workflow steps, or multiple state panels.

### Visual hierarchy

- Marker: the existing large Hito Icon tier, without a bespoke size scale.
- Gap from marker to title: one normal Hito section gap.
- Title: `hito-section-title`.
- Waiting bar: reuse the existing Hito progress track/fill presentation. Keep it compact, unlabelled,
  and secondary to the state copy.
- Playful line: `hito-caption` or equivalent quiet support role. It changes at a calm cadence and
  never changes the accessible loading status.
- Background: the existing dialog surface. Optional atmosphere may use the existing low-alpha
  signal wash token behind the marker, without a border or nested card.

### Semantics

- The body state owns `aria-busy="true"`.
- One text wrapper uses `role="status"` and `aria-live="polite"`.
- The decorative loading marker uses `aria-hidden="true"`.
- The decorative waiting bar and playful lines are not announced as progress or repeated status.
- `Cancel` and closing the dialog dismiss the local view but do not claim to cancel preview generation.
- If the preview completes while the dialog is closed, retain the existing success toast. If the
  dialog remains open, the in-place ready transition is sufficient and should not be duplicated by
  another visible success message.

## Temporary Runner Activity Marker

Use the existing Hito `workout` (Activity) icon as the temporary visual marker until a separately
approved runner artwork handoff exists. It is a loading cue, not a new product illustration system.

### Behavior

- The marker remains optically still and changes only its semantic color at a calm cadence while
  `initial_loading` is visible.
- Rest and one phase use existing foreground/muted-foreground treatment; the active phase uses the
  existing Hito signal color. Do not hardcode light or dark colors.
- The marker has no route, steps, scenery, completion, stopwatch, percentage, glow, or progress
  metaphor.
- The implementation must use the existing Hito `Icon` contract and CSS presentation ownership; do
  not add custom runner SVGs, a frame set, or an animation dependency.
- Stop the color treatment when the state leaves `initial_loading`.

### Decorative waiting bar

- The bar begins from empty and advances smoothly toward 96% while initial loading is still active.
- It holds below completion until a valid reviewed draft actually arrives. Do not imply failure,
  retry, or stuck state while it waits.
- When the valid draft arrives, finish the remaining distance quickly, show one bright check state,
  then transition into the ready review. Do not show the check on unavailable, error, or dismissed
  outcomes.
- The bar has no visible percentage, time estimate, stage label, or ARIA progress value. It is a
  decorative waiting treatment, not a representation of provider progress.
- Do not introduce a new Progress component or progress token. Reuse the existing Hito progress
  track/fill treatment within this local loading composition.

### Playful waiting lines

Use a small fixed set of approved, light lines. Select a line on open and rotate calmly only while
initial loading remains visible. Candidate copy:

- `Checking the calendar for room to breathe.`
- `Consulting an imaginary committee about comfortable socks.`
- `Definitely not calling your friends for pace advice.`
- `Making sure the long run gets the good socks.`

These are atmosphere, not status. Do not say that Hito is accessing friends, devices, health data,
or sources beyond the runner's submitted plan inputs.

### Reduced motion and fallback

- Under `prefers-reduced-motion: reduce`, render the same icon in its quiet non-animated state and
  keep the waiting bar static below completion.
- If the existing `workout` icon cannot render, use the existing Hito loader icon rather than
  introducing artwork. The useful loading copy remains sufficient on its own.

## Ready For Review

Keep the accepted summary, goal readback, calendar, selected workout, and workout-document content.
This slice changes the framing, not backend-shaped review truth.

Required hierarchy:

1. Header identifies the generated goal and non-saved review boundary.
2. Compact summary establishes goal, duration, rhythm, and metric truth.
3. Calendar preview remains the main plan-level review surface.
4. Selected workout document provides exact structure.
5. Footer contains review status and explicit Create.

Use `Ready to review` for runner-facing readiness. Backend review token/checksum remain internal
capability truth and must not be described as proof that the runner has already reviewed the plan.

### Transition from loading

- Replace the loading body with review content only after a valid draft arrives.
- Announce `Plan preview ready for review.` once through a polite live region.
- Do not steal keyboard focus or reset the dialog close control while the runner is interacting.
- No large shell-morph or celebratory animation is required. A short body opacity transition may be
  used under normal motion; reduced-motion swaps immediately.
- If the dialog was dismissed while loading, use the existing success toast instead of reopening it.

## Refreshing

Refresh is a pending replacement of review truth, not a replay of the initial loading marker.

- Keep the current review visible while it remains in frontend state.
- Add one compact status notice above the review content:
  - title: `Refreshing preview`;
  - copy: `Hito is preparing a new reviewed version. Nothing is being saved.`
- Use the normal Hito loader icon or Button loading treatment; do not show the runner activity
  marker.
- Disable Create until the refreshed draft has current valid review token/checksum.
- The Refresh button reads `Refreshing...` and remains disabled.
- If refresh fails and current review is no longer accepted by the controller, move to the typed
  error state. Never silently re-enable Create from stale review truth.

## Unavailable And Error

Use compact content-fit dialog anatomy, one semantic state surface, and no runner activity marker.

### Correctable input

For `invalid_structural_input`:

- title: `Check the plan details`;
- body explains that required details are missing or invalid;
- persistence line: `Nothing was created or saved.`;
- action closes the dialog and returns the runner to the setup surface.

Do not show Retry when the same unchanged input must fail again.

### Retryable preview outcomes

Provider runtime failure, incomplete/malformed output, compiler rejection, review refusal, and
request failure use:

- current typed title/copy where it remains accurate;
- persistence line: `Nothing was created or saved.`;
- primary action: `Try again`;
- secondary dismissal: `Close`.

Use signal/warning for retryable unavailability and destructive/error only for a real failed
request or persistence failure. Do not use success tone.

## Confirm Pending And Blocked

Confirm-pending begins only after the runner presses the primary Create action.

- Keep the reviewed plan visible.
- Mark the dialog/review region busy and disable refresh/create re-entry.
- Primary button uses the existing Hito Button loading anatomy and the supplied pending label.
- The pending primary button exposes `aria-busy="true"` in addition to its disabled state.
- Add or retain one concise status line: `Hito is saving the plan you reviewed.`
- Keep the existing working toast as the persistent global status if the dialog is dismissed.
- Do not show the runner activity marker: the system is persisting a reviewed plan, not generating
  another one.
- Close/dismiss does not cancel confirmation and must not be labeled `Cancel`.

For a blocked confirmation:

- stale/invalid/mismatched review promotes `Refresh preview` as the next action;
- active-plan-exists keeps the existing route-back action;
- unauthenticated and persistence failure use their existing failure truth;
- Create must not remain the visually primary next step when backend says the review is stale.

## Responsive Behavior

### Desktop

- Initial loading and unavailable/error use a content-fit dialog, approximately wide/standard Hito
  dialog width rather than the fixed review height.
- Ready, refreshing, and confirm-pending use the current review-size bounded dialog.
- Marker and copy remain visually centered, but header text remains left-aligned per Hito
  dialog anatomy.

### Exact 375px

- Keep the existing viewport-bounded Hito dialog/sheet behavior; do not invent a separate mobile
  preview route.
- Loading body padding follows existing mobile dialog rhythm.
- The marker keeps the same existing Hito Icon tier at 320-375px; it must not clip or shrink the
  loading copy.
- Review content remains one scroll owner; no nested vertical scroll container.
- Footer actions stack full width with the primary action first visually.
- Status pills/warnings wrap without horizontal scrolling.
- Calendar and workout readback preserve their accepted mobile behavior.
- Respect top/bottom safe-area padding when the dialog becomes near-full-height.

## Accessibility And Keyboard

- Preserve Radix Dialog focus trap, title/description association, Escape, outside-dismiss, and
  focus restoration.
- The loading marker is decorative; all useful state is textual.
- Initial loading, refresh, ready, and confirm-pending announce once per state transition.
- Do not place focus on the loading marker or move focus when its color, decorative bar, or playful
  line changes.
- Buttons preserve Hito focus-visible, disabled, loading, and accessible-name contracts.
- `Try again`, `Refresh preview`, and `Create plan` remain real buttons.
- Do not use color, motion, or icon alone to communicate state.
- Under reduced motion, no repeated motion remains.
- Dismissing pending work must not be labeled or announced as cancellation.

## Hito DS Reuse

Reuse:

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`;
- `hito-product-dialog`, `hito-product-dialog-content-fit`,
  `hito-product-dialog-body-scroll-fill`, and existing dialog size/height classes;
- `hito-state-surface` / `hito-surface-wash` for error and compact pending notices, not as a nested
  wrapper around the initial loading marker;
- `hito-button-primary`, `hito-button-secondary`, existing Button loading behavior;
- `hito-status-pill`;
- `Icon` loader/warning/error states;
- `hito-micro-label`, `hito-modal-title`, `hito-section-title`, `hito-support-copy`,
  `hito-caption`, and current review typography;
- existing Hito toast behavior for background/pending/success/error feedback;
- Hito semantic `foreground`, `muted-foreground`, `signal`, `hairline`, `surface`, and state tones.

## Genuine DS Gap

No new dialog, loading, progress, illustration, or animation primitive is proven necessary. The
temporary marker and waiting bar reuse existing Icon and progress presentation contracts inside this
one loading composition. A future runner artwork handoff is a separate design task and must not be
created as part of this slice.

## Implementation Boundaries

- Do not change provider calls, goal semantics, preview input, compiler behavior, review token,
  checksum, confirmation, persistence, or route navigation.
- Do not present the decorative waiting bar as real provider progress, add stage names, elapsed
  time, completion estimates, or cancellation.
- Do not replace the accepted calendar or workout readback.
- Do not add GIF/video/Lottie/Rive/canvas or another dependency.
- Do not duplicate no-active and active-plan dialog implementations.
- Do not add another toast system.
- Do not turn the temporary loading marker into a general Hito mascot system.
- Do not materially expand the existing 700+ line preview-dialog file with another mixed
  responsibility. Preserve a focused state/marker seam or explain why the canonical owner
  remains reviewable.

## Acceptance Criteria

1. Initial loading is compact and visually intentional, with no large empty fill-height body.
2. Loading copy states that the preview is being prepared and nothing is saved.
3. The temporary marker uses the existing Hito `workout` (Activity) icon and only a calm semantic-color
   treatment while loading.
4. The unlabelled waiting bar reaches but does not complete past 96% before a valid draft exists;
   it completes and briefly shows a check only after that real transition.
5. Playful waiting lines are clearly atmospheric and do not claim data access or backend activity.
6. Reduced motion renders the same marker without repeated color change and leaves the waiting bar
   static below completion.
7. Ready review uses `Ready to review` and `Not saved`, not runner-facing `Reviewed`.
8. Accurate goal identity is visible before the draft returns.
9. Refresh keeps existing review context when safely available and disables Create.
10. Error/unavailable uses compact truthful next actions.
11. Confirm-pending retains review context and uses existing Button/toast busy treatment.
12. No-active Quick setup and active-plan create consumers stay consistent through the shared
    owner.
13. Dark/light desktop and exact 375px have no clipping, overflow, dead zones, or inaccessible
    actions.
14. Focus, announcements, Escape, dismissal, reduced motion, and button states are accessible.
15. No backend/product semantics or persistence behavior changes.
16. No new runtime dependency or parallel DS/modal/state system is introduced.

## Required Frontend Validation Inventory

| Check | Scenario / environment | Required evidence |
| --- | --- | --- |
| Root-cause discriminator | Initial loading before/after: dialog body mode and occupied geometry | Source plus desktop/mobile screenshot |
| Loading marker | Existing Hito `workout` (Activity) icon, semantic theme colors | Source and rendered-state proof |
| Decorative waiting bar | No numeric progress, 96% hold, real-draft completion, failure path | Browser state/DOM proof |
| Playful lines | Initial loading, rotation, screen-reader behavior | Rendered copy and announcement proof |
| Initial loading | Light/dark desktop and exact 375px | Screenshot, DOM state, no overflow |
| Reduced motion | `prefers-reduced-motion: reduce` | Static-marker/bar screenshot and computed motion proof |
| Ready transition | Successful preview while dialog remains open | Browser state transition and one live announcement |
| Closed completion | Close while loading, then success | Existing toast proof; no auto-reopen |
| Refresh | Draft visible, refresh pending/success/failure | Browser proof; Create disabled while pending |
| Unavailable/error | Correctable and retryable outcomes | Browser or deterministic local fixture proof |
| Confirm pending | Explicit Create, busy button/toast, dismiss semantics | Browser proof; no fake cancel |
| Blocked confirm | Stale/invalid and persistence failure | Source plus safe browser/fixture proof |
| Keyboard/focus | Open, Escape, close, retry, refresh, create | Focus order and return proof |
| Responsive | Desktop and exact 375px | No horizontal overflow or nested-scroll failure |
| Theme | Dark and light | Loading marker and state contrast screenshots |
| Shared consumers | No-active Quick setup and active-plan create | Source reachability plus representative browser proof |
| Source shape | Preview dialog hotspot and extracted/focused ownership | Line/source report and cleanup scan |
| Static validation | Targeted lint and scoped diff check | Command output |
| Build/runtime | Fresh production build, integrity, local runtime health | Command/runtime output |
| Cleanup | Disposable local data when stateful fixtures are used | Zero/readback proof |

## Blockers

None at design time. FRONTEND must stop if the required marker cannot reuse an existing Hito Icon or
if any requested state requires backend progress/stage truth that does not currently exist.
