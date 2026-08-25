import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { useHitoRadioGroup } from "@/components/ui/hito-radio-group";
import { HitoChoiceToggle } from "@/components/ui/hito-choice-toggle";
import type { HitoChoiceToggleSize } from "@/components/ui/hito-control-contract";
import { parseHitoThemePreference } from "@/lib/theme-preference";
import {
  HITO_THEME_PREFERENCES,
  THEME_OPTION_COPY,
  useHitoThemePreference,
} from "@/components/settings/use-hito-theme-preference";
import { useHitoProductMessage, useHitoUiLocale } from "@/components/ui/hito-ui-locale-provider";
import { getHitoKnownProductMessage } from "@/lib/ui-locale-messages";

export function ThemePreferenceChoiceGroup({
  buttonClassName,
  className,
  label = "Theme",
  size = "xs",
}: {
  buttonClassName?: string;
  className?: string;
  label?: string | null;
  size?: HitoChoiceToggleSize;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const labelId = useId();
  const { choosePreference, preference, resolvedTheme } = useHitoThemePreference();
  const resolvedLabel = message(resolvedTheme === "light" ? "Light" : "Dark");
  const themeGroup = useHitoRadioGroup({
    items: HITO_THEME_PREFERENCES.map((value) => ({ value })),
    value: preference,
  });

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        className="hito-choice-toggle-group flex-nowrap"
        {...themeGroup.groupProps}
        aria-label={label ? undefined : message("Theme preference")}
        aria-labelledby={label ? labelId : undefined}
      >
        {HITO_THEME_PREFERENCES.map((option) => {
          const copy = THEME_OPTION_COPY[option];
          const selected = preference === option;

          return (
            <HitoChoiceToggle
              key={option}
              size={size}
              {...themeGroup.getRadioProps(option)}
              className={cn("min-w-0 flex-1", buttonClassName)}
              selected={selected}
              title={`${getHitoKnownProductMessage(locale, copy.description)} ${message(
                "Resolved theme: {theme}.",
                { theme: resolvedLabel },
              )}`}
              onClick={() => choosePreference(option)}
            >
              {getHitoKnownProductMessage(locale, copy.label)}
            </HitoChoiceToggle>
          );
        })}
      </div>
      {label ? (
        <p id={labelId} className="hito-label-md text-foreground">
          {getHitoKnownProductMessage(locale, label)}
        </p>
      ) : null}
    </div>
  );
}

export function ThemePreferenceMenuItems({
  itemClassName,
  labelClassName,
}: {
  itemClassName?: string;
  labelClassName?: string;
}) {
  const locale = useHitoUiLocale();
  const message = useHitoProductMessage();
  const { choosePreference, preference, resolvedTheme } = useHitoThemePreference();
  const resolvedLabel = message(resolvedTheme === "light" ? "Light" : "Dark");

  return (
    <>
      <DropdownMenuLabel
        className={cn("hito-label-sm uppercase tracking-[0.18em] text-tertiary", labelClassName)}
      >
        {message("Theme")}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={preference}
        onValueChange={(value) => choosePreference(parseHitoThemePreference(value))}
      >
        {HITO_THEME_PREFERENCES.map((option) => {
          const copy = THEME_OPTION_COPY[option];

          return (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              className={cn("gap-2", itemClassName)}
              title={`${getHitoKnownProductMessage(locale, copy.description)} ${message(
                "Resolved theme: {theme}.",
                { theme: resolvedLabel },
              )}`}
            >
              <span className="min-w-0 flex-1">
                {getHitoKnownProductMessage(locale, copy.label)}
              </span>
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}
