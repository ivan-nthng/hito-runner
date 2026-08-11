import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import {
  hitoButtonClasses,
  type HitoButtonSize,
  type HitoButtonTone,
  type HitoButtonVariant,
} from "@/components/ui/hito-control-contract";

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

export { HitoButton };
