import { LayoutDashboard, Package, PlusSquare, Route as RouteIcon, Users, CreditCard, Receipt, BarChart3, Bell, Settings, User, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export type AdminSection =
  | "dashboard" | "shipments" | "create" | "tracking" | "customers"
  | "payments" | "clearance" | "receipts" | "reports" | "notifications" | "settings" | "profile";

const items: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "shipments", label: "Shipments", icon: Package },
  { id: "create", label: "Create Shipment", icon: PlusSquare },
  { id: "tracking", label: "Tracking Updates", icon: RouteIcon },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "clearance", label: "Customs Clearance", icon: ShieldAlert },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
];


export function AdminSidebar({ active, onSelect }: { active: AdminSection; onSelect: (s: AdminSection) => void }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-brand"><ShieldCheck className="h-4 w-4 text-white" /></span>
          <span className="font-display text-sm font-bold">Admin Console</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.id}>
                  <SidebarMenuButton isActive={active === it.id} onClick={() => onSelect(it.id)}>
                    <it.icon className="h-4 w-4" />
                    <span>{it.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
              <LogOut className="h-4 w-4" /><span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
