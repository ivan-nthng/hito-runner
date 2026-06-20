import type {
  HitoCalendarDayBaseState,
  HitoCalendarFeedbackState,
  HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";

export type BaseDateState = HitoCalendarDayBaseState;
export type InteractionOverlay = "none" | "today" | "selected" | "focused";
export type ResultState = "none" | "completed" | "partial" | "skipped";
export type FeedbackState = HitoCalendarFeedbackState;
export type CalendarPreviewMode = "desktop" | "mobile";
export type WorkoutIdentityKey =
  | "easy"
  | "recovery"
  | "steady"
  | "long"
  | "tempo"
  | "threshold"
  | "intervals"
  | "progression"
  | "race"
  | "hills"
  | "trail"
  | "ultra"
  | "mountain"
  | "quality";
export type TitleStress = "short" | "normal" | "long" | "extreme";
export type DensityMode = "normal" | "dense";
export type FutureActionState = "none" | "add-activity" | "more-menu";

export type Option<T extends string> = {
  value: T;
  label: string;
};

export type WorkoutIdentity = HitoCalendarWorkoutIdentity & {
  family: "easy" | "long" | "quality" | "rest";
  defaultTitle: string;
};

export type CalendarPlaygroundState = {
  viewMode: CalendarPreviewMode;
  baseState: BaseDateState;
  overlay: InteractionOverlay;
  result: ResultState;
  feedback: FeedbackState;
  identity: WorkoutIdentityKey;
  titleStress: TitleStress;
  density: DensityMode;
  action: FutureActionState;
};

export const VIEW_MODE_OPTIONS: Array<Option<CalendarPreviewMode>> = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
];

export const BASE_STATE_OPTIONS: Array<Option<BaseDateState>> = [
  { value: "workout", label: "Workout" },
  { value: "rest", label: "Rest" },
  { value: "empty", label: "Empty" },
  { value: "outside-month", label: "Outside month" },
];

export const OVERLAY_OPTIONS: Array<Option<InteractionOverlay>> = [
  { value: "none", label: "None" },
  { value: "today", label: "Today" },
  { value: "selected", label: "Selected" },
  { value: "focused", label: "Focus" },
];

export const RESULT_OPTIONS: Array<Option<ResultState>> = [
  { value: "none", label: "None" },
  { value: "completed", label: "Done" },
  { value: "partial", label: "Partial" },
  { value: "skipped", label: "Skipped" },
];

export const FEEDBACK_OPTIONS: Array<Option<FeedbackState>> = [
  { value: "none", label: "None" },
  { value: "evidence_attached", label: "Evidence" },
  { value: "feedback_ready", label: "Feedback" },
];

export const TITLE_STRESS_OPTIONS: Array<Option<TitleStress>> = [
  { value: "short", label: "Short" },
  { value: "normal", label: "Normal" },
  { value: "long", label: "Long" },
  { value: "extreme", label: "Overflow" },
];

export const DENSITY_OPTIONS: Array<Option<DensityMode>> = [
  { value: "normal", label: "Normal" },
  { value: "dense", label: "Dense" },
];

export const ACTION_OPTIONS: Array<Option<FutureActionState>> = [
  { value: "none", label: "None" },
  { value: "add-activity", label: "Add activity" },
  { value: "more-menu", label: "More menu" },
];

export const WORKOUT_IDENTITIES: Record<WorkoutIdentityKey, WorkoutIdentity> = {
  easy: {
    label: "Easy",
    short: "Easy",
    family: "easy",
    glyph: "easy",
    color: "var(--easy)",
    defaultTitle: "Easy aerobic run",
  },
  recovery: {
    label: "Recovery",
    short: "Recovery",
    family: "easy",
    glyph: "recovery",
    color: "var(--easy)",
    defaultTitle: "Recovery jog",
  },
  steady: {
    label: "Steady",
    short: "Steady",
    family: "easy",
    glyph: "steady",
    color: "var(--easy)",
    defaultTitle: "Steady aerobic run",
  },
  long: {
    label: "Long",
    short: "Long",
    family: "long",
    glyph: "long",
    color: "var(--long)",
    defaultTitle: "Long run",
  },
  tempo: {
    label: "Tempo",
    short: "Tempo",
    family: "quality",
    glyph: "tempo",
    color: "var(--quality)",
    defaultTitle: "Controlled tempo session",
  },
  threshold: {
    label: "Threshold",
    short: "Tempo",
    family: "quality",
    glyph: "tempo",
    color: "var(--quality)",
    defaultTitle: "Threshold durability",
  },
  intervals: {
    label: "Intervals",
    short: "Intervals",
    family: "quality",
    glyph: "intervals",
    color: "var(--quality)",
    defaultTitle: "Distance intervals",
  },
  progression: {
    label: "Progression",
    short: "Progression",
    family: "quality",
    glyph: "progression",
    color: "var(--quality)",
    defaultTitle: "Progression run",
  },
  race: {
    label: "Race",
    short: "Race",
    family: "quality",
    glyph: "race",
    color: "var(--quality)",
    defaultTitle: "Tune-up race",
  },
  hills: {
    label: "Hills",
    short: "Hills",
    family: "quality",
    glyph: "hills",
    color: "var(--quality)",
    defaultTitle: "Uphill repeats",
  },
  trail: {
    label: "Trail",
    short: "Trail",
    family: "long",
    glyph: "trail",
    color: "var(--long)",
    defaultTitle: "Technical trail easy",
  },
  ultra: {
    label: "Ultra",
    short: "Long",
    family: "long",
    glyph: "long",
    color: "var(--long)",
    defaultTitle: "Ultra time on feet",
  },
  mountain: {
    label: "Mountain",
    short: "Trail",
    family: "long",
    glyph: "trail",
    color: "var(--long)",
    defaultTitle: "Mountain long run",
  },
  quality: {
    label: "Quality",
    short: "Quality",
    family: "quality",
    glyph: "quality",
    color: "var(--quality)",
    defaultTitle: "Quality workout",
  },
};

export const WORKOUT_IDENTITY_OPTIONS: Array<Option<WorkoutIdentityKey>> = (
  Object.keys(WORKOUT_IDENTITIES) as WorkoutIdentityKey[]
).map((value) => ({
  value,
  label: WORKOUT_IDENTITIES[value].label,
}));

export const DENSE_GRID_DAYS: Array<Partial<CalendarPlaygroundState> & { day: number }> = [
  { day: 27, baseState: "outside-month" },
  { day: 28, baseState: "outside-month" },
  { day: 29, baseState: "outside-month" },
  { day: 30, baseState: "workout", identity: "easy", result: "completed" },
  { day: 31, baseState: "rest" },
  { day: 1, baseState: "workout", identity: "long", feedback: "evidence_attached" },
  { day: 2, baseState: "rest", action: "add-activity" },
  { day: 3, baseState: "workout", identity: "recovery", result: "partial" },
  { day: 4, baseState: "workout", identity: "steady" },
  { day: 5, baseState: "workout", identity: "tempo", action: "more-menu" },
  { day: 6, baseState: "rest" },
  { day: 7, baseState: "workout", identity: "intervals", feedback: "feedback_ready" },
  { day: 8, baseState: "workout", identity: "hills", result: "skipped" },
  { day: 9, baseState: "workout", identity: "trail", titleStress: "long" },
];

export const DEFAULT_PLAYGROUND_STATE: CalendarPlaygroundState = {
  viewMode: "desktop",
  baseState: "workout",
  overlay: "today",
  result: "none",
  feedback: "feedback_ready",
  identity: "steady",
  titleStress: "normal",
  density: "normal",
  action: "more-menu",
};

export function getWorkoutTitle(workout: WorkoutIdentity, titleStress: TitleStress) {
  if (titleStress === "short") return workout.defaultTitle;
  if (titleStress === "normal") return `${workout.defaultTitle} with calm execution notes`;
  if (titleStress === "long") {
    return `${workout.defaultTitle} with controlled effort, compact calendar identity, and a title that wraps cleanly`;
  }

  return `${workout.defaultTitle} with a deliberately extreme runner-authored title that should wrap or clamp inside the calendar cell without pushing the month grid wider than the viewport`;
}

export function getNonWorkoutTitle(baseState: BaseDateState) {
  if (baseState === "rest") return "Rest day";
  if (baseState === "empty") return "No workout planned";
  if (baseState === "outside-month") return "Outside this month";

  return "Calendar day";
}
