import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Landmark,
  MoreHorizontal,
  Navigation,
  Pencil,
  Plus,
  Share2,
  Sun,
  Utensils,
  Wallet,
  Waves,
  BedDouble,
  Users,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";

import { PhoneShell, Card } from "@/components/travidy/shell";
import { supabase } from "@/integrations/supabase/client";
import {
  TRIP_ID,
  checklistQuery,
  dateRange,
  dayLabel,
  img,
  inr,
  itineraryQuery,
  tripQuery,
  type ChecklistItem,
} from "@/lib/travidy";

export const Route = createFileRoute("/itinerary")({
  head: () => ({
    meta: [
      { title: "Rishikesh Escape Itinerary — Travidy" },
      {
        name: "description",
        content:
          "Day-by-day itinerary, live trip progress, today's checklist and budget summary — Travidy walks beside you during the trip.",
      },
      { property: "og:title", content: "Your Itinerary & Checklist — Travidy" },
      {
        property: "og:description",
        content: "Follow every moment: timeline, checklist and budget in one screen.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(tripQuery());
    context.queryClient.ensureQueryData(itineraryQuery());
    context.queryClient.ensureQueryData(checklistQuery());
  },
  component: Itinerary,
});

const catStyle: Record<string, { icon: typeof Utensils; tone: string }> = {
  restaurant: { icon: Utensils, tone: "bg-adventure-soft text-adventure" },
  activity: { icon: Waves, tone: "bg-water-soft text-water" },
  attraction: { icon: Landmark, tone: "bg-primary-soft text-primary" },
  hotel: { icon: BedDouble, tone: "bg-ai-soft text-ai" },
};

const budget = [
  { label: "Hotel", amount: 5400, tone: "bg-primary" },
  { label: "Food", amount: 2300, tone: "bg-adventure" },
  { label: "Transport", amount: 1400, tone: "bg-water" },
  { label: "Activities", amount: 3400, tone: "bg-ai" },
];

function Itinerary() {
  const qc = useQueryClient();
  const { data: trip } = useSuspenseQuery(tripQuery());
  const { data: items } = useSuspenseQuery(itineraryQuery());
  const { data: checklist } = useSuspenseQuery(checklistQuery());
  const [day, setDay] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const dayItems = items.filter((i) => i.day === day);
  const shown = expanded ? dayItems : dayItems.slice(0, 5);
  const doneCount = items.filter((i) => i.status === "completed").length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const checkedCount = checklist.filter((c) => c.done).length;

  const toggleCheck = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("checklist_items")
        .update({ done: !item.done } as never)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", TRIP_ID] }),
    onError: () => toast.error("Couldn't update that task."),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("itinerary_items")
        .update({ status: "completed" } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itinerary", TRIP_ID] });
      toast.success("Nice! Marked as done.");
    },
    onError: () => toast.error("Couldn't update that activity."),
  });

  const spentTotal = budget.reduce((s, b) => s + b.amount, 0);

  return (
    <PhoneShell>
      <header className="sticky top-0 z-20 flex items-start justify-between gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Link to="/planner" aria-label="Back" className="mt-1 text-foreground">
          <ArrowLeft className="size-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 truncate text-lg">
            {trip.title} <Pencil className="size-4 shrink-0 text-primary" />
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {dateRange(trip.start_date, trip.end_date)} • {trip.travelers} Travelers
          </p>
        </div>
        <button
          onClick={() => toast.success("Trip link copied — share it with your travel buddies")}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <Share2 className="size-3.5" /> Share
        </button>
        <button aria-label="More" className="rounded-full border border-border p-1.5">
          <MoreHorizontal className="size-4" />
        </button>
      </header>

      <div className="space-y-4 p-4">
        <section className="relative overflow-hidden rounded-2xl">
          <img
            src={img("rishikesh")}
            alt={`${trip.destination}, ${trip.region}`}
            loading="lazy"
            width={1024}
            height={768}
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div>
              <h2 className="text-lg text-background">
                {trip.destination}, {trip.region}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-background/90">
                <Sun className="size-4 text-adventure" /> {trip.weather}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <dl className="flex flex-1 gap-3 rounded-xl bg-surface/95 p-3 text-[11px]">
                <Fact icon={Calendar} label={`${trip.days} Days`} sub="20 – 22 Jun" />
                <Fact
                  icon={Users}
                  label={`${trip.travelers} Travelers`}
                  sub={trip.travelers_label ?? ""}
                />
                <Fact icon={Wallet} label={inr(trip.budget)} sub="Budget" />
              </dl>
            </div>
          </div>
          <div className="absolute top-3 right-3 w-32 rounded-xl bg-surface/95 p-3 text-center shadow-card">
            <p className="text-[11px] font-semibold">Trip Progress</p>
            <Ring value={progress} />
            <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <CheckSquare className="size-3" /> {doneCount} / {items.length} done
            </p>
          </div>
        </section>

        <nav className="flex border-b border-border">
          {Array.from({ length: trip.days }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 pb-3 text-center ${
                d === day
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="block text-sm font-bold tracking-wide">DAY {d}</span>
              <span className="block text-[11px]">{dayLabel(trip.start_date, d)}</span>
            </button>
          ))}
        </nav>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">{day === 1 ? "Today's Itinerary" : `Day ${day} Plan`}</h2>
            <Link
              to="/planner"
              className="flex items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add Activity
            </Link>
          </div>

          {dayItems.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nothing planned for this day yet. Add activities from the AI planner.
            </p>
          )}

          <ul className="mt-4 space-y-4">
            {shown.map((item, idx) => {
              const s = catStyle[item.category ?? ""] ?? {
                icon: Landmark,
                tone: "bg-primary-soft text-primary",
              };
              const Icon = s.icon;
              const isDone = item.status === "completed";
              return (
                <li key={item.id} className="flex gap-3">
                  <div className="flex w-14 shrink-0 flex-col items-center">
                    <span
                      className={`text-[11px] font-semibold ${isDone ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {item.time_label}
                    </span>
                    <span
                      className={`mt-1 size-3 rounded-full border-2 ${
                        isDone ? "border-primary bg-primary" : "border-muted-foreground/50"
                      }`}
                    />
                    {idx < shown.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${isDone ? "bg-primary" : "bg-border"}`}
                      />
                    )}
                  </div>
                  <div className="relative shrink-0">
                    <img
                      src={img(item.image_key)}
                      alt={item.title}
                      loading="lazy"
                      width={160}
                      height={160}
                      className="size-14 rounded-xl object-cover"
                    />
                    <span
                      className={`absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full ring-2 ring-card ${s.tone}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm leading-tight">{item.title}</h3>
                    <p className="text-xs leading-snug text-muted-foreground">{item.place}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {item.price_label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5">{item.duration}</span>
                      {isDone ? (
                        <span className="ml-auto flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-accent-foreground">
                          Completed <Check className="size-3" />
                        </span>
                      ) : (
                        <button
                          onClick={() => complete.mutate(item.id)}
                          className="ml-auto flex items-center gap-1 rounded-full border border-primary px-2.5 py-1 font-semibold text-primary"
                        >
                          <Navigation className="size-3" /> Navigate
                        </button>
                      )}
                    </div>
                  </div>

                </li>
              );
            })}
          </ul>

          {dayItems.length > 5 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-2 border-t border-border pt-3 text-sm font-semibold text-primary"
            >
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              {expanded ? "Show less" : "View full itinerary"}
            </button>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">Today's Checklist</h2>
            <button
              onClick={() => toast("Adding custom items is coming next.")}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add Item
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => toggleCheck.mutate(c)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      c.done ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {c.done && <Check className="size-3.5 text-primary-foreground" />}
                  </span>
                  <span
                    className={`text-sm ${c.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {checkedCount} of {checklist.length} tasks completed
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(checkedCount / Math.max(checklist.length, 1)) * 100}%` }}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">Budget Summary</h2>
            <span className="text-xs font-semibold text-primary">View Details</span>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-display text-2xl font-bold">{inr(spentTotal)}</span>{" "}
            <span className="text-muted-foreground">spent</span>
          </p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full">
            {budget.map((b) => (
              <div
                key={b.label}
                className={b.tone}
                style={{ width: `${(b.amount / spentTotal) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {budget.map((b) => (
              <li key={b.label} className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${b.tone}`} />
                <span className="flex-1 text-muted-foreground">{b.label}</span>
                <span className="font-semibold">{inr(b.amount)}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round((b.amount / spentTotal) * 100)}%
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Remaining Budget</span>
            <span className="font-display text-lg font-bold text-primary">
              {inr(trip.budget - spentTotal)}
            </span>
          </div>
        </Card>

        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <Bell className="size-5 text-primary" />
          <p className="flex-1 text-xs text-muted-foreground">
            Travidy will nudge you 30 minutes before each activity.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto mt-1 size-16">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-sm font-bold">{value}%</span>
        <span className="text-[9px] text-muted-foreground">Complete</span>
      </span>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof Calendar;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="truncate font-semibold">{label}</dt>
        <dd className="truncate text-muted-foreground">{sub}</dd>
      </div>
    </div>
  );
}
