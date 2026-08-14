import { Link } from "@tanstack/react-router";
import { Check, Copy, Share2, Star } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { destinations, howItWorks, type Destination } from "@/lib/destinations";
import { usePrefs, type BudgetPref, type NotificationSettings } from "@/lib/prefs";
import { img } from "@/lib/travidy";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

function Shell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: Props & { title: string; description?: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[400px] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function HowItWorksDialog(props: Props) {
  return (
    <Shell
      {...props}
      title="How Travidy Works"
      description="Your complete journey from idea to itinerary in 4 seamless steps."
    >
      <ol className="space-y-4">
        {howItWorks.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <h4 className="text-sm font-semibold">{step.title}</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

export function AllDestinationsDialog(props: Props) {
  return (
    <Shell {...props} title="All Destinations">
      <ul className="grid grid-cols-2 gap-3">
        {destinations.map((d) => (
          <li key={d.id} className="overflow-hidden rounded-xl bg-card shadow-card">
            <Link to="/planner" search={{ dest: d.id }} onClick={() => props.onOpenChange(false)}>
              <img
                src={img(d.imageKey)}
                alt={d.name}
                loading="lazy"
                width={768}
                height={768}
                className="h-20 w-full object-cover"
              />
              <span className="block p-2">
                <span className="block text-xs font-semibold">{d.name}</span>
                <span className="block text-[10px] text-muted-foreground">{d.categories[0]}</span>
                <span className="mt-1 block text-[10px] font-bold text-primary">{d.price}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function InviteDialog({ tripId, ...props }: Props & { tripId?: string }) {
  const link = `https://travidy.app/trip/${tripId}-escape`;
  return (
    <Shell {...props} title="Plan Together!">
      <div className="space-y-3 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft">
          <Share2 className="size-6 text-primary" />
        </span>
        <p className="text-xs text-muted-foreground">
          Share this link with your travel partners to plan together in real time.
        </p>
        <input
          readOnly
          value={link}
          className="w-full rounded-lg bg-muted p-2 text-center font-mono text-xs"
        />
        <button
          onClick={() => {
            navigator.clipboard?.writeText(link);
            toast.success("Invite link copied to your clipboard");
            props.onOpenChange(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
        >
          <Copy className="size-3.5" /> Copy Link
        </button>
      </div>
    </Shell>
  );
}

const notificationRows: { key: keyof NotificationSettings; title: string; desc: string }[] = [
  {
    key: "tripReminders",
    title: "Trip & Itinerary Reminders",
    desc: "Get alerts before scheduled activities",
  },
  {
    key: "priceAlerts",
    title: "Price Drop Alerts",
    desc: "Get notified when hotel or flight prices drop",
  },
  {
    key: "chatUpdates",
    title: "AI Assistant Chat Messages",
    desc: "Notify when AI suggests new recommendations",
  },
  {
    key: "promoAlerts",
    title: "Promotions & Rewards",
    desc: "Exclusive discounts and group invite bonuses",
  },
];

export function NotificationsDialog(props: Props) {
  const { prefs, toggleNotification } = usePrefs();
  return (
    <Shell
      {...props}
      title="Notification Preferences"
      description="Choose what updates you want to receive."
    >
      <ul className="space-y-3">
        {notificationRows.map((row) => {
          const on = prefs.notifications[row.key];
          return (
            <li key={row.key}>
              <button
                onClick={() => toggleNotification(row.key)}
                aria-pressed={on}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  on ? "border-primary bg-primary-soft/50" : "border-border"
                }`}
              >
                <span>
                  <span className="block text-xs font-semibold">{row.title}</span>
                  <span className="block text-[10px] text-muted-foreground">{row.desc}</span>
                </span>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {on && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={() => {
          toast.success("Notification preferences saved");
          props.onOpenChange(false);
        }}
        className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
      >
        Save Preferences
      </button>
    </Shell>
  );
}

const budgetOptions: { key: BudgetPref; title: string; desc: string }[] = [
  {
    key: "backpacker",
    title: "Backpacker / Budget",
    desc: "Hostels, street food, public transport (Under ₹1,500 / day)",
  },
  {
    key: "mid",
    title: "Mid-Range Comfort",
    desc: "Standard hotels, nice cafés, guided tours (₹3,000 – ₹7,000 / day)",
  },
  {
    key: "luxury",
    title: "Luxury & Premium",
    desc: "Resorts, fine dining, private cabs & experiences (₹10,000+ / day)",
  },
];

export function BudgetPreferenceDialog(props: Props) {
  const { prefs, setPrefs } = usePrefs();
  return (
    <Shell
      {...props}
      title="Default Budget Style"
      description="Tailors AI recommendations and estimates to match your spending style."
    >
      <ul className="space-y-2.5">
        {budgetOptions.map((o) => {
          const active = prefs.budget === o.key;
          return (
            <li key={o.key}>
              <button
                onClick={() => setPrefs({ budget: o.key })}
                aria-pressed={active}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary-soft/50 shadow-card" : "border-border"
                }`}
              >
                <span>
                  <span className="block text-xs font-semibold">{o.title}</span>
                  <span className="block text-[10px] text-muted-foreground">{o.desc}</span>
                </span>
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? "border-primary" : "border-border"
                  }`}
                >
                  {active && <span className="size-2 rounded-full bg-primary" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={() => {
          toast.success("Budget preference applied");
          props.onOpenChange(false);
        }}
        className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
      >
        Apply Budget Preference
      </button>
    </Shell>
  );
}

export function LanguageDialog(props: Props) {
  const { prefs, setPrefs } = usePrefs();
  return (
    <Shell {...props} title="Language & Currency">
      <div className="space-y-3 text-xs">
        <label className="block">
          <span className="mb-1 block text-muted-foreground">Language</span>
          <select
            value={prefs.language}
            onChange={(e) => setPrefs({ language: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface p-2"
          >
            <option>English (Default)</option>
            <option>Hindi (हिंदी)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-muted-foreground">Currency</span>
          <select
            value={prefs.currency}
            onChange={(e) => setPrefs({ currency: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface p-2"
          >
            <option>INR (₹)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </label>
      </div>
    </Shell>
  );
}

const faqs = [
  {
    q: "How does Travidy AI generate itineraries?",
    a: "Our AI analyses live price trends, real traveller reviews and your budget limits to tailor every plan.",
  },
  {
    q: "Can I edit or reorder my itinerary?",
    a: "Yes — add or remove any activity from the planner and your budget updates instantly.",
  },
  {
    q: "Can I plan with friends?",
    a: "Share your trip link from the Invite Friends card and plan together.",
  },
];

export function SupportDialog(props: Props) {
  return (
    <Shell {...props} title="Help & Support">
      <ul className="space-y-3 text-xs text-muted-foreground">
        {faqs.map((f) => (
          <li key={f.q}>
            <b className="block text-foreground">{f.q}</b>
            <p className="mt-0.5">{f.a}</p>
          </li>
        ))}
      </ul>
      <a
        href="mailto:hello@travidy.app"
        className="mt-2 block w-full rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground"
      >
        Contact Support
      </a>
    </Shell>
  );
}

export function DestinationDialog({
  destination,
  onOpenChange,
  open,
}: Props & { destination: Destination | null }) {
  if (!destination) return null;
  return (
    <Shell open={open} onOpenChange={onOpenChange} title={destination.name}>
      <img
        src={img(destination.imageKey)}
        alt={destination.name}
        loading="lazy"
        width={768}
        height={768}
        className="h-36 w-full rounded-xl object-cover"
      />
      <p className="text-xs text-muted-foreground">{destination.tagline}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-muted p-2">
          <dt className="text-[10px] text-muted-foreground">Best time</dt>
          <dd className="font-semibold">{destination.bestTime}</dd>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <dt className="text-[10px] text-muted-foreground">Daily budget</dt>
          <dd className="font-semibold">{destination.dailyBudget}</dd>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <dt className="text-[10px] text-muted-foreground">From</dt>
          <dd className="font-semibold text-primary">{destination.price}</dd>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <dt className="text-[10px] text-muted-foreground">Rating</dt>
          <dd className="flex items-center gap-1 font-semibold">
            <Star className="size-3 fill-primary text-primary" /> {destination.rating}
          </dd>
        </div>
      </dl>
      <div>
        <h4 className="text-xs font-semibold">Top highlights</h4>
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {destination.highlights.map((h) => (
            <li key={h} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3 shrink-0 text-primary" /> {h}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold">Must-try food</h4>
        <p className="mt-1 text-xs text-muted-foreground">{destination.food.join(" • ")}</p>
      </div>
      <Link
        to="/planner"
        search={{ dest: destination.id }}
        onClick={() => onOpenChange(false)}
        className="block w-full rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground"
      >
        Plan this trip
      </Link>
    </Shell>
  );
}
