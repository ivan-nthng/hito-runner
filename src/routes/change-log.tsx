import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/change-log")({
  beforeLoad: () => {
    throw redirect({ to: "/changelog" });
  },
  component: () => null,
});
