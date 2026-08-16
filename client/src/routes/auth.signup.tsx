import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: () => {
    throw redirect({ to: "/auth/signin" });
  },
});
