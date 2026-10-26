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
import { Navigation, ArrowRight } from "lucide-react";
import estilos from "./MapaLeaflet.module.css";

function truncarTexto(texto: string, limite = 100): string {
  if (texto.length <= limite) return texto;
  const sub = texto.slice(0, limite);
  const ultimoEspacio = sub.lastIndexOf(" ");
  return ultimoEspacio > 50 ? `${sub.slice(0, ultimoEspacio)}...` : `${sub}...`;
}

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
  const color = actividad.categoria.color || "#FF8F50";
  const simboloColor = colorSimbolo(color);
  const escala = seleccionado ? "scale(1.3)" : "scale(1)";

  const svgPaths = obtenerPathsSvgCategoria(
    actividad.categoria.icono,
    actividad.categoria.slug,
    actividad.categoria.nombre
  );

  // Pin de gota en SVG con el ícono vectorial representativo de la categoría y elevación Croquis
  const svgIcon = `
    <div style="transform: ${escala}; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); display: inline-flex; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25)); cursor: pointer;">
      <div style="
        width: 34px;
        height: 34px;
        background: ${color};
        border: 2.5px solid #FEFEFE;
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
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
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
        <div className="min-w-[220px] max-w-[270px] p-1 font-body text-brand-ink">
          <div className="mb-2 flex items-center justify-between gap-2">
            <CategoriaChip categoria={actividad.categoria} />
            <span className="font-sans text-xs font-semibold text-brand-orange">
              {actividad.barrio.nombre}
            </span>
          </div>
          <h3 className="mb-1.5 font-display text-lg leading-snug text-brand-gray">
            {actividad.nombre}
          </h3>
          <p className="mb-1 text-xs text-brand-muted">
            <strong className="font-semibold text-brand-gray">{actividad.direccion}</strong>
          </p>
          {actividad.horarios && (
            <p className="mb-2 text-xs text-brand-muted">
              {actividad.horarios}
            </p>
          )}
          {actividad.descripcion && (
            <p className="mb-3 text-xs leading-relaxed text-brand-gray line-clamp-3">
              {truncarTexto(actividad.descripcion, 100)}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Link
              to={detalleUrl}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-orange px-3 py-1.5 font-sans text-xs font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-orange-light hover:no-underline"
            >
              <span>Ver detalle</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <a
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Cómo llegar a ${actividad.nombre} en Google Maps`}
              className="inline-flex items-center justify-center rounded-full border border-brand-gray-light bg-brand-white p-1.5 text-brand-gray transition-colors hover:border-brand-orange hover:text-brand-orange hover:no-underline"
              title="Cómo llegar"
            >
              <Navigation size={14} aria-hidden="true" />
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

  const alturaEstilo = typeof altura === "number" ? `${altura}px` : altura;

  return (
    <div
      className={estilos.contenedorMapa}
      style={{ height: alturaEstilo }}
    >
      <MapContainer
        center={centroDefinitivo}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          {/* Capa principal */}
          <LayersControl.BaseLayer checked name="Callejero">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa satélite */}
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={["0", "1", "2", "3"]}
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Capa OpenStreetMap */}
          <LayersControl.BaseLayer name="OpenStreetMap">
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
