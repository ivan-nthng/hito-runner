import { createFileRoute } from "@tanstack/react-router";

import { HitoFigmaExportBoard } from "@/components/hito-ds/figma-export-board";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/hitoDS_/export/figma")({
  head: () => ({
    meta: [
      { title: `Hito DS Figma Export — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Code-owned Hito design-system export board for html.to.design capture into Figma.",
      },
    ],
  }),
  component: HitoFigmaExportBoard,
});
