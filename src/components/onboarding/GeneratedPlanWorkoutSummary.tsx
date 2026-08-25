import { workoutDocumentTimelineItems } from "@/components/workout-structure/workout-structure-timeline-items";
import {
  formatDurationMin,
  segmentColorMeta,
  workoutDistanceKm,
  workoutDuration,
} from "@/lib/training";
import type { WorkoutDocument } from "@/lib/workout-document";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { formatUiDate, formatUiNumber } from "@/lib/ui-locale";

const SUMMARY_DATE_OPTIONS = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

export function GeneratedPlanWorkoutSummary({ document }: { document: WorkoutDocument }) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const workout = {
    steps: document.steps,
    type: document.workoutType,
  };
  const duration = workoutDuration(workout);
  const distance = workoutDistanceKm(workout);
  const items = workoutDocumentTimelineItems(document);
  const summary = [
    duration > 0 ? formatDurationMin(duration) : null,
    distance != null
      ? `${formatUiNumber(distance, locale, { maximumFractionDigits: 2 })} km`
      : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return (
    <article className="min-w-0">
      <p className="hito-label-md text-foreground">
        {formatUiDate(document.workoutDate, locale, SUMMARY_DATE_OPTIONS)}
      </p>
      <h3 className="hito-body-md text-foreground mt-1">
        {document.workoutType === "rest" ? message("Rest day") : document.title}
      </h3>
      {summary ? <p className="hito-technical-sm mt-1 text-secondary">{summary}</p> : null}

      {items.length > 0 && document.workoutType !== "rest" ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="hito-body-xs text-tertiary">{message("Structure")}</span>
            <span className="hito-technical-sm text-tertiary">
              {message(items.length === 1 ? "{count} block" : "{count} blocks", {
                count: items.length,
              })}
            </span>
          </div>
          <div
            className="mt-2 flex h-1 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={message("{count}-block workout structure schematic", {
              count: items.length,
            })}
          >
            {items.map((item) => (
              <span
                key={item.id}
                className="min-w-px"
                style={{
                  flexBasis: 0,
                  flexGrow: Math.max(item.weight, 1),
                  background: segmentColorMeta(item.semanticKind, item.target).color,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
