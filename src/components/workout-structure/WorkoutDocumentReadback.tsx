import {
  WorkoutStructureTimeline,
  type WorkoutStructureTimelineItem,
} from "@/components/workout-structure/WorkoutStructureTimeline";
import { cn } from "@/lib/utils";

export interface WorkoutDocumentNote {
  key: string;
  label?: string;
  value: string;
}

export function WorkoutDocumentReadback({
  className,
  emptyCopy = "No workout structure available.",
  heading,
  items,
  notes = [],
  summary,
}: {
  className?: string;
  emptyCopy?: string;
  heading?: {
    eyebrow?: string;
    title: string;
    copy?: string;
  };
  items: WorkoutStructureTimelineItem[];
  notes?: WorkoutDocumentNote[];
  summary: string;
}) {
  return (
    <section className={cn("grid gap-5", className)}>
      {heading ? (
        <div className="min-w-0">
          {heading.eyebrow ? <p className="hito-label">{heading.eyebrow}</p> : null}
          <h3 className="hito-list-row-title mt-1 text-base">{heading.title}</h3>
          {heading.copy ? <p className="hito-list-row-copy mt-1">{heading.copy}</p> : null}
        </div>
      ) : null}

      <WorkoutStructureTimeline
        emptyState={{ badge: "No structure", copy: emptyCopy }}
        items={items}
        summary={summary}
      />

      <WorkoutDocumentNotes notes={notes} />
    </section>
  );
}

export function WorkoutDocumentNotes({
  labelClassName = "hito-label",
  notes,
}: {
  labelClassName?: string;
  notes: WorkoutDocumentNote[];
}) {
  if (notes.length === 0) return null;

  return (
    <section className="grid gap-3">
      <p className={labelClassName}>Notes or cues</p>
      <div className="hito-row-group">
        {notes.map((note) => (
          <div key={note.key} className="hito-list-row items-start gap-3 py-3">
            {note.label ? (
              <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                {note.label}
              </span>
            ) : null}
            <p className="hito-list-row-copy min-w-0">{note.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
