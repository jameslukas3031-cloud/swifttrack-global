import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Meridian" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.info("Backend not connected yet — enable Lovable Cloud to activate accounts.");
    }, 600);
  }
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-14">
      <Link to="/" className="mx-auto flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-lg gradient-brand"><Package className="h-5 w-5 text-white" /></span>
        <span className="font-display text-xl font-bold">Meridian</span>
      </Link>
      <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-elevated">
        <h1 className="font-display text-2xl font-bold">Sign in to your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage shipments, invoices and addresses.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-brand text-white hover:opacity-90">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account? <a href="#" className="font-medium text-accent">Create one</a>
        </p>
      </div>
    </div>
  );
}
