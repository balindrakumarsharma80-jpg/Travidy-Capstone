import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(8).max(80) });

export type SharedTrip = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travellers: number;
  status: string;
  items: {
    id: string;
    day: number;
    time_label: string;
    title: string;
    place: string | null;
    category: string | null;
    duration: string | null;
  }[];
  checklist: { id: string; label: string; done: boolean }[];
};

/** Read-only public view of a trip, resolved by its share token. */
export const getSharedTrip = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<SharedTrip | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: trip } = await supabaseAdmin
      .from("trips")
      .select("id, title, destination, start_date, end_date, days, travellers, travelers, status")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!trip) return null;

    const [{ data: items }, { data: checklist }] = await Promise.all([
      supabaseAdmin
        .from("itinerary_items")
        .select("id, day, time_label, title, place, category, duration")
        .eq("trip_id", trip.id)
        .order("day")
        .order("position"),
      supabaseAdmin
        .from("checklist_items")
        .select("id, label, done")
        .eq("trip_id", trip.id)
        .order("order_index"),
    ]);

    return {
      title: trip.title,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      days: trip.days,
      travellers: trip.travellers ?? trip.travelers ?? 1,
      status: trip.status ?? "upcoming",
      items: items ?? [],
      checklist: checklist ?? [],
    };
  });
