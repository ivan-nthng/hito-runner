const HITO_DS_PAGE_ROUTES = {
  overview: "/hitoDS",
  components: "/hitoDS/components",
  foundations: "/hitoDS/foundations",
  patterns: "/hitoDS/patterns",
  brand: "/hitoDS/brand",
} as const;

const OVERVIEW_SECTIONS = [
  { id: "overview", label: "Overview", keywords: ["showroom", "catalog", "browse"] },
  { id: "showroom", label: "Live showroom", keywords: ["preview", "gallery", "components"] },
  {
    id: "reference-boundary",
    label: "Code boundary",
    keywords: ["canonical", "figma", "governance"],
  },
  // Retained hash owners keep accepted Overview deep links truthful after governance is demoted.
  { id: "figma-bridge", label: "Figma bridge", keywords: ["capture", "export"] },
  { id: "shared-wrappers", label: "Wrapper notes", keywords: ["compatibility", "radix"] },
  { id: "backlog", label: "Known gaps", keywords: ["exceptions", "local"] },
] as const;

const COMPONENT_SECTIONS = [
  { id: "async-actions", label: "Async Action Toasts", keywords: ["toast", "feedback"] },
  { id: "buttons", label: "Button", keywords: ["action", "button"] },
  {
    id: "calendar-workout-playground",
    label: "Calendar",
    keywords: ["workout day", "rest day", "date"],
  },
  { id: "data-table", label: "Data Table", keywords: ["data", "sort", "filter"] },
  { id: "date-field", label: "Date Field", keywords: ["calendar", "date", "picker"] },
  { id: "dialog", label: "Dialog", keywords: ["modal", "focus"] },
  { id: "modals", label: "Dialog / Sheet", keywords: ["overlay", "modal"] },
  { id: "dropdowns", label: "Dropdown / Menu", keywords: ["menu", "select", "popover"] },
  {
    id: "editable-value-field",
    label: "Editable Value Field",
    keywords: ["inline value", "scalar", "select"],
  },
  { id: "field", label: "Field", keywords: ["input", "text", "form"] },
  { id: "button-group", label: "Grouped Buttons", keywords: ["connected", "composition"] },
  { id: "icon-only-button", label: "Icon-only Button", keywords: ["compact", "icon"] },
  {
    id: "inputs",
    label: "Inputs",
    keywords: ["field", "textarea", "native select", "date", "time"],
  },
  {
    id: "data-table-interactive-header",
    label: "Interactive Column Header",
    keywords: ["sort", "filter", "menu"],
  },
  { id: "metadata-tag", label: "Metadata Tag", keywords: ["tag", "chip", "label"] },
  {
    id: "native-select",
    label: "Native Select",
    keywords: ["select", "option", "field"],
  },
  { id: "data-table-row", label: "Row Anatomy", keywords: ["cells", "table row"] },
  { id: "rows", label: "Rows & Disclosure", keywords: ["list row", "details", "summary"] },
  {
    id: "selection-controls",
    label: "Selection Controls",
    keywords: ["checkbox", "radio", "switch"],
  },
  { id: "sheet", label: "Sheet", keywords: ["mobile", "drawer"] },
  { id: "slider", label: "Slider", keywords: ["range", "numeric", "baseline"] },
  {
    id: "data-table-static-header",
    label: "Static Header",
    keywords: ["label", "noninteractive"],
  },
  { id: "status", label: "Status", keywords: ["pill", "state", "feedback"] },
  { id: "status-marker", label: "Status Marker", keywords: ["result", "feedback", "dot"] },
  { id: "tabs", label: "Tabs", keywords: ["segmented", "switcher", "navigation"] },
  { id: "textarea", label: "Textarea", keywords: ["multiline", "notes", "field"] },
  { id: "time-field", label: "Time Field", keywords: ["duration", "masked", "time"] },
] as const;

const FOUNDATION_SECTIONS = [
  {
    id: "foundations",
    label: "Colors & surfaces",
    keywords: ["color", "surface", "semantic", "primitive", "token"],
  },
  { id: "typography", label: "Typography", keywords: ["type", "font", "text roles"] },
  { id: "spacing", label: "Spacing", keywords: ["space", "gap", "inset"] },
  { id: "radius", label: "Radius", keywords: ["corner", "rounding", "surface"] },
  { id: "icons", label: "Icons", keywords: ["tabler", "symbol"] },
  { id: "motion", label: "Motion", keywords: ["animation", "reduced motion", "transition"] },
] as const;

const PATTERN_SECTIONS = [
  { id: "app-shell", label: "App Shell", keywords: ["sidebar", "navigation", "content"] },
  { id: "shell", label: "Legacy Shell Link", keywords: ["redirect", "compatibility"] },
  {
    id: "notice-surface",
    label: "Banner / Notice Surface",
    keywords: ["banner", "notice", "alert", "state"],
  },
  {
    id: "data-table-composition",
    label: "Data Table Composition",
    keywords: ["toolbar", "search", "filter", "table"],
  },
  {
    id: "data-table-toolbar",
    label: "Legacy Data Table Toolbar Link",
    keywords: ["redirect", "toolbar", "filter"],
  },
  { id: "editorial-patterns", label: "Editorial & Timeline", keywords: ["timeline", "changelog"] },
  {
    id: "states",
    label: "Feedback & Route States",
    keywords: ["empty", "error", "loading", "tooltip"],
  },
  { id: "inline-editable-text", label: "Inline Editing", keywords: ["read", "edit"] },
  {
    id: "surfaces",
    label: "Page & Section Composition",
    keywords: ["header", "surface", "row group"],
  },
  { id: "analytics", label: "Summary Truth", keywords: ["metrics", "admin"] },
  { id: "workout-library-playground", label: "Workout Taxonomy", keywords: ["training"] },
] as const;

const BRAND_SECTIONS = [
  { id: "brand", label: "Logo & mark", keywords: ["logo", "lockup", "identity"] },
  { id: "imagery", label: "Imagery", keywords: ["photo", "auth", "editorial"] },
  { id: "atmosphere", label: "Atmosphere", keywords: ["wash", "launch", "canvas"] },
  {
    id: "gradient-overlays",
    label: "Gradients & overlays",
    keywords: ["gradient", "overlay", "alpha", "wash"],
  },
] as const;

export const HITO_DS_PAGES = [
  {
    id: "overview",
    label: "Overview",
    path: HITO_DS_PAGE_ROUTES.overview,
    sections: OVERVIEW_SECTIONS,
  },
  {
    id: "foundations",
    label: "Foundations",
    path: HITO_DS_PAGE_ROUTES.foundations,
    sections: FOUNDATION_SECTIONS,
  },
  {
    id: "components",
    label: "Components",
    path: HITO_DS_PAGE_ROUTES.components,
    sections: COMPONENT_SECTIONS,
  },
  {
    id: "patterns",
    label: "Patterns",
    path: HITO_DS_PAGE_ROUTES.patterns,
    sections: PATTERN_SECTIONS,
  },
  {
    id: "brand",
    label: "Brand & Visuals",
    path: HITO_DS_PAGE_ROUTES.brand,
    sections: BRAND_SECTIONS,
  },
] as const;

export type HitoDsPageId = (typeof HITO_DS_PAGES)[number]["id"];
type SectionId = (typeof HITO_DS_PAGES)[number]["sections"][number]["id"];
type HitoDsPage = (typeof HITO_DS_PAGES)[number];

const HITO_DS_PAGE_LIST = HITO_DS_PAGES as ReadonlyArray<
  HitoDsPage & {
    sections: ReadonlyArray<{
      id: SectionId;
      label: string;
      keywords: readonly string[];
    }>;
  }
>;

export type HitoDsNavDestination = {
  id: string;
  label: string;
  href: string;
  keywords: readonly string[];
};

export type HitoDsNavItem =
  | ({ kind: "link" } & HitoDsNavDestination)
  | {
      kind: "group";
      id: string;
      label: string;
      keywords: readonly string[];
      children: readonly HitoDsNavDestination[];
    };

function pageDestination(pageId: HitoDsPageId, label?: string): HitoDsNavDestination {
  const page = getHitoDsPage(pageId);
  return {
    id: page.id,
    label: label ?? page.label,
    href: page.path,
    keywords: [page.label],
  };
}

function sectionDestination(sectionId: SectionId, label?: string): HitoDsNavDestination {
  const page = getHitoDsPageForSection(sectionId) ?? HITO_DS_PAGES[0];
  const section = page.sections.find((candidate) => candidate.id === sectionId);

  return {
    id: sectionId,
    label: label ?? section?.label ?? sectionId,
    href: `${page.path}#${sectionId}`,
    keywords: section?.keywords ?? [],
  };
}

export const HITO_DS_NAV_ITEMS: readonly HitoDsNavItem[] = [
  { kind: "link", ...pageDestination("overview", "Overview") },
  {
    kind: "group",
    id: "foundations",
    label: "Foundations",
    keywords: ["tokens", "colors", "typography", "spacing", "radius", "icons", "motion"],
    children: [
      pageDestination("foundations", "Overview"),
      ...FOUNDATION_SECTIONS.map((section) => sectionDestination(section.id)),
    ],
  },
  {
    kind: "group",
    id: "components",
    label: "Components",
    keywords: ["catalog", "a-z", "controls", "anatomy"],
    children: [
      pageDestination("components", "Overview"),
      ...COMPONENT_SECTIONS.map((section) => sectionDestination(section.id)),
    ],
  },
  {
    kind: "group",
    id: "patterns",
    label: "Patterns",
    keywords: ["composition", "shell", "states", "editing", "editorial"],
    children: [
      pageDestination("patterns", "Overview"),
      ...PATTERN_SECTIONS.filter(
        (section) => section.id !== "shell" && section.id !== "data-table-toolbar",
      ).map((section) => sectionDestination(section.id)),
    ],
  },
  {
    kind: "group",
    id: "brand",
    label: "Brand & Visuals",
    keywords: ["logo", "imagery", "atmosphere", "gradient", "overlay"],
    children: [
      pageDestination("brand", "Overview"),
      ...BRAND_SECTIONS.map((section) => sectionDestination(section.id)),
    ],
  },
  {
    kind: "link",
    id: "figma-export",
    label: "Figma Export",
    href: "/hitoDS/export/figma",
    keywords: ["capture", "downstream", "bridge"],
  },
];

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
