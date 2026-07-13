import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Printer, MapPin, Package, User, Truck, CheckCircle2, Clock, AlertCircle, CreditCard, Camera } from "lucide-react";
import { TrackSearch } from "@/components/track-search";
import { TrackingMap } from "@/components/tracking-map";
import { findShipment, demoTrackingNumbers, type Shipment as MockShipment } from "@/lib/mock-shipments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ tn: z.string().optional() }),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Track your shipment — Meridian" },
      { name: "description", content: "Enter your tracking number to see live location, timeline, and estimated delivery." },
    ],
  }),
  component: TrackPage,
});

type DbShipment = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; sender_address: string; sender_city: string | null; sender_country: string | null; sender_phone: string | null;
  recipient_name: string; recipient_address: string; recipient_city: string | null; recipient_country: string | null; recipient_phone: string | null;
  shipping_fee: number | null; payment_status: string; amount_paid: number | null; parcel_image_url: string | null;
  weight_kg: number | null; dimensions: string | null; package_type: string | null; package_description: string | null;
  shipping_method: string | null; courier_name: string | null;
  estimated_delivery: string | null; created_at: string; updated_at: string;
  admin_comments: string | null;
  origin_lat: number | null; origin_lng: number | null;
  destination_lat: number | null; destination_lng: number | null;
  current_lat: number | null; current_lng: number | null;
};
type DbEvent = { id: string; status: string; location: string | null; description: string | null; event_time: string };

const STATUS_FLOW = ["pending","created","picked_up","at_warehouse","customs_clearance","in_transit","arrived_distribution_center","out_for_delivery","delivered"];

function statusColor(s: string) {
  const k = s.toLowerCase();
  if (k.includes("deliver")) return "bg-success text-success-foreground";
  if (k.includes("exception")) return "bg-destructive text-destructive-foreground";
  if (k.includes("out")) return "bg-accent text-accent-foreground";
  return "bg-primary text-primary-foreground";
}

function TrackPage() {
  const { tn } = Route.useSearch();
  const mock: MockShipment | undefined = useMemo(() => (tn ? findShipment(tn) : undefined), [tn]);
  const [db, setDb] = useState<DbShipment | null>(null);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!tn || mock) return;
    setLoading(true); setNotFound(false); setDb(null); setEvents([]);
    (async () => {
      const { data } = await supabase.from("shipments").select("*").eq("tracking_number", tn).maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setDb(data as DbShipment);
      const { data: ev } = await supabase.from("tracking_events").select("*").eq("shipment_id", data.id).order("event_time", { ascending: true });
      setEvents((ev ?? []) as DbEvent[]);
      setLoading(false);
    })();
  }, [tn, mock]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Live tracking</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Where is my shipment?</h1>
        <p className="mt-2 text-muted-foreground">No account needed. Enter any tracking number to see full route history.</p>
        <div className="mt-6">
          <TrackSearch variant="compact" />
          <p className="mt-2 text-xs text-muted-foreground">Demo: {demoTrackingNumbers.join(" · ")}</p>
        </div>
      </div>

      {tn && loading && <div className="mt-10 text-center text-muted-foreground">Looking up shipment…</div>}

      {tn && !mock && notFound && (
        <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-3 font-display text-lg font-semibold">Tracking number not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">We couldn't locate "{tn}". Please check for typos and try again.</p>
        </div>
      )}

      {mock && <MockView shipment={mock} />}

      {!mock && db && <DbView shipment={db} events={events} />}
    </div>
  );
}

function MockView({ shipment }: { shipment: MockShipment }) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tracking number</div>
              <div className="mt-1 font-mono text-lg font-semibold">{shipment.trackingNumber}</div>
              <div className="mt-1 text-sm text-muted-foreground">{shipment.service}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(shipment.status)}`}>{shipment.status}</span>
          </div>
          <div className="mt-6"><div className="flex items-center justify-between text-xs font-medium text-muted-foreground"><span>{shipment.origin.label}</span><span>{shipment.destination.label}</span></div><div className="relative mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full gradient-brand" style={{ width: `${shipment.progress}%` }} /></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Info icon={Clock} label="Estimated delivery" value={shipment.estimatedDelivery} />
            <Info icon={MapPin} label="Current location" value={shipment.currentLocation.label} />
            <Info icon={Package} label="Package" value={`${shipment.package.weight} · ${shipment.package.pieces} pcs`} />
          </div>
        </div>
        <TrackingMap shipment={shipment} />
      </div>
      <aside className="space-y-6">
        <Party title="Sender" p={{ name: shipment.sender.name, address: shipment.sender.address, city: `${shipment.sender.city}, ${shipment.sender.country}` }} />
        <Party title="Receiver" p={{ name: shipment.receiver.name, address: shipment.receiver.address, city: `${shipment.receiver.city}, ${shipment.receiver.country}` }} />
      </aside>
    </div>
  );
}

function DbView({ shipment, events }: { shipment: DbShipment; events: DbEvent[] }) {
  const displayStatus = shipment.status.replace(/_/g, " ");
  const idx = STATUS_FLOW.indexOf(shipment.status);
  const isTerminal = ["delivered","returned_to_sender","cancelled"].includes(shipment.status);
  const progress = shipment.status === "delivered" ? 100 : idx >= 0 ? Math.round(((idx + 1) / STATUS_FLOW.length) * 100) : 15;
  const hasMap = shipment.origin_lat && shipment.destination_lat && shipment.current_lat;
  const latestEvent = events.length ? [...events].sort((a, b) => +new Date(b.event_time) - +new Date(a.event_time))[0] : null;
  const currentLocation = latestEvent?.location ?? [shipment.sender_city, shipment.sender_country].filter(Boolean).join(", ") ?? "—";
  const lastUpdated = latestEvent?.event_time ?? shipment.updated_at ?? shipment.created_at;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tracking number</div>
              <div className="mt-1 font-mono text-lg font-semibold">{shipment.tracking_number}</div>
              <div className="mt-1 text-sm text-muted-foreground capitalize">{shipment.service_type} · {shipment.shipping_method ?? shipment.courier_name ?? "In-house courier"}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(displayStatus)}`}>{displayStatus}</span>
              <Badge variant={shipment.payment_status === "paid" ? "default" : "outline"} className="capitalize">
                <CreditCard className="mr-1 h-3 w-3" /> {shipment.payment_status}
              </Badge>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{shipment.sender_city ?? shipment.sender_country ?? "Origin"}</span>
              <span className="font-semibold text-foreground">{progress}%</span>
              <span>{shipment.recipient_city ?? shipment.recipient_country ?? "Destination"}</span>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full ${isTerminal && shipment.status !== "delivered" ? "bg-destructive" : "gradient-brand"}`} style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={MapPin} label="Current location" value={currentLocation || "—"} />
            <Info icon={Clock} label="Last updated" value={format(new Date(lastUpdated), "MMM d, HH:mm")} />
            <Info icon={Clock} label="Estimated delivery" value={shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "MMM d, yyyy") : "—"} />
            <Info icon={CreditCard} label="Amount paid" value={`$${Number(shipment.amount_paid ?? 0).toFixed(2)} / $${Number(shipment.shipping_fee ?? 0).toFixed(2)}`} />
          </div>
          {shipment.admin_comments && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin note</div>
              <div className="mt-1 whitespace-pre-wrap">{shipment.admin_comments}</div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Link to="/receipt/$tn" params={{ tn: shipment.tracking_number }} target="_blank"><Button size="sm" variant="outline">Open receipt</Button></Link>
          </div>
        </div>


        {shipment.parcel_image_url && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Camera className="h-4 w-4" /> Parcel photo</div>
            <img src={shipment.parcel_image_url} alt="Parcel" className="mt-3 max-h-96 w-full rounded-lg border border-border object-contain" />
          </div>
        )}

        {hasMap && (
          <TrackingMap shipment={{
            trackingNumber: shipment.tracking_number, status: displayStatus as never, service: shipment.service_type,
            origin: { label: `${shipment.sender_city ?? ""} ${shipment.sender_country ?? ""}`.trim(), lat: shipment.origin_lat!, lng: shipment.origin_lng! },
            destination: { label: `${shipment.recipient_city ?? ""} ${shipment.recipient_country ?? ""}`.trim(), lat: shipment.destination_lat!, lng: shipment.destination_lng! },
            currentLocation: { label: displayStatus, lat: shipment.current_lat!, lng: shipment.current_lng! },
            progress, estimatedDelivery: "", shippedAt: shipment.created_at,
            sender: { name: shipment.sender_name, address: shipment.sender_address, city: shipment.sender_city ?? "", country: shipment.sender_country ?? "" },
            receiver: { name: shipment.recipient_name, address: shipment.recipient_address, city: shipment.recipient_city ?? "", country: shipment.recipient_country ?? "" },
            package: { type: shipment.package_type ?? "Box", weight: `${shipment.weight_kg ?? 0} kg`, dimensions: shipment.dimensions ?? "—", pieces: 1 },
            events: [],
          }} />
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Tracking timeline</h3>
          <ol className="mt-6 space-y-6">
            {[...events].reverse().map((e, i) => {
              const isLatest = i === 0;
              return (
                <li key={e.id} className="relative flex gap-4 pl-2">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${isLatest ? "gradient-brand" : "bg-secondary"}`}>
                      {e.status === "delivered" ? <CheckCircle2 className={`h-4 w-4 ${isLatest ? "text-white" : "text-muted-foreground"}`} /> : <Truck className={`h-4 w-4 ${isLatest ? "text-white" : "text-muted-foreground"}`} />}
                    </span>
                    {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div className="font-semibold capitalize">{e.status.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(e.event_time), "MMM d, yyyy · HH:mm")}</div>
                    </div>
                    {e.location && <div className="text-sm text-muted-foreground">{e.location}</div>}
                    {e.description && <div className="mt-1 text-xs text-muted-foreground/80">{e.description}</div>}
                  </div>
                </li>
              );
            })}
            {events.length === 0 && <li className="text-sm text-muted-foreground">No tracking events yet.</li>}
          </ol>
        </div>
      </div>

      <aside className="space-y-6">
        <Party title="Sender" p={{ name: shipment.sender_name, address: shipment.sender_address, city: `${shipment.sender_city ?? ""}${shipment.sender_country ? ", " + shipment.sender_country : ""}` }} />
        <Party title="Receiver" p={{ name: shipment.recipient_name, address: shipment.recipient_address, city: `${shipment.recipient_city ?? ""}${shipment.recipient_country ? ", " + shipment.recipient_country : ""}` }} />
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Package className="h-3.5 w-3.5" /> Package</div>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Type", shipment.package_type ?? "—"],
              ["Weight", shipment.weight_kg ? `${shipment.weight_kg} kg` : "—"],
              ["Dimensions", shipment.dimensions ?? "—"],
              ["Courier", shipment.courier_name ?? "—"],
              ["Fee", `$${Number(shipment.shipping_fee ?? 0).toFixed(2)}`],
              ["Payment", shipment.payment_status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/60 pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt><dd className="font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function Party({ title, p }: { title: string; p: { name: string; address: string; city: string } }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><User className="h-3.5 w-3.5" /> {title}</div>
      <div className="mt-3 font-semibold">{p.name}</div>
      <div className="mt-1 text-sm text-muted-foreground">{p.address}</div>
      <div className="text-sm text-muted-foreground">{p.city}</div>
    </div>
  );
}
