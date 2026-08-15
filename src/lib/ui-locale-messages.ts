import type { ResolvedUiLocale } from "@/lib/ui-locale";

export interface HitoSharedShellMessages {
  languageMenu: {
    triggerLabel: string;
    menuLabel: string;
    optionLabels: Record<ResolvedUiLocale, string>;
    deviceStatus: Record<ResolvedUiLocale, string>;
    explicitStatus: Record<ResolvedUiLocale, string>;
    resetToDevice: string;
  };
}

export const HITO_SHARED_SHELL_MESSAGES = {
  en: {
    languageMenu: {
      triggerLabel: "Choose language",
      menuLabel: "Language",
      optionLabels: {
        en: "English",
        "pt-BR": "Português (Brasil)",
      },
      deviceStatus: {
        en: "Device language: English",
        "pt-BR": "Device language: Portuguese (Brazil)",
      },
      explicitStatus: {
        en: "Selected language: English",
        "pt-BR": "Selected language: Portuguese (Brazil)",
      },
      resetToDevice: "Use device language",
    },
  },
  "pt-BR": {
    languageMenu: {
      triggerLabel: "Escolher idioma",
      menuLabel: "Idioma",
      optionLabels: {
        en: "English",
        "pt-BR": "Português (Brasil)",
      },
      deviceStatus: {
        en: "Idioma do dispositivo: inglês",
        "pt-BR": "Idioma do dispositivo: português (Brasil)",
      },
      explicitStatus: {
        en: "Idioma selecionado: inglês",
        "pt-BR": "Idioma selecionado: português (Brasil)",
      },
      resetToDevice: "Usar o idioma do dispositivo",
    },
  },
} as const satisfies Record<ResolvedUiLocale, HitoSharedShellMessages>;

export function getHitoSharedShellMessages(locale: ResolvedUiLocale): HitoSharedShellMessages {
  return HITO_SHARED_SHELL_MESSAGES[locale];
}
