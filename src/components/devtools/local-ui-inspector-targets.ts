import type {
  InlineChangeBorderEvidence,
  InlineChangeBorderSide,
  InlineChangeBorderSideEvidence,
  InlineChangeCardChromeEvidence,
  InlineChangeDimensionEvidence,
  InlineChangeTargetInput,
  InlineChangeTargetKind,
  InlineChangeTokenControlInput,
  InlineChangeTokenControlOption,
  InlineChangeTokenControlKind,
  InlineChangeTypographyEvidence,
  InlineChangeTypographyRoleOption,
} from "@/components/devtools/local-inline-change-target-utils";
import { HITO_INSPECTOR_TYPOGRAPHY_ROLES } from "@/lib/hito-typography-roles";
import { classifyLocalUiTokenEvidence } from "@/components/devtools/local-ui-inspector-token-evidence";

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

export const HITO_TYPOGRAPHY_ROLE_OPTIONS: InlineChangeTypographyRoleOption[] =
  HITO_INSPECTOR_TYPOGRAPHY_ROLES.map((role) => ({
    className: role.className,
    description: role.description,
    id: role.id,
    label: role.label,
    technicalDetails: role.technicalDetails,
  }));

export function inspectLocalUiTarget(
  element: HTMLElement,
  confirmedAppliedTokens: Record<string, string> = {},
): Pick<
  InlineChangeTargetInput,
  | "classificationReason"
  | "border"
  | "cardChrome"
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
  const tokenControls = buildTokenEvidence(styles, confirmedAppliedTokens);
  const border = buildBorderEvidence(styles);
  const targetKind = classifyTarget(element, styles, visibleText);
  const cardChrome = buildCardChromeEvidence(targetKind, border, tokenControls);
  const typography = canExposeTypography(targetKind)
    ? buildTypographyEvidence(element, styles, visibleText)
    : null;
  const evidenceLines = buildBaseEvidence(
    element,
    styles,
    visibleText,
    dimensions,
    typography,
    border,
  );

  return {
    border,
    cardChrome,
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
  border: InlineChangeBorderEvidence | null,
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
  if (border) evidence.push(`Border: ${border.summary}.`);
  if (dimensions.length > 0) {
    evidence.push(
      `Dimensions: ${dimensions
        .map((dimension) => `${dimension.label.toLowerCase()} ${dimension.valueLabel}px`)
        .join("; ")}.`,
    );
  }
  if (typography) {
    const computedType = [
      typography.fontFamily ? `family ${typography.fontFamily}` : null,
      typography.fontSize ? `font ${typography.fontSize}` : null,
      typography.lineHeight ? `line-height ${typography.lineHeight}` : null,
      typography.fontWeight ? `weight ${typography.fontWeight}` : null,
      typography.letterSpacing ? `letter-spacing ${typography.letterSpacing}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    evidence.push(`Typography: tag ${typography.tag}${computedType ? `; ${computedType}` : ""}.`);
    if (typography.currentRole) {
      evidence.push(
        `Hito typography role: ${typography.currentRole.label} (${typography.currentRole.className}).`,
      );
    } else if (visibleText || typography.classNames.length > 0) {
      evidence.push("Hito typography role: Custom; computed typography only.");
    }
  }

  return evidence;
}

function buildBorderEvidence(styles: CSSStyleDeclaration): InlineChangeBorderEvidence | null {
  const sides = (
    [
      ["top", styles.borderTopWidth, styles.borderTopStyle, styles.borderTopColor],
      ["right", styles.borderRightWidth, styles.borderRightStyle, styles.borderRightColor],
      ["bottom", styles.borderBottomWidth, styles.borderBottomStyle, styles.borderBottomColor],
      ["left", styles.borderLeftWidth, styles.borderLeftStyle, styles.borderLeftColor],
    ] as const
  )
    .map(([side, width, style, color]) => buildBorderSideEvidence(side, width, style, color))
    .filter((side): side is InlineChangeBorderSideEvidence => Boolean(side));

  if (sides.length === 0) return null;

  return {
    label: "Border",
    sides,
    summary: formatBorderSides(sides),
  };
}

function buildBorderSideEvidence(
  side: InlineChangeBorderSide,
  width: string,
  style: string,
  color: string,
): InlineChangeBorderSideEvidence | null {
  const widthPx = parsePixelValue(width);
  if (widthPx == null || widthPx <= 0 || style === "none" || style === "hidden") return null;

  return {
    color: normalizeBorderColor(color),
    side,
    style,
    widthLabel: formatCompactPx(widthPx),
    widthPx,
  };
}

function buildCardChromeEvidence(
  targetKind: InlineChangeTargetKind,
  border: InlineChangeBorderEvidence | null,
  tokenControls: InlineChangeTokenControlInput[],
): InlineChangeCardChromeEvidence | null {
  if (targetKind !== "surface") return null;

  const paddingControls = tokenControls.filter((control) => control.id.startsWith("padding-"));
  const radiusControls = tokenControls.filter((control) => control.kind === "radius");
  const isDetected = Boolean(border || paddingControls.length > 0 || radiusControls.length > 0);
  if (!isDetected) return null;

  return {
    border,
    isDetected,
    paddingControls,
    radiusControls,
  };
}

function formatBorderSides(sides: InlineChangeBorderSideEvidence[]) {
  const [first] = sides;
  const allSame =
    first &&
    sides.every(
      (side) =>
        side.widthLabel === first.widthLabel &&
        side.style === first.style &&
        side.color === first.color,
    );

  if (first && allSame) {
    return `${first.widthLabel}px ${first.style}${first.color ? ` ${first.color}` : ""}`;
  }

  return sides
    .map(
      (side) =>
        `${side.side} ${side.widthLabel}px ${side.style}${side.color ? ` ${side.color}` : ""}`,
    )
    .join("; ");
}

function normalizeBorderColor(color: string) {
  const normalized = normalizeCssValue(color);
  if (!normalized || normalized === "transparent" || normalized === "rgba(0, 0, 0, 0)") {
    return null;
  }

  return normalized;
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
    HITO_TYPOGRAPHY_ROLE_OPTIONS.find((role) => typographyClasses.includes(role.className)) ??
    findComputedTypographyRole(styles);

  return {
    classNames: typographyClasses,
    currentRole,
    fontFamily: normalizeCssValue(styles.fontFamily),
    fontSize: normalizeCssValue(styles.fontSize),
    fontWeight: normalizeCssValue(styles.fontWeight),
    letterSpacing: normalizeCssValue(styles.letterSpacing),
    lineHeight: normalizeCssValue(styles.lineHeight),
    options: HITO_TYPOGRAPHY_ROLE_OPTIONS,
    tag,
  };
}

function findComputedTypographyRole(styles: CSSStyleDeclaration) {
  const fontSizePx = parsePixelValue(styles.fontSize);
  const lineHeightPx = parsePixelValue(styles.lineHeight);
  if (fontSizePx == null || lineHeightPx == null) return null;

  return (
    HITO_INSPECTOR_TYPOGRAPHY_ROLES.find((role) => {
      const match = role.match;
      if (!match) return false;

      const letterSpacingPx = parsePixelValue(styles.letterSpacing);
      const letterSpacingMatches =
        match.letterSpacingPx == null ||
        (letterSpacingPx != null && isNear(letterSpacingPx, match.letterSpacingPx));

      return (
        styles.fontFamily.toLowerCase().includes(match.fontFamilyIncludes.toLowerCase()) &&
        isNear(fontSizePx, match.fontSizePx) &&
        styles.fontWeight === match.fontWeight &&
        isNear(lineHeightPx, match.lineHeightPx) &&
        letterSpacingMatches
      );
    }) ?? null
  );
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

function buildTokenEvidence(
  styles: CSSStyleDeclaration,
  confirmedAppliedTokens: Record<string, string>,
) {
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
    confirmedAppliedTokens["padding-left"],
  );
  addTokenControl(
    tokenControls,
    "padding-right",
    "Right padding",
    "spacing",
    parsePixelValue(styles.paddingRight),
    spaceOptions,
    confirmedAppliedTokens["padding-right"],
  );
  addTokenControl(
    tokenControls,
    "padding-top",
    "Top padding",
    "spacing",
    parsePixelValue(styles.paddingTop),
    spaceOptions,
    confirmedAppliedTokens["padding-top"],
  );
  addTokenControl(
    tokenControls,
    "padding-bottom",
    "Bottom padding",
    "spacing",
    parsePixelValue(styles.paddingBottom),
    spaceOptions,
    confirmedAppliedTokens["padding-bottom"],
  );
  addTokenControl(
    tokenControls,
    "gap-horizontal",
    "Horizontal gap",
    "spacing",
    parsePixelValue(styles.columnGap),
    spaceOptions,
    confirmedAppliedTokens["gap-horizontal"],
  );
  addTokenControl(
    tokenControls,
    "gap-vertical",
    "Vertical gap",
    "spacing",
    parsePixelValue(styles.rowGap),
    spaceOptions,
    confirmedAppliedTokens["gap-vertical"],
  );
  addTokenControl(
    tokenControls,
    "radius-top-right",
    "Top-right radius",
    "radius",
    parsePixelValue(styles.borderTopRightRadius),
    radiusOptions,
    confirmedAppliedTokens["radius-top-right"],
  );
  addTokenControl(
    tokenControls,
    "radius-top-left",
    "Top-left radius",
    "radius",
    parsePixelValue(styles.borderTopLeftRadius),
    radiusOptions,
    confirmedAppliedTokens["radius-top-left"],
  );
  addTokenControl(
    tokenControls,
    "radius-bottom-right",
    "Bottom-right radius",
    "radius",
    parsePixelValue(styles.borderBottomRightRadius),
    radiusOptions,
    confirmedAppliedTokens["radius-bottom-right"],
  );
  addTokenControl(
    tokenControls,
    "radius-bottom-left",
    "Bottom-left radius",
    "radius",
    parsePixelValue(styles.borderBottomLeftRadius),
    radiusOptions,
    confirmedAppliedTokens["radius-bottom-left"],
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
  confirmedAppliedToken?: string,
) {
  if (value == null || value <= 0 || options.length === 0) return;

  const evidence = classifyLocalUiTokenEvidence({ confirmedAppliedToken, options, value });

  controls.push({
    ...evidence,
    currentValueLabel: formatCompactPx(value),
    currentValuePx: value,
    id,
    kind,
    label,
    options,
  });
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
  return /\bhito-(button|field|choice-toggle|tab|menu|editable-value-field|date-field)\b/.test(
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

function isNear(actual: number, expected: number) {
  return Math.abs(actual - expected) <= 0.25;
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
