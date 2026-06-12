import type { TrainingPlanV2 } from "@/lib/imported-plan";
import type {
  RunningPlanSegmentPrescription,
  RunningPlanWatchExecutableSegmentTemplate,
} from "@/lib/plan-creation-engine/source-types";
import type { RunningPlanPreviewCalendarRow } from "@/lib/plan-creation-engine/preview-builder-shared";

export const RUNNING_PLAN_PRESCRIPTION_GRAMMAR_GATE_VERSION =
  "running_plan_prescription_grammar_gate_v1" as const;

type CanonicalWorkoutRow = TrainingPlanV2["planned_workouts"][number];
type CanonicalSegment = CanonicalWorkoutRow["segments"][number];
type PrescriptionIssueKind =
  | "awkward_standard_duration"
  | "missing_numeric_structure"
  | "vague_effort_only_target"
  | "internal_target_label"
  | "fake_pace_target"
  | "fake_personal_hr_target";

export interface RunningPlanPrescriptionGrammarSummary {
  gateVersion: typeof RUNNING_PLAN_PRESCRIPTION_GRAMMAR_GATE_VERSION;
  issueCount: number;
  awkwardStandardDurationCount: number;
  missingNumericStructureCount: number;
  vagueEffortOnlyTargetCount: number;
  internalTargetLabelCount: number;
  fakePaceTargetCount: number;
  fakePersonalHrTargetCount: number;
  issues: readonly string[];
}

export function collectRunningPlanPreviewPrescriptionGrammarIssues(
  rows: readonly RunningPlanPreviewCalendarRow[],
) {
  return summarizeRunningPlanPreviewPrescriptionGrammar(rows).issues;
}

export function summarizeRunningPlanPreviewPrescriptionGrammar(
  rows: readonly RunningPlanPreviewCalendarRow[],
): RunningPlanPrescriptionGrammarSummary {
  const issues = rows.flatMap((row) => collectPreviewRowIssues(row));
  return summarizeIssues(issues);
}

export function collectRunningPlanCanonicalPrescriptionGrammarIssues(
  rows: readonly CanonicalWorkoutRow[],
) {
  return summarizeRunningPlanCanonicalPrescriptionGrammar(rows).issues;
}

export function summarizeRunningPlanCanonicalPrescriptionGrammar(
  rows: readonly CanonicalWorkoutRow[],
): RunningPlanPrescriptionGrammarSummary {
  const issues = rows.flatMap((row) => collectCanonicalRowIssues(row));
  return summarizeIssues(issues);
}

function collectPreviewRowIssues(row: RunningPlanPreviewCalendarRow) {
  if (row.isRestDay) {
    return [];
  }

  return row.segments.flatMap((segment) => collectPreviewSegmentIssues(row, segment));
}

function collectPreviewSegmentIssues(
  row: RunningPlanPreviewCalendarRow,
  segment: RunningPlanWatchExecutableSegmentTemplate,
) {
  const issues: Array<{ kind: PrescriptionIssueKind; message: string }> = [];

  for (const entry of previewPrescriptionDurations(segment.primaryPrescription)) {
    if (!durationIsDeviceFriendly(entry.seconds, segment)) {
      issues.push({
        kind: "awkward_standard_duration",
        message: `${row.rowId}.${segment.id}.${entry.path} uses device-unfriendly ${entry.seconds}s duration.`,
      });
    }
  }

  return issues;
}

function collectCanonicalRowIssues(row: CanonicalWorkoutRow) {
  if (row.workout_type === "rest") {
    return [];
  }

  return row.segments.flatMap((segment) => collectCanonicalSegmentIssues(row, segment));
}

function collectCanonicalSegmentIssues(row: CanonicalWorkoutRow, segment: CanonicalSegment) {
  const issues: Array<{ kind: PrescriptionIssueKind; message: string }> = [];
  const context = `${row.workout_id}.${segment.segment_id ?? segment.sequence ?? "segment"}`;

  if (!segment.prescription || segment.prescription.mode === "none") {
    issues.push({
      kind: "missing_numeric_structure",
      message: `${context} lacks numeric executable structure.`,
    });
  }

  for (const entry of canonicalPrescriptionDurations(segment)) {
    if (!durationMinutesIsDeviceFriendly(entry.durationMin, segment)) {
      issues.push({
        kind: "awkward_standard_duration",
        message: `${context}.${entry.path} uses device-unfriendly ${formatMinutes(entry.durationMin)} duration.`,
      });
    }
  }

  const targetIssues = collectCanonicalTargetIssues({ row, segment, context });
  issues.push(...targetIssues);

  return issues;
}

function collectCanonicalTargetIssues({
  row,
  segment,
  context,
}: {
  row: CanonicalWorkoutRow;
  segment: CanonicalSegment;
  context: string;
}) {
  const issues: Array<{ kind: PrescriptionIssueKind; message: string }> = [];
  const target = segment.target;

  if (!target) {
    issues.push({
      kind: "vague_effort_only_target",
      message: `${context} lacks an executable target object.`,
    });
    return issues;
  }

  const labelText = `${target.label ?? ""} ${target.source_note ?? ""}`.toLowerCase();
  if (/structure[-_ ]?only|hito default|internal/.test(labelText)) {
    issues.push({
      kind: "internal_target_label",
      message: `${context} exposes internal target language.`,
    });
  }

  if (hasPaceTarget(target)) {
    issues.push({
      kind: "fake_pace_target",
      message: `${context} exposes a pace target without selected-plan pace truth.`,
    });
  }

  if (
    row.workout_identity === "race_pace_session" &&
    row.metric_mode?.pace_targets_allowed === false
  ) {
    issues.push({
      kind: "fake_pace_target",
      message: `${context} exposes race-pace identity while metric policy disallows pace targets.`,
    });
  }

  if (hasPersonalHrTarget(target)) {
    issues.push({
      kind: "fake_personal_hr_target",
      message: `${context} exposes personal HR target truth without personal zones.`,
    });
  }

  const hasHonestIntensityTarget =
    hasNonEmptyString(target.rpe) ||
    hasNonEmptyString(target.cadence_spm_range) ||
    hasNonEmptyString(target.hr_target_source);
  const hasOnlyIntensity = hasNonEmptyString(target.intensity) && !hasHonestIntensityTarget;

  if (hasOnlyIntensity) {
    issues.push({
      kind: "vague_effort_only_target",
      message: `${context} exposes vague effort text as the only target.`,
    });
  }

  if (row.metric_mode?.pace_targets_allowed === false && hasPaceTarget(target)) {
    issues.push({
      kind: "fake_pace_target",
      message: `${context} exposes pace target while metric policy disallows pace targets.`,
    });
  }

  if (row.metric_mode?.hr_targets_allowed === false && hasHrRangeTarget(target)) {
    issues.push({
      kind: "fake_personal_hr_target",
      message: `${context} exposes HR range while metric policy disallows HR targets.`,
    });
  }

  return issues;
}

function previewPrescriptionDurations(prescription: RunningPlanSegmentPrescription) {
  switch (prescription.mode) {
    case "time":
    case "open_warmup":
    case "open_cooldown":
    case "time_with_default_hr_cap":
      return [{ path: "durationSeconds", seconds: exactRangeValue(prescription.durationSeconds) }];
    case "recovery_time":
      return [
        {
          path: "recoveryDurationSeconds",
          seconds: exactRangeValue(prescription.recoveryDurationSeconds),
        },
      ];
    case "free_run_with_cap":
      return [
        {
          path: "durationSecondsOrDistanceMeters",
          seconds: exactRangeValue(prescription.durationSecondsOrDistanceMeters),
        },
      ];
    case "repeat":
      return [
        {
          path: "repeat.work.durationSeconds",
          seconds:
            prescription.work.mode === "time"
              ? exactRangeValue(prescription.work.durationSeconds)
              : null,
        },
        {
          path: "repeat.recovery.recoveryDurationSeconds",
          seconds:
            prescription.recovery.mode === "recovery_time"
              ? exactRangeValue(prescription.recovery.recoveryDurationSeconds)
              : null,
        },
      ];
    case "distance":
    case "distance_with_default_hr_cap":
    case "recovery_distance":
      return [];
  }
}

function canonicalPrescriptionDurations(segment: CanonicalSegment) {
  const prescription = segment.prescription;
  if (!prescription) {
    return [];
  }

  if (prescription.mode === "time") {
    return [{ path: "prescription.duration_min", durationMin: prescription.duration_min ?? null }];
  }

  if (prescription.mode === "repeats") {
    return [
      {
        path: "prescription.repeat_unit.duration_min",
        durationMin: prescription.repeat_unit?.duration_min ?? null,
      },
      {
        path: "prescription.recovery_unit.duration_min",
        durationMin: prescription.recovery_unit?.duration_min ?? null,
      },
    ];
  }

  return [];
}

function durationIsDeviceFriendly(
  seconds: number | null,
  segment: RunningPlanWatchExecutableSegmentTemplate,
) {
  if (seconds === null || seconds % 60 === 0) {
    return true;
  }

  return seconds <= 120 && segment.primaryPrescription.mode === "repeat";
}

function durationMinutesIsDeviceFriendly(durationMin: number | null, segment: CanonicalSegment) {
  if (durationMin === null) {
    return true;
  }

  const seconds = Math.round(durationMin * 60);
  if (seconds % 60 === 0) {
    return true;
  }

  return seconds <= 120 && segment.prescription?.mode === "repeats";
}

function exactRangeValue(range: { min: number; max: number }) {
  return range.min === range.max ? range.min : null;
}

function hasPaceTarget(target: Record<string, unknown>) {
  return (
    hasNonEmptyString(target.pace) ||
    hasNonEmptyString(target.pace_min_per_km_range) ||
    hasNonEmptyString(target.pace_range_min_km)
  );
}

function hasHrRangeTarget(target: Record<string, unknown>) {
  return hasNonEmptyString(target.hr_bpm_range) || hasNonEmptyString(target.hr_bpm);
}

function hasPersonalHrTarget(target: Record<string, unknown>) {
  return target.hr_target_source === "personal_hr_zone" || hasHrRangeTarget(target);
}

function hasNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function summarizeIssues(
  issues: readonly { kind: PrescriptionIssueKind; message: string }[],
): RunningPlanPrescriptionGrammarSummary {
  const count = (kind: PrescriptionIssueKind) =>
    issues.filter((issue) => issue.kind === kind).length;

  return {
    gateVersion: RUNNING_PLAN_PRESCRIPTION_GRAMMAR_GATE_VERSION,
    issueCount: issues.length,
    awkwardStandardDurationCount: count("awkward_standard_duration"),
    missingNumericStructureCount: count("missing_numeric_structure"),
    vagueEffortOnlyTargetCount: count("vague_effort_only_target"),
    internalTargetLabelCount: count("internal_target_label"),
    fakePaceTargetCount: count("fake_pace_target"),
    fakePersonalHrTargetCount: count("fake_personal_hr_target"),
    issues: issues.map((issue) => issue.message),
  };
}

function formatMinutes(durationMin: number) {
  return `${Number(durationMin.toFixed(2))} min`;
}
