import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { PlanPresetRecipeFamilyId, PlanPresetRecipeSummary } from "@/lib/plan-presets/schema";
import type { RunnerFitnessLevel } from "@/lib/runner-training-preferences";
import { addDaysIso } from "@/lib/training";

type CsvRecord = Record<string, string>;

export type PlanPresetProgramScenario = {
  familyId: PlanPresetRecipeFamilyId;
  familyLabel: string;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: number;
  cardState: "recommended" | "available" | "not_ideal" | "unavailable";
  routeOutcome: "review_after_refinement" | "advanced_custom";
  durationMinWeeks: number;
  durationMaxWeeks: number;
  programBias: string;
  moderateTouchCapPerWeek: number;
  longRunPolicy: string;
  cutbackFrequency: string;
  requiredCoreIdentities: string[];
  optionalIdentities: string[];
  forbiddenIdentities: string[];
  finalOutcomeRule: string;
  requiredRefinementFields: string[];
  notes: string;
};

export type PlanPresetLoadAdjustment = {
  ageBand: string;
  anthropometricLoadContext:
    | "lower_impact_load_context"
    | "standard_impact_load_context"
    | "elevated_impact_load_context"
    | "high_impact_load_context";
  progressionConservatism: "baseline" | "moderate" | "high" | "maximum_preset";
  durationExtensionWeeksMin: number;
  durationExtensionWeeksMax: number;
  cutbackFrequency: string;
  longRunRampPolicy: "standard" | "gentle" | "very_gentle";
  moderateTouchCapPerWeek: number;
  delaySharpWork: boolean;
  runnerFacingRationale: string;
};

export type PlanPresetWorkoutIdentityDefinition = {
  workoutIdentity: string;
  workoutFamily: string;
  primaryUseFamilies: string[];
  runnerLevels: string[];
  goalPurpose: string;
  defaultStructureType: string;
  targetModeWhenNoTruth: string;
  targetModeWhenPaceTruthExists: string;
  targetModeWhenHrTruthExists: string;
  forbiddenUse: string;
  notes: string;
};

export type PlanPresetGoalContract = {
  familyId: PlanPresetRecipeFamilyId;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: string;
  goalStyle: string;
  goalContract: string;
  completionGoal: string;
  performanceGoalAllowed: string;
  targetTimeAllowed: string;
  benchmarkRequired: string;
  advancedCustomRouteReason: string;
  finalOutcomeRequired: string;
};

export type PlanPresetPhaseTemplate = {
  familyId: PlanPresetRecipeFamilyId;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: string;
  durationMinWeeks: number;
  durationMaxWeeks: number;
  conservatism: string;
  phaseSequence: string;
  phaseName: string;
  phaseOrder: number;
  phaseMinWeeks: number;
  phaseTargetRatio: number;
  required: boolean;
  phaseGoal: string;
  entryCondition: string;
  exitMarker: string;
};

export type PlanPresetWeeklyArchetype = {
  familyId: PlanPresetRecipeFamilyId;
  daysPerWeek: string;
  phaseName: string;
  weekArchetype: string;
  slots: string[];
  longRunSlot: string;
  specificTouchCount: number;
  supportsFloatingRest: boolean;
  protectedRecoveryRule: string;
  notes: string;
};

export type PlanPresetIdentityPlacementRule = {
  familyId: PlanPresetRecipeFamilyId;
  identity: string;
  phaseName: string;
  daysPerWeekMin: number;
  daysPerWeekMax: number;
  levelMin: string;
  conservatismAllowed: string;
  frequencyRule: string;
  earliestPhaseOrder: number;
  latestPhaseOrder: number;
  requiresBenchmark: string;
  canSubstituteFor: string[];
  cannotCoexistSameWeekWith: string[];
  requiredForFamilyOutcome: boolean;
  notes: string;
};

export type PlanPresetSegmentAnatomy = {
  identity: string;
  segmentSequence: number;
  segmentType: string;
  labelPattern: string;
  prescriptionMode: string;
  durationOrDistanceRule: string;
  repeatRule: string;
  recoveryRule: string;
  targetMode: string;
  targetIntensity: string;
  paceAllowed: string;
  hrAllowed: string;
  benchmarkRequired: string;
  runnerCue: string;
  safetyNote: string;
};

export type PlanPresetProgressionMathRule = {
  familyId: PlanPresetRecipeFamilyId;
  runnerLevel: Exclude<RunnerFitnessLevel, "custom">;
  daysPerWeek: string;
  conservatism: string;
  phaseName: string;
  longRunRampRule: string;
  durationRampRule: string;
  cutbackFrequency: string;
  cutbackReductionRule: string;
  intensityDelayRule: string;
  specificTouchFrequency: string;
  maxWeeklyLoadIncrease: string;
  extensionTrigger: string;
  notes: string;
};

export type PlanPresetQualityGate = {
  familyId: PlanPresetRecipeFamilyId | "all_supported_families";
  daysPerWeek: string;
  gateId: string;
  gateDescription: string;
  required: boolean;
  checkType: string;
  minimumCount: number;
  phaseScope: string;
  failureAction: string;
  notes: string;
};

export type PlanPresetBuilderIoContract = {
  contractType: "weekly_slot_alias" | "final_outcome_marker" | "inheritance_rule";
  familyId: PlanPresetRecipeFamilyId | "all_supported_families";
  sourceTokenOrMarker: string;
  appliesToPhase: string;
  daysPerWeek: string;
  runnerLevel: string;
  resolutionPriority: number;
  outputBehavior: string;
  canonicalOutputIdentity: string;
  fallbackOutputIdentity: string;
  fallbackCondition: string;
  segmentAnatomySource: string;
  reviewMetadataBehavior: string;
  qualityGateBinding: string;
  countsAsSpecificTouch: boolean;
  notes: string;
};

export type ResolvedPlanPresetProgram = {
  scenario: PlanPresetProgramScenario;
  goalContract: PlanPresetGoalContract;
  loadAdjustment: PlanPresetLoadAdjustment;
  durationWeeks: number;
  estimatedEndDate: string;
  bodyLoadFactor: number;
  impactLoadContext: PlanPresetLoadAdjustment["anthropometricLoadContext"];
  progressionConservatism: PlanPresetLoadAdjustment["progressionConservatism"];
  longRunRampPolicy: PlanPresetLoadAdjustment["longRunRampPolicy"];
  cutbackFrequency: string;
  moderateTouchCapPerWeek: number;
  delaySharpWork: boolean;
  loadAdjustmentSummary: string;
};

export type PlanPresetProgramResolutionInput = {
  recipe: PlanPresetRecipeSummary;
  startDate: string;
  runnerLevel: RunnerFitnessLevel;
  daysPerWeek: number;
  age: number;
  weightKg: number;
  heightCm: number;
};

const moduleDir = dirname(fileURLToPath(import.meta.url));
const sourceCsvDir = resolve(process.cwd(), "src/lib/plan-presets");
const packagedCsvDirs = [
  resolve(moduleDir, "../src/lib/plan-presets"),
  resolve(moduleDir, "src/lib/plan-presets"),
  resolve(process.cwd(), ".output/server/src/lib/plan-presets"),
  resolve(process.cwd(), ".vercel/output/functions/__server.func/src/lib/plan-presets"),
];
const csvDirCandidates = isPackagedRuntime(moduleDir)
  ? [...packagedCsvDirs, sourceCsvDir]
  : [sourceCsvDir, ...packagedCsvDirs];

let scenarioRowsCache: PlanPresetProgramScenario[] | null = null;
let loadAdjustmentRowsCache: PlanPresetLoadAdjustment[] | null = null;
let workoutIdentityRowsCache: PlanPresetWorkoutIdentityDefinition[] | null = null;
let goalContractRowsCache: PlanPresetGoalContract[] | null = null;
let phaseTemplateRowsCache: PlanPresetPhaseTemplate[] | null = null;
let weeklyArchetypeRowsCache: PlanPresetWeeklyArchetype[] | null = null;
let identityPlacementRowsCache: PlanPresetIdentityPlacementRule[] | null = null;
let segmentAnatomyRowsCache: PlanPresetSegmentAnatomy[] | null = null;
let progressionMathRowsCache: PlanPresetProgressionMathRule[] | null = null;
let qualityGateRowsCache: PlanPresetQualityGate[] | null = null;
let builderIoContractRowsCache: PlanPresetBuilderIoContract[] | null = null;

export function getPlanPresetProgramScenarios() {
  scenarioRowsCache ??= parseScenarioRows(readCsv("preset-program-scenario-matrix.csv"));

  return scenarioRowsCache;
}

export function getPlanPresetLoadAdjustments() {
  loadAdjustmentRowsCache ??= parseLoadAdjustmentRows(
    readCsv("preset-program-load-adjustments.csv"),
  );

  return loadAdjustmentRowsCache;
}

export function getPlanPresetWorkoutIdentityLibrary() {
  workoutIdentityRowsCache ??= parseWorkoutIdentityRows(
    readCsv("preset-workout-identity-library.csv"),
  );

  return workoutIdentityRowsCache;
}

export function getPlanPresetGoalContracts() {
  goalContractRowsCache ??= parseGoalContractRows(readCsv("preset-goal-contract-matrix.csv"));

  return goalContractRowsCache;
}

export function getPlanPresetPhaseTemplates() {
  phaseTemplateRowsCache ??= parsePhaseTemplateRows(readCsv("preset-phase-template-table.csv"));

  return phaseTemplateRowsCache;
}

export function getPlanPresetWeeklyArchetypes() {
  weeklyArchetypeRowsCache ??= parseWeeklyArchetypeRows(
    readCsv("preset-weekly-archetype-table.csv"),
  );

  return weeklyArchetypeRowsCache;
}

export function getPlanPresetIdentityPlacementRules() {
  identityPlacementRowsCache ??= parseIdentityPlacementRows(
    readCsv("preset-identity-placement-rules.csv"),
  );

  return identityPlacementRowsCache;
}

export function getPlanPresetSegmentAnatomyTable() {
  segmentAnatomyRowsCache ??= parseSegmentAnatomyRows(readCsv("preset-segment-anatomy-table.csv"));

  return segmentAnatomyRowsCache;
}

export function getPlanPresetProgressionMathRules() {
  progressionMathRowsCache ??= parseProgressionMathRows(
    readCsv("preset-progression-math-rules.csv"),
  );

  return progressionMathRowsCache;
}

export function getPlanPresetQualityGates() {
  qualityGateRowsCache ??= parseQualityGateRows(readCsv("preset-quality-gates.csv"));

  return qualityGateRowsCache;
}

export function getPlanPresetBuilderIoContracts() {
  builderIoContractRowsCache ??= parseBuilderIoContractRows(
    readCsv("preset-builder-io-contract.csv"),
  );

  return builderIoContractRowsCache;
}

export function resolvePlanPresetProgram({
  recipe,
  startDate,
  runnerLevel,
  daysPerWeek,
  age,
  weightKg,
  heightCm,
}: PlanPresetProgramResolutionInput): ResolvedPlanPresetProgram {
  const normalizedRunnerLevel = normalizeScenarioRunnerLevel(runnerLevel);
  const scenario = getPlanPresetProgramScenarios().find(
    (candidate) =>
      candidate.familyId === recipe.recipeFamilyId &&
      candidate.runnerLevel === normalizedRunnerLevel &&
      candidate.daysPerWeek === daysPerWeek,
  );

  if (!scenario) {
    throw new Error(
      `Plan preset scenario matrix is missing ${recipe.recipeFamilyId}/${normalizedRunnerLevel}/${daysPerWeek}.`,
    );
  }

  const goalContract =
    getPlanPresetGoalContracts().find(
      (candidate) =>
        candidate.familyId === recipe.recipeFamilyId &&
        candidate.runnerLevel === normalizedRunnerLevel &&
        rangeIncludes(candidate.daysPerWeek, daysPerWeek) &&
        candidate.goalStyle === "balanced",
    ) ?? buildUnavailableGoalContract({ scenario, normalizedRunnerLevel });

  const ageBand = deriveAgeBand(age);
  const impactLoadContext = deriveImpactLoadContext({ weightKg, heightCm });
  const loadAdjustment = getPlanPresetLoadAdjustments().find(
    (candidate) =>
      candidate.ageBand === ageBand && candidate.anthropometricLoadContext === impactLoadContext,
  );

  if (!loadAdjustment) {
    throw new Error(
      `Plan preset load adjustment matrix is missing ${ageBand}/${impactLoadContext}.`,
    );
  }

  const extensionWeeks = Math.round(
    (loadAdjustment.durationExtensionWeeksMin + loadAdjustment.durationExtensionWeeksMax) / 2,
  );
  const scenarioDuration =
    scenario.durationMinWeeks > 0
      ? Math.min(scenario.durationMaxWeeks, scenario.durationMinWeeks + extensionWeeks)
      : recipe.defaultHorizonWeeks;
  const durationWeeks = Math.max(1, scenarioDuration);

  return {
    scenario,
    goalContract,
    loadAdjustment,
    durationWeeks,
    estimatedEndDate: addDaysIso(startDate, durationWeeks * 7 - 1),
    bodyLoadFactor: deriveBodyLoadFactor({ weightKg, heightCm }),
    impactLoadContext,
    progressionConservatism: loadAdjustment.progressionConservatism,
    longRunRampPolicy: loadAdjustment.longRunRampPolicy,
    cutbackFrequency:
      loadAdjustment.cutbackFrequency === "every_4th_week"
        ? scenario.cutbackFrequency
        : loadAdjustment.cutbackFrequency,
    moderateTouchCapPerWeek: Math.min(
      scenario.moderateTouchCapPerWeek,
      loadAdjustment.moderateTouchCapPerWeek,
    ),
    delaySharpWork: loadAdjustment.delaySharpWork,
    loadAdjustmentSummary: loadAdjustment.runnerFacingRationale,
  };
}

export function normalizeScenarioRunnerLevel(
  runnerLevel: RunnerFitnessLevel,
): Exclude<RunnerFitnessLevel, "custom"> {
  return runnerLevel === "custom" ? "running_regularly" : runnerLevel;
}

function parseScenarioRows(csv: string): PlanPresetProgramScenario[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family_id as PlanPresetRecipeFamilyId,
    familyLabel: row.family_label,
    runnerLevel: row.runner_level as Exclude<RunnerFitnessLevel, "custom">,
    daysPerWeek: numberField(row, "days_per_week"),
    cardState: row.card_state as PlanPresetProgramScenario["cardState"],
    routeOutcome: row.route_outcome as PlanPresetProgramScenario["routeOutcome"],
    durationMinWeeks: numberField(row, "duration_min_weeks"),
    durationMaxWeeks: numberField(row, "duration_max_weeks"),
    programBias: row.program_bias,
    moderateTouchCapPerWeek: numberField(row, "moderate_touch_cap_per_week"),
    longRunPolicy: row.long_run_policy,
    cutbackFrequency: row.cutback_frequency,
    requiredCoreIdentities: semicolonList(row.required_core_identities),
    optionalIdentities: semicolonList(row.optional_identities),
    forbiddenIdentities: semicolonList(row.forbidden_identities),
    finalOutcomeRule: row.final_outcome_rule,
    requiredRefinementFields: semicolonList(row.required_refinement_fields),
    notes: row.notes,
  }));
}

function parseLoadAdjustmentRows(csv: string): PlanPresetLoadAdjustment[] {
  return parseCsv(csv).map((row) => ({
    ageBand: row.age_band,
    anthropometricLoadContext:
      row.anthropometric_load_context as PlanPresetLoadAdjustment["anthropometricLoadContext"],
    progressionConservatism:
      row.progression_conservatism as PlanPresetLoadAdjustment["progressionConservatism"],
    durationExtensionWeeksMin: numberField(row, "duration_extension_weeks_min"),
    durationExtensionWeeksMax: numberField(row, "duration_extension_weeks_max"),
    cutbackFrequency: row.cutback_frequency,
    longRunRampPolicy: row.long_run_ramp_policy as PlanPresetLoadAdjustment["longRunRampPolicy"],
    moderateTouchCapPerWeek: numberField(row, "moderate_touch_cap_per_week"),
    delaySharpWork: row.delay_sharp_work === "yes",
    runnerFacingRationale: row.runner_facing_rationale,
  }));
}

function parseWorkoutIdentityRows(csv: string): PlanPresetWorkoutIdentityDefinition[] {
  return parseCsv(csv).map((row) => ({
    workoutIdentity: row.workout_identity,
    workoutFamily: row.workout_family,
    primaryUseFamilies: semicolonList(row.primary_use_families),
    runnerLevels: semicolonList(row.runner_levels),
    goalPurpose: row.goal_purpose,
    defaultStructureType: row.default_structure_type,
    targetModeWhenNoTruth: row.target_mode_when_no_truth,
    targetModeWhenPaceTruthExists: row.target_mode_when_pace_truth_exists,
    targetModeWhenHrTruthExists: row.target_mode_when_hr_truth_exists,
    forbiddenUse: row.forbidden_use,
    notes: row.notes,
  }));
}

function parseGoalContractRows(csv: string): PlanPresetGoalContract[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetRecipeFamilyId,
    runnerLevel: row.runner_level as Exclude<RunnerFitnessLevel, "custom">,
    daysPerWeek: row.days_per_week,
    goalStyle: row.goal_style,
    goalContract: row.goal_contract,
    completionGoal: row.completion_goal,
    performanceGoalAllowed: row.performance_goal_allowed,
    targetTimeAllowed: row.target_time_allowed,
    benchmarkRequired: row.benchmark_required,
    advancedCustomRouteReason: row.advanced_custom_route_reason,
    finalOutcomeRequired: row.final_outcome_required,
  }));
}

function buildUnavailableGoalContract({
  scenario,
  normalizedRunnerLevel,
}: {
  scenario: PlanPresetProgramScenario;
  normalizedRunnerLevel: Exclude<RunnerFitnessLevel, "custom">;
}): PlanPresetGoalContract {
  if (scenario.cardState !== "unavailable" && scenario.routeOutcome !== "advanced_custom") {
    throw new Error(
      `Plan preset goal contract matrix is missing ${scenario.familyId}/${normalizedRunnerLevel}/${scenario.daysPerWeek}/balanced.`,
    );
  }

  return {
    familyId: scenario.familyId,
    runnerLevel: normalizedRunnerLevel,
    daysPerWeek: String(scenario.daysPerWeek),
    goalStyle: "balanced",
    goalContract: "out_of_scope",
    completionGoal: scenario.notes || "not eligible for preset promise",
    performanceGoalAllowed: "no",
    targetTimeAllowed: "no",
    benchmarkRequired: "not_applicable",
    advancedCustomRouteReason: scenario.notes || "setup routes away from this preset",
    finalOutcomeRequired: "advanced_custom_only",
  };
}

function parsePhaseTemplateRows(csv: string): PlanPresetPhaseTemplate[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetRecipeFamilyId,
    runnerLevel: row.runner_level as Exclude<RunnerFitnessLevel, "custom">,
    daysPerWeek: row.days_per_week,
    durationMinWeeks: numberField(row, "duration_min_weeks"),
    durationMaxWeeks: numberField(row, "duration_max_weeks"),
    conservatism: row.conservatism,
    phaseSequence: row.phase_sequence,
    phaseName: row.phase_name,
    phaseOrder: numberField(row, "phase_order"),
    phaseMinWeeks: numberField(row, "phase_min_weeks"),
    phaseTargetRatio: Number(row.phase_target_ratio),
    required: row.required === "yes",
    phaseGoal: row.phase_goal,
    entryCondition: row.entry_condition,
    exitMarker: row.exit_marker,
  }));
}

function parseWeeklyArchetypeRows(csv: string): PlanPresetWeeklyArchetype[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetRecipeFamilyId,
    daysPerWeek: row.days_per_week,
    phaseName: row.phase_name,
    weekArchetype: row.week_archetype,
    slots: [row.slot_1, row.slot_2, row.slot_3, row.slot_4, row.slot_5].filter(
      (slot) => slot && slot.length > 0,
    ),
    longRunSlot: row.long_run_slot,
    specificTouchCount: numberField(row, "specific_touch_count"),
    supportsFloatingRest: row.supports_floating_rest === "yes",
    protectedRecoveryRule: row.protected_recovery_rule,
    notes: row.notes,
  }));
}

function parseIdentityPlacementRows(csv: string): PlanPresetIdentityPlacementRule[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetRecipeFamilyId,
    identity: row.identity,
    phaseName: row.phase_name,
    daysPerWeekMin: numberField(row, "days_per_week_min"),
    daysPerWeekMax: numberField(row, "days_per_week_max"),
    levelMin: row.level_min,
    conservatismAllowed: row.conservatism_allowed,
    frequencyRule: row.frequency_rule,
    earliestPhaseOrder: numberField(row, "earliest_phase_order"),
    latestPhaseOrder: numberField(row, "latest_phase_order"),
    requiresBenchmark: row.requires_benchmark,
    canSubstituteFor: semicolonList(row.can_substitute_for),
    cannotCoexistSameWeekWith: semicolonList(row.cannot_coexist_same_week_with),
    requiredForFamilyOutcome: row.required_for_family_outcome === "yes",
    notes: row.notes,
  }));
}

function parseSegmentAnatomyRows(csv: string): PlanPresetSegmentAnatomy[] {
  return parseCsv(csv).map((row) => ({
    identity: row.identity,
    segmentSequence: numberField(row, "segment_sequence"),
    segmentType: row.segment_type,
    labelPattern: row.label_pattern,
    prescriptionMode: row.prescription_mode,
    durationOrDistanceRule: row.duration_or_distance_rule,
    repeatRule: row.repeat_rule,
    recoveryRule: row.recovery_rule,
    targetMode: row.target_mode,
    targetIntensity: row.target_intensity,
    paceAllowed: row.pace_allowed,
    hrAllowed: row.hr_allowed,
    benchmarkRequired: row.benchmark_required,
    runnerCue: row.runner_cue,
    safetyNote: row.safety_note,
  }));
}

function parseProgressionMathRows(csv: string): PlanPresetProgressionMathRule[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetRecipeFamilyId,
    runnerLevel: row.level as Exclude<RunnerFitnessLevel, "custom">,
    daysPerWeek: row.days_per_week,
    conservatism: row.conservatism,
    phaseName: row.phase_name,
    longRunRampRule: row.long_run_ramp_rule,
    durationRampRule: row.duration_ramp_rule,
    cutbackFrequency: row.cutback_frequency,
    cutbackReductionRule: row.cutback_reduction_rule,
    intensityDelayRule: row.intensity_delay_rule,
    specificTouchFrequency: row.specific_touch_frequency,
    maxWeeklyLoadIncrease: row.max_weekly_load_increase,
    extensionTrigger: row.extension_trigger,
    notes: row.notes,
  }));
}

function parseQualityGateRows(csv: string): PlanPresetQualityGate[] {
  return parseCsv(csv).map((row) => ({
    familyId: row.family as PlanPresetQualityGate["familyId"],
    daysPerWeek: row.days_per_week,
    gateId: row.gate_id,
    gateDescription: row.gate_description,
    required: row.required === "yes",
    checkType: row.check_type,
    minimumCount: numberField(row, "minimum_count"),
    phaseScope: row.phase_scope,
    failureAction: row.failure_action,
    notes: row.notes,
  }));
}

function parseBuilderIoContractRows(csv: string): PlanPresetBuilderIoContract[] {
  return parseCsv(csv).map((row) => ({
    contractType: row.contract_type as PlanPresetBuilderIoContract["contractType"],
    familyId: row.family as PlanPresetBuilderIoContract["familyId"],
    sourceTokenOrMarker: row.source_token_or_marker,
    appliesToPhase: row.applies_to_phase,
    daysPerWeek: row.days_per_week,
    runnerLevel: row.runner_level,
    resolutionPriority: numberField(row, "resolution_priority"),
    outputBehavior: row.output_behavior,
    canonicalOutputIdentity: row.canonical_output_identity,
    fallbackOutputIdentity: row.fallback_output_identity,
    fallbackCondition: row.fallback_condition,
    segmentAnatomySource: row.segment_anatomy_source,
    reviewMetadataBehavior: row.review_metadata_behavior,
    qualityGateBinding: row.quality_gate_binding,
    countsAsSpecificTouch: row.counts_as_specific_touch === "yes",
    notes: row.notes,
  }));
}

function parseCsv(csv: string): CsvRecord[] {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
  const headers = rows[0] ?? [];

  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);

  return cells.map((cell) => cell.trim());
}

export function resolvePlanPresetProgramCsvPathForDiagnostics(fileName: string) {
  const resolvedPath = csvDirCandidates
    .map((candidateDir) => resolve(candidateDir, fileName))
    .find((candidatePath) => existsSync(candidatePath));

  if (resolvedPath) {
    return resolvedPath;
  }

  throw new Error(
    `Plan preset program CSV ${fileName} was not found in source or packaged output directories.`,
  );
}

function readCsv(fileName: string) {
  return readFileSync(resolvePlanPresetProgramCsvPathForDiagnostics(fileName), "utf8");
}

function numberField(row: CsvRecord, field: string) {
  const value = Number(row[field]);

  if (!Number.isFinite(value)) {
    throw new Error(`Plan preset CSV field ${field} must be numeric.`);
  }

  return value;
}

function semicolonList(value: string | undefined) {
  return (value ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry !== "none");
}

function rangeIncludes(range: string, value: number) {
  const trimmed = range.trim();

  if (trimmed === "all" || trimmed === "2-5") {
    return value >= 2 && value <= 5;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) === value;
  }

  const match = trimmed.match(/^(\d+)-(\d+)$/);

  if (!match) {
    return false;
  }

  return value >= Number(match[1]) && value <= Number(match[2]);
}

function isPackagedRuntime(path: string) {
  return (
    path.includes(`${sep}.output${sep}`) ||
    path.includes(`${sep}.vercel${sep}`) ||
    path.includes(`${sep}node_modules${sep}.nitro${sep}`)
  );
}

function deriveAgeBand(age: number) {
  if (age < 30) return "under_30";
  if (age < 40) return "30_39";
  if (age < 50) return "40_49";
  if (age < 60) return "50_59";
  return "60_plus";
}

function deriveImpactLoadContext({
  weightKg,
  heightCm,
}: {
  weightKg: number;
  heightCm: number;
}): PlanPresetLoadAdjustment["anthropometricLoadContext"] {
  const bodyLoadFactor = deriveBodyLoadFactor({ weightKg, heightCm });

  if (bodyLoadFactor < 20) return "lower_impact_load_context";
  if (bodyLoadFactor < 27) return "standard_impact_load_context";
  if (bodyLoadFactor < 32) return "elevated_impact_load_context";
  return "high_impact_load_context";
}

function deriveBodyLoadFactor({ weightKg, heightCm }: { weightKg: number; heightCm: number }) {
  const heightM = heightCm / 100;

  return Number((weightKg / (heightM * heightM)).toFixed(1));
}
