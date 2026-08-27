import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  clampLocalUiInspectorPanelPosition,
  getLocalUiInspectorLauncherPanelPosition,
  getLocalUiInspectorPanelPosition,
  isLocalUiInspectorNarrowViewport,
  LOCAL_UI_INSPECTOR_NARROW_VIEWPORT_QUERY,
  type LocalUiInspectorSurfacePlacement,
} from "@/components/devtools/local-ui-inspector-position";

export function LocalUiInspectorSurface({
  ariaLabel,
  children,
  onClose,
  onInternalPointerEnd,
  onInternalPointerStart,
  placement,
  viewportContained = false,
}: {
  ariaLabel: string;
  children: ReactNode;
  onClose: () => void;
  onInternalPointerEnd: () => void;
  onInternalPointerStart: () => void;
  placement: LocalUiInspectorSurfacePlacement;
  viewportContained?: boolean;
}) {
  const narrow = useNarrowViewport();

  if (narrow) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          data-local-ui-inspector-layer=""
          className="!z-[92] flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-none"
          aria-label={ariaLabel}
          showCloseButton={false}
          onClick={stopInspectorSurfaceEvent}
          onFocus={stopInspectorSurfaceEvent}
          onPointerCancelCapture={onInternalPointerEnd}
          onPointerDownCapture={onInternalPointerStart}
          onPointerDown={stopInspectorSurfaceEvent}
          onPointerUpCapture={onInternalPointerEnd}
          onInteractOutside={(event) => {
            const originalTarget = event.detail.originalEvent.target;
            if (
              originalTarget instanceof Element &&
              originalTarget.closest("[data-local-ui-inspector-layer]")
            ) {
              event.preventDefault();
            }
          }}
        >
          <SheetTitle className="sr-only">Local Inspector</SheetTitle>
          <SheetDescription className="sr-only">
            Compose and review local Inspector prompt draft items for the current route.
          </SheetDescription>
          <div className="min-h-0 flex-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <LocalUiInspectorDesktopPanel
      ariaLabel={ariaLabel}
      onInternalPointerEnd={onInternalPointerEnd}
      onInternalPointerStart={onInternalPointerStart}
      placement={placement}
      viewportContained={viewportContained}
    >
      {children}
    </LocalUiInspectorDesktopPanel>
  );
}

function LocalUiInspectorDesktopPanel({
  ariaLabel,
  children,
  onInternalPointerEnd,
  onInternalPointerStart,
  placement,
  viewportContained,
}: {
  ariaLabel: string;
  children: ReactNode;
  onInternalPointerEnd: () => void;
  onInternalPointerStart: () => void;
  placement: LocalUiInspectorSurfacePlacement;
  viewportContained: boolean;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [clampedPosition, setClampedPosition] = useState(placement.position);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (!element) return;

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const nextPosition =
        placement.anchor === "launcher"
          ? getLocalUiInspectorLauncherPanelPosition(rect.width, rect.height)
          : placement.targetRect
            ? getLocalUiInspectorPanelPosition(
                placement.targetRect,
                placement.position.x,
                placement.position.y,
                rect.width,
                rect.height,
              )
            : clampLocalUiInspectorPanelPosition(
                placement.position.x,
                placement.position.y,
                rect.width,
                rect.height,
              );

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
  }, [placement]);

  return (
    <section
      ref={panelRef}
      data-local-ui-task-panel=""
      data-local-ui-inspector-layer=""
      className={`fixed z-[91] grid w-[min(22rem,calc(100vw-1.25rem))] rounded-xl border border-hairline bg-background p-3 text-left shadow-soft ${
        viewportContained
          ? "h-[min(34rem,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] grid-rows-[minmax(0,1fr)] overflow-hidden"
          : "max-h-[calc(100vh-2rem)] gap-3 overflow-y-auto"
      }`}
      style={{ left: clampedPosition.x, top: clampedPosition.y }}
      aria-label={ariaLabel}
      onClick={stopInspectorSurfaceEvent}
      onFocus={stopInspectorSurfaceEvent}
      onPointerCancelCapture={onInternalPointerEnd}
      onPointerDownCapture={onInternalPointerStart}
      onPointerDown={stopInspectorSurfaceEvent}
      onPointerUpCapture={onInternalPointerEnd}
    >
      {children}
    </section>
  );
}

function stopInspectorSurfaceEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function useNarrowViewport() {
  const [narrow, setNarrow] = useState(isLocalUiInspectorNarrowViewport);

  useEffect(() => {
    const media = window.matchMedia(LOCAL_UI_INSPECTOR_NARROW_VIEWPORT_QUERY);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return narrow;
}
