import { Icon } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
    <button
      type="button"
      className={`absolute -right-1 -top-1 z-10 grid size-4 place-items-center rounded-sm border border-success/25 bg-background text-success shadow-soft outline-none transition-opacity hover:bg-success/10 hover:opacity-100 focus:bg-success/10 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-success group-hover:opacity-100 group-focus-within:opacity-100 ${
        visibility === "hover" ? "opacity-0" : "opacity-70"
      }`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon name="close" size="xs" />
    </button>
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
      <SelectTrigger
        aria-label={`${ariaLabel}. ${tooltip}`}
        title={tooltip}
        className={`hito-field-sm h-7 w-auto min-w-10 max-w-24 rounded-md px-2 py-0 text-xs shadow-none focus-visible:ring-1 [&>svg]:ml-1 [&>svg]:size-3 ${
          tone === "desired"
            ? "border-success/35 bg-success/10 text-success"
            : "border-hairline bg-surface/45 text-foreground"
        }`}
      >
        <span className="hito-technical-mono truncate">{displayValue}</span>
      </SelectTrigger>
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
    <span
      className={`hito-technical-mono inline-flex h-7 min-w-10 shrink-0 items-center justify-center rounded-md border px-2 text-xs ${
        tone === "current"
          ? "border-warn/35 bg-warn/10 text-warn"
          : tone === "desired"
            ? "border-success/35 bg-success/10 text-success"
            : "border-hairline bg-surface/45 text-foreground"
      }`}
      title={tooltip}
      aria-label={tooltip}
      tabIndex={tooltip ? 0 : undefined}
    >
      {value}
    </span>
  );
}

export function TypographyRoleSelect({
  desiredRole,
  displayLabel,
  onDesiredRoleChange,
  options,
  tone,
  tooltip,
}: {
  desiredRole: InlineChangeTypographyRoleOption | null;
  displayLabel: string;
  onDesiredRoleChange: (roleId: string | null) => void;
  options: InlineChangeTypographyRoleOption[];
  tone: "desired" | "neutral";
  tooltip: string;
}) {
  return (
    <Select
      value={desiredRole?.id ?? "__keep"}
      onValueChange={(roleId) => onDesiredRoleChange(roleId === "__keep" ? null : roleId)}
    >
      <SelectTrigger
        aria-label={`Typography desired role. ${tooltip}`}
        title={tooltip}
        className={`hito-field-sm h-7 w-auto min-w-24 max-w-36 rounded-md px-2 py-0 text-xs shadow-none focus-visible:ring-1 [&>svg]:ml-1 [&>svg]:size-3 ${
          tone === "desired"
            ? "border-success/35 bg-success/10 text-success"
            : "border-hairline bg-surface/45 text-foreground"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
      </SelectTrigger>
      <SelectContent align="end" className="z-[73] w-56" data-local-ui-inspector-layer="">
        <SelectItem value="__keep">Keep current</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label} · {option.className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
