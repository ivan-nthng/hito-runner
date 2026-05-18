import type { RefObject } from "react";
import type {
  VoiceToPlanClarificationRequired,
  VoiceToPlanDraftResult,
  VoiceToPlanDraftSuccess,
} from "@/lib/voice-to-plan-authoring";
import { formatTerrainFocus, voiceResultMessage } from "./onboarding-form-model";

export type VoiceStatus = "idle" | "reviewing" | "creating" | "created";

interface DictateToPlanPanelProps {
  voiceTranscriptRef: RefObject<HTMLTextAreaElement | null>;
  transcript: string;
  setTranscript: (value: string) => void;
  result: VoiceToPlanDraftResult | null;
  error: string | null;
  status: VoiceStatus;
  isBusy: boolean;
  submitReview: () => void;
  confirmDraft: () => void;
  addMoreDetails: () => void;
  startOver: () => void;
  useStructuredSetup: () => void;
}

export function DictateToPlanPanel({
  voiceTranscriptRef,
  transcript,
  setTranscript,
  result,
  error,
  status,
  isBusy,
  submitReview,
  confirmDraft,
  addMoreDetails,
  startOver,
  useStructuredSetup,
}: DictateToPlanPanelProps) {
  const isDraftReady = result?.ok === true && result.status === "draft_ready";
  const isClarificationRequired = result?.ok === true && result.status === "clarification_required";

  return (
    <section className="hito-section-divider mt-6 grid gap-4 pt-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="hito-micro-label" data-tone="signal">
            AI setup
          </p>
          <span className="hito-status-pill">Pro feature</span>
        </div>
        <h2 className="hito-panel-title mt-2">Dictate your setup.</h2>
        <p className="hito-helper mt-2">
          Tell Hito your basics, running history, experience, constraints, and goal. Hito will draft
          the setup for review before anything is created.
        </p>
        <p className="hito-caption mt-2 text-muted-foreground">
          Manual structured setup remains the reliable direct path below.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 rounded-[1.5rem] bg-muted/20 p-3 sm:p-4">
          <span className="hito-form-label">Paste or type what you would say out loud</span>
          <textarea
            ref={voiceTranscriptRef}
            rows={3}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="I am 35, 72 kg, 178 cm. I want to train for a 10K in about 10 weeks. I can run four days a week, rest Wednesdays and Sundays, and my recent 5K is around 25 minutes..."
            className="hito-field hito-field-secondary hito-textarea-md resize-y"
          />
          <span className="hito-field-helper">
            Hito uses AI to fill and review setup from transcript text. No microphone yet: paste or
            type what you would say out loud.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isBusy || !transcript.trim()}
            onClick={submitReview}
            className="hito-button hito-button-secondary hito-button-md"
          >
            {status === "reviewing" ? "Reviewing setup..." : "Review AI setup"}
          </button>
          <button
            type="button"
            disabled={isBusy || (!transcript && !result)}
            onClick={startOver}
            className="hito-button hito-button-ghost hito-button-md"
          >
            Start over
          </button>
          <span className="hito-field-helper">Transcript text is not saved as profile truth.</span>
        </div>

        {error ? <p className="hito-field-error">{error}</p> : null}
        {status === "created" ? (
          <p className="hito-field-success">Your plan is ready. Opening it now...</p>
        ) : null}

        {result && !result.ok ? <VoiceLockedOrError result={result} /> : null}
        {isClarificationRequired ? (
          <VoiceClarificationReview
            result={result}
            addMoreDetails={addMoreDetails}
            useStructuredSetup={useStructuredSetup}
          />
        ) : null}
        {isDraftReady ? (
          <VoiceDraftReadyReview
            result={result}
            isBusy={isBusy}
            status={status}
            confirmDraft={confirmDraft}
            addMoreDetails={addMoreDetails}
            startOver={startOver}
          />
        ) : null}
      </div>
    </section>
  );
}

function VoiceLockedOrError({ result }: { result: Exclude<VoiceToPlanDraftResult, { ok: true }> }) {
  const locked = result.reason === "capability_locked";

  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div>
          <p className="hito-list-row-title">
            {locked ? "AI setup is a Pro feature" : "Review issue"}
          </p>
          <p className="hito-list-row-copy">
            {locked
              ? "This AI assist is not available for this account yet. Manual structured setup is still available below."
              : voiceResultMessage(result)}
          </p>
        </div>
        <span className="hito-status-pill" data-tone={locked ? "warning" : "error"}>
          {locked ? "Locked" : "Needs review"}
        </span>
      </div>
    </div>
  );
}

function VoiceClarificationReview({
  result,
  addMoreDetails,
  useStructuredSetup,
}: {
  result: VoiceToPlanClarificationRequired;
  addMoreDetails: () => void;
  useStructuredSetup: () => void;
}) {
  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">AI setup needs a little more detail</p>
          <p className="hito-list-row-copy">
            No plan was created. Add the missing setup details, then review again.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="warning">
          Clarify
        </span>
      </div>

      {result.clarification.understood.length > 0 ? (
        <div className="hito-list-row items-start">
          <div>
            <p className="hito-form-label">Already understood</p>
            <ul className="mt-2 grid gap-1">
              {result.clarification.understood.map((item) => (
                <li key={item} className="hito-body-small text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-form-label">Missing details</p>
          <div className="mt-2 grid gap-3">
            {result.clarification.missingFields.map((field) => (
              <div key={field.field}>
                <p className="hito-label">{field.label}</p>
                <p className="hito-field-helper">{field.reason}</p>
                <p className="hito-body-small mt-1">{field.question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {result.clarification.questions.length > 0 ? (
        <div className="hito-list-row items-start">
          <div>
            <p className="hito-form-label">Questions to answer</p>
            <ul className="mt-2 grid gap-1">
              {result.clarification.questions.map((question) => (
                <li key={question} className="hito-body-small text-muted-foreground">
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="hito-list-row">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addMoreDetails}
            className="hito-button hito-button-secondary hito-button-md"
          >
            Add more details
          </button>
          <button
            type="button"
            onClick={useStructuredSetup}
            className="hito-button hito-button-ghost hito-button-md"
          >
            Use structured setup
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceDraftReadyReview({
  result,
  isBusy,
  status,
  confirmDraft,
  addMoreDetails,
  startOver,
}: {
  result: VoiceToPlanDraftSuccess;
  isBusy: boolean;
  status: VoiceStatus;
  confirmDraft: () => void;
  addMoreDetails: () => void;
  startOver: () => void;
}) {
  return (
    <div className="hito-row-group">
      <div className="hito-list-row items-start">
        <div className="min-w-0">
          <p className="hito-list-row-title">Review the AI setup verdict</p>
          <p className="hito-list-row-copy">
            This is only Hito's reviewed setup summary. Confirm explicitly if it matches your
            intent.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Draft ready
        </span>
      </div>

      <div className="hito-list-row items-start">
        <div className="grid gap-3">
          <p className="hito-form-label">What Hito understood</p>
          <VoiceReviewLine label="Runner" value={result.review.runnerUnderstanding.profile} />
          <VoiceReviewLine
            label="Readiness"
            value={result.review.runnerUnderstanding.inferredLevel}
          />
          <VoiceReviewLine label="Goal" value={result.review.runnerUnderstanding.goal} />
          <VoiceReviewLine
            label="Availability"
            value={result.review.runnerUnderstanding.availability}
          />
          <VoiceReviewLine label="Timeline" value={result.review.runnerUnderstanding.timeline} />
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div className="grid gap-3">
          <p className="hito-form-label">Plan setup summary</p>
          <VoiceReviewLine
            label="Estimated horizon"
            value={result.review.planShape.durationLabel}
          />
          <VoiceReviewLine
            label="Days per week"
            value={`${result.review.planShape.runningDaysPerWeek}`}
          />
          <VoiceReviewLine
            label="Rest days"
            value={
              result.draft.summary.fixedRestDays.length
                ? result.draft.summary.fixedRestDays.join(", ")
                : "No fixed rest days"
            }
          />
          <VoiceReviewLine
            label="Workouts"
            value={`${result.review.planShape.workoutCount} planned workouts`}
          />
          <VoiceReviewLine
            label="Terrain"
            value={formatTerrainFocus(result.review.planShape.terrainFocus)}
          />
          {result.review.planShape.activityMix.length > 0 ? (
            <div>
              <p className="hito-label">Rough activity mix</p>
              <p className="hito-body-small text-muted-foreground">
                {result.review.planShape.activityMix.join(", ")}
              </p>
              <p className="hito-field-helper mt-1">
                Quality or interval work appears here only when the backend review includes it.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hito-list-row items-start">
        <div>
          <p className="hito-form-label">Assumptions and safety</p>
          <ul className="mt-2 grid gap-1">
            {result.review.assumptions.map((assumption) => (
              <li key={assumption} className="hito-body-small text-muted-foreground">
                {assumption}
              </li>
            ))}
            <li className="hito-body-small text-muted-foreground">Nothing has been created yet.</li>
            <li className="hito-body-small text-muted-foreground">
              The raw transcript will not be saved as profile truth.
            </li>
            <li className="hito-body-small text-muted-foreground">
              Creating the plan requires explicit confirmation.
            </li>
          </ul>
        </div>
      </div>

      <div className="hito-list-row">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={confirmDraft}
            className="hito-button hito-button-primary hito-button-md"
          >
            {status === "creating" ? "Creating plan..." : "Yes, create plan"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={addMoreDetails}
            className="hito-button hito-button-secondary hito-button-md"
          >
            Add more details
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={startOver}
            className="hito-button hito-button-ghost hito-button-md"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="hito-label">{label}</p>
      <p className="hito-body-small text-muted-foreground">{value}</p>
    </div>
  );
}
