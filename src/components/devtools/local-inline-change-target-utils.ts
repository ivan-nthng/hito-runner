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
  technicalDetails?: string;
};

export type InlineChangeTypographyEvidence = {
  classNames: string[];
  currentRole: InlineChangeTypographyRoleOption | null;
  fontFamily: string | null;
  fontSize: string | null;
  fontWeight: string | null;
  letterSpacing: string | null;
  lineHeight: string | null;
  options: InlineChangeTypographyRoleOption[];
  tag: string;
};

export type InlineChangeTypographySelection = {
  currentDetails: string | null;
  currentIsCustom: boolean;
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
  id: InlineChangeTokenControlId;
  kind: InlineChangeTokenControlKind;
  label: string;
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

export type InlineChangeCardChromeEvidence = {
  border: InlineChangeBorderEvidence | null;
  isDetected: boolean;
  paddingControls: InlineChangeTokenControlInput[];
  radiusControls: InlineChangeTokenControlInput[];
};

export type InlineChangeChromeRemovalKind = "border" | "card_chrome";

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
  cardChrome?: InlineChangeCardChromeEvidence | null;
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
    cardChrome: InlineChangeCardChromeEvidence | null;
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
    "All cards like this",
    "Find the reused component or pattern that renders similar elements and apply the change there when appropriate.",
  ],
  [
    "hito_ds",
    "Design system",
    "Inspect or update the Hito DS primitive, token, or variant; this may affect every usage of that system owner.",
  ],
];

export const INLINE_CHANGE_SCOPE_OPTIONS: InlineChangeScopeOption[] =
  INLINE_CHANGE_SCOPE_ENTRIES.map(([id, label, description]) => ({ description, id, label }));

export const INLINE_CHANGE_ACTIONS: InlineChangeAction[] = [
  ["edit_text", "Edit text", "Text / Copy", "copy"],
  ["comment", "Comment", "UI Note", "frontend"],
  ["remove_border", "Remove border", "Surface / Chrome", "frontend"],
  ["remove_card_chrome", "Card chrome", "Surface / Chrome", "frontend"],
  ["remove_component", "Remove component", "Component / Structure", "frontend"],
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
      proposedText: normalizeTargetValue(target.proposedText),
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
      cardChrome: normalizeCardChromeEvidence(target.cardChrome),
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

export function buildInlineChangePrompt(payload: InlineChangeTargetPayload) {
  const proposedText =
    payload.action.type === "edit_text"
      ? `- Proposed text: ${payload.target.proposedText ?? "Not provided"}`
      : null;
  const observedEvidence =
    payload.target.evidence.length > 0
      ? payload.target.evidence.map((line) => `- ${line}`)
      : ["- No extra target evidence captured."];
  const tokenControlEvidence =
    payload.target.tokenControls.length > 0
      ? payload.target.tokenControls.map(formatTokenControlPromptLine)
      : [];
  const chromeRemovalEvidence = payload.target.chromeRemoval
    ? [formatChromeRemovalPromptLine(payload.target.chromeRemoval)]
    : [];
  const typographyEvidence = payload.target.typographyRoleSelection?.desiredRole
    ? [formatTypographyPromptLine(payload.target.typographyRoleSelection)]
    : [];
  const promptActionEvidence = payload.target.promptAction
    ? [formatPromptActionLine(payload.target.promptAction, payload.fixScope)]
    : [];
  const selectedChanges =
    chromeRemovalEvidence.length > 0 ||
    tokenControlEvidence.length > 0 ||
    typographyEvidence.length > 0 ||
    promptActionEvidence.length > 0
      ? [
          ...chromeRemovalEvidence,
          ...tokenControlEvidence,
          ...typographyEvidence,
          ...promptActionEvidence,
        ]
      : ["- No explicit property change selected."];
  const dsInspection =
    payload.fixScope.id === "hito_ds"
      ? "- Because scope is Design system, inspect /hitoDS, src/components/ui/*, src/components/hito-ds/*, and src/styles.css before changing product surfaces. This is the broadest scope and may affect every usage of the relevant primitive, token, or variant."
      : null;

  return [
    "ROLE: PRODUCT",
    "",
    "Task:",
    "Interpret and route local inspector UI request",
    "",
    "Stage:",
    "PRODUCT routing / local inspector generated prompt",
    "",
    "Product routing instructions:",
    "- Interpret the user comment and inspector evidence before assigning implementation.",
    "- Explain the likely issue in plain language.",
    "- Identify the correct next owner: FRONTEND, DESIGNER, QA, ARCHITECT, BACKEND, or PRODUCT.",
    "- Preserve exact route, target, selector, component, scope, and token evidence in the routed prompt.",
    "- Remove emotional, ambiguous, or unclear wording before writing the final next-role prompt.",
    "- Ask clarification only if the request cannot be safely interpreted from the evidence below.",
    "- Produce exactly one next-role prompt.",
    "- Do not implement the UI change in this PRODUCT routing pass.",
    "",
    "Context:",
    `- Route: ${payload.route.path}`,
    `- Target: ${payload.target.label ?? "Selected UI element"}`,
    `- Target type: ${formatTargetKind(payload.target.kind)}`,
    `- Visible text: ${payload.target.visibleText ?? "Not captured"}`,
    proposedText,
    `- Component/pattern: ${payload.target.componentId ?? "Not captured"}`,
    `- Scope of fix: ${payload.fixScope.label} — ${payload.fixScope.description}`,
    `- Classification: ${payload.target.classificationReason ?? "Best-effort classification was uncertain."}`,
    `- Element: ${payload.target.elementTag ?? "Not captured"}${
      payload.target.elementRole ? ` role=${payload.target.elementRole}` : ""
    }`,
    `- Viewport: ${payload.viewport.width}x${payload.viewport.height}`,
    `- Category: ${payload.action.category}`,
    `- Requested action: ${payload.action.label}`,
    `- Inspector-suggested owner: ${payload.target.suggestedOwner}`,
    `- Comment: ${payload.comment || "No comment provided."}`,
    "",
    "Observed evidence:",
    ...observedEvidence,
    "",
    "Selected DS audit changes:",
    ...selectedChanges,
    "",
    "Constraints:",
    "- Inspect source before changing UI.",
    "- Reuse existing Hito DS primitives/classes.",
    dsInspection,
    "- Do not mutate product data or generated/readback truth from this local generated prompt.",
    "- Do not add persistence or product-data mutation unless the assigned task explicitly owns that contract.",
    "- Keep the fix scoped to the referenced UI target unless source proof shows a shared owner.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function normalizeTargetValue(value: string | null | undefined) {
  const nextValue = value?.trim();
  return nextValue ? nextValue.slice(0, 500) : null;
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
    label: "Remove component",
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
  if (!value) return null;

  const border = normalizeBorderEvidence(value.border);
  const paddingControls = normalizeTokenControlInputs(value.paddingControls);
  const radiusControls = normalizeTokenControlInputs(value.radiusControls);

  if (value.kind === "border" && !border) return null;
  if (
    value.kind === "card_chrome" &&
    !border &&
    paddingControls.length === 0 &&
    radiusControls.length === 0
  ) {
    return null;
  }

  return {
    border,
    kind: value.kind,
    paddingControls,
    radiusControls,
  };
}

function formatTokenControlPromptLine(control: InlineChangeTokenControlSelection) {
  const currentToken = control.currentToken
    ? control.currentToken
    : control.nearestToken
      ? `custom value; nearest ${control.nearestToken}`
      : "custom value; no nearest token";
  const desired = control.desiredToken
    ? `${control.desiredToken} (${control.desiredValueLabel ?? "unknown"}px)`
    : "not selected";

  return `- ${control.label}: current ${control.currentValueLabel}px (${currentToken}); desired ${desired}.`;
}

function formatChromeRemovalPromptLine(selection: InlineChangeChromeRemovalSelection) {
  if (selection.kind === "border") {
    const border = selection.border
      ? formatBorderEvidence(selection.border)
      : "the observed border";
    return `- Remove the border currently ${border} from this selected target. Padding, radius, margin, and content stay unchanged.`;
  }

  const parts = [
    selection.border ? `border ${formatBorderEvidence(selection.border)}` : null,
    selection.radiusControls.length > 0
      ? `radius ${formatObservedControlSet(selection.radiusControls)}`
      : null,
    selection.paddingControls.length > 0
      ? `padding ${formatObservedControlSet(selection.paddingControls)}`
      : null,
  ].filter(Boolean);

  return `- Remove card chrome from this selected target: remove ${parts.join(", ")} where present. Do not delete content, remove margin, or add shadow controls in this slice.`;
}

function formatBorderEvidence(border: InlineChangeBorderEvidence) {
  return border.summary || formatBorderSides(border.sides);
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

function formatObservedControlSet(controls: InlineChangeTokenControlInput[]) {
  const values = controls.map(
    (control) => `${formatControlPartLabel(control.label)} ${control.currentValueLabel}px`,
  );
  return values.join(", ");
}

function formatControlPartLabel(label: string) {
  return label.replace(/\s+(padding|radius)$/i, "").toLowerCase();
}

function normalizeTypographyEvidence(
  value: InlineChangeTypographyEvidence | null | undefined,
): InlineChangeTypographyEvidence | null {
  if (!value?.tag) return null;

  return {
    classNames: value.classNames.slice(0, 6),
    currentRole: normalizeTypographyRole(value.currentRole),
    fontFamily: value.fontFamily,
    fontSize: value.fontSize,
    fontWeight: value.fontWeight,
    letterSpacing: value.letterSpacing,
    lineHeight: value.lineHeight,
    options: value.options
      .map(normalizeTypographyRole)
      .filter((role): role is InlineChangeTypographyRoleOption => Boolean(role))
      .slice(0, 12),
    tag: value.tag,
  };
}

function normalizeTypographySelection(
  value: InlineChangeTypographySelection | null | undefined,
): InlineChangeTypographySelection | null {
  const desiredRole = normalizeTypographyRole(value?.desiredRole);
  if (!desiredRole) return null;

  return {
    currentDetails: normalizeTargetValue(value?.currentDetails)?.slice(0, 180) ?? null,
    currentIsCustom: Boolean(value?.currentIsCustom),
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
    technicalDetails: value.technicalDetails,
  };
}

function formatTypographyPromptLine(selection: InlineChangeTypographySelection) {
  const currentRole = selection.currentRole
    ? formatTypographyRoleForPrompt(selection.currentRole)
    : `Custom${selection.currentDetails ? ` (${selection.currentDetails})` : ""}`;
  const desiredRole = selection.desiredRole
    ? formatTypographyRoleForPrompt(selection.desiredRole)
    : "not selected";

  return `- Typography: current ${currentRole}; desired ${desiredRole}.`;
}

function formatTypographyRoleForPrompt(role: InlineChangeTypographyRoleOption) {
  return `${role.label} (${[role.technicalDetails, role.className].filter(Boolean).join(" · ")})`;
}

function formatPromptActionLine(
  selection: InlineChangePromptActionSelection,
  scope: InlineChangeTargetPayload["fixScope"],
) {
  if (selection.id === "remove_component") {
    return `- Remove component: prompt-only request to remove the selected UI component or element from the selected scope (${scope.label}). Do not delete user data, backend data, generated/readback truth, or unrelated content.`;
  }

  return `- ${selection.label}: prompt-only selected UI action.`;
}

function formatTargetKind(kind: InlineChangeTargetKind) {
  switch (kind) {
    case "text":
      return "Text";
    case "container":
      return "Container / layout";
    case "surface":
      return "Card / surface";
    case "control":
      return "Interactive control";
    case "hierarchy":
      return "Visual hierarchy";
    case "behavior":
      return "Behavior / bug";
    case "unknown":
    default:
      return "Unknown";
  }
}
