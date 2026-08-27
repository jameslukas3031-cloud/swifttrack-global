import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CONTACT_CHANNELS = ["contact_phone", "contact_email", "office_address", "office_hours"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export type SiteContact = Partial<Record<ContactChannel, { value: string; label: string | null }>>;

/** Reads the admin-managed contact details (phone, email, office address, hours). */
export function useSiteContact() {
  const [contact, setContact] = useState<SiteContact | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("support_settings")
      .select("channel,value,label,enabled")
      .in("channel", CONTACT_CHANNELS as unknown as string[])
      .eq("enabled", true)
      .then(({ data }) => {
        if (!active) return;
        const out: SiteContact = {};
        for (const r of data ?? []) {
          const v = (r.value ?? "").trim();
          if (v) out[r.channel as ContactChannel] = { value: v, label: r.label };
        }
        setContact(out);
      });
    return () => { active = false; };
  }, []);

  return contact;
}
