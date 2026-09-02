import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "parcel-images";

/** Accepts either a raw storage path or a legacy public/signed URL and returns the storage path. */
export function toStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (!v.startsWith("http")) return v.replace(/^\/+/, "");
  const marker = `/${BUCKET}/`;
  const i = v.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(v.slice(i + marker.length).split("?")[0]);
}

export async function getParcelImageUrl(value: string | null | undefined): Promise<string | null> {
  const path = toStoragePath(value);
  if (!path) return null;
  try {
    const response = await fetch(`/api/public/parcel-image?path=${encodeURIComponent(path)}`);
    if (!response.ok) return null;
    const data = await response.json() as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

/** Resolves a stored parcel image reference to a temporary viewable URL. */
export function useParcelImage(value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!value);

  useEffect(() => {
    let active = true;
    if (!value) { setUrl(null); setLoading(false); return; }
    setLoading(true);
    getParcelImageUrl(value).then((u) => {
      if (!active) return;
      setUrl(u);
      setLoading(false);
    });
    return () => { active = false; };
  }, [value]);

  return { url, loading };
}
