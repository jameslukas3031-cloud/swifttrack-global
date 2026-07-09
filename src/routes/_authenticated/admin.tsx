import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Shipment = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; recipient_name: string; recipient_city: string | null;
  created_at: string;
};
type Order = { id: string; order_number: string; total: number; status: string; created_at: string };
type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };

const STATUSES = ["pending","picked_up","in_transit","out_for_delivery","delivered","exception","cancelled"];

function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const ok = !!roles?.some((r) => r.role === "admin" || r.role === "staff");
      setAuthorized(ok);
      if (!ok) return;
      loadAll();
    })();
  }, [navigate]);

  async function loadAll() {
    const [s, o, p, c] = await Promise.all([
      supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("orders").select("id,order_number,total,status,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
    ]);
    setShipments((s.data ?? []) as Shipment[]);
    setOrders((o.data ?? []) as Order[]);
    setProfiles((p.data ?? []) as Profile[]);
    setContactCount(c.count ?? 0);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("shipments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("tracking_events").insert({ shipment_id: id, status, description: `Status updated to ${status}` });
    toast.success("Updated");
    loadAll();
  }

  if (authorized === null) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!authorized) return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-2xl font-bold">Admin access required</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have admin or staff privileges. Ask an existing admin to grant your account a role in the <code>user_roles</code> table.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Admin console</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatBox label="Shipments" value={shipments.length} />
        <StatBox label="Orders" value={orders.length} />
        <StatBox label="Customers" value={profiles.length} />
        <StatBox label="Contact msgs" value={contactCount} />
      </div>

      <Tabs defaultValue="shipments" className="mt-8">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="create">New shipment</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="shipments">
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Update</th></tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{s.tracking_number}</td>
                    <td className="px-4 py-3">{s.recipient_name}{s.recipient_city ? `, ${s.recipient_city}`:""}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{s.service_type}</Badge></td>
                    <td className="px-4 py-3"><Badge>{s.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Select onValueChange={(v) => updateStatus(s.id, v)}>
                        <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Change…" /></SelectTrigger>
                        <SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {shipments.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No shipments.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="create"><CreateShipment onDone={loadAll} /></TabsContent>
        <TabsContent value="orders">
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono">{o.order_number}</td>
                    <td className="px-4 py-3">${Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge>{o.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No orders.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="users">
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Joined</th></tr></thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">{p.full_name ?? "—"}</td>
                    <td className="px-4 py-3">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function CreateShipment({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({
    sender_name: "", sender_address: "", sender_city: "", sender_country: "",
    recipient_name: "", recipient_address: "", recipient_city: "", recipient_country: "",
    service_type: "road", weight_kg: "1",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tracking_number = "GL" + Math.floor(Math.random() * 9e11 + 1e11).toString();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("shipments").insert({
      tracking_number,
      user_id: u.user?.id ?? null,
      service_type: f.service_type as "air"|"sea"|"road"|"rail"|"express",
      sender_name: f.sender_name, sender_address: f.sender_address, sender_city: f.sender_city, sender_country: f.sender_country,
      recipient_name: f.recipient_name, recipient_address: f.recipient_address, recipient_city: f.recipient_city, recipient_country: f.recipient_country,
      weight_kg: Number(f.weight_kg),
      status: "pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Created ${tracking_number}`);
    onDone();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
      <Section title="Sender">
        <Field label="Name" value={f.sender_name} onChange={set("sender_name")} required />
        <Field label="Address" value={f.sender_address} onChange={set("sender_address")} required />
        <Field label="City" value={f.sender_city} onChange={set("sender_city")} />
        <Field label="Country" value={f.sender_country} onChange={set("sender_country")} />
      </Section>
      <Section title="Recipient">
        <Field label="Name" value={f.recipient_name} onChange={set("recipient_name")} required />
        <Field label="Address" value={f.recipient_address} onChange={set("recipient_address")} required />
        <Field label="City" value={f.recipient_city} onChange={set("recipient_city")} />
        <Field label="Country" value={f.recipient_country} onChange={set("recipient_country")} />
      </Section>
      <div className="grid grid-cols-2 gap-3 md:col-span-2">
        <div>
          <Label>Service</Label>
          <Select value={f.service_type} onValueChange={(v) => setF({ ...f, service_type: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{["air","sea","road","rail","express"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="Weight (kg)" value={f.weight_kg} onChange={set("weight_kg")} type="number" />
      </div>
      <Button type="submit" disabled={saving} className="gradient-brand text-white md:col-span-2">{saving ? "Creating…" : "Create shipment"}</Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="space-y-3"><h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>{children}</div>);
}
function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (<div><Label>{label}</Label><Input {...p} className="mt-1.5" /></div>);
}
