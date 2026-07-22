import { useEffect, useMemo, useRef, useState } from "react";
import {
  findDuplicateLocalUiInspectorItem,
  LOCAL_UI_INSPECTOR_BATCH_LIMIT,
  updateLocalUiInspectorBatchItem,
  type LocalUiInspectorBatchItem,
} from "@/components/devtools/local-ui-inspector-session";
import type { InlineChangeTargetInput } from "@/components/devtools/local-inline-change-target-utils";

export function useLocalUiInspectorSession(routeKey: string) {
  const [items, setItems] = useState<LocalUiInspectorBatchItem[]>([]);
  const routeRef = useRef(routeKey);

  useEffect(() => {
    if (routeRef.current === routeKey) return;
    routeRef.current = routeKey;
    setItems([]);
  }, [routeKey]);

  return useMemo(
    () => ({
      addItem: (item: LocalUiInspectorBatchItem) => {
        let added = false;
        setItems((current) => {
          if (current.length >= LOCAL_UI_INSPECTOR_BATCH_LIMIT) return current;
          added = true;
          return [...current, item];
        });
        return added;
      },
      findDuplicate: (target: Pick<InlineChangeTargetInput, "selector" | "targetKind">) =>
        findDuplicateLocalUiInspectorItem(items, routeKey, target),
      isFull: items.length >= LOCAL_UI_INSPECTOR_BATCH_LIMIT,
      items,
      removeItem: (itemId: string) =>
        setItems((current) => current.filter((item) => item.id !== itemId)),
      replaceItem: (item: LocalUiInspectorBatchItem) =>
        setItems((current) => updateLocalUiInspectorBatchItem(current, item)),
      resetSession: () => setItems([]),
    }),
    [items, routeKey],
  );
}
