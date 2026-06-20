import { type ReactNode, useMemo, useState } from "react";

import { HitoCalendarDayCell, HitoWorkoutDayRow } from "@/components/ui/hito-calendar-day";
import { HitoDsPlayground } from "@/components/hito-ds/playground";
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
  DENSITY_OPTIONS,
  FEEDBACK_OPTIONS,
  OVERLAY_OPTIONS,
  RESULT_OPTIONS,
  TITLE_STRESS_OPTIONS,
  WORKOUT_IDENTITIES,
  WORKOUT_IDENTITY_OPTIONS,
  getNonWorkoutTitle,
  getWorkoutTitle,
  type CalendarPlaygroundState,
  type FutureActionState,
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
    <HitoDsPlayground
      id="calendar-workout-playground"
      label="Calendar primitive"
      title="Shared calendar-day cells and workout rows."
      body="The primary calendar specimen renders the same HitoCalendarDayCell and HitoWorkoutDayRow primitives consumed by the product calendar."
      status="Shared primitive"
      statusTone="signal"
      controls={<ControlsBody state={state} setField={setField} />}
      demo={<CalendarDemoStage state={state} title={previewTitle} workout={workout} />}
      variants={<CalendarVariantsStage state={state} title={previewTitle} workout={workout} />}
      caption={[
        {
          label: "Proves",
          body: "Shared product day-cell and mobile-row anatomy, marker hierarchy, density stress, and add/more affordance placement.",
        },
        {
          label: "Does not imply",
          body: "Workout creation, copy/paste, recurrence, protected-history decisions, schedule rules, or persistence.",
        },
        {
          label: "Used in",
          body: "Static /hitoDS reference and the product calendar rendering seam.",
        },
      ]}
    />
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
    <div className="grid gap-5">
      <ControlGroup
        body="Pick the day state and overlay that both desktop and row specimens should mirror."
        title="Specimen state"
      >
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
          label="Density"
          options={DENSITY_OPTIONS}
          value={state.density}
          onChange={setField("density")}
        />
        <SelectControl
          label="Future action"
          options={ACTION_OPTIONS}
          value={state.action}
          onChange={setField("action")}
        />
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
        <p className="hito-form-label">{title}</p>
        <p className="hito-caption mt-1">{body}</p>
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

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
        <div className="min-w-0">
          <p className="hito-label">Demo</p>
          <h3 className="hito-list-row-title mt-1">Product day and row primitives together</h3>
          <p className="hito-caption mt-1 max-w-2xl">
            One desktop day cell and one mobile row reflect the same controlled state. This keeps
            the specimen close to product rhythm without pretending to be a full calendar route.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="neutral">
          Static display only
        </span>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start gap-2">
          <p className="hito-label text-muted-foreground">Desktop day cell</p>
          <div className="hito-calendar-grid-container min-w-0 overflow-hidden rounded-xl border border-hairline bg-background/25">
            <HitoCalendarDayCell
              action={action}
              ariaLabel="Calendar specimen desktop day"
              className="border-0"
              day="18"
              dense={state.density === "dense"}
              feedback={state.feedback}
              focused={state.overlay === "focused"}
              interactive={state.baseState !== "outside-month"}
              muted={state.baseState === "outside-month"}
              result={state.result}
              selected={state.overlay === "selected"}
              state={state.baseState}
              stateLabel={state.baseState === "empty" ? "Empty day" : undefined}
              supportingText={supportCopy}
              title={titleForState}
              today={state.overlay === "today"}
              weekday="Thu"
              workout={workout}
            />
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-2">
          <p className="hito-label text-muted-foreground">Workout day row</p>
          <HitoWorkoutDayRow
            action={action}
            ariaLabel="Calendar specimen mobile row"
            date={{ eyebrow: "Jun", day: "18", meta: "Thu" }}
            feedback={state.feedback}
            focused={state.overlay === "focused"}
            interactive={state.baseState !== "outside-month"}
            muted={state.baseState === "outside-month"}
            result={state.result}
            selected={state.overlay === "selected"}
            state={state.baseState}
            stateLabel={state.baseState === "empty" ? "Empty day" : undefined}
            supportingText={supportCopy}
            title={titleForState}
            today={state.overlay === "today"}
            workout={workout}
          />
        </div>
      </div>

      <div className="hito-row-group border-0">
        <AnatomyRow label="Desktop" body="HitoCalendarDayCell" />
        <AnatomyRow label="Mobile" body="HitoWorkoutDayRow" />
        <AnatomyRow label="Source" body="Product calendar rendering seam" />
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

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
        <div className="min-w-0">
          <p className="hito-label">Variants</p>
          <h3 className="hito-list-row-title mt-1">Calendar primitive state coverage</h3>
          <p className="hito-caption mt-1 max-w-2xl">
            A compact state matrix for the shared day and row primitives. These are specimens, not a
            replacement for the product calendar route.
          </p>
        </div>
        <span className="hito-status-pill" data-tone="neutral">
          State coverage
        </span>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {variants.map((variant) => (
          <div key={variant.label} className="grid min-w-0 content-start gap-2">
            <p className="hito-label text-muted-foreground">{variant.label}</p>
            <div className="hito-calendar-grid-container min-w-0 overflow-hidden rounded-xl border border-hairline bg-background/25">
              <HitoCalendarDayCell
                action={getActionVisual(variant.state)}
                ariaLabel={`Calendar variant ${variant.label}`}
                className="border-0"
                day={variant.day}
                dense={variant.state.density === "dense"}
                feedback={variant.state.feedback}
                focused={variant.state.overlay === "focused"}
                interactive={variant.state.baseState !== "outside-month"}
                muted={variant.state.baseState === "outside-month"}
                result={variant.state.result}
                selected={variant.state.overlay === "selected"}
                state={variant.state.baseState}
                stateLabel={variant.state.baseState === "empty" ? "Empty day" : undefined}
                supportingText={getSpecimenSupportCopy(variant.state)}
                title={getNonWorkoutAwareTitle(variant.state, variant.workout, variant.title)}
                today={variant.state.overlay === "today"}
                workout={variant.workout}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-2">
        {variants.slice(0, 3).map((variant) => (
          <HitoWorkoutDayRow
            key={`${variant.label}-row`}
            action={getActionVisual(variant.state)}
            ariaLabel={`Calendar row variant ${variant.label}`}
            date={{ eyebrow: "Jun", day: variant.day, meta: variant.weekday }}
            feedback={variant.state.feedback}
            focused={variant.state.overlay === "focused"}
            interactive={variant.state.baseState !== "outside-month"}
            muted={variant.state.baseState === "outside-month"}
            result={variant.state.result}
            selected={variant.state.overlay === "selected"}
            state={variant.state.baseState}
            stateLabel={variant.state.baseState === "empty" ? "Empty day" : undefined}
            supportingText={getSpecimenSupportCopy(variant.state)}
            title={getNonWorkoutAwareTitle(variant.state, variant.workout, variant.title)}
            today={variant.state.overlay === "today"}
            workout={variant.workout}
          />
        ))}
      </div>
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
      day: "18",
      label: "Selected workout",
      state: { ...state, action: resolveSpecimenAction(state.baseState, state.action) },
      title,
      weekday: "Thu",
      workout,
    },
    {
      day: "19",
      label: "Rest with Add",
      state: { ...base, baseState: "rest", action: "add-activity" },
      title: "Rest day",
      weekday: "Fri",
      workout: WORKOUT_IDENTITIES.recovery,
    },
    {
      day: "20",
      label: "Completed long",
      state: {
        ...base,
        baseState: "workout",
        feedback: "evidence_attached",
        identity: "long",
        result: "completed",
      },
      title: getWorkoutTitle(WORKOUT_IDENTITIES.long, "short"),
      weekday: "Sat",
      workout: WORKOUT_IDENTITIES.long,
    },
    {
      day: "21",
      label: "More actions",
      state: { ...base, baseState: "workout", action: "more-menu", identity: "tempo" },
      title: getWorkoutTitle(WORKOUT_IDENTITIES.tempo, "short"),
      weekday: "Sun",
      workout: WORKOUT_IDENTITIES.tempo,
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
  if (state.baseState === "empty") return "Empty authorable day";
  return "Outside the current month";
}

function AnatomyRow({ body, label }: { body: string; label: string }) {
  return (
    <div className="hito-list-row py-3">
      <span className="hito-list-row-title">{label}</span>
      <code className="hito-technical-mono text-xs text-muted-foreground">{body}</code>
    </div>
  );
}

function resolveSpecimenAction(
  baseState: CalendarPlaygroundState["baseState"],
  requestedAction: FutureActionState,
  explicitAction?: FutureActionState,
): FutureActionState {
  if (explicitAction) return explicitAction;

  if (requestedAction === "more-menu" && (baseState === "workout" || baseState === "rest")) {
    return "more-menu";
  }

  if (requestedAction === "add-activity" && (baseState === "empty" || baseState === "rest")) {
    return "add-activity";
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
      <p className="hito-form-label">{label}</p>
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
      <p className="hito-form-label">{label}</p>
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
