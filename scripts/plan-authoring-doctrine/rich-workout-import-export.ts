import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "../../src/lib/active-plan-persistence";
import {
  buildPersistedWorkoutInsertRows,
  persistedWorkoutRowToImportedSeed,
} from "../../src/lib/persisted-plan-replacement";
import {
  activePlanExportToTrainingPlanV2,
  buildActivePlanExportPayload,
  renderPlanExportMarkdown,
} from "../../src/lib/plan-export";
import { deriveWorkoutRichModel } from "../../src/lib/training";
import type { StructuredFirstPlanOnboardingRequestInput } from "../../src/lib/structured-first-plan-onboarding";
import {
  buildImportedPlanSeed,
  importedPlanSchema,
  type ImportedPlanSeed,
  type TrainingPlanV2,
} from "../../src/lib/imported-plan";

type SegmentRecord = Record<string, unknown>;

const RETIRED_FLAT_REPEAT_FIELD_KEYS = new Set([
  "repeat_count",
  "work_distance_km",
  "work_duration_min",
  "work_duration_sec",
  "recovery_duration_min",
  "recovery_duration_sec",
  "recovery_distance_km",
]);

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface RichWorkoutImportExportDependencies {
  buildPlan: (input: StructuredFirstPlanOnboardingRequestInput) => { plan: TrainingPlanV2 };
  buildRequest: DoctrineRequestBuilder;
  readAiFirstPlanReferenceFixture: () => unknown;
}

export function assertRichWorkoutImportExportContracts(deps: RichWorkoutImportExportDependencies) {
  assertRichPersistenceReadback(deps);
  assertRichImportExportRoundtrip(deps);
  assertRichSavedModeQaFixture();
}

function assertRichPersistenceReadback({
  buildPlan,
  buildRequest,
}: RichWorkoutImportExportDependencies) {
  const plan = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: null,
      },
    }),
  ).plan;
  const seed = buildImportedPlanSeed(plan);
  const insertRows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000901",
    "00000000-0000-4000-8000-000000000902",
    seed.workouts,
  );
  const thresholdRow = insertRows.find(
    (row) => row.workout_identity === "half_marathon_threshold_durability",
  );

  assert.ok(thresholdRow, "persisted insert rows should carry rich threshold identity");
  assert.equal(
    thresholdRow.workout_family,
    "tempo",
    "persisted insert rows should carry rich workout family",
  );
  assert.equal(
    thresholdRow.calendar_icon_key,
    "tempo",
    "persisted insert rows should carry calendar icon key",
  );
  assert.equal(
    typeof thresholdRow.goal_context,
    "object",
    "persisted insert rows should carry bounded goal context json",
  );
  assert.equal(
    typeof thresholdRow.metric_mode,
    "object",
    "persisted insert rows should carry metric mode json",
  );

  const reloaded = deriveWorkoutRichModel({
    type: thresholdRow.workout_type,
    sourceWorkoutType: thresholdRow.source_workout_type,
    workoutFamily: thresholdRow.workout_family,
    workoutIdentity: thresholdRow.workout_identity,
    calendarIconKey: thresholdRow.calendar_icon_key,
    goalContext: thresholdRow.goal_context,
    metricMode: thresholdRow.metric_mode,
    title: thresholdRow.title,
    steps: thresholdRow.steps as SegmentRecord[],
  });

  assert.equal(
    reloaded.workoutIdentity,
    "half_marathon_threshold_durability",
    "saved workout readback should prefer stored rich identity",
  );
  assert.equal(reloaded.workoutFamily, "tempo", "saved workout readback should keep rich family");
  assert.equal(
    reloaded.goalContext?.goalType,
    "half_marathon",
    "saved workout readback should expose stored goal context",
  );

  const persistedRow: PersistedPlannedWorkoutRow = {
    id: "00000000-0000-4000-8000-000000000903",
    created_at: "2026-05-01T00:00:00.000Z",
    ...thresholdRow,
    source_workout_type: "quality",
  };
  const carriedForward = persistedWorkoutRowToImportedSeed(persistedRow, {
    fallbackSourceWorkoutIdPrefix: "fixed",
  });

  assert.equal(
    carriedForward.workoutIdentity,
    "half_marathon_threshold_durability",
    "carry-forward should preserve stored rich identity even when legacy source type is generic",
  );
  assert.equal(
    carriedForward.workoutFamily,
    "tempo",
    "carry-forward should preserve stored rich family for fixed/protected workouts",
  );
  assert.equal(
    carriedForward.goalContext?.goalType,
    "half_marathon",
    "carry-forward should preserve stored rich goal context",
  );
  assert.equal(
    carriedForward.metricMode.guidance,
    reloaded.metricMode.guidance,
    "carry-forward should preserve stored metric-mode semantics",
  );

  const oldCompact = deriveWorkoutRichModel({
    type: "quality",
    sourceWorkoutType: null,
    title: "Controlled tempo session",
    steps: [],
  });

  assert.equal(
    oldCompact.workoutIdentity,
    "controlled_tempo_session",
    "old compact-only rows should still use title fallback when rich fields are absent",
  );
}

function persistedPlanRowForSeed(seed: ImportedPlanSeed): PersistedPlanCycleRow {
  return {
    id: "00000000-0000-4000-8000-000000000910",
    user_id: "00000000-0000-4000-8000-000000000911",
    status: "active",
    title: seed.title,
    goal_summary: seed.goalSummary,
    source_template: seed.sourceTemplate,
    schema_version: seed.schemaVersion,
    source_kind: seed.sourceKind,
    start_date: seed.startDate,
    end_date: seed.endDate,
    target_date: seed.targetDate,
    goal_metadata: seed.goalMetadata,
    plan_preferences: seed.planPreferences,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
  };
}

function persistedWorkoutRowsForSeed(seed: ImportedPlanSeed): PersistedPlannedWorkoutRow[] {
  return buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000910",
    "00000000-0000-4000-8000-000000000911",
    seed.workouts,
  ).map((row, index) => ({
    id: `00000000-0000-4000-8000-${(920 + index).toString().padStart(12, "0")}`,
    created_at: "2026-05-01T00:00:00.000Z",
    ...row,
  }));
}

function assertRichImportExportRoundtrip({
  buildPlan,
  buildRequest,
  readAiFirstPlanReferenceFixture,
}: RichWorkoutImportExportDependencies) {
  const plan = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: null,
      },
    }),
  ).plan;
  const seed = buildImportedPlanSeed(plan);
  const persistedRows = persistedWorkoutRowsForSeed(seed);
  const exportPayload = buildActivePlanExportPayload({
    planCycle: persistedPlanRowForSeed(seed),
    workouts: persistedRows,
    exportedAt: "2026-05-25T12:00:00.000Z",
  });
  const exportedPlan = activePlanExportToTrainingPlanV2(exportPayload);
  const parsedExport = importedPlanSchema.parse(exportedPlan);
  const roundtripSeed = buildImportedPlanSeed(parsedExport);
  const roundtripRows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000930",
    "00000000-0000-4000-8000-000000000931",
    roundtripSeed.workouts,
  );
  const nonRestExports = parsedExport.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );

  assert.ok(nonRestExports.length > 0, "rich export fixture should include non-rest workouts");

  for (const workout of nonRestExports) {
    assert.ok(workout.source_workout_type, "rich JSON export should preserve source_workout_type");
    assert.ok(workout.workout_family, "rich JSON export should include workout_family");
    assert.ok(workout.workout_identity, "rich JSON export should include workout_identity");
    assert.ok(workout.calendar_icon_key, "rich JSON export should include calendar_icon_key");
    assert.ok(workout.goal_context, "rich JSON export should include bounded goal_context");
    assert.ok(workout.metric_mode, "rich JSON export should include metric_mode");
  }

  assert.ok(
    roundtripRows.every((row) => row.workout_family && row.workout_identity),
    "re-imported rich export should persist rich fields into planned_workouts rows",
  );

  const markdown = renderPlanExportMarkdown(exportPayload);
  assert.match(
    markdown,
    /- Type: (Tempo|Intervals|Long Run|Easy|Steady)/,
    "Markdown export should use runner-facing workout type labels from the language read model",
  );
  assert.match(
    markdown,
    /- Blocks: (Warm-up|Run|Work|Recover|Finish|Cooldown|Repeat set)/,
    "Markdown export should include runner-facing block labels without replacing segment detail",
  );
  assert.doesNotMatch(
    markdown,
    /Focus: .*Half Marathon Threshold Durability|Focus: .*Controlled Tempo Session/,
    "Markdown export should not use internal workout identities as the primary runner-facing focus label",
  );

  const template = JSON.parse(
    readFileSync("public/templates/hito-training-plan-v2-template.json", "utf8"),
  );
  const parsedTemplate = importedPlanSchema.parse(template);
  assert.ok(
    parsedTemplate.planned_workouts.every(
      (workout) =>
        workout.workout_family &&
        workout.workout_identity &&
        workout.calendar_icon_key &&
        workout.metric_mode,
    ),
    "template JSON should validate with rich workout fields",
  );

  const compactOnlyPlan = importedPlanSchema.parse({
    schema_version: "training-plan-v2",
    plan_name: "Compact legacy v2 plan",
    generated_for: "Fixture runner",
    start_date: "2026-05-25",
    planned_workouts: [
      {
        workout_id: "compact-tempo-1",
        date: "2026-05-25",
        weekday: "Monday",
        week_number: 1,
        phase: "Base",
        workout_type: "quality",
        title: "Controlled tempo session",
        summary: "Compact-only old row without rich fields.",
        segments: [
          {
            segment_type: "main",
            duration_min: 30,
            target: { intensity: "tempo", cue: "Controlled and repeatable" },
          },
        ],
      },
    ],
  });
  const compactSeed = buildImportedPlanSeed(compactOnlyPlan);

  assert.equal(
    compactSeed.workouts[0]?.workoutIdentity,
    "controlled_tempo_session",
    "older compact-only training-plan-v2 imports should derive rich identity from fallback semantics",
  );
  assert.equal(
    compactSeed.workouts[0]?.workoutFamily,
    "tempo",
    "older compact-only training-plan-v2 imports should derive rich family from fallback semantics",
  );

  const referenceFixture = readAiFirstPlanReferenceFixture();

  if (referenceFixture) {
    const parsedReferenceResult = importedPlanSchema.safeParse(referenceFixture);

    if (!parsedReferenceResult.success) {
      assertRetiredFlatRepeatFixtureRejection(parsedReferenceResult.error.issues);
      return;
    }

    const parsedReference = parsedReferenceResult.data;
    const referenceSeed = buildImportedPlanSeed(parsedReference);
    const referenceIdentities = new Set(
      referenceSeed.workouts.map((workout) => workout.workoutIdentity),
    );

    assert.ok(
      referenceIdentities.has("distance_intervals"),
      "reference-style imports should preserve interval identity from title/segment truth",
    );
    assert.ok(
      referenceIdentities.has("controlled_tempo_session"),
      "reference-style imports should preserve tempo identity from title/segment truth",
    );
    assert.ok(
      referenceIdentities.has("race_pace_session"),
      "reference-style imports should preserve race-rhythm identity from title/segment truth",
    );
    assert.ok(
      !referenceSeed.workouts.some(
        (workout) =>
          workout.title.match(/interval|race rhythm|leg opener/i) &&
          workout.workoutIdentity === "quality_session",
      ),
      "reference-style imports should not collapse clear interval/race-rhythm rows to generic quality_session",
    );
  }
}

function assertRetiredFlatRepeatFixtureRejection(issues: readonly { keys?: string[] }[]) {
  const rejectedRetiredKeys = issues.flatMap((issue) =>
    (issue.keys ?? []).filter((key) => RETIRED_FLAT_REPEAT_FIELD_KEYS.has(key)),
  );

  assert.ok(
    rejectedRetiredKeys.length > 0,
    "optional AI first-plan reference fixture should parse or fail only on retired flat repeat fields",
  );
}

function assertRichSavedModeQaFixture() {
  const fixture = importedPlanSchema.parse(
    JSON.parse(readFileSync("scripts/fixtures/rich-workout-saved-mode-fixture.json", "utf8")),
  );
  const expectedRichRows = [
    ["qa-rich-steady-001", "steady", "steady_aerobic_run", "steady"],
    ["qa-rich-hills-001", "hills", "rolling_hills_session", "hills"],
    ["qa-rich-trail-001", "trail", "technical_trail_easy", "trail"],
  ] as const;

  assert.equal(
    fixture.source_kind,
    "qa_rich_workout_fixture",
    "saved-mode QA fixture should be clearly marked test-only",
  );
  assert.equal(
    fixture.planned_workouts.length,
    4,
    "saved-mode QA fixture should keep a small, exact browser-QA surface",
  );

  for (const [workoutId, family, identity, icon] of expectedRichRows) {
    const workout = fixture.planned_workouts.find((entry) => entry.workout_id === workoutId);

    assert.ok(workout, `saved-mode QA fixture should include ${workoutId}`);
    assert.equal(workout.workout_family, family, `${workoutId} should store workout_family`);
    assert.equal(workout.workout_identity, identity, `${workoutId} should store workout_identity`);
    assert.equal(workout.calendar_icon_key, icon, `${workoutId} should store calendar_icon_key`);
    assert.ok(workout.goal_context, `${workoutId} should store bounded goal_context`);
    assert.ok(workout.metric_mode, `${workoutId} should store metric_mode`);
    assert.equal(
      workout.metric_mode?.pace_targets_allowed,
      false,
      `${workoutId} should not store fixture pace targets`,
    );
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${workoutId} should not store fixture HR targets`,
    );
  }

  const compactFallback = fixture.planned_workouts.find(
    (entry) => entry.workout_id === "qa-legacy-compact-tempo-001",
  );

  assert.ok(compactFallback, "saved-mode QA fixture should include a compact fallback row");
  assert.equal(
    compactFallback.source_workout_type,
    undefined,
    "compact fallback row should omit source_workout_type",
  );
  assert.equal(
    compactFallback.workout_family,
    undefined,
    "compact fallback row should omit stored rich family",
  );
  assert.equal(
    compactFallback.workout_identity,
    undefined,
    "compact fallback row should omit stored rich identity",
  );

  const seed = buildImportedPlanSeed(fixture);
  const compactSeed = seed.workouts.find(
    (workout) => workout.sourceWorkoutId === "qa-legacy-compact-tempo-001",
  );

  assert.ok(compactSeed, "compact fallback row should normalize into a seed workout");
  const fallbackReadback = deriveWorkoutRichModel({
    type: compactSeed.workoutType,
    sourceWorkoutType: null,
    title: compactSeed.title,
    steps: compactSeed.steps,
  });

  assert.equal(
    fallbackReadback.workoutIdentity,
    "controlled_tempo_session",
    "compact fixture row should still derive tempo identity from title/steps when stored rich truth is absent",
  );
  assert.equal(
    fallbackReadback.workoutFamily,
    "tempo",
    "compact fixture row should still derive tempo family from title/steps when stored rich truth is absent",
  );

  for (const workout of fixture.planned_workouts) {
    for (const segment of workout.segments as SegmentRecord[]) {
      const target = segment.target as Record<string, unknown> | undefined;
      assert.ok(
        typeof segment.guidance === "string" ||
          typeof target?.cue === "string" ||
          typeof target?.hint === "string",
        `${workout.workout_id}: every fixture segment should carry backend guidance/cue/hint`,
      );
    }
  }

  const fixtureText = JSON.stringify(fixture);
  assert.doesNotMatch(fixtureText, /hr_bpm|pace_min_per_km|pace_range_min_km|cadence_spm_range/);
}
