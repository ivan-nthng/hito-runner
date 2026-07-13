import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_HITO_THEME_PREFERENCE,
  HITO_THEME_PREFERENCES,
  HITO_THEME_STORAGE_KEY,
  applyHitoResolvedTheme,
  readStoredHitoThemePreference,
  resolveHitoThemePreference,
  type HitoResolvedTheme,
  type HitoThemePreference,
  writeStoredHitoThemePreference,
} from "@/lib/theme-preference";

const HITO_THEME_PREFERENCE_EVENT = "hito-theme-preference-change";

export const THEME_OPTION_COPY: Record<
  HitoThemePreference,
  { description: string; label: string }
> = {
  system: {
    description: "Follow this device.",
    label: "System",
  },
  dark: {
    description: "Keep Hito dark.",
    label: "Dark",
  },
  light: {
    description: "Use the light palette.",
    label: "Light",
  },
};

export function useHitoThemePreference() {
  const [preference, setPreference] = useState<HitoThemePreference>(DEFAULT_HITO_THEME_PREFERENCE);
  const [resolvedTheme, setResolvedTheme] = useState<HitoResolvedTheme>("dark");

  useEffect(() => {
    const syncTheme = () => {
      const nextPreference = readStoredHitoThemePreference();
      const nextResolvedTheme = resolveHitoThemePreference(nextPreference);

      setPreference(nextPreference);
      setResolvedTheme(nextResolvedTheme);
      applyHitoResolvedTheme(nextResolvedTheme);
    };

    syncTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleMediaChange = () => {
      setPreference((currentPreference) => {
        if (currentPreference !== "system") {
          return currentPreference;
        }

        const nextResolvedTheme = resolveHitoThemePreference("system");
        setResolvedTheme(nextResolvedTheme);
        applyHitoResolvedTheme(nextResolvedTheme);
        return currentPreference;
      });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HITO_THEME_STORAGE_KEY || event.key === null) {
        syncTheme();
      }
    };

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener(HITO_THEME_PREFERENCE_EVENT, syncTheme);

    return () => {
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(HITO_THEME_PREFERENCE_EVENT, syncTheme);
    };
  }, []);

  const choosePreference = (nextPreference: HitoThemePreference) => {
    const nextResolvedTheme = resolveHitoThemePreference(nextPreference);

    writeStoredHitoThemePreference(nextPreference);
    setPreference(nextPreference);
    setResolvedTheme(nextResolvedTheme);
    applyHitoResolvedTheme(nextResolvedTheme);
    window.dispatchEvent(new CustomEvent(HITO_THEME_PREFERENCE_EVENT));
  };

  const activeDescription = useMemo(() => {
    const preferenceLabel = THEME_OPTION_COPY[preference].label;
    const resolvedLabel = resolvedTheme === "light" ? "Light" : "Dark";

    return preference === "system"
      ? `${preferenceLabel} is active. Hito is currently using ${resolvedLabel}.`
      : `${preferenceLabel} is active.`;
  }, [preference, resolvedTheme]);

  return {
    activeDescription,
    choosePreference,
    preference,
    resolvedTheme,
  };
}

export { HITO_THEME_PREFERENCES };
