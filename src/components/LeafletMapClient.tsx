"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export type MapMarker = {
  lat: number;
  lng: number;
  label?: string;
};

// Fix default marker icon for leaflet in React
if (typeof window !== "undefined" && (L as any).Icon.Default) {
  (L as any).Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });
}

export function LeafletMapClient({
  markers = [],
  height = 400,
  zoom = 10,
  center = { lat: 13.7563, lng: 100.5018 },
}: {
  markers: MapMarker[];
  height?: number;
  zoom?: number;
  center?: { lat: number; lng: number };
}) {
  return (
    <div style={{ width: "100%", height, position: "relative", zIndex: 0 }}>
      <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]}>
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 