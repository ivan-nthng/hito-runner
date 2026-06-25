import { useId, type ComponentPropsWithoutRef, type ChangeEvent } from "react";

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
};

export function HitoNativeSelectField({
  className,
  helper,
  id,
  label,
  labelClassName,
  onValueChange,
  options,
  selectClassName,
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
      <span className={cn("hito-form-label", labelClassName)}>{label}</span>
      <select
        {...selectProps}
        id={selectId}
        aria-describedby={describedBy}
        className={cn("hito-field hito-field-md", selectClassName)}
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
