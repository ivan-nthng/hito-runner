import { useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import { useHitoTabs } from "@/components/ui/hito-tabs";
import {
  formatDayLabel,
  formatEntryCount,
  formatFullDate,
  getChangelogEntryCount,
  getEntryPresentation,
  getHighlightMonths,
  getLatestChangelogDate,
  getTechnicalLogEntryCount,
  getTechnicalLogLastUpdated,
  groupChangelogByMonth,
  groupTechnicalLogByMonth,
  groupMonthsByYear,
  parseChangelog,
  parseTechnicalLog,
  type ChangelogEntryPresentation,
  type ChangelogHighlight,
  type ChangelogHighlightDay,
  type ChangelogHighlightMonth,
  type ChangelogMonth,
  type ChangelogYear,
  type TechnicalLogMonth,
  type TechnicalLogSection,
} from "@/lib/changelog-utils";
import changelogMarkdown from "../../docs/history/changelog.md?raw";
import technicalLogMarkdown from "../../docs/history/technical-log.md?raw";

type ChangelogTab = "highlights" | "technical";

const CHANGELOG_TABS = [{ value: "highlights" }, { value: "technical" }] satisfies Array<{
  value: ChangelogTab;
}>;

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: `Hito changelog — ${APP_NAME}` },
      {
        name: "description",
        content: "Curated highlights and the full technical log for Hito.",
      },
    ],
  }),
  component: ChangelogPage,
});

const publicChangelogDays = parseChangelog(changelogMarkdown);
const publicChangelogMonths = groupChangelogByMonth(publicChangelogDays);
const changelogHighlightMonths = getHighlightMonths(publicChangelogDays);
const changelogHighlightYears = groupMonthsByYear(changelogHighlightMonths);

const technicalLogSections = parseTechnicalLog(technicalLogMarkdown);
const technicalLogMonths = groupTechnicalLogByMonth(technicalLogSections);
const technicalLogYears = groupMonthsByYear(technicalLogMonths);
const technicalLogLastUpdated = getTechnicalLogLastUpdated(technicalLogMarkdown);

function ChangelogPage() {
  const [activeTab, setActiveTab] = useState<ChangelogTab>("highlights");
  const changelogTabs = useHitoTabs({ items: CHANGELOG_TABS, value: activeTab });
  const isHighlightsTab = activeTab === "highlights";
  const entryCount = isHighlightsTab
    ? getChangelogEntryCount(publicChangelogMonths)
    : getTechnicalLogEntryCount(technicalLogSections);
  const entryCountLabel = isHighlightsTab
    ? formatEntryCount(entryCount)
    : `${entryCount} durable ${entryCount === 1 ? "decision" : "decisions"}`;
  const lastUpdatedLabel = isHighlightsTab
    ? (() => {
        const latestVisibleDate = getLatestChangelogDate(publicChangelogDays);
        return latestVisibleDate ? formatFullDate(latestVisibleDate) : "No updates yet";
      })()
    : technicalLogLastUpdated
      ? formatFullDate(technicalLogLastUpdated)
      : "No updates yet";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header className="flex flex-col gap-8 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/"
              className="hito-label-sm inline-flex text-muted-foreground transition-colors hover:text-foreground"
            >
              Hito
            </Link>
            <h1 className="hito-display-title-lg mt-5">Hito changelog</h1>
            <p className="hito-body-md mt-4 max-w-2xl text-muted-foreground">
              {isHighlightsTab
                ? "Big updates, in plain language."
                : "A compact index of durable product, architecture, and reliability decisions."}
            </p>
            <p className="hito-body-sm mt-3 text-foreground/78">
              {isHighlightsTab
                ? `${entryCountLabel} so far from the curated public source.`
                : `${entryCountLabel} in the compact technical index.`}
            </p>
          </div>
          <div className="grid gap-1 text-left md:justify-items-end md:text-right">
            <p className="hito-label-sm">Last updated</p>
            <p className="hito-body-sm text-muted-foreground">{lastUpdatedLabel}</p>
          </div>
        </header>

        <section className="grid gap-9" aria-label="Changelog views">
          <div
            className="hito-tabs hito-tabs-simple"
            {...changelogTabs.tabListProps}
            aria-label="Changelog view"
          >
            <button
              type="button"
              {...changelogTabs.getTabProps("highlights")}
              className="hito-tab"
              onClick={() => setActiveTab("highlights")}
            >
              Highlights
            </button>
            <button
              type="button"
              {...changelogTabs.getTabProps("technical")}
              className="hito-tab"
              onClick={() => setActiveTab("technical")}
            >
              Technical log
            </button>
          </div>

          {activeTab === "highlights" ? (
            <div {...changelogTabs.getPanelProps("highlights")}>
              <HighlightsTimeline years={changelogHighlightYears} />
            </div>
          ) : (
            <div {...changelogTabs.getPanelProps("technical")}>
              <TechnicalTimeline years={technicalLogYears} />
            </div>
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

function TechnicalTimeline({ years }: { years: Array<ChangelogYear<TechnicalLogMonth>> }) {
  if (years.length === 0) {
    return <EmptyChangelogState />;
  }

  return (
    <div className="grid gap-24">
      {years.map((year) => (
        <YearSection key={year.year} year={year.year} labelId={`changelog-${year.year}`}>
          {year.months.map((month) => (
            <MonthSection key={month.key} month={month} labelId={`changelog-${month.key}`}>
              {month.sections.map((section) => (
                <TechnicalLogSectionView
                  key={`${section.period.source}-${section.title ?? "untitled"}`}
                  section={section}
                />
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
        <h2 id={labelId} className="hito-timeline-year md:sticky md:top-8">
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
        <h3 id={labelId} className="hito-timeline-month md:sticky md:top-8">
          {month.label}
        </h3>
      </div>

      <div className="grid gap-12">{children}</div>
    </section>
  );
}

function TechnicalLogSectionView({ section }: { section: TechnicalLogSection }) {
  const labelId = `changelog-${section.period.source}`;

  return (
    <section
      aria-labelledby={labelId}
      className="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[3.75rem_minmax(0,1fr)] lg:gap-6"
    >
      {section.period.kind === "day" ? (
        <TimelineDayGutter id={labelId} date={section.period.start} />
      ) : (
        <p id={labelId} className="hito-timeline-day sm:sticky sm:top-8 sm:self-start">
          {section.period.source}
        </p>
      )}

      <div className="grid gap-4">
        {section.title ? (
          <h3 className="hito-ui-title-xs text-foreground">{section.title}</h3>
        ) : null}
        {section.entries.map((entry, index) => (
          <ChangelogEntry
            key={`${section.period.source}-${index}`}
            entry={entry}
            presentation={getEntryPresentation(entry)}
          />
        ))}
      </div>
    </section>
  );
}

function HighlightDaySection({ day }: { day: ChangelogHighlightDay }) {
  const labelId = `changelog-highlights-${day.date}`;

  return (
    <section
      aria-labelledby={labelId}
      className="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[3.75rem_minmax(0,1fr)] lg:gap-6"
    >
      <TimelineDayGutter id={labelId} date={day.date} />

      <div className="grid gap-4">
        {day.highlights.map((highlight, index) => (
          <HighlightEntry key={`${day.date}-${index}`} highlight={highlight} />
        ))}
      </div>
    </section>
  );
}

function TimelineDayGutter({ id, date }: { id: string; date: string }) {
  return (
    <time
      id={id}
      dateTime={date}
      aria-label={formatFullDate(date)}
      className="hito-timeline-day sm:sticky sm:top-8 sm:self-start"
    >
      {formatDayLabel(date)}
    </time>
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
      className="hito-editorial-backdrop hito-timeline-entry"
      data-entry-kind={presentation.kind}
      data-tone={isMilestone ? "signal" : "neutral"}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="hito-timeline-entry-dot"
          data-tone={isMilestone ? "signal" : "neutral"}
        />
        <div className="min-w-0">
          {presentation.title ? (
            <h3
              className={
                isMilestone
                  ? "hito-ui-title-xs text-foreground"
                  : "hito-body-sm font-medium text-foreground/86"
              }
            >
              {presentation.title}
            </h3>
          ) : null}
          <p
            className={
              presentation.title
                ? "hito-body-sm mt-2 text-muted-foreground"
                : "hito-body-sm text-foreground/84"
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
      className="hito-editorial-backdrop hito-timeline-entry"
      data-highlight-kind={highlight.badge.toLowerCase().replaceAll(" ", "-")}
      data-tone={highlight.isFallback ? "quiet" : "highlight"}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="hito-timeline-entry-dot"
          data-tone={highlight.isFallback ? "quiet" : "highlight"}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="hito-highlight-tag"
              data-tone={highlight.isFallback ? "neutral" : "signal"}
            >
              {highlight.badge}
            </span>
            <h3 className="hito-ui-title-xs text-foreground">{highlight.title}</h3>
          </div>
          <p className="hito-body-sm mt-2 text-muted-foreground">
            <InlineMarkdown text={highlight.body} />
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyChangelogState() {
  return (
    <section className="hito-editorial-backdrop hito-timeline-entry" data-tone="neutral">
      <h2 className="hito-ui-title-xs">No shipped changes yet</h2>
      <p className="hito-body-sm mt-2 text-muted-foreground">
        This page will fill up once dated product updates start shipping.
      </p>
    </section>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="hito-inline-code">
              {part.slice(1, -1)}
            </code>
          );
        }

        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

        if (linkMatch) {
          return (
            <a
              key={index}
              href={getHistoryMarkdownLinkHref(linkMatch[2])}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border/80 underline-offset-4 transition-colors hover:text-foreground"
            >
              {linkMatch[1]}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function getHistoryMarkdownLinkHref(href: string) {
  if (/^(https?:|mailto:|#)/i.test(href)) {
    return href;
  }

  return new URL(
    href,
    "https://github.com/ivan-nthng/hito-runner/blob/main/docs/history/",
  ).toString();
}
