import { LayoutDashboard, Package, Search, History, Receipt, Bell, User, LifeBuoy, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export type UserSection =
  | "dashboard" | "shipments" | "track" | "history" | "receipts"
  | "notifications" | "profile" | "support";

const items: { id: UserSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "shipments", label: "My Shipments", icon: Package },
  { id: "track", label: "Track Shipment", icon: Search },
  { id: "history", label: "Shipment History", icon: History },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: User },
  { id: "support", label: "Support", icon: LifeBuoy },
];

export function UserSidebar({ active, onSelect }: { active: UserSection; onSelect: (s: UserSection) => void }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-brand"><Package className="h-4 w-4 text-white" /></span>
          <span className="font-display text-sm font-bold">My Account</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
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
