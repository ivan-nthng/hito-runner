import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { buildLocalUiInspectorBatchPrompt } from "@/components/devtools/local-ui-inspector-batch-prompt";
import {
  getLocalUiInspectorItemSummary,
  getLocalUiInspectorTargetLabel,
  isLocalUiInspectorTargetPresent,
  LOCAL_UI_INSPECTOR_BATCH_LIMIT,
  type LocalUiInspectorBatchItem,
} from "@/components/devtools/local-ui-inspector-session";
import { copyTextToClipboard } from "@/components/devtools/local-ui-clipboard";
import { getFixScopeLabel } from "@/components/devtools/local-inline-change-target-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { HitoMetadataTag } from "@/components/ui/metadata-tag";
import { Textarea } from "@/components/ui/textarea";

type CopyState = "idle" | "copying" | "copied" | "copy_failed";

export function LocalUiInspectorBatchReview({
  autoGenerate = false,
  initialFocusItemId,
  items,
  onClear,
  onClose,
  onContinue,
  onEdit,
  onRemove,
  routeKey,
}: {
  autoGenerate?: boolean;
  initialFocusItemId?: string | null;
  items: LocalUiInspectorBatchItem[];
  onClear: () => void;
  onClose: () => void;
  onContinue: () => void;
  onEdit: (item: LocalUiInspectorBatchItem) => void;
  onRemove: (itemId: string) => void;
  routeKey: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const autoGenerateHandledRef = useRef(false);
  const prompt = useMemo(
    () =>
      buildLocalUiInspectorBatchPrompt(items, {
        pageTitle: typeof document === "undefined" ? "" : document.title,
        routeKey,
        theme:
          typeof document === "undefined"
            ? "unknown"
            : (document.documentElement.dataset.hitoTheme ?? "dark"),
        viewport: {
          height: typeof window === "undefined" ? 0 : window.innerHeight,
          width: typeof window === "undefined" ? 0 : window.innerWidth,
        },
      }),
    [items, routeKey],
  );

  const copyPrompt = useCallback(async () => {
    if (items.length === 0 || copyState === "copying") return;
    setCopyState("copying");
    const result = await copyTextToClipboard(prompt);
    setCopyState(result.ok ? "copied" : "copy_failed");
  }, [copyState, items.length, prompt]);

  useEffect(() => {
    setCopyState("idle");
  }, [items]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const itemRow = initialFocusItemId
        ? document.querySelector(`[data-local-ui-batch-row="${CSS.escape(initialFocusItemId)}"]`)
        : null;
      if (itemRow instanceof HTMLElement) itemRow.focus();
      else titleRef.current?.focus();
    });
  }, [initialFocusItemId]);

  useEffect(() => {
    if (copyState !== "copy_failed") return;
    window.requestAnimationFrame(() => {
      promptRef.current?.focus();
      promptRef.current?.select();
    });
  }, [copyState]);

  useEffect(() => {
    if (!autoGenerate || autoGenerateHandledRef.current || items.length === 0) return;
    autoGenerateHandledRef.current = true;
    void copyPrompt();
  }, [autoGenerate, copyPrompt, items.length]);

  const removeItem = (itemId: string) => {
    const itemIndex = items.findIndex((item) => item.id === itemId);
    const focusItem = items[itemIndex + 1] ?? items[itemIndex - 1] ?? null;
    onRemove(itemId);
    window.requestAnimationFrame(() => {
      const selector = focusItem
        ? `[data-local-ui-batch-row="${CSS.escape(focusItem.id)}"]`
        : `[aria-labelledby="${CSS.escape(titleId)}"]`;
      const focusTarget = document.querySelector(selector);
      if (focusTarget instanceof HTMLElement) focusTarget.focus();
    });
  };

  return (
    <div
      className="grid min-h-0 min-w-0 gap-3 max-md:h-full max-md:grid-rows-[auto_minmax(0,1fr)_auto]"
      aria-labelledby={titleId}
    >
      <div className="relative min-w-0 pr-8" data-local-ui-inspector-header="">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 ref={titleRef} id={titleId} tabIndex={-1} className="hito-panel-title outline-none">
            Draft
          </h2>
          <span className="hito-caption text-muted-foreground">
            {items.length} of {LOCAL_UI_INSPECTOR_BATCH_LIMIT}
          </span>
          <button
            type="button"
            className="hito-button hito-button-ghost hito-button-xs ml-auto min-h-7 shrink-0 px-2"
            onClick={onClear}
          >
            <Icon name="trash" size="xs" />
            Clear draft
          </button>
        </div>
        <button
          type="button"
          className="hito-button hito-button-ghost hito-button-sm absolute -right-1 -top-1 min-h-7 px-2"
          aria-label="Close batch review"
          onClick={onClose}
        >
          <Icon name="close" size="xs" />
        </button>
      </div>

      <div
        className="grid min-w-0 gap-3 max-md:min-h-0 max-md:auto-rows-max max-md:overflow-y-auto max-md:overscroll-contain max-md:pr-1"
        data-local-ui-inspector-scroll-body=""
      >
        <ol
          className="hito-row-group min-w-0"
          aria-label="Local Inspector draft items"
          data-hito-ds-pattern="row-group"
        >
          {items.map((item, index) => {
            const targetPresent = isLocalUiInspectorTargetPresent(item.target);
            return (
              <li key={item.id} className="hito-list-row min-w-0 gap-2 px-2 py-2">
                <span className="hito-technical-mono shrink-0 text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  data-local-ui-batch-row={item.id}
                  className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onEdit(item)}
                >
                  <span className="hito-list-row-title block truncate">
                    {getLocalUiInspectorTargetLabel(item.target)}
                  </span>
                  <span className="hito-caption mt-0.5 line-clamp-2 block">
                    {getLocalUiInspectorItemSummary(item)}
                  </span>
                  <span className="mt-1 flex min-w-0 flex-wrap gap-1">
                    <HitoMetadataTag tone="muted">
                      {getFixScopeLabel(item.payload.fixScope.id)}
                    </HitoMetadataTag>
                    {item.ownership.entry ? (
                      <HitoMetadataTag tone="success">{item.ownership.entry.label}</HitoMetadataTag>
                    ) : null}
                    {!targetPresent ? (
                      <HitoMetadataTag tone="warning">Target no longer found</HitoMetadataTag>
                    ) : null}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hito-button hito-button-ghost hito-button-xs size-7 min-h-7 shrink-0 px-0"
                      aria-label={`Actions for item ${index + 1}`}
                    >
                      <Icon name="more-horizontal" size="xs" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[84] min-w-40"
                    data-local-ui-inspector-layer=""
                  >
                    <DropdownMenuItem onSelect={() => onEdit(item)}>
                      <Icon name="edit" size="xs" />
                      Edit item
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => removeItem(item.id)}>
                      <Icon name="trash" size="xs" />
                      Remove item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ol>

        {copyState === "copy_failed" ? (
          <div className="grid min-w-0 gap-2 rounded-lg border border-hairline bg-surface/70 p-2">
            <p className="hito-caption text-warn">Copy blocked. Select the prompt below.</p>
            <Textarea
              ref={promptRef}
              readOnly
              aria-label="Manual copy generated batch prompt"
              className="hito-technical-mono max-h-48 min-h-32 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
              value={prompt}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        ) : null}

        <details className="hito-disclosure border-0 bg-transparent p-0">
          <summary className="hito-disclosure-summary cursor-pointer list-none px-0 py-1 [&::-webkit-details-marker]:hidden">
            <span className="hito-caption text-foreground">Inspect generated prompt</span>
            <Icon name="chevron-down" size="xs" className="hito-disclosure-chevron" />
          </summary>
          <div className="hito-disclosure-body mt-1 grid gap-2">
            <Textarea
              readOnly
              aria-label="Generated local Inspector batch prompt"
              className="hito-technical-mono max-h-52 min-h-36 resize-y whitespace-pre-wrap py-1.5 text-xs leading-5"
              value={prompt}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        </details>
      </div>

      <div
        className="grid min-w-0 gap-2 border-t border-hairline pt-3"
        data-local-ui-inspector-footer=""
      >
        <div className="grid min-w-0 gap-2">
          <button
            type="button"
            className="hito-button hito-button-primary hito-button-sm w-full justify-center"
            disabled={items.length === 0 || copyState === "copying"}
            onClick={() => void copyPrompt()}
          >
            <Icon name={copyState === "copied" ? "check" : "copy"} size="xs" />
            {copyState === "copying"
              ? "Copying…"
              : copyState === "copied"
                ? "Prompt copied"
                : "Generate prompt"}
          </button>
          <button
            type="button"
            className="hito-button hito-button-secondary hito-button-sm w-full justify-center"
            onClick={onContinue}
          >
            Continue selecting
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copyState === "copied" ? "Prompt copied." : ""}
        </p>
      </div>
    </div>
  );
}
