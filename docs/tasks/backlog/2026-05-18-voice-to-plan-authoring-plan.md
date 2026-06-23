# Voice-To-Plan Authoring Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

architect

## Task

Plan the next voice-to-plan authoring slice when Product is ready to resume real audio dictation.

## Stage

ARCHITECT plan / future raw-audio transport and transcript review boundary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Plan the next voice-to-plan authoring slice when Product is ready to resume real audio dictation.

Stage:
ARCHITECT plan / future raw-audio transport and transcript review boundary.

Context:
This backlog item is repo-derived Admin Backlog source truth. Voice-to-plan is not the current
visible onboarding owner. Existing backend voice/text authoring truth is preserved, but raw audio
capture/transcription and runner-facing voice UI remain future work.

Scope:
Define the smallest safe raw-audio transport slice that can feed the existing transcript/text
authoring path without creating a second plan-generation architecture.

Do not:
- build realtime voice;
- send raw audio directly into plan generation;
- add extra summarization calls;
- persist transcripts or audio without a separate privacy/storage decision;
- bypass review/confirm or backend validation.
```

## Owner

Backend / Frontend / QA, after Product re-prioritizes real audio dictation.

## Last Updated

2026-06-20

## Compression Note

This file was compressed during ARCHITECT Slice D4. It preserves the product and architecture
decision history for voice-to-plan while removing stale implementation logs, duplicated handoff
blocks, and obsolete prompt chains.

## Current Source Boundary

Voice-to-plan is backlog/future work. The current product should not expose a visible voice setup
surface unless a new plan reopens it.

Current preserved truth:

- Hito already has backend text/transcript authoring seams for non-default voice/text plan creation
  work.
- Voice must remain an input modality in front of the existing authoring pipeline, not a second plan
  engine.
- Backend validation, plan-authoring doctrine, review/confirm, active-plan existence checks, and
  no-fake-metric guardrails remain canonical.
- Raw audio transport, capture/upload UI, transcription, storage/privacy policy, and end-to-end
  browser QA remain unimplemented future scope.

Current stale historical truth explicitly demoted:

- Earlier notes that described a visible transcript UI as the next QA target are historical only.
- Future UI must be replanned from current onboarding/current-system docs, not continued directly
  from the old transcript-panel wording.

## Product Decision To Preserve

First real audio release should be bounded:

1. The runner records or uploads one short supported audio file.
2. Backend checks entitlement before transcription.
3. Backend transcribes once and returns transcript text for review.
4. The runner reviews/edits transcript text.
5. Only confirmed transcript text enters the existing plan-authoring path.
6. Backend returns either `clarification_required` or a review-ready draft.
7. Plan creation happens only after explicit confirm and canonical validation.

Do not turn this into:

- realtime voice coaching;
- an always-on audio session;
- raw-audio-to-plan generation;
- a hidden multi-pass summarization pipeline;
- active-plan replacement;
- personal metric invention.

## Architecture Rules

- Audio is never canonical plan truth.
- Transcript text is the bridge into existing authoring.
- Deterministic validation remains after transcription and before persistence.
- Missing essential runner details must trigger clarification instead of fabricated defaults.
- No extra LLM cleanup/summarization call is allowed in v1 unless later evidence proves it necessary.
- If transcript/audio storage is needed, it requires a separate privacy, retention, and deletion
  contract.

## Future Backend Slice

When Product reopens this, BACKEND should define and implement a raw-audio transport seam:

- accepted formats and extensions;
- size and duration limits;
- entitlement-before-transcription;
- one OpenAI transcription call or selected transcription provider call;
- transcript normalization and validation;
- transcript-ready response before draft generation;
- deterministic failure modes for unsupported, too large, too long, empty, or unusable audio;
- no Supabase mutation unless a separate storage/audit slice is explicitly selected.

## Future Frontend Slice

Frontend should only start after the backend transport contract exists:

- capture/upload one short audio note;
- show upload/transcription progress and bounded errors;
- display editable transcript;
- require explicit runner action before draft review;
- reuse current onboarding/Hito DS patterns;
- do not create a second AI setup surface without Product/Architecture approval.

## Validation To Preserve

Future validation must prove:

- text/transcript review is non-mutating before confirm;
- active-plan existence blocks first-plan voice confirm;
- no plan/profile/workout rows are created during review;
- transcription failures are bounded and understandable;
- no realtime/extra summarization path was introduced;
- no fake pace, fake personal HR, or unsupported runner truth is emitted.

## Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`
- Current running-plan/source hierarchy: `docs/current-functional-map.md`

## Stop Conditions

Stop if the next slice requires live OpenAI calls during architecture planning, Supabase mutation,
audio/transcript retention policy, production data, visible onboarding changes, or a second
plan-generation pipeline.
