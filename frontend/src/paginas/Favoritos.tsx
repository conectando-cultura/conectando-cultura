import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerFavoritos, eliminarFavorito } from "../api/actividades";
import type { Actividad } from "../tipos";
import ActividadCard from "../componentes/ActividadCard";

export default function Favoritos() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("cc_token") ?? "";

  useEffect(() => {
    if (!token) return;
    setCargando(true);
    obtenerFavoritos(token)
      .then((data) => setActividades(data))
      .catch(() => setError("No se pudieron cargar tus actividades favoritas."))
      .finally(() => setCargando(false));
  }, [token]);

  async function handleToggleFavorito(actividadId: string) {
    try {
      await eliminarFavorito(token, actividadId);
      setActividades((prev) => prev.filter((a) => a.id !== actividadId));
    } catch {
      alert("No se pudo quitar de favoritos. Reintentá.");
    }
  }

  return (
    <div className="main">
      <div style={{ marginBottom: "28px" }}>
        <h1>❤️ Mis Actividades Favoritas</h1>
        <p style={{ color: "var(--gris)", marginTop: "8px" }}>
          Tu agenda cultural personal con los eventos y espacios guardados en Mataderos y alrededores.
        </p>
      </div>

      {cargando && <p className="cargando">Cargando tus actividades guardadas…</p>}
      {error && <div className="alerta alerta-error">{error}</div>}

      {!cargando && !error && actividades.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "var(--gris-claro)",
            borderRadius: "var(--radio)",
            border: "1px solid var(--borde)"
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "14px" }}>🤍</div>
          <h2 style={{ marginBottom: "10px" }}>Aún no guardaste actividades</h2>
          <p style={{ color: "var(--gris)", maxWidth: "420px", margin: "0 auto 20px" }}>
            Podés guardar peñas, ferias, talleres y museos haciendo clic en el corazón de cualquier actividad para tenerlos siempre a mano.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/actividades" className="btn btn-primario">
              Explorar actividades
            </Link>
            <Link to="/mapa" className="btn btn-secundario">
              Ver mapa
            </Link>
          </div>
        </div>
      )}

      {!cargando && !error && actividades.length > 0 && (
        <div className="grilla">
          {actividades.map((a) => (
            <ActividadCard
              key={a.id}
              actividad={a}
              esFavorito={true}
              onToggleFavorito={handleToggleFavorito}
            />
          ))}
        </div>
      )}
    </div>
  );
}
