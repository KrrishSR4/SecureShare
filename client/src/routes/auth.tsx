import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 shadow-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-2xl tracking-tight text-white">SecureShare</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl text-white leading-tight mb-4 tracking-tight">
            Data sharing without trusting anyone.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Privacy infrastructure for modern organizations. Encrypt, govern, and revoke sensitive data at any moment.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-zinc-500">
          <span>&copy; {new Date().getFullYear()} SecureShare</span>
          <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* Right Column - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shadow-sm">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-2xl tracking-tight text-foreground">SecureShare</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
