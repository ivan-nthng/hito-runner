import type { ManualWorkoutTemplate } from "@/lib/manual-workout-authoring/templates";
import { cn } from "@/lib/utils";
import { templateWorkoutColorIndicatorStyle } from "@/components/manual-workout/manual-workout-authoring-utils";

export function ManualWorkoutTemplateColorIndicator({
  className,
  compact = false,
  template,
}: {
  className?: string;
  compact?: boolean;
  template: ManualWorkoutTemplate;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 rounded-full border", compact ? "h-4 w-1" : "h-9 w-1.5", className)}
      style={templateWorkoutColorIndicatorStyle(template)}
    />
  );
}
