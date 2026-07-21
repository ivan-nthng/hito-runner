import type { CSSProperties } from "react";
import { WorkoutLibraryPlayground } from "@/components/hito-ds/workout-library-playground";
import { HitoDsPatternInlineEditing } from "@/components/hito-ds/reference-pattern-inline-editing";
import { ReferenceListRow, SectionIntro } from "@/components/hito-ds/reference";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutGlyph } from "@/components/WorkoutGlyph";
import { workoutTypeColorVar } from "@/lib/workout-color-tokens";
import type { WorkoutGlyphKind } from "@/lib/workout-glyph";

const STATUS_MARKER_EXAMPLES = [
  { label: "Completed", tone: "success", icon: "check" },
  { label: "Partial", tone: "warning", icon: "minus" },
  { label: "Skipped", tone: "destructive", icon: "close" },
  { label: "Neutral", tone: "muted", icon: "minus" },
] as const;

const FEEDBACK_MARKER_EXAMPLES = [
  { label: "Evidence", state: "evidence_attached" },
  { label: "Feedback", state: "feedback_ready" },
] as const;

const CALENDAR_TYPE_EXAMPLES: ReadonlyArray<{
  label: string;
  glyph: WorkoutGlyphKind;
  role: string;
  color: string;
}> = [
  { label: "Easy", glyph: "easy", role: "easy", color: workoutTypeColorVar("easy") },
  {
    label: "Recovery",
    glyph: "recovery",
    role: "recovery",
    color: workoutTypeColorVar("recovery"),
  },
  { label: "Steady", glyph: "steady", role: "steady", color: workoutTypeColorVar("steady") },
  { label: "Long Run", glyph: "long", role: "long_run", color: workoutTypeColorVar("long_run") },
  {
    label: "Progression",
    glyph: "progression",
    role: "progression",
    color: workoutTypeColorVar("progression"),
  },
  { label: "Tempo", glyph: "tempo", role: "tempo", color: workoutTypeColorVar("tempo") },
  {
    label: "Intervals",
    glyph: "intervals",
    role: "intervals",
    color: workoutTypeColorVar("intervals"),
  },
  { label: "Hills", glyph: "hills", role: "hills", color: workoutTypeColorVar("hills") },
  {
    label: "Run/Walk",
    glyph: "recovery",
    role: "run_walk",
    color: workoutTypeColorVar("run_walk"),
  },
  { label: "Rest", glyph: "rest", role: "rest", color: workoutTypeColorVar("rest") },
] as const;

export function HitoDsPatternsPage() {
  return (
    <>
      <HitoDsPatternInlineEditing />
      <section id="editorial-patterns" className="ds-section">
        <SectionIntro
          label="Editorial patterns"
          title="Changelog rhythm, promoted into the system."
          body="These classes preserve the current public changelog look: compact serif date rails, warm text highlights with backdrop, text with editorial backdrop, glowing timeline dots, and calm inline code chips."
        />

        <div className="grid gap-8">
          <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="grid gap-4 rounded-2xl bg-foreground/[0.025] p-5">
              <div className="grid grid-cols-[4.75rem_3.25rem_minmax(0,1fr)] items-baseline gap-4">
                <span className="hito-timeline-year">2026</span>
                <span className="hito-timeline-month">May</span>
                <span className="hito-timeline-day">24</span>
              </div>
              <p className="hito-body-small text-muted-foreground">
                Use year, month, and day roles for sticky editorial timeline rails. Layout and
                sticky scope stay with the route.
              </p>
            </div>

            <div className="grid gap-4">
              <article
                className="hito-editorial-backdrop hito-timeline-entry"
                data-tone="highlight"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="hito-timeline-entry-dot"
                    data-tone="highlight"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="hito-highlight-tag" data-tone="signal">
                        New
                      </span>
                      <h3 className="hito-panel-title text-foreground">
                        Editorial timeline family
                      </h3>
                    </div>
                    <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
                      Timeline entries use a calm backdrop and preserve technical chips like{" "}
                      <code className="hito-inline-code">hito-inline-code</code> inside readable
                      release copy.
                    </p>
                  </div>
                </div>
              </article>

              <article className="hito-editorial-backdrop hito-timeline-entry" data-tone="quiet">
                <div className="flex gap-3">
                  <span aria-hidden="true" className="hito-timeline-entry-dot" data-tone="quiet" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="hito-highlight-tag" data-tone="neutral">
                        Cleanup
                      </span>
                      <h3 className="hito-panel-title text-foreground">Behind the scenes</h3>
                    </div>
                    <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
                      Quiet entries stay legible without turning editorial history into card soup.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="hito-reference-list">
            <ReferenceListRow
              label="Use"
              title="Release history and public editorial chronology"
              body="Use these primitives for changelog-style history, milestone readbacks, and route-level editorial timelines."
            />
            <ReferenceListRow
              label="Do not"
              title="Do not replace product status chips"
              body="Highlight tags are title-adjacent text highlights, not status chips. Operational state still belongs to status chips and state surfaces."
            />
            <ReferenceListRow
              label="Scope"
              title="Keep grid and sticky mechanics local"
              body="The DS owns typography, backdrop, dots, tags, and inline code. Each route owns its own timeline grid, sticky rail scope, and content ordering."
            />
          </div>
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
                <h3 className="hito-section-title">Section with no box.</h3>
                <p className="hito-support-copy mt-2">
                  This is the default route cadence used by simplified home, progress, and body
                  surfaces.
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
            <h3 className="hito-panel-title mt-3">Owned payload.</h3>
            <p className="hito-support-copy mt-3">
              Keep a surface when it contains one active object, like an attached file, form, or
              route-level state. Avoid stacking subcards inside it.
            </p>
          </article>
        </div>
      </section>
      <section id="states" className="ds-section">
        <SectionIntro
          label="States"
          title="Markers, route states, tooltips, and severity."
          body="Use compact markers for status truth, one state-surface family for loading, empty, success, and error routes, one tooltip shell for chart-adjacent hints, and one scale pattern for body-note severity."
        />
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hito-row-group self-start">
            {STATUS_MARKER_EXAMPLES.map(({ label, tone, icon }) => (
              <div key={label} className="hito-list-row py-3">
                <span className="hito-list-row-title">{label}</span>
                <span className="hito-status-marker" data-tone={tone}>
                  <Icon name={icon} size="xs" strokeWidth={2.2} />
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="hito-state-surface" aria-busy="true">
              <p className="hito-label">Loading</p>
              <h3 className="hito-section-title mt-3 flex items-center gap-2">
                <Icon name="loader" size="sm" className="animate-spin text-muted-foreground" />
                Loading your plan.
              </h3>
              <p className="hito-support-copy mt-3">
                Loading is neutral and does not imply success or failure before truth arrives.
              </p>
              <div className="mt-5 grid gap-3" aria-hidden="true">
                <Skeleton className="h-6 w-2/3" />
                <div className="grid gap-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </article>
            <article className="hito-state-surface" data-tone="signal">
              <p className="hito-label hito-label-signal">Empty</p>
              <h3 className="hito-section-title mt-3">Create a first plan.</h3>
              <p className="hito-support-copy mt-3">
                State surfaces keep route-level setup and empty states consistent.
              </p>
              <div className="hito-state-actions">
                <button className="hito-button hito-button-primary hito-button-md">Continue</button>
              </div>
            </article>
            <article className="hito-state-surface" data-tone="success">
              <p className="hito-label text-success">Success</p>
              <h3 className="hito-section-title mt-3">Plan saved.</h3>
              <p className="hito-support-copy mt-3">
                Success confirms a completed operation without becoming another card family.
              </p>
              <div className="hito-state-actions">
                <button className="hito-button hito-button-secondary hito-button-md">
                  View calendar
                </button>
              </div>
            </article>
            <article className="hito-state-surface" data-tone="destructive">
              <p className="hito-label text-destructive">Error</p>
              <h3 className="hito-section-title mt-3">Try again.</h3>
              <p className="hito-support-copy mt-3">
                Error tone is reserved for real load or save failures, not normal previews.
              </p>
              <div className="hito-state-actions">
                <button className="hito-button hito-button-secondary hito-button-md">Retry</button>
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
            {CALENDAR_TYPE_EXAMPLES.map(({ label, glyph, role, color }) => (
              <div key={label} className="hito-list-row py-3">
                <span className="hito-label inline-flex items-center gap-2">
                  <WorkoutGlyph
                    kind={glyph}
                    className="hito-calendar-type-glyph"
                    style={{ color }}
                  />
                  <span style={{ color }}>{label}</span>
                </span>
                <span className="hito-caption">{role} role</span>
              </div>
            ))}
          </article>
          <article className="hito-surface-flat p-5">
            <p className="hito-label">Calendar type identity</p>
            <p className="hito-support-copy mt-3">
              Month cells use accepted runner-facing workout labels and semantic workout type
              colors. Distance, duration, and target details stay in hover or workout detail.
            </p>
          </article>
        </div>
      </section>
      <WorkoutLibraryPlayground />

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
                One grouped row can carry the real aggregate truth without pretending to be a mature
                analytics dashboard.
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
        <div className="hito-chart-section mt-5">
          <p className="hito-label">Visualization chrome</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="hito-list-row-title">Planned vs actual bars</p>
              <p className="hito-list-row-copy mt-1">
                DS owns the fill tones and compact notes. Height and scale remain local chart
                geometry.
              </p>
              <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
                {[0.72, 0.58, 0.88, 0.46].map((height, index) => (
                  <div key={height} className="flex flex-1 items-end gap-px">
                    <span
                      className="hito-comparison-bar flex-1"
                      data-tone="actual"
                      style={{ height: `${height * 100}%` }}
                    />
                    <span
                      className="hito-comparison-bar flex-1"
                      data-tone={index === 3 ? "future" : "planned"}
                      style={{ height: `${Math.max(0.3, height - 0.12) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between">
                <span className="hito-chart-note">Wk 1</span>
                <span className="hito-chart-note">Wk 4</span>
              </div>
            </div>
            <div>
              <p className="hito-list-row-title">Result status strip</p>
              <p className="hito-list-row-copy mt-1">
                Status fills use the same completed, partial, skipped tone rules as legends.
              </p>
              <div className="mt-4 flex gap-2" aria-hidden="true">
                <span
                  className="hito-comparison-bar h-16 flex-1"
                  data-status="completed"
                  style={
                    {
                      "--hito-comparison-bar-color": workoutTypeColorVar("easy"),
                    } as CSSProperties
                  }
                />
                <span className="hito-comparison-bar h-16 flex-1" data-status="partial" />
                <span className="hito-comparison-bar h-16 flex-1" data-status="skipped" />
                <span className="hito-comparison-bar h-16 flex-1" data-status="planned" />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {["Done", "Partial", "Skipped", "Quiet"].map((label) => (
                  <span key={label} className="hito-chart-note">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hito-row-group mt-5">
          <div className="hito-list-row items-start">
            <div>
              <p className="hito-label">Allowed geometry exceptions</p>
              <p className="hito-list-row-copy">
                Bar height/width, plotted lines, interval block widths, SVG silhouettes, and marker
                coordinates remain visualization geometry. Bar chrome, labels, captions, legends,
                rows, and tooltips use Hito primitives.
              </p>
            </div>
            <span className="hito-caption">Exception</span>
          </div>
        </div>
      </section>
    </>
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
