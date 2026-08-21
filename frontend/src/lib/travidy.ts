import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import rishikesh from "@/assets/rishikesh.jpg";
import goa from "@/assets/goa.jpg";
import jaipur from "@/assets/jaipur.jpg";
import hostel from "@/assets/hostel.jpg";
import rafting from "@/assets/rafting.jpg";
import temple from "@/assets/temple.jpg";
import cafe from "@/assets/cafe.jpg";
import ramjhula from "@/assets/ramjhula.jpg";
import manali from "@/assets/manali.jpg";
import kerala from "@/assets/kerala.jpg";
import ranchi from "@/assets/ranchi.jpg";

export const images: Record<string, string> = {
  rishikesh,
  goa,
  jaipur,
  hostel,
  rafting,
  temple,
  cafe,
  ramjhula,
  manali,
  kerala,
  ranchi,
};

export function img(key: string | null | undefined) {
  return (key && images[key]) || rishikesh;
}

export type Trip = {
  id: string;
  title: string;
  destination: string;
  region: string | null;
  start_date: string;
  end_date: string;
  days: number;
  travelers: number;
  travelers_label: string | null;
  budget: number;
  spent: number;
  budget_tier: string | null;
  status: string;
  share_token: string;
  user_id: string | null;
  weather: string | null;
};

export type Recommendation = {
  id: string;
  name: string;
  category: string;
  subtitle: string | null;
  price_label: string | null;
  rating: number | null;
  reviews: number | null;
  duration: string | null;
  image_key: string | null;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  day: number;
  time_label: string | null;
  title: string | null;
  place: string | null;
  category: string | null;
  price_label: string | null;
  duration: string | null;
  status: string | null;
  image_key: string | null;
  order_index: number | null;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  position: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  created_at: string;
};

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return (data ?? []) as T;
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

// ---------------------------------------------------------------------------
// Trip — anonymous-first. Takes an explicit tripId (stored client-side,
// e.g. localStorage) instead of requiring a signed-in session. Works for
// guests and signed-in users alike; RLS on `trips` allows read/write when
// user_id is null (unclaimed) or matches auth.uid() (claimed/owned).
// Destinations join kept so `destination`/`region` are populated correctly.
// ---------------------------------------------------------------------------

export const tripQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["trip", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      if (!tripId) return null;

      const { data, error } = await supabase
        .from("trips")
        .select("*, destinations(name, state)")
        .eq("id", tripId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const destination = data.destinations as { name: string; state: string } | null;

      return {
        id: data.id,
        title: data.title ?? "Untitled Trip",
        destination: destination?.name ?? "Unknown destination",
        region: destination?.state ?? null,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.start_date && data.end_date ? daysBetween(data.start_date, data.end_date) : 1,
        travelers: data.travellers ?? 1,
        travelers_label: data.travellers ? `${data.travellers} ${data.travellers === 1 ? "Traveler" : "Travelers"}` : null,
        budget: data.budget_amount ?? 0,
        spent: data.spent_amount ?? 0,
        budget_tier: data.budget_tier ?? null,
        status: data.status,
        share_token: data.share_token,
        user_id: data.user_id,
        weather: null,
      } as Trip;
    },
  });

// Creates a new trip anonymously — no auth required. Returns the new trip's
// id so the caller can store it (e.g. localStorage) for subsequent access.
export async function createTrip(input: {
  title: string;
  destinationId: string;
  startDate: string;
  endDate: string;
  travellers?: number;
  budgetAmount?: number;
  budgetTier?: string;
}): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("trips")
    .insert({
      title: input.title,
      destination_id: input.destinationId,
      start_date: input.startDate,
      end_date: input.endDate,
      travellers: input.travellers ?? 1,
      budget_amount: input.budgetAmount ?? 0,
      budget_tier: input.budgetTier ?? null,
      user_id: userData?.user?.id ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

// Attaches an unclaimed (user_id null) trip to the now-signed-in user.
// Call this right after successful signup/login using whatever tripId was
// sitting in localStorage from anonymous use.
export async function claimTrip(tripId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return; // no-op if somehow not signed in

  await supabase
    .from("trips")
    .update({ user_id: userData.user.id })
    .eq("id", tripId)
    .is("user_id", null);
}

// ---------------------------------------------------------------------------
// Recommendations — NOT backed by any table (none exists — deliberate scope
// decision, no recommendation engine). Recommendation cards in the Planner
// come from the chat agent's live response, not a persisted query.
// ---------------------------------------------------------------------------

export const recommendationsQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["recommendations", tripId],
    enabled: !!tripId,
    queryFn: async () => [] as Recommendation[],
  });

// ---------------------------------------------------------------------------
// Itinerary — anonymous-first (optional tripId + enabled guard), using the
// REAL column names (day_number, order_index, place_name, item_status,
// start_time — not day/position/title, which don't exist on this table).
// ---------------------------------------------------------------------------

export const itineraryQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["itinerary", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      if (!tripId) return [] as ItineraryItem[];

      const rows = await unwrap(
        supabase
          .from("itinerary_items")
          .select("*")
          .eq("trip_id", tripId)
          .order("day_number", { ascending: true })
          .order("order_index", { ascending: true })
      );

      return (rows as any[]).map((r) => ({
        id: r.id,
        trip_id: r.trip_id,
        day: r.day_number ?? 1,
        time_label: formatTime(r.start_time),
        title: r.place_name ?? r.notes ?? "Untitled",
        place: r.place_name,
        category: r.category,
        price_label: r.price_label,
        duration: null,
        status: r.item_status ?? "planned",
        image_key: null,
        order_index: r.order_index ?? 0,
      })) as ItineraryItem[];
    },
  });

// ---------------------------------------------------------------------------
// Checklist — anonymous-first, order_index column name already correct.
// ---------------------------------------------------------------------------

export const checklistQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["checklist", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      if (!tripId) return [] as ChecklistItem[];

      const rows = await unwrap(
        supabase
          .from("checklist_items")
          .select("*")
          .eq("trip_id", tripId)
          .order("position", { ascending: true })
      );

      return (rows as any[]).map((r) => ({
        id: r.id,
        label: r.label,
        done: r.done ?? false,
        position: r.position ?? 0,
      })) as ChecklistItem[];
    },
  });

export async function toggleChecklistItem(id: string, done: boolean) {
  const { error } = await supabase.from("checklist_items").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function addChecklistItem(tripId: string, label: string, position: number) {
  return unwrap(
    supabase
      .from("checklist_items")
      .insert({
        trip_id: tripId,
        label,
        position,
        done: false,
      } as never)
  );
}

// ---------------------------------------------------------------------------
// Chat — anonymous-first, same pattern as trip/itinerary/checklist. Uses the
// real table (chat_history, not chat_messages). sendChatMessage no longer
// requires a signed-in session — user_id is included only if present, so
// signed-in users still get their identity attached for future personali-
// zation, but guests can chat freely tied to trip_id alone.
// ---------------------------------------------------------------------------

export const chatQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["chat", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      if (!tripId) return [] as ChatMessage[];

      const rows = await unwrap(
        supabase
          .from("chat_history")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: true })
      );

      return (rows as any[]).map((r) => ({
        id: r.id,
        role: r.role === "assistant" ? "ai" : "user",
        text: r.message,
        created_at: r.created_at,
      })) as ChatMessage[];
    },
  });

export async function sendChatMessage(
  tripId: string,
  question: string
): Promise<{ answer: string; sources: { type: string; label: string }[] }> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase.functions.invoke("chat", {
    body: {
      question,
      trip_id: tripId,
      user_id: userData?.user?.id ?? null,
    },
  });

  if (error) throw error;
  return data as { answer: string; sources: { type: string; label: string }[] };
}
// ---------------------------------------------------------------------------
// Guest-aware chat — works with a real trip_id OR just a destination name.
// Looks up the real database destination_id when no trip exists yet, since
// the frontend's destination catalog only has string keys (e.g. "rishikesh"),
// not the actual UUID the chat Edge Function needs.
// ---------------------------------------------------------------------------

export async function getDestinationIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  const { data, error } = await supabase
    .from("destinations")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function askTravidyAgent(params: {
  tripId?: string | null;
  destinationName?: string | null;
  question: string;
}): Promise<{ answer: string; sources: { type: string; label: string }[] }> {
  const { data: userData } = await supabase.auth.getUser();

  const body: Record<string, unknown> = {
    question: params.question,
    user_id: userData?.user?.id ?? null,
  };

  if (params.tripId) {
    body.trip_id = params.tripId;
  } else if (params.destinationName) {
    const destinationId = await getDestinationIdByName(params.destinationName);
    if (!destinationId) {
      return {
        answer:
          "I don't have destination data set up for this city yet — try Rishikesh for now, or ask something general.",
        sources: [],
      };
    }
    body.destination_id = destinationId;
  } else {
    throw new Error("askTravidyAgent requires either tripId or destinationName");
  }

  const { data, error } = await supabase.functions.invoke("chat", { body });
  if (error) throw error;
  return data as { answer: string; sources: { type: string; label: string }[] };
}
// ---------------------------------------------------------------------------
// Live suggestion cards — pulled from the real database instead of a tiny
// hardcoded list, so every ingested city works automatically with no extra
// per-city code. Prefers structured tables (hotels/activities, which have
// real pricing) and falls back to pois for everything else.
// ---------------------------------------------------------------------------

export type PoiSuggestion = {
  name: string;
  category: string;
  subtitle: string;
  price_label: string;
  duration: string;
  rating: number;
  reviews: number;
};

const HOTEL_CATEGORIES = ["hotel", "hostel", "resort"];
const RESTAURANT_CATEGORIES = ["restaurant", "food_cafe"];
const ACTIVITY_CATEGORIES = ["adventure", "water_body", "road_trip", "activity"];
const ATTRACTION_CATEGORIES = [
    "temple",
  "spiritual",
  "hidden_gem",
  "nature",
  "mountain",
  "mountains",
  "beach",
  "beaches",
  "hill_viewpoint",
  "culture_heritage",
  "shopping",
  "waterfall",
  "attraction",
  "area",
  "wellness_retreat",
];

export async function fetchSuggestions(
  destinationId: string | null,
  intent: "hotel" | "restaurant" | "activity" | "attraction",
  poiCategories?: string[]
): Promise<PoiSuggestion[]> {
  if (!destinationId) return [];

  const results: PoiSuggestion[] = [];

  if (intent === "hotel") {
    const { data, error } = await supabase
      .from("hotels")
      .select("name, location_zone, price_min, price_max, star_rating")
      .eq("destination_id", destinationId)
      .limit(4);

      if (error) {
    console.error("HOTEL FETCH ERROR:", error);
    throw error;
  }
    (data ?? []).forEach((h: any) => {
      results.push({
        name: h.name,
        category: "hotel",
        subtitle: h.location_zone ?? "",
        price_label: h.price_min ? `₹${h.price_min} - ₹${h.price_max}` : "Price varies",
        duration: "",
        rating: Number(h.star_rating ?? 4.3),
        reviews: 0,
      });
    });
  }

  if (intent === "activity") {
    const { data } = await supabase
      .from("activities")
      .select("name, price_min, price_max, rules")
      .eq("destination_id", destinationId)
      .limit(4);
    (data ?? []).forEach((a: any) => {
      results.push({
        name: a.name,
        category: "activity",
        subtitle: a.rules ?? "",
        price_label: a.price_min ? `₹${a.price_min} - ₹${a.price_max}` : "Price varies",
        duration: "",
        rating: 4.4,
        reviews: 0,
      });
    });
  }

  const categoryMap = {
    hotel: HOTEL_CATEGORIES,
    restaurant: RESTAURANT_CATEGORIES,
    activity: ACTIVITY_CATEGORIES,
    attraction: ATTRACTION_CATEGORIES,
  };

  if (results.length < 4) {
    const { data } = await supabase
      .from("pois")
      .select("name, category, description")
      .eq("destination_id", destinationId)
      .in("category", poiCategories ?? categoryMap[intent])
      .limit(6 - results.length);

    (data ?? []).forEach((p: any) => {
      if (results.some((r) => r.name === p.name)) return;
      results.push({
        name: p.name,
        category: intent,
        subtitle: (p.description ?? "").slice(0, 60),
        price_label: "Price varies",
        duration: "",
        rating: 4.3,
        reviews: 0,
      });
    });
  }

  return results.slice(0, 6);
}
// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const priceValue = (label: string | null | undefined) => {
  if (!label) return 0;
  const match = label.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Math.round(Number(match[0])) : 0;
};

export const dayLabel = (start: string, day: number) => {
  const d = new Date(start);
  d.setDate(d.getDate() + (day - 1));
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric", weekday: "short" });
};

export const dateRange = (start: string, end: string) => {
  const f = (s: string) =>
    new Date(s).toLocaleDateString("en-GB", { month: "long", day: "numeric" });
  return `${f(start)} – ${f(end)}`;
};