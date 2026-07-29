import { useLocation } from "@tanstack/react-router";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LocalScreenCaptureFlow } from "@/components/devtools/LocalScreenCaptureFlow";
import { LocalUiInspectorBatchReview } from "@/components/devtools/LocalUiInspectorBatchReview";
import { LocalUiInspectorModeBar } from "@/components/devtools/LocalUiInspectorModeBar";
import { LocalUiInspectorSurface } from "@/components/devtools/LocalUiInspectorSurface";
import {
  getLocalUiInspectorLauncherPanelPosition,
  getLocalUiInspectorPanelPosition,
  isLocalUiInspectorNarrowViewport,
} from "@/components/devtools/local-ui-inspector-position";
import { LocalUiTaskDraftPanel } from "@/components/devtools/LocalUiTaskDraftPanel";
import type {
  InlineChangeTargetInput,
  InlineChangeTargetPayload,
} from "@/components/devtools/local-inline-change-target-utils";
import { inspectLocalUiTarget } from "@/components/devtools/local-ui-inspector-targets";
import {
  createLocalUiInspectorBatchItem,
  createLocalUiInspectorItemDraft,
  resolveLocalUiInspectorTarget,
  type LocalUiInspectorBatchItem,
  type LocalUiInspectorItemDraft,
} from "@/components/devtools/local-ui-inspector-session";
import { useLocalUiInspectorSession } from "@/components/devtools/use-local-ui-inspector-session";
import { useLocalUiInspectorPortalHost } from "@/components/devtools/use-local-ui-inspector-portal-host";
import {
  getHitoDsAppliedTokenReferences,
  resolveHitoDsOwnershipForElement,
  type HitoDsOwnershipEvidence,
} from "@/components/hito-ds/reference-metadata";

type InspectorMode = "idle" | "inspect" | "screen";

type SelectedTarget = InlineChangeTargetInput & {
  ownership: HitoDsOwnershipEvidence;
  rect: DOMRectReadOnly | null;
};

type ComposerPanelState = {
  anchor?: "launcher";
  initialDraft: LocalUiInspectorItemDraft;
  itemId: string | null;
  kind: "composer";
  notice?: string | null;
  position: { x: number; y: number };
  target: SelectedTarget;
};

type ReviewPanelState = {
  anchor: "launcher";
  autoGenerate: boolean;
  focusItemId: string | null;
  kind: "review";
  position: { x: number; y: number };
};

type InspectorPanelState = ComposerPanelState | ReviewPanelState;

const INSPECTABLE_SELECTOR =
  "button, a, input, textarea, select, [role], [data-hito-ds-pattern], [data-testid], article, section, header, main, aside, nav, form, li, [class]";
const INSPECTOR_LAYER_SELECTOR = "[data-local-ui-inspector-layer]";

export function LocalUiInspector() {
  const location = useLocation();
  const routeKey = `${location.pathname}${
    "searchStr" in location && typeof location.searchStr === "string" ? location.searchStr : ""
  }${location.hash ?? ""}`;
  const session = useLocalUiInspectorSession(routeKey);
  const portalHost = useLocalUiInspectorPortalHost();
  const [mode, setMode] = useState<InspectorMode>("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRectReadOnly | null>(null);
  const [panel, setPanel] = useState<InspectorPanelState | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const panelRef = useRef<InspectorPanelState | null>(null);
  const routeRef = useRef(routeKey);
  const suppressNextLayerClickRef = useRef(false);
  const inspectLauncherRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  useEffect(() => {
    if (routeRef.current === routeKey) return;
    routeRef.current = routeKey;
    setMode("idle");
    setMenuOpen(false);
    setHoverRect(null);
    setPanel(null);
    setStatusMessage("Local Inspector draft cleared after route change.");
  }, [routeKey]);

  const closeInspectorImmediately = useCallback(() => {
    setMode("idle");
    setMenuOpen(false);
    setHoverRect(null);
    setPanel(null);
  }, []);

  const focusInspectLauncher = useCallback(() => {
    const focusLauncher = () => inspectLauncherRef.current?.focus({ preventScroll: true });
    window.requestAnimationFrame(() => {
      focusLauncher();
      window.setTimeout(focusLauncher, 0);
      window.requestAnimationFrame(focusLauncher);
    });
  }, []);

  const showReview = useCallback((focusItemId: string | null, autoGenerate = false) => {
    setPanel({
      anchor: "launcher",
      autoGenerate,
      focusItemId,
      kind: "review",
      position: getLocalUiInspectorLauncherPanelPosition(),
    });
  }, []);

  const openReview = useCallback(() => showReview(null), [showReview]);

  const discardComposerDraft = useCallback(() => {
    const currentPanel = panelRef.current;
    setHoverRect(null);
    setPanel((current) => {
      if (current?.kind === "composer" && current.itemId) {
        return {
          anchor: "launcher",
          autoGenerate: false,
          focusItemId: current.itemId,
          kind: "review",
          position: getLocalUiInspectorLauncherPanelPosition(),
        };
      }
      return null;
    });
    if (currentPanel?.kind === "composer" && !currentPanel.itemId) focusInspectLauncher();
  }, [focusInspectLauncher]);

  const closePanelImmediately = useCallback(() => {
    if (panelRef.current?.kind === "composer") {
      discardComposerDraft();
      return;
    }
    setPanel(null);
    focusInspectLauncher();
  }, [discardComposerDraft, focusInspectLauncher]);

  const requestInspectorExit = useCallback(() => {
    session.resetSession();
    closeInspectorImmediately();
    focusInspectLauncher();
  }, [closeInspectorImmediately, focusInspectLauncher, session]);

  const clearInspectorBatch = useCallback(() => {
    session.resetSession();
    setStatusMessage("Collected Inspector items cleared.");
    setPanel(null);
    focusInspectLauncher();
  }, [focusInspectLauncher, session]);

  useEffect(() => {
    if (mode !== "inspect") {
      setHoverRect(null);
      return;
    }

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [mode]);

  useLayoutEffect(() => {
    if (!portalHost) return;

    const restoreAriaVisibility = () => restoreLocalUiInspectorAriaVisibility();
    restoreAriaVisibility();

    const observer = new MutationObserver(restoreAriaVisibility);
    observer.observe(document.body, {
      attributeFilter: ["aria-hidden", "data-aria-hidden"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [portalHost]);

  useEffect(() => {
    const isolateProductFocusForInspectorLayer = (event: FocusEvent) => {
      const target = event.target;
      const relatedTarget = event.relatedTarget;
      const inspectorFocus =
        (target instanceof Element && target.closest(INSPECTOR_LAYER_SELECTOR)) ||
        (relatedTarget instanceof Element && relatedTarget.closest(INSPECTOR_LAYER_SELECTOR));

      if (!inspectorFocus) return;

      stopNativePropagation(event);
    };

    document.addEventListener("focusin", isolateProductFocusForInspectorLayer);
    document.addEventListener("focusout", isolateProductFocusForInspectorLayer);

    return () => {
      document.removeEventListener("focusin", isolateProductFocusForInspectorLayer);
      document.removeEventListener("focusout", isolateProductFocusForInspectorLayer);
    };
  }, []);

  useEffect(() => {
    const isolateProductDismissForInspectorLayer = (event: Event) => {
      const originalEvent = getDismissableLayerOriginalEvent(event);
      const target = originalEvent?.target;

      if (!(target instanceof Element) || !target.closest(INSPECTOR_LAYER_SELECTOR)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener(
      "dismissableLayer.pointerDownOutside",
      isolateProductDismissForInspectorLayer,
      true,
    );
    window.addEventListener(
      "dismissableLayer.focusOutside",
      isolateProductDismissForInspectorLayer,
      true,
    );

    return () => {
      window.removeEventListener(
        "dismissableLayer.pointerDownOutside",
        isolateProductDismissForInspectorLayer,
        true,
      );
      window.removeEventListener(
        "dismissableLayer.focusOutside",
        isolateProductDismissForInspectorLayer,
        true,
      );
    };
  }, []);

  useEffect(() => {
    if (!panel && mode !== "inspect" && !menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector('[data-local-ui-inspector-layer] [role="tooltip"]')) return;
      const eventTarget = event.target;
      if (eventTarget instanceof Element) {
        const inspectorPopup = eventTarget.closest(
          '[role="dialog"], [role="listbox"], [role="menu"]',
        );
        if (inspectorPopup?.closest("[data-local-ui-inspector-layer]")) return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (panelRef.current) {
        closePanelImmediately();
      } else if (mode === "inspect") {
        requestInspectorExit();
      } else {
        closeInspectorImmediately();
      }
    };

    window.addEventListener("keydown", closeOnEscape, true);

    return () => {
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [
    closeInspectorImmediately,
    closePanelImmediately,
    menuOpen,
    mode,
    panel,
    requestInspectorExit,
  ]);

  useEffect(() => {
    if (!panel) return;

    const closePanelFromOutside = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Element && target.closest("[data-local-ui-inspector-layer]")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closePanelImmediately();
    };

    document.addEventListener("pointerdown", closePanelFromOutside, true);

    return () => {
      document.removeEventListener("pointerdown", closePanelFromOutside, true);
    };
  }, [closePanelImmediately, panel]);

  useEffect(() => {
    if (!panel) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [panel]);

  const startQuickBug = () => {
    setMenuOpen(false);
    setMode("inspect");
    setPanel({
      anchor: "launcher",
      initialDraft: createLocalUiInspectorItemDraft(
        { targetKind: "behavior", visibleText: document.title || "Current screen" },
        "bug",
      ),
      itemId: null,
      kind: "composer",
      position: getLocalUiInspectorLauncherPanelPosition(),
      target: {
        componentId: "LocalUiInspector.bug_prompt",
        elementClasses: null,
        elementRole: null,
        elementTag: "page",
        proposedText: null,
        ownership: { entry: null, marker: null, state: "unconfirmed" },
        rect: null,
        selector: null,
        suggestedOwner: "frontend",
        targetLabel: "Current screen",
        targetKind: "behavior",
        classificationReason:
          "Bug prompt starts from the current screen rather than a selected DOM node.",
        evidenceLines: ["Bug prompt was created from the current route."],
        visibleText: document.title || "Current screen",
      },
    });
  };

  const startScreenCapture = () => {
    setMenuOpen(false);
    setPanel(null);
    setHoverRect(null);
    setMode("screen");
  };

  const updateHoverTarget = (event: ReactPointerEvent<HTMLElement>) => {
    const point = { x: event.clientX, y: event.clientY };
    const target = resolveInspectableElementBehindLayer(event.currentTarget, point);
    setHoverRect(target?.getBoundingClientRect() ?? null);
  };

  const selectHoverTarget = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (panelRef.current) {
      return;
    }

    const point = { x: event.clientX, y: event.clientY };
    const target = resolveInspectableElementBehindLayer(event.currentTarget, point);

    if (!target) {
      setHoverRect(null);
      return;
    }

    const targetDescription = describeTargetElement(target);
    const duplicate = session.findDuplicate(targetDescription);
    suppressNextLayerClickRef.current = true;
    if (duplicate) {
      setPanel({
        initialDraft: duplicate.draft,
        itemId: duplicate.id,
        kind: "composer",
        notice: "Already in batch",
        position: getLocalUiInspectorPanelPosition(
          target.getBoundingClientRect(),
          event.clientX,
          event.clientY,
        ),
        target: {
          ...duplicate.target,
          ownership: duplicate.ownership,
          rect: target.getBoundingClientRect(),
        },
      });
      return;
    }
    setPanel({
      initialDraft: createLocalUiInspectorItemDraft(targetDescription),
      itemId: null,
      kind: "composer",
      position: getLocalUiInspectorPanelPosition(
        target.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      ),
      target: targetDescription,
    });
  };

  const closeFromHitLayerClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (suppressNextLayerClickRef.current) {
      suppressNextLayerClickRef.current = false;
      return;
    }

    if (panelRef.current) closePanelImmediately();
  };

  const editBatchItem = (item: LocalUiInspectorBatchItem) => {
    const element = resolveLocalUiInspectorTarget(item.target);
    const rect = element?.getBoundingClientRect() ?? null;
    setPanel({
      initialDraft: item.draft,
      itemId: item.id,
      kind: "composer",
      notice: rect ? null : "Target no longer found",
      position: rect
        ? getLocalUiInspectorPanelPosition(rect, rect.right, rect.top)
        : getLocalUiInspectorLauncherPanelPosition(),
      target: { ...item.target, ownership: item.ownership, rect },
    });
  };

  const commitComposer = ({
    draft,
    intent,
    payload,
  }: {
    draft: LocalUiInspectorItemDraft;
    intent: "add" | "generate";
    payload: InlineChangeTargetPayload;
  }) => {
    const currentPanel = panelRef.current;
    if (currentPanel?.kind !== "composer") return;
    const target = stripLiveTarget(currentPanel.target);
    const existing = currentPanel.itemId
      ? (session.items.find((item) => item.id === currentPanel.itemId) ?? null)
      : null;
    const created = createLocalUiInspectorBatchItem({
      draft,
      id: existing?.id,
      ownership: currentPanel.target.ownership,
      payload,
      routeKey,
      target,
    });
    const nextItem = existing ? { ...created, capturedAt: existing.capturedAt } : created;

    if (existing) {
      session.replaceItem(nextItem);
      setStatusMessage("Item updated.");
      if (intent === "generate") {
        showReview(existing.id, true);
      } else if (isLocalUiInspectorNarrowViewport()) {
        setPanel(null);
        focusInspectLauncher();
      } else {
        showReview(existing.id);
      }
    } else if (!session.isFull) {
      session.addItem(nextItem);
      if (intent === "generate") {
        setStatusMessage("Prompt generated from the current Inspector item.");
        showReview(nextItem.id, true);
      } else {
        setStatusMessage("Item added to the Inspector list.");
        setPanel(null);
        focusInspectLauncher();
      }
    }
    setHoverRect(null);
  };

  if (!portalHost) return null;

  return createPortal(
    <div
      data-local-ui-inspector-layer=""
      data-local-ui-inspector-root=""
      className="pointer-events-auto fixed bottom-5 right-5 z-[90]"
      onClick={stopDevtoolEvent}
      onFocus={stopDevtoolEvent}
      onPointerDown={stopDevtoolEvent}
    >
      {mode === "inspect" ? (
        <div
          data-local-ui-inspector-hit-layer=""
          data-local-ui-inspector-layer=""
          className="fixed inset-0 z-[88] cursor-crosshair bg-transparent"
          onClick={closeFromHitLayerClick}
          onPointerDown={selectHoverTarget}
          onPointerMove={updateHoverTarget}
          onPointerUp={stopDevtoolEvent}
        />
      ) : null}
      {panel?.kind === "composer" && panel.target.rect ? (
        <InspectorHighlight rect={panel.target.rect} selected />
      ) : hoverRect ? (
        <InspectorHighlight rect={hoverRect} />
      ) : null}
      {panel ? (
        <LocalUiInspectorSurface
          ariaLabel={
            panel.kind === "review" ? "Local Inspector batch review" : "Local UI item composer"
          }
          onClose={closePanelImmediately}
          onInternalPointerEnd={() => {
            suppressNextLayerClickRef.current = false;
          }}
          onInternalPointerStart={() => {
            suppressNextLayerClickRef.current = true;
          }}
          placement={{
            anchor: panel.anchor,
            position: panel.position,
            targetRect: panel.kind === "composer" ? panel.target.rect : null,
          }}
        >
          {panel.kind === "composer" ? (
            <LocalUiTaskDraftPanel
              batchFull={session.isFull}
              initialDraft={panel.initialDraft}
              itemNumber={
                panel.itemId
                  ? session.items.findIndex((item) => item.id === panel.itemId) + 1
                  : undefined
              }
              notice={panel.notice}
              onCancel={closePanelImmediately}
              onSubmit={commitComposer}
              ownership={panel.target.ownership}
              target={panel.target}
            />
          ) : (
            <LocalUiInspectorBatchReview
              autoGenerate={panel.autoGenerate}
              initialFocusItemId={panel.focusItemId}
              items={session.items}
              onClear={clearInspectorBatch}
              onClose={() => {
                setPanel(null);
                focusInspectLauncher();
              }}
              onContinue={() => {
                setPanel(null);
                focusInspectLauncher();
              }}
              onEdit={editBatchItem}
              onRemove={(itemId) => {
                session.removeItem(itemId);
                setStatusMessage("Item removed from local draft.");
                if (session.items.length === 1) {
                  setPanel(null);
                  focusInspectLauncher();
                }
              }}
              routeKey={routeKey}
            />
          )}
        </LocalUiInspectorSurface>
      ) : null}
      {mode === "screen" ? <LocalScreenCaptureFlow onClose={closeInspectorImmediately} /> : null}

      {mode === "screen" ? (
        <button
          ref={inspectLauncherRef}
          type="button"
          className="hito-button hito-button-secondary hito-button-md relative z-[83] aspect-square rounded-full px-0 shadow-soft"
          aria-label="Cancel local screen capture"
          title="Cancel local screen capture"
          onClick={closeInspectorImmediately}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            closeInspectorImmediately();
          }}
        >
          <Icon name="close" size="sm" />
        </button>
      ) : mode === "idle" ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              ref={inspectLauncherRef}
              type="button"
              className="hito-button hito-button-primary hito-button-md aspect-square rounded-full px-0 shadow-soft"
              aria-label="Open local UI task tools"
              title="Open local UI task tools"
            >
              <Icon name="plus" size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-local-ui-inspector-layer=""
            align="end"
            sideOffset={8}
            className="z-[94] min-w-44"
            onClick={stopDevtoolEvent}
            onFocus={stopDevtoolEvent}
            onPointerDown={stopDevtoolEvent}
          >
            <DropdownMenuLabel>Local UI tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setMode("inspect");
                setPanel(null);
              }}
            >
              <Icon name="edit" size="sm" />
              Pencil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={startQuickBug}>
              <Icon name="warning" size="sm" />
              Bug prompt
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={startScreenCapture}>
              <Icon name="camera" size="sm" />
              Screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {mode === "inspect" ? (
        <LocalUiInspectorModeBar
          itemCount={session.items.length}
          reviewOpen={panel?.kind === "review"}
          onExit={requestInspectorExit}
          onOpenReview={openReview}
          ref={inspectLauncherRef}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
    </div>,
    portalHost,
  );
}

function InspectorHighlight({
  rect,
  selected = false,
}: {
  rect: DOMRectReadOnly;
  selected?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-local-ui-inspector-selected-highlight={selected ? "" : undefined}
      className={`pointer-events-none fixed z-[89] rounded-md border border-signal bg-signal/10 ${
        selected
          ? "shadow-[0_0_0_4px_rgba(98,228,255,0.24),0_0_30px_rgba(98,228,255,0.18)]"
          : "shadow-[0_0_0_3px_rgba(98,228,255,0.16)]"
      }`}
      style={{
        height: `${Math.max(rect.height, 2)}px`,
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${Math.max(rect.width, 2)}px`,
      }}
    />
  );
}

function stripLiveTarget(target: SelectedTarget): InlineChangeTargetInput {
  const { ownership, rect, ...serializableTarget } = target;
  void ownership;
  void rect;
  return serializableTarget;
}

function resolveInspectableElement(target: EventTarget | null, point?: { x: number; y: number }) {
  if (!(target instanceof Element)) return null;
  if (target.closest(INSPECTOR_LAYER_SELECTOR)) return null;

  const preciseTarget = findPreciseInspectableDescendant(target);
  if (preciseTarget) return preciseTarget;

  const control = target.closest<HTMLElement>("button, a, input, textarea, select");
  if (control && !control.closest(INSPECTOR_LAYER_SELECTOR)) return control;

  const directTarget = target instanceof HTMLElement ? target : target.parentElement;
  if (directTarget && isTextLikeTarget(directTarget)) return directTarget;

  const layoutOwner = directTarget ? findAuditableLayoutOwner(directTarget) : null;
  if (layoutOwner) return layoutOwner;

  const surface = findSurfaceChromeAncestor(target, point);
  if (surface) return surface;

  const selectable = target.closest<HTMLElement>(INSPECTABLE_SELECTOR);

  if (!selectable || selectable === document.body || selectable === document.documentElement) {
    return null;
  }

  return selectable;
}

function isTextLikeTarget(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  const visibleText = normalizeVisibleText(element.innerText || element.textContent || "");
  const className = String(element.className ?? "");
  const hasTypographyClass =
    /\bhito-(display-title|page-title|section-title|panel-title|list-row-title|body|body-small|caption|label|technical-mono)\b/.test(
      className,
    );

  const maxChildCount = hasTypographyClass ? 2 : 1;

  return (
    visibleText.length > 0 &&
    element.childElementCount <= maxChildCount &&
    (hasTypographyClass || /^(h[1-6]|p|span|small|strong|label|figcaption|legend)$/.test(tag))
  );
}

function findPreciseInspectableDescendant(target: Element) {
  let current: Element | null = target;
  let depth = 0;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement &&
    depth < 4
  ) {
    if (current.closest(INSPECTOR_LAYER_SELECTOR)) return null;

    if (current instanceof HTMLElement && isTextLikeTarget(current)) return current;
    if (current.matches("button, a, input, textarea, select")) return null;

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function findAuditableLayoutOwner(start: HTMLElement) {
  let current: HTMLElement | null = start;
  let depth = 0;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement &&
    depth < 6
  ) {
    if (current.closest(INSPECTOR_LAYER_SELECTOR)) return null;
    if (current.matches("button, a, input, textarea, select")) return null;

    if (getAuditableOwnerScore(current) >= 5 && !isPageSizedElement(current)) {
      return current;
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function getAuditableOwnerScore(element: HTMLElement) {
  const className = String(element.className ?? "");
  const styles = window.getComputedStyle(element);
  let score = 0;

  if (
    /\bhito-(surface|surface-flat|surface-wash|reference-note|reference-row|row-group|list-row|card)\b|\bsurface\b|\bcard\b/.test(
      className,
    )
  ) {
    score += 4;
  }
  if (styles.display.includes("flex") || styles.display.includes("grid")) score += 2;
  if (hasPositiveSpacing(styles)) score += 2;
  if ((parsePixelValue(styles.columnGap) ?? 0) > 0 || (parsePixelValue(styles.rowGap) ?? 0) > 0) {
    score += 2;
  }
  if ((parsePixelValue(styles.borderTopLeftRadius) ?? 0) > 0) score += 1;
  if (looksLikeSurface(element)) score += 2;
  if (element.childElementCount > 1) score += 1;

  return score;
}

function isPageSizedElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return rect.width > window.innerWidth * 0.92 && rect.height > window.innerHeight * 0.86;
}

function resolveInspectableElementBehindLayer(layer: HTMLElement, point: { x: number; y: number }) {
  const previousPointerEvents = layer.style.pointerEvents;
  layer.style.pointerEvents = "none";

  try {
    return resolveInspectableElement(document.elementFromPoint(point.x, point.y), point);
  } finally {
    layer.style.pointerEvents = previousPointerEvents;
  }
}

function findSurfaceChromeAncestor(target: Element, point?: { x: number; y: number }) {
  let current = target instanceof HTMLElement ? target : target.parentElement;

  while (current && current !== document.body && current !== document.documentElement) {
    if (current.closest(INSPECTOR_LAYER_SELECTOR)) return null;

    if (looksLikeSurface(current) && (!point || isPointNearChrome(current, point))) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function looksLikeSurface(element: HTMLElement) {
  const className = String(element.className ?? "");
  if (/\bhito-(surface|row-group|card)\b|\bsurface\b|\bcard\b/.test(className)) return true;

  const styles = window.getComputedStyle(element);
  const hasShadow = styles.boxShadow !== "none";
  const hasBorder =
    (parsePixelValue(styles.borderTopWidth) ?? 0) > 0 && styles.borderTopStyle !== "none";
  const hasRadius = (parsePixelValue(styles.borderTopLeftRadius) ?? 0) >= 8;
  const hasBackground =
    styles.backgroundColor !== "rgba(0, 0, 0, 0)" && styles.backgroundColor !== "transparent";

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

function isPointNearChrome(element: HTMLElement, point: { x: number; y: number }) {
  const rect = element.getBoundingClientRect();
  const chromeInset = Math.min(24, Math.max(8, Math.min(rect.width, rect.height) * 0.12));

  return (
    point.x - rect.left <= chromeInset ||
    rect.right - point.x <= chromeInset ||
    point.y - rect.top <= chromeInset ||
    rect.bottom - point.y <= chromeInset
  );
}

function describeTargetElement(element: HTMLElement): SelectedTarget {
  const rect = element.getBoundingClientRect();
  const elementClasses = element.className ? String(element.className).trim().slice(0, 300) : null;
  const ownership = resolveHitoDsOwnershipForElement(element);
  const targetInspection = inspectLocalUiTarget(
    element,
    getHitoDsAppliedTokenReferences(ownership, elementClasses ?? ""),
  );
  const targetLabel =
    element.getAttribute("aria-label") ||
    element.getAttribute("data-hito-ds-pattern") ||
    element.getAttribute("data-testid") ||
    element.id ||
    describeStableTag(element);

  return {
    componentId: ownership.entry?.id ?? null,
    ...targetInspection,
    elementClasses,
    elementRole: element.getAttribute("role"),
    elementTag: element.tagName.toLowerCase(),
    proposedText: null,
    ownership,
    rect,
    selector: buildSelector(element),
    suggestedOwner: "frontend",
    targetLabel,
    visibleText: targetInspection.visibleText,
  };
}

function stopDevtoolEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function stopNativePropagation(event: Event) {
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function restoreLocalUiInspectorAriaVisibility() {
  document
    .querySelectorAll<HTMLElement>(
      [
        `${INSPECTOR_LAYER_SELECTOR}[aria-hidden="true"]`,
        `${INSPECTOR_LAYER_SELECTOR}[data-aria-hidden]`,
        `${INSPECTOR_LAYER_SELECTOR} [aria-hidden="true"]`,
        `${INSPECTOR_LAYER_SELECTOR} [data-aria-hidden]`,
      ].join(", "),
    )
    .forEach((element) => {
      element.removeAttribute("aria-hidden");
      element.removeAttribute("data-aria-hidden");
    });
}

function getDismissableLayerOriginalEvent(event: Event) {
  if (!("detail" in event)) return null;
  const detail = (event as CustomEvent<{ originalEvent?: Event }>).detail;
  return detail?.originalEvent ?? null;
}

function buildSelector(element: HTMLElement) {
  const testId = element.getAttribute("data-testid");
  if (testId) {
    const selector = `[data-testid="${escapeSelectorValue(testId)}"]`;
    if (isUniqueSelector(selector)) return selector;
  }

  const pattern = element.getAttribute("data-hito-ds-pattern");
  if (pattern) {
    const selector = `[data-hito-ds-pattern="${escapeSelectorValue(pattern)}"]`;
    if (isUniqueSelector(selector)) return selector;
  }

  if (element.id) return `#${escapeSelectorValue(element.id)}`;

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    const selector = `${element.tagName.toLowerCase()}[aria-label="${escapeSelectorValue(ariaLabel)}"]`;
    if (isUniqueSelector(selector)) return selector;
  }

  const classSelector = String(element.className)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((className) => `.${escapeSelectorValue(className)}`)
    .join("");

  const classCandidate = `${element.tagName.toLowerCase()}${classSelector}`;
  return classSelector && isUniqueSelector(classCandidate)
    ? classCandidate
    : buildDomPathSelector(element);
}

function isUniqueSelector(selector: string) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function buildDomPathSelector(element: HTMLElement) {
  const segments: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && segments.length < 6) {
    if (current.id) {
      segments.unshift(`#${escapeSelectorValue(current.id)}`);
      break;
    }

    const tag = current.tagName.toLowerCase();
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (sibling) => sibling.tagName === current?.tagName,
        )
      : [];
    const position = siblings.indexOf(current) + 1;
    segments.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${position})` : tag);
    current = current.parentElement;
  }

  return segments.join(" > ");
}

function normalizeVisibleText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

function parsePixelValue(value: string) {
  const match = value.match(/^(-?\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : null;
}

function describeStableTag(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  const stableClass = String(element.className)
    .trim()
    .split(/\s+/)
    .find((className) => className.startsWith("hito-"));

  return stableClass ? `${tag}.${stableClass}` : tag;
}

function escapeSelectorValue(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}
