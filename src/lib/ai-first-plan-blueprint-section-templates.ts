import type { AiBlueprintWorkout } from "@/lib/ai-first-plan-blueprint-schema";
import {
  resolveTenKBeginnerWorkoutTotalMinutes,
  type TenKBeginnerDoseValidationRow,
} from "@/lib/plan-creation-engine/ten-k-beginner-dose-policy";

type AiBlueprintSections = AiBlueprintWorkout["sections"];
type AiBlueprintSection = AiBlueprintSections[number];
type AiBlueprintRepeatChild = NonNullable<AiBlueprintSection["prescription"]["children"]>[number];
type LowSupportTenKWorkoutKind = Exclude<
  TenKBeginnerDoseValidationRow["workoutDayKind"],
  "rest" | "final_selected_distance_day"
>;

export function buildAiBlueprintWorkoutSections(input: {
  workoutIdentity: string;
  workoutFamily: string;
  plannedRpe?: number | null;
  distanceMeters?: number | null;
  weekNumber?: number | null;
  horizonWeeks?: number | null;
  lowSupportTenKBeginner?: boolean;
}): AiBlueprintSections {
  const rpe = input.plannedRpe ?? 4;
  const lowSupportSections = buildLowSupportTenKBeginnerSections(input);

  if (lowSupportSections) {
    return lowSupportSections;
  }

  switch (input.workoutIdentity) {
    case "selected_distance_completion_or_checkpoint":
      return selectedDistanceEndpointSections(input);
    case "easy_run_with_strides":
    case "5k_sharpening_repeats":
      return [
        timedSection("warm_up", "Easy warm-up", 8, "Start conversational and relaxed.", rpe - 1),
        timedSection("run", "Easy aerobic support", 18, "Stay easy between relaxed strides.", rpe),
        repeatSection({
          label: "Relaxed stride set",
          guidance: "Repeat short relaxed form checks with full easy recovery.",
          repeatCount: input.workoutIdentity === "5k_sharpening_repeats" ? 6 : 4,
          children: [
            repeatChild("work", "Relaxed stride", { mode: "time", duration_min: 0.35 }, rpe + 1),
            repeatChild("recover", "Easy jog recovery", { mode: "time", duration_min: 1.5 }, 2),
          ],
        }),
        timedSection("cooldown", "Easy cooldown", 6, "Finish relaxed.", 2),
      ];
    case "time_intervals":
    case "10k_rhythm_intervals":
      return intervalSections({
        label:
          input.workoutIdentity === "10k_rhythm_intervals" ? "10K rhythm set" : "Timed repeat set",
        repeatCount: input.workoutIdentity === "10k_rhythm_intervals" ? 5 : 6,
        work: {
          mode: "time",
          duration_min: input.workoutIdentity === "10k_rhythm_intervals" ? 4 : 3,
        },
        recoverMin: 2,
        rpe,
      });
    case "distance_intervals":
      return intervalSections({
        label: "Distance repeat set",
        repeatCount: 6,
        work: { mode: "distance", distance_km: 0.4 },
        recoverMin: 2,
        rpe,
      });
    case "controlled_tempo_session":
      return [
        timedSection("warm_up", "Tempo warm-up", 10, "Open conversationally before lifting.", 3),
        timedSection(
          "work",
          "Controlled tempo block",
          18,
          "Hold a strong but repeatable rhythm without chasing target-time pace.",
          rpe,
        ),
        timedSection("cooldown", "Tempo cooldown", 8, "Downshift until breathing settles.", 2),
      ];
    case "half_marathon_threshold_durability":
      return intervalSections({
        label: "Half-marathon durability set",
        repeatCount: 3,
        work: { mode: "time", duration_min: 8 },
        recoverMin: 3,
        rpe,
      });
    case "marathon_steady_specificity":
      return intervalSections({
        label: "Marathon steady durability set",
        repeatCount: 3,
        work: { mode: "time", duration_min: 12 },
        recoverMin: 4,
        rpe,
      });
    case "progression_run":
    case "long_run_with_steady_finish":
      return [
        timedSection("warm_up", "Easy opening", 10, "Start patient and conversational.", 3),
        timedSection(
          "run",
          "Aerobic body",
          Math.max(20, longRunMainMinutes(input) - 10),
          "Keep the main body aerobic and controlled.",
          Math.max(4, rpe - 1),
        ),
        timedSection(
          "finish",
          "Controlled steady finish",
          10,
          "Lift gently without turning the finish into a race effort.",
          rpe,
        ),
        timedSection("cooldown", "Easy cooldown", 6, "Finish relaxed.", 2),
      ];
    case "cutback_long_run":
    case "taper_long_run":
    case "long_aerobic_run":
    case "hike_run_endurance":
    case "mountain_long_run_time_on_feet":
    case "ultra_time_on_feet_durability":
      return [
        timedSection("warm_up", "Easy opening", 8, "Open patiently and keep control.", 3),
        timedSection(
          "run",
          "Durability run",
          longRunMainMinutes(input),
          "Build time on feet by effort, not pace.",
          rpe,
        ),
        timedSection("cooldown", "Easy cooldown", 6, "Downshift and protect recovery.", 2),
      ];
    case "rolling_hills_session":
    case "uphill_repeats":
    case "controlled_downhill_durability":
      return intervalSections({
        label: "Controlled hill set",
        repeatCount: 6,
        work: { mode: "time", duration_min: 2 },
        recoverMin: 2,
        rpe,
      });
    case "technical_trail_easy":
    case "climbing_steady_run":
      return [
        timedSection("warm_up", "Terrain warm-up", 8, "Start easy and check footing.", 3),
        timedSection(
          "run",
          "Controlled terrain run",
          32,
          "Keep effort aerobic and technical risk low.",
          rpe,
        ),
        timedSection("cooldown", "Easy cooldown", 6, "Finish relaxed.", 2),
      ];
    case "recovery_jog":
      return [
        timedSection("warm_up", "Gentle start", 3, "Let the legs loosen gradually.", 2),
        timedSection("run", "Recovery jog", 16, "Stay very easy and restorative.", 3),
        timedSection("cooldown", "Walk-down", 3, "Finish fresher than you started.", 1),
      ];
    case "steady_aerobic_run":
      return [
        timedSection(
          "warm_up",
          "Steady aerobic warm-up",
          6,
          "Start conversational and relaxed.",
          3,
        ),
        timedSection(
          "run",
          "Steady aerobic run",
          easyMainMinutes(input),
          "Hold a steady aerobic effort without forcing target-time pace.",
          rpe,
        ),
        timedSection("cooldown", "Easy cooldown", 5, "Finish relaxed.", 2),
      ];
    case "easy_aerobic_run":
    case "cutback_aerobic_run":
    case "quality_session":
    case "race_pace_session":
    case "taper_tuneup_run":
    default:
      return [
        timedSection("warm_up", "Easy warm-up", 6, "Start conversational and relaxed.", 3),
        timedSection(
          "run",
          "Aerobic run",
          easyMainMinutes(input),
          "Keep effort honest and controlled.",
          rpe,
        ),
        timedSection("cooldown", "Easy cooldown", 5, "Finish relaxed.", 2),
      ];
  }
}

function buildLowSupportTenKBeginnerSections(input: {
  workoutIdentity: string;
  workoutFamily: string;
  plannedRpe?: number | null;
  weekNumber?: number | null;
  horizonWeeks?: number | null;
  lowSupportTenKBeginner?: boolean;
}): AiBlueprintSections | null {
  if (!input.lowSupportTenKBeginner || !input.weekNumber || !input.horizonWeeks) {
    return null;
  }

  const workoutDayKind = lowSupportTenKWorkoutKind(input);
  if (!workoutDayKind) {
    return null;
  }

  const totalMinutes = resolveTenKBeginnerWorkoutTotalMinutes({
    workoutDayKind,
    weekNumber: input.weekNumber,
    horizonWeeks: input.horizonWeeks,
  });

  if (!totalMinutes) {
    return null;
  }

  if (workoutDayKind === "strides") {
    return [
      timedSection("warm_up", "Gentle warm-up", 4, "Start easy and relaxed.", 2),
      repeatSection({
        label: "Relaxed stride set",
        guidance: "Keep every stride short, smooth, and non-racing.",
        repeatCount: 4,
        children: [
          repeatChild("work", "Relaxed stride", { mode: "time", duration_min: 0.3 }, 4),
          repeatChild("recover", "Walk/jog recovery", { mode: "time", duration_min: 1.5 }, 1),
        ],
      }),
      timedSection("cooldown", "Easy cooldown", 3, "Finish fresher than you started.", 1),
    ];
  }

  if (workoutDayKind === "long_run" || workoutDayKind === "cutback_long_run") {
    return buildLowSupportTimedRunSections({
      kind: "run",
      totalMinutes,
      warmupMinutes: 5,
      cooldownMinutes: 4,
      label:
        workoutDayKind === "cutback_long_run"
          ? "Cutback run/walk durability"
          : "Run/walk durability",
      guidance: "Use easy run/walk effort and protect the weekly dose cap.",
      rpe: Math.min(input.plannedRpe ?? 4, 4),
    });
  }

  return buildLowSupportTimedRunSections({
    kind: workoutDayKind === "recovery" ? "run" : "run",
    totalMinutes,
    warmupMinutes: 4,
    cooldownMinutes: 4,
    label: workoutDayKind === "recovery" ? "Recovery run/walk" : "Easy run/walk",
    guidance: "Keep this beginner adaptation run very easy and controlled.",
    rpe: Math.min(input.plannedRpe ?? 4, workoutDayKind === "recovery" ? 3 : 4),
  });
}

function buildLowSupportTimedRunSections(input: {
  kind: Exclude<AiBlueprintSection["kind"], "repeat">;
  totalMinutes: number;
  warmupMinutes: number;
  cooldownMinutes: number;
  label: string;
  guidance: string;
  rpe: number;
}): AiBlueprintSections {
  const mainMinutes = Math.max(1, input.totalMinutes - input.warmupMinutes - input.cooldownMinutes);

  return [
    timedSection("warm_up", "Gentle warm-up", input.warmupMinutes, "Start easy and relaxed.", 2),
    timedSection(input.kind, input.label, mainMinutes, input.guidance, input.rpe),
    timedSection(
      "cooldown",
      "Easy cooldown",
      input.cooldownMinutes,
      "Finish relaxed and protect recovery.",
      1,
    ),
  ];
}

function lowSupportTenKWorkoutKind(input: {
  workoutIdentity: string;
  workoutFamily: string;
}): LowSupportTenKWorkoutKind | null {
  switch (input.workoutIdentity) {
    case "recovery_jog":
      return "recovery";
    case "easy_run_with_strides":
      return "strides";
    case "cutback_long_run":
    case "taper_long_run":
      return "cutback_long_run";
    case "long_aerobic_run":
    case "long_run_with_steady_finish":
      return "long_run";
    case "easy_aerobic_run":
    case "cutback_aerobic_run":
    case "steady_aerobic_run":
      return "easy";
    default:
      return null;
  }
}

function selectedDistanceEndpointSections(input: {
  distanceMeters?: number | null;
  plannedRpe?: number | null;
}): AiBlueprintSections {
  const distanceMeters = input.distanceMeters ?? 10_000;
  const distanceParts = buildCoachAuthoredEndpointDynamics(distanceMeters);
  const rpe = input.plannedRpe ?? 7;

  return [
    timedSection(
      "warm_up",
      "Patient opening",
      10,
      "Start easy before the selected-distance block.",
      3,
    ),
    repeatSection({
      label: "Selected-distance main work progression",
      guidance:
        "Complete the selected distance as an ordered coach-authored progression; this is not a pace target.",
      repeatCount: 1,
      children: [
        repeatChild(
          "run",
          "Controlled opening",
          { mode: "distance", distance_km: metersToKm(distanceParts.openingMeters) },
          Math.max(3, rpe - 1),
          {
            guidance:
              "Start deliberately easier than the runner wants so the exact distance stays controlled.",
            cue: "Start patient; finish time remains goal intent, not executable pace.",
            intensity: "patient controlled effort",
          },
        ),
        repeatChild(
          "run",
          "Settled middle",
          { mode: "distance", distance_km: metersToKm(distanceParts.bodyMeters) },
          rpe,
          {
            guidance:
              "Settle into sustainable effort with steady form and no invented pace or HR target.",
            cue: "Settle into a repeatable rhythm by effort and breathing.",
            intensity: "steady sustainable effort",
          },
        ),
        repeatChild(
          "finish",
          "Protected finish",
          { mode: "distance", distance_km: metersToKm(distanceParts.finishMeters) },
          Math.min(9, rpe + 1),
          {
            guidance:
              "Finish the selected distance with control and form; do not turn the finish into a sprint.",
            cue: "Close strong only if form stays smooth; protect completion first.",
            intensity:
              distanceMeters > 30_000 ? "protected finish effort" : "controlled finish effort",
          },
        ),
      ],
    }),
    timedSection(
      "cooldown",
      "Easy cooldown",
      6,
      "Walk or jog easily after the selected distance.",
      2,
    ),
  ];
}

function buildCoachAuthoredEndpointDynamics(distanceMeters: number) {
  const normalizedMeters = Math.max(3_000, Math.round(distanceMeters));
  const target =
    normalizedMeters <= 12_000
      ? { openingMeters: 1_500, finishMeters: 2_500 }
      : normalizedMeters <= 18_000
        ? { openingMeters: 2_000, finishMeters: 3_500 }
        : normalizedMeters <= 25_000
          ? { openingMeters: 3_000, finishMeters: 5_100 }
          : { openingMeters: 5_000, finishMeters: 7_195 };
  const openingMeters = Math.min(target.openingMeters, Math.max(500, normalizedMeters - 2_000));
  const finishMeters = Math.min(
    target.finishMeters,
    Math.max(500, normalizedMeters - openingMeters - 1_000),
  );

  return {
    openingMeters,
    bodyMeters: Math.max(500, normalizedMeters - openingMeters - finishMeters),
    finishMeters,
  };
}

function metersToKm(meters: number) {
  return Number((meters / 1000).toFixed(3));
}

function intervalSections(input: {
  label: string;
  repeatCount: number;
  work: { mode: "time"; duration_min: number } | { mode: "distance"; distance_km: number };
  recoverMin: number;
  rpe: number;
}): AiBlueprintSections {
  return [
    timedSection("warm_up", "Controlled warm-up", 10, "Open easy before the repeat set.", 3),
    repeatSection({
      label: input.label,
      guidance: "Keep every repeat controlled enough that the final rep can match the first.",
      repeatCount: input.repeatCount,
      children: [
        repeatChild("work", "Controlled work", input.work, input.rpe),
        repeatChild(
          "recover",
          "Easy recovery",
          { mode: "time", duration_min: input.recoverMin },
          2,
        ),
      ],
    }),
    timedSection("cooldown", "Easy cooldown", 8, "Finish relaxed and protect the next run.", 2),
  ];
}

function timedSection(
  kind: Exclude<AiBlueprintSection["kind"], "repeat">,
  label: string,
  durationMin: number,
  guidance: string,
  rpe: number,
): AiBlueprintSection {
  return {
    kind,
    label,
    guidance,
    purpose: null,
    prescription: {
      mode: "time",
      duration_min: roundWholeMinute(durationMin),
      distance_km: null,
      repeat_count: null,
      children: null,
    },
    target: effortTarget(kind, guidance, rpe),
  };
}

function distanceSection(
  kind: Exclude<AiBlueprintSection["kind"], "repeat">,
  label: string,
  distanceKm: number,
  guidance: string,
  rpe: number,
): AiBlueprintSection {
  return {
    kind,
    label,
    guidance,
    purpose: null,
    prescription: {
      mode: "distance",
      duration_min: null,
      distance_km: distanceKm,
      repeat_count: null,
      children: null,
    },
    target: effortTarget(kind, guidance, rpe),
  };
}

function repeatSection(input: {
  label: string;
  guidance: string;
  repeatCount: number;
  children: AiBlueprintRepeatChild[];
}): AiBlueprintSection {
  return {
    kind: "repeat",
    label: input.label,
    guidance: input.guidance,
    purpose: "Structured repeat set; child blocks own effort guidance.",
    prescription: {
      mode: "repeats",
      duration_min: null,
      distance_km: null,
      repeat_count: input.repeatCount,
      children: input.children,
    },
    target: null,
  };
}

function repeatChild(
  kind: AiBlueprintRepeatChild["kind"],
  label: string,
  prescription: { mode: "time"; duration_min: number } | { mode: "distance"; distance_km: number },
  rpe: number,
  options: {
    guidance?: string;
    purpose?: string | null;
    cue?: string;
    intensity?: string;
    hint?: string;
  } = {},
): AiBlueprintRepeatChild {
  return {
    kind,
    label,
    guidance:
      options.guidance ??
      (kind === "recover"
        ? "Recover easily before the next repeat."
        : "Keep this repeat controlled."),
    purpose: options.purpose ?? null,
    prescription: {
      mode: prescription.mode,
      duration_min:
        prescription.mode === "time" ? roundOneDecimal(prescription.duration_min) : null,
      distance_km: prescription.mode === "distance" ? prescription.distance_km : null,
    },
    target: effortTarget(kind, options.cue ?? label, rpe, {
      intensity: options.intensity,
      hint: options.hint,
    }),
  };
}

function effortTarget(
  kind: string,
  cue: string,
  rpe: number,
  options: { intensity?: string; hint?: string } = {},
) {
  return {
    intensity:
      options.intensity ??
      (kind === "recover" || kind === "cooldown" ? "easy recovery" : "controlled effort"),
    cue,
    hint: options.hint ?? "Use effort first; do not chase invented pace or heart-rate targets.",
    rpe: clampRpe(rpe),
  };
}

function easyMainMinutes(input: { workoutFamily: string; weekNumber?: number | null }) {
  if (input.workoutFamily === "steady") {
    return 32;
  }

  return input.weekNumber && input.weekNumber > 2 ? 28 : 22;
}

function longRunMainMinutes(input: {
  workoutIdentity: string;
  distanceMeters?: number | null;
  weekNumber?: number | null;
  horizonWeeks?: number | null;
}) {
  const weekNumber = Math.max(1, input.weekNumber ?? 1);
  const horizonWeeks = Math.max(2, input.horizonWeeks ?? 12);
  const progress = Math.max(0, Math.min(1, (weekNumber - 1) / Math.max(1, horizonWeeks - 2)));
  const distanceMeters = input.distanceMeters ?? 10_000;
  const peak = distanceMeters > 30_000 ? 155 : distanceMeters > 10_000 ? 75 : 45;
  const base = distanceMeters > 30_000 ? 45 : distanceMeters > 10_000 ? 36 : 28;
  if (horizonWeeks <= 3 && input.workoutIdentity === "long_aerobic_run") {
    return base;
  }
  const planned = base + (peak - base) * progress;

  if (input.workoutIdentity === "cutback_long_run") {
    return Math.max(28, planned * 0.75);
  }

  if (input.workoutIdentity === "taper_long_run") {
    return Math.max(16, Math.min(planned * 0.45, base * 0.6));
  }

  return planned;
}

function clampRpe(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function roundWholeMinute(value: number) {
  return Math.max(1, Math.round(value));
}
