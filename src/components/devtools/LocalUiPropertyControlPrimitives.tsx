import { type CSSProperties, useId, useRef } from "react";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import {
  HitoValueTag,
  HitoValueTagRemoveButton,
  HitoValueTagSelectTrigger,
} from "@/components/ui/value-tag";
import type {
  InlineChangeColorControlInput,
  InlineChangeColorTokenOption,
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

export function ColorValueSelect({
  ariaLabel,
  control,
  desiredValue,
  onValueChange,
}: {
  ariaLabel: string;
  control: InlineChangeColorControlInput;
  desiredValue: string | null;
  onValueChange: (value: string) => void;
}) {
  const desiredOption = control.options.find((option) => option.id === desiredValue) ?? null;
  const isRemoval = desiredValue === "__remove";
  const displayedOption = desiredOption ?? control.currentToken;
  const displayLabel = isRemoval
    ? "Remove color"
    : (displayedOption?.label ?? control.currentLabel);
  const displayColor = displayedOption?.previewColor ?? control.currentColor;
  const displayAlpha = displayedOption?.alphaPercent ?? control.alphaPercent;
  const tooltip = isRemoval
    ? `Remove the ${control.label.toLowerCase()} declaration at the eventual canonical source seam.`
    : getColorDetail(displayedOption, {
        alphaPercent: control.alphaPercent,
        color: control.currentColor,
        hex: control.currentHex,
        label: control.currentLabel,
      });

  return (
    <Select value={desiredValue ?? "__keep"} onValueChange={(value) => onValueChange(value)}>
      <HitoValueTagSelectTrigger
        aria-label={`${ariaLabel}. ${tooltip}`}
        title={tooltip}
        className="min-w-24 max-w-40"
        tone={desiredOption || isRemoval ? "signal" : control.currentToken ? "desired" : "neutral"}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <ColorSwatch alphaPercent={displayAlpha} color={displayColor} />
          <span className="truncate">{displayLabel}</span>
        </span>
      </HitoValueTagSelectTrigger>
      <SelectContent
        align="end"
        className="z-[94] w-80 max-w-[calc(100vw-1rem)]"
        data-local-ui-inspector-layer=""
      >
        <SelectItem value="__keep">
          <ColorSelectOption
            alphaPercent={control.alphaPercent}
            color={control.currentColor}
            detail={getColorDetail(control.currentToken, {
              alphaPercent: control.alphaPercent,
              color: control.currentColor,
              hex: control.currentHex,
              label: control.currentLabel,
            })}
            label="Keep current"
          />
        </SelectItem>
        {control.options.map((option) => (
          <SelectItem
            key={option.id}
            aria-label={`Use Hito color ${option.label}. ${getColorDetail(option)}`}
            value={option.id}
          >
            <ColorSelectOption
              alphaPercent={option.alphaPercent}
              color={option.previewColor}
              detail={getColorDetail(option)}
              label={option.label}
            />
          </SelectItem>
        ))}
        <SelectItem
          aria-label={`Remove ${control.label.toLowerCase()} color declaration`}
          value="__remove"
        >
          <span className="grid min-w-0 gap-0.5 text-destructive">
            <span className="hito-label-md truncate">Remove color</span>
            <span className="hito-body-xs line-clamp-2 text-muted-foreground">
              Request removal of the {control.declarationProperty} declaration; no live preview.
            </span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ColorSwatch({
  alphaPercent,
  color,
  size = "sm",
}: {
  alphaPercent: number;
  color: string;
  size?: "lg" | "sm";
}) {
  const isTranslucent = alphaPercent < 100;

  return (
    <span
      aria-hidden="true"
      className={
        size === "lg"
          ? "block size-7 shrink-0 rounded border border-hairline"
          : "block size-3 shrink-0 rounded-sm border border-hairline"
      }
      style={{
        backgroundColor: color,
        backgroundImage: isTranslucent
          ? `linear-gradient(${color}, ${color}), conic-gradient(#ffffff 25%, #d1d1d1 0 50%, #ffffff 0 75%, #d1d1d1 0)`
          : undefined,
        backgroundSize: isTranslucent ? "100% 100%, 6px 6px" : undefined,
      }}
    />
  );
}

function ColorSelectOption({
  alphaPercent,
  color,
  detail,
  label,
}: {
  alphaPercent: number;
  color: string;
  detail: string;
  label: string;
}) {
  return (
    <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
      <ColorSwatch alphaPercent={alphaPercent} color={color} size="lg" />
      <span className="grid min-w-0 gap-0.5">
        <span className="hito-label-md truncate text-foreground">{label}</span>
        <span className="hito-body-xs line-clamp-3 text-muted-foreground">{detail}</span>
      </span>
    </span>
  );
}

function getColorDetail(
  option: InlineChangeColorTokenOption | null,
  fallback?: { alphaPercent: number; color: string; hex: string; label: string },
) {
  if (!option) {
    return [
      fallback?.label ?? "Custom (computed)",
      fallback?.hex,
      fallback ? `alpha ${fallback.alphaPercent}%` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return [
    option.label,
    option.cssVariable,
    option.source ? `source ${option.source}` : null,
    option.resolvedHex,
    `alpha ${option.alphaPercent}%`,
  ]
    .filter(Boolean)
    .join(" · ");
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
      <span className="hito-label-md truncate text-foreground">{name}</span>
      <span className="hito-body-xs line-clamp-2 text-muted-foreground" title={descriptor}>
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
