import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LocalUiTaskDraftPanel } from "@/components/devtools/LocalUiTaskDraftPanel";
import type { InlineChangeTargetInput } from "@/components/devtools/local-inline-change-target-utils";
import { inspectLocalUiTarget } from "@/components/devtools/local-ui-inspector-targets";

type InspectorMode = "idle" | "inspect";

type SelectedTarget = InlineChangeTargetInput & {
  rect: DOMRectReadOnly | null;
};

type FloatingPanelState = {
  actionId: string | null;
  anchor?: "launcher";
  position: { x: number; y: number };
  target: SelectedTarget;
};

const PANEL_VIEWPORT_MARGIN = 10;
const DEFAULT_PANEL_WIDTH = 352;
const DEFAULT_PANEL_HEIGHT = 540;
const LAUNCHER_BUTTON_SIZE = 40;
const LAUNCHER_PANEL_GAP = 8;
const LAUNCHER_VIEWPORT_OFFSET = 20;
const INSPECTABLE_SELECTOR =
  "button, a, input, textarea, select, [role], [data-hito-ds-pattern], [data-testid], article, section, header, main, aside, nav, form, li, [class]";

export function LocalUiInspector() {
  const [mode, setMode] = useState<InspectorMode>("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRectReadOnly | null>(null);
  const [panel, setPanel] = useState<FloatingPanelState | null>(null);
  const panelRef = useRef<FloatingPanelState | null>(null);
  const suppressNextLayerClickRef = useRef(false);

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const closeInspector = () => {
    setMode("idle");
    setMenuOpen(false);
    setHoverRect(null);
    setPanel(null);
  };

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

  useEffect(() => {
    if (!panel && mode !== "inspect" && !menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeInspector();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, mode, panel]);

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
      closeInspector();
    };

    document.addEventListener("pointerdown", closePanelFromOutside, true);

    return () => {
      document.removeEventListener("pointerdown", closePanelFromOutside, true);
    };
  }, [panel]);

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
    setPanel({
      actionId: "bug",
      anchor: "launcher",
      position: getLauncherPanelPosition(),
      target: {
        componentId: "LocalUiInspector.bug_prompt",
        elementClasses: null,
        elementRole: null,
        elementTag: "page",
        proposedText: null,
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
    suppressNextLayerClickRef.current = true;
    setPanel({
      actionId: null,
      position: getPanelPosition(target.getBoundingClientRect(), event.clientX, event.clientY),
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

    if (panelRef.current) closeInspector();
  };

  return (
    <div
      data-local-ui-inspector-layer=""
      data-local-ui-inspector-root=""
      className="fixed bottom-5 right-5 z-[70]"
      onClick={stopDevtoolEvent}
      onPointerDown={stopDevtoolEvent}
    >
      {mode === "inspect" ? (
        <div
          data-local-ui-inspector-hit-layer=""
          data-local-ui-inspector-layer=""
          className="fixed inset-0 z-[68] cursor-crosshair bg-transparent"
          onClick={closeFromHitLayerClick}
          onPointerDown={selectHoverTarget}
          onPointerMove={updateHoverTarget}
        />
      ) : null}
      {panel?.target.rect ? (
        <InspectorHighlight rect={panel.target.rect} selected />
      ) : hoverRect ? (
        <InspectorHighlight rect={hoverRect} />
      ) : null}
      {panel ? (
        <InspectorPanel
          panel={panel}
          onActionChange={(actionId) => setPanel((current) => current && { ...current, actionId })}
          onClose={() => setPanel(null)}
        />
      ) : null}

      {mode === "inspect" ? (
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-md relative z-[72] aspect-square rounded-full px-0 shadow-soft"
          aria-label="Exit local inspect mode"
          title="Exit local inspect mode"
          onClick={closeInspector}
        >
          <Icon name="close" size="sm" />
        </button>
      ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hito-button hito-button-primary hito-button-md aspect-square rounded-full px-0 shadow-soft"
              aria-label="Open local UI task tools"
              title="Open local UI task tools"
            >
              <Icon name="plus" size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {mode === "inspect" ? (
        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-56 rounded-md border border-signal/30 bg-background/90 p-2 text-right shadow-soft backdrop-blur">
          <p className="hito-caption text-foreground">Pencil mode</p>
          <p className="hito-caption">Hover, then click a UI element.</p>
        </div>
      ) : null}
    </div>
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
      className={`pointer-events-none fixed z-[69] rounded-md border border-signal bg-signal/10 ${
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

function InspectorPanel({
  onActionChange,
  onClose,
  panel,
}: {
  onActionChange: (actionId: string | null) => void;
  onClose: () => void;
  panel: FloatingPanelState;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [clampedPosition, setClampedPosition] = useState(panel.position);

  useEffect(() => {
    setClampedPosition(panel.position);
  }, [panel.target, panel.position]);

  useLayoutEffect(() => {
    setClampedPosition(panel.position);
  }, [panel.position]);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (!element) return;

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const nextPosition =
        panel.anchor === "launcher"
          ? getLauncherPanelPosition(rect.width, rect.height)
          : clampPanelPosition(panel.position.x, panel.position.y, rect.width, rect.height);

      setClampedPosition((current) =>
        Math.abs(current.x - nextPosition.x) < 0.5 && Math.abs(current.y - nextPosition.y) < 0.5
          ? current
          : nextPosition,
      );
    };

    updatePosition();

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    resizeObserver?.observe(element);
    window.addEventListener("resize", updatePosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [panel.anchor, panel.position, panel.actionId]);

  return (
    <section
      ref={panelRef}
      data-local-ui-task-panel=""
      data-local-ui-inspector-layer=""
      className="fixed z-[71] grid max-h-[calc(100vh-2rem)] w-[min(22rem,calc(100vw-1.25rem))] gap-3 overflow-y-auto rounded-xl border border-hairline bg-background p-3 text-left shadow-soft"
      style={{ left: clampedPosition.x, top: clampedPosition.y }}
      aria-label="Local UI task draft"
      onClick={stopDevtoolEvent}
      onPointerDown={stopDevtoolEvent}
    >
      <LocalUiTaskDraftPanel
        actionId={panel.actionId}
        onActionChange={onActionChange}
        onClose={onClose}
        target={panel.target}
      />
    </section>
  );
}

function resolveInspectableElement(target: EventTarget | null, point?: { x: number; y: number }) {
  if (!(target instanceof Element)) return null;
  if (target.closest("[data-local-ui-inspector-layer]")) return null;

  const control = target.closest<HTMLElement>("button, a, input, textarea, select");
  if (control && !control.closest("[data-local-ui-inspector-layer]")) return control;

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

  return (
    visibleText.length > 0 &&
    element.childElementCount <= 1 &&
    (hasTypographyClass || /^(h[1-6]|p|span|small|strong|label|figcaption|legend)$/.test(tag))
  );
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
    if (current.closest("[data-local-ui-inspector-layer]")) return null;
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
    if (current.closest("[data-local-ui-inspector-layer]")) return null;

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
  const targetInspection = inspectLocalUiTarget(element);
  const targetLabel =
    element.getAttribute("aria-label") ||
    element.getAttribute("data-hito-ds-pattern") ||
    element.getAttribute("data-testid") ||
    element.id ||
    describeStableTag(element);

  return {
    componentId:
      element.getAttribute("data-hito-component") ||
      element.getAttribute("data-hito-ds-pattern") ||
      null,
    ...targetInspection,
    elementClasses: element.className ? String(element.className).trim().slice(0, 300) : null,
    elementRole: element.getAttribute("role"),
    elementTag: element.tagName.toLowerCase(),
    proposedText: null,
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

function buildSelector(element: HTMLElement) {
  const testId = element.getAttribute("data-testid");
  if (testId) return `[data-testid="${escapeSelectorValue(testId)}"]`;

  const pattern = element.getAttribute("data-hito-ds-pattern");
  if (pattern) return `[data-hito-ds-pattern="${escapeSelectorValue(pattern)}"]`;

  if (element.id) return `#${escapeSelectorValue(element.id)}`;

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return `${element.tagName.toLowerCase()}[aria-label="${escapeSelectorValue(ariaLabel)}"]`;
  }

  const classSelector = String(element.className)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((className) => `.${escapeSelectorValue(className)}`)
    .join("");

  return `${element.tagName.toLowerCase()}${classSelector}`;
}

function getPanelPosition(rect: DOMRectReadOnly, clientX: number, clientY: number) {
  const preferredX = Math.min(clientX + 12, rect.right + 12);
  const preferredY = Math.min(clientY + 12, rect.bottom + 12);
  return clampPanelPosition(preferredX, preferredY);
}

function getLauncherPanelPosition(
  measuredWidth = DEFAULT_PANEL_WIDTH,
  measuredHeight = DEFAULT_PANEL_HEIGHT,
) {
  return clampPanelPosition(
    window.innerWidth - LAUNCHER_VIEWPORT_OFFSET - measuredWidth,
    window.innerHeight -
      LAUNCHER_VIEWPORT_OFFSET -
      LAUNCHER_BUTTON_SIZE -
      LAUNCHER_PANEL_GAP -
      measuredHeight,
    measuredWidth,
    measuredHeight,
  );
}

function clampPanelPosition(
  x: number,
  y: number,
  measuredWidth = DEFAULT_PANEL_WIDTH,
  measuredHeight = DEFAULT_PANEL_HEIGHT,
) {
  const panelWidth = Math.min(measuredWidth, window.innerWidth - PANEL_VIEWPORT_MARGIN * 2);
  const panelHeight = Math.min(measuredHeight, window.innerHeight - PANEL_VIEWPORT_MARGIN * 2);

  return {
    x: Math.max(
      PANEL_VIEWPORT_MARGIN,
      Math.min(x, window.innerWidth - panelWidth - PANEL_VIEWPORT_MARGIN),
    ),
    y: Math.max(
      PANEL_VIEWPORT_MARGIN,
      Math.min(y, window.innerHeight - panelHeight - PANEL_VIEWPORT_MARGIN),
    ),
  };
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
