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
  ExternalLink,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Navigation
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
    if (clave !== "pagina") {
      sp.set("pagina", "1"); // Resetear página al filtrar
    }
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
        setGeoMensaje("No encontramos esa dirección. Podés ingresar las coordenadas a mano.");
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-2">
              <Sparkles size={13} />
              Cartelera y programación
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-brand-ink">
              Gestión de Actividades
            </h1>
            <p className="font-body text-sm text-brand-gray mt-1">
              Cargá, editá y organizá las actividades culturales de la Comuna 9.
            </p>
          </div>

          <Boton variante="principal" onClick={abrirCrear}>
            <PlusCircle size={18} />
            Nueva actividad
          </Boton>
        </div>

        {/* Barra de Filtros, Búsqueda y Orden */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Búsqueda por nombre */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
              <Search size={18} />
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => actualizarFiltro("q", e.target.value || null)}
              placeholder="Buscar actividad por nombre..."
              className="w-full min-h-[44px] pl-11 pr-4 rounded-full border border-brand-gray-light bg-brand-white text-brand-ink font-body text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Filtros de estado y orden */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Pill Group de Estado */}
            <div className="inline-flex p-1 rounded-full bg-brand-white border border-brand-gray-light shadow-2xs">
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", null)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                  estadoFiltro === null
                    ? "bg-brand-orange text-brand-ink shadow-xs"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", "true")}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                  estadoFiltro === "true"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => actualizarFiltro("activo", "false")}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                  estadoFiltro === "false"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
              >
                Inactivas
              </button>
            </div>

            {/* Selector de Orden */}
            <div className="flex items-center gap-1.5 bg-brand-white border border-brand-gray-light rounded-full px-3 py-1.5 shadow-2xs">
              <SlidersHorizontal size={14} className="text-brand-muted" />
              <select
                value={orden}
                onChange={(e) => actualizarFiltro("orden", e.target.value)}
                className="bg-transparent text-xs font-sans font-semibold text-brand-ink focus:outline-none cursor-pointer"
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguas">Más antiguas</option>
                <option value="nombre_asc">Nombre (A-Z)</option>
                <option value="nombre_desc">Nombre (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estados de carga / error */}
        {cargando && (
          <div className="space-y-3">
            <Esqueleto alto="64px" className="rounded-2xl" />
            <Esqueleto alto="64px" className="rounded-2xl" />
            <Esqueleto alto="64px" className="rounded-2xl" />
          </div>
        )}

        {error && (
          <EstadoError titulo="Ocurrió un inconveniente" descripcion={error} onReintentar={cargarDatos} />
        )}

        {/* Tabla / Card List */}
        {!cargando && (
          <div className="rounded-3xl border border-brand-gray-light bg-brand-white shadow-[0_6px_11px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/80 border-b border-brand-gray-light">
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Actividad
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Barrio
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Categoría
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Estado
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-light">
                  {actividades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-brand-muted font-body text-sm">
                        No se encontraron actividades con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    actividades.map((a) => (
                      <tr
                        key={a.id}
                        className={`hover:bg-brand-bg/40 transition-colors ${
                          !a.activo ? "opacity-60 bg-brand-bg/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <strong className="font-sans font-semibold text-sm text-brand-ink">
                              {a.nombre}
                            </strong>
                            {a.destacado && (
                              <Badge tipo="destacada" icono={<Sparkles size={11} />} texto="Destacada" />
                            )}
                          </div>
                          <span className="block text-xs text-brand-muted font-body mt-0.5">
                            {a.direccion}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-body text-xs text-brand-gray">
                          {a.barrio.nombre}
                        </td>
                        <td className="py-3 px-4">
                          <CategoriaChip categoria={a.categoria} />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              a.activo
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                a.activo ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {a.activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-brand-gray-light bg-brand-bg/50">
                <span className="font-body text-xs text-brand-muted">
                  Página {pagina} de {paginasTotales} ({total} actividades registradas)
                </span>
                <div className="flex items-center gap-2">
                  <Boton
                    variante="secundario"
                    disabled={pagina <= 1}
                    onClick={() => actualizarFiltro("pagina", String(pagina - 1))}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Boton>
                  <Boton
                    variante="secundario"
                    disabled={pagina >= paginasTotales}
                    onClick={() => actualizarFiltro("pagina", String(pagina + 1))}
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </Boton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal / Formulario con cabecera Croquis bg-brand-orange-light */}
        {modalAbierto && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) cerrarModal();
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] bg-brand-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-brand-gray-light animate-in fade-in zoom-in-95 duration-150">
              {/* Header Band Croquis */}
              <div className="bg-brand-orange-light px-6 py-4 flex items-center justify-between border-b border-brand-orange">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-ink/70">
                    {modoEdicion ? "Actualizar registro" : "Nueva propuesta comunitaria"}
                  </span>
                  <h2 className="font-display text-xl text-brand-ink leading-tight">
                    {modoEdicion ? `Editar: ${modoEdicion.nombre}` : "Nueva actividad cultural"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="w-8 h-8 rounded-full bg-brand-white/80 hover:bg-brand-white text-brand-ink flex items-center justify-center transition-colors shadow-2xs"
                  aria-label="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulario Scrolleable */}
              <form onSubmit={guardarActividad} className="overflow-y-auto p-6 md:p-8 space-y-6">
                {erroresForm.general && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    {erroresForm.general}
                  </div>
                )}

                {/* 1. Datos básicos */}
                <div>
                  <h3 className="font-display text-base text-brand-orange mb-3 pb-1 border-b border-brand-gray-light">
                    1. Datos de la actividad
                  </h3>
                  <div className="space-y-4">
                    <Campo
                      id="act-nombre"
                      etiqueta="Nombre de la actividad"
                      required
                      value={form.nombre}
                      error={erroresForm.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej: Taller de Murga y Percusión Barrial"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="act-cat"
                          className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-gray mb-1.5"
                        >
                          Categoría *
                        </label>
                        <select
                          id="act-cat"
                          value={form.categoriaId}
                          onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 rounded-xl border bg-brand-white text-sm font-body text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                            erroresForm.categoriaId ? "border-red-500" : "border-brand-gray-light"
                          }`}
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
                        <label
                          htmlFor="act-barrio"
                          className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-gray mb-1.5"
                        >
                          Barrio *
                        </label>
                        <select
                          id="act-barrio"
                          value={form.barrioId}
                          onChange={(e) => setForm({ ...form, barrioId: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 rounded-xl border bg-brand-white text-sm font-body text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                            erroresForm.barrioId ? "border-red-500" : "border-brand-gray-light"
                          }`}
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

                {/* 2. Ubicación con Nominatim Geocoding */}
                <div>
                  <h3 className="font-display text-base text-brand-orange mb-3 pb-1 border-b border-brand-gray-light">
                    2. Ubicación y Georreferenciación
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
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
                          <Navigation size={16} />
                          {geocodificando ? "Buscando..." : "Ubicar"}
                        </Boton>
                      </div>
                      {geoMensaje && (
                        <p className="mt-2 text-xs font-body text-brand-muted">
                          {geoMensaje}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* 3. Contenido y detalles */}
                <div>
                  <h3 className="font-display text-base text-brand-orange mb-3 pb-1 border-b border-brand-gray-light">
                    3. Horarios y descripción
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="act-desc"
                        className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-gray mb-1.5"
                      >
                        Descripción de la propuesta *
                      </label>
                      <textarea
                        id="act-desc"
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Contá de qué se trata, a quiénes está dirigida y qué deben traer..."
                        className={`w-full p-3 rounded-xl border bg-brand-white text-sm font-body text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all ${
                          erroresForm.descripcion ? "border-red-500" : "border-brand-gray-light"
                        }`}
                      />
                    </div>

                    <Campo
                      id="act-horarios"
                      etiqueta="Días y horarios"
                      value={form.horarios}
                      onChange={(e) => setForm({ ...form, horarios: e.target.value })}
                      placeholder="Ej: Sábados de 16 a 18 h"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Campo
                        id="act-url"
                        etiqueta="Sitio web o enlace externo"
                        type="url"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://..."
                      />
                      <Campo
                        id="act-img"
                        etiqueta="URL de imagen de portada"
                        type="url"
                        value={form.imagenUrl}
                        onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Publicación y visibilidad */}
                <div>
                  <h3 className="font-display text-base text-brand-orange mb-3 pb-1 border-b border-brand-gray-light">
                    4. Estado de publicación
                  </h3>
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-sans text-sm font-semibold text-brand-ink">
                      <input
                        type="checkbox"
                        checked={form.destacado}
                        onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange border-brand-gray-light"
                      />
                      Destacar en cartelera principal
                    </label>

                    <div className="inline-flex items-center gap-2">
                      <span className="font-sans text-xs font-semibold text-brand-gray">Visibilidad:</span>
                      <select
                        value={form.visibilidad}
                        onChange={(e) => setForm({ ...form, visibilidad: e.target.value as FormActividad["visibilidad"] })}
                        className="px-3 py-1.5 rounded-full border border-brand-gray-light bg-brand-white text-xs font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      >
                        <option value="publica">Pública</option>
                        <option value="privada">Privada</option>
                        <option value="oculta">Oculta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pie del modal con acciones */}
                <div className="pt-4 border-t border-brand-gray-light flex items-center justify-between">
                  {modoEdicion ? (
                    <a
                      href={`/actividades/${modoEdicion.barrio.slug}/${modoEdicion.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-brand-orange hover:underline"
                    >
                      <ExternalLink size={14} />
                      Ver cómo se ve en el sitio
                    </a>
                  ) : <span />}

                  <div className="flex items-center gap-3">
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
