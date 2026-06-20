import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import { HitoDesignSystemReferencePage } from "@/routes/hitoDS";

export const Route = createFileRoute("/hitoDS_/components")({
  head: () => ({
    meta: [
      { title: `Hito DS Components — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Hito design-system component reference using the accepted Demo and Variants workbench.",
      },
    ],
  }),
  component: HitoDesignSystemComponentsPage,
});

function HitoDesignSystemComponentsPage() {
  return <HitoDesignSystemReferencePage pageId="components" />;
}
