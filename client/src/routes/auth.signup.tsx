import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/auth/signup")({
  component: SignUpPage,
});

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters.")
  .regex(/[A-Z]/, "Must contain an uppercase letter.")
  .regex(/[a-z]/, "Must contain a lowercase letter.")
  .regex(/[0-9]/, "Must contain a number.")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character.");

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

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

function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const strength = useMemo(() => calculatePasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await api.post("/auth/signup", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created successfully. You can now sign in.");
      navigate({ to: "/auth/signin" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full pb-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-muted-foreground mt-2">
          Join SecureShare to start sharing files securely.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Full Name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              {...register("name")}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 transition-colors"
              placeholder="John Doe"
              type="text"
              autoComplete="name"
            />
          </div>
          {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              {...register("email")}
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 transition-colors"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Password</label>
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
          <label className="text-sm font-medium leading-none">Confirm Password</label>
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
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/signin" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
