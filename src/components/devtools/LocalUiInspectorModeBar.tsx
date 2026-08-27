import { forwardRef } from "react";
import { HitoButton } from "@/components/ui/button";
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
      className="relative z-[90] flex max-w-[calc(100vw-2.5rem)] items-center gap-1 rounded-lg border border-hairline bg-background/90 p-1.5 shadow-soft backdrop-blur"
      data-local-ui-inspector-mode-bar=""
      role="group"
      aria-label="Pencil Inspector controls"
    >
      <span className="ml-1 size-2 shrink-0 rounded-full bg-signal" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
        <Icon name="edit" size="xs" className="shrink-0 text-signal" />
        <span className="hito-body-xs truncate text-foreground">Pencil</span>
      </span>
      {itemCount > 0 ? (
        <HitoButton
          type="button"
          aria-expanded={reviewOpen}
          aria-label={`Open Inspector draft with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          className="shrink-0"
          onClick={onOpenReview}
          size="xs"
          variant="secondary"
        >
          Draft {itemCount}
        </HitoButton>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <HitoButton
            ref={ref}
            type="button"
            aria-label="Exit Pencil Inspector and discard draft"
            className="shrink-0"
            iconOnly
            onClick={onExit}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onExit();
            }}
            size="xs"
            variant="ghost"
          >
            <Icon aria-hidden="true" name="close" size="xs" />
          </HitoButton>
        </TooltipTrigger>
        <TooltipContent className="z-[94]" side="top" sideOffset={8}>
          Exit Pencil Inspector and discard draft
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
));

LocalUiInspectorModeBar.displayName = "LocalUiInspectorModeBar";
