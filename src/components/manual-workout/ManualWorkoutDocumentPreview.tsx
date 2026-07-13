import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import type { ManualWorkoutReadbackEntry } from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar.model";
import {
  ManualWorkoutDocumentLead,
  ManualWorkoutReadbackStack,
  ManualWorkoutStructurePreview,
} from "@/components/manual-workout/ManualWorkoutTrainingBlockGrammar";
import {
  WorkoutDocumentNotes,
  type WorkoutDocumentNote,
} from "@/components/workout-structure/WorkoutDocumentReadback";
import type { WorkoutStructureTimelineItem } from "@/components/workout-structure/WorkoutStructureTimeline";
import type { WorkoutType } from "@/lib/training";

export function ManualWorkoutDocumentPreview({
  dateLabel,
  iconTone,
  notes,
  readbackEntries,
  statusLabel = "Preview",
  timelineItems,
  timelineSummary,
  title,
  typeLabel,
  workoutType,
}: {
  dateLabel: string;
  iconTone?: string;
  notes: WorkoutDocumentNote[];
  readbackEntries: ManualWorkoutReadbackEntry[];
  statusLabel?: string;
  timelineItems: WorkoutStructureTimelineItem[];
  timelineSummary: string;
  title: string;
  typeLabel: string;
  workoutType: WorkoutType;
}) {
  return (
    <section className="hito-manual-workout-document-preview">
      <ManualWorkoutDocumentLead
        ariaLabel={`${dateLabel} workout preview`}
        icon={
          <span style={iconTone ? { color: iconTone } : undefined}>
            <WorkoutGlyph type={workoutType} className="h-5 w-5" />
          </span>
        }
        meta={
          <>
            {dateLabel} · {typeLabel}
          </>
        }
        statusLabel={statusLabel}
        title={<h3 className="hito-list-row-title min-w-0 truncate">{title}</h3>}
      />

      <ManualWorkoutStructurePreview
        emptyState={{
          badge: "No structure",
          copy: "No extra workout structure was provided for this manual workout.",
        }}
        items={timelineItems}
        summary={timelineSummary}
      />

      <ManualWorkoutReadbackStack entries={readbackEntries} />

      <WorkoutDocumentNotes labelClassName="hito-form-label" notes={notes} />
    </section>
  );
}
