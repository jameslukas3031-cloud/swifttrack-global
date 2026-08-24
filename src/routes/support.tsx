import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Meridian Global Logistics" },
      { name: "description", content: "Get help with your shipment. Contact Meridian support by email, WhatsApp or Telegram." },
      { property: "og:title", content: "Meridian Support" },
      { property: "og:description", content: "Reach our team by email, WhatsApp or Telegram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

type Row = { channel: string; enabled: boolean; value: string; label: string | null; sort_order: number };

function hrefFor(channel: string, value: string) {
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (channel === "email") return `mailto:${v.replace(/^mailto:/, "")}`;
  if (channel === "whatsapp") return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
  if (channel === "telegram") return `https://t.me/${v.replace(/^@/, "")}`;
  return v;
}

const META: Record<string, { title: string; desc: string; icon: typeof Mail }> = {
  email: { title: "Email", desc: "Write to us — we reply within 2 hours.", icon: Mail },
  whatsapp: { title: "WhatsApp", desc: "Chat with an agent on WhatsApp.", icon: MessageCircle },
  telegram: { title: "Telegram", desc: "Message us on Telegram.", icon: Send },
};

function SupportPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    supabase.from("support_settings").select("channel,enabled,value,label,sort_order").eq("enabled", true).order("sort_order")
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  const available = (rows ?? []).filter((r) => hrefFor(r.channel, r.value));

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Support</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">How can we help?</h1>
      <p className="mt-3 text-muted-foreground">Pick a channel below and our team will assist you with tracking, clearance or billing.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {available.map((r) => {
          const meta = META[r.channel] ?? { title: r.channel, desc: "", icon: MessageCircle };
          const Icon = meta.icon;
          return (
            <a key={r.channel} href={hrefFor(r.channel, r.value)!} target="_blank" rel="noopener noreferrer">
              <Card className="flex h-full items-start gap-4 p-5 transition-colors hover:border-foreground/30">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-white"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="font-medium">{r.label || meta.title}</div>
                  <div className="text-sm text-muted-foreground">{meta.desc}</div>
                  <div className="mt-1 truncate text-sm font-medium">{r.value}</div>
                </div>
              </Card>
            </a>
          );
        })}
      </div>

      {rows !== null && available.length === 0 && (
        <Card className="mt-10 p-6 text-sm text-muted-foreground">
          Support channels are being updated. Please use the contact page in the meantime.
        </Card>
      )}
    </div>
  );
}
