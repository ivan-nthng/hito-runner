# Voice-To-Plan Authoring Plan

## Status

Paused after transcript-text v1; raw audio capture and transcription transport remain backlog

## Owner

Backend / Frontend / QA

## Last Updated

2026-05-25

## Active Inventory Note

Kept active during the 2026-05-25 inventory cleanup because the transcript-text review/confirm path is implemented, but the original voice/audio transport scope remains intentionally unfinished.

Do not continue this by inertia. Start only when PRODUCT chooses real audio dictation as the next slice.

## Next Action

When prioritized, BACKEND should create the bounded raw-audio transport slice: accepted formats, size/duration limits, entitlement-before-transcription, one OpenAI transcription call, transcript normalization, and transcript-ready response before the existing draft/review path.

## Context

Hito Running already has one canonical saved-mode plan-authoring truth path:

- the normal onboarding UI now uses the structured first-plan constructor
- the backend still has one bounded free-text compatibility seam in `src/lib/openai-plan-authoring.ts`
- that text seam converts user intent into validated structured authoring input
- deterministic generation then produces canonical `training-plan-v2` plan truth
- the canonical persisted seam stores only the validated result

This means voice input does not need a new planning architecture.

It only needs one new input modality in front of the existing text-based authoring seam.

There is also one important cost constraint:

- we want voice input to feel easier than typing
- but we do not want to spend unnecessary tokens or build a realtime voice-agent system

The right first slice is therefore:

- record audio
- transcribe audio once
- show editable transcript
- send only the confirmed transcript into the existing authoring path

## Product Decision

First release should support one bounded voice-to-plan path only:

1. runner records or uploads one short voice note
2. backend transcribes it to text
3. runner reviews and edits the transcript
4. runner explicitly presses `Create plan`
5. backend evaluates the confirmed transcript and produces one review verdict
6. if enough context exists, the verdict summarizes what Hito understood and what draft plan shape it recommends
7. if essential context is missing, the verdict says exactly what is missing and asks for clarification instead of inventing a plan
8. runner can then:
   - confirm and create the plan
   - add more dictated context
   - manually fill missing structured fields
9. deterministic validation and canonical persistence only happen after explicit runner confirmation

This slice must not become:

- a realtime voice coach
- a second planning engine
- a hidden multi-pass summarization pipeline
- an expensive always-on audio experience

## Core Principle

Voice is only another way to produce the same bounded authoring text.

Canonical rule:

- audio never goes directly into plan generation
- transcript text is the only payload that enters the existing OpenAI plan-authoring step
- deterministic validation remains unchanged after transcription
- essential runner truth must not be invented just to keep the flow moving
- plan creation must remain a separate explicit confirm step after Hito explains what it inferred

## New Truthfulness Rule

Voice-to-plan must be clarification-aware.

That means the backend must distinguish between:

- information that can be filled conservatively
- information that is essential to choosing an appropriate training load, schedule, or workout intensity

If essential planning truth is missing, the system must not silently produce a fake-confident plan.

Instead it must say:

- what is missing
- why it matters
- what the runner should clarify

It should also say what it already understood correctly, so the runner can confirm or correct it before plan creation.

## Entity Completeness Rule

The user does not need to dictate every workout entity directly.

But before Hito generates a real draft, the system must know enough upstream authoring truth to fill workout entities safely and coherently:

- what the runner is training for
- how ready they are now
- how much training they can realistically do
- how long the preparation window is
- how aggressive or conservative the plan should be

Only after that is clear may Hito generate:

- workout frequency
- long-run progression
- intensity distribution
- hill or mountain emphasis
- specific workout structure and targets

## Review Verdict Contract

After the runner reviews the transcript and presses `Create plan`, the backend should not jump straight to persistence.

It should first return one explicit review verdict.

That review verdict should read like:

- your age is X
- your height is Y
- your weight is Z
- your current running level appears to be ...
- your goal is ...
- your likely preparation window is ...
- Hito would recommend a plan roughly like:
  - N weeks or months
  - N running days per week
  - broad activity mix such as easy runs, long runs, workouts, hills, strength / mobility

This verdict is not yet active plan truth.

It is the last bounded review step before real plan creation.

## Implemented Backend Slice

The backend now implements the confirmed-transcript review and explicit first-plan confirmation half of this plan.

Current implementation:

- `src/lib/voice-to-plan-authoring.ts` accepts a bounded confirmed transcript request.
- The request can include optional constructor context plus structured supplements for profile basics, fixed rest days, running days per week, goal, target, benchmark, terrain, strength preference, and supporting comment.
- The backend checks the `voice_to_plan` entitlement before generation.
- Missing entitlement row still resolves as effective `Pro` through the shared entitlement resolver.
- Explicit `Basic` returns the shared structured `capability_locked` response for `voice_to_plan`.
- Empty, filler-only, too-long, or impossible rest-day context returns bounded validation copy.
- If essential planning truth is missing, the response is `ok: true`, `status: "clarification_required"` with missing fields, questions, supported answer modes, and what Hito already understood.
- If enough truth exists, allowed transcripts route into the existing OpenAI structured authoring seam and deterministic `training-plan-v2` generator.
- The `draft_ready` response includes runner-facing review data:
  runner understanding, inferred level, goal, availability, timeline, broad plan shape, assumptions, and available next actions.
- If an obvious dictated goal-style cue differs from the reviewed draft style, the backend adds an explicit assumption explaining the proposed style change before confirmation.
- The implemented comparison uses the explicit transcript style cue first, then structured supplement style if the transcript has no obvious cue, so constructor defaults cannot hide a dictated style change in the real frontend request path.
- Transcript review remains non-mutating with `requiresExplicitApply`, `doesNotMutatePlan`, and `rawTranscriptPersisted: false`.
- `confirmVoiceToPlanDraft` is the explicit mutating seam for `OK, create plan`.
- Confirm rechecks `voice_to_plan`, validates the returned draft payload, rebuilds the canonical plan from structured authoring input, persists profile age/weight/height, and creates the first active plan only when no active plan already exists.
- Confirm blocks existing active plans instead of replacing them; plan updates/replacements remain owned by `Open plan`.

Current non-goals still true:

- no raw audio upload or microphone handling yet
- no transcription model call yet
- no transcript persistence as runner profile truth
- no capability usage counting in this slice
- no active-plan creation from review alone
- no existing active-plan replacement through voice confirm

## Implemented Frontend Slice

The first runner-facing transcript review UI is now implemented in `OnboardingGate`.

Current implementation:

- no-plan onboarding shows a compact Pro `AI setup` assist above the manual structured constructor
- the panel accepts pasted or typed transcript text only; no microphone or audio upload is present
- `Review AI setup` calls `generateVoiceToPlanDraft`
- `generateVoiceToPlanDraft` results render inline as:
  - `clarification_required` with missing fields, backend questions, understood facts, `Add more details`, and `Use structured setup`
  - `draft_ready` with runner understanding, inferred readiness, goal, estimated horizon, running days per week, fixed rest days, rough activity mix, terrain context when present, assumptions, and safety copy
  - bounded locked/error copy for capability and validation failures
- `Yes, create plan` is visible only for `draft_ready` and is the only UI path that calls `confirmVoiceToPlanDraft`
- successful confirm reloads `/` so the saved active plan is loaded from backend truth
- transcript text is held only in component state and is not written to local storage
- the structured constructor remains the primary path and Advanced JSON remains demoted but available
- frontend ownership is split so `OnboardingGate` orchestrates state/actions while focused onboarding modules own the structured constructor UI, Dictate-to-Plan review UI, Advanced JSON panel, and shared constructor/voice form model

Current frontend non-goals still true:

- no microphone recording
- no audio upload
- no Stripe, pricing, or subscription UI
- no replacement of the structured constructor
- no silent plan creation from review

## Missing Backend Transport Slice

The current plan is already strong on:

- transcript review
- clarification handling
- review verdict
- explicit confirm before plan creation

What is still underspecified is the raw backend transport for:

- `audio -> validation -> transcription -> transcript response`

That slice should be added to this same canonical plan.

It should not create:

- a second planner
- a second review system
- a second plan-generation action

## Why This Shape

This shape is best because:

- it reuses the existing backend plan-authoring seam
- it avoids building a separate voice-specific planning contract
- it keeps token usage predictable
- it gives the runner one chance to correct transcription mistakes before plan generation
- it keeps failure states understandable:
  audio failed
  transcript looks wrong
  plan generation failed validation

## OpenAI Model Direction

For first release, use a dedicated speech-to-text model for transcription, not the main plan-generation model.

Recommended first model choice:

- `gpt-4o-mini-transcribe`

Reason:

- better fit for product transcription than routing audio through the main plan model
- lower likely cost posture than heavier options
- should be good enough for one-speaker runner dictation

Escalation option if quality proves insufficient:

- `gpt-4o-transcribe`

Do not use in first release unless quality data says `mini` is not enough:

- `gpt-4o-transcribe-diarize`
  not needed for one-speaker onboarding
- `whisper-1`
  usable, but not the preferred current first choice when the newer transcription models exist

## Backend Audio-To-Transcript Slice

The first raw-audio slice should stay deliberately small.

It should do only this:

1. accept one short single-speaker audio input
2. validate that the file is acceptable before any expensive model call
3. check auth and `voice_to_plan` entitlement before transcription
4. send the file to one speech-to-text model
5. normalize the returned transcript
6. return transcript text for review
7. let the existing transcript-review backend continue from there

It must not:

- generate a plan directly from raw audio
- create a second authoring contract
- run a summarization model between transcription and transcript review
- archive voice recordings as product truth

## Input Contract

Recommended first-release input contract:

```text
type VoiceAudioTranscriptionRequest = {
  sourceKind: "voice_audio";
  file: File;
};
```

The input must be:

- one file only
- one short runner voice note only
- no multi-file batching
- no multi-speaker handling

Accepted first-release formats:

- `audio/webm`
- `audio/mp4`
- `audio/m4a`
- `audio/wav`
- optionally `audio/mpeg`

Practical file-extension acceptance should map to:

- `.webm`
- `.mp4`
- `.m4a`
- `.wav`
- optionally `.mp3`

Canonical rule:

- keep the accepted list aligned with OpenAI speech-to-text supported upload formats
- reject everything else before calling the transcription model

## Validation And Limits

The backend should validate, in order:

1. authenticated runner exists
2. `voice_to_plan` entitlement is allowed
3. file exists
4. file is non-empty
5. content type or extension is accepted
6. file size is within first-release bounds
7. optional estimated duration is within first-release bounds if known

Recommended first-release product limits:

- target usage guidance:
  - `30-90 seconds`
- soft warning threshold:
  - around `90 seconds`
- hard-stop product limit:
  - around `2 minutes`

Recommended file-size rule:

- define one explicit backend byte cap for v1
- keep it conservative for short voice notes
- reject obviously oversized files before any transcription call

If exact duration is not cheaply available server-side:

- keep duration as product guidance first
- use file size as the hard reject
- let the recording UI provide exact duration later when available

## Temporary File Handling

Raw audio should not become product truth.

Recommended first-release handling:

- keep audio in request memory or short-lived temp handling only as long as needed for the transcription call
- do not persist raw audio in Supabase storage
- do not attach raw audio to the runner profile or plan
- do not store long-lived file references in canonical saved-mode truth

Acceptable lightweight observability later:

- transcription model name
- source kind
- text length
- audio duration if known
- success/failure status

But even that should remain:

- transient request metadata
- or a minimal operational audit seam

not runner-facing product truth

## Backend Flow

Recommended first-release backend flow:

1. runner uploads or records one short audio file
2. backend route or server action receives the file
3. backend runs auth check
4. backend runs entitlement check for `voice_to_plan`
5. backend validates format, size, and obvious emptiness
6. backend sends the file to OpenAI transcription
7. backend receives transcript text
8. backend normalizes:
   - trims whitespace
   - collapses obvious spacing noise
   - rejects empty or useless result
9. backend returns transcript review payload
10. runner reviews transcript
11. existing `generateVoiceToPlanDraft` and `confirmVoiceToPlanDraft` flow continues unchanged

Important:

- the audio transport slice ends at transcript review payload
- it does not create or apply a plan

## Token Discipline

The cost boundary matters more than the novelty here.

### Required cost controls

1. Do not stream audio into the plan-generation model.
2. Do not run an extra LLM summarization pass between transcription and plan generation.
3. Do not send both raw audio and transcript into plan generation.
4. Do not store or replay very long recordings in the first release.
5. Do not auto-regenerate plans after every transcript edit.
6. Do not add a cleanup LLM call between transcription and transcript review.

### Recommended first-release limits

- target one short voice note, not a long interview
- guide the runner toward roughly `30-90 seconds`
- hard-stop or warn around `2 minutes`
- reject oversized uploads that exceed the official transcription input limits

### Practical cost strategy

The cheapest safe first-release path is:

- one audio transcription call
- one plan-generation call
- zero intermediate summarization calls
- zero intermediate cleanup model calls

The runner should edit the transcript manually if it is too long or noisy instead of the system running another costly compression model call automatically.

## UX Direction

### Entry point

Add one bounded voice entry to the same plan-creation area that already supports authoring.

Recommended runner-facing actions:

- `Record your plan request`
- `Or type it instead`

Voice should be a sibling entry path, not the only way to create a plan.

### First-release flow

1. Runner starts recording.
2. Runner records one short note about goal, current level, schedule, and constraints.
3. Upload finishes and the backend transcribes the audio.
4. The UI shows:
   transcript text
   edit field
   retry recording
   continue to plan generation
5. Runner confirms or edits the transcript.
6. Runner presses `Create plan`.
7. Backend checks whether the transcript is sufficient for safe plan drafting.
8. If sufficient:
   backend returns a review verdict summarizing inferred runner truth and the proposed plan shape.
9. Runner can:
   - confirm and create the plan
   - add more dictated context
   - manually edit or complete key fields
10. If not sufficient:
    the product returns specific missing items and targeted clarification prompts in the same review state.
11. Runner adds clarification by voice or by structured manual input.
12. Only after explicit confirmation does canonical plan creation run.

### Recommended helper copy

The helper text should guide brevity and useful content, for example:

- your goal or race
- your current weekly running
- recent benchmark or race result
- which days you can run
- injuries or limits

Avoid presenting voice as an open-ended chat.

## Minimum Planning Sufficiency Contract

Before Hito may generate a real plan draft from dictated input, the backend should be able to resolve a safe answer for these planning questions:

1. Goal
   - what the runner is training for
   - examples:
     - build consistency
     - 10K
     - half marathon
     - marathon
     - mountain running
2. Current level
   - enough signal to estimate present readiness
   - examples:
     - recent race or benchmark
     - current weekly running
     - recent long run
     - return-from-break context
3. Availability
   - enough signal to know training frequency or fixed constraints
   - examples:
     - days per week
     - fixed off-days
     - strong schedule limits
4. Timeline
   - enough signal to know the preparation window
   - examples:
     - target date
     - race timing
     - explicit near-term / medium-term intent
5. Intensity posture
   - enough signal to avoid an obviously wrong aggressiveness level
   - examples:
     - target-time ambition
     - conservative return
     - discomfort / caution

If one of these is genuinely unresolved, the backend should not pretend it knows the answer unless the missing piece is safely defaultable.

## Structured Supplement Contract

When the transcript is incomplete, the runner should not be forced to solve the gap only with another voice note.

The same review surface should support bounded manual supplementation of high-value structured fields, using the same product language as the constructor where possible.

Recommended manual supplement fields:

- age
- weight
- height
- fixed rest days
- days per week
- goal distance
- target time when relevant
- target date when relevant
- recent 5K time or pace

Important boundary:

- this is not a full second onboarding form
- it is a bounded completion layer for missing essential planning truth
- the product should only surface the fields that are missing or clearly worth correction

## What Can Be Conservatively Inferred

These can still use bounded conservative defaults when the runner does not specify them explicitly:

- target event name wording
- standard terrain when no mountain or hill intent is mentioned
- moderate plan tone when the runner gives a clear goal and readiness but not a style label
- preparation horizon for non-race consistency-building when the request is clearly open-ended
- strength or mobility support when not mentioned

These must stay conservative and visible as assumptions, not hidden product truth.

## What Must Trigger Clarification

The system should ask for clarification rather than inventing a plan when any of these are materially missing:

- no clear goal or goal distance
- no usable current-level signal and no current weekly-running context
- no usable availability signal
- race-oriented goal with no timeline and no safe defaultable planning horizon
- unclear readiness after missed training, pain, or major break where load choice would materially change
- conflicting transcript facts such as:
  - beginner wording plus very aggressive target
  - fixed off-days plus impossible run frequency
  - marathon goal with almost no readiness signal and no timeline

- missing required profile basics when they materially affect the generated plan review:
  - age
  - weight
  - height

## Clarification Contract

The voice path should support two backend outcomes after transcript confirmation:

### 1. `draft_ready`

Meaning:

- the transcript plus optional visible context is sufficient to generate a bounded plan draft

### 2. `clarification_required`

Meaning:

- the transcript is understandable
- but the system does not yet have enough planning truth to choose a safe plan

Recommended response shape:

```text
{
  ok: true,
  status: "clarification_required",
  clarification: {
    missingFields: [...],
    questions: [...]
  },
  safety: {
    requiresExplicitApply: true,
    doesNotMutatePlan: true,
    rawTranscriptPersisted: false
  }
}
```

Recommended question behavior:

- keep questions short
- ask only for the missing planning truths
- do not open broad coach-chat branching
- pair missing questions with bounded manual fields when that is faster than another dictated pass

Examples:

- `How many days per week can you realistically run?`
- `What is your most recent 5K time, or how far have you been running lately?`
- `When is the race, or how many weeks do you want to prepare?`

Recommended same-state affordances:

- `Add more by voice`
- `Fill missing details`
- `Back to transcript`

## Draft Review Contract

When the transcript is sufficient, the backend should return:

```text
{
  ok: true,
  reviewStatus: "draft_ready",
  runnerSummary: {
    age: number | null,
    weightKg: number | null,
    heightCm: number | null,
    inferredLevel: string,
    goal: string,
    availability: string,
    timeline: string
  },
  recommendedPlanShape: {
    durationLabel: string,
    runningDaysPerWeek: number,
    activityMix: string[]
  },
  requiresExplicitApply: true,
  doesNotMutatePlan: true
}
```

Meaning:

- Hito has enough truth to propose a real plan shape
- but no plan exists yet
- the runner still must choose `OK, create plan`

## Confirm Contract

After `draft_ready`, the runner gets one explicit choice:

- `OK, create plan`
- `Add more details`

`OK, create plan` means:

- use the reviewed transcript plus any structured manual supplements
- run the canonical authoring/generation seam
- validate
- persist the resulting plan only after successful generation

`Add more details` means:

- keep everything in review state
- let the runner either dictate more or complete structured fields
- do not persist anything yet

## Relationship To Existing Text Authoring

Current `src/lib/openai-plan-authoring.ts` is intentionally tolerant and still uses conservative defaults such as:

- fallback running days
- fallback preparation horizon
- fallback baseline long-run assumptions

That is acceptable for the older bounded text compatibility seam.

But voice-to-plan should not inherit those defaults blindly when they would hide real uncertainty.

Recommended rule:

- keep the existing deterministic text-authoring generator
- add a voice-specific sufficiency gate before calling it
- add a voice-specific review verdict before final persistence
- only allow the tolerant defaulting behavior for gaps that are truly minor and safe

## File And Recording Direction

### First release input modes

Prefer one of:

- in-browser recording using a web audio format such as `webm`
- or short audio-file upload from the device

Do not support large audio libraries or multiple files in the first release.

### Storage direction

Recommended first release:

- do not persist the raw audio file long-term unless product or compliance needs it
- persist only the confirmed transcript text plus minimal request metadata

If temporary file storage is needed for processing, treat it as short-lived transport state, not product truth.

## Data Contract Direction

### New bounded authoring request shape

Recommended new transient request model:

```ts
type VoiceAuthoringRequest = {
  sourceKind: "voice_transcript";
  transcriptText: string;
  audioDurationSec: number | null;
  transcriptModel: string;
  transcriptConfidenceSummary?: string | null;
};
```

This should remain request-level processing data, not a new canonical persisted runner entity.

Recommended adjacent transcription transport result:

```text
type VoiceAudioTranscriptResult = {
  sourceKind: "voice_audio";
  transcriptText: string;
  audioDurationSec: number | null;
  transcriptionModel: string;
  responseId: string | null;
};
```

This result should feed transcript review only.

### Optional lightweight audit table

If the product needs basic operational observability, add one small audit table such as:

- `plan_authoring_requests`

But keep it minimal:

- source kind
- text length
- audio duration
- transcription model
- generation status

Do not create a broad media-ingestion subsystem for this slice.

## Architecture Direction

### Transcript response contract

Recommended transcript-ready response shape:

```text
{
  ok: true,
  status: "transcript_ready",
  sourceKind: "voice_audio",
  transcript: {
    text: string,
    characterCount: number
  },
  audio: {
    originalFileName: string | null,
    mimeType: string | null,
    durationSec: number | null
  },
  model: string,
  responseId: string | null,
  safety: {
    rawAudioPersisted: false,
    requiresTranscriptReview: true
  }
}
```

Canonical handoff rule:

- this payload should feed the existing transcript-review state
- not a second downstream authoring path

### Backend seams

Recommended new backend modules:

- `src/lib/voice-authoring/transcribe-audio.ts`
- `src/lib/voice-authoring/validate-audio-input.ts`
- `src/lib/voice-authoring/validate-transcript.ts`
- `src/lib/voice-authoring/normalize-transcript.ts`
- `src/lib/voice-authoring/types.ts`

Current backend transcript seam:

- `src/lib/voice-to-plan-authoring.ts`

Reuse existing backend seam:

- `src/lib/openai-plan-authoring.ts`

### Server actions

Recommended first actions:

- `transcribeVoiceAuthoringAudio(file)`
- `generatePlanFromConfirmedTranscript(transcriptText)`

Current backend action:

- `generateVoiceToPlanDraft`

Important:

- do not create a second plan-generation action with different rules
- the confirmed transcript should end in the same authoring/generation path already used by free text
- the transcription action should stop at transcript delivery and not silently continue into plan draft generation

## Validation And Safety Direction

### Transcript validation

Before sending transcript text into plan generation, validate:

- transcript is non-empty
- transcript is under one bounded maximum length
- transcript is not obviously only filler/noise

If transcript is too long:

- do not auto-summarize by default
- ask the runner to shorten or edit it

Also validate:

- transcript is not missing essential planning truth
- transcript does not contain unresolved contradictions that would materially alter training load or schedule

### Plan-generation safety

Use the same deterministic validation already applied to normal text authoring:

- no direct persistence of model output
- no runtime-only fields
- no completion/sync/feedback noise in canonical plan truth

Additional voice-specific safety rule:

- no draft generation when the backend still cannot safely infer current level, availability, timeline, or intensity posture

### Clarification safety

When clarification is needed:

- do not create a partial plan
- do not persist a plan draft as active plan truth
- do not silently replace missing critical facts with aggressive defaults
- keep the runner in a recoverable clarify-and-retry state

### Review safety

When the verdict is `draft_ready`:

- do not auto-create the plan
- do not treat the review verdict as active plan truth
- do not discard the runner transcript or manual supplements before the runner confirms
- do not hide inferred assumptions; expose them so the runner can correct them

### Audio transport safety

When raw audio is invalid or transcription fails:

- do not fall through into the draft-generation seam
- do not create partial transcript truth
- do not persist raw audio as fallback product state
- return the runner to a retryable transcript-entry state

### Failure modes

The raw-audio slice must return bounded non-500 business failures for:

- `capability_locked`
- `unsupported_audio_format`
- `audio_too_large`
- `audio_too_long`
- `empty_audio`
- `transcription_failed`
- `empty_transcript`
- `unusable_transcript`

## Option Evaluation

### Option 1: Realtime voice assistant

Pros:

- exciting UX

Cons:

- expensive
- much broader
- complex browser/audio state
- easy to drift into a second authoring system

Decision:

- reject for v1

### Option 2: Audio upload -> transcript -> existing text seam

Pros:

- smallest and safest
- reuses existing architecture
- can be extended with one clarification gate without adding a second planning engine
- predictable cost
- easy to QA

Cons:

- less magical
- one extra transcript review step

Decision:

- choose for v1

### Option 3: Audio upload -> transcript -> extra summarization -> plan generation

Pros:

- potentially shorter text payload

Cons:

- extra token spend
- more failure points
- duplicated intelligence before the existing authoring model

Decision:

- reject for v1 unless transcript-length evidence later proves it necessary

## Recommended Delivery Sequence

### Phase 1: Backend audio-to-transcript transport

Deliver:

- accepted audio-file contract
- auth + entitlement before transcription
- server-side transcription
- transcript-ready response payload
- bounded error handling

### Phase 2: Transcript review wiring

Deliver:

- editable transcript review
- retry / replace recording
- submit confirmed text into the existing text seam

### Phase 3: Cost and quality controls

Deliver:

- bounded duration and file-size limits
- text-length guardrails
- small operational metrics for transcription success/failure

### Phase 4: UX refinement only after usage

Possible later improvements:

- partial transcript hints
- better prompting/help text
- optional auto-cleanup of filler words

Not before the basic bounded path is stable.

## Risks

- Runner dictation may be long, vague, or noisy, which increases both cost and poor-generation risk.
- Sports vocabulary, distances, and dates may transcribe incorrectly.
- If transcript review is weak, bad transcription becomes bad plan input.
- If the team adds extra cleanup model calls too early, voice input will become more expensive than necessary.

## Validation Plan

### Product validation

- runner can paste or type one transcript-style onboarding message
- transcript review appears before plan creation
- runner can edit or add details before creating
- confirmed draft produces a plan through the same canonical saved-mode path as structured authoring
- raw audio recording and transcription transport remain later validation targets

### Cost validation

- the current transcript-text UI uses no transcription call
- one normal successful review flow uses one plan-generation call
- no hidden summarization or rewrite call is added in this slice

### Failure validation

- locked, invalid, or insufficient transcript input fails with clear copy
- empty or unusable transcript fails with clear copy
- runner can add more details or switch to structured setup without getting stuck

## Checklist

- [x] define the bounded voice-to-plan product scope
- [x] add backend `voice_to_plan` capability check for the confirmed-transcript path
- [ ] add one raw-audio transcription seam separate from the plan model
- [ ] define accepted audio formats and extension handling
- [ ] define explicit file-size and duration guardrails for the raw-audio path
- [ ] return a transcript-ready response contract before draft generation
- [x] add one transcript review and edit step
- [x] route confirmed transcript into the existing text-to-plan generation seam
- [x] set transcript-length and filler/noise guardrails
- [x] add a backend sufficiency gate with `clarification_required` verdicts
- [x] add backend `draft_ready` review verdict content
- [x] explain requested-vs-proposed goal-style changes in review assumptions
- [x] add explicit backend first-plan confirm seam for `OK, create plan`
- [x] block voice confirm when an active plan already exists
- [ ] set duration and file-size guardrails for raw audio transport
- [x] ensure the confirmed-transcript backend path uses one plan-generation call and no extra summarization call
- [x] avoid realtime voice or extra summarization passes in v1
- [x] return review-only draft output without active-plan mutation
- [x] ensure review verdict calls create no plan/profile/workout rows
- [ ] validate the end-to-end runner flow in saved-mode onboarding
- [ ] validate raw audio transport failures:
  - unsupported format
  - too large
  - too long
  - transcription failure
  - empty/unusable transcript

## Exit Criteria

- A runner can paste or type one transcript-style request as a secondary onboarding path.
- The system reviews that transcript before plan creation.
- Confirmed draft text uses the same canonical plan-authoring path as existing structured authoring.
- The backend can accept one short supported audio file and return transcript text for review through a separate transport seam.
- The first release avoids realtime voice and avoids extra summarization model calls.
- Token usage stays bounded to one transcription call plus one later plan-generation call, with no intermediate cleanup/summarization model pass.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Implemented the first frontend transcript-text review UI for voice-to-plan on no-plan onboarding. The audio capture/transcription parts remain future work.

### Key Decisions

- Voice is only a new input modality, not a new plan-generation architecture.
- The first visible slice uses pasted/typed transcript text only.
- The runner must review a backend draft before plan creation.
- Realtime voice and extra summarization passes are explicitly out of scope for v1.

### Current State

- The app already has a canonical structured-first onboarding path and a bounded backend free-text compatibility seam for plan generation.
- The backend now has a confirmed-transcript `generateVoiceToPlanDraft` seam that checks `voice_to_plan` and returns either `clarification_required` or a review-only `draft_ready` canonical draft.
- The backend now has an explicit `confirmVoiceToPlanDraft` first-plan creation seam for `OK, create plan`; it blocks existing active plans rather than replacing them.
- The transcript-text review UI exists in `OnboardingGate`.
- There is no raw audio capture or transcription transport yet.

### Constraints

- Do not build a realtime voice assistant.
- Do not send raw audio into the plan-generation model.
- Do not add extra LLM cleanup/summarization steps unless later evidence proves they are necessary.

### Risks / Open Questions

- Dictated input may be too long or too noisy.
- Transcription quality for running-specific vocabulary needs real QA.
- Transcript-review UX must be good enough to catch transcription mistakes before plan generation.

### Next Recommended Role

QA

### Suggested Next Step

QA the no-plan onboarding flow in Safari: transcript input, clarification, draft-ready review, explicit confirm, structured setup fallback, Advanced JSON visibility, and mobile/narrow overflow.
```
