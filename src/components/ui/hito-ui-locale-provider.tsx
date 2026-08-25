/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_RESOLVED_UI_LOCALE, type ResolvedUiLocale } from "@/lib/ui-locale";
import {
  formatHitoProductMessage,
  getHitoProductMessage,
  type HitoProductMessageKey,
} from "@/lib/ui-locale-messages";

const HitoUiLocaleContext = createContext<ResolvedUiLocale>(DEFAULT_RESOLVED_UI_LOCALE);

export function HitoUiLocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: ResolvedUiLocale;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <HitoUiLocaleContext.Provider value={locale}>{children}</HitoUiLocaleContext.Provider>;
}

export function useHitoUiLocale(): ResolvedUiLocale {
  return useContext(HitoUiLocaleContext);
}

export function useHitoProductMessage() {
  const locale = useHitoUiLocale();

  return useMemo(
    () => (key: HitoProductMessageKey, values?: Readonly<Record<string, string | number>>) =>
      values ? formatHitoProductMessage(locale, key, values) : getHitoProductMessage(locale, key),
    [locale],
  );
}
