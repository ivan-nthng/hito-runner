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
import type { HitoProductApiFailure } from "@/lib/product-api-error-contract";
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
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatUiNumber, type ResolvedUiLocale } from "@/lib/ui-locale";
import {
  formatHitoProductMessage,
  getHitoKnownProductMessage,
  getHitoProductApiFailureMessage,
} from "@/lib/ui-locale-messages";

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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
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
      ? t("Saving feedback...")
      : hasSavedLog && !isDirty
        ? t("Feedback saved")
        : t("Save feedback")
    : snapshot.source !== "persisted"
      ? t("Preview result")
      : isSaving
        ? t("Saving result...")
        : hasSavedResult && !isDirty
          ? t("Saved result")
          : hasSavedResult
            ? t("Save changes")
            : t("Save result");

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
        <div className="hito-label-md text-foreground">{t("Rest day")}</div>
        <p className="hito-body-md text-secondary mt-2">
          {t(
            "Rest days do not need a workout result. If a mobility or strength assignment is added later, you can log it here.",
          )}
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
              ? t("Saving feedback")
              : t("Saving result")
            : error
              ? t("Couldn't save")
              : hasSavedResult && isDirty
                ? t("Unsaved changes")
                : message
                  ? t("Saved")
                  : isFitCompleted
                    ? form.outcome === "partial"
                      ? t("Partial result")
                      : t("Completed from activity file")
                    : snapshot.source === "persisted"
                      ? hasSavedResult
                        ? t("Saved result")
                        : t("Ready to save")
                      : t("Preview only")}
        </div>
        <p className="hito-body-md text-secondary mt-2">
          {isSaving
            ? isFitCompleted
              ? t("Saving your personal feedback now.")
              : t("Saving your {outcome} result now.", {
                  outcome: localizeOutcome(locale, outcome),
                })
            : error
              ? error
              : hasSavedResult && isDirty
                ? t(
                    "You changed this {outcome} result. Save to update the workout and this week's status.",
                    { outcome: localizeOutcome(locale, outcome) },
                  )
                : message
                  ? message
                  : isFitCompleted
                    ? form.outcome === "partial"
                      ? t(
                          "Your recorded activity remains attached. This partial result is your explicit correction.",
                        )
                      : t(
                          "Your recorded activity completed this workout. Distance, duration, and intervals stay with the activity file.",
                        )
                    : snapshot.source === "persisted"
                      ? hasSavedResult
                        ? t("This workout already has a saved {outcome} result. {detail}", {
                            outcome: localizeOutcome(locale, workout.log?.outcome ?? outcome),
                            detail:
                              hasSavedLog && workout.log?.loggedAt
                                ? t("Last updated {date}.", {
                                    date: formatWorkoutFeedbackTimestamp(
                                      workout.log.loggedAt,
                                      locale,
                                    ),
                                  })
                                : t("This result is already saved."),
                          })
                        : t("Save this result to update the workout and this week's status.")
                      : t("You can try the form here, but preview results are not saved.")}
        </p>
        <div className="hito-body-xs text-tertiary mt-3 flex flex-wrap items-center gap-3">
          <span>
            {t("This week")}{" "}
            <span className="text-text-secondary">
              {getHitoKnownProductMessage(locale, weekStatus.label)}
            </span>
          </span>
          <span className="opacity-50">·</span>
          <span>
            {snapshot.source === "persisted"
              ? isFitCompleted
                ? form.outcome === "partial"
                  ? t("Partial correction")
                  : t("Activity file")
                : hasSavedResult && isDirty
                  ? t("Changes not saved")
                  : hasSavedResult
                    ? t("Saved")
                    : t("Ready to save")
              : t("Preview")}
          </span>
        </div>
      </div>

      {!isFitCompleted ? (
        <div>
          <Label>{t("How did it go?")}</Label>
          <div
            className="mt-3 grid grid-cols-3 gap-2"
            {...outcomeGroup.groupProps}
            aria-label={t("Workout outcome")}
          >
            {(
              [
                {
                  v: "completed",
                  icon: "check-circle",
                  label: t("Complete"),
                  c: "var(--success)",
                },
                { v: "partial", icon: "minus", label: t("Partial"), c: "var(--warn)" },
                {
                  v: "skipped",
                  icon: "x-circle",
                  label: t("Skipped"),
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
          <div className="hito-label-md text-foreground">{t("Skipped result")}</div>
          <p className="hito-body-md text-secondary mt-2">
            {t(
              "A skipped result saves without distance, duration, reps, or RPE. You can still leave a note for context.",
            )}
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
                <div className="hito-label-md text-foreground">{t("Completion correction")}</div>
                <p className="hito-body-md text-secondary mt-1">
                  {form.outcome === "partial"
                    ? t("This activity is recorded as partial by your choice.")
                    : t("Recorded activity remains completed unless you mark it partial.")}
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
                {form.outcome === "partial" ? t("Use completed") : t("Mark as partial")}
              </HitoButton>
            </div>

            <HitoSlider
              label={t("Effort (RPE)")}
              value={form.rpe ?? 6}
              min={1}
              max={10}
              step={1}
              previousValue={syncedFormState.rpe ?? 6}
              previousValueLabel={t("Restore session effort {value} out of 10", {
                value: syncedFormState.rpe ?? 6,
              })}
              onValueChange={(value) => updateForm((current) => ({ ...current, rpe: value }))}
              valueLabel={
                form.rpe == null ? t("Not recorded") : `${formatUiNumber(form.rpe, locale)}/10`
              }
              ariaValueText={
                form.rpe == null
                  ? t("Effort not recorded")
                  : t("Effort {value} out of 10", { value: formatUiNumber(form.rpe, locale) })
              }
            />

            <div>
              <Label>{t("Notes")}</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder={t(
                  "Felt strong on the climb, slight tightness in right calf at km 6...",
                )}
                size="md"
                variant="primary"
                className="mt-3 min-h-28 resize-none"
              />
              <p className="hito-body-xs text-tertiary mt-3">
                {t(
                  "This saves personal feedback. Distance, duration, and intervals remain with the recorded activity.",
                )}
              </p>
            </div>
          </div>
        ) : (
          <details className={cn("hito-disclosure", !isSkipped && "mt-6")}>
            <summary className="hito-disclosure-summary">
              <span className="hito-body-md text-foreground">{t("Manually add details")}</span>
              <Icon name="chevron-down" className="hito-disclosure-chevron" />
            </summary>
            <div className="hito-disclosure-body">
              {!isSkipped ? (
                <>
                  <div>
                    <Label>{t("Planned vs actual")}</Label>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <NumField
                        label={t("Distance")}
                        suffix="km"
                        planned={formatUiNumber(plannedKm, locale)}
                        value={form.actualKm}
                        onChange={(value) =>
                          updateForm((current) => ({ ...current, actualKm: value }))
                        }
                      />
                      <NumField
                        label={t("Duration")}
                        suffix="min"
                        planned={formatUiNumber(plannedMin, locale)}
                        value={form.actualMin}
                        onChange={(value) =>
                          updateForm((current) => ({ ...current, actualMin: value }))
                        }
                      />
                    </div>

                    {plannedRepeats > 0 && (
                      <div className="mt-4">
                        <div className="hito-label-md text-foreground mb-2">
                          {t("Intervals completed")}
                        </div>
                        <div
                          className="hito-choice-toggle-group flex-nowrap"
                          {...intervalGroup.groupProps}
                          aria-label={t("Intervals completed")}
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
                          {t("Tap to mark how many reps were completed.")}
                        </p>
                      </div>
                    )}
                  </div>

                  <HitoSlider
                    label={t("Effort (RPE)")}
                    value={form.rpe ?? 6}
                    min={1}
                    max={10}
                    step={1}
                    previousValue={syncedFormState.rpe ?? 6}
                    previousValueLabel={t("Restore session effort {value} out of 10", {
                      value: syncedFormState.rpe ?? 6,
                    })}
                    onValueChange={(value) => updateForm((current) => ({ ...current, rpe: value }))}
                    valueLabel={
                      form.rpe == null
                        ? t("Not recorded")
                        : `${formatUiNumber(form.rpe, locale)}/10`
                    }
                    ariaValueText={
                      form.rpe == null
                        ? t("Effort not recorded")
                        : t("Effort {value} out of 10", {
                            value: formatUiNumber(form.rpe, locale),
                          })
                    }
                  />
                </>
              ) : null}

              <div>
                <Label>{t("Notes")}</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    updateForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder={t(
                    "Felt strong on the climb, slight tightness in right calf at km 6…",
                  )}
                  size="md"
                  variant="primary"
                  className="mt-3 min-h-28 resize-none"
                />
                <p className="hito-body-xs text-tertiary mt-3">
                  {snapshot.source === "persisted"
                    ? t("This saves your workout result. Garmin uploads live in Feedback.")
                    : t("Preview only. Results entered here are not saved.")}
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
              setMessage(t("Preview result updated locally. Sign in to save it."));
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
                  ? t("Personal feedback saved. The recorded activity remains the workout result.")
                  : t("Saved as {outcome}. This page now shows the latest result.", {
                      outcome: localizeOutcome(locale, nextPayload.outcome),
                    }),
              );
              void router.invalidate().catch(() => undefined);
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : t("Could not save log."));
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
            ? t("Personal feedback only. Run data stays with the activity file.")
            : snapshot.source === "persisted"
              ? t("Saved to this workout.")
              : t("Preview only.")}
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
  const locale = useHitoUiLocale();
  const state = getFeedbackInviteState(snapshot, feedback, locale);

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
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
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
    locale,
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
          label: t("Ready"),
          tone: "success" as const,
        }
      : (uploadSummary.pill ?? {
          label: t("Attached"),
          tone: "signal" as const,
        })
    : canUploadResult
      ? null
      : {
          label: t("Saved mode only"),
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
        setUploadError(t("Choose one Garmin .fit file or .zip archive."));
        setOperationNotice(null);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setRemoveError(null);
    setOperationNotice(t("Uploading activity file."));

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
        | HitoProductApiFailure
      >(response, t("The Garmin result upload could not be completed."));

      if (!response.ok || !payload.ok) {
        throw new RunnerSafeWorkoutResultClientError(
          !payload.ok
            ? getHitoProductApiFailureMessage(locale, payload)
            : t("The Garmin result upload could not be completed."),
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
        ? t(
            "{fileName} selected. Camelot used canonical synthetic evidence; the selected bytes were not parsed or stored.",
            { fileName: payload.fixtureOutcome.presentationFileName },
          )
        : payload.latestComparison
          ? t("Activity file uploaded. Plan versus run is ready to review.")
          : payload.latestActualMetrics
            ? t("Activity file uploaded. Run captured; plan comparison is unavailable.")
            : t("Activity file uploaded.");
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
          : t("The Garmin result upload could not be completed."),
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (workout.type === "rest") {
    return (
      <div className="hito-surface-flat p-5">
        <div className="hito-label-md text-foreground">{t("Feedback unavailable")}</div>
        <p className="hito-body-md text-secondary mt-2">
          {t(
            "Rest days do not support Garmin review right now. If you need to log something, keep it in the workout result instead.",
          )}
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
            <div className="hito-label-md text-foreground">{t("Feedback")}</div>
            <h2 className="hito-ui-title-sm text-foreground mt-2">
              {t("Compare your run with the plan.")}
            </h2>
            <p className="hito-body-md text-secondary mt-2">
              {attachedGarminAsset
                ? t("Your Garmin file and review live here.")
                : t("Add an activity file if you want a deeper review.")}
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
                  t(
                    "Remove the attached Garmin evidence for this workout? The manual workout log will stay as it is.",
                  ),
                );

                if (!confirmed) {
                  return;
                }

                setIsRemoving(true);
                setRemoveError(null);
                setUploadError(null);
                setOperationNotice(t("Removing activity file."));

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
                    | HitoProductApiFailure
                  >(response, t("The Garmin evidence could not be removed."));

                  if (!response.ok || !payload.ok) {
                    throw new RunnerSafeWorkoutResultClientError(
                      !payload.ok
                        ? getHitoProductApiFailureMessage(locale, payload)
                        : t("The Garmin evidence could not be removed."),
                    );
                  }

                  setFeedbackState(payload.feedback);
                  setOperationNotice(
                    t("Activity file removed. Your manual workout log is unchanged."),
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
                      : t("The Garmin evidence could not be removed."),
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
                  <div className="hito-label-md text-foreground">{t("Upload activity file")}</div>
                  <h3 className="hito-ui-title-xs text-foreground mt-3">
                    {t("Add an activity file to compare it with the plan.")}
                  </h3>
                  <p className="hito-body-md text-secondary mt-3 max-w-xl">
                    {t(
                      "Hito currently accepts one Garmin {fit} activity or one {zip} archive containing exactly one FIT activity. That unlocks the comparison below.",
                      { fit: ".fit", zip: ".zip" },
                    )}
                  </p>
                  {localActivityFileDesignFixtureEnabled ? (
                    <p className="hito-body-xs mt-3 max-w-xl text-muted-foreground">
                      {t(
                        "Local QA fixture. Choose a local file through the ordinary upload control. The server keeps only the authorized safe presentation result.",
                      )}
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
                        ? t("Uploading file...")
                        : localActivityFileDesignFixtureEnabled
                          ? t("Choose local file")
                          : t("Upload activity file")}
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
              <h3 className="hito-ui-title-xs text-foreground">{t("Plan vs run")}</h3>
              <span
                className="hito-status-pill"
                data-tone={getComparisonCoverageMeta(latestComparison, locale).tone}
              >
                {getComparisonCoverageMeta(latestComparison, locale).label}
              </span>
            </div>
            <DeterministicComparisonReadback comparison={latestComparison} />
          </section>
        ) : null}

        {latestAiInsight ? (
          <section className="border-t border-hairline pt-6">
            <h3 className="hito-ui-title-xs text-foreground">{t("Saved coach note")}</h3>
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
  const t = useHitoProductMessage();
  const fileTypeLabel = asset.assetKind === "garmin_zip" ? "Garmin ZIP" : "Garmin FIT";

  return (
    <div className="group rounded-xl bg-background/16 px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="hito-label-md text-foreground">{t("Attached file")}</div>
          <p className="hito-body-md text-foreground mt-2">{asset.originalFileName}</p>
          <p className="hito-body-xs text-tertiary mt-2">{fileTypeLabel}</p>
          <p className="hito-body-xs text-tertiary mt-1">
            {t(
              "Remove this file before uploading a replacement. Your manual result stays as it is.",
            )}
          </p>
          {asset.primaryFileName && asset.primaryFileName !== asset.originalFileName ? (
            <p className="hito-body-xs text-tertiary mt-1">
              {t("Extracted activity: {fileName}", { fileName: asset.primaryFileName })}
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
          {isRemoving ? t("Removing...") : t("Remove file")}
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
  locale,
}: {
  canUploadResult: boolean;
  isUploading: boolean;
  uploadError: string | null;
  feedback: WorkoutResultFeedbackSummary | null;
  locale: ResolvedUiLocale;
}) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  const latestAsset = feedback?.latestAsset;
  const latestActualMetrics = feedback?.latestActualMetrics;
  const latestComparison = feedback?.latestComparison;
  const latestAiInsight = feedback?.latestAiInsight;
  const assetLabel = latestAsset
    ? latestAsset.assetKind === "garmin_zip"
      ? "Garmin ZIP"
      : "Garmin FIT"
    : "Garmin file";
  const actualSnapshot = describeActualSnapshot(feedback, locale);

  if (!canUploadResult) {
    return {
      label: copy("Sign in to use Garmin upload"),
      body: copy("FIT and ZIP upload only work on saved workouts."),
      detailLine: copy("Upload is not available in preview mode."),
      pill: {
        label: copy("Saved mode only"),
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  if (isUploading) {
    return {
      label: copy("Processing your run"),
      body: copy("Your Garmin file is uploading now."),
      detailLine: copy("Upload in progress · comparison not ready yet."),
      pill: {
        label: copy("Working"),
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  if (uploadError || latestAsset?.parseStatus === "failed") {
    return {
      label: copy("We could not read that run yet"),
      body:
        uploadError ??
        latestAsset?.parseError ??
        copy(
          "The last Garmin file did not finish processing. Your manual workout log is unchanged.",
        ),
      detailLine: latestAsset
        ? formatHitoProductMessage(locale, "{subject} attached · comparison not ready.", {
            subject: assetLabel,
          })
        : copy("Try another Garmin FIT or ZIP file."),
      pill: {
        label: copy("Retry"),
        tone: "signal" as const,
      },
      tone: "destructive" as const,
    };
  }

  if (latestAiInsight && latestComparison && latestActualMetrics) {
    return {
      label: copy("Your run is ready to review"),
      body: copy("The comparison and saved coach note are ready to review."),
      detailLine: actualSnapshot
        ? formatHitoProductMessage(locale, "{subject} · Plan vs run is ready.", {
            subject: actualSnapshot,
          })
        : formatHitoProductMessage(locale, "{subject} processed · Plan vs run is ready.", {
            subject: assetLabel,
          }),
      pill: {
        label: copy("Ready"),
        tone: "success" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestComparison && latestActualMetrics) {
    return {
      label: copy("Your run is ready to compare"),
      body: copy("The comparison is ready below."),
      detailLine: actualSnapshot
        ? formatHitoProductMessage(locale, "{subject} · Plan vs run is ready.", {
            subject: actualSnapshot,
          })
        : formatHitoProductMessage(locale, "{subject} processed · Plan vs run is ready.", {
            subject: assetLabel,
          }),
      pill: {
        label: copy("Plan vs run ready"),
        tone: "success" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestActualMetrics) {
    return {
      label: copy("Run captured"),
      body: copy("The activity is ready to review. A plan comparison is unavailable."),
      detailLine: actualSnapshot
        ? formatHitoProductMessage(locale, "{subject} · comparison not ready yet.", {
            subject: actualSnapshot,
          })
        : formatHitoProductMessage(locale, "{subject} processed · comparison not ready yet.", {
            subject: assetLabel,
          }),
      pill: {
        label: copy("Run captured"),
        tone: "signal" as const,
      },
      tone: "success" as const,
    };
  }

  if (latestAsset) {
    return {
      label: copy("Your Garmin file is attached"),
      body: copy("The file is here, but the run summary is not ready yet."),
      detailLine: formatHitoProductMessage(
        locale,
        "{subject} attached · run summary not ready yet.",
        { subject: assetLabel },
      ),
      pill: {
        label: copy("Attached"),
        tone: "signal" as const,
      },
      tone: "signal" as const,
    };
  }

  return {
    label: copy("No Garmin file yet"),
    body: copy("Upload is optional. Add a FIT or ZIP file here to compare the run with the plan."),
    detailLine: copy("No file attached yet."),
    pill: null,
    tone: "default" as const,
  };
}

function describeActualSnapshot(
  feedback: WorkoutResultFeedbackSummary | null,
  locale: ResolvedUiLocale,
) {
  const actual = feedback?.latestActualMetrics;
  const asset = feedback?.latestAsset;

  if (!actual || !asset) {
    return null;
  }

  const details = [
    asset.assetKind === "garmin_zip" ? "Garmin ZIP" : "Garmin FIT",
    actual.actualDistanceKm != null
      ? `${formatUiNumber(actual.actualDistanceKm, locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} km`
      : null,
    actual.actualDurationMin != null ? formatDurationMin(actual.actualDurationMin) : null,
    actual.actualIntervalCount != null
      ? locale === "pt-BR"
        ? `${formatUiNumber(actual.actualIntervalCount, locale)} etapas estruturadas`
        : `${formatUiNumber(actual.actualIntervalCount, locale)} structured steps`
      : null,
  ].filter(Boolean);

  return details.join(" · ");
}

function getFeedbackInviteState(
  snapshot: TrainingSnapshot,
  feedback: WorkoutResultFeedbackSummary | null,
  locale: ResolvedUiLocale,
) {
  const copy = (value: string) => getHitoKnownProductMessage(locale, value);
  if (snapshot.source !== "persisted") {
    return {
      label: copy("Garmin review opens after sign-in"),
      body: copy("Saved workouts can use Feedback for Garmin FIT or ZIP review."),
      cta: copy("Open Feedback"),
      pill: {
        label: copy("Saved mode only"),
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
      label: copy("Garmin feedback is ready"),
      body: copy("Review the plan-vs-run comparison and short next-step note."),
      cta: copy("Review Feedback"),
      pill: {
        label: copy("Ready"),
        tone: "success" as const,
      },
    };
  }

  if (parseFailed) {
    return {
      label: copy("Garmin upload needs attention"),
      body: copy("Check the upload result in Feedback. Your manual result stays separate."),
      cta: copy("Open Feedback"),
      pill: {
        label: copy("Retry"),
        tone: "signal" as const,
      },
    };
  }

  if (hasEvidenceAttached) {
    return {
      label: copy("Garmin file is attached"),
      body: copy("Continue in Feedback to review the attached run file."),
      cta: copy("Continue in Feedback"),
      pill: {
        label: copy("In progress"),
        tone: "signal" as const,
      },
    };
  }

  return {
    label: copy("Add an activity file for deeper review"),
    body: copy("Optional: compare the planned workout with the actual run in Feedback."),
    cta: copy("Add activity file"),
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
  const t = useHitoProductMessage();
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="hito-label-md text-foreground">{label}</span>
        <span className="hito-technical-sm text-tertiary">
          {t("Planned")} {planned}
        </span>
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

function localizeOutcome(locale: ResolvedUiLocale, outcome: Outcome | string) {
  const label =
    outcome === "completed"
      ? "Complete"
      : outcome === "partial"
        ? "Partial"
        : outcome === "skipped"
          ? "Skipped"
          : outcome;
  return getHitoKnownProductMessage(locale, label);
}
