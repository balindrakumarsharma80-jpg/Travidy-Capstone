import { useCallback, useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";

/** Traveller preferences — backed by the account when signed in, localStorage otherwise. */
export type NotificationSettings = {
  tripReminders: boolean;
  priceAlerts: boolean;
  chatUpdates: boolean;
  promoAlerts: boolean;
};

export type BudgetPref = "backpacker" | "mid" | "luxury";

export type Prefs = {
  saved: string[];
  fullName: string;
  homeCity: string;
  travelStyle: string;
  notifications: NotificationSettings;
  budget: BudgetPref;
  language: string;
  currency: string;
};

const KEY = "travidy.prefs.v1";

const defaults: Prefs = {
  saved: [],
  fullName: "",
  homeCity: "",
  travelStyle: "Balanced",
  notifications: {
    tripReminders: true,
    priceAlerts: true,
    chatUpdates: false,
    promoAlerts: false,
  },
  budget: "mid",
  language: "English (Default)",
  currency: "INR (₹)",
};

let state: Prefs = defaults;
let hydrated = false;
let userId: string | null = null;
const listeners = new Set<() => void>();

function readLocal(): Prefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...defaults,
      ...parsed,
      notifications: { ...defaults.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return defaults;
  }
}

function writeLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = readLocal();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => defaults;

async function pushPreferences() {
  if (!userId) return;
  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      trip_reminders: state.notifications.tripReminders,
      price_alerts: state.notifications.priceAlerts,
      chat_updates: state.notifications.chatUpdates,
      promo_alerts: state.notifications.promoAlerts,
      budget: state.budget,
      language: state.language,
      currency: state.currency,
    },
    { onConflict: "user_id" },
  );

  // The profile row is the canonical home for traveller preferences.
  await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: state.fullName || null,
      home_city: state.homeCity || null,
      travel_style: state.travelStyle,
      budget_style: state.budget,
      preferred_language: state.language,
      preferred_currency: state.currency,
      notifications_enabled: Object.values(state.notifications).some(Boolean),
    } as never,
    { onConflict: "id" },
  );
}

export function setPrefs(update: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  emit();
  if (userId) void pushPreferences();
  else writeLocal();
}

/** Called by the auth hook whenever the signed-in user changes. */
export async function setPrefsUser(nextUserId: string | null) {
  if (nextUserId === userId) return;
  userId = nextUserId;

  if (!nextUserId) {
    state = readLocal();
    emit();
    return;
  }

  const [prefRes, savedRes, profileRes] = await Promise.all([
    supabase.from("user_preferences").select("*").eq("user_id", nextUserId).maybeSingle(),
    supabase.from("saved_destinations").select("destination_id").eq("user_id", nextUserId),
    supabase
      .from("profiles")
      .select(
        "full_name, home_city, travel_style, budget_style, preferred_language, preferred_currency",
      )
      .eq("id", nextUserId)
      .maybeSingle(),
  ]);
  const profileRow = profileRes.data as {
    full_name: string | null;
    home_city: string | null;
    travel_style: string | null;
    budget_style: string | null;
    preferred_language: string | null;
    preferred_currency: string | null;
  } | null;

  const row = prefRes.data;
  const savedRemote = (savedRes.data ?? []).map((r) => r.destination_id);
  const localSaved = state.saved;

  state = {
    saved: Array.from(new Set([...savedRemote, ...localSaved])),
    notifications: row
      ? {
          tripReminders: row.trip_reminders,
          priceAlerts: row.price_alerts,
          chatUpdates: row.chat_updates,
          promoAlerts: row.promo_alerts,
        }
      : state.notifications,
    fullName: profileRow?.full_name ?? state.fullName,
    homeCity: profileRow?.home_city ?? state.homeCity,
    travelStyle: profileRow?.travel_style ?? state.travelStyle,
    budget: ((profileRow?.budget_style ?? row?.budget) as BudgetPref) ?? state.budget,
    language: profileRow?.preferred_language ?? row?.language ?? state.language,
    currency: profileRow?.preferred_currency ?? row?.currency ?? state.currency,
  };
  emit();

  // Migrate anything saved before sign-in, then make sure a prefs row exists.
  const toUpload = localSaved.filter((id) => !savedRemote.includes(id));
  if (toUpload.length) {
    await supabase.from("saved_destinations").upsert(
      toUpload.map((destination_id) => ({ user_id: nextUserId, destination_id })),
      { onConflict: "user_id,destination_id" },
    );
  }
  if (!row || !profileRow) await pushPreferences();
}

async function pushSaved(id: string, saved: boolean) {
  if (!userId) return;
  if (saved) {
    await supabase
      .from("saved_destinations")
      .upsert({ user_id: userId, destination_id: id }, { onConflict: "user_id,destination_id" });
  } else {
    await supabase
      .from("saved_destinations")
      .delete()
      .eq("user_id", userId)
      .eq("destination_id", id);
  }
}

export function usePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleSaved = useCallback((id: string) => {
    const willSave = !state.saved.includes(id);
    state = {
      ...state,
      saved: willSave ? [...state.saved, id] : state.saved.filter((s) => s !== id),
    };
    emit();
    if (userId) void pushSaved(id, willSave);
    else writeLocal();
  }, []);

  const toggleNotification = useCallback((key: keyof NotificationSettings) => {
    setPrefs((p) => ({ notifications: { ...p.notifications, [key]: !p.notifications[key] } }));
  }, []);

  return { prefs, setPrefs, toggleSaved, toggleNotification };
}
