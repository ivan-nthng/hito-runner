import { lazy, Suspense } from "react";
import { useLocalDevtoolBoundary } from "@/components/devtools/local-devtool-boundary";

const LocalDevtoolMountRuntime = lazy(() =>
  import("@/components/devtools/LocalDevtoolRuntime").then((module) => ({
    default: module.LocalDevtoolMountRuntime,
  })),
);

export function LocalDevtoolMount() {
  const available = useLocalDevtoolBoundary();

  if (!available) return null;

  return (
    <Suspense fallback={null}>
      <LocalDevtoolMountRuntime />
    </Suspense>
  );
}
