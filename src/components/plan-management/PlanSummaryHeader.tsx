import type { PlanMeta } from "@/lib/training";
import { formatDate } from "@/lib/training";
import { Icon } from "@/components/ui/icon";

export function PlanSummaryHeader({
  planMeta,
  goalFallback,
  runnerLabel,
  planDayCount,
  planWorkoutCount,
  defaultStartDate,
}: {
  planMeta: PlanMeta | null | undefined;
  goalFallback: string | null | undefined;
  runnerLabel: string;
  planDayCount: number;
  planWorkoutCount: number;
  defaultStartDate: string;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="hito-label hito-label-signal">Current plan</p>
          <h2 className="hito-section-title mt-2">{planMeta?.title ?? "Saved plan"}</h2>
          <p className="hito-body mt-2 max-w-xl">
            {planMeta?.goal ?? goalFallback ?? `Saved schedule for ${runnerLabel}.`}
          </p>
        </div>
        <span className="hito-status-pill" data-tone="success">
          Active
        </span>
      </div>

      <div className="hito-row-group">
        <div className="hito-list-row">
          <div>
            <p className="hito-list-row-title">
              {planMeta
                ? `${planMeta.startDate >= defaultStartDate ? "Starts" : "Started"} ${formatDate(
                    planMeta.startDate,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}`
                : "Plan dates unavailable"}
            </p>
            <p className="hito-list-row-copy">
              {planDayCount} days · {planWorkoutCount} workouts
              {planMeta?.raceDate
                ? ` · target ${formatDate(planMeta.raceDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          </div>
          <Icon name="calendar" size="sm" className="text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}
