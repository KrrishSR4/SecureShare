import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLenis } from "@/lib/use-lenis";

import "../styles.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { useState } from "react";
import api from "@/lib/api";
import { Database, HardDrive, Zap } from "lucide-react";

function DevStatusIndicator() {
  const [status, setStatus] = useState({
    databaseConnected: false,
    redisConnected: false,
    cacheActive: false,
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get("/health");
        setStatus({
          databaseConnected: res.data.databaseConnected,
          redisConnected: res.data.redisConnected,
          cacheActive: res.data.cacheActive,
        });
      } catch (err) {
        setStatus({
          databaseConnected: false,
          redisConnected: false,
          cacheActive: false,
        });
      }
    };
    fetchHealth();
    const intv = setInterval(fetchHealth, 10000);
    return () => clearInterval(intv);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 bg-background/80 backdrop-blur-md p-3 rounded-xl border border-border shadow-lg text-xs font-medium">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status.databaseConnected ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"}`}
        />
        <Database className="w-3 h-3 text-muted-foreground" />
        <span>PostgreSQL</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status.redisConnected ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"}`}
        />
        <HardDrive className="w-3 h-3 text-muted-foreground" />
        <span>Redis Cluster</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status.cacheActive ? "bg-green-500 shadow-green-500/50" : "bg-yellow-500 shadow-yellow-500/50"}`}
        />
        <Zap className="w-3 h-3 text-muted-foreground" />
        <span>Cache Active</span>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useLenis();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <DevStatusIndicator />
    </QueryClientProvider>
  );
}
