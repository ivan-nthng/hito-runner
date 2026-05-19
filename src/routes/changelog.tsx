import { useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import changelogMarkdown from "../../docs/history/changelog.md?raw";

interface ChangelogDay {
  date: string;
  entries: string[];
}

interface ChangelogMonth {
  key: string;
  year: string;
  label: string;
  days: ChangelogDay[];
}

interface ChangelogYear<TMonth> {
  year: string;
  months: TMonth[];
}

type ChangelogEntryKind = "milestone" | "update";

interface ChangelogEntryPresentation {
  kind: ChangelogEntryKind;
  title: string | null;
}

type ChangelogTab = "highlights" | "technical";
type HighlightBadge = "New" | "Improved" | "Fixed" | "Cleanup" | "Behind the scenes";

interface ChangelogHighlight {
  badge: HighlightBadge;
  title: string;
  body: string;
  sourceEntry: string | null;
  isFallback: boolean;
  category?: HighlightCategory;
}

interface ChangelogHighlightDay {
  date: string;
  highlights: ChangelogHighlight[];
}

interface ChangelogHighlightMonth {
  key: string;
  year: string;
  label: string;
  days: ChangelogHighlightDay[];
}

type HighlightCategory =
  | "voice"
  | "onboarding"
  | "entitlement"
  | "garmin"
  | "auth"
  | "calendar"
  | "design_system"
  | "plan_management"
  | "imports"
  | "exports"
  | "settings"
  | "progress"
  | "body_notes"
  | "changelog";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: `Hito changelog — ${APP_NAME}` },
      {
        name: "description",
        content: "Highlights and full release notes for Hito.",
      },
    ],
  }),
  component: ChangelogPage,
});

const changelogDays = parseChangelog(changelogMarkdown);
const changelogMonths = groupChangelogByMonth(changelogDays);
const changelogYears = groupMonthsByYear(changelogMonths);
const changelogHighlightMonths = getHighlightMonths(changelogDays);
const changelogHighlightYears = groupMonthsByYear(changelogHighlightMonths);
const latestChangelogDate = changelogDays[0]?.date ?? null;

function ChangelogPage() {
  const [activeTab, setActiveTab] = useState<ChangelogTab>("highlights");
  const entryCount = changelogMonths.reduce(
    (total, month) =>
      total + month.days.reduce((monthTotal, day) => monthTotal + day.entries.length, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header className="flex flex-col gap-8 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/"
              className="hito-micro-label inline-flex text-muted-foreground transition-colors hover:text-foreground"
            >
              Hito
            </Link>
            <h1 className="hito-page-title mt-5">Hito changelog</h1>
            <p className="hito-body mt-4 max-w-2xl text-muted-foreground">
              {activeTab === "highlights"
                ? "Big updates, in plain language."
                : "The complete shipped history, with the technical detail left in."}
            </p>
            <p className="hito-body-small mt-3 text-foreground/78">
              {activeTab === "highlights"
                ? `${formatEntryCount(entryCount)} so far. This view pulls out the biggest ones.`
                : `${formatEntryCount(entryCount)} in the full technical log.`}
            </p>
          </div>
          <div className="grid gap-1 text-left md:justify-items-end md:text-right">
            <p className="hito-micro-label">Last updated</p>
            <p className="hito-body-small text-muted-foreground">
              {latestChangelogDate ? formatFullDate(latestChangelogDate) : "No updates yet"}
            </p>
          </div>
        </header>

        <section className="grid gap-9" aria-label="Changelog views">
          <div className="hito-tabs hito-tabs-simple" role="tablist" aria-label="Changelog view">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "highlights"}
              className="hito-tab"
              onClick={() => setActiveTab("highlights")}
            >
              Highlights
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "technical"}
              className="hito-tab"
              onClick={() => setActiveTab("technical")}
            >
              Technical log
            </button>
          </div>

          {activeTab === "highlights" ? (
            <HighlightsTimeline years={changelogHighlightYears} />
          ) : (
            <TechnicalTimeline years={changelogYears} />
          )}
        </section>
      </div>
    </main>
  );
}

function HighlightsTimeline({ years }: { years: Array<ChangelogYear<ChangelogHighlightMonth>> }) {
  if (years.length === 0) {
    return <EmptyChangelogState />;
  }

  return (
    <div className="grid gap-24">
      {years.map((year) => (
        <YearSection
          key={`highlights-${year.year}`}
          year={year.year}
          labelId={`changelog-highlights-${year.year}`}
        >
          {year.months.map((month) => (
            <MonthSection
              key={month.key}
              month={month}
              labelId={`changelog-highlights-${month.key}`}
            >
              {month.days.map((day) => (
                <HighlightDaySection key={day.date} day={day} />
              ))}
            </MonthSection>
          ))}
        </YearSection>
      ))}
    </div>
  );
}

function TechnicalTimeline({ years }: { years: Array<ChangelogYear<ChangelogMonth>> }) {
  if (years.length === 0) {
    return <EmptyChangelogState />;
  }

  return (
    <div className="grid gap-24">
      {years.map((year) => (
        <YearSection key={year.year} year={year.year} labelId={`changelog-${year.year}`}>
          {year.months.map((month) => (
            <MonthSection key={month.key} month={month} labelId={`changelog-${month.key}`}>
              {month.days.map((day) => (
                <DaySection key={day.date} day={day} />
              ))}
            </MonthSection>
          ))}
        </YearSection>
      ))}
    </div>
  );
}

function YearSection({
  year,
  labelId,
  children,
}: {
  year: string;
  labelId: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelId}
      className="grid gap-6 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-6 lg:grid-cols-[5.25rem_minmax(0,1fr)] lg:gap-8"
    >
      <div className="md:relative">
        <h2
          id={labelId}
          className="font-serif text-[clamp(1.45rem,2vw,1.9rem)] leading-[1.05] tracking-[-0.035em] text-foreground/78 md:sticky md:top-8"
        >
          {year}
        </h2>
      </div>

      <div className="grid gap-16">{children}</div>
    </section>
  );
}

function MonthSection({
  month,
  labelId,
  children,
}: {
  month: ChangelogMonth | ChangelogHighlightMonth;
  labelId: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelId}
      className="grid gap-4 md:grid-cols-[4.75rem_minmax(0,1fr)] md:gap-5 lg:grid-cols-[5.25rem_minmax(0,1fr)] lg:gap-6"
    >
      <div className="md:relative">
        <h3
          id={labelId}
          className="font-serif text-[clamp(1.45rem,2vw,1.9rem)] leading-[1.05] tracking-[-0.035em] text-foreground md:sticky md:top-8"
        >
          {month.label}
        </h3>
      </div>

      <div className="grid gap-12">{children}</div>
    </section>
  );
}

function DaySection({ day }: { day: ChangelogDay }) {
  return (
    <section
      aria-labelledby={`changelog-${day.date}`}
      className="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[3.75rem_minmax(0,1fr)] lg:gap-6"
    >
      <time
        id={`changelog-${day.date}`}
        dateTime={day.date}
        aria-label={formatFullDate(day.date)}
        className="font-serif text-[clamp(1.45rem,2vw,1.9rem)] leading-[1.05] tracking-[-0.035em] text-foreground sm:sticky sm:top-8 sm:self-start"
      >
        {formatDayLabel(day.date)}
      </time>

      <div className="grid gap-4">
        {day.entries.map((entry, index) => (
          <ChangelogEntry
            key={`${day.date}-${index}`}
            entry={entry}
            presentation={getEntryPresentation(entry)}
          />
        ))}
      </div>
    </section>
  );
}

function HighlightDaySection({ day }: { day: ChangelogHighlightDay }) {
  return (
    <section
      aria-labelledby={`changelog-highlights-${day.date}`}
      className="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[3.75rem_minmax(0,1fr)] lg:gap-6"
    >
      <time
        id={`changelog-highlights-${day.date}`}
        dateTime={day.date}
        aria-label={formatFullDate(day.date)}
        className="font-serif text-[clamp(1.45rem,2vw,1.9rem)] leading-[1.05] tracking-[-0.035em] text-foreground sm:sticky sm:top-8 sm:self-start"
      >
        {formatDayLabel(day.date)}
      </time>

      <div className="grid gap-4">
        {day.highlights.map((highlight, index) => (
          <HighlightEntry key={`${day.date}-${index}`} highlight={highlight} />
        ))}
      </div>
    </section>
  );
}

function ChangelogEntry({
  entry,
  presentation,
}: {
  entry: string;
  presentation: ChangelogEntryPresentation;
}) {
  const isMilestone = presentation.kind === "milestone";

  return (
    <article
      className={
        isMilestone
          ? "rounded-2xl bg-signal/[0.085] px-4 py-4 shadow-[0_18px_70px_color-mix(in_oklch,var(--color-signal)_9%,transparent)] sm:px-5"
          : "rounded-2xl bg-foreground/[0.035] px-4 py-4 sm:px-5"
      }
      data-entry-kind={presentation.kind}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={
            isMilestone
              ? "mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full bg-signal shadow-[0_0_24px_color-mix(in_oklch,var(--color-signal)_65%,transparent)]"
              : "mt-[0.5rem] h-2 w-2 shrink-0 rounded-full bg-foreground/24"
          }
        />
        <div className="min-w-0">
          {presentation.title ? (
            <h3
              className={
                isMilestone
                  ? "hito-panel-title text-[1.15rem] text-foreground"
                  : "hito-body-small font-medium text-foreground/86"
              }
            >
              {presentation.title}
            </h3>
          ) : null}
          <p
            className={
              presentation.title
                ? "hito-body-small mt-2 leading-relaxed text-muted-foreground"
                : "hito-body-small leading-relaxed text-foreground/84"
            }
          >
            <InlineMarkdown text={entry} />
          </p>
        </div>
      </div>
    </article>
  );
}

function HighlightEntry({ highlight }: { highlight: ChangelogHighlight }) {
  return (
    <article
      className={
        highlight.isFallback
          ? "rounded-2xl bg-foreground/[0.026] px-4 py-4 sm:px-5"
          : "rounded-2xl bg-signal/[0.07] px-4 py-4 shadow-[0_18px_70px_color-mix(in_oklch,var(--color-signal)_7%,transparent)] sm:px-5"
      }
      data-highlight-kind={highlight.badge.toLowerCase().replaceAll(" ", "-")}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={
            highlight.isFallback
              ? "mt-[0.5rem] h-2 w-2 shrink-0 rounded-full bg-foreground/20"
              : "mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full bg-signal shadow-[0_0_24px_color-mix(in_oklch,var(--color-signal)_55%,transparent)]"
          }
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                highlight.isFallback
                  ? "hito-status whitespace-nowrap bg-foreground/[0.05] text-muted-foreground"
                  : "hito-status whitespace-nowrap bg-signal/[0.13] text-signal"
              }
            >
              {highlight.badge}
            </span>
            <h3 className="hito-panel-title text-[1.1rem] text-foreground">{highlight.title}</h3>
          </div>
          <p className="hito-body-small mt-2 leading-relaxed text-muted-foreground">
            <InlineMarkdown text={highlight.body} />
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyChangelogState() {
  return (
    <section className="rounded-2xl bg-foreground/[0.035] px-5 py-6">
      <h2 className="hito-panel-title">No shipped changes yet</h2>
      <p className="hito-body-small mt-2 text-muted-foreground">
        This page will fill up once dated product updates start shipping.
      </p>
    </section>
  );
}

function parseChangelog(markdown: string): ChangelogDay[] {
  const sections: ChangelogDay[] = [];
  let current: ChangelogDay | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const dateMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s*$/);

    if (dateMatch) {
      current = { date: dateMatch[1], entries: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    const entryMatch = line.match(/^-\s+(.+)$/);

    if (entryMatch) {
      current.entries.push(entryMatch[1].trim());
    }
  }

  return sections
    .filter((section) => section.entries.length > 0)
    .sort((left, right) => right.date.localeCompare(left.date));
}

function getHighlightMonths(days: ChangelogDay[]): ChangelogHighlightMonth[] {
  const highlightDays = days.map((day) => ({
    date: day.date,
    highlights: getHighlightsForDay(day),
  }));

  const monthMap = new Map<string, ChangelogHighlightDay[]>();

  for (const day of highlightDays) {
    const key = day.date.slice(0, 7);
    const monthDays = monthMap.get(key) ?? [];
    monthDays.push(day);
    monthMap.set(key, monthDays);
  }

  return Array.from(monthMap.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, monthDays]) => ({
      key,
      year: formatYearLabel(key),
      label: formatMonthLabel(key),
      days: monthDays.sort((left, right) => right.date.localeCompare(left.date)),
    }));
}

function getHighlightsForDay(day: ChangelogDay): ChangelogHighlight[] {
  const seenCategories = new Set<string>();

  const highlights = day.entries
    .map(getHighlightPresentation)
    .filter((highlight): highlight is ChangelogHighlight => highlight !== null)
    .filter((highlight) => {
      const key = highlight.category ?? `${highlight.badge}:${highlight.title}`;
      if (seenCategories.has(key)) {
        return false;
      }

      seenCategories.add(key);
      return true;
    })
    .slice(0, 3);

  if (highlights.length > 0) {
    return highlights;
  }

  return [
    {
      badge: "Behind the scenes",
      title: "Implementation updates",
      body: `${day.entries.length} implementation ${
        day.entries.length === 1 ? "update shipped" : "updates shipped"
      } on ${formatFullDate(day.date)}. See Technical log for the full source entry.`,
      sourceEntry: null,
      isFallback: true,
    },
  ];
}

function getHighlightPresentation(entry: string): ChangelogHighlight | null {
  const badge = getHighlightBadge(entry);

  if (!badge || !isHighlightEntry(entry)) {
    return null;
  }

  return {
    badge,
    title: getHighlightTitle(entry),
    body: getHighlightBody(entry),
    sourceEntry: entry,
    isFallback: false,
    category: getHighlightCategory(entry),
  };
}

function getHighlightBadge(entry: string): HighlightBadge | null {
  if (/^(added|created|introduced|launched)\b/i.test(entry) || /\bnew\b/i.test(entry)) {
    return "New";
  }

  if (/^(fixed|resolved|corrected|prevented|repaired)\b/i.test(entry)) {
    return "Fixed";
  }

  if (/^(removed|deleted|simplified|refactored|collapsed)\b/i.test(entry)) {
    return "Cleanup";
  }

  if (/^(improved|updated|refined|normalized|reworked|tightened|hardened|aligned)\b/i.test(entry)) {
    return "Improved";
  }

  return null;
}

function isHighlightEntry(entry: string) {
  return getHighlightCategory(entry) !== null;
}

function hasDesignSystemSignal(normalizedEntry: string) {
  return (
    normalizedEntry.includes("/hitods") ||
    normalizedEntry.includes("hito ds") ||
    normalizedEntry.includes("design-system") ||
    normalizedEntry.includes("design system") ||
    normalizedEntry.includes("icon system") ||
    normalizedEntry.includes("typography contract") ||
    normalizedEntry.includes("typography slice") ||
    normalizedEntry.includes("field contract") ||
    normalizedEntry.includes("button variant") ||
    normalizedEntry.includes("toast pattern") ||
    normalizedEntry.includes("toast variant") ||
    normalizedEntry.includes("modal anatomy") ||
    normalizedEntry.includes("role classes") ||
    normalizedEntry.includes("shared interface patterns") ||
    normalizedEntry.includes("shared hito")
  );
}

function getDesignSystemSurfaceCount(normalizedEntry: string) {
  return [
    normalizedEntry.includes("open plan"),
    normalizedEntry.includes("json import"),
    normalizedEntry.includes("log result"),
    normalizedEntry.includes("feedback"),
    normalizedEntry.includes("body-note"),
    normalizedEntry.includes("user settings"),
    normalizedEntry.includes("/settings"),
    normalizedEntry.includes("calendar"),
    normalizedEntry.includes("home"),
  ].filter(Boolean).length;
}

function getHighlightCategory(entry: string): HighlightCategory | null {
  const normalized = entry.toLowerCase();
  const actionMatches =
    /^(added|created|implemented|introduced|shipped|launched|fixed|resolved|corrected|prevented|repaired|improved|updated|refined|normalized|reworked|tightened|hardened|aligned|simplified|replaced|polished)\b/i.test(
      entry,
    );

  if (!actionMatches && !isMilestoneEntry(entry)) {
    return null;
  }

  if (normalized.includes("voice") || normalized.includes("dictate")) {
    return "voice";
  }

  if (normalized.includes("structured") && normalized.includes("onboarding")) {
    return "onboarding";
  }

  if (normalized.includes("onboarding")) {
    return "onboarding";
  }

  if (normalized.includes("entitlement")) {
    return "entitlement";
  }

  if (hasDesignSystemSignal(normalized) && getDesignSystemSurfaceCount(normalized) > 1) {
    return "design_system";
  }

  if (
    normalized.includes("workout ai recommendation") ||
    normalized.includes("workout feedback") ||
    normalized.includes("garmin") ||
    normalized.includes("comparison") ||
    normalized.includes("upload result") ||
    normalized.includes("upload-result")
  ) {
    return "garmin";
  }

  if (
    normalized.includes("open plan") ||
    normalized.includes("plan update") ||
    normalized.includes("apply update") ||
    normalized.includes("clear upcoming schedule") ||
    normalized.includes("delete-plan") ||
    normalized.includes("update plan") ||
    normalized.includes("refresh apply")
  ) {
    return "plan_management";
  }

  if (
    normalized.includes("json import") ||
    normalized.includes("upload json") ||
    normalized.includes("advanced import") ||
    normalized.includes("download template") ||
    normalized.includes("training-plan-v2") ||
    normalized.includes("import flow") ||
    normalized.includes("import contract")
  ) {
    return "imports";
  }

  if (normalized.includes("export")) {
    return "exports";
  }

  if (
    normalized.includes("/settings") ||
    normalized.includes("user settings") ||
    normalized.includes("saved email") ||
    normalized.includes("profile trigger") ||
    normalized.includes("profile inputs")
  ) {
    return "settings";
  }

  if (normalized.includes("/progress") || normalized.includes("progress")) {
    return "progress";
  }

  if (normalized.includes("body-note") || normalized.includes("body notes")) {
    return "body_notes";
  }

  if (
    normalized.includes("/calendar") ||
    normalized.includes("calendar-cell") ||
    normalized.includes("month-cell") ||
    normalized.includes("calendar controls") ||
    normalized.includes("home surface") ||
    normalized.includes("today hero") ||
    normalized.includes("home and calendar")
  ) {
    return "calendar";
  }

  if (normalized.includes("changelog")) {
    return "changelog";
  }

  if (isAuthEntry(normalized)) {
    return "auth";
  }

  if (hasDesignSystemSignal(normalized)) {
    return "design_system";
  }

  return null;
}

function getHighlightTitle(entry: string) {
  switch (getHighlightCategory(entry)) {
    case "voice":
      return "Dictate-to-Plan";
    case "onboarding":
      return "Plan creation";
    case "entitlement":
      return "Pro access";
    case "garmin":
      return "Workout feedback";
    case "auth":
      return "Sign-in flow";
    case "calendar":
      return "Home & calendar";
    case "design_system":
      return "Design system";
    case "plan_management":
      return "Plan management";
    case "imports":
      return "Plan import";
    case "exports":
      return "Plan export";
    case "settings":
      return "Settings & profile";
    case "progress":
      return "Progress";
    case "body_notes":
      return "Body notes";
    case "changelog":
      return "Changelog";
    default:
      return getMilestoneTitle(entry);
  }
}

function getHighlightBody(entry: string) {
  switch (getHighlightCategory(entry)) {
    case "voice":
      return "You can describe your running in natural language, review what Hito understood, and create a plan only after confirmation.";
    case "onboarding":
      return "The first-plan flow is clearer and easier to complete step by step.";
    case "entitlement":
      return "Pro-only capabilities are now explained and gated more clearly.";
    case "garmin":
      return "Workout feedback is clearer, more grounded in your run, and easier to review.";
    case "auth":
      return "Signing in and getting back to your plan is more reliable and easier to follow.";
    case "calendar":
      return "Home and calendar are clearer, calmer, and easier to scan.";
    case "design_system":
      return "Shared interface patterns were cleaned up so the product feels more consistent and easier to read.";
    case "plan_management":
      return "Creating, replacing, clearing, and updating plans is clearer and safer.";
    case "imports":
      return "Importing an existing plan is clearer and safer.";
    case "exports":
      return "Exporting a saved plan is easier and more reliable.";
    case "settings":
      return "Settings and profile flows are clearer and more stable.";
    case "progress":
      return "Progress surfaces are clearer about what they show and easier to read.";
    case "body_notes":
      return "Body-note flows are easier to use and fit the rest of the product more naturally.";
    case "changelog":
      return "This page is easier to scan without losing the full technical history.";
    default:
      return entry;
  }
}

function isAuthEntry(normalizedEntry: string) {
  return (
    /\bauth\b/.test(normalizedEntry) ||
    /\bauthenticated\b/.test(normalizedEntry) ||
    /\blogin\b/.test(normalizedEntry) ||
    normalizedEntry.includes("sign-in") ||
    normalizedEntry.includes("magic link")
  );
}

function groupChangelogByMonth(days: ChangelogDay[]): ChangelogMonth[] {
  const monthMap = new Map<string, ChangelogDay[]>();

  for (const day of days) {
    const key = day.date.slice(0, 7);
    const monthDays = monthMap.get(key) ?? [];
    monthDays.push(day);
    monthMap.set(key, monthDays);
  }

  return Array.from(monthMap.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, monthDays]) => ({
      key,
      year: formatYearLabel(key),
      label: formatMonthLabel(key),
      days: monthDays.sort((left, right) => right.date.localeCompare(left.date)),
    }));
}

function groupMonthsByYear<TMonth extends { year: string }>(
  months: TMonth[],
): Array<ChangelogYear<TMonth>> {
  const yearMap = new Map<string, TMonth[]>();

  for (const month of months) {
    const yearMonths = yearMap.get(month.year) ?? [];
    yearMonths.push(month);
    yearMap.set(month.year, yearMonths);
  }

  return Array.from(yearMap.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, yearMonths]) => ({
      year,
      months: yearMonths,
    }));
}

function formatYearLabel(monthKey: string) {
  const [year] = monthKey.split("-");
  return year;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDayLabel(date: string) {
  const [, , day] = date.split("-");
  return day;
}

function formatFullDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatEntryCount(count: number) {
  return `${count} shipped ${count === 1 ? "change" : "changes"}`;
}

function getEntryPresentation(entry: string): ChangelogEntryPresentation {
  if (!isMilestoneEntry(entry)) {
    return { kind: "update", title: null };
  }

  return { kind: "milestone", title: getMilestoneTitle(entry) };
}

function isMilestoneEntry(entry: string) {
  const normalized = entry.toLowerCase();
  const actionMatches = /^(added|created|implemented|introduced|shipped|launched)\b/i.test(entry);
  const featureMatches = [
    "onboarding",
    "voice",
    "entitlement",
    "garmin",
    "design-system",
    "design system",
    "icon system",
    "structured",
    "changelog",
    "calendar",
    "new ",
  ].some((phrase) => normalized.includes(phrase));

  return actionMatches && featureMatches;
}

function getMilestoneTitle(entry: string) {
  const normalized = entry.toLowerCase();

  if (normalized.includes("voice") || normalized.includes("dictate")) {
    return "Dictate-to-Plan";
  }

  if (normalized.includes("structured") && normalized.includes("onboarding")) {
    return "Plan creation";
  }

  if (normalized.includes("entitlement")) {
    return "Pro access foundation";
  }

  if (normalized.includes("garmin")) {
    return "Garmin integration";
  }

  if (
    normalized.includes("design-system") ||
    normalized.includes("design system") ||
    normalized.includes("icon system") ||
    normalized.includes("typography") ||
    normalized.includes("button") ||
    normalized.includes("input") ||
    normalized.includes("toast") ||
    normalized.includes("modal")
  ) {
    return "Design system update";
  }

  if (normalized.includes("calendar")) {
    return "Home & calendar";
  }

  if (normalized.includes("changelog")) {
    return "Changelog";
  }

  const derived = entry
    .replace(/^(Added|Created|Implemented|Introduced|Shipped|Launched)\s+(the\s+)?/i, "")
    .split(/[:;,]/)[0]
    .trim();

  if (!derived || derived.length > 64) {
    return "Product update";
  }

  return sentenceCase(derived);
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={index}
            className="rounded bg-foreground/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
