import { Link, createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import changelogMarkdown from "../../docs/history/changelog.md?raw";

interface ChangelogDay {
  date: string;
  entries: string[];
}

interface ChangelogMonth {
  key: string;
  label: string;
  days: ChangelogDay[];
}

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: `Hito changelog — ${APP_NAME}` },
      {
        name: "description",
        content: "Product updates, fixes, and design-system changes shipped to Hito.",
      },
    ],
  }),
  component: ChangelogPage,
});

const changelogMonths = groupChangelogByMonth(parseChangelog(changelogMarkdown));

function ChangelogPage() {
  const entryCount = changelogMonths.reduce(
    (total, month) =>
      total + month.days.reduce((monthTotal, day) => monthTotal + day.entries.length, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header className="flex flex-col gap-8 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/"
              className="hito-micro-label inline-flex text-muted-foreground transition-colors hover:text-foreground"
            >
              Hito
            </Link>
            <h1 className="hito-page-title mt-5">Hito changelog</h1>
            <p className="hito-body mt-4 max-w-2xl text-muted-foreground">
              Product updates, fixes, and design-system changes shipped to Hito.
            </p>
          </div>
          <div className="grid gap-1 text-left md:text-right">
            <p className="hito-micro-label">Release history</p>
            <p className="hito-body-small text-muted-foreground">
              {entryCount} shipped changes from the implementation log.
            </p>
          </div>
        </header>

        <div className="grid gap-12">
          {changelogMonths.map((month) => (
            <section
              key={month.key}
              aria-labelledby={`changelog-${month.key}`}
              className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10"
            >
              <div>
                <h2 id={`changelog-${month.key}`} className="hito-section-title md:sticky md:top-8">
                  {month.label}
                </h2>
              </div>

              <div className="grid gap-8">
                {month.days.map((day) => (
                  <article
                    key={day.date}
                    className="grid gap-4 border-t border-hairline pt-5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-7"
                  >
                    <time
                      dateTime={day.date}
                      className="hito-micro-label text-muted-foreground sm:pt-1"
                    >
                      {formatDayLabel(day.date)}
                    </time>
                    <ul className="grid gap-3">
                      {day.entries.map((entry, index) => (
                        <li
                          key={`${day.date}-${index}`}
                          className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.62rem] h-1.5 w-1.5 rounded-full bg-signal/80"
                          />
                          <p className="hito-body-small leading-relaxed text-foreground/88">
                            <InlineMarkdown text={entry} />
                          </p>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
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
      label: formatMonthLabel(key),
      days: monthDays.sort((left, right) => right.date.localeCompare(left.date)),
    }));
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDayLabel(date: string) {
  const [, , day] = date.split("-");
  return day;
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
