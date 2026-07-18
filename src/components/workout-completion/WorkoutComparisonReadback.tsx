/* eslint-disable react-refresh/only-export-components */
import { formatDurationMin } from "@/lib/training";
import { Icon } from "@/components/ui/icon";
import type {
  WorkoutComparisonDifferencePayload,
  WorkoutComparisonSegmentGroup,
  WorkoutComparisonSupportItem,
  WorkoutComparisonSignal,
  WorkoutComparisonSummary,
} from "@/lib/workout-result-import/types";
import { cn } from "@/lib/utils";

type SupportReadback = {
  compared: string[];
  unavailable: string[];
  unsupported: string[];
};

export function DeterministicComparisonReadback({
  comparison,
}: {
  comparison: WorkoutComparisonSummary;
}) {
  const payload = getComparisonPayload(comparison);
  const confidencePct = Math.round(comparison.comparisonConfidence * 100);
  const signals = getComparisonSignals(comparison);
  const comparedSignalCount = payload?.summary.comparedSignalCount ?? signals.length;
  const signalSummary = payload?.summary;
  const sessionItems = buildSessionSummaryItems(payload);
  const supportReadback = buildSupportReadback(payload);
  const segmentGroups = buildSegmentSummaryItems(payload);
  const stepSummary = describeStepSummary(comparison);
  const technicalNotes = [
    `Comparison coverage: ${humanizeComparisonStatus(comparison.comparisonStatus)}.`,
    `Confidence: ${confidencePct}%.`,
    `Checks available: ${comparedSignalCount} of ${signals.length}.`,
    ...(signalSummary ? [comparisonChecksSummary(signalSummary)] : []),
    ...buildComparisonTechnicalNotes(signals, stepSummary),
  ];

  return (
    <div className="mt-4 space-y-4">
      {sessionItems.length > 0 && (
        <div className="border-t border-hairline pt-4">
          <p className="hito-list-row-title">Run summary</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sessionItems.map((item) => (
              <div key={item.label} title={item.helpText}>
                <p className="hito-caption">{item.label}</p>
                <p
                  className={cn(
                    "hito-technical-mono mt-1",
                    item.tone === "success" && "text-success",
                    item.tone === "warning" && "text-warn",
                    item.tone === "destructive" && "text-destructive",
                  )}
                >
                  {item.direction === "up" ? "↑ " : item.direction === "down" ? "↓ " : ""}
                  {item.value}
                </p>
                {item.support ? <p className="hito-body-small mt-1">{item.support}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {supportReadback && <ComparisonSupportReadback readback={supportReadback} />}

      {segmentGroups.length > 0 && <SegmentSummaryReadback groups={segmentGroups} />}

      <div className="divide-y divide-hairline">
        {signals.map((signal) => (
          <SignalReadbackRow key={signal.key} signal={signal} />
        ))}
      </div>

      {technicalNotes.length > 0 ? (
        <details className="hito-disclosure">
          <summary className="hito-disclosure-summary">
            <span className="hito-label text-foreground">Comparison notes</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body">
            {technicalNotes.map((note) => (
              <p key={note} className="hito-body-small">
                {note}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function ComparisonSupportReadback({ readback }: { readback: SupportReadback }) {
  return (
    <div className="border-t border-hairline pt-4">
      <p className="hito-list-row-title">What this review checked</p>
      <p className="hito-body-small mt-1 max-w-2xl">
        This section explains which parts of the plan-vs-run check are supported by the uploaded
        Garmin file today.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {readback.compared.length > 0 ? (
          <SupportReadbackGroup title="Compared now" items={readback.compared} tone="success" />
        ) : null}
        {readback.unavailable.length > 0 ? (
          <SupportReadbackGroup
            title="Not available in this upload"
            items={readback.unavailable}
            tone="signal"
          />
        ) : null}
      </div>

      {readback.unsupported.length > 0 ? (
        <p className="hito-body-small mt-3">
          Not part of this review yet: {formatInlineList(readback.unsupported)}.
        </p>
      ) : null}
    </div>
  );
}

function SupportReadbackGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "signal";
}) {
  return (
    <div>
      <p className="hito-caption">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="hito-status-pill" data-tone={tone}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SegmentSummaryReadback({ groups }: { groups: WorkoutComparisonSegmentGroup[] }) {
  return (
    <div className="border-t border-hairline pt-4">
      <div className="max-w-2xl">
        <p className="hito-list-row-title">Workout structure</p>
        <p className="hito-body-small mt-1">
          Grouped from the aligned workout steps, when warm-up, main work, recovery, or cooldown can
          be compared honestly.
        </p>
      </div>
      <div className="mt-3 divide-y divide-hairline">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div>
              <p className="hito-list-row-title">{humanizeSegmentGroupLabel(group)}</p>
              <p className="hito-body-small mt-1">{describeSegmentGroup(group)}</p>
            </div>
            <span className="hito-status-pill" data-tone={toneForSignal(group.status)}>
              {humanizeSignalStatus(group.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalReadbackRow({ signal }: { signal: WorkoutComparisonSignal }) {
  const valueLine = describeComparisonSignal(signal);

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="hito-list-row-title">{humanizeSignalLabel(signal.label, signal.key)}</p>
        <span className="hito-status-pill" data-tone={toneForSignal(signal.status)}>
          {humanizeSignalStatus(signal.status)}
        </span>
      </div>
      {valueLine && <p className="hito-body-small mt-1">{valueLine}</p>}
    </div>
  );
}

function describeComparisonSignal(signal: WorkoutComparisonSignal) {
  if (signal.status === "not_applicable") {
    return "This check could not be compared.";
  }

  if (signal.status === "missing_actual") {
    return "Actual data is still missing for this check.";
  }

  const plannedValue = formatComparisonValue(signal.plannedValue, signal.unit);
  const actualValue = formatComparisonValue(signal.actualValue, signal.unit);
  const details = [`Planned ${plannedValue}`, `Run ${actualValue}`];
  const delta = formatSignalDelta(signal);
  const tolerance = formatSignalTolerance(signal);

  if (delta) {
    details.push(delta);
  }

  if (tolerance) {
    details.push(tolerance);
  }

  return details.join(" · ");
}

function describeStepSummary(comparison: WorkoutComparisonSummary) {
  const payload = getComparisonPayload(comparison);
  const stepSummary = payload?.stepSummary;

  if (!stepSummary) {
    return null;
  }

  if (stepSummary.status === "not_applicable") {
    return stepSummary.reason ?? "Per-step comparison is not available for this workout shape yet.";
  }

  const hasAnyOffSteps =
    stepSummary.partialStepCount > 0 ||
    stepSummary.mismatchStepCount > 0 ||
    stepSummary.missingActualStepCount > 0;

  if (!hasAnyOffSteps) {
    return `${stepSummary.comparedStepCount} steps compared · all matched`;
  }

  const parts = [
    `${stepSummary.comparedStepCount} steps compared`,
    `${stepSummary.matchedStepCount} matched`,
  ];

  if (stepSummary.partialStepCount > 0) {
    parts.push(`${stepSummary.partialStepCount} partial`);
  }

  if (stepSummary.mismatchStepCount > 0) {
    parts.push(`${stepSummary.mismatchStepCount} different`);
  }

  if (stepSummary.missingActualStepCount > 0) {
    parts.push(`${stepSummary.missingActualStepCount} with no run data`);
  }

  const firstMismatch = stepSummary.steps.find((step) => step.status !== "matched");
  if (firstMismatch) {
    parts.push(
      `first different step ${firstMismatch.plannedSequence}: ${formatDurationMin(
        firstMismatch.plannedDurationMin,
      )} vs ${formatDurationMin(firstMismatch.actualDurationMin)}`,
    );
  }

  if (stepSummary.reason) {
    parts.push(stepSummary.reason);
  }

  return parts.join(" · ");
}

function buildSupportReadback(
  payload: WorkoutComparisonDifferencePayload | null,
): SupportReadback | null {
  const signals = payload?.supportMatrix?.signals;

  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  const readback: SupportReadback = {
    compared: [],
    unavailable: [],
    unsupported: [],
  };

  signals.forEach((signal) => {
    if (!isSupportItem(signal)) {
      return;
    }

    const label = humanizeSupportSignalLabel(signal);

    if (signal.status === "compared") {
      readback.compared.push(label);
      return;
    }

    if (signal.status === "unsupported") {
      readback.unsupported.push(label);
      return;
    }

    readback.unavailable.push(label);
  });

  return readback.compared.length > 0 ||
    readback.unavailable.length > 0 ||
    readback.unsupported.length > 0
    ? {
        compared: uniqueStrings(readback.compared),
        unavailable: uniqueStrings(readback.unavailable),
        unsupported: uniqueStrings(readback.unsupported),
      }
    : null;
}

function isSupportItem(value: unknown): value is WorkoutComparisonSupportItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.status === "string";
}

function humanizeSupportSignalLabel(signal: WorkoutComparisonSupportItem) {
  switch (signal.key) {
    case "date_alignment":
      return "workout day";
    case "duration":
      return "duration";
    case "distance":
      return "distance";
    case "structured_step_count":
      return "step count";
    case "step_duration":
      return "step timing";
    case "segment_group_duration":
      return "workout sections";
    case "pace":
      return "pace";
    case "heart_rate":
      return "heart rate";
    default:
      return signal.label.trim() || signal.key.replace(/_/g, " ");
  }
}

function buildSegmentSummaryItems(
  payload: WorkoutComparisonDifferencePayload | null,
): WorkoutComparisonSegmentGroup[] {
  const segmentSummary = payload?.segmentSummary;

  if (
    !segmentSummary ||
    segmentSummary.status !== "available" ||
    !Array.isArray(segmentSummary.groups)
  ) {
    return [];
  }

  return segmentSummary.groups.filter(isUsefulSegmentGroup);
}

function isUsefulSegmentGroup(group: WorkoutComparisonSegmentGroup) {
  return (
    group.plannedStepCount > 0 ||
    group.actualStepCount > 0 ||
    group.plannedDurationMin != null ||
    group.actualDurationMin != null ||
    group.plannedDistanceKm != null ||
    group.actualDistanceKm != null
  );
}

function humanizeSegmentGroupLabel(group: WorkoutComparisonSegmentGroup) {
  switch (group.key) {
    case "warmup":
      return "Warm-up";
    case "main":
      return "Main work";
    case "cooldown":
      return "Cooldown";
    case "recovery":
      return "Recovery";
    default:
      return group.label || "Other";
  }
}

function describeSegmentGroup(group: WorkoutComparisonSegmentGroup) {
  const parts: string[] = [];

  parts.push(`${group.plannedStepCount} planned step${group.plannedStepCount === 1 ? "" : "s"}`);
  parts.push(`${group.actualStepCount} actual step${group.actualStepCount === 1 ? "" : "s"}`);

  if (group.plannedDurationMin != null || group.actualDurationMin != null) {
    const durationLine = [
      `plan ${formatDurationMin(group.plannedDurationMin)}`,
      `actual ${formatDurationMin(group.actualDurationMin)}`,
    ];
    const delta = formatSegmentDurationDelta(group.durationDeltaMin, group.durationDeltaPct);

    if (delta) {
      durationLine.push(delta);
    }

    parts.push(durationLine.join(" · "));
  }

  if (group.plannedDistanceKm != null || group.actualDistanceKm != null) {
    const distanceLine = [
      `plan ${formatSegmentDistance(group.plannedDistanceKm)}`,
      `actual ${formatSegmentDistance(group.actualDistanceKm)}`,
    ];
    const delta = formatSegmentDistanceDelta(group.distanceDeltaKm);

    if (delta) {
      distanceLine.push(delta);
    }

    parts.push(distanceLine.join(" · "));
  }

  if (group.reason && group.status !== "matched") {
    parts.push(group.reason);
  }

  return parts.join(" · ");
}

function formatSegmentDurationDelta(deltaMin: number | null, deltaPct: number | null) {
  if (deltaMin == null) {
    return null;
  }

  if (deltaMin === 0) {
    return "on target";
  }

  const direction = deltaMin > 0 ? "longer" : "shorter";
  const pct = deltaPct != null ? `, ${Math.round(Math.abs(deltaPct) * 100)}%` : "";
  return `${Math.abs(deltaMin).toFixed(1)} min ${direction}${pct}`;
}

function formatSegmentDistance(value: number | null) {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(2)} km`;
}

function formatSegmentDistanceDelta(deltaKm: number | null) {
  if (deltaKm == null) {
    return null;
  }

  if (deltaKm === 0) {
    return "on target";
  }

  const direction = deltaKm > 0 ? "longer" : "shorter";
  return `${Math.abs(deltaKm).toFixed(2)} km ${direction}`;
}

function formatInlineList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items));
}

function formatComparisonValue(value: unknown, unit?: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (unit === "km") {
      return `${value.toFixed(2)} km`;
    }

    if (unit === "min") {
      return formatDurationMin(value);
    }

    return String(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "—";
}

function buildSessionSummaryItems(payload: WorkoutComparisonDifferencePayload | null) {
  if (!payload) {
    return [];
  }

  const summary = payload.sessionSummary;
  if (!summary) {
    return [];
  }

  const structuredStepsValue = formatStructuredStepsSummaryValue(payload);
  const durationSignal = payload.facts.duration;
  const distanceSignal = payload.facts.distance;
  const dateSignal = payload.facts.dateAlignment;
  const structuredStepsSignal = payload.facts.structuredStepCount;
  const items = [
    summary.durationDeltaMin != null
      ? {
          label: "Duration",
          ...formatFriendlyDurationDelta(summary.durationDeltaMin, summary.durationDeltaPct),
          direction: directionForDelta(summary.durationDeltaMin),
          tone: toneForSignal(durationSignal.status),
          helpText:
            "How much shorter or longer the uploaded run was compared with the planned workout duration.",
        }
      : null,
    summary.distanceDeltaKm != null
      ? {
          label: "Distance",
          ...formatFriendlyDistanceDelta(summary.distanceDeltaKm, summary.distanceDeltaPct),
          direction: directionForDelta(summary.distanceDeltaKm),
          tone: toneForSignal(distanceSignal.status),
          helpText:
            "How much shorter or longer the uploaded run distance was compared with the planned workout distance.",
        }
      : null,
    summary.dateDeltaDays != null
      ? {
          label: "Workout day",
          ...formatFriendlyDateDelta(summary.dateDeltaDays),
          direction: null,
          tone: toneForSignal(dateSignal.status),
          helpText:
            "Whether the uploaded run happened on the same day as the planned workout or drifted earlier or later.",
        }
      : null,
    structuredStepsValue
      ? {
          label: "Structured steps",
          ...structuredStepsValue,
          direction: null,
          tone: toneForSignal(structuredStepsSignal.status),
          helpText:
            "Whether the workout structure could be compared from the uploaded run, not whether every split was perfect.",
        }
      : null,
  ];

  return items.filter(notNullSessionItem);
}

function formatFriendlyDurationDelta(deltaMin: number, deltaPct: number | null) {
  if (deltaMin === 0) {
    return {
      value: "On target",
      support: null,
    };
  }

  const minutes = `${Math.abs(deltaMin).toFixed(1)} min`;
  const direction = deltaMin > 0 ? "longer" : "shorter";
  return {
    value: minutes,
    support: deltaPct != null ? `${Math.round(deltaPct * 100)}% ${direction}` : direction,
  };
}

function formatFriendlyDistanceDelta(deltaKm: number, deltaPct: number | null) {
  if (deltaKm === 0) {
    return {
      value: "On target",
      support: null,
    };
  }

  const distance = `${Math.abs(deltaKm).toFixed(2)} km`;
  const direction = deltaKm > 0 ? "longer" : "shorter";
  return {
    value: distance,
    support: deltaPct != null ? `${Math.round(deltaPct * 100)}% ${direction}` : direction,
  };
}

function formatFriendlyDateDelta(deltaDays: number) {
  if (deltaDays === 0) {
    return {
      value: "Same day",
      support: null,
    };
  }

  const days = Math.abs(deltaDays);
  return {
    value:
      deltaDays > 0
        ? `${days} day${days === 1 ? "" : "s"} later`
        : `${days} day${days === 1 ? "" : "s"} earlier`,
    support: "Workout day drift",
  };
}

function directionForDelta(delta: number | null) {
  if (delta == null || delta === 0) {
    return null;
  }

  return delta > 0 ? "up" : "down";
}

function formatStructuredStepsSummaryValue(payload: WorkoutComparisonDifferencePayload) {
  const summary = payload.sessionSummary;
  if (!summary) {
    return null;
  }

  const signal = payload.facts.structuredStepCount;

  if (signal.status === "not_applicable") {
    return {
      value: "Not comparable",
      support:
        summary.actualStructuredStepCount != null
          ? `${summary.actualStructuredStepCount} actual`
          : null,
    };
  }

  if (signal.status === "missing_actual") {
    return {
      value: "No actual step data",
      support:
        summary.plannedStructuredStepCount != null
          ? `${summary.plannedStructuredStepCount} planned`
          : null,
    };
  }

  if (summary.plannedStructuredStepCount == null && summary.actualStructuredStepCount == null) {
    return null;
  }

  return {
    value: `${summary.plannedStructuredStepCount ?? "—"} planned`,
    support: `${summary.actualStructuredStepCount ?? "—"} actual`,
  };
}

function formatSignalDelta(signal: WorkoutComparisonSignal) {
  if (typeof signal.delta !== "number" || !Number.isFinite(signal.delta)) {
    return null;
  }

  if (signal.unit === "min") {
    const signed = signal.delta >= 0 ? `+${signal.delta.toFixed(1)}` : signal.delta.toFixed(1);
    return `delta ${signed} min`;
  }

  if (signal.unit === "km") {
    const signed = signal.delta >= 0 ? `+${signal.delta.toFixed(2)}` : signal.delta.toFixed(2);
    return `delta ${signed} km`;
  }

  if (signal.unit === "count") {
    const signed = signal.delta >= 0 ? `+${signal.delta}` : String(signal.delta);
    return `delta ${signed}`;
  }

  if (signal.unit === "date") {
    const signed = signal.delta >= 0 ? `+${signal.delta}` : String(signal.delta);
    return `delta ${signed} days`;
  }

  return null;
}

function formatSignalTolerance(signal: WorkoutComparisonSignal) {
  if (
    typeof signal.matchedTolerancePct !== "number" ||
    !Number.isFinite(signal.matchedTolerancePct) ||
    typeof signal.partialTolerancePct !== "number" ||
    !Number.isFinite(signal.partialTolerancePct)
  ) {
    return null;
  }

  return `match <= ${Math.round(signal.matchedTolerancePct * 100)}%, partial <= ${Math.round(
    signal.partialTolerancePct * 100,
  )}%`;
}

function humanizeSignalStatus(status: WorkoutComparisonSignal["status"]) {
  switch (status) {
    case "matched":
      return "Matched plan";
    case "partial":
      return "Partly matched";
    case "mismatch":
      return "Different from plan";
    case "missing_actual":
      return "No run data";
    default:
      return "Not compared";
  }
}

function humanizeSignalLabel(label: string, key: WorkoutComparisonSignal["key"]) {
  if (key === "date_alignment") {
    return "Workout day";
  }

  return label;
}

function humanizeComparisonStatus(status: WorkoutComparisonSummary["comparisonStatus"]) {
  switch (status) {
    case "complete":
      return "Enough";
    case "partial":
      return "Partial";
    default:
      return "Limited";
  }
}

export function humanizePrimaryComparisonVerdict(comparison: WorkoutComparisonSummary) {
  if (comparison.completionState === "matched") {
    return "Matched plan";
  }

  const payload = getComparisonPayload(comparison);
  const summary = payload?.summary;

  if (summary && summary.mismatchSignals > 0 && summary.partialSignals === 0) {
    return "Different from plan";
  }

  return "Partly matched";
}

function comparisonChecksSummary(summary: WorkoutComparisonDifferencePayload["summary"]) {
  return [
    `${summary.matchedSignals} matched`,
    `${summary.partialSignals} partly matched`,
    `${summary.mismatchSignals} different from plan`,
    `${summary.missingActualSignals} with no run data`,
    `${summary.notApplicableSignals} not compared`,
  ].join(" · ");
}

function buildComparisonTechnicalNotes(
  signals: WorkoutComparisonSignal[],
  stepSummary: string | null,
) {
  const notes = signals
    .filter((signal) => shouldShowSignalReason(signal))
    .map((signal) => `${humanizeSignalLabel(signal.label, signal.key)}: ${signal.reason}`);

  if (stepSummary) {
    notes.push(`Structured steps: ${stepSummary}`);
  }

  return notes;
}

export function hasPrimaryMatchedVerdict(comparison: WorkoutComparisonSummary | null) {
  if (!comparison) {
    return false;
  }

  return (
    comparison.completionState === "matched" && comparison.comparisonStatus !== "insufficient_data"
  );
}

export function toneForComparison(comparison: WorkoutComparisonSummary) {
  if (
    comparison.completionState === "matched" &&
    comparison.comparisonStatus !== "insufficient_data"
  ) {
    return "success";
  }

  if (comparison.completionState === "partially_matched") {
    return "warning";
  }

  return "signal";
}

function toneForSignal(status: WorkoutComparisonSignal["status"]) {
  switch (status) {
    case "matched":
      return "success";
    case "partial":
      return "warning";
    case "mismatch":
      return "destructive";
    default:
      return "signal";
  }
}

function shouldShowSignalReason(signal: WorkoutComparisonSignal) {
  return Boolean(
    signal.reason &&
    (signal.status === "partial" ||
      signal.status === "mismatch" ||
      signal.status === "missing_actual" ||
      signal.status === "not_applicable"),
  );
}

function getComparisonPayload(
  comparison: WorkoutComparisonSummary,
): WorkoutComparisonDifferencePayload | null {
  const payload = comparison.differencePayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload;
}

function getComparisonSignals(comparison: WorkoutComparisonSummary) {
  const payload = getComparisonPayload(comparison);
  const signals = payload?.signals;

  if (Array.isArray(signals) && signals.length > 0) {
    return signals.filter(isComparisonSignal);
  }

  const facts = asRecord(payload?.facts);
  const fallback = [
    legacyFactToSignal("date_alignment", "Date", "date", asRecord(facts?.dateAlignment)),
    legacyFactToSignal("duration", "Duration", "min", asRecord(facts?.duration)),
    legacyFactToSignal("distance", "Distance", "km", asRecord(facts?.distance)),
    legacyFactToSignal(
      "structured_step_count",
      "Structured steps",
      "count",
      asRecord(facts?.structuredStepCount),
    ),
  ];

  return fallback.filter(notNullSignal);
}

function isComparisonSignal(value: unknown): value is WorkoutComparisonSignal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.status === "string";
}

function legacyFactToSignal(
  key: WorkoutComparisonSignal["key"],
  label: string,
  unit: WorkoutComparisonSignal["unit"],
  fact: Record<string, unknown> | null,
) {
  if (!fact) {
    return null;
  }

  const status = typeof fact.status === "string" ? fact.status : null;

  if (!status) {
    return null;
  }

  return {
    key,
    label,
    unit,
    status: status as WorkoutComparisonSignal["status"],
    reason: typeof fact.reason === "string" ? fact.reason : undefined,
    plannedValue:
      typeof fact.plannedValue === "number" || typeof fact.plannedValue === "string"
        ? fact.plannedValue
        : null,
    actualValue:
      typeof fact.actualValue === "number" || typeof fact.actualValue === "string"
        ? fact.actualValue
        : null,
    delta: typeof fact.delta === "number" ? fact.delta : null,
    deltaPct: typeof fact.deltaPct === "number" ? fact.deltaPct : null,
  } satisfies WorkoutComparisonSignal;
}

function notNullSignal(signal: WorkoutComparisonSignal | null): signal is WorkoutComparisonSignal {
  return signal != null;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function notNullSessionItem(
  item: { label: string; value: string; support?: string | null } | null,
): item is { label: string; value: string; support?: string | null } {
  return item != null;
}
