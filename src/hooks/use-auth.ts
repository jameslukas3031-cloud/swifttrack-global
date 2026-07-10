import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "staff" | "user" | "customer";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function useUserRole(userId?: string) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (!userId) { setRole(null); setChecked(true); return; }
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data }) => {
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const best: AppRole | null =
        roles.includes("super_admin") ? "super_admin" :
        roles.includes("admin") ? "admin" :
        roles.includes("staff") ? "staff" :
        roles.includes("user") ? "user" :
        roles.includes("customer") ? "user" : null;
      setRole(best);
      setChecked(true);
    });
  }, [userId]);
  return { role, isSuperAdmin: role === "super_admin", isAdmin: role === "super_admin" || role === "admin", checked };
}

// Back-compat alias — now super_admin-only for admin console access
export function useIsAdmin(userId?: string) {
  const { isSuperAdmin, checked } = useUserRole(userId);
  return { isAdmin: isSuperAdmin, checked };
}
