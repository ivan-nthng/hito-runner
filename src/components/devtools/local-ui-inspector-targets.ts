import type {
  InlineChangeDimensionEvidence,
  InlineChangeTargetInput,
  InlineChangeTargetKind,
  InlineChangeTokenControlInput,
  InlineChangeTokenControlOption,
  InlineChangeTokenControlKind,
  InlineChangeTypographyEvidence,
  InlineChangeTypographyRoleOption,
} from "@/components/devtools/local-inline-change-target-utils";

const CONTROL_TAGS = new Set(["button", "a", "input", "textarea", "select"]);
const CONTROL_ROLES = new Set([
  "button",
  "checkbox",
  "link",
  "menuitem",
  "radio",
  "switch",
  "tab",
  "textbox",
]);
const TEXT_TAGS = new Set([
  "figcaption",
  "label",
  "legend",
  "p",
  "small",
  "span",
  "strong",
  "summary",
]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

const HITO_SPACE_SCALE = [
  ["--space-1", 0.25],
  ["--space-2", 0.5],
  ["--space-3", 0.75],
  ["--space-4", 1],
  ["--space-5", 1.25],
  ["--space-6", 1.5],
  ["--space-8", 2],
  ["--space-10", 2.5],
] as const;

const HITO_RADIUS_SCALE = [
  ["--radius-sm", -4],
  ["--radius-md", -2],
  ["--radius-lg", 0],
  ["--radius-xl", 4],
  ["--radius-2xl", 8],
  ["--radius-3xl", 12],
  ["--radius-4xl", 16],
] as const;

export const HITO_TYPOGRAPHY_ROLE_OPTIONS: InlineChangeTypographyRoleOption[] = [
  {
    className: "hito-display-title",
    description: "Largest display heading used for hero-level product names.",
    id: "display-title",
    label: "Display title",
  },
  {
    className: "hito-page-title",
    description: "Primary page title role.",
    id: "page-title",
    label: "Page title",
  },
  {
    className: "hito-section-title",
    description: "Section-level title role.",
    id: "section-title",
    label: "Section title",
  },
  {
    className: "hito-panel-title",
    description: "Compact panel or card title role.",
    id: "panel-title",
    label: "Panel title",
  },
  {
    className: "hito-list-row-title",
    description: "Primary label inside list-row anatomy.",
    id: "list-row-title",
    label: "List row title",
  },
  {
    className: "hito-body",
    description: "Default body copy role.",
    id: "body",
    label: "Body",
  },
  {
    className: "hito-body-small",
    description: "Small supporting body copy role.",
    id: "body-small",
    label: "Body small",
  },
  {
    className: "hito-caption",
    description: "Quiet caption and secondary metadata role.",
    id: "caption",
    label: "Caption",
  },
  {
    className: "hito-label",
    description: "Compact field or metadata label role.",
    id: "label",
    label: "Label",
  },
  {
    className: "hito-technical-mono",
    description: "Technical monospace readback role.",
    id: "technical-mono",
    label: "Technical mono",
  },
];

export function inspectLocalUiTarget(
  element: HTMLElement,
): Pick<
  InlineChangeTargetInput,
  | "classificationReason"
  | "dimensions"
  | "evidenceLines"
  | "targetKind"
  | "tokenControls"
  | "typography"
  | "visibleText"
> {
  const styles = window.getComputedStyle(element);
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase() ?? null;
  const className = String(element.className ?? "");
  const visibleText = getDirectTextEvidence(element);
  const dimensions = buildDimensionEvidence(element);
  const tokenControls = buildTokenEvidence(styles);
  const targetKind = classifyTarget(element, styles, visibleText);
  const typography = canExposeTypography(targetKind)
    ? buildTypographyEvidence(element, styles, visibleText)
    : null;
  const evidenceLines = buildBaseEvidence(element, styles, visibleText, dimensions, typography);

  return {
    classificationReason: buildClassificationReason(targetKind, tag, role, className, styles),
    dimensions,
    evidenceLines,
    targetKind,
    tokenControls,
    typography,
    visibleText,
  };
}

function classifyTarget(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
  visibleText: string,
): InlineChangeTargetKind {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase() ?? null;
  const className = String(element.className ?? "");
  const childCount = element.childElementCount;
  const display = styles.display;
  const hasText = visibleText.length > 0;
  const hasLayout =
    display.includes("flex") ||
    display.includes("grid") ||
    childCount > 1 ||
    hasPositiveSpacing(styles);

  if (CONTROL_TAGS.has(tag) || (role && CONTROL_ROLES.has(role)) || hasControlClass(className)) {
    return "control";
  }

  if (hasSurfaceSignal(styles, className)) return "surface";

  if (HEADING_TAGS.has(tag) || hasHierarchyClass(className)) return "hierarchy";

  if (hasText && TEXT_TAGS.has(tag)) return "text";

  if (hasText && childCount <= 1 && !hasLayout) return "text";

  if (hasLayout) return "container";

  return hasText ? "text" : "unknown";
}

function buildClassificationReason(
  targetKind: InlineChangeTargetKind,
  tag: string,
  role: string | null,
  className: string,
  styles: CSSStyleDeclaration,
) {
  switch (targetKind) {
    case "control":
      return role
        ? `Interactive control inferred from tag ${tag} and role ${role}.`
        : `Interactive control inferred from tag/classes ${tag}${className ? " with Hito control class evidence" : ""}.`;
    case "surface":
      return "Card/surface inferred from surface chrome: Hito surface/card class, border, shadow, background, or radius.";
    case "hierarchy":
      return `Visual hierarchy inferred from ${HEADING_TAGS.has(tag) ? `heading tag ${tag}` : "typography/status class evidence"}.`;
    case "text":
      return `Text target inferred from leaf-like visible text on ${tag}.`;
    case "container":
      return `Container/layout inferred from ${styles.display || "block"} layout, child elements, padding, or gap.`;
    case "behavior":
      return "Behavior target created from quick bug mode.";
    case "unknown":
    default:
      return "Target classification is uncertain; keep the task minimal and inspect source first.";
  }
}

function buildBaseEvidence(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
  visibleText: string,
  dimensions: InlineChangeDimensionEvidence[],
  typography: InlineChangeTypographyEvidence | null,
) {
  const className = String(element.className ?? "");
  const role = element.getAttribute("role");
  const evidence = [
    `Element: ${element.tagName.toLowerCase()}${role ? ` role=${role}` : ""}.`,
    `Display: ${styles.display}; children: ${element.childElementCount}.`,
  ];
  const hitoClasses = className
    .split(/\s+/)
    .filter((classPart) => classPart.startsWith("hito-"))
    .slice(0, 8);

  if (visibleText) evidence.push(`Current text evidence: "${visibleText.slice(0, 120)}".`);
  if (hitoClasses.length > 0) evidence.push(`Hito DS class evidence: ${hitoClasses.join(", ")}.`);
  if (dimensions.length > 0) {
    evidence.push(
      `Dimensions: ${dimensions
        .map((dimension) => `${dimension.label.toLowerCase()} ${dimension.valueLabel}px`)
        .join("; ")}.`,
    );
  }
  if (typography) {
    const computedType = [
      typography.fontSize ? `font ${typography.fontSize}` : null,
      typography.lineHeight ? `line-height ${typography.lineHeight}` : null,
      typography.fontWeight ? `weight ${typography.fontWeight}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    evidence.push(`Typography: tag ${typography.tag}${computedType ? `; ${computedType}` : ""}.`);
    if (typography.currentRole) {
      evidence.push(
        `Hito typography role: ${typography.currentRole.label} (${typography.currentRole.className}).`,
      );
    } else if (visibleText || typography.classNames.length > 0) {
      evidence.push("Hito typography role: no confident mapped role; computed typography only.");
    }
  }

  return evidence;
}

function buildDimensionEvidence(element: HTMLElement): InlineChangeDimensionEvidence[] {
  const rect = element.getBoundingClientRect();
  const dimensions: InlineChangeDimensionEvidence[] = [];

  addDimension(dimensions, "width", "Width", rect.width);
  addDimension(dimensions, "height", "Height", rect.height);

  return dimensions;
}

function addDimension(
  dimensions: InlineChangeDimensionEvidence[],
  id: InlineChangeDimensionEvidence["id"],
  label: string,
  value: number,
) {
  if (!Number.isFinite(value) || value <= 0) return;

  dimensions.push({
    id,
    label,
    valueLabel: formatCompactPx(value),
    valuePx: roundPx(value),
  });
}

function buildTypographyEvidence(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
  visibleText: string,
): InlineChangeTypographyEvidence | null {
  const tag = element.tagName.toLowerCase();
  const className = String(element.className ?? "");
  const typographyClasses = className
    .split(/\s+/)
    .filter((classPart) =>
      HITO_TYPOGRAPHY_ROLE_OPTIONS.some((role) => role.className === classPart),
    );
  const hasTextSignal =
    visibleText.length > 0 &&
    (typographyClasses.length > 0 || HEADING_TAGS.has(tag) || TEXT_TAGS.has(tag));

  if (!hasTextSignal) return null;

  const currentRole =
    HITO_TYPOGRAPHY_ROLE_OPTIONS.find((role) => typographyClasses.includes(role.className)) ?? null;

  return {
    classNames: typographyClasses,
    currentRole,
    fontSize: normalizeCssValue(styles.fontSize),
    fontWeight: normalizeCssValue(styles.fontWeight),
    lineHeight: normalizeCssValue(styles.lineHeight),
    options: HITO_TYPOGRAPHY_ROLE_OPTIONS,
    tag,
  };
}

function canExposeTypography(targetKind: InlineChangeTargetKind) {
  return targetKind === "text" || targetKind === "hierarchy";
}

function getDirectTextEvidence(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute("role")?.toLowerCase() ?? null;
  const className = String(element.className ?? "");
  const hasTypographyClass =
    HITO_TYPOGRAPHY_ROLE_OPTIONS.some((option) =>
      className.split(/\s+/).includes(option.className),
    ) || hasHierarchyClass(className);
  const isTextEligibleTag = TEXT_TAGS.has(tag) || HEADING_TAGS.has(tag);
  const isDirectTextCandidate =
    isTextEligibleTag ||
    hasTypographyClass ||
    CONTROL_TAGS.has(tag) ||
    (role != null && CONTROL_ROLES.has(role)) ||
    element.childElementCount === 0;

  if (!isDirectTextCandidate) return "";
  if (element.childElementCount > 1) return "";

  const onlyChild = element.firstElementChild;
  if (onlyChild && !isInlineTextChild(onlyChild)) return "";

  return normalizeVisibleText(element.textContent || "");
}

function isInlineTextChild(element: Element) {
  return /^(abbr|b|code|em|i|kbd|mark|small|span|strong|sub|sup|time)$/.test(
    element.tagName.toLowerCase(),
  );
}

function buildTokenEvidence(styles: CSSStyleDeclaration) {
  const tokenControls: InlineChangeTokenControlInput[] = [];
  const spaceOptions = getSpaceTokenOptions();
  const radiusOptions = getRadiusTokenOptions();

  addTokenControl(
    tokenControls,
    "padding-left",
    "Left padding",
    "spacing",
    parsePixelValue(styles.paddingLeft),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "padding-right",
    "Right padding",
    "spacing",
    parsePixelValue(styles.paddingRight),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "padding-top",
    "Top padding",
    "spacing",
    parsePixelValue(styles.paddingTop),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "padding-bottom",
    "Bottom padding",
    "spacing",
    parsePixelValue(styles.paddingBottom),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "gap-horizontal",
    "Horizontal gap",
    "spacing",
    parsePixelValue(styles.columnGap),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "gap-vertical",
    "Vertical gap",
    "spacing",
    parsePixelValue(styles.rowGap),
    spaceOptions,
  );
  addTokenControl(
    tokenControls,
    "radius-top-right",
    "Top-right radius",
    "radius",
    parsePixelValue(styles.borderTopRightRadius),
    radiusOptions,
  );
  addTokenControl(
    tokenControls,
    "radius-top-left",
    "Top-left radius",
    "radius",
    parsePixelValue(styles.borderTopLeftRadius),
    radiusOptions,
  );
  addTokenControl(
    tokenControls,
    "radius-bottom-right",
    "Bottom-right radius",
    "radius",
    parsePixelValue(styles.borderBottomRightRadius),
    radiusOptions,
  );
  addTokenControl(
    tokenControls,
    "radius-bottom-left",
    "Bottom-left radius",
    "radius",
    parsePixelValue(styles.borderBottomLeftRadius),
    radiusOptions,
  );

  return tokenControls;
}

function addTokenControl(
  controls: InlineChangeTokenControlInput[],
  id: InlineChangeTokenControlInput["id"],
  label: string,
  kind: InlineChangeTokenControlKind,
  value: number | null,
  options: InlineChangeTokenControlOption[],
) {
  if (value == null || value <= 0 || options.length === 0) return;

  const nearest = nearestTokenOption(value, options);
  const cleanMatch = Math.abs(value - nearest.valuePx) <= 0.75;

  controls.push({
    confidence: cleanMatch ? "mapped" : "uncertain",
    currentToken: cleanMatch ? nearest.token : null,
    currentValueLabel: formatCompactPx(value),
    currentValuePx: value,
    id,
    kind,
    label,
    nearestToken: nearest.token,
    nearestValuePx: nearest.valuePx,
    options,
  });
}

function nearestTokenOption(value: number, options: InlineChangeTokenControlOption[]) {
  return options.reduce((nearest, candidate) =>
    Math.abs(candidate.valuePx - value) < Math.abs(nearest.valuePx - value) ? candidate : nearest,
  );
}

function getSpaceTokenOptions(): InlineChangeTokenControlOption[] {
  const rootFontSize = getRootFontSize();
  return HITO_SPACE_SCALE.map(([token, rem]) => {
    const valuePx = rem * rootFontSize;
    return {
      displayValue: formatCompactPx(valuePx),
      token,
      valuePx,
    };
  });
}

function getRadiusTokenOptions(): InlineChangeTokenControlOption[] {
  const baseRadius = getRootRadiusPx();
  return HITO_RADIUS_SCALE.map(([token, pxDelta]) => {
    const valuePx = Math.max(0, baseRadius + pxDelta);
    return {
      displayValue: formatCompactPx(valuePx),
      token,
      valuePx,
    };
  });
}

function getRootFontSize() {
  return parsePixelValue(window.getComputedStyle(document.documentElement).fontSize) ?? 16;
}

function getRootRadiusPx() {
  const root = window.getComputedStyle(document.documentElement);
  const radius = root.getPropertyValue("--radius").trim();
  return parseCssLength(radius) ?? 12;
}

function hasControlClass(className: string) {
  return /\bhito-(button|field|choice-toggle|tab|menu|editable-value-chip|date-field)\b/.test(
    className,
  );
}

function hasHierarchyClass(className: string) {
  return /\bhito-(label|caption|micro|list-row-title|field-helper|status|metadata|badge|pill)\b/.test(
    className,
  );
}

function hasSurfaceSignal(styles: CSSStyleDeclaration, className: string) {
  if (
    /\bhito-(surface|surface-flat|surface-wash|reference-note|reference-row|row-group|card)\b/.test(
      className,
    )
  ) {
    return true;
  }

  const hasShadow = styles.boxShadow !== "none";
  const hasBorder =
    (parsePixelValue(styles.borderTopWidth) ?? 0) > 0 && styles.borderTopStyle !== "none";
  const hasRadius = (parsePixelValue(styles.borderTopLeftRadius) ?? 0) >= 8;
  const hasBackground = hasVisibleBackground(styles.backgroundColor);

  return (hasBorder || hasShadow) && (hasRadius || hasBackground);
}

function hasPositiveSpacing(styles: CSSStyleDeclaration) {
  return [
    styles.paddingBottom,
    styles.paddingLeft,
    styles.paddingRight,
    styles.paddingTop,
    styles.columnGap,
    styles.rowGap,
  ].some((value) => (parsePixelValue(value) ?? 0) > 0);
}

function hasVisibleBackground(backgroundColor: string) {
  return backgroundColor !== "rgba(0, 0, 0, 0)" && backgroundColor !== "transparent";
}

function parsePixelValue(value: string) {
  if (!value || value === "normal") return null;
  const match = value.match(/^(-?\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : null;
}

function parseCssLength(value: string) {
  const px = parsePixelValue(value);
  if (px != null) return px;

  const remMatch = value.match(/^(-?\d+(?:\.\d+)?)rem$/);
  return remMatch ? Number(remMatch[1]) * getRootFontSize() : null;
}

function normalizeVisibleText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

function normalizeCssValue(value: string) {
  const normalized = value.trim();
  return normalized && normalized !== "normal" ? normalized : null;
}

function roundPx(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function formatCompactPx(value: number) {
  return String(roundPx(value));
}
