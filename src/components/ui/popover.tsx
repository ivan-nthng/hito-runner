import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

type HitoPopoverContextValue = {
  anchorRef: React.RefObject<HTMLElement | null>;
};

const HitoPopoverContext = React.createContext<HitoPopoverContextValue | null>(null);

function Popover(props: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) {
  const anchorRef = React.useRef<HTMLElement | null>(null);

  return (
    <HitoPopoverContext.Provider value={{ anchorRef }}>
      <PopoverPrimitive.Root {...props} />
    </HitoPopoverContext.Provider>
  );
}

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>(({ onFocusCapture, ...props }, forwardedRef) => {
  const context = React.useContext(HitoPopoverContext);

  return (
    <PopoverPrimitive.Anchor
      ref={(node) => {
        if (context) {
          context.anchorRef.current = node;
        }

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const anchor = event.currentTarget;
        const bounds = anchor.getBoundingClientRect();
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

        if (
          bounds.top < 0 ||
          bounds.left < 0 ||
          bounds.bottom > viewportHeight ||
          bounds.right > viewportWidth
        ) {
          anchor.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }}
      {...props}
    />
  );
});
PopoverAnchor.displayName = PopoverPrimitive.Anchor.displayName;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    {
      className,
      align = "center",
      collisionPadding = 12,
      onCloseAutoFocus,
      onFocusOutside,
      sideOffset = 4,
      ...props
    },
    ref,
  ) => {
    const context = React.useContext(HitoPopoverContext);

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          collisionPadding={collisionPadding}
          sideOffset={sideOffset}
          data-hito-component="popover"
          className={cn(
            "hito-ui-popover-surface hito-surface z-50 w-72 p-4 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
            className,
          )}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);

            if (event.defaultPrevented || document.activeElement !== document.body) {
              return;
            }

            const anchor = context?.anchorRef.current;
            const focusTarget =
              anchor?.tabIndex != null && anchor.tabIndex >= 0
                ? anchor
                : anchor?.querySelector<HTMLElement>(
                    "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
                  );

            if (focusTarget) {
              event.preventDefault();
              focusTarget.focus({ preventScroll: true });
            }
          }}
          onFocusOutside={(event) => {
            onFocusOutside?.(event);

            if (
              !event.defaultPrevented &&
              context?.anchorRef.current?.contains(event.target as Node)
            ) {
              event.preventDefault();
            }
          }}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
