import type { ReactNode } from "react";
import type { ManualWorkoutReadbackEntry } from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar.model";
import {
  WorkoutStructureTimeline,
  type WorkoutStructureTimelineItem,
} from "@/components/workout-structure/WorkoutStructureTimeline";

type ManualWorkoutReadbackSegmentEntry = Extract<ManualWorkoutReadbackEntry, { kind: "segment" }>;

export function ManualWorkoutDocumentLead({
  ariaLabel,
  children,
  icon,
  meta,
  statusLabel,
  title,
}: {
  ariaLabel: string;
  children?: ReactNode;
  icon: ReactNode;
  meta?: ReactNode;
  statusLabel?: string;
  title: ReactNode;
}) {
  return (
    <section className="hito-manual-workout-document-lead" aria-label={ariaLabel}>
      <div className="hito-manual-workout-lead-row">
        <span className="hito-manual-workout-lead-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="hito-manual-workout-title-field hito-manual-workout-title-field-stack">
          {title}
          {meta ? <p className="hito-list-row-copy">{meta}</p> : null}
        </div>
        {statusLabel ? (
          <span className="hito-status-pill shrink-0" data-tone="muted">
            {statusLabel}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ManualWorkoutStructurePreview({
  ariaLabel = "Workout structure preview",
  emptyState,
  helper,
  items,
  summary,
}: {
  ariaLabel?: string;
  emptyState: {
    badge: string;
    copy: string;
  };
  helper?: ReactNode;
  items: WorkoutStructureTimelineItem[];
  summary: string;
}) {
  return (
    <section className="hito-manual-workout-editor-surface-muted hito-manual-workout-structure-card">
      <WorkoutStructureTimeline
        ariaLabel={ariaLabel}
        density="compact"
        emptyState={emptyState}
        items={items}
        summary={summary}
      />
      {helper ? <p className="hito-field-helper">{helper}</p> : null}
    </section>
  );
}

export function ManualWorkoutSectionRowHeader({
  actions,
  markerColor,
  ordinal,
  summary,
  title,
  typeControl,
}: {
  actions: ReactNode;
  markerColor: string;
  ordinal: string;
  summary: string;
  title?: string;
  typeControl: ReactNode;
}) {
  return (
    <div className="hito-manual-workout-row-header">
      <span
        className="hito-manual-workout-row-marker"
        style={{ background: markerColor }}
        aria-hidden="true"
      />
      <span className="hito-caption hito-manual-workout-row-ordinal font-mono-num">{ordinal}</span>
      <div className="hito-manual-workout-step-summary flex-1">
        <div className="hito-manual-workout-row-title-line">
          <div className="hito-manual-workout-row-title-main">
            {typeControl}
            {title ? <p className="hito-list-row-title min-w-0 truncate">{title}</p> : null}
          </div>
          <p className="hito-list-row-copy hito-manual-workout-row-duration-summary min-w-0 truncate">
            {summary}
          </p>
        </div>
      </div>
      {actions}
    </div>
  );
}

export function ManualWorkoutReadbackStack({ entries }: { entries: ManualWorkoutReadbackEntry[] }) {
  return (
    <div className="hito-manual-workout-readback-stack">
      {entries.map((entry) =>
        entry.kind === "repeat" ? (
          <ManualWorkoutRepeatReadbackRow key={entry.id} entry={entry} />
        ) : (
          <ManualWorkoutSegmentReadbackRow entry={entry} key={entry.id} />
        ),
      )}
    </div>
  );
}

function ManualWorkoutSegmentReadbackRow({ entry }: { entry: ManualWorkoutReadbackSegmentEntry }) {
  return (
    <div className="hito-manual-workout-readback-row" data-nested={entry.nested || undefined}>
      <span
        className="hito-manual-workout-row-marker"
        style={{ background: entry.markerColor }}
        aria-hidden="true"
      />
      {entry.ordinal ? (
        <span className="hito-caption hito-manual-workout-row-ordinal font-mono-num">
          {entry.ordinal}
        </span>
      ) : null}
      {entry.roleLabel ? (
        <span className="hito-status-pill shrink-0" data-icon="false">
          {entry.roleLabel}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="hito-list-row-title min-w-0 truncate">{entry.title}</p>
        <p className="hito-list-row-copy min-w-0 truncate">{entry.targetSummary}</p>
      </div>
      <span className="hito-caption hito-manual-workout-readback-duration font-mono-num">
        {entry.durationSummary}
      </span>
    </div>
  );
}

function ManualWorkoutRepeatReadbackRow({
  entry,
}: {
  entry: Extract<ManualWorkoutReadbackEntry, { kind: "repeat" }>;
}) {
  return (
    <article className="hito-manual-workout-readback-repeat">
      <div
        className="hito-manual-workout-repeat-gutter"
        aria-label={`${entry.repeatCount} repeats`}
      >
        x{entry.repeatCount}
      </div>
      <div className="hito-manual-workout-repeat-readback-stack">
        <div className="min-w-0 px-1">
          <p className="hito-list-row-title min-w-0 truncate">{entry.title}</p>
          <p className="hito-list-row-copy min-w-0 truncate">{entry.summary}</p>
        </div>
        {entry.children.map((child) => (
          <ManualWorkoutSegmentReadbackRow entry={child} key={child.id} />
        ))}
      </div>
    </article>
  );
}
