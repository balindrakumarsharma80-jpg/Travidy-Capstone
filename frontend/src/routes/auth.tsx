import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PhoneShell, Card, TravidyLogo } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
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
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/profile", replace: true });
  }, [loading, isAuthenticated, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setError("Google sign-in failed. Please try again.");
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/profile", replace: true });
  }

  return (
    <PhoneShell>
      <AppHeader />
      <div className="flex flex-col justify-center gap-5 p-5">
        <div className="flex justify-center">
          <TravidyLogo />
        </div>

        <div className="text-center">
          <h1 className="text-2xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Your saved trips, preferences and stats stay with you on every device.
          </p>
        </div>

        <Card className="space-y-3">
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-xs font-bold"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-2.5">
            {mode === "signup" && (
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
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-card"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-[11px] text-muted-foreground"
          >
            {mode === "signin"
              ? "New to Travidy? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </Card>

        <Link to="/" className="text-center text-[11px] font-medium text-primary">
          Continue exploring without an account
        </Link>
      </div>
    </PhoneShell>
  );
}
