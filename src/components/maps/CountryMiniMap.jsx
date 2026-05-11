import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Jednoduchá mapa se středem na zeměpisné souřadnice země
function CountryMiniMap({ lat, lng, label }) {
  if (lat == null || lng == null) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}> Mapa</h3>
        <p style={{ color: "var(--muted)" }}>Pro tuto zemi nemám souřadnice.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}> Mapa</h3>

      <div
        style={{
          height: 280,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)"
        }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          {}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Marker position={[lat, lng]}>
            <Popup>{label || "Destinace"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default CountryMiniMap;