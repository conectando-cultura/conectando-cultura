import type { Actividad } from "../tipos";

interface Props {
  actividad: Actividad;
}

export default function ActividadCard({ actividad }: Props) {
  return (
    <article
      className="tarjeta"
      style={{ borderLeftColor: actividad.categoria.color }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
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
      </div>

      <h3>{actividad.nombre}</h3>
      <p style={{ marginBottom: "8px" }}>{actividad.descripcion}</p>

      <p style={{ fontSize: "0.88rem", color: "var(--gris)" }}>
        <strong>📍 {actividad.direccion}</strong>
      </p>
      <p style={{ fontSize: "0.88rem", color: "var(--gris)" }}>
        🕐 {actividad.horarios}
      </p>

      {actividad.url && (
        <a
          href={actividad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secundario"
          style={{ marginTop: "12px", padding: "6px 14px", fontSize: "0.85rem" }}
        >
          Visitar sitio →
        </a>
      )}
    </article>
  );
}
