import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  type AiFirstPlanBlueprint,
} from "../../src/lib/ai-first-plan-blueprint-authoring";
import { buildAiBlueprintWorkoutSections } from "../../src/lib/ai-first-plan-blueprint-section-templates";
import type { buildStructuredFirstPlanAuthoringInput } from "../../src/lib/structured-first-plan-onboarding";
import { shouldUseLongRunSteadyFinishAsSpecificStimulus } from "../../src/lib/structured-plan-authoring-policy";
import {
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "../../src/lib/rich-workout-model";
import { addDaysIso, weekdayLong } from "../../src/lib/training";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";

export function buildAiFirstPlanBlueprintFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const workoutsByDay = [
    {
      family: "easy",
      identity: "easy_aerobic_run",
      icon: "easy",
      title: "Easy aerobic run",
      summary: "Easy support run with relaxed mechanics and a controlled finish.",
      rpe: 4,
      fatigue: "low",
      recovery: "medium",
      segmentIntent: "easy_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "tempo",
      identity: "controlled_tempo_session",
      icon: "tempo",
      title: "Controlled tempo session",
      summary: "Controlled tempo durability without forcing target pace.",
      rpe: 6,
      fatigue: "medium_high",
      recovery: "medium",
      segmentIntent: "tempo_sustained",
      metricIntent: "mixed_if_allowed",
    },
    null,
    {
      family: "steady",
      identity: "steady_aerobic_run",
      icon: "steady",
      title: "Steady aerobic run",
      summary: "Steady support run that builds half-marathon durability.",
      rpe: 5,
      fatigue: "medium",
      recovery: "medium",
      segmentIntent: "steady_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "recovery",
      identity: "recovery_jog",
      icon: "recovery",
      title: "Recovery jog",
      summary: "Very easy recovery day to absorb the week's work.",
      rpe: 3,
      fatigue: "very_low",
      recovery: "high",
      segmentIntent: "recovery",
      metricIntent: "effort_only",
    },
    {
      family: "long",
      identity: "long_aerobic_run",
      icon: "long",
      title: "Long aerobic run",
      summary: "Aerobic long run that preserves durability without adding a second stimulus.",
      rpe: 5,
      fatigue: "medium_high",
      recovery: "high",
      segmentIntent: "long_durability",
      metricIntent: "mixed_if_allowed",
    },
    null,
  ] as const;

  const weeks = [1, 2].map((weekNumber) => ({
    weekNumber,
    phase: weekNumber === 1 ? ("Base" as const) : ("Taper" as const),
    theme: weekNumber === 1 ? "Settle into rhythm" : "Add controlled durability",
    microcycleIntent:
      weekNumber === 1
        ? "Introduce half-marathon rhythm while keeping easy days truly easy."
        : "Progress steady durability and keep the long run on Saturday.",
    cutbackWeek: false,
    taperWeek: weekNumber === 2,
    longRunIntent: "Keep Saturday durability progressing without forcing race effort.",
    longRunProgression: "Use backend expansion to preserve safe long-run progression.",
    plannedWorkouts: workoutsByDay.flatMap((template, dayIndex) => {
      if (!template) {
        return [];
      }

      const effectiveTemplate =
        weekNumber === 2 && template.identity === "controlled_tempo_session"
          ? {
              ...template,
              family: "easy",
              identity: "easy_aerobic_run",
              icon: "easy",
              title: "Easy aerobic run",
              summary: "Easy taper support run that preserves freshness.",
              rpe: 4,
              fatigue: "low",
              recovery: "medium",
              segmentIntent: "easy_aerobic",
              metricIntent: "mixed_if_allowed",
            }
          : weekNumber === 2 && template.identity === "long_aerobic_run"
            ? {
                ...template,
                identity: "taper_long_run",
                title: "Taper long run",
                summary: "Shorter taper long run that stays below the opening week peak.",
                rpe: 4,
                fatigue: "medium",
                segmentIntent: "long_durability",
              }
            : template;
      const date = addDaysIso(startDate, (weekNumber - 1) * 7 + dayIndex);

      return [
        {
          date,
          weekday: weekdayLong(
            date,
          ) as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
          workoutFamily: effectiveTemplate.family,
          workoutIdentity: effectiveTemplate.identity,
          calendarIconKey: effectiveTemplate.icon,
          title: effectiveTemplate.title,
          summary: effectiveTemplate.summary,
          plannedRpe: effectiveTemplate.rpe,
          estimatedFatigue: effectiveTemplate.fatigue,
          recoveryPriority: effectiveTemplate.recovery,
          segmentIntent: effectiveTemplate.segmentIntent,
          metricIntent: effectiveTemplate.metricIntent,
          sections: buildAiBlueprintWorkoutSections({
            workoutIdentity: effectiveTemplate.identity,
            workoutFamily: effectiveTemplate.family,
            plannedRpe: effectiveTemplate.rpe,
            distanceMeters: 21_100,
            weekNumber,
            horizonWeeks: 2,
          }),
        },
      ];
    }),
  }));

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint half marathon",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon target-time plan",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Target-time work is included only where benchmark support allows pace guidance.",
      "AI authors explicit workout sections; backend validates and canonicalizes them.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks,
  };
}

export function buildMinimalAiFirstPlanBlueprintForAuthoringInput(
  authoringInput: ReturnType<typeof buildStructuredFirstPlanAuthoringInput>,
  options: { horizonWeeks?: number } = {},
): AiFirstPlanBlueprint {
  const startDate = authoringInput.schedule.startDate;
  const runningDays = authoringInput.availability.preferredRunningDays.filter(
    (weekday) => !authoringInput.availability.unavailableDays.includes(weekday),
  );
  const horizonWeeks = options.horizonWeeks ?? 2;
  const targetDate = authoringInput.schedule.targetDate ?? null;
  const endpointDate =
    targetDate ??
    resolveMinimalBlueprintFinalAuthoredDate({
      startDate,
      horizonWeeks,
      runningDays,
    });

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint first-plan review fixture",
    generatedFor: "Doctrine fixture",
    goalSummary: authoringInput.goal.goalLabel,
    startDate,
    targetDate,
    preparationHorizonWeeks: horizonWeeks,
    planPreferences: {
      preferredRunningDays: authoringInput.availability.preferredRunningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: [
      "AI authors explicit workout sections; backend validates and canonicalizes them.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: Array.from({ length: horizonWeeks }, (_value, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const weekRunningDays = selectMinimalBlueprintRunningDays({
        authoringInput,
        runningDays,
        weekNumber,
      });

      return {
        weekNumber,
        phase: weekIndex === 0 ? "Base" : "Build",
        theme: weekIndex === 0 ? "Set rhythm" : "Progress durability",
        microcycleIntent: "Keep the compact AI-authored week simple but reviewable.",
        cutbackWeek: false,
        taperWeek: false,
        longRunIntent: "Keep the long run on the reviewed preferred long-run day.",
        longRunProgression: "Progress long-run durability conservatively.",
        plannedWorkouts: weekRunningDays.flatMap((weekday) => {
          const date = dateForWeekdayInSevenDayWindow(
            addDaysIso(startDate, weekIndex * 7),
            weekday,
          );

          if (weekIndex === horizonWeeks - 1 && targetDate && date > targetDate) {
            return [];
          }

          const isTargetEndpointDay = weekIndex === horizonWeeks - 1 && date === endpointDate;
          const isSelectedDistanceEndpoint = Boolean(
            isTargetEndpointDay && authoringInput.planGoalIntent?.distance,
          );
          const isLongRun =
            !isSelectedDistanceEndpoint &&
            (weekday === authoringInput.availability.preferredLongRunDay || isTargetEndpointDay);
          const isLongRunSteadyFinish =
            isLongRun && shouldUseLongRunSteadyFinishAsSpecificStimulus(authoringInput, weekNumber);
          const workoutFamily = isSelectedDistanceEndpoint ? "race" : isLongRun ? "long" : "easy";
          const workoutIdentity = isSelectedDistanceEndpoint
            ? "selected_distance_completion_or_checkpoint"
            : isLongRun
              ? isLongRunSteadyFinish
                ? "long_run_with_steady_finish"
                : "long_aerobic_run"
              : "easy_aerobic_run";
          const plannedRpe = isSelectedDistanceEndpoint ? 7 : isLongRun ? 5 : 4;

          return [
            {
              date,
              weekday,
              workoutFamily,
              workoutIdentity,
              calendarIconKey: isSelectedDistanceEndpoint ? "race" : isLongRun ? "long" : "easy",
              title: isSelectedDistanceEndpoint
                ? "Selected distance day"
                : isLongRun
                  ? isLongRunSteadyFinish
                    ? "Long run with steady finish"
                    : "Long aerobic run"
                  : "Easy aerobic run",
              summary: isSelectedDistanceEndpoint
                ? "Reviewable selected-distance endpoint from the AI-authored blueprint."
                : isLongRun
                  ? isLongRunSteadyFinish
                    ? "Reviewable long run with a controlled steady finish from the AI-authored blueprint."
                    : "Reviewable long-run durability from the AI-authored blueprint."
                  : "Reviewable easy support running from the AI-authored blueprint.",
              plannedRpe,
              estimatedFatigue: isSelectedDistanceEndpoint ? "high" : isLongRun ? "medium" : "low",
              recoveryPriority: isSelectedDistanceEndpoint ? "high" : isLongRun ? "high" : "medium",
              segmentIntent: isSelectedDistanceEndpoint
                ? "race_tuneup"
                : isLongRun
                  ? "long_durability"
                  : "easy_aerobic",
              metricIntent: "mixed_if_allowed",
              sections: buildAiBlueprintWorkoutSections({
                workoutIdentity,
                workoutFamily,
                plannedRpe,
                distanceMeters:
                  authoringInput.planGoalIntent?.distance?.distanceMeters ??
                  authoringInput.goal.distanceMeters ??
                  null,
                weekNumber: weekIndex + 1,
                horizonWeeks,
              }),
            },
          ];
        }),
      };
    }),
  };
}

export function buildAiFirstPlanBlueprintIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Establish rhythm",
      microcycleIntent: "Pair easy support with threshold durability and a steady-finish long run.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "tempo",
          "half_marathon_threshold_durability",
          "tempo",
          "Half marathon threshold durability",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Friday",
          "intervals",
          "time_intervals",
          "intervals",
          "Time intervals",
        ),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Build repeatability",
      microcycleIntent:
        "Use controlled repeats and steady support without adding terrain-specific work.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "intervals",
          "distance_intervals",
          "intervals",
          "Distance intervals",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "tempo",
          "controlled_tempo_session",
          "tempo",
          "Controlled tempo session",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
  ];

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint identity matrix",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands compact identity intent into executable workout details.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

export function buildAiFirstPlanBlueprintMissingIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-07-06";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Sharpen without overload",
      microcycleIntent: "Introduce trail skill, controlled climbing, and mountain time-on-feet.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "climbing_steady_run",
          "hills",
          "Climbing steady run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "mountain_long_run_time_on_feet",
          "trail",
          "Mountain long run time on feet",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Rhythm and terrain control",
      microcycleIntent:
        "Pair rolling terrain with controlled downhill durability and hike-run endurance.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate(
          "Monday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Tuesday",
          "hills",
          "rolling_hills_session",
          "hills",
          "Rolling hills session",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "controlled_downhill_durability",
          "hills",
          "Controlled downhill durability",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "hike_run_endurance",
          "trail",
          "Hike-run endurance",
        ),
      ],
    },
    {
      phase: "Specific" as const,
      theme: "Controlled race rhythm",
      microcycleIntent:
        "Use uphill strength while keeping terrain support and cutback durability conservative.",
      cutbackWeek: true,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Tuesday", "hills", "uphill_repeats", "hills", "Uphill repeats"),
        blueprintWorkoutTemplate(
          "Thursday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "ultra_time_on_feet_durability",
          "trail",
          "Ultra time-on-feet durability",
        ),
      ],
    },
    {
      phase: "Taper" as const,
      theme: "Freshness and terrain control",
      microcycleIntent: "Keep light terrain rhythm and reduce the long-run load for freshness.",
      cutbackWeek: false,
      taperWeek: true,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Saturday", "long", "taper_long_run", "long", "Taper long run"),
      ],
    },
  ].slice(0, 1);

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint full identity coverage",
    generatedFor: "Doctrine fixture",
    goalSummary: "Mountain identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-07-12",
    preparationHorizonWeeks: 1,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands performance and mountain blueprint identities into executable detail.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

function selectMinimalBlueprintRunningDays({
  authoringInput,
  runningDays,
  weekNumber,
}: {
  authoringInput: ReturnType<typeof buildStructuredFirstPlanAuthoringInput>;
  runningDays: readonly WeekdayName[];
  weekNumber: number;
}) {
  const maxEarly = conservativeEarlyMinimalBlueprintWorkoutMax(authoringInput, weekNumber);

  if (!maxEarly || runningDays.length <= maxEarly) {
    return runningDays;
  }

  const longRunDay = authoringInput.availability.preferredLongRunDay;
  const selected = new Set([
    ...runningDays.filter((weekday) => weekday !== longRunDay).slice(0, Math.max(0, maxEarly - 1)),
    longRunDay,
  ]);

  return runningDays.filter((weekday) => selected.has(weekday));
}

function conservativeEarlyMinimalBlueprintWorkoutMax(
  authoringInput: ReturnType<typeof buildStructuredFirstPlanAuthoringInput>,
  weekNumber: number,
) {
  if (weekNumber > 4) {
    return null;
  }

  const noBenchmark = !authoringInput.currentLevel.recent5kPaceSecondsPerKm;
  const targetOutcomeIntent = Boolean(
    authoringInput.goal.targetTime ||
    authoringInput.planGoalIntent?.targetFinishTime ||
    authoringInput.planGoalIntent?.targetOutcomePace,
  );
  const feasibilityStatus = authoringInput.planGoalIntent?.feasibility?.status ?? null;
  const conservative =
    noBenchmark &&
    (targetOutcomeIntent ||
      feasibilityStatus === "aggressive_or_short_horizon" ||
      authoringInput.runnerProfile.experienceLevel === "new_runner" ||
      authoringInput.runnerProfile.experienceLevel === "returning_runner");

  if (!conservative) {
    return null;
  }

  const distanceMeters = authoringInput.planGoalIntent?.distance?.distanceMeters ?? null;
  const maxEarly =
    distanceMeters != null &&
    distanceMeters <= 10_000 &&
    authoringInput.runnerProfile.experienceLevel === "new_runner"
      ? 3
      : 4;

  return Math.min(authoringInput.availability.maxRunningDaysPerWeek, maxEarly);
}

function resolveMinimalBlueprintFinalAuthoredDate({
  startDate,
  horizonWeeks,
  runningDays,
}: {
  startDate: string;
  horizonWeeks: number;
  runningDays: readonly WeekdayName[];
}) {
  return Array.from({ length: horizonWeeks }, (_weekValue, weekIndex) => {
    const weekStart = addDaysIso(startDate, weekIndex * 7);
    return runningDays.map((weekday) => dateForWeekdayInSevenDayWindow(weekStart, weekday));
  })
    .flat()
    .sort((left, right) => right.localeCompare(left))[0];
}

function dateForWeekdayInSevenDayWindow(startDate: string, weekday: WeekdayName) {
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDaysIso(startDate, offset);

    if (weekdayLong(date) === weekday) {
      return date;
    }
  }

  return startDate;
}

function blueprintWorkoutTemplate(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutFamily: CanonicalWorkoutFamily,
  workoutIdentity: CanonicalWorkoutIdentity,
  calendarIconKey: CalendarIconKey,
  title: string,
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number] {
  const segmentIntentByFamily: Record<
    CanonicalWorkoutFamily,
    AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["segmentIntent"]
  > = {
    easy: "easy_aerobic",
    recovery: "recovery",
    steady: "steady_aerobic",
    long: "long_durability",
    tempo: "tempo_sustained",
    intervals: "interval_repeats",
    hills: "hill_strength",
    trail: "trail_terrain",
    progression: "progression",
    race: "race_tuneup",
    rest: "rest",
  };

  return {
    date: null,
    weekday,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    title,
    summary: `${title} authored with explicit blueprint sections for backend validation.`,
    plannedRpe:
      workoutFamily === "recovery"
        ? 3
        : workoutFamily === "long"
          ? 5
          : workoutFamily === "easy"
            ? 4
            : 6,
    estimatedFatigue:
      workoutFamily === "recovery"
        ? "very_low"
        : workoutFamily === "long"
          ? "medium_high"
          : "medium",
    recoveryPriority: workoutFamily === "long" || workoutFamily === "recovery" ? "high" : "medium",
    segmentIntent: segmentIntentByFamily[workoutFamily],
    metricIntent: "mixed_if_allowed",
    sections: buildAiBlueprintWorkoutSections({
      workoutIdentity,
      workoutFamily,
      plannedRpe:
        workoutFamily === "recovery"
          ? 3
          : workoutFamily === "long"
            ? 5
            : workoutFamily === "easy"
              ? 4
              : 6,
      distanceMeters: 21_100,
    }),
  };
}

export function blueprintWorkoutFromIdentity(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutIdentity: CanonicalWorkoutIdentity,
) {
  const title = titleFromIdentity(workoutIdentity);
  const resolved = resolveCanonicalWorkoutModel({ workoutIdentity, title });

  return blueprintWorkoutTemplate(
    weekday,
    resolved.workoutFamily,
    resolved.workoutIdentity,
    resolved.calendarIconKey,
    title,
  );
}

export function titleFromIdentity(identity: CanonicalWorkoutIdentity) {
  return identity
    .split("_")
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}
