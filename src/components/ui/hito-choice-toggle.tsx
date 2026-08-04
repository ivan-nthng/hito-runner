import * as React from "react";

import {
  hitoChoiceToggleClasses,
  type HitoChoiceToggleSize,
} from "@/components/ui/hito-control-contract";

type HitoChoiceTogglePresentationContract =
  | { presentation?: "inline"; size: HitoChoiceToggleSize }
  | { presentation: "card"; size?: never };

export type HitoChoiceToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  HitoChoiceTogglePresentationContract & {
    selected?: boolean;
  };

export const HitoChoiceToggle = React.forwardRef<HTMLButtonElement, HitoChoiceToggleProps>(
  (
    {
      "aria-checked": ariaChecked,
      "aria-pressed": ariaPressed,
      className,
      presentation = "inline",
      role,
      selected,
      size,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={hitoChoiceToggleClasses({
        className,
        presentation,
        size: presentation === "card" ? "sm" : size,
      })}
      data-hito-component="choice-toggle"
      data-selected={selected ? "true" : undefined}
      role={role}
      aria-checked={role === "radio" ? (ariaChecked ?? selected) : ariaChecked}
      aria-pressed={role === "radio" ? ariaPressed : (ariaPressed ?? selected)}
      {...props}
    />
  ),
);
HitoChoiceToggle.displayName = "HitoChoiceToggle";
