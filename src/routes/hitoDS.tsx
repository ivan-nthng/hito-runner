import { useState } from "react";
import type { CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Download,
  FileJson2,
  LineChart,
  Minus,
  Plug,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hitoDS")({
  head: () => ({
    meta: [
      { title: `Hito Design System — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito design-system reference for the simplified Hito product language.",
      },
    ],
  }),
  component: HitoDesignSystemPage,
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "surfaces", label: "Composition" },
  { id: "states", label: "States" },
  { id: "analytics", label: "Summary truth" },
  { id: "rows", label: "Rows & disclosure" },
  { id: "shell", label: "Shell nav" },
  { id: "dropdowns", label: "Dropdowns" },
] as const;

const BUTTON_VARIANTS = ["primary", "secondary", "outlined", "ghost"] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const FIELD_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const STATUS_MARKER_EXAMPLES = [
  { label: "Completed", tone: "success", icon: Check },
  { label: "Partial", tone: "warning", icon: Minus },
  { label: "Skipped", tone: "destructive", icon: X },
  { label: "Neutral", tone: "muted", icon: Minus },
] as const;

const FEEDBACK_MARKER_EXAMPLES = [
  { label: "Evidence", state: "evidence_attached" },
  { label: "Feedback", state: "feedback_ready" },
] as const;

const CALENDAR_TYPE_EXAMPLES = [
  { label: "Easy", family: "easy", color: "var(--easy)" },
  { label: "Recovery", family: "easy", color: "var(--easy)" },
  { label: "Long", family: "long", color: "var(--long)" },
  { label: "Tempo", family: "quality", color: "var(--quality)" },
  { label: "Intervals", family: "quality", color: "var(--quality)" },
  { label: "Progression", family: "quality", color: "var(--quality)" },
  { label: "Race", family: "quality", color: "var(--quality)" },
  { label: "Quality", family: "quality", color: "var(--quality)" },
  { label: "Rest", family: "rest", color: "var(--rest)" },
] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonSize = (typeof BUTTON_SIZES)[number];

function HitoDesignSystemPage() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [size, setSize] = useState<ButtonSize>("lg");
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(true);
  const [disabled, setDisabled] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground canvas-grain">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-hairline bg-sidebar/70 px-5 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen">
          <div>
            <div className="font-display text-2xl tracking-tight">hito ds</div>
            <p className="hito-label mt-2">Component system</p>
          </div>

          <nav className="mt-10 grid gap-1">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/45 hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className="mt-10 border-t border-hairline pt-5">
            <p className="hito-label hito-label-signal">Rule</p>
            <p className="hito-list-row-copy">
              This page follows the live product: open rhythm first, cards only when they earn it.
            </p>
          </div>
        </aside>

        <main className="px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <header id="overview" className="hito-page-header border-t border-hairline pt-8">
              <p className="hito-label hito-label-signal">Hito design system</p>
              <h1 className="hito-page-title lg:text-7xl">Simplified product language.</h1>
              <p className="hito-page-copy max-w-2xl">
                A compact reference for the simplified Hito product language: open route rhythm,
                divider-based grouping, restrained markers, quiet support copy, and explicit
                utility/disclosure treatment for secondary paths.
              </p>
            </header>

            <section id="typography" className="ds-section">
              <SectionIntro
                label="Typography"
                title="Shared roles, not route-local guesses."
                body="Display is scarce, UI text stays operational, and mono values carry measured truth."
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <TokenCard
                  label="Page title"
                  title="Display identity."
                  body="One large display title per major surface."
                />
                <TokenCard
                  label="Section title"
                  title="Compact emphasis."
                  body="Section headers orient without becoming new hero moments."
                />
                <TokenCard
                  label="Support copy"
                  title="Short and calm."
                  body="Muted body copy explains current truth without narration walls."
                />
              </div>
            </section>

            <section id="buttons" className="ds-section">
              <SectionIntro
                label="Buttons"
                title="Variants, sizes, icons, disabled state."
                body="Use the builder to check CTA hierarchy and icon rhythm across the canonical button system."
              />

              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="hito-row-group self-start">
                  <ToggleRow
                    label="Left icon"
                    active={leftIcon}
                    onToggle={() => setLeftIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Right icon"
                    active={rightIcon}
                    onToggle={() => setRightIcon((v) => !v)}
                  />
                  <ToggleRow
                    label="Disabled"
                    active={disabled}
                    onToggle={() => setDisabled((v) => !v)}
                  />
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Variant</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUTTON_VARIANTS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setVariant(item)}
                            data-active={variant === item}
                            className="hito-tab capitalize"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Size</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {BUTTON_SIZES.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSize(item)}
                            data-active={size === item}
                            className="hito-tab uppercase"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hito-surface-flat p-5">
                  <p className="hito-label">Current button</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <DemoButton
                      variant={variant}
                      size={size}
                      leftIcon={leftIcon}
                      rightIcon={rightIcon}
                      disabled={disabled}
                    />
                    <span className="hito-caption">
                      {variant} / {size} / {disabled ? "disabled" : "enabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-hairline pt-5">
                <p className="hito-caption max-w-2xl">
                  The interactive builder is the source of truth for button variants. Avoid
                  repeating every size and variant as a permanent production reference unless a
                  route needs that exact QA matrix.
                </p>
              </div>
            </section>

            <section id="inputs" className="ds-section">
              <SectionIntro
                label="Inputs"
                title="One size tier means one rhythm."
                body="Text fields and buttons share heights. Textareas follow the same padding and copy rules."
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {FIELD_SIZES.map((fieldSize) => (
                  <label key={fieldSize} className="grid gap-2">
                    <span className="hito-label">Text input {fieldSize.toUpperCase()}</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className={cn("hito-field pl-9", `hito-field-${fieldSize}`)}
                        placeholder={`${fieldSize.toUpperCase()} field`}
                      />
                    </div>
                    <span className="hito-field-helper">Helper text stays short and close.</span>
                  </label>
                ))}
                <label className="grid gap-2 lg:col-span-2">
                  <span className="hito-label">Textarea</span>
                  <textarea
                    rows={5}
                    className="hito-field hito-textarea-md resize-y"
                    placeholder="Describe goal, constraints, recent results, or JSON notes."
                  />
                </label>
              </div>
            </section>

            <section id="surfaces" className="ds-section">
              <SectionIntro
                label="Composition"
                title="Open rhythm before containers."
                body="Route sections should breathe with spacing, section titles, and hairline dividers. Framed surfaces are reserved for stateful interaction or payload ownership."
              />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <article className="border-t border-hairline pt-5">
                  <div className="hito-section-header">
                    <div>
                      <h3 className="hito-section-title text-3xl">Section with no box.</h3>
                      <p className="hito-support-copy mt-2">
                        This is the default route cadence used by simplified home, progress, and
                        body surfaces.
                      </p>
                    </div>
                    <span className="hito-section-subtitle">Default</span>
                  </div>
                  <div className="mt-5 grid gap-0 border-t border-hairline">
                    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3">
                      <span className="hito-list-row-title">Primary truth first</span>
                      <span className="hito-caption">Visible</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3">
                      <span className="hito-list-row-title">Support after divider</span>
                      <span className="hito-caption">Quiet</span>
                    </div>
                  </div>
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Use sparingly</p>
                  <h3 className="mt-3 hito-section-title text-3xl">Owned payload.</h3>
                  <p className="hito-support-copy mt-3">
                    Keep a surface when it contains one active object, like an attached file, form,
                    or route-level state. Avoid stacking subcards inside it.
                  </p>
                </article>
              </div>
            </section>

            <section id="states" className="ds-section">
              <SectionIntro
                label="States"
                title="Markers, state surfaces, tooltips, and severity."
                body="Use compact markers for status truth, one state-surface family for routes, one tooltip shell for chart-adjacent hints, and one scale pattern for body-note severity."
              />
              <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="hito-row-group self-start">
                  {STATUS_MARKER_EXAMPLES.map(({ label, tone, icon: Icon }) => (
                    <div key={label} className="hito-list-row py-3">
                      <span className="hito-list-row-title">{label}</span>
                      <span className="hito-status-marker" data-tone={tone}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="hito-state-surface" data-tone="signal">
                    <p className="hito-label hito-label-signal">Setup state</p>
                    <h3 className="hito-section-title mt-3 text-3xl">Create a first plan.</h3>
                    <p className="hito-support-copy mt-3">
                      State surfaces keep route-level setup and empty states consistent.
                    </p>
                    <div className="hito-state-actions">
                      <button className="hito-button hito-button-primary hito-button-md">
                        Continue
                      </button>
                    </div>
                  </article>
                  <article className="hito-state-surface" data-tone="destructive">
                    <p className="hito-label text-destructive">Error state</p>
                    <h3 className="hito-section-title mt-3 text-3xl">Try again.</h3>
                    <p className="hito-support-copy mt-3">
                      Error tone is reserved for real load or save failures, not normal previews.
                    </p>
                    <div className="hito-state-actions">
                      <button className="hito-button hito-button-secondary hito-button-md">
                        Retry
                      </button>
                    </div>
                  </article>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  <div className="hito-list-row items-start">
                    <div className="w-full">
                      <p className="hito-label">Severity scale</p>
                      <div className="hito-scale-control mt-3">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className="hito-scale-button"
                            data-active={level <= 3}
                            data-level={level}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
                <article className="hito-row-group">
                  <div className="hito-list-row">
                    <div>
                      <p className="hito-list-row-title">L. Knee</p>
                      <p className="hito-list-row-copy">Compact severity summary row.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hito-severity-bars" aria-label="Severity 3 of 5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <span
                            key={level}
                            className="hito-severity-bar"
                            data-active={level <= 3}
                            data-level={level}
                          />
                        ))}
                      </div>
                      <span className="hito-caption font-mono-num">3</span>
                    </div>
                  </div>
                </article>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  <div className="hito-list-row items-start">
                    <div>
                      <p className="hito-label">Tooltip shell</p>
                      <p className="hito-list-row-copy">
                        Used for calendar and workout-structure hover context. Chart geometry stays
                        route-owned.
                      </p>
                    </div>
                  </div>
                </article>
                <div className="hito-tooltip">
                  <span className="flex items-center gap-2">
                    <span className="hito-tooltip-dot text-signal" />
                    <span className="hito-tooltip-title">Warm-up</span>
                  </span>
                  <span className="hito-tooltip-meta mt-1 block font-mono-num">10 min</span>
                  <span className="hito-tooltip-meta mt-1.5 block">
                    Short, scoped context only. No coaching wall.
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  {FEEDBACK_MARKER_EXAMPLES.map(({ label, state }) => (
                    <div key={state} className="hito-list-row py-3">
                      <span className="hito-list-row-title">{label}</span>
                      <span className="hito-feedback-marker" data-state={state}>
                        <span className="hito-feedback-marker-dot" />
                        <span>{label}</span>
                      </span>
                    </div>
                  ))}
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Feedback markers</p>
                  <p className="hito-support-copy mt-3">
                    Secondary discovery only. Completion check, dash, and cross stay primary.
                  </p>
                </article>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <article className="hito-row-group">
                  {CALENDAR_TYPE_EXAMPLES.map(({ label, family, color }) => (
                    <div key={label} className="hito-list-row py-3">
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
                        <span
                          className="hito-calendar-type-glyph"
                          data-family={family}
                          style={{ "--hito-calendar-type-color": color } as CSSProperties}
                        />
                        <span style={{ color }}>{label}</span>
                      </span>
                      <span className="hito-caption">Month cell</span>
                    </div>
                  ))}
                </article>
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Calendar type identity</p>
                  <p className="hito-support-copy mt-3">
                    Month cells use one broad-family glyph plus one short label. Distance, duration,
                    and target details stay in hover or workout detail.
                  </p>
                </article>
              </div>
            </section>

            <section id="analytics" className="ds-section">
              <SectionIntro
                label="Summary truth"
                title="Small summaries, not dashboards."
                body="Progress now leads with one compact saved-truth summary, then uses charts only when current data makes them useful."
              />
              <div className="hito-row-group">
                <div className="hito-list-row items-start lg:items-end">
                  <div className="max-w-md">
                    <h3 className="hito-section-title">Current summary</h3>
                    <p className="hito-support-copy mt-2">
                      One grouped row can carry the real aggregate truth without pretending to be a
                      mature analytics dashboard.
                    </p>
                  </div>
                  <div className="hito-metric-row w-full lg:max-w-xl">
                    <SummaryMetric label="Completed" value="4" unit="of 6" />
                    <SummaryMetric label="Volume" value="28" unit="km" />
                    <SummaryMetric label="Longest" value="8.4" unit="km" />
                  </div>
                </div>
              </div>
              <div className="mt-5 border-t border-hairline pt-5">
                <p className="hito-label">Compact legend</p>
                <div className="hito-legend mt-4">
                  <LegendDemoItem tone="actual" label="Actual" />
                  <LegendDemoItem tone="planned" label="Planned" />
                  <LegendDemoItem tone="completed" label="Done" />
                </div>
              </div>
              <div className="hito-row-group mt-5">
                <div className="hito-list-row items-start">
                  <div>
                    <p className="hito-label">Allowed geometry exceptions</p>
                    <p className="hito-list-row-copy">
                      Bars, plotted lines, interval block widths, SVG silhouettes, and marker
                      coordinates remain visualization geometry. Their labels, captions, legends,
                      rows, and tooltips use Hito primitives.
                    </p>
                  </div>
                  <span className="hito-caption">Exception</span>
                </div>
              </div>
            </section>

            <section id="rows" className="ds-section">
              <SectionIntro
                label="Rows & disclosure"
                title="Rows before boxes, disclosure before loud secondary actions."
                body="Rows carry support content and utilities. Expert or destructive paths should sit behind quieter disclosure unless they are the primary task."
              />
              <div className="hito-row-group">
                {[
                  ["Support row", "One title, one concise helper, optional status.", "Live"],
                  [
                    "Utility row",
                    "Secondary routes and tools stay reachable without becoming primary nav.",
                    "Utility",
                  ],
                  [
                    "Metric row",
                    "Value first, label second, no placeholder dash filler.",
                    "8.4 km",
                  ],
                ].map(([title, body, value]) => (
                  <div key={title} className="hito-list-row">
                    <div>
                      <p className="hito-list-row-title">{title}</p>
                      <p className="hito-list-row-copy">{body}</p>
                    </div>
                    <span
                      className={cn(
                        "hito-caption",
                        value === "8.4 km" && "font-mono-num text-foreground",
                        value === "Live" && "text-success",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <details className="hito-disclosure mt-5">
                <summary className="hito-disclosure-summary">
                  <span>
                    <span className="block text-sm text-foreground">Destructive override</span>
                    <span className="block text-xs text-muted-foreground">
                      Available, but not a permanent sibling to the safe action.
                    </span>
                  </span>
                  <ChevronDown className="hito-disclosure-chevron h-4 w-4" />
                </summary>
                <div className="hito-disclosure-body">
                  <button className="hito-button hito-button-outlined hito-button-sm">
                    Replace today
                  </button>
                </div>
              </details>
            </section>

            <section id="shell" className="ds-section">
              <SectionIntro
                label="Shell navigation"
                title="Product shell rows are owned by Hito."
                body="Runner navigation, mobile navigation, profile trigger, and shell menu rows use one calm shell family instead of route-local spacing and hover rules."
              />
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="hito-surface-flat p-4">
                  <div className="hito-shell-nav">
                    {[
                      { label: "Calendar", icon: CalendarDays, active: true },
                      { label: "Progress", icon: LineChart, active: false },
                    ].map(({ label, icon: Icon, active }) => (
                      <div key={label} className="hito-shell-nav-row" data-active={active}>
                        <Icon className="hito-shell-nav-icon" strokeWidth={1.5} />
                        <span>{label}</span>
                        {active && <span className="hito-shell-nav-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <button type="button" className="hito-shell-profile-trigger">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-signal text-[11px] font-medium text-signal-foreground">
                      IR
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">Ivan</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        Half Marathon Plan
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="hito-row-group">
                    <MenuRow icon={FileJson2} label="Advanced import" meta="Utility" />
                    <MenuRow icon={Settings2} label="User settings" meta="Utility" />
                    <MenuRow icon={Plug} label="Connections status" meta="Utility" />
                  </div>
                </div>
              </div>
            </section>

            <section id="dropdowns" className="ds-section">
              <SectionIntro
                label="Dropdowns"
                title="Compact menu anatomy."
                body="Menu rows stay quiet: label first, shortcut/status second, destructive actions only when real."
              />
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="hito-surface-flat p-4">
                  <button className="hito-button hito-button-secondary hito-button-md w-full justify-between">
                    Component menu
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="hito-row-group">
                  <MenuRow icon={Settings2} label="User settings" meta="Utility" />
                  <MenuRow icon={Plug} label="Connections status" meta="Utility" />
                  <MenuRow icon={FileJson2} label="Advanced import" meta="Utility" />
                  <MenuRow icon={Download} label="Download template" meta="Secondary" />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionIntro({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="hito-section-header">
      <div>
        <p className="hito-label hito-label-signal">{label}</p>
        <h2 className="hito-section-title mt-3 text-4xl">{title}</h2>
        <p className="hito-support-copy mt-3 max-w-2xl">{body}</p>
      </div>
    </div>
  );
}

function TokenCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <article className="hito-surface-flat p-5">
      <p className="hito-label">{label}</p>
      <h3 className="mt-3 hito-section-title text-3xl">{title}</h3>
      <p className="hito-support-copy mt-3">{body}</p>
    </article>
  );
}

function SummaryMetric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="hito-metric">
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="hito-analytics-value">{value}</span>
        {unit && <span className="hito-analytics-unit">{unit}</span>}
      </div>
      <div className="hito-metric-label">{label}</div>
    </div>
  );
}

function LegendDemoItem({
  tone,
  label,
}: {
  tone: "actual" | "planned" | "completed" | "partial" | "skipped";
  label: string;
}) {
  return (
    <span className="hito-legend-item">
      <span className="hito-legend-swatch" data-tone={tone} />
      {label}
    </span>
  );
}

function ToggleRow({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="hito-list-row">
      <span className="hito-list-row-title">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "hito-button hito-button-sm",
          active ? "hito-button-primary" : "hito-button-secondary",
        )}
      >
        {active ? "On" : "Off"}
      </button>
    </div>
  );
}

function DemoButton({
  variant,
  size,
  leftIcon,
  rightIcon,
  disabled = false,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  leftIcon?: boolean;
  rightIcon?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "hito-button whitespace-nowrap capitalize",
        `hito-button-${variant}`,
        `hito-button-${size}`,
      )}
    >
      {leftIcon && <Circle className="h-3.5 w-3.5" />}
      {variant}
      {rightIcon && <ArrowRight className="h-3.5 w-3.5" />}
    </button>
  );
}

function MenuRow({
  icon: Icon,
  label,
  meta,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  meta: string;
}) {
  return (
    <div className="hito-list-row py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
        <span className="hito-list-row-title">{label}</span>
      </div>
      <span className="hito-caption">{meta}</span>
    </div>
  );
}
