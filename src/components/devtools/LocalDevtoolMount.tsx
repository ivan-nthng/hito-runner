import { lazy, Suspense } from "react";
import { useLocalUiInspectorToggle } from "@/components/devtools/local-devtool-gate";

const LocalUiInspector = lazy(() =>
  import("@/components/devtools/LocalUiInspector").then((module) => ({
    default: module.LocalUiInspector,
  })),
);

export function LocalDevtoolMount() {
  const localInspector = useLocalUiInspectorToggle();

  if (!localInspector.enabled) return null;

  return (
    <Suspense fallback={null}>
      <LocalUiInspector />
    </Suspense>
  );
}
