import { createFileRoute } from "@tanstack/react-router";
import { HitoDesignSystemReferencePage } from "@/components/hito-ds/reference-page";
import { APP_NAME } from "@/lib/app-config";

export { HitoDesignSystemReferencePage } from "@/components/hito-ds/reference-page";
export { HITO_DS_PAGE_ROUTES } from "@/components/hito-ds/reference-model";
export type { HitoDsPageId } from "@/components/hito-ds/reference-model";

export const Route = createFileRoute("/hitoDS")({
  head: () => ({
    meta: [
      { title: `Hito Design System — ${APP_NAME}` },
      {
        name: "description",
        content: "Internal Hito design-system reference for the simplified Hito product language.",
      },
    ],
  }),
  component: HitoDesignSystemPage,
});

function HitoDesignSystemPage() {
  return <HitoDesignSystemReferencePage pageId="overview" />;
}
