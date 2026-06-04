import { useMemo, useState, type ReactNode } from "react";

import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  ACTION_OPTIONS,
  BASE_STATE_OPTIONS,
  DEFAULT_PLAYGROUND_STATE,
  DENSE_GRID_DAYS,
  DENSITY_OPTIONS,
  FEEDBACK_OPTIONS,
  OVERLAY_OPTIONS,
  RESULT_OPTIONS,
  TITLE_STRESS_OPTIONS,
  WORKOUT_IDENTITIES,
  WORKOUT_IDENTITY_OPTIONS,
  getNonWorkoutTitle,
  getWorkoutTitle,
  type BaseDateState,
  type CalendarPlaygroundState,
  type FeedbackState,
  type FutureActionState,
  type Option,
  type ResultState,
  type WorkoutIdentity,
} from "./calendar-workout-playground-data";

export function CalendarWorkoutPlayground() {
  const [state, setState] = useState<CalendarPlaygroundState>(DEFAULT_PLAYGROUND_STATE);
  const workout = WORKOUT_IDENTITIES[state.identity];
  const previewTitle = useMemo(
    () => getWorkoutTitle(workout, state.titleStress),
    [state.titleStress, workout],
  );

  const setField =
    <Key extends keyof CalendarPlaygroundState>(key: Key) =>
    (value: CalendarPlaygroundState[Key]) => {
      setState((current) => ({ ...current, [key]: value }));
    };

  return (
    <section id="calendar-workout-playground" className="ds-section">
      <div className="hito-specimen-header">
        <SectionIntroLite
          label="Calendar playground"
          title="Calendar and workout-day states."
          body="Static DS specimens for month cells, mobile workout rows, result markers, evidence markers, density, title stress, and future manual authoring affordances."
        />
        <span className="hito-status-pill" data-tone="rollout">
          Specimen only
        </span>
      </div>

      <div className="hito-specimen">
        <div className="hito-specimen-grid">
          <article className="hito-specimen-preview">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.78fr)]">
              <PreviewPanel
                eyebrow="Desktop month cell"
                title="Single day anatomy"
                description="The controlled state below stress-tests one desktop day cell without mutating product calendar behavior."
              >
                <div
                  className={cn(
                    "grid overflow-hidden rounded-xl border border-hairline bg-background/30",
                    state.density === "dense" && "max-w-md",
                  )}
                >
                  <CalendarDaySpecimen
                    state={state}
                    day={18}
                    weekday="Thu"
                    title={previewTitle}
                    workout={workout}
                    emphasized
                  />
                </div>
              </PreviewPanel>

              <PreviewPanel
                eyebrow="Mobile row"
                title="Workout-day row"
                description="Actions wrap under title/meta instead of squeezing the date block or title."
              >
                <div className="mx-auto w-full max-w-[23.5rem]">
                  <MobileDayRowSpecimen
                    state={state}
                    day={18}
                    month="Jun"
                    weekday="Thu"
                    title={previewTitle}
                    workout={workout}
                  />
                </div>
              </PreviewPanel>
            </div>

            <PreviewPanel
              eyebrow="Dense month stress"
              title="Mixed states in a tight grid"
              description="Compact reference for outside-month, pre-start, rest, completed, partial, skipped, feedback, recurring, add, and protected states."
            >
              <div className="min-w-0 overflow-hidden rounded-xl border border-hairline bg-background/30">
                <div className="grid grid-cols-7 border-b border-hairline text-center">
                  {["M", "T", "W", "T", "F", "S", "S"].map((weekday, index) => (
                    <span
                      key={`${weekday}-${index}`}
                      className="border-r border-hairline py-2 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted-foreground last:border-r-0"
                    >
                      {weekday}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {DENSE_GRID_DAYS.map((dayState, index) => {
                    const mergedState: CalendarPlaygroundState = {
                      ...DEFAULT_PLAYGROUND_STATE,
                      overlay: index === 9 ? "selected" : "none",
                      result: "none",
                      feedback: "none",
                      action: "none",
                      titleStress: "short",
                      density: "dense",
                      ...dayState,
                    };
                    const mergedWorkout = WORKOUT_IDENTITIES[mergedState.identity];

                    return (
                      <CalendarDaySpecimen
                        key={`${dayState.day}-${index}`}
                        state={mergedState}
                        day={dayState.day}
                        weekday=""
                        title={getWorkoutTitle(mergedWorkout, "short")}
                        workout={mergedWorkout}
                        dense
                      />
                    );
                  })}
                </div>
              </div>
            </PreviewPanel>

            <PreviewPanel
              eyebrow="Contract"
              title="What this playground is allowed to prove"
              description="Static display only. Manual workout creation, editing, copy/paste, recurrence, protected-history rules, persistence, and schedule mutation belong to the future backend-owned authoring plan."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <ContractTile
                  label="Calendar truth"
                  body="Render backend-shaped day/workout state."
                />
                <ContractTile
                  label="Future affordance"
                  body="Preview compact controls without actions."
                />
                <ContractTile
                  label="Non-goal"
                  body="No CRUD, recurrence, or production route wiring."
                />
              </div>
            </PreviewPanel>
          </article>

          <aside
            className="hito-specimen-controls"
            aria-label="Calendar workout playground controls"
          >
            <div className="grid gap-4 p-4">
              <ChoiceControl
                label="Base date state"
                options={BASE_STATE_OPTIONS}
                value={state.baseState}
                onChange={setField("baseState")}
              />
              <ChoiceControl
                label="Interaction overlay"
                options={OVERLAY_OPTIONS}
                value={state.overlay}
                onChange={setField("overlay")}
              />
              <ChoiceControl
                label="Result marker"
                options={RESULT_OPTIONS}
                value={state.result}
                onChange={setField("result")}
              />
              <ChoiceControl
                label="Feedback marker"
                options={FEEDBACK_OPTIONS}
                value={state.feedback}
                onChange={setField("feedback")}
              />
              <SelectControl
                label="Workout identity"
                options={WORKOUT_IDENTITY_OPTIONS}
                value={state.identity}
                onChange={setField("identity")}
              />
              <ChoiceControl
                label="Title stress"
                options={TITLE_STRESS_OPTIONS}
                value={state.titleStress}
                onChange={setField("titleStress")}
              />
              <ChoiceControl
                label="Density"
                options={DENSITY_OPTIONS}
                value={state.density}
                onChange={setField("density")}
              />
              <SelectControl
                label="Future action affordance"
                options={ACTION_OPTIONS}
                value={state.action}
                onChange={setField("action")}
              />
            </div>
          </aside>
        </div>

        <div className="hito-specimen-contract">
          {[
            {
              label: "Use for",
              body: "Calendar day anatomy, mobile workout-day rows, marker hierarchy, density stress, and visual-only future authoring affordances.",
            },
            {
              label: "Do not use for",
              body: "Schedule rules, workout mutation, copy/paste behavior, recurrence expansion, protected-history decisions, or persistence.",
            },
            {
              label: "States",
              body: "Workout, rest, empty, outside-month, outside-plan/pre-start, today, selected, focus, completed, partial, skipped, evidence, feedback, protected, fixed rest.",
            },
            {
              label: "Used in",
              body: "/hitoDS reference only. Product calendar remains owned by Calendar.tsx and backend-shaped plan/workout truth.",
            },
          ].map((row) => (
            <div key={row.label} className="hito-specimen-contract-row">
              <p className="hito-micro-label">{row.label}</p>
              <p className="hito-list-row-copy">{row.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionIntroLite({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <p className="hito-label">{label}</p>
      <h2 className="hito-section-title mt-2">{title}</h2>
      <p className="hito-support-copy mt-3">{body}</p>
    </div>
  );
}

function PreviewPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="hito-surface-flat min-w-0 p-4">
      <div className="mb-4">
        <p className="hito-micro-label">{eyebrow}</p>
        <h3 className="hito-list-row-title mt-2">{title}</h3>
        <p className="hito-list-row-copy">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CalendarDaySpecimen({
  state,
  day,
  weekday,
  title,
  workout,
  dense = false,
  emphasized = false,
}: {
  state: CalendarPlaygroundState;
  day: number;
  weekday: string;
  title: string;
  workout: WorkoutIdentity;
  dense?: boolean;
  emphasized?: boolean;
}) {
  const isWorkout = state.baseState === "planned-workout";
  const isRest = state.baseState === "planned-rest";
  const isEmpty = state.baseState === "empty-no-plan";
  const isOutsideMonth = state.baseState === "outside-month";
  const isPreStart = state.baseState === "outside-plan-pre-start";
  const suppressWorkoutSemantics = isEmpty || isOutsideMonth || isPreStart;
  const showAction = state.action !== "none";

  return (
    <div
      tabIndex={state.overlay === "focused" ? 0 : undefined}
      className={cn(
        "group relative flex min-h-[7.5rem] min-w-0 flex-col border-r border-b border-hairline p-3 text-left transition-colors",
        dense ? "aspect-square min-h-0 p-2" : "aspect-[5/4]",
        emphasized && "min-h-[12rem]",
        !isOutsideMonth && !isPreStart && "hover:bg-accent/30",
        isOutsideMonth && "bg-foreground/[0.012] opacity-35",
        isPreStart && "cursor-default bg-foreground/[0.018] text-muted-foreground",
        isRest && !dense && "bg-foreground/[0.012]",
        isEmpty && "bg-background/20",
        state.overlay === "today" &&
          "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
        state.overlay === "selected" &&
          "relative z-10 bg-signal/[0.055] ring-1 ring-inset ring-signal/40",
        state.overlay === "focused" &&
          "relative z-10 outline outline-2 outline-offset-[-2px] outline-signal/40",
        state.result === "completed" && !suppressWorkoutSemantics && "bg-success/[0.04]",
        state.result === "partial" && !suppressWorkoutSemantics && "bg-warn/[0.04]",
        state.result === "skipped" && !suppressWorkoutSemantics && "bg-destructive/[0.035]",
        state.action === "paste-target" &&
          !suppressWorkoutSemantics &&
          "outline outline-1 outline-offset-[-2px] outline-signal/40",
        state.action === "protected" && "opacity-70",
      )}
      aria-label={`Calendar specimen day ${day}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className={cn(
              "font-mono-num text-xs text-muted-foreground",
              dense && "text-[0.625rem]",
              state.overlay === "today" && "text-signal",
            )}
          >
            {day}
          </span>
          {weekday ? (
            <span className="ml-1 text-[0.625rem] uppercase text-muted-foreground">{weekday}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!suppressWorkoutSemantics ? <ResultMarker result={state.result} /> : null}
          {state.feedback !== "none" && isWorkout ? (
            <FeedbackMarker state={state.feedback} calendar />
          ) : null}
        </div>
      </div>

      <div className={cn("mt-3 min-w-0", dense && "mt-2")}>
        {isWorkout && !suppressWorkoutSemantics ? (
          <WorkoutSummary title={title} workout={workout} dense={dense} />
        ) : null}
        {isRest ? <RestSummary fixedRest={state.action === "fixed-rest"} dense={dense} /> : null}
        {isEmpty ? <EmptySummary action={state.action} dense={dense} /> : null}
        {isOutsideMonth ? <OutsideSummary label="Outside month" dense={dense} /> : null}
        {isPreStart ? <OutsideSummary label="Before plan starts" dense={dense} /> : null}
      </div>

      {!dense && state.overlay === "today" ? (
        <span className="mt-auto pt-3">
          <span className="hito-status-pill" data-tone="signal" data-icon="false">
            Today
          </span>
        </span>
      ) : null}

      {!dense && showAction ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ActionAffordance action={state.action} baseState={state.baseState} />
        </div>
      ) : null}
    </div>
  );
}

function MobileDayRowSpecimen({
  state,
  day,
  month,
  weekday,
  title,
  workout,
}: {
  state: CalendarPlaygroundState;
  day: number;
  month: string;
  weekday: string;
  title: string;
  workout: WorkoutIdentity;
}) {
  const isWorkout = state.baseState === "planned-workout";
  const isRest = state.baseState === "planned-rest";
  const isEmpty = state.baseState === "empty-no-plan";
  const isOutside =
    state.baseState === "outside-month" || state.baseState === "outside-plan-pre-start";

  return (
    <div
      tabIndex={state.overlay === "focused" ? 0 : undefined}
      className={cn(
        "hito-calendar-mobile-row relative w-full items-start",
        state.overlay === "today" && "hito-calendar-mobile-row-today",
        state.result === "completed" && "hito-calendar-mobile-row-completed",
        isOutside && "hito-calendar-mobile-row-prestart",
        state.overlay === "selected" && "border-signal/45 bg-signal/[0.055]",
        state.result === "partial" && !isOutside && "bg-warn/[0.045]",
        state.result === "skipped" && !isOutside && "bg-destructive/[0.035]",
      )}
      aria-label={`Mobile calendar specimen row for ${month} ${day}`}
    >
      <span className="hito-calendar-mobile-date">
        <span>{month}</span>
        <strong>{day}</strong>
        <span>{weekday}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2 pr-8">
          {isWorkout ? (
            <>
              <WorkoutGlyph
                kind={workout.glyph}
                className="hito-calendar-type-glyph"
                style={{ color: workout.color }}
              />
              <span className="hito-label" style={{ color: workout.color }}>
                {workout.short}
              </span>
            </>
          ) : null}
          {isRest ? <span className="hito-label text-muted-foreground">Rest</span> : null}
          {isEmpty ? <span className="hito-label text-muted-foreground">No workout</span> : null}
          {state.baseState === "outside-month" ? (
            <span className="hito-label text-muted-foreground">Outside month</span>
          ) : null}
          {state.baseState === "outside-plan-pre-start" ? (
            <span className="hito-label text-muted-foreground">Before plan starts</span>
          ) : null}
          {!isOutside ? <ResultMarker result={state.result} /> : null}
        </div>

        <p className="mt-1 min-w-0 text-sm leading-snug text-foreground/90">
          {isWorkout ? title : getNonWorkoutTitle(state.baseState)}
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
          {state.feedback !== "none" && isWorkout ? (
            <FeedbackMarker state={state.feedback} />
          ) : null}
          {state.overlay === "today" ? (
            <span className="hito-status-pill" data-tone="signal" data-icon="false">
              Today
            </span>
          ) : null}
          {state.action !== "none" ? (
            <ActionAffordance action={state.action} baseState={state.baseState} compact />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkoutSummary({
  workout,
  title,
  dense,
}: {
  workout: WorkoutIdentity;
  title: string;
  dense: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <WorkoutGlyph
          kind={workout.glyph}
          className="hito-calendar-type-glyph"
          style={{ color: workout.color }}
        />
        <span
          className={cn("hito-label min-w-0 truncate", dense && "text-[0.625rem]")}
          style={{ color: workout.color }}
        >
          {workout.short}
        </span>
      </span>
      <p
        className={cn(
          "mt-1 min-w-0 text-xs leading-snug text-foreground/88",
          dense ? "line-clamp-2 text-[0.625rem]" : "line-clamp-3",
        )}
      >
        {title}
      </p>
    </div>
  );
}

function RestSummary({ fixedRest, dense }: { fixedRest: boolean; dense: boolean }) {
  return (
    <div className="min-w-0">
      <span className={cn("hito-label text-muted-foreground", dense && "text-[0.625rem]")}>
        Rest
      </span>
      {!dense && fixedRest ? (
        <p className="hito-list-row-copy mt-1">
          Fixed rest day. Editing is protected in this specimen.
        </p>
      ) : null}
    </div>
  );
}

function EmptySummary({ action, dense }: { action: FutureActionState; dense: boolean }) {
  return (
    <div className="min-w-0">
      <span className={cn("hito-label text-muted-foreground", dense && "text-[0.625rem]")}>
        Empty
      </span>
      {!dense && action === "add-workout" ? (
        <p className="hito-list-row-copy mt-1">Future add affordance only. No product mutation.</p>
      ) : null}
    </div>
  );
}

function OutsideSummary({ label, dense }: { label: string; dense: boolean }) {
  return (
    <div className="min-w-0">
      <span className={cn("hito-label text-muted-foreground", dense && "text-[0.625rem]")}>
        {label}
      </span>
      {!dense && label === "Before plan starts" ? (
        <p className="hito-list-row-copy mt-1">No workout/rest semantics apply.</p>
      ) : null}
    </div>
  );
}

function ResultMarker({ result }: { result: ResultState }) {
  if (result === "none") return null;

  const meta: Record<
    Exclude<ResultState, "none">,
    { tone: "success" | "warning" | "destructive"; icon: HitoIconName; label: string }
  > = {
    completed: { tone: "success", icon: "check", label: "Completed" },
    partial: { tone: "warning", icon: "minus", label: "Partial" },
    skipped: { tone: "destructive", icon: "close", label: "Skipped" },
  };
  const resultMeta = meta[result];

  return (
    <span
      className="hito-status-marker"
      data-size="xs"
      data-tone={resultMeta.tone}
      aria-label={resultMeta.label}
      title={resultMeta.label}
    >
      <Icon name={resultMeta.icon} size="xs" strokeWidth={2.2} />
    </span>
  );
}

function FeedbackMarker({ state, calendar = false }: { state: FeedbackState; calendar?: boolean }) {
  if (state === "none") return null;

  const label = state === "evidence_attached" ? "Evidence" : "Feedback";

  return (
    <span
      className={cn("hito-feedback-marker", calendar && "hito-calendar-feedback-marker")}
      data-state={state}
    >
      <span className="hito-feedback-marker-dot" />
      {!calendar ? <span>{label}</span> : null}
    </span>
  );
}

function ActionAffordance({
  action,
  baseState,
  compact = false,
}: {
  action: FutureActionState;
  baseState: BaseDateState;
  compact?: boolean;
}) {
  if (action === "none") return null;

  if (action === "add-workout") {
    return (
      <button
        type="button"
        className="hito-button hito-button-secondary hito-button-xs"
        disabled={baseState !== "empty-no-plan"}
      >
        <Icon name="plus" size="xs" />
        Add workout
      </button>
    );
  }

  if (action === "more-menu") {
    return (
      <button
        type="button"
        className={cn("hito-button hito-button-ghost hito-button-xs", compact && "px-2")}
        aria-label="More workout actions visual affordance"
      >
        <Icon name="cog" size="xs" />
        {!compact ? "More" : null}
      </button>
    );
  }

  if (action === "editable") {
    return <TinyPill tone="signal" icon="edit" label="Editing" />;
  }

  if (action === "copied-source") {
    return <TinyPill tone="muted" icon="copy" label="Copied source" />;
  }

  if (action === "paste-target") {
    return (
      <button
        type="button"
        className="hito-button hito-button-outlined hito-button-xs"
        data-demo-state="focus"
      >
        <Icon name="copy" size="xs" />
        Paste here
      </button>
    );
  }

  if (action === "recurring") {
    return <TinyPill tone="rollout" icon="refresh" label="Repeats" />;
  }

  if (action === "protected") {
    return <TinyPill tone="warning" icon="shield-alert" label="Protected" />;
  }

  return <TinyPill tone="muted" icon="calendar-clock" label="Fixed rest" />;
}

function TinyPill({
  tone,
  icon,
  label,
}: {
  tone: "signal" | "muted" | "warning" | "rollout";
  icon: HitoIconName;
  label: string;
}) {
  return (
    <span className="hito-status-pill" data-tone={tone}>
      <Icon name={icon} size="xs" />
      {label}
    </span>
  );
}

function ChoiceControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="hito-micro-label">{label}</p>
      <div className="hito-choice-toggle-group" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="hito-choice-toggle hito-choice-toggle-xs"
            aria-checked={value === option.value}
            data-selected={value === option.value}
            role="radio"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="hito-micro-label">{label}</span>
      <select
        className="hito-field hito-field-primary hito-field-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContractTile({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-background/35 p-3">
      <p className="hito-micro-label">{label}</p>
      <p className="hito-list-row-copy">{body}</p>
    </div>
  );
}
