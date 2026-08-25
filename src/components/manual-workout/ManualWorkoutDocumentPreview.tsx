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
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";
import type { WorkoutType } from "@/lib/training";

export function ManualWorkoutDocumentPreview({
  dateLabel,
  iconTone,
  notes,
  readbackEntries,
  statusLabel,
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
  const t = useHitoProductMessage();
  const visibleStatusLabel = statusLabel ?? t("Preview");

  return (
    <section className="hito-manual-workout-document-preview">
      <ManualWorkoutDocumentLead
        ariaLabel={t("{date} workout preview", { date: dateLabel })}
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
        statusLabel={visibleStatusLabel}
        title={<h3 className="hito-body-md text-foreground min-w-0 truncate">{title}</h3>}
      />

      <ManualWorkoutStructurePreview
        emptyState={{
          badge: t("No structure"),
          copy: t("No extra workout structure was provided for this manual workout."),
        }}
        items={timelineItems}
        summary={timelineSummary}
      />

      <ManualWorkoutReadbackStack entries={readbackEntries} />

      <WorkoutDocumentNotes labelClassName="hito-label-md text-foreground" notes={notes} />
    </section>
  );
}
