import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { setPrefsUser } from "@/lib/prefs";

let cachedSession: Session | null = null;
let initialised = false;
const listeners = new Set<(s: Session | null) => void>();

function emit(session: Session | null) {
  cachedSession = session;
  setPrefsUser(session?.user.id ?? null);
  listeners.forEach((l) => l(session));
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  supabase.auth.onAuthStateChange((_event, session) => emit(session));
  void supabase.auth.getSession().then(({ data }) => emit(data.session));
}

/** Current Supabase session, shared across components. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(!initialised);

  useEffect(() => {
    init();
    setSession(cachedSession);
    setLoading(false);
    const listener = (s: Session | null) => setSession(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, loading, isAuthenticated: !!user };
}
