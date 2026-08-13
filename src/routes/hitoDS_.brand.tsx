import { createFileRoute } from "@tanstack/react-router";

import { HitoDesignSystemReferencePage } from "@/routes/hitoDS";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/hitoDS_/brand")({
  head: () => ({
    meta: [
      { title: `Hito DS Brand & Visuals — ${APP_NAME}` },
      {
        name: "description",
        content: "Hito brand marks, imagery, atmosphere, gradients, and overlay reference.",
      },
    ],
  }),
  component: HitoDesignSystemBrandPage,
});

function HitoDesignSystemBrandPage() {
  return <HitoDesignSystemReferencePage pageId="brand" />;
}
