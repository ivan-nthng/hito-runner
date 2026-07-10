import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import {
  HitoValueTag,
  HitoValueTagRemoveButton,
  HitoValueTagSelectTrigger,
} from "@/components/ui/value-tag";
import type {
  InlineChangeTokenControlInput,
  InlineChangeTypographyRoleOption,
} from "@/components/devtools/local-inline-change-target-utils";

export function PendingChangeRemoveButton({
  ariaLabel,
  onClick,
  visibility = "subtle",
}: {
  ariaLabel: string;
  onClick: () => void;
  visibility?: "hover" | "subtle";
}) {
  return (
    <HitoValueTagRemoveButton aria-label={ariaLabel} onClick={onClick} visibility={visibility} />
  );
}

export function ValueSelect({
  ariaLabel,
  control,
  desiredOption,
  displayValue,
  onValueChange,
  tone,
  tooltip,
}: {
  ariaLabel: string;
  control: InlineChangeTokenControlInput;
  desiredOption: InlineChangeTokenControlInput["options"][number] | null;
  displayValue: string;
  onValueChange: (token: string) => void;
  tone: "desired" | "neutral";
  tooltip: string;
}) {
  return (
    <Select
      value={desiredOption?.token ?? "__keep"}
      onValueChange={(token) => onValueChange(token === "__keep" ? "" : token)}
    >
      <HitoValueTagSelectTrigger
        aria-label={`${ariaLabel}. ${tooltip}`}
        title={tooltip}
        className="max-w-24"
        tone={tone}
      >
        {displayValue}
      </HitoValueTagSelectTrigger>
      <SelectContent align="end" className="z-[73] w-44" data-local-ui-inspector-layer="">
        <SelectItem value="__keep">Keep current</SelectItem>
        {control.options.map((option) => (
          <SelectItem key={option.token} value={option.token}>
            {option.displayValue} · {option.token}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ValueTag({
  tone = "neutral",
  tooltip,
  value,
}: {
  tone?: "current" | "desired" | "neutral";
  tooltip?: string;
  value: string;
}) {
  return (
    <HitoValueTag title={tooltip} aria-label={tooltip} tone={tone}>
      {value}
    </HitoValueTag>
  );
}

export function TypographyRoleSelect({
  currentRoleId,
  displayLabel,
  onDesiredRoleChange,
  options,
  selectedRoleId,
  tone,
  tooltip,
}: {
  currentRoleId: string | null;
  displayLabel: string;
  onDesiredRoleChange: (roleId: string | null) => void;
  options: InlineChangeTypographyRoleOption[];
  selectedRoleId: string | null;
  tone: "desired" | "neutral";
  tooltip: string;
}) {
  return (
    <Select
      value={selectedRoleId ?? "__keep"}
      onValueChange={(roleId) =>
        onDesiredRoleChange(roleId === "__keep" || roleId === currentRoleId ? null : roleId)
      }
    >
      <HitoValueTagSelectTrigger
        aria-label={`Typography desired role. ${tooltip}`}
        title={tooltip}
        className="min-w-24 max-w-36"
        tone={tone}
      >
        {displayLabel}
      </HitoValueTagSelectTrigger>
      <SelectContent align="end" className="z-[73] w-72" data-local-ui-inspector-layer="">
        <SelectItem value="__keep">Keep current</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate">{option.label}</span>
              <span className="hito-caption truncate">
                {[option.technicalDetails, option.className].filter(Boolean).join(" · ")}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
