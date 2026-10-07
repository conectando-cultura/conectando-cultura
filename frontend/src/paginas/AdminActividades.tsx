import { useEffect, useState } from "react";
import type { Actividad, Barrio, Categoria } from "../tipos";
import { api, ErrorApi } from "../api/client";
import { Pencil, Trash2, MapPin } from "lucide-react";

interface ActividadAdmin extends Actividad {
  activo: boolean;
}

interface FormData {
  nombre: string;
  descripcion: string;
  horarios: string;
  direccion: string;
  lat: string;
  lng: string;
  url: string;
  imagenUrl: string;
  categoriaId: string;
  barrioId: string;
  destacado: boolean;
}

const FORM_VACIO = (): FormData => ({
  nombre: "", descripcion: "", horarios: "", direccion: "",
  lat: "-34.653", lng: "-58.517", url: "", imagenUrl: "",
  categoriaId: "", barrioId: "", destacado: false
});

export default function AdminActividades() {
  const [actividades, setActividades] = useState<ActividadAdmin[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<{ modo: "crear" | "editar"; datos?: ActividadAdmin } | null>(null);
  const [form, setForm] = useState<FormData>(FORM_VACIO());
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [filtro, setFiltro] = useState<"" | "activos" | "inactivos">("");

  const token = localStorage.getItem("cc_token") ?? "";

  useEffect(() => {
    // El listado completo (incluye inactivas) es una ruta protegida:
    // requiere token de admin. Barrios y categorías son públicos.
    Promise.all([
      api<{ actividades: ActividadAdmin[] }>("/actividades/admin/todas", {}, token)
        .catch(() => ({ actividades: [] })),
      api<{ barrios: Barrio[] }>("/actividades/barrios").catch(() => ({ barrios: [] })),
      api<{ categorias: Categoria[] }>("/actividades/categorias").catch(() => ({ categorias: [] }))
    ]).then(([a, b, c]) => {
      setActividades(a.actividades ?? []);
      setBarrios(b.barrios ?? []);
      setCategorias(c.categorias ?? []);
    }).finally(() => setCargando(false));
  }, [token]);

  function abrirCrear() {
    setForm(FORM_VACIO());
    setModal({ modo: "crear" });
  }

  function abrirEditar(a: ActividadAdmin) {
    setForm({
      nombre: a.nombre,
      descripcion: a.descripcion,
      horarios: a.horarios,
      direccion: a.direccion,
      lat: String(a.lat),
      lng: String(a.lng),
      url: a.url,
      imagenUrl: a.imagenUrl,
      categoriaId: a.categoria.id,
      barrioId: a.barrio.id,
      destacado: a.destacado
    });
    setModal({ modo: "editar", datos: a });
  }

  function cerrarModal() {
    setModal(null);
    setForm(FORM_VACIO());
    setMensaje(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.descripcion || !form.direccion) {
      setMensaje({ tipo: "error", texto: "Completá los campos obligatorios." });
      return;
    }
    setGuardando(true);
    setMensaje(null);

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      horarios: form.horarios,
      direccion: form.direccion,
      lat: parseFloat(form.lat) || -34.653,
      lng: parseFloat(form.lng) || -58.517,
      url: form.url,
      imagenUrl: form.imagenUrl,
      categoriaId: form.categoriaId,
      barrioId: form.barrioId,
      destacado: form.destacado
    };

    try {
      if (modal?.modo === "crear") {
        await api<{ actividad: ActividadAdmin }>("/actividades", { method: "POST", body: JSON.stringify(payload) }, token);
        setMensaje({ tipo: "ok", texto: "Actividad creada correctamente." });
      } else {
        await api<{ actividad: ActividadAdmin }>(`/actividades/${modal!.datos!.id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
        setMensaje({ tipo: "ok", texto: "Actividad actualizada." });
      }
      // Recargar lista
      const { actividades: actActualizada } = await api<{ actividades: ActividadAdmin[] }>(
        "/actividades/admin/todas",
        {},
        token
      );
      setActividades(actActualizada);
      setTimeout(cerrarModal, 1200);
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof ErrorApi ? err.message : "Ocurrió un error." });
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(a: ActividadAdmin) {
    if (!confirm(`¿Eliminar "${a.nombre}"? Esta acción es reversible.`)) return;
    try {
      await api(`/actividades/${a.id}`, { method: "DELETE" }, token);
      setActividades((prev) => prev.map((x) => x.id === a.id ? { ...x, activo: false } : x));
      setMensaje({ tipo: "ok", texto: "Actividad desactivada." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof ErrorApi ? err.message : "No se pudo eliminar." });
    }
  }

  const filtradas = actividades.filter((a) => {
    if (filtro === "activos") return a.activo;
    if (filtro === "inactivos") return !a.activo;
    return true;
  });

  if (cargando) return <p className="cargando">Cargando panel de administración…</p>;

  return (
    <div className="main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1>Gestión de Actividades</h1>
        <button className="btn btn-primario" onClick={abrirCrear}>
          + Nueva actividad
        </button>
      </div>

      {mensaje && (
        <div className={`alerta ${mensaje.tipo === "ok" ? "alerta-exito" : "alerta-error"}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtro */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        {(["", "activos", "inactivos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: `2px solid ${filtro === f ? "var(--naranja)" : "var(--borde)"}`,
              background: filtro === f ? "var(--naranja)" : "var(--blanco)",
              color: filtro === f ? "var(--blanco)" : "var(--texto)",
              cursor: "pointer",
              fontWeight: filtro === f ? 600 : 400
            }}
          >
            {f === "" ? "Todas" : f === "activos" ? "Activas" : "Inactivas"}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--borde)" }}>
              <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--gris)", fontWeight: 600 }}>Nombre</th>
              <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--gris)", fontWeight: 600 }}>Categoría</th>
              <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--gris)", fontWeight: 600 }}>Barrio</th>
              <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--gris)", fontWeight: 600 }}>Estado</th>
              <th style={{ textAlign: "right", padding: "10px 8px", color: "var(--gris)", fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--gris)" }}>
                  No hay actividades para mostrar.
                </td>
              </tr>
            )}
            {filtradas.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--borde)", opacity: a.activo ? 1 : 0.5 }}>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontWeight: 600 }}>{a.nombre}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--gris)" }}>{a.direccion}</div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ background: a.categoria.color + "22", color: a.categoria.color, padding: "3px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
                    {a.categoria.icono} {a.categoria.nombre}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", color: "var(--gris)" }}>{a.barrio.nombre}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ color: a.activo ? "#16a34a" : "#dc2626", fontWeight: 600, fontSize: "0.88rem" }}>
                    {a.activo ? "● Activa" : "○ Inactiva"}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <button onClick={() => abrirEditar(a)} style={{ marginRight: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--tinta)" }} title="Editar" aria-label="Editar">
                    <Pencil size={18} />
                  </button>
                  {a.activo && (
                    <button onClick={() => handleEliminar(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--peligro)" }} title="Desactivar" aria-label="Desactivar">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "16px"
        }} onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div style={{
            background: "var(--blanco)", borderRadius: "16px", padding: "28px",
            width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto"
          }}>
            <h2 style={{ marginBottom: "20px" }}>
              {modal.modo === "crear" ? "Nueva actividad" : `Editar: ${modal.datos?.nombre}`}
            </h2>

            {mensaje && (
              <div className={`alerta ${mensaje.tipo === "ok" ? "alerta-exito" : "alerta-error"}`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="campo">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Feria de Mataderos" required />
              </div>
              <div className="campo">
                <label>Descripción *</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Describe la actividad…" required />
              </div>
              <div className="campo" style={{ position: "relative" }}>
                <label>Dirección *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Ej: Av. Directorio 5051, Mataderos"
                    style={{ flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    title="Obtener coordenadas automáticamente"
                    onClick={async () => {
                      if (!form.direccion) return;
                      setMensaje({ tipo: "error", texto: "Buscando coordenadas…" });
                      try {
                        const res = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.direccion + ", Mataderos, CABA, Argentina")}&limit=1`
                        );
                        const data = await res.json();
                        if (data && data[0]) {
                          setForm((f) => ({ ...f, lat: data[0].lat, lng: data[0].lon }));
                          setMensaje({ tipo: "ok", texto: `✓ Coordenadas obtenidas (${data[0].lat}, ${data[0].lon})` });
                        } else {
                          setMensaje({ tipo: "error", texto: "No se encontró la dirección. Completá lat/lng manualmente." });
                        }
                      } catch {
                        setMensaje({ tipo: "error", texto: "Error de geocoding. Intentá de nuevo." });
                      }
                      setTimeout(() => setMensaje(null), 3000);
                    }}
                    style={{
                      padding: "8px 12px",
                      background: "var(--naranja)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={16} />
                      Ubicar
                    </span>
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="campo">
                  <label>Latitud</label>
                  <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div className="campo">
                  <label>Longitud</label>
                  <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                </div>
              </div>
              <div className="campo">
                <label>Horarios</label>
                <input value={form.horarios} onChange={(e) => setForm({ ...form, horarios: e.target.value })} placeholder="Ej: Sábados de 10 a 17h" />
              </div>
              <div className="campo">
                <label>URL</label>
                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="campo">
                <label>URL de imagen</label>
                <input type="url" value={form.imagenUrl} onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="campo">
                  <label>Categoría</label>
                  <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label>Barrio</label>
                  <select value={form.barrioId} onChange={(e) => setForm({ ...form, barrioId: e.target.value })}>
                    <option value="">Sin barrio</option>
                    {barrios.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="campo">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
                  Actividad destacada
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secundario" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn btn-primario" disabled={guardando}>
                  {guardando ? "Guardando…" : modal.modo === "crear" ? "Crear actividad" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
