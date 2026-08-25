import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#e07a3c;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function ParcelLocationMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return (
    <div className="h-[320px] w-full overflow-hidden rounded-xl border border-border sm:h-[380px]">
      <MapContainer center={[lat, lng]} zoom={8} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pin}>
          <Popup>{label || "Current parcel location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
