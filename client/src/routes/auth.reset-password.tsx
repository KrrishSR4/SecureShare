import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: searchSchema,
});

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters.")
  .regex(/[A-Z]/, "Must contain an uppercase letter.")
  .regex(/[a-z]/, "Must contain a lowercase letter.")
  .regex(/[0-9]/, "Must contain a number.")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character.");

const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

function calculatePasswordStrength(password: string) {
  let score = 0;
  if (!password) return { score: 0, label: "Empty", color: "bg-zinc-800" };
  
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score, label: "Medium", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Strong", color: "bg-green-400" };
  return { score, label: "Excellent", color: "bg-green-500" };
}

function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const token = search.token;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const strength = useMemo(() => calculatePasswordStrength(passwordValue), [passwordValue]);

  if (!token) {
    return (
      <div className="w-full text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-4">
          Invalid Reset Link
        </h1>
        <p className="text-muted-foreground mb-8">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <button
          onClick={() => navigate({ to: "/auth/forgot-password" })}
          className="inline-flex items-center justify-center w-full rounded-xl bg-primary h-11 px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Request new link
        </button>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        password: data.password,
      });
      toast.success("Password updated successfully.");
      navigate({ to: "/auth/signin" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full pb-8">
      <div className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border mb-6">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter your new password below to regain access to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">New Password</label>
          <div className="relative">
            <input
              {...register("password")}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-4 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 transition-colors"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordValue && (
            <div className="mt-2 space-y-1.5">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score === 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                {strength.label} password
              </p>
            </div>
          )}
          {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Confirm New Password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-4 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 transition-colors"
              placeholder="••••••••"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="inline-flex mt-4 items-center justify-center w-full rounded-xl bg-primary h-11 px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
