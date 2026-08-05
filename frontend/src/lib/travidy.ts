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
  travelers_label: string | null;
  budget: number;
  spent: number;
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
  day: number;
  time_label: string;
  title: string;
  place: string | null;
  category: string | null;
  price_label: string | null;
  duration: string | null;
  status: string;
  image_key: string | null;
  position: number;
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

export const tripQuery = () =>
  queryOptions({
    queryKey: ["trip", TRIP_ID],
    queryFn: async () => {
      return {
        id: TRIP_ID,
        title: "Rishikesh Trip",
        destination: "Rishikesh",
        region: "Uttarakhand",
        start_date: "2026-08-10",
        end_date: "2026-08-12",
        days: 3,
        travelers: 2,
        travelers_label: "2 Adults",
        budget: 20000,
        spent: 0,
        weather: null,
      } as Trip;
    },
  });

export const recommendationsQuery = () =>
  queryOptions({
    queryKey: ["recommendations", TRIP_ID],
    queryFn: async () => [] as Recommendation[],
  });

export const itineraryQuery = () =>
  queryOptions({
    queryKey: ["itinerary", TRIP_ID],
    queryFn: async () => [] as ItineraryItem[],
  });

export const checklistQuery = () =>
  queryOptions({
    queryKey: ["checklist", TRIP_ID],
    queryFn: async () => [] as ChecklistItem[],
  });

export const chatQuery = () =>
  queryOptions({
    queryKey: ["chat", TRIP_ID],
    queryFn: async () => [] as ChatMessage[],
  });

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

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