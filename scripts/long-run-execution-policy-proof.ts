import assert from "node:assert/strict";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  aiAuthoredPlanFirstCompilerDraftSchema,
  type AiAuthoredPlanFirstCompilerDraft,
  type AiAuthoredPlanFirstCompilerStep,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import { resolveEffectiveHeartRateGuidance } from "../src/lib/heart-rate-zones";
import type { CanonicalWorkoutIdentity } from "../src/lib/rich-workout-model";
import { validateLongRunExecutionPolicy } from "../src/lib/long-run-execution-policy";
import { buildDefaultAuthoringInput } from "./ai-first-plan-draft-ops/fixtures";

type ProviderSection = AiAuthoredPlanFirstCompilerStep;
type ProviderTarget = Extract<ProviderSection, { kind: "unit" }>["target"];

const authoringInput = buildDefaultAuthoringInput("representative_10k");
const z2Command = requireHeartRateCommand("Z2");
const z3Command = requireHeartRateCommand("Z3");
const z4Command = requireHeartRateCommand("Z4");
const paceOne = "6:10-6:30/km";
const paceTwo = "5:50-6:10/km";
const paceThree = "5:30-5:50/km";

export function validateGeneratedLongRunExecutionPolicyContract() {
  for (const minutes of [50, 60]) {
    assertGeneratedAccepted(`continuous ${minutes}-minute long aerobic`, "long_aerobic_run", [
      providerUnit("main", minutes, bpmTarget(z2Command), "body"),
    ]);
  }

  assertGeneratedAccepted("75-minute meaningful anatomy", "long_aerobic_run", [
    providerUnit("warmup", 5, paceTarget(paceOne), "entry"),
    providerUnit("main", 65, bpmTarget(z2Command), "body"),
    providerUnit("cooldown", 5, paceTarget(paceOne), "settle"),
  ]);
  assertGeneratedAccepted("90-minute boundary without Hydration", "long_aerobic_run", [
    providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
    providerUnit("main", 75, bpmTarget(z2Command), "body"),
    providerUnit("recovery", 10, bpmTarget(z2Command), "support"),
  ]);
  assertGeneratedRejected(
    "95-minute runnable-support discriminator without Hydration",
    "long_aerobic_run",
    [
      providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
      providerUnit("main", 80, bpmTarget(z2Command), "body"),
      providerUnit("recovery", 10, bpmTarget(z2Command), "support"),
    ],
    "ai_authored_plan_first_long_run_anatomy_missing",
  );
  assertGeneratedAccepted(
    "95-minute runnable-support discriminator with Hydration",
    "long_aerobic_run",
    [
      providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
      providerUnit("main", 80, bpmTarget(z2Command), "body"),
      providerHydration(),
      providerUnit("recovery", 10, bpmTarget(z2Command), "support"),
    ],
  );
  assertGeneratedRejected(
    "95-minute Repeat recovery discriminator without Hydration",
    "long_aerobic_run",
    [
      providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
      providerUnit("main", 70, bpmTarget(z2Command), "body"),
      providerRepeat(2, 5, 5, bpmTarget(z2Command)),
    ],
    "ai_authored_plan_first_long_run_anatomy_missing",
  );
  assertGeneratedAccepted(
    "95-minute Repeat recovery discriminator with Hydration",
    "long_aerobic_run",
    [
      providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
      providerUnit("main", 70, bpmTarget(z2Command), "body"),
      providerHydration(),
      providerRepeat(2, 5, 5, bpmTarget(z2Command)),
    ],
  );
  assertGeneratedRejected(
    "known 95-minute runnable lower bound with distance support",
    "long_aerobic_run",
    [
      providerUnit("warmup", 5, bpmTarget(z2Command), "entry"),
      providerUnit("main", 80, bpmTarget(z2Command), "body"),
      providerUnit("recovery", 10, bpmTarget(z2Command), "support"),
      providerDistanceSupport(1, bpmTarget(z2Command)),
    ],
    "ai_authored_plan_first_long_run_anatomy_missing",
  );
  assert.deepEqual(
    validateLongRunExecutionPolicy({
      workoutIdentity: "long_aerobic_run",
      stages: [
        {
          role: "entry",
          runnable: true,
          durationSeconds: 5 * 60,
          target: { mode: "heart_rate", command: z2Command },
        },
        {
          role: "body",
          runnable: true,
          durationSeconds: 85 * 60,
          target: { mode: "heart_rate", command: z2Command },
        },
        { role: "event", runnable: false, durationSeconds: 10 * 60 },
      ],
    }),
    [],
    "A timed non-runnable marker must not inflate a 90-minute runnable total.",
  );
  assertGeneratedAccepted("105-minute Hydration anatomy", "long_aerobic_run", [
    providerUnit("warmup", 5, paceTarget(paceOne), "entry"),
    providerUnit("main", 80, bpmTarget(z2Command), "body"),
    providerHydration(),
    providerUnit("cooldown", 20, paceTarget(paceOne), "settle"),
  ]);
  assertGeneratedAccepted("four-hour checkpoint-separated anatomy", "long_aerobic_run", [
    providerUnit("warmup", 5, paceTarget(paceOne), "entry"),
    providerUnit("main", 110, bpmTarget(z2Command), "body"),
    providerHydration(),
    providerUnit("main", 120, bpmTarget(z2Command), "body"),
    providerUnit("cooldown", 5, paceTarget(paceOne), "settle"),
  ]);

  assertGeneratedRejected(
    "four-hour single-leaf anatomy",
    "long_aerobic_run",
    [providerUnit("main", 240, bpmTarget(z2Command), "body")],
    "ai_authored_plan_first_long_run_anatomy_missing",
  );
  assertGeneratedRejected(
    "one-minute shell anatomy",
    "long_aerobic_run",
    [
      providerUnit("warmup", 1, paceTarget(paceOne), "entry"),
      providerUnit("main", 61, bpmTarget(z2Command), "body"),
    ],
    "ai_authored_plan_first_long_run_anatomy_missing",
  );
  assertGeneratedRejected(
    "decorative equal split",
    "long_aerobic_run",
    [
      providerUnit("main", 40, bpmTarget(z2Command), "body"),
      providerUnit("main", 40, bpmTarget(z2Command), "body"),
    ],
    "ai_authored_plan_first_long_run_decorative_split",
  );

  for (const identity of ["long_aerobic_run", "cutback_long_run", "taper_long_run"] as const) {
    assertGeneratedRejected(
      `${identity} changed command`,
      identity,
      [
        providerUnit("main", 45, bpmTarget(z2Command), "body"),
        providerHydration(),
        providerUnit("main", 20, bpmTarget(z3Command), "body"),
      ],
      "ai_authored_plan_first_long_run_target_change_not_allowed",
    );
  }

  for (const identity of ["long_run_with_steady_finish", "marathon_steady_specificity"] as const) {
    const controlled = assertGeneratedAccepted(`${identity} controlled change`, identity, [
      providerUnit("main", 60, bpmTarget(z2Command), "body"),
      providerUnit("main", 15, bpmTarget(z3Command), "finish"),
    ]);
    assert.equal(
      controlled.canonicalPlan.planned_workouts[0]?.segments[1]?.segment_type,
      "finish",
      `${identity} must retain the explicit finish segment in canonical plan truth.`,
    );
    assertGeneratedRejected(
      `${identity} changed body without finish role`,
      identity,
      [
        providerUnit("main", 60, bpmTarget(z2Command), "body"),
        providerUnit("main", 15, bpmTarget(z3Command), "body"),
      ],
      "ai_authored_plan_first_long_run_finish_role_missing",
    );
    assertGeneratedRejected(
      `${identity} third command`,
      identity,
      [
        providerUnit("main", 45, bpmTarget(z2Command), "body"),
        providerUnit("main", 15, bpmTarget(z3Command), "finish"),
        providerUnit("main", 15, bpmTarget(z4Command), "finish"),
      ],
      "ai_authored_plan_first_long_run_target_change_not_allowed",
    );
    assertGeneratedRejected(
      `${identity} short changed finish`,
      identity,
      [
        providerUnit("main", 60, bpmTarget(z2Command), "body"),
        providerUnit("main", 5, bpmTarget(z3Command), "finish"),
      ],
      "ai_authored_plan_first_long_run_target_stage_too_short",
    );
    assertGeneratedRejected(
      `${identity} mixed substantive mode`,
      identity,
      [
        providerUnit("main", 60, bpmTarget(z2Command), "body"),
        providerUnit("main", 15, paceTarget(paceTwo), "finish"),
      ],
      "ai_authored_plan_first_long_run_target_mode_mixed",
    );
    assertGeneratedAccepted(`${identity} distance-based pace finish`, identity, [
      providerDistanceUnit("main", 12, paceTarget(paceOne), "body"),
      providerDistanceUnit("main", 3, paceTarget(paceTwo), "finish"),
    ]);
    assertGeneratedRejected(
      `${identity} distance-based BPM finish`,
      identity,
      [
        providerDistanceUnit("main", 12, bpmTarget(z2Command), "body"),
        providerDistanceUnit("main", 3, bpmTarget(z3Command), "finish"),
      ],
      "ai_authored_plan_first_long_run_target_stage_too_short",
    );
  }

  for (const identity of [
    "hike_run_endurance",
    "mountain_long_run_time_on_feet",
    "ultra_time_on_feet_durability",
  ] as const) {
    assertGeneratedRejected(
      `${identity} single body`,
      identity,
      [providerUnit("main", 50, bpmTarget(z2Command), "body")],
      "ai_authored_plan_first_long_run_anatomy_missing",
    );
    assertGeneratedAccepted(`${identity} explicit anatomy`, identity, [
      providerUnit("main", 20, bpmTarget(z2Command), "body"),
      providerHydration(),
      providerUnit("main", 20, bpmTarget(z2Command), "body"),
    ]);
  }

  for (const stageCount of [2, 3]) {
    assertGeneratedAccepted(
      `progression ${stageCount} stages`,
      "progression_run",
      [paceOne, paceTwo, paceThree]
        .slice(0, stageCount)
        .map((command) => providerUnit("main", 10, paceTarget(command), "body")),
    );
  }
  for (const stageCount of [1, 4]) {
    assertGeneratedRejected(
      `progression ${stageCount} stages`,
      "progression_run",
      Array.from({ length: stageCount }, (_, index) =>
        providerUnit(
          "main",
          10,
          paceTarget([paceOne, paceTwo, paceThree, "5:10-5:30/km"][index]!),
          "body",
        ),
      ),
      "ai_authored_plan_first_progression_stage_count_invalid",
    );
  }
  assertGeneratedRejected(
    "decorative progression commands",
    "progression_run",
    [
      providerUnit("main", 10, paceTarget(paceOne), "body"),
      providerUnit("main", 10, paceTarget(paceOne), "body"),
    ],
    "ai_authored_plan_first_progression_target_sequence_incomplete",
  );
}

function assertGeneratedAccepted(
  label: string,
  identity: CanonicalWorkoutIdentity,
  sections: ProviderSection[],
) {
  const result = compileAiAuthoredPlanFirstDraft({
    draft: providerDraft(identity, sections),
    authoringInput,
  });
  assert.equal(result.ok, true, result.ok ? "" : `${label}: ${JSON.stringify(result.issues)}`);
  if (!result.ok) throw new Error(`${label} unexpectedly failed.`);
  return result;
}

function assertGeneratedRejected(
  label: string,
  identity: CanonicalWorkoutIdentity,
  sections: ProviderSection[],
  expectedCode: string,
) {
  const draft = providerDraft(identity, sections);
  assert.equal(aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft).success, true);
  const result = compileAiAuthoredPlanFirstDraft({ draft, authoringInput });
  assert.equal(result.ok, false, `${label} must fail before review.`);
  if (result.ok) return;
  assert.ok(
    result.issues.some((issue) => issue.code === expectedCode),
    `${label}: expected ${expectedCode}, received ${JSON.stringify(result.issues)}`,
  );
}

function providerDraft(
  identity: CanonicalWorkoutIdentity,
  sections: ProviderSection[],
): AiAuthoredPlanFirstCompilerDraft {
  return {
    workouts: [
      {
        date: "2026-07-06",
        phase: "Policy proof",
        workout_identity: identity,
        title: "Authored strategy proof",
        cue: "Execute the authored ordered stages.",
        sections,
      },
    ],
    endpoint: {
      date: "2026-07-11",
      phase: "Goal",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "10K endpoint",
      cue: "Complete the selected distance.",
      sections: [
        {
          kind: "unit",
          segment_type: "main",
          label: "Selected distance",
          cue: null,
          prescription: { mode: "distance", distance_km: 10 },
          target: paceTarget("5:30-5:45/km"),
        },
      ],
    },
  };
}

function providerUnit(
  segmentType: Extract<ProviderSection, { kind: "unit" }>["segment_type"],
  durationMinutes: number,
  target: ProviderTarget,
  stageRole: "entry" | "body" | "finish" | "settle" | "support",
): ProviderSection {
  return {
    kind: "unit",
    segment_type: stageRole === "finish" ? "finish" : segmentType,
    label: "Authored stage",
    cue: null,
    prescription: { mode: "time", duration_min: durationMinutes },
    target,
  };
}

function providerHydration(): ProviderSection {
  return { kind: "hydration", label: "Hydration", cue: "Take water." };
}

function providerRepeat(
  rounds: number,
  workMinutes: number,
  recoveryMinutes: number,
  target: ProviderTarget,
): ProviderSection {
  return {
    kind: "repeat",
    segment_type: "main",
    label: "Authored repeated support",
    cue: null,
    rounds,
    children: [
      {
        role: "work",
        label: "Run",
        cue: null,
        prescription: { mode: "time", duration_min: workMinutes },
        target,
      },
      {
        role: "recover",
        label: "Runnable recovery",
        cue: null,
        prescription: { mode: "time", duration_min: recoveryMinutes },
        target,
      },
    ],
  };
}

function providerDistanceSupport(distanceKm: number, target: ProviderTarget): ProviderSection {
  return {
    kind: "unit",
    segment_type: "recovery",
    label: "Distance-based runnable support",
    cue: null,
    prescription: { mode: "distance", distance_km: distanceKm },
    target,
  };
}

function providerDistanceUnit(
  segmentType: Extract<ProviderSection, { kind: "unit" }>["segment_type"],
  distanceKm: number,
  target: ProviderTarget,
  stageRole: "body" | "finish",
): ProviderSection {
  return {
    kind: "unit",
    segment_type: stageRole === "finish" ? "finish" : segmentType,
    label: "Authored distance stage",
    cue: null,
    prescription: { mode: "distance", distance_km: distanceKm },
    target,
  };
}

function paceTarget(command: string): ProviderTarget {
  return { primary_execution_mode: "pace", command };
}

function bpmTarget(command: string): ProviderTarget {
  const bandReference = command === z3Command ? "Z3" : command === z4Command ? "Z4" : "Z2";
  return { primary_execution_mode: "heart_rate", band_reference: bandReference, command };
}

function requireHeartRateCommand(reference: string) {
  const guidance = resolveEffectiveHeartRateGuidance(
    authoringInput.runnerFacts.heartRateProfile,
    reference,
  );
  assert.ok(guidance, `${reference} must resolve for the proof runner.`);
  return guidance.rangeBpm;
}

export function buildPolicyCompliantProviderSectionsForIdentity(
  identity: CanonicalWorkoutIdentity,
  heartRateCommand = z2Command,
): ProviderSection[] {
  if (identity === "progression_run") {
    return [
      providerUnit("main", 15, paceTarget(paceOne), "body"),
      providerUnit("main", 15, paceTarget(paceTwo), "body"),
    ];
  }

  if (
    identity === "hike_run_endurance" ||
    identity === "mountain_long_run_time_on_feet" ||
    identity === "ultra_time_on_feet_durability"
  ) {
    return [
      providerUnit("main", 15, bpmTarget(heartRateCommand), "body"),
      providerHydration(),
      providerUnit("main", 15, bpmTarget(heartRateCommand), "body"),
    ];
  }

  return [providerUnit("main", 40, paceTarget(paceOne), "body")];
}

export function buildPolicyCompliantLongRunSections(
  durationMinutes: number,
  command: string,
): ProviderSection[] {
  if (durationMinutes <= 60) {
    return [providerUnit("main", durationMinutes, bpmTarget(command), "body")];
  }

  if (durationMinutes <= 90) {
    return [
      providerUnit("warmup", 5, paceTarget(paceOne), "entry"),
      providerUnit("main", durationMinutes - 10, bpmTarget(command), "body"),
      providerUnit("cooldown", 5, paceTarget(paceOne), "settle"),
    ];
  }

  return [
    providerUnit("warmup", 5, paceTarget(paceOne), "entry"),
    providerUnit("main", durationMinutes - 25, bpmTarget(command), "body"),
    providerHydration(),
    providerUnit("cooldown", 20, paceTarget(paceOne), "settle"),
  ];
}
