import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar, type AdminSection } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Trash2, Search, Package, Users, CreditCard, TrendingUp, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Shipment = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; sender_phone?: string | null;
  recipient_name: string; recipient_city: string | null; recipient_phone?: string | null;
  shipping_fee: number | null; payment_status: string; amount_paid?: number | null;
  parcel_image_url: string | null;
  weight_kg: number | null; dimensions: string | null; package_type: string | null;
  package_description?: string | null; shipping_method?: string | null;
  courier_name: string | null; estimated_delivery: string | null;
  current_lat: number | null; current_lng: number | null;
  admin_comments?: string | null;
  created_at: string; user_id: string | null;
};
type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };

const STATUSES = [
  "pending","created","picked_up","at_warehouse","customs_clearance","in_transit",
  "arrived_distribution_center","out_for_delivery","delivered",
  "delivery_failed","on_hold","delayed","returned_to_sender","exception","cancelled",
];

function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [contactCount, setContactCount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: u.user.id });
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      const ok = !!isSuper || !!isAdmin;
      setAuthorized(ok);
      if (ok) loadAll();
    })();
  }, [navigate]);

  async function loadAll() {
    const [s, p, c, r] = await Promise.all([
      supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setShipments((s.data ?? []) as Shipment[]);
    setProfiles((p.data ?? []) as Profile[]);
    setContactCount(c.count ?? 0);
    const map: Record<string, string> = {};
    for (const row of (r.data ?? []) as { user_id: string; role: string }[]) {
      const rank = (x: string) => x === "super_admin" ? 4 : x === "admin" ? 3 : x === "staff" ? 2 : 1;
      const prev = map[row.user_id];
      if (!prev || rank(row.role) > rank(prev)) map[row.user_id] = row.role;
    }
    setUserRoles(map);
  }

  if (authorized === null) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!authorized) return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">This console is restricted to administrators.</p>
    </div>
  );

  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.tracking_number.toLowerCase().includes(q) || s.sender_name.toLowerCase().includes(q) || s.recipient_name.toLowerCase().includes(q);
  });

  const totalRevenue = shipments.filter((s) => s.payment_status === "paid").reduce((a, b) => a + Number(b.shipping_fee ?? 0), 0);
  const pendingPayments = shipments.filter((s) => s.payment_status === "unpaid").length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const inTransit = shipments.filter((s) => ["picked_up","in_transit","out_for_delivery"].includes(s.status)).length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar active={section} onSelect={setSection} />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-border px-4">
            <SidebarTrigger />
            <div className="font-display text-sm font-semibold capitalize">{section.replace(/([A-Z])/g, " $1")}</div>
            <div className="ml-auto text-xs text-muted-foreground">Admin</div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            {section === "dashboard" && (
              <div>
                <h1 className="font-display text-2xl font-bold">Overview</h1>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat icon={Package} label="Shipments" value={shipments.length} tone="primary" />
                  <Stat icon={TrendingUp} label="Delivered" value={delivered} tone="success" />
                  <Stat icon={MapPin} label="In transit" value={inTransit} tone="accent" />
                  <Stat icon={CreditCard} label="Revenue" value={`$${totalRevenue.toFixed(2)}`} tone="primary" />
                  <Stat icon={Users} label="Customers" value={profiles.length} tone="accent" />
                  <Stat icon={CreditCard} label="Unpaid" value={pendingPayments} tone="destructive" />
                  <Stat icon={Package} label="Contact msgs" value={contactCount} tone="primary" />
                </div>
                <Card className="mt-8 p-6">
                  <h3 className="font-display text-lg font-semibold">Recent shipments</h3>
                  <div className="mt-4 space-y-2">
                    {shipments.slice(0, 6).map((s) => (
                      <div key={s.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                        <div><span className="font-mono">{s.tracking_number}</span> · {s.recipient_name}</div>
                        <Badge>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {section === "shipments" && (
              <ShipmentsList list={filtered} search={search} setSearch={setSearch} reload={loadAll} />
            )}

            {section === "create" && <CreateShipment onDone={() => { loadAll(); setSection("shipments"); }} />}

            {section === "tracking" && <TrackingUpdates shipments={shipments} reload={loadAll} />}

            {section === "customers" && (
              <CustomersView profiles={profiles} userRoles={userRoles} reload={loadAll} />
            )}

            {section === "payments" && <PaymentsView shipments={shipments} reload={loadAll} />}

            {section === "receipts" && <ReceiptsView shipments={shipments} />}

            {section === "reports" && (
              <ReportsView shipments={shipments} totalRevenue={totalRevenue} delivered={delivered} inTransit={inTransit} />
            )}

            {section === "notifications" && <NotificationsView shipments={shipments} />}

            {section === "settings" && <SettingsView />}

            {section === "profile" && <ProfileView />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: number | string; tone: string }) {
  const bg = tone === "success" ? "bg-success/10 text-success" : tone === "accent" ? "bg-accent/10 text-accent" : tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${bg}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function ShipmentsList({ list, search, setSearch, reload }: { list: Shipment[]; search: string; setSearch: (v: string) => void; reload: () => void }) {
  const [editing, setEditing] = useState<Shipment | null>(null);

  async function deleteShipment(id: string) {
    if (!confirm("Delete this shipment?")) return;
    const { error } = await supabase.from("shipments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    reload();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by tracking #, sender, receiver…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Service</th><th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{s.tracking_number}</td>
                  <td className="px-4 py-3">{s.recipient_name}{s.recipient_city ? `, ${s.recipient_city}` : ""}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{s.service_type}</Badge></td>
                  <td className="px-4 py-3">${Number(s.shipping_fee ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge variant={s.payment_status === "paid" ? "default" : "outline"}>{s.payment_status}</Badge></td>
                  <td className="px-4 py-3"><Badge>{s.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                      <Link to="/receipt/$tn" params={{ tn: s.tracking_number }} target="_blank"><Button variant="ghost" size="sm">Receipt</Button></Link>
                      <Button variant="ghost" size="sm" onClick={() => deleteShipment(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No shipments.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <EditShipmentDialog shipment={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function EditShipmentDialog({ shipment, onClose, onSaved }: { shipment: Shipment; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    shipping_fee: String(shipment.shipping_fee ?? 0),
    amount_paid: String(shipment.amount_paid ?? 0),
    payment_status: shipment.payment_status,
    status: shipment.status,
    weight_kg: String(shipment.weight_kg ?? ""),
    dimensions: shipment.dimensions ?? "",
    package_type: shipment.package_type ?? "",
    package_description: shipment.package_description ?? "",
    shipping_method: shipment.shipping_method ?? "",
    courier_name: shipment.courier_name ?? "",
    sender_phone: shipment.sender_phone ?? "",
    recipient_phone: shipment.recipient_phone ?? "",
    admin_comments: shipment.admin_comments ?? "",
    estimated_delivery: shipment.estimated_delivery ? shipment.estimated_delivery.slice(0, 10) : "",
    current_lat: String(shipment.current_lat ?? ""),
    current_lng: String(shipment.current_lng ?? ""),
  });
  const [imageUrl, setImageUrl] = useState(shipment.parcel_image_url ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      shipping_fee: Number(f.shipping_fee) || 0,
      amount_paid: Number(f.amount_paid) || 0,
      payment_status: f.payment_status as "unpaid" | "paid" | "refunded",
      status: f.status as never,
      weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
      dimensions: f.dimensions || null,
      package_type: f.package_type || null,
      package_description: f.package_description || null,
      shipping_method: f.shipping_method || null,
      courier_name: f.courier_name || null,
      sender_phone: f.sender_phone || null,
      recipient_phone: f.recipient_phone || null,
      admin_comments: f.admin_comments || null,
      estimated_delivery: f.estimated_delivery || null,
      current_lat: f.current_lat ? Number(f.current_lat) : null,
      current_lng: f.current_lng ? Number(f.current_lng) : null,
      parcel_image_url: imageUrl || null,
    };
    const { error } = await supabase.from("shipments").update(payload as never).eq("id", shipment.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (f.status !== shipment.status) {
      await supabase.from("tracking_events").insert({ shipment_id: shipment.id, status: f.status as never, description: `Status updated to ${f.status.replace(/_/g, " ")}` });
    }
    toast.success("Saved");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Edit shipment · <span className="font-mono text-sm">{shipment.tracking_number}</span></h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><Label>Shipment fee ($)</Label><Input type="number" step="0.01" value={f.shipping_fee} onChange={(e) => setF({ ...f, shipping_fee: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Amount paid ($)</Label><Input type="number" step="0.01" value={f.amount_paid} onChange={(e) => setF({ ...f, amount_paid: e.target.value })} className="mt-1.5" /></div>
          <div>
            <Label>Payment status</Label>
            <Select value={f.payment_status} onValueChange={(v) => setF({ ...f, payment_status: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{["unpaid","paid","refunded"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x.replace(/_/g," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Estimated delivery</Label><Input type="date" value={f.estimated_delivery} onChange={(e) => setF({ ...f, estimated_delivery: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Shipping method</Label><Input placeholder="Air, Sea, Road…" value={f.shipping_method} onChange={(e) => setF({ ...f, shipping_method: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Weight (kg)</Label><Input type="number" step="0.01" value={f.weight_kg} onChange={(e) => setF({ ...f, weight_kg: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Dimensions</Label><Input placeholder="30x20x10 cm" value={f.dimensions} onChange={(e) => setF({ ...f, dimensions: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Package type</Label><Input placeholder="Box, envelope…" value={f.package_type} onChange={(e) => setF({ ...f, package_type: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Courier</Label><Input value={f.courier_name} onChange={(e) => setF({ ...f, courier_name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Sender phone</Label><Input value={f.sender_phone} onChange={(e) => setF({ ...f, sender_phone: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Recipient phone</Label><Input value={f.recipient_phone} onChange={(e) => setF({ ...f, recipient_phone: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Current lat</Label><Input type="number" step="0.000001" value={f.current_lat} onChange={(e) => setF({ ...f, current_lat: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Current lng</Label><Input type="number" step="0.000001" value={f.current_lng} onChange={(e) => setF({ ...f, current_lng: e.target.value })} className="mt-1.5" /></div>
          <div className="sm:col-span-2"><Label>Package description</Label><Textarea value={f.package_description} onChange={(e) => setF({ ...f, package_description: e.target.value })} className="mt-1.5" /></div>
          <div className="sm:col-span-2"><Label>Admin comments (shown on tracking page)</Label><Textarea value={f.admin_comments} onChange={(e) => setF({ ...f, admin_comments: e.target.value })} className="mt-1.5" /></div>
        </div>
        <div className="mt-6">
          <Label>Parcel image</Label>
          <ImageUploader shipmentId={shipment.id} value={imageUrl} onChange={setImageUrl} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save} className="gradient-brand text-white">{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </Card>
    </div>
  );
}


function ImageUploader({ shipmentId, value, onChange }: { shipmentId: string; value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${shipmentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("parcel-images").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("parcel-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  }

  return (
    <div className="mt-2 space-y-3">
      {value && (
        <div className="relative">
          <img src={value} alt="Parcel" className="max-h-64 rounded-lg border border-border object-contain" />
          <Button size="sm" variant="destructive" className="absolute right-2 top-2" onClick={() => onChange("")}>Remove</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="mr-2 h-4 w-4" /> Upload from device</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()} disabled={uploading}><Camera className="mr-2 h-4 w-4" /> Take photo</Button>
        {uploading && <span className="text-xs text-muted-foreground self-center">Uploading…</span>}
      </div>
    </div>
  );
}

function CreateShipment({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({
    sender_name: "", sender_address: "", sender_city: "", sender_country: "",
    recipient_name: "", recipient_address: "", recipient_city: "", recipient_country: "",
    service_type: "road", weight_kg: "1", dimensions: "", package_type: "Box",
    courier_name: "", shipping_fee: "0", payment_status: "unpaid", estimated_delivery: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tracking_number = "GL" + Math.floor(Math.random() * 9e11 + 1e11).toString();
    const { data: u } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("shipments").insert({
      tracking_number,
      user_id: u.user?.id ?? null,
      service_type: f.service_type as "air"|"sea"|"road"|"rail"|"express",
      sender_name: f.sender_name, sender_address: f.sender_address, sender_city: f.sender_city, sender_country: f.sender_country,
      recipient_name: f.recipient_name, recipient_address: f.recipient_address, recipient_city: f.recipient_city, recipient_country: f.recipient_country,
      weight_kg: Number(f.weight_kg) || null,
      dimensions: f.dimensions || null,
      package_type: f.package_type || null,
      courier_name: f.courier_name || null,
      shipping_fee: Number(f.shipping_fee) || 0,
      payment_status: f.payment_status as "unpaid" | "paid" | "refunded",
      estimated_delivery: f.estimated_delivery || null,
      notes: f.notes || null,
      status: "pending",
    }).select("id").single();
    if (error || !inserted) { setSaving(false); return toast.error(error?.message ?? "Failed"); }
    if (pendingImage) {
      const ext = pendingImage.name.split(".").pop() ?? "jpg";
      const path = `${inserted.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("parcel-images").upload(path, pendingImage, { contentType: pendingImage.type });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("parcel-images").getPublicUrl(path);
        await supabase.from("shipments").update({ parcel_image_url: pub.publicUrl }).eq("id", inserted.id);
      }
    }
    await supabase.from("tracking_events").insert({ shipment_id: inserted.id, status: "pending", description: "Shipment created" });
    setSaving(false);
    toast.success(`Created ${tracking_number}`);
    onDone();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="grid gap-4">
      <h1 className="font-display text-2xl font-bold">Create shipment</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sender</h3>
          <div className="mt-3 space-y-3">
            <div><Label>Name</Label><Input required value={f.sender_name} onChange={set("sender_name")} className="mt-1.5" /></div>
            <div><Label>Address</Label><Input required value={f.sender_address} onChange={set("sender_address")} className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>City</Label><Input value={f.sender_city} onChange={set("sender_city")} className="mt-1.5" /></div>
              <div><Label>Country</Label><Input value={f.sender_country} onChange={set("sender_country")} className="mt-1.5" /></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recipient</h3>
          <div className="mt-3 space-y-3">
            <div><Label>Name</Label><Input required value={f.recipient_name} onChange={set("recipient_name")} className="mt-1.5" /></div>
            <div><Label>Address</Label><Input required value={f.recipient_address} onChange={set("recipient_address")} className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>City</Label><Input value={f.recipient_city} onChange={set("recipient_city")} className="mt-1.5" /></div>
              <div><Label>Country</Label><Input value={f.recipient_country} onChange={set("recipient_country")} className="mt-1.5" /></div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Parcel & service</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Service</Label>
            <Select value={f.service_type} onValueChange={(v) => setF({ ...f, service_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{["air","sea","road","rail","express"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Package type</Label><Input value={f.package_type} onChange={set("package_type")} className="mt-1.5" /></div>
          <div><Label>Courier</Label><Input value={f.courier_name} onChange={set("courier_name")} className="mt-1.5" /></div>
          <div><Label>Weight (kg)</Label><Input type="number" step="0.01" value={f.weight_kg} onChange={set("weight_kg")} className="mt-1.5" /></div>
          <div><Label>Dimensions</Label><Input placeholder="30x20x10 cm" value={f.dimensions} onChange={set("dimensions")} className="mt-1.5" /></div>
          <div><Label>Estimated delivery</Label><Input type="date" value={f.estimated_delivery} onChange={set("estimated_delivery")} className="mt-1.5" /></div>
          <div><Label>Shipment fee ($)</Label><Input type="number" step="0.01" value={f.shipping_fee} onChange={set("shipping_fee")} className="mt-1.5" /></div>
          <div>
            <Label>Payment</Label>
            <Select value={f.payment_status} onValueChange={(v) => setF({ ...f, payment_status: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{["unpaid","paid","refunded"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3"><Label>Notes</Label><Textarea value={f.notes} onChange={set("notes")} className="mt-1.5" /></div>
        </div>
        <div className="mt-4">
          <Label>Parcel image</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input id="cf" type="file" accept="image/*" className="hidden" onChange={(e) => setPendingImage(e.target.files?.[0] ?? null)} />
            <input id="cc" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPendingImage(e.target.files?.[0] ?? null)} />
            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("cf")?.click()}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("cc")?.click()}><Camera className="mr-2 h-4 w-4" /> Take photo</Button>
            {pendingImage && <span className="text-xs text-muted-foreground self-center">{pendingImage.name}</span>}
          </div>
        </div>
      </Card>
      <Button type="submit" disabled={saving} className="gradient-brand text-white">{saving ? "Creating…" : "Create shipment"}</Button>
    </form>
  );
}

function TrackingUpdates({ shipments, reload }: { shipments: Shipment[]; reload: () => void }) {
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState("in_transit");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<{ id: string; status: string; location: string | null; description: string | null; event_time: string }[]>([]);

  useEffect(() => {
    if (!selected) return;
    supabase.from("tracking_events").select("*").eq("shipment_id", selected).order("event_time", { ascending: false }).then(({ data }) => setEvents((data ?? []) as typeof events));
  }, [selected]);

  async function add() {
    if (!selected) return toast.error("Pick a shipment");
    const s = status as never;
    const { error } = await supabase.from("tracking_events").insert({ shipment_id: selected, status: s, location: location || null, description: description || null });
    if (error) return toast.error(error.message);
    await supabase.from("shipments").update({ status: s }).eq("id", selected);
    toast.success("Tracking update added");
    setLocation(""); setDescription("");
    const { data } = await supabase.from("tracking_events").select("*").eq("shipment_id", selected).order("event_time", { ascending: false });
    setEvents((data ?? []) as typeof events);
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Tracking updates</h1>
      <Card className="mt-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Shipment</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{shipments.map((s) => <SelectItem key={s.id} value={s.id}>{s.tracking_number} — {s.recipient_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5" /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" /></div>
        </div>
        <Button onClick={add} className="mt-4 gradient-brand text-white">Add update</Button>
      </Card>
      {selected && (
        <Card className="mt-6 p-6">
          <h3 className="font-display text-lg font-semibold">Timeline</h3>
          <ol className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex justify-between text-sm">
                  <div><Badge className="mr-2">{e.status}</Badge>{e.location}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(e.event_time), "MMM d, yyyy HH:mm")}</div>
                </div>
                {e.description && <div className="mt-1 text-sm text-muted-foreground">{e.description}</div>}
              </li>
            ))}
            {events.length === 0 && <li className="text-sm text-muted-foreground">No events yet.</li>}
          </ol>
        </Card>
      )}
    </div>
  );
}

function CustomersView({ profiles, userRoles, reload }: { profiles: Profile[]; userRoles: Record<string, string>; reload: () => void }) {
  async function setUserRole(userId: string, newRole: "admin" | "user") {
    await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["admin","staff","user","customer"]);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    reload();
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Customers</h1>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Change</th></tr></thead>
          <tbody>
            {profiles.map((p) => {
              const r = userRoles[p.id] ?? "user";
              const isSuper = r === "super_admin";
              const label = isSuper ? "Super Admin" : r === "admin" ? "Admin" : "User";
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{p.email ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant={isSuper ? "default" : "outline"}>{label}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {isSuper ? <span className="text-xs text-muted-foreground">Protected</span> : (
                      <Select value={r === "admin" ? "admin" : "user"} onValueChange={(v) => setUserRole(p.id, v as "admin"|"user")}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PaymentsView({ shipments, reload }: { shipments: Shipment[]; reload: () => void }) {
  async function setPaid(id: string, s: string) {
    const { error } = await supabase.from("shipments").update({ payment_status: s as "unpaid" | "paid" | "refunded" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment updated"); reload();
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Payments</h1>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Set</th></tr></thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{s.tracking_number}</td>
                <td className="px-4 py-3">{s.recipient_name}</td>
                <td className="px-4 py-3">${Number(s.shipping_fee ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3"><Badge variant={s.payment_status === "paid" ? "default" : "outline"}>{s.payment_status}</Badge></td>
                <td className="px-4 py-3">
                  <Select value={s.payment_status} onValueChange={(v) => setPaid(s.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{["unpaid","paid","refunded"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ReceiptsView({ shipments }: { shipments: Shipment[] }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Receipts</h1>
      <p className="mt-2 text-sm text-muted-foreground">Open the printable receipt for any shipment.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shipments.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="font-mono text-sm">{s.tracking_number}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.recipient_name}</div>
            <div className="mt-1 text-sm">Fee: ${Number(s.shipping_fee ?? 0).toFixed(2)} · <span className="text-muted-foreground">{s.payment_status}</span></div>
            <Link to="/receipt/$tn" params={{ tn: s.tracking_number }} target="_blank">
              <Button size="sm" variant="outline" className="mt-3 w-full">Open receipt</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportsView({ shipments, totalRevenue, delivered, inTransit }: { shipments: Shipment[]; totalRevenue: number; delivered: number; inTransit: number }) {
  const byService: Record<string, number> = {};
  for (const s of shipments) byService[s.service_type] = (byService[s.service_type] ?? 0) + 1;
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="Total shipments" value={shipments.length} tone="primary" />
        <Stat icon={TrendingUp} label="Delivered" value={delivered} tone="success" />
        <Stat icon={MapPin} label="In transit" value={inTransit} tone="accent" />
        <Stat icon={CreditCard} label="Revenue" value={`$${totalRevenue.toFixed(2)}`} tone="primary" />
      </div>
      <Card className="mt-6 p-6">
        <h3 className="font-display text-lg font-semibold">By service type</h3>
        <div className="mt-4 space-y-2">
          {Object.entries(byService).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <div className="capitalize">{k}</div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full gradient-brand" style={{ width: `${(v / shipments.length) * 100}%` }} />
                </div>
                <div className="w-8 text-right font-mono">{v}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificationsView({ shipments }: { shipments: Shipment[] }) {
  const recent = shipments.slice(0, 12);
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Notifications</h1>
      <Card className="mt-6 divide-y divide-border">
        {recent.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div>Shipment <span className="font-mono">{s.tracking_number}</span> — <Badge className="ml-1">{s.status}</Badge></div>
              <div className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy HH:mm")}</div>
            </div>
          </div>
        ))}
        {recent.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nothing to show.</div>}
      </Card>
    </div>
  );
}

function SettingsView() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <Card className="mt-6 p-6 text-sm text-muted-foreground">
        Configure branding, notification preferences, and billing details. Reach out to support to customize enterprise settings.
      </Card>
    </div>
  );
}

function ProfileView() {
  const [profile, setProfile] = useState<{ email: string | null; full_name: string | null } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("email,full_name").eq("id", data.user.id).single();
      setProfile(p);
    });
  }, []);
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <Card className="mt-6 p-6 space-y-3 text-sm">
        <div><span className="text-muted-foreground">Name:</span> {profile?.full_name ?? "—"}</div>
        <div><span className="text-muted-foreground">Email:</span> {profile?.email ?? "—"}</div>
      </Card>
    </div>
  );
}
