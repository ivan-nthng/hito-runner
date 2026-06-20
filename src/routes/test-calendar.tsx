import { createFileRoute } from "@tanstack/react-router";

import { TestCalendarSandbox } from "@/components/test-calendar/test-calendar-sandbox";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/test-calendar")({
  head: () => ({
    meta: [
      { title: `Test calendar sandbox - ${APP_NAME}` },
      {
        name: "description",
        content:
          "Static product-design review sandbox for Hito calendar and workout detail surfaces.",
      },
    ],
  }),
  component: TestCalendarSandbox,
});
