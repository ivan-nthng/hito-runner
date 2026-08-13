import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type HitoDsWorkbenchOption<Value extends string> = {
  label: string;
  value: Value;
};

type WorkbenchSettingProps<Value extends string> = {
  label: string;
  onChange: (value: Value) => void;
  options: readonly HitoDsWorkbenchOption<Value>[];
  value: Value;
};

export function HitoDsWorkbenchChoiceControl<Value extends string>({
  label,
  onChange,
  options,
  value,
}: WorkbenchSettingProps<Value>) {
  const choiceGroup = useHitoRadioGroup({
    items: options.map((option) => ({ value: option.value })),
    value,
  });

  return (
    <div className="grid min-w-0 gap-2">
      <p className="hito-label-md">{label}</p>
      <div className="hito-choice-toggle-group" {...choiceGroup.groupProps} aria-label={label}>
        {options.map((option) => (
          <HitoChoiceToggle
            key={option.value}
            size="xs"
            {...choiceGroup.getRadioProps(option.value)}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </HitoChoiceToggle>
        ))}
      </div>
    </div>
  );
}

export function HitoDsWorkbenchSelectControl<Value extends string>({
  label,
  onChange,
  options,
  value,
}: WorkbenchSettingProps<Value>) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="hito-label-md">{label}</p>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as Value)}>
        <SelectTrigger aria-label={label} className="min-w-0" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
