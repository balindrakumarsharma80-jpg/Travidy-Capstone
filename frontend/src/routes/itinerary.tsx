import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Trash2,
  Utensils,
  Wallet,
  Waves,
  BedDouble,
  Users,
  UserPlus,
  CheckSquare,
  X,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  TRIP_ID,
  checklistQuery,
  dateRange,
  dayLabel,
  img,
  inr,
  itineraryQuery,
  priceValue,
  tripQuery,
  type ChecklistItem,
  type ItineraryItem,
} from "@/lib/travidy";
import { destinations } from "@/lib/destinations";
import { suggestChecklist } from "@/lib/checklist-suggestions";
import { exportItineraryPdf } from "@/lib/itinerary-pdf";
import { collaboratorsQuery } from "@/lib/trips";

export const Route = createFileRoute("/itinerary")({
  head: () => ({
    meta: [
      { title: "Your Itinerary & Checklist — Travidy" },
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { trip?: string } =>
    typeof search["trip"] === "string" ? { trip: search["trip"] as string } : {},

  loaderDeps: ({ search }) => ({ trip: search.trip }),
  loader: ({ context, deps }) => {
    const id = deps.trip ?? TRIP_ID;
    context.queryClient.ensureQueryData(tripQuery(id));
    context.queryClient.ensureQueryData(itineraryQuery(id));
    context.queryClient.ensureQueryData(checklistQuery(id));
  },
  component: Itinerary,
});

const catStyle: Record<string, { icon: typeof Utensils; tone: string; bucket: string }> = {
  restaurant: { icon: Utensils, tone: "bg-adventure-soft text-adventure", bucket: "Food" },
  activity: { icon: Waves, tone: "bg-water-soft text-water", bucket: "Activities" },
  attraction: { icon: Landmark, tone: "bg-primary-soft text-primary", bucket: "Sightseeing" },
  hotel: { icon: BedDouble, tone: "bg-ai-soft text-ai", bucket: "Stay" },
};

const bucketTone: Record<string, string> = {
  Stay: "bg-ai",
  Food: "bg-adventure",
  Activities: "bg-water",
  Sightseeing: "bg-primary",
  Other: "bg-muted-foreground",
};

function Itinerary() {
  const qc = useQueryClient();
  const { trip: tripParam } = Route.useSearch();
  const tripId = tripParam ?? TRIP_ID;
  const { data: trip } = useSuspenseQuery(tripQuery(tripId));
  const { data: items } = useSuspenseQuery(itineraryQuery(tripId));
  const { data: checklist } = useSuspenseQuery(checklistQuery(tripId));
  const { data: collaborators = [] } = useQuery(collaboratorsQuery(tripId));
  const [shareOpen, setShareOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);
  const [details, setDetails] = useState({
    title: trip.title,
    days: trip.days,
    travelers: trip.travellers ?? trip.travelers,
    budget: trip.budget_amount ?? trip.budget,
  });

  const dayItems = items.filter((i) => i.day === day);
  const shown = expanded ? dayItems : dayItems.slice(0, 5);
  const doneCount = items.filter((i) => i.status === "completed").length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const checkedCount = checklist.filter((c) => c.done).length;
  const suggestedTasks = suggestChecklist(
    items,
    checklist.map((c) => c.label),
  );

  const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key, tripId] });

  const toggleCheck = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("checklist_items")
        .update({ done: !item.done } as never)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("checklist"),
    onError: () => toast.error("Couldn't update that task."),
  });

  const addTask = useMutation({
    mutationFn: async (label: string) => {
      const { error } = await supabase.from("checklist_items").insert({
        trip_id: tripId,
        label,
        done: false,
        position: checklist.length + 1,
        order_index: checklist.length + 1,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate("checklist");
      setNewTask("");
      setAddOpen(false);
      toast.success("Task added to your checklist");
    },
    onError: () => toast.error("Couldn't add that task."),
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("checklist"),
    onError: () => toast.error("Couldn't remove that task."),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("itinerary_items")
        .update({ status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      invalidate("itinerary");
      toast.success(v.status === "completed" ? "Nice! Marked as done." : "Moved back to upcoming.");
    },
    onError: () => toast.error("Couldn't update that activity."),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate("itinerary");
      toast.success("Removed from your plan");
    },
    onError: () => toast.error("Couldn't remove that activity."),
  });

  const clearPlan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("itinerary_items").delete().eq("trip_id", tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate("itinerary");
      toast.success("Plan cleared — start fresh whenever you like.");
    },
    onError: () => toast.error("Couldn't clear the plan."),
  });

  const resetChecklist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("checklist_items")
        .update({ done: false } as never)
        .eq("trip_id", tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate("checklist");
      toast.success("Checklist reset");
    },
    onError: () => toast.error("Couldn't reset the checklist."),
  });

  const saveTrip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trips")
        .update({
          title: details.title,
          days: details.days,
          travelers: details.travelers,
          travellers: details.travelers,
          travelers_label: `${details.travelers} Traveller${details.travelers > 1 ? "s" : ""}`,
          budget: details.budget,
          budget_amount: details.budget,
        } as never)
        .eq("id", tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate("trip");
      setEditOpen(false);
      if (day > details.days) setDay(1);
      toast.success("Trip details updated");
    },
    onError: () => toast.error("Couldn't save your trip details."),
  });

  // Spend is derived from what you have actually planned — nothing is assumed.
  const buckets = new Map<string, number>();
  for (const i of items) {
    const bucket = catStyle[i.category ?? ""]?.bucket ?? "Other";
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + priceValue(i.price_label));
  }
  const budget = [...buckets.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => ({ label, amount, tone: bucketTone[label] ?? "bg-primary" }));
  const spentTotal = budget.reduce((s, b) => s + b.amount, 0);
  const budgetTotal = trip.budget_amount ?? trip.budget;

  // Keep the persisted spend in step with what is actually planned.
  useEffect(() => {
    if ((trip.spent_amount ?? trip.spent) === spentTotal) return;
    void supabase
      .from("trips")
      .update({ spent: spentTotal, spent_amount: spentTotal } as never)
      .eq("id", tripId);
  }, [spentTotal, trip.spent_amount, trip.spent, tripId]);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/shared/${trip.share_token}` : "";
  const inviteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/trips/${tripId}/join` : "";
  const copy = async (url: string, label: string) => {
    await navigator.clipboard.writeText(url);
    toast.success(`${label} copied`);
  };

  const catalogDest = destinations.find(
    (d) => d.name.toLowerCase() === trip.destination.toLowerCase(),
  );
  const planDest = catalogDest?.id;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: trip.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Trip link copied — share it with your travel buddies");
      }
    } catch {
      /* dismissed */
    }
  };

  const navigateTo = (item: ItineraryItem) => {
    const q = encodeURIComponent(`${item.title} ${item.place ?? trip.destination}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };

  const downloadPdf = () => {
    const ok = exportItineraryPdf(trip, items, checklist);
    if (ok) toast.success("Choose “Save as PDF” in the print dialog");
    else toast.error("Allow pop-ups to export your itinerary.");
  };

  return (
    <PhoneShell>
      <header className="sticky top-0 z-20 flex items-start justify-between gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Link
          to="/planner"
          search={{ dest: planDest }}
          aria-label="Back"
          className="mt-1 text-foreground"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => {
              setDetails({
                title: trip.title,
                days: trip.days,
                travelers: trip.travelers,
                budget: trip.budget,
              });
              setEditOpen(true);
            }}
            className="flex max-w-full items-center gap-1.5 text-left"
          >
            <h1 className="truncate text-lg">{trip.title}</h1>
            <Pencil className="size-4 shrink-0 text-primary" />
          </button>
          <p className="truncate text-xs text-muted-foreground">
            {dateRange(trip.start_date, trip.end_date)} • {trip.travelers} Travelers
          </p>
        </div>
        <button
          onClick={() => void share()}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <Share2 className="size-3.5" /> Share
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More"
            className="rounded-full border border-border p-1.5"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              Edit trip details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadPdf()}>
              Export itinerary as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAddOpen(true)}>
              Add checklist item
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => resetChecklist.mutate()}>
              Reset checklist
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => clearPlan.mutate()} className="text-destructive">
              Clear all activities
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-4 p-4">
        <section className="relative overflow-hidden rounded-2xl">
          <img
            src={img(catalogDest?.imageKey)}
            alt={`${trip.destination}${trip.region ? `, ${trip.region}` : ""}`}
            loading="lazy"
            width={1024}
            height={768}
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div>
              <h2 className="text-lg text-background">
                {trip.destination}
                {trip.region ? `, ${trip.region}` : ""}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-background/90">
                <Sun className="size-4 text-adventure" /> {trip.weather}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <dl className="flex flex-1 gap-3 rounded-xl bg-surface/95 p-3 text-[11px]">
                <Fact
                  icon={Calendar}
                  label={`${trip.days} Days`}
                  sub={dateRange(trip.start_date, trip.end_date)}
                />
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
                d === day ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
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
              search={{ dest: planDest }}
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
                bucket: "Other",
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
                    <button
                      aria-label={
                        isDone ? `Mark ${item.title} as upcoming` : `Mark ${item.title} as done`
                      }
                      onClick={() =>
                        setStatus.mutate({ id: item.id, status: isDone ? "upcoming" : "completed" })
                      }
                      className={`mt-1 flex size-4 items-center justify-center rounded-full border-2 ${
                        isDone ? "border-primary bg-primary" : "border-muted-foreground/50"
                      }`}
                    >
                      {isDone && <Check className="size-2.5 text-primary-foreground" />}
                    </button>
                    {idx < shown.length - 1 && (
                      <span className={`w-0.5 flex-1 ${isDone ? "bg-primary" : "bg-border"}`} />
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
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm leading-tight">{item.title}</h3>
                      <button
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeItem.mutate(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">{item.place}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {item.price_label && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {item.price_label}
                        </span>
                      )}
                      {item.duration && (
                        <span className="rounded-full bg-muted px-2 py-0.5">{item.duration}</span>
                      )}
                      <button
                        onClick={() => navigateTo(item)}
                        className="ml-auto flex items-center gap-1 rounded-full border border-primary px-2.5 py-1 font-semibold text-primary"
                      >
                        <Navigation className="size-3" /> Navigate
                      </button>
                      <button
                        onClick={() =>
                          setStatus.mutate({
                            id: item.id,
                            status: isDone ? "upcoming" : "completed",
                          })
                        }
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                          isDone
                            ? "bg-primary-soft text-accent-foreground"
                            : "border border-border text-muted-foreground"
                        }`}
                      >
                        {isDone ? "Completed" : "Mark done"} <Check className="size-3" />
                      </button>
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
            <h2 className="text-base">Trip Checklist</h2>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add Item
            </button>
          </div>

          {suggestedTasks.length > 0 && (
            <div className="mt-3 rounded-xl bg-primary-soft/60 p-3">
              <p className="text-[11px] font-semibold text-accent-foreground">
                Suggested for what you've planned
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestedTasks.map((s) => (
                  <button
                    key={s}
                    onClick={() => addTask.mutate(s)}
                    className="flex items-center gap-1 rounded-full border border-primary/40 bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary"
                  >
                    <Plus className="size-3" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {checklist.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              No tasks yet — add whatever you need to remember.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCheck.mutate(c)}
                    className="flex flex-1 items-center gap-3 text-left"
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
                  <button
                    aria-label={`Remove ${c.label}`}
                    onClick={() => removeTask.mutate(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            <button
              onClick={() => setShowBudgetDetail((v) => !v)}
              className="text-xs font-semibold text-primary"
            >
              {showBudgetDetail ? "Hide details" : "View Details"}
            </button>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-display text-2xl font-bold">{inr(spentTotal)}</span>{" "}
            <span className="text-muted-foreground">planned</span>
          </p>
          {spentTotal === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Nothing planned yet — costs appear here as you add activities.
            </p>
          ) : (
            <>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                {budget.map((b) => (
                  <div
                    key={b.label}
                    className={b.tone}
                    style={{ width: `${(b.amount / spentTotal) * 100}%` }}
                  />
                ))}
              </div>
              {showBudgetDetail && (
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
              )}
            </>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Remaining Budget</span>
            <span className="font-display text-lg font-bold text-primary">
              {inr(budgetTotal - spentTotal)}
            </span>
          </div>
        </Card>

        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <Bell className="size-5 text-primary" />
          <p className="flex-1 text-xs text-muted-foreground">
            Travidy will nudge you 30 minutes before each activity.
          </p>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base">Share & collaborators</h2>
            <button
              onClick={() => setShareOpen(true)}
              className="text-xs font-semibold text-primary"
            >
              Manage
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {collaborators.length === 0
              ? "No collaborators yet — invite whoever is travelling with you."
              : `${collaborators.length} collaborator${collaborators.length > 1 ? "s" : ""} on this trip.`}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => copy(shareUrl, "Read-only link")}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-semibold"
            >
              <Share2 className="size-3.5 text-primary" /> Read-only link
            </button>
            <button
              onClick={() => copy(inviteUrl, "Invite link")}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-semibold"
            >
              <UserPlus className="size-3.5 text-primary" /> Invite to edit
            </button>
          </div>
        </Card>

        <Card className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Been there already?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Capture photos, video and voice notes in your private journal.
            </p>
          </div>
          <Link
            to="/journal"
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            Journal
          </Link>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add a checklist item</DialogTitle>
            <DialogDescription>Anything you want to remember before you go.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = newTask.trim();
              if (v) addTask.mutate(v);
            }}
            className="space-y-3"
          >
            <Input
              autoFocus
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="e.g. Carry a power bank"
            />
            <DialogFooter>
              <Button type="submit" disabled={!newTask.trim() || addTask.isPending}>
                Add item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share this trip</DialogTitle>
            <DialogDescription>
              Send a read-only plan, or invite a companion to edit it with you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <Label>Read-only link</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} />
                <Button variant="outline" onClick={() => copy(shareUrl, "Read-only link")}>
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Invite link (edit access)</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl} />
                <Button variant="outline" onClick={() => copy(inviteUrl, "Invite link")}>
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <Label>Collaborators</Label>
              {collaborators.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">Nobody has joined yet.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {collaborators.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="truncate">{c.user_id.slice(0, 8)}…</span>
                      <span className="capitalize">{c.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit trip details</DialogTitle>
            <DialogDescription>Update the basics for this trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="it-title">Trip name</Label>
              <Input
                id="it-title"
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="it-days">Days</Label>
                <Input
                  id="it-days"
                  type="number"
                  min={1}
                  max={14}
                  value={details.days}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, days: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="it-travelers">Travelers</Label>
                <Input
                  id="it-travelers"
                  type="number"
                  min={1}
                  value={details.travelers}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, travelers: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="it-budget">Budget (₹)</Label>
              <Input
                id="it-budget"
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

function Fact({ icon: Icon, label, sub }: { icon: typeof Calendar; label: string; sub: string }) {
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
