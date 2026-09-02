import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reviewClearancePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { paymentId: string; approve: boolean; note?: string }) => {
    if (!input?.paymentId) throw new Error("paymentId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw new Error(roleError.message);
    const allowed = (roles ?? []).some((role) => role.role === "admin" || role.role === "super_admin");
    if (!allowed) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error } = await supabaseAdmin.rpc("review_clearance_payment", {
      _payment_id: data.paymentId,
      _approve: data.approve,
      _note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return payment;
  });