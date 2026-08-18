import type {
  InlineChangeBorderEvidence,
  InlineChangeBorderIntentEvidence,
  InlineChangeBorderSide,
  InlineChangeBorderSideEvidence,
  InlineChangeCardChromeEvidence,
  InlineChangeColorChannelId,
  InlineChangeColorControlInput,
  InlineChangeColorDeclarationProperty,
  InlineChangeColorSelection,
  InlineChangeColorTokenOption,
  InlineChangeDimensionEvidence,
  InlineChangeTargetInput,
  InlineChangeTargetKind,
  InlineChangeTokenControlInput,
  InlineChangeTokenControlOption,
  InlineChangeTokenControlKind,
  InlineChangeTypographyEvidence,
  InlineChangeTypographyRoleOption,
} from "@/components/devtools/local-inline-change-target-utils";
import { INLINE_CHANGE_ELIGIBLE_CARD_CLASSES } from "@/components/devtools/local-inline-change-target-utils";
import {
  HITO_INSPECTOR_TYPOGRAPHY_ROLES,
  HITO_TYPOGRAPHY_PROVENANCE_PROPERTY,
  HITO_TYPOGRAPHY_ROLES,
  type HitoTypographyRole,
} from "@/lib/hito-typography-roles";
import { classifyLocalUiTokenEvidence } from "@/components/devtools/local-ui-inspector-token-evidence";
import { HITO_DS_MANIFEST } from "@/generated/hito-ds-manifest";

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

const HITO_SEMANTIC_COLORS = HITO_DS_MANIFEST.collections.semanticColor;
const HITO_RADIUS_TOKENS = HITO_DS_MANIFEST.collections.primitiveRadius;
const HITO_SEMANTIC_COLORS_BY_VARIABLE = new Map<string, (typeof HITO_SEMANTIC_COLORS)[number]>(
  HITO_SEMANTIC_COLORS.map((color) => [color.cssVariable, color]),
);
const HITO_PRIMITIVE_COLORS_BY_VARIABLE = new Map<
  string,
  (typeof HITO_DS_MANIFEST.collections.primitiveColor)[number]
>(HITO_DS_MANIFEST.collections.primitiveColor.map((color) => [color.cssVariable, color]));

type RgbaColor = { alpha: number; blue: number; green: number; red: number };

type LocalUiInspectorBoxSides = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type LocalUiInspectorBoxSideLabels = {
  bottom: string;
  left: string;
  right: string;
  top: string;
};

export type LocalUiInspectorOverlayRegion = {
  height: number;
  id: string;
  left: number;
  top: number;
  width: number;
};

export type LocalUiInspectorOverlayGeometry = {
  border: LocalUiInspectorBoxSides;
  gap: {
    column: string;
    disclosure: string;
    regions: LocalUiInspectorOverlayRegion[];
    row: string;
    status: "ambiguous" | "drawable" | "none";
  };
  margin: {
    disclosure: string;
    regions: LocalUiInspectorOverlayRegion[];
    status: "ambiguous" | "drawable" | "none";
    values: LocalUiInspectorBoxSideLabels;
  };
  padding: {
    regions: LocalUiInspectorOverlayRegion[];
    values: LocalUiInspectorBoxSides;
  };
  radius: {
    bottomLeft: string;
    bottomRight: string;
    topLeft: string;
    topRight: string;
  };
};

function toTypographyRoleOption(role: HitoTypographyRole): InlineChangeTypographyRoleOption {
  return {
    className: role.className,
    description: role.description,
    id: role.id,
    label: role.label,
    spec: role.spec,
  };
}

const HITO_TYPOGRAPHY_ROLES_BY_ID = new Map(
  HITO_TYPOGRAPHY_ROLES.map((role) => [role.id, toTypographyRoleOption(role)]),
);

export const HITO_TYPOGRAPHY_ROLE_OPTIONS: InlineChangeTypographyRoleOption[] =
  HITO_INSPECTOR_TYPOGRAPHY_ROLES.map(toTypographyRoleOption);

export function inspectLocalUiTarget(
  element: HTMLElement,
  confirmedAppliedTokens: Record<string, string> = {},
): Pick<
  InlineChangeTargetInput,
  | "classificationReason"
  | "border"
  | "borderIntent"
  | "cardChrome"
  | "colorControls"
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
  const borderIntent = buildBorderIntentEvidence(element, styles);
  const colorControls = buildColorControls(element, styles, visibleText);
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
    borderIntent,
    colorControls,
  );

  return {
    border,
    borderIntent,
    cardChrome,
    colorControls,
    classificationReason: buildClassificationReason(targetKind, tag, role, className, styles),
    dimensions,
    evidenceLines,
    targetKind,
    tokenControls,
    typography,
    visibleText,
  };
}

export function inspectLocalUiOverlayGeometry(
  element: HTMLElement,
): LocalUiInspectorOverlayGeometry {
  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const border = readBoxSides(styles, "border");
  const padding = readBoxSides(styles, "padding");

  return {
    border,
    gap: inspectGapGeometry(element, rect, styles, border, padding),
    margin: inspectMarginGeometry(element, rect, styles),
    padding: {
      regions: buildPaddingRegions(rect, border, padding),
      values: padding,
    },
    radius: {
      bottomLeft: styles.borderBottomLeftRadius,
      bottomRight: styles.borderBottomRightRadius,
      topLeft: styles.borderTopLeftRadius,
      topRight: styles.borderTopRightRadius,
    },
  };
}

function inspectMarginGeometry(
  element: HTMLElement,
  rect: DOMRectReadOnly,
  styles: CSSStyleDeclaration,
): LocalUiInspectorOverlayGeometry["margin"] {
  const rawValues = {
    bottom: styles.marginBottom,
    left: styles.marginLeft,
    right: styles.marginRight,
    top: styles.marginTop,
  };
  const autoSides = getAuthoredAutoMarginSides(element, styles);
  const values = {
    bottom: formatMarginLabel(rawValues.bottom, autoSides.includes("bottom")),
    left: formatMarginLabel(rawValues.left, autoSides.includes("left")),
    right: formatMarginLabel(rawValues.right, autoSides.includes("right")),
    top: formatMarginLabel(rawValues.top, autoSides.includes("top")),
  };
  const numericValues = {
    bottom: parsePixelValue(rawValues.bottom),
    left: parsePixelValue(rawValues.left),
    right: parsePixelValue(rawValues.right),
    top: parsePixelValue(rawValues.top),
  };
  const parsedValues = Object.values(numericValues);
  const hasPositiveMargin = parsedValues.some((value) => value != null && value > 0);

  if (parsedValues.some((value) => value != null && value < 0)) {
    return {
      disclosure: "Margin not painted: negative margin can overlap neighbouring geometry.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  if (!hasPositiveMargin && autoSides.length === 0) {
    return {
      disclosure: "No positive computed margin region.",
      regions: [],
      status: "none",
      values,
    };
  }

  if (autoSides.length > 0) {
    return {
      disclosure: `Margin not painted: ${autoSides.join(", ")} ${autoSides.length === 1 ? "side is" : "sides are"} auto.`,
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  if (parsedValues.some((value) => value == null)) {
    return {
      disclosure: "Margin not painted: a computed side is not a resolved pixel length.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  const parent = element.parentElement;
  if (!parent) {
    return {
      disclosure: "Margin not painted: no direct layout parent is available.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  const parentDisplay = window.getComputedStyle(parent).display;
  if (!isFlexDisplay(parentDisplay) && !isGridDisplay(parentDisplay)) {
    return {
      disclosure: "Margin not painted: block-flow margins may collapse or combine with siblings.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  if (styles.position === "absolute" || styles.position === "fixed") {
    return {
      disclosure: "Margin not painted: positioned-item margin geometry is not a normal-flow band.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  if (!hasOnlyTranslationTransform(styles.transform)) {
    return {
      disclosure: "Margin not painted: transformed item geometry is ambiguous.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  const marginValues = numericValues as LocalUiInspectorBoxSides;
  const regions = buildMarginRegions(rect, marginValues);
  const siblingRects = Array.from(parent.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== element)
    .map((child) => child.getBoundingClientRect())
    .filter((childRect) => childRect.width > 0 && childRect.height > 0);

  if (regions.some((region) => siblingRects.some((sibling) => rectsOverlap(region, sibling)))) {
    return {
      disclosure: "Margin not painted: the computed outside region overlaps a sibling box.",
      regions: [],
      status: "ambiguous",
      values,
    };
  }

  return {
    disclosure: `Painted ${regions.length} unambiguous positive margin ${regions.length === 1 ? "side" : "sides"}.`,
    regions,
    status: regions.length > 0 ? "drawable" : "none",
    values,
  };
}

function inspectGapGeometry(
  element: HTMLElement,
  rect: DOMRectReadOnly,
  styles: CSSStyleDeclaration,
  border: LocalUiInspectorBoxSides,
  padding: LocalUiInspectorBoxSides,
): LocalUiInspectorOverlayGeometry["gap"] {
  const display = styles.display;
  const isFlex = isFlexDisplay(display);
  const isGrid = isGridDisplay(display);
  const columnGap = parsePixelValue(styles.columnGap) ?? 0;
  const rowGap = parsePixelValue(styles.rowGap) ?? 0;
  const base = {
    column: styles.columnGap,
    regions: [] as LocalUiInspectorOverlayRegion[],
    row: styles.rowGap,
  };

  if (!isFlex && !isGrid) {
    return {
      ...base,
      disclosure: `Gap not painted: ${display || "block"} does not establish flex/grid gaps.`,
      status: "none",
    };
  }

  if (columnGap <= 0 && rowGap <= 0) {
    return {
      ...base,
      disclosure: "No positive computed flex/grid gap.",
      status: "none",
    };
  }

  if (isFlex && styles.flexWrap !== "nowrap") {
    return {
      ...base,
      disclosure: "Gap not painted: wrapped flex lines do not expose one unambiguous interval.",
      status: "ambiguous",
    };
  }

  if (!hasOnlyTranslationTransform(styles.transform)) {
    return {
      ...base,
      disclosure: "Gap not painted: transformed container geometry is ambiguous.",
      status: "ambiguous",
    };
  }

  const directChildren = Array.from(element.children);
  const visibleChildren = directChildren
    .map((child) => ({ child, styles: window.getComputedStyle(child) }))
    .filter(({ child, styles: childStyles }) => {
      const childRect = child.getBoundingClientRect();
      return (
        childStyles.display !== "none" &&
        childStyles.visibility !== "hidden" &&
        childRect.width > 0 &&
        childRect.height > 0
      );
    });

  if (visibleChildren.length < 2) {
    return {
      ...base,
      disclosure: "Gap not painted: fewer than two visible direct children establish no interval.",
      status: "none",
    };
  }

  if (
    visibleChildren.some(
      ({ styles: childStyles }) =>
        childStyles.position === "absolute" || childStyles.position === "fixed",
    )
  ) {
    return {
      ...base,
      disclosure: "Gap not painted: a positioned direct child makes the empty interval ambiguous.",
      status: "ambiguous",
    };
  }

  const childGeometry = visibleChildren.map(({ child, styles: childStyles }) => ({
    margins: readResolvedPositiveMargins(child, childStyles),
    rect: child.getBoundingClientRect(),
    transformSafe: hasOnlyTranslationTransform(childStyles.transform),
  }));

  if (childGeometry.some(({ margins, transformSafe }) => !margins || !transformSafe)) {
    return {
      ...base,
      disclosure:
        "Gap not painted: child auto/negative margins or transformed geometry prevent an exact interval.",
      status: "ambiguous",
    };
  }

  const children = childGeometry as Array<{
    margins: LocalUiInspectorBoxSides;
    rect: DOMRectReadOnly;
    transformSafe: true;
  }>;
  const contentRect = getContentRect(rect, border, padding);
  const regions = isFlex
    ? buildFlexGapRegions(children, contentRect, styles, columnGap, rowGap)
    : buildGridGapRegions(children, columnGap, rowGap);

  if (regions.length === 0) {
    return {
      ...base,
      disclosure:
        "Gap not painted: direct-child geometry does not prove an empty interval equal to the computed gap.",
      status: "ambiguous",
    };
  }

  return {
    ...base,
    disclosure: `Painted ${regions.length} verified empty direct-child gap ${regions.length === 1 ? "interval" : "intervals"}.`,
    regions,
    status: "drawable",
  };
}

function buildFlexGapRegions(
  children: Array<{ margins: LocalUiInspectorBoxSides; rect: DOMRectReadOnly }>,
  contentRect: LocalUiInspectorOverlayRegion,
  styles: CSSStyleDeclaration,
  columnGap: number,
  rowGap: number,
) {
  const horizontal = styles.flexDirection === "row" || styles.flexDirection === "row-reverse";
  const gap = horizontal ? columnGap : rowGap;
  if (gap <= 0) return [];

  const ordered = [...children].sort((first, second) =>
    horizontal ? first.rect.left - second.rect.left : first.rect.top - second.rect.top,
  );
  const regions: LocalUiInspectorOverlayRegion[] = [];

  ordered.slice(0, -1).forEach((current, index) => {
    const next = ordered[index + 1];
    if (!next) return;

    const start = horizontal
      ? current.rect.right + current.margins.right
      : current.rect.bottom + current.margins.bottom;
    const end = horizontal ? next.rect.left - next.margins.left : next.rect.top - next.margins.top;
    if (!isNear(end - start, gap)) return;

    addVerifiedGapRegion(
      regions,
      horizontal
        ? {
            height: contentRect.height,
            id: `column-${index}`,
            left: start,
            top: contentRect.top,
            width: gap,
          }
        : {
            height: gap,
            id: `row-${index}`,
            left: contentRect.left,
            top: start,
            width: contentRect.width,
          },
      children,
    );
  });

  return regions;
}

function buildGridGapRegions(
  children: Array<{ margins: LocalUiInspectorBoxSides; rect: DOMRectReadOnly }>,
  columnGap: number,
  rowGap: number,
) {
  const regions: LocalUiInspectorOverlayRegion[] = [];

  children.forEach((first, firstIndex) => {
    children.slice(firstIndex + 1).forEach((second, secondOffset) => {
      const secondIndex = firstIndex + secondOffset + 1;
      const [leftChild, rightChild] =
        first.rect.left <= second.rect.left ? [first, second] : [second, first];
      const horizontalDistance =
        rightChild.rect.left -
        rightChild.margins.left -
        (leftChild.rect.right + leftChild.margins.right);
      const verticalOverlap =
        Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);

      if (columnGap > 0 && verticalOverlap > 0.5 && isNear(horizontalDistance, columnGap)) {
        addVerifiedGapRegion(
          regions,
          {
            height: verticalOverlap,
            id: `column-${firstIndex}-${secondIndex}`,
            left: leftChild.rect.right + leftChild.margins.right,
            top: Math.max(first.rect.top, second.rect.top),
            width: columnGap,
          },
          children,
        );
      }

      const [topChild, bottomChild] =
        first.rect.top <= second.rect.top ? [first, second] : [second, first];
      const verticalDistance =
        bottomChild.rect.top -
        bottomChild.margins.top -
        (topChild.rect.bottom + topChild.margins.bottom);
      const horizontalOverlap =
        Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);

      if (rowGap > 0 && horizontalOverlap > 0.5 && isNear(verticalDistance, rowGap)) {
        addVerifiedGapRegion(
          regions,
          {
            height: rowGap,
            id: `row-${firstIndex}-${secondIndex}`,
            left: Math.max(first.rect.left, second.rect.left),
            top: topChild.rect.bottom + topChild.margins.bottom,
            width: horizontalOverlap,
          },
          children,
        );
      }
    });
  });

  return regions;
}

function addVerifiedGapRegion(
  regions: LocalUiInspectorOverlayRegion[],
  candidate: LocalUiInspectorOverlayRegion,
  children: Array<{ rect: DOMRectReadOnly }>,
) {
  if (candidate.width <= 0.5 || candidate.height <= 0.5) return;
  if (children.some(({ rect }) => rectsOverlap(candidate, rect))) return;
  if (
    regions.some(
      (region) =>
        isNear(region.left, candidate.left) &&
        isNear(region.top, candidate.top) &&
        isNear(region.width, candidate.width) &&
        isNear(region.height, candidate.height),
    )
  ) {
    return;
  }
  regions.push(candidate);
}

function buildPaddingRegions(
  rect: DOMRectReadOnly,
  border: LocalUiInspectorBoxSides,
  padding: LocalUiInspectorBoxSides,
) {
  const innerLeft = rect.left + border.left;
  const innerTop = rect.top + border.top;
  const innerWidth = Math.max(0, rect.width - border.left - border.right);
  const innerHeight = Math.max(0, rect.height - border.top - border.bottom);
  const top = Math.min(padding.top, innerHeight);
  const bottom = Math.min(padding.bottom, Math.max(0, innerHeight - top));
  const middleHeight = Math.max(0, innerHeight - top - bottom);
  const left = Math.min(padding.left, innerWidth);
  const right = Math.min(padding.right, Math.max(0, innerWidth - left));

  return [
    createOverlayRegion("top", innerLeft, innerTop, innerWidth, top),
    createOverlayRegion(
      "right",
      innerLeft + innerWidth - right,
      innerTop + top,
      right,
      middleHeight,
    ),
    createOverlayRegion("bottom", innerLeft, innerTop + innerHeight - bottom, innerWidth, bottom),
    createOverlayRegion("left", innerLeft, innerTop + top, left, middleHeight),
  ].filter((region): region is LocalUiInspectorOverlayRegion => Boolean(region));
}

function buildMarginRegions(rect: DOMRectReadOnly, margin: LocalUiInspectorBoxSides) {
  return [
    createOverlayRegion(
      "top",
      rect.left - margin.left,
      rect.top - margin.top,
      rect.width + margin.left + margin.right,
      margin.top,
    ),
    createOverlayRegion("right", rect.right, rect.top, margin.right, rect.height),
    createOverlayRegion(
      "bottom",
      rect.left - margin.left,
      rect.bottom,
      rect.width + margin.left + margin.right,
      margin.bottom,
    ),
    createOverlayRegion("left", rect.left - margin.left, rect.top, margin.left, rect.height),
  ].filter((region): region is LocalUiInspectorOverlayRegion => Boolean(region));
}

function createOverlayRegion(id: string, left: number, top: number, width: number, height: number) {
  if (width <= 0.5 || height <= 0.5) return null;
  return { height, id, left, top, width };
}

function getContentRect(
  rect: DOMRectReadOnly,
  border: LocalUiInspectorBoxSides,
  padding: LocalUiInspectorBoxSides,
): LocalUiInspectorOverlayRegion {
  const left = rect.left + border.left + padding.left;
  const top = rect.top + border.top + padding.top;
  return {
    height: Math.max(0, rect.height - border.top - border.bottom - padding.top - padding.bottom),
    id: "content",
    left,
    top,
    width: Math.max(0, rect.width - border.left - border.right - padding.left - padding.right),
  };
}

function readBoxSides(styles: CSSStyleDeclaration, kind: "border" | "padding") {
  return kind === "border"
    ? {
        bottom: parsePixelValue(styles.borderBottomWidth) ?? 0,
        left: parsePixelValue(styles.borderLeftWidth) ?? 0,
        right: parsePixelValue(styles.borderRightWidth) ?? 0,
        top: parsePixelValue(styles.borderTopWidth) ?? 0,
      }
    : {
        bottom: parsePixelValue(styles.paddingBottom) ?? 0,
        left: parsePixelValue(styles.paddingLeft) ?? 0,
        right: parsePixelValue(styles.paddingRight) ?? 0,
        top: parsePixelValue(styles.paddingTop) ?? 0,
      };
}

function readResolvedPositiveMargins(
  element: Element,
  styles: CSSStyleDeclaration,
): LocalUiInspectorBoxSides | null {
  const numericMargins = [
    parsePixelValue(styles.marginTop),
    parsePixelValue(styles.marginRight),
    parsePixelValue(styles.marginBottom),
    parsePixelValue(styles.marginLeft),
  ];
  const autoSides = numericMargins.some((value) => value != null && value > 0)
    ? getAuthoredAutoMarginSides(element, styles)
    : [];
  const sides = [
    {
      auto: autoSides.includes("top"),
      side: "top" as const,
      value: parsePixelValue(styles.marginTop),
    },
    {
      auto: autoSides.includes("right"),
      side: "right" as const,
      value: parsePixelValue(styles.marginRight),
    },
    {
      auto: autoSides.includes("bottom"),
      side: "bottom" as const,
      value: parsePixelValue(styles.marginBottom),
    },
    {
      auto: autoSides.includes("left"),
      side: "left" as const,
      value: parsePixelValue(styles.marginLeft),
    },
  ];
  if (sides.some(({ auto, value }) => auto || value == null || value < 0)) return null;

  return Object.fromEntries(
    sides.map(({ side, value }) => [side, value]),
  ) as LocalUiInspectorBoxSides;
}

function getAuthoredAutoMarginSides(
  element: Element,
  styles: CSSStyleDeclaration,
): Array<"bottom" | "left" | "right" | "top"> {
  const autoSides = new Set<"bottom" | "left" | "right" | "top">();
  const collect = (declaration: CSSStyleDeclaration) => {
    const { blockEnd, blockStart, inlineEnd, inlineStart } = getLogicalMarginSides(styles);
    const properties: Array<[string, "bottom" | "left" | "right" | "top"]> = [
      ["margin-top", "top"],
      ["margin-right", "right"],
      ["margin-bottom", "bottom"],
      ["margin-left", "left"],
      ["margin-block-start", blockStart],
      ["margin-block-end", blockEnd],
      ["margin-inline-start", inlineStart],
      ["margin-inline-end", inlineEnd],
    ];

    properties.forEach(([property, side]) => {
      if (declaration.getPropertyValue(property).trim().toLowerCase() === "auto") {
        autoSides.add(side);
      }
    });
  };
  const visitRules = (rules: CSSRuleList) => {
    Array.from(rules).forEach((rule) => {
      if (
        typeof CSSMediaRule !== "undefined" &&
        rule instanceof CSSMediaRule &&
        !window.matchMedia(rule.conditionText).matches
      ) {
        return;
      }
      if (
        typeof CSSSupportsRule !== "undefined" &&
        rule instanceof CSSSupportsRule &&
        !CSS.supports(rule.conditionText)
      ) {
        return;
      }

      if (rule instanceof CSSStyleRule) {
        try {
          if (element.matches(rule.selectorText)) collect(rule.style);
        } catch {
          // Nested or browser-specific selectors can be unreadable without making geometry false.
        }
      }

      const nestedRules = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
      if (nestedRules) visitRules(nestedRules);
    });
  };

  if ("style" in element) {
    collect((element as HTMLElement | SVGElement).style);
  }
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      visitRules(sheet.cssRules);
    } catch {
      // Cross-origin sheets do not expose rules; computed values remain the factual fallback.
    }
  });

  return ["top", "right", "bottom", "left"].filter((side) =>
    autoSides.has(side as "bottom" | "left" | "right" | "top"),
  ) as Array<"bottom" | "left" | "right" | "top">;
}

function getLogicalMarginSides(styles: CSSStyleDeclaration) {
  const vertical = styles.writingMode.startsWith("vertical");
  if (!vertical) {
    return {
      blockEnd: "bottom" as const,
      blockStart: "top" as const,
      inlineEnd: styles.direction === "rtl" ? ("left" as const) : ("right" as const),
      inlineStart: styles.direction === "rtl" ? ("right" as const) : ("left" as const),
    };
  }

  const blockStartsLeft = styles.writingMode === "vertical-lr";
  return {
    blockEnd: blockStartsLeft ? ("right" as const) : ("left" as const),
    blockStart: blockStartsLeft ? ("left" as const) : ("right" as const),
    inlineEnd: styles.direction === "rtl" ? ("top" as const) : ("bottom" as const),
    inlineStart: styles.direction === "rtl" ? ("bottom" as const) : ("top" as const),
  };
}

function formatMarginLabel(value: string, isAuto: boolean) {
  return isAuto ? `${value} (auto)` : value;
}

function hasOnlyTranslationTransform(transform: string) {
  if (!transform || transform === "none") return true;
  if (typeof DOMMatrixReadOnly === "undefined") return false;

  try {
    const matrix = new DOMMatrixReadOnly(transform);
    return (
      matrix.is2D &&
      isNear(matrix.a, 1) &&
      isNear(matrix.b, 0) &&
      isNear(matrix.c, 0) &&
      isNear(matrix.d, 1)
    );
  } catch {
    return false;
  }
}

function isFlexDisplay(display: string) {
  return display === "flex" || display === "inline-flex";
}

function isGridDisplay(display: string) {
  return display === "grid" || display === "inline-grid";
}

function rectsOverlap(
  first: Pick<DOMRectReadOnly, "bottom" | "left" | "right" | "top"> | LocalUiInspectorOverlayRegion,
  second: Pick<DOMRectReadOnly, "bottom" | "left" | "right" | "top">,
) {
  const firstRight = "right" in first ? first.right : first.left + first.width;
  const firstBottom = "bottom" in first ? first.bottom : first.top + first.height;
  return (
    Math.min(firstRight, second.right) - Math.max(first.left, second.left) > 0.5 &&
    Math.min(firstBottom, second.bottom) - Math.max(first.top, second.top) > 0.5
  );
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
  borderIntent: InlineChangeBorderIntentEvidence | null,
  colorControls: InlineChangeColorControlInput[],
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
  if (borderIntent) {
    evidence.push(
      `Border intent eligibility: ${borderIntent.eligibleCardClass}; computed ${borderIntent.summary}.`,
    );
  }
  colorControls.forEach((control) => {
    evidence.push(
      `Color ${control.label}: ${control.currentLabel}; computed ${control.currentHex}; alpha ${control.alphaPercent}%.`,
    );
  });
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
      typography.textTransform && typography.textTransform !== "none"
        ? `text-transform ${typography.textTransform}`
        : null,
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

function buildColorControls(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
  visibleText: string,
): InlineChangeColorSelection[] {
  const controls: InlineChangeColorSelection[] = [];

  if (paintsVisibleTextOrCurrentColorIcon(element, styles, visibleText)) {
    addColorControl(controls, {
      color: styles.color,
      declarationProperty: "color",
      id: "text",
      label: "Text",
    });
  }

  if (styles.backgroundImage.trim() === "none") {
    addColorControl(controls, {
      color: styles.backgroundColor,
      declarationProperty: "background-color",
      id: "fill",
      label: "Fill",
    });
  }

  const uniformBorderColor = getUniformBorderColor(styles);
  if (uniformBorderColor) {
    addColorControl(controls, {
      color: uniformBorderColor,
      declarationProperty: "border-color",
      id: "border",
      label: "Border",
    });
  }

  return controls;
}

function addColorControl(
  controls: InlineChangeColorSelection[],
  {
    color,
    declarationProperty,
    id,
    label,
  }: {
    color: string;
    declarationProperty: InlineChangeColorDeclarationProperty;
    id: InlineChangeColorChannelId;
    label: InlineChangeColorControlInput["label"];
  },
) {
  const currentRgba = resolveColorToRgba(color);
  if (!currentRgba || currentRgba.alpha === 0) return;

  const options = getSemanticColorOptions(id);
  const matchingOptions = options.filter(
    (option) => option.previewColor === formatRgba(currentRgba),
  );
  const currentToken = matchingOptions.length === 1 ? (matchingOptions[0] ?? null) : null;

  controls.push({
    alphaPercent: getAlphaPercent(currentRgba),
    currentColor: formatRgba(currentRgba),
    currentHex: formatRgbaHex(currentRgba),
    currentLabel: currentToken?.label ?? "Custom (computed)",
    currentToken,
    declarationProperty,
    id,
    label,
    options,
    requestedChange: null,
  });
}

function paintsVisibleTextOrCurrentColorIcon(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
  visibleText: string,
) {
  if (styles.display === "none" || styles.visibility === "hidden" || Number(styles.opacity) === 0) {
    return false;
  }

  return visibleText.length > 0 || paintsCurrentColorIcon(element);
}

function paintsCurrentColorIcon(element: HTMLElement) {
  return Array.from(element.querySelectorAll("svg")).some((svg) => {
    const paintedElements = [svg, ...Array.from(svg.querySelectorAll("[fill], [stroke]"))];

    return paintedElements.some((paintedElement) => {
      const fill = paintedElement.getAttribute("fill")?.trim().toLowerCase();
      const stroke = paintedElement.getAttribute("stroke")?.trim().toLowerCase();
      return fill === "currentcolor" || stroke === "currentcolor";
    });
  });
}

function getUniformBorderColor(styles: CSSStyleDeclaration) {
  const visibleSides = [
    [styles.borderTopWidth, styles.borderTopStyle, styles.borderTopColor],
    [styles.borderRightWidth, styles.borderRightStyle, styles.borderRightColor],
    [styles.borderBottomWidth, styles.borderBottomStyle, styles.borderBottomColor],
    [styles.borderLeftWidth, styles.borderLeftStyle, styles.borderLeftColor],
  ].filter(([width, style]) => isVisibleBorderSide(width, style));
  const first = visibleSides[0];
  if (!first) return null;

  const firstColor = first[2];
  return visibleSides.every(([, , color]) => color === firstColor) ? firstColor : null;
}

function isVisibleBorderSide(width: string, style: string) {
  return (parsePixelValue(width) ?? 0) > 0 && style !== "none" && style !== "hidden";
}

function getSemanticColorOptions(
  channel: InlineChangeColorChannelId,
): InlineChangeColorTokenOption[] {
  const theme = getActiveTheme();
  const options: InlineChangeColorTokenOption[] = [];

  HITO_SEMANTIC_COLORS.forEach((color) => {
    if (!color.channels.some((availableChannel) => availableChannel === channel)) return;

    const resolved = resolveColorToRgba(resolveManifestColorValue(color.cssVariable, theme));
    if (!resolved) return;

    const mode = color.modes[theme];
    options.push({
      alphaPercent: getAlphaPercent(resolved),
      cssVariable: color.cssVariable,
      id: color.id,
      label: color.label,
      previewColor: formatRgba(resolved),
      resolvedHex: formatRgbaHex(resolved),
      source: getSemanticColorSource(mode.value, theme),
    });
  });

  return options;
}

function getActiveTheme(): "dark" | "light" {
  return document.documentElement.dataset.hitoTheme === "light" ? "light" : "dark";
}

function resolveManifestColorValue(
  cssVariable: string,
  theme: "dark" | "light",
  depth = 0,
): string {
  if (depth > 12) return cssVariable;

  const semanticColor = HITO_SEMANTIC_COLORS_BY_VARIABLE.get(cssVariable);
  if (semanticColor) {
    return resolveManifestColorValue(semanticColor.modes[theme].value, theme, depth + 1);
  }

  const primitiveColor = HITO_PRIMITIVE_COLORS_BY_VARIABLE.get(cssVariable);
  if (primitiveColor) return primitiveColor.value;

  return cssVariable.replace(/var\((--[\w-]+)\)/g, (_match, variable: string) =>
    resolveManifestColorValue(variable, theme, depth + 1),
  );
}

function getSemanticColorSource(value: string, theme: "dark" | "light") {
  const alias = value.match(/^var\((--[\w-]+)\)$/)?.[1];
  if (!alias) return value.includes("color-mix(") ? value : null;

  const resolved = resolveManifestColorValue(alias, theme);
  const primitive = HITO_DS_MANIFEST.collections.primitiveColor.find(
    (color) => color.value === resolved,
  );
  return primitive?.cssVariable ?? value;
}

function resolveColorToRgba(value: string): RgbaColor | null {
  if (!value || typeof document === "undefined" || !CSS.supports("color", value)) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

  return { alpha, blue, green, red };
}

function formatRgba({ alpha, blue, green, red }: RgbaColor) {
  return `rgb(${red} ${green} ${blue} / ${Number((alpha / 255).toFixed(3))})`;
}

function formatRgbaHex({ alpha, blue, green, red }: RgbaColor) {
  const hex = [red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("");
  return alpha === 255
    ? `#${hex.toUpperCase()}`
    : `#${hex}${alpha.toString(16).padStart(2, "0")}`.toUpperCase();
}

function getAlphaPercent({ alpha }: RgbaColor) {
  return Math.round((alpha / 255) * 100);
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

function buildBorderIntentEvidence(
  element: HTMLElement,
  styles: CSSStyleDeclaration,
): InlineChangeBorderIntentEvidence | null {
  const eligibleCardClass = getEligibleBorderIntentCardClass(element);
  if (!eligibleCardClass) return null;

  const sides = (
    [
      ["top", styles.borderTopWidth, styles.borderTopStyle, styles.borderTopColor],
      ["right", styles.borderRightWidth, styles.borderRightStyle, styles.borderRightColor],
      ["bottom", styles.borderBottomWidth, styles.borderBottomStyle, styles.borderBottomColor],
      ["left", styles.borderLeftWidth, styles.borderLeftStyle, styles.borderLeftColor],
    ] as const
  ).map(([side, width, style, color]) =>
    buildComputedBorderSideEvidence(side, width, style, color),
  );

  return {
    eligibleCardClass,
    label: "Border",
    sides,
    summary: formatComputedBorderIntentSummary(sides),
  };
}

function getEligibleBorderIntentCardClass(element: HTMLElement) {
  if (
    element.matches('[data-hito-component="popover"], .hito-shell-profile-trigger') ||
    (element.matches("button, input, select, textarea, [role='button']") &&
      element.getAttribute("data-hito-component") !== "navigation-card" &&
      !element.classList.contains("hito-launch-surface"))
  ) {
    return null;
  }

  return (
    INLINE_CHANGE_ELIGIBLE_CARD_CLASSES.find((className) =>
      element.classList.contains(className),
    ) ?? null
  );
}

function buildComputedBorderSideEvidence(
  side: InlineChangeBorderSide,
  width: string,
  style: string,
  color: string,
): InlineChangeBorderSideEvidence {
  const widthPx = parsePixelValue(width) ?? 0;
  const hasBorder = widthPx > 0 && style !== "none" && style !== "hidden";

  return {
    color: hasBorder ? normalizeBorderColor(color) : null,
    side,
    style: hasBorder ? style : "none",
    widthLabel: hasBorder ? formatCompactPx(widthPx) : "0",
    widthPx: hasBorder ? widthPx : 0,
  };
}

function formatComputedBorderIntentSummary(sides: InlineChangeBorderSideEvidence[]) {
  if (sides.every((side) => side.widthPx === 0)) return "0 on all sides";
  return formatBorderSides(sides);
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
  const provenanceRoleId = normalizeCssValue(
    styles.getPropertyValue(HITO_TYPOGRAPHY_PROVENANCE_PROPERTY),
  );
  const currentRole = provenanceRoleId
    ? (HITO_TYPOGRAPHY_ROLES_BY_ID.get(provenanceRoleId) ?? null)
    : null;
  const hasProvenanceText =
    currentRole != null && normalizeVisibleText(element.textContent || "").length > 0;
  const hasTextSignal =
    (visibleText.length > 0 || hasProvenanceText) &&
    (currentRole != null ||
      typographyClasses.length > 0 ||
      HEADING_TAGS.has(tag) ||
      TEXT_TAGS.has(tag));

  if (!hasTextSignal) return null;

  return {
    classNames: typographyClasses,
    currentRole,
    fontFamily: normalizeComputedTypographyValue(styles.fontFamily),
    fontFeatureSettings: normalizeComputedTypographyValue(styles.fontFeatureSettings),
    fontSize: normalizeComputedTypographyValue(styles.fontSize),
    fontStyle: normalizeComputedTypographyValue(styles.fontStyle),
    fontVariantNumeric: normalizeComputedTypographyValue(styles.fontVariantNumeric),
    fontVariationSettings: normalizeComputedTypographyValue(styles.fontVariationSettings),
    fontWeight: normalizeComputedTypographyValue(styles.fontWeight),
    letterSpacing: normalizeComputedTypographyValue(styles.letterSpacing),
    lineHeight: normalizeComputedTypographyValue(styles.lineHeight),
    options: HITO_TYPOGRAPHY_ROLE_OPTIONS,
    tag,
    textTransform: normalizeComputedTypographyValue(styles.textTransform),
  };
}

function canExposeTypography(targetKind: InlineChangeTargetKind) {
  return targetKind === "text" || targetKind === "hierarchy" || targetKind === "control";
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
  if (baseRadius == null) return [];

  return HITO_RADIUS_TOKENS.flatMap(({ cssVariable, value }) => {
    const valuePx = resolveRadiusValue(value, baseRadius);
    if (valuePx == null) return [];

    return {
      displayValue: formatCompactPx(valuePx),
      token: cssVariable,
      valuePx,
    };
  });
}

function resolveRadiusValue(value: string, baseRadius: number) {
  if (value === "var(--radius)") return baseRadius;

  const relativeRadius = value.match(
    /^calc\(var\(--radius\) (?<operator>[+-]) (?<offset>\d+(?:\.\d+)?)px\)$/,
  );
  if (!relativeRadius?.groups) return null;

  const offset = Number(relativeRadius.groups.offset);
  return Math.max(0, baseRadius + (relativeRadius.groups.operator === "+" ? offset : -offset));
}

function getRootFontSize() {
  return parsePixelValue(window.getComputedStyle(document.documentElement).fontSize) ?? 16;
}

function getRootRadiusPx() {
  const root = window.getComputedStyle(document.documentElement);
  const radius = root.getPropertyValue("--radius").trim();
  return parseCssLength(radius);
}

function hasControlClass(className: string) {
  return /\bhito-(button|field|choice-toggle|tab|menu|editable-value-field|date-field)\b/.test(
    className,
  );
}

function hasHierarchyClass(className: string) {
  return /\bhito-(display-title-(?:xl|lg)|ui-title-(?:xl|lg|md|sm|xs)|body-(?:lg|md|sm|xs)|label-(?:md|sm)|technical-sm|list-row-(?:title|copy)|field-(?:helper|error|success)|editable-value-field-error|menu-text|metric-value|status-pill|metadata|badge|pill)\b/.test(
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

function normalizeComputedTypographyValue(value: string) {
  return value.trim() || null;
}

function roundPx(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function formatCompactPx(value: number) {
  return String(roundPx(value));
}
