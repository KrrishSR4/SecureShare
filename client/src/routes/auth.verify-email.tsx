import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";
import api from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailPage,
  validateSearch: searchSchema,
});

function VerifyEmailPage() {
  const search = Route.useSearch();
  const token = search.token;
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        setStatus("error");
        setErrorMessage(err.response?.data?.error || "Verification failed");
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="w-full text-center py-12">
        <svg
          className="animate-spin mx-auto h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <h1 className="font-display text-2xl font-semibold mt-4 text-foreground">
          Verifying your email...
        </h1>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-4">
          Email Verified!
        </h1>
        <p className="text-muted-foreground mb-8">
          Thank you for verifying your email. Your account is now fully active.
        </p>
        <Link
          to="/auth/signin"
          className="inline-flex items-center justify-center w-full rounded-xl bg-primary h-11 px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Continue to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-4">
        Verification Failed
      </h1>
      <p className="text-muted-foreground mb-8">
        {errorMessage || "We couldn't verify your email address. The link may have expired."}
      </p>
      <Link
        to="/auth/signin"
        className="inline-flex items-center justify-center w-full rounded-xl bg-secondary h-11 px-8 text-sm font-medium text-foreground transition-all hover:bg-secondary/80"
      >
        Return to Sign In
      </Link>
    </div>
  );
}
