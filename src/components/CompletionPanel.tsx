import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, MinusCircle, Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveWorkoutLog } from "@/lib/training-api";
import type { TrainingSnapshot, Workout } from "@/lib/training";
import { WEEK_STATUS_META, workoutDistanceKm, workoutDuration } from "@/lib/training";

type Outcome = "completed" | "partial" | "skipped";
type CompletionFormState = {
  outcome: Outcome;
  actualKm: string;
  actualMin: string;
  rpe: number;
  notes: string;
  intervalsCompleted: number;
};

export function CompletionPanel({
  workout,
  snapshot,
}: {
  workout: Workout;
  snapshot: TrainingSnapshot;
}) {
  const router = useRouter();
  const saveWorkoutLogFn = useServerFn(saveWorkoutLog);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const savedPayloadFromWorkout = useMemo(
    () =>
      buildSavedPayload(workout.id, {
        outcome: savedLogOutcome,
        actualDistanceKm: savedLogDistanceKm,
        actualDurationMin: savedLogDurationMin,
        rpe: savedLogRpe,
        notes: savedLogNotes,
        intervalsCompleted: savedLogIntervalsCompleted,
      }),
    [
      workout.id,
      savedLogOutcome,
      savedLogDistanceKm,
      savedLogDurationMin,
      savedLogRpe,
      savedLogNotes,
      savedLogIntervalsCompleted,
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
  }, [form.actualKm, form.actualMin, form.intervalsCompleted, form.notes, form.outcome, form.rpe]);

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

  if (workout.type === "rest") {
    return (
      <div className="hito-surface-flat p-5">
        <div className="hito-label">Rest day</div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          Rest days do not need a workout result. If a real mobility or strength assignment is added
          later, this surface can stay available for it.
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
              ? "Save failed"
              : hasSavedLog && isDirty
                ? "Unsaved edits"
                : message
                  ? "Saved feedback"
                  : snapshot.source === "persisted"
                    ? hasSavedLog
                      ? "Saved result"
                      : "Ready to save"
                    : "Preview only"}
        </div>
        <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
          {isSaving
            ? `Saving this ${outcome} result and reloading the latest saved truth.`
            : error
              ? error
              : hasSavedLog && isDirty
                ? `Your ${outcome} result has unsaved edits. Save changes to update the canonical workout log and route-level week status.`
                : message
                  ? message
                  : snapshot.source === "persisted"
                    ? hasSavedLog
                      ? `This workout already has a saved ${workout.log?.outcome} result. ${
                          workout.log?.loggedAt
                            ? `Last updated ${formatLoggedAt(workout.log.loggedAt)}.`
                            : "Backend truth is already available for this day."
                        }`
                      : "Saving here writes the canonical workout log and updates the visible week status from backend truth."
                    : "You can try the flow here, but preview mode does not persist workout history."}
        </p>
        <div className="hito-caption mt-3 flex flex-wrap items-center gap-3">
          <span>
            Week status <span className="text-foreground/80">{weekStatus.label}</span>
          </span>
          <span className="opacity-50">·</span>
          <span>
            {snapshot.source === "persisted"
              ? hasSavedLog && isDirty
                ? "Unsaved edits"
                : hasSavedLog
                  ? "Backend confirmed"
                  : "Waiting for first save"
              : "Local draft only"}
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
                icon: CheckCircle2,
                label: "Complete",
                c: "var(--success)",
              },
              { v: "partial", icon: MinusCircle, label: "Partial", c: "var(--warn)" },
              {
                v: "skipped",
                icon: XCircle,
                label: "Skipped",
                c: "var(--destructive)",
              },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
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
                  className="h-4 w-4"
                  strokeWidth={1.5}
                  style={{ color: active ? option.c : undefined }}
                />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isSkipped ? (
        <div className="hito-surface-flat p-4">
          <div className="hito-label">Skipped result</div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
            Skipped saves without actual distance, duration, reps, or RPE. You can keep notes for
            context, and the visible route status will reflect the skipped truth after save.
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
        <Label>Notes</Label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(event) => updateForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Felt strong on the climb, slight tightness in right calf at km 6…"
          className="hito-field hito-textarea-md mt-3 min-h-28 resize-none"
        />
        <div className="hito-surface-flat mt-4 border-dashed p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled
              className="hito-button hito-button-secondary hito-button-md disabled:opacity-100"
            >
              <Upload className="h-4 w-4 text-signal" />
              Upload result
              <span className="hito-label hito-label-signal text-[10px]">Later</span>
            </button>
            <span className="hito-caption">Add screenshot or evidence here later.</span>
          </div>
          <p className="hito-caption mt-3">
            Post-run insight will appear here once uploaded result evidence is supported. Garmin,
            Strava, and extraction are not connected in this slice.
          </p>
        </div>
        <p className="hito-caption mt-3">
          {snapshot.source === "persisted"
            ? "Saving here upserts the canonical workout log and recomputes the visible week status from backend truth."
            : "Preview only. This form keeps the imported interaction pattern, but saved results are not persisted or synced yet."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-hairline">
        <button
          type="button"
          onClick={async () => {
            if (snapshot.source !== "persisted") {
              setMessage("Preview form updated locally. Sign in to save backend truth.");
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
              setMessage(
                `Saved ${nextPayload.outcome} to your plan. The route now reflects the latest saved truth.`,
              );
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
          {snapshot.source === "persisted"
            ? "Current phase keeps one canonical persisted backend contract."
            : "Current phase keeps one local preview form and one preview seam."}
        </span>
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="hito-label">{children}</div>;
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
        <span className="hito-label">{label}</span>
        <span className="hito-caption font-mono-num">plan {planned}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="bg-transparent font-display text-2xl w-full focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
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
