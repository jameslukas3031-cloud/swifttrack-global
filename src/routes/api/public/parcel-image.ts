import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/parcel-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path")?.trim() ?? "";
        const shipmentId = path.split("/", 1)[0] ?? "";
        if (!shipmentId || !path || path.length > 500 || !path.startsWith(`${shipmentId}/`)) {
          return Response.json({ error: "Invalid image reference" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shipment, error } = await supabaseAdmin
          .from("shipments")
          .select("id,parcel_image_url")
          .eq("id", shipmentId)
          .eq("parcel_image_url", path)
          .maybeSingle();
        if (error || !shipment) return Response.json({ error: "Image not found" }, { status: 404 });

        const { data, error: signedUrlError } = await supabaseAdmin.storage
          .from("parcel-images")
          .createSignedUrl(path, 60 * 60);
        if (signedUrlError || !data?.signedUrl) return Response.json({ error: "Image unavailable" }, { status: 404 });
        return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, max-age=300" } });
      },
    },
  },
});