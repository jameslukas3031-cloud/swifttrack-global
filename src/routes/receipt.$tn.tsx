import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download, Package } from "lucide-react";

export const Route = createFileRoute("/receipt/$tn")({
  ssr: false,
  head: () => ({ meta: [{ title: "Receipt — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: ReceiptPage,
});

type S = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; sender_address: string; sender_city: string | null; sender_country: string | null;
  recipient_name: string; recipient_address: string; recipient_city: string | null; recipient_country: string | null;
  shipping_fee: number | null; payment_status: string; parcel_image_url: string | null;
  weight_kg: number | null; dimensions: string | null; package_type: string | null; courier_name: string | null;
  estimated_delivery: string | null; created_at: string;
};

async function downloadAsImage() {
  const target = document.getElementById("receipt-card");
  if (!target) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2 });
  const link = document.createElement("a");
  link.download = `receipt-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function ReceiptPage() {
  const { tn } = Route.useParams();
  const [s, setS] = useState<S | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("shipments").select("*").eq("tracking_number", tn).maybeSingle().then(({ data }) => {
      setS((data ?? null) as S | null);
      setLoading(false);
    });
  }, [tn]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!s) return <div className="p-10 text-center">Receipt not found for {tn}.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:py-0">
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
        <Button size="sm" variant="outline" onClick={downloadAsImage}><Download className="mr-2 h-4 w-4" /> Download as image</Button>
      </div>
      <div id="receipt-card" className="rounded-xl border border-border bg-white p-8 text-black shadow-elevated print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white"><Package className="h-5 w-5" /></span>
            <div>
              <div className="font-display text-xl font-bold">Meridian Logistics</div>
              <div className="text-xs text-slate-500">Shipment receipt</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Date: {format(new Date(s.created_at), "MMM d, yyyy")}</div>
            <div>Receipt #: {s.tracking_number}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Sender</div>
            <div className="mt-1 font-semibold">{s.sender_name}</div>
            <div>{s.sender_address}</div>
            <div>{[s.sender_city, s.sender_country].filter(Boolean).join(", ")}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Receiver</div>
            <div className="mt-1 font-semibold">{s.recipient_name}</div>
            <div>{s.recipient_address}</div>
            <div>{[s.recipient_city, s.recipient_country].filter(Boolean).join(", ")}</div>
          </div>
        </div>

        <div className="mt-6">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <Row k="Tracking number" v={s.tracking_number} />
              <Row k="Service" v={s.service_type} />
              <Row k="Courier" v={s.courier_name ?? "—"} />
              <Row k="Package type" v={s.package_type ?? "—"} />
              <Row k="Weight" v={s.weight_kg ? `${s.weight_kg} kg` : "—"} />
              <Row k="Dimensions" v={s.dimensions ?? "—"} />
              <Row k="Estimated delivery" v={s.estimated_delivery ? format(new Date(s.estimated_delivery), "MMM d, yyyy") : "—"} />
              <Row k="Status" v={s.status.replace(/_/g, " ")} />
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="uppercase tracking-wider text-slate-500">Shipment fee</div>
            <div className="font-display text-2xl font-bold">${Number(s.shipping_fee ?? 0).toFixed(2)}</div>
          </div>
          <div className="mt-2 text-right text-xs uppercase tracking-wider text-slate-600">Payment: {s.payment_status}</div>
        </div>

        {s.parcel_image_url && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-slate-500">Parcel photo</div>
            <img src={s.parcel_image_url} alt="Parcel" className="mt-2 max-h-64 rounded border border-slate-200 object-contain" />
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Thank you for choosing Meridian Logistics. Track this shipment any time at /track?tn={s.tracking_number}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 text-slate-500">{k}</td>
      <td className="py-2 text-right font-medium capitalize">{v}</td>
    </tr>
  );
}
