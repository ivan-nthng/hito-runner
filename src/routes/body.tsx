import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/body")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
