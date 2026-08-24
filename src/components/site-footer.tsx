import { Link } from "@tanstack/react-router";
import { Package, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand">
                <Package className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-lg font-bold">Meridian Global Logistics</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Moving 4.2 million shipments a day across 220 countries. Air, sea, road & rail — one platform.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/services" className="hover:text-foreground">Air Freight</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Sea Freight</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Road Transport</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Warehousing</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Customs Clearance</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/about" className="hover:text-foreground">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/support" className="hover:text-foreground">Support</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Tools</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/track" className="hover:text-foreground">Track a shipment</Link></li>
              <li><Link to="/calculator" className="hover:text-foreground">Rate calculator</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Business account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Meridian Global Logistics. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
