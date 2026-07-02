import type { ReactNode } from "react";
import { Icon, type HitoIconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
      onClick={onClick}
      className={cn(
        "hito-button hito-button-sm hito-onboarding-option-button",
        active ? "hito-button-primary" : "hito-button-secondary",
      )}
    >
      {icon ? (
        <span className="hito-onboarding-option-icon" aria-hidden="true">
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="hito-onboarding-option-title block">{label}</span>
        {copy ? <span className="hito-onboarding-option-copy mt-1 block">{copy}</span> : null}
      </span>
    </button>
  );
}
