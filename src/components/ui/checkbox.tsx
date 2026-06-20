import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn("hito-checkbox hito-checkbox-md peer", className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("grid place-content-center text-current")}>
      <Icon name="check" size="xs" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
