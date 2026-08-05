import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, Globe, Heart, LifeBuoy, Sparkles, User, Wallet } from "lucide-react";
import { useState } from "react";

import { PhoneShell, Card } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import {
  BudgetPreferenceDialog,
  HowItWorksDialog,
  LanguageDialog,
  NotificationsDialog,
  SupportDialog,
} from "@/components/travidy/dialogs";
import { usePrefs } from "@/lib/prefs";
import { tripQuery } from "@/lib/travidy";

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
  const { data: trip } = useSuspenseQuery(tripQuery());
  const { prefs } = usePrefs();
  const [open, setOpen] = useState<string | null>(null);
  const close = () => setOpen(null);

  const activeAlerts = Object.values(prefs.notifications).filter(Boolean).length;

  const rows = [
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
          <div>
            <h2 className="text-base">Explorer</h2>
            <p className="text-xs text-muted-foreground">1 trip planned • {trip.title}</p>
          </div>
        </Card>

        <ul className="grid grid-cols-3 gap-3">
          <Stat label="Trips" value="1" />
          <Stat label="Saved" value={String(prefs.saved.length)} icon={Heart} />
          <Stat label="Days away" value={String(trip.days)} />
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
      </div>

      <NotificationsDialog open={open === "notifications"} onOpenChange={close} />
      <BudgetPreferenceDialog open={open === "budget"} onOpenChange={close} />
      <LanguageDialog open={open === "language"} onOpenChange={close} />
      <SupportDialog open={open === "support"} onOpenChange={close} />
      <HowItWorksDialog open={open === "how"} onOpenChange={close} />
    </PhoneShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Heart;
}) {
  return (
    <li className="rounded-2xl bg-card p-3 text-center shadow-card">
      <p className="flex items-center justify-center gap-1 font-display text-lg font-bold text-primary">
        {Icon && <Icon className="size-4" />} {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </li>
  );
}
