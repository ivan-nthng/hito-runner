import { type CSSProperties, useId, useRef } from "react";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import {
  HitoValueTag,
  HitoValueTagRemoveButton,
  HitoValueTagSelectTrigger,
} from "@/components/ui/value-tag";
import type {
  InlineChangeTokenControlInput,
  InlineChangeTypographyEvidence,
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
  tone: "available" | "desired" | "neutral";
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
        tone={tone === "desired" ? "signal" : tone === "available" ? "desired" : tone}
      >
        {displayValue}
      </HitoValueTagSelectTrigger>
      <SelectContent align="end" className="z-[94] w-44" data-local-ui-inspector-layer="">
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
  tone?: "available" | "current" | "desired" | "neutral";
  tooltip?: string;
  value: string;
}) {
  return (
    <HitoValueTag
      title={tooltip}
      aria-label={tooltip}
      tone={tone === "desired" ? "signal" : tone === "available" ? "desired" : tone}
    >
      {value}
    </HitoValueTag>
  );
}

export function TypographyRoleSelect({
  currentTypography,
  currentRoleId,
  displayLabel,
  onDesiredRoleChange,
  options,
  selectedRoleId,
  tone,
  tooltip,
}: {
  currentTypography: InlineChangeTypographyEvidence;
  currentRoleId: string | null;
  displayLabel: string;
  onDesiredRoleChange: (roleId: string | null) => void;
  options: InlineChangeTypographyRoleOption[];
  selectedRoleId: string | null;
  tone: "desired" | "neutral";
  tooltip: string;
}) {
  const restoreFocusAfterSelection = useRef<(() => void) | null>(null);
  const triggerId = useId();

  return (
    <Select
      value={selectedRoleId ?? "__keep"}
      onValueChange={(roleId) => {
        const restoreFocusAfterKeyUp = createTypographyTriggerFocusRestorer(triggerId);

        document.addEventListener("keyup", restoreFocusAfterKeyUp, {
          capture: true,
          once: true,
        });
        window.setTimeout(
          () => document.removeEventListener("keyup", restoreFocusAfterKeyUp, true),
          100,
        );
        restoreFocusAfterSelection.current = restoreFocusAfterKeyUp;
        onDesiredRoleChange(roleId === "__keep" || roleId === currentRoleId ? null : roleId);
      }}
    >
      <HitoValueTagSelectTrigger
        id={triggerId}
        aria-label={`Change desired typography role. ${tooltip}`}
        title={tooltip}
        className="min-w-24 max-w-36"
        tone={tone === "desired" ? "signal" : tone}
      >
        {displayLabel}
      </HitoValueTagSelectTrigger>
      <SelectContent
        align="end"
        className="z-[94] w-72 max-w-[calc(100vw-1rem)]"
        data-local-ui-inspector-layer=""
        onCloseAutoFocus={(event) => {
          const restoreFocus = restoreFocusAfterSelection.current;
          if (!restoreFocus) return;

          restoreFocusAfterSelection.current = null;
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SelectItem
          aria-label={`Keep current typography: ${
            currentTypography.currentRole?.label ?? "Custom"
          }. ${getCurrentTypographyDescriptor(currentTypography)}`}
          className="items-center"
          value="__keep"
        >
          <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.9fr)] items-center gap-3">
            <span
              aria-hidden="true"
              className="block min-w-0 truncate"
              style={getCurrentTypographyPreviewStyle(currentTypography)}
            >
              Ab
            </span>
            <TypographyOptionDetails
              descriptor={getCurrentTypographyDescriptor(currentTypography)}
              name={currentTypography.currentRole?.label ?? "Custom"}
            />
          </span>
        </SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.id}
            aria-label={`Use Hito typography role ${option.label}. ${option.spec}`}
            className="items-center"
            value={option.id}
          >
            <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.9fr)] items-center gap-3">
              <span
                aria-hidden="true"
                className={`${option.className} block min-w-0 overflow-hidden`}
                style={{ textTransform: "none" }}
              >
                Ab
              </span>
              <TypographyOptionDetails descriptor={option.spec} name={option.label} />
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getCurrentTypographyPreviewStyle(
  typography: InlineChangeTypographyEvidence,
): CSSProperties {
  return {
    fontFamily: typography.fontFamily ?? undefined,
    fontFeatureSettings: typography.fontFeatureSettings ?? undefined,
    fontSize: typography.fontSize ?? undefined,
    fontStyle: typography.fontStyle ?? undefined,
    fontVariantNumeric: typography.fontVariantNumeric ?? undefined,
    fontVariationSettings: typography.fontVariationSettings ?? undefined,
    fontWeight: typography.fontWeight ?? undefined,
    letterSpacing: typography.letterSpacing ?? undefined,
    lineHeight: typography.lineHeight ?? undefined,
    textTransform: "none",
  };
}

function createTypographyTriggerFocusRestorer(triggerId: string) {
  const rowSelector = '[data-local-ui-property-control-row="typography"]';
  const rows = Array.from(document.querySelectorAll<HTMLElement>(rowSelector));
  const triggerRow = document.getElementById(triggerId)?.closest<HTMLElement>(rowSelector);
  const triggerRowIndex = triggerRow ? rows.indexOf(triggerRow) : -1;

  return () => {
    const nextTrigger =
      triggerRowIndex >= 0
        ? document
            .querySelectorAll<HTMLElement>(rowSelector)
            .item(triggerRowIndex)
            ?.querySelector<HTMLElement>('[role="combobox"]')
        : document.getElementById(triggerId);

    nextTrigger?.focus({ preventScroll: true });
  };
}

function TypographyOptionDetails({ descriptor, name }: { descriptor: string; name: string }) {
  return (
    <span className="grid min-w-0 gap-0.5">
      <span className="hito-label truncate">{name}</span>
      <span className="hito-caption line-clamp-2 text-muted-foreground" title={descriptor}>
        {descriptor}
      </span>
    </span>
  );
}

function getCurrentTypographyDescriptor(typography: InlineChangeTypographyEvidence) {
  const fontFamily = typography.fontFamily?.split(",")[0]?.replaceAll(/["']/g, "").trim();

  return (
    [
      fontFamily,
      typography.fontSize,
      typography.fontWeight,
      typography.fontStyle !== "normal" ? typography.fontStyle : null,
      typography.letterSpacing && typography.letterSpacing !== "normal"
        ? typography.letterSpacing
        : null,
      typography.lineHeight ? `lh ${typography.lineHeight}` : null,
      typography.textTransform && typography.textTransform !== "none"
        ? typography.textTransform
        : null,
      typography.fontVariantNumeric && typography.fontVariantNumeric !== "normal"
        ? typography.fontVariantNumeric
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Computed typography"
  );
}
