import type { ReactNode } from "react";
import { Icon, type HitoIconName } from "@/components/ui/icon";

export function OptionGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="hito-onboarding-option-grid" role="radiogroup" aria-label={label}>
      {children}
    </div>
  );
}

export function OptionButton({
  active,
  icon,
  label,
  copy,
  onClick,
}: {
  active: boolean;
  icon?: HitoIconName;
  label: string;
  copy?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
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
