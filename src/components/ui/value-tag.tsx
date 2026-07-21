import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Icon, type HitoIconName } from "@/components/ui/icon";
import { SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type HitoValueTagTone = "current" | "desired" | "neutral" | "signal";

const HITO_VALUE_TAG_BASE =
  "inline-flex h-7 min-h-7 shrink-0 items-center justify-center rounded-md border px-2 text-xs font-medium leading-none";

const HITO_VALUE_TAG_TONES: Record<HitoValueTagTone, string> = {
  current: "border-warn/35 bg-warn/10 text-warn",
  desired: "border-success/35 bg-success/10 text-success",
  neutral: "border-hairline bg-surface/45 text-foreground",
  signal: "border-signal/35 bg-signal/10 text-signal",
};

export function HitoValueTag({
  children,
  className,
  iconName,
  tabIndex,
  tone = "neutral",
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  iconName?: HitoIconName;
  tone?: HitoValueTagTone;
}) {
  const focusableTabIndex = props.title || props["aria-label"] ? (tabIndex ?? 0) : tabIndex;

  return (
    <span
      {...props}
      data-hito-component="value-tag"
      className={cn(
        HITO_VALUE_TAG_BASE,
        "min-w-10 max-w-40",
        iconName && "gap-1.5",
        HITO_VALUE_TAG_TONES[tone],
        className,
      )}
      tabIndex={focusableTabIndex}
    >
      {iconName ? <Icon name={iconName} size="xs" /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function HitoValueTagRemoveButton({
  className,
  visibility = "subtle",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  visibility?: "hover" | "subtle";
}) {
  return (
    <button
      type="button"
      className={cn(
        "absolute -right-1 -top-1 z-10 grid size-4 place-items-center rounded-sm border border-success/25 bg-background text-success shadow-soft outline-none transition-opacity hover:bg-success/10 hover:opacity-100 focus:bg-success/10 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-success group-hover:opacity-100 group-focus-within:opacity-100",
        visibility === "hover" ? "opacity-0" : "opacity-70",
        className,
      )}
      {...props}
    >
      <Icon name="close" size="xs" />
    </button>
  );
}

export function HitoValueTagSelectTrigger({
  children,
  className,
  tone = "neutral",
  ...props
}: ComponentPropsWithoutRef<typeof SelectTrigger> & {
  tone?: HitoValueTagTone;
}) {
  return (
    <SelectTrigger
      className={cn(
        HITO_VALUE_TAG_BASE,
        "h-7 !h-7 !min-h-7 w-auto min-w-10 max-w-40 justify-center bg-transparent py-0 shadow-none outline-none transition-colors hover:bg-surface/55 focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-surface/55 [&>span:last-child]:hidden",
        tone === "neutral"
          ? HITO_VALUE_TAG_TONES.neutral
          : tone === "desired"
            ? "border-success/35 bg-success/10 text-success hover:bg-success/15 data-[state=open]:bg-success/15"
            : tone === "signal"
              ? "border-signal/35 bg-signal/10 text-signal hover:bg-signal/15 data-[state=open]:bg-signal/15"
              : HITO_VALUE_TAG_TONES.current,
        className,
      )}
      {...props}
    >
      <span className="truncate">{children as ReactNode}</span>
    </SelectTrigger>
  );
}
