import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PhoneShell, Card, TravidyLogo } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Travidy" },
      {
        name: "description",
        content: "Set a new password for your Travidy account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setReady(!!data.session);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN"
      ) {
        setReady(!!session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.success("Your password has been updated.");

      await supabase.auth.signOut();

      navigate({
        to: "/auth",
        replace: true,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update your password. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <AppHeader />

      <div className="flex flex-col justify-center gap-5 p-5">
        <div className="flex justify-center">
          <TravidyLogo />
        </div>

        <div className="text-center">
          <h1 className="text-2xl">Create a new password</h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Choose a new password for your Travidy account.
          </p>
        </div>

        <Card className="space-y-3">
          {!ready ? (
            <div className="space-y-3 text-center">
              <p className="text-xs text-muted-foreground">
                This password reset link is invalid or has expired.
              </p>

              <Link
                to="/auth"
                className="block text-xs font-semibold text-primary"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-2.5">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
              />

              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs outline-none focus:border-primary"
              />

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
                {busy && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Update password
              </button>
            </form>
          )}
        </Card>
      </div>
    </PhoneShell>
  );
}