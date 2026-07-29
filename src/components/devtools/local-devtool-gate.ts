import { useEffect, useState } from "react";
import { canLoadLocalDevtool } from "@/components/devtools/local-devtool-boundary";

export const LOCAL_UI_INSPECTOR_STORAGE_KEY = "hito.localUiInspector.enabled";
export const LOCAL_UI_INSPECTOR_TOGGLE_EVENT = "hito:local-ui-inspector-toggle";

export function canUseLocalUiInspector(hostname?: string) {
  return canLoadLocalDevtool(hostname);
}

export function readLocalUiInspectorEnabled() {
  if (typeof window === "undefined" || !canUseLocalUiInspector()) return false;
  return window.localStorage.getItem(LOCAL_UI_INSPECTOR_STORAGE_KEY) === "true";
}

export function writeLocalUiInspectorEnabled(enabled: boolean) {
  if (typeof window === "undefined" || !canUseLocalUiInspector()) return;

  if (enabled) {
    window.localStorage.setItem(LOCAL_UI_INSPECTOR_STORAGE_KEY, "true");
  } else {
    window.localStorage.removeItem(LOCAL_UI_INSPECTOR_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(LOCAL_UI_INSPECTOR_TOGGLE_EVENT));
}

export function useLocalUiInspectorToggle() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    if (!canUseLocalUiInspector()) {
      setAvailable(false);
      setEnabledState(false);
      return;
    }

    const syncLocalInspectorState = () => {
      setAvailable(true);
      setEnabledState(readLocalUiInspectorEnabled());
    };

    syncLocalInspectorState();
    window.addEventListener("storage", syncLocalInspectorState);
    window.addEventListener(LOCAL_UI_INSPECTOR_TOGGLE_EVENT, syncLocalInspectorState);

    return () => {
      window.removeEventListener("storage", syncLocalInspectorState);
      window.removeEventListener(LOCAL_UI_INSPECTOR_TOGGLE_EVENT, syncLocalInspectorState);
    };
  }, []);

  return {
    available,
    enabled,
    setEnabled: writeLocalUiInspectorEnabled,
  };
}
