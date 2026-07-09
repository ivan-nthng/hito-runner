import {
  getInlineChangeAction,
  type InlineChangeAction,
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
  typographyRoleSelection: InlineChangeTypographySelection | null,
) {
  if (typographyRoleSelection) return getInlineChangeAction("align_typography");
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
  comment,
  proposedText,
  tokenControlSelections,
  typographyRoleSelection,
}: {
  action: InlineChangeAction | null;
  comment: string;
  proposedText: string;
  tokenControlSelections: InlineChangeTokenControlSelection[];
  typographyRoleSelection: InlineChangeTypographySelection | null;
}) {
  const hasPropertyChange = tokenControlSelections.length > 0 || Boolean(typographyRoleSelection);
  if (!action) return comment.trim().length > 0 || hasPropertyChange;

  switch (action.id) {
    case "comment":
    case "bug":
      return comment.trim().length > 0 || hasPropertyChange;
    case "edit_text":
      return proposedText.trim().length > 0;
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

export function getIsTokenControlActive(
  control: InlineChangeTokenControlInput,
  desiredToken: string | null | undefined,
) {
  const baseToken = getBaseToken(control);
  return Boolean(desiredToken && desiredToken !== baseToken);
}

export function getIsObservableTokenControl(control: InlineChangeTokenControlInput) {
  return Boolean(control.currentValueLabel) && control.options.length > 0;
}

export function getBaseToken(control: InlineChangeTokenControlInput) {
  return control.currentToken ?? null;
}

export function getHasObservedProperties(
  target: InlineChangeTargetInput,
  tokenControls: InlineChangeTokenControlInput[],
) {
  return tokenControls.length > 0 || Boolean(target.typography);
}
