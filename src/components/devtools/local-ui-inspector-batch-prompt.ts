import {
  getFixScopeDescription,
  getFixScopeLabel,
} from "@/components/devtools/local-inline-change-target-utils";
import {
  getLocalUiInspectorItemSummary,
  getLocalUiInspectorTargetLabel,
  type LocalUiInspectorBatchItem,
} from "@/components/devtools/local-ui-inspector-session";

export type LocalUiInspectorBatchPromptContext = {
  createdAt?: string;
  pageTitle: string;
  routeKey: string;
  theme: string;
  viewport: { height: number; width: number };
};

export function buildLocalUiInspectorBatchPrompt(
  items: LocalUiInspectorBatchItem[],
  context: LocalUiInspectorBatchPromptContext,
) {
  const createdAt = context.createdAt ?? new Date().toISOString();
  const itemSections = items.map((item, index) => formatBatchItem(item, index + 1));

  return [
    "ROLE: PRODUCT",
    "",
    "Task:",
    "Interpret and route this local Inspector batch",
    "",
    "Stage:",
    "PRODUCT routing / local Inspector generated batch",
    "",
    "Batch context:",
    `- Route: ${context.routeKey}`,
    `- Page title: ${context.pageTitle || "Not captured"}`,
    `- Theme: ${context.theme || "Not captured"}`,
    `- Viewport: ${context.viewport.width}x${context.viewport.height}`,
    `- Items: ${items.length}`,
    `- Created: ${createdAt}`,
    "- Source: local_ui_inspector_batch_v1",
    "- Local-only draft; no product or design-system mutation has occurred.",
    "",
    ...itemSections.flatMap((section, index) => (index === 0 ? section : ["", ...section])),
    "",
    "Product routing instructions:",
    "- Interpret every request against its captured target and evidence before assigning implementation.",
    "- Treat DS ownership as confirmed only when the item contains positive source-backed metadata.",
    "- Inspect source before changing UI and split this packet only if source inspection proves different canonical owners.",
    "- Produce the next-role work without mutating product data, generated/readback truth, or Hito DS registration from this prompt.",
    "- Preserve each item’s route, selector, request, evidence, and scope.",
  ].join("\n");
}

function formatBatchItem(item: LocalUiInspectorBatchItem, index: number) {
  const { payload } = item;
  const scope = formatItemScope(item);
  const tokenLines = (item.target.tokenControls ?? []).map((control) =>
    formatTokenEvidence(control, item.draft.desiredTokens[control.id] ?? null),
  );
  const ownershipLines = formatOwnership(item);
  const componentActionLines = formatComponentAction(item);
  const evidenceLines = payload.target.evidence.length
    ? payload.target.evidence.map((line) => `  - ${line}`)
    : ["  - No additional DOM evidence captured."];

  return [
    `Item ${index}`,
    `- Item id: ${item.id}`,
    `- Captured: ${item.capturedAt}`,
    `- Target: ${getLocalUiInspectorTargetLabel(item.target)}`,
    `- Target kind/tag/role: ${payload.target.kind} · ${payload.target.elementTag ?? "unknown"} · ${payload.target.elementRole ?? "none"}`,
    `- Selector: ${payload.target.selector ?? "Not captured"}`,
    `- Visible text: ${payload.target.visibleText ?? "Not captured"}`,
    `- Request: ${getLocalUiInspectorItemSummary(item)}`,
    `- Comment: ${payload.comment || "Not provided"}`,
    `- Replacement text: ${payload.target.proposedText ?? "Not requested"}`,
    `- Scope: ${scope.label} — ${scope.description}`,
    `- Suggested owner evidence: ${payload.target.suggestedOwner}`,
    ...ownershipLines,
    ...componentActionLines,
    "- Token evidence and requested changes:",
    ...(tokenLines.length ? tokenLines.map((line) => `  - ${line}`) : ["  - None selected."]),
    `- Typography request: ${formatTypography(item)}`,
    `- Chrome request: ${payload.target.chromeRemoval ? payload.target.chromeRemoval.kind : "None"}`,
    "- Observed evidence:",
    ...evidenceLines,
  ];
}

function formatOwnership(item: LocalUiInspectorBatchItem) {
  if (!item.ownership.entry) return [];

  return [
    `- Confirmed DS ${item.ownership.entry.kind}: ${item.ownership.entry.label}.`,
    `- DS source: ${item.ownership.entry.sourcePath}.`,
    `- DS reference: ${item.ownership.entry.referencePath}.`,
  ];
}

function formatComponentAction(item: LocalUiInspectorBatchItem) {
  const action = item.draft.componentAction;
  if (!action) return [];
  if (action.type === "add_to_ds") {
    return [
      "- Design system action: Add to design system.",
      "- Action scope: Design system level proposal.",
      "- Prompt-only request: verify existing source ownership before adding anything; no component has been registered or changed.",
    ];
  }
  const scope = formatItemScope(item);
  if (action.type === "reuse_existing_component") {
    return [
      `- Component reuse action: Reuse existing component at ${scope.label.toLowerCase()}.`,
      "- Prompt-only request: inspect the captured target and current Hito DS source, then reuse the closest existing component or pattern that preserves the target's semantics and behavior when one fits.",
      "- If no existing Hito DS component or pattern fits, report the inspected source and candidate evidence; this Inspector request has not selected, registered, or changed a component.",
    ];
  }
  return [
    `- Object action: Remove object at ${scope.label.toLowerCase()}.`,
    "- Prompt-only request: remove the scoped page object usage without retiring or deleting a shared DS component.",
  ];
}

function formatItemScope(item: LocalUiInspectorBatchItem) {
  const scopeId = item.payload.fixScope.id;
  if (scopeId === "component" && item.payload.target.kind === "surface") {
    return {
      description:
        "Find the reused source owner for matching card instances and apply the request to those cards only.",
      label: "All cards like this",
    };
  }

  return {
    description: getFixScopeDescription(scopeId),
    label: getFixScopeLabel(scopeId),
  };
}

function formatTokenEvidence(
  control: NonNullable<LocalUiInspectorBatchItem["target"]["tokenControls"]>[number],
  desiredToken: string | null,
) {
  const observed = `${control.label}: observed ${control.currentValueLabel}px`;
  const availableToken = control.currentToken ?? control.matchingToken;
  const evidence = availableToken ? `available Hito token ${availableToken}` : null;
  const desiredOption = control.options.find((option) => option.token === desiredToken) ?? null;
  const desired = desiredOption
    ? `requested ${desiredOption.token} (${desiredOption.displayValue}px)`
    : "no desired token selected";

  return [observed, evidence, desired].filter(Boolean).join("; ") + ".";
}

function formatTypography(item: LocalUiInspectorBatchItem) {
  const selection = item.payload.target.typographyRoleSelection;
  if (!selection?.desiredRole) return "None";

  return `${selection.currentRole?.label ?? "Custom"} -> ${selection.desiredRole.label} (${selection.desiredRole.className})`;
}
