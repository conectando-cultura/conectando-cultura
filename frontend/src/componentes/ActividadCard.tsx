import { Link } from "react-router-dom";
import type { Actividad } from "../tipos";

interface Props {
  actividad: Actividad;
  esFavorito?: boolean;
  onToggleFavorito?: (actividadId: string) => void;
}

export default function ActividadCard({ actividad, esFavorito, onToggleFavorito }: Props) {
  const urlCompartirWa = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `¡Mirá esta actividad cultural en Mataderos! 🎭 "${actividad.nombre}" (${actividad.categoria.nombre}) en ${actividad.direccion}. Ficha completa: ${window.location.origin}/actividades/${actividad.id}`
  )}`;

  return (
    <article
      className="tarjeta"
      style={{ borderLeftColor: actividad.categoria.color, position: "relative" }}
    >
      {/* Botón de favorito flotante */}
      {onToggleFavorito && (
        <button
          type="button"
          onClick={() => onToggleFavorito(actividad.id)}
          title={esFavorito ? "Quitar de favoritos" : "Guardar en mis favoritos"}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            fontSize: "1.4rem",
            cursor: "pointer",
            filter: esFavorito ? "none" : "grayscale(100%) opacity(0.5)",
            transition: "transform 0.15s ease",
            padding: 0
          }}
        >
          ❤️
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap", paddingRight: onToggleFavorito ? "32px" : "0" }}>
        <span style={{ fontSize: "1.2rem" }}>{actividad.categoria.icono}</span>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: actividad.categoria.color,
            background: `${actividad.categoria.color}18`,
            padding: "2px 8px",
            borderRadius: "99px"
          }}
        >
          {actividad.categoria.nombre}
        </span>
        {actividad.destacado && (
          <span style={{ fontSize: "0.75rem", color: "var(--amarillo)", fontWeight: 700 }}>
            ★ Destacada
          </span>
        )}
        {actividad.distanciaKm !== undefined && (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#0369a1",
              background: "#e0f2fe",
              padding: "2px 8px",
              borderRadius: "99px"
            }}
          >
            📍 {actividad.distanciaKm < 1 ? `${Math.round(actividad.distanciaKm * 1000)} m` : `${actividad.distanciaKm.toFixed(1)} km`}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>{actividad.nombre}</h3>
      <p style={{ marginBottom: "8px", color: "var(--texto)", fontSize: "0.95rem" }}>{actividad.descripcion}</p>

      <p style={{ fontSize: "0.88rem", color: "var(--gris)" }}>
        <strong>📍 {actividad.direccion}</strong> ({actividad.barrio.nombre})
      </p>
      {actividad.horarios && (
        <p style={{ fontSize: "0.88rem", color: "var(--gris)" }}>
          🕐 {actividad.horarios}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <Link
          to={`/actividades/${actividad.id}`}
          className="btn btn-primario"
          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
        >
          Ver ficha técnica →
        </Link>
        <a
          href={urlCompartirWa}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secundario"
          style={{ padding: "6px 10px", fontSize: "0.85rem" }}
          title="Compartir por WhatsApp"
        >
          📲 Compartir
        </a>
        {actividad.url && (
          <a
            href={actividad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secundario"
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            Web ↗
          </a>
        )}
      </div>
    </article>
  );
}


