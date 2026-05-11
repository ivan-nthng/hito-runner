import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Download,
  FileJson2,
  HeartPulse,
  LineChart,
  Minus,
  Plug,
  Search,
  Settings2,
  TrendingUp,
  UserRound,
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
        content:
          "Internal Hito design-system playground for primitives, controls, surfaces, rows, and component variants.",
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
  { id: "surfaces", label: "Surfaces" },
  { id: "states", label: "States" },
  { id: "analytics", label: "Analytics" },
  { id: "rows", label: "List items" },
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
              This page is internal: component variants, not runner navigation or product state.
            </p>
          </div>
        </aside>

        <main className="px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <header id="overview" className="hito-page-header border-t border-hairline pt-8">
              <p className="hito-label hito-label-signal">Hito design system</p>
              <h1 className="hito-page-title lg:text-7xl">Primitive playground.</h1>
              <p className="hito-page-copy max-w-2xl">
                A focused internal builder for Hito primitives: typography, controls, inputs,
                surfaces, rows, and dropdown patterns. Product chrome stays out of the way.
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

              <div className="mt-6 overflow-x-auto border-t border-hairline pt-6">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="hito-section-subtitle border-b border-hairline">
                      <th className="py-3 pr-4">Variant</th>
                      {BUTTON_SIZES.map((buttonSize) => (
                        <th key={buttonSize} className="px-3 py-3 uppercase">
                          {buttonSize}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BUTTON_VARIANTS.map((buttonVariant) => (
                      <tr key={buttonVariant} className="border-b border-hairline last:border-0">
                        <td className="hito-label py-4 pr-4 capitalize">{buttonVariant}</td>
                        {BUTTON_SIZES.map((buttonSize) => (
                          <td key={buttonSize} className="px-3 py-4">
                            <DemoButton
                              variant={buttonVariant}
                              size={buttonSize}
                              leftIcon
                              rightIcon={false}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                label="Surfaces"
                title="Low-card by default."
                body="Use frames only when boundaries improve scanability. Dividers and rows should do most of the work."
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <TokenCard
                  label="Surface"
                  title="Grouped frame."
                  body="For related content that benefits from one boundary."
                />
                <article className="hito-surface-flat p-5">
                  <p className="hito-label">Flat surface</p>
                  <h3 className="mt-3 hito-section-title text-3xl">Softer support.</h3>
                  <p className="hito-support-copy mt-3">
                    A quieter container for secondary context.
                  </p>
                </article>
                <article className="border-t border-hairline pt-5">
                  <p className="hito-label">Open section</p>
                  <h3 className="mt-3 hito-section-title text-3xl">No box needed.</h3>
                  <p className="hito-support-copy mt-3">Spacing and one hairline can be enough.</p>
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
            </section>

            <section id="analytics" className="ds-section">
              <SectionIntro
                label="Analytics"
                title="Large stats and chart legends."
                body="Progress summaries use shared value-first stat blocks and one compact legend family instead of route-local dashboard chrome."
              />
              <div className="hito-analytics-grid">
                <article className="hito-analytics-stat">
                  <div className="hito-analytics-stat-head">
                    <span className="hito-label">Completed sessions</span>
                    <Activity className="hito-analytics-stat-icon h-3.5 w-3.5" strokeWidth={1.5} />
                  </div>
                  <div className="hito-analytics-stat-body">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="hito-analytics-value">4</span>
                    </div>
                    <span className="hito-caption">6 planned in the visible block</span>
                  </div>
                </article>
                <article className="hito-analytics-stat">
                  <div className="hito-analytics-stat-head">
                    <span className="hito-label">Total volume</span>
                    <TrendingUp
                      className="hito-analytics-stat-icon h-3.5 w-3.5"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="hito-analytics-stat-body">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="hito-analytics-value">28</span>
                      <span className="hito-analytics-unit">km</span>
                    </div>
                    <span className="hito-caption">derived from saved outcomes</span>
                  </div>
                </article>
              </div>
              <div className="hito-surface-flat mt-5 p-5">
                <p className="hito-label">Legend</p>
                <div className="hito-legend mt-4">
                  <LegendDemoItem tone="actual" label="Actual" />
                  <LegendDemoItem tone="planned" label="Planned" />
                  <LegendDemoItem tone="completed" label="Completed" />
                  <LegendDemoItem tone="partial" label="Partial" />
                  <LegendDemoItem tone="skipped" label="Skipped" />
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
                  <span className="hito-status-pill" data-icon="false">
                    Exception
                  </span>
                </div>
              </div>
            </section>

            <section id="rows" className="ds-section">
              <SectionIntro
                label="List items"
                title="Rows before boxes."
                body="Grouped rows are the default for dense support content, menus, settings, summaries, and metadata."
              />
              <div className="hito-row-group">
                {[
                  ["Support row", "One title, one concise helper, optional status.", "Live"],
                  [
                    "Settings row",
                    "Left label and support text, right-side value or action.",
                    "Later",
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
                      className="hito-status-pill"
                      data-tone={value === "Live" ? "success" : undefined}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
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
                      { label: "Body", icon: HeartPulse, active: false },
                      { label: "Integrations", icon: Plug, active: false },
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
                    <MenuRow icon={Settings2} label="Settings" meta="Later" />
                    <MenuRow icon={UserRound} label="Account" meta="Later" />
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
                  <MenuRow icon={Settings2} label="Settings" meta="Later" />
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
