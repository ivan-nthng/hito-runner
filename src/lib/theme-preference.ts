export const HITO_THEME_STORAGE_KEY = "hito.theme.preference.v1";

export const HITO_THEME_PREFERENCES = ["system", "dark", "light"] as const;

export type HitoThemePreference = (typeof HITO_THEME_PREFERENCES)[number];
export type HitoResolvedTheme = "dark" | "light";

export const DEFAULT_HITO_THEME_PREFERENCE: HitoThemePreference = "system";

export function parseHitoThemePreference(value: unknown): HitoThemePreference {
  return value === "dark" || value === "light" || value === "system"
    ? value
    : DEFAULT_HITO_THEME_PREFERENCE;
}

export function resolveHitoThemePreference(
  preference: HitoThemePreference,
  media: Pick<Window, "matchMedia"> | null = typeof window === "undefined" ? null : window,
): HitoResolvedTheme {
  if (preference === "dark" || preference === "light") {
    return preference;
  }

  try {
    return media?.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyHitoResolvedTheme(
  resolvedTheme: HitoResolvedTheme,
  root: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement,
) {
  if (!root) {
    return;
  }

  root.setAttribute("data-hito-theme", resolvedTheme);
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
}

export function readStoredHitoThemePreference(
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined"
    ? null
    : window.localStorage,
): HitoThemePreference {
  try {
    return parseHitoThemePreference(storage?.getItem(HITO_THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_HITO_THEME_PREFERENCE;
  }
}

export function writeStoredHitoThemePreference(
  preference: HitoThemePreference,
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined"
    ? null
    : window.localStorage,
) {
  try {
    storage?.setItem(HITO_THEME_STORAGE_KEY, preference);
  } catch {
    // Theme selection is local UI preference only; failure keeps the current resolved theme.
  }
}

export const HITO_THEME_BOOTSTRAP_SCRIPT = `(() => {
  const storageKey = "hito.theme.preference.v1";
  const fallbackTheme = "dark";
  const root = document.documentElement;

  try {
    const storedPreference = window.localStorage.getItem(storageKey);
    const preference =
      storedPreference === "dark" || storedPreference === "light" || storedPreference === "system"
        ? storedPreference
        : "system";
    const resolvedTheme =
      preference === "dark" || preference === "light"
        ? preference
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : fallbackTheme;

    root.setAttribute("data-hito-theme", resolvedTheme);
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  } catch {
    root.setAttribute("data-hito-theme", fallbackTheme);
    root.classList.add("dark");
    root.style.colorScheme = fallbackTheme;
  }
})();`;
