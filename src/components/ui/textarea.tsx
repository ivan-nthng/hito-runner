import * as React from "react";

import {
  type HitoFieldFeedback,
  type HitoFieldVariant,
  type HitoTextareaSize,
} from "@/components/ui/hito-control-contract";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  feedback?: HitoFieldFeedback;
  size?: HitoTextareaSize;
  variant?: HitoFieldVariant;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, feedback = "neutral", size = "md", variant = "primary", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "hito-field",
          `hito-field-${variant}`,
          `hito-textarea-${size}`,
          feedback !== "neutral" && `hito-field-feedback-${feedback}`,
          className,
        )}
        data-hito-component="textarea"
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
