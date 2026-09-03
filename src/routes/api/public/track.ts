import { createFileRoute } from "@tanstack/react-router";

const safeShipmentFields = [
  "id", "tracking_number", "status", "service_type", "sender_city", "sender_country",
  "recipient_city", "recipient_country", "weight_kg", "dimensions", "package_type",
  "shipping_method", "courier_name", "estimated_delivery", "created_at", "updated_at",
  "origin_lat", "origin_lng", "destination_lat", "destination_lng", "current_lat", "current_lng",
  "parcel_image_url", "clearance_required", "clearance_fee", "clearance_paid",
  "clearance_status", "clearance_instructions", "payment_status", "amount_paid", "shipping_fee",
].join(",");

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const trackingNumber = new URL(request.url).searchParams.get("tn")?.trim() ?? "";
        if (!trackingNumber || trackingNumber.length > 100) {
          return Response.json({ error: "Invalid tracking number" }, { status: 400 });
        }

        // The exact tracking number is the public lookup capability. The query
        // is deliberately limited to non-sensitive shipment fields.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rawShipment, error } = await supabaseAdmin
          .from("shipments")
          .select(safeShipmentFields)
          .eq("tracking_number", trackingNumber)
          .maybeSingle();

        if (error) return Response.json({ error: "Tracking lookup failed" }, { status: 500 });
        const shipment = rawShipment as (Record<string, unknown> & { id: string }) | null;
        if (!shipment) return Response.json({ shipment: null, events: [] });

        const { data: events, error: eventsError } = await supabaseAdmin
          .from("tracking_events")
          .select("id,status,location,description,event_time")
          .eq("shipment_id", shipment.id)
          .order("event_time", { ascending: true });

        if (eventsError) return Response.json({ error: "Tracking lookup failed" }, { status: 500 });
        return Response.json({ shipment, events: events ?? [] }, {
          headers: { "Cache-Control": "private, max-age=30" },
        });
      },
    },
  },
});