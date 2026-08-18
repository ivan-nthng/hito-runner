import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
  RESOLVED_UI_LOCALE_VALUES,
  type ResolvedUiLocale,
  type UiLocalePreference,
} from "@/lib/ui-locale";
import { getHitoSharedShellMessages } from "@/lib/ui-locale-messages";

export function HitoLanguageMenuItems({
  onPreferenceChange,
  preference,
  resolvedLocale,
}: {
  onPreferenceChange: (preference: UiLocalePreference) => void;
  preference: UiLocalePreference | null;
  resolvedLocale: ResolvedUiLocale;
}) {
  const messages = getHitoSharedShellMessages(resolvedLocale).languageMenu;
  const explicitPreference = preference === "en" || preference === "pt-BR" ? preference : null;
  const status = explicitPreference
    ? messages.explicitStatus[explicitPreference]
    : messages.deviceStatus[resolvedLocale];

  return (
    <>
      <DropdownMenuLabel className="hito-shell-theme-menu-label" data-hito-language-menu>
        {messages.menuLabel}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={explicitPreference ?? ""}
        onValueChange={(value) => onPreferenceChange(value as ResolvedUiLocale)}
      >
        {RESOLVED_UI_LOCALE_VALUES.map((locale) => (
          <DropdownMenuRadioItem key={locale} value={locale} className="hito-shell-theme-menu-item">
            <span className="min-w-0 flex-1">{messages.optionLabels[locale]}</span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator className="hito-shell-menu-separator" />
      <div className="px-2 py-1.5" role="status" data-hito-language-menu-status>
        <p className="hito-menu-meta whitespace-normal">{status}</p>
      </div>
      {explicitPreference ? (
        <>
          <DropdownMenuSeparator className="hito-shell-menu-separator" />
          <DropdownMenuItem
            className="hito-shell-menu-item"
            onSelect={() => onPreferenceChange("system")}
          >
            <Icon name="refresh" size="sm" decorative />
            <span className="min-w-0 flex-1">{messages.resetToDevice}</span>
          </DropdownMenuItem>
        </>
      ) : null}
    </>
  );
}
