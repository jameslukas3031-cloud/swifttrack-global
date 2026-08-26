import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from "lucide-react";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#e07a3c;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
}

export function ParcelLocationMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return (
    <div className="space-y-3">
      <div className="h-[320px] w-full overflow-hidden rounded-xl border border-border sm:h-[380px]">
        <MapContainer key={`${lat},${lng}`} center={[lat, lng]} zoom={8} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={pin}>
            <Popup>{label || "Current parcel location"}</Popup>
          </Marker>
          <Recenter lat={lat} lng={lng} />
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground transition hover:bg-secondary"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
        </a>
      </div>
    </div>
  );
}
