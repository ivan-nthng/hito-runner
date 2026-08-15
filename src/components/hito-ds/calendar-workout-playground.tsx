import { type ReactNode, useMemo, useState } from "react";

import { HitoCalendarDayCell, HitoWorkoutDayRow } from "@/components/ui/hito-calendar-day";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
import {
  HitoDsWorkbenchChoiceControl as ChoiceControl,
  HitoDsWorkbenchSelectControl as SelectControl,
} from "@/components/hito-ds/workbench-settings-controls";
import {
  ACTION_OPTIONS,
  BASE_STATE_OPTIONS,
  DEFAULT_PLAYGROUND_STATE,
  DENSITY_OPTIONS,
  FEEDBACK_OPTIONS,
  INTERACTION_MODE_OPTIONS,
  OVERLAY_OPTIONS,
  RESULT_OPTIONS,
  TITLE_STRESS_OPTIONS,
  UNDO_PROGRESS_OPTIONS,
  VIEW_MODE_OPTIONS,
  WORKOUT_IDENTITIES,
  WORKOUT_IDENTITY_OPTIONS,
  getNonWorkoutTitle,
  getWorkoutTitle,
  type CalendarActionState,
  type CalendarPlaygroundState,
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
  const setAction = (action: CalendarActionState) => {
    setState((current) => ({
      ...current,
      action,
      baseState: action === "timed-undo" ? "rest" : current.baseState,
    }));
  };
  const setBaseState = (baseState: CalendarPlaygroundState["baseState"]) => {
    setState((current) => ({
      ...current,
      baseState,
      action: current.action === "timed-undo" && baseState !== "rest" ? "none" : current.action,
    }));
  };

  return (
    <HitoDsPlayground
      id="calendar-workout-playground"
      label="Calendar primitive"
      status="Shared primitive"
      statusTone="signal"
      description={{
        purpose:
          "Render shared desktop day cells and mobile workout rows from explicit calendar presentation state.",
        useWhen:
          "A calendar consumer already owns date, workout, result, feedback, and interaction eligibility truth.",
        avoidWhen:
          "The UI would need the primitive to decide schedule, persistence, route action, or workout meaning.",
        accessibility:
          "Interactive state, focus, readable labels, markers, and timed-action presentation remain explicit across desktop and mobile renderers.",
      }}
      usedIn="Product calendar day cells and mobile workout rows."
      controls={
        <ControlsBody
          state={state}
          setAction={setAction}
          setBaseState={setBaseState}
          setField={setField}
        />
      }
      demo={<CalendarDemoStage state={state} title={previewTitle} workout={workout} />}
      variants={<CalendarVariantsStage state={state} title={previewTitle} workout={workout} />}
    />
  );
}

function ControlsBody({
  state,
  setAction,
  setBaseState,
  setField,
}: {
  state: CalendarPlaygroundState;
  setAction: (value: CalendarActionState) => void;
  setBaseState: (value: CalendarPlaygroundState["baseState"]) => void;
  setField: <Key extends keyof CalendarPlaygroundState>(
    key: Key,
  ) => (value: CalendarPlaygroundState[Key]) => void;
}) {
  return (
    <div className="grid gap-5">
      <ControlGroup
        body="Switch the live specimen between the two product renderers."
        title="Preview"
      >
        <ChoiceControl
          label="Responsive context"
          options={VIEW_MODE_OPTIONS}
          value={state.viewMode}
          onChange={setField("viewMode")}
        />
      </ControlGroup>

      <ControlGroup body="Pick the day state and interaction overlay." title="Specimen state">
        <ChoiceControl
          label="Base date state"
          options={BASE_STATE_OPTIONS}
          value={state.baseState}
          onChange={setBaseState}
        />
        <ChoiceControl
          label="Interaction overlay"
          options={OVERLAY_OPTIONS}
          value={state.overlay}
          onChange={setField("overlay")}
        />
      </ControlGroup>

      <ControlGroup body="Show only the markers that the shared primitive owns." title="Markers">
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
      </ControlGroup>

      <ControlGroup body="Stress content without inventing calendar behavior." title="Content">
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
      </ControlGroup>

      <ControlGroup
        body="Action and density mirror the shared day-cell contract, not product mutation truth."
        title="Behavior"
      >
        <ChoiceControl
          label="Presentation contract"
          options={INTERACTION_MODE_OPTIONS}
          value={state.interaction}
          onChange={setField("interaction")}
        />
        <ChoiceControl
          label="Density"
          options={DENSITY_OPTIONS}
          value={state.density}
          onChange={setField("density")}
        />
        <SelectControl
          label="Action"
          options={ACTION_OPTIONS}
          value={state.action}
          onChange={setAction}
        />
        {state.action === "timed-undo" ? (
          <ChoiceControl
            label="External progress"
            options={UNDO_PROGRESS_OPTIONS}
            value={state.undoProgress}
            onChange={setField("undoProgress")}
          />
        ) : null}
      </ControlGroup>
    </div>
  );
}

function ControlGroup({
  body,
  children,
  title,
}: {
  body: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="hito-label-md">{title}</p>
        <p className="hito-body-xs text-tertiary mt-1">{body}</p>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function CalendarDemoStage({
  state,
  title,
  workout,
}: {
  state: CalendarPlaygroundState;
  title: string;
  workout: WorkoutIdentity;
}) {
  const titleForState = getNonWorkoutAwareTitle(state, workout, title);
  const supportCopy = getSpecimenSupportCopy(state);
  const action = getActionVisual(state);

  if (state.viewMode === "mobile") {
    return (
      <div className="mx-auto w-full max-w-xl">
        <HitoWorkoutDayRow
          action={action}
          ariaLabel="Calendar specimen mobile row"
          date={{ eyebrow: "Jun", day: "18", meta: "Thu" }}
          feedback={state.feedback}
          focused={state.overlay === "focused"}
          interactive={state.interaction === "interactive"}
          muted={state.baseState === "outside-month"}
          result={state.result}
          selected={state.overlay === "selected"}
          state={state.baseState}
          stateLabel={state.baseState === "empty" ? "No workout" : undefined}
          supportingText={supportCopy}
          title={titleForState}
          today={state.overlay === "today"}
          workout={workout}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-56">
      <div className="hito-calendar-grid-container min-w-0 overflow-hidden border border-hairline bg-background/25">
        <HitoCalendarDayCell
          action={action}
          ariaLabel="Calendar specimen desktop day"
          className="border-0"
          day="18"
          dense={state.density === "dense"}
          feedback={state.feedback}
          focused={state.overlay === "focused"}
          interactive={state.interaction === "interactive"}
          muted={state.baseState === "outside-month"}
          result={state.result}
          selected={state.overlay === "selected"}
          state={state.baseState}
          stateLabel={state.baseState === "empty" ? "No workout" : undefined}
          supportingText={supportCopy}
          title={titleForState}
          today={state.overlay === "today"}
          weekday="Thu"
          workout={workout}
        />
      </div>
    </div>
  );
}

function CalendarVariantsStage({
  state,
  title,
  workout,
}: {
  state: CalendarPlaygroundState;
  title: string;
  workout: WorkoutIdentity;
}) {
  const variants = buildCalendarVariants(state, workout, title);

  if (state.viewMode === "mobile") {
    return (
      <div className="mx-auto grid w-full max-w-xl min-w-0 gap-2" inert>
        {variants.map((variant) => (
          <HitoWorkoutDayRow
            key={`${variant.label}-row`}
            action={getActionVisual(variant.state)}
            ariaLabel={`Calendar row variant ${variant.label}`}
            date={{ eyebrow: "Jun", day: variant.day, meta: variant.weekday }}
            feedback={variant.state.feedback}
            focused={variant.state.overlay === "focused"}
            interactive={variant.state.interaction === "interactive"}
            muted={variant.state.baseState === "outside-month"}
            result={variant.state.result}
            selected={variant.state.overlay === "selected"}
            state={variant.state.baseState}
            stateLabel={variant.state.baseState === "empty" ? "No workout" : undefined}
            supportingText={getSpecimenSupportCopy(variant.state)}
            title={getNonWorkoutAwareTitle(variant.state, variant.workout, variant.title)}
            today={variant.state.overlay === "today"}
            workout={variant.workout}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3" inert>
      {variants.map((variant) => (
        <div key={variant.label} className="min-w-0">
          <div className="hito-calendar-grid-container min-w-0 overflow-hidden border border-hairline bg-background/25">
            <HitoCalendarDayCell
              action={getActionVisual(variant.state)}
              ariaLabel={`Calendar variant ${variant.label}`}
              className="border-0"
              day={variant.day}
              dense={variant.state.density === "dense"}
              feedback={variant.state.feedback}
              focused={variant.state.overlay === "focused"}
              interactive={variant.state.interaction === "interactive"}
              muted={variant.state.baseState === "outside-month"}
              result={variant.state.result}
              selected={variant.state.overlay === "selected"}
              state={variant.state.baseState}
              stateLabel={variant.state.baseState === "empty" ? "No workout" : undefined}
              supportingText={getSpecimenSupportCopy(variant.state)}
              title={getNonWorkoutAwareTitle(variant.state, variant.workout, variant.title)}
              today={variant.state.overlay === "today"}
              weekday={variant.weekday}
              workout={variant.workout}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type CalendarVariant = {
  day: string;
  label: string;
  state: CalendarPlaygroundState;
  title: string;
  weekday: string;
  workout: WorkoutIdentity;
};

function buildCalendarVariants(
  state: CalendarPlaygroundState,
  workout: WorkoutIdentity,
  title: string,
): CalendarVariant[] {
  const base: CalendarPlaygroundState = {
    ...DEFAULT_PLAYGROUND_STATE,
    viewMode: "desktop",
    titleStress: "short",
    density: state.density,
    result: "none",
    feedback: "none",
    overlay: "none",
    action: "none",
  };

  return [
    {
      day: "17",
      label: "Previous completed workout",
      state: {
        ...base,
        baseState: "workout",
        feedback: "evidence_attached",
        identity: "easy",
        result: "completed",
      },
      title: getWorkoutTitle(WORKOUT_IDENTITIES.easy, "short"),
      weekday: "Wed",
      workout: WORKOUT_IDENTITIES.easy,
    },
    {
      day: "18",
      label: "Selected workout",
      state: { ...state, action: resolveSpecimenAction(state.baseState, state.action) },
      title,
      weekday: "Thu",
      workout,
    },
    {
      day: "19",
      label: "Next rest day",
      state: { ...base, baseState: "rest", action: "add-activity" },
      title: "Rest day",
      weekday: "Fri",
      workout: WORKOUT_IDENTITIES.recovery,
    },
  ];
}

function getSpecimenSupportCopy(state: CalendarPlaygroundState) {
  if (state.baseState === "workout") {
    if (state.feedback === "feedback_ready") return "Feedback ready";
    if (state.feedback === "evidence_attached") return "Evidence attached";
    if (state.result === "completed") return "Completed from persisted truth";
    if (state.result === "partial") return "Partially completed";
    if (state.result === "skipped") return "Skipped";
    return "Planned workout";
  }

  if (state.baseState === "rest") return "Calm editable rest state";
  if (state.baseState === "empty") return "No-workout authorable day";
  return "Outside the current month";
}

function resolveSpecimenAction(
  baseState: CalendarPlaygroundState["baseState"],
  requestedAction: CalendarActionState,
  explicitAction?: CalendarActionState,
): CalendarActionState {
  if (explicitAction) return explicitAction;

  if (requestedAction === "more-menu" && (baseState === "workout" || baseState === "rest")) {
    return "more-menu";
  }

  if (requestedAction === "add-activity" && (baseState === "empty" || baseState === "rest")) {
    return "add-activity";
  }

  if (requestedAction === "timed-undo" && baseState === "rest") {
    return "timed-undo";
  }

  return "none";
}

function getNonWorkoutAwareTitle(
  state: CalendarPlaygroundState,
  workout: WorkoutIdentity,
  workoutTitle = getWorkoutTitle(workout, "short"),
) {
  if (state.baseState === "workout") {
    return workoutTitle;
  }

  return getNonWorkoutTitle(state.baseState);
}

function getActionVisual(state: CalendarPlaygroundState) {
  if (state.action === "none") return null;

  if (state.action === "add-activity") {
    return {
      label: "Add",
      icon: "plus",
      trailingIcon: "chevron-down",
      button: "secondary",
      disabled: state.baseState !== "empty" && state.baseState !== "rest",
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

  if (state.action === "timed-undo") {
    if (state.baseState !== "rest") return null;

    const progress = Number(state.undoProgress) / 100;
    const secondsRemaining = Math.max(0, Math.ceil(7 * (1 - progress)));

    return {
      label: `Undo ${secondsRemaining}`,
      icon: "refresh",
      tone: "signal",
      visual: "button",
      visualButton: "ghost",
      motionState: "timed-progress",
      progress,
      alwaysVisible: true,
      showCompactLabel: true,
      ariaLabel: `Undo move. ${secondsRemaining} seconds remaining.`,
    } as const;
  }

  return null;
}
