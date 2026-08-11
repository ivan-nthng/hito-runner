const HITO_DS_PAGE_ROUTES = {
  overview: "/hitoDS",
  components: "/hitoDS/components",
  foundations: "/hitoDS/foundations",
  patterns: "/hitoDS/patterns",
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
  { id: "button-group", label: "Grouped Buttons", keywords: ["connected", "composition"] },
  { id: "icon-only-button", label: "Icon-only Button", keywords: ["compact", "icon"] },
  {
    id: "calendar-workout-playground",
    label: "Calendar",
    keywords: ["workout day", "rest day", "date"],
  },
  { id: "data-table", label: "Data Table", keywords: ["data", "sort", "filter"] },
  { id: "data-table-toolbar", label: "Toolbar", keywords: ["search", "filter"] },
  {
    id: "data-table-interactive-header",
    label: "Interactive Column Header",
    keywords: ["sort", "filter", "menu"],
  },
  {
    id: "data-table-static-header",
    label: "Static Header",
    keywords: ["label", "noninteractive"],
  },
  { id: "data-table-row", label: "Row Anatomy", keywords: ["cells", "table row"] },
  { id: "modals", label: "Dialog / Sheet", keywords: ["overlay", "modal"] },
  { id: "dialog", label: "Dialog", keywords: ["modal", "focus"] },
  { id: "sheet", label: "Sheet", keywords: ["mobile", "drawer"] },
  { id: "dropdowns", label: "Dropdown / Menu", keywords: ["menu", "select", "popover"] },
  {
    id: "editable-value-field",
    label: "Editable Value Field",
    keywords: ["inline value", "scalar", "select"],
  },
  {
    id: "inputs",
    label: "Inputs",
    keywords: ["field", "textarea", "native select", "date", "time"],
  },
  { id: "field", label: "Field", keywords: ["input", "text", "form"] },
  {
    id: "native-select",
    label: "Native Select",
    keywords: ["select", "option", "field"],
  },
  { id: "textarea", label: "Textarea", keywords: ["multiline", "notes", "field"] },
  { id: "date-field", label: "Date Field", keywords: ["calendar", "date", "picker"] },
  { id: "time-field", label: "Time Field", keywords: ["duration", "masked", "time"] },
  { id: "motion", label: "Motion", keywords: ["animation", "reduced motion", "transition"] },
  { id: "rows", label: "Rows & Disclosure", keywords: ["list row", "details", "summary"] },
  {
    id: "selection-controls",
    label: "Selection Controls",
    keywords: ["checkbox", "radio", "switch"],
  },
  { id: "slider", label: "Slider", keywords: ["range", "numeric", "baseline"] },
  { id: "status", label: "Status", keywords: ["pill", "state", "feedback"] },
  { id: "status-marker", label: "Status Marker", keywords: ["result", "feedback", "dot"] },
  { id: "metadata-tag", label: "Metadata Tag", keywords: ["tag", "chip", "label"] },
  { id: "tabs", label: "Tabs", keywords: ["segmented", "switcher", "navigation"] },
  { id: "app-shell", label: "App Shell", keywords: ["sidebar", "navigation", "content"] },
  { id: "shell", label: "Legacy Shell Link", keywords: ["redirect", "compatibility"] },
] as const;

const FOUNDATION_SECTIONS = [
  { id: "brand", label: "Brand", keywords: ["logo", "lockup"] },
  { id: "gradient-overlays", label: "Gradients", keywords: ["overlay", "alpha", "wash"] },
  { id: "foundations", label: "Tokens", keywords: ["color", "spacing", "radius"] },
  { id: "typography", label: "Typography", keywords: ["type", "font", "text roles"] },
  { id: "icons", label: "Icons", keywords: ["tabler", "symbol"] },
] as const;

const PATTERN_SECTIONS = [
  { id: "inline-editable-text", label: "Inline Editing", keywords: ["read", "edit"] },
  { id: "editorial-patterns", label: "Editorial", keywords: ["timeline", "changelog"] },
  { id: "surfaces", label: "Composition", keywords: ["surface", "row group"] },
  { id: "states", label: "States", keywords: ["empty", "error", "loading", "tooltip"] },
  {
    id: "notice-surface",
    label: "Banner / Notice Surface",
    keywords: ["banner", "notice", "alert", "state"],
  },
  { id: "workout-library-playground", label: "Workout Taxonomy", keywords: ["training"] },
  { id: "analytics", label: "Summary Truth", keywords: ["metrics", "admin"] },
] as const;

export const HITO_DS_PAGES = [
  {
    id: "overview",
    label: "Overview",
    path: HITO_DS_PAGE_ROUTES.overview,
    sections: OVERVIEW_SECTIONS,
  },
  {
    id: "components",
    label: "Components A-Z",
    path: HITO_DS_PAGE_ROUTES.components,
    sections: COMPONENT_SECTIONS,
  },
  {
    id: "foundations",
    label: "Foundations",
    path: HITO_DS_PAGE_ROUTES.foundations,
    sections: FOUNDATION_SECTIONS,
  },
  {
    id: "patterns",
    label: "Patterns",
    path: HITO_DS_PAGE_ROUTES.patterns,
    sections: PATTERN_SECTIONS,
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
      secondary?: boolean;
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

function componentGroup(
  id: string,
  label: string,
  sectionIds: readonly SectionId[],
): HitoDsNavItem {
  if (sectionIds.length === 1) {
    return {
      kind: "link",
      ...sectionDestination(sectionIds[0], label),
      id,
    };
  }

  return {
    kind: "group",
    id,
    label,
    keywords: [],
    children: sectionIds.map((sectionId) => sectionDestination(sectionId)),
  };
}

export const HITO_DS_NAV_ITEMS: readonly HitoDsNavItem[] = [
  { kind: "link", ...pageDestination("overview", "Overview") },
  { kind: "link", ...sectionDestination("app-shell", "App Shell") },
  componentGroup("async-action-toasts", "Async Action Toasts", ["async-actions"]),
  componentGroup("banner-notice-surface", "Banner / Notice Surface", ["notice-surface"]),
  componentGroup("button", "Button", ["buttons", "icon-only-button", "button-group"]),
  componentGroup("calendar", "Calendar", ["calendar-workout-playground"]),
  componentGroup("data-table-family", "Data Table", [
    "data-table",
    "data-table-toolbar",
    "data-table-interactive-header",
    "data-table-static-header",
    "data-table-row",
  ]),
  componentGroup("dialog-sheet", "Dialog / Sheet", ["modals", "dialog", "sheet"]),
  componentGroup("dropdown-menu", "Dropdown / Menu", ["dropdowns"]),
  componentGroup("editable-value", "Editable Value Field", ["editable-value-field"]),
  componentGroup("input-date-time", "Input / Date-Time Fields", [
    "inputs",
    "field",
    "native-select",
    "textarea",
    "date-field",
    "time-field",
  ]),
  componentGroup("motion-family", "Motion", ["motion"]),
  componentGroup("rows-disclosure", "Rows & Disclosure", ["rows"]),
  componentGroup("selection-family", "Selection Controls", ["selection-controls"]),
  componentGroup("slider-family", "Slider", ["slider"]),
  componentGroup("status-metadata", "Status / Metadata", [
    "status",
    "status-marker",
    "metadata-tag",
  ]),
  componentGroup("tabs-family", "Tabs", ["tabs"]),
  {
    kind: "group",
    id: "reference",
    label: "Reference",
    keywords: ["foundations", "patterns", "figma", "export", "governance"],
    secondary: true,
    children: [
      pageDestination("foundations"),
      pageDestination("patterns"),
      {
        id: "figma-export",
        label: "Figma Export",
        href: "/hitoDS/export/figma",
        keywords: ["capture", "downstream", "bridge"],
      },
    ],
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
