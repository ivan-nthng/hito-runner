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
import type { CamelotSimulatedFitOutcomeV1 } from "@/lib/camelot-interactive-qa-fixture";
import { type WorkoutResultFeedbackSummary } from "@/lib/workout-result-import/types";
import { HitoButton } from "@/components/ui/button";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { Input } from "@/components/ui/input";
import { HitoSlider } from "@/components/ui/hito-slider";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import {
  BodyNotesModal,
  BodyNotesSummaryRow,
  cloneBodyNoteDrafts,
  createEmptyBodyNoteDraft,
  type BodyNoteDraft,
} from "@/components/workout-completion/BodyNotesEditor";
import {
  DeterministicComparisonReadback,
  getComparisonCoverageMeta,
  RunCapturedReadback,
} from "@/components/workout-completion/WorkoutComparisonReadback";
import { WorkoutAiInsightReadback } from "@/components/workout-completion/WorkoutAiInsightReadback";
import { formatWorkoutFeedbackTimestamp } from "@/components/workout-completion/workout-feedback-time";

type Outcome = "completed" | "partial" | "skipped";
type CompletionFormState = {
  outcome: Outcome;
  actualKm: string;
  actualMin: string;
  rpe: number | null;
  notes: string;
  intervalsCompleted: number | null;
  bodyNotes: BodyNoteDraft[];
};
const EMPTY_SAVED_BODY_NOTES: BodyNote[] = [];

export function CompletionPanel({
  workout,
  snapshot,
  feedback,
  onOpenActivityFile,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
  onOpenActivityFile?: () => void;
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
  const isFitCompleted = workout.completionOrigin === "fit_activity";
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
    () => buildInitialFormState(savedPayloadFromWorkout),
    [savedPayloadFromWorkout],
  );
  const [form, setForm] = useState<CompletionFormState>(() =>
    buildInitialFormState(savedPayloadFromWorkout),
  );
  const outcomeGroup = useHitoRadioGroup({
    items: [{ value: "completed" }, { value: "partial" }, { value: "skipped" }],
    value: form.outcome,
  });
  const intervalValues = Array.from({ length: plannedRepeats }, (_, index) => String(index + 1));
  const intervalGroup = useHitoRadioGroup({
    items: intervalValues.map((value) => ({ value })),
    value: form.intervalsCompleted == null ? "" : String(form.intervalsCompleted),
  });
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
  const hasSavedResult =
    isFitCompleted || hasSavedLog || optimisticSavedPayloadKey === savedBaselineKey;

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
  const saveButtonLabel = isFitCompleted
    ? isSaving
      ? "Saving feedback..."
      : hasSavedLog && !isDirty
        ? "Feedback saved"
        : "Save feedback"
    : snapshot.source !== "persisted"
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
        <div className="hito-label-md text-foreground">Rest day</div>
        <p className="hito-body-md text-secondary mt-2">
          Rest days do not need a workout result. If a mobility or strength assignment is added
          later, you can log it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className="hito-state-surface p-4"
        data-tone={
          error ? "destructive" : message || isFitCompleted || hasSavedLog ? "success" : undefined
        }
      >
        <div className="hito-label-md text-foreground">
          {isSaving
            ? isFitCompleted
              ? "Saving feedback"
              : "Saving result"
            : error
              ? "Couldn't save"
              : hasSavedResult && isDirty
                ? "Unsaved changes"
                : message
                  ? "Saved"
                  : isFitCompleted
                    ? form.outcome === "partial"
                      ? "Partial result"
                      : "Completed from activity file"
                    : snapshot.source === "persisted"
                      ? hasSavedResult
                        ? "Saved result"
                        : "Ready to save"
                      : "Preview only"}
        </div>
        <p className="hito-body-md text-secondary mt-2">
          {isSaving
            ? isFitCompleted
              ? "Saving your personal feedback now."
              : `Saving your ${outcome} result now.`
            : error
              ? error
              : hasSavedResult && isDirty
                ? `You changed this ${outcome} result. Save to update the workout and this week's status.`
                : message
                  ? message
                  : isFitCompleted
                    ? form.outcome === "partial"
                      ? "Your recorded activity remains attached. This partial result is your explicit correction."
                      : "Your recorded activity completed this workout. Distance, duration, and intervals stay with the activity file."
                    : snapshot.source === "persisted"
                      ? hasSavedResult
                        ? `This workout already has a saved ${workout.log?.outcome ?? outcome} result. ${
                            hasSavedLog && workout.log?.loggedAt
                              ? `Last updated ${formatWorkoutFeedbackTimestamp(workout.log.loggedAt)}.`
                              : "This result is already saved."
                          }`
                        : "Save this result to update the workout and this week's status."
                      : "You can try the form here, but preview results are not saved."}
        </p>
        <div className="hito-body-xs text-tertiary mt-3 flex flex-wrap items-center gap-3">
          <span>
            This week <span className="text-text-secondary">{weekStatus.label}</span>
          </span>
          <span className="opacity-50">·</span>
          <span>
            {snapshot.source === "persisted"
              ? isFitCompleted
                ? form.outcome === "partial"
                  ? "Partial correction"
                  : "Activity file"
                : hasSavedResult && isDirty
                  ? "Changes not saved"
                  : hasSavedResult
                    ? "Saved"
                    : "Ready to save"
              : "Preview"}
          </span>
        </div>
      </div>

      {!isFitCompleted ? (
        <div>
          <Label>How did it go?</Label>
          <div
            className="mt-3 grid grid-cols-3 gap-2"
            {...outcomeGroup.groupProps}
            aria-label="Workout outcome"
          >
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
                <HitoChoiceToggle
                  key={option.v}
                  presentation="card"
                  selected={active}
                  {...outcomeGroup.getRadioProps(option.v)}
                  onClick={() =>
                    updateForm((current) => ({
                      ...current,
                      outcome: option.v,
                    }))
                  }
                  className="w-full flex-col justify-start gap-2 text-left"
                >
                  <Icon
                    name={option.icon}
                    size="sm"
                    style={{ color: active ? option.c : undefined }}
                  />
                  <span className="hito-body-md text-foreground">{option.label}</span>
                </HitoChoiceToggle>
              );
            })}
          </div>
        </div>
      ) : null}

      {isSkipped ? (
        <div className="hito-surface-flat p-4">
          <div className="hito-label-md text-foreground">Skipped result</div>
          <p className="hito-body-md text-secondary mt-2">
            A skipped result saves without distance, duration, reps, or RPE. You can still leave a
            note for context.
          </p>
        </div>
      ) : !isFitCompleted ? (
        <LogResultFeedbackBridge
          workout={workout}
          snapshot={snapshot}
          feedback={feedback}
          onOpenActivityFile={onOpenActivityFile}
        />
      ) : null}

      <div>
        {!isSkipped && (
          <BodyNotesSummaryRow bodyNotes={form.bodyNotes} onOpen={openBodyNotesModal} />
        )}

        {isFitCompleted ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
              <div>
                <div className="hito-label-md text-foreground">Completion correction</div>
                <p className="hito-body-md text-secondary mt-1">
                  {form.outcome === "partial"
                    ? "This activity is recorded as partial by your choice."
                    : "Recorded activity remains completed unless you mark it partial."}
                </p>
              </div>
              <HitoButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  updateForm((current) => ({
                    ...current,
                    outcome: current.outcome === "partial" ? "completed" : "partial",
                  }))
                }
              >
                {form.outcome === "partial" ? "Use completed" : "Mark as partial"}
              </HitoButton>
            </div>

            <HitoSlider
              label="Effort (RPE)"
              value={form.rpe ?? 6}
              min={1}
              max={10}
              step={1}
              previousValue={syncedFormState.rpe ?? 6}
              previousValueLabel={`Restore session effort ${syncedFormState.rpe ?? 6} out of 10`}
              onValueChange={(value) => updateForm((current) => ({ ...current, rpe: value }))}
              valueLabel={form.rpe == null ? "Not recorded" : `${form.rpe}/10`}
              ariaValueText={
                form.rpe == null ? "Effort not recorded" : `Effort ${form.rpe} out of 10`
              }
            />

            <div>
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Felt strong on the climb, slight tightness in right calf at km 6..."
                size="md"
                variant="primary"
                className="mt-3 min-h-28 resize-none"
              />
              <p className="hito-body-xs text-tertiary mt-3">
                This saves personal feedback. Distance, duration, and intervals remain with the
                recorded activity.
              </p>
            </div>
          </div>
        ) : (
          <details className={cn("hito-disclosure", !isSkipped && "mt-6")}>
            <summary className="hito-disclosure-summary">
              <span className="hito-body-md text-foreground">Manually add details</span>
              <Icon name="chevron-down" className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body">
              {!isSkipped ? (
                <>
                  <div>
                    <Label>Planned vs actual</Label>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <NumField
                        label="Distance"
                        suffix="km"
                        planned={plannedKm.toString()}
                        value={form.actualKm}
                        onChange={(value) =>
                          updateForm((current) => ({ ...current, actualKm: value }))
                        }
                      />
                      <NumField
                        label="Duration"
                        suffix="min"
                        planned={plannedMin.toString()}
                        value={form.actualMin}
                        onChange={(value) =>
                          updateForm((current) => ({ ...current, actualMin: value }))
                        }
                      />
                    </div>

                    {plannedRepeats > 0 && (
                      <div className="mt-4">
                        <div className="hito-label-md text-foreground mb-2">
                          Intervals completed
                        </div>
                        <div
                          className="hito-choice-toggle-group flex-nowrap"
                          {...intervalGroup.groupProps}
                          aria-label="Intervals completed"
                        >
                          {intervalValues.map((intervalValue) => (
                            <HitoChoiceToggle
                              key={intervalValue}
                              size="sm"
                              selected={form.intervalsCompleted === Number(intervalValue)}
                              {...intervalGroup.getRadioProps(intervalValue)}
                              onClick={() =>
                                updateForm((current) => ({
                                  ...current,
                                  intervalsCompleted: Number(intervalValue),
                                }))
                              }
                              className="min-w-0 flex-1 font-mono-num"
                            >
                              {intervalValue}
                            </HitoChoiceToggle>
                          ))}
                        </div>
                        <p className="hito-body-xs text-secondary mt-2">
                          Tap to mark how many reps were completed.
                        </p>
                      </div>
                    )}
                  </div>

                  <HitoSlider
                    label="Effort (RPE)"
                    value={form.rpe ?? 6}
                    min={1}
                    max={10}
                    step={1}
                    previousValue={syncedFormState.rpe ?? 6}
                    previousValueLabel={`Restore session effort ${syncedFormState.rpe ?? 6} out of 10`}
                    onValueChange={(value) => updateForm((current) => ({ ...current, rpe: value }))}
                    valueLabel={form.rpe == null ? "Not recorded" : `${form.rpe}/10`}
                    ariaValueText={
                      form.rpe == null ? "Effort not recorded" : `Effort ${form.rpe} out of 10`
                    }
                  />
                </>
              ) : null}

              <div>
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    updateForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Felt strong on the climb, slight tightness in right calf at km 6…"
                  size="md"
                  variant="primary"
                  className="mt-3 min-h-28 resize-none"
                />
                <p className="hito-body-xs text-tertiary mt-3">
                  {snapshot.source === "persisted"
                    ? "This saves your workout result. Garmin uploads live in Feedback."
                    : "Preview only. Results entered here are not saved."}
                </p>
              </div>
            </div>
          </details>
        )}
      </div>

      {!isSkipped ? (
        <BodyNotesModal
          open={bodyNotesModalOpen}
          bodyNotes={bodyNotesDraft}
          baselineBodyNotes={form.bodyNotes}
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

      {isSkipped ? (
        <LogResultFeedbackBridge workout={workout} snapshot={snapshot} feedback={feedback} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-hairline">
        <HitoButton
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
              const reconciledFormState = buildInitialFormState(nextPayload);
              const reconciledPayloadKey = serializePayload(
                buildSavePayload(workout, reconciledFormState),
              );

              updateForm(reconciledFormState);
              setBodyNotesDraft(cloneBodyNoteDrafts(reconciledFormState.bodyNotes));
              setSavedBaselineKey(reconciledPayloadKey);
              setOptimisticSavedPayloadKey(reconciledPayloadKey);
              setMessage(
                isFitCompleted
                  ? "Personal feedback saved. The recorded activity remains the workout result."
                  : `Saved as ${nextPayload.outcome}. This page now shows the latest result.`,
              );
              void router.invalidate().catch(() => undefined);
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "Could not save log.");
            } finally {
              setIsSaving(false);
            }
          }}
          size="lg"
          variant="primary"
          loading={isSaving}
          disabled={isSaving || (hasSavedResult && !isDirty)}
        >
          {saveButtonLabel}
        </HitoButton>
        <span className="hito-body-xs text-tertiary ml-auto">
          {isFitCompleted
            ? "Personal feedback only. Run data stays with the activity file."
            : snapshot.source === "persisted"
              ? "Saved to this workout."
              : "Preview only."}
        </span>
      </div>
    </div>
  );
}

function LogResultFeedbackBridge({
  workout,
  snapshot,
  feedback,
  onOpenActivityFile,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
  onOpenActivityFile?: () => void;
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
            <p className="hito-label-md text-foreground">{state.label}</p>
            {state.pill ? (
              <span className="hito-status-pill" data-tone={state.pill.tone}>
                {state.pill.label}
              </span>
            ) : null}
          </div>
          <p className="hito-body-sm text-secondary mt-1 max-w-xl">{state.body}</p>
        </div>
        {onOpenActivityFile ? (
          <HitoButton
            type="button"
            onClick={onOpenActivityFile}
            size="sm"
            variant="secondary"
            className="shrink-0"
          >
            <Icon name="file-up" size="xs" />
            {state.cta}
          </HitoButton>
        ) : (
          <HitoButton asChild size="sm" variant="secondary" className="shrink-0">
            <Link
              to="/workout/$date"
              params={{ date: workout.date }}
              search={{ tab: "feedback" } as never}
            >
              <Icon name="file-up" size="xs" />
              {state.cta}
              <Icon name="arrow-up-right" size="xs" />
            </Link>
          </HitoButton>
        )}
      </div>
    </div>
  );
}

export function WorkoutFeedbackPanel({
  workout,
  snapshot,
  feedback,
  localActivityFileDesignFixtureEnabled = false,
  onUploadInProgressChange,
  onUploadSucceeded,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
  feedback: WorkoutResultFeedbackSummary | null;
  localActivityFileDesignFixtureEnabled?: boolean;
  onUploadInProgressChange?: (isUploading: boolean) => void;
  onUploadSucceeded?: (notice: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [feedbackState, setFeedbackState] = useState<WorkoutResultFeedbackSummary | null>(feedback);
  const canUploadResult = snapshot.source === "persisted" && workout.type !== "rest";
  const attachedGarminAsset = feedbackState?.latestAsset?.rawFileAvailable
    ? feedbackState.latestAsset
    : null;
  const latestActualMetrics = feedbackState?.latestActualMetrics ?? null;
  const latestComparison = feedbackState?.latestComparison ?? null;
  const latestAiInsight = feedbackState?.latestAiInsight ?? null;
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

  useEffect(() => {
    onUploadInProgressChange?.(isUploading);
  }, [isUploading, onUploadInProgressChange]);

  async function uploadActivityFile(selectedFile: File | null) {
    if (!selectedFile) {
      return;
    }

    if (!localActivityFileDesignFixtureEnabled) {
      const selectedFileName = selectedFile.name.toLowerCase();
      const isSupportedGarminFile =
        selectedFileName.endsWith(".fit") || selectedFileName.endsWith(".zip");

      if (!isSupportedGarminFile) {
        setUploadError("Choose one Garmin .fit file or .zip archive.");
        setOperationNotice(null);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setRemoveError(null);
    setOperationNotice("Uploading activity file.");

    try {
      const formData = new FormData();
      formData.set("plannedWorkoutId", workout.id);
      formData.set("file", selectedFile);

      const response = await fetch("/api/workout-result/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await readWorkoutResultResponse<
        | {
            ok: true;
            marker: NonNullable<WorkoutResultFeedbackSummary>["marker"];
            latestAsset: NonNullable<WorkoutResultFeedbackSummary>["latestAsset"];
            latestActualMetrics: NonNullable<WorkoutResultFeedbackSummary>["latestActualMetrics"];
            latestComparison: NonNullable<WorkoutResultFeedbackSummary>["latestComparison"];
            latestAiInsight: NonNullable<WorkoutResultFeedbackSummary>["latestAiInsight"];
            fixtureOutcome: CamelotSimulatedFitOutcomeV1 | null;
          }
        | { ok: false; message?: string }
      >(response, "The Garmin result upload could not be completed.");

      if (!response.ok || !payload.ok) {
        throw new RunnerSafeWorkoutResultClientError(
          "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "The Garmin result upload could not be completed.",
        );
      }

      setFeedbackState({
        marker: payload.marker ?? null,
        latestAsset: projectCamelotPresentationAsset(
          payload.latestAsset ?? null,
          payload.fixtureOutcome,
        ),
        latestActualMetrics: payload.latestActualMetrics ?? null,
        latestComparison: payload.latestComparison ?? null,
        latestAiInsight: payload.latestAiInsight ?? null,
      });

      if (payload.latestAsset?.parseStatus === "failed") {
        setOperationNotice(null);

        try {
          await router.invalidate();
        } catch {
          // Keep the runner-safe parse failure visible even if route refresh lags.
        }

        return;
      }

      const successNotice = payload.fixtureOutcome
        ? `${payload.fixtureOutcome.presentationFileName} selected. Camelot used canonical synthetic evidence; the selected bytes were not parsed or stored.`
        : payload.latestComparison
          ? "Activity file uploaded. Plan versus run is ready to review."
          : payload.latestActualMetrics
            ? "Activity file uploaded. Run captured; plan comparison is unavailable."
            : "Activity file uploaded.";
      setOperationNotice(successNotice);

      try {
        await router.invalidate();
      } catch {
        // Keep the successful upload state visible even if route refresh lags.
      }

      if (!payload.fixtureOutcome) {
        onUploadSucceeded?.(successNotice);
      }
    } catch (uploadFailure) {
      setOperationNotice(null);
      setUploadError(
        uploadFailure instanceof RunnerSafeWorkoutResultClientError
          ? uploadFailure.message
          : "The Garmin result upload could not be completed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (workout.type === "rest") {
    return (
      <div className="hito-surface-flat p-5">
        <div className="hito-label-md text-foreground">Feedback unavailable</div>
        <p className="hito-body-md text-secondary mt-2">
          Rest days do not support Garmin review right now. If you need to log something, keep it in
          the workout result instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {operationNotice ? (
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {operationNotice}
        </p>
      ) : null}
      <header className="space-y-3 max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="hito-label-md text-foreground">Feedback</div>
            <h2 className="hito-ui-title-sm text-foreground mt-2">
              Compare your run with the plan.
            </h2>
            <p className="hito-body-md text-secondary mt-2">
              {attachedGarminAsset
                ? "Your Garmin file and review live here."
                : "Add an activity file if you want a deeper review."}
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
          accept={localActivityFileDesignFixtureEnabled ? undefined : ".fit,.zip"}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            event.target.value = "";

            if (!selectedFile) {
              return;
            }

            void uploadActivityFile(selectedFile);
          }}
        />
      ) : null}

      <div className="space-y-6">
        <section>
          {attachedGarminAsset ? (
            <AttachedEvidenceReadback
              asset={attachedGarminAsset}
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
                setOperationNotice("Removing activity file.");

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

                  const payload = await readWorkoutResultResponse<
                    | {
                        ok: true;
                        feedback: WorkoutResultFeedbackSummary;
                      }
                    | { ok: false; message?: string }
                  >(response, "The Garmin evidence could not be removed.");

                  if (!response.ok || !payload.ok) {
                    throw new RunnerSafeWorkoutResultClientError(
                      "message" in payload && typeof payload.message === "string"
                        ? payload.message
                        : "The Garmin evidence could not be removed.",
                    );
                  }

                  setFeedbackState(payload.feedback);
                  setOperationNotice(
                    "Activity file removed. Your manual workout log is unchanged.",
                  );

                  try {
                    await router.invalidate();
                  } catch {
                    // Keep the local cleared state even if route refresh lags.
                  }
                } catch (removalFailure) {
                  setOperationNotice(null);
                  setRemoveError(
                    removalFailure instanceof RunnerSafeWorkoutResultClientError
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
                    <Icon name="file-up" size="md" className="text-foreground" />
                  </div>
                  <div className="hito-label-md text-foreground">Upload activity file</div>
                  <h3 className="hito-ui-title-xs text-foreground mt-3">
                    Add an activity file to compare it with the plan.
                  </h3>
                  <p className="hito-body-md text-secondary mt-3 max-w-xl">
                    Hito currently accepts one Garmin{" "}
                    <span className="hito-technical-sm text-secondary">.fit</span> activity or one{" "}
                    <span className="hito-technical-sm text-secondary">.zip</span> archive
                    containing exactly one FIT activity. That unlocks the comparison below.
                  </p>
                  {localActivityFileDesignFixtureEnabled ? (
                    <p className="hito-body-xs mt-3 max-w-xl text-muted-foreground">
                      Local QA fixture. Choose a local file through the ordinary upload control. The
                      server keeps only the authorized safe presentation result.
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <HitoButton
                      type="button"
                      onClick={() => {
                        setUploadError(null);
                        setRemoveError(null);
                        setOperationNotice(null);
                        fileInputRef.current?.click();
                      }}
                      disabled={!canUploadResult || isUploading}
                      size="md"
                      variant="primary"
                      loading={isUploading}
                      className={cn(!canUploadResult && "disabled:opacity-100")}
                    >
                      <Icon name="file-up" size="sm" />
                      {isUploading
                        ? "Uploading file..."
                        : localActivityFileDesignFixtureEnabled
                          ? "Choose local file"
                          : "Upload activity file"}
                    </HitoButton>
                  </div>
                </div>

                {showUploadSummaryInEmptyState ? (
                  <div className="mx-auto mt-6 max-w-2xl border-t border-hairline pt-4">
                    <FeedbackUploadSummary summary={uploadSummary} />
                  </div>
                ) : null}
              </div>

              {uploadError ? (
                <p className="hito-body-md font-medium text-negative mt-3" role="alert">
                  {uploadError}
                </p>
              ) : null}
            </>
          )}

          {removeError ? (
            <p className="hito-body-md font-medium text-negative mt-3" role="alert">
              {removeError}
            </p>
          ) : null}
        </section>

        {latestActualMetrics ? (
          <section className="border-t border-hairline pt-6">
            <RunCapturedReadback
              actual={latestActualMetrics}
              comparisonAvailable={Boolean(latestComparison)}
            />
          </section>
        ) : null}

        {latestComparison ? (
          <section className="border-t border-hairline pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="hito-ui-title-xs text-foreground">Plan vs run</h3>
              <span
                className="hito-status-pill"
                data-tone={getComparisonCoverageMeta(latestComparison).tone}
              >
                {getComparisonCoverageMeta(latestComparison).label}
              </span>
            </div>
            <DeterministicComparisonReadback comparison={latestComparison} />
          </section>
        ) : null}

        {latestAiInsight ? (
          <section className="border-t border-hairline pt-6">
            <h3 className="hito-ui-title-xs text-foreground">Saved coach note</h3>
            <WorkoutAiInsightReadback insight={latestAiInsight} comparison={latestComparison} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function buildInitialFormState(
  savedPayload: ReturnType<typeof buildSavedPayload>,
): CompletionFormState {
  const outcome = savedPayload.outcome;

  return {
    outcome,
    actualKm: savedPayload.actualDistanceKm?.toString() ?? "",
    actualMin: savedPayload.actualDurationMin?.toString() ?? "",
    rpe: savedPayload.rpe,
    notes: savedPayload.notes ?? "",
    intervalsCompleted: savedPayload.intervalsCompleted,
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
  const isFitCompleted = workout.completionOrigin === "fit_activity";

  return {
    plannedWorkoutId: workout.id,
    outcome: form.outcome,
    actualDistanceKm:
      isFitCompleted || form.outcome === "skipped" ? null : parseNumberInput(form.actualKm),
    actualDurationMin:
      isFitCompleted || form.outcome === "skipped" ? null : parseNumberInput(form.actualMin),
    rpe: form.outcome === "skipped" ? null : form.rpe,
    notes: form.notes.trim() || null,
    intervalsCompleted:
      isFitCompleted || form.outcome === "skipped" || !workout.steps.some((step) => step.repeats)
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
        <p className="hito-label-md text-foreground">{summary.label}</p>
        {summary.pill ? (
          <span className="hito-status-pill" data-tone={summary.pill.tone}>
            {summary.pill.label}
          </span>
        ) : null}
      </div>
      <p className="hito-body-md text-secondary">{summary.body}</p>
      {summary.detailLine ? (
        <p className="hito-body-xs text-tertiary">{summary.detailLine}</p>
      ) : null}
    </div>
  );
}

function AttachedEvidenceReadback({
  asset,
  summary,
  isRemoving,
  onRemove,
}: {
  asset: NonNullable<NonNullable<WorkoutResultFeedbackSummary>["latestAsset"]>;
  summary: ReturnType<typeof getFeedbackUploadSummary>;
  isRemoving: boolean;
  onRemove: () => Promise<void>;
}) {
  const fileTypeLabel = asset.assetKind === "garmin_zip" ? "Garmin ZIP" : "Garmin FIT";

  return (
    <div className="group rounded-xl bg-background/16 px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="hito-label-md text-foreground">Attached file</div>
          <p className="hito-body-md text-foreground mt-2">{asset.originalFileName}</p>
          <p className="hito-body-xs text-tertiary mt-2">{fileTypeLabel}</p>
          <p className="hito-body-xs text-tertiary mt-1">
            Remove this file before uploading a replacement. Your manual result stays as it is.
          </p>
          {asset.primaryFileName && asset.primaryFileName !== asset.originalFileName ? (
            <p className="hito-body-xs text-tertiary mt-1">
              Extracted activity: {asset.primaryFileName}
            </p>
          ) : null}
        </div>
        <HitoButton
          type="button"
          onClick={() => {
            void onRemove();
          }}
          disabled={isRemoving}
          size="md"
          variant="secondary"
          loading={isRemoving}
          className="w-full shrink-0 opacity-100 transition-opacity sm:w-auto sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100"
        >
          <Icon name="trash" size="sm" />
          {isRemoving ? "Removing..." : "Remove file"}
        </HitoButton>
      </div>

      <div
        className="mt-4 border-t border-hairline pt-4"
        role={summary.tone === "destructive" ? "alert" : undefined}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="hito-body-md text-foreground">{summary.label}</p>
        </div>
        <p className="hito-body-md text-secondary mt-2">{summary.body}</p>
        {summary.detailLine ? (
          <p className="hito-body-xs text-tertiary mt-2">{summary.detailLine}</p>
        ) : null}
      </div>
    </div>
  );
}

class RunnerSafeWorkoutResultClientError extends Error {}

function projectCamelotPresentationAsset(
  asset: NonNullable<WorkoutResultFeedbackSummary>["latestAsset"],
  outcome: CamelotSimulatedFitOutcomeV1 | null,
): NonNullable<WorkoutResultFeedbackSummary>["latestAsset"] {
  if (!asset || !outcome) {
    return asset;
  }

  return {
    ...asset,
    originalFileName: outcome.presentationFileName,
    primaryFileName: outcome.presentationFileName,
  };
}

async function readWorkoutResultResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new RunnerSafeWorkoutResultClientError(fallbackMessage);
  }
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
        ? `${assetLabel} attached · comparison not ready.`
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
      body: "The comparison and saved coach note are ready to review.",
      detailLine: actualSnapshot
        ? `${actualSnapshot} · Plan vs run is ready.`
        : `${assetLabel} processed · Plan vs run is ready.`,
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
        ? `${actualSnapshot} · Plan vs run is ready.`
        : `${assetLabel} processed · Plan vs run is ready.`,
      pill: {
        label: "Plan vs run ready",
        tone: "success" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestActualMetrics) {
    return {
      label: "Run captured",
      body: "The activity is ready to review. A plan comparison is unavailable.",
      detailLine: actualSnapshot
        ? `${actualSnapshot} · comparison not ready yet.`
        : `${assetLabel} processed · comparison not ready yet.`,
      pill: {
        label: "Run captured",
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
    label: "Add an activity file for deeper review",
    body: "Optional: compare the planned workout with the actual run in Feedback.",
    cta: "Add activity file",
    pill: null,
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="hito-label-md text-foreground">{children}</div>;
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
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="hito-label-md text-foreground">{label}</span>
        <span className="hito-technical-sm text-tertiary">plan {planned}</span>
      </div>
      <span className="relative block">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          size="md"
          variant="primary"
          className="pr-12 font-mono-num"
        />
        <span
          className="hito-body-xs text-tertiary pointer-events-none absolute inset-y-0 right-3 flex items-center"
          aria-hidden="true"
        >
          {suffix}
        </span>
      </span>
    </label>
  );
}
