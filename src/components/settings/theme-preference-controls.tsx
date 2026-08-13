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
  const labelId = useId();
  const { choosePreference, preference, resolvedTheme } = useHitoThemePreference();
  const resolvedLabel = resolvedTheme === "light" ? "Light" : "Dark";
  const themeGroup = useHitoRadioGroup({
    items: HITO_THEME_PREFERENCES.map((value) => ({ value })),
    value: preference,
  });

  return (
    <div className={cn("grid gap-2", className)}>
      <div
        className="hito-choice-toggle-group flex-nowrap"
        {...themeGroup.groupProps}
        aria-label={label ? undefined : "Theme preference"}
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
              title={`${copy.description} Resolved theme: ${resolvedLabel}.`}
              onClick={() => choosePreference(option)}
            >
              {copy.label}
            </HitoChoiceToggle>
          );
        })}
      </div>
      {label ? (
        <p id={labelId} className="hito-label-md text-foreground">
          {label}
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
  const { choosePreference, preference, resolvedTheme } = useHitoThemePreference();
  const resolvedLabel = resolvedTheme === "light" ? "Light" : "Dark";

  return (
    <>
      <DropdownMenuLabel
        className={cn("hito-label-sm uppercase tracking-[0.18em] text-tertiary", labelClassName)}
      >
        Theme
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
              title={`${copy.description} Resolved theme: ${resolvedLabel}.`}
            >
              <span className="min-w-0 flex-1">{copy.label}</span>
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}
