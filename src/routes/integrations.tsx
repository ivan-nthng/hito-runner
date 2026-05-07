import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Activity, Watch, Apple, NotebookPen, ImageIcon, Cog, Check } from "lucide-react";
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
      <div className="px-6 lg:px-10 py-10 max-w-5xl">
        <header className="mb-12">
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            {snapshot.source === "persisted" ? "Saved mode shell" : "Preview surface"}
          </p>
          <h1 className="font-display text-5xl mt-2 leading-none">Integration shells.</h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl">
            {snapshot.source === "persisted"
              ? "Saved mode is active, but nothing on this route should be read as a live provider connection, active sync, or adaptive service."
              : "The route stays in place to preserve the imported structure, but nothing here should be read as a live provider connection, active sync, or adaptive service."}
          </p>
        </header>

        {cats.map((c) => (
          <section key={c} className="mb-12">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              {c}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ITEMS.filter((i) => i.category === c).map((i) => {
                const Icon = i.icon;
                return (
                  <div
                    key={i.id}
                    className={cn(
                      "rounded-xl border p-5 transition-colors",
                      i.status === "preview"
                        ? "border-signal/20 bg-signal/[0.03]"
                        : "border-hairline bg-surface/40 hover:bg-accent/30",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-md border border-hairline grid place-items-center">
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <StatusChip status={i.status} />
                    </div>
                    <h3 className="mt-4 text-base">{i.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{i.desc}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <button className="rounded-md border border-hairline px-3 py-1.5 text-xs tracking-wide transition-colors hover:bg-accent">
                        View status
                      </button>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Not connected
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-dashed border-hairline p-8 mt-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Data flow
          </div>
          <div className="mt-5 grid sm:grid-cols-5 gap-3 items-center text-xs">
            {[
              "Devices later",
              "Imports later",
              "Manual notes",
              "Backend truth later",
              "Plan updates later",
            ].map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-hairline bg-surface/40 px-3 py-3 text-center">
                  {s}
                </div>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11px] text-muted-foreground max-w-xl">
            Nothing in this flow is wired in the current repo. The diagram is preserved only to keep
            the shell and information hierarchy stable for later phases.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon?: typeof Check }> = {
    later: { label: "Later", cls: "bg-transparent text-muted-foreground border-hairline" },
    preview: {
      label: "Preview",
      cls: "bg-signal/15 text-signal border-signal/30",
      icon: Check,
    },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
        m.cls,
      )}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
      {m.label}
    </span>
  );
}
