import { useId, type ComponentPropsWithoutRef, type ChangeEvent } from "react";

import {
  hitoFieldClasses,
  type HitoFieldFeedback,
  type HitoFieldSize,
  type HitoFieldVariant,
} from "@/components/ui/hito-control-contract";
import { cn } from "@/lib/utils";

export type HitoNativeSelectFieldOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type HitoNativeSelectFieldProps = Omit<
  ComponentPropsWithoutRef<"select">,
  "children" | "className" | "onChange"
> & {
  className?: string;
  helper?: string;
  label: string;
  labelClassName?: string;
  onValueChange?: (value: string) => void;
  options: HitoNativeSelectFieldOption[];
  selectClassName?: string;
  feedback?: HitoFieldFeedback;
  size?: HitoFieldSize;
  variant?: HitoFieldVariant;
};

export function HitoNativeSelectField({
  className,
  helper,
  feedback = "neutral",
  id,
  label,
  labelClassName,
  onValueChange,
  options,
  selectClassName,
  size = "md",
  variant = "primary",
  "aria-describedby": ariaDescribedBy,
  ...selectProps
}: HitoNativeSelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = helper ? `${selectId}-helper` : undefined;
  const describedBy = [ariaDescribedBy, helperId].filter(Boolean).join(" ") || undefined;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <label className={cn("grid min-w-0 gap-2", className)}>
      <span className={cn("hito-label-md", labelClassName)}>{label}</span>
      <select
        {...selectProps}
        id={selectId}
        aria-describedby={describedBy}
        className={hitoFieldClasses({ className: selectClassName, feedback, size, variant })}
        data-hito-component="native-select-field"
        onChange={onValueChange ? handleChange : undefined}
      >
        {options.map((option) => (
          <option
            key={option.value || option.label}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helper ? (
        <span id={helperId} className="hito-field-helper">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
