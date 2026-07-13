import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { copyTextToClipboard } from "@/components/devtools/local-ui-clipboard";
import {
  buildCaptureDraft,
  buildLocalScreenCapturePacket,
  buildLocalScreenCapturePrompt,
  type CaptureDraft,
  type LocalScreenCapturePacket,
  type ScreenRect,
} from "@/components/devtools/local-screen-capture-packet";

type CaptureStage = "selecting" | "dragging" | "invalid" | "ready";
type PromptState = "idle" | "copied" | "copy_failed" | "fallback_hidden";
type ScreenPoint = { x: number; y: number };

const MIN_SELECTION_SIZE = 18;

export function LocalScreenCaptureFlow({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<CaptureStage>("selecting");
  const [dragStart, setDragStart] = useState<ScreenPoint | null>(null);
  const [draftRect, setDraftRect] = useState<ScreenRect | null>(null);
  const [captureDraft, setCaptureDraft] = useState<CaptureDraft | null>(null);
  const [comment, setComment] = useState("");
  const [promptState, setPromptState] = useState<PromptState>("idle");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const manualPromptRef = useRef<HTMLTextAreaElement | null>(null);

  const packet = useMemo(
    () => (captureDraft ? buildLocalScreenCapturePacket(captureDraft, comment) : null),
    [captureDraft, comment],
  );
  const prompt = useMemo(() => (packet ? buildLocalScreenCapturePrompt(packet) : ""), [packet]);
  const packetJson = useMemo(() => (packet ? JSON.stringify(packet, null, 2) : ""), [packet]);
  const isSelecting = stage === "selecting" || stage === "dragging" || stage === "invalid";

  useEffect(() => {
    const isolateScreenCaptureDismiss = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onClose();
    };

    window.addEventListener(
      "dismissableLayer.pointerDownOutside",
      isolateScreenCaptureDismiss,
      true,
    );
    window.addEventListener("dismissableLayer.focusOutside", isolateScreenCaptureDismiss, true);
    window.addEventListener("keydown", closeOnEscape, true);

    return () => {
      window.removeEventListener(
        "dismissableLayer.pointerDownOutside",
        isolateScreenCaptureDismiss,
        true,
      );
      window.removeEventListener(
        "dismissableLayer.focusOutside",
        isolateScreenCaptureDismiss,
        true,
      );
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [onClose]);

  useEffect(() => {
    if (promptState !== "copy_failed") return;

    window.requestAnimationFrame(() => {
      manualPromptRef.current?.focus();
      manualPromptRef.current?.select();
    });
  }, [promptState]);

  const resetPromptState = () => setPromptState("idle");

  const retake = () => {
    setStage("selecting");
    setDragStart(null);
    setDraftRect(null);
    setCaptureDraft(null);
    resetPromptState();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    stopScreenCaptureEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    const start = clampViewportPoint({ x: event.clientX, y: event.clientY });
    setDragStart(start);
    setDraftRect({ ...start, height: 0, width: 0 });
    setStage("dragging");
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart || stage !== "dragging") return;
    stopScreenCaptureEvent(event);

    setDraftRect(
      normalizeViewportRect(dragStart, clampViewportPoint({ x: event.clientX, y: event.clientY })),
    );
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart || stage !== "dragging") return;
    stopScreenCaptureEvent(event);

    const nextRect = normalizeViewportRect(
      dragStart,
      clampViewportPoint({ x: event.clientX, y: event.clientY }),
    );
    setDragStart(null);
    setDraftRect(nextRect);

    if (!isValidSelection(nextRect)) {
      setStage("invalid");
      return;
    }

    setCaptureDraft(buildCaptureDraft(nextRect, overlayRef.current));
    setStage("ready");
  };

  const generatePrompt = async () => {
    if (!packet) return;

    try {
      const copyResult = await copyTextToClipboard(prompt);
      setPromptState(copyResult.ok ? "copied" : "copy_failed");
    } catch {
      setPromptState("copy_failed");
    }
  };

  return (
    <>
      {isSelecting ? (
        <div
          ref={overlayRef}
          data-local-screen-capture-overlay=""
          data-local-ui-inspector-layer=""
          className="fixed inset-0 z-[80] cursor-crosshair touch-none bg-black/10"
          onClick={stopScreenCaptureEvent}
          onContextMenu={stopScreenCaptureEvent}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <ScreenCaptureHelper invalid={stage === "invalid"} />
          {draftRect ? <SelectionRect rect={draftRect} /> : null}
        </div>
      ) : null}

      {stage === "ready" && captureDraft && packet ? (
        <ScreenCapturePanel
          manualPromptRef={manualPromptRef}
          onCancel={onClose}
          onCommentChange={(value) => {
            setComment(value);
            resetPromptState();
          }}
          onGeneratePrompt={() => void generatePrompt()}
          onHideManualFallback={() => setPromptState("fallback_hidden")}
          onRetake={retake}
          packet={packet}
          packetJson={packetJson}
          prompt={prompt}
          promptState={promptState}
          userComment={comment}
        />
      ) : null}
    </>
  );
}

function ScreenCaptureHelper({ invalid }: { invalid: boolean }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[82] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-hairline bg-background/90 p-3 text-center shadow-soft backdrop-blur">
      <p className="hito-caption text-foreground">
        {invalid ? "Selection is too small. Drag a larger region." : "Drag to capture a region."}
      </p>
      <p className="hito-caption">Esc cancels. This is local only.</p>
    </div>
  );
}

function SelectionRect({ rect }: { rect: ScreenRect }) {
  return (
    <div
      aria-hidden="true"
      data-local-screen-capture-selection=""
      className="pointer-events-none fixed rounded-lg border border-signal bg-signal/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.42),0_0_0_3px_rgba(98,228,255,0.18),0_18px_60px_rgba(0,0,0,0.38)]"
      style={{
        height: `${Math.max(rect.height, 1)}px`,
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${Math.max(rect.width, 1)}px`,
      }}
    />
  );
}

function ScreenCapturePanel({
  manualPromptRef,
  onCancel,
  onCommentChange,
  onGeneratePrompt,
  onHideManualFallback,
  onRetake,
  packet,
  packetJson,
  prompt,
  promptState,
  userComment,
}: {
  manualPromptRef: RefObject<HTMLTextAreaElement | null>;
  onCancel: () => void;
  onCommentChange: (value: string) => void;
  onGeneratePrompt: () => void;
  onHideManualFallback: () => void;
  onRetake: () => void;
  packet: LocalScreenCapturePacket;
  packetJson: string;
  prompt: string;
  promptState: PromptState;
  userComment: string;
}) {
  const showManualPromptFallback = promptState === "copy_failed";

  return (
    <section
      data-local-screen-capture-panel=""
      data-local-ui-inspector-layer=""
      className="fixed bottom-[4.75rem] right-2.5 z-[82] grid max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-1.25rem))] gap-3 overflow-y-auto rounded-xl border border-hairline bg-background p-3 text-left shadow-soft md:right-5"
      role="dialog"
      aria-modal="true"
      aria-label="Screen capture"
      onClick={stopScreenCapturePanelEvent}
      onContextMenu={stopScreenCapturePanelEvent}
      onPointerDown={stopScreenCapturePanelEvent}
    >
      <div className="relative grid min-w-0 gap-3 pt-0.5">
        <div className="min-w-0 pr-8">
          <div className="flex min-w-0 items-center gap-2">
            <p className="hito-label min-w-0 truncate text-foreground">Screen capture</p>
            <span className="hito-status-pill shrink-0" data-tone="signal">
              Local only
            </span>
          </div>
          <p className="hito-caption mt-0.5 truncate">
            {packet.route.pathname || "/"} · {packet.selection.viewportRect.width}x
            {packet.selection.viewportRect.height} region
          </p>
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-sm absolute -right-1 -top-1 min-h-7 px-2"
            aria-label="Cancel screen capture"
            onClick={onCancel}
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        <ScreenCapturePreview packet={packet} />

        <section className="grid min-w-0 gap-1.5">
          <p className="hito-caption text-foreground">Location</p>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {[
              packet.route.pathname || "/",
              `${packet.viewport.width}x${packet.viewport.height}`,
              `DPR ${packet.viewport.devicePixelRatio}`,
              `${packet.selection.viewportRect.width}x${packet.selection.viewportRect.height} region`,
              packet.viewport.theme,
            ].map((item) => (
              <span key={item} className="hito-status-pill" data-tone="muted" title={item}>
                {item}
              </span>
            ))}
          </div>
          <p className="hito-caption">
            {packet.domContext?.elementAtCenter?.nearestHeading
              ? `Near ${packet.domContext.elementAtCenter.nearestHeading}.`
              : "Location metadata is included in the prompt."}
          </p>
        </section>

        <label className="grid min-w-0 gap-1">
          <span className="hito-caption text-foreground">What should change?</span>
          <Textarea
            className="min-h-24 resize-y py-2"
            placeholder="Describe the issue or desired UI change."
            value={userComment}
            onChange={(event) => onCommentChange(event.currentTarget.value)}
          />
        </label>

        <details className="hito-disclosure border-0 bg-transparent p-0">
          <summary className="hito-disclosure-summary cursor-pointer list-none px-0 py-1 [&::-webkit-details-marker]:hidden">
            <span className="hito-caption text-foreground">Packet details</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <pre
            data-local-screen-capture-packet-kind={packet.kind}
            className="hito-technical-mono mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-black/25 p-3 text-xs leading-5 text-foreground"
          >
            {packetJson}
          </pre>
        </details>

        {showManualPromptFallback ? (
          <ManualPromptFallback
            manualPromptRef={manualPromptRef}
            onHide={onHideManualFallback}
            prompt={prompt}
          />
        ) : null}

        <div className="grid min-w-0 gap-2 border-t border-hairline pt-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {promptState === "copied" ? (
              <span className="inline-flex min-h-8 items-center gap-1.5 px-2 text-xs font-medium text-success">
                <Icon name="check" size="xs" />
                Copied
              </span>
            ) : (
              <button
                type="button"
                className="hito-button hito-button-primary hito-button-sm min-h-8 px-2"
                onClick={onGeneratePrompt}
              >
                <Icon name="copy" size="xs" />
                Generate Prompt
              </button>
            )}
            <button
              type="button"
              className="hito-button hito-button-secondary hito-button-sm min-h-8 px-2"
              onClick={onRetake}
            >
              <Icon name="refresh" size="xs" />
              Retake
            </button>
            <button
              type="button"
              className="hito-button hito-button-ghost hito-button-sm min-h-8 px-2"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
          {promptState !== "idle" ? (
            <details className="hito-disclosure border-0 bg-transparent p-0">
              <summary className="hito-disclosure-summary cursor-pointer list-none px-0 py-1 [&::-webkit-details-marker]:hidden">
                <span className="hito-caption text-foreground">Generated prompt</span>
                <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
              </summary>
              <Textarea
                readOnly
                aria-label="Generated screen capture prompt"
                className="hito-technical-mono mt-1 max-h-44 min-h-28 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
                value={prompt}
                onFocus={(event) => event.currentTarget.select()}
              />
            </details>
          ) : null}
          <PromptStatus promptState={promptState} />
        </div>
      </div>
    </section>
  );
}

function ScreenCapturePreview({ packet }: { packet: LocalScreenCapturePacket }) {
  const regionRatio = packet.selection.viewportRect.width / packet.selection.viewportRect.height;
  const previewWidth = Math.min(100, Math.max(38, regionRatio >= 1 ? 84 : 48));
  const previewHeight = Math.min(72, Math.max(28, regionRatio >= 1 ? 84 / regionRatio : 62));

  return (
    <section className="grid min-w-0 gap-1.5">
      <p className="hito-caption text-foreground">Selected region</p>
      <div
        className="grid min-h-32 place-items-center overflow-hidden rounded-lg bg-surface/70 p-3"
        data-local-screen-capture-preview={packet.screenshot.available ? "image" : "fallback"}
      >
        <div className="grid min-w-0 place-items-center gap-2 text-center">
          <div
            className="grid place-items-center rounded-md border border-dashed border-signal/45 bg-signal/10 text-signal"
            style={{ height: `${previewHeight}px`, width: `${previewWidth}%` }}
          >
            <Icon name="image" size="sm" />
          </div>
          <div className="grid min-w-0 gap-0.5">
            <p className="hito-caption text-foreground">
              {packet.screenshot.available
                ? "Screenshot preview ready."
                : "Manual screenshot needed."}
            </p>
            <p className="hito-caption">
              {packet.screenshot.available
                ? `${packet.screenshot.width ?? packet.selection.viewportRect.width}x${
                    packet.screenshot.height ?? packet.selection.viewportRect.height
                  } image`
                : "App runtime cannot read page pixels. Attach the selected crop manually if needed."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ManualPromptFallback({
  manualPromptRef,
  onHide,
  prompt,
}: {
  manualPromptRef: RefObject<HTMLTextAreaElement | null>;
  onHide: () => void;
  prompt: string;
}) {
  return (
    <div className="grid min-w-0 gap-2 rounded-xl border border-hairline bg-surface/70 p-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="hito-caption text-foreground">Copy blocked. Select prompt manually.</p>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-sm min-h-7 px-2"
          onClick={onHide}
        >
          Hide
        </button>
      </div>
      <Textarea
        ref={manualPromptRef}
        readOnly
        aria-label="Manual copy screen capture prompt"
        className="hito-technical-mono max-h-44 min-h-28 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
        value={prompt}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}

function PromptStatus({ promptState }: { promptState: PromptState }) {
  if (promptState === "copy_failed") {
    return <p className="hito-caption text-warn">Select prompt manually.</p>;
  }

  if (promptState === "fallback_hidden") {
    return <p className="hito-caption text-success">Prompt ready.</p>;
  }

  if (promptState === "copied") {
    return <p className="hito-caption text-success">Attach screenshot if needed.</p>;
  }

  return <p className="hito-caption">Metadata prompt only; no upload.</p>;
}

function clampViewportPoint(point: ScreenPoint): ScreenPoint {
  return {
    x: Math.max(0, Math.min(point.x, window.innerWidth)),
    y: Math.max(0, Math.min(point.y, window.innerHeight)),
  };
}

function normalizeViewportRect(start: ScreenPoint, end: ScreenPoint): ScreenRect {
  return {
    height: Math.abs(end.y - start.y),
    width: Math.abs(end.x - start.x),
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
  };
}

function isValidSelection(rect: ScreenRect) {
  return rect.width >= MIN_SELECTION_SIZE && rect.height >= MIN_SELECTION_SIZE;
}

function stopScreenCaptureEvent(event: {
  nativeEvent?: { stopImmediatePropagation?: () => void };
  preventDefault?: () => void;
  stopPropagation: () => void;
}) {
  event.preventDefault?.();
  event.stopPropagation();
  event.nativeEvent?.stopImmediatePropagation?.();
}

function stopScreenCapturePanelEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
