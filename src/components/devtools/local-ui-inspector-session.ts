import type { HitoDsOwnershipEvidence } from "@/components/hito-ds/reference-metadata";
import type {
  InlineChangeBorderIntentSelection,
  InlineChangeChromeRemovalSelection,
  InlineChangeFixScope,
  InlineChangeTargetInput,
  InlineChangeTargetPayload,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  INLINE_CHANGE_BORDER_SIDES,
  formatInlineChangeBorderIntentSelection,
  normalizeInlineChangeBorderIntentSelection,
} from "@/components/devtools/local-inline-change-target-utils";

export const LOCAL_UI_INSPECTOR_BATCH_LIMIT = 8;

export type LocalUiScopedComponentActionScope = Extract<
  InlineChangeFixScope,
  "screen" | "component"
>;

export type LocalUiComponentAction =
  | { type: "add_to_ds" }
  | { scope: LocalUiScopedComponentActionScope; type: "remove_instance" }
  | { scope: LocalUiScopedComponentActionScope; type: "reuse_existing_component" }
  | null;

export type LocalUiInspectorItemDraft = {
  actionId: string | null;
  borderIntentSelection: InlineChangeBorderIntentSelection | null;
  chromeRemovalSelection: InlineChangeChromeRemovalSelection | null;
  comment: string;
  componentAction: LocalUiComponentAction;
  desiredTokens: Record<string, string>;
  desiredTypographyRole: string | null;
  fixScope: InlineChangeFixScope;
  proposedText: string;
};

export type LocalUiInspectorBatchItem = {
  capturedAt: string;
  draft: LocalUiInspectorItemDraft;
  id: string;
  ownership: HitoDsOwnershipEvidence;
  payload: InlineChangeTargetPayload;
  routeKey: string;
  target: InlineChangeTargetInput;
};

export function createLocalUiInspectorItemDraft(
  target: InlineChangeTargetInput,
  actionId: string | null = getDefaultActionId(target),
): LocalUiInspectorItemDraft {
  return {
    actionId,
    borderIntentSelection: null,
    chromeRemovalSelection: null,
    comment: "",
    componentAction: null,
    desiredTokens: {},
    desiredTypographyRole: null,
    fixScope: "screen",
    proposedText: target.visibleText ?? "",
  };
}

function getDefaultActionId(target: InlineChangeTargetInput) {
  const hasEditableText =
    (target.targetKind === "text" || target.targetKind === "hierarchy") &&
    Boolean(target.visibleText?.trim());
  return hasEditableText ? "edit_text" : null;
}

export function createLocalUiInspectorBatchItem({
  draft,
  id,
  ownership,
  payload,
  routeKey,
  target,
}: {
  draft: LocalUiInspectorItemDraft;
  id?: string;
  ownership: HitoDsOwnershipEvidence;
  payload: InlineChangeTargetPayload;
  routeKey: string;
  target: InlineChangeTargetInput;
}): LocalUiInspectorBatchItem {
  return {
    capturedAt: new Date().toISOString(),
    draft: normalizeLocalUiInspectorItemDraft(draft),
    id: id ?? createLocalItemId(),
    ownership,
    payload,
    routeKey,
    target,
  };
}

export function normalizeLocalUiInspectorItemDraft(
  draft: LocalUiInspectorItemDraft,
): LocalUiInspectorItemDraft {
  const legacyChromeRemoval = draft.chromeRemovalSelection as unknown as { kind?: string } | null;
  const historicBorderIntent: InlineChangeBorderIntentSelection | null =
    legacyChromeRemoval?.kind === "border"
      ? { sides: [...INLINE_CHANGE_BORDER_SIDES], treatment: "none" }
      : null;

  return {
    ...draft,
    actionId: historicBorderIntent && draft.actionId === "remove_border" ? null : draft.actionId,
    borderIntentSelection:
      normalizeInlineChangeBorderIntentSelection(draft.borderIntentSelection) ??
      historicBorderIntent,
    chromeRemovalSelection:
      legacyChromeRemoval?.kind === "card_chrome" ? draft.chromeRemovalSelection : null,
  };
}

export function getLocalUiInspectorTargetKey(
  routeKey: string,
  target: Pick<InlineChangeTargetInput, "selector" | "targetKind">,
) {
  const selector = target.selector?.trim() || (target.targetKind === "behavior" ? "__page__" : "");
  return selector ? `${routeKey}::${selector}` : null;
}

export function findDuplicateLocalUiInspectorItem(
  items: LocalUiInspectorBatchItem[],
  routeKey: string,
  target: Pick<InlineChangeTargetInput, "selector" | "targetKind">,
) {
  const targetKey = getLocalUiInspectorTargetKey(routeKey, target);
  if (!targetKey) return null;

  return (
    items.find((item) => getLocalUiInspectorTargetKey(item.routeKey, item.target) === targetKey) ??
    null
  );
}

export function updateLocalUiInspectorBatchItem(
  items: LocalUiInspectorBatchItem[],
  nextItem: LocalUiInspectorBatchItem,
) {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function getLocalUiInspectorItemSummary(item: LocalUiInspectorBatchItem) {
  if (item.draft.componentAction?.type === "remove_instance") return "Remove object";
  if (item.draft.componentAction?.type === "add_to_ds") return "Add to design system";
  if (item.draft.componentAction?.type === "reuse_existing_component") {
    return "Reuse existing component";
  }
  if (item.payload.target.proposedText !== null) {
    const textRequest = item.payload.target.proposedText
      ? `Replace text with “${item.payload.target.proposedText}”`
      : "Remove text";
    return item.payload.comment ? `${textRequest} · ${item.payload.comment}` : textRequest;
  }
  if (item.payload.comment) return item.payload.comment;
  if (item.payload.target.colorControls.some((control) => control.requestedChange)) {
    return item.payload.target.colorControls.some(
      (control) => control.requestedChange?.kind === "remove_declaration",
    )
      ? "Remove selected color"
      : "Update selected color";
  }
  if (item.payload.target.borderIntent?.requestedChange) {
    return formatInlineChangeBorderIntentSelection(
      item.payload.target.borderIntent.requestedChange,
    );
  }
  if (item.payload.target.tokenControls.length > 0) return "Update selected properties";
  if (item.payload.target.typographyRoleSelection?.desiredRole) {
    return `Use ${item.payload.target.typographyRoleSelection.desiredRole.label}`;
  }
  if (item.payload.target.chromeRemoval) return "Remove selected chrome";
  return item.payload.action.label;
}

export function getLocalUiInspectorTargetLabel(target: InlineChangeTargetInput) {
  return (
    target.targetLabel ??
    target.componentId ??
    target.selector ??
    target.elementTag ??
    "Selected element"
  );
}

export function isLocalUiInspectorTargetPresent(target: InlineChangeTargetInput) {
  if (typeof document === "undefined") return false;
  if (target.targetKind === "behavior") return true;
  if (!target.selector) return false;

  try {
    return Boolean(document.querySelector(target.selector));
  } catch {
    return false;
  }
}

export function resolveLocalUiInspectorTarget(target: InlineChangeTargetInput) {
  if (typeof document === "undefined" || !target.selector) return null;

  try {
    const element = document.querySelector(target.selector);
    return element instanceof HTMLElement ? element : null;
  } catch {
    return null;
  }
}

function createLocalItemId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-ui-${Date.now().toString(36)}`;
}
