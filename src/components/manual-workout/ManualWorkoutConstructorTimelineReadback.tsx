import type {
  ManualWorkoutConstructorContract,
  ManualWorkoutConstructorRepeatGroup,
  ManualWorkoutConstructorSegment,
  ManualWorkoutConstructorSegmentRole,
  ManualWorkoutConstructorSegmentStructure,
  ManualWorkoutConstructorSegmentTarget,
} from "@/lib/manual-workout-authoring";
import { formatDistanceMeters, formatDurationMin } from "@/lib/training";

export function ManualWorkoutConstructorTimelineReadback({
  contract,
}: {
  contract: ManualWorkoutConstructorContract;
}) {
  return (
    <div className="hito-list-row items-start">
      <div className="grid min-w-0 flex-1 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="hito-list-row-title">Workout timeline</p>
            <p className="hito-list-row-copy">{constructorContractSummary(contract)}</p>
          </div>
          <span className="hito-status-pill" data-tone="muted">
            Reviewed
          </span>
        </div>

        {contract.timeline.length > 0 ? (
          <div className="grid gap-3">
            {contract.timeline.map((entry, index) =>
              entry.kind === "repeat" ? (
                <RepeatTimelineRow key={`repeat-${index}-${entry.label}`} repeat={entry} />
              ) : (
                <SegmentTimelineRow key={`segment-${index}-${entry.label}`} segment={entry} />
              ),
            )}
          </div>
        ) : (
          <p className="hito-field-helper">No running parts in this reviewed draft.</p>
        )}

        {contract.metadataNotes.length > 0 ? (
          <div className="grid gap-2 border-t border-hairline pt-3">
            {contract.metadataNotes.map((note) => (
              <p key={`${note.label}-${note.text}`} className="hito-list-row-copy">
                <span className="font-medium text-foreground">{note.label}:</span> {note.text}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function constructorContractSummary(contract: ManualWorkoutConstructorContract) {
  const segmentCount = contract.timeline.reduce(
    (count, entry) => count + (entry.kind === "repeat" ? entry.children.length : 1),
    0,
  );
  const repeatCount = contract.timeline.filter((entry) => entry.kind === "repeat").length;
  const parts = [
    segmentCount === 1 ? "1 part" : `${segmentCount} parts`,
    repeatCount > 0 ? `${repeatCount} ${repeatCount === 1 ? "repeat" : "repeats"}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No running parts";
}

function RepeatTimelineRow({ repeat }: { repeat: ManualWorkoutConstructorRepeatGroup }) {
  return (
    <div className="grid gap-3 border-t border-hairline pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="hito-status-pill" data-tone="signal">
          {repeat.repeatCount}x
        </span>
        <p className="hito-list-row-title min-w-0 break-words">{repeat.label}</p>
      </div>
      <div className="ml-1 grid gap-2 border-l border-hairline pl-3 sm:ml-3">
        {repeat.children.map((segment, index) => (
          <SegmentTimelineRow
            key={`repeat-child-${index}-${segment.role}-${segment.label}`}
            nested
            segment={segment}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentTimelineRow({
  nested = false,
  segment,
}: {
  nested?: boolean;
  segment: ManualWorkoutConstructorSegment;
}) {
  const structure = segmentStructureLabel(segment.structure);
  const target = segmentTargetLabel(segment.target);

  return (
    <div
      className={
        nested
          ? "grid min-w-0 gap-1"
          : "grid min-w-0 gap-1 border-t border-hairline pt-3 first:border-t-0 first:pt-0"
      }
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="hito-status-pill" data-tone="muted">
          {segmentRoleLabel(segment.role)}
        </span>
        <p className="hito-list-row-title min-w-0 break-words">{segment.label}</p>
        <span className="hito-field-helper shrink-0">{structure}</span>
      </div>
      {target ? <p className="hito-list-row-copy break-words">{target}</p> : null}
      {segment.guidance ? (
        <p className="hito-list-row-copy break-words">{segment.guidance}</p>
      ) : null}
    </div>
  );
}

function segmentRoleLabel(role: ManualWorkoutConstructorSegmentRole) {
  switch (role) {
    case "warm_up":
      return "Warm-up";
    case "run":
      return "Run";
    case "work":
      return "Work";
    case "recover":
      return "Recover";
    case "finish":
      return "Finish";
    case "cooldown":
      return "Cooldown";
  }
}

function segmentStructureLabel(structure: ManualWorkoutConstructorSegmentStructure) {
  switch (structure.kind) {
    case "duration":
      return formatDurationMin(structure.seconds / 60, "segment");
    case "distance":
      return formatDistanceMeters(structure.meters);
    case "duration_and_distance":
      return [
        formatDurationMin(structure.seconds / 60, "segment"),
        formatDistanceMeters(structure.meters),
      ].join(" · ");
  }
}

function segmentTargetLabel(target: ManualWorkoutConstructorSegmentTarget) {
  switch (target.kind) {
    case "none":
      return null;
    case "effort_rpe":
      return joinTargetParts([
        target.label ?? "Effort (RPE 0-10)",
        target.rpe != null ? `RPE ${target.rpe}` : null,
        target.cue,
        target.sourceNote,
      ]);
    case "pace":
      return joinTargetParts([
        target.label ?? "Your pace target",
        target.pace,
        target.paceMinPerKmRange,
        target.sourceNote,
      ]);
    case "heart_rate":
      return joinTargetParts([
        target.label ?? "Your heart-rate target",
        target.hrBpmCap != null ? `${target.hrBpmCap} bpm cap` : null,
        target.hrBpmRange,
        target.sourceNote,
      ]);
  }
}

function joinTargetParts(parts: Array<string | number | null | undefined>) {
  const visibleParts = parts
    .map((part) => (typeof part === "number" ? String(part) : part?.trim()))
    .filter((part): part is string => Boolean(part));

  return visibleParts.length ? visibleParts.join(" · ") : null;
}
