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
    anchor: "buttons",
    id: "button",
    kind: "component",
    label: "Button",
    referencePath: "/hitoDS/components#buttons",
    sourcePath: "src/styles/controls-lists.css",
  },
  {
    anchor: "editable-value-field",
    id: "editable-value-field",
    kind: "component",
    label: "Editable Value Field",
    referencePath: "/hitoDS/components#editable-value-field",
    sourcePath: "src/components/ui/editable-value-field.tsx",
  },
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

export function resolveHitoDsOwnershipForElement(element: Element): HitoDsOwnershipEvidence {
  const directOwnership = resolveDeclaredOwnership(element);
  if (directOwnership.entry || directOwnership.marker) return directOwnership;

  const parentOwnership = element.parentElement
    ? resolveDeclaredOwnership(element.parentElement)
    : null;
  if (parentOwnership?.entry || parentOwnership?.marker) return parentOwnership;

  const directButtonOwnership = resolveButtonOwnership(element);
  if (directButtonOwnership) return directButtonOwnership;
  if (!isImplementationDescendant(element)) return directOwnership;

  let current = element.parentElement;
  let depth = 0;

  while (current && depth < 4) {
    const declaredOwnership = resolveDeclaredOwnership(current);
    if (declaredOwnership.entry || declaredOwnership.marker) return declaredOwnership;

    const buttonOwnership = resolveButtonOwnership(current);
    if (buttonOwnership) return buttonOwnership;
    if (!isImplementationDescendant(current)) break;

    current = current.parentElement;
    depth += 1;
  }

  return directOwnership;
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

function resolveDeclaredOwnership(element: Element) {
  return resolveHitoDsOwnershipMarkers({
    componentMarker: element.getAttribute("data-hito-component"),
    patternMarker: element.getAttribute("data-hito-ds-pattern"),
  });
}

function resolveButtonOwnership(element: Element) {
  const tagName = element.tagName.toLowerCase();
  const isInteractiveHost =
    tagName === "button" || tagName === "a" || element.getAttribute("role") === "button";
  const hasVariant = ["primary", "secondary", "outlined", "ghost"].some((variant) =>
    element.classList.contains(`hito-button-${variant}`),
  );
  const hasSize = ["xs", "sm", "md", "lg", "xl"].some((size) =>
    element.classList.contains(`hito-button-${size}`),
  );

  if (!isInteractiveHost || !element.classList.contains("hito-button") || !hasVariant || !hasSize) {
    return null;
  }

  return resolveHitoDsOwnershipMarkers({ componentMarker: "button" });
}

function isImplementationDescendant(element: Element) {
  return ["b", "code", "em", "i", "path", "small", "span", "strong", "svg", "use"].includes(
    element.tagName.toLowerCase(),
  );
}
