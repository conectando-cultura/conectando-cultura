import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerActividadPorId } from "../api/actividades";
import type { Actividad } from "../tipos";
import MapaLeaflet from "../componentes/MapaLeaflet";

export default function ActividadDetalle() {
  const { id } = useParams<{ id: string }>();
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setError(null);

    obtenerActividadPorId(id)
      .then((data) => setActividad(data))
      .catch(() => setError("No se pudo cargar la información de la actividad."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="main" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p className="cargando">Cargando ficha técnica de la actividad…</p>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="main" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="alerta alerta-error">
          {error || "La actividad solicitada no existe o no se encuentra disponible."}
        </div>
        <Link to="/actividades" className="btn btn-primario" style={{ marginTop: "20px", display: "inline-block" }}>
          ← Volver a actividades
        </Link>
      </div>
    );
  }

  const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${actividad.lat},${actividad.lng}`;

  return (
    <div className="main">
      {/* Navegación de migas de pan */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", fontSize: "0.9rem", color: "var(--gris)" }}>
        <Link to="/actividades" style={{ color: "var(--naranja)" }}>Actividades</Link>
        <span>/</span>
        <span style={{ color: "var(--texto)" }}>{actividad.nombre}</span>
      </div>

      {/* Cabecera de la ficha */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: `${actividad.categoria.color}22`,
              color: actividad.categoria.color,
              fontSize: "0.85rem",
              fontWeight: 700
            }}
          >
            {actividad.categoria.icono} {actividad.categoria.nombre}
          </span>

          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              background: "var(--gris-claro)",
              color: "var(--texto)",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1px solid var(--borde)"
            }}
          >
            📍 {actividad.barrio.nombre}
          </span>

          {actividad.destacado && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "#fef9c3",
                color: "#854d0e",
                fontSize: "0.85rem",
                fontWeight: 700
              }}
            >
              ★ Actividad Destacada
            </span>
          )}
        </div>

        <h1 style={{ fontSize: "2.2rem", color: "var(--texto)", marginBottom: "8px", lineHeight: "1.2" }}>
          {actividad.nombre}
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--gris)" }}>
          {actividad.direccion}, {actividad.barrio.nombre} — Ciudad Autónoma de Buenos Aires
        </p>
      </div>

      {/* Imagen destacada si existe */}
      {actividad.imagenUrl && (
        <div
          style={{
            width: "100%",
            maxHeight: "380px",
            borderRadius: "var(--radio)",
            overflow: "hidden",
            marginBottom: "28px",
            border: "1px solid var(--borde)"
          }}
        >
          <img
            src={actividad.imagenUrl}
            alt={actividad.nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Grilla con Ficha Técnica e Información */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {/* Bloque de Descripción y Detalles */}
        <div className="tarjeta" style={{ borderLeftColor: actividad.categoria.color }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "14px" }}>📖 Acerca de esta actividad</h2>
          <p style={{ color: "var(--texto)", lineHeight: "1.7", fontSize: "1rem", whiteSpace: "pre-line" }}>
            {actividad.descripcion || "Sin descripción disponible para esta actividad."}
          </p>

          <hr style={{ border: "none", borderTop: "1px solid var(--borde)", margin: "20px 0" }} />

          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--naranja)" }}>
            📋 Ficha Técnica
          </h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
            <li>
              <strong>📍 Dirección:</strong> {actividad.direccion}
            </li>
            <li>
              <strong>🏘️ Barrio:</strong> {actividad.barrio.nombre}
            </li>
            <li>
              <strong>🏷️ Categoría:</strong> {actividad.categoria.nombre}
            </li>
            <li>
              <strong>🕒 Horarios:</strong> {actividad.horarios || "Consultar antes de asistir"}
            </li>
          </ul>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
            <a
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primario"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              🚗 Cómo llegar con Google Maps
            </a>
            {actividad.url && (
              <a
                href={actividad.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secundario"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                🌐 Sitio web oficial
              </a>
            )}
          </div>
        </div>

        {/* Bloque de Mapa de Ubicación */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "1.3rem" }}>🗺️ Ubicación en el mapa</h2>
          <MapaLeaflet
            actividades={[actividad]}
            centro={[actividad.lat, actividad.lng]}
            zoom={16}
          />
          <p style={{ fontSize: "0.85rem", color: "var(--gris)", textAlign: "center" }}>
            Coordenadas: {actividad.lat.toFixed(5)}, {actividad.lng.toFixed(5)}
          </p>
        </div>
      </div>

      {/* Botones inferiores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--borde)", paddingTop: "20px" }}>
        <Link to="/actividades" className="btn btn-secundario">
          ← Volver a actividades
        </Link>
        <Link to="/mapa" className="btn btn-primario">
          Ver todas en el mapa →
        </Link>
      </div>
    </div>
  );
}
