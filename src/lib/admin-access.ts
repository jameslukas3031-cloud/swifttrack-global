import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin-access.functions";

export type AdminRole = "super_admin";

const ROLE_RETRY_DELAYS = [0, 250, 750];

export async function getCurrentAdminAccess() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { user: null, role: null as AdminRole | null, isAdmin: false, error: userError ?? null };
  }

  let lastError: Error | null = null;
  for (const delay of ROLE_RETRY_DELAYS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      const { isAdmin } = await getAdminAccess();
      return {
        user: userData.user,
        role: isAdmin ? ("super_admin" as AdminRole) : null,
        isAdmin,
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return { user: userData.user, role: null as AdminRole | null, isAdmin: false, error: lastError };
}