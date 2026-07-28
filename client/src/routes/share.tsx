import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/share")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: "/auth/signin",
      });
    }
  },
  component: () => <Outlet />,
});
