import { Link, useNavigate } from "@tanstack/react-router";
import { Package, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/track", label: "Track" },
  { to: "/services", label: "Services" },
  { to: "/calculator", label: "Rates" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/support", label: "Support" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand shadow-glow">
            <Package className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">Meridian</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Global Logistics</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "text-foreground bg-secondary" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-secondary/60" }}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin"><LayoutDashboard className="mr-1.5 h-4 w-4" />Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />Sign out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button size="sm" className="gradient-brand text-white hover:opacity-90" asChild>
            <Link to="/track">Track shipment</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col p-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }}>Sign out</Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
              )}
              <Button size="sm" className="gradient-brand text-white" asChild>
                <Link to="/track">Track</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
