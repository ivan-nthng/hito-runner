import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type BodyNote } from "@/lib/body-notes";
import { cn } from "@/lib/utils";
import { saveWorkoutLog } from "@/lib/training-api";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import {
  WEEK_STATUS_META,
  formatDurationMin,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";
import type { WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import {
  BodyNotesModal,
  BodyNotesSummaryRow,
  cloneBodyNoteDrafts,
  createEmptyBodyNoteDraft,
  type BodyNoteDraft,
} from "@/components/workout-completion/BodyNotesEditor";
import {
  DeterministicComparisonReadback,
  humanizePrimaryComparisonVerdict,
  toneForComparison,
} from "@/components/workout-completion/WorkoutComparisonReadback";
import { WorkoutAiInsightReadback } from "@/components/workout-completion/WorkoutAiInsightReadback";

type Outcome = "completed" | "partial" | "skipped";
type CompletionFormState = {
  outcome: Outcome;
  actualKm: string;
  actualMin: string;
  rpe: number;
  notes: string;
  intervalsCompleted: number;
  bodyNotes: BodyNoteDraft[];
};
const EMPTY_SAVED_BODY_NOTES: BodyNote[] = [];

export function CompletionPanel({
  workout,
  snapshot,
  feedback,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
}) {
  const router = useRouter();
  const saveWorkoutLogFn = useServerFn(saveWorkoutLog);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bodyNotesModalOpen, setBodyNotesModalOpen] = useState(false);
  const [bodyNotesDraft, setBodyNotesDraft] = useState<BodyNoteDraft[]>([]);

  const plannedKm = workoutDistanceKm(workout) ?? 0;
  const plannedMin = workoutDuration(workout);
  const plannedRepeats = workout.steps.find((step) => step.repeats)?.repeats ?? 0;
  const hasSavedLog = snapshot.source === "persisted" && Boolean(workout.log);
  const savedLogOutcome = workout.log?.outcome ?? null;
  const savedLogDistanceKm = workout.log?.actualDistanceKm ?? null;
  const savedLogDurationMin = workout.log?.actualDurationMin ?? null;
  const savedLogRpe = workout.log?.rpe ?? null;
  const savedLogNotes = workout.log?.notes ?? null;
  const savedLogIntervalsCompleted = workout.log?.intervalsCompleted ?? null;
  const savedLogBodyNotes = workout.log?.bodyNotes ?? EMPTY_SAVED_BODY_NOTES;
  const savedPayloadFromWorkout = useMemo(
    () =>
      buildSavedPayload(workout.id, {
        outcome: savedLogOutcome,
        actualDistanceKm: savedLogDistanceKm,
        actualDurationMin: savedLogDurationMin,
        rpe: savedLogRpe,
        notes: savedLogNotes,
        intervalsCompleted: savedLogIntervalsCompleted,
        bodyNotes: savedLogBodyNotes,
      }),
    [
      workout.id,
      savedLogOutcome,
      savedLogDistanceKm,
      savedLogDurationMin,
      savedLogRpe,
      savedLogNotes,
      savedLogIntervalsCompleted,
      savedLogBodyNotes,
    ],
  );
  const savedPayloadKey = useMemo(
    () => serializePayload(savedPayloadFromWorkout),
    [savedPayloadFromWorkout],
  );
  const syncedFormState = useMemo(
    () => buildInitialFormState(savedPayloadFromWorkout, plannedKm, plannedMin, plannedRepeats),
    [plannedKm, plannedMin, plannedRepeats, savedPayloadFromWorkout],
  );
  const [form, setForm] = useState<CompletionFormState>(() =>
    buildInitialFormState(savedPayloadFromWorkout, plannedKm, plannedMin, plannedRepeats),
  );
  const formRef = useRef<CompletionFormState>(form);
  const [savedBaselineKey, setSavedBaselineKey] = useState(savedPayloadKey);
  const [optimisticSavedPayloadKey, setOptimisticSavedPayloadKey] = useState<string | null>(null);

  function updateForm(
    updater: CompletionFormState | ((current: CompletionFormState) => CompletionFormState),
  ) {
    const nextState = typeof updater === "function" ? updater(formRef.current) : updater;
    formRef.current = nextState;
    setForm(nextState);
  }

  useEffect(() => {
    formRef.current = syncedFormState;
    setForm(syncedFormState);
    setSavedBaselineKey(savedPayloadKey);
    setOptimisticSavedPayloadKey(null);
  }, [savedPayloadKey, syncedFormState]);

  const currentPayload = buildSavePayload(workout, form);
  const currentPayloadKey = useMemo(() => serializePayload(currentPayload), [currentPayload]);
  const isDirty = currentPayloadKey !== savedBaselineKey;
  const hasSavedResult = hasSavedLog || optimisticSavedPayloadKey === savedBaselineKey;

  useEffect(() => {
    if (isDirty) {
      setMessage(null);
      setError(null);
    }
  }, [currentPayloadKey, isDirty]);

  useEffect(() => {
    if (!bodyNotesModalOpen) {
      return;
    }

    if (form.outcome === "skipped") {
      setBodyNotesModalOpen(false);
      setBodyNotesDraft(cloneBodyNoteDrafts(formRef.current.bodyNotes));
    }
  }, [bodyNotesModalOpen, form.outcome]);

  const outcome = form.outcome;
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
  const isSkipped = outcome === "skipped";
  const saveButtonLabel =
    snapshot.source !== "persisted"
      ? "Preview result"
      : isSaving
        ? "Saving result..."
        : hasSavedResult && !isDirty
          ? "Saved result"
          : hasSavedResult
            ? "Save changes"
            : "Save result";

  const openBodyNotesModal = () => {
    const currentBodyNotes = cloneBodyNoteDrafts(formRef.current.bodyNotes);
    setBodyNotesDraft(
      currentBodyNotes.length > 0 ? currentBodyNotes : [createEmptyBodyNoteDraft()],
    );
    setBodyNotesModalOpen(true);
  };

  const resetBodyNotesDraft = () => {
    setBodyNotesDraft(cloneBodyNoteDrafts(formRef.current.bodyNotes));
  };

  const closeBodyNotesModal = () => {
    setBodyNotesModalOpen(false);
    resetBodyNotesDraft();
  };

  const saveBodyNotesModal = () => {
    updateForm((current) => ({
      ...current,
      bodyNotes: cloneBodyNoteDrafts(bodyNotesDraft),
    }));
    setBodyNotesModalOpen(false);
  };

  if (workout.type === "rest") {
    return (
      <div className="hito-surface-flat p-5">
        <div className="hito-label">Rest day</div>
        <p className="hito-body mt-2">
          Rest days do not need a workout result. If a mobility or strength assignment is added
          later, you can log it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "hito-surface-flat p-4",
          error
            ? "border-destructive/30 bg-destructive/10"
            : message
              ? "border-success/30 bg-success/10"
              : hasSavedLog
                ? "border-success/20 bg-background/35"
                : "",
        )}
      >
        <div className="hito-label">
          {isSaving
            ? "Saving result"
            : error
              ? "Couldn't save"
              : hasSavedResult && isDirty
                ? "Unsaved changes"
                : message
                  ? "Saved"
                  : snapshot.source === "persisted"
                    ? hasSavedResult
                      ? "Saved result"
                      : "Ready to save"
                    : "Preview only"}
        </div>
        <p className="hito-body mt-2">
          {isSaving
            ? `Saving your ${outcome} result now.`
            : error
              ? error
              : hasSavedResult && isDirty
                ? `You changed this ${outcome} result. Save to update the workout and this week's status.`
                : message
                  ? message
                  : snapshot.source === "persisted"
                    ? hasSavedResult
                      ? `This workout already has a saved ${workout.log?.outcome ?? outcome} result. ${
                          hasSavedLog && workout.log?.loggedAt
                            ? `Last updated ${formatLoggedAt(workout.log.loggedAt)}.`
                            : "This result is already saved."
                        }`
                      : "Save this result to update the workout and this week's status."
                    : "You can try the form here, but preview results are not saved."}
        </p>
        <div className="hito-caption mt-3 flex flex-wrap items-center gap-3">
          <span>
            This week <span className="text-foreground/80">{weekStatus.label}</span>
          </span>
          <span className="opacity-50">·</span>
          <span>
            {snapshot.source === "persisted"
              ? hasSavedResult && isDirty
                ? "Changes not saved"
                : hasSavedResult
                  ? "Saved"
                  : "Ready to save"
              : "Preview"}
          </span>
        </div>
      </div>

      <div>
        <Label>How did it go?</Label>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              {
                v: "completed",
                icon: "check-circle",
                label: "Complete",
                c: "var(--success)",
              },
              { v: "partial", icon: "minus", label: "Partial", c: "var(--warn)" },
              {
                v: "skipped",
                icon: "x-circle",
                label: "Skipped",
                c: "var(--destructive)",
              },
            ] satisfies {
              v: Outcome;
              icon: HitoIconName;
              label: string;
              c: string;
            }[]
          ).map((option) => {
            const active = outcome === option.v;
            return (
              <button
                key={option.v}
                type="button"
                onClick={() =>
                  updateForm((current) => ({
                    ...current,
                    outcome: option.v,
                  }))
                }
                className={cn(
                  "hito-surface-flat flex flex-col items-start gap-2 p-4 text-left transition-all",
                  active ? "border-foreground/30 bg-accent/40" : "hover:bg-accent/30",
                )}
              >
                <Icon
                  name={option.icon}
                  size="sm"
                  style={{ color: active ? option.c : undefined }}
                />
                <span className="hito-list-row-title">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isSkipped ? (
        <div className="hito-surface-flat p-4">
          <div className="hito-label">Skipped result</div>
          <p className="hito-body mt-2">
            A skipped result saves without distance, duration, reps, or RPE. You can still leave a
            note for context.
          </p>
        </div>
      ) : (
        <>
          <div>
            <Label>Planned vs actual</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumField
                label="Distance"
                suffix="km"
                planned={plannedKm.toString()}
                value={form.actualKm}
                onChange={(value) => updateForm((current) => ({ ...current, actualKm: value }))}
              />
              <NumField
                label="Duration"
                suffix="min"
                planned={plannedMin.toString()}
                value={form.actualMin}
                onChange={(value) => updateForm((current) => ({ ...current, actualMin: value }))}
              />
            </div>

            {plannedRepeats > 0 && (
              <div className="hito-surface-flat mt-4 p-3">
                <div className="hito-label mb-2">Intervals completed</div>
                <div className="flex gap-1.5">
                  {Array.from({ length: plannedRepeats }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        updateForm((current) => ({
                          ...current,
                          intervalsCompleted: index + 1,
                        }))
                      }
                      className={cn(
                        "hito-technical-mono h-8 flex-1 rounded-md border",
                        index < form.intervalsCompleted
                          ? "bg-quality/30 border-quality/40 text-foreground"
                          : "border-hairline text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="hito-field-helper mt-2">Tap to mark how many reps were completed.</p>
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-1">
            <Slider
              label="Effort (RPE)"
              value={form.rpe}
              max={10}
              onChange={(value) => updateForm((current) => ({ ...current, rpe: value }))}
              hint={`${form.rpe}/10`}
            />
          </div>
        </>
      )}

      <div>
        {!isSkipped && (
          <BodyNotesSummaryRow bodyNotes={form.bodyNotes} onOpen={openBodyNotesModal} />
        )}

        <div className={cn(!isSkipped ? "mt-6 border-t border-hairline pt-5" : "")}>
          <Label>Notes</Label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              updateForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Felt strong on the climb, slight tightness in right calf at km 6…"
            className="hito-field hito-textarea-md mt-3 min-h-28 resize-none"
          />
          <p className="hito-caption mt-3">
            {snapshot.source === "persisted"
              ? "This saves your workout result. Garmin uploads live in Feedback."
              : "Preview only. Results entered here are not saved."}
          </p>
        </div>
      </div>

      {!isSkipped ? (
        <BodyNotesModal
          open={bodyNotesModalOpen}
          bodyNotes={bodyNotesDraft}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeBodyNotesModal();
              return;
            }

            setBodyNotesModalOpen(true);
          }}
          onChange={setBodyNotesDraft}
          onSave={saveBodyNotesModal}
        />
      ) : null}

      <LogResultFeedbackBridge workout={workout} snapshot={snapshot} feedback={feedback} />

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-hairline">
        <button
          type="button"
          onClick={async () => {
            if (snapshot.source !== "persisted") {
              setMessage("Preview result updated locally. Sign in to save it.");
              setError(null);
              return;
            }

            setIsSaving(true);
            setMessage(null);
            setError(null);

            try {
              const nextPayload = buildSavePayload(workout, formRef.current);
              await saveWorkoutLogFn({ data: nextPayload });
              const reconciledFormState = buildInitialFormState(
                nextPayload,
                plannedKm,
                plannedMin,
                plannedRepeats,
              );
              const reconciledPayloadKey = serializePayload(
                buildSavePayload(workout, reconciledFormState),
              );

              updateForm(reconciledFormState);
              setBodyNotesDraft(cloneBodyNoteDrafts(reconciledFormState.bodyNotes));
              setSavedBaselineKey(reconciledPayloadKey);
              setOptimisticSavedPayloadKey(reconciledPayloadKey);
              setMessage(`Saved as ${nextPayload.outcome}. This page now shows the latest result.`);
              void router.invalidate().catch(() => undefined);
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "Could not save log.");
            } finally {
              setIsSaving(false);
            }
          }}
          className="hito-button hito-button-primary hito-button-lg"
          disabled={isSaving || (hasSavedResult && !isDirty)}
        >
          {saveButtonLabel}
        </button>
        <span className="hito-caption ml-auto">
          {snapshot.source === "persisted" ? "Saved to your plan." : "Preview only."}
        </span>
      </div>
    </div>
  );
}

function LogResultFeedbackBridge({
  workout,
  snapshot,
  feedback,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
}) {
  const state = getFeedbackInviteState(snapshot, feedback);

  if (!state) {
    return null;
  }

  return (
    <div className="border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="hito-label">{state.label}</p>
            {state.pill ? (
              <span className="hito-status-pill" data-tone={state.pill.tone}>
                {state.pill.label}
              </span>
            ) : null}
          </div>
          <p className="hito-body-small mt-1 max-w-xl">{state.body}</p>
        </div>
        <Link
          to="/workout/$date"
          params={{ date: workout.date }}
          search={{ tab: "feedback" } as never}
          className="hito-button hito-button-secondary hito-button-sm shrink-0"
        >
          <Icon name="file-up" size="xs" />
          {state.cta}
          <Icon name="arrow-up-right" size="xs" />
        </Link>
      </div>
    </div>
  );
}

export function WorkoutFeedbackPanel({
  workout,
  snapshot,
  feedback,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [feedbackState, setFeedbackState] = useState<WorkoutResultFeedbackSummary | null>(feedback);
  const canUploadResult = snapshot.source === "persisted" && workout.type !== "rest";
  const attachedGarminAsset = feedbackState?.latestAsset ?? null;
  const uploadSummary = getFeedbackUploadSummary({
    canUploadResult,
    isUploading,
    uploadError,
    feedback: feedbackState,
  });
  const hasLoadedEvidence = Boolean(
    attachedGarminAsset &&
    attachedGarminAsset.parseStatus !== "failed" &&
    (feedbackState?.latestActualMetrics ||
      feedbackState?.latestComparison ||
      feedbackState?.latestAiInsight),
  );
  const headerPill = attachedGarminAsset
    ? hasLoadedEvidence
      ? {
          label: "Ready",
          tone: "success" as const,
        }
      : (uploadSummary.pill ?? {
          label: "Attached",
          tone: "signal" as const,
        })
    : canUploadResult
      ? null
      : {
          label: "Saved mode only",
          tone: "signal" as const,
        };
  const showUploadSummaryInEmptyState =
    !attachedGarminAsset && Boolean(isUploading || uploadError || !canUploadResult);

  useEffect(() => {
    setFeedbackState(feedback);
  }, [feedback]);

  if (workout.type === "rest") {
    return (
      <div className="hito-surface-flat p-5">
        <div className="hito-label">Feedback unavailable</div>
        <p className="hito-body mt-2">
          Rest days do not support Garmin review right now. If you need to log something, keep it in
          the workout result instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-3 max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="hito-label">Feedback</div>
            <h2 className="hito-section-title mt-2">Compare your run with the plan.</h2>
            <p className="hito-body mt-2">
              {attachedGarminAsset
                ? "Your Garmin file and review live here."
                : "Add a Garmin file if you want a deeper review."}
            </p>
          </div>
          {headerPill ? (
            <span className="hito-status-pill" data-tone={headerPill.tone}>
              {headerPill.label}
            </span>
          ) : null}
        </div>
      </header>

      {!attachedGarminAsset ? (
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={async (event) => {
            const selectedFile = event.target.files?.[0];

            if (!selectedFile) {
              return;
            }

            const selectedFileName = selectedFile.name.toLowerCase();
            const isSupportedGarminFile =
              selectedFileName.endsWith(".fit") || selectedFileName.endsWith(".zip");

            if (!isSupportedGarminFile) {
              setUploadError("Choose one Garmin .fit file or .zip archive.");
              event.target.value = "";
              return;
            }

            setIsUploading(true);
            setUploadError(null);
            setRemoveError(null);

            try {
              const formData = new FormData();
              formData.set("plannedWorkoutId", workout.id);
              formData.set("file", selectedFile);

              const response = await fetch("/api/workout-result/upload", {
                method: "POST",
                body: formData,
              });
              const payload = (await response.json()) as
                | {
                    ok: true;
                    marker: NonNullable<WorkoutResultFeedbackSummary>["marker"];
                    latestAsset: NonNullable<WorkoutResultFeedbackSummary>["latestAsset"];
                    latestActualMetrics: NonNullable<WorkoutResultFeedbackSummary>["latestActualMetrics"];
                    latestComparison: NonNullable<WorkoutResultFeedbackSummary>["latestComparison"];
                    latestAiInsight: NonNullable<WorkoutResultFeedbackSummary>["latestAiInsight"];
                  }
                | { ok: false; message?: string };

              if (!response.ok || !payload.ok) {
                throw new Error(
                  "message" in payload && payload.message
                    ? payload.message
                    : "The Garmin result upload could not be completed.",
                );
              }

              setFeedbackState({
                marker: payload.marker ?? null,
                latestAsset: payload.latestAsset ?? null,
                latestActualMetrics: payload.latestActualMetrics ?? null,
                latestComparison: payload.latestComparison ?? null,
                latestAiInsight: payload.latestAiInsight ?? null,
              });

              try {
                await router.invalidate();
              } catch {
                // Keep the successful upload state visible even if route refresh lags.
              }
            } catch (uploadFailure) {
              setUploadError(
                uploadFailure instanceof Error
                  ? uploadFailure.message
                  : "The Garmin result upload could not be completed.",
              );
            } finally {
              event.target.value = "";
              setIsUploading(false);
            }
          }}
        />
      ) : null}

      <div className="space-y-6">
        <section>
          {attachedGarminAsset ? (
            <AttachedEvidenceReadback
              asset={attachedGarminAsset}
              actualMetrics={feedbackState?.latestActualMetrics ?? null}
              summary={uploadSummary}
              isRemoving={isRemoving}
              onRemove={async () => {
                if (!canUploadResult || isRemoving) {
                  return;
                }

                const confirmed = window.confirm(
                  "Remove the attached Garmin evidence for this workout? The manual workout log will stay as it is.",
                );

                if (!confirmed) {
                  return;
                }

                setIsRemoving(true);
                setRemoveError(null);
                setUploadError(null);

                try {
                  const response = await fetch("/api/workout-result/remove", {
                    method: "POST",
                    headers: {
                      "content-type": "application/json",
                    },
                    body: JSON.stringify({
                      plannedWorkoutId: workout.id,
                    }),
                  });

                  const payload = (await response.json()) as
                    | {
                        ok: true;
                        feedback: WorkoutResultFeedbackSummary;
                      }
                    | { ok: false; message?: string };

                  if (!response.ok || !payload.ok) {
                    throw new Error(
                      "message" in payload && payload.message
                        ? payload.message
                        : "The Garmin evidence could not be removed.",
                    );
                  }

                  setFeedbackState(payload.feedback);

                  try {
                    await router.invalidate();
                  } catch {
                    // Keep the local cleared state even if route refresh lags.
                  }
                } catch (removalFailure) {
                  setRemoveError(
                    removalFailure instanceof Error
                      ? removalFailure.message
                      : "The Garmin evidence could not be removed.",
                  );
                } finally {
                  setIsRemoving(false);
                }
              }}
            />
          ) : (
            <>
              <div className="hito-surface px-6 py-8 sm:px-8 sm:py-10">
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface/40">
                    <Icon name="file-up" size="md" className="text-foreground/82" />
                  </div>
                  <div className="hito-label">Upload Garmin file</div>
                  <h3 className="hito-panel-title mt-3">
                    Add a Garmin run to compare it with the plan.
                  </h3>
                  <p className="hito-body mt-3 max-w-xl">
                    Use one Garmin <span className="hito-technical-mono">.fit</span> file or one{" "}
                    <span className="hito-technical-mono">.zip</span> archive with exactly one FIT
                    activity. That unlocks the comparison below.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadError(null);
                        setRemoveError(null);
                        fileInputRef.current?.click();
                      }}
                      disabled={!canUploadResult || isUploading}
                      className={cn(
                        "hito-button hito-button-primary hito-button-md",
                        !canUploadResult && "disabled:opacity-100",
                      )}
                    >
                      <Icon name="file-up" size="sm" />
                      {isUploading ? "Uploading file..." : "Upload Garmin file"}
                    </button>
                  </div>
                </div>

                {showUploadSummaryInEmptyState ? (
                  <div className="mx-auto mt-6 max-w-2xl border-t border-hairline pt-4">
                    <FeedbackUploadSummary summary={uploadSummary} />
                  </div>
                ) : null}
              </div>

              {uploadError ? <p className="hito-field-error mt-3">{uploadError}</p> : null}
            </>
          )}

          {removeError ? <p className="hito-field-error mt-3">{removeError}</p> : null}
        </section>

        <section className="border-t border-hairline pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <h3 className="hito-panel-title">Plan vs run</h3>
              {!feedbackState?.latestComparison ? (
                <p className="hito-body mt-2 max-w-2xl">
                  This compares the planned workout with the uploaded run.
                </p>
              ) : null}
            </div>
            {feedbackState?.latestComparison ? (
              <span
                className="hito-status-pill"
                data-tone={toneForComparison(feedbackState.latestComparison)}
              >
                {humanizePrimaryComparisonVerdict(feedbackState.latestComparison)}
              </span>
            ) : null}
          </div>
          {feedbackState?.latestComparison ? (
            <DeterministicComparisonReadback comparison={feedbackState.latestComparison} />
          ) : (
            <p className="hito-body mt-4 max-w-2xl">
              No comparison yet. Once the Garmin file is processed, it will show up here.
            </p>
          )}
        </section>

        <section className="border-t border-hairline pt-6">
          <div className="max-w-3xl">
            <h3 className="hito-panel-title">Next step</h3>
            {!feedbackState?.latestAiInsight ? (
              <p className="hito-body mt-2 max-w-2xl">
                A short note based on the comparison above.
              </p>
            ) : null}
          </div>
          {feedbackState?.latestAiInsight ? (
            <WorkoutAiInsightReadback
              insight={feedbackState.latestAiInsight}
              comparison={feedbackState.latestComparison ?? null}
            />
          ) : (
            <p className="hito-body mt-4 max-w-2xl">
              No next-step note yet. After a successful Garmin upload, it can appear here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function buildInitialFormState(
  savedPayload: ReturnType<typeof buildSavedPayload>,
  plannedKm: number,
  plannedMin: number,
  plannedRepeats: number,
): CompletionFormState {
  const outcome = savedPayload.outcome;

  return {
    outcome,
    actualKm:
      savedPayload.actualDistanceKm != null
        ? savedPayload.actualDistanceKm.toString()
        : outcome === "skipped"
          ? ""
          : plannedKm.toString(),
    actualMin:
      savedPayload.actualDurationMin != null
        ? savedPayload.actualDurationMin.toString()
        : outcome === "skipped"
          ? ""
          : plannedMin.toString(),
    rpe: savedPayload.rpe ?? 6,
    notes: savedPayload.notes ?? "",
    intervalsCompleted:
      savedPayload.intervalsCompleted ?? (outcome === "skipped" ? 0 : plannedRepeats),
    bodyNotes: savedPayload.bodyNotes.map((bodyNote) => ({
      area: bodyNote.area,
      severity: bodyNote.severity,
      timing: bodyNote.timing,
      sensation: bodyNote.sensation ?? "",
      note: bodyNote.note ?? "",
    })),
  };
}

function buildSavedPayload(
  workoutId: string,
  log: {
    outcome: Workout["log"] extends infer T
      ? T extends { outcome: infer O | null | undefined }
        ? O | null
        : null
      : null;
    actualDistanceKm: number | null;
    actualDurationMin: number | null;
    rpe: number | null;
    notes: string | null;
    intervalsCompleted: number | null;
    bodyNotes: BodyNote[];
  },
) {
  return {
    plannedWorkoutId: workoutId,
    outcome: log.outcome ?? "completed",
    actualDistanceKm: log.actualDistanceKm,
    actualDurationMin: log.actualDurationMin,
    rpe: log.rpe,
    notes: log.notes,
    intervalsCompleted: log.intervalsCompleted,
    bodyNotes: log.bodyNotes,
  };
}

function buildSavePayload(workout: Workout, form: CompletionFormState) {
  return {
    plannedWorkoutId: workout.id,
    outcome: form.outcome,
    actualDistanceKm: form.outcome === "skipped" ? null : parseNumberInput(form.actualKm),
    actualDurationMin: form.outcome === "skipped" ? null : parseNumberInput(form.actualMin),
    rpe: form.outcome === "skipped" ? null : form.rpe,
    notes: form.notes.trim() || null,
    intervalsCompleted:
      form.outcome === "skipped" || !workout.steps.some((step) => step.repeats)
        ? null
        : form.intervalsCompleted,
    bodyNotes:
      form.outcome === "skipped"
        ? []
        : form.bodyNotes.map((bodyNote) => ({
            area: bodyNote.area,
            severity: bodyNote.severity,
            timing: bodyNote.timing,
            sensation: bodyNote.sensation || null,
            note: bodyNote.note.trim() || null,
          })),
  };
}

function serializePayload(payload: ReturnType<typeof buildSavePayload>) {
  return JSON.stringify(payload);
}

function parseNumberInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function FeedbackUploadSummary({
  summary,
}: {
  summary: ReturnType<typeof getFeedbackUploadSummary>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="hito-label">{summary.label}</p>
        {summary.pill ? (
          <span className="hito-status-pill" data-tone={summary.pill.tone}>
            {summary.pill.label}
          </span>
        ) : null}
      </div>
      <p className="hito-body">{summary.body}</p>
      {summary.detailLine ? <p className="hito-caption">{summary.detailLine}</p> : null}
    </div>
  );
}

function AttachedEvidenceReadback({
  asset,
  actualMetrics,
  summary,
  isRemoving,
  onRemove,
}: {
  asset: NonNullable<WorkoutResultFeedbackSummary>["latestAsset"];
  actualMetrics: NonNullable<WorkoutResultFeedbackSummary>["latestActualMetrics"] | null;
  summary: ReturnType<typeof getFeedbackUploadSummary>;
  isRemoving: boolean;
  onRemove: () => Promise<void>;
}) {
  const metadata = [
    asset.assetKind === "garmin_zip" ? "Garmin ZIP" : "Garmin FIT",
    `Added ${formatLoggedAt(asset.createdAt)}`,
    actualMetrics?.activityLocalDate ? `Run date ${actualMetrics.activityLocalDate}` : null,
  ].filter(Boolean);

  return (
    <div className="group rounded-xl bg-background/16 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="hito-label">Attached file</div>
          <p className="hito-list-row-title mt-2">{asset.originalFileName}</p>
          <p className="hito-caption mt-2">{metadata.join(" · ")}</p>
          {asset.primaryFileName && asset.primaryFileName !== asset.originalFileName ? (
            <p className="hito-caption mt-1">Extracted activity: {asset.primaryFileName}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            void onRemove();
          }}
          disabled={isRemoving}
          className="hito-button hito-button-secondary hito-button-md shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100"
        >
          <Icon name="trash" size="sm" />
          {isRemoving ? "Removing..." : "Remove file"}
        </button>
      </div>

      <div className="mt-4 border-t border-hairline pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="hito-list-row-title">{summary.label}</p>
        </div>
        <p className="hito-body mt-2">{summary.body}</p>
        {summary.detailLine ? <p className="hito-caption mt-2">{summary.detailLine}</p> : null}
      </div>
    </div>
  );
}

function getFeedbackUploadSummary({
  canUploadResult,
  isUploading,
  uploadError,
  feedback,
}: {
  canUploadResult: boolean;
  isUploading: boolean;
  uploadError: string | null;
  feedback: WorkoutResultFeedbackSummary | null;
}) {
  const latestAsset = feedback?.latestAsset;
  const latestActualMetrics = feedback?.latestActualMetrics;
  const latestComparison = feedback?.latestComparison;
  const latestAiInsight = feedback?.latestAiInsight;
  const assetLabel = latestAsset
    ? latestAsset.assetKind === "garmin_zip"
      ? "Garmin ZIP"
      : "Garmin FIT"
    : "Garmin file";
  const actualSnapshot = describeActualSnapshot(feedback);

  if (!canUploadResult) {
    return {
      label: "Sign in to use Garmin upload",
      body: "FIT and ZIP upload only work on saved workouts.",
      detailLine: "Upload is not available in preview mode.",
      pill: {
        label: "Saved mode only",
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  if (isUploading) {
    return {
      label: "Processing your run",
      body: "Your Garmin file is uploading now.",
      detailLine: "Upload in progress · comparison not ready yet.",
      pill: {
        label: "Working",
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  if (uploadError || latestAsset?.parseStatus === "failed") {
    return {
      label: "We could not read that run yet",
      body:
        uploadError ??
        latestAsset?.parseError ??
        "The last Garmin file did not finish processing. Your manual workout log is unchanged.",
      detailLine: latestAsset
        ? `${assetLabel} attached · comparison not ready · next step not ready.`
        : "Try another Garmin FIT or ZIP file.",
      pill: {
        label: "Retry",
        tone: "signal" as const,
      },
      tone: "destructive" as const,
    };
  }

  if (latestAiInsight && latestComparison && latestActualMetrics) {
    return {
      label: "Your run is ready to review",
      body: "The comparison is ready, and the next-step note is available.",
      detailLine: actualSnapshot
        ? `${actualSnapshot} · comparison ready · next step ready.`
        : `${assetLabel} processed · comparison ready · next step ready.`,
      pill: {
        label: "Ready",
        tone: "success" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestComparison && latestActualMetrics) {
    return {
      label: "Your run is ready to compare",
      body: "The comparison is ready below.",
      detailLine: actualSnapshot
        ? `${actualSnapshot} · comparison ready · next step not ready yet.`
        : `${assetLabel} processed · comparison ready.`,
      pill: {
        label: "Comparison ready",
        tone: "success" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestActualMetrics) {
    return {
      label: "Your run was processed",
      body: "The run summary is ready. The comparison is not ready yet.",
      detailLine: actualSnapshot
        ? `${actualSnapshot} · comparison not ready yet.`
        : `${assetLabel} processed · comparison not ready yet.`,
      pill: {
        label: "Run summary ready",
        tone: "signal" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestAsset) {
    return {
      label: "Your Garmin file is attached",
      body: "The file is here, but the run summary is not ready yet.",
      detailLine: `${assetLabel} attached · run summary not ready yet.`,
      pill: {
        label: "Attached",
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  return {
    label: "No Garmin file yet",
    body: "Upload is optional. Add a FIT or ZIP file here to compare the run with the plan.",
    detailLine: "No file attached yet.",
    pill: null,
    tone: "default" as const,
  };
}

function describeActualSnapshot(feedback: WorkoutResultFeedbackSummary | null) {
  const actual = feedback?.latestActualMetrics;
  const asset = feedback?.latestAsset;

  if (!actual || !asset) {
    return null;
  }

  const details = [
    asset.assetKind === "garmin_zip" ? "Garmin ZIP" : "Garmin FIT",
    actual.actualDistanceKm != null ? `${actual.actualDistanceKm.toFixed(2)} km` : null,
    actual.actualDurationMin != null ? formatDurationMin(actual.actualDurationMin) : null,
    actual.actualIntervalCount != null ? `${actual.actualIntervalCount} structured steps` : null,
    actual.activityLocalDate ?? null,
  ].filter(Boolean);

  return details.join(" · ");
}

function getFeedbackInviteState(
  snapshot: TrainingSnapshot,
  feedback: WorkoutResultFeedbackSummary | null,
) {
  if (snapshot.source !== "persisted") {
    return {
      label: "Garmin review opens after sign-in",
      body: "Saved workouts can use Feedback for Garmin FIT or ZIP review.",
      cta: "Open Feedback",
      pill: {
        label: "Saved mode only",
        tone: "signal" as const,
      },
    };
  }

  const hasFeedbackReady =
    feedback?.marker?.state === "feedback_ready" ||
    Boolean(feedback?.latestComparison) ||
    Boolean(feedback?.latestAiInsight);
  const hasEvidenceAttached =
    feedback?.marker?.state === "evidence_attached" || Boolean(feedback?.latestAsset);
  const parseFailed = feedback?.latestAsset?.parseStatus === "failed";

  if (hasFeedbackReady) {
    return {
      label: "Garmin feedback is ready",
      body: "Review the plan-vs-run comparison and short next-step note.",
      cta: "Review Feedback",
      pill: {
        label: "Ready",
        tone: "success" as const,
      },
    };
  }

  if (parseFailed) {
    return {
      label: "Garmin upload needs attention",
      body: "Check the upload result in Feedback. Your manual result stays separate.",
      cta: "Open Feedback",
      pill: {
        label: "Retry",
        tone: "signal" as const,
      },
    };
  }

  if (hasEvidenceAttached) {
    return {
      label: "Garmin file is attached",
      body: "Continue in Feedback to review the attached run file.",
      cta: "Continue in Feedback",
      pill: {
        label: "In progress",
        tone: "signal" as const,
      },
    };
  }

  return {
    label: "Add a Garmin file for deeper review",
    body: "Optional: compare the planned workout with the actual run in Feedback.",
    cta: "Add Garmin file",
    pill: null,
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="hito-form-label">{children}</div>;
}

function NumField({
  label,
  suffix,
  planned,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  planned: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="hito-surface-flat p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="hito-form-label">{label}</span>
        <span className="hito-caption font-mono-num">plan {planned}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="hito-panel-title w-full bg-transparent focus:outline-none"
        />
        <span className="hito-caption">{suffix}</span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="hito-label flex items-center justify-between">
        <span>{label}</span>
        <span className="text-foreground/80">{hint}</span>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: max }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index + 1)}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              index < value ? "bg-foreground" : "bg-hairline",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function formatLoggedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
