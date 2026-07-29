export const HITO_DS_PAGE_ROUTES = {
  overview: "/hitoDS",
  foundations: "/hitoDS/foundations",
  components: "/hitoDS/components",
  patterns: "/hitoDS/patterns",
} as const;

export const HITO_DS_PAGES = [
  {
    id: "overview",
    label: "Overview",
    path: HITO_DS_PAGE_ROUTES.overview,
    sections: [
      { id: "overview", label: "Start here", keywords: ["catalog", "search", "browse"] },
      { id: "figma-bridge", label: "Figma export", keywords: ["capture", "html.to.design"] },
      { id: "shared-wrappers", label: "Wrapper notes", keywords: ["radix", "compatibility"] },
      { id: "backlog", label: "Known gaps", keywords: ["exceptions", "local"] },
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    path: HITO_DS_PAGE_ROUTES.foundations,
    sections: [
      { id: "brand", label: "Brand", keywords: ["logo", "lockup"] },
      { id: "gradient-overlays", label: "Gradients", keywords: ["overlay", "alpha", "wash"] },
      { id: "foundations", label: "Tokens", keywords: ["color", "spacing", "radius"] },
      { id: "typography", label: "Typography", keywords: ["type", "font", "text roles"] },
      { id: "icons", label: "Icons", keywords: ["tabler", "symbol"] },
    ],
  },
  {
    id: "components",
    label: "Components",
    path: HITO_DS_PAGE_ROUTES.components,
    sections: [
      { id: "buttons", label: "Buttons", keywords: ["action", "icon button"] },
      { id: "tabs", label: "Tabs", keywords: ["segmented", "switcher"] },
      { id: "data-table", label: "Tables", keywords: ["data", "sort", "filter"] },
      {
        id: "inputs",
        label: "Inputs",
        keywords: ["field", "textarea", "native select", "date", "time", "avatar"],
      },
      {
        id: "editable-value-field",
        label: "Editable Value Field",
        keywords: ["inline value", "scalar", "select"],
      },
      { id: "status", label: "Status", keywords: ["pill", "badge", "metadata tag"] },
      { id: "selection-controls", label: "Selection", keywords: ["checkbox", "radio", "switch"] },
      { id: "modals", label: "Modals", keywords: ["dialog", "sheet", "overlay"] },
      { id: "async-actions", label: "Async toasts", keywords: ["toast", "loading", "feedback"] },
      {
        id: "calendar-workout-playground",
        label: "Calendar",
        keywords: ["workout day", "rest day", "add"],
      },
      { id: "rows", label: "Rows", keywords: ["list row", "metric row", "disclosure"] },
      { id: "shell", label: "Shell nav", keywords: ["sidebar", "mobile navigation"] },
      {
        id: "dropdowns",
        label: "Dropdowns",
        keywords: ["menu", "select", "list item", "popover"],
      },
    ],
  },
  {
    id: "patterns",
    label: "Patterns",
    path: HITO_DS_PAGE_ROUTES.patterns,
    sections: [
      { id: "inline-editable-text", label: "Inline editing", keywords: ["read", "edit"] },
      { id: "editorial-patterns", label: "Editorial", keywords: ["timeline", "changelog"] },
      { id: "surfaces", label: "Composition", keywords: ["surface", "row group"] },
      {
        id: "states",
        label: "States",
        keywords: ["empty", "error", "loading", "skeleton", "tooltip"],
      },
      {
        id: "workout-library-playground",
        label: "Workout taxonomy",
        keywords: ["training", "workout type"],
      },
      { id: "analytics", label: "Summary truth", keywords: ["metrics", "admin"] },
    ],
  },
] as const;

export type HitoDsPageId = (typeof HITO_DS_PAGES)[number]["id"];
export type SectionId = (typeof HITO_DS_PAGES)[number]["sections"][number]["id"];
type HitoDsPage = (typeof HITO_DS_PAGES)[number];

const HITO_DS_PAGE_LIST = HITO_DS_PAGES as ReadonlyArray<
  HitoDsPage & {
    sections: ReadonlyArray<{ id: SectionId }>;
  }
>;

export function getSectionIdFromHash(hash: string): SectionId | null {
  const hashSectionId = hash.replace("#", "");
  return HITO_DS_PAGE_LIST.some((page) =>
    page.sections.some((section) => section.id === hashSectionId),
  )
    ? (hashSectionId as SectionId)
    : null;
}

export function getHitoDsPage(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.find((page) => page.id === pageId) ?? HITO_DS_PAGES[0];
}

export function getHitoDsPageForSection(sectionId: SectionId) {
  return HITO_DS_PAGE_LIST.find((candidate) =>
    candidate.sections.some((section) => section.id === sectionId),
  );
}

export function getHitoDsPageIndex(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.findIndex((page) => page.id === pageId);
}
