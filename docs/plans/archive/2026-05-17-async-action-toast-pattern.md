Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Implemented for approved first product scope; remaining v1 candidates deferred

Owner

Frontend Agent

Last Updated

2026-05-17

Context

Hito already has shared status language for inline errors, helper text, success text, pills, and route-level state surfaces. It also already has a technical `sonner` seam in `src/components/ui/sonner.tsx`, but the product does not yet define when toast feedback should be used versus when inline status should remain attached to the source action.

The immediate trigger is `Update plan` proposal generation inside `Open plan`. That action can take roughly `45–90 seconds`, while the current visible state is only the loading button text `Preparing proposal...`. In practice this can look like a stalled request instead of an intentionally long-running action.

Problem Definition

The current product has two gaps:

- long-running async actions can feel hung because the only visible progress is in the button label
- action completion feedback is often trapped inside the source surface, even when the user’s attention may have shifted or the surface may close after success

At the same time, Hito should not replace all inline status with toast behavior. Inline status is still the more honest and useful pattern when the feedback belongs to a field, disclosure, confirmation, or review object that remains on screen.

V1 Scope

Use toast-style async feedback only for the smallest set of actions where it solves a real perception problem.

Include in v1:

- `Update plan` proposal generation in `Open plan`
- `Apply update` after proposal review
- saved-mode plan import/apply from `Open plan`
- `Clear upcoming schedule`
- `Delete plan`

Do not include in v1:

- settings field save
- avatar upload
- workout logging save
- Garmin upload
- export/download

Reasoning:

- the selected v1 actions are long-running or state-changing and already live inside one concentrated modal flow
- they are also the clearest cases where a start toast and end toast can help without introducing app-wide inconsistency too early
- settings, logging, and Garmin already rely on local inline ownership and should not be migrated before the toast pattern proves itself
- export/download is awkward for v1 because browser save behavior does not always offer a truthful completion signal from the app

Toast Anatomy

Position

- top-center of the viewport, slightly below the app top edge
- one active stack, not bottom-corner consumer-app behavior

Visual weight

- lighter than a modal, stronger than helper text
- compact low-card surface using Hito tone: dark surface, hairline border, restrained success/signal/destructive accents
- should read as a temporary global status object, not a promotional banner

Content structure

- title:
  short action state
- body:
  one sentence max
- optional meta line:
  only for staged long-running language
- dismiss:
  inside the toast container as the right-side anatomy slot, never floating outside the toast

Icon states

- loading:
  signal-toned spinner or rotating mark
- success:
  green check
- error:
  destructive alert mark
- dismissed:
  no persistent history surface in v1

Progress style

- indeterminate only
- no percentage
- no fake progress bar that implies measurable backend completion
- optional staged copy changes after time thresholds

Success and error states

- same toast object should update in place from loading to success or error when possible
- related steps in one async action family should share a stable toast id so the newest outcome replaces older feedback instead of being masked by the one-visible-toast stack
- success should resolve quickly and then auto-dismiss
- error should remain longer and allow manual dismissal

Dismissal behavior

- close button or manual dismiss is allowed
- dismiss never implies action cancellation

Duration

- loading:
  persistent until resolved
- success:
  auto-dismiss after about `2.5–4s`
- error:
  remain until dismiss or a longer timeout around `6–8s`

Long-Running Behavior

Hito should use a truthful indeterminate model rather than fake percentages.

V1 behavior:

- button enters loading immediately
- toast appears immediately after action start
- toast title names the action:
  `Preparing plan update`
- toast body sets expectation:
  `This can take a little while. You can keep reading this proposal area while Hito works.`

Staged thresholds:

- `0–10s`
  initial loading message only
- `10–30s`
  update body once:
  `Still working through your saved plan, recent logs, and comparison signals.`
- `30s+`
  update body once more:
  `This proposal can take around a minute when the review window is larger.`

Rules:

- no exact countdown
- no percentage ring
- no “almost done” promise unless the server has actually returned
- progress may visually hold in loading state as long as the request is still live
- success only fires when the action actually resolves

Cancel / Dismiss Policy

V1 choice:

- no cancel
- dismiss only

Why:

- the current live backend contract does not expose truthful abort semantics for proposal generation, apply update, import/apply, clear schedule, or delete plan
- a cancel button would falsely suggest that the server action has stopped

V1 policy details:

- loading toast may be manually dismissed from view
- dismissing a loading toast does not stop the action
- the source button remains in loading state while the request is still active
- success or error may still reappear as the final resolved toast even if the loading toast was dismissed, because the action outcome still matters

Inline vs Toast Rules

Toast is better for:

- action started
- long-running background-ish work
- successful completion of a modal action that may close or change the screen
- short global confirmation after a mutation finishes
- transient error on an async action when the error does not need field-by-field correction

Inline feedback remains better for:

- validation errors near fields
- JSON schema issues
- proposal review content
- destructive confirmations
- replace-blocked warnings
- stale proposal explanation
- detailed workout save state
- attached-file ownership
- persistent route-level error states

What Toasts Must Not Replace

- `hito-field-error` under fields and textareas
- proposal review content in `Open plan`
- destructive confirmation checkboxes
- import validation summaries
- persistent settings page state block
- workout logging state ownership block
- Garmin feedback and upload ownership inside `Feedback`

What We Can Fake Honestly

- indeterminate loading state
- staged waiting copy after time thresholds
- success transition once the server really resolves
- dismiss-only removal from view

What Requires Real Cancellation Later

- stopping proposal generation after the request has been accepted by the server
- aborting plan import or apply mid-flight
- aborting clear or delete lifecycle mutation after backend execution starts
- aborting export generation if Hito later introduces server-side document preparation beyond direct download start

Design-System Alignment

The toast pattern should be added to `/hitoDS` as one compact system family, not a giant notification catalog.

`/hitoDS` should show:

- loading toast
- long-running staged toast
- success toast
- error toast
- dismiss-only pattern

`/hitoDS` should not show:

- marketing snackbars
- bottom-left or bottom-right variants
- multi-action command toasts
- fake cancel examples for server actions

Visual alignment rules:

- use Hito low-card surface language
- use the same semantic tones already used for pills and state surfaces
- keep copy short and human
- avoid high-gloss consumer-app animation language

Backend / Frontend Responsibilities

Frontend responsibilities

- start toast when action begins
- keep source button in loading state
- update or replace the toast when the action resolves
- preserve inline validation and review content
- ensure dismiss does not mutate action state

Backend responsibilities

- return truthful success or failure only when the action really resolves
- do not imply cancellability unless abort exists
- keep long-running mutations and proposal generation returning bounded stable result shapes so final toast copy can stay short

QA Expectations

- verify that `Update plan` proposal generation shows a toast immediately and does not look hung during `45–90s` waits
- verify that button loading state and toast state remain aligned
- verify that dismissing a loading toast does not stop the request and does not create false completion copy
- verify that success toast appears only after actual success
- verify that error toast does not replace field-level validation or proposal-review warnings
- verify that only one primary async action toast stack appears at a time in v1
- verify mobile placement does not collide with modal headers or shell chrome

Risks

- If toast scope expands too fast, Hito will end up with duplicate inline and global feedback everywhere.
- If staged messages are too dramatic, they will sound like fake progress.
- If success toasts are overused for fast actions, the product will feel noisy and less premium.
- If export is included too early, Hito may claim success before the browser has actually completed the file save.

Exit Criteria

- one canonical toast pattern exists in docs for Hito async actions
- v1 scope is explicitly bounded
- cancel policy is truthful and unambiguous
- inline versus toast ownership is clearly separated
- `/hitoDS` requirements are defined for the toast family
- the smallest first implementation slice is obvious

Next Recommended Role

FRONTEND

Suggested Next Step

Implement the smallest safe first slice in `Open plan` only:
`Update plan` proposal generation plus `Apply update`, using the existing `sonner` seam, one Hito toast recipe, and no fake cancel action.

Implementation Note

The design-system-first implementation is now complete for the approved first product scope. `/hitoDS` owns the reusable info, working, success, and error toast primitive; `Open plan` proposal generation and `Apply update` consume that helper only. Remaining v1 candidates such as saved-mode import/apply, `Clear upcoming schedule`, and `Delete plan` are still intentionally deferred.
