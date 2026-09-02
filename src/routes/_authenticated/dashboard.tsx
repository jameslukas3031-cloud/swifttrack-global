import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar, type UserSection } from "@/components/user-sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, MapPin, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Shipment = {
  id: string; tracking_number: string; status: string; service_type: string;
  sender_name: string; recipient_name: string; recipient_city: string | null;
  shipping_fee: number | null; payment_status: string; parcel_image_url: string | null;
  estimated_delivery: string | null; created_at: string; delivered_at: string | null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<UserSection>("dashboard");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState<string>("User");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      setUserEmail(u.user.email ?? null);
      setUserId(u.user.id);
      const { data: rr } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (rr ?? []).map((r) => r.role as string);
      const best = roles.includes("super_admin") ? "Super Admin" : roles.includes("admin") ? "Admin" : "User";
      setRoleLabel(best);
       setIsAdmin(roles.includes("super_admin"));
      const { data } = await supabase.from("shipments").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false });
      setShipments((data ?? []) as Shipment[]);
      setLoading(false);
    })();
  }, [navigate]);

  const active = shipments.filter((s) => !["delivered","cancelled"].includes(s.status));
  const historyList = shipments.filter((s) => ["delivered","cancelled"].includes(s.status));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <UserSidebar active={section} onSelect={setSection} />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-border px-4">
            <SidebarTrigger />
            <div className="font-display text-sm font-semibold capitalize">{section}</div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={roleLabel === "User" ? "outline" : "default"}>{roleLabel}</Badge>
              {isAdmin && <Link to="/admin"><Button size="sm" variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> Admin panel</Button></Link>}
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            {loading && <div className="text-muted-foreground">Loading…</div>}
            {!loading && (
              <>
                {section === "dashboard" && (
                  <div>
                    <h1 className="font-display text-2xl font-bold">Welcome back{userEmail ? `, ${userEmail}` : ""}</h1>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Stat icon={Package} label="Total" value={shipments.length} />
                      <Stat icon={MapPin} label="Active" value={active.length} />
                      <Stat icon={CheckCircle2} label="Delivered" value={historyList.filter((s) => s.status === "delivered").length} />
                      <Stat icon={Clock} label="Pending payment" value={shipments.filter((s) => s.payment_status === "unpaid").length} />
                    </div>
                    <Card className="mt-8 p-6">
                      <h3 className="font-display text-lg font-semibold">Recent shipments</h3>
                      <ShipmentTable list={shipments.slice(0, 5)} />
                    </Card>
                  </div>
                )}
                {section === "shipments" && <div><h1 className="font-display text-2xl font-bold">My shipments</h1><Card className="mt-6 p-4"><ShipmentTable list={active} /></Card></div>}
                {section === "track" && <TrackForm />}
                {section === "history" && <div><h1 className="font-display text-2xl font-bold">Shipment history</h1><Card className="mt-6 p-4"><ShipmentTable list={historyList} /></Card></div>}
                {section === "receipts" && (
                  <div>
                    <h1 className="font-display text-2xl font-bold">Receipts</h1>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {shipments.map((s) => (
                        <Card key={s.id} className="p-4">
                          <div className="font-mono text-sm">{s.tracking_number}</div>
                          <div className="mt-1 text-sm text-muted-foreground">Fee ${Number(s.shipping_fee ?? 0).toFixed(2)} · {s.payment_status}</div>
                          <Link to="/receipt/$tn" params={{ tn: s.tracking_number }} target="_blank">
                            <Button size="sm" variant="outline" className="mt-3 w-full">Open receipt</Button>
                          </Link>
                        </Card>
                      ))}
                      {shipments.length === 0 && <div className="text-sm text-muted-foreground">No shipments yet.</div>}
                    </div>
                  </div>
                )}
                {section === "notifications" && (
                  <div><h1 className="font-display text-2xl font-bold">Notifications</h1>
                    <Card className="mt-6 divide-y divide-border">
                      {shipments.slice(0, 10).map((s) => (
                        <div key={s.id} className="p-4 text-sm">
                          <div>Shipment <span className="font-mono">{s.tracking_number}</span> — <Badge className="ml-1">{s.status}</Badge></div>
                          <div className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy HH:mm")}</div>
                        </div>
                      ))}
                      {shipments.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nothing yet.</div>}
                    </Card>
                  </div>
                )}
                {section === "profile" && userId && <ProfileEdit userId={userId} />}
                {section === "support" && (
                  <div><h1 className="font-display text-2xl font-bold">Support</h1>
                    <Card className="mt-6 p-6 space-y-2 text-sm">
                      <p>Need help? Contact our team.</p>
                      <p><a href="mailto:support@meridian.example" className="underline">support@meridian.example</a></p>
                      <Link to="/contact" className="underline">Open contact form</Link>
                    </Card>
                  </div>
                )}
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function ShipmentTable({ list }: { list: Shipment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr><th className="px-2 py-2">Tracking</th><th className="px-2 py-2">Recipient</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Fee</th><th className="px-2 py-2">Payment</th><th className="px-2 py-2"></th></tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-2 py-2 font-mono text-xs">{s.tracking_number}</td>
              <td className="px-2 py-2">{s.recipient_name}{s.recipient_city ? `, ${s.recipient_city}` : ""}</td>
              <td className="px-2 py-2"><Badge>{s.status}</Badge></td>
              <td className="px-2 py-2">${Number(s.shipping_fee ?? 0).toFixed(2)}</td>
              <td className="px-2 py-2"><Badge variant={s.payment_status === "paid" ? "default" : "outline"}>{s.payment_status}</Badge></td>
              <td className="px-2 py-2 text-right">
                <Link to="/track" search={{ tn: s.tracking_number }}><Button size="sm" variant="ghost">Track</Button></Link>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">No shipments.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function TrackForm() {
  const [tn, setTn] = useState("");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Track shipment</h1>
      <Card className="mt-6 p-6 max-w-lg">
        <Label>Tracking number</Label>
        <Input value={tn} onChange={(e) => setTn(e.target.value)} placeholder="GL…" className="mt-1.5" />
        <Link to="/track" search={{ tn }}><Button className="mt-3 gradient-brand text-white">Track</Button></Link>
      </Card>
    </div>
  );
}

function ProfileEdit({ userId }: { userId: string }) {
  const [full_name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).single().then(({ data }) => {
      if (data) { setName(data.full_name ?? ""); setPhone(data.phone ?? ""); setEmail(data.email ?? ""); }
    });
  }, [userId]);
  async function save() {
    const { error } = await supabase.from("profiles").update({ full_name, phone }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <Card className="mt-6 p-6 max-w-lg space-y-3">
        <div><Label>Email</Label><Input value={email} disabled className="mt-1.5" /></div>
        <div><Label>Full name</Label><Input value={full_name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" /></div>
        <Button onClick={save} className="gradient-brand text-white">Save</Button>
      </Card>
    </div>
  );
}
