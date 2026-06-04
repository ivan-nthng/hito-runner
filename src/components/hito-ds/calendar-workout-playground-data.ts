import type { WorkoutGlyphKind } from "@/lib/workout-glyph";

export type BaseDateState =
  | "planned-workout"
  | "planned-rest"
  | "empty-no-plan"
  | "outside-month"
  | "outside-plan-pre-start";
export type InteractionOverlay = "none" | "today" | "selected" | "focused";
export type ResultState = "none" | "completed" | "partial" | "skipped";
export type FeedbackState = "none" | "evidence_attached" | "feedback_ready";
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
export type FutureActionState =
  | "none"
  | "add-workout"
  | "more-menu"
  | "editable"
  | "copied-source"
  | "paste-target"
  | "recurring"
  | "protected"
  | "fixed-rest";

export type Option<T extends string> = {
  value: T;
  label: string;
};

export type WorkoutIdentity = {
  label: string;
  short: string;
  family: "easy" | "long" | "quality" | "rest";
  glyph: WorkoutGlyphKind;
  color: string;
  defaultTitle: string;
};

export type CalendarPlaygroundState = {
  baseState: BaseDateState;
  overlay: InteractionOverlay;
  result: ResultState;
  feedback: FeedbackState;
  identity: WorkoutIdentityKey;
  titleStress: TitleStress;
  density: DensityMode;
  action: FutureActionState;
};

export const BASE_STATE_OPTIONS: Array<Option<BaseDateState>> = [
  { value: "planned-workout", label: "Workout" },
  { value: "planned-rest", label: "Rest" },
  { value: "empty-no-plan", label: "Empty" },
  { value: "outside-month", label: "Outside month" },
  { value: "outside-plan-pre-start", label: "Pre-start" },
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
  { value: "add-workout", label: "Add workout" },
  { value: "more-menu", label: "More menu" },
  { value: "editable", label: "Editable" },
  { value: "copied-source", label: "Copied source" },
  { value: "paste-target", label: "Paste target" },
  { value: "recurring", label: "Recurring" },
  { value: "protected", label: "Protected" },
  { value: "fixed-rest", label: "Fixed rest" },
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
  { day: 29, baseState: "outside-plan-pre-start", action: "fixed-rest" },
  { day: 30, baseState: "planned-workout", identity: "easy", result: "completed" },
  { day: 31, baseState: "planned-rest" },
  { day: 1, baseState: "planned-workout", identity: "long", feedback: "evidence_attached" },
  { day: 2, baseState: "empty-no-plan", action: "add-workout" },
  { day: 3, baseState: "planned-workout", identity: "recovery", result: "partial" },
  { day: 4, baseState: "planned-workout", identity: "steady" },
  { day: 5, baseState: "planned-workout", identity: "tempo", action: "more-menu" },
  { day: 6, baseState: "planned-rest", action: "fixed-rest" },
  { day: 7, baseState: "planned-workout", identity: "intervals", feedback: "feedback_ready" },
  { day: 8, baseState: "planned-workout", identity: "hills", result: "skipped" },
  { day: 9, baseState: "planned-workout", identity: "trail", action: "recurring" },
];

export const DEFAULT_PLAYGROUND_STATE: CalendarPlaygroundState = {
  baseState: "planned-workout",
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
  if (baseState === "planned-rest") return "Rest day";
  if (baseState === "empty-no-plan") return "No workout planned";
  if (baseState === "outside-month") return "Outside this month";
  if (baseState === "outside-plan-pre-start") return "Before plan starts";

  return "Calendar day";
}
