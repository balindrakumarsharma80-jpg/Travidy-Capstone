import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PhoneShell, Card, TravidyLogo } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    trip: typeof search.trip === "string" ? search.trip : undefined,
    share: typeof search.share === "string" ? search.share : undefined,
    join:
      search.join === true ||
      search.join === "true" ||
      search.join === "1",
  }),
  
  head: () => ({
    meta: [
      { title: "Sign in to Travidy — Save Your Trips" },
      {
        name: "description",
        content:
          "Sign in to Travidy to keep your saved destinations, travel preferences and trip stats in sync on every device.",
      },
      { property: "og:title", content: "Sign in to Travidy" },
      {
        property: "og:description",
        content: "Keep your saved destinations and preferences synced across devices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
 const {
  trip: searchTripId,
  share: searchShare,
  join: searchJoin,
} = Route.useSearch();

const [pendingShare] = useState(() => {
  try {
    const saved = sessionStorage.getItem("travidy_pending_share");
    return saved
      ? (JSON.parse(saved) as { trip?: string; share?: string; join?: boolean })
      : {};
  } catch {
    return {};
  }
});
const tripId = searchTripId;
const share = searchShare;
const join = searchJoin === true;
  const { isAuthenticated, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [forgotPassword, setForgotPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  if (loading || !isAuthenticated || forgotPassword) return;

  const currentTripId = searchTripId ?? pendingShare.trip;
 const shouldJoin = searchJoin === true || pendingShare.join === true;

  if (shouldJoin && currentTripId) {
    sessionStorage.removeItem("travidy_pending_share");

    navigate({
      to: "/trips/$tripId/join",
      params: {
        tripId: currentTripId,
      },
      replace: true,
    });

    return;
  }

  if (currentTripId) {
    sessionStorage.removeItem("travidy_pending_share");

    navigate({
      to: "/itinerary",
      search: {
        trip: currentTripId,
        ...(searchShare ? { share: searchShare } : {}),
      },
      replace: true,
    });

    return;
  }

  if (searchShare) {
    navigate({
      to: "/itinerary",
      search: {
        share: searchShare,
      },
      replace: true,
    });

    return;
  }

  navigate({
    to: "/profile",
    replace: true,
  });
}, [
  loading,
  isAuthenticated,
  forgotPassword,
  searchTripId,
  searchShare,
  searchJoin,
  pendingShare.trip,
  pendingShare.join,
  navigate,
]);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast.success("Password reset link sent. Please check your email.");

        setForgotPassword(false);
        setPassword("");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });

        if (error) throw error;

        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }

        toast.success("Welcome to Travidy!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back!");
        if (join && tripId) {
  navigate({
    to: "/trips/$tripId/join",
    params: {
      tripId,
    },
    replace: true,
  });
} else if (tripId) {
  navigate({
    to: "/itinerary",
    search: {
      trip: tripId,
      ...(share ? { share } : {}),
    },
    replace: true,
  });
} else if (share) {
  navigate({
    to: "/itinerary",
    search: { share },
    replace: true,
  });
} else {
  navigate({
    to: "/profile",
    replace: true,
  });
}
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

 async function onGoogle() {
  setBusy(true);
  setError(null);

  if (tripId || join || share) {
    sessionStorage.setItem(
      "travidy_pending_share",
      JSON.stringify({
        trip: tripId,
        share,
        join,
      }),
    );
  }

  try {
    const redirectTo = `${window.location.origin}/auth`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      console.error("GOOGLE SIGN-IN ERROR:", error);
      console.error("GOOGLE SIGN-IN ERROR MESSAGE:", error.message);
      console.error("GOOGLE SIGN-IN ERROR NAME:", error.name);
      console.error("GOOGLE SIGN-IN ERROR STATUS:", error.status);

      setBusy(false);
      setError(error.message || "Google sign-in failed.");
      toast.error(error.message || "Google sign-in failed.");
      return;
    }
  } catch (error) {
    console.error("GOOGLE SIGN-IN EXCEPTION:", error);
    setBusy(false);
    setError("Google sign-in failed.");
    toast.error("Google sign-in failed.");
  }
}
  function startForgotPassword() {
    setError(null);
    setForgotPassword(true);
    setPassword("");
  }

  function backToSignIn() {
    setError(null);
    setForgotPassword(false);
    setMode("signin");
    setPassword("");
  }

  return (
    <PhoneShell>
      <AppHeader />

      <div className="flex flex-col justify-center gap-5 p-5">
        <div className="flex justify-center">
          <TravidyLogo />
        </div>

        <div className="text-center">
          <h1 className="text-2xl">
            {forgotPassword
              ? "Reset your password"
              : mode === "signin"
                ? "Welcome back"
                : "Create your account"}
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            {forgotPassword
              ? "Enter your email and we'll send you a link to reset your password."
              : "Your saved trips, preferences and stats stay with you on every device."}
          </p>
        </div>

        <Card className="space-y-3">
          {!forgotPassword && (
            <>
              <button
                type="button"
                onClick={onGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-xs font-bold"
              >
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-2.5">
            {mode === "signup" && !forgotPassword && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
              />
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
            />

            {!forgotPassword && (
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
              />
            )}

            {error && (
              <p className="text-xs text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-card"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}

              {forgotPassword
                ? "Send reset link"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {!forgotPassword && mode === "signin" && (
            <button
              type="button"
              onClick={startForgotPassword}
              className="w-full text-center text-[11px] font-medium text-primary"
            >
              Forgot password?
            </button>
          )}

          {forgotPassword ? (
            <button
              type="button"
              onClick={backToSignIn}
              className="w-full text-center text-[11px] text-muted-foreground"
            >
              ← Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="w-full text-center text-[11px] text-muted-foreground"
            >
              {mode === "signin"
                ? "New to Travidy? Create an account"
                : "Already have an account? Sign in"}
            </button>
          )}
        </Card>

        <Link
          to="/"
          className="text-center text-[11px] font-medium text-primary"
        >
          Continue exploring without an account
        </Link>
      </div>
    </PhoneShell>
  );
}