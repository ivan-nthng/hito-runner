export type HitoDsReferenceKind = "component" | "pattern";

export type HitoDsTokenRecipe = {
  controlIds: string[];
  excludedClasses?: string[];
  requiredClasses?: string[];
  token: string;
};

export type HitoDsReferenceEntry = {
  anchor?: string;
  id: string;
  kind: HitoDsReferenceKind;
  label: string;
  referencePath: string;
  sourcePath: string;
  tokenRecipes?: HitoDsTokenRecipe[];
};

export type HitoDsOwnershipEvidence =
  | {
      entry: HitoDsReferenceEntry;
      marker: string;
      state: "confirmed_component" | "confirmed_pattern";
    }
  | {
      entry: null;
      marker: string;
      state: "declared_unresolved";
    }
  | {
      entry: null;
      marker: null;
      state: "unconfirmed";
    };

const RADIUS_CONTROL_IDS = [
  "radius-top-left",
  "radius-top-right",
  "radius-bottom-right",
  "radius-bottom-left",
];

export const HITO_DS_REFERENCE_ENTRIES: HitoDsReferenceEntry[] = [
  {
    anchor: "inputs",
    id: "select",
    kind: "component",
    label: "Select",
    referencePath: "/hitoDS/components#inputs",
    sourcePath: "src/components/ui/select.tsx",
    tokenRecipes: [
      {
        controlIds: RADIUS_CONTROL_IDS,
        requiredClasses: ["hito-ui-select-trigger-sm"],
        token: "--radius-md",
      },
      {
        controlIds: RADIUS_CONTROL_IDS,
        excludedClasses: ["hito-ui-select-trigger-sm"],
        requiredClasses: ["hito-ui-select-trigger"],
        token: "--radius-lg",
      },
    ],
  },
  {
    anchor: "inputs",
    id: "textarea",
    kind: "component",
    label: "Textarea",
    referencePath: "/hitoDS/components#inputs",
    sourcePath: "src/components/ui/textarea.tsx",
    tokenRecipes: [
      {
        controlIds: RADIUS_CONTROL_IDS,
        requiredClasses: ["hito-field"],
        token: "--radius-lg",
      },
    ],
  },
  {
    anchor: "status",
    id: "metadata-tag",
    kind: "component",
    label: "Metadata tag",
    referencePath: "/hitoDS/components#status",
    sourcePath: "src/components/ui/metadata-tag.tsx",
    tokenRecipes: [
      {
        controlIds: RADIUS_CONTROL_IDS,
        requiredClasses: ["hito-metadata-tag"],
        token: "--radius-sm",
      },
    ],
  },
  {
    anchor: "inline-editable-text",
    id: "inline-editable-text",
    kind: "component",
    label: "Inline editable text",
    referencePath: "/hitoDS/patterns#inline-editable-text",
    sourcePath: "src/components/ui/inline-editable-text.tsx",
  },
  {
    anchor: "status",
    id: "value-tag",
    kind: "component",
    label: "Value tag",
    referencePath: "/hitoDS/components#status",
    sourcePath: "src/components/ui/value-tag.tsx",
  },
  {
    anchor: "modals",
    id: "dialog",
    kind: "component",
    label: "Dialog",
    referencePath: "/hitoDS/components#modals",
    sourcePath: "src/components/ui/dialog.tsx",
  },
  {
    anchor: "modals",
    id: "sheet",
    kind: "component",
    label: "Sheet",
    referencePath: "/hitoDS/components#modals",
    sourcePath: "src/components/ui/sheet.tsx",
  },
  {
    anchor: "rows",
    id: "row-group",
    kind: "pattern",
    label: "Row group",
    referencePath: "/hitoDS/components#rows",
    sourcePath: "src/styles/controls-lists.css",
  },
];

const REFERENCE_ENTRY_BY_KEY = new Map(
  HITO_DS_REFERENCE_ENTRIES.map((entry) => [`${entry.kind}:${entry.id}`, entry]),
);

export function resolveHitoDsOwnershipMarkers({
  componentMarker,
  patternMarker,
}: {
  componentMarker?: string | null;
  patternMarker?: string | null;
}): HitoDsOwnershipEvidence {
  const normalizedComponent = normalizeMarker(componentMarker);
  const normalizedPattern = normalizeMarker(patternMarker);
  const marker = normalizedComponent ?? normalizedPattern;
  const kind: HitoDsReferenceKind | null = normalizedComponent
    ? "component"
    : normalizedPattern
      ? "pattern"
      : null;

  if (!marker || !kind) return { entry: null, marker: null, state: "unconfirmed" };

  const entry = REFERENCE_ENTRY_BY_KEY.get(`${kind}:${marker}`) ?? null;
  if (!entry) return { entry: null, marker, state: "declared_unresolved" };

  return {
    entry,
    marker,
    state: kind === "component" ? "confirmed_component" : "confirmed_pattern",
  };
}

export function getHitoDsAppliedTokenReferences(
  ownership: HitoDsOwnershipEvidence,
  className: string,
) {
  const tokens: Record<string, string> = {};
  if (!ownership.entry?.tokenRecipes) return tokens;

  const classes = new Set(className.split(/\s+/).filter(Boolean));
  ownership.entry.tokenRecipes.forEach((recipe) => {
    const hasRequiredClasses = (recipe.requiredClasses ?? []).every((value) => classes.has(value));
    const hasExcludedClass = (recipe.excludedClasses ?? []).some((value) => classes.has(value));
    if (!hasRequiredClasses || hasExcludedClass) return;

    recipe.controlIds.forEach((controlId) => {
      tokens[controlId] = recipe.token;
    });
  });

  return tokens;
}

function normalizeMarker(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized.slice(0, 120) : null;
}
