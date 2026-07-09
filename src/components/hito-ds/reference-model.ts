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
    body: "Source hierarchy, reading guidance, Figma bridge, and known gaps.",
    sections: [{ id: "overview", label: "Start here" }],
  },
  {
    id: "foundations",
    label: "Foundations",
    path: HITO_DS_PAGE_ROUTES.foundations,
    body: "Brand, tokens, type, atmosphere, and icon foundations.",
    sections: [
      { id: "brand", label: "Brand" },
      { id: "foundations", label: "Tokens" },
      { id: "typography", label: "Typography" },
      { id: "gradient-overlays", label: "Gradients" },
      { id: "icons", label: "Icons" },
    ],
  },
  {
    id: "components",
    label: "Components",
    path: HITO_DS_PAGE_ROUTES.components,
    body: "Shared controls and primitives using the accepted Demo / Variants workbench.",
    sections: [
      { id: "buttons", label: "Buttons" },
      { id: "inputs", label: "Inputs" },
      { id: "tabs", label: "Tabs" },
      { id: "status", label: "Status" },
      { id: "selection-controls", label: "Selection" },
      { id: "modals", label: "Modals" },
      { id: "dropdowns", label: "Dropdowns" },
      { id: "calendar-workout-playground", label: "Calendar" },
      { id: "data-table", label: "Tables" },
      { id: "async-actions", label: "Async toasts" },
      { id: "rows", label: "Rows" },
      { id: "shell", label: "Shell nav" },
    ],
  },
  {
    id: "patterns",
    label: "Patterns",
    path: HITO_DS_PAGE_ROUTES.patterns,
    body: "Composed product patterns built from the component/foundation owners.",
    sections: [
      { id: "inline-editable-text", label: "Inline editing" },
      { id: "editorial-patterns", label: "Editorial" },
      { id: "surfaces", label: "Composition" },
      { id: "states", label: "States" },
      { id: "workout-library-playground", label: "Workout taxonomy" },
      { id: "analytics", label: "Summary truth" },
    ],
  },
] as const;

export const SUPPORT_SECTIONS = [
  { id: "figma-bridge", label: "Figma export", pageId: "overview" },
  { id: "shared-wrappers", label: "Wrapper notes", pageId: "overview" },
  { id: "backlog", label: "Known gaps", pageId: "overview" },
] as const;

const SECTIONS = [
  ...HITO_DS_PAGES.flatMap((group) => group.sections),
  ...SUPPORT_SECTIONS.map(({ id, label }) => ({ id, label })),
];

export type HitoDsPageId = (typeof HITO_DS_PAGES)[number]["id"];
export type SectionId = (typeof SECTIONS)[number]["id"];

export function getSectionIdFromHash(hash: string): SectionId | null {
  const hashSectionId = hash.replace("#", "");
  return SECTIONS.some((section) => section.id === hashSectionId)
    ? (hashSectionId as SectionId)
    : null;
}

export function getHitoDsPage(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.find((page) => page.id === pageId) ?? HITO_DS_PAGES[0];
}

export function getHitoDsPageForSection(sectionId: SectionId) {
  const page = HITO_DS_PAGES.find((candidate) =>
    candidate.sections.some((section) => section.id === sectionId),
  );

  if (page) {
    return page;
  }

  const supportSection = SUPPORT_SECTIONS.find((section) => section.id === sectionId);
  return supportSection ? getHitoDsPage(supportSection.pageId) : null;
}

export function getHitoDsPageIndex(pageId: HitoDsPageId) {
  return HITO_DS_PAGES.findIndex((page) => page.id === pageId);
}
