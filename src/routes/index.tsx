import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Ship, Truck, Train, Warehouse, ShieldCheck, PackageCheck, Globe2, Clock, Star, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-logistics.jpg";
import { TrackSearch } from "@/components/track-search";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian Global Logistics — Track & ship worldwide" },
      { name: "description", content: "Move freight across air, sea, road and rail. Real-time tracking, instant rates, 220+ countries." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200" },
    ],
  }),
  component: HomePage,
});

const services = [
  { icon: Plane, title: "Air Freight", desc: "Express air cargo to 190+ destinations, 24–72h door-to-door." },
  { icon: Ship, title: "Sea Freight", desc: "FCL & LCL ocean shipping with 320+ port pairs worldwide." },
  { icon: Truck, title: "Road Transport", desc: "Same-day and cross-border trucking across 3 continents." },
  { icon: Train, title: "Rail Transport", desc: "China–Europe rail corridor, low-carbon block trains." },
  { icon: Warehouse, title: "Warehousing", desc: "1.2M m² of bonded, temperature-controlled fulfillment." },
  { icon: ShieldCheck, title: "Customs Clearance", desc: "Licensed brokers in 80+ jurisdictions, 4h avg. clearance." },
];

const stats = [
  { v: "4.2M+", l: "Shipments per day" },
  { v: "220", l: "Countries served" },
  { v: "99.6%", l: "On-time delivery" },
  { v: "24/7", l: "Global support" },
];

const testimonials = [
  { name: "Amara Okafor", role: "Head of Ops, Lagos Textiles", quote: "Cut our EU import lead time from 18 days to 9. The tracking dashboard is what we always wished DHL had." },
  { name: "Kenji Watanabe", role: "Founder, Kyoto Ceramics", quote: "Fragile-goods claims dropped to zero after we switched. Their packaging protocol just works." },
  { name: "Lucia Fernández", role: "Supply Chain Lead, Vela SA", quote: "One portal for air, sea and last-mile. My team stopped juggling four freight forwarders." },
];

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img src={heroImg} alt="" width={1920} height={1080} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 gradient-hero opacity-90" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Real-time tracking across 220 countries
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Ship anywhere.<br />
              <span className="text-gradient-brand">See everything.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Air, sea, road and rail on one platform. Book, pay and track every parcel and pallet in real time — from pickup to signature.
            </p>
            <div className="mt-8 max-w-2xl">
              <TrackSearch />
              <p className="mt-3 text-xs text-white/60">Try demo: GL7842019283 · GL1029384756 · GL5566778899</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">{s.v}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">What we move</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">A single platform for every mode of transport</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/services">All services <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-elevated">
              <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Why Meridian</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Built for supply chains that can't afford to guess.</h2>
              <p className="mt-4 text-primary-foreground/70">
                Every shipment is scanned at 14 checkpoints on average and geotagged live. When something goes wrong, you know before your customer does.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Globe2, t: "Global network", d: "1,400 own facilities + 12,000 partner locations." },
                { icon: Clock, t: "Predictable ETAs", d: "ML-based delivery windows within ±90 min." },
                { icon: PackageCheck, t: "Proof of delivery", d: "Photo + signature attached to every parcel." },
                { icon: ShieldCheck, t: "Insured by default", d: "Up to $50k cargo cover on every waybill." },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-white/15 bg-white/5 p-5 backdrop-blur">
                  <f.icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/70">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Customer stories</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Trusted by 340,000+ businesses</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-white sm:p-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to move something?</h2>
            <p className="mt-3 text-white/80">Get an instant rate for any lane in the world. No account required.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="gradient-brand text-white hover:opacity-90" asChild>
                <Link to="/calculator">Calculate rate</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link to="/contact">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
