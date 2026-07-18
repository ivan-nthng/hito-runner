import type { ManualCopiedWorkoutSource } from "@/components/manual-workout/ManualWorkoutSourceActionMenu";
import type { ManualWorkoutMoveTargetDayKind } from "@/lib/manual-workout-authoring";
import type {
  HitoCalendarDayBaseState,
  HitoCalendarDayResultState,
  HitoCalendarFeedbackState,
  HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import {
  buildPlannedWorkoutLanguage,
  type PlannedWorkoutLanguageInput,
} from "@/lib/planned-workout-language";
import {
  feedbackMarkerMeta,
  findWorkout,
  formatDate,
  formatDistanceKm,
  formatDurationMin,
  weekdayLong,
  workoutDistanceKm,
  workoutDuration,
  workoutTypeMeta,
  type TrainingSnapshot,
  type Workout,
} from "@/lib/training";
import { workoutTypeColorVar } from "@/lib/workout-color-tokens";
import { workoutGlyphFromCalendarIconKey } from "@/lib/workout-glyph";

export type CalendarDaySurfacePresentation = {
  feedback: HitoCalendarFeedbackState;
  result: HitoCalendarDayResultState;
  state: HitoCalendarDayBaseState;
  stateLabel?: string | null;
  supportingText?: string | null;
  title?: string;
  workout?: HitoCalendarWorkoutIdentity | null;
};

export type CalendarDaySlotLayout = "mobile" | "month" | "week";

export type CalendarOptimisticMoveDisplay = {
  requestId: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  workout: Workout;
};

export type CalendarMoveUndoAffordance = {
  activePlanId: string;
  displayDate: string;
  expiresAt: number;
  id: string;
  sourceWorkoutDate: string;
  sourceWorkoutId: string;
  targetDate: string;
  title: string;
};

export type CalendarWorkoutActionContext = ManualCopiedWorkoutSource & {
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  canRequestClearReview: boolean;
};

export type CalendarAddActionContext = {
  activePlanId: string;
  activePlanSourceKind: string;
  canAcceptMoveTarget: boolean;
  moveTargetDayKind: ManualWorkoutMoveTargetDayKind;
  moveOnly: boolean;
};

export type CalendarProjectionInteraction = {
  lastMoveUndo: CalendarMoveUndoAffordance | null;
  movePending: boolean;
  optimisticMove: CalendarOptimisticMoveDisplay | null;
  undoSecondsRemaining: number;
  moveWorkoutSource: ManualCopiedWorkoutSource | null;
};

export type CalendarDayProjection = {
  addAction: CalendarAddActionContext | null;
  canMoveHere: boolean;
  feedback: ReturnType<typeof feedbackMarkerMeta>;
  hasWorkout: boolean;
  isMoveSource: boolean;
  pendingMoveSource: boolean;
  pendingMoveTarget: boolean;
  presentation: CalendarDaySurfacePresentation;
  sourceAction: CalendarWorkoutActionContext | null;
  undoAction: CalendarMoveUndoAffordance | null;
  workout: Workout | undefined;
};

type CalendarMoveDateRender = {
  isPendingMoveSource: boolean;
  isPendingMoveTarget: boolean;
  workout: Workout | undefined;
};

export function buildCalendarDayProjection({
  inMonth = true,
  interaction,
  iso,
  layout,
  snapshot,
}: {
  inMonth?: boolean;
  interaction: CalendarProjectionInteraction;
  iso: string;
  layout: CalendarDaySlotLayout;
  snapshot: TrainingSnapshot;
}): CalendarDayProjection {
  const moveRender = resolveCalendarMoveDateRender(
    snapshot.workouts,
    iso,
    interaction.optimisticMove,
  );
  const workout = moveRender.workout;
  const hasWorkout = Boolean(workout && workout.type !== "rest");
  const canExposeActions = (layout !== "month" || inMonth) && !interaction.movePending;
  const addAction = canExposeActions
    ? resolveCalendarAddActionContext(snapshot, iso, workout, interaction.moveWorkoutSource)
    : null;
  const sourceAction = canExposeActions
    ? resolveCalendarWorkoutActionContext(snapshot, iso, workout)
    : null;
  const canMoveHere = Boolean(
    addAction?.canAcceptMoveTarget &&
    interaction.moveWorkoutSource &&
    interaction.moveWorkoutSource.activePlanId === addAction.activePlanId &&
    interaction.moveWorkoutSource.sourceWorkoutDate !== iso,
  );

  return {
    addAction,
    canMoveHere,
    feedback: workout ? feedbackMarkerMeta(workout.feedbackMarker) : null,
    hasWorkout,
    isMoveSource: interaction.moveWorkoutSource?.sourceWorkoutId === workout?.id,
    pendingMoveSource: interaction.movePending && moveRender.isPendingMoveSource,
    pendingMoveTarget: Boolean(
      interaction.movePending && moveRender.isPendingMoveTarget && workout,
    ),
    presentation: buildWorkoutCalendarDayPresentation(workout, {
      includeRestTitle: layout === "mobile",
    }),
    sourceAction,
    undoAction: resolveCalendarMoveUndoForDate(snapshot, iso, interaction),
    workout,
  };
}

export function resolveCalendarMoveDateRender(
  workouts: Workout[],
  iso: string,
  optimisticMove: CalendarOptimisticMoveDisplay | null,
): CalendarMoveDateRender {
  if (!optimisticMove) {
    return {
      isPendingMoveSource: false,
      isPendingMoveTarget: false,
      workout: findWorkout(workouts, iso),
    };
  }

  if (iso === optimisticMove.sourceWorkoutDate) {
    const persistedSource = findWorkout(workouts, iso);
    return {
      isPendingMoveSource: persistedSource?.id === optimisticMove.sourceWorkoutId,
      isPendingMoveTarget: false,
      workout: persistedSource?.id === optimisticMove.sourceWorkoutId ? undefined : persistedSource,
    };
  }

  return iso === optimisticMove.targetDate
    ? {
        isPendingMoveSource: false,
        isPendingMoveTarget: true,
        workout: buildCalendarOptimisticWorkout(optimisticMove.workout, optimisticMove.targetDate),
      }
    : {
        isPendingMoveSource: false,
        isPendingMoveTarget: false,
        workout: findWorkout(workouts, iso),
      };
}

export function resolveCalendarMoveUndoForDate(
  snapshot: TrainingSnapshot,
  iso: string,
  interaction: CalendarProjectionInteraction,
) {
  const { lastMoveUndo: undo, movePending, optimisticMove, undoSecondsRemaining } = interaction;
  if (!undo || movePending || undoSecondsRemaining <= 0 || undo.displayDate !== iso) return null;

  const movedWorkout =
    snapshot.workouts.find(
      (workout) => workout.id === undo.sourceWorkoutId && workout.date === undo.sourceWorkoutDate,
    ) ??
    (optimisticMove?.sourceWorkoutId === undo.sourceWorkoutId &&
    optimisticMove.targetDate === undo.sourceWorkoutDate
      ? buildCalendarOptimisticWorkout(optimisticMove.workout, optimisticMove.targetDate)
      : null);
  const undoTargetWorkout = findWorkout(snapshot.workouts, undo.targetDate);

  if (
    !movedWorkout ||
    movedWorkout.type === "rest" ||
    !movedWorkout.sourceEditing?.canDirectMove ||
    undo.targetDate < snapshot.currentDate ||
    (undo.targetDate === snapshot.currentDate &&
      !canExposeTodayAsCalendarMoveTarget(snapshot, undo.targetDate, {
        activePlanId: undo.activePlanId,
        sourceWorkoutDate: undo.sourceWorkoutDate,
        sourceWorkoutId: undo.sourceWorkoutId,
        title: undo.title,
      })) ||
    (undoTargetWorkout &&
      undoTargetWorkout.id !== undo.sourceWorkoutId &&
      undoTargetWorkout.type !== "rest")
  ) {
    return null;
  }

  return undo;
}

export function resolveCalendarAddActionContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
  moveSource: ManualCopiedWorkoutSource | null,
): CalendarAddActionContext | null {
  const planMeta = snapshot.planMeta;
  if (!planMeta?.id) return null;

  const addCapability = planMeta.workoutEditing?.addWorkout;
  const moveCapability = planMeta.workoutEditing?.moveWorkout;
  const moveTargetHint = resolveCalendarMoveTargetHint(snapshot, iso, workout, moveSource);
  const canAddWorkout =
    addCapability?.allowed === true &&
    (!workout || workout.type === "rest") &&
    iso >= snapshot.currentDate &&
    !calendarDateIsBeforePlanStart(iso, snapshot);
  const canAcceptMoveTarget =
    moveCapability?.allowed === true && moveTargetHint.canAcceptMoveTarget;

  if (!canAddWorkout && !canAcceptMoveTarget) return null;

  const activePlanSourceKind =
    addCapability?.allowed === true
      ? addCapability.sourceKind
      : moveCapability?.allowed === true
        ? moveCapability.sourceKind
        : null;
  if (!activePlanSourceKind) return null;

  return {
    activePlanId: planMeta.id,
    activePlanSourceKind,
    canAcceptMoveTarget,
    moveTargetDayKind: moveTargetHint.dayKind,
    moveOnly: !canAddWorkout,
  };
}

export function resolveCalendarWorkoutActionContext(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
): CalendarWorkoutActionContext | null {
  const planMeta = snapshot.planMeta;
  if (!planMeta?.id || !workout || workout.type === "rest") return null;

  const sourceEditing = workout.sourceEditing;
  const canDirectCopy = Boolean(sourceEditing?.canDirectCopy);
  const canDirectMove = Boolean(sourceEditing?.canDirectMove);
  const canDragInitiate = Boolean(sourceEditing?.canDragInitiate);
  const canRequestClearReview = Boolean(
    planMeta.workoutEditing?.clearWorkout.allowed && sourceEditing?.canClear,
  );

  if (!canDirectCopy && !canRequestClearReview && !canDirectMove && !canDragInitiate) return null;

  return {
    activePlanId: planMeta.id,
    canDirectCopy,
    canDirectMove,
    canDragInitiate,
    canRequestClearReview,
    sourceWorkoutDate: iso,
    sourceWorkoutId: workout.id,
    title: workout.title || workoutTypeMeta(workout).label,
  };
}

export function resolveCalendarMoveTargetDayKind(
  workouts: Workout[],
  targetDate: string,
  moveSource: ManualCopiedWorkoutSource,
): ManualWorkoutMoveTargetDayKind {
  return calendarMoveTargetDayKindFromWorkout(
    workouts.find(
      (workout) => workout.date === targetDate && workout.id !== moveSource.sourceWorkoutId,
    ),
  );
}

export function calendarMoveTargetAction(dayKind: ManualWorkoutMoveTargetDayKind) {
  if (dayKind === "workout_day") {
    return {
      label: "Replace",
      icon: "arrow-right" as const,
      tone: "warning" as const,
      ariaLabel: "Review replacement for selected workout",
    };
  }

  return {
    label: "Move",
    icon: "arrow-right" as const,
    tone: "signal" as const,
    ariaLabel: "Move selected workout to rest day",
  };
}

export function calendarMoveUndoAction(secondsRemaining: number) {
  return {
    label: `Undo ${secondsRemaining}`,
    icon: "refresh" as const,
    tone: "signal" as const,
    visual: "button" as const,
    visualButton: "ghost" as const,
    alwaysVisible: true,
    showCompactLabel: true,
    ariaLabel: `Undo move. ${secondsRemaining} seconds remaining.`,
  };
}

export function calendarTargetButtonAriaLabel(
  iso: string,
  canMoveHere: boolean,
  dayKind: ManualWorkoutMoveTargetDayKind,
) {
  const dateLabel = formatDate(iso, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  if (!canMoveHere) return `${dateLabel}. Add workout.`;
  if (dayKind === "workout_day") {
    return `${dateLabel}. Review replacement for selected workout.`;
  }
  return `${dateLabel}. Move selected workout to rest day.`;
}

export function calendarDateIsBeforePlanStart(iso: string, snapshot: TrainingSnapshot) {
  const planStartDate = snapshot.planMeta?.startDate;
  return Boolean(planStartDate && iso < planStartDate);
}

function resolveCalendarMoveTargetHint(
  snapshot: TrainingSnapshot,
  iso: string,
  workout: Workout | undefined,
  moveSource: ManualCopiedWorkoutSource | null,
) {
  const dayKind = calendarMoveTargetDayKindFromWorkout(workout);

  if (
    !moveSource ||
    calendarDateIsBeforePlanStart(iso, snapshot) ||
    moveSource.sourceWorkoutDate === iso
  ) {
    return { canAcceptMoveTarget: false, dayKind };
  }

  if (!workout) {
    return {
      canAcceptMoveTarget:
        iso > snapshot.currentDate || canExposeTodayAsCalendarMoveTarget(snapshot, iso, moveSource),
      dayKind,
    };
  }

  if (iso <= snapshot.currentDate) {
    return { canAcceptMoveTarget: false, dayKind };
  }

  if (workout.type === "rest") {
    return { canAcceptMoveTarget: true, dayKind };
  }

  return {
    canAcceptMoveTarget: Boolean(workout.sourceEditing?.canClear),
    dayKind,
  };
}

function calendarMoveTargetDayKindFromWorkout(
  workout: Workout | undefined,
): ManualWorkoutMoveTargetDayKind {
  return !workout || workout.type === "rest" ? "rest_day" : "workout_day";
}

function canExposeTodayAsCalendarMoveTarget(
  snapshot: TrainingSnapshot,
  targetDate: string,
  moveSource: ManualCopiedWorkoutSource | null,
) {
  if (targetDate !== snapshot.currentDate || !moveSource) return false;

  const sourceWorkout = snapshot.workouts.find(
    (workout) =>
      workout.id === moveSource.sourceWorkoutId && workout.date === moveSource.sourceWorkoutDate,
  );

  return Boolean(
    sourceWorkout?.sourceEditing?.canDirectMove &&
    sourceWorkout.sourceEditing.eligibility === "eligible_past_unlogged",
  );
}

function buildCalendarOptimisticWorkout(workout: Workout, targetDate: string): Workout {
  return {
    ...workout,
    date: targetDate,
    weekday: weekdayLong(targetDate),
    status: "upcoming",
  };
}

export function buildWorkoutCalendarDayPresentation(
  workout: Workout | undefined,
  options: {
    feedback?: HitoCalendarFeedbackState;
    includeRestTitle?: boolean;
    stateLabel?: string | null;
    supportingText?: string | null;
    title?: string | null;
  } = {},
): CalendarDaySurfacePresentation {
  if (!workout) {
    return buildRestCalendarDayPresentation({
      feedback: options.feedback,
      stateLabel: options.stateLabel,
      supportingText: options.supportingText,
      title:
        options.includeRestTitle && options.title !== null
          ? (options.title ?? "Rest day")
          : undefined,
    });
  }

  if (workout.type === "rest") {
    return buildRestCalendarDayPresentation({
      feedback: options.feedback,
      stateLabel: options.stateLabel,
      supportingText: options.supportingText,
      title: options.title === undefined ? undefined : (options.title ?? undefined),
    });
  }

  const title = options.title === undefined ? workout.title : (options.title ?? undefined);

  return {
    feedback: options.feedback ?? "none",
    result:
      workout.status === "completed" || workout.status === "partial" || workout.status === "skipped"
        ? workout.status
        : "planned",
    state: "workout",
    stateLabel: options.stateLabel,
    supportingText:
      options.supportingText === undefined
        ? compactCalendarWorkoutSummary(workout)
        : options.supportingText,
    title,
    workout: calendarWorkoutIdentity(workout),
  };
}

export function buildRestCalendarDayPresentation(
  options: {
    feedback?: HitoCalendarFeedbackState;
    stateLabel?: string | null;
    supportingText?: string | null;
    title?: string;
  } = {},
): CalendarDaySurfacePresentation {
  return {
    feedback: options.feedback ?? "none",
    result: "none",
    state: "rest",
    stateLabel: options.stateLabel,
    supportingText: options.supportingText,
    title: options.title,
    workout: null,
  };
}

export function buildCalendarWorkoutIdentity(
  workout: PlannedWorkoutLanguageInput,
): HitoCalendarWorkoutIdentity {
  const language = buildPlannedWorkoutLanguage(workout);

  return {
    label: language.runnerFacingWorkoutTypeLabel,
    short: language.runnerFacingWorkoutTypeLabel,
    color: workoutTypeColorVar(language.runnerFacingWorkoutType),
    glyph: workoutGlyphFromCalendarIconKey(language.canonical.calendarIconKey),
  };
}

function calendarWorkoutIdentity(workout: Workout): HitoCalendarWorkoutIdentity {
  return buildCalendarWorkoutIdentity({
    workoutType: workout.type,
    sourceWorkoutType: workout.sourceWorkoutType,
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    metricMode: workout.metricMode,
    title: workout.title,
    steps: workout.steps,
  });
}

function compactCalendarWorkoutSummary(workout: Workout) {
  const km = workoutDistanceKm(workout);
  const duration = workoutDuration(workout);

  if (km != null && duration > 0) {
    return `${formatDistanceKm(km)} km · ${formatDurationMin(duration)}`;
  }

  if (km != null) {
    return `${formatDistanceKm(km)} km`;
  }

  if (duration > 0) {
    return formatDurationMin(duration);
  }

  return workoutTypeMeta(workout).label;
}
