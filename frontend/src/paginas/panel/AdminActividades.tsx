import React, { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "react-router-dom";
import LayoutPanel from "../../componentes/panel/LayoutPanel";
import {
  obtenerActividadesAdmin,
  desactivarActividad,
  reactivarActividad,
  crearActividad,
  actualizarActividad
} from "../../api/admin";
import { obtenerBarrios, obtenerCategorias } from "../../api/actividades";
import type { Actividad, Barrio, Categoria } from "../../tipos";
import { useAuth } from "../../contexto/AuthContext";
import Tarjeta from "../../componentes/base/Tarjeta";
import Boton from "../../componentes/base/Boton";
import Campo from "../../componentes/base/Campo";
import Badge from "../../componentes/base/Badge";
import BarraConfirmacion from "../../componentes/base/BarraConfirmacion";
import Esqueleto from "../../componentes/base/Esqueleto";
import EstadoError from "../../componentes/base/EstadoError";
import CategoriaChip from "../../componentes/CategoriaChip";
import {
  Search,
  PlusCircle,
  Pencil,
  Power,
  RotateCcw,
  MapPin,
  ExternalLink,
  X,
  Sparkles
} from "lucide-react";

type ActividadAdmin = Actividad & { activo: boolean };

interface FormActividad {
  nombre: string;
  slug: string;
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
  visibilidad: "publica" | "privada" | "oculta";
}

const FORM_INICIAL: FormActividad = {
  nombre: "",
  slug: "",
  descripcion: "",
  horarios: "",
  direccion: "",
  lat: "-34.653",
  lng: "-58.517",
  url: "",
  imagenUrl: "",
  categoriaId: "",
  barrioId: "",
  destacado: false,
  visibilidad: "publica"
};

export default function AdminActividades(): React.JSX.Element {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de listado
  const [actividades, setActividades] = useState<ActividadAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parámetros de filtro y paginación
  const pagina = Number(searchParams.get("pagina") || "1");
  const limite = 12;
  const q = searchParams.get("q") || "";
  const estadoFiltro = searchParams.get("activo"); // null | "true" | "false"
  const orden = (searchParams.get("orden") || "recientes") as "recientes" | "antiguas" | "nombre_asc" | "nombre_desc";

  // Modal / Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState<ActividadAdmin | null>(null);
  const [form, setForm] = useState<FormActividad>(FORM_INICIAL);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [geocodificando, setGeocodificando] = useState(false);
  const [geoMensaje, setGeoMensaje] = useState<string | null>(null);

  // Acciones de estado (desactivar / reactivar)
  const [actividadDesactivar, setActividadDesactivar] = useState<ActividadAdmin | null>(null);

  const [, startTransition] = useTransition();

  // Carga inicial y reactiva
  function cargarDatos() {
    if (!token) return;
    setCargando(true);
    setError(null);

    const activoParam = estadoFiltro === "true" ? true : estadoFiltro === "false" ? false : undefined;

    Promise.all([
      obtenerActividadesAdmin(token, {
        pagina,
        limite,
        q: q || undefined,
        activo: activoParam,
        orden
      }),
      obtenerBarrios(),
      obtenerCategorias()
    ])
      .then(([respAct, respBarrios, respCategorias]) => {
        setActividades(respAct.actividades);
        setTotal(respAct.total);
        setBarrios(respBarrios);
        setCategorias(respCategorias);
      })
      .catch((err) => setError(err.message || "Error al cargar las actividades"))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarDatos();
  }, [token, pagina, q, estadoFiltro, orden]);

  // Si la URL pide abrir "nueva" (por ejemplo desde el Dashboard)
  useEffect(() => {
    if (searchParams.get("accion") === "nueva") {
      abrirCrear();
      const nuevoSp = new URLSearchParams(searchParams);
      nuevoSp.delete("accion");
      setSearchParams(nuevoSp, { replace: true });
    }
  }, [searchParams]);

  // Manejo de búsqueda y filtros
  function actualizarFiltro(clave: string, valor: string | null) {
    const sp = new URLSearchParams(searchParams);
    if (!valor) {
      sp.delete(clave);
    } else {
      sp.set(clave, valor);
    }
    sp.set("pagina", "1"); // Resetear página al filtrar
    startTransition(() => {
      setSearchParams(sp);
    });
  }

  // Modales
  function abrirCrear() {
    setModoEdicion(null);
    setForm(FORM_INICIAL);
    setErroresForm({});
    setGeoMensaje(null);
    setModalAbierto(true);
  }

  function abrirEditar(a: ActividadAdmin) {
    setModoEdicion(a);
    setForm({
      nombre: a.nombre,
      slug: a.slug,
      descripcion: a.descripcion,
      horarios: a.horarios || "",
      direccion: a.direccion,
      lat: String(a.lat),
      lng: String(a.lng),
      url: a.url || "",
      imagenUrl: a.imagenUrl || "",
      categoriaId: a.categoria.id,
      barrioId: a.barrio.id,
      destacado: a.destacado || false,
      visibilidad: a.visibilidad || "publica"
    });
    setErroresForm({});
    setGeoMensaje(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setModoEdicion(null);
  }

  // Geocodificación con Nominatim (un pedido por clic)
  async function buscarCoordenadas() {
    if (!form.direccion.trim()) {
      setGeoMensaje("Ingresá primero una dirección para geocodificar.");
      return;
    }
    setGeocodificando(true);
    setGeoMensaje(null);
    try {
      const barrioSel = barrios.find((b) => b.id === form.barrioId);
      const query = `${form.direccion}, ${barrioSel?.nombre || "Mataderos"}, CABA, Argentina`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        setForm((prev) => ({
          ...prev,
          lat: data[0].lat,
          lng: data[0].lon
        }));
        setGeoMensaje(`Coordenadas ubicadas: ${data[0].lat}, ${data[0].lon}`);
      } else {
        setGeoMensaje("No encontramos esa dirección. Probá con otra o cargá las coordenadas a mano.");
      }
    } catch {
      setGeoMensaje("Error al conectar con el servicio de geocodificación.");
    } finally {
      setGeocodificando(false);
    }
  }

  // Validación y envío de formulario
  async function guardarActividad(e: React.FormEvent) {
    e.preventDefault();
    const errores: Record<string, string> = {};
    if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
    if (!form.descripcion.trim()) errores.descripcion = "La descripción es obligatoria.";
    if (!form.direccion.trim()) errores.direccion = "La dirección es obligatoria.";
    if (!form.categoriaId) errores.categoriaId = "Seleccioná una categoría.";
    if (!form.barrioId) errores.barrioId = "Seleccioná un barrio.";

    if (Object.keys(errores).length > 0) {
      setErroresForm(errores);
      return;
    }

    if (!token) return;
    setGuardando(true);

    const payload = {
      nombre: form.nombre,
      slug: form.slug.trim() || undefined,
      descripcion: form.descripcion,
      horarios: form.horarios || "",
      direccion: form.direccion,
      lat: parseFloat(form.lat) || -34.653,
      lng: parseFloat(form.lng) || -58.517,
      url: form.url || "",
      imagenUrl: form.imagenUrl || "",
      categoriaId: form.categoriaId,
      barrioId: form.barrioId,
      destacado: form.destacado,
      visibilidad: form.visibilidad
    };

    try {
      if (modoEdicion) {
        await actualizarActividad(modoEdicion.id, payload, token);
      } else {
        await crearActividad(payload, token);
      }
      cerrarModal();
      cargarDatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar los cambios";
      setErroresForm({ general: msg });
    } finally {
      setGuardando(false);
    }
  }

  // Desactivar / Reactivar
  async function confirmarDesactivar() {
    if (!token || !actividadDesactivar) return;
    try {
      await desactivarActividad(actividadDesactivar.id, token);
      setActividades((prev) =>
        prev.map((a) => (a.id === actividadDesactivar.id ? { ...a, activo: false } : a))
      );
      setActividadDesactivar(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al desactivar la actividad.");
    }
  }

  async function handleReactivar(a: ActividadAdmin) {
    if (!token) return;
    try {
      await reactivarActividad(a.id, token);
      setActividades((prev) =>
        prev.map((act) => (act.id === a.id ? { ...act, activo: true } : act))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al reactivar la actividad.");
    }
  }

  const paginasTotales = Math.ceil(total / limite);

  return (
    <LayoutPanel>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Cabecera */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px"
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--fuente-titulo)",
                fontSize: "28px",
                color: "var(--tinta)",
                margin: "0 0 6px 0"
              }}
            >
              Gestión de Actividades
            </h1>
            <p style={{ color: "var(--texto-suave)", fontSize: "15px", margin: 0 }}>
              Cargá, editá y organizá las actividades culturales de los barrios.
            </p>
          </div>

          <Boton variante="principal" onClick={abrirCrear}>
            <PlusCircle size={18} />
            Nueva actividad
          </Boton>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px"
          }}
        >
          {/* Búsqueda por nombre */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "400px" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--texto-suave)",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Search size={18} />
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => actualizarFiltro("q", e.target.value || null)}
              placeholder="Buscar por nombre..."
              style={{
                width: "100%",
                minHeight: "var(--alto-tactil)",
                paddingLeft: "42px",
                paddingRight: "16px",
                borderRadius: "var(--radio-control)",
                border: "1px solid var(--linea)",
                backgroundColor: "var(--blanco)",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          {/* Filtros de estado y orden */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Estado */}
            <div style={{ display: "flex", backgroundColor: "var(--blanco)", borderRadius: "var(--radio-control)", border: "1px solid var(--linea)", padding: "2px" }}>
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", null)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radio-control)",
                  border: "none",
                  backgroundColor: estadoFiltro === null ? "var(--chapa)" : "transparent",
                  color: estadoFiltro === null ? "var(--blanco)" : "var(--tinta)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", "true")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radio-control)",
                  border: "none",
                  backgroundColor: estadoFiltro === "true" ? "#059669" : "transparent",
                  color: estadoFiltro === "true" ? "var(--blanco)" : "var(--tinta)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", "false")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radio-control)",
                  border: "none",
                  backgroundColor: estadoFiltro === "false" ? "var(--peligro)" : "transparent",
                  color: estadoFiltro === "false" ? "var(--blanco)" : "var(--tinta)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Inactivas
              </button>
            </div>

            {/* Orden */}
            <select
              value={orden}
              onChange={(e) => actualizarFiltro("orden", e.target.value)}
              style={{
                minHeight: "var(--alto-tactil)",
                padding: "0 12px",
                borderRadius: "var(--radio-control)",
                border: "1px solid var(--linea)",
                backgroundColor: "var(--blanco)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--tinta)",
                cursor: "pointer"
              }}
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
              <option value="nombre_asc">Nombre (A-Z)</option>
              <option value="nombre_desc">Nombre (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Estados de carga / error */}
        {cargando && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Esqueleto alto="60px" />
            <Esqueleto alto="60px" />
            <Esqueleto alto="60px" />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: "20px" }}>
            <EstadoError titulo="Ocurrió un inconveniente" descripcion={error} onReintentar={cargarDatos} />
          </div>
        )}

        {/* Tabla */}
        {!cargando && (
          <Tarjeta style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--papel)", borderBottom: "1px solid var(--linea)" }}>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Actividad
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Barrio
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Categoría
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Estado
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase", textAlign: "right" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actividades.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "36px", textAlign: "center", color: "var(--texto-suave)" }}>
                        No se encontraron actividades con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    actividades.map((a) => (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: "1px solid var(--linea)",
                          opacity: a.activo ? 1 : 0.55,
                          transition: "opacity 0.15s ease"
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "14px", color: "var(--tinta)" }}>
                              {a.nombre}
                            </strong>
                            {a.destacado && (
                              <Badge tipo="destacada" icono={<Sparkles size={11} />} texto="Destacada" />
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--texto-suave)", display: "block", marginTop: "2px" }}>
                            {a.direccion}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "14px", color: "var(--tinta)" }}>
                          {a.barrio.nombre}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <CategoriaChip categoria={a.categoria} />
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: a.activo ? "#059669" : "var(--peligro)"
                            }}
                          >
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: a.activo ? "#059669" : "var(--peligro)"
                              }}
                            />
                            {a.activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Boton
                              variante="texto"
                              onClick={() => abrirEditar(a)}
                              title="Editar actividad"
                            >
                              <Pencil size={15} />
                              Editar
                            </Boton>

                            {a.activo ? (
                              <Boton
                                variante="peligro"
                                onClick={() => setActividadDesactivar(a)}
                                title="Desactivar para vecinos"
                              >
                                <Power size={15} />
                                Desactivar
                              </Boton>
                            ) : (
                              <Boton
                                variante="secundario"
                                onClick={() => handleReactivar(a)}
                                title="Volver a publicar"
                              >
                                <RotateCcw size={15} />
                                Reactivar
                              </Boton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginasTotales > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderTop: "1px solid var(--linea)",
                  backgroundColor: "var(--papel)"
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                  Página {pagina} de {paginasTotales} ({total} actividades)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Boton
                    variante="secundario"
                    disabled={pagina <= 1}
                    onClick={() => actualizarFiltro("pagina", String(pagina - 1))}
                  >
                    Anterior
                  </Boton>
                  <Boton
                    variante="secundario"
                    disabled={pagina >= paginasTotales}
                    onClick={() => actualizarFiltro("pagina", String(pagina + 1))}
                  >
                    Siguiente
                  </Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        )}

        {/* Modal / Formulario de Creación / Edición */}
        {modalAbierto && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              display: "grid",
              placeItems: "center",
              zIndex: 1100,
              padding: "20px"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) cerrarModal();
            }}
          >
            <div
              style={{
                backgroundColor: "var(--blanco)",
                borderRadius: "var(--radio-tarjeta)",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
            >
              {/* Cabecera del modal */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--linea)"
                }}
              >
                <h2 style={{ margin: 0, fontFamily: "var(--fuente-titulo)", fontSize: "20px", color: "var(--tinta)" }}>
                  {modoEdicion ? `Editar: ${modoEdicion.nombre}` : "Nueva actividad cultural"}
                </h2>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--texto-suave)",
                    padding: "4px"
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <form onSubmit={guardarActividad} style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {erroresForm.general && (
                  <div style={{ padding: "12px", backgroundColor: "var(--peligro-fondo)", color: "var(--peligro)", borderRadius: "var(--radio-control)", fontSize: "14px" }}>
                    {erroresForm.general}
                  </div>
                )}

                {/* 1. Datos básicos */}
                <div>
                  <h3 style={{ fontSize: "15px", fontFamily: "var(--fuente-titulo)", color: "var(--chapa)", margin: "0 0 12px 0", borderBottom: "1px solid var(--linea)", paddingBottom: "6px" }}>
                    1. Datos básicos
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <Campo
                      id="act-nombre"
                      etiqueta="Nombre de la actividad"
                      required
                      value={form.nombre}
                      error={erroresForm.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej: Feria de las Artesanías"
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label htmlFor="act-cat" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--tinta)", marginBottom: "6px" }}>
                          Categoría *
                        </label>
                        <select
                          id="act-cat"
                          value={form.categoriaId}
                          onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                          style={{
                            width: "100%",
                            minHeight: "var(--alto-tactil)",
                            borderRadius: "var(--radio-control)",
                            border: `1px solid ${erroresForm.categoriaId ? "var(--peligro)" : "var(--linea)"}`,
                            padding: "0 12px",
                            fontSize: "14px",
                            backgroundColor: "var(--blanco)"
                          }}
                        >
                          <option value="">Seleccionar categoría</option>
                          {categorias.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="act-barrio" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--tinta)", marginBottom: "6px" }}>
                          Barrio *
                        </label>
                        <select
                          id="act-barrio"
                          value={form.barrioId}
                          onChange={(e) => setForm({ ...form, barrioId: e.target.value })}
                          style={{
                            width: "100%",
                            minHeight: "var(--alto-tactil)",
                            borderRadius: "var(--radio-control)",
                            border: `1px solid ${erroresForm.barrioId ? "var(--peligro)" : "var(--linea)"}`,
                            padding: "0 12px",
                            fontSize: "14px",
                            backgroundColor: "var(--blanco)"
                          }}
                        >
                          <option value="">Seleccionar barrio</option>
                          {barrios.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Ubicación */}
                <div>
                  <h3 style={{ fontSize: "15px", fontFamily: "var(--fuente-titulo)", color: "var(--chapa)", margin: "0 0 12px 0", borderBottom: "1px solid var(--linea)", paddingBottom: "6px" }}>
                    2. Ubicación geográfica
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <Campo
                            id="act-dir"
                            etiqueta="Dirección o punto de encuentro"
                            required
                            value={form.direccion}
                            error={erroresForm.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            placeholder="Ej: Av. Directorio 5051"
                          />
                        </div>
                        <Boton
                          variante="secundario"
                          onClick={buscarCoordenadas}
                          disabled={geocodificando}
                          title="Buscar coordenadas en OpenStreetMap"
                        >
                          <MapPin size={16} />
                          {geocodificando ? "Buscando..." : "Ubicar"}
                        </Boton>
                      </div>
                      {geoMensaje && (
                        <p style={{ fontSize: "12px", color: "var(--texto-suave)", marginTop: "6px", marginInline: 0 }}>
                          {geoMensaje}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <Campo
                        id="act-lat"
                        etiqueta="Latitud"
                        value={form.lat}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      />
                      <Campo
                        id="act-lng"
                        etiqueta="Longitud"
                        value={form.lng}
                        onChange={(e) => setForm({ ...form, lng: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contenido */}
                <div>
                  <h3 style={{ fontSize: "15px", fontFamily: "var(--fuente-titulo)", color: "var(--chapa)", margin: "0 0 12px 0", borderBottom: "1px solid var(--linea)", paddingBottom: "6px" }}>
                    3. Detalles y contenido
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label htmlFor="act-desc" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--tinta)", marginBottom: "6px" }}>
                        Descripción *
                      </label>
                      <textarea
                        id="act-desc"
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Contá de qué se trata la propuesta cultural..."
                        style={{
                          width: "100%",
                          borderRadius: "var(--radio-control)",
                          border: `1px solid ${erroresForm.descripcion ? "var(--peligro)" : "var(--linea)"}`,
                          padding: "10px 14px",
                          fontSize: "14px",
                          fontFamily: "var(--fuente-cuerpo)"
                        }}
                      />
                    </div>

                    <Campo
                      id="act-horarios"
                      etiqueta="Días y horarios"
                      value={form.horarios}
                      onChange={(e) => setForm({ ...form, horarios: e.target.value })}
                      placeholder="Ej: Sábados y domingos de 11 a 18 h"
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <Campo
                        id="act-url"
                        etiqueta="Sitio web o enlace"
                        type="url"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://..."
                      />
                      <Campo
                        id="act-img"
                        etiqueta="URL de imagen"
                        type="url"
                        value={form.imagenUrl}
                        onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Publicación */}
                <div>
                  <h3 style={{ fontSize: "15px", fontFamily: "var(--fuente-titulo)", color: "var(--chapa)", margin: "0 0 12px 0", borderBottom: "1px solid var(--linea)", paddingBottom: "6px" }}>
                    4. Publicación
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={form.destacado}
                        onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                      />
                      Destacar en portada
                    </label>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>Visibilidad:</span>
                      <select
                        value={form.visibilidad}
                        onChange={(e) => setForm({ ...form, visibilidad: e.target.value as FormActividad["visibilidad"] })}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "var(--radio-control)",
                          border: "1px solid var(--linea)",
                          fontSize: "13px"
                        }}
                      >
                        <option value="publica">Pública</option>
                        <option value="privada">Privada</option>
                        <option value="oculta">Oculta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pie del modal */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--linea)",
                    marginTop: "8px"
                  }}
                >
                  {modoEdicion ? (
                    <a
                      href={`/actividades/${modoEdicion.barrio.slug}/${modoEdicion.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "var(--chapa)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                        fontWeight: 600
                      }}
                    >
                      <ExternalLink size={14} />
                      Ver cómo se ve
                    </a>
                  ) : <span />}

                  <div style={{ display: "flex", gap: "10px" }}>
                    <Boton variante="secundario" onClick={cerrarModal}>
                      Cancelar
                    </Boton>
                    <Boton type="submit" variante="principal" disabled={guardando}>
                      {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear actividad"}
                    </Boton>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barra de Confirmación: Desactivar Actividad */}
        {actividadDesactivar && (
          <BarraConfirmacion
            mensaje={`"${actividadDesactivar.nombre}" dejará de verse para los vecinos. Podés reactivarla cuando quieras.`}
            onConfirmar={confirmarDesactivar}
            onCancelar={() => setActividadDesactivar(null)}
            textoConfirmar="Desactivar"
            esPeligro
          />
        )}
      </div>
    </LayoutPanel>
  );
}
