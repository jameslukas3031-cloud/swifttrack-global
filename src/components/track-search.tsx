import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackSearch({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const [tn, setTn] = useState("");
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!tn.trim()) return;
    navigate({ to: "/track", search: { tn: tn.trim() } });
  }

  return (
    <form
      onSubmit={submit}
      className={
        variant === "hero"
          ? "flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl sm:flex-row"
          : "flex flex-col gap-2 sm:flex-row"
      }
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={tn}
          onChange={(e) => setTn(e.target.value)}
          placeholder="Enter tracking number (e.g. GL7842019283)"
          className="h-12 border-0 bg-white pl-10 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 gradient-brand text-white hover:opacity-90">
        Track
      </Button>
    </form>
  );
}
