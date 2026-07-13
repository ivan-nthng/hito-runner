export type ScreenRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type ScreenCaptureElementContext = {
  classes?: string | null;
  componentId?: string | null;
  hitoPattern?: string | null;
  nearestHeading?: string | null;
  role?: string | null;
  selector?: string | null;
  tag?: string;
  visibleText?: string | null;
};

type ScreenCaptureTheme = "dark" | "light" | "system" | "unknown";

export type CaptureDraft = {
  createdAt: string;
  domContext?: {
    elementAtCenter?: ScreenCaptureElementContext;
  };
  selection: {
    documentRect: ScreenRect;
    viewportRect: ScreenRect;
  };
};

export type LocalScreenCapturePacket = ReturnType<typeof buildLocalScreenCapturePacket>;

const SCREENSHOT_UNAVAILABLE =
  "Browser page-pixel capture is unavailable from local app code. Attach a manual screenshot of the selected region if needed.";

const CONTEXT_SELECTOR =
  "button, a, input, textarea, select, [role], [data-hito-ds-pattern], [data-testid], article, section, header, main, aside, nav, form, li, [class]";

export function buildCaptureDraft(
  viewportRect: ScreenRect,
  ignoredElement: HTMLElement | null,
): CaptureDraft {
  const roundedViewportRect = roundRect(viewportRect);

  return {
    createdAt: new Date().toISOString(),
    domContext: collectDomContext(roundedViewportRect, ignoredElement),
    selection: {
      documentRect: roundRect({
        height: roundedViewportRect.height,
        width: roundedViewportRect.width,
        x: roundedViewportRect.x + window.scrollX,
        y: roundedViewportRect.y + window.scrollY,
      }),
      viewportRect: roundedViewportRect,
    },
  };
}

export function buildLocalScreenCapturePacket(
  draft: CaptureDraft,
  userComment: string,
): LocalScreenCapturePacket {
  return {
    kind: "hito_local_screen_capture_v1",
    createdAt: draft.createdAt,
    domContext: draft.domContext,
    route: {
      hash: window.location.hash,
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      title: document.title,
    },
    screenshot: {
      available: false,
      clipboardAttempted: false,
      failureReason: SCREENSHOT_UNAVAILABLE,
    },
    selection: draft.selection,
    userComment,
    viewport: {
      devicePixelRatio: Number(window.devicePixelRatio.toFixed(2)),
      height: window.innerHeight,
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      theme: readResolvedTheme(),
      width: window.innerWidth,
    },
  };
}

export function buildLocalScreenCapturePrompt(packet: LocalScreenCapturePacket) {
  const center = packet.domContext?.elementAtCenter;

  return `ROLE: FRONTEND

Task:
Fix or review the UI issue captured by Hito local Screen capture.

Stage:
FRONTEND follow-up / local screen-capture prompt packet

Context:
This packet was generated locally from the Hito devtool Screen action. It is local-only and was not uploaded or sent automatically.

User comment:
${packet.userComment.trim() || "(No comment supplied.)"}

Route:
- href: ${packet.route.href}
- title: ${packet.route.title}

Viewport:
- size: ${packet.viewport.width}x${packet.viewport.height}
- DPR: ${packet.viewport.devicePixelRatio}
- scroll: ${packet.viewport.scrollX}, ${packet.viewport.scrollY}
- theme: ${packet.viewport.theme}

Selection:
- viewport rect: x=${packet.selection.viewportRect.x}, y=${packet.selection.viewportRect.y}, width=${packet.selection.viewportRect.width}, height=${packet.selection.viewportRect.height}
- document rect: x=${packet.selection.documentRect.x}, y=${packet.selection.documentRect.y}, width=${packet.selection.documentRect.width}, height=${packet.selection.documentRect.height}

DOM context:
- center element: ${center?.selector ?? "not available"}
- nearest heading: ${center?.nearestHeading ?? "not available"}
- visible text: ${center?.visibleText ?? "not available"}

Screenshot:
- available: no
- clipboard attempted: no
- note: ${packet.screenshot.failureReason}

Packet:
\`\`\`json
${JSON.stringify(packet, null, 2)}
\`\`\`

Boundaries:
- Reuse existing Hito DS primitives and patterns.
- Do not add backend/Supabase/Admin Work Items persistence unless explicitly requested.
- Do not upload screenshots or auto-send anything to Codex.
- Do not mutate live UI; implement a source fix only after inspecting the owning component.`;
}

function collectDomContext(rect: ScreenRect, ignoredElement: HTMLElement | null) {
  const previousPointerEvents = ignoredElement?.style.pointerEvents;

  if (ignoredElement) ignoredElement.style.pointerEvents = "none";

  try {
    const center = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
    const centerElement = resolveSafeElement(document.elementFromPoint(center.x, center.y));

    return {
      elementAtCenter: centerElement ? describeElementContext(centerElement, 180) : undefined,
    };
  } finally {
    if (ignoredElement && previousPointerEvents != null) {
      ignoredElement.style.pointerEvents = previousPointerEvents;
    }
  }
}

function resolveSafeElement(target: Element | null) {
  if (!(target instanceof HTMLElement)) return null;
  if (target.closest("[data-local-ui-inspector-layer]")) return null;

  return target.closest<HTMLElement>(CONTEXT_SELECTOR);
}

function describeElementContext(element: HTMLElement, visibleTextLimit: number) {
  const className = String(element.className ?? "").trim();

  return {
    classes: className.slice(0, 180) || null,
    componentId: element.getAttribute("data-hito-component"),
    hitoPattern: element.getAttribute("data-hito-ds-pattern"),
    nearestHeading: findNearestHeadingText(element),
    role: element.getAttribute("role"),
    selector: buildSelector(element),
    tag: element.tagName.toLowerCase(),
    visibleText: getVisibleText(element, visibleTextLimit),
  };
}

function getVisibleText(element: HTMLElement, maxLength: number) {
  const visibleText = (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
  const redacted = visibleText
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(
      /\b(?:token|secret|password|apikey|api_key|access_token)=?[A-Za-z0-9._-]{8,}\b/gi,
      "[secret]",
    );

  return redacted ? redacted.slice(0, maxLength) : null;
}

function findNearestHeadingText(element: HTMLElement) {
  const root = element.closest("section, article, main, aside, header") ?? document.body;
  const heading = root.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6, [role='heading']");
  return heading ? getVisibleText(heading, 120) : null;
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
    .slice(0, 2)
    .map((className) => `.${escapeSelectorValue(className)}`)
    .join("");

  return `${element.tagName.toLowerCase()}${classSelector}`;
}

function readResolvedTheme(): ScreenCaptureTheme {
  const theme = document.documentElement.getAttribute("data-hito-theme");
  return theme === "dark" || theme === "light" || theme === "system" ? theme : "unknown";
}

function roundRect(rect: ScreenRect): ScreenRect {
  return {
    height: Math.round(rect.height),
    width: Math.round(rect.width),
    x: Math.round(rect.x),
    y: Math.round(rect.y),
  };
}

function escapeSelectorValue(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}
