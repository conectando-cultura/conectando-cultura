import { useEffect } from "react";
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Actividad } from "../tipos";
import { colorSimbolo } from "../utiles/colorCategoria";
import { obtenerPathsSvgCategoria } from "../utiles/iconosSvg";
import CategoriaChip from "./CategoriaChip";
import { Link } from "react-router-dom";

// Fix para el ícono de Leaflet en Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

interface Props {
  actividades: Actividad[];
  centro?: [number, number];
  zoom?: number;
  actividadSeleccionadaId?: string | null;
  onSeleccionarActividad?: (actividad: Actividad) => void;
  altura?: string | number;
}

function CreadorMarcador({
  actividad,
  seleccionado = false,
  onSeleccionar
}: {
  actividad: Actividad;
  seleccionado?: boolean;
  onSeleccionar?: (actividad: Actividad) => void;
}) {
  const color = actividad.categoria.color || "#F98017";
  const simboloColor = colorSimbolo(color);
  const escala = seleccionado ? "scale(1.35)" : "scale(1)";

  const svgPaths = obtenerPathsSvgCategoria(
    actividad.categoria.icono,
    actividad.categoria.slug,
    actividad.categoria.nombre
  );

  // Pin de gota en SVG con el ícono vectorial representativo de la categoría
  const svgIcon = `
    <div style="transform: ${escala}; transition: transform 0.2s ease; display: inline-flex; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));">
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2.5px solid #FFFFFF;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
      ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="${simboloColor}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="transform: rotate(45deg); display: block;"
        >
          ${svgPaths}
        </svg>
      </div>
    </div>
  `;

  const icono = L.divIcon({
    html: svgIcon,
    className: "marcador-pin-categoria",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });

  const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${actividad.lat},${actividad.lng}`;
  const detalleUrl = `/actividades/${actividad.barrio.slug}/${actividad.slug}`;

  return (
    <Marker
      position={[actividad.lat, actividad.lng]}
      icon={icono}
      eventHandlers={{
        click: () => onSeleccionar?.(actividad)
      }}
    >
      <Popup>
        <div style={{ minWidth: "220px", maxWidth: "270px", padding: "4px", fontFamily: "var(--fuente-cuerpo)" }}>
          <div style={{ marginBottom: "8px" }}>
            <CategoriaChip categoria={actividad.categoria} />
          </div>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--tinta)"
            }}
          >
            {actividad.nombre}
          </h3>
          <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--texto-suave)" }}>
            <strong>{actividad.direccion}</strong> · {actividad.barrio.nombre}
          </p>
          {actividad.horarios && (
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--texto-suave)" }}>
              {actividad.horarios}
            </p>
          )}
          {actividad.descripcion && (
            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "13px",
                color: "var(--tinta)",
                lineHeight: "1.4"
              }}
            >
              {actividad.descripcion.length > 95
                ? `${actividad.descripcion.slice(0, 95)}...`
                : actividad.descripcion}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              to={detalleUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: "var(--radio-control)",
                background: "var(--boton-fondo)",
                color: "var(--boton-texto)",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                flex: 1
              }}
            >
              Ver detalle
            </Link>
            <a
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: "var(--radio-control)",
                border: "1px solid var(--linea)",
                background: "var(--blanco)",
                color: "var(--tinta)",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Cómo llegar
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function AjusteZoom({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

function Centrador({ destino }: { destino?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (destino) {
      map.flyTo(destino, Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [destino, map]);
  return null;
}

export default function MapaLeaflet({
  actividades,
  centro,
  zoom = 14,
  actividadSeleccionadaId,
  onSeleccionarActividad,
  altura = "100%"
}: Props) {
  // Centro geográfico de Mataderos
  const centroDefinitivo: [number, number] = centro ?? [-34.656, -58.504];

  const bounds: LatLngBoundsExpression | null =
    actividades.length > 0
      ? actividades.map((a) => [a.lat, a.lng] as [number, number])
      : null;

  const seleccionada = actividades.find((a) => a.id === actividadSeleccionadaId);
  const destinoCentrado: [number, number] | null = seleccionada
    ? [seleccionada.lat, seleccionada.lng]
    : null;

  return (
    <div
      style={{
        height: typeof altura === "number" ? `${altura}px` : altura,
        width: "100%",
        borderRadius: "var(--radio-tarjeta)",
        overflow: "hidden",
        border: "1px solid var(--linea)",
        position: "relative"
      }}
    >
      <MapContainer
        center={centroDefinitivo}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          {/* Capa principal */}
          <LayersControl.BaseLayer checked name="Google Maps (Calles)">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa satélite */}
          <LayersControl.BaseLayer name="Google Maps (Satélite)">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa OpenStreetMap */}
          <LayersControl.BaseLayer name="OpenStreetMap estándar">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {actividades.map((a) => (
          <CreadorMarcador
            key={a.id}
            actividad={a}
            seleccionado={a.id === actividadSeleccionadaId}
            onSeleccionar={onSeleccionarActividad}
          />
        ))}

        {destinoCentrado ? (
          <Centrador destino={destinoCentrado} />
        ) : (
          bounds && <AjusteZoom bounds={bounds} />
        )}
      </MapContainer>
    </div>
  );
}
