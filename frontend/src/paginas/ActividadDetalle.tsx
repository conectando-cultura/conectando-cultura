import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  obtenerActividadPorId,
  obtenerIdsFavoritos,
  agregarFavorito,
  eliminarFavorito,
  obtenerResenasActividad,
  publicarResena
} from "../api/actividades";
import type { Actividad, Resena } from "../tipos";
import { useAuth } from "../contexto/AuthContext";
import MapaLeaflet from "../componentes/MapaLeaflet";

export default function ActividadDetalle() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const token = localStorage.getItem("cc_token") ?? "";

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favoritos
  const [esFavorito, setEsFavorito] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  // Reseñas
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [promedioResenas, setPromedioResenas] = useState(0);
  const [totalResenas, setTotalResenas] = useState(0);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [mensajeResena, setMensajeResena] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setError(null);

    const favsPromise: Promise<string[]> = token
      ? obtenerIdsFavoritos(token).catch(() => [])
      : Promise.resolve([]);

    Promise.all([
      obtenerActividadPorId(id),
      obtenerResenasActividad(id).catch(() => ({ resenas: [], promedio: 0, total: 0 })),
      favsPromise
    ])
      .then(([actData, resenasData, favIds]) => {
        setActividad(actData);
        setResenas(resenasData.resenas ?? []);
        setPromedioResenas(resenasData.promedio ?? 0);
        setTotalResenas(resenasData.total ?? 0);
        if (favIds.includes(id)) {
          setEsFavorito(true);
        }
      })
      .catch(() => setError("No se pudo cargar la información de la actividad."))
      .finally(() => setCargando(false));
  }, [id, token]);

  async function handleToggleFavorito() {
    if (!id) return;
    if (!usuario) {
      alert("Iniciá sesión para guardar actividades en tus favoritos.");
      return;
    }
    setGuardandoFavorito(true);
    try {
      if (esFavorito) {
        await eliminarFavorito(token, id);
        setEsFavorito(false);
      } else {
        await agregarFavorito(token, id);
        setEsFavorito(true);
      }
    } catch {
      alert("No se pudo actualizar favoritos. Reintentá.");
    } finally {
      setGuardandoFavorito(false);
    }
  }

  async function handleEnviarResena(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!comentario.trim()) {
      setMensajeResena({ tipo: "error", texto: "Por favor escribí un comentario." });
      return;
    }

    setEnviandoResena(true);
    setMensajeResena(null);

    try {
      const res = await publicarResena(token, id, calificacion, comentario.trim());
      setResenas((prev) => [res.resena, ...prev]);
      setTotalResenas((prev) => prev + 1);
      setComentario("");
      setMensajeResena({ tipo: "ok", texto: "¡Tu reseña comunitaria fue publicada!" });
    } catch (err) {
      setMensajeResena({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error al publicar reseña."
      });
    } finally {
      setEnviandoResena(false);
    }
  }

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
  const urlCompartirWa = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `¡Mirá esta actividad cultural en Mataderos! 🎭 "${actividad.nombre}" en ${actividad.direccion}. Ficha completa: ${window.location.href}`
  )}`;
  const urlCalendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    actividad.nombre
  )}&details=${encodeURIComponent(actividad.descripcion)}&location=${encodeURIComponent(
    actividad.direccion + ", Mataderos, CABA"
  )}`;

  return (
    <div className="main">
      {/* Navegación de migas de pan */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", fontSize: "0.9rem", color: "var(--gris)" }}>
        <Link to="/actividades" style={{ color: "var(--naranja)" }}>Actividades</Link>
        <span>/</span>
        <span style={{ color: "var(--texto)" }}>{actividad.nombre}</span>
      </div>

      {/* Cabecera de la ficha */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
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

            {totalResenas > 0 && (
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  background: "#fef08a",
                  color: "#713f12",
                  fontSize: "0.85rem",
                  fontWeight: 700
                }}
              >
                ⭐ {promedioResenas} ({totalResenas} {totalResenas === 1 ? "opinión" : "opiniones"})
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

        {/* Acciones Rápidas */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secundario"
            disabled={guardandoFavorito}
            onClick={handleToggleFavorito}
            style={{
              padding: "10px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderColor: esFavorito ? "var(--naranja)" : "var(--borde)",
              color: esFavorito ? "var(--naranja)" : "var(--texto)"
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{esFavorito ? "❤️" : "🤍"}</span>
            {esFavorito ? "En favoritos" : "Guardar favorito"}
          </button>

          <a
            href={urlCompartirWa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secundario"
            style={{ padding: "10px 16px", display: "inline-flex", alignItems: "center", gap: "8px" }}
            title="Compartir por WhatsApp"
          >
            <span>📲</span> Compartir
          </a>
        </div>
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
            📋 Ficha Técnica y Agenda
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
              <strong>🕒 Horarios habituales:</strong> {actividad.horarios || "Consultar antes de asistir"}
            </li>
            {actividad.fechaInicio && (
              <li>
                <strong>📅 Próxima fecha:</strong> {actividad.fechaInicio} {actividad.fechaFin ? `al ${actividad.fechaFin}` : ""}
              </li>
            )}
          </ul>

          <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
            <a
              href={urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primario"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              🚗 Cómo llegar
            </a>
            <a
              href={urlCalendar}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secundario"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              📅 Agregar al Calendario
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

      {/* Sección Comunitaria: Reseñas y Calificaciones */}
      <div style={{ marginTop: "40px", borderTop: "2px solid var(--borde)", paddingTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem" }}>💬 Reseñas y Opiniones Comunitarias</h2>
            <p style={{ color: "var(--gris)", fontSize: "0.95rem", marginTop: "4px" }}>
              Leé las experiencias de los vecinos de Mataderos y sumá tu recomendación.
            </p>
          </div>
          {totalResenas > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--naranja)" }}>{promedioResenas}</span>
              <div style={{ fontSize: "0.85rem", color: "var(--gris)" }}>
                <div>{"★".repeat(Math.round(promedioResenas))}{"☆".repeat(5 - Math.round(promedioResenas))}</div>
                <div>{totalResenas} {totalResenas === 1 ? "opinión" : "opiniones"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario para agregar reseña */}
        <div className="tarjeta" style={{ marginBottom: "28px", background: "var(--gris-claro)" }}>
          {usuario ? (
            <form onSubmit={handleEnviarResena}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>
                Dejá tu calificación y comentario como {usuario.nombre}
              </h3>

              {mensajeResena && (
                <div className={`alerta ${mensajeResena.tipo === "ok" ? "alerta-exito" : "alerta-error"}`} style={{ marginBottom: "14px" }}>
                  {mensajeResena.texto}
                </div>
              )}

              <div className="campo" style={{ marginBottom: "12px" }}>
                <label>Calificación:</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalificacion(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.6rem",
                        color: star <= calificacion ? "#f59e0b" : "#cbd5e1",
                        padding: 0
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ marginLeft: "8px", fontWeight: 600, fontSize: "0.9rem", color: "var(--gris)" }}>
                    {calificacion} de 5 estrellas
                  </span>
                </div>
              </div>

              <div className="campo">
                <label>Comentario o Recomendación:</label>
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="¿Cómo fue tu experiencia? ¿Qué recomendás a otros vecinos?"
                  required
                  maxLength={1000}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primario"
                disabled={enviandoResena}
                style={{ padding: "8px 20px", fontSize: "0.9rem" }}
              >
                {enviandoResena ? "Publicando…" : "Publicar reseña"}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "16px" }}>
              <p style={{ color: "var(--texto)", marginBottom: "12px" }}>
                ¿Querés dejar una reseña para esta actividad?
              </p>
              <Link to="/login" className="btn btn-primario" style={{ fontSize: "0.9rem" }}>
                Iniciá sesión para opinar
              </Link>
            </div>
          )}
        </div>

        {/* Listado de reseñas */}
        {resenas.length === 0 ? (
          <p style={{ color: "var(--gris)", textAlign: "center", padding: "20px 0" }}>
            Aún no hay reseñas para esta actividad. ¡Sé el primer vecino en comentar!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {resenas.map((r) => (
              <div key={r.id} className="tarjeta" style={{ background: "var(--blanco)", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong>{r.usuarioNombre}</strong>
                    <span style={{ color: "#f59e0b", fontSize: "0.95rem" }}>
                      {"★".repeat(r.calificacion)}{"☆".repeat(5 - r.calificacion)}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--gris)" }}>
                    {new Date(r.creadoEn).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: "var(--texto)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  {r.comentario}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones inferiores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--borde)", marginTop: "40px", paddingTop: "20px" }}>
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
