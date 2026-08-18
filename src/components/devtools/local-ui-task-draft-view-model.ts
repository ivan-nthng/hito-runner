import {
  getInlineChangeAction,
  type InlineChangeAction,
  type InlineChangeBorderIntentSelection,
  type InlineChangeChromeRemovalSelection,
  type InlineChangeColorSelection,
  type InlineChangePromptActionSelection,
  type InlineChangeTargetInput,
  type InlineChangeTokenControlInput,
  type InlineChangeTokenControlSelection,
  type InlineChangeTypographySelection,
} from "@/components/devtools/local-inline-change-target-utils";

export function buildTypographyRoleSelection(
  typography: InlineChangeTargetInput["typography"],
  desiredRoleId: string | null,
): InlineChangeTypographySelection | null {
  if (!typography || !desiredRoleId) return null;

  const desiredRole = typography.options.find((option) => option.id === desiredRoleId) ?? null;
  if (!desiredRole || desiredRole.id === typography.currentRole?.id) return null;

  return {
    currentRole: typography.currentRole,
    desiredRole,
  };
}

export function getInferredDraftAction(
  tokenControlSelections: InlineChangeTokenControlSelection[],
  colorControlSelections: InlineChangeColorSelection[],
  typographyRoleSelection: InlineChangeTypographySelection | null,
  borderIntentSelection: InlineChangeBorderIntentSelection | null,
  chromeRemovalSelection: InlineChangeChromeRemovalSelection | null,
  promptActionSelection: InlineChangePromptActionSelection | null,
) {
  if (promptActionSelection?.id === "remove_component")
    return getInlineChangeAction("remove_component");
  if (chromeRemovalSelection?.kind === "card_chrome")
    return getInlineChangeAction("remove_card_chrome");
  if (borderIntentSelection?.treatment === "none") return getInlineChangeAction("remove_border");
  if (borderIntentSelection?.treatment === "hairline") {
    return getInlineChangeAction("align_with_hito_ds");
  }
  if (typographyRoleSelection) return getInlineChangeAction("align_typography");
  if (
    colorControlSelections.some((control) => control.requestedChange?.kind === "remove_declaration")
  ) {
    return getInlineChangeAction("remove_color");
  }
  if (colorControlSelections.some((control) => control.requestedChange)) {
    return getInlineChangeAction("align_with_hito_ds");
  }
  if (tokenControlSelections.length === 0) return getInlineChangeAction("comment");

  const firstControl = tokenControlSelections[0];
  if (!firstControl) return getInlineChangeAction("comment");

  const isReduction = tokenControlSelections.every(
    (control) =>
      typeof control.desiredValuePx === "number" && control.desiredValuePx < control.currentValuePx,
  );

  if (!isReduction) return getInlineChangeAction("align_with_hito_ds");

  if (firstControl.id.startsWith("padding-")) return getInlineChangeAction("reduce_padding");
  if (firstControl.id.startsWith("gap-")) return getInlineChangeAction("reduce_gap");
  if (firstControl.id.startsWith("radius-")) return getInlineChangeAction("reduce_radius");

  return getInlineChangeAction("align_with_hito_ds");
}

export function getHasActionableDraft({
  action,
  borderIntentSelection,
  comment,
  currentText,
  proposedText,
  tokenControlSelections,
  colorControlSelections,
  typographyRoleSelection,
  chromeRemovalSelection,
  promptActionSelection,
}: {
  action: InlineChangeAction | null;
  borderIntentSelection: InlineChangeBorderIntentSelection | null;
  chromeRemovalSelection: InlineChangeChromeRemovalSelection | null;
  comment: string;
  currentText: string | null | undefined;
  promptActionSelection: InlineChangePromptActionSelection | null;
  proposedText: string;
  tokenControlSelections: InlineChangeTokenControlSelection[];
  colorControlSelections: InlineChangeColorSelection[];
  typographyRoleSelection: InlineChangeTypographySelection | null;
}) {
  const hasTextChange = getHasProposedTextChange(currentText, proposedText);
  const hasPropertyChange =
    hasTextChange ||
    tokenControlSelections.length > 0 ||
    colorControlSelections.some((control) => control.requestedChange) ||
    Boolean(typographyRoleSelection) ||
    Boolean(borderIntentSelection) ||
    Boolean(chromeRemovalSelection) ||
    Boolean(promptActionSelection);
  if (!action) return comment.trim().length > 0 || hasPropertyChange;

  switch (action.id) {
    case "comment":
    case "bug":
      return comment.trim().length > 0 || hasPropertyChange;
    case "edit_text":
      return hasTextChange;
    case "remove_border":
      return borderIntentSelection?.treatment === "none";
    case "remove_color":
      return colorControlSelections.some(
        (control) => control.requestedChange?.kind === "remove_declaration",
      );
    case "remove_card_chrome":
      return chromeRemovalSelection?.kind === "card_chrome";
    case "remove_component":
      return promptActionSelection?.id === "remove_component";
    case "reduce_padding":
    case "reduce_gap":
    case "reduce_radius":
      return tokenControlSelections.length > 0;
    case "align_typography":
      return Boolean(typographyRoleSelection);
    case "align_with_hito_ds":
      return hasPropertyChange || comment.trim().length > 0;
    default:
      return comment.trim().length > 0 || hasPropertyChange;
  }
}

export function getHasProposedTextChange(
  currentText: string | null | undefined,
  proposedText: string,
) {
  return proposedText.trim() !== (currentText?.trim() ?? "");
}

export function getIsTokenControlActive(
  control: InlineChangeTokenControlInput,
  desiredToken: string | null | undefined,
) {
  const baseToken = getBaseToken(control);
  return Boolean(desiredToken && desiredToken !== baseToken);
}

export function getIsColorControlActive(desiredColor: string | null | undefined) {
  return Boolean(desiredColor && desiredColor !== "__keep");
}

export function getIsObservableTokenControl(control: InlineChangeTokenControlInput) {
  return Boolean(control.currentValueLabel) && control.options.length > 0;
}

export function getBaseToken(control: InlineChangeTokenControlInput) {
  return control.currentToken ?? null;
}
