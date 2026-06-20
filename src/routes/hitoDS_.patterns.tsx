import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import { HitoDesignSystemReferencePage } from "@/routes/hitoDS";

export const Route = createFileRoute("/hitoDS_/patterns")({
  head: () => ({
    meta: [
      { title: `Hito DS Patterns — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Hito design-system pattern reference for composed product surfaces and operational patterns.",
      },
    ],
  }),
  component: HitoDesignSystemPatternsPage,
});

function HitoDesignSystemPatternsPage() {
  return <HitoDesignSystemReferencePage pageId="patterns" />;
}
