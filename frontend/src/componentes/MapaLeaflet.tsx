import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="#${color}" opacity="0.9"/>
      <circle cx="16" cy="15" r="7" fill="white" opacity="0.9"/>
      <text x="16" y="19" text-anchor="middle" font-size="11">${actividad.categoria.icono}</text>
    </svg>
  `;

  const icono = L.divIcon({
    html: svgIcon,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });

  return (
    <Marker position={[actividad.lat, actividad.lng]} icon={icono}>
      <Popup>
        <div style={{ minWidth: "180px" }}>
          <strong style={{ color: actividad.categoria.color }}>
            {actividad.categoria.icono} {actividad.nombre}
          </strong>
          <br />
          <small>{actividad.direccion}</small>
          <br />
          <small style={{ color: "gray" }}>{actividad.horarios}</small>
        </div>
      </Popup>
    </Marker>
  );
}

function AjusteZoom({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  if (bounds) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
  return null;
}

export default function MapaLeaflet({ actividades, centro, zoom = 14 }: Props) {
  // Centro default: Mataderos
  const centroDefinitivo: [number, number] = centro ?? [-34.6520, -58.5260];

  const bounds: LatLngBoundsExpression | null =
    actividades.length > 0
      ? actividades.map((a) => [a.lat, a.lng] as [number, number])
      : null;

  return (
    <div style={{ height: "520px", borderRadius: "var(--radio)", overflow: "hidden", border: "1px solid var(--borde)" }}>
      <MapContainer
        center={centroDefinitivo}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {actividades.map((a) => (
          <CreadorMarcadores key={a.id} actividad={a} />
        ))}
        {bounds && <AjusteZoom bounds={bounds} />}
      </MapContainer>
    </div>
  );
}

// Componente interno para crear marcadores individuales
function CreadorMarcadores({ actividad }: { actividad: Actividad }) {
  return <CreadorMarcador actividad={actividad} />;
}
