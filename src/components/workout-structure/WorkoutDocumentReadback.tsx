import {
  WorkoutStructureTimeline,
  type WorkoutStructureTimelineItem,
} from "@/components/workout-structure/WorkoutStructureTimeline";
import { cn } from "@/lib/utils";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";

export interface WorkoutDocumentNote {
  key: string;
  label?: string;
  value: string;
}

export function WorkoutDocumentReadback({
  className,
  emptyCopy,
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
  const t = useHitoProductMessage();

  return (
    <section className={cn("grid gap-5", className)}>
      {heading ? (
        <div className="min-w-0">
          {heading.eyebrow ? (
            <p className="hito-label-md text-foreground">{heading.eyebrow}</p>
          ) : null}
          <h3 className="hito-body-md text-foreground mt-1">{heading.title}</h3>
          {heading.copy ? <p className="hito-body-sm mt-1 text-secondary">{heading.copy}</p> : null}
        </div>
      ) : null}

      <WorkoutStructureTimeline
        emptyState={{
          badge: t("No structure"),
          copy: emptyCopy ?? t("No workout structure available."),
        }}
        items={items}
        summary={summary}
      />

      <WorkoutDocumentNotes notes={notes} />
    </section>
  );
}

export function WorkoutDocumentNotes({
  labelClassName = "hito-label-md text-foreground",
  notes,
}: {
  labelClassName?: string;
  notes: WorkoutDocumentNote[];
}) {
  const t = useHitoProductMessage();

  if (notes.length === 0) return null;

  return (
    <section className="grid gap-3">
      <p className={labelClassName}>{t("Notes or cues")}</p>
      <div className="hito-row-group">
        {notes.map((note) => (
          <div key={note.key} className="hito-list-row items-start gap-3 py-3">
            {note.label ? (
              <span className="hito-status-pill mt-0.5 shrink-0" data-tone="muted">
                {note.label}
              </span>
            ) : null}
            <p className="hito-body-sm mt-1 text-secondary min-w-0">{note.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
