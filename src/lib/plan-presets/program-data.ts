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
let goalContractRowsCache: PlanPresetGoalContract[] | null = null;

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

export function getPlanPresetGoalContracts() {
  goalContractRowsCache ??= parseGoalContractRows(readCsv("preset-goal-contract-matrix.csv"));

  return goalContractRowsCache;
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
