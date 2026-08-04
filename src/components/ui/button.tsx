import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import {
  hitoButtonClasses,
  type HitoButtonSize,
  type HitoButtonTone,
  type HitoButtonVariant,
} from "@/components/ui/hito-control-contract";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

type HitoButtonIconContract =
  | { iconOnly: true; "aria-label": string }
  | { iconOnly?: false; "aria-label"?: string };

type HitoButtonNativeContract = {
  asChild?: false;
  loading?: boolean;
  timedProgress?: number;
};

type HitoButtonSlottedContract = {
  asChild: true;
  disabled?: never;
  loading?: never;
  timedProgress?: never;
};

export type HitoButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  HitoButtonIconContract &
  (HitoButtonNativeContract | HitoButtonSlottedContract) & {
    feedback?: "success" | "error";
    size: HitoButtonSize;
    tone?: HitoButtonTone;
    variant: HitoButtonVariant;
  };

const HitoButton = React.forwardRef<HTMLButtonElement, HitoButtonProps>(
  (
    {
      "aria-busy": ariaBusy,
      asChild = false,
      children,
      className,
      disabled,
      feedback,
      iconOnly = false,
      loading = false,
      size,
      timedProgress,
      tone = "default",
      variant,
      ...props
    },
    ref,
  ) => {
    const normalizedProgress =
      typeof timedProgress === "number" ? Math.min(1, Math.max(0, timedProgress)) : undefined;
    const visualState = loading
      ? "loading"
      : feedback
        ? feedback
        : normalizedProgress !== undefined
          ? "timed-progress"
          : undefined;
    const sharedProps = {
      "aria-busy": loading ? true : ariaBusy,
      className: hitoButtonClasses({ className, iconOnly, size, variant }),
      "data-hito-component": "button",
      "data-state": visualState,
      "data-tone": tone === "default" ? undefined : tone,
    };

    if (asChild) {
      return (
        <Slot ref={ref} {...sharedProps} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button ref={ref} {...sharedProps} disabled={disabled || loading} {...props}>
        {children}
        {normalizedProgress !== undefined ? (
          <span className="hito-button-progress-track" aria-hidden="true">
            <span
              className="hito-button-progress-fill"
              style={{ "--hito-progress-value": normalizedProgress } as React.CSSProperties}
            />
          </span>
        ) : null}
      </button>
    );
  },
);
HitoButton.displayName = "HitoButton";

// Calendar keeps this compatibility API until its separate replacement gate is accepted.
// eslint-disable-next-line react-refresh/only-export-components
export { Button, HitoButton, buttonVariants };
