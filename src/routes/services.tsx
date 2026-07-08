import { createFileRoute } from "@tanstack/react-router";
import { Plane, Ship, Truck, Train, Warehouse, ShieldCheck, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Meridian Global Logistics" },
      { name: "description", content: "Air, sea, road, rail, warehousing, customs and last-mile delivery. Every logistics service in one platform." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Plane, title: "Air Freight", desc: "Express and consolidated air cargo to 190+ destinations with door-to-door lead times of 24–72 hours.", features: ["Charter & block-space agreements", "Cold-chain and pharma certified", "Temperature-controlled ULDs"] },
  { icon: Ship, title: "Sea Freight", desc: "Full container load, less-than-container load and break-bulk across 320+ port pairs worldwide.", features: ["FCL / LCL / reefer", "Weekly sailing schedule", "Port-to-port + door delivery"] },
  { icon: Truck, title: "Road Transport", desc: "Same-day, next-day and cross-border trucking across North America, Europe and Asia-Pacific.", features: ["FTL and LTL", "Cross-border customs bonded", "Tail-lift & white-glove options"] },
  { icon: Train, title: "Rail Transport", desc: "China–Europe block trains offering a cost/speed midpoint between sea and air.", features: ["18–22 day transit", "Low-carbon corridor", "Weekly departures"] },
  { icon: Warehouse, title: "Warehousing & Fulfillment", desc: "1.2M m² of bonded, temperature-controlled fulfillment across 4 continents.", features: ["Pick, pack, kit, return", "B2B & B2C fulfillment", "WMS API integration"] },
  { icon: ShieldCheck, title: "Customs Clearance", desc: "Licensed brokers in 80+ jurisdictions with average clearance under 4 hours.", features: ["HS classification", "Duty & tax optimization", "AEO-certified"] },
  { icon: PackageCheck, title: "Last Mile Delivery", desc: "Own fleet + partner network delivering to 3.4B addressable consumers.", features: ["Signed & photo POD", "Time-slot booking", "Reverse logistics"] },
];

function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Services</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Every mode, one integrated platform.</h1>
        <p className="mt-4 text-muted-foreground">From a single airway bill to a full multi-modal supply chain — Meridian handles it end-to-end.</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {services.map((s) => (
          <div key={s.title} className="rounded-2xl border border-border bg-card p-8 transition hover:shadow-elevated">
            <div className="flex items-start gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl gradient-brand text-white">
                <s.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
