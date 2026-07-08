import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { format } from "date-fns";
import { Printer, Download, MapPin, Package, User, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { TrackSearch } from "@/components/track-search";
import { TrackingMap } from "@/components/tracking-map";
import { findShipment, demoTrackingNumbers } from "@/lib/mock-shipments";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ tn: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track your shipment — Meridian" },
      { name: "description", content: "Enter your tracking number to see live location, timeline, and estimated delivery." },
    ],
  }),
  component: TrackPage,
});

function statusColor(s: string) {
  if (s === "Delivered") return "bg-success text-success-foreground";
  if (s === "Exception") return "bg-destructive text-destructive-foreground";
  if (s === "Out For Delivery") return "bg-accent text-accent-foreground";
  return "bg-primary text-primary-foreground";
}

function TrackPage() {
  const { tn } = Route.useSearch();
  const shipment = useMemo(() => (tn ? findShipment(tn) : undefined), [tn]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Live tracking</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Where is my shipment?</h1>
        <p className="mt-2 text-muted-foreground">No account needed. Enter any tracking number to see full route history.</p>
        <div className="mt-6">
          <TrackSearch variant="compact" />
          <p className="mt-2 text-xs text-muted-foreground">Try: {demoTrackingNumbers.join(" · ")}</p>
        </div>
      </div>

      {tn && !shipment && (
        <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="mt-3 font-display text-lg font-semibold">Tracking number not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">We couldn't locate "{tn}". Please check for typos and try again.</p>
        </div>
      )}

      {shipment && (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Left: overview + timeline */}
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

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{shipment.origin.label}</span>
                  <span>{shipment.destination.label}</span>
                </div>
                <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full gradient-brand transition-all" style={{ width: `${shipment.progress}%` }} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Estimated delivery</div>
                  <div className="mt-1 font-semibold">{shipment.estimatedDelivery}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Current location</div>
                  <div className="mt-1 font-semibold">{shipment.currentLocation.label}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Package className="h-3.5 w-3.5" /> Package</div>
                  <div className="mt-1 font-semibold">{shipment.package.weight} · {shipment.package.pieces} pcs</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print receipt</Button>
                <Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
              </div>
            </div>

            <TrackingMap shipment={shipment} />

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Tracking timeline</h3>
              <ol className="mt-6 space-y-6">
                {[...shipment.events].reverse().map((e, i) => {
                  const isLatest = i === 0;
                  return (
                    <li key={i} className="relative flex gap-4 pl-2">
                      <div className="flex flex-col items-center">
                        <span className={`grid h-8 w-8 place-items-center rounded-full ${isLatest ? "gradient-brand" : "bg-secondary"}`}>
                          {e.status === "Delivered" ? (
                            <CheckCircle2 className={`h-4 w-4 ${isLatest ? "text-white" : "text-muted-foreground"}`} />
                          ) : (
                            <Truck className={`h-4 w-4 ${isLatest ? "text-white" : "text-muted-foreground"}`} />
                          )}
                        </span>
                        {i < shipment.events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <div className="font-semibold">{e.status}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(e.timestamp), "MMM d, yyyy · HH:mm")}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{e.location}</div>
                        {e.note && <div className="mt-1 text-xs text-muted-foreground/80">{e.note}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Right: parties */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Sender
              </div>
              <div className="mt-3 font-semibold">{shipment.sender.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{shipment.sender.address}</div>
              <div className="text-sm text-muted-foreground">{shipment.sender.city}, {shipment.sender.country}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Receiver
              </div>
              <div className="mt-3 font-semibold">{shipment.receiver.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{shipment.receiver.address}</div>
              <div className="text-sm text-muted-foreground">{shipment.receiver.city}, {shipment.receiver.country}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Package details
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Type", shipment.package.type],
                  ["Weight", shipment.package.weight],
                  ["Dimensions", shipment.package.dimensions],
                  ["Pieces", shipment.package.pieces],
                  ["Shipped", format(new Date(shipment.shippedAt), "MMM d, yyyy")],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-border/60 pb-2 last:border-0">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
