import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Activity, Watch, Apple, NotebookPen, ImageIcon, Cog } from "lucide-react";
import { findWorkout, type Workout } from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getShellRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: `Integrations — ${APP_NAME}` },
      {
        name: "description",
        content: "Connections and follow-up tools.",
      },
    ],
  }),
  loader: () => getShellRouteData(),
  component: Integrations,
});

const ITEMS = [
  {
    id: "garmin",
    name: "Garmin Connect",
    desc: "Not connected yet.",
    icon: Watch,
    status: "later",
    category: "Devices",
  },
  {
    id: "strava",
    name: "Strava",
    desc: "Not connected yet.",
    icon: Activity,
    status: "later",
    category: "Devices",
  },
  {
    id: "apple",
    name: "Apple Health",
    desc: "Not connected yet.",
    icon: Apple,
    status: "later",
    category: "Devices",
  },
  {
    id: "feedback",
    name: "Workout feedback",
    desc: "Available inside each workout in Feedback. Add a Garmin file, compare plan vs run, and read the next-step note there.",
    icon: NotebookPen,
    status: "live",
    category: "Intelligence",
  },
  {
    id: "ocr",
    name: "Screenshot import",
    desc: "Not available yet.",
    icon: ImageIcon,
    status: "later",
    category: "Intelligence",
  },
  {
    id: "engine",
    name: "Plan adjustments",
    desc: "Not automatic yet.",
    icon: Cog,
    status: "later",
    category: "Intelligence",
  },
];

function Integrations() {
  const { snapshot, viewer } = Route.useLoaderData();
  const cats = Array.from(new Set(ITEMS.map((i) => i.category)));
  const feedbackWorkout = resolveFeedbackWorkout(snapshot.workouts, snapshot.currentDate);
  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="px-6 py-10 lg:px-10 max-w-5xl">
        <header className="hito-page-header">
          <p className="hito-label">{snapshot.source === "persisted" ? "Saved plan" : "Preview"}</p>
          <h1 className="hito-page-title">Connections</h1>
          <p className="hito-page-copy">
            {snapshot.source === "persisted"
              ? "Your saved plan is active, but the provider connections listed here are not connected unless they say Live."
              : "This page shows what is available now and what still comes later."}
          </p>
        </header>

        <div className="hito-route-stack">
          {cats.map((c) => (
            <section key={c}>
              <div className="hito-section-header">
                <h2 className="hito-section-title">{c}</h2>
                <span className="hito-section-subtitle">
                  {c === "Intelligence" ? "Available now and later" : "Later"}
                </span>
              </div>
              <div className="hito-row-group">
                {ITEMS.filter((i) => i.category === c).map((i) => {
                  const Icon = i.icon;
                  const canOpenFeedback =
                    i.id === "feedback" &&
                    snapshot.source === "persisted" &&
                    Boolean(feedbackWorkout);
                  return (
                    <div
                      key={i.id}
                      className={cn(
                        "hito-list-row items-start transition-colors",
                        i.status === "live" ? "bg-success/[0.04]" : "hover:bg-accent/25",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-hairline bg-background/25">
                          <Icon className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="hito-list-row-title">{i.name}</h3>
                          <p className="hito-list-row-copy">{i.desc}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <StatusChip status={i.status} />
                        {canOpenFeedback ? (
                          <Link
                            to="/workout/$date"
                            params={{ date: feedbackWorkout!.date }}
                            search={{ tab: "feedback" } as never}
                            className="hito-button hito-button-secondary hito-button-xs"
                          >
                            Open feedback
                          </Link>
                        ) : i.id === "feedback" ? (
                          <Link to="/" className="hito-button hito-button-secondary hito-button-xs">
                            Open calendar
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-hairline pt-6">
          <p className="hito-caption max-w-2xl">
            Available now: workout Feedback for Garmin upload, plan-vs-run review, and a short
            next-step note. Still later: screenshot import, provider sync, and broader plan
            adjustments.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; tone?: "signal" | "success" }> = {
    later: { label: "Later" },
    live: { label: "Live", tone: "success" },
  };
  const m = map[status];
  return (
    <span
      className="hito-status-pill"
      data-tone={m.tone}
      data-icon={status === "later" ? "false" : undefined}
    >
      {m.label}
    </span>
  );
}

function resolveFeedbackWorkout(workouts: Workout[], currentDate: string) {
  const todayWorkout = findWorkout(workouts, currentDate);

  if (todayWorkout && todayWorkout.type !== "rest") {
    return todayWorkout;
  }

  return workouts.find((workout) => workout.type !== "rest") ?? null;
}
