import assert from "node:assert/strict";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  aiAuthoredPlanFirstCompilerDraftSchema,
  buildAiAuthoredPlanFirstPrompt,
  type AiAuthoredPlanFirstCompilerDraft,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import type { EffectiveRunnerHeartRateProfile } from "../src/lib/heart-rate-zones";
import type { CanonicalWorkoutIdentity } from "../src/lib/rich-workout-model";
import { buildDefaultAuthoringInput } from "./ai-first-plan-draft-ops/fixtures";

type ProviderTarget =
  AiAuthoredPlanFirstCompilerDraft["workouts"][number]["sections"][number] extends infer Section
    ? Section extends { kind: "unit"; target: infer Target }
      ? Target
      : never
    : never;

type ProofCompileOptions = {
  cue?: string | null;
  workoutIdentity?: CanonicalWorkoutIdentity;
  repeatSegmentType?: "interval_block" | "strides";
  unitSegmentType?: "main" | "finish";
};

const baseAuthoringInput = buildDefaultAuthoringInput("representative_10k");

export function validatePlanFirstHeartRateTargetContract() {
  const personalProfile = profile("personal", [
    ["Z1", "Recovery", 100, 120],
    ["Z2", "Easy", 115, 140],
    ["Z3", "Long aerobic", 130, 150],
    ["Z4", "Steady", 145, 165],
    ["Z5", "Tempo", 160, 185],
  ]);
  const coincidentProfile = profile("personal", [
    ["Z1", "Recovery", 100, 120],
    ["Z2", "Easy", 115, 140],
    ["Z3", "Long aerobic", 115, 140],
    ["Z4", "Steady", 145, 165],
    ["Z5", "Tempo", 160, 185],
  ]);

  assertAccepted(
    "personal full named band",
    personalProfile,
    heartRateTarget("Z2", "115-140 bpm"),
    {
      reference: "Z2",
      executionMin: 115,
      executionMax: 140,
      bandMin: 115,
      bandMax: 140,
      rangeKind: "full_band",
      profileSource: "personal",
    },
  );
  assertAccepted(
    "overlapping named-band subrange",
    personalProfile,
    heartRateTarget("Z3", "135-145 bpm"),
    {
      reference: "Z3",
      executionMin: 135,
      executionMax: 145,
      bandMin: 130,
      bandMax: 150,
      rangeKind: "ai_selected_subrange",
      profileSource: "personal",
    },
  );
  assertAccepted(
    "exactly five-BPM subrange",
    personalProfile,
    heartRateTarget("Z2", "120-125 bpm"),
    {
      reference: "Z2",
      executionMin: 120,
      executionMax: 125,
      bandMin: 115,
      bandMax: 140,
      rangeKind: "ai_selected_subrange",
      profileSource: "personal",
    },
  );
  for (const reference of ["Z2", "Z3"] as const) {
    assertAccepted(
      `coincident ${reference} identity`,
      coincidentProfile,
      heartRateTarget(reference, "115-140 bpm"),
      {
        reference,
        executionMin: 115,
        executionMax: 140,
        bandMin: 115,
        bandMax: 140,
        rangeKind: "full_band",
        profileSource: "personal",
      },
    );
  }
  assertAccepted(
    "estimated subrange remains estimated",
    baseAuthoringInput.runnerFacts.heartRateProfile,
    heartRateTarget("Z2", "115-125 bpm"),
    {
      reference: "Z2",
      executionMin: 115,
      executionMax: 125,
      bandMin: 110,
      bandMax: 130,
      rangeKind: "ai_selected_subrange",
      profileSource: "estimated",
    },
  );

  assertSchemaRejected("missing identity", (target) => delete target.band_reference);
  assertSchemaRejected("composite identity", (target) => {
    target.band_reference = "Z1-Z2";
  });
  assertSchemaRejected("single BPM", (target) => {
    target.command = "125 bpm";
  });
  assertRejected(
    "mismatched identity",
    personalProfile,
    heartRateTarget("Z1", "115-140 bpm"),
    /hr_execution_range_outside_band/,
  );
  const gappedProfile = profile("personal", [
    ["Z1", "Recovery", 100, 110],
    ["Z2", "Easy", 115, 125],
    ["Z3", "Long aerobic", 135, 150],
    ["Z4", "Steady", 155, 170],
    ["Z5", "Tempo", 175, 190],
  ]);
  assertRejected(
    "gapped cross-band range",
    gappedProfile,
    heartRateTarget("Z2", "120-140 bpm"),
    /hr_execution_range_outside_band/,
  );
  assertRejected(
    "under-five subrange",
    personalProfile,
    heartRateTarget("Z2", "120-124 bpm"),
    /hr_execution_subrange_too_narrow/,
  );
  assertRejected(
    "subrange without authored purpose",
    personalProfile,
    heartRateTarget("Z2", "120-130 bpm"),
    /hr_execution_subrange_purpose_missing/,
    { cue: null },
  );

  const fiveBpmBandProfile = profile("personal", [
    ["Z1", "Recovery", 100, 110],
    ["Z2", "Easy", 120, 125],
    ["Z3", "Long aerobic", 130, 145],
    ["Z4", "Steady", 150, 165],
    ["Z5", "Tempo", 170, 185],
  ]);
  assertAccepted(
    "five-BPM band in full",
    fiveBpmBandProfile,
    heartRateTarget("Z2", "120-125 bpm"),
    {
      reference: "Z2",
      executionMin: 120,
      executionMax: 125,
      bandMin: 120,
      bandMax: 125,
      rangeKind: "full_band",
      profileSource: "personal",
    },
  );
  assertRejected(
    "five-BPM band cannot narrow",
    fiveBpmBandProfile,
    heartRateTarget("Z2", "121-125 bpm"),
    /hr_execution_subrange_too_narrow/,
  );

  const zeroWidthProfile = profile("personal", [
    ["Z1", "Recovery", 100, 110],
    ["Z2", "Easy", 120, 120],
    ["Z3", "Long aerobic", 130, 145],
    ["Z4", "Steady", 150, 165],
    ["Z5", "Tempo", 170, 185],
  ]);
  assertRejected(
    "zero-width band execution",
    zeroWidthProfile,
    heartRateTarget("Z2", "120-120 bpm"),
    /hr_execution_range_invalid/,
  );
  const zeroWidthSchema = JSON.stringify(
    buildAiAuthoredPlanFirstPrompt({
      authoringInput: withProfile(zeroWidthProfile),
      today: baseAuthoringInput.schedule.startDate,
    }).responseSchema,
  );
  assert.doesNotMatch(
    zeroWidthSchema,
    /"band_reference":\{"type":"string","enum":\[[^\]]*"Z2"/,
    "A zero-width band must not be provider-authorable.",
  );

  for (const [identity, segmentType] of [
    ["distance_intervals", "interval_block"],
    ["easy_run_with_strides", "strides"],
    ["uphill_repeats", "interval_block"],
    ["taper_tuneup_run", "interval_block"],
  ] as const) {
    assertRejected(
      `${identity} short-stage subrange`,
      personalProfile,
      heartRateTarget("Z2", "120-130 bpm"),
      /hr_execution_subrange_prohibited/,
      { workoutIdentity: identity, repeatSegmentType: segmentType },
    );
  }
  for (const identity of [
    "distance_intervals",
    "time_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "uphill_repeats",
  ] as const) {
    assertRejected(
      `${identity} unit-shaped short-stage subrange`,
      personalProfile,
      heartRateTarget("Z2", "120-130 bpm"),
      /hr_execution_subrange_prohibited/,
      { workoutIdentity: identity },
    );
  }
  assertRejected(
    "taper finish subrange",
    personalProfile,
    heartRateTarget("Z2", "120-130 bpm"),
    /hr_execution_subrange_prohibited/,
    { workoutIdentity: "taper_tuneup_run", unitSegmentType: "finish" },
  );
}

function assertAccepted(
  label: string,
  heartRateProfile: EffectiveRunnerHeartRateProfile,
  target: ProviderTarget,
  expected: {
    reference: string;
    executionMin: number;
    executionMax: number;
    bandMin: number;
    bandMax: number;
    rangeKind: string;
    profileSource: string;
  },
) {
  const result = compile(heartRateProfile, target);
  assert.equal(result.ok, true, result.ok ? "" : `${label}: ${JSON.stringify(result.issues)}`);
  if (!result.ok) return;
  const compiled = firstHeartRateTarget(result.canonicalPlan);
  assert.ok(compiled, `${label}: compiled HR target is required.`);
  assert.equal(compiled.hr_bpm_min, expected.executionMin);
  assert.equal(compiled.hr_bpm_max, expected.executionMax);
  assert.equal(compiled.extra?.hr_zone_reference, expected.reference);
  assert.equal(compiled.extra?.hr_band_bpm_min, expected.bandMin);
  assert.equal(compiled.extra?.hr_band_bpm_max, expected.bandMax);
  assert.equal(compiled.extra?.hr_execution_range_kind, expected.rangeKind);
  assert.equal(compiled.extra?.hr_profile_source, expected.profileSource);
}

function assertRejected(
  label: string,
  heartRateProfile: EffectiveRunnerHeartRateProfile,
  target: ProviderTarget,
  expectedIssue: RegExp,
  options: ProofCompileOptions = {},
) {
  const result = compile(heartRateProfile, target, options);
  assert.equal(result.ok, false, `${label} must be rejected.`);
  if (result.ok) return;
  assert.match(JSON.stringify(result.issues), expectedIssue, label);
}

function assertSchemaRejected(label: string, mutate: (target: Record<string, string>) => void) {
  const draft = providerDraft(
    baseAuthoringInput.runnerFacts.heartRateProfile,
    heartRateTarget("Z2", "110-130 bpm"),
  );
  const target = (draft.workouts[0]!.sections[0] as { target: Record<string, string> }).target;
  mutate(target);
  const result = aiAuthoredPlanFirstCompilerDraftSchema.safeParse(draft);
  assert.equal(result.success, false, `${label} must fail the provider schema.`);
}

function compile(
  heartRateProfile: EffectiveRunnerHeartRateProfile,
  target: ProviderTarget,
  options: ProofCompileOptions = {},
) {
  return compileAiAuthoredPlanFirstDraft({
    draft: providerDraft(heartRateProfile, target, options),
    authoringInput: withProfile(heartRateProfile),
  });
}

function providerDraft(
  _heartRateProfile: EffectiveRunnerHeartRateProfile,
  target: ProviderTarget,
  options: ProofCompileOptions = {},
): AiAuthoredPlanFirstCompilerDraft {
  const cue =
    options.cue === undefined ? "Use this narrower range for the controlled stage." : options.cue;
  const sections = options.repeatSegmentType
    ? [
        {
          kind: "repeat" as const,
          segment_type: options.repeatSegmentType,
          label: "Short repeat",
          cue,
          rounds: 3,
          children: [
            {
              role: "work" as const,
              label: "Work",
              cue,
              prescription: { mode: "time" as const, duration_min: 2 },
              target,
            },
            {
              role: "recover" as const,
              label: "Recover",
              cue: "Reset.",
              prescription: { mode: "time" as const, duration_min: 1 },
              target: paceTarget("7:00-7:30/km"),
            },
          ],
        },
      ]
    : [
        {
          kind: "unit" as const,
          segment_type: options.unitSegmentType ?? ("main" as const),
          label: "Aerobic stage",
          cue,
          prescription: { mode: "time" as const, duration_min: 30 },
          target,
        },
      ];

  return {
    workouts: [
      {
        date: "2026-07-06",
        phase: "Proof",
        workout_identity: options.workoutIdentity ?? "easy_aerobic_run",
        title: "Heart-rate target proof",
        cue: "Execute the authored target.",
        sections,
      },
    ],
    endpoint: {
      date: "2026-07-14",
      phase: "Endpoint",
      workout_identity: "selected_distance_completion_or_checkpoint",
      title: "10K endpoint",
      cue: "Complete the selected distance.",
      sections: [
        {
          kind: "unit",
          segment_type: "main",
          label: "10K",
          cue: "Hold the authored pace.",
          prescription: { mode: "distance", distance_km: 10 },
          target: paceTarget("5:30-5:45/km"),
        },
      ],
    },
  };
}

function heartRateTarget(
  bandReference: "Z1" | "Z2" | "Z3" | "Z4" | "Z5",
  command: string,
): ProviderTarget {
  return {
    primary_execution_mode: "heart_rate",
    band_reference: bandReference,
    command,
  };
}

function paceTarget(command: string): ProviderTarget {
  return { primary_execution_mode: "pace", command };
}

function withProfile(heartRateProfile: EffectiveRunnerHeartRateProfile) {
  return {
    ...baseAuthoringInput,
    runnerFacts: {
      ...baseAuthoringInput.runnerFacts,
      heartRateProfile,
    },
  };
}

function profile(
  source: "personal" | "estimated",
  zones: Array<readonly ["Z1" | "Z2" | "Z3" | "Z4" | "Z5", string, number, number]>,
): EffectiveRunnerHeartRateProfile {
  return {
    source,
    accepted: true,
    sourceNote:
      source === "personal"
        ? "Saved by the runner as personal heart-rate truth."
        : "Estimated from age; not measured zone data.",
    zones: zones.map(([reference, label, minBpm, maxBpm]) => ({
      reference,
      label,
      minBpm,
      maxBpm,
    })),
  };
}

function firstHeartRateTarget(
  plan: Extract<ReturnType<typeof compileAiAuthoredPlanFirstDraft>, { ok: true }>["canonicalPlan"],
) {
  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      const targets =
        segment.prescription?.mode === "repeats"
          ? segment.prescription.children?.map((child) => child.target)
          : [segment.target];
      const target = targets?.find(
        (candidate) => candidate?.primary_execution_mode === "heart_rate",
      );
      if (target) return target;
    }
  }
  return undefined;
}
