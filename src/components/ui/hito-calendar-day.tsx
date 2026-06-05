import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";
import { cn } from "@/lib/utils";

export type HitoCalendarDayBaseState = "workout" | "rest" | "empty" | "outside-month";

export type HitoCalendarDayResultState = "none" | "planned" | "completed" | "partial" | "skipped";
export type HitoCalendarFeedbackState = "none" | "evidence_attached" | "feedback_ready";

export type HitoCalendarWorkoutIdentity = {
  label: string;
  short?: string;
  color: string;
  glyph: WorkoutGlyphKind;
};

type HitoCalendarActionVisual = {
  label: string;
  icon?: HitoIconName;
  tone?: "signal" | "muted" | "warning" | "rollout";
  button?: "secondary" | "ghost" | "icon-ghost" | "outlined";
  disabled?: boolean;
  ariaLabel?: string;
  focusDemo?: boolean;
};

type HitoCalendarDateParts = {
  eyebrow?: string;
  day: string;
  meta?: string;
};

type SharedVisualProps = {
  state: HitoCalendarDayBaseState;
  workout?: HitoCalendarWorkoutIdentity | null;
  title?: string;
  supportingText?: string | null;
  result?: HitoCalendarDayResultState;
  feedback?: HitoCalendarFeedbackState;
  action?: HitoCalendarActionVisual | null;
  today?: boolean;
  selected?: boolean;
  focused?: boolean;
  muted?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
};

type HitoCalendarDayCellProps = SharedVisualProps & {
  day: string;
  weekday?: string;
  dense?: boolean;
  layout?: "month" | "week";
};

type HitoWorkoutDayRowProps = SharedVisualProps & {
  date?: HitoCalendarDateParts;
};

export function HitoCalendarDayCell({
  action,
  ariaLabel,
  className,
  day,
  dense = false,
  feedback = "none",
  focused = false,
  interactive = false,
  layout = "month",
  muted = false,
  result = "none",
  selected = false,
  state,
  supportingText,
  title,
  today = false,
  weekday,
  workout,
}: HitoCalendarDayCellProps) {
  const week = layout === "week";
  const showWorkoutMarkers = state === "workout";
  const cornerAction = action?.button === "icon-ghost";

  return (
    <div
      data-hito-calendar-day-cell=""
      data-hito-calendar-day-state={state}
      tabIndex={focused ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        "relative h-full min-w-0 border-hairline text-left transition-colors",
        action && "group/hito-calendar-day",
        week
          ? "flex min-h-[170px] flex-col border-b p-4 lg:border-r lg:border-b-0"
          : "flex min-h-[8rem] flex-col border-r border-b p-2.5 xl:p-3",
        dense && !week && "min-h-0 p-2",
        interactive && "hover:bg-accent/40 group-hover:bg-accent/40",
        muted && "opacity-30",
        state === "outside-month" && "bg-foreground/[0.012]",
        state === "rest" && !dense && "bg-foreground/[0.012]",
        state === "empty" && "bg-background/20",
        today && "relative z-10 outline outline-1 outline-offset-[-1px] outline-signal/60",
        selected && "relative z-10 bg-signal/[0.055] ring-1 ring-inset ring-signal/40",
        focused && "relative z-10 outline outline-2 outline-offset-[-2px] outline-signal/40",
        interactive &&
          "group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[-2px] group-focus-visible:outline-signal/40",
        result === "completed" && showWorkoutMarkers && "bg-success/[0.04]",
        result === "partial" && showWorkoutMarkers && "bg-warn/[0.04]",
        result === "skipped" && showWorkoutMarkers && "bg-destructive/[0.035]",
        action?.focusDemo && "outline outline-1 outline-offset-[-2px] outline-signal/40",
        action?.tone === "warning" && "opacity-75",
        className,
      )}
    >
      <CellHeader
        day={day}
        dense={dense}
        result={showWorkoutMarkers ? result : "none"}
        reserveActionSpace={cornerAction}
        today={today}
        week={week}
        weekday={weekday}
      />

      <CalendarDayBody
        dense={dense}
        layout={layout}
        result={result}
        state={state}
        supportingText={supportingText}
        title={title}
        workout={workout}
      />

      {!dense && action && !cornerAction ? (
        <div
          className={cn(
            "mt-auto flex flex-wrap items-center gap-2 pt-3 transition-opacity",
            !action.focusDemo &&
              "opacity-0 group-hover/hito-calendar-day:opacity-100 group-focus-within/hito-calendar-day:opacity-100",
          )}
        >
          <ActionVisual action={action} />
        </div>
      ) : null}

      {cornerAction ? (
        <div
          className={cn(
            "absolute z-20 transition-opacity",
            week ? "right-3 top-3" : dense ? "right-1.5 top-1.5" : "right-2 top-2",
            !action.focusDemo &&
              "opacity-0 group-hover/hito-calendar-day:opacity-100 group-focus-within/hito-calendar-day:opacity-100",
          )}
        >
          <ActionVisual action={action} compact />
        </div>
      ) : null}

      {showWorkoutMarkers && feedback !== "none" ? (
        <FeedbackMarker calendar className="absolute bottom-2.5 right-2.5 z-20" state={feedback} />
      ) : null}
    </div>
  );
}

export function HitoWorkoutDayRow({
  action,
  ariaLabel,
  className,
  date,
  feedback = "none",
  focused = false,
  interactive = false,
  muted = false,
  result = "none",
  selected = false,
  state,
  supportingText,
  title,
  today = false,
  workout,
}: HitoWorkoutDayRowProps) {
  const outside = state === "outside-month";
  const showWorkoutMarkers = state === "workout" && !outside;
  const cornerAction = action?.button === "icon-ghost";

  return (
    <div
      data-hito-workout-day-row=""
      data-hito-calendar-day-state={state}
      tabIndex={focused ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        "hito-calendar-mobile-row relative w-full items-start",
        interactive && "group-focus-visible:border-signal/45",
        today && "hito-calendar-mobile-row-today",
        result === "completed" && showWorkoutMarkers && "hito-calendar-mobile-row-completed",
        outside && "hito-calendar-mobile-row-muted",
        muted && "opacity-60",
        selected && "border-signal/45 bg-signal/[0.055]",
        result === "partial" && showWorkoutMarkers && "bg-warn/[0.045]",
        result === "skipped" && showWorkoutMarkers && "bg-destructive/[0.035]",
        className,
      )}
    >
      {date ? (
        <span className="hito-calendar-mobile-date">
          {date.eyebrow ? <span>{date.eyebrow}</span> : null}
          <span className="hito-calendar-mobile-date-main">
            <strong>{date.day}</strong>
            {showWorkoutMarkers ? <ResultMarker result={result} /> : null}
          </span>
          {date.meta ? <span>{date.meta}</span> : null}
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <div
          className={cn("flex min-w-0 flex-wrap items-center gap-2 pr-8", cornerAction && "pr-10")}
        >
          {state === "workout" && workout ? <WorkoutLabel workout={workout} /> : null}
          {state !== "workout" ? <StateLabel state={state} workout={workout} /> : null}
        </div>

        {title ? (
          <p
            className={cn(
              "mt-1 min-w-0 text-sm leading-snug text-foreground/90",
              cornerAction && "pr-10",
              result === "skipped" && "line-through opacity-50",
            )}
          >
            {title}
          </p>
        ) : null}

        <SupportingText technical={state === "workout"}>{supportingText}</SupportingText>

        {feedback !== "none" || (action && !cornerAction) ? (
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
            {showWorkoutMarkers && feedback !== "none" ? <FeedbackMarker state={feedback} /> : null}
            {action && !cornerAction ? <ActionVisual action={action} compact /> : null}
          </div>
        ) : null}
      </div>

      {cornerAction ? (
        <div className="absolute right-3 top-3 z-20">
          <ActionVisual action={action} compact />
        </div>
      ) : null}
    </div>
  );
}

function CellHeader({
  day,
  dense,
  result,
  reserveActionSpace,
  today,
  week,
  weekday,
}: {
  day: string;
  dense: boolean;
  result: HitoCalendarDayResultState;
  reserveActionSpace: boolean;
  today: boolean;
  week: boolean;
  weekday?: string;
}) {
  if (week) {
    return (
      <div className="hito-micro-label flex items-center justify-between">
        <span>{weekday}</span>
        <span className={cn("flex items-center gap-1.5", reserveActionSpace && "pr-7")}>
          <span className="hito-technical-mono">{day}</span>
          <ResultMarker result={result} />
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", reserveActionSpace && "pr-7")}>
      <span
        className={cn(
          "hito-technical-mono text-muted-foreground",
          dense && "text-[0.625rem]",
          today && "text-signal",
        )}
      >
        {day}
      </span>
      {weekday ? (
        <span className="ml-1 text-[0.625rem] uppercase text-muted-foreground">{weekday}</span>
      ) : null}
      <ResultMarker result={result} />
    </div>
  );
}

function CalendarDayBody({
  dense,
  layout,
  result,
  state,
  supportingText,
  title,
  workout,
}: {
  dense: boolean;
  layout: "month" | "week";
  result: HitoCalendarDayResultState;
  state: HitoCalendarDayBaseState;
  supportingText?: string | null;
  title?: string;
  workout?: HitoCalendarWorkoutIdentity | null;
}) {
  const week = layout === "week";
  const bodyClass = cn("mt-3 min-w-0", week && "flex flex-1 flex-col", dense && "mt-2");

  return (
    <div className={bodyClass}>
      {state === "workout" && workout ? (
        <>
          <WorkoutLabel muted={result === "skipped"} workout={workout} />
          {title ? (
            <div
              className={cn(
                week
                  ? "mt-1 text-sm leading-snug"
                  : "hito-body-small mt-1.5 line-clamp-2 text-foreground/85",
                dense && "sr-only",
              )}
            >
              {title}
            </div>
          ) : null}
          {week ? <SupportingText footer>{supportingText}</SupportingText> : null}
        </>
      ) : (
        <>
          <StateLabel dense={dense} state={state} workout={workout} />
          {!dense ? <SupportingText technical={false}>{supportingText}</SupportingText> : null}
        </>
      )}
    </div>
  );
}

function SupportingText({
  children,
  footer = false,
  technical = true,
}: {
  children?: string | null;
  footer?: boolean;
  technical?: boolean;
}) {
  if (!children) return null;

  return (
    <div
      className={cn(
        technical ? "hito-technical-mono text-muted-foreground" : "hito-list-row-copy",
        footer ? "mt-auto pt-3" : "mt-2",
      )}
    >
      {children}
    </div>
  );
}

function WorkoutLabel({
  muted = false,
  workout,
}: {
  muted?: boolean;
  workout: HitoCalendarWorkoutIdentity;
}) {
  return (
    <span
      className={cn(
        "hito-micro-label inline-flex max-w-full min-w-0 items-center gap-1.5",
        muted && "line-through opacity-50",
      )}
      style={{ color: workout.color }}
    >
      <WorkoutGlyph kind={workout.glyph} className="hito-calendar-type-glyph" />
      <span className="truncate">{workout.short ?? workout.label}</span>
    </span>
  );
}

function StateLabel({
  dense = false,
  state,
  workout,
}: {
  dense?: boolean;
  state: HitoCalendarDayBaseState;
  workout?: HitoCalendarWorkoutIdentity | null;
}) {
  if (state === "rest" && workout) {
    return <WorkoutLabel workout={workout} />;
  }

  return (
    <span className={cn("hito-label text-muted-foreground", dense && "text-[0.625rem]")}>
      {stateLabel(state, dense)}
    </span>
  );
}

function stateLabel(state: HitoCalendarDayBaseState, dense: boolean) {
  if (state === "workout") return "Workout";
  if (state === "rest") return "Rest";
  if (state === "empty") return dense ? "Empty" : "No workout";
  return dense ? "Outside" : "Outside month";
}

function ResultMarker({ result }: { result: HitoCalendarDayResultState }) {
  if (result === "none") return null;

  const meta: Record<
    Exclude<HitoCalendarDayResultState, "none">,
    { tone: "success" | "warning" | "destructive" | "muted"; icon: HitoIconName; label: string }
  > = {
    planned: { tone: "muted", icon: "minus", label: "Planned" },
    completed: { tone: "success", icon: "check", label: "Completed" },
    partial: { tone: "warning", icon: "minus", label: "Partial" },
    skipped: { tone: "destructive", icon: "close", label: "Skipped" },
  };
  const { icon, label, tone } = meta[result];

  return (
    <span
      className="hito-status-marker"
      data-size="xs"
      data-tone={tone}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size="xs" strokeWidth={2.2} />
    </span>
  );
}

function FeedbackMarker({
  calendar = false,
  className,
  state,
}: {
  calendar?: boolean;
  className?: string;
  state: Exclude<HitoCalendarFeedbackState, "none">;
}) {
  const label = state === "evidence_attached" ? "Evidence" : "Feedback";

  return (
    <span
      className={cn("hito-feedback-marker", calendar && "hito-calendar-feedback-marker", className)}
      data-state={state}
    >
      <span className="hito-feedback-marker-dot" />
      {!calendar ? <span>{label}</span> : null}
    </span>
  );
}

function ActionVisual({
  action,
  compact = false,
}: {
  action: HitoCalendarActionVisual;
  compact?: boolean;
}) {
  if (action.button) {
    const iconOnly = action.button === "icon-ghost";

    return (
      <button
        type="button"
        className={cn(
          "hito-button hito-button-xs",
          iconOnly ? "hito-button-ghost aspect-square p-0" : `hito-button-${action.button}`,
          compact && !iconOnly && "px-2",
        )}
        aria-label={action.ariaLabel ?? action.label}
        data-demo-state={action.focusDemo ? "focus" : undefined}
        disabled={action.disabled}
      >
        {action.icon ? <Icon name={action.icon} size="xs" /> : null}
        {!compact && !iconOnly ? action.label : action.icon ? null : action.label}
      </button>
    );
  }

  return (
    <span className="hito-status-pill" data-tone={action.tone ?? "muted"}>
      {action.icon ? <Icon name={action.icon} size="xs" /> : null}
      {action.label}
    </span>
  );
}
