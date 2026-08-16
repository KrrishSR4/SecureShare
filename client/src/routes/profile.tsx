import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Camera, Github, ShieldCheck, Mail, User as UserIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Nav } from "@/components/secureshare";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate({ to: "/auth/signin", replace: true });
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password change link sent to your email.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-ink selection:text-background font-sans">
      <Nav />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-4xl mx-auto">
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
            <h1 className="font-display text-4xl tracking-tight text-foreground">
              Profile Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your personal information and security preferences.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="flex flex-col items-center justify-center p-6 border border-border rounded-2xl bg-card">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
                    <AvatarImage src={user.profilePictureUrl || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-medium uppercase">
                      {user.name ? user.name.substring(0, 2) : "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-ink/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-xl">{user.name || "User"}</h3>
                <p className="text-muted-foreground text-sm">
                  {user.role === "ADMIN" ? "Administrator" : "Standard User"}
                </p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-signal" />
                  Personal Information
                </h2>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user.name || ""}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      disabled
                      className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email addresses cannot be changed for security reasons.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-ink/90 mt-4"
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Linked Accounts */}
              <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-signal" />
                  Linked Accounts
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">
                          {user.oauthProvider === "google" ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {user.oauthProvider === "google" ? (
                      <span className="text-xs font-semibold text-signal bg-signal/10 px-3 py-1 rounded-full">
                        Connected
                      </span>
                    ) : (
                      <button className="text-xs font-semibold text-ink bg-muted px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <Github className="h-6 w-6" />
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-xs text-muted-foreground">
                          {user.oauthProvider === "github" ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {user.oauthProvider === "github" ? (
                      <span className="text-xs font-semibold text-signal bg-signal/10 px-3 py-1 rounded-full">
                        Connected
                      </span>
                    ) : (
                      <button className="text-xs font-semibold text-ink bg-muted px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-signal" />
                  Security
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your account password to maintain security.
                    </p>
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={!!user.oauthProvider}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Password
                  </button>
                </div>
                {user.oauthProvider && (
                  <p className="text-xs text-muted-foreground mt-4">
                    You logged in using {user.oauthProvider}. Passwords cannot be changed for OAuth
                    accounts.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
