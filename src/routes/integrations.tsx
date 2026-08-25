import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HitoButton } from "@/components/ui/button";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { findWorkout, type TrainingSnapshot, type Workout } from "@/lib/training";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getShellRouteData } from "@/lib/training-api";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

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
    icon: "watch",
    status: "later",
    category: "Devices",
  },
  {
    id: "strava",
    name: "Strava",
    desc: "Not connected yet.",
    icon: "activity",
    status: "later",
    category: "Devices",
  },
  {
    id: "apple",
    name: "Apple Health",
    desc: "Not connected yet.",
    icon: "apple",
    status: "later",
    category: "Devices",
  },
  {
    id: "feedback",
    name: "Workout feedback",
    desc: "Available inside each workout in Feedback. Add a Garmin file, compare plan vs run, and read the next-step note there.",
    icon: "plan-note",
    status: "live",
    category: "Intelligence",
  },
  {
    id: "ocr",
    name: "Screenshot import",
    desc: "Not available yet.",
    icon: "image",
    status: "later",
    category: "Intelligence",
  },
  {
    id: "engine",
    name: "Plan adjustments",
    desc: "Not automatic yet.",
    icon: "cog",
    status: "later",
    category: "Intelligence",
  },
] satisfies {
  id: string;
  name: string;
  desc: string;
  icon: HitoIconName;
  status: string;
  category: string;
}[];

function Integrations() {
  const { snapshot, viewer, settings } = Route.useLoaderData();
  return (
    <AppShell settings={settings} snapshot={snapshot} viewer={viewer}>
      <IntegrationsContent snapshot={snapshot} />
    </AppShell>
  );
}

function IntegrationsContent({ snapshot }: { snapshot: TrainingSnapshot }) {
  const locale = useHitoUiLocale();
  const t = useHitoProductMessage();
  const cats = Array.from(new Set(ITEMS.map((i) => i.category)));
  const feedbackWorkout = resolveFeedbackWorkout(snapshot.workouts, snapshot.currentDate);
  return (
    <div className="hito-route-gutter max-w-5xl py-10">
      <header className="hito-page-header">
        <p className="hito-label-md text-foreground">
          {snapshot.source === "persisted" ? t("Saved plan") : t("Preview")}
        </p>
        <h1 className="hito-ui-title-xl mt-2 max-w-[44rem]">{t("Connections")}</h1>
        <p className="hito-body-md mt-4 max-w-[40rem] text-secondary">
          {snapshot.source === "persisted"
            ? t(
                "Your saved plan is active, but the provider connections listed here are not connected unless they say Live.",
              )
            : t("This page shows what is available now and what still comes later.")}
        </p>
      </header>

      <div className="hito-route-stack">
        {cats.map((c) => (
          <section key={c}>
            <div className="hito-section-header">
              <h2 className="hito-ui-title-sm text-foreground">
                {getHitoKnownProductMessage(locale, c)}
              </h2>
              <span className="hito-label-sm uppercase tracking-[0.18em] text-tertiary">
                {c === "Intelligence" ? t("Available now and later") : t("Later")}
              </span>
            </div>
            <div className="hito-row-group">
              {ITEMS.filter((i) => i.category === c).map((i) => {
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
                        <Icon name={i.icon} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="hito-body-md text-foreground">
                          {getHitoKnownProductMessage(locale, i.name)}
                        </h3>
                        <p className="hito-body-sm mt-1 text-secondary">
                          {getHitoKnownProductMessage(locale, i.desc)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <StatusChip status={i.status} />
                      {canOpenFeedback ? (
                        <HitoButton asChild size="xs" variant="secondary">
                          <Link
                            to="/workout/$date"
                            params={{ date: feedbackWorkout!.date }}
                            search={{ tab: "feedback" } as never}
                          >
                            {t("Open feedback")}
                          </Link>
                        </HitoButton>
                      ) : i.id === "feedback" ? (
                        <HitoButton asChild size="xs" variant="secondary">
                          <Link to="/">{t("Open calendar")}</Link>
                        </HitoButton>
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
        <p className="hito-body-xs text-tertiary max-w-2xl">
          {t(
            "Available now: workout Feedback for Garmin upload, plan-vs-run review, and a short next-step note. Still later: screenshot import, provider sync, and broader plan adjustments.",
          )}
        </p>
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const t = useHitoProductMessage();
  const map: Record<string, { label: string; tone?: "signal" | "success" }> = {
    later: { label: t("Later") },
    live: { label: t("Live"), tone: "success" },
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
