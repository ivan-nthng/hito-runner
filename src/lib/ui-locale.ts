import { z } from "zod";

export const UI_LOCALE_PREFERENCE_VALUES = ["system", "en", "pt-BR"] as const;
export const RESOLVED_UI_LOCALE_VALUES = ["en", "pt-BR"] as const;
export const DEFAULT_UI_LOCALE_PREFERENCE = "system";
export const DEFAULT_RESOLVED_UI_LOCALE = "en";
export const INVALID_STORED_UI_LOCALE_PREFERENCE = "invalid_stored_ui_locale_preference" as const;

export type UiLocalePreference = (typeof UI_LOCALE_PREFERENCE_VALUES)[number];
export type ResolvedUiLocale = (typeof RESOLVED_UI_LOCALE_VALUES)[number];
export type UiLocalePreferenceContractViolation = typeof INVALID_STORED_UI_LOCALE_PREFERENCE;

export interface UiLocalePreferenceReadback {
  preference: UiLocalePreference | null;
  preferenceContractViolation: UiLocalePreferenceContractViolation | null;
}

export interface UiLocaleResolution extends UiLocalePreferenceReadback {
  resolvedLocale: ResolvedUiLocale;
}

export const uiLocalePreferenceSchema = z.enum(UI_LOCALE_PREFERENCE_VALUES);

export function readStoredUiLocalePreference(value: unknown): UiLocalePreferenceReadback {
  if (value == null) {
    return {
      preference: DEFAULT_UI_LOCALE_PREFERENCE,
      preferenceContractViolation: null,
    };
  }

  const parsed = uiLocalePreferenceSchema.safeParse(value);
  if (parsed.success) {
    return { preference: parsed.data, preferenceContractViolation: null };
  }

  return {
    preference: null,
    preferenceContractViolation: INVALID_STORED_UI_LOCALE_PREFERENCE,
  };
}

export function resolveUiLocale(input: {
  storedPreference: unknown;
  acceptLanguage?: string | null;
}): UiLocaleResolution {
  const readback = readStoredUiLocalePreference(input.storedPreference);
  const effectivePreference = readback.preference ?? DEFAULT_UI_LOCALE_PREFERENCE;

  return {
    ...readback,
    resolvedLocale:
      effectivePreference === "en" || effectivePreference === "pt-BR"
        ? effectivePreference
        : resolveRequestUiLocale(input.acceptLanguage),
  };
}

export function resolveRequestUiLocale(
  acceptLanguage: string | null | undefined,
): ResolvedUiLocale {
  const winningRange = winningAcceptLanguageRange(acceptLanguage);
  if (!winningRange || winningRange === "*") {
    return DEFAULT_RESOLVED_UI_LOCALE;
  }

  try {
    const [canonicalRange] = Intl.getCanonicalLocales(winningRange);
    const primaryLanguage = canonicalRange?.split("-", 1)[0]?.toLowerCase();
    return primaryLanguage === "pt" ? "pt-BR" : DEFAULT_RESOLVED_UI_LOCALE;
  } catch {
    return DEFAULT_RESOLVED_UI_LOCALE;
  }
}

function winningAcceptLanguageRange(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const candidates = value.split(",").map((entry, index) => parseLanguageRange(entry, index));
  if (candidates.some((candidate) => candidate === null)) {
    return null;
  }

  return (
    candidates
      .filter((candidate): candidate is LanguageRangeCandidate => candidate !== null)
      .filter((candidate) => candidate.quality > 0)
      .sort((left, right) => right.quality - left.quality || left.index - right.index)[0]?.range ??
    null
  );
}

interface LanguageRangeCandidate {
  range: string;
  quality: number;
  index: number;
}

function parseLanguageRange(entry: string, index: number): LanguageRangeCandidate | null {
  const segments = entry.split(";").map((segment) => segment.trim());
  if (!segments[0] || segments.length > 2) {
    return null;
  }

  const range = segments[0];
  if (range !== "*" && !isValidLanguageRange(range)) {
    return null;
  }

  const quality = segments[1] === undefined ? 1 : parseQuality(segments[1]);
  if (quality === null) {
    return null;
  }

  return { range, quality, index };
}

function isValidLanguageRange(value: string) {
  if (!/^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/.test(value)) {
    return false;
  }

  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

function parseQuality(value: string): number | null {
  const match = /^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i.exec(value);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}
