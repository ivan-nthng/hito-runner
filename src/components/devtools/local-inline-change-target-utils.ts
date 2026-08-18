export type InlineChangeTargetKind =
  | "text"
  | "container"
  | "surface"
  | "control"
  | "hierarchy"
  | "behavior"
  | "unknown";

export type InlineChangeFixScope = "screen" | "component" | "hito_ds";

export type InlineChangeTokenControlId =
  | "padding-left"
  | "padding-right"
  | "padding-top"
  | "padding-bottom"
  | "gap-horizontal"
  | "gap-vertical"
  | "radius-top-right"
  | "radius-top-left"
  | "radius-bottom-right"
  | "radius-bottom-left";

export type InlineChangeTokenControlKind = "radius" | "spacing";

export type InlineChangeColorChannelId = "border" | "fill" | "text";

export type InlineChangeColorDeclarationProperty = "background-color" | "border-color" | "color";

export type InlineChangeColorTokenOption = {
  alphaPercent: number;
  cssVariable: string;
  id: string;
  label: string;
  previewColor: string;
  resolvedHex: string;
  source: string | null;
};

export type InlineChangeColorControlInput = {
  alphaPercent: number;
  currentColor: string;
  currentHex: string;
  currentLabel: string;
  currentToken: InlineChangeColorTokenOption | null;
  declarationProperty: InlineChangeColorDeclarationProperty;
  id: InlineChangeColorChannelId;
  label: "Border" | "Fill" | "Text";
  options: InlineChangeColorTokenOption[];
};

export type InlineChangeColorSelection = InlineChangeColorControlInput & {
  requestedChange:
    | { kind: "remove_declaration"; property: InlineChangeColorDeclarationProperty }
    | { kind: "semantic_token"; token: InlineChangeColorTokenOption }
    | null;
};

export type InlineChangeBorderSide = "bottom" | "left" | "right" | "top";

export type InlineChangeTokenControlOption = {
  displayValue: string;
  token: string;
  valuePx: number;
};

export type InlineChangeDimensionEvidence = {
  id: "height" | "width";
  label: string;
  valueLabel: string;
  valuePx: number;
};

export type InlineChangeTypographyRoleOption = {
  className: string;
  description: string;
  id: string;
  label: string;
  spec: string;
};

export type InlineChangeTypographyEvidence = {
  classNames: string[];
  currentRole: InlineChangeTypographyRoleOption | null;
  fontFamily: string | null;
  fontFeatureSettings: string | null;
  fontSize: string | null;
  fontStyle: string | null;
  fontVariantNumeric: string | null;
  fontVariationSettings: string | null;
  fontWeight: string | null;
  letterSpacing: string | null;
  lineHeight: string | null;
  options: InlineChangeTypographyRoleOption[];
  tag: string;
  textTransform: string | null;
};

export type InlineChangeTypographySelection = {
  currentRole: InlineChangeTypographyRoleOption | null;
  desiredRole: InlineChangeTypographyRoleOption | null;
};

export type InlineChangePromptActionId = "remove_component";

export type InlineChangePromptActionSelection = {
  id: InlineChangePromptActionId;
  label: string;
};

export type InlineChangeTokenControlInput = {
  confidence: "mapped" | "uncertain";
  currentToken: string | null;
  currentValueLabel: string;
  currentValuePx: number;
  evidenceState: "applied_token_confirmed" | "value_matches_token" | "nearest_token" | "no_mapping";
  id: InlineChangeTokenControlId;
  kind: InlineChangeTokenControlKind;
  label: string;
  matchingToken: string | null;
  nearestToken: string | null;
  nearestValuePx: number | null;
  options: InlineChangeTokenControlOption[];
};

export type InlineChangeTokenControlSelection = InlineChangeTokenControlInput & {
  desiredToken: string | null;
  desiredValueLabel: string | null;
  desiredValuePx: number | null;
};

export type InlineChangeBorderSideEvidence = {
  color: string | null;
  side: InlineChangeBorderSide;
  style: string;
  widthLabel: string;
  widthPx: number;
};

export type InlineChangeBorderEvidence = {
  label: "Border";
  sides: InlineChangeBorderSideEvidence[];
  summary: string;
};

export const INLINE_CHANGE_BORDER_SIDES = ["top", "right", "bottom", "left"] as const;

export const INLINE_CHANGE_ELIGIBLE_CARD_CLASSES = [
  "hito-surface",
  "hito-surface-flat",
  "hito-surface-quiet",
  "hito-ds-showcase-card",
  "hito-ds-token-specimen-surface",
  "hito-state-surface",
  "hito-launch-surface",
] as const;

export type InlineChangeEligibleCardClass = (typeof INLINE_CHANGE_ELIGIBLE_CARD_CLASSES)[number];

export type InlineChangeBorderIntentEvidence = {
  eligibleCardClass: InlineChangeEligibleCardClass | "historic-border-removal";
  label: "Border";
  sides: InlineChangeBorderSideEvidence[];
  summary: string;
};

export type InlineChangeBorderIntentTreatment = "hairline" | "none";

export type InlineChangeBorderIntentSelection = {
  sides: InlineChangeBorderSide[];
  treatment: InlineChangeBorderIntentTreatment;
};

export type InlineChangeBorderIntent = {
  current: InlineChangeBorderIntentEvidence;
  requestedChange: InlineChangeBorderIntentSelection | null;
};

export type InlineChangeCardChromeEvidence = {
  border: InlineChangeBorderEvidence | null;
  isDetected: boolean;
  paddingControls: InlineChangeTokenControlInput[];
  radiusControls: InlineChangeTokenControlInput[];
};

export type InlineChangeChromeRemovalKind = "card_chrome";

export type InlineChangeChromeRemovalSelection = {
  border: InlineChangeBorderEvidence | null;
  kind: InlineChangeChromeRemovalKind;
  paddingControls: InlineChangeTokenControlInput[];
  radiusControls: InlineChangeTokenControlInput[];
};

export type InlineChangeAction = {
  category: string;
  defaultOwner: string;
  id: string;
  label: string;
};

export type InlineChangeTargetInput = {
  border?: InlineChangeBorderEvidence | null;
  borderIntent?: InlineChangeBorderIntentEvidence | null;
  borderIntentSelection?: InlineChangeBorderIntentSelection | null;
  cardChrome?: InlineChangeCardChromeEvidence | null;
  colorControls?: InlineChangeColorSelection[] | null;
  classificationReason?: string | null;
  componentId?: string | null;
  chromeRemovalSelection?: InlineChangeChromeRemovalSelection | null;
  dimensions?: InlineChangeDimensionEvidence[] | null;
  elementClasses?: string | null;
  elementRole?: string | null;
  elementTag?: string | null;
  evidenceLines?: string[] | null;
  proposedText?: string | null;
  promptActionSelection?: InlineChangePromptActionSelection | null;
  selector?: string | null;
  suggestedOwner?: string | null;
  targetKind?: InlineChangeTargetKind | null;
  targetLabel?: string | null;
  tokenControls?: InlineChangeTokenControlInput[] | null;
  tokenControlSelections?: InlineChangeTokenControlSelection[] | null;
  typography?: InlineChangeTypographyEvidence | null;
  typographyRoleSelection?: InlineChangeTypographySelection | null;
  visibleText?: string | null;
};

export type InlineChangeTargetPayload = {
  action: {
    category: string;
    label: string;
    type: string;
  };
  comment: string;
  createdAt: string;
  fixScope: {
    description: string;
    id: InlineChangeFixScope;
    label: string;
  };
  localOnly: true;
  route: {
    path: string;
    url: string;
  };
  source: "inline_change_target_local_v1";
  target: {
    classificationReason: string | null;
    border: InlineChangeBorderEvidence | null;
    borderIntent: InlineChangeBorderIntent | null;
    cardChrome: InlineChangeCardChromeEvidence | null;
    colorControls: InlineChangeColorSelection[];
    chromeRemoval: InlineChangeChromeRemovalSelection | null;
    componentId: string | null;
    elementClasses: string | null;
    elementRole: string | null;
    elementTag: string | null;
    evidence: string[];
    dimensions: InlineChangeDimensionEvidence[];
    kind: InlineChangeTargetKind;
    label: string | null;
    proposedText: string | null;
    promptAction: InlineChangePromptActionSelection | null;
    selector: string | null;
    suggestedOwner: string;
    tokenControls: InlineChangeTokenControlSelection[];
    typography: InlineChangeTypographyEvidence | null;
    typographyRoleSelection: InlineChangeTypographySelection | null;
    visibleText: string | null;
  };
  viewport: {
    height: number;
    width: number;
  };
};

type InlineChangeScopeOption = {
  description: string;
  id: InlineChangeFixScope;
  label: string;
};

const INLINE_CHANGE_SCOPE_ENTRIES: Array<[InlineChangeFixScope, string, string]> = [
  [
    "screen",
    "Only here",
    "Change only this selected element, place, screen, or component instance.",
  ],
  [
    "component",
    "All similar instances",
    "Find the reused source owner for matching instances and apply the requested change there when appropriate.",
  ],
  [
    "hito_ds",
    "Design system level",
    "Inspect or update the Hito DS primitive, token, or variant; this may affect every usage of that system owner.",
  ],
];

export const INLINE_CHANGE_SCOPE_OPTIONS: InlineChangeScopeOption[] =
  INLINE_CHANGE_SCOPE_ENTRIES.map(([id, label, description]) => ({ description, id, label }));

export const INLINE_CHANGE_ACTIONS: InlineChangeAction[] = [
  ["edit_text", "Edit text", "Text / Copy", "copy"],
  ["comment", "Comment", "UI Note", "frontend"],
  ["remove_border", "Remove border", "Surface / Chrome", "frontend"],
  ["remove_color", "Remove color", "Color / Styling", "frontend"],
  ["remove_card_chrome", "Card chrome", "Surface / Chrome", "frontend"],
  ["remove_component", "Remove object", "Component / Structure", "frontend"],
  ["reduce_padding", "Reduce padding", "Spacing / Layout", "frontend"],
  ["reduce_gap", "Reduce gap", "Spacing / Layout", "frontend"],
  ["reduce_radius", "Reduce radius", "Surface / Chrome", "frontend"],
  ["align_typography", "Align typography", "Typography", "frontend"],
  ["bug", "Bug", "State / Behavior", "frontend"],
  ["align_with_hito_ds", "Align with Hito DS", "Hito DS Adoption", "frontend"],
].map(([id, label, category, defaultOwner]) => ({ category, defaultOwner, id, label }));

const INLINE_CHANGE_ACTIONS_BY_ID = new Map(
  INLINE_CHANGE_ACTIONS.map((action) => [action.id, action]),
);

const FALLBACK_INLINE_CHANGE_ACTION: InlineChangeAction = {
  id: "bug",
  label: "Bug",
  category: "State / Behavior",
  defaultOwner: "frontend",
};

export function getInlineChangeAction(actionId: string): InlineChangeAction {
  return INLINE_CHANGE_ACTIONS_BY_ID.get(actionId) ?? FALLBACK_INLINE_CHANGE_ACTION;
}

export function normalizeTargetKind(value: InlineChangeTargetInput["targetKind"]) {
  return value ?? "unknown";
}

export function getDefaultFixScope(): InlineChangeFixScope {
  return "screen";
}

export function getFixScopeLabel(scope: InlineChangeFixScope) {
  return INLINE_CHANGE_SCOPE_OPTIONS.find((option) => option.id === scope)?.label ?? scope;
}

export function getFixScopeDescription(scope: InlineChangeFixScope) {
  return (
    INLINE_CHANGE_SCOPE_OPTIONS.find((option) => option.id === scope)?.description ??
    "Use source proof to keep the fix at the smallest correct owner."
  );
}

export function buildTokenControlSelections(
  controls: InlineChangeTokenControlInput[],
  desiredTokens: Record<string, string>,
): InlineChangeTokenControlSelection[] {
  return controls.map((control) => {
    const desiredToken = desiredTokens[control.id] ?? null;
    const desiredOption = control.options.find((option) => option.token === desiredToken) ?? null;

    return {
      ...control,
      desiredToken: desiredOption?.token ?? null,
      desiredValueLabel: desiredOption?.displayValue ?? null,
      desiredValuePx: desiredOption?.valuePx ?? null,
    };
  });
}

export function buildColorControlSelections(
  controls: InlineChangeColorControlInput[],
  desiredTokens: Record<string, string>,
): InlineChangeColorSelection[] {
  return controls.map((control) => {
    const desiredValue = desiredTokens[control.id] ?? null;
    const desiredToken = control.options.find((option) => option.id === desiredValue) ?? null;

    return {
      ...control,
      requestedChange:
        desiredValue === "__remove"
          ? { kind: "remove_declaration", property: control.declarationProperty }
          : desiredToken
            ? { kind: "semantic_token", token: desiredToken }
            : null,
    };
  });
}

export function buildInlineChangePayload({
  action,
  comment,
  fixScope,
  target,
}: {
  action: InlineChangeAction;
  comment: string;
  fixScope: InlineChangeFixScope;
  target: InlineChangeTargetInput;
}): InlineChangeTargetPayload {
  const routePath =
    typeof window === "undefined"
      ? "unknown"
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;

  return {
    source: "inline_change_target_local_v1",
    createdAt: new Date().toISOString(),
    action: {
      type: action.id,
      label: action.label,
      category: action.category,
    },
    comment: comment.trim(),
    target: {
      label: normalizeTargetValue(target.targetLabel),
      proposedText: normalizeProposedTextValue(target.proposedText, target.visibleText),
      promptAction: normalizePromptActionSelection(target.promptActionSelection),
      componentId: normalizeTargetValue(target.componentId),
      selector: normalizeTargetValue(target.selector),
      elementTag: normalizeTargetValue(target.elementTag),
      elementRole: normalizeTargetValue(target.elementRole),
      elementClasses: normalizeTargetValue(target.elementClasses),
      suggestedOwner: target.suggestedOwner?.trim() || action.defaultOwner,
      kind: normalizeTargetKind(target.targetKind),
      classificationReason: normalizeTargetValue(target.classificationReason),
      border: normalizeBorderEvidence(target.border),
      borderIntent: normalizeBorderIntent(target.borderIntent, target.borderIntentSelection),
      cardChrome: normalizeCardChromeEvidence(target.cardChrome),
      colorControls: normalizeColorControlSelections(target.colorControls),
      chromeRemoval: normalizeChromeRemovalSelection(target.chromeRemovalSelection),
      evidence: normalizeList(target.evidenceLines),
      dimensions: normalizeDimensions(target.dimensions),
      tokenControls: normalizeTokenControlSelections(target.tokenControlSelections),
      typography: normalizeTypographyEvidence(target.typography),
      typographyRoleSelection: normalizeTypographySelection(target.typographyRoleSelection),
      visibleText: normalizeTargetValue(target.visibleText),
    },
    fixScope: {
      description: getFixScopeDescription(fixScope),
      id: fixScope,
      label: getFixScopeLabel(fixScope),
    },
    route: {
      path: routePath,
      url: typeof window === "undefined" ? "unknown" : window.location.href,
    },
    viewport: {
      width: typeof window === "undefined" ? 0 : window.innerWidth,
      height: typeof window === "undefined" ? 0 : window.innerHeight,
    },
    localOnly: true,
  };
}

function normalizeTargetValue(value: string | null | undefined) {
  const nextValue = value?.trim();
  return nextValue ? nextValue.slice(0, 500) : null;
}

function normalizeProposedTextValue(
  proposedText: string | null | undefined,
  currentText: string | null | undefined,
) {
  if (proposedText === null || proposedText === undefined) return null;

  const nextValue = proposedText.trim();
  if (nextValue === (currentText?.trim() ?? "")) return null;

  return nextValue ? nextValue.slice(0, 500) : "";
}

function normalizeList(values: string[] | null | undefined) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 14);
}

function normalizePromptActionSelection(
  value: InlineChangePromptActionSelection | null | undefined,
): InlineChangePromptActionSelection | null {
  if (value?.id !== "remove_component") return null;

  return {
    id: "remove_component",
    label: "Remove object",
  };
}

function normalizeDimensions(values: InlineChangeDimensionEvidence[] | null | undefined) {
  return (values ?? [])
    .filter(
      (value) =>
        (value.id === "height" || value.id === "width") &&
        value.label &&
        value.valueLabel &&
        Number.isFinite(value.valuePx),
    )
    .slice(0, 2);
}

function normalizeTokenControlSelections(
  values: InlineChangeTokenControlSelection[] | null | undefined,
) {
  return (values ?? [])
    .filter((value) => value.id && value.label && Number.isFinite(value.currentValuePx))
    .slice(0, 10);
}

function normalizeColorControlSelections(values: InlineChangeColorSelection[] | null | undefined) {
  return (values ?? [])
    .filter(
      (value) =>
        (value.id === "text" || value.id === "fill" || value.id === "border") &&
        value.label &&
        value.currentColor &&
        value.currentHex &&
        Number.isFinite(value.alphaPercent) &&
        (value.declarationProperty === "color" ||
          value.declarationProperty === "background-color" ||
          value.declarationProperty === "border-color"),
    )
    .slice(0, 3)
    .map((value) => ({
      ...value,
      currentToken: normalizeColorTokenOption(value.currentToken),
      options: value.options
        .map(normalizeColorTokenOption)
        .filter((option): option is InlineChangeColorTokenOption => Boolean(option)),
      requestedChange:
        value.requestedChange?.kind === "remove_declaration"
          ? { kind: "remove_declaration" as const, property: value.declarationProperty }
          : value.requestedChange?.kind === "semantic_token"
            ? (() => {
                const token = normalizeColorTokenOption(value.requestedChange.token);
                return token ? ({ kind: "semantic_token" as const, token } as const) : null;
              })()
            : null,
    }));
}

function normalizeColorTokenOption(
  value: InlineChangeColorTokenOption | null | undefined,
): InlineChangeColorTokenOption | null {
  if (
    !value?.id ||
    !value.label ||
    !value.cssVariable ||
    !value.previewColor ||
    !value.resolvedHex ||
    !Number.isFinite(value.alphaPercent)
  ) {
    return null;
  }

  return {
    alphaPercent: value.alphaPercent,
    cssVariable: value.cssVariable,
    id: value.id,
    label: value.label,
    previewColor: value.previewColor,
    resolvedHex: value.resolvedHex,
    source: value.source,
  };
}

function normalizeTokenControlInputs(values: InlineChangeTokenControlInput[] | null | undefined) {
  return (values ?? [])
    .filter((value) => value.id && value.label && Number.isFinite(value.currentValuePx))
    .slice(0, 10);
}

function normalizeBorderEvidence(
  value: InlineChangeBorderEvidence | null | undefined,
): InlineChangeBorderEvidence | null {
  const sides = (value?.sides ?? [])
    .filter(
      (side) =>
        side.side &&
        side.style &&
        side.widthLabel &&
        Number.isFinite(side.widthPx) &&
        side.widthPx > 0,
    )
    .slice(0, 4);
  if (sides.length === 0) return null;

  return {
    label: "Border",
    sides,
    summary: normalizeTargetValue(value?.summary) ?? formatBorderSides(sides),
  };
}

function normalizeBorderIntent(
  evidence: InlineChangeBorderIntentEvidence | null | undefined,
  selection: InlineChangeBorderIntentSelection | null | undefined,
): InlineChangeBorderIntent | null {
  const current = normalizeBorderIntentEvidence(evidence);
  if (!current) return null;

  return {
    current,
    requestedChange: normalizeInlineChangeBorderIntentSelection(selection),
  };
}

function normalizeBorderIntentEvidence(
  value: InlineChangeBorderIntentEvidence | null | undefined,
): InlineChangeBorderIntentEvidence | null {
  if (!value || !isEligibleCardClass(value.eligibleCardClass)) return null;

  const sides = INLINE_CHANGE_BORDER_SIDES.map((side) =>
    normalizeBorderIntentSide(value.sides.find((candidate) => candidate.side === side)),
  );
  if (sides.some((side) => !side)) return null;

  const normalizedSides = sides as InlineChangeBorderSideEvidence[];
  return {
    eligibleCardClass: value.eligibleCardClass,
    label: "Border",
    sides: normalizedSides,
    summary: normalizeTargetValue(value.summary) ?? formatBorderSides(normalizedSides),
  };
}

function normalizeBorderIntentSide(
  value: InlineChangeBorderSideEvidence | null | undefined,
): InlineChangeBorderSideEvidence | null {
  if (
    !value ||
    !INLINE_CHANGE_BORDER_SIDES.includes(value.side) ||
    !value.style ||
    !value.widthLabel ||
    !Number.isFinite(value.widthPx) ||
    value.widthPx < 0
  ) {
    return null;
  }

  return {
    color: value.color,
    side: value.side,
    style: value.style,
    widthLabel: value.widthLabel,
    widthPx: value.widthPx,
  };
}

function isEligibleCardClass(
  value: string,
): value is InlineChangeBorderIntentEvidence["eligibleCardClass"] {
  return value === "historic-border-removal" || INLINE_CHANGE_ELIGIBLE_CARD_CLASS_SET.has(value);
}

const INLINE_CHANGE_ELIGIBLE_CARD_CLASS_SET = new Set<string>(INLINE_CHANGE_ELIGIBLE_CARD_CLASSES);

export function normalizeInlineChangeBorderIntentSelection(
  value: InlineChangeBorderIntentSelection | null | undefined,
): InlineChangeBorderIntentSelection | null {
  if (value?.treatment !== "hairline" && value?.treatment !== "none") return null;

  const selectedSides = new Set(value.sides);
  const sides = INLINE_CHANGE_BORDER_SIDES.filter((side) => selectedSides.has(side));
  if (sides.length === 0) return null;

  return { sides, treatment: value.treatment };
}

export function createHistoricBorderIntentEvidence(
  border: InlineChangeBorderEvidence | null | undefined,
): InlineChangeBorderIntentEvidence {
  const observedSides = new Map((border?.sides ?? []).map((side) => [side.side, side]));
  const sides = INLINE_CHANGE_BORDER_SIDES.map(
    (side): InlineChangeBorderSideEvidence =>
      observedSides.get(side) ?? {
        color: null,
        side,
        style: "none",
        widthLabel: "0",
        widthPx: 0,
      },
  );

  return {
    eligibleCardClass: "historic-border-removal",
    label: "Border",
    sides,
    summary: border?.summary ?? "0",
  };
}

export function formatInlineChangeBorderIntentSelection(value: InlineChangeBorderIntentSelection) {
  const selection = normalizeInlineChangeBorderIntentSelection(value);
  if (!selection) return "No border intent";

  const sideLabel =
    selection.sides.length === INLINE_CHANGE_BORDER_SIDES.length
      ? "All"
      : selection.sides.map(capitalizeBorderSide).join(" + ");
  return `${sideLabel} -> ${selection.treatment === "hairline" ? "Hairline" : "None"}`;
}

function capitalizeBorderSide(value: InlineChangeBorderSide) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeCardChromeEvidence(
  value: InlineChangeCardChromeEvidence | null | undefined,
): InlineChangeCardChromeEvidence | null {
  if (!value?.isDetected) return null;

  const border = normalizeBorderEvidence(value.border);
  const paddingControls = normalizeTokenControlInputs(value.paddingControls);
  const radiusControls = normalizeTokenControlInputs(value.radiusControls);

  if (!border && paddingControls.length === 0 && radiusControls.length === 0) return null;

  return {
    border,
    isDetected: true,
    paddingControls,
    radiusControls,
  };
}

function normalizeChromeRemovalSelection(
  value: InlineChangeChromeRemovalSelection | null | undefined,
): InlineChangeChromeRemovalSelection | null {
  if (!value || (value as { kind?: string }).kind !== "card_chrome") return null;

  const border = normalizeBorderEvidence(value.border);
  const paddingControls = normalizeTokenControlInputs(value.paddingControls);
  const radiusControls = normalizeTokenControlInputs(value.radiusControls);

  if (!border && paddingControls.length === 0 && radiusControls.length === 0) {
    return null;
  }

  return {
    border,
    kind: value.kind,
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

function normalizeTypographyEvidence(
  value: InlineChangeTypographyEvidence | null | undefined,
): InlineChangeTypographyEvidence | null {
  if (!value?.tag) return null;

  return {
    classNames: value.classNames.slice(0, 6),
    currentRole: normalizeTypographyRole(value.currentRole),
    fontFamily: value.fontFamily,
    fontFeatureSettings: value.fontFeatureSettings,
    fontSize: value.fontSize,
    fontStyle: value.fontStyle,
    fontVariantNumeric: value.fontVariantNumeric,
    fontVariationSettings: value.fontVariationSettings,
    fontWeight: value.fontWeight,
    letterSpacing: value.letterSpacing,
    lineHeight: value.lineHeight,
    options: value.options
      .map(normalizeTypographyRole)
      .filter((role): role is InlineChangeTypographyRoleOption => Boolean(role)),
    tag: value.tag,
    textTransform: value.textTransform,
  };
}

function normalizeTypographySelection(
  value: InlineChangeTypographySelection | null | undefined,
): InlineChangeTypographySelection | null {
  const desiredRole = normalizeTypographyRole(value?.desiredRole);
  if (!desiredRole) return null;

  return {
    currentRole: normalizeTypographyRole(value?.currentRole),
    desiredRole,
  };
}

function normalizeTypographyRole(
  value: InlineChangeTypographyRoleOption | null | undefined,
): InlineChangeTypographyRoleOption | null {
  if (!value?.id || !value.className || !value.label) return null;

  return {
    className: value.className,
    description: value.description,
    id: value.id,
    label: value.label,
    spec: value.spec,
  };
}
