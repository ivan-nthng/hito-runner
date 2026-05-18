import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BODY_NOTE_AREAS,
  BODY_NOTE_AREA_REGIONS,
  BODY_NOTE_SENSATIONS,
  BODY_NOTE_TIMINGS,
  getBodyNoteAreaRegion,
  type BodyNote,
  type BodyNoteArea,
  type BodyNoteAreaRegion,
  type BodyNoteMapSide,
  type BodyNoteSensation,
  type BodyNoteTiming,
} from "@/lib/body-notes";
import { cn } from "@/lib/utils";
import { saveWorkoutLog } from "@/lib/training-api";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import {
  WEEK_STATUS_META,
  formatDurationMin,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";
import type {
  WorkoutAiInsightSummary,
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonSegmentGroup,
  WorkoutComparisonSupportItem,
  WorkoutComparisonSignal,
  WorkoutComparisonSummary,
  WorkoutResultFeedbackSummary,
} from "@/lib/workout-result-import/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon, type HitoIconName } from "@/components/ui/icon";

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
type SupportReadback = {
  compared: string[];
  unavailable: string[];
  unsupported: string[];
};

type BodyNoteDraft = {
  area: BodyNoteArea;
  severity: BodyNote["severity"];
  timing: BodyNoteTiming;
  sensation: BodyNoteSensation | "";
  note: string;
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
  }, [savedPayloadKey, syncedFormState]);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [
    form.actualKm,
    form.actualMin,
    form.bodyNotes,
    form.intervalsCompleted,
    form.notes,
    form.outcome,
    form.rpe,
  ]);

  useEffect(() => {
    if (!bodyNotesModalOpen) {
      return;
    }

    if (form.outcome === "skipped") {
      setBodyNotesModalOpen(false);
      setBodyNotesDraft(cloneBodyNoteDrafts(formRef.current.bodyNotes));
    }
  }, [bodyNotesModalOpen, form.outcome]);

  const currentPayload = buildSavePayload(workout, form);
  const currentPayloadKey = useMemo(() => serializePayload(currentPayload), [currentPayload]);
  const isDirty = currentPayloadKey !== savedBaselineKey;
  const outcome = form.outcome;
  const weekStatus = WEEK_STATUS_META[snapshot.weekStatus];
  const isSkipped = outcome === "skipped";
  const saveButtonLabel =
    snapshot.source !== "persisted"
      ? "Preview result"
      : isSaving
        ? "Saving result..."
        : hasSavedLog && !isDirty
          ? "Saved result"
          : hasSavedLog
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
              : hasSavedLog && isDirty
                ? "Unsaved changes"
                : message
                  ? "Saved"
                  : snapshot.source === "persisted"
                    ? hasSavedLog
                      ? "Saved result"
                      : "Ready to save"
                    : "Preview only"}
        </div>
        <p className="hito-body mt-2">
          {isSaving
            ? `Saving your ${outcome} result now.`
            : error
              ? error
              : hasSavedLog && isDirty
                ? `You changed this ${outcome} result. Save to update the workout and this week's status.`
                : message
                  ? message
                  : snapshot.source === "persisted"
                    ? hasSavedLog
                      ? `This workout already has a saved ${workout.log?.outcome} result. ${
                          workout.log?.loggedAt
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
              ? hasSavedLog && isDirty
                ? "Changes not saved"
                : hasSavedLog
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
                        "flex-1 h-8 rounded border text-[10px] font-mono-num",
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
              await router.invalidate();
              setMessage(`Saved as ${nextPayload.outcome}. This page now shows the latest result.`);
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "Could not save log.");
            } finally {
              setIsSaving(false);
            }
          }}
          className="hito-button hito-button-primary hito-button-lg"
          disabled={isSaving || (hasSavedLog && !isDirty)}
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
              <div className="rounded-[1.75rem] border border-white/8 bg-background/[0.18] px-6 py-8 sm:px-8 sm:py-10">
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-background/30">
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

function createEmptyBodyNoteDraft(): BodyNoteDraft {
  return {
    area: BODY_NOTE_AREA_REGIONS[0]?.area ?? BODY_NOTE_AREAS[0],
    severity: 2,
    timing: "after",
    sensation: "",
    note: "",
  };
}

function cloneBodyNoteDrafts(bodyNotes: BodyNoteDraft[]) {
  return bodyNotes.map((bodyNote) => ({ ...bodyNote }));
}

function updateBodyNoteDraftList(
  bodyNotes: BodyNoteDraft[],
  index: number,
  patch: Partial<BodyNoteDraft>,
) {
  return bodyNotes.map((bodyNote, bodyNoteIndex) =>
    bodyNoteIndex === index ? { ...bodyNote, ...patch } : bodyNote,
  );
}

function BodyNotesSummaryRow({
  bodyNotes,
  onOpen,
}: {
  bodyNotes: BodyNoteDraft[];
  onOpen: () => void;
}) {
  const hasBodyNotes = bodyNotes.length > 0;

  return (
    <div className="border-t border-hairline pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label>Body notes</Label>
          <p className="hito-support-copy mt-2">
            Add any pain, tightness, or discomfort that showed up during or after this run.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="hito-button hito-button-secondary hito-button-sm"
        >
          <Icon name="plus" size="sm" />
          {hasBodyNotes ? "Edit body notes" : "Add body note"}
        </button>
      </div>

      {!hasBodyNotes ? (
        <div className="hito-surface-flat mt-4 p-4">
          <p className="hito-body">
            No body notes saved with this workout result. Leave this empty when the run felt normal.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {bodyNotes.map((bodyNote, index) => (
            <div
              key={`${bodyNote.area}-${bodyNote.timing}-${index}`}
              className="hito-surface-flat flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="hito-list-row-title">{bodyNote.area}</p>
                <p className="hito-body-small mt-1">{describeBodyNoteDraft(bodyNote)}</p>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBars severity={bodyNote.severity} />
                <span className="hito-caption font-mono-num">{bodyNote.severity}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BodyNotesModal({
  open,
  bodyNotes,
  onOpenChange,
  onChange,
  onSave,
}: {
  open: boolean;
  bodyNotes: BodyNoteDraft[];
  onOpenChange: (open: boolean) => void;
  onChange: (bodyNotes: BodyNoteDraft[]) => void;
  onSave: () => void;
}) {
  const canAddMore = bodyNotes.length < 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="hito-dialog-overlay-stable"
        className="hito-dialog-stable hito-product-dialog h-[min(46rem,calc(100dvh-2rem))] max-w-3xl border-hairline bg-background/95 p-0 backdrop-blur-xl"
      >
        <DialogHeader className="hito-product-dialog-header">
          <DialogTitle className="hito-modal-title">Body notes</DialogTitle>
          <DialogDescription className="hito-body max-w-2xl">
            These notes stay attached to this workout result only. Use them to mark where the run
            felt off without turning the result into a second full form.
          </DialogDescription>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="hito-caption">
              {bodyNotes.length === 0
                ? "No body notes yet."
                : `${bodyNotes.length} body note${bodyNotes.length === 1 ? "" : "s"} in this workout result.`}
            </p>
            {canAddMore ? (
              <button
                type="button"
                onClick={() => onChange([...bodyNotes, createEmptyBodyNoteDraft()])}
                className="hito-button hito-button-secondary hito-button-sm"
              >
                <Icon name="plus" size="sm" />
                Add note
              </button>
            ) : null}
          </div>

          {bodyNotes.length === 0 ? (
            <div className="hito-surface-flat mt-5 p-5">
              <p className="hito-body">
                No body notes will be saved with this workout unless you add one here.
              </p>
              <button
                type="button"
                onClick={() => onChange([createEmptyBodyNoteDraft()])}
                className="hito-button hito-button-secondary hito-button-sm mt-4"
              >
                <Icon name="plus" size="sm" />
                Add body note
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {bodyNotes.map((bodyNote, index) => (
                <BodyNoteEditorCard
                  key={`${bodyNote.area}-${bodyNote.timing}-${index}`}
                  bodyNote={bodyNote}
                  index={index}
                  onChange={(patch) => onChange(updateBodyNoteDraftList(bodyNotes, index, patch))}
                  onRemove={() => onChange(bodyNotes.filter((_, noteIndex) => noteIndex !== index))}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="hito-caption">
              Saved fields stay bounded to area, timing, sensation, severity, and an optional note.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="hito-button hito-button-ghost hito-button-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="hito-button hito-button-primary hito-button-md"
              >
                Save body notes
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BodyNoteEditorCard({
  bodyNote,
  index,
  onChange,
  onRemove,
}: {
  bodyNote: BodyNoteDraft;
  index: number;
  onChange: (patch: Partial<BodyNoteDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="hito-surface-flat space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hito-label">Body note {index + 1}</p>
          <p className="hito-caption mt-1">{bodyNote.area}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="hito-button hito-button-ghost hito-button-xs"
        >
          <Icon name="trash" size="xs" />
          Remove
        </button>
      </div>

      <BodyAreaMapField value={bodyNote.area} onChange={(value) => onChange({ area: value })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <NoteSelectField
          label="When"
          value={bodyNote.timing}
          onChange={(value) => onChange({ timing: value as BodyNoteTiming })}
          options={BODY_NOTE_TIMINGS.map((timing) => ({
            value: timing,
            label: timing === "during" ? "During the run" : "After the run",
          }))}
        />
        <NoteSelectField
          label="Sensation"
          value={bodyNote.sensation}
          onChange={(value) => onChange({ sensation: value as BodyNoteSensation | "" })}
          options={[
            { value: "", label: "Choose one" },
            ...BODY_NOTE_SENSATIONS.map((sensation) => ({
              value: sensation,
              label: sensation,
            })),
          ]}
        />
      </div>

      <div>
        <Label>Severity</Label>
        <div className="mt-3 hito-scale-control">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ severity: level as BodyNote["severity"] })}
              data-active={level <= bodyNote.severity ? "true" : undefined}
              data-level={level}
              className="hito-scale-button"
            >
              {level}
            </button>
          ))}
        </div>
        <p className="hito-field-helper mt-2">1 is light discomfort. 5 is the strongest note.</p>
      </div>

      <div>
        <Label>Detail</Label>
        <textarea
          rows={3}
          value={bodyNote.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder="What did you feel, and when did it show up?"
          className="hito-field hito-textarea-md mt-3 min-h-24 resize-none"
        />
      </div>
    </div>
  );
}

function BodyAreaMapField({
  value,
  onChange,
}: {
  value: BodyNoteArea;
  onChange: (value: BodyNoteArea) => void;
}) {
  const [view, setView] = useState<BodyNoteMapSide>(
    () => getBodyNoteAreaRegion(value)?.side ?? "front",
  );
  const selectedRegion = getBodyNoteAreaRegion(value);
  const visibleRegions = BODY_NOTE_AREA_REGIONS.filter((region) => region.side === view);

  useEffect(() => {
    const nextView = getBodyNoteAreaRegion(value)?.side;

    if (nextView) {
      setView(nextView);
    }
  }, [value]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="hito-surface-flat p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Body location</Label>
            <p className="hito-support-copy mt-2">
              Pick one bounded area for this note. Add another note if more than one spot felt off.
            </p>
          </div>
          <div className="hito-tab-list">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setView(side)}
                data-active={view === side}
                className="hito-tab capitalize"
              >
                {side}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <svg viewBox="0 0 200 500" className="h-[260px] w-auto max-w-full">
            <BodyMapSilhouette />
            {visibleRegions.map((region) => (
              <BodyMapPoint
                key={region.area}
                region={region}
                selected={region.area === value}
                onSelect={onChange}
              />
            ))}
          </svg>
        </div>

        <p className="hito-support-copy mt-4 text-center">
          {selectedRegion ? `${selectedRegion.area} selected` : "Choose one area for this note."}
        </p>
      </div>

      <div className="space-y-2">
        {visibleRegions.map((region) => (
          <button
            key={region.area}
            type="button"
            onClick={() => onChange(region.area)}
            className={cn(
              "hito-surface-flat flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors",
              region.area === value ? "border-signal/35 bg-accent/35" : "hover:bg-accent/25",
            )}
          >
            <span className="hito-list-row-title">{region.area}</span>
            {region.area === value ? (
              <span className="hito-caption text-signal">Selected</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function BodyMapPoint({
  region,
  selected,
  onSelect,
}: {
  region: BodyNoteAreaRegion;
  selected: boolean;
  onSelect: (value: BodyNoteArea) => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={region.area}
      onClick={() => onSelect(region.area)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(region.area);
        }
      }}
      className="cursor-pointer"
    >
      <circle
        cx={region.x}
        cy={region.y}
        r={selected ? 10 : 6}
        fill={
          selected
            ? "color-mix(in oklch, var(--signal) 28%, transparent)"
            : "color-mix(in oklch, var(--color-background) 34%, transparent)"
        }
        stroke={selected ? "var(--signal)" : "var(--muted-foreground)"}
        strokeWidth={selected ? 1.75 : 1}
        className="transition-all"
      />
    </g>
  );
}

function BodyMapSilhouette() {
  return (
    <g fill="none" stroke="var(--hairline)" strokeWidth="1">
      <circle cx="100" cy="35" r="20" />
      <line x1="92" y1="55" x2="92" y2="65" />
      <line x1="108" y1="55" x2="108" y2="65" />
      <path d="M 65 75 Q 60 110 65 160 L 75 220 L 125 220 L 135 160 Q 140 110 135 75 Q 120 65 100 65 Q 80 65 65 75 Z" />
      <path d="M 65 75 Q 50 130 48 200 L 55 240" />
      <path d="M 135 75 Q 150 130 152 200 L 145 240" />
      <circle cx="55" cy="248" r="6" />
      <circle cx="145" cy="248" r="6" />
      <path d="M 75 220 L 75 320 L 80 420 L 85 470" />
      <path d="M 95 220 L 92 320 L 88 420 L 88 470" />
      <path d="M 105 220 L 108 320 L 112 420 L 112 470" />
      <path d="M 125 220 L 125 320 L 120 420 L 115 470" />
      <ellipse cx="84" cy="478" rx="9" ry="5" />
      <ellipse cx="116" cy="478" rx="9" ry="5" />
      <line x1="78" y1="320" x2="93" y2="320" />
      <line x1="107" y1="320" x2="122" y2="320" />
    </g>
  );
}

function NoteSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="hito-form-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="hito-field hito-input-md mt-2"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SeverityBars({ severity }: { severity: BodyNote["severity"] }) {
  return (
    <div className="hito-severity-bars" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className="hito-severity-bar"
          data-active={level <= severity}
          data-level={level}
        />
      ))}
    </div>
  );
}

function describeBodyNoteDraft(bodyNote: BodyNoteDraft) {
  const parts = [
    bodyNote.timing === "during" ? "During the run" : "After the run",
    bodyNote.sensation || "No sensation selected",
  ];

  if (bodyNote.note.trim()) {
    parts.push(bodyNote.note.trim());
  }

  return parts.join(" · ");
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

function DeterministicComparisonReadback({ comparison }: { comparison: WorkoutComparisonSummary }) {
  const payload = getComparisonPayload(comparison);
  const confidencePct = Math.round(comparison.comparisonConfidence * 100);
  const signals = getComparisonSignals(comparison);
  const comparedSignalCount = payload?.summary.comparedSignalCount ?? signals.length;
  const signalSummary = payload?.summary;
  const sessionItems = buildSessionSummaryItems(payload);
  const supportReadback = buildSupportReadback(payload);
  const segmentGroups = buildSegmentSummaryItems(payload);
  const stepSummary = describeStepSummary(comparison);
  const technicalNotes = buildComparisonTechnicalNotes(signals, stepSummary);

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-xl bg-background/16 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-hairline">
        <ComparisonMetaItem
          label="Evidence"
          value={humanizeComparisonStatus(comparison.comparisonStatus)}
        />
        <ComparisonMetaItem
          label="Confidence"
          value={`${confidencePct}%`}
          helpText="Confidence reflects how complete and internally consistent the factual comparison is."
        />
        <ComparisonMetaItem
          label="Checks"
          value={`${comparedSignalCount} of ${signals.length}`}
          helpText="Checks count how many planned-vs-run comparisons were available for this workout."
        />
      </div>

      {sessionItems.length > 0 && (
        <div className="border-t border-hairline pt-4">
          <p className="hito-list-row-title">Run summary</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sessionItems.map((item) => (
              <div key={item.label} title={item.helpText}>
                <p className="hito-caption">{item.label}</p>
                <p
                  className={cn(
                    "hito-technical-mono mt-1",
                    item.tone === "success" && "text-success",
                    item.tone === "warning" && "text-warn",
                    item.tone === "destructive" && "text-destructive",
                  )}
                >
                  {item.direction === "up" ? "↑ " : item.direction === "down" ? "↓ " : ""}
                  {item.value}
                </p>
                {item.support ? <p className="hito-body-small mt-1">{item.support}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {signalSummary && (
        <p className="hito-caption mt-3">
          Checks: {signalSummary.matchedSignals} matched, {signalSummary.partialSignals} partial,{" "}
          {signalSummary.mismatchSignals} off plan, {signalSummary.missingActualSignals} missing
          actual, {signalSummary.notApplicableSignals} not comparable.
        </p>
      )}

      {supportReadback && <ComparisonSupportReadback readback={supportReadback} />}

      {segmentGroups.length > 0 && <SegmentSummaryReadback groups={segmentGroups} />}

      <div className="divide-y divide-hairline">
        {signals.map((signal) => (
          <SignalReadbackRow key={signal.key} signal={signal} />
        ))}
      </div>

      {technicalNotes.length > 0 ? (
        <details className="border-t border-hairline pt-4">
          <summary className="hito-label cursor-pointer list-none">Comparison notes</summary>
          <div className="mt-3 space-y-2">
            {technicalNotes.map((note) => (
              <p key={note} className="hito-body-small">
                {note}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function WorkoutAiInsightReadback({
  insight,
  comparison,
}: {
  insight: WorkoutAiInsightSummary;
  comparison?: WorkoutComparisonSummary | null;
}) {
  const matchedPrimaryVerdict = hasPrimaryMatchedVerdict(comparison);
  const recommendationLabel = humanizeAiRecommendationLevelWithContext(
    insight.recommendationLevel,
    {
      matchedPrimaryVerdict,
    },
  );
  const recommendationTone = toneForAiRecommendation(insight, {
    matchedPrimaryVerdict,
  });
  const analysisLabel = matchedPrimaryVerdict ? "Why it still helps" : "What stood out";
  const differenceLabel = matchedPrimaryVerdict
    ? "Small difference note"
    : "Why this is less certain";
  const recommendationSectionLabel = matchedPrimaryVerdict ? "Next workout" : "Suggested next step";
  const supportCopy = matchedPrimaryVerdict
    ? "Use this as extra context on top of the factual comparison above."
    : "Use this as a careful read of the facts above when some checks are mixed or incomplete.";
  const recommendationSupport = matchedPrimaryVerdict
    ? "This stays secondary to the factual plan-vs-run section above."
    : "This stays conservative and does not change your saved plan by itself.";
  const cautionSummary =
    insight.cautionFlags.length > 0 && !matchedPrimaryVerdict
      ? summarizeAiCautionFlags(insight.cautionFlags)
      : null;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="hito-status-pill" data-tone={recommendationTone}>
          {recommendationLabel}
        </span>
        <span className="hito-caption">{formatLoggedAt(insight.createdAt)}</span>
      </div>

      <p className="hito-caption">{supportCopy}</p>

      <div className="rounded-xl bg-background/18 px-4 py-4">
        <p className="hito-label">{recommendationSectionLabel}</p>
        <p className="hito-body mt-2">{insight.nextWorkoutRecommendation}</p>
        <p className="hito-caption mt-3">{recommendationSupport}</p>
      </div>

      <AiInsightSection label={analysisLabel} body={insight.analysisSummary} />

      {matchedPrimaryVerdict ? (
        <AiInsightSection label={differenceLabel} body={insight.differenceExplanation} />
      ) : (
        <details className="border-t border-hairline pt-4">
          <summary className="hito-label cursor-pointer list-none">{differenceLabel}</summary>
          <div className="mt-3 space-y-3">
            <p className="hito-body-small">{insight.differenceExplanation}</p>
            {cautionSummary ? (
              <div className="rounded-lg bg-background/18 px-3 py-2">
                <p className="hito-label">Use with care</p>
                <p className="hito-body-small mt-2">{cautionSummary}</p>
              </div>
            ) : null}
          </div>
        </details>
      )}
    </div>
  );
}

function AiInsightSection({ label, body }: { label: string; body: string }) {
  return (
    <div className="pt-1">
      <p className="hito-list-row-title">{label}</p>
      <p className="hito-body-small mt-1">{body}</p>
    </div>
  );
}

function ComparisonMetaItem({
  label,
  value,
  helpText,
}: {
  label: string;
  value: string;
  helpText?: string;
}) {
  return (
    <div className="px-4 py-3" title={helpText}>
      <p className="hito-technical-mono">{value}</p>
      <p className="hito-caption mt-1">{label}</p>
    </div>
  );
}

function ComparisonSupportReadback({ readback }: { readback: SupportReadback }) {
  return (
    <div className="border-t border-hairline pt-4">
      <p className="hito-list-row-title">What this review checked</p>
      <p className="hito-body-small mt-1 max-w-2xl">
        This section explains which parts of the plan-vs-run check are supported by the uploaded
        Garmin file today.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {readback.compared.length > 0 ? (
          <SupportReadbackGroup title="Compared now" items={readback.compared} tone="success" />
        ) : null}
        {readback.unavailable.length > 0 ? (
          <SupportReadbackGroup
            title="Not available in this upload"
            items={readback.unavailable}
            tone="signal"
          />
        ) : null}
      </div>

      {readback.unsupported.length > 0 ? (
        <p className="hito-body-small mt-3">
          Not part of this review yet: {formatInlineList(readback.unsupported)}.
        </p>
      ) : null}
    </div>
  );
}

function SupportReadbackGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "signal";
}) {
  return (
    <div>
      <p className="hito-caption">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="hito-status-pill" data-tone={tone}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SegmentSummaryReadback({ groups }: { groups: WorkoutComparisonSegmentGroup[] }) {
  return (
    <div className="border-t border-hairline pt-4">
      <div className="max-w-2xl">
        <p className="hito-list-row-title">Workout structure</p>
        <p className="hito-body-small mt-1">
          Grouped from the aligned workout steps, when warm-up, main work, recovery, or cooldown can
          be compared honestly.
        </p>
      </div>
      <div className="mt-3 divide-y divide-hairline">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div>
              <p className="hito-list-row-title">{humanizeSegmentGroupLabel(group)}</p>
              <p className="hito-body-small mt-1">{describeSegmentGroup(group)}</p>
            </div>
            <span className="hito-status-pill" data-tone={toneForSignal(group.status)}>
              {humanizeSignalStatus(group.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalReadbackRow({ signal }: { signal: WorkoutComparisonSignal }) {
  const valueLine = describeComparisonSignal(signal);

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="hito-list-row-title">{humanizeSignalLabel(signal.label, signal.key)}</p>
        <span className="hito-status-pill" data-tone={toneForSignal(signal.status)}>
          {humanizeSignalStatus(signal.status)}
        </span>
      </div>
      {valueLine && <p className="hito-body-small mt-1">{valueLine}</p>}
    </div>
  );
}

function describeComparisonSignal(signal: WorkoutComparisonSignal) {
  if (signal.status === "not_applicable") {
    return "This check could not be compared.";
  }

  if (signal.status === "missing_actual") {
    return "Actual data is still missing for this check.";
  }

  const plannedValue = formatComparisonValue(signal.plannedValue, signal.unit);
  const actualValue = formatComparisonValue(signal.actualValue, signal.unit);
  const details = [`plan ${plannedValue}`, `actual ${actualValue}`];
  const delta = formatSignalDelta(signal);
  const tolerance = formatSignalTolerance(signal);

  if (delta) {
    details.push(delta);
  }

  if (tolerance) {
    details.push(tolerance);
  }

  return details.join(" · ");
}

function describeStepSummary(comparison: WorkoutComparisonSummary) {
  const payload = getComparisonPayload(comparison);
  const stepSummary = payload?.stepSummary;

  if (!stepSummary) {
    return null;
  }

  if (stepSummary.status === "not_applicable") {
    return stepSummary.reason ?? "Per-step comparison is not available for this workout shape yet.";
  }

  const hasAnyOffSteps =
    stepSummary.partialStepCount > 0 ||
    stepSummary.mismatchStepCount > 0 ||
    stepSummary.missingActualStepCount > 0;

  if (!hasAnyOffSteps) {
    return `${stepSummary.comparedStepCount} steps compared · all matched`;
  }

  const parts = [
    `${stepSummary.comparedStepCount} steps compared`,
    `${stepSummary.matchedStepCount} matched`,
  ];

  if (stepSummary.partialStepCount > 0) {
    parts.push(`${stepSummary.partialStepCount} partial`);
  }

  if (stepSummary.mismatchStepCount > 0) {
    parts.push(`${stepSummary.mismatchStepCount} mismatched`);
  }

  if (stepSummary.missingActualStepCount > 0) {
    parts.push(`${stepSummary.missingActualStepCount} missing actual`);
  }

  const firstMismatch = stepSummary.steps.find((step) => step.status !== "matched");
  if (firstMismatch) {
    parts.push(
      `first off step ${firstMismatch.plannedSequence}: ${formatDurationMin(
        firstMismatch.plannedDurationMin,
      )} vs ${formatDurationMin(firstMismatch.actualDurationMin)}`,
    );
  }

  if (stepSummary.reason) {
    parts.push(stepSummary.reason);
  }

  return parts.join(" · ");
}

function buildSupportReadback(
  payload: WorkoutComparisonDifferencePayload | null,
): SupportReadback | null {
  const signals = payload?.supportMatrix?.signals;

  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  const readback: SupportReadback = {
    compared: [],
    unavailable: [],
    unsupported: [],
  };

  signals.forEach((signal) => {
    if (!isSupportItem(signal)) {
      return;
    }

    const label = humanizeSupportSignalLabel(signal);

    if (signal.status === "compared") {
      readback.compared.push(label);
      return;
    }

    if (signal.status === "unsupported") {
      readback.unsupported.push(label);
      return;
    }

    readback.unavailable.push(label);
  });

  return readback.compared.length > 0 ||
    readback.unavailable.length > 0 ||
    readback.unsupported.length > 0
    ? {
        compared: uniqueStrings(readback.compared),
        unavailable: uniqueStrings(readback.unavailable),
        unsupported: uniqueStrings(readback.unsupported),
      }
    : null;
}

function isSupportItem(value: unknown): value is WorkoutComparisonSupportItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.status === "string";
}

function humanizeSupportSignalLabel(signal: WorkoutComparisonSupportItem) {
  switch (signal.key) {
    case "date_alignment":
      return "workout day";
    case "duration":
      return "duration";
    case "distance":
      return "distance";
    case "structured_step_count":
      return "step count";
    case "step_duration":
      return "step timing";
    case "segment_group_duration":
      return "workout sections";
    case "pace":
      return "pace";
    case "heart_rate":
      return "heart rate";
    default:
      return signal.label.trim() || signal.key.replace(/_/g, " ");
  }
}

function buildSegmentSummaryItems(
  payload: WorkoutComparisonDifferencePayload | null,
): WorkoutComparisonSegmentGroup[] {
  const segmentSummary = payload?.segmentSummary;

  if (
    !segmentSummary ||
    segmentSummary.status !== "available" ||
    !Array.isArray(segmentSummary.groups)
  ) {
    return [];
  }

  return segmentSummary.groups.filter(isUsefulSegmentGroup);
}

function isUsefulSegmentGroup(group: WorkoutComparisonSegmentGroup) {
  return (
    group.plannedStepCount > 0 ||
    group.actualStepCount > 0 ||
    group.plannedDurationMin != null ||
    group.actualDurationMin != null ||
    group.plannedDistanceKm != null ||
    group.actualDistanceKm != null
  );
}

function humanizeSegmentGroupLabel(group: WorkoutComparisonSegmentGroup) {
  switch (group.key) {
    case "warmup":
      return "Warm-up";
    case "main":
      return "Main work";
    case "cooldown":
      return "Cooldown";
    case "recovery":
      return "Recovery";
    default:
      return group.label || "Other";
  }
}

function describeSegmentGroup(group: WorkoutComparisonSegmentGroup) {
  const parts: string[] = [];

  parts.push(`${group.plannedStepCount} planned step${group.plannedStepCount === 1 ? "" : "s"}`);
  parts.push(`${group.actualStepCount} actual step${group.actualStepCount === 1 ? "" : "s"}`);

  if (group.plannedDurationMin != null || group.actualDurationMin != null) {
    const durationLine = [
      `plan ${formatDurationMin(group.plannedDurationMin)}`,
      `actual ${formatDurationMin(group.actualDurationMin)}`,
    ];
    const delta = formatSegmentDurationDelta(group.durationDeltaMin, group.durationDeltaPct);

    if (delta) {
      durationLine.push(delta);
    }

    parts.push(durationLine.join(" · "));
  }

  if (group.plannedDistanceKm != null || group.actualDistanceKm != null) {
    const distanceLine = [
      `plan ${formatSegmentDistance(group.plannedDistanceKm)}`,
      `actual ${formatSegmentDistance(group.actualDistanceKm)}`,
    ];
    const delta = formatSegmentDistanceDelta(group.distanceDeltaKm);

    if (delta) {
      distanceLine.push(delta);
    }

    parts.push(distanceLine.join(" · "));
  }

  if (group.reason && group.status !== "matched") {
    parts.push(group.reason);
  }

  return parts.join(" · ");
}

function formatSegmentDurationDelta(deltaMin: number | null, deltaPct: number | null) {
  if (deltaMin == null) {
    return null;
  }

  if (deltaMin === 0) {
    return "on target";
  }

  const direction = deltaMin > 0 ? "longer" : "shorter";
  const pct = deltaPct != null ? `, ${Math.round(Math.abs(deltaPct) * 100)}%` : "";
  return `${Math.abs(deltaMin).toFixed(1)} min ${direction}${pct}`;
}

function formatSegmentDistance(value: number | null) {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(2)} km`;
}

function formatSegmentDistanceDelta(deltaKm: number | null) {
  if (deltaKm == null) {
    return null;
  }

  if (deltaKm === 0) {
    return "on target";
  }

  const direction = deltaKm > 0 ? "longer" : "shorter";
  return `${Math.abs(deltaKm).toFixed(2)} km ${direction}`;
}

function formatInlineList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items));
}

function formatComparisonValue(value: unknown, unit?: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (unit === "km") {
      return `${value.toFixed(2)} km`;
    }

    if (unit === "min") {
      return formatDurationMin(value);
    }

    return String(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "—";
}

function buildSessionSummaryItems(payload: WorkoutComparisonDifferencePayload | null) {
  if (!payload) {
    return [];
  }

  const summary = payload.sessionSummary;
  if (!summary) {
    return [];
  }

  const structuredStepsValue = formatStructuredStepsSummaryValue(payload);
  const durationSignal = payload.facts.duration;
  const distanceSignal = payload.facts.distance;
  const dateSignal = payload.facts.dateAlignment;
  const structuredStepsSignal = payload.facts.structuredStepCount;
  const items = [
    summary.durationDeltaMin != null
      ? {
          label: "Duration",
          ...formatFriendlyDurationDelta(summary.durationDeltaMin, summary.durationDeltaPct),
          direction: directionForDelta(summary.durationDeltaMin),
          tone: toneForSignal(durationSignal.status),
          helpText:
            "How much shorter or longer the uploaded run was compared with the planned workout duration.",
        }
      : null,
    summary.distanceDeltaKm != null
      ? {
          label: "Distance",
          ...formatFriendlyDistanceDelta(summary.distanceDeltaKm, summary.distanceDeltaPct),
          direction: directionForDelta(summary.distanceDeltaKm),
          tone: toneForSignal(distanceSignal.status),
          helpText:
            "How much shorter or longer the uploaded run distance was compared with the planned workout distance.",
        }
      : null,
    summary.dateDeltaDays != null
      ? {
          label: "Workout day",
          ...formatFriendlyDateDelta(summary.dateDeltaDays),
          direction: null,
          tone: toneForSignal(dateSignal.status),
          helpText:
            "Whether the uploaded run happened on the same day as the planned workout or drifted earlier or later.",
        }
      : null,
    structuredStepsValue
      ? {
          label: "Structured steps",
          ...structuredStepsValue,
          direction: null,
          tone: toneForSignal(structuredStepsSignal.status),
          helpText:
            "Whether the workout structure could be compared from the uploaded run, not whether every split was perfect.",
        }
      : null,
  ];

  return items.filter(notNullSessionItem);
}

function formatFriendlyDurationDelta(deltaMin: number, deltaPct: number | null) {
  if (deltaMin === 0) {
    return {
      value: "On target",
      support: null,
    };
  }

  const minutes = `${Math.abs(deltaMin).toFixed(1)} min`;
  const direction = deltaMin > 0 ? "longer" : "shorter";
  return {
    value: minutes,
    support: deltaPct != null ? `${Math.round(deltaPct * 100)}% ${direction}` : direction,
  };
}

function formatFriendlyDistanceDelta(deltaKm: number, deltaPct: number | null) {
  if (deltaKm === 0) {
    return {
      value: "On target",
      support: null,
    };
  }

  const distance = `${Math.abs(deltaKm).toFixed(2)} km`;
  const direction = deltaKm > 0 ? "longer" : "shorter";
  return {
    value: distance,
    support: deltaPct != null ? `${Math.round(deltaPct * 100)}% ${direction}` : direction,
  };
}

function formatFriendlyDateDelta(deltaDays: number) {
  if (deltaDays === 0) {
    return {
      value: "Same day",
      support: null,
    };
  }

  const days = Math.abs(deltaDays);
  return {
    value:
      deltaDays > 0
        ? `${days} day${days === 1 ? "" : "s"} later`
        : `${days} day${days === 1 ? "" : "s"} earlier`,
    support: "Workout day drift",
  };
}

function directionForDelta(delta: number | null) {
  if (delta == null || delta === 0) {
    return null;
  }

  return delta > 0 ? "up" : "down";
}

function formatStructuredStepsSummaryValue(payload: WorkoutComparisonDifferencePayload) {
  const summary = payload.sessionSummary;
  if (!summary) {
    return null;
  }

  const signal = payload.facts.structuredStepCount;

  if (signal.status === "not_applicable") {
    return {
      value: "Not comparable",
      support:
        summary.actualStructuredStepCount != null
          ? `${summary.actualStructuredStepCount} actual`
          : null,
    };
  }

  if (signal.status === "missing_actual") {
    return {
      value: "No actual step data",
      support:
        summary.plannedStructuredStepCount != null
          ? `${summary.plannedStructuredStepCount} planned`
          : null,
    };
  }

  if (summary.plannedStructuredStepCount == null && summary.actualStructuredStepCount == null) {
    return null;
  }

  return {
    value: `${summary.plannedStructuredStepCount ?? "—"} planned`,
    support: `${summary.actualStructuredStepCount ?? "—"} actual`,
  };
}

function formatSignalDelta(signal: WorkoutComparisonSignal) {
  if (typeof signal.delta !== "number" || !Number.isFinite(signal.delta)) {
    return null;
  }

  if (signal.unit === "min") {
    const signed = signal.delta >= 0 ? `+${signal.delta.toFixed(1)}` : signal.delta.toFixed(1);
    return `delta ${signed} min`;
  }

  if (signal.unit === "km") {
    const signed = signal.delta >= 0 ? `+${signal.delta.toFixed(2)}` : signal.delta.toFixed(2);
    return `delta ${signed} km`;
  }

  if (signal.unit === "count") {
    const signed = signal.delta >= 0 ? `+${signal.delta}` : String(signal.delta);
    return `delta ${signed}`;
  }

  if (signal.unit === "date") {
    const signed = signal.delta >= 0 ? `+${signal.delta}` : String(signal.delta);
    return `delta ${signed} days`;
  }

  return null;
}

function formatSignalTolerance(signal: WorkoutComparisonSignal) {
  if (
    typeof signal.matchedTolerancePct !== "number" ||
    !Number.isFinite(signal.matchedTolerancePct) ||
    typeof signal.partialTolerancePct !== "number" ||
    !Number.isFinite(signal.partialTolerancePct)
  ) {
    return null;
  }

  return `match <= ${Math.round(signal.matchedTolerancePct * 100)}%, partial <= ${Math.round(
    signal.partialTolerancePct * 100,
  )}%`;
}

function humanizeSignalStatus(status: WorkoutComparisonSignal["status"]) {
  switch (status) {
    case "matched":
      return "matched";
    case "partial":
      return "partially aligned";
    case "mismatch":
      return "off plan";
    case "missing_actual":
      return "missing actual";
    default:
      return "not applicable";
  }
}

function humanizeSignalLabel(label: string, key: WorkoutComparisonSignal["key"]) {
  if (key === "date_alignment") {
    return "Workout day";
  }

  return label;
}

function humanizeComparisonStatus(status: WorkoutComparisonSummary["comparisonStatus"]) {
  switch (status) {
    case "complete":
      return "Enough";
    case "partial":
      return "Partial";
    default:
      return "Limited";
  }
}

function humanizePrimaryComparisonVerdict(comparison: WorkoutComparisonSummary) {
  if (comparison.completionState === "matched") {
    return "Matched";
  }

  const payload = getComparisonPayload(comparison);
  const summary = payload?.summary;

  if (summary && summary.mismatchSignals > 0 && summary.partialSignals === 0) {
    return "Off plan";
  }

  return "Needs review";
}

function buildComparisonTechnicalNotes(
  signals: WorkoutComparisonSignal[],
  stepSummary: string | null,
) {
  const notes = signals
    .filter((signal) => shouldShowSignalReason(signal))
    .map((signal) => `${humanizeSignalLabel(signal.label, signal.key)}: ${signal.reason}`);

  if (stepSummary) {
    notes.push(`Structured steps: ${stepSummary}`);
  }

  return notes;
}

function humanizeAiRecommendationLevel(level: WorkoutAiInsightSummary["recommendationLevel"]) {
  return humanizeAiRecommendationLevelWithContext(level, { matchedPrimaryVerdict: false });
}

function humanizeAiRecommendationLevelWithContext(
  level: WorkoutAiInsightSummary["recommendationLevel"],
  options: {
    matchedPrimaryVerdict: boolean;
  },
) {
  switch (level) {
    case "keep":
      return "Keep course";
    case "soft_adjust":
      return options.matchedPrimaryVerdict ? "Minor note" : "Small caution";
    default:
      return options.matchedPrimaryVerdict ? "Review note" : "Review carefully";
  }
}

function toneForAiRecommendation(
  insight: WorkoutAiInsightSummary,
  options: {
    matchedPrimaryVerdict: boolean;
  },
) {
  if (options.matchedPrimaryVerdict) {
    switch (insight.recommendationLevel) {
      case "keep":
        return "success";
      default:
        return "signal";
    }
  }

  switch (insight.recommendationLevel) {
    case "keep":
      return "success";
    case "soft_adjust":
      return "warning";
    default:
      return "signal";
  }
}

function describeAiCautionFlag(flag: string) {
  switch (flag) {
    case "evidence_unclear":
      return "the uploaded evidence is still limited";
    case "date_mismatch":
      return "the run date may not line up cleanly with the planned day";
    case "duration_shorter_than_planned":
      return "the run came in shorter than planned";
    case "duration_longer_than_planned":
      return "the run ran longer than planned";
    case "distance_mismatch":
      return "distance did not line up cleanly";
    case "structured_steps_not_comparable":
      return "structured steps could not be compared cleanly";
    case "body_discomfort_context":
      return "workout body notes add discomfort context";
    case "manual_review_worthwhile":
      return "a manual check is still worthwhile";
    default:
      return flag.replace(/_/g, " ");
  }
}

function summarizeAiCautionFlags(flags: string[]) {
  if (flags.length === 0) {
    return null;
  }

  const uniqueClauses = Array.from(new Set(flags.map((flag) => describeAiCautionFlag(flag))));

  if (uniqueClauses.length === 1) {
    return `This note stays cautious because ${uniqueClauses[0]}.`;
  }

  return `This note stays cautious because ${uniqueClauses.join(", ")}.`;
}

function hasPrimaryMatchedVerdict(comparison: WorkoutComparisonSummary | null) {
  if (!comparison) {
    return false;
  }

  return (
    comparison.completionState === "matched" && comparison.comparisonStatus !== "insufficient_data"
  );
}

function toneForComparison(comparison: WorkoutComparisonSummary) {
  if (
    comparison.completionState === "matched" &&
    comparison.comparisonStatus !== "insufficient_data"
  ) {
    return "success";
  }

  if (comparison.completionState === "partially_matched") {
    return "warning";
  }

  return "signal";
}

function toneForSignal(status: WorkoutComparisonSignal["status"]) {
  switch (status) {
    case "matched":
      return "success";
    case "partial":
      return "warning";
    case "mismatch":
      return "destructive";
    default:
      return "signal";
  }
}

function shouldShowSignalReason(signal: WorkoutComparisonSignal) {
  return Boolean(
    signal.reason &&
    (signal.status === "partial" ||
      signal.status === "mismatch" ||
      signal.status === "missing_actual" ||
      signal.status === "not_applicable"),
  );
}

function shouldShowStepSummary(
  comparison: WorkoutComparisonSummary,
  payload: WorkoutComparisonDifferencePayload | null,
) {
  const stepSummary = payload?.stepSummary;

  if (!stepSummary) {
    return false;
  }

  if (stepSummary.status === "not_applicable") {
    return true;
  }

  if (comparison.completionState !== "matched") {
    return true;
  }

  return (
    stepSummary.partialStepCount === 0 &&
    stepSummary.mismatchStepCount === 0 &&
    stepSummary.missingActualStepCount === 0
  );
}

function getComparisonPayload(
  comparison: WorkoutComparisonSummary,
): WorkoutComparisonDifferencePayload | null {
  const payload = comparison.differencePayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload;
}

function getComparisonSignals(comparison: WorkoutComparisonSummary) {
  const payload = getComparisonPayload(comparison);
  const signals = payload?.signals;

  if (Array.isArray(signals) && signals.length > 0) {
    return signals.filter(isComparisonSignal);
  }

  const facts = asRecord(payload?.facts);
  const fallback = [
    legacyFactToSignal("date_alignment", "Date", "date", asRecord(facts?.dateAlignment)),
    legacyFactToSignal("duration", "Duration", "min", asRecord(facts?.duration)),
    legacyFactToSignal("distance", "Distance", "km", asRecord(facts?.distance)),
    legacyFactToSignal(
      "structured_step_count",
      "Structured steps",
      "count",
      asRecord(facts?.structuredStepCount),
    ),
  ];

  return fallback.filter(notNullSignal);
}

function isComparisonSignal(value: unknown): value is WorkoutComparisonSignal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.status === "string";
}

function legacyFactToSignal(
  key: WorkoutComparisonSignal["key"],
  label: string,
  unit: WorkoutComparisonSignal["unit"],
  fact: Record<string, unknown> | null,
) {
  if (!fact) {
    return null;
  }

  const status = typeof fact.status === "string" ? fact.status : null;

  if (!status) {
    return null;
  }

  return {
    key,
    label,
    unit,
    status: status as WorkoutComparisonSignal["status"],
    reason: typeof fact.reason === "string" ? fact.reason : undefined,
    plannedValue:
      typeof fact.plannedValue === "number" || typeof fact.plannedValue === "string"
        ? fact.plannedValue
        : null,
    actualValue:
      typeof fact.actualValue === "number" || typeof fact.actualValue === "string"
        ? fact.actualValue
        : null,
    delta: typeof fact.delta === "number" ? fact.delta : null,
    deltaPct: typeof fact.deltaPct === "number" ? fact.deltaPct : null,
  } satisfies WorkoutComparisonSignal;
}

function notNullSignal(signal: WorkoutComparisonSignal | null): signal is WorkoutComparisonSignal {
  return signal != null;
}

function humanizeCompletionState(state: WorkoutComparisonSummary["completionState"]) {
  switch (state) {
    case "matched":
      return "Matched";
    case "partially_matched":
      return "Partially matched";
    default:
      return "Unclear";
  }
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function notNullSessionItem(
  item: { label: string; value: string; support?: string | null } | null,
): item is { label: string; value: string; support?: string | null } {
  return item != null;
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
