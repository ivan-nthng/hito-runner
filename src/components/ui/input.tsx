import * as React from "react";

import {
  hitoFieldClasses,
  type HitoFieldFeedback,
  type HitoFieldSize,
  type HitoFieldVariant,
} from "@/components/ui/hito-control-contract";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  feedback?: HitoFieldFeedback;
  size?: HitoFieldSize;
  variant?: HitoFieldVariant;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, feedback = "neutral", size = "sm", type, variant = "primary", ...props }, ref) => {
    return (
      <input
        type={type}
        className={hitoFieldClasses({
          className: cn(
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            className,
          ),
          feedback,
          size,
          variant,
        })}
        data-hito-component="input"
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
