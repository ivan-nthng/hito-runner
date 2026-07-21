import { createContext, useContext, type ReactNode } from "react";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { useHitoRadioGroup, type HitoRadioOptionProps } from "@/components/ui/hito-radio-group";

const OptionGridContext = createContext<((value: string) => HitoRadioOptionProps) | null>(null);

export function OptionGrid({
  children,
  items,
  label,
  value,
}: {
  children: ReactNode;
  items: ReadonlyArray<{ value: string; disabled?: boolean }>;
  label: string;
  value?: string | null;
}) {
  const radioGroup = useHitoRadioGroup({ items: [...items], value });

  return (
    <OptionGridContext.Provider value={radioGroup.getRadioProps}>
      <div className="hito-onboarding-option-grid" {...radioGroup.groupProps} aria-label={label}>
        {children}
      </div>
    </OptionGridContext.Provider>
  );
}

export function OptionButton({
  active,
  icon,
  label,
  copy,
  onClick,
  value,
}: {
  active: boolean;
  icon?: HitoIconName;
  label: string;
  copy?: string;
  onClick: () => void;
  value: string;
}) {
  const getRadioProps = useContext(OptionGridContext);
  const radioProps = getRadioProps?.(value);

  return (
    <button
      type="button"
      {...radioProps}
      data-selected={active ? "true" : undefined}
      onClick={onClick}
      className="hito-choice-toggle hito-choice-toggle-lg w-full justify-start whitespace-normal text-left"
    >
      {icon ? (
        <span className="shrink-0" aria-hidden="true">
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-semibold leading-tight">{label}</span>
        {copy ? <span className="mt-1 block text-current/70">{copy}</span> : null}
      </span>
    </button>
  );
}
