import { createFileRoute, Link } from "@tanstack/react-router";
import { askTravidyAgent } from "@/lib/travidy";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar,
  Check,
  Gift,
  Mic,
  Paperclip,
  Pencil,
  Send,
  Sparkles,
  Star,
  User,
  Utensils,
  Waves,
  Landmark,
  Wallet,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PhoneShell, Card } from "@/components/travidy/shell";
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {img, inr, itineraryQuery, tripQuery } from "@/lib/travidy";
import { createTrip } from "@/lib/trips";
import {
  destinations as destinationCatalog,
  destinationRecs,
  findDestination,
  type DestRec,
} from "@/lib/destinations";

const DESTINATIONS = destinationCatalog.map((d) => ({
  key: d.id,
  name: d.name,
  tags: d.categories.join(" • "),
}));

export const Route = createFileRoute("/planner")({
  validateSearch: (search: Record<string, unknown>): { dest?: string; trip?: string } => ({
    ...(typeof search["dest"] === "string" ? { dest: search["dest"] as string } : {}),
    ...(typeof search["trip"] === "string" ? { trip: search["trip"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "AI Trip Planner — Travidy" },
      {
        name: "description",
        content:
          "Plan an entire trip in one conversation. Travidy's AI suggests stays, activities and food you can add to your itinerary with a tap.",
      },
      { property: "og:title", content: "AI Trip Planner — Travidy" },
      {
        property: "og:description",
        content: "Chat with your AI travel buddy and build a complete itinerary instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loaderDeps: ({ search }) => ({ trip: search.trip }),
  loader: ({ context, deps }) => {
    if (deps.trip) {
    return context.queryClient.ensureQueryData(
      tripQuery(deps.trip)
    );
  }

  return null;
},
  component: Planner,
});

const categoryStyle: Record<string, { icon: typeof BedDouble; tone: string }> = {
  hotel: { icon: BedDouble, tone: "bg-ai-soft text-ai" },
  activity: { icon: Waves, tone: "bg-water-soft text-water" },
  attraction: { icon: Landmark, tone: "bg-ai-soft text-ai" },
  restaurant: { icon: Utensils, tone: "bg-adventure-soft text-adventure" },
};

/** A card the assistant proposes in reply to what the traveller actually asked for. */
type Suggestion = {
  name: string;
  category: string;
  subtitle: string;
  price_label: string;
  duration: string;
  rating: number;
  reviews: number;
};

type Msg = { id: string; role: "user" | "ai"; text: string; suggestions?: Suggestion[] };

const uid = () => Math.random().toString(36).slice(2);

function Planner() {
  const { dest, trip: tripParam } = Route.useSearch();
  const qc = useQueryClient();

const { data: trip = null } = useQuery({
    ...tripQuery(tripParam ?? ""),
    enabled: !!tripParam,
  });



const tripId = trip?.id;


const { data: itinerary = [] } = useQuery(
  itineraryQuery(tripId ?? "")
);


  // Conversation lives in the session only — every destination starts blank.
  const [messages, setMessages] = useState<Msg[]>([]);
  const [showRecs, setShowRecs] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addDay, setAddDay] = useState(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const destination = findDestination(dest);
 const destName =
  destination?.name ??
  dest ??
  trip?.destination ??
  "";

const [guestItinerary, setGuestItinerary] = useState<Suggestion[]>([]);

  const [details, setDetails] = useState({
    title: "",
    days: 3,
    travelers: 2,
    budget: 15000,
  });

  useEffect(() => {
  if (!destination) return;

  setDetails({
    title: trip?.title || `${destination.name} Trip`,
    days: trip?.days ?? 5,
    travelers: trip?.travelers ?? 1,
    budget: trip?.budget ?? destination.dailyBudget,
  });
}, [
  destination,
  trip?.title,
  trip?.days,
  trip?.travelers,
  trip?.budget,
]);

  useEffect(() => {
    if (messages.length || thinking)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, thinking]);

  const recs = useMemo<DestRec[]>(() => (dest ? (destinationRecs[dest] ?? []) : []), [dest]);

  const saveTrip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trips")
        .update({
          title: details.title || `${destName} Trip`,
          destination: destName || trip?.destination || "",
          days: Math.max(1, details.days),
          travelers: Math.max(1, details.travelers),
          travelers_label: `${details.travelers} Traveller${details.travelers > 1 ? "s" : ""}`,
          budget: details.budget,
        } as never)
        .eq("id", tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trip", tripId] });
      setEditOpen(false);
      toast.success("Trip details updated");
    },
    onError: () => toast.error("Couldn't save your trip details."),
  });

  function aiReply(prompt: string) {
    const p = prompt.toLowerCase();
    const d = destination;
    if (!d) return "Tell me a bit more and I'll find the right places for you.";
    if (p.includes("hotel") || p.includes("stay")) {
      const hotel = recs.find((r) => r.category === "hotel");
      return `${hotel?.name} ${hotel?.subtitle ? `(${hotel.subtitle})` : ""} is the best value in ${d.name} right now — ${hotel?.price_label}.`;
    }
    if (p.includes("weather") || p.includes("time"))
      return `The best window for ${d.name} is ${d.bestTime}. Pack light layers and something for the evenings.`;
    if (p.includes("pack"))
      return `For ${d.name} I'd pack comfortable shoes, quick-dry clothes, a power bank, sunscreen and a reusable bottle.`;
    if (p.includes("budget") || p.includes("cost"))
      return `Plan for about ${d.dailyBudget} in ${d.name}. A full trip usually lands near ${d.price}.`;
    if (p.includes("food") || p.includes("eat") || p.includes("restaurant"))
      return `Try ${d.food.join(" and ")} — both are local favourites and fit an easy budget.`;
    if (p.includes("itinerary") || p.includes("plan"))
      return `Here's a good shape for your days in ${d.name}: ${d.highlights.slice(0, 3).join(", ")}. Add any of the picks below and I'll slot them into your timeline.`;
    const cat = d.categories[0]?.toLowerCase() ?? "";
    if (cat && p.includes(cat))
      return `${d.name} is made for that — start with ${d.highlights[0]}.`;
    return `Here are my picks for ${d.name} — ${d.tagline} Tap Add on anything you like.`;
  }

 const add = useMutation({
  mutationFn: async (rec: Suggestion) => {
    let currentTripId = tripId;

    // Guest user: keep the recommendation locally.
    if (!currentTripId) {
      setGuestItinerary((items) => {
        // Prevent duplicate additions
        if (items.some((item) => item.name === rec.name)) {
          return items;
        }

       const updated = [
    ...items,
    {
      ...rec,
      id: crypto.randomUUID(),
    },
  ];
  localStorage.setItem("travidy_guest_itinerary", JSON.stringify(updated));
   return updated;
      });

      return { tripId: null };
    }

    // Logged-in user with an existing trip
    const { error } = await supabase.from("itinerary_items").insert({
      trip_id: currentTripId,
      title: rec.title,
      description: rec.description ?? "",
      category: rec.category ?? "activity",
      day: addDay,
    });

    if (error) throw error;

    return { tripId: currentTripId };
  },

  onSuccess: ({ tripId: createdTripId }, rec) => {
    if (createdTripId) {
      qc.invalidateQueries({ queryKey: ["trip", createdTripId] });
      qc.invalidateQueries({ queryKey: ["itinerary", createdTripId] });
    }

    toast.success(`${rec.name} added to your trip.`);
  },

  onError: (error) => {
    console.error("ADD TO TRIP ERROR:", error);
    toast.error("Couldn't add that to your trip.");
  },
});

  const allItinerary = [...itinerary, ...guestItinerary];
  const added = new Set(allItinerary.map((i) => "name" in i ? i.name : i.title));
  const preview = allItinerary.slice(0, 3);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: uid(), role: "user", text: value }]);
    setThinking(true);
    void (async () => {
      let reply = "";
      let suggestions: Suggestion[] = [];
      try {
        const res = await askTravidyAgent({
          tripId: tripId ?? null,
          destinationName: destName || null,
          question: value,
          });
          reply = res.answer ?? "";        reply = "";
      }
      // Fall back to the curated picks only when the model returned nothing usable.
      if (!suggestions.length && !reply) {
        suggestions = matchLocalRecs(value).map((r) => ({
          name: r.name,
          category: r.category,
          subtitle: r.subtitle ?? "",
          price_label: r.price_label ?? "Price varies",
          duration: r.duration ?? "",
          rating: Number(r.rating ?? 4.5),
          reviews: Number(r.reviews ?? 0),
        }));
      }
      setMessages((m) => [
        ...m,
        { id: uid(), role: "ai", text: reply || aiReply(value), suggestions },
      ]);
      setThinking(false);
      setShowRecs(true);
      inputRef.current?.focus();
    })();
  };

  /** Curated picks that actually match the request — never a generic dump. */
  function matchLocalRecs(prompt: string): DestRec[] {
    const p = prompt.toLowerCase();
    const wants = (cat: string) => recs.filter((r) => r.category === cat);
    if (/hotel|stay|hostel|resort|accommodation|room/.test(p)) return wants("hotel");
    if (/food|eat|restaurant|cafe|café|dinner|lunch|breakfast/.test(p)) return wants("restaurant");
    if (/adventure|sport|rafting|trek|bungee|zip|climb|kayak|paraglid|surf|dive/.test(p))
      return wants("activity");
    if (/temple|museum|fort|palace|sightsee|attraction|heritage|spiritual/.test(p))
      return wants("attraction");
    return [];
  }

  const startVoice = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      toast.info("Voice input isn't supported in this browser.");
      return;
    }
    type SRType = new () => {
      lang: string;
      start: () => void;
      onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
      onerror: () => void;
    };
    const rec = new (SR as SRType)();
    rec.lang = "en-IN";
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onerror = () => toast.error("Couldn't hear that. Try again.");
    rec.start();
    toast.info("Listening…");
  };

  if (!dest) {
    return (
      <PhoneShell>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
          <Link to="/" aria-label="Back" className="text-foreground">
            <ArrowLeft className="size-6" />
          </Link>
          <span className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="size-5 text-primary" /> AI Trip Planner
          </span>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex size-9 items-center justify-center rounded-full bg-muted"
          >
            <User className="size-5 text-muted-foreground" />
          </Link>
        </header>

        <div className="space-y-4 p-4">
          <div>
            <h1 className="text-xl">Where are you headed?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a destination and I'll start planning with you.
            </p>
          </div>
          <ul className="space-y-3">
            {DESTINATIONS.map((d) => (
              <li key={d.key}>
                <Link
                  to="/planner"
                  search={{ dest: d.key }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
                >
                  <img
                    src={img(d.key)}
                    alt={d.name}
                    loading="lazy"
                    width={160}
                    height={160}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{d.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{d.tags}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PhoneShell>
    );
  }

  const chips = destination
    ? [
        { label: `${destination.categories[0]}`, tone: "text-primary" },
        { label: "Budget Hotels", tone: "text-ai" },
        { label: "Food", tone: "text-adventure" },
        { label: "Best Time", tone: "text-water" },
        { label: "Packing List", tone: "text-primary" },
        { label: "Give itinerary", tone: "text-adventure" },
      ]
    : [];

  return (
    <PhoneShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Link
          to="/planner"
          aria-label="Back"
          search={{ dest: undefined }}
          className="text-foreground"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="size-5 text-primary" /> AI Trip Planner
        </span>
        <Link
          to="/profile"
          aria-label="Profile"
          className="flex size-9 items-center justify-center rounded-full bg-muted"
        >
          <User className="size-5 text-muted-foreground" />
        </Link>
      </header>

      <div className="space-y-4 p-4">
        <Card className="flex gap-3">
          <img
            src={img(destination?.imageKey ?? dest)}
            alt={destName}
            loading="lazy"
            width={200}
            height={200}
            className="size-20 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="truncate text-lg">{details.title || `${destName} Trip`}</h1>
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <Fact
                icon={Calendar}
                label={`${details.days} Days`}
                sub={destination?.bestTime ?? ""}
              />
              <Fact
                icon={Users}
                label={`${details.travelers} Travelers`}
                sub={trip?.travelers_label ?? `${details.travelers} Traveller${details.travelers > 1 ? "s" : ""}`}
              />
              <Fact icon={Wallet} label="Budget" sub={inr(details.budget)} />
            </dl>
          </div>
        </Card>

        {destination && (
          <Card>
            <h2 className="text-base">{destination.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{destination.tagline}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {destination.categories.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-medium text-accent-foreground"
                >
                  {c}
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {destination.highlights.map((h) => (
                <li key={h} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> {h}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs">
              <span className="font-semibold">Daily budget:</span>{" "}
              <span className="text-muted-foreground">{destination.dailyBudget}</span>
            </p>
          </Card>
        )}

        {showRecs && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs">
            <span className="shrink-0 font-semibold">Add to</span>
            {Array.from({ length: Math.max(1, details.days) }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => setAddDay(d)}
                aria-pressed={addDay === d}
                className={`shrink-0 rounded-full px-3 py-1.5 font-semibold ${
                  addDay === d
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                Day {d}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {messages.length === 0 && !thinking && (
            <div className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Ask me anything about {destName} — stays, food, weather or activities.
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex items-end justify-end gap-2">
                <p className="max-w-[78%] rounded-2xl rounded-br-md bg-primary-soft px-4 py-3 text-sm text-accent-foreground">
                  {m.text}
                </p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </span>
              </div>
            ) : (
              <div key={m.id} className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <Sparkles className="size-4 text-primary" />
                  </span>
                  <p className="max-w-[78%] rounded-2xl rounded-bl-md bg-card px-4 py-3 text-sm shadow-card">
                    {m.text}
                  </p>
                </div>
                {!!m.suggestions?.length && (
                  <ul className="space-y-3 pl-10">
                    {m.suggestions.map((r, idx) => {
                      const style = categoryStyle[r.category] ?? {
                        icon: Landmark,
                        tone: "bg-ai-soft text-ai",
                      };
                      const Icon = style.icon;
                      const isAdded = added.has(r.name);
                      return (
                        <li
                          key={`${m.id}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
                        >
                          <img
                            src={img(destination?.imageKey ?? dest)}
                            alt={r.name}
                            loading="lazy"
                            width={160}
                            height={160}
                            className="size-16 shrink-0 rounded-xl object-cover"
                          />
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.tone}`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm">{r.name}</h3>
                            {r.subtitle && (
                              <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                            )}
                            <p className="mt-0.5 text-xs font-semibold">
                              {r.price_label}
                              {r.duration && (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  • {r.duration}
                                </span>
                              )}
                            </p>
                            {r.rating > 0 && (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Star className="size-3 fill-primary text-primary" />
                                <span className="font-semibold text-foreground">{r.rating}</span>
                                {r.reviews > 0 && <>({r.reviews} reviews)</>}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => add.mutate(r)}
                            disabled={isAdded || add.isPending}
                            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                              isAdded
                                ? "border-transparent bg-primary-soft text-accent-foreground"
                                : "border-primary text-primary"
                            }`}
                          >
                            {isAdded ? (
                              <span className="flex items-center gap-1">
                                <Check className="size-3.5" /> Added
                              </span>
                            ) : (
                              "Add"
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ),
          )}

          {thinking && (
            <div className="flex items-center gap-2 pl-10 text-sm text-muted-foreground">
              <Sparkles className="size-4 animate-pulse text-primary" /> Finding the perfect
              places...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {showRecs && (
          <p className="text-xs text-muted-foreground">
            Suggestions are added to{" "}
            <span className="font-semibold text-foreground">Day {addDay}</span> — change it above
            before tapping Add.
          </p>
        )}

        <div>
          <p className="text-sm font-semibold">You can also try asking:</p>
          <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {chips.map((c) => (
              <li key={c.label}>
                <button
                  onClick={() => submit(c.label)}
                  className={`rounded-full border border-border bg-card px-4 py-2 text-xs font-medium whitespace-nowrap shadow-card ${c.tone}`}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-card py-2 pr-2 pl-3 shadow-card"
        >
          <Sparkles className="size-5 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${destName}...`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Voice input"
            onClick={startVoice}
            className="text-muted-foreground"
          >
            <Mic className="size-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) toast.success(`${f.name} attached to this trip`);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Attach"
            onClick={() => fileRef.current?.click()}
            className="text-muted-foreground"
          >
            <Paperclip className="size-5" />
          </button>
          <button
            type="submit"
            aria-label="Send"
            disabled={thinking}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
          >
            <Send className="size-4" />
          </button>
        </form>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">
              Your Itinerary <span className="text-xs text-muted-foreground">(Preview)</span>
            </h2>
            <Link
              to="/itinerary"
              search={{ trip: tripId }}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              View Full Itinerary <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {preview.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Nothing added yet — tap Add on a suggestion to start building your day.
            </p>
          ) : (
            <ul className="no-scrollbar mt-3 flex gap-4 overflow-x-auto">
              {preview.map((i) => (
                <li key={i.id} className="flex min-w-[150px] items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {i.time_label}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft">
                    <Sparkles className="size-4 text-primary" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{i.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {i.place}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <div className="flex-1">
            <h2 className="text-base text-accent-foreground">Invite Friends</h2>
            <p className="text-xs text-muted-foreground">
              Plan trips together and get exciting rewards!
            </p>
          </div>
          <button
            onClick={() => {
              void navigator.clipboard
                ?.writeText(window.location.href)
                .then(() => toast.success("Invite link copied to your clipboard"))
                .catch(() => toast.error("Couldn't copy the link."));
            }}
            className="rounded-full bg-surface px-4 py-2 text-xs font-semibold text-primary shadow-card"
          >
            Invite Now
          </button>
          <Gift className="size-8 text-adventure" />
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit trip details</DialogTitle>
            <DialogDescription>Adjust the basics for your {destName} trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="trip-title">Trip name</Label>
              <Input
                id="trip-title"
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-days">Days</Label>
                <Input
                  id="trip-days"
                  type="number"
                  min={1}
                  value={details.days}
                  onChange={(e) => setDetails((d) => ({ ...d, days: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-travelers">Travelers</Label>
                <Input
                  id="trip-travelers"
                  type="number"
                  min={1}
                  value={details.travelers}
                  onChange={(e) => setDetails((d) => ({ ...d, travelers: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-budget">Budget (₹)</Label>
              <Input
                id="trip-budget"
                type="number"
                min={0}
                step={500}
                value={details.budget}
                onChange={(e) => setDetails((d) => ({ ...d, budget: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveTrip.mutate()} disabled={saveTrip.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneShell>
  );
}

function Fact({ icon: Icon, label, sub }: { icon: typeof Calendar; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="truncate font-semibold">{label}</dt>
        <dd className="truncate text-muted-foreground">{sub}</dd>
      </div>
    </div>
  );
}
