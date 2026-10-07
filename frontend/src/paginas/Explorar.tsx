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
  Boton,
  Esqueleto,
  EstadoVacio,
  EstadoError
} from "../componentes/base";
import { Search, Map as IconoMapa, List, X, Check } from "lucide-react";

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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      {/* ── Barra superior de filtros ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}
      >
        {/* Búsqueda por texto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--blanco)",
            border: "1.5px solid var(--borde-campo)",
            borderRadius: "var(--radio-control)",
            padding: "0 12px",
            minHeight: "var(--alto-tactil)",
            flex: "1 1 240px"
          }}
        >
          <Search size={18} color="var(--texto-suave)" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar actividades..."
            value={filtros.q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontFamily: "var(--fuente-cuerpo)",
              fontSize: "15px",
              color: "var(--tinta)"
            }}
          />
          {filtros.q && (
            <button
              type="button"
              onClick={() => setQ("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--texto-suave)" }}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Selector de barrio */}
        <div style={{ flex: "0 1 200px" }}>
          <select
            value={filtros.barrio}
            onChange={(e) => setBarrio(e.target.value)}
            style={{
              width: "100%",
              minHeight: "var(--alto-tactil)",
              padding: "0 12px",
              borderRadius: "var(--radio-control)",
              border: "1.5px solid var(--borde-campo)",
              backgroundColor: "var(--blanco)",
              color: "var(--tinta)",
              fontFamily: "var(--fuente-cuerpo)",
              fontSize: "15px",
              cursor: "pointer"
            }}
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

        {/* Toggle Mapa / Lista (en móvil / selector de vista) */}
        <div
          style={{
            display: "flex",
            borderRadius: "var(--radio-control)",
            border: "1px solid var(--linea)",
            overflow: "hidden",
            marginLeft: "auto"
          }}
        >
          <button
            type="button"
            onClick={() => setVista(filtros.vista === "mapa" ? "ambas" : "mapa")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: filtros.vista === "mapa" ? "var(--boton-fondo)" : "var(--blanco)",
              color: filtros.vista === "mapa" ? "var(--boton-texto)" : "var(--tinta)",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px"
            }}
            aria-pressed={filtros.vista === "mapa"}
          >
            <IconoMapa size={16} />
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setVista(filtros.vista === "lista" ? "ambas" : "lista")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: filtros.vista === "lista" ? "var(--boton-fondo)" : "var(--blanco)",
              color: filtros.vista === "lista" ? "var(--boton-texto)" : "var(--tinta)",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px"
            }}
            aria-pressed={filtros.vista === "lista"}
          >
            <List size={16} />
            Lista
          </button>
        </div>
      </div>

      {/* ── Chips de categoría ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "16px",
          alignItems: "center"
        }}
      >
        <button
          type="button"
          onClick={() => setCategorias([])}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "var(--radio-pildora)",
            border: "2px solid",
            borderColor: todasLasCategorias ? "var(--tinta)" : "transparent",
            backgroundColor: todasLasCategorias ? "var(--tinta)" : "var(--papel)",
            color: todasLasCategorias ? "var(--blanco)" : "var(--tinta)",
            fontFamily: "var(--fuente-cuerpo)",
            fontSize: "14px",
            fontWeight: todasLasCategorias ? 700 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
          aria-pressed={todasLasCategorias}
        >
          {todasLasCategorias && <Check size={16} />}
          Todas
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

      {/* Aviso de filtros activos */}
      {tieneFiltrosActivos && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "var(--papel)",
            borderRadius: "var(--radio-control)",
            fontSize: "14px",
            marginBottom: "16px"
          }}
        >
          <span>
            {preferenciasAplicadas
              ? `Filtrando por tus preferencias (${actividadesFiltradas.length} actividades)`
              : `Mostrando resultados filtrados (${actividadesFiltradas.length} actividades)`}
          </span>
          <Boton
            variante="texto"
            onClick={() => {
              setPreferenciasAplicadas(false);
              limpiarFiltros();
            }}
          >
            Quitar
          </Boton>
        </div>
      )}

      {/* ── Contenido: Lista y Mapa sincronizados ───────────────────── */}
      {error ? (
        <EstadoError descripcion={error} onReintentar={cargarDatos} />
      ) : cargando ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Esqueleto alto={180} />
            <Esqueleto alto={180} />
            <Esqueleto alto={180} />
          </div>
          <Esqueleto alto={560} />
        </div>
      ) : actividadesFiltradas.length === 0 ? (
        <EstadoVacio
          titulo={`No hay actividades en ${barrioActual}`}
          descripcion="Probá con otros filtros o explorá todos los barrios."
          textoBoton="Ver todos los barrios"
          onAccion={limpiarFiltros}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              filtros.vista === "mapa"
                ? "1fr"
                : filtros.vista === "lista"
                ? "1fr"
                : "minmax(320px, 420px) 1fr",
            gap: "20px",
            alignItems: "start"
          }}
        >
          {/* Columna de Lista */}
          {filtros.vista !== "mapa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--texto-suave)" }}>
                {actividadesFiltradas.length}{" "}
                {actividadesFiltradas.length === 1 ? "actividad" : "actividades"} · {barrioActual}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  maxHeight: filtros.vista === "ambas" ? "750px" : "none",
                  overflowY: filtros.vista === "ambas" ? "auto" : "visible",
                  paddingRight: filtros.vista === "ambas" ? "6px" : 0
                }}
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
            </div>
          )}

          {/* Columna de Mapa */}
          {filtros.vista !== "lista" && (
            <div
              style={{
                position: filtros.vista === "ambas" ? "sticky" : "relative",
                top: "20px",
                height: filtros.vista === "ambas" ? "750px" : "600px"
              }}
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
  );
}
