import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col lg:flex-row relative">
      {/* Left Column - Branding (Shown as top section on mobile, left column on desktop) */}
      <div className="w-full lg:w-1/2 bg-zinc-950 p-8 lg:p-12 flex flex-col relative overflow-hidden items-center justify-center min-h-[40vh] lg:min-h-screen">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] lg:w-[800px] h-[600px] lg:h-[800px] bg-primary/10 rounded-full blur-[100px] lg:blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center lg:-mt-16">
          <Link
            to="/"
            className="flex flex-col items-center gap-4 lg:gap-6 mb-8 lg:mb-16 hover:scale-[1.02] transition-transform"
          >
            <img
              src="/secureshare123.png"
              alt="SecureShare"
              className="w-24 h-24 lg:w-40 lg:h-40 object-contain drop-shadow-2xl"
            />
            <span className="font-display text-4xl lg:text-[5.5rem] leading-none tracking-tight pb-1 lg:pb-2">
              <span className="text-white">Secure</span>
              <span className="bg-gradient-to-br from-white to-emerald-500 bg-clip-text text-transparent">
                Share
              </span>
            </span>
          </Link>

          <div className="text-center max-w-sm lg:max-w-md px-4">
            <h1 className="font-display text-xl lg:text-2xl text-white/90 leading-tight mb-3 lg:mb-4 tracking-tight">
              Data sharing without trusting anyone.
            </h1>
            <p className="text-zinc-400 text-sm lg:text-base leading-relaxed">
              Privacy infrastructure for modern organizations. Encrypt, govern, and revoke sensitive
              data at any moment.
            </p>
          </div>
        </div>

        {/* Desktop Footer (Hidden on mobile) */}
        <div className="hidden lg:flex relative z-10 justify-center items-center gap-6 text-sm text-zinc-500 w-full mt-12">
          <span>&copy; {new Date().getFullYear()} SecureShare</span>
          <Link to="/docs" className="hover:text-white transition-colors">
            Documentation
          </Link>
          <Link to="/privacypolicy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Right Column - Forms (Shown below branding on mobile, right side on desktop) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-y-auto bg-background min-h-[40vh] lg:min-h-screen">
        <div className="w-full max-w-[400px] relative z-10 flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>

        {/* Mobile Footer (Hidden on desktop) */}
        <div className="flex lg:hidden relative z-10 justify-center items-center gap-6 text-xs text-zinc-500 w-full mt-8 pt-4 border-t border-border/40">
          <span>&copy; {new Date().getFullYear()} SecureShare</span>
          <Link to="/docs" className="hover:text-zinc-700 transition-colors">
            Documentation
          </Link>
          <Link to="/privacypolicy" className="hover:text-zinc-700 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
