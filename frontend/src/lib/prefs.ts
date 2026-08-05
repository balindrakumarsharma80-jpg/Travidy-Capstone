import { useCallback, useSyncExternalStore } from "react";

/** Tiny localStorage-backed store for traveller preferences (client only). */
export type NotificationSettings = {
  tripReminders: boolean;
  priceAlerts: boolean;
  chatUpdates: boolean;
  promoAlerts: boolean;
};

export type BudgetPref = "backpacker" | "mid" | "luxury";

export type Prefs = {
  saved: string[];
  notifications: NotificationSettings;
  budget: BudgetPref;
  language: string;
  currency: string;
};

const KEY = "travidy.prefs.v1";

const defaults: Prefs = {
  saved: [],
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
const listeners = new Set<() => void>();

function read(): Prefs {
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

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = read();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return defaults;
}

export function setPrefs(update: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)) {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }
  emit();
}

export function usePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleSaved = useCallback((id: string) => {
    setPrefs((p) => ({
      saved: p.saved.includes(id) ? p.saved.filter((s) => s !== id) : [...p.saved, id],
    }));
  }, []);

  const toggleNotification = useCallback((key: keyof NotificationSettings) => {
    setPrefs((p) => ({ notifications: { ...p.notifications, [key]: !p.notifications[key] } }));
  }, []);

  return { prefs, setPrefs, toggleSaved, toggleNotification };
}
