import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { destinations, findDestination } from "@/lib/destinations";

/** A trip row as owned by a signed-in traveller. */
export type TripRow = {
  id: string;
  user_id: string | null;
  destination_id: string | null;
  title: string;
  destination: string;
  region: string | null;
  start_date: string;
  end_date: string;
  days: number;
  travelers: number;
  travellers: number;
  budget_tier: string | null;
  status: string;
  budget_amount: number;
  spent_amount: number;
  budget: number;
  spent: number;
  share_token: string;
  created_at: string;
};

export type Collaborator = {
  id: string;
  trip_id: string;
  user_id: string;
  role: string;
  invited_at: string;
};

export const TRIP_STATUSES = ["draft", "upcoming", "ongoing", "completed"] as const;
export const BUDGET_TIERS = ["budget", "mid-range", "luxury"] as const;

export const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-primary-soft text-accent-foreground",
  ongoing: "bg-water-soft text-water",
  completed: "bg-adventure-soft text-adventure",
};

export const myTripsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-trips", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TripRow[];
    },
  });

export const collaboratorsQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["collaborators", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_collaborators")
        .select("*")
        .eq("trip_id", tripId!)
        .order("invited_at");
      if (error) throw error;
      return (data ?? []) as unknown as Collaborator[];
    },
  });

export type NewTripInput = {
  userId: string;
  destinationId: string;
  title: string;
  startDate: string;
  endDate: string;
  travellers: number;
  budgetAmount: number;
  budgetTier: string;
  status: string;
};

const dayCount = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
};

/** Creates a trip owned by the signed-in traveller and returns its id. */
export async function createTrip(input: NewTripInput) {
  const catalog = findDestination(input.destinationId) ?? destinations[0]!;
  const days = dayCount(input.startDate, input.endDate);

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: input.userId,
      title: input.title,
      destination: catalog.name,
      region: catalog.categories[0] ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      days,
      travelers: input.travellers,
      travellers: input.travellers,
      travelers_label: `${input.travellers} Traveller${input.travellers > 1 ? "s" : ""}`,
      budget: input.budgetAmount,
      budget_amount: input.budgetAmount,
      spent: 0,
      spent_amount: 0,
      budget_tier: input.budgetTier,
      status: input.status,
      weather: catalog.bestTime,
    } as never)
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

/** Catalog destination id for a trip, so planner links stay in sync. */
export const catalogIdFor = (destinationName: string) =>
  destinations.find((d) => d.name.toLowerCase() === destinationName.toLowerCase())?.id;

export const tripDates = (t: { start_date: string; end_date: string }) => {
  const f = (s: string) =>
    new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${f(t.start_date)} – ${f(t.end_date)}`;
};
