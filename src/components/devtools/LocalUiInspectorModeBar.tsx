import { forwardRef } from "react";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const LocalUiInspectorModeBar = forwardRef<
  HTMLButtonElement,
  {
    itemCount: number;
    onExit: () => void;
    onOpenReview: () => void;
    reviewOpen: boolean;
  }
>(({ itemCount, onExit, onOpenReview, reviewOpen }, ref) => (
  <TooltipProvider delayDuration={160}>
    <div
      className="relative z-[70] flex max-w-[calc(100vw-2.5rem)] items-center gap-1 rounded-lg border border-hairline bg-background/90 p-1.5 shadow-soft backdrop-blur"
      data-local-ui-inspector-mode-bar=""
      role="group"
      aria-label="Pencil Inspector controls"
    >
      <span className="ml-1 size-2 shrink-0 rounded-full bg-signal" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
        <Icon name="edit" size="xs" className="shrink-0 text-signal" />
        <span className="hito-caption truncate text-foreground">Pencil</span>
      </span>
      {itemCount > 0 ? (
        <button
          type="button"
          className="hito-button hito-button-secondary hito-button-xs shrink-0 px-2"
          aria-expanded={reviewOpen}
          aria-label={`Open Inspector draft with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          onClick={onOpenReview}
        >
          Draft {itemCount}
        </button>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            className="hito-button hito-button-ghost hito-button-xs size-7 min-h-7 shrink-0 px-0"
            aria-label="Exit Pencil Inspector and discard draft"
            onClick={onExit}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onExit();
            }}
          >
            <Icon name="close" size="xs" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="z-[84]" side="top" sideOffset={8}>
          Exit Pencil Inspector and discard draft
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
));

LocalUiInspectorModeBar.displayName = "LocalUiInspectorModeBar";
