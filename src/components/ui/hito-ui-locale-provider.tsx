/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_RESOLVED_UI_LOCALE, type ResolvedUiLocale } from "@/lib/ui-locale";
import {
  formatHitoProductMessage,
  getHitoProductMessage,
  type HitoProductMessageKey,
} from "@/lib/ui-locale-messages";

const HitoUiLocaleContext = createContext<ResolvedUiLocale | null>(null);
const globalUiLocaleListeners = new Set<() => void>();
let globalUiLocaleSnapshot: ResolvedUiLocale = DEFAULT_RESOLVED_UI_LOCALE;

export function HitoUiLocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: ResolvedUiLocale;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    if (globalUiLocaleSnapshot !== locale) {
      globalUiLocaleSnapshot = locale;
      globalUiLocaleListeners.forEach((listener) => listener());
    }
  }, [locale]);

  return <HitoUiLocaleContext.Provider value={locale}>{children}</HitoUiLocaleContext.Provider>;
}

export function useHitoUiLocale(): ResolvedUiLocale {
  const contextLocale = useContext(HitoUiLocaleContext);
  const globalLocale = useSyncExternalStore(
    subscribeGlobalUiLocale,
    getGlobalUiLocaleSnapshot,
    getGlobalUiLocaleSnapshot,
  );

  return contextLocale ?? globalLocale;
}

export function useHitoProductMessage() {
  const locale = useHitoUiLocale();

  return useMemo(
    () => (key: HitoProductMessageKey, values?: Readonly<Record<string, string | number>>) =>
      values ? formatHitoProductMessage(locale, key, values) : getHitoProductMessage(locale, key),
    [locale],
  );
}

function subscribeGlobalUiLocale(listener: () => void) {
  globalUiLocaleListeners.add(listener);
  return () => {
    globalUiLocaleListeners.delete(listener);
  };
}

function getGlobalUiLocaleSnapshot() {
  return globalUiLocaleSnapshot;
}
