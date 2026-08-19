import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({
  token: z.string().min(8).max(80),
});

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
  checklist: {
    id: string;
    label: string;
    done: boolean;
  }[];
};

const daysBetween = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) / 86_400_000
    ) + 1
  );
};

/** Read-only public view of a trip, resolved by its share token. */
export const getSharedTrip = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<SharedTrip | null> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select(`
        id,
        title,
        start_date,
        end_date,
        travellers,
        status,
        share_token,
        destinations (
          name,
          state
        )
      `)
      .eq("share_token", data.token)
      .maybeSingle();

    if (tripError) {
      console.error("GET SHARED TRIP ERROR:", tripError);
      throw tripError;
    }

    if (!trip) return null;

    const destination = trip.destinations as
      | { name: string; state: string }
      | null;

    const [{ data: items, error: itemsError }, { data: checklist, error: checklistError }] =
      await Promise.all([
       supabaseAdmin
  .from("itinerary_items")
  .select(
    "id, day, start_time, place_name, category, price_label, notes, order_index"
  )
  .eq("trip_id", trip.id)
  .order("day")
  .order("order_index"),

        supabaseAdmin
          .from("checklist_items")
          .select("id, label, done")
          .eq("trip_id", trip.id)
          .order("order_index"),
      ]);

    if (itemsError) {
      console.error("GET SHARED ITINERARY ERROR:", itemsError);
      throw itemsError;
    }

    if (checklistError) {
      console.error("GET SHARED CHECKLIST ERROR:", checklistError);
      throw checklistError;
    }

    return {
  title: trip.title,
  destination: destination?.name ?? "Unknown destination",
  startDate: trip.start_date,
  endDate: trip.end_date,
  days: daysBetween(trip.start_date, trip.end_date),
  travellers: trip.travellers ?? 1,
  status: trip.status ?? "upcoming",

  items: (items ?? []).map((item) => ({
    id: item.id,
    day: item.day ?? 1,
    time_label: item.start_time
      ? String(item.start_time).slice(0, 5)
      : "",
    title: item.place_name ?? "Planned activity",
    place: item.place_name ?? null,
    category: item.category ?? null,
    duration: null,
  })),

  checklist: checklist ?? [],
};
  });