import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Shipment = {
  id: string; tracking_number: string; status: string;
  recipient_name: string; recipient_city: string | null;
  estimated_delivery: string | null; created_at: string;
};

function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    supabase.from("shipments").select("id,tracking_number,status,recipient_name,recipient_city,estimated_delivery,created_at")
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setShipments((data ?? []) as Shipment[]));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as {email}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Your dashboard</h1>
        </div>
        <Button asChild className="gradient-brand text-white"><Link to="/track">Track a shipment</Link></Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={Package} label="Total shipments" value={shipments.length} />
        <Stat icon={Clock} label="In transit" value={shipments.filter((s) => ["in_transit","picked_up","out_for_delivery"].includes(s.status)).length} />
        <Stat icon={MapPin} label="Delivered" value={shipments.filter((s) => s.status === "delivered").length} />
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Recent shipments</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">ETA</th></tr>
          </thead>
          <tbody>
            {shipments.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No shipments yet.</td></tr>}
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{s.tracking_number}</td>
                <td className="px-4 py-3">{s.recipient_name}{s.recipient_city ? `, ${s.recipient_city}` : ""}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{s.status.replace(/_/g," ")}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg gradient-brand"><Icon className="h-5 w-5 text-white" /></span>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
