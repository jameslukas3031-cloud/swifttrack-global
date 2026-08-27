import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Meridian — 24/7 global support" },
      { name: "description", content: "Reach our sales, operations and customer support teams across 40 offices worldwide." },
    ],
  }),
  component: ContactPage,
});

const offices = [
  { city: "Singapore", region: "APAC HQ", address: "1 Raffles Quay, #40-01", phone: "+65 6812 4000" },
  { city: "Rotterdam", region: "EMEA HQ", address: "Wilhelminakade 909", phone: "+31 10 202 4000" },
  { city: "Memphis", region: "Americas HQ", address: "3610 Hacks Cross Rd", phone: "+1 901 555 0100" },
  { city: "Dubai", region: "MEA Hub", address: "Jebel Ali Free Zone", phone: "+971 4 881 5000" },
];

function ContactPage() {
  const [sending, setSending] = useState(false);
  const contact = useSiteContact();
  const phone = contact?.contact_phone?.value || "+65 6812 4000";
  const email = contact?.contact_email?.value || "hello@meridian.co";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll reply within 2 hours.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">We're online 24/7.</h1>
        <p className="mt-3 text-muted-foreground">Sales, operations, tracking help — pick a channel. Average response time: under 2 hours.</p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-elevated lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" placeholder="e.g. Rates for FCL Shanghai → LA" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="msg">Message</Label>
              <Textarea id="msg" required rows={6} className="mt-1.5" />
            </div>
          </div>
          <Button type="submit" size="lg" disabled={sending} className="mt-6 gradient-brand text-white hover:opacity-90">
            {sending ? "Sending…" : "Send message"}
          </Button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><Phone className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-muted-foreground">{contact?.contact_phone?.label || "Call sales"}</div>
                  <div className="font-medium">{phone}</div>
                </div>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><Mail className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-muted-foreground">{contact?.contact_email?.label || "Email"}</div>
                  <div className="font-medium">{email}</div>
                </div>
              </a>
              <button type="button" onClick={() => toast.info("Live chat coming online…")} className="flex items-center gap-3 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-white"><MessageCircle className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-muted-foreground">Live chat</div>
                  <div className="font-medium">Available 24/7</div>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold">Offices</h3>
            <ul className="mt-4 space-y-4">
              {offices.map((o) => (
                <li key={o.city} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <div className="font-medium">{o.city} <span className="text-xs font-normal text-muted-foreground">— {o.region}</span></div>
                    <div className="text-sm text-muted-foreground">{o.address}</div>
                    <div className="text-sm text-muted-foreground">{o.phone}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
