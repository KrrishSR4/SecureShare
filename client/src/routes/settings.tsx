import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Monitor, Trash2, Smartphone, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Nav } from "@/components/secureshare";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    navigate({ to: "/auth/signin", replace: true });
    return null;
  }

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires an admin override in this demo.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-ink selection:text-background font-sans">
      <Nav />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-ink mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Link>

          <div className="mb-10">
            <h1 className="font-display text-4xl tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your workspace preferences and security configurations.
            </p>
          </div>

          <Tabs defaultValue="security" className="w-full flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 shrink-0">
              <TabsList className="flex flex-row md:flex-col h-auto bg-transparent p-0 space-y-0 space-x-2 md:space-x-0 md:space-y-2 justify-start overflow-x-auto md:overflow-visible">
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-border border border-transparent justify-start px-4 py-3 rounded-xl transition-all"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Security & Access
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-w-0">
              {/* SECURITY & ACCESS */}
              <TabsContent value="security" className="mt-0 space-y-6 outline-none">
                <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Key className="h-5 w-5 text-signal" />
                    Two-Factor Authentication
                  </h2>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Authenticator App</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account.
                      </p>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-ink/90">
                      Enable 2FA
                    </button>
                  </div>
                </div>

                <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-signal" />
                    Active Sessions
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 border border-border rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          Windows PC (Chrome){" "}
                          <span className="text-[10px] uppercase font-bold text-signal bg-signal/10 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Delhi, India • Active now
                        </p>
                      </div>
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <button className="text-sm font-medium text-destructive mt-6 hover:underline">
                    Log out of all other devices
                  </button>
                </div>

                <div className="border border-red-500/20 rounded-2xl bg-red-500/5 p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </h2>
                  <p className="text-sm text-red-600/80 mb-6">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
