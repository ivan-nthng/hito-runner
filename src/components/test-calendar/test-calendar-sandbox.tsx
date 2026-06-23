import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HitoCalendarDayCell, HitoWorkoutDayRow } from "@/components/ui/hito-calendar-day";
import { Icon } from "@/components/ui/icon";
import {
  DEFAULT_TEST_CALENDAR_SCENARIO_ID,
  SANDBOX_DAYS,
  TEST_CALENDAR_SCENARIOS,
  TEST_CALENDAR_TODAY_ISO,
  WEEKDAYS,
  getSandboxDayView,
  getTestCalendarScenario,
  providerSummary,
  recommendationSummary,
  resultLabel,
  resultTone,
  structureSummary,
  type SandboxDay,
  type SandboxDayView,
  type TestCalendarScenario,
  type TestCalendarScenarioId,
} from "@/components/test-calendar/test-calendar-sandbox-data";

export function TestCalendarSandbox() {
  const [scenarioId, setScenarioId] = useState<TestCalendarScenarioId>(
    DEFAULT_TEST_CALENDAR_SCENARIO_ID,
  );
  const [selectedIso, setSelectedIso] = useState(SANDBOX_DAYS[15].iso);
  const [dialogOpen, setDialogOpen] = useState(false);
  const scenario = useMemo(() => getTestCalendarScenario(scenarioId), [scenarioId]);
  const selectedDay = useMemo(
    () => SANDBOX_DAYS.find((day) => day.iso === selectedIso) ?? SANDBOX_DAYS[0],
    [selectedIso],
  );
  const selectedView = useMemo(
    () => getSandboxDayView(selectedDay, scenario),
    [scenario, selectedDay],
  );

  const openDay = (day: SandboxDay) => {
    setSelectedIso(day.iso);
    setDialogOpen(true);
  };

  return (
    <main
      data-testid="test-calendar-sandbox"
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <SandboxHeader
          scenario={scenario}
          scenarioId={scenarioId}
          onScenarioChange={setScenarioId}
        />

        <section
          aria-label="Test calendar sandbox"
          className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"
        >
          <div className="min-w-0 overflow-hidden rounded-3xl border border-hairline bg-background/45">
            <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="hito-label text-muted-foreground">Fake June cycle</p>
                <h2 className="hito-panel-title mt-1">Product calendar review surface</h2>
              </div>
              <span
                className="hito-status-pill"
                data-testid="test-calendar-active-scenario"
                data-tone={scenario.statusTone}
              >
                {scenario.statusLabel}
              </span>
            </div>

            <DesktopCalendar selectedIso={selectedIso} scenario={scenario} onOpenDay={openDay} />
            <MobileCalendar selectedIso={selectedIso} scenario={scenario} onOpenDay={openDay} />
          </div>

          <aside className="grid min-w-0 content-start gap-4">
            <DayReviewCard view={selectedView} />
            <BoundaryCard />
          </aside>
        </section>
      </div>

      <DayDetailDialog
        day={selectedDay}
        open={dialogOpen}
        view={selectedView}
        onOpenChange={setDialogOpen}
      />
    </main>
  );
}

function SandboxHeader({
  scenario,
  scenarioId,
  onScenarioChange,
}: {
  scenario: TestCalendarScenario;
  scenarioId: TestCalendarScenarioId;
  onScenarioChange: (scenarioId: TestCalendarScenarioId) => void;
}) {
  return (
    <header className="relative grid min-w-0 gap-6 rounded-3xl border border-hairline bg-foreground/[0.025] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="hito-status-pill" data-tone="signal">
            Sandbox only
          </span>
          <span className="hito-status-pill" data-tone="muted">
            No runtime data
          </span>
        </div>
        <h1 className="hito-page-title mt-5">Test calendar sandbox</h1>
        <p className="hito-body mt-4 max-w-3xl text-muted-foreground">
          A fake product-design review route for the calendar and workout-detail rhythm. It uses
          static fixtures and shared Hito primitives, so design can inspect product flow without
          touching plans, logs, providers, auth, OpenAI, or persistence.
        </p>
        <ScenarioPresetBar scenarioId={scenarioId} onScenarioChange={onScenarioChange} />
      </div>

      <ScenarioMenu
        scenario={scenario}
        scenarioId={scenarioId}
        onScenarioChange={onScenarioChange}
      />
    </header>
  );
}

function ScenarioPresetBar({
  scenarioId,
  onScenarioChange,
}: {
  scenarioId: TestCalendarScenarioId;
  onScenarioChange: (scenarioId: TestCalendarScenarioId) => void;
}) {
  return (
    <div
      aria-label="Scenario presets"
      className="mt-6 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4"
    >
      {TEST_CALENDAR_SCENARIOS.map((scenario) => {
        const selected = scenario.id === scenarioId;
        return (
          <button
            key={scenario.id}
            type="button"
            data-testid={`test-calendar-scenario-${scenario.id}`}
            className={`hito-button hito-button-sm min-w-0 justify-start ${
              selected ? "hito-button-primary" : "hito-button-secondary"
            }`}
            aria-pressed={selected}
            onClick={() => onScenarioChange(scenario.id)}
          >
            <Icon name={selected ? "check-circle" : "calendar"} size="sm" />
            <span className="min-w-0 truncate">{scenario.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScenarioMenu({
  scenario,
  scenarioId,
  onScenarioChange,
}: {
  scenario: TestCalendarScenario;
  scenarioId: TestCalendarScenarioId;
  onScenarioChange: (scenarioId: TestCalendarScenarioId) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="test-calendar-settings"
          className="hito-button hito-button-secondary hito-button-md w-fit justify-self-start lg:justify-self-end"
        >
          <Icon name="settings" size="sm" />
          Scenario
          <Icon name="chevron-down" size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Scenario preset</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={scenarioId}
          onValueChange={(value) => onScenarioChange(getTestCalendarScenario(value).id)}
        >
          {TEST_CALENDAR_SCENARIOS.map((preset) => (
            <DropdownMenuRadioItem key={preset.id} value={preset.id}>
              {preset.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Icon name="activity" size="sm" />
          {scenario.statusLabel}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Icon name="shield-alert" size="sm" />
          Sandbox changes are local only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopCalendar({
  selectedIso,
  scenario,
  onOpenDay,
}: {
  selectedIso: string;
  scenario: TestCalendarScenario;
  onOpenDay: (day: SandboxDay) => void;
}) {
  return (
    <div className="hito-calendar-grid-container hidden min-w-0 lg:block">
      <div className="hito-calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="hito-calendar-grid-heading hito-micro-label">
            {weekday}
          </div>
        ))}
        {SANDBOX_DAYS.map((day) => {
          const selected = day.iso === selectedIso;
          const view = getSandboxDayView(day, scenario);
          return (
            <button
              key={day.iso}
              type="button"
              data-testid={`test-calendar-day-${day.iso}`}
              className="block min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/30"
              aria-label={`${day.weekday}, June ${Number(day.day)}. Open fake detail.`}
              onClick={() => onOpenDay(day)}
            >
              <HitoCalendarDayCell
                {...view.presentation}
                day={day.day}
                interactive
                selected={selected}
                today={day.iso === TEST_CALENDAR_TODAY_ISO}
                weekday={day.weekday}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileCalendar({
  selectedIso,
  scenario,
  onOpenDay,
}: {
  selectedIso: string;
  scenario: TestCalendarScenario;
  onOpenDay: (day: SandboxDay) => void;
}) {
  return (
    <div className="hito-calendar-mobile-list p-4 lg:hidden">
      {SANDBOX_DAYS.map((day) => {
        const view = getSandboxDayView(day, scenario);
        return (
          <button
            key={day.iso}
            type="button"
            data-testid={`test-calendar-row-${day.iso}`}
            className="block min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/25"
            aria-label={`${day.weekday}, June ${Number(day.day)}. Open fake detail.`}
            onClick={() => onOpenDay(day)}
          >
            <HitoWorkoutDayRow
              {...view.presentation}
              date={{ eyebrow: "Jun", day: day.day, meta: day.weekday }}
              interactive
              selected={day.iso === selectedIso}
              today={day.iso === TEST_CALENDAR_TODAY_ISO}
            />
          </button>
        );
      })}
    </div>
  );
}

function DayReviewCard({ view }: { view: SandboxDayView }) {
  const { day } = view;

  return (
    <article
      data-testid="test-calendar-selected-review"
      className="hito-surface-wash grid min-w-0 gap-5"
    >
      <div className="min-w-0">
        <p className="hito-label text-muted-foreground">Selected fake day</p>
        <h2 className="hito-panel-title mt-1">{day.title}</h2>
        <p className="hito-body-small mt-2 text-muted-foreground">
          {day.weekday}, June {Number(day.day)} · {day.summary}
        </p>
        <p className="hito-body-small mt-3 text-muted-foreground">{view.reviewSummary}</p>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2">
        <StatePill label={resultLabel(view.result)} tone={resultTone(view.result)} />
        <StatePill
          label={view.feedback === "feedback_ready" ? "Feedback ready" : "No feedback"}
          tone="muted"
        />
        <StatePill label={view.garmin ? "Garmin attached" : "Provider detached"} tone="muted" />
      </div>
      <div className="hito-row-group border-0">
        <ReviewRow icon="activity" label="Structure" body={structureSummary(day)} />
        <ReviewRow icon="watch" label="Evidence" body={providerSummary(view)} />
        <ReviewRow icon="sparkles" label="Recommendation" body={recommendationSummary(view)} />
      </div>
    </article>
  );
}

function BoundaryCard() {
  return (
    <article className="rounded-3xl border border-hairline bg-background/35 p-5">
      <p className="hito-label text-muted-foreground">Boundary</p>
      <h2 className="hito-panel-title mt-1">Fake product-flow sandbox</h2>
      <p className="hito-body-small mt-3 text-muted-foreground">
        This route is intentionally not canonical DS documentation and not product runtime. It is a
        static review environment for product/design decisions after `/hitoDS` has proved the shared
        primitives.
      </p>
    </article>
  );
}

function DayDetailDialog({
  day,
  open,
  view,
  onOpenChange,
}: {
  day: SandboxDay;
  open: boolean;
  view: SandboxDayView;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="test-calendar-detail-dialog"
        className="hito-product-dialog hito-dialog-surface-product hito-dialog-size-workflow hito-dialog-height-wide"
      >
        <DialogHeader className="hito-product-dialog-header">
          <div className="min-w-0 pr-8">
            <p className="hito-label hito-label-signal">Fake workout detail</p>
            <DialogTitle className="hito-modal-title mt-2">{day.title}</DialogTitle>
            <DialogDescription className="hito-body mt-2 max-w-2xl">
              {day.weekday}, June {Number(day.day)} · static product-design review content.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="hito-product-dialog-body-scroll-fill grid gap-5">
          <section className="grid min-w-0 gap-3 sm:grid-cols-3">
            <MetricCard label="Result" value={resultLabel(view.result)} />
            <MetricCard label="Evidence" value={view.fit ? "FIT uploaded" : "No FIT file"} />
            <MetricCard
              label="Provider"
              value={view.garmin ? "Garmin attached" : "Provider detached"}
            />
          </section>

          <section className="rounded-2xl border border-hairline bg-background/35 p-4">
            <p className="hito-label text-muted-foreground">Scenario readback</p>
            <p className="hito-body-small mt-2 text-muted-foreground">{view.detailSummary}</p>
          </section>

          <section className="grid min-w-0 gap-3">
            <div>
              <p className="hito-label text-muted-foreground">Workout structure</p>
              <p className="hito-body-small mt-1 text-muted-foreground">
                Fake executable anatomy for review only. No schedule or metric truth is created
                here.
              </p>
            </div>
            <div className="hito-row-group">
              {day.kind === "rest" ? (
                <ReviewRow icon="calendar" label="Rest day" body="Keep the day open and calm." />
              ) : (
                day.segments.map((segment) => (
                  <ReviewRow
                    key={segment.label}
                    icon="activity"
                    label={segment.label}
                    body={`${segment.body} · ${segment.meta}`}
                  />
                ))
              )}
            </div>
          </section>

          <section className="grid min-w-0 gap-3">
            <p className="hito-label text-muted-foreground">Provider and feedback states</p>
            <div className="hito-row-group">
              <ReviewRow
                icon="file-up"
                label="FIT file"
                body={view.fit ? "Uploaded" : "Not uploaded"}
              />
              <ReviewRow
                icon="watch"
                label="Garmin"
                body={view.garmin ? "Attached to this fake detail" : "Not attached"}
              />
              <ReviewRow
                icon="connections"
                label="Strava"
                body={view.strava ? "Future specimen visible" : "Hidden as future-only"}
              />
              <ReviewRow
                icon="check-circle"
                label="Comparison"
                body={
                  view.comparison
                    ? "Fake plan-vs-run comparison is visible"
                    : "Comparison panel hidden"
                }
              />
            </div>
          </section>

          {view.recommendation && view.recommendationCopy ? (
            <section className="rounded-2xl border border-hairline bg-signal/[0.055] p-4">
              <p className="hito-label hito-label-signal">Static recommendation</p>
              <p className="hito-body-small mt-2 text-muted-foreground">
                {view.recommendationCopy}
              </p>
            </section>
          ) : null}
        </div>

        <DialogFooter className="hito-product-dialog-footer sm:space-x-0">
          <p className="hito-caption min-w-0 flex-1">
            Closing this dialog only changes local sandbox UI state.
          </p>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-md"
            onClick={() => onOpenChange(false)}
          >
            Close review
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({
  body,
  icon,
  label,
}: {
  body: string;
  icon: "activity" | "calendar" | "check-circle" | "connections" | "file-up" | "sparkles" | "watch";
  label: string;
}) {
  return (
    <div className="hito-list-row">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.055] text-muted-foreground">
        <Icon name={icon} size="sm" />
      </span>
      <div className="min-w-0">
        <p className="hito-list-row-title">{label}</p>
        <p className="hito-list-row-copy">{body}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-background/35 p-4">
      <p className="hito-label text-muted-foreground">{label}</p>
      <p className="hito-panel-title mt-2 text-base">{value}</p>
    </div>
  );
}

function StatePill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "destructive" | "muted";
}) {
  return (
    <span className="hito-status-pill" data-tone={tone}>
      {label}
    </span>
  );
}
