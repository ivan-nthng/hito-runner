import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/app-config";
import { HitoDesignSystemReferencePage } from "@/routes/hitoDS";

export const Route = createFileRoute("/hitoDS_/foundations")({
  head: () => ({
    meta: [
      { title: `Hito DS Foundations — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Hito design-system foundations for brand, tokens, typography, gradients, and icons.",
      },
    ],
  }),
  component: HitoDesignSystemFoundationsPage,
});

function HitoDesignSystemFoundationsPage() {
  return <HitoDesignSystemReferencePage pageId="foundations" />;
}
