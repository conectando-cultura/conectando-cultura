import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFiltrosExplorar } from "../hooks/useFiltrosExplorar";
import { useAuth } from "../contexto/AuthContext";
import {
  obtenerActividades,
  obtenerBarrios,
  obtenerCategorias,
  obtenerPreferencias
} from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";
import ActividadCard from "../componentes/ActividadCard";
import CategoriaChip from "../componentes/CategoriaChip";
import MapaLeaflet from "../componentes/MapaLeaflet";
import {
  Esqueleto,
  EstadoError
} from "../componentes/base";
import { Search, Map as IconoMapa, List, Columns, X, Check, Compass, RotateCcw } from "lucide-react";
import estilos from "./Explorar.module.css";

export default function Explorar(): React.JSX.Element {
  const {
    filtros,
    setQ,
    setBarrio,
    alternarCategoria,
    setCategorias,
    setVista,
    limpiarFiltros,
    tieneFiltrosActivos
  } = useFiltrosExplorar();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategoriasCatalogo] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actividadSeleccionadaId, setActividadSeleccionadaId] = useState<string | null>(null);

  const { token, usuario } = useAuth();
  const [preferenciasAplicadas, setPreferenciasAplicadas] = useState(false);

  // Carga de catálogos y actividades
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaBarrios, listaCategorias, listaActividades] = await Promise.all([
        obtenerBarrios(),
        obtenerCategorias(),
        obtenerActividades({
          barrioSlug: filtros.barrio || undefined
        })
      ]);
      setBarrios(listaBarrios);
      setCategoriasCatalogo(listaCategorias);
      setActividades(listaActividades);
    } catch (err) {
      console.error(err);
      setError("No pudimos cargar las actividades.");
    } finally {
      setCargando(false);
    }
  }, [filtros.barrio]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Si no hay filtros en la URL y el usuario tiene preferencias, aplicarlas
  useEffect(() => {
    if (!token || !usuario || tieneFiltrosActivos || preferenciasAplicadas) return;

    obtenerPreferencias(token)
      .then((prefs) => {
        if (!prefs) return;
        const nuevosBarrio = prefs.barrio?.slug;
        const nuevosCats = prefs.categorias?.map((c) => c.slug) ?? [];
        if (nuevosBarrio || nuevosCats.length > 0) {
          if (nuevosBarrio) setBarrio(nuevosBarrio);
          if (nuevosCats.length > 0) setCategorias(nuevosCats);
          setPreferenciasAplicadas(true);
        }
      })
      .catch(() => {});
  }, [token, usuario, tieneFiltrosActivos, preferenciasAplicadas, setBarrio, setCategorias]);

  // Filtrado local por categorías y búsqueda por texto
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((act) => {
      // Filtro por categorías seleccionadas
      if (filtros.categorias.length > 0) {
        if (!filtros.categorias.includes(act.categoria.slug)) {
          return false;
        }
      }

      // Filtro por texto en nombre, descripción o dirección
      if (filtros.q && filtros.q.trim()) {
        const busqueda = filtros.q.toLowerCase().trim();
        const coincide =
          act.nombre.toLowerCase().includes(busqueda) ||
          act.descripcion.toLowerCase().includes(busqueda) ||
          act.direccion.toLowerCase().includes(busqueda);
        if (!coincide) return false;
      }

      return true;
    });
  }, [actividades, filtros.categorias, filtros.q]);

  const barrioActual = useMemo(() => {
    if (!filtros.barrio) return "Todos los barrios";
    const b = barrios.find((x) => x.slug === filtros.barrio);
    return b ? b.nombre : "Todos los barrios";
  }, [barrios, filtros.barrio]);

  // Selección de actividad sincronizada
  const manejarSeleccion = (act: Actividad) => {
    setActividadSeleccionadaId(act.id);
  };

  const todasLasCategorias = filtros.categorias.length === 0;

  return (
    <div className="w-full bg-brand-bg py-6 md:py-8 font-body text-brand-ink">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        {/* ── Barra Superior de Búsqueda y Filtros de Barrio (Croquis Search Bar) ── */}
        <section className="mb-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-brand-gray-light bg-brand-white p-3 shadow-[0_6px_11px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:rounded-full md:p-2.5">
            {/* Input de Búsqueda por texto */}
            <div className="flex flex-1 items-center gap-3 rounded-full border border-brand-gray-light bg-brand-bg px-4 py-2.5 transition-colors focus-within:border-brand-orange focus-within:bg-brand-white">
              <Search size={18} className="text-brand-orange shrink-0" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar actividades por nombre, descripción o dirección..."
                value={filtros.q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent font-body text-sm text-brand-ink placeholder:text-brand-muted outline-none"
                aria-label="Buscar actividades"
              />
              {filtros.q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-full p-1 text-brand-muted hover:bg-brand-gray-light hover:text-brand-ink"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Selector de barrio estilo Croquis */}
            <div className="flex items-center gap-2 rounded-full border border-brand-gray-light bg-brand-bg px-4 py-2.5 md:w-64 transition-colors focus-within:border-brand-orange focus-within:bg-brand-white">
              <Compass size={18} className="text-brand-orange shrink-0" aria-hidden="true" />
              <select
                value={filtros.barrio}
                onChange={(e) => setBarrio(e.target.value)}
                className="w-full cursor-pointer bg-transparent font-sans text-sm font-medium text-brand-ink outline-none"
                aria-label="Filtrar por barrio"
              >
                <option value="">Todos los barrios</option>
                {barrios.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle de vistas: Lista | Mapa | Ambas */}
            <div className="flex items-center justify-center rounded-full border border-brand-gray-light bg-brand-bg p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setVista("lista")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-all ${
                  filtros.vista === "lista"
                    ? "bg-brand-orange text-brand-ink shadow-sm"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
                aria-pressed={filtros.vista === "lista"}
                title="Ver sólo lista"
              >
                <List size={14} />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setVista("mapa")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-all ${
                  filtros.vista === "mapa"
                    ? "bg-brand-orange text-brand-ink shadow-sm"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
                aria-pressed={filtros.vista === "mapa"}
                title="Ver sólo mapa"
              >
                <IconoMapa size={14} />
                <span>Mapa</span>
              </button>
              <button
                type="button"
                onClick={() => setVista("ambas")}
                className={`hidden lg:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-all ${
                  filtros.vista === "ambas"
                    ? "bg-brand-orange text-brand-ink shadow-sm"
                    : "text-brand-gray hover:text-brand-ink"
                }`}
                aria-pressed={filtros.vista === "ambas"}
                title="Ver lista y mapa en paralelo"
              >
                <Columns size={14} />
                <span>Ambas</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Tira de Filtros de Categoría (CategoriaChip strip) ── */}
        <section className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => setCategorias([])}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-all shrink-0 ${
                todasLasCategorias
                  ? "bg-brand-ink text-brand-white shadow-sm"
                  : "border border-brand-gray-light bg-brand-white text-brand-gray hover:border-brand-orange hover:text-brand-ink"
              }`}
              aria-pressed={todasLasCategorias}
            >
              {todasLasCategorias && <Check size={13} strokeWidth={2.5} />}
              <span>Todas las categorías</span>
            </button>

            {categorias.map((cat) => (
              <CategoriaChip
                key={cat.id}
                categoria={cat}
                seleccionada={filtros.categorias.includes(cat.slug)}
                onAlternar={() => alternarCategoria(cat.slug)}
              />
            ))}
          </div>
        </section>

        {/* ── Encabezado de Resultados y Contador (Croquis SearchResultsPage style) ── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-brand-gray-light pb-4">
          <div>
            <p className="font-body text-xs font-medium text-brand-muted">
              {cargando
                ? "Buscando actividades culturales..."
                : `${actividadesFiltradas.length} ${
                    actividadesFiltradas.length === 1 ? "actividad encontrada" : "actividades encontradas"
                  } en ${barrioActual}`}
            </p>
            <h1 className="mt-1 font-display text-2xl md:text-3xl text-brand-gray">
              {filtros.barrio ? `Actividades en ${barrioActual}` : "¿Qué querés hacer hoy?"}
            </h1>
          </div>

          {tieneFiltrosActivos && (
            <div className="flex items-center gap-3">
              {preferenciasAplicadas && (
                <span className="hidden sm:inline font-sans text-xs text-brand-muted">
                  Basado en tus preferencias guardadas
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setPreferenciasAplicadas(false);
                  limpiarFiltros();
                }}
                className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-brand-orange hover:text-brand-orange-light underline underline-offset-4"
              >
                <RotateCcw size={13} />
                <span>Restablecer filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Estado de Error / Carga / Contenido ── */}
        {error ? (
          <EstadoError descripcion={error} onReintentar={cargarDatos} />
        ) : cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <Esqueleto alto={220} />
              <Esqueleto alto={220} />
              <Esqueleto alto={220} />
            </div>
            <Esqueleto alto={680} />
          </div>
        ) : actividadesFiltradas.length === 0 ? (
          /* Empty State estilo Croquis SearchResultsPage con rounded-3xl y botón restablecer */
          <div className="my-8 rounded-3xl border border-brand-gray-light bg-brand-white p-10 md:p-14 text-center shadow-[0_6px_11px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg text-brand-orange">
              <Compass size={32} />
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-brand-gray">
              No hay actividades con estos filtros
            </h2>
            <p className="mx-auto mt-2 max-w-md font-body text-sm text-brand-muted">
              No encontramos propuestas en <span className="font-semibold text-brand-gray">{barrioActual}</span> con las categorías o términos seleccionados.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPreferenciasAplicadas(false);
                  limpiarFiltros();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-2.5 font-sans text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-orange-light"
              >
                <RotateCcw size={15} />
                <span>Ver todas las actividades</span>
              </button>
            </div>
          </div>
        ) : (
          /* Cuadrícula interactiva y responsiva sincronizada con MapaLeaflet */
          <div
            className={`grid gap-6 items-start ${
              filtros.vista === "mapa"
                ? "grid-cols-1"
                : filtros.vista === "lista"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 lg:grid-cols-[minmax(340px,460px)_1fr]"
            }`}
          >
            {/* Columna de Lista de Tarjetas */}
            {filtros.vista !== "mapa" && (
              <div
                className={`flex flex-col gap-5 ${
                  filtros.vista === "ambas"
                    ? `lg:max-h-[780px] lg:overflow-y-auto lg:pr-2 ${estilos.scrollContenedor}`
                    : ""
                }`}
              >
                {actividadesFiltradas.map((act) => (
                  <ActividadCard
                    key={act.id}
                    actividad={act}
                    seleccionada={act.id === actividadSeleccionadaId}
                    onSeleccionar={() => manejarSeleccion(act)}
                  />
                ))}
              </div>
            )}

            {/* Columna de MapaLeaflet */}
            {filtros.vista !== "lista" && (
              <div
                className={`${
                  filtros.vista === "ambas"
                    ? "lg:sticky lg:top-6 h-[500px] lg:h-[780px]"
                    : "h-[620px] w-full"
                }`}
              >
                <MapaLeaflet
                  actividades={actividadesFiltradas}
                  actividadSeleccionadaId={actividadSeleccionadaId}
                  onSeleccionarActividad={manejarSeleccion}
                  altura="100%"
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
