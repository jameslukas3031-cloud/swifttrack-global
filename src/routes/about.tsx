import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Meridian Global Logistics" },
      { name: "description", content: "Since 2008, Meridian has moved freight across 220 countries with a single-platform ethos." },
    ],
  }),
  component: AboutPage,
});

const team = [
  { name: "Sarah Chen", role: "Chief Executive Officer", initials: "SC" },
  { name: "Diego Herrera", role: "Chief Operations Officer", initials: "DH" },
  { name: "Priya Ramanathan", role: "VP Global Network", initials: "PR" },
  { name: "Tomás Weber", role: "VP Technology", initials: "TW" },
];

function AboutPage() {
  return (
    <div>
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">About us</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold sm:text-5xl">
            We move the goods that keep the world running.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Founded in Singapore in 2008, Meridian has grown from a five-person freight forwarder into a global network of 42,000 people, 1,400 facilities and one purpose: making cross-border logistics feel local.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, t: "Mission", d: "Give every business — from a solo maker to a Fortune 500 — access to the same reliable, transparent, multimodal logistics network." },
            { icon: Eye, t: "Vision", d: "A world where a package moving 12,000 km feels as predictable as a package moving 12 km." },
            { icon: Users, t: "Values", d: "Radical transparency, engineering excellence, respect for the frontline crews who move every parcel." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-border bg-card p-8">
              <x.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-display text-xl font-semibold">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold">Leadership</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-brand font-display text-2xl font-bold text-white">
                {m.initials}
              </div>
              <div className="mt-4 font-semibold">{m.name}</div>
              <div className="text-sm text-muted-foreground">{m.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
