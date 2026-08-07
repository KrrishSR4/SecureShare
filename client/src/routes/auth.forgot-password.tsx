import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotForm = z.infer<typeof forgotSchema>;

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setIsSubmitted(true);
      toast.success("Reset link sent!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-4">
          Check your email
        </h1>
        <p className="text-muted-foreground mb-8">
          We have sent a password reset link to your email address. Please check your inbox (and
          spam folder) to continue.
        </p>
        <Link
          to="/auth/signin"
          className="inline-flex items-center justify-center w-full rounded-xl bg-primary h-11 px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <Link
          to="/auth/signin"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Forgot password?
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              {...register("email")}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center w-full rounded-xl bg-primary h-11 px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 mt-4"
        >
          {isLoading ? "Sending link..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
