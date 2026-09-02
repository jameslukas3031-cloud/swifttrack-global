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
    const allowed = (roles ?? []).some((role) => role.role === "super_admin");
    if (!allowed) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("clearance_payments").select("*").eq("id", data.paymentId).maybeSingle();
    if (paymentError) throw new Error(paymentError.message);
    if (!payment) throw new Error("Payment not found");

    const { data: reviewed, error: reviewError } = await supabaseAdmin
      .from("clearance_payments")
      .update({
        review_status: data.approve ? "approved" : "rejected",
        review_note: data.note,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.paymentId)
      .select("*").single();
    if (reviewError) throw new Error(reviewError.message);

    const { data: approved, error: approvedError } = await supabaseAdmin
      .from("clearance_payments").select("amount")
      .eq("shipment_id", payment.shipment_id).eq("review_status", "approved");
    if (approvedError) throw new Error(approvedError.message);
    const total = (approved ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const { data: shipment, error: shipmentError } = await supabaseAdmin
      .from("shipments").select("clearance_required,clearance_fee").eq("id", payment.shipment_id).single();
    if (shipmentError) throw new Error(shipmentError.message);

    const clearanceStatus = !shipment.clearance_required ? "not_required" :
      total >= Number(shipment.clearance_fee ?? 0) && Number(shipment.clearance_fee ?? 0) > 0 ? "cleared" :
      total > 0 ? "partially_paid" : !data.approve ? "payment_rejected" : "clearance_required";
    const { error: updateShipmentError } = await supabaseAdmin.from("shipments")
      .update({ clearance_paid: total, clearance_status: clearanceStatus })
      .eq("id", payment.shipment_id);
    if (updateShipmentError) throw new Error(updateShipmentError.message);

    const { error: auditError } = await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: context.userId,
      action: data.approve ? "approve_clearance_payment" : "reject_clearance_payment",
      entity: "clearance_payments",
      entity_id: payment.id,
      details: { amount: payment.amount, shipment_id: payment.shipment_id, note: data.note ?? null },
    });
    if (auditError) throw new Error(auditError.message);
    return reviewed;
  });