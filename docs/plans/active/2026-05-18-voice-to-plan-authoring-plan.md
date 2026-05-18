# Voice-To-Plan Authoring Plan

## Status

Draft

## Owner

Architect

## Last Updated

2026-05-18

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
4. product submits the final transcript into the existing text-to-plan generation seam
5. deterministic validation and canonical persistence continue unchanged

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

## Token Discipline

The cost boundary matters more than the novelty here.

### Required cost controls

1. Do not stream audio into the plan-generation model.
2. Do not run an extra LLM summarization pass between transcription and plan generation.
3. Do not send both raw audio and transcript into plan generation.
4. Do not store or replay very long recordings in the first release.
5. Do not auto-regenerate plans after every transcript edit.

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
6. Existing text-to-plan generation seam runs.

### Recommended helper copy

The helper text should guide brevity and useful content, for example:

- your goal or race
- your current weekly running
- recent benchmark or race result
- which days you can run
- injuries or limits

Avoid presenting voice as an open-ended chat.

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

### Backend seams

Recommended new backend modules:

- `src/lib/voice-authoring/transcribe-audio.ts`
- `src/lib/voice-authoring/validate-transcript.ts`
- `src/lib/voice-authoring/types.ts`

Reuse existing backend seam:

- `src/lib/openai-plan-authoring.ts`

### Server actions

Recommended first actions:

- `transcribeVoiceAuthoringInput(file)`
- `generatePlanFromConfirmedTranscript(transcriptText)`

Important:

- do not create a second plan-generation action with different rules
- the confirmed transcript should end in the same authoring/generation path already used by free text

## Validation And Safety Direction

### Transcript validation

Before sending transcript text into plan generation, validate:

- transcript is non-empty
- transcript is under one bounded maximum length
- transcript is not obviously only filler/noise

If transcript is too long:

- do not auto-summarize by default
- ask the runner to shorten or edit it

### Plan-generation safety

Use the same deterministic validation already applied to normal text authoring:

- no direct persistence of model output
- no runtime-only fields
- no completion/sync/feedback noise in canonical plan truth

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

### Phase 1: Voice transcript transport

Deliver:

- short audio capture or upload
- server-side transcription
- transcript readback UI

### Phase 2: Confirmed transcript handoff

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

- runner can record one short onboarding message
- transcript appears before plan generation
- runner can edit transcript before submission
- confirmed transcript produces a plan through the same canonical saved-mode path as text

### Cost validation

- one normal successful flow uses exactly:
  one transcription call
  one plan-generation call
- no hidden summarization or rewrite call is added in v1

### Failure validation

- oversized or unsupported audio fails with clear copy
- empty or unusable transcript fails with clear copy
- runner can retry recording without getting stuck

## Checklist

- [ ] define the bounded voice-to-plan product scope
- [ ] add one transcription seam separate from the plan model
- [ ] add one transcript review and edit step
- [ ] route confirmed transcript into the existing text-to-plan generation seam
- [ ] set duration, file-size, and transcript-length guardrails
- [ ] ensure one normal flow uses only one transcription call and one plan-generation call
- [ ] avoid realtime voice or extra summarization passes in v1
- [ ] validate the end-to-end runner flow in saved-mode onboarding

## Exit Criteria

- A runner can dictate one short request instead of typing it.
- The system transcribes that audio into editable text before plan generation.
- Confirmed transcript text uses the same canonical plan-authoring path as existing free text.
- The first release avoids realtime voice and avoids extra summarization model calls.
- Token usage stays bounded to one transcription call plus one plan-generation call for the normal successful path.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the architecture plan for a bounded voice-to-plan authoring slice that lets the runner dictate one short onboarding request, transcribes it once, shows an editable transcript, and then routes the confirmed text into the existing canonical text-to-plan seam.

### Key Decisions

- Voice is only a new input modality, not a new plan-generation architecture.
- The first release should use one transcription call and one plan-generation call only.
- The runner must review and edit the transcript before plan generation.
- Realtime voice and extra summarization passes are explicitly out of scope for v1.

### Current State

- The app already has a canonical structured-first onboarding path and a bounded backend free-text compatibility seam for plan generation.
- There is no current voice-input path yet.

### Constraints

- Do not build a realtime voice assistant.
- Do not send raw audio into the plan-generation model.
- Do not add extra LLM cleanup/summarization steps unless later evidence proves they are necessary.

### Risks / Open Questions

- Dictated input may be too long or too noisy.
- Transcription quality for running-specific vocabulary needs real QA.
- Transcript-review UX must be good enough to catch transcription mistakes before plan generation.

### Next Recommended Role

ARCHITECT

### Suggested Next Step

Turn this plan into a concrete schema-and-surface proposal for short audio capture, transcription transport, transcript review, and the final handoff into the existing canonical plan-authoring seam.
```
