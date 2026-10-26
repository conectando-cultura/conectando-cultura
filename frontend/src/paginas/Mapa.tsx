import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  obtenerActividades,
  obtenerBarrios,
  obtenerCategorias
} from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";
import CategoriaChip from "../componentes/CategoriaChip";
import MapaLeaflet from "../componentes/MapaLeaflet";
import { Esqueleto, EstadoError, Badge } from "../componentes/base";
import {
  Search,
  MapPin,
  X,
  RotateCcw,
  ArrowRight,
  Layers,
  LayoutGrid
} from "lucide-react";

export default function Mapa(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const barrio = searchParams.get("barrio") ?? "";
  const categoriasParam = searchParams.get("categorias") ?? "";
  const categoriasSeleccionadas = useMemo(
    () => (categoriasParam ? categoriasParam.split(",").filter(Boolean) : []),
    [categoriasParam]
  );

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actividadSeleccionadaId, setActividadSeleccionadaId] = useState<string | null>(null);

  const actualizarParams = useCallback(
    (nuevos: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [key, val] of Object.entries(nuevos)) {
            if (!val || val.trim() === "") {
              params.delete(key);
            } else {
              params.set(key, val);
            }
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setQ = (texto: string) => actualizarParams({ q: texto });
  const setBarrio = (slug: string) => actualizarParams({ barrio: slug });

  const alternarCategoria = (slug: string) => {
    const existe = categoriasSeleccionadas.includes(slug);
    const nuevas = existe
      ? categoriasSeleccionadas.filter((c) => c !== slug)
      : [...categoriasSeleccionadas, slug];
    actualizarParams({ categorias: nuevas.length > 0 ? nuevas.join(",") : null });
  };

  const limpiarFiltros = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setActividadSeleccionadaId(null);
  };

  const tieneFiltrosActivos = Boolean(q || barrio || categoriasSeleccionadas.length > 0);

  // Carga inicial de datos
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaBarrios, listaCategorias, listaActividades] = await Promise.all([
        obtenerBarrios(),
        obtenerCategorias(),
        obtenerActividades({
          barrioSlug: barrio || undefined
        })
      ]);
      setBarrios(listaBarrios);
      setCategoriasCatalogo(listaCategorias);
      setActividades(listaActividades);
    } catch (err) {
      console.error(err);
      setError("No pudimos cargar los puntos culturales del mapa.");
    } finally {
      setCargando(false);
    }
  }, [barrio]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtrado de actividades en el mapa
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((act) => {
      if (categoriasSeleccionadas.length > 0) {
        if (!categoriasSeleccionadas.includes(act.categoria.slug)) {
          return false;
        }
      }

      if (q && q.trim()) {
        const termino = q.toLowerCase().trim();
        const coincide =
          act.nombre.toLowerCase().includes(termino) ||
          act.descripcion.toLowerCase().includes(termino) ||
          act.direccion.toLowerCase().includes(termino);
        if (!coincide) return false;
      }

      return true;
    });
  }, [actividades, categoriasSeleccionadas, q]);

  const barrioActual = useMemo(() => {
    if (!barrio) return "Toda la Comuna 9";
    const b = barrios.find((x) => x.slug === barrio);
    return b ? b.nombre : "Toda la Comuna 9";
  }, [barrios, barrio]);

  const actividadSeleccionada = useMemo(() => {
    if (!actividadSeleccionadaId) return null;
    return actividades.find((a) => a.id === actividadSeleccionadaId) || null;
  }, [actividades, actividadSeleccionadaId]);

  return (
    <div className="w-full bg-brand-bg py-5 md:py-7 font-body text-brand-ink min-h-[calc(100vh-140px)] flex flex-col">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8 flex-1 flex flex-col">

        {/* ── Encabezado y Barra de Búsqueda Superior ── */}
        <section className="mb-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-brand-gray-light bg-brand-white p-3 shadow-[0_6px_11px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:rounded-full md:p-2.5">
            {/* Input de Búsqueda */}
            <div className="flex flex-1 items-center gap-3 rounded-full border border-brand-gray-light bg-brand-bg px-4 py-2.5 transition-colors focus-within:border-brand-orange focus-within:bg-brand-white">
              <Search size={18} className="text-brand-orange shrink-0" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar actividades en el mapa por nombre o calle..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent font-body text-sm text-brand-ink placeholder:text-brand-muted outline-none"
                aria-label="Buscar en el mapa"
              />
              {q && (
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

            {/* Selector de Barrio */}
            <div className="flex items-center gap-2 rounded-full border border-brand-gray-light bg-brand-bg px-4 py-2.5 md:w-64 transition-colors focus-within:border-brand-orange focus-within:bg-brand-white">
              <MapPin size={18} className="text-brand-orange shrink-0" aria-hidden="true" />
              <select
                value={barrio}
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

            {/* Botón de acceso directo al Catálogo */}
            <Link
              to="/explorar"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-gray-light bg-brand-bg px-4 py-2 font-sans text-xs font-semibold text-brand-gray hover:border-brand-orange hover:text-brand-ink hover:bg-brand-white transition-all shrink-0"
              title="Ir a la vista de lista completa"
            >
              <LayoutGrid size={15} className="text-brand-orange" />
              <span>Ver en catálogo</span>
            </Link>
          </div>
        </section>

        {/* ── Tira de Filtros de Categoría ── */}
        <section className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => actualizarParams({ categorias: null })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-all shrink-0 ${
                categoriasSeleccionadas.length === 0
                  ? "bg-brand-ink text-brand-white shadow-sm"
                  : "border border-brand-gray-light bg-brand-white text-brand-gray hover:border-brand-orange hover:text-brand-ink"
              }`}
              aria-pressed={categoriasSeleccionadas.length === 0}
            >
              <Layers size={13} strokeWidth={2.2} />
              <span>Todas las categorías</span>
            </button>

            {categoriasCatalogo.map((cat) => (
              <CategoriaChip
                key={cat.id}
                categoria={cat}
                seleccionada={categoriasSeleccionadas.includes(cat.slug)}
                onAlternar={() => alternarCategoria(cat.slug)}
              />
            ))}
          </div>
        </section>

        {/* ── Subtítulo de Información de Puntos en el Mapa ── */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-brand-gray-light pb-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl md:text-2xl text-brand-gray">
              Mapa Cultural
            </h1>
            <span className="text-xs font-medium font-body text-brand-muted">
              ({actividadesFiltradas.length}{" "}
              {actividadesFiltradas.length === 1 ? "lugar visible" : "lugares visibles"} en {barrioActual})
            </span>
          </div>

          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-brand-orange hover:text-brand-orange-light underline underline-offset-4"
            >
              <RotateCcw size={13} />
              <span>Restablecer mapa</span>
            </button>
          )}
        </div>

        {/* ── Contenedor Principal del Mapa ── */}
        {error ? (
          <EstadoError descripcion={error} onReintentar={cargarDatos} />
        ) : cargando ? (
          <div className="w-full flex-1 min-h-[500px]">
            <Esqueleto alto={600} />
          </div>
        ) : (
          <div className="relative w-full flex-1 min-h-[520px] md:min-h-[640px] rounded-3xl overflow-hidden shadow-[0_6px_11px_rgba(0,0,0,0.08)] border border-brand-gray-light">
            <MapaLeaflet
              actividades={actividadesFiltradas}
              actividadSeleccionadaId={actividadSeleccionadaId}
              onSeleccionarActividad={(act) => setActividadSeleccionadaId(act.id)}
              altura="100%"
            />

            {/* Tarjeta flotante inferior / lateral con la actividad seleccionada */}
            {actividadSeleccionada && (
              <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-[500] rounded-2xl border border-brand-gray-light bg-brand-white p-4 shadow-[0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CategoriaChip categoria={actividadSeleccionada.categoria} />
                    {actividadSeleccionada.destacado && <Badge tipo="destacada" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActividadSeleccionadaId(null)}
                    className="rounded-full p-1 text-brand-muted hover:bg-brand-gray-light hover:text-brand-ink"
                    aria-label="Cerrar detalle"
                  >
                    <X size={16} />
                  </button>
                </div>

                <h3 className="mt-2 font-display text-lg text-brand-gray leading-snug">
                  {actividadSeleccionada.nombre}
                </h3>

                <p className="mt-1 font-body text-xs text-brand-muted">
                  {actividadSeleccionada.direccion} · {actividadSeleccionada.barrio.nombre}
                </p>

                {actividadSeleccionada.descripcion && (
                  <p className="mt-2 font-body text-xs text-brand-gray line-clamp-2">
                    {actividadSeleccionada.descripcion}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-brand-gray-light">
                  <span className="font-body text-xs font-semibold text-brand-orange">
                    {actividadSeleccionada.horarios || "Horario a consultar"}
                  </span>
                  <Link
                    to={`/actividades/${actividadSeleccionada.barrio.slug}/${actividadSeleccionada.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3.5 py-1.5 font-sans text-xs font-semibold text-brand-ink hover:bg-brand-orange-light shadow-xs"
                  >
                    <span>Ver ficha completa</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
