import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Actividad } from "../tipos";

// Fix para el ícono de Leaflet en Vite
import L from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

interface Props {
  actividades: Actividad[];
  centro?: [number, number];
  zoom?: number;
}

function CreadorMarcador({ actividad }: { actividad: Actividad }) {
  const color = actividad.categoria.color.replace("#", "");
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M17 0C7.61 0 0 7.61 0 17c0 11.2 17 27 17 27s17-15.8 17-27C34 7.61 26.39 0 17 0z" fill="#${color}" filter="url(#s)"/>
      <circle cx="17" cy="16" r="9" fill="#ffffff"/>
      <text x="17" y="21" text-anchor="middle" font-size="12">${actividad.categoria.icono}</text>
    </svg>
  `;

  const icono = L.divIcon({
    html: svgIcon,
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42]
  });

  const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${actividad.lat},${actividad.lng}`;

  return (
    <Marker position={[actividad.lat, actividad.lng]} icon={icono}>
      <Popup>
        <div style={{ minWidth: "220px", maxWidth: "260px", padding: "4px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 8px",
              borderRadius: "12px",
              background: `${actividad.categoria.color}22`,
              color: actividad.categoria.color,
              fontSize: "0.75rem",
              fontWeight: 700,
              marginBottom: "6px"
            }}
          >
            {actividad.categoria.icono} {actividad.categoria.nombre}
          </div>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--texto, #1e293b)"
            }}
          >
            {actividad.nombre}
          </h3>
          <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#475569" }}>
            📍 <strong>{actividad.direccion}</strong> ({actividad.barrio.nombre})
          </p>
          {actividad.horarios && (
            <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#64748b" }}>
              🕒 {actividad.horarios}
            </p>
          )}
          {actividad.descripcion && (
            <p
              style={{
                margin: "0 0 10px 0",
                fontSize: "0.8rem",
                color: "#334155",
                lineHeight: "1.3"
              }}
            >
              {actividad.descripcion.length > 110
                ? `${actividad.descripcion.slice(0, 110)}...`
                : actividad.descripcion}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <a
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "6px",
                background: "var(--naranja, #F98017)",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
                flex: 1
              }}
            >
              🚗 Cómo llegar
            </a>
            {actividad.url && (
              <a
                href={actividad.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#334155",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center"
                }}
              >
                🌐 Web
              </a>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function AjusteZoom({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  if (bounds) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }
  return null;
}

export default function MapaLeaflet({ actividades, centro, zoom = 14 }: Props) {
  // Centro geográfico real de Mataderos: Alberdi y Directorio / Lisandro de la Torre
  const centroDefinitivo: [number, number] = centro ?? [-34.656, -58.504];

  const bounds: LatLngBoundsExpression | null =
    actividades.length > 0
      ? actividades.map((a) => [a.lat, a.lng] as [number, number])
      : null;

  return (
    <div
      style={{
        height: "560px",
        borderRadius: "var(--radio)",
        overflow: "hidden",
        border: "1px solid var(--borde)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
      }}
    >
      <MapContainer
        center={centroDefinitivo}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          {/* Capa principal: Google Maps Roadmap con calles reales, negocios y detalles */}
          <LayersControl.BaseLayer checked name="🗺️ Google Maps (Calles y Comercios)">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa satélite: Google Maps Híbrido con fotos aéreas y nombres de calles */}
          <LayersControl.BaseLayer name="🛰️ Google Maps (Satélite e Híbrido)">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa alternativa: OpenStreetMap */}
          <LayersControl.BaseLayer name="🌐 OpenStreetMap Estándar">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {actividades.map((a) => (
          <CreadorMarcador key={a.id} actividad={a} />
        ))}
        {bounds && <AjusteZoom bounds={bounds} />}
      </MapContainer>
    </div>
  );
}
