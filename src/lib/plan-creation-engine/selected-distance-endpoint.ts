import type { RunningPlanDistanceFamily } from "@/lib/plan-creation-engine/source-types";

export const SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND = "final_selected_distance_day" as const;
export const SELECTED_DISTANCE_ENDPOINT_IDENTITY =
  "selected_distance_completion_or_checkpoint" as const;

const SELECTED_DISTANCE_ENDPOINT_ISSUE_MESSAGES = {
  selected_distance_endpoint_missing:
    "Distance goals must include a selected-distance endpoint workout.",
  selected_distance_endpoint_count_invalid:
    "Distance goals must include exactly one selected-distance endpoint.",
  selected_distance_endpoint_target_date_mismatch:
    "Distance-goal endpoint must land on the target date.",
  selected_distance_endpoint_not_final_non_rest:
    "Distance-goal endpoint must be the final non-rest workout; only rest rows may follow it.",
  selected_distance_endpoint_kind_missing:
    "Distance-goal endpoint must canonicalize to source_workout_type final_selected_distance_day.",
  selected_distance_endpoint_identity_missing:
    "Distance-goal endpoint must preserve workout_identity selected_distance_completion_or_checkpoint.",
  selected_distance_endpoint_distance_mismatch:
    "Distance-goal endpoint must prescribe the exact selected distance.",
  selected_distance_endpoint_proof_row_mismatch:
    "Distance-goal endpoint proof must point at the actual endpoint row.",
  selected_distance_endpoint_proof_date_mismatch:
    "Distance-goal endpoint proof must point at the actual endpoint date.",
  selected_distance_endpoint_proof_distance_mismatch:
    "Distance-goal endpoint proof must reflect exact selected-distance meters.",
} as const;

export type SelectedDistanceEndpointIssueCode =
  keyof typeof SELECTED_DISTANCE_ENDPOINT_ISSUE_MESSAGES;

export type SelectedDistanceEndpointIssue = {
  code: SelectedDistanceEndpointIssueCode;
  message: string;
  path?: string;
};

export type SelectedDistanceEndpointRow = {
  id: string;
  date: string;
  isRest: boolean;
  endpointKind: string | null | undefined;
  endpointIdentity?: string | null | undefined;
  endpointDistanceMeters: number | null;
  isSelectedEndpointSignal?: boolean;
};

export type SelectedDistanceEndpointProof = {
  finalRowId: string;
  finalDate: string;
  endpointDistanceMeters: number | null;
  endpointMainDistanceMeters: number | null;
};

export function selectedDistanceEndpointMainDistanceMeters(input: {
  endpointKind: string | null | undefined;
  segments: readonly {
    prescription?: {
      mode?: string;
      distance_km?: number | null;
      repeat_count?: number | null;
      children?:
        | readonly {
            prescription?: { mode?: string; distance_km?: number | null } | null;
          }[]
        | null;
    } | null;
  }[];
}) {
  if (input.endpointKind !== SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND) {
    return null;
  }

  const mainDistanceKm = input.segments.reduce(
    (total, segment) => total + distanceKmForPrescription(segment.prescription),
    0,
  );

  return mainDistanceKm > 0 ? Math.round(mainDistanceKm * 1000) : null;
}

function distanceKmForPrescription(
  prescription:
    | {
        mode?: string;
        distance_km?: number | null;
        repeat_count?: number | null;
        children?:
          | readonly {
              prescription?: { mode?: string; distance_km?: number | null } | null;
            }[]
          | null;
      }
    | null
    | undefined,
) {
  if (!prescription) {
    return 0;
  }

  if (prescription.mode === "distance" && typeof prescription.distance_km === "number") {
    return prescription.distance_km;
  }

  if (prescription.mode !== "repeats" || !prescription.children?.length) {
    return 0;
  }

  const childDistanceKm = prescription.children.reduce((total, child) => {
    const childPrescription = child.prescription;

    return (
      total + (childPrescription?.mode === "distance" ? (childPrescription.distance_km ?? 0) : 0)
    );
  }, 0);

  return childDistanceKm * (prescription.repeat_count ?? 1);
}

export function resolveSelectedDistanceQualityFamily(input: {
  distanceMeters: number | null | undefined;
  fallbackFamily?: RunningPlanDistanceFamily | null;
}): RunningPlanDistanceFamily {
  const meters = input.distanceMeters ?? null;

  if (meters != null) {
    if (meters <= 10_000) return "10K";
    if (meters <= 21_100) return "Half Marathon";
    return "Marathon Completion";
  }

  return input.fallbackFamily ?? "10K";
}

export function collectSelectedDistanceEndpointIssues(input: {
  rows: readonly SelectedDistanceEndpointRow[];
  expectedDistanceMeters: number | null | undefined;
  targetDate?: string | null;
  proof?: SelectedDistanceEndpointProof | null;
  useFinalNonRestWhenTargetDateMissing?: boolean;
  requireEndpointIdentity?: boolean;
}) {
  const issues: SelectedDistanceEndpointIssue[] = [];
  const expectedDistanceMeters = input.expectedDistanceMeters ?? null;
  if (expectedDistanceMeters == null) {
    return issues;
  }

  const nonRestRows = input.rows.filter((row) => !row.isRest);
  const finalNonRest = nonRestRows.at(-1);
  const targetDate = input.targetDate ?? null;
  const requireEndpointIdentity =
    input.requireEndpointIdentity ??
    input.rows.some((row) => Object.prototype.hasOwnProperty.call(row, "endpointIdentity"));
  const endpointRow =
    (targetDate ? nonRestRows.find((row) => row.date === targetDate) : finalNonRest) ??
    (input.useFinalNonRestWhenTargetDateMissing ? finalNonRest : undefined);

  if (!endpointRow) {
    return [buildIssue("selected_distance_endpoint_missing", "planned_workouts")];
  }

  addIf(
    nonRestRows.filter(isSelectedEndpointSignal).length !== 1,
    "selected_distance_endpoint_count_invalid",
    "planned_workouts",
    `got ${nonRestRows.filter(isSelectedEndpointSignal).length}.`,
  );
  addIf(
    Boolean(targetDate && endpointRow.date !== targetDate),
    "selected_distance_endpoint_target_date_mismatch",
    endpointRow.date,
    `expected ${targetDate}.`,
  );
  addIf(
    finalNonRest?.id !== endpointRow.id,
    "selected_distance_endpoint_not_final_non_rest",
    endpointRow.date,
  );
  addIf(
    endpointRow.endpointKind !== SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND,
    "selected_distance_endpoint_kind_missing",
    endpointRow.date,
  );
  addIf(
    requireEndpointIdentity && endpointRow.endpointIdentity !== SELECTED_DISTANCE_ENDPOINT_IDENTITY,
    "selected_distance_endpoint_identity_missing",
    endpointRow.date,
  );
  addIf(
    endpointRow.endpointDistanceMeters !== expectedDistanceMeters,
    "selected_distance_endpoint_distance_mismatch",
    endpointRow.date,
    `expected ${expectedDistanceMeters}m, got ${String(endpointRow.endpointDistanceMeters)}.`,
  );

  if (input.proof) {
    addIf(
      input.proof.finalRowId !== endpointRow.id,
      "selected_distance_endpoint_proof_row_mismatch",
      endpointRow.date,
    );
    addIf(
      input.proof.finalDate !== endpointRow.date,
      "selected_distance_endpoint_proof_date_mismatch",
      endpointRow.date,
    );
    addIf(
      input.proof.endpointDistanceMeters !== expectedDistanceMeters ||
        input.proof.endpointMainDistanceMeters !== expectedDistanceMeters,
      "selected_distance_endpoint_proof_distance_mismatch",
      endpointRow.date,
      `expected ${expectedDistanceMeters}m.`,
    );
  }

  return issues;

  function addIf(
    condition: boolean,
    code: SelectedDistanceEndpointIssueCode,
    path: string,
    detail?: string,
  ) {
    if (condition) {
      issues.push(buildIssue(code, path, detail));
    }
  }
}

function buildIssue(code: SelectedDistanceEndpointIssueCode, path: string, detail?: string) {
  return {
    code,
    path,
    message: detail
      ? `${SELECTED_DISTANCE_ENDPOINT_ISSUE_MESSAGES[code]} ${detail}`
      : SELECTED_DISTANCE_ENDPOINT_ISSUE_MESSAGES[code],
  };
}

function isSelectedEndpointSignal(row: SelectedDistanceEndpointRow) {
  return (
    row.isSelectedEndpointSignal ?? row.endpointKind === SELECTED_DISTANCE_ENDPOINT_SOURCE_KIND
  );
}
