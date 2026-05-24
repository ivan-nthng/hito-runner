import { useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import {
  formatDayLabel,
  formatEntryCount,
  formatFullDate,
  getChangelogEntryCount,
  getEntryPresentation,
  getHighlightMonths,
  getLatestChangelogDate,
  groupChangelogByMonth,
  groupMonthsByYear,
  parseChangelog,
  type ChangelogDay,
  type ChangelogEntryPresentation,
  type ChangelogHighlight,
  type ChangelogHighlightDay,
  type ChangelogHighlightMonth,
  type ChangelogMonth,
  type ChangelogYear,
} from "@/lib/changelog-utils";
import changelogMarkdown from "../../docs/history/changelog.md?raw";

type ChangelogTab = "highlights" | "technical";

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
const latestChangelogDate = getLatestChangelogDate(changelogDays);

function ChangelogPage() {
  const [activeTab, setActiveTab] = useState<ChangelogTab>("highlights");
  const entryCount = getChangelogEntryCount(changelogMonths);

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
        className="hito-timeline-day sm:sticky sm:top-8 sm:self-start"
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
        className="hito-timeline-day sm:sticky sm:top-8 sm:self-start"
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
                  ? "hito-panel-title text-foreground"
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
            <h3 className="hito-panel-title text-foreground">{highlight.title}</h3>
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
    <section className="hito-editorial-backdrop hito-timeline-entry" data-tone="neutral">
      <h2 className="hito-panel-title">No shipped changes yet</h2>
      <p className="hito-body-small mt-2 text-muted-foreground">
        This page will fill up once dated product updates start shipping.
      </p>
    </section>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={index} className="hito-inline-code">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
