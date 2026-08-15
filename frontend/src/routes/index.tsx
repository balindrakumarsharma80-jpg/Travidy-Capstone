import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Footprints,
  Heart,
  ListChecks,
  MapPin,
  MessageCircle,
  Sparkles,
  Tag,
} from "lucide-react";

import { PhoneShell, Card } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { AllDestinationsDialog, HowItWorksDialog } from "@/components/travidy/dialogs";
import { destinations as destinationCatalog } from "@/lib/destinations";
import { usePrefs } from "@/lib/prefs";
import { tripQuery, img } from "@/lib/travidy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travidy — Your AI Travel Buddy" },
      {
        name: "description",
        content:
          "Travidy plans, organises and guides you through every moment of your journey. One conversation. One perfect trip.",
      },
      { property: "og:title", content: "Travidy — Your AI Travel Buddy" },
      {
        property: "og:description",
        content: "Plan better. Explore deeper. Follow every moment with your AI travel buddy.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(tripQuery());
  },
  component: Home,
});

const steps = [
  { icon: MapPin, label: "Choose\nDestination", tone: "bg-primary-soft text-primary" },
  { icon: MessageCircle, label: "Chat\nwith AI", tone: "bg-water-soft text-water" },
  { icon: CalendarDays, label: "Build\nItinerary", tone: "bg-primary-soft text-primary" },
  { icon: ListChecks, label: "Follow\nChecklist", tone: "bg-adventure-soft text-adventure" },
];

const trust = [
  {
    icon: Building2,
    title: "Real Hotels",
    body: "Curated stays with verified prices & reviews",
    tone: "bg-primary-soft text-primary",
  },
  {
    icon: Footprints,
    title: "Real Activities",
    body: "Handpicked experiences worth your time",
    tone: "bg-water-soft text-water",
  },
  {
    icon: Tag,
    title: "Real Prices",
    body: "Up-to-date pricing so you plan with confidence",
    tone: "bg-adventure-soft text-adventure",
  },
  {
    icon: Sparkles,
    title: "Curated Picks",
    body: "Local insights + AI intelligence for the best plans",
    tone: "bg-ai-soft text-ai",
  },
];

function Home() {
  const { data: trip } = useSuspenseQuery(tripQuery());
  const { prefs, toggleSaved } = usePrefs();
  const [howOpen, setHowOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  return (
    <PhoneShell>
      <AppHeader />

      <section className="relative overflow-hidden">
        <img
          src={img("rishikesh")}
          alt="Golden hour over the Ganga in Rishikesh"
          width={1024}
          height={768}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
        <div className="relative px-5 pt-7 pb-8">
          <h1 className="font-display text-4xl leading-[1.1]">
            Your AI
            <br />
            <span className="text-primary">Travel Buddy.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Plan better. Explore deeper.
            <br />
            Follow every moment.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/planner"
              search={{ dest: undefined }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card"
            >
              Start Planning <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="-mt-4 px-4">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">How Travidy Works</h2>
            <button onClick={() => setHowOpen(true)} className="text-xs font-semibold text-primary">
              View all
            </button>
          </div>
          <ol className="mt-4 flex items-start justify-between gap-1">
            {steps.map(({ icon: Icon, label, tone }, i) => (
              <li key={label} className="flex flex-1 flex-col items-center text-center">
                <span className={`flex size-12 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="mt-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="mt-1 text-[11px] leading-tight font-medium whitespace-pre-line">
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg">Popular Destinations</h2>
          <button onClick={() => setAllOpen(true)} className="text-xs font-semibold text-primary">
            View all
          </button>
        </div>
        <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {destinationCatalog.map((d) => {
            const saved = prefs.saved.includes(d.id);
            return (
              <li
                key={d.id}
                className="w-[62%] shrink-0 overflow-hidden rounded-2xl bg-card shadow-card"
              >
                <div className="relative">
                  <img
                    src={img(d.imageKey)}
                    alt={d.name}
                    loading="lazy"
                    width={768}
                    height={768}
                    className="h-32 w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    {d.tag}
                  </span>
                  <button
                    aria-label={saved ? `Remove ${d.name} from saved` : `Save ${d.name}`}
                    aria-pressed={saved}
                    onClick={() => toggleSaved(d.id)}
                    className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-surface/85"
                  >
                    <Heart
                      className={`size-4 ${saved ? "fill-adventure text-adventure" : "text-muted-foreground"}`}
                    />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-base">{d.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{d.categories.join(" • ")}</p>
                  <Link
                    to="/planner"
                    search={{ dest: d.id }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    Explore <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 px-4">
        <h2 className="text-lg">Why Trust Travidy?</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {trust.map(({ icon: Icon, title, body, tone }) => (
            <li key={title} className="rounded-2xl bg-card p-3 text-center shadow-card">
              <span
                className={`mx-auto flex size-11 items-center justify-center rounded-2xl ${tone}`}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="mt-2 text-sm">{title}</h3>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 px-4">
        <div className="rounded-2xl bg-primary-soft p-4">
          <h2 className="text-lg text-accent-foreground">Ready to travel smarter?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a destination and Travidy builds the days, the stays and the budget with you.
          </p>
          <Link
            to="/planner"
            search={{ dest: undefined }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Start Planning <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <HowItWorksDialog open={howOpen} onOpenChange={setHowOpen} />
      <AllDestinationsDialog open={allOpen} onOpenChange={setAllOpen} />
    </PhoneShell>
  );
}
