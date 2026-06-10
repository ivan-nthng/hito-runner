export interface ChangelogDay {
  date: string;
  entries: string[];
}

export interface ChangelogMonth {
  key: string;
  year: string;
  label: string;
  days: ChangelogDay[];
}

export interface ChangelogYear<TMonth> {
  year: string;
  months: TMonth[];
}

export type ChangelogEntryKind = "milestone" | "update";

export interface ChangelogEntryPresentation {
  kind: ChangelogEntryKind;
  title: string | null;
}

export type HighlightBadge = "New" | "Improved" | "Fixed" | "Cleanup" | "Behind the scenes";

export interface ChangelogHighlight {
  badge: HighlightBadge;
  title: string;
  body: string;
  sourceEntry: string | null;
  isFallback: boolean;
  category?: HighlightCategory;
}

export interface ChangelogHighlightDay {
  date: string;
  highlights: ChangelogHighlight[];
}

export interface ChangelogHighlightMonth {
  key: string;
  year: string;
  label: string;
  days: ChangelogHighlightDay[];
}

export type HighlightCategory =
  | "run_creation_engine"
  | "plan_refresh_safety"
  | "admin_ops"
  | "calendar_workout_identity"
  | "qa_reliability"
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

export function parseChangelog(markdown: string): ChangelogDay[] {
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
      continue;
    }

    const continuationMatch = line.match(/^\s{2,}(\S.*)$/);

    if (continuationMatch && current.entries.length > 0) {
      const previousEntryIndex = current.entries.length - 1;
      const continuationText = continuationMatch[1].trim();
      current.entries[previousEntryIndex] =
        `${current.entries[previousEntryIndex]} ${continuationText}`;
    }
  }

  return sections
    .filter((section) => section.entries.length > 0)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getChangelogEntryCount(months: ChangelogMonth[]) {
  return months.reduce(
    (total, month) =>
      total + month.days.reduce((monthTotal, day) => monthTotal + day.entries.length, 0),
    0,
  );
}

export function getLatestChangelogDate(days: ChangelogDay[]) {
  return days[0]?.date ?? null;
}

export function getHighlightMonths(days: ChangelogDay[]): ChangelogHighlightMonth[] {
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

  if (
    /^(improved|updated|upgraded|refined|normalized|reworked|tightened|hardened|aligned)\b/i.test(
      entry,
    )
  ) {
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
    /^(added|created|implemented|introduced|shipped|launched|fixed|resolved|corrected|prevented|repaired|improved|updated|upgraded|refined|normalized|reworked|tightened|hardened|aligned|simplified|replaced|polished)\b/i.test(
      entry,
    );

  if (!actionMatches && !isMilestoneEntry(entry)) {
    return null;
  }

  if (
    normalized.includes("active-plan refresh/apply safety") ||
    normalized.includes("exact signed non-mutating future draft") ||
    normalized.includes("exact non-mutating future schedule draft") ||
    normalized.includes("proposal-time draft") ||
    normalized.includes("apply update") ||
    normalized.includes("reviewed draft")
  ) {
    return "plan_refresh_safety";
  }

  if (
    normalized.includes("running-plan authoring doctrine") ||
    normalized.includes("plan-authoring metric-mode") ||
    normalized.includes("structured plan generator doctrine") ||
    normalized.includes("beginner build-consistency doctrine") ||
    normalized.includes("goal-family workout identity") ||
    normalized.includes("mountain/trail doctrine") ||
    normalized.includes("long-distance honesty") ||
    normalized.includes("taper/phase consistency") ||
    normalized.includes("taper/phase") ||
    normalized.includes("metric-mode resolver")
  ) {
    return "run_creation_engine";
  }

  if (
    normalized.includes("workout identity mapping") ||
    normalized.includes("sourceworkouttype") ||
    normalized.includes("labels and glyphs") ||
    normalized.includes("workout-type glyph") ||
    normalized.includes("calendar-cell semantics") ||
    normalized.includes("visible identity")
  ) {
    return "calendar_workout_identity";
  }

  if (
    normalized.includes("qa matrix") ||
    normalized.includes("fixture matrix") ||
    normalized.includes("proof pass") ||
    normalized.includes("qa-green") ||
    normalized.includes("safari qa passed")
  ) {
    return "qa_reliability";
  }

  if (
    hasDesignSystemSignal(normalized) &&
    (normalized.includes("workbench") || getDesignSystemSurfaceCount(normalized) > 1)
  ) {
    return "design_system";
  }

  if (
    normalized.includes("/admin/analytics") ||
    normalized.includes("/admin/login") ||
    normalized.includes("admin analytics") ||
    normalized.includes("admin login") ||
    normalized.includes("test accounts") ||
    normalized.includes("owner admin")
  ) {
    return "admin_ops";
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
    case "run_creation_engine":
      return "Run Creation Engine";
    case "plan_refresh_safety":
      return "Plan Refresh Safety";
    case "admin_ops":
      return "Admin & Ops";
    case "calendar_workout_identity":
      return "Calendar & Workout Identity";
    case "qa_reliability":
      return "QA / Reliability";
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
      return "Hito DS Iteration";
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
    case "run_creation_engine":
      return "Plan creation and refresh use stronger backend coaching doctrine, clearer workout identity, and safer metric rules.";
    case "plan_refresh_safety":
      return "Plan updates stay review-first: Hito shows the proposed future schedule and applies only the reviewed draft after explicit confirmation.";
    case "admin_ops":
      return "Internal admin access and analytics are safer, more bounded, and easier to operate.";
    case "calendar_workout_identity":
      return "Calendar labels and glyphs better match the actual workout semantics instead of collapsing everything into a generic quality label.";
    case "qa_reliability":
      return "High-risk product flows have clearer regression coverage and fixture checks.";
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
      return "Hito DS keeps converging existing surfaces onto shared tokens, primitives, and documented UI recipes.";
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

export function groupChangelogByMonth(days: ChangelogDay[]): ChangelogMonth[] {
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

export function groupMonthsByYear<TMonth extends { year: string }>(
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

export function formatDayLabel(date: string) {
  const [, , day] = date.split("-");
  return day;
}

export function formatFullDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatEntryCount(count: number) {
  return `${count} shipped ${count === 1 ? "change" : "changes"}`;
}

export function getEntryPresentation(entry: string): ChangelogEntryPresentation {
  if (!isMilestoneEntry(entry)) {
    return { kind: "update", title: null };
  }

  return { kind: "milestone", title: getMilestoneTitle(entry) };
}

function isMilestoneEntry(entry: string) {
  const normalized = entry.toLowerCase();
  const actionMatches = /^(added|created|implemented|introduced|shipped|launched|upgraded)\b/i.test(
    entry,
  );
  const featureMatches = [
    "onboarding",
    "voice",
    "entitlement",
    "garmin",
    "admin",
    "doctrine",
    "glyph",
    "identity",
    "qa",
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
    normalized.includes("hito ds") ||
    normalized.includes("icon system") ||
    normalized.includes("typography") ||
    normalized.includes("button") ||
    normalized.includes("input") ||
    normalized.includes("toast") ||
    normalized.includes("modal")
  ) {
    return "Hito DS iteration";
  }

  if (normalized.includes("doctrine") || normalized.includes("goal-family")) {
    return "Run Creation Engine";
  }

  if (normalized.includes("admin")) {
    return "Admin & Ops";
  }

  if (normalized.includes("glyph") || normalized.includes("identity")) {
    return "Calendar & Workout Identity";
  }

  if (normalized.includes("qa")) {
    return "QA / Reliability";
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
