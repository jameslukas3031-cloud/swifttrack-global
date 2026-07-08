export type ShipmentStatus =
  | "Shipment Created"
  | "Payment Confirmed"
  | "Package Collected"
  | "Processing"
  | "Sorting Facility"
  | "In Transit"
  | "Arrived at Hub"
  | "Customs Clearance"
  | "Out For Delivery"
  | "Delivered"
  | "Exception";

export interface TrackingEvent {
  status: ShipmentStatus;
  location: string;
  timestamp: string;
  note?: string;
}

export interface Shipment {
  trackingNumber: string;
  service: string;
  status: ShipmentStatus;
  progress: number;
  sender: { name: string; address: string; city: string; country: string };
  receiver: { name: string; address: string; city: string; country: string };
  package: { weight: string; dimensions: string; type: string; pieces: number };
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  currentLocation: { lat: number; lng: number; label: string };
  estimatedDelivery: string;
  shippedAt: string;
  events: TrackingEvent[];
}

const shipments: Record<string, Shipment> = {
  "GL7842019283": {
    trackingNumber: "GL7842019283",
    service: "Global Express — Air Freight",
    status: "Out For Delivery",
    progress: 85,
    sender: {
      name: "Meridian Trading Co.",
      address: "241 Harbor View Rd",
      city: "Singapore",
      country: "Singapore",
    },
    receiver: {
      name: "Nova Retail Group",
      address: "88 Fifth Avenue, Suite 1200",
      city: "New York",
      country: "United States",
    },
    package: { weight: "18.4 kg", dimensions: "60 × 42 × 35 cm", type: "Palletized Cargo", pieces: 3 },
    origin: { lat: 1.3521, lng: 103.8198, label: "Singapore SIN Hub" },
    destination: { lat: 40.7128, lng: -74.006, label: "New York JFK Hub" },
    currentLocation: { lat: 40.6413, lng: -73.7781, label: "JFK Distribution Center" },
    estimatedDelivery: "Today by 6:00 PM",
    shippedAt: "2026-07-02T09:14:00Z",
    events: [
      { status: "Shipment Created", location: "Singapore, SG", timestamp: "2026-07-02T09:14:00Z" },
      { status: "Package Collected", location: "Singapore, SG", timestamp: "2026-07-02T14:02:00Z" },
      { status: "Sorting Facility", location: "Singapore SIN Hub", timestamp: "2026-07-02T22:47:00Z" },
      { status: "In Transit", location: "Departed SIN → JFK", timestamp: "2026-07-03T04:10:00Z", note: "Flight GL-441" },
      { status: "Arrived at Hub", location: "New York JFK Hub", timestamp: "2026-07-07T18:33:00Z" },
      { status: "Customs Clearance", location: "JFK Customs", timestamp: "2026-07-08T02:15:00Z" },
      { status: "Out For Delivery", location: "JFK Distribution Center", timestamp: "2026-07-08T07:45:00Z", note: "With courier — vehicle NY-2298" },
    ],
  },
  "GL1029384756": {
    trackingNumber: "GL1029384756",
    service: "Sea Freight — Full Container Load",
    status: "In Transit",
    progress: 55,
    sender: { name: "Andes Coffee Exporters", address: "Km 12 Ruta 40", city: "Buenos Aires", country: "Argentina" },
    receiver: { name: "Nordic Roasters AS", address: "Havnegata 14", city: "Oslo", country: "Norway" },
    package: { weight: "24,000 kg", dimensions: "40ft HC container", type: "FCL", pieces: 1 },
    origin: { lat: -34.6037, lng: -58.3816, label: "Port of Buenos Aires" },
    destination: { lat: 59.9139, lng: 10.7522, label: "Port of Oslo" },
    currentLocation: { lat: 14.6928, lng: -30.5, label: "Mid-Atlantic — MV Nordika" },
    estimatedDelivery: "Jul 24, 2026",
    shippedAt: "2026-06-18T00:00:00Z",
    events: [
      { status: "Shipment Created", location: "Buenos Aires, AR", timestamp: "2026-06-15T10:00:00Z" },
      { status: "Package Collected", location: "Andes Warehouse", timestamp: "2026-06-16T13:20:00Z" },
      { status: "Processing", location: "Port of Buenos Aires", timestamp: "2026-06-17T09:00:00Z" },
      { status: "In Transit", location: "Departed BUE", timestamp: "2026-06-18T00:00:00Z", note: "Vessel MV Nordika, Voyage 118E" },
    ],
  },
  "GL5566778899": {
    trackingNumber: "GL5566778899",
    service: "Road Transport — Same Day",
    status: "Delivered",
    progress: 100,
    sender: { name: "Berlin Print Studio", address: "Karl-Marx-Allee 44", city: "Berlin", country: "Germany" },
    receiver: { name: "Franz Müller", address: "Maximilianstraße 8", city: "Munich", country: "Germany" },
    package: { weight: "2.1 kg", dimensions: "35 × 25 × 6 cm", type: "Document", pieces: 1 },
    origin: { lat: 52.52, lng: 13.405, label: "Berlin" },
    destination: { lat: 48.1351, lng: 11.582, label: "Munich" },
    currentLocation: { lat: 48.1351, lng: 11.582, label: "Delivered — Munich" },
    estimatedDelivery: "Delivered Jul 6, 2026 · 4:12 PM",
    shippedAt: "2026-07-06T08:00:00Z",
    events: [
      { status: "Shipment Created", location: "Berlin, DE", timestamp: "2026-07-06T08:00:00Z" },
      { status: "Package Collected", location: "Berlin Print Studio", timestamp: "2026-07-06T09:15:00Z" },
      { status: "In Transit", location: "A9 Autobahn", timestamp: "2026-07-06T11:00:00Z" },
      { status: "Out For Delivery", location: "Munich Depot", timestamp: "2026-07-06T15:20:00Z" },
      { status: "Delivered", location: "Maximilianstraße 8, Munich", timestamp: "2026-07-06T16:12:00Z", note: "Signed by F. Müller" },
    ],
  },
};

export function findShipment(tn: string): Shipment | undefined {
  return shipments[tn.trim().toUpperCase()];
}

export const demoTrackingNumbers = Object.keys(shipments);
