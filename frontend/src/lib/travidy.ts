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

export const TRIP_ID = "11111111-1111-1111-1111-111111111111";
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
  travellers: number;
  travelers_label: string | null;
  budget: number;
  spent: number;
  budget_amount: number;
  spent_amount: number;
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
  order_index: number;
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

export const tripQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["trip", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      if (!tripId) return null;

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .maybeSingle();

      if (error) throw error;

      return data as unknown as Trip | null;
    },
  });

export const recommendationsQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["recommendations", tripId],
    queryFn: () =>
      unwrap<Recommendation[]>(
        supabase
          .from("recommendations")
          .select("*")
          .eq("trip_id", tripId)
          .order("position") as never,
      ),
  });

export const itineraryQuery = (tripId: string | undefined) =>
  queryOptions({
    queryKey: ["itinerary", tripId],
    enabled: !!tripId,
    queryFn: () =>
      unwrap<ItineraryItem[]>(
        supabase
          .from("itinerary_items")
           .select(`
            id,
            trip_id,
            day,
            time_label:start_time,
            title:place_name,
            place:place_name,
            category,
            price_label,
            status:item_status,
            position:order_index
          `)
          .eq("trip_id", tripId!)
          .order("day", { ascending: true })
          .order("order_index", { ascending: true }) as never,
      ),
  });

export const checklistQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["checklist", tripId],
    queryFn: () =>
      unwrap<ChecklistItem[]>(
        supabase
          .from("checklist_items")
          .select("*")
          .eq("trip_id", tripId)
          .order("order_index") as never,
      ),
  });

export const chatQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["chat", tripId],
    queryFn: () =>
      unwrap<ChatMessage[]>(
        supabase
          .from("chat_messages")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at") as never,
      ),
  });

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** Best-effort numeric value from a price label like "₹1,200 / night" or "Free". */
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
