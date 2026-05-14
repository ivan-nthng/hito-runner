import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { APP_NAME } from "@/lib/app-config";
import { getShellRouteData } from "@/lib/training-api";

export const Route = createFileRoute("/body")({
  head: () => ({
    meta: [
      { title: `Body — ${APP_NAME}` },
      {
        name: "description",
        content: "Quick body notes.",
      },
    ],
  }),
  loader: () => getShellRouteData(),
  component: Body,
});

const REGIONS = [
  { id: "neck", label: "Neck", side: "front", x: 100, y: 50 },
  { id: "left-shoulder", label: "L. Shoulder", side: "front", x: 70, y: 75 },
  { id: "right-shoulder", label: "R. Shoulder", side: "front", x: 130, y: 75 },
  { id: "lower-back", label: "Lower back", side: "back", x: 100, y: 175 },
  { id: "left-hip", label: "L. Hip", side: "front", x: 82, y: 200 },
  { id: "right-hip", label: "R. Hip", side: "front", x: 118, y: 200 },
  { id: "left-quad", label: "L. Quad", side: "front", x: 82, y: 250 },
  { id: "right-quad", label: "R. Quad", side: "front", x: 118, y: 250 },
  { id: "left-knee", label: "L. Knee", side: "front", x: 82, y: 305 },
  { id: "right-knee", label: "R. Knee", side: "front", x: 118, y: 305 },
  { id: "left-calf", label: "L. Calf", side: "back", x: 82, y: 360 },
  { id: "right-calf", label: "R. Calf", side: "back", x: 118, y: 360 },
  { id: "left-ankle", label: "L. Ankle", side: "front", x: 82, y: 415 },
  { id: "right-ankle", label: "R. Ankle", side: "front", x: 118, y: 415 },
  { id: "left-foot", label: "L. Foot", side: "front", x: 82, y: 450 },
  { id: "right-foot", label: "R. Foot", side: "front", x: 118, y: 450 },
];

const INITIAL_LOG: Record<string, number> = {
  "right-calf": 2,
  "left-knee": 1,
};

function Body() {
  const { snapshot, viewer } = Route.useLoaderData();
  const [log, setLog] = useState<Record<string, number>>(INITIAL_LOG);
  const [view, setView] = useState<"front" | "back">("front");
  const [active, setActive] = useState<string | null>(null);

  function setLevel(id: string, level: number) {
    setLog((p) => {
      const n = { ...p };
      if (level === 0) delete n[id];
      else n[id] = level;
      return n;
    });
  }

  return (
    <AppShell snapshot={snapshot} viewer={viewer}>
      <div className="hito-route-stack max-w-5xl px-6 py-10 lg:px-10">
        <header className="hito-page-header">
          <p className="hito-label">Utility</p>
          <h1 className="hito-page-title">Body notes</h1>
          <p className="hito-page-copy">
            {snapshot.source === "persisted"
              ? "A quick place to mark how your body feels. These notes stay separate from the plan for now."
              : "A preview-only body note tool. It does not change the sample plan or sync anywhere."}
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Body map */}
          <section className="border-t border-hairline pt-5">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="hito-tab-list">
                {(["front", "back"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setView(v)}
                    data-active={view === v}
                    className="hito-tab capitalize"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <span className="hito-caption">
                {Object.keys(log).length} area{Object.keys(log).length === 1 ? "" : "s"} marked
              </span>
            </div>

            <div className="flex justify-center">
              <svg viewBox="0 0 200 500" className="h-[460px] w-auto max-w-full lg:h-[500px]">
                <Silhouette view={view} />
                {REGIONS.filter(
                  (r) =>
                    r.side === view ||
                    r.id.includes("knee") ||
                    r.id.includes("foot") ||
                    r.id.includes("ankle") ||
                    r.id.includes("hip") ||
                    r.id.includes("quad") ||
                    r.id.includes("calf") ||
                    r.id.includes("shoulder") ||
                    r.id === "neck",
                ).map((r) => {
                  const level = log[r.id] ?? 0;
                  const isActive = active === r.id;
                  return (
                    <g
                      key={r.id}
                      onClick={() => setActive(r.id)}
                      onMouseEnter={() => setActive(r.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={r.x}
                        cy={r.y}
                        r={level ? 9 : 5}
                        fill={
                          level
                            ? `color-mix(in oklch, var(--destructive) ${30 + level * 20}%, transparent)`
                            : "var(--hairline)"
                        }
                        stroke={
                          level
                            ? "var(--destructive)"
                            : isActive
                              ? "var(--signal)"
                              : "var(--muted-foreground)"
                        }
                        strokeWidth={isActive ? 1.5 : 1}
                        className="transition-all"
                      />
                      {level > 0 && (
                        <text
                          x={r.x}
                          y={r.y + 3}
                          textAnchor="middle"
                          fontSize="9"
                          fill="var(--foreground)"
                          fontFamily="monospace"
                        >
                          {level}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="hito-support-copy mt-5 text-center">
              {active
                ? `${REGIONS.find((r) => r.id === active)?.label} selected`
                : "Select an area to add or edit a note."}
            </p>
          </section>

          {/* Right panel */}
          <aside className="self-start space-y-6">
            {active && (
              <section className="border-t border-hairline pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="hito-caption">Selected area</p>
                    <h2 className="hito-section-title mt-1">
                      {REGIONS.find((r) => r.id === active)?.label}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLevel(active, 0)}
                    className="hito-button hito-button-ghost hito-button-xs"
                  >
                    Clear
                  </button>
                </div>
                <div className="hito-label mt-5">Severity</div>
                <div className="hito-scale-control mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setLevel(active, n)}
                      data-active={(log[active] ?? 0) >= n}
                      data-level={n}
                      className="hito-scale-button"
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="hito-label mt-5">Sensation</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Sore", "Tight", "Sharp", "Dull", "Swollen", "Stiff"].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="hito-button hito-button-outlined hito-button-xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="When does it appear? After tempo runs, downhill, etc."
                  rows={3}
                  className="hito-field hito-textarea-md mt-4 min-h-24 resize-none"
                />
              </section>
            )}

            <section className="border-t border-hairline pt-5">
              <h2 className="hito-section-title">Today&apos;s notes</h2>
              <div className="mt-4">
                {Object.entries(log).length === 0 && (
                  <p className="hito-caption">No areas marked.</p>
                )}
                {Object.entries(log).map(([id, level]) => {
                  const r = REGIONS.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-4 border-t border-hairline py-3 first:border-t-0"
                    >
                      <span className="hito-list-row-title">{r?.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="hito-severity-bars" aria-label={`Severity ${level} of 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              className="hito-severity-bar"
                              data-active={n <= level}
                              data-level={n}
                            />
                          ))}
                        </div>
                        <span className="hito-caption w-4 text-right font-mono-num">{level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border-t border-hairline pt-5">
              <p className="hito-caption">Current scope</p>
              <p className="hito-support-copy mt-2">
                These are manual notes only. They do not change your plan or create recovery advice
                yet.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Silhouette({ view: _view }: { view: "front" | "back" }) {
  return (
    <g fill="none" stroke="var(--hairline)" strokeWidth="1">
      {/* Head */}
      <circle cx="100" cy="35" r="20" />
      {/* Neck */}
      <line x1="92" y1="55" x2="92" y2="65" />
      <line x1="108" y1="55" x2="108" y2="65" />
      {/* Torso */}
      <path d="M 65 75 Q 60 110 65 160 L 75 220 L 125 220 L 135 160 Q 140 110 135 75 Q 120 65 100 65 Q 80 65 65 75 Z" />
      {/* Arms */}
      <path d="M 65 75 Q 50 130 48 200 L 55 240" />
      <path d="M 135 75 Q 150 130 152 200 L 145 240" />
      {/* Hands */}
      <circle cx="55" cy="248" r="6" />
      <circle cx="145" cy="248" r="6" />
      {/* Legs */}
      <path d="M 75 220 L 75 320 L 80 420 L 85 470" />
      <path d="M 95 220 L 92 320 L 88 420 L 88 470" />
      <path d="M 105 220 L 108 320 L 112 420 L 112 470" />
      <path d="M 125 220 L 125 320 L 120 420 L 115 470" />
      {/* Feet */}
      <ellipse cx="84" cy="478" rx="9" ry="5" />
      <ellipse cx="116" cy="478" rx="9" ry="5" />
      {/* knee lines */}
      <line x1="78" y1="320" x2="93" y2="320" />
      <line x1="107" y1="320" x2="122" y2="320" />
    </g>
  );
}
