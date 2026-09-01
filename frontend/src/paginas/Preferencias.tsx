import { useEffect, useState } from "react";
import { useAuth } from "../contexto/AuthContext";
import { obtenerPreferencias, guardarPreferencias, obtenerBarrios, obtenerCategorias } from "../api/actividades";
import type { Barrio, Categoria } from "../tipos";

export default function Preferencias() {
  const { usuario } = useAuth();
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrioId, setBarrioId] = useState<string>("");
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem("cc_token") ?? "";

  useEffect(() => {
    Promise.all([obtenerBarrios(), obtenerCategorias()])
      .then(([b, c]) => {
        setBarrios(b);
        setCategorias(c);
      })
      .catch(() => {});

    if (!token) {
      setCargando(false);
      return;
    }

    obtenerPreferencias(token)
      .then((p) => {
        setBarrioId(p.barrioId ?? "");
        setSeleccionadas(new Set(p.categorias.map((c) => c.id)));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [token]);

  function toggleCategoria(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setGuardando(true);
    setMensaje(null);

    try {
      await guardarPreferencias(token, {
        barrioId: barrioId || null,
        categoriaIds: Array.from(seleccionadas)
      });
      setMensaje({ tipo: "ok", texto: "¡Preferencias guardadas correctamente!" });
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "No se pudieron guardar las preferencias."
      });
    } finally {
      setGuardando(false);
    }
  }

  if (!usuario) {
    return (
      <div className="main">
        <div className="alerta">
          Tenés que{" "}
          <a href="/login">iniciar sesión</a> para ver tus preferencias.
        </div>
      </div>
    );
  }

  if (cargando) {
    return <p className="cargando">Cargando tus preferencias…</p>;
  }

  return (
    <div className="main">
      <h1>⚙️ Mis Preferencias</h1>
      <p style={{ color: "var(--gris)", marginTop: "8px", marginBottom: "28px" }}>
        Elegí el barrio que más te interese y las categorías de actividades que querés
        seguir. Te avisaremos cuando haya novedades.
      </p>

      {mensaje && (
        <div className={`alerta ${mensaje.tipo === "ok" ? "alerta-exito" : "alerta-error"}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleGuardar}>
        {/* Barrio */}
        <div className="campo">
          <label htmlFor="barrio">Barrio de interés</label>
          <select
            id="barrio"
            value={barrioId}
            onChange={(e) => setBarrioId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid var(--borde)",
              borderRadius: "10px",
              fontFamily: "var(--tipografia-texto)",
              fontSize: "1rem"
            }}
          >
            <option value="">Todos los barrios</option>
            {barrios.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Categorías */}
        <div className="campo">
          <label>Categorías que te interesan</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "10px",
              marginTop: "8px"
            }}
          >
            {categorias.map((cat) => {
              const activa = seleccionadas.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategoria(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    border: `2px solid ${activa ? cat.color : "var(--borde)"}`,
                    borderRadius: "10px",
                    background: activa ? `${cat.color}18` : "var(--blanco)",
                    cursor: "pointer",
                    fontFamily: "var(--tipografia-texto)",
                    fontSize: "0.95rem",
                    fontWeight: activa ? 600 : 400,
                    color: activa ? cat.color : "var(--texto)",
                    transition: "all 0.15s ease",
                    textAlign: "left"
                  }}
                >
                  <span>{cat.icono}</span>
                  {cat.nombre}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--gris)", marginTop: "6px" }}>
            {seleccionadas.size === 0
              ? "No hay categorías seleccionadas. Seleccioná al menos una."
              : `${seleccionadas.size} categoría${seleccionadas.size > 1 ? "s" : ""} seleccionada${seleccionadas.size > 1 ? "s" : ""}.`}
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primario"
          disabled={guardando || seleccionadas.size === 0}
          style={{ marginTop: "8px" }}
        >
          {guardando ? "Guardando…" : "Guardar preferencias"}
        </button>
      </form>
    </div>
  );
}
