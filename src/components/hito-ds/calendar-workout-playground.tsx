import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { HitoCalendarDayCell, HitoWorkoutDayRow } from "@/components/ui/hito-calendar-day";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  VIEW_MODE_OPTIONS,
  WORKOUT_IDENTITIES,
  WORKOUT_IDENTITY_OPTIONS,
  getNonWorkoutTitle,
  getWorkoutTitle,
  type CalendarPlaygroundState,
  type Option,
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
        <details className="hito-disclosure" open>
          <summary className="hito-disclosure-summary">
            <span>Playground controls</span>
            <Icon name="chevron-down" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            <ControlsBody state={state} setField={setField} />
          </div>
        </details>

        <article className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
            <div className="min-w-0">
              <p className="hito-micro-label">
                {state.viewMode === "desktop" ? "Desktop preview" : "Mobile preview"}
              </p>
              <h3 className="hito-list-row-title mt-1">
                {state.density === "dense" ? "Density stress" : "Controlled day state"}
              </h3>
              <p className="hito-list-row-copy mt-1 max-w-3xl">
                One controlled calendar/workout preview. Future authoring affordances are visual
                only and do not create, edit, copy, paste, repeat, or persist workouts.
              </p>
            </div>
            <span className="hito-status-pill" data-tone="neutral" data-icon="false">
              Static display only
            </span>
          </div>

          <div className="mt-4 min-w-0">
            {state.viewMode === "desktop" ? (
              <DesktopCalendarPreview state={state} title={previewTitle} workout={workout} />
            ) : (
              <MobileCalendarPreview state={state} title={previewTitle} workout={workout} />
            )}
          </div>
        </article>

        <div className="hito-specimen-contract">
          {[
            {
              label: "Use for",
              body: "Calendar day anatomy, mobile workout-day rows, marker hierarchy, row-height stress, and visual-only future add/more affordance placeholders.",
            },
            {
              label: "Do not use for",
              body: "Schedule rules, workout mutation, copy/paste behavior, recurrence expansion, protected-history decisions, or persistence.",
            },
            {
              label: "States",
              body: "Workout, rest, empty, outside-month, today, selected, focus, completed, partial, skipped, evidence, feedback, occupied-day more placeholder, and empty-day add placeholder.",
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

function ControlsBody({
  state,
  setField,
}: {
  state: CalendarPlaygroundState;
  setField: <Key extends keyof CalendarPlaygroundState>(
    key: Key,
  ) => (value: CalendarPlaygroundState[Key]) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ChoiceControl
        label="Preview mode"
        options={VIEW_MODE_OPTIONS}
        value={state.viewMode}
        onChange={setField("viewMode")}
      />
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

function DesktopCalendarPreview({
  state,
  title,
  workout,
}: {
  state: CalendarPlaygroundState;
  title: string;
  workout: WorkoutIdentity;
}) {
  const days = state.density === "dense" ? DENSE_GRID_DAYS : buildDesktopPreviewDays();

  return (
    <div className="hito-calendar-grid-container min-w-0 overflow-hidden rounded-xl border border-hairline bg-background/25">
      <div className="hito-calendar-grid-seven">
        <div
          className={
            state.density === "dense"
              ? "hito-calendar-grid hito-calendar-grid-month hito-calendar-grid-month-dense"
              : "hito-calendar-grid hito-calendar-grid-month"
          }
        >
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
            <span key={weekday} className="hito-calendar-grid-heading hito-micro-label">
              {weekday}
            </span>
          ))}
          {days.map((dayState, index) => {
            const mergedState =
              state.density === "dense"
                ? buildDenseGridState(dayState, index, state)
                : buildDesktopGridState(dayState, state);
            const mergedWorkout =
              index === 3 && state.density !== "dense"
                ? workout
                : WORKOUT_IDENTITIES[mergedState.identity];

            return (
              <HitoCalendarDayCell
                key={`${dayState.day}-${index}`}
                ariaLabel={`Calendar specimen day ${dayState.day}`}
                action={getActionVisual(mergedState)}
                day={String(dayState.day)}
                dense={state.density === "dense"}
                feedback={mergedState.feedback}
                muted={mergedState.baseState === "outside-month"}
                interactive={mergedState.baseState !== "outside-month"}
                focused={mergedState.overlay === "focused"}
                selected={mergedState.overlay === "selected"}
                state={mergedState.baseState}
                today={mergedState.overlay === "today"}
                result={mergedState.result}
                title={
                  index === 3 && state.density !== "dense"
                    ? title
                    : getWorkoutTitle(mergedWorkout, "short")
                }
                workout={mergedWorkout}
              />
            );
          })}
        </div>
      </div>

      <div className="hito-calendar-grid-list p-3">
        {days.map((dayState, index) => {
          const mergedState =
            state.density === "dense"
              ? buildDenseGridState(dayState, index, state)
              : buildDesktopGridState(dayState, state);
          const mergedWorkout =
            index === 3 && state.density !== "dense"
              ? workout
              : WORKOUT_IDENTITIES[mergedState.identity];

          return (
            <HitoWorkoutDayRow
              key={`${dayState.day}-${index}`}
              action={getActionVisual(mergedState)}
              date={{ day: String(dayState.day).padStart(2, "0") }}
              feedback={mergedState.feedback}
              focused={mergedState.overlay === "focused"}
              muted={mergedState.baseState === "outside-month"}
              selected={mergedState.overlay === "selected"}
              state={mergedState.baseState}
              today={mergedState.overlay === "today"}
              result={mergedState.result}
              title={getNonWorkoutAwareTitle(mergedState, mergedWorkout)}
              workout={mergedWorkout}
            />
          );
        })}
      </div>
    </div>
  );
}

function MobileCalendarPreview({
  state,
  title,
  workout,
}: {
  state: CalendarPlaygroundState;
  title: string;
  workout: WorkoutIdentity;
}) {
  const rows =
    state.density === "dense"
      ? DENSE_GRID_DAYS
      : [
          { day: 17, baseState: "rest" as const },
          { day: 18 },
          { day: 19, baseState: "empty" as const, action: "add-activity" as const },
        ];

  return (
    <div className="grid min-w-0 gap-2">
      {state.density === "dense" ? (
        <div className="hito-calendar-mobile-row">
          <span className="hito-calendar-mobile-date">
            <span>Jun</span>
            <strong>1-7</strong>
            <span>Week</span>
          </span>
          <div className="min-w-0">
            <p className="hito-label text-muted-foreground">Mobile density stress</p>
            <p className="hito-list-row-copy">Rows stay stacked instead of forcing a tiny grid.</p>
          </div>
        </div>
      ) : null}
      {rows.map((dayState, index) => {
        const mergedState =
          state.density === "dense"
            ? buildDenseGridState(dayState, index, state)
            : buildMobilePreviewState(dayState, index, state);
        const mergedWorkout =
          index === 1 && state.density !== "dense"
            ? workout
            : WORKOUT_IDENTITIES[mergedState.identity];

        return (
          <HitoWorkoutDayRow
            key={`${dayState.day}-${index}`}
            ariaLabel={`Mobile calendar specimen row for Jun ${dayState.day}`}
            action={getActionVisual(mergedState)}
            date={{
              eyebrow: "Jun",
              day: String(dayState.day),
              meta: index === 1 && state.density !== "dense" ? "Thu" : undefined,
            }}
            feedback={mergedState.feedback}
            interactive={mergedState.baseState !== "outside-month"}
            focused={mergedState.overlay === "focused"}
            muted={mergedState.baseState === "outside-month"}
            selected={mergedState.overlay === "selected"}
            state={mergedState.baseState}
            today={mergedState.overlay === "today"}
            result={mergedState.result}
            title={
              index === 1 && state.density !== "dense"
                ? title
                : getWorkoutTitle(mergedWorkout, "short")
            }
            workout={mergedWorkout}
          />
        );
      })}
    </div>
  );
}

function buildDesktopPreviewDays() {
  return [
    { day: 15, baseState: "outside-month" as const },
    { day: 16, baseState: "workout" as const, identity: "recovery" as const },
    { day: 17, baseState: "rest" as const },
    { day: 18 },
    { day: 19, baseState: "empty" as const, action: "add-activity" as const },
    { day: 20, baseState: "workout" as const, identity: "long" as const },
    { day: 21, baseState: "outside-month" as const },
  ];
}

function buildDesktopGridState(
  dayState: Partial<CalendarPlaygroundState> & { day: number },
  state: CalendarPlaygroundState,
): CalendarPlaygroundState {
  if (dayState.day === 18) {
    return state;
  }

  return {
    ...DEFAULT_PLAYGROUND_STATE,
    viewMode: state.viewMode,
    overlay: "none",
    result: "none",
    feedback: "none",
    action: "none",
    titleStress: "short",
    density: "normal",
    ...dayState,
  };
}

function buildMobilePreviewState(
  dayState: Partial<CalendarPlaygroundState> & { day: number },
  index: number,
  state: CalendarPlaygroundState,
): CalendarPlaygroundState {
  if (index === 1) return state;

  return {
    ...DEFAULT_PLAYGROUND_STATE,
    viewMode: state.viewMode,
    overlay: "none",
    result: "none",
    feedback: "none",
    action: "none",
    titleStress: "short",
    density: "normal",
    ...dayState,
  };
}

function buildDenseGridState(
  dayState: Partial<CalendarPlaygroundState>,
  index: number,
  state: CalendarPlaygroundState,
): CalendarPlaygroundState {
  if (index === 9) {
    return {
      ...state,
      density: "dense",
    };
  }

  return {
    ...DEFAULT_PLAYGROUND_STATE,
    viewMode: state.viewMode,
    overlay: "none",
    result: "none",
    feedback: "none",
    action: "none",
    titleStress: "short",
    density: "dense",
    ...dayState,
  };
}

function getNonWorkoutAwareTitle(state: CalendarPlaygroundState, workout: WorkoutIdentity) {
  if (state.baseState === "workout") {
    return getWorkoutTitle(workout, "short");
  }

  return getNonWorkoutTitle(state.baseState);
}

function getActionVisual(state: CalendarPlaygroundState) {
  if (state.action === "none") return null;

  if (state.action === "add-activity") {
    return {
      label: "Add",
      icon: "plus",
      button: "secondary",
      disabled: state.baseState !== "empty",
      ariaLabel: "Add activity placeholder",
    };
  }

  if (state.action === "more-menu") {
    if (state.baseState !== "workout" && state.baseState !== "rest") return null;

    return {
      label: "More activity actions",
      icon: "more-horizontal",
      button: "icon-ghost",
      ariaLabel: "More activity actions",
    };
  }

  return null;
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
    <div className="grid gap-2">
      <p className="hito-micro-label">{label}</p>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger aria-label={label} className="hito-field-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
