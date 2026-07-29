import { lazy, Suspense } from "react";
import { useLocalDevtoolBoundary } from "@/components/devtools/local-devtool-boundary";

const LocalDevtoolMenuItemRuntime = lazy(() =>
  import("@/components/devtools/LocalDevtoolRuntime").then((module) => ({
    default: module.LocalDevtoolMenuItemRuntime,
  })),
);

export function LocalDevtoolMenuItem({
  itemClassName,
  separatorClassName,
}: {
  itemClassName?: string;
  separatorClassName?: string;
}) {
  const available = useLocalDevtoolBoundary();

  if (!available) return null;

  return (
    <Suspense fallback={null}>
      <LocalDevtoolMenuItemRuntime
        itemClassName={itemClassName}
        separatorClassName={separatorClassName}
      />
    </Suspense>
  );
}
