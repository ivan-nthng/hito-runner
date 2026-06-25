"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type HitoMetadataTagProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
  interactive?: boolean;
  tone?: string;
  tooltip?: React.ReactNode;
};

const HitoMetadataTag = React.forwardRef<HTMLElement, HitoMetadataTagProps>(
  (
    {
      asChild = false,
      children,
      className,
      interactive = false,
      tabIndex,
      title,
      tone,
      tooltip,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "span";
    const stringTooltip = typeof tooltip === "string" ? tooltip : undefined;
    const tag = (
      <Comp
        ref={ref}
        className={cn("hito-metadata-tag", className)}
        data-interactive={interactive ? "true" : undefined}
        data-readonly={interactive ? undefined : "true"}
        data-tone={tone}
        aria-label={
          !interactive && stringTooltip && typeof children === "string"
            ? `${children}. ${stringTooltip}`
            : undefined
        }
        tabIndex={!interactive && tooltip ? (tabIndex ?? 0) : tabIndex}
        title={title ?? stringTooltip}
        {...props}
      >
        {children}
      </Comp>
    );

    if (!tooltip) {
      return tag;
    }

    return (
      <TooltipProvider delayDuration={220}>
        <Tooltip>
          <TooltipTrigger asChild>{tag}</TooltipTrigger>
          <TooltipContent sideOffset={8}>
            {stringTooltip ? (
              <span className="hito-tooltip-meta block">{stringTooltip}</span>
            ) : (
              tooltip
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
HitoMetadataTag.displayName = "HitoMetadataTag";

export { HitoMetadataTag };
