import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin";

type RoleRow = { role: string };

const ROLE_RETRY_DELAYS = [0, 250, 750];

export async function getCurrentAdminAccess() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { user: null, role: null as AdminRole | null, isAdmin: false, error: userError ?? null };
  }

  let lastError: Error | null = null;
  for (const delay of ROLE_RETRY_DELAYS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    if (!error) {
      const isAdmin = (roles as RoleRow[] | null ?? []).some((row) => row.role === "super_admin");
      return {
        user: userData.user,
        role: isAdmin ? ("super_admin" as AdminRole) : null,
        isAdmin,
        error: null,
      };
    }
    lastError = error;
  }

  return { user: userData.user, role: null as AdminRole | null, isAdmin: false, error: lastError };
}