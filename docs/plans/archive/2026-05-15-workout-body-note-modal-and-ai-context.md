Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Backend AI context and output-hygiene slices implemented; QA follow-up pending

Owner

BACKEND

Last Updated

2026-05-15

Context

Workout-linked body notes now already persist on `workout_logs.body_notes`, and `Log result` can already save and reload bounded note entries with the workout result.

What is still wrong is the interaction shape:
- the current experience is still an inline card/form inside `Log result`
- it is visually heavy for a quick post-run note
- it competes with the main completion flow instead of behaving like a small attached detail

At the same time, the current OpenAI workout-feedback seam does not yet consume body-note truth at all.

The user direction is to replace the inline form with a workout-scoped modal and make saved body-note truth available to the workout verdict/recommendation seam without turning Hito into a medical product.

Problem Definition

The current inline body-note block is the wrong UI primitive for this job.

Why:
- it stretches `Log result` vertically
- it makes a small optional action feel like a second form inside the first form
- it treats pain-location entry as regular field chrome rather than as a focused interaction

Implementation update - 2026-05-15:

- the frontend now replaces the inline body-note editor with a compact summary row and workout-scoped modal inside `Log result`
- the modal keeps the existing bounded saved schema unchanged
- bounded front/back body-map selection now ships inside that modal
- the backend now feeds saved workout-scoped body-note truth into the existing bounded Garmin AI recommendation seam as optional caution context only
- the AI prompt now explicitly forbids diagnosis, medical advice, injury certainty, treatment instructions, and silent plan mutation from body-note context
- the backend now applies a small runner-facing text-quality gate before persisting workout AI output, replacing malformed fragments or non-English artifacts with stable deterministic fallback copy

The right v1 direction is:
- keep body notes attached to a specific workout result
- open a focused modal from `Log result`
- save one bounded structured payload
- let AI use that payload as caution context only

Interaction Model

V1 interaction should be:

1. runner is in workout-detail `Log result`
2. runner clicks `Add body note` or `Edit body note`
3. a workout-scoped modal opens
4. runner marks area(s), sensation, severity, timing, optional note
5. save closes the modal
6. `Log result` returns to a small summary row, not a full inline editor

Recommendation:
- replace the current inline body-note card completely
- keep only a compact summary/entry row inside `Log result`
- modal becomes the only editing surface for workout-linked body notes

Minimum v1 visible states in `Log result`:
- no note yet: `Add body note`
- note exists: short summary plus `Edit`

What Must Stay Workout-Scoped

- body-note save ownership belongs to one workout log only
- no shared global body-note draft
- no cross-workout pain state
- no body-note editing outside the context of a workout result in this slice

Body Map V1

Smallest useful v1:
- front view
- back view
- selectable named regions
- multiple locations allowed

Location fidelity recommendation:
- keep the existing bounded named-region list as the canonical saved truth
- modal body map is a visual selector for those same named regions, not a new freeform coordinate system

That means:
- the person figure is UI affordance only
- the saved contract still stores canonical region ids such as:
  `L. Calf`, `R. Knee`, `Lower back`

Multiple location rule:
- allow multiple locations in one workout note
- keep max note count bounded through the current array model
- do not introduce fine-grained hotspot drawing or bilateral sub-zones beyond the current bounded area list

Saved Note Schema

Canonical v1 saved fields per body-note entry:
- `area`
- `timing`
- `sensation`
- `severity`
- `note`

Recommended canonical meaning:
- `area`: one bounded body region id
- `timing`: `during` or `after`
- `sensation`: bounded sensation enum
- `severity`: `1..5`
- `note`: optional short free text

Recommended storage posture:
- keep using `workout_logs.body_notes jsonb`
- keep one array of bounded entries
- do not split this into a separate table yet

What we do not model yet:
- onset minute/km
- left/right custom geometry beyond bounded areas
- diagnosis labels
- injury duration history
- recovery status over time
- treatment or rehab fields

What AI May Use

OpenAI may receive only bounded workout-linked body-note truth:
- area
- timing
- sensation
- severity
- optional short note text

OpenAI may use that input to:
- soften or escalate workout verdict confidence
- add caution to the workout recommendation
- suggest conservative next-step framing such as easier review language or manual review wording

AI Context Rules

Body-note truth should enter the workout AI seam as one additive context block alongside:
- planned workout truth
- normalized actual metrics
- deterministic comparison payload
- current week context
- next workout summary

Recommended prompt posture:
- body-note truth is caution context, not primary performance truth
- deterministic comparison remains primary for plan-vs-run facts
- body notes can influence recommendation tone and risk wording
- body notes can justify `review`-leaning caution when severity is meaningfully elevated

What AI Must Not Pretend To Know

- no diagnosis
- no injury classification
- no medical advice
- no treatment plan
- no certainty about cause
- no silent plan mutation

Required guardrail language:
- AI may say the result suggests caution or manual review is worthwhile
- AI must not imply that Hito knows what the injury is
- AI must not imply that the plan was automatically changed because of the body note

`/body` Route Decision

Decision:
- fully retire `/body` from product expectations and permanent docs

Why this is the correct choice:
- the route file no longer exists in `src/routes`
- current product direction already moved body-note truth into workout logs
- keeping `/body` in docs as a live utility surface would preserve a false second ownership model

Canonical ownership after this slice:
- workout-scoped body notes live under `Log result`
- bounded runner profile fields live under `/settings`
- no standalone body-tracking product surface remains

Backend Responsibilities

- keep `workout_logs.body_notes` as the canonical storage seam
- validate modal-submitted bounded note entries through the existing schema seam
- add body-note truth to the workout AI prompt/input seam in a bounded structured form: done
- keep deterministic comparison primary and body notes additive: done
- preserve current save semantics so body notes remain attached to the same workout result row

Frontend Responsibilities

- replace inline body-note editor with a modal
- keep `Log result` ownership and summary row
- render front/back figure selection against the same bounded area enum
- avoid creating a second route or dashboard for body notes

QA Expectations

- runner can open body-note modal from `Log result`
- runner can select one or multiple bounded body areas
- runner can save timing, sensation, severity, and optional note
- saved body notes reload on the same workout only
- `Log result` stays visually smaller than the current inline-card version
- AI recommendation readback changes tone only when body-note truth exists
- AI output never reads like diagnosis or treatment advice
- AI output does not surface dangling fragments, ampersand continuations, replacement glyphs, or stray non-English character artifacts
- `/body` is no longer treated as an expected product surface in docs or QA scope

Risks

- body map UI can overcomplicate quickly if it becomes a drawing tool instead of a bounded selector
- AI caution wording can drift into pseudo-medical language if the prompt is not tightly constrained
- keeping both inline editing and modal editing would recreate two competing ownership paths
- stale docs references to `/body` will keep confusing QA and future planning unless they are cleaned up

What We Leave For Later

- symptom history timeline
- cross-workout body analytics
- recurring hotspot trends
- rehab workflows
- clinician-facing exports
- automatic plan adjustment from body notes
- richer timing than `during` / `after`

Exit Criteria

- one workout-scoped body-note modal contract is defined
- inline card ownership is explicitly replaced, not duplicated
- saved note schema remains bounded and canonical
- AI usage rules are explicit and conservative
- `/body` route/product expectation is explicitly retired
- backend/frontend ownership is clear

Next Recommended Role

FRONTEND

Suggested Next Step

Implement the modal replacement in `Log result` first, keeping the existing `workout_logs.body_notes` schema and save seam unchanged, then follow immediately with one narrow Backend pass to add bounded body-note context into the workout AI prompt without changing deterministic comparison ownership.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next body-note evolution as a workout-scoped modal from `Log result`, with saved note truth staying on `workout_logs.body_notes` and later feeding the workout AI seam as bounded caution context.

### Key Decisions

- Replace the inline body-note card completely with a modal-based editor.
- Keep body notes workout-scoped and stored on the workout log, not in a separate subsystem.
- Let AI use body-note truth only as additive caution context for verdict/recommendation.
- Retire `/body` from product expectations and permanent docs because the route no longer exists and body-note ownership is now workout-scoped.

### Current State

- `workout_logs.body_notes` already exists and persists bounded entries.
- `Log result` already saves and reloads body-note truth with workout results.
- The current AI seam does not yet consume body-note truth.
- `src/routes/body.tsx` is no longer present, but multiple docs still mention `/body`.

### Constraints

- Do not broaden into a medical or injury-tracking product.
- Do not create a second body-note route or dashboard.
- Keep deterministic Garmin comparison primary; body-note context is secondary.

### Risks / Open Questions

- The body map must remain a bounded region selector, not a drawing tool.
- AI wording needs explicit guardrails to avoid pseudo-diagnostic language.
- Docs cleanup for `/body` should follow soon to remove stale product expectations.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Replace the current inline body-note editor in `CompletionPanel.tsx` with a workout-scoped modal and a compact summary row in `Log result`, while keeping the existing save contract unchanged.
```
