import type {
  HitoCalendarDayResultState,
  HitoCalendarFeedbackState,
  HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import {
  HITO_CALENDAR_REST_IDENTITY,
  buildStaticCalendarDayPresentation,
  type CalendarDaySurfacePresentation,
} from "@/components/calendar/calendar-day-presentation";

type SandboxDayKind = "workout" | "rest";
type SandboxProviderState = {
  fit: boolean;
  garmin: boolean;
  strava: boolean;
  comparison: boolean;
  recommendation: boolean;
};

type SandboxScenarioState = SandboxProviderState & {
  result: HitoCalendarDayResultState;
  feedback: HitoCalendarFeedbackState;
  reviewSummary: string;
  detailSummary: string;
  recommendationCopy: string | null;
};

type SandboxSegment = {
  label: string;
  body: string;
  meta: string;
};

export type SandboxDay = {
  iso: string;
  day: string;
  weekday: string;
  kind: SandboxDayKind;
  workout?: HitoCalendarWorkoutIdentity;
  title: string;
  summary: string;
  segments: SandboxSegment[];
};

export type TestCalendarScenarioId =
  | "planned-week"
  | "completed-week"
  | "feedback-ready"
  | "disrupted-week";

export type TestCalendarScenario = {
  id: TestCalendarScenarioId;
  label: string;
  description: string;
  statusLabel: string;
  statusTone: "signal" | "success" | "warning" | "muted";
  workoutState: SandboxScenarioState;
  restState: SandboxScenarioState;
  dayStates?: Record<string, Partial<SandboxScenarioState>>;
};

export type SandboxDayView = {
  day: SandboxDay;
  result: HitoCalendarDayResultState;
  feedback: HitoCalendarFeedbackState;
  presentation: CalendarDaySurfacePresentation;
  fit: boolean;
  garmin: boolean;
  strava: boolean;
  comparison: boolean;
  recommendation: boolean;
  reviewSummary: string;
  detailSummary: string;
  recommendationCopy: string | null;
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DEFAULT_TEST_CALENDAR_SCENARIO_ID: TestCalendarScenarioId = "planned-week";
export const TEST_CALENDAR_TODAY_ISO = "2026-06-16";

export const WORKOUTS = {
  easy: {
    label: "Easy",
    short: "Easy",
    color: "var(--easy)",
    glyph: "easy",
  },
  steady: {
    label: "Steady",
    short: "Steady",
    color: "var(--easy)",
    glyph: "steady",
  },
  long: {
    label: "Long",
    short: "Long",
    color: "var(--long)",
    glyph: "long",
  },
  tempo: {
    label: "Tempo",
    short: "Tempo",
    color: "var(--quality)",
    glyph: "tempo",
  },
  intervals: {
    label: "Intervals",
    short: "Intervals",
    color: "var(--quality)",
    glyph: "intervals",
  },
  hills: {
    label: "Hills",
    short: "Hills",
    color: "var(--quality)",
    glyph: "hills",
  },
} satisfies Record<string, HitoCalendarWorkoutIdentity>;

export const SANDBOX_DAYS: SandboxDay[] = [
  fakeWorkout("2026-06-01", "01", "Mon", WORKOUTS.easy, "Easy aerobic run", "42 min"),
  fakeWorkout("2026-06-02", "02", "Tue", WORKOUTS.intervals, "Short hill intervals", "6 x 45 sec"),
  fakeRest("2026-06-03", "03", "Wed"),
  fakeWorkout("2026-06-04", "04", "Thu", WORKOUTS.steady, "Steady aerobic run", "48 min"),
  fakeRest("2026-06-05", "05", "Fri"),
  fakeWorkout("2026-06-06", "06", "Sat", WORKOUTS.long, "Long run with easy finish", "82 min"),
  fakeRest("2026-06-07", "07", "Sun"),
  fakeWorkout("2026-06-08", "08", "Mon", WORKOUTS.easy, "Recovery jog", "32 min"),
  fakeWorkout("2026-06-09", "09", "Tue", WORKOUTS.tempo, "Controlled tempo session", "3 x 7 min"),
  fakeRest("2026-06-10", "10", "Wed"),
  fakeWorkout("2026-06-11", "11", "Thu", WORKOUTS.easy, "Easy run with strides", "45 min"),
  fakeRest("2026-06-12", "12", "Fri"),
  fakeWorkout("2026-06-13", "13", "Sat", WORKOUTS.long, "Progressive long run", "90 min"),
  fakeRest("2026-06-14", "14", "Sun"),
  fakeWorkout("2026-06-15", "15", "Mon", WORKOUTS.steady, "Steady base run", "50 min"),
  fakeWorkout("2026-06-16", "16", "Tue", WORKOUTS.hills, "Rolling hill rhythm", "8 x 60 sec"),
  fakeRest("2026-06-17", "17", "Wed"),
  fakeWorkout("2026-06-18", "18", "Thu", WORKOUTS.easy, "Easy aerobic run", "44 min"),
  fakeRest("2026-06-19", "19", "Fri"),
  fakeWorkout("2026-06-20", "20", "Sat", WORKOUTS.long, "Long run", "95 min"),
  fakeRest("2026-06-21", "21", "Sun"),
  fakeWorkout("2026-06-22", "22", "Mon", WORKOUTS.easy, "Recovery run", "35 min"),
  fakeWorkout("2026-06-23", "23", "Tue", WORKOUTS.intervals, "Distance intervals", "5 x 3 min"),
  fakeRest("2026-06-24", "24", "Wed"),
  fakeWorkout("2026-06-25", "25", "Thu", WORKOUTS.tempo, "Tempo durability", "2 x 10 min"),
  fakeRest("2026-06-26", "26", "Fri"),
  fakeWorkout("2026-06-27", "27", "Sat", WORKOUTS.long, "Long run with steady finish", "100 min"),
  fakeRest("2026-06-28", "28", "Sun"),
];

export const TEST_CALENDAR_SCENARIOS: TestCalendarScenario[] = [
  {
    id: "planned-week",
    label: "Planned week",
    description: "Planned workouts and rest days only; no fake evidence or feedback exists yet.",
    statusLabel: "Planned review",
    statusTone: "signal",
    workoutState: {
      result: "planned",
      feedback: "none",
      fit: false,
      garmin: false,
      strava: false,
      comparison: false,
      recommendation: false,
      reviewSummary:
        "Planned structure only. The sandbox keeps evidence, comparison, and feedback hidden until a result exists.",
      detailSummary:
        "Use this scenario to inspect the planned workout rhythm without pretending completion data exists.",
      recommendationCopy: null,
    },
    restState: restScenarioState("Rest day stays calm with no result, evidence, or feedback."),
  },
  {
    id: "completed-week",
    label: "Completed week",
    description:
      "Completed workouts with provider evidence and comparison readback, but no coaching feedback.",
    statusLabel: "Completed readback",
    statusTone: "success",
    workoutState: {
      result: "completed",
      feedback: "evidence_attached",
      fit: true,
      garmin: true,
      strava: false,
      comparison: true,
      recommendation: false,
      reviewSummary:
        "Completed with provider evidence. Comparison is visible, while coaching feedback stays out of this preset.",
      detailSummary:
        "Use this scenario to inspect completed workout readback, attached evidence, and plan-vs-run comparison.",
      recommendationCopy: null,
    },
    restState: restScenarioState(
      "Rest day remains a completed-week rest marker without fake evidence.",
    ),
  },
  {
    id: "feedback-ready",
    label: "Feedback ready",
    description:
      "Completed workouts with evidence, comparison, and static feedback-ready recommendation copy.",
    statusLabel: "Feedback ready",
    statusTone: "success",
    workoutState: {
      result: "completed",
      feedback: "feedback_ready",
      fit: true,
      garmin: true,
      strava: false,
      comparison: true,
      recommendation: true,
      reviewSummary:
        "Completed workout with evidence and feedback-ready marker. Static recommendation copy is visible for review.",
      detailSummary:
        "Use this scenario to inspect the fake feedback-ready treatment after a completed workout has evidence.",
      recommendationCopy:
        "Static recommendation: keep tomorrow easy unless the next fake workout is also marked as recovery. No AI is called and no plan is updated.",
    },
    restState: restScenarioState(
      "Rest day stays quiet; feedback-ready markers belong only to workout days.",
    ),
  },
  {
    id: "disrupted-week",
    label: "Disrupted week",
    description: "A mixed week with skipped, partial, completed, and still-planned workout states.",
    statusLabel: "Disrupted pattern",
    statusTone: "warning",
    workoutState: {
      result: "planned",
      feedback: "none",
      fit: false,
      garmin: false,
      strava: false,
      comparison: false,
      recommendation: false,
      reviewSummary:
        "Still planned after a disrupted stretch. No feedback appears until the fake day has a result and evidence.",
      detailSummary:
        "Use this scenario to inspect disrupted calendar context without creating impossible planned-plus-feedback states.",
      recommendationCopy: null,
    },
    restState: restScenarioState(
      "Rest day remains available as a calm buffer in the disrupted week.",
    ),
    dayStates: {
      "2026-06-09": {
        result: "skipped",
        reviewSummary:
          "Skipped workout. The sandbox does not attach feedback or provider comparison to a skipped fake day.",
        detailSummary:
          "This skipped fake workout shows the calendar disruption without implying a completed result.",
      },
      "2026-06-13": {
        result: "partial",
        feedback: "evidence_attached",
        fit: true,
        garmin: true,
        comparison: true,
        reviewSummary:
          "Partial long run with provider evidence. Comparison is visible, but coaching feedback is not ready.",
        detailSummary:
          "Use this partial-result day to review disrupted-week evidence without a feedback-ready claim.",
      },
      "2026-06-15": {
        result: "completed",
        feedback: "evidence_attached",
        fit: true,
        garmin: true,
        comparison: true,
        reviewSummary:
          "Completed recovery from the disrupted stretch. Evidence is attached; recommendation copy remains hidden.",
        detailSummary:
          "This completed fake workout shows a stable readback inside a disrupted week.",
      },
    },
  },
];

export function getTestCalendarScenario(id: string): TestCalendarScenario {
  return (
    TEST_CALENDAR_SCENARIOS.find((scenario) => scenario.id === id) ??
    TEST_CALENDAR_SCENARIOS.find((scenario) => scenario.id === DEFAULT_TEST_CALENDAR_SCENARIO_ID) ??
    TEST_CALENDAR_SCENARIOS[0]
  );
}

export function getSandboxDayView(day: SandboxDay, scenario: TestCalendarScenario): SandboxDayView {
  const base = day.kind === "rest" ? scenario.restState : scenario.workoutState;
  const state = { ...base, ...(scenario.dayStates?.[day.iso] ?? {}) };
  const result = day.kind === "rest" ? "none" : state.result;
  const feedback = normalizedFeedback(result, state.feedback);
  const presentation = buildStaticCalendarDayPresentation({
    feedback,
    kind: day.kind,
    result,
    supportingText: day.summary,
    title: day.kind === "workout" ? day.title : undefined,
    workout: day.kind === "rest" ? HITO_CALENDAR_REST_IDENTITY : (day.workout ?? null),
  });

  return {
    day,
    result,
    feedback,
    presentation,
    fit: day.kind === "workout" && state.fit,
    garmin: day.kind === "workout" && state.garmin,
    strava: day.kind === "workout" && state.strava,
    comparison: day.kind === "workout" && state.comparison,
    recommendation: day.kind === "workout" && state.recommendation,
    reviewSummary: state.reviewSummary,
    detailSummary: state.detailSummary,
    recommendationCopy: day.kind === "workout" ? state.recommendationCopy : null,
  };
}

export function resultLabel(result: HitoCalendarDayResultState) {
  if (result === "none") return "Rest day";
  if (result === "planned") return "Not completed";
  if (result === "completed") return "Completed";
  if (result === "partial") return "Partial";
  return "Skipped";
}

export function resultTone(result: HitoCalendarDayResultState) {
  if (result === "completed") return "success";
  if (result === "partial") return "warning";
  if (result === "skipped") return "destructive";
  return "muted";
}

export function structureSummary(day: SandboxDay) {
  if (day.kind === "rest") return "Rest day with no workout blocks.";
  return day.segments.map((segment) => segment.label).join(" -> ");
}

export function providerSummary(view: SandboxDayView) {
  const providers = [
    view.fit ? "FIT" : null,
    view.garmin ? "Garmin" : null,
    view.strava ? "Strava future" : null,
  ].filter(Boolean);

  return providers.length > 0 ? providers.join(" + ") : "No fake provider evidence";
}

export function recommendationSummary(view: SandboxDayView) {
  if (!view.recommendation) return "Static recommendation hidden.";
  if (view.feedback !== "feedback_ready") return "Recommendation held until feedback is ready.";
  return "Static recommendation visible for product review.";
}

function fakeWorkout(
  iso: string,
  day: string,
  weekday: string,
  workout: HitoCalendarWorkoutIdentity,
  title: string,
  summary: string,
): SandboxDay {
  return {
    iso,
    day,
    weekday,
    kind: "workout",
    workout,
    title,
    summary,
    segments: [
      { label: "Warmup", body: "Easy running", meta: "10 min" },
      { label: "Main set", body: title, meta: summary },
      { label: "Cooldown", body: "Relaxed finish", meta: "8 min" },
    ],
  };
}

function fakeRest(iso: string, day: string, weekday: string): SandboxDay {
  return {
    iso,
    day,
    weekday,
    kind: "rest",
    title: "Rest day",
    summary: "Keep open",
    segments: [],
  };
}

function restScenarioState(reviewSummary: string): SandboxScenarioState {
  return {
    result: "none",
    feedback: "none",
    fit: false,
    garmin: false,
    strava: false,
    comparison: false,
    recommendation: false,
    reviewSummary,
    detailSummary: "Rest days stay static and do not create evidence, feedback, or mutations.",
    recommendationCopy: null,
  };
}

function normalizedFeedback(
  result: HitoCalendarDayResultState,
  feedback: HitoCalendarFeedbackState,
): HitoCalendarFeedbackState {
  if (result === "none" || result === "planned" || result === "skipped") return "none";
  if (feedback === "feedback_ready" && result !== "completed") return "evidence_attached";
  return feedback;
}
