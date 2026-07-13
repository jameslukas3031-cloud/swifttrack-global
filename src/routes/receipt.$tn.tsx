import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, Package } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

export const Route = createFileRoute("/receipt/$tn")({
  ssr: false,
  head: () => ({ meta: [{ title: "Shipment Receipt — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: ReceiptPage,
});

type S = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; sender_address: string; sender_city: string | null; sender_country: string | null; sender_phone: string | null;
  recipient_name: string; recipient_address: string; recipient_city: string | null; recipient_country: string | null; recipient_phone: string | null;
  shipping_fee: number | null; payment_status: string; amount_paid: number | null; parcel_image_url: string | null;
  weight_kg: number | null; dimensions: string | null; package_type: string | null; package_description: string | null;
  shipping_method: string | null; courier_name: string | null;
  estimated_delivery: string | null; created_at: string;
  admin_comments: string | null; admin_signature_url: string | null;
};

function ReceiptPage() {
  const { tn } = Route.useParams();
  const [s, setS] = useState<S | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    supabase.from("shipments").select("*").eq("tracking_number", tn).maybeSingle().then(({ data }) => {
      setS((data ?? null) as S | null);
      setLoading(false);
    });
    QRCode.toDataURL(tn, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [tn]);

  useEffect(() => {
    if (s && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, s.tracking_number, {
          format: "CODE128", displayValue: true, height: 60, fontSize: 14, margin: 0, background: "#ffffff",
        });
      } catch { /* noop */ }
    }
  }, [s]);

  async function downloadImage() {
    const target = document.getElementById("receipt-card");
    if (!target) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `receipt-${s?.tracking_number ?? "shipment"}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }

  async function downloadPdf() {
    const target = document.getElementById("receipt-card");
    if (!target) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(imgData, "JPEG", (pageW - w) / 2, 20, w, h);
    pdf.save(`receipt-${s?.tracking_number ?? "shipment"}.pdf`);
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!s) return <div className="p-10 text-center">Receipt not found for {tn}.</div>;

  const receiptNo = `RCP-${s.tracking_number}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 print:py-0">
      <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        <Button size="sm" variant="outline" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
        <Button size="sm" variant="outline" onClick={downloadImage}><Download className="mr-2 h-4 w-4" /> Export JPG</Button>
      </div>

      <div id="receipt-card" className="rounded-xl border border-slate-200 bg-white p-8 text-black shadow-elevated print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-lg bg-slate-900 text-white"><Package className="h-7 w-7" /></span>
            <div>
              <div className="font-display text-2xl font-bold tracking-tight">MERIDIAN LOGISTICS</div>
              <div className="text-xs text-slate-500">Global shipping · Courier · E-commerce</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-bold uppercase tracking-widest text-slate-900">Receipt</div>
            <div className="mt-1 text-xs text-slate-600">Receipt #: <span className="font-mono">{receiptNo}</span></div>
            <div className="text-xs text-slate-600">Shipment ID: <span className="font-mono">{s.id.slice(0, 8).toUpperCase()}</span></div>
            <div className="text-xs text-slate-600">Date: {format(new Date(s.created_at), "MMM d, yyyy")}</div>
          </div>
        </div>

        {/* Tracking hero */}
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] items-center rounded-lg bg-slate-50 p-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Tracking Number</div>
            <div className="mt-1 font-mono text-2xl font-bold">{s.tracking_number}</div>
            <svg ref={barcodeRef} className="mt-2" />
          </div>
          {qrDataUrl && (
            <div className="text-center">
              <img src={qrDataUrl} alt="QR" className="h-28 w-28" />
              <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Scan to track</div>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1">Sender</div>
            <div className="mt-2 font-semibold">{s.sender_name}</div>
            <div className="text-slate-700">{s.sender_address}</div>
            <div className="text-slate-700">{[s.sender_city, s.sender_country].filter(Boolean).join(", ")}</div>
            {s.sender_phone && <div className="text-slate-700">Phone: {s.sender_phone}</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1">Receiver</div>
            <div className="mt-2 font-semibold">{s.recipient_name}</div>
            <div className="text-slate-700">{s.recipient_address}</div>
            <div className="text-slate-700">{[s.recipient_city, s.recipient_country].filter(Boolean).join(", ")}</div>
            {s.recipient_phone && <div className="text-slate-700">Phone: {s.recipient_phone}</div>}
          </div>
        </div>

        {/* Shipment details */}
        <div className="mt-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1">Shipment details</div>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              <Row k="Package description" v={s.package_description ?? s.package_type ?? "—"} />
              <Row k="Package weight" v={s.weight_kg ? `${s.weight_kg} kg` : "—"} />
              <Row k="Dimensions" v={s.dimensions ?? "—"} />
              <Row k="Shipping method" v={s.shipping_method ?? s.courier_name ?? "—"} />
              <Row k="Service type" v={s.service_type} />
              <Row k="Estimated delivery" v={s.estimated_delivery ? format(new Date(s.estimated_delivery), "MMM d, yyyy") : "—"} />
              <Row k="Current status" v={s.status.replace(/_/g, " ")} />
              <Row k="Payment status" v={s.payment_status} />
            </tbody>
          </table>
        </div>

        {/* Payment */}
        <div className="mt-6 rounded-lg border-2 border-slate-900 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Shipment Fee</div>
              <div className="font-display text-2xl font-bold">${Number(s.shipping_fee ?? 0).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-slate-500">Amount Paid</div>
              <div className="font-display text-2xl font-bold text-green-700">${Number(s.amount_paid ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {s.admin_comments && (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1">Admin comments</div>
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{s.admin_comments}</div>
          </div>
        )}

        {s.parcel_image_url && (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1">Parcel photo</div>
            <img src={s.parcel_image_url} alt="Parcel" crossOrigin="anonymous" className="mt-2 max-h-60 rounded border border-slate-200 object-contain" />
          </div>
        )}

        {/* Signature */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Admin signature</div>
            <div className="mt-1 h-16 border-b-2 border-slate-400 flex items-end justify-start">
              {s.admin_signature_url ? <img src={s.admin_signature_url} alt="Signature" className="max-h-14" /> : null}
            </div>
            <div className="mt-1 text-xs text-slate-500">Authorized representative</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Customer signature</div>
            <div className="mt-1 h-16 border-b-2 border-slate-400"></div>
            <div className="mt-1 text-xs text-slate-500">Received in good condition</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t-2 border-slate-900 pt-4 text-center text-xs text-slate-600">
          <div className="font-semibold text-slate-800">Meridian Logistics · Global Shipping Solutions</div>
          <div className="mt-1">1 Harbor Way, Rotterdam · +1 (800) 555-0199 · support@meridian.example</div>
          <div className="mt-1">Track anytime at meridian.example/track?tn={s.tracking_number}</div>
          <div className="mt-2 text-[10px] text-slate-400">Thank you for choosing Meridian Logistics.</div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 text-slate-500 w-1/3">{k}</td>
      <td className="py-2 font-medium capitalize">{v}</td>
    </tr>
  );
}
