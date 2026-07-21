const PANEL_VIEWPORT_MARGIN = 10;
const PANEL_TARGET_GAP = 12;
const DEFAULT_PANEL_WIDTH = 352;
const DEFAULT_PANEL_HEIGHT = 540;
const LAUNCHER_BUTTON_SIZE = 40;
const LAUNCHER_PANEL_GAP = 8;
const LAUNCHER_VIEWPORT_OFFSET = 20;

export type LocalUiInspectorSurfacePlacement = {
  anchor?: "launcher";
  position: { x: number; y: number };
  targetRect: DOMRectReadOnly | null;
};

export const LOCAL_UI_INSPECTOR_NARROW_VIEWPORT_QUERY = "(max-width: 767.98px)";

export function isLocalUiInspectorNarrowViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(LOCAL_UI_INSPECTOR_NARROW_VIEWPORT_QUERY).matches
  );
}

export function getLocalUiInspectorPanelPosition(
  targetRect: DOMRectReadOnly,
  clientX: number,
  clientY: number,
  measuredWidth = DEFAULT_PANEL_WIDTH,
  measuredHeight = DEFAULT_PANEL_HEIGHT,
) {
  const { height: panelHeight, width: panelWidth } = getEffectivePanelSize(
    measuredWidth,
    measuredHeight,
  );
  const sideY = clampPanelPosition(0, targetRect.top - PANEL_TARGET_GAP, panelWidth, panelHeight).y;
  const centeredX = targetRect.left + targetRect.width / 2 - panelWidth / 2;
  const centeredClampedX = clampPanelPosition(centeredX, 0, panelWidth, panelHeight).x;
  const isInViewport = (candidate: { x: number; y: number }) =>
    candidate.x >= PANEL_VIEWPORT_MARGIN &&
    candidate.y >= PANEL_VIEWPORT_MARGIN &&
    candidate.x + panelWidth <= window.innerWidth - PANEL_VIEWPORT_MARGIN &&
    candidate.y + panelHeight <= window.innerHeight - PANEL_VIEWPORT_MARGIN;
  const overlapsTarget = (candidate: { x: number; y: number }) =>
    !(
      candidate.x + panelWidth <= targetRect.left ||
      candidate.x >= targetRect.right ||
      candidate.y + panelHeight <= targetRect.top ||
      candidate.y >= targetRect.bottom
    );
  const candidates = [
    { x: targetRect.right + PANEL_TARGET_GAP, y: sideY },
    { x: targetRect.left - panelWidth - PANEL_TARGET_GAP, y: sideY },
    { x: centeredClampedX, y: targetRect.bottom + PANEL_TARGET_GAP },
    { x: centeredClampedX, y: targetRect.top - panelHeight - PANEL_TARGET_GAP },
    { x: clientX + PANEL_TARGET_GAP, y: clientY + PANEL_TARGET_GAP },
  ];
  const nonOverlappingCandidate = candidates.find(
    (candidate) => isInViewport(candidate) && !overlapsTarget(candidate),
  );

  return (
    nonOverlappingCandidate ??
    candidates.find(isInViewport) ??
    clampPanelPosition(
      clientX + PANEL_TARGET_GAP,
      clientY + PANEL_TARGET_GAP,
      panelWidth,
      panelHeight,
    )
  );
}

export function getLocalUiInspectorLauncherPanelPosition(
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

export function clampLocalUiInspectorPanelPosition(
  x: number,
  y: number,
  measuredWidth = DEFAULT_PANEL_WIDTH,
  measuredHeight = DEFAULT_PANEL_HEIGHT,
) {
  return clampPanelPosition(x, y, measuredWidth, measuredHeight);
}

function clampPanelPosition(
  x: number,
  y: number,
  measuredWidth = DEFAULT_PANEL_WIDTH,
  measuredHeight = DEFAULT_PANEL_HEIGHT,
) {
  const { height: panelHeight, width: panelWidth } = getEffectivePanelSize(
    measuredWidth,
    measuredHeight,
  );

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

function getEffectivePanelSize(measuredWidth: number, measuredHeight: number) {
  return {
    height: Math.min(measuredHeight, window.innerHeight - PANEL_VIEWPORT_MARGIN * 2),
    width: Math.min(measuredWidth, window.innerWidth - PANEL_VIEWPORT_MARGIN * 2),
  };
}
