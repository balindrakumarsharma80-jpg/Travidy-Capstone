import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Globe,
  Heart,
  LifeBuoy,
  LogIn,
  LogOut,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PhoneShell, Card } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import {
  BudgetPreferenceDialog,
  HowItWorksDialog,
  LanguageDialog,
  NotificationsDialog,
  SupportDialog,
} from "@/components/travidy/dialogs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrefs } from "@/lib/prefs";
import { myTripsQuery } from "@/lib/trips";
import { tripQuery } from "@/lib/travidy";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Traveller Profile — Travidy" },
      {
        name: "description",
        content:
          "Manage your traveller profile — notification preferences, default budget style, language and currency, plus help and support.",
      },
      { property: "og:title", content: "Your Traveller Profile — Travidy" },
      {
        property: "og:description",
        content: "Traveller preferences, budget style, language and notifications.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(tripQuery());
  },
  component: Profile,
});

const budgetLabels: Record<string, string> = {
  backpacker: "Backpacker / Budget",
  mid: "Mid-Range Comfort",
  luxury: "Luxury & Premium",
};

function Profile() {
  const { data: trip } = useQuery(tripQuery());
  const { prefs, setPrefs } = usePrefs();
  const [details, setDetails] = useState({
    fullName: "",
  homeCity: "",
  travelStyle: "Balanced",
  });
   useEffect(() => {
    setDetails({
      fullName: prefs.fullName,
      homeCity: prefs.homeCity,
      travelStyle: prefs.travelStyle,
    });
  }, [prefs.fullName, prefs.homeCity, prefs.travelStyle]);
  const [open, setOpen] = useState<string | null>(null);
  const close = () => setOpen(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const displayName = prefs.fullName || user?.email?.split("@")[0] || "Explorer";

  const activeAlerts = Object.values(prefs.notifications).filter(Boolean).length;

  const { data: myTrips = [] } = useQuery(myTripsQuery(user?.id));
  const daysAway = myTrips.reduce((sum, t) => sum + t.days, 0) || trip?.days || 0;

  const rows = [
    {
      key: "details",
      icon: User,
      label: "Personal details",
      value: prefs.fullName || "Add your details",
    },
    { key: "notifications", icon: Bell, label: "Notifications", value: `${activeAlerts} active` },
    {
      key: "budget",
      icon: Wallet,
      label: "Budget preferences",
      value: budgetLabels[prefs.budget] ?? "",
    },
    {
      key: "language",
      icon: Globe,
      label: "Language & currency",
      value: `${prefs.language.split(" ")[0]} • ${prefs.currency.split(" ")[0]}`,
    },
    { key: "support", icon: LifeBuoy, label: "Help & support", value: "" },
  ];

  return (
    <PhoneShell>
      <AppHeader />
      <div className="space-y-4 p-4">
        <h1 className="text-2xl">Profile</h1>

        <Card className="flex items-center gap-3">
         <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft">
  <User className="size-7 text-primary" />
</span>
          <div className="min-w-0">
            <h2 className="truncate text-base">{displayName}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {isAuthenticated ? user?.email : `Sign in to sync${trip?.title ? ` • ${trip.title}` : ""}`}
            </p>
          </div>
        </Card>

        {!isAuthenticated && (
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-card"
          >
            <LogIn className="size-4" /> Sign in to sync your trips
          </Link>
        )}

        <ul className="grid grid-cols-3 gap-3">
          <Stat label="Trips" value={String(myTrips.length)} />
          <Stat label="Saved" value={String(prefs.saved.length)} icon={Heart} />
          <Stat label="Days away" value={String(daysAway)} />
        </ul>

        <Card className="divide-y divide-border p-0">
          {rows.map(({ key, icon: Icon, label, value }) => (
            <button
              key={key}
              onClick={() => setOpen(key)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-xs font-medium"
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4 text-primary" />
                {label}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {value}
                <ChevronRight className="size-4" />
              </span>
            </button>
          ))}
        </Card>

        <button
          onClick={() => setOpen("how")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-soft py-3 text-xs font-bold text-accent-foreground"
        >
          <Sparkles className="size-4 text-primary" /> How Travidy Works
        </button>

        {isAuthenticated && (
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-xs font-bold text-muted-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        )}
      </div>

      <Dialog
        open={open === "details"}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Personal details</DialogTitle>
            <DialogDescription>Saved to your Travidy profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full name</Label>
              <Input
                id="p-name"
                value={details.fullName}
                onChange={(e) => setDetails((d) => ({ ...d, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-city">Home city</Label>
              <Input
                id="p-city"
                value={details.homeCity}
                onChange={(e) => setDetails((d) => ({ ...d, homeCity: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-style">Travel style</Label>
              <select
                id="p-style"
                value={details.travelStyle}
                onChange={(e) => setDetails((d) => ({ ...d, travelStyle: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {["Balanced", "Adventure", "Spiritual", "Relaxed", "Culture", "Nightlife"].map(
                  (o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setPrefs(details);
                toast.success("Profile updated");
                close();
              }}
            >
              Save details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationsDialog open={open === "notifications"} onOpenChange={close} />
      <BudgetPreferenceDialog open={open === "budget"} onOpenChange={close} />
      <LanguageDialog open={open === "language"} onOpenChange={close} />
      <SupportDialog open={open === "support"} onOpenChange={close} />
      <HowItWorksDialog open={open === "how"} onOpenChange={close} />
    </PhoneShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Heart }) {
  return (
    <li className="rounded-2xl bg-card p-3 text-center shadow-card">
      <p className="flex items-center justify-center gap-1 font-display text-lg font-bold text-primary">
        {Icon && <Icon className="size-4" />} {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </li>
  );
}
