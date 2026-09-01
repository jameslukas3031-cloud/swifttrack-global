import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes a user account. Super admins only. */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("userId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: isSuper, error: superRoleErr }, { data: isAdmin, error: adminRoleErr }] = await Promise.all([
      supabase.rpc("is_super_admin", { _user_id: userId }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (superRoleErr || adminRoleErr) throw new Error(superRoleErr?.message ?? adminRoleErr?.message ?? "Could not verify role");
    if (!isSuper && !isAdmin) throw new Error("Forbidden");
    if (data.userId === userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", data.userId);
    if ((targetRoles ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("Cannot delete a super admin account");
    }

    // Detach owned records so the auth deletion is not blocked.
    await supabaseAdmin.from("shipments").update({ user_id: null }).eq("user_id", data.userId);
    await supabaseAdmin.from("orders").update({ user_id: null }).eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: userId, action: "delete_user", entity: "auth.users", entity_id: data.userId,
    });

    return { ok: true };
  });
