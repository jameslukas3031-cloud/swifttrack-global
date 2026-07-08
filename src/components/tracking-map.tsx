import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Shipment } from "@/lib/mock-shipments";

// Fix default icon paths (Leaflet + bundlers)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const dot = (color: string) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) {
      map.fitBounds(points as L.LatLngBoundsExpression, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

export function TrackingMap({ shipment }: { shipment: Shipment }) {
  const { origin, destination, currentLocation } = shipment;
  const path: [number, number][] = [
    [origin.lat, origin.lng],
    [currentLocation.lat, currentLocation.lng],
    [destination.lat, destination.lng],
  ];

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border shadow-elevated">
      <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={3} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={path} pathOptions={{ color: "#e07a3c", weight: 3, dashArray: "8 8" }} />
        <Marker position={[origin.lat, origin.lng]} icon={dot("#1e2a5e")}>
          <Popup>Origin — {origin.label}</Popup>
        </Marker>
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={dot("#e07a3c")}>
          <Popup>Current — {currentLocation.label}</Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lng]} icon={dot("#2b8a5b")}>
          <Popup>Destination — {destination.label}</Popup>
        </Marker>
        <FitBounds points={path} />
      </MapContainer>
    </div>
  );
}
