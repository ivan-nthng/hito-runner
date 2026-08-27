"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { HitoButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useHitoProductMessage } from "@/components/ui/hito-ui-locale-provider";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  overlayClassName?: string;
  showCloseButton?: boolean;
};

function isVisibleTabStop(element: HTMLElement, container: HTMLElement) {
  const style = window.getComputedStyle(element);

  return (
    style.visibility !== "hidden" &&
    element.getClientRects().length > 0 &&
    container.contains(element)
  );
}

function getDialogTabStops(container: HTMLElement) {
  const candidates: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as HTMLElement;
      const hiddenInput = element instanceof HTMLInputElement && element.type === "hidden";

      if (
        element.tabIndex < 0 ||
        element.hidden ||
        hiddenInput ||
        ("disabled" in element && Boolean(element.disabled))
      ) {
        return NodeFilter.FILTER_SKIP;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    const candidate = walker.currentNode as HTMLElement;

    if (isVisibleTabStop(candidate, container)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function containDialogTab(event: React.KeyboardEvent<HTMLElement>) {
  if (
    event.key !== "Tab" ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.defaultPrevented
  ) {
    return;
  }

  const container = event.currentTarget;
  const tabStops = getDialogTabStops(container);
  const first = tabStops.at(0);
  const last = tabStops.at(-1);
  const focused = container.ownerDocument.activeElement;

  if (!first || !last) {
    if (focused === container) {
      event.preventDefault();
    }
    return;
  }

  if (event.shiftKey && (focused === first || focused === container)) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && focused === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "hito-ui-overlay fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, onKeyDown, overlayClassName, showCloseButton = true, ...props }, ref) => {
  const t = useHitoProductMessage();

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        data-hito-component="dialog"
        className={cn(
          "hito-ui-dialog-surface fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className,
        )}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          containDialogTab(event);
        }}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <HitoButton
              type="button"
              aria-label={t("Close")}
              className="absolute right-4 top-4"
              data-hito-dialog-close=""
              iconOnly
              size="sm"
              variant="ghost"
            >
              <Icon aria-hidden="true" name="close" size="sm" />
            </HitoButton>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("hito-ui-dialog-header", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("hito-ui-dialog-footer", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("hito-ui-dialog-title", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("hito-ui-dialog-description", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
