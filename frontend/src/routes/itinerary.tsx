import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
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
import { uploadJournalMedia } from "@/lib/journal";
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
  validateSearch: (search: Record<string, unknown>): { trip?: string; share?: string } =>
    ({
      ...(typeof search['trip'] === 'string' ? { trip: search['trip'] as string } : {}),
      ...(typeof search['share'] === 'string' ? { share: search['share'] as string } : {}),
    }),

  loaderDeps: ({ search }) => ({ trip: search.trip }),
loader: ({ context, deps }) => {
  const id = deps.trip;

  if (!id) return;

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { trip: tripParam, share } = Route.useSearch();
  

const storedTripId =
  typeof window !== "undefined"
    ? localStorage.getItem("travidy_trip_id")
    : null;

const tripId = tripParam ?? storedTripId ?? undefined;

console.log("ITINERARY TRIP DEBUG:", {
  tripParam,
  storedTripId,
  tripId,
  localStorageTripId:
    typeof window !== "undefined"
      ? localStorage.getItem("travidy_trip_id")
      : null,
});
  
const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isGuest = !isAuthenticated || !tripId;
  
  console.log("ITINERARY SHARE DEBUG:", {
  tripParam,
  tripId,
  share,
  isAuthenticated,
});
  const { data: trip } = useQuery({
  ...tripQuery(tripId),
  enabled: !!tripId,
});
 const { data: dbItems = [] } = useQuery({
  ...itineraryQuery(tripId),
  enabled: !!tripId,
});
  const { data: checklist = [] } = useQuery({
  ...checklistQuery(tripId),
  enabled: !!tripId,
});
 const { data: collaborators = [] } = useQuery({
  ...collaboratorsQuery(tripId),
  enabled: !!tripId,
});
const [guestItems, setGuestItems] = useState<any[]>([]);
useEffect(() => {
  if (!isGuest || typeof window === "undefined") return;

  try {
    const saved = window.localStorage.getItem("travidy_guest_itinerary");

    if (saved) {
      setGuestItems(JSON.parse(saved));
    }
  } catch {
    setGuestItems([]);
  }
}, [isGuest]);

const displayItems = isGuest
  ? guestItems.map((item) => ({
      ...item,
      day: Number(item.day_number ?? 1),
      title: item.name,
      place: item.name,
      category: item.category ?? "activity",
      price_label: item.price_label ?? null,
      duration: item.duration ?? null,
      status: item.status ?? "planned",
      time_label: null,
      order_index: item.order_index ?? 99,
    }))
  : dbItems;

  const calculatedBudget = displayItems.reduce((total, item) => {
  const price = String(item.price_label ?? "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);

  return total + (price ? Number(price[0]) : 0);
}, 0);

const currentTrip = trip ?? {
  title: "My Trip",
  days: Math.max(
  1,
  ...guestItems.map((item) => Number(item.day_number ?? 1))
),
  travelers: 1,
  budget:
  typeof window !== "undefined"
    ? Number(window.localStorage.getItem("travidy_guest_budget") ?? 0)
    : 0,
  budget_amount:
  typeof window !== "undefined"
    ? Number(window.localStorage.getItem("travidy_guest_budget") ?? 0)
    : 0,
  spent: 0,
  spent_amount: 0,
  destination: "Your Trip",
  region: "",
  weather: "",
  start_date: null,
  end_date: null,
  travelers_label: "",
  share_token: null,
};
console.log("SHARE DEBUG:", {
  tripId,
  trip,
  currentTripShareToken: currentTrip.share_token,
});

const tripBudget =
  Number(currentTrip.budget_amount) > 0
    ? Number(currentTrip.budget_amount)
    : Number(currentTrip.budget ?? 0);

    const createGuestTripForSharing = async () => {
  try {
    const savedItems = JSON.parse(
      localStorage.getItem("travidy_guest_itinerary") ?? "[]"
    );

    const savedBudget = Number(
      localStorage.getItem("travidy_guest_budget") ?? 0
    );

    if (!savedItems.length) {
      toast.error("Add at least one item to your itinerary before sharing.");
      return null;
    }

    const destinationDbId =
      currentTrip.destination?.toLowerCase() === "rishikesh"
        ? "2f634884-ba98-4c6b-9b1f-0a485172c9c3"
        : null;

    if (!destinationDbId) {
      toast.error(
        `No database destination found for "${currentTrip.destination}".`
      );
      return null;
    }

    const shareToken = crypto.randomUUID();

    const { data: newTrip, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: user?.id ?? null,
        destination_id: destinationDbId,
        title: currentTrip.title || `${currentTrip.destination} Trip`,
        start_date: currentTrip.start_date,
        end_date: currentTrip.end_date,
        travellers: Math.max(
          1,
          Number(currentTrip.travelers ?? currentTrip.travellers ?? 1)
        ),
        budget_amount: savedBudget,
        spent_amount: 0,
        status: "draft",
        share_token: shareToken,
      } as never)
      .select("id, share_token")
      .single();

    if (tripError || !newTrip) {
      console.error("CREATE SHARE TRIP ERROR:", tripError);
      toast.error(tripError?.message ?? "Could not create shareable trip.");
      return null;
    }

    const itemsToInsert = savedItems.map(
      (item: any, index: number) => ({
        trip_id: newTrip.id,
        day_number: Number(item.day_number ?? 1),
        place_name: item.name,
        notes: item.subtitle ?? null,
        category: item.category ?? "activity",
        price_label: item.price_label ?? null,
        item_status: "planned",
        source: "agent",
        order_index: index,
      })
    );

    const { error: itemsError } = await supabase
      .from("itinerary_items")
      .insert(itemsToInsert as never);

    if (itemsError) {
      console.error("CREATE SHARE ITEMS ERROR:", itemsError);

      await supabase
        .from("trips")
        .delete()
        .eq("id", newTrip.id);

      toast.error(itemsError.message ?? "Could not save itinerary items.");
      return null;
    }

    localStorage.setItem("travidy_trip_id", newTrip.id);

    localStorage.removeItem("travidy_guest_itinerary");
    localStorage.removeItem("travidy_guest_budget");

    return {
      tripId: newTrip.id as string,
      shareToken: newTrip.share_token as string,
    };
  } catch (error) {
    console.error("CREATE GUEST SHARE TRIP FAILED:", error);
    toast.error("Could not prepare your trip for sharing.");
    return null;
  }
};


  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
  if (
    !isAuthenticated ||
    authLoading ||
    tripId ||
    share !== "true"
  ) {
    return;
  }

  async function createTripFromGuestData() {
    try {
      const savedItems = localStorage.getItem("travidy_guest_itinerary");
      const savedBudget = localStorage.getItem("travidy_guest_budget");

      if (!savedItems) {
        toast.error("No guest trip data found.");
        return;
      }

      const guestItems = JSON.parse(savedItems);

      if (!Array.isArray(guestItems) || guestItems.length === 0) {
        toast.error("No guest itinerary found.");
        return;
      }

      /*
       * Your current guest itinerary is Rishikesh.
       * Use the same destination ID that planner.tsx already uses.
       */
      const destinationId =
        "2f634884-ba98-4c6b-9b1f-0a485172c9c3";

      const shareToken = crypto.randomUUID();

      const { data: newTrip, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user?.id,
          destination_id: destinationId,
          title: "My Trip",
          travellers: 1,
          budget_amount: Number(savedBudget ?? 0),
          spent_amount: 0,
          status: "draft",
          share_token: shareToken,
        } as never)
        .select("id")
        .single();

      if (tripError) {
        console.error("CREATE GUEST TRIP ERROR:", tripError);
        throw tripError;
      }

      const itemsToInsert = guestItems.map((item: any, index: number) => ({
        trip_id: newTrip.id,
        day_number: Number(item.day_number ?? 1),
        place_name: item.name,
        notes: item.subtitle ?? null,
        category: item.category ?? "activity",
        price_label: item.price_label ?? null,
        item_status: item.status ?? "planned",
        source: "agent",
        order_index: item.order_index ?? index,
      }));

      const { error: itemsError } = await supabase
        .from("itinerary_items")
        .insert(itemsToInsert as never);

      if (itemsError) {
        console.error("CREATE GUEST ITINERARY ERROR:", itemsError);
        throw itemsError;
      }

      // Save the real trip ID for future use.
      localStorage.setItem("travidy_trip_id", newTrip.id);

      // Guest data is now persisted in Supabase.
      localStorage.removeItem("travidy_guest_itinerary");
      localStorage.removeItem("travidy_guest_budget");
      sessionStorage.removeItem("travidy_pending_share");

      toast.success("Your trip is now saved!");

      navigate({
        to: "/itinerary",
        search: {
          trip: newTrip.id,
          share: "true",
        },
        replace: true,
      });
    } catch (error) {
      console.error("GUEST SHARE MIGRATION ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't save your trip."
      );
    }
  }

  void createTripFromGuestData();
}, [
  isAuthenticated,
  authLoading,
  tripId,
  share,
  user?.id,
  navigate,
]);

  const [day, setDay] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTitle, setJournalTitle] = useState("");
const [journalBody, setJournalBody] = useState("");
const [journalFiles, setJournalFiles] = useState<File[]>([]);
const journalFileInput = useRef<HTMLInputElement>(null);
const [journalSaving, setJournalSaving] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);
  const [details, setDetails] = useState({
  title: currentTrip.title,
  days: currentTrip.days,
  travelers: currentTrip.travellers ?? currentTrip.travelers ?? 1,
  budget:
  Number(currentTrip.budget_amount) > 0
    ? Number(currentTrip.budget_amount)
    : Number(currentTrip.budget ?? 0),
  start_date: currentTrip.start_date ?? "",
  end_date: currentTrip.end_date ?? "",
});

const saveJournalEntry = async () => {
  if (!user) {
    toast.error("Please sign in to save a journal entry.");
    return;
  }

  if (!tripId) {
    toast.error("No trip is selected.");
    return;
  }

  if (
    !journalTitle.trim() &&
    !journalBody.trim() &&
    journalFiles.length === 0
  ) {
    toast.error("Add some text, a photo, or a video first.");
    return;
  }

  try {
    setJournalSaving(true);

    const paths: string[] = [];

    for (const file of journalFiles) {
      paths.push(
        await uploadJournalMedia(
          user.id,
          tripId,
          file,
          file.name
        )
      );
    }

    const { error } = await supabase
      .from("trip_posts")
      .insert({
        user_id: user.id,
        trip_id: tripId,
        title: journalTitle.trim() || null,
        body: journalBody.trim() || null,
        media_urls: paths,
        status: "active",
      } as never);

    if (error) throw error;

    setJournalTitle("");
    setJournalBody("");
    setJournalFiles([]);
    setJournalOpen(false);

    toast.success("Saved to your private journal");
  } catch (error) {
    console.error("SAVE JOURNAL ERROR:", error);
    toast.error("Couldn't save that entry. Please try again.");
  } finally {
    setJournalSaving(false);
  }
};

  const dayItems = displayItems.filter((i) => i.day === day);
  const shown = expanded ? dayItems : dayItems.slice(0, 5);
  const doneCount = displayItems.filter((i) => i.status === "done").length;
  const progress = displayItems.length
  ? Math.round((doneCount / displayItems.length) * 100)
  : 0;
  const checkedCount = checklist.filter((c) => c.done).length;
  const suggestedTasks = suggestChecklist(
  displayItems,
  checklist.map((c) => c.label),
);

  const invalidate = (key: string) => queryClient.invalidateQueries({ queryKey: [key, tripId] });

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
      if (!tripId) throw new Error("Trip ID is missing");
      const { error } = await supabase.from("checklist_items").insert({
  trip_id: tripId,
  label,
  done: false,
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
    onError: (error) => {
  console.error("ADD CHECKLIST ERROR:", error);
  toast.error("Couldn't add that task.");
},
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      if (!tripId) throw new Error("Trip ID is missing");
      const { error } = await supabase.from("checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("checklist"),
    onError: () => toast.error("Couldn't remove that task."),
  });

  const setStatus = useMutation({
  mutationFn: async ({ id, status }: { id: string; status: string }) => {
    if (isGuest) {
      const updated = guestItems.map((item) =>
        item.id === id ? { ...item, status } : item
      );

      setGuestItems(updated);
      window.localStorage.setItem(
        "travidy_guest_itinerary",
        JSON.stringify(updated)
      );

      return;
    }

    const { error } = await supabase
      .from("itinerary_items")
      .update({ item_status: status } as never)
      .eq("id", id);

    if (error) throw error;
  },

  onSuccess: (_d, v) => {
    if (!isGuest) {
      invalidate("itinerary");
    }

    toast.success(
      v.status === "done"
        ? "Nice! Marked as done."
        : "Moved back to planned."
    );
  },

  onError: (error) => {
  console.error("UPDATE ACTIVITY ERROR:", error);
  toast.error(
    error instanceof Error
      ? error.message
      : "Couldn't update that activity."
  );
},
});

    const removeItem = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        const updated = guestItems.filter((item) => item.id !== id);

        setGuestItems(updated);
        window.localStorage.setItem(
          "travidy_guest_itinerary",
          JSON.stringify(updated)
        );

        return;
      }

      const { error } = await supabase
        .from("itinerary_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: (_data, deletedId) => {
      // Remove the activity from the screen immediately.
      queryClient.setQueryData(
        itineraryQuery(tripId).queryKey,
        (old: ItineraryItem[] | undefined) =>
          old?.filter((item) => item.id !== deletedId) ?? []
      );

      toast.success("Removed from your plan");

      // Refresh from Supabase in the background.
      if (!isGuest) {
        queryClient.invalidateQueries({
          queryKey: itineraryQuery(tripId).queryKey,
        });
      }
    },

    onError: (error) => {
      console.error("REMOVE ACTIVITY ERROR:", error);
      toast.error("Couldn't remove that activity.");
    },
  });
 const clearPlan = useMutation({
  mutationFn: async () => {
    if (isGuest) {
      setGuestItems([]);
      window.localStorage.removeItem("travidy_guest_itinerary");
      return;
    }

    const { error } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("trip_id", tripId);

    if (error) throw error;
  },

  onSuccess: () => {
    if (!isGuest) {
      invalidate("itinerary");
    }

    toast.success("Plan cleared — start fresh whenever you like.");
  },

  onError: () => toast.error("Couldn't clear the plan."),
});
  const resetChecklist = useMutation({
    mutationFn: async () => {
      if (isGuest || !tripId) return;
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
        travellers: Math.max(1, details.travelers),
        budget_amount: Math.max(0, details.budget),
      } as never)
      .eq("id", tripId);

    if (error) throw error;
  },

  onSuccess: () => {
    invalidate("trip");
    setEditOpen(false);
    toast.success("Trip details updated");
  },

  onError: (error) => {
    console.error("UPDATE TRIP ERROR:", error);
    toast.error("Couldn't save your trip details.");
  },
});

  // Spend is derived from what you have actually planned — nothing is assumed.
  const buckets = new Map<string, number>();
  for (const i of displayItems) {
    const bucket = catStyle[i.category ?? ""]?.bucket ?? "Other";
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + priceValue(i.price_label));
  }
  const budget = [...buckets.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => ({ label, amount, tone: bucketTone[label] ?? "bg-primary" }));
  const estimatedCost = budget.reduce((s, b) => s + b.amount, 0);

  // Keep the persisted spend in step with what is actually planned.
  useEffect(() => {
     if (isGuest || !tripId) return;
     if (
    (currentTrip.spent_amount ?? currentTrip.spent) === estimatedCost
  ) {
    return;
  }
    void supabase
  .from("trips")
  .update({
    spent: estimatedCost,
    spent_amount: estimatedCost,
  } as never).eq("id", tripId);
}, [isGuest, estimatedCost, currentTrip.spent_amount, currentTrip.spent, tripId]);
const shareToken = trip?.share_token ?? currentTrip.share_token ?? "";
 const shareUrl =
  typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : "";
    console.log("FINAL SHARE URL:", shareUrl);
  const inviteUrl =
  typeof window !== "undefined" && tripId
    ? `${window.location.origin}/trips/${tripId}/join`
    : "";
  const copy = async (url: string, label: string) => {
  if (!url) {
    toast.error(`No ${label.toLowerCase()} available`);
    return;
  }

  await navigator.clipboard.writeText(url);
  toast.success(`${label} copied`);
};

  const catalogDest = destinations.find(
    (d) => d.name.toLowerCase() === currentTrip.destination.toLowerCase(),
  );
  const planDest = catalogDest?.id;

  
  const shareTrip = async () => {
  if (!shareUrl) {
    toast.error("Read-only share link is not available yet.");
    return;
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: currentTrip.title,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Read-only trip link copied");
    }
  } catch {
    /* dismissed */
  }
};

const shareLink = async (url: string, label: string) => {
  if (!url) {
    toast.error(`${label} is not available yet.`);
    return;
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: currentTrip.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} copied`);
    }
  } catch (error) {
    if ((error as Error)?.name !== "AbortError") {
      console.error("SHARE LINK ERROR:", error);
      toast.error(`Couldn't share ${label.toLowerCase()}.`);
    }
  }
};

  const navigateTo = (item: ItineraryItem) => {
    const q = encodeURIComponent(`${item.title} ${item.place ?? currentTrip.destination}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };

  const downloadPdf = () => {
  const ok = exportItineraryPdf(currentTrip, displayItems, checklist);
  if (ok) toast.success("Choose Save as PDF");
};


  return (
    <PhoneShell>
      <header className="sticky top-0 z-20 flex items-start justify-between gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Link
  to="/planner"
  search={{ dest: planDest, trip: tripId, day }}
  className="flex items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
>
  <Plus className="size-3.5" /> Add Activity
</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg">{currentTrip.title}</h1>
        </div>
        <button
 onClick={async () => {
  if (!isAuthenticated) {
    navigate({
      to: "/auth",
      search: {
        share: "true",
      },
    });
    return;
  }

  setShareOpen(true);
}}
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
            alt={`${currentTrip.destination}${currentTrip.region ? `, ${currentTrip.region}` : ""}`}
            loading="lazy"
            width={1024}
            height={768}
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div>
              <h2 className="text-lg text-background">
                {currentTrip.destination}
                {currentTrip.region ? `, ${currentTrip.region}` : ""}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-background/90">
                <Sun className="size-4 text-adventure" /> {currentTrip.weather}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <dl className="flex flex-1 gap-3 rounded-xl bg-surface/95 p-3 text-[11px]">
                <Fact
                  icon={Calendar}
                  label={`${currentTrip.days} Days`}
                  sub=""
                />
                <Fact
                  icon={Users}
                  label={`${currentTrip.travelers} ${
    currentTrip.travelers === 1 ? "Traveler" : "Travelers"
  }`}
                />
                <Fact icon={Wallet} label={inr(tripBudget)} sub="Budget" />
              </dl>
            </div>
          </div>
          <div className="absolute top-3 right-3 w-32 rounded-xl bg-surface/95 p-3 text-center shadow-card">
            <p className="text-[11px] font-semibold">Trip Progress</p>
            <Ring value={progress} />
            <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <CheckSquare className="size-3" /> {doneCount} / {displayItems.length} done
            </p>
          </div>
        </section>

        <nav className="flex border-b border-border">
          {Array.from({ length: currentTrip.days }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 pb-3 text-center ${
                d === day ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="block text-sm font-bold tracking-wide">DAY {d}</span>
            </button>
          ))}
        </nav>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base">{day === 1 ? "Today's Itinerary" : `Day ${day} Plan`}</h2>
            <Link
              to="/planner"
              search={{ dest: planDest, trip: tripId , day}}
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
              const isDone = item.status === "done";
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
    isDone ? `Mark ${item.title} as planned` : `Mark ${item.title} as done`
  }
  disabled={setStatus.isPending}
  onClick={() =>
    setStatus.mutate({
      id: item.id,
      status: isDone ? "planned" : "done",
    })
  }
                     className={`mt-1 flex size-4 items-center justify-center rounded-full border-2 disabled:cursor-not-allowed disabled:opacity-60 ${
  isDone
    ? "border-primary bg-primary"
    : "border-muted-foreground/50"
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
  disabled={setStatus.isPending}
  onClick={() =>
    setStatus.mutate({
      id: item.id,
      status: isDone ? "planned" : "done",
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
    <span className="font-display text-2xl font-bold">
      {inr(estimatedCost)}
    </span>{" "}
    <span className="text-muted-foreground">
      estimated trip cost
    </span>
  </p>

  {estimatedCost === 0 ? (
    <p className="mt-2 text-xs text-muted-foreground">
      Nothing planned yet — costs appear here as you add activities.
    </p>
  ) : (
    <>
     <div className="mt-3">
 <div className="relative h-3 overflow-hidden rounded-full bg-muted">
  <div
    className={`h-full rounded-full transition-all ${
      estimatedCost > tripBudget
        ? "bg-destructive"
        : "bg-primary"
    }`}
    style={{
      width: `${Math.min(
        (estimatedCost / Math.max(tripBudget, 1)) * 100,
        100
      )}%`,
    }}
  />
</div>

</div>

      {showBudgetDetail && (
        <ul className="mt-3 space-y-2 text-sm">
          {budget.map((b) => (
            <li
              key={b.label}
              className="flex items-center gap-2"
            >
              <span
                className={`size-2.5 rounded-full ${b.tone}`}
              />

              <span className="flex-1 text-muted-foreground">
                {b.label}
              </span>

              <span className="font-semibold">
                {inr(b.amount)}
              </span>

              <span className="w-10 text-right text-xs text-muted-foreground">
                {Math.round(
                  (b.amount / Math.max(estimatedCost, 1)) * 100
                )}
                %
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )}

  {/* Budget comparison */}
  <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-base font-medium">
        
        Your budget
      </span>
      <span className="font-semibold">
        {inr(tripBudget)}
      </span>
    </div>

    <div className="flex items-center justify-between">
      <span  className="text-base font-medium">
        {estimatedCost > tripBudget
          ? "Over budget"
          : "Remaining budget"}
      </span>

      <span
        className={`font-display text-lg font-bold ${
          estimatedCost > tripBudget
            ? "text-destructive"
            : "text-primary"
        }`}
      >
        {inr(Math.abs(tripBudget - estimatedCost))}
      </span>
    </div>
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
  onClick={() => {
    if (!isAuthenticated) {
      navigate({
        to: "/auth",
        search: {
          share: "true",
        },
      });
      return;
    }

    setShareOpen(true);
  }}
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
        </Card>


        <Card className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Been there already?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Capture photos, video and voice notes in your private journal.
            </p>
          </div>
          <Button
  type="button"
  onClick={() => setJournalOpen(true)}
  className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold"
>
  Journal
</Button>
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

            <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="max-h-[85vh] max-w-[380px] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>New journal entry</DialogTitle>
            <DialogDescription>
              Capture your experience from this trip. Only you will see it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">

            <div className="space-y-1.5">
              <Label htmlFor="itinerary-journal-title">
                Title
              </Label>

              <Input
                id="itinerary-journal-title"
                placeholder="Give your experience a title"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="itinerary-journal-body">
                Your experience
              </Label>

              <textarea
                id="itinerary-journal-body"
                placeholder="Write about your experience..."
                value={journalBody}
                onChange={(e) => setJournalBody(e.target.value)}
                className="min-h-32 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Photos & videos</Label>

              <input
                ref={journalFileInput}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  setJournalFiles(
                    Array.from(e.target.files ?? [])
                  );
                }}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => journalFileInput.current?.click()}
              >
                Add photos or videos
              </Button>

              {journalFiles.length > 0 && (
                <div className="space-y-1">
                  {journalFiles.map((file) => (
                    <p
                      key={`${file.name}-${file.size}`}
                      className="truncate text-xs text-muted-foreground"
                    >
                      {file.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJournalOpen(false)}
                disabled={journalSaving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveJournalEntry}
                disabled={journalSaving}
              >
                {journalSaving ? "Saving..." : "Save Entry"}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Your existing checklist dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}></Dialog>
    
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
                <Input
  readOnly
  value={shareUrl}
  placeholder="Generating share link..."
  className="text-xs"
/>
                <div className="flex gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={() => copy(shareUrl, "Read-only link")}
  >
    Copy
  </Button>

  <Button
    type="button"
    onClick={() => shareLink(shareUrl, "Read-only link")}
  >
    <Share2 className="mr-1.5 size-4" />
    Share
  </Button>
</div>
              </div>
            </div>
            <div className="space-y-2">
  <Label>Invite someone to edit</Label>
  <p className="text-xs text-muted-foreground">
    Send this link to your travel companion. They can join the trip and edit the itinerary.
  </p>

  <div className="flex gap-2">
  <Input
    readOnly
    value={inviteUrl}
    placeholder="Generating invite link..."
  />

  <Button
    type="button"
    variant="outline"
    onClick={() => copy(inviteUrl, "Invite link")}
  >
    Copy
  </Button>

  <Button
    type="button"
    onClick={() => shareLink(inviteUrl, "Invite link")}
  >
    <Share2 className="mr-1.5 size-4" />
    Share
  </Button>
</div>
</div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Collaborators</p>
                  <p className="text-xs text-muted-foreground">
                    {collaborators.length === 0
                      ? "Nobody has joined yet."
                      : `${collaborators.length} person${collaborators.length > 1 ? "s" : ""} can edit this trip.`}
                  </p>
                </div>
              </div>

              {collaborators.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {collaborators.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-primary">
                          {c.user_id === user?.id ? "You" : "C"}
                        </div>
                        <span className="truncate text-xs font-medium">
                          {c.user_id === user?.id ? "You" : "Trip collaborator"}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-semibold capitalize text-primary">
                        {c.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
        
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
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Days</Label>
                <Input
                  type="number"
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
            <div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
    <Label htmlFor="it-start-date">Start Date</Label>
    <Input
      id="it-start-date"
      type="date"
      value={details.start_date}
      onChange={(e) =>
        setDetails((d) => ({ ...d, start_date: e.target.value }))
      }
    />
  </div>

  <div className="space-y-1.5">
    <Label htmlFor="it-end-date">End Date</Label>
    <Input
      id="it-end-date"
      type="date"
      value={details.end_date}
      onChange={(e) =>
        setDetails((d) => ({ ...d, end_date: e.target.value }))
      }
    />
  </div>
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




