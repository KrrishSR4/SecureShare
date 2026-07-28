import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/oauth-callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const userStr = params.get("user");
    const error = params.get("error");

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      navigate({ to: "/auth/signin", replace: true });
      return;
    }

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuth(user, accessToken);
        toast.success("Successfully logged in!");
        navigate({ to: "/", replace: true });
      } catch (err) {
        toast.error("Failed to parse user data.");
        navigate({ to: "/auth/signin", replace: true });
      }
    } else {
      toast.error("Invalid authentication response.");
      navigate({ to: "/auth/signin", replace: true });
    }
  }, [navigate, setAuth]);

  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h2 className="text-xl font-semibold font-display tracking-tight text-foreground">Authenticating...</h2>
      <p className="text-muted-foreground text-sm">Please wait while we log you in securely.</p>
    </div>
  );
}
