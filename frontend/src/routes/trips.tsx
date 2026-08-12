import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Copy,
  Loader2,
  LogIn,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/travidy/app-header";
import { Card, PhoneShell } from "@/components/travidy/shell";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { destinations } from "@/lib/destinations";
import { inr } from "@/lib/travidy";
import {
  BUDGET_TIERS,
  TRIP_STATUSES,
  catalogIdFor,
  createTrip,
  myTripsQuery,
  statusTone,
  tripDates,
} from "@/lib/trips";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "My Trips — Travidy" },
      {
        name: "description",
        content:
          "Create a trip, track its dates, budget and status, and share a read-only plan with your travel companions.",
      },
      { property: "og:title", content: "My Trips — Travidy" },
      {
        property: "og:description",
        content: "All your Travidy trips in one place, saved to your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyTrips,
});

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const emptyDraft = {
  destinationId: destinations[0]?.id ?? "rishikesh",
  title: "",
  startDate: today(),
  endDate: plusDays(3),
  travellers: 2,
  budgetAmount: 25000,
  budgetTier: "mid-range",
  status: "upcoming",
};

function MyTrips() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | (typeof TRIP_STATUSES)[number]>("all");
  const [sort, setSort] = useState<"recent" | "date" | "budget">("recent");

  const { data: allTrips = [], isLoading } = useQuery(myTripsQuery(user?.id));

  const q = search.trim().toLowerCase();
  const trips = allTrips
    .filter(
      (t) =>
        (statusFilter === "all" || t.status === statusFilter) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          (t.region ?? "").toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      if (sort === "date") return a.start_date.localeCompare(b.start_date);
      if (sort === "budget") return (b.budget_amount ?? b.budget) - (a.budget_amount ?? a.budget);
      return b.created_at.localeCompare(a.created_at);
    });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const dest = destinations.find((d) => d.id === draft.destinationId);
      return createTrip({
        userId: user.id,
        destinationId: draft.destinationId,
        title: draft.title.trim() || `${dest?.name ?? "New"} trip`,
        startDate: draft.startDate,
        endDate: draft.endDate,
        travellers: draft.travellers,
        budgetAmount: draft.budgetAmount,
        budgetTier: draft.budgetTier,
        status: draft.status,
      });
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["my-trips"] });
      setOpen(false);
      setDraft(emptyDraft);
      toast.success("Trip created");
      navigate({ to: "/itinerary", search: { trip: id } });
    },
    onError: () => toast.error("Couldn't create that trip. Please try again."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-trips"] });
      toast.success("Trip deleted");
    },
    onError: () => toast.error("Couldn't delete that trip."),
  });

  const copyShare = async (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Read-only link copied");
  };

  return (
    <PhoneShell>
      <AppHeader />
      <div className="space-y-4 p-4 pb-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">My Trips</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every trip you plan with Travidy, saved to your account.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} disabled={!isAuthenticated}>
            <Plus className="size-4" /> New
          </Button>
        </div>

        {isAuthenticated && trips.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trips or destinations"
                aria-label="Search trips"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...TRIP_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Sort trips"
                className="ml-auto rounded-full border border-border bg-background px-2 py-1 text-[11px] font-semibold"
              >
                <option value="recent">Newest first</option>
                <option value="date">By start date</option>
                <option value="budget">By budget</option>
              </select>
            </div>
          </div>
        )}

        {!isAuthenticated && !loading && (
          <Card className="text-center">
            <h2 className="text-sm font-semibold">Sign in to plan a trip</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Trips, checklists and budgets are tied to your account so they survive a refresh.
            </p>
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <LogIn className="size-4" /> Sign in
            </Link>
          </Card>
        )}

        {isAuthenticated && isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}

        {isAuthenticated && !isLoading && trips.length === 0 && (
          <Card className="text-center">
            <h2 className="text-sm font-semibold">
              {allTrips.length === 0 ? "No trips yet" : "No trips match your search"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {allTrips.length === 0
                ? "Create your first trip and Travidy will plan it with you."
                : "Try a different keyword or clear the status filter."}
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {trips.map((t) => {
            const catalogId = catalogIdFor(t.destination);
            return (
              <li key={t.id}>
                <Card className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{t.title}</h2>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" /> {t.destination}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        statusTone[t.status] ?? statusTone["draft"]
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <dl className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="flex items-start gap-1.5">
                      <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <dt className="font-semibold">{t.days} days</dt>
                        <dd className="truncate text-muted-foreground">{tripDates(t)}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Users className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <dt className="font-semibold">{t.travellers ?? t.travelers}</dt>
                        <dd className="text-muted-foreground">travellers</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Wallet className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <dt className="font-semibold">{inr(t.budget_amount ?? t.budget)}</dt>
                        <dd className="truncate text-muted-foreground">{t.budget_tier}</dd>
                      </div>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      to="/itinerary"
                      search={{ trip: t.id }}
                      className="rounded-xl bg-primary px-3 py-2 font-bold text-primary-foreground"
                    >
                      Open trip
                    </Link>
                    <Link
                      to="/planner"
                      search={{ dest: catalogId, trip: t.id }}
                      className="rounded-xl border border-border px-3 py-2 font-semibold"
                    >
                      Plan with AI
                    </Link>
                    <button
                      onClick={() => copyShare(t.share_token)}
                      className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-semibold"
                    >
                      <Copy className="size-3.5" /> Share
                    </button>
                    <button
                      aria-label={`Delete ${t.title}`}
                      onClick={() => remove.mutate(t.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-[380px] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create a trip</DialogTitle>
            <DialogDescription>Pick where you're going and the basics.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-dest">Destination</Label>
              <select
                id="t-dest"
                value={draft.destinationId}
                onChange={(e) => setDraft((d) => ({ ...d, destinationId: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-title">Trip name</Label>
              <Input
                id="t-title"
                value={draft.title}
                placeholder="Weekend in the hills"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-start">Start</Label>
                <Input
                  id="t-start"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-end">End</Label>
                <Input
                  id="t-end"
                  type="date"
                  min={draft.startDate}
                  value={draft.endDate}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-travellers">Travellers</Label>
                <Input
                  id="t-travellers"
                  type="number"
                  min={1}
                  value={draft.travellers}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, travellers: Math.max(1, Number(e.target.value)) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-budget">Budget (₹)</Label>
                <Input
                  id="t-budget"
                  type="number"
                  min={0}
                  step={500}
                  value={draft.budgetAmount}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, budgetAmount: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-tier">Budget style</Label>
                <select
                  id="t-tier"
                  value={draft.budgetTier}
                  onChange={(e) => setDraft((d) => ({ ...d, budgetTier: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm capitalize"
                >
                  {BUDGET_TIERS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-status">Status</Label>
                <select
                  id="t-status"
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm capitalize"
                >
                  {TRIP_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />} Create trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneShell>
  );
}
