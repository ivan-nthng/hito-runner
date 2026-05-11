import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Activity, Watch, Apple, NotebookPen, ImageIcon, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";
import { getShellRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: `Integrations — ${APP_NAME}` },
      {
        name: "description",
        content: "Preview integration surface preserved from the imported baseline.",
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
    desc: "Reserved for future activity import once device connections are approved and wired.",
    icon: Watch,
    status: "later",
    category: "Devices",
  },
  {
    id: "strava",
    name: "Strava",
    desc: "Will stay disconnected until real sync and saved identity exist.",
    icon: Activity,
    status: "later",
    category: "Devices",
  },
  {
    id: "apple",
    name: "Apple Health",
    desc: "Not connected in the current preview baseline.",
    icon: Apple,
    status: "later",
    category: "Devices",
  },
  {
    id: "notes",
    name: "Planning notes",
    desc: "Placeholder area for future enrichment, not live coaching.",
    icon: NotebookPen,
    status: "preview",
    category: "Intelligence",
  },
  {
    id: "ocr",
    name: "Screenshot import",
    desc: "Shown only as a future shell. No OCR parsing is available in this phase.",
    icon: ImageIcon,
    status: "preview",
    category: "Intelligence",
  },
  {
    id: "engine",
    name: "Plan adjustments",
    desc: "Product logic is not being rewritten here yet.",
    icon: Cog,
    status: "preview",
    category: "Intelligence",
  },
];

function Integrations() {
  const { snapshot, viewer } = Route.useLoaderData();
  const cats = Array.from(new Set(ITEMS.map((i) => i.category)));
  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="px-6 py-10 lg:px-10 max-w-5xl">
        <header className="hito-page-header">
          <p className="hito-label">
            {snapshot.source === "persisted" ? "Saved mode shell" : "Preview surface"}
          </p>
          <h1 className="hito-page-title">Integration shells.</h1>
          <p className="hito-page-copy">
            {snapshot.source === "persisted"
              ? "Saved mode is active, but nothing on this route should be read as a live provider connection, active sync, or adaptive service."
              : "The route stays in place to preserve the imported structure, but nothing here should be read as a live provider connection, active sync, or adaptive service."}
          </p>
        </header>

        <div className="hito-route-stack">
          {cats.map((c) => (
            <section key={c}>
              <div className="hito-section-header">
                <h2 className="hito-section-title">{c}</h2>
                <span className="hito-section-subtitle">Not connected</span>
              </div>
              <div className="hito-row-group">
                {ITEMS.filter((i) => i.category === c).map((i) => {
                  const Icon = i.icon;
                  return (
                    <div
                      key={i.id}
                      className={cn(
                        "hito-list-row items-start transition-colors",
                        i.status === "preview" ? "bg-signal/[0.03]" : "hover:bg-accent/25",
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
                        <button className="hito-button hito-button-secondary hito-button-xs">
                          View status
                        </button>
                        <span className="hito-label">Not connected</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 border-t border-hairline pt-6">
          <div className="hito-label">Data flow</div>
          <div className="hito-row-group mt-5">
            {[
              "Devices later",
              "Imports later",
              "Manual notes",
              "Backend truth later",
              "Plan updates later",
            ].map((s, i) => (
              <div key={s} className="hito-list-row py-3">
                <span className="hito-list-row-title">{s}</span>
                {i < 4 && <span className="hito-caption">Later</span>}
              </div>
            ))}
          </div>
          <p className="hito-caption mt-5 max-w-xl">
            Nothing in this flow is wired in the current repo. The diagram is preserved only to keep
            the shell and information hierarchy stable for later phases.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; tone?: "signal" }> = {
    later: { label: "Later" },
    preview: { label: "Preview", tone: "signal" },
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
