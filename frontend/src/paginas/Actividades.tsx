import { useEffect, useState } from "react";
import ActividadCard from "../componentes/ActividadCard";
import Filtros from "../componentes/Filtros";
import {
  obtenerActividades,
  obtenerBarrios,
  obtenerCategorias,
  obtenerIdsFavoritos,
  agregarFavorito,
  eliminarFavorito
} from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Geolocalización
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [ordenarPorCercania, setOrdenarPorCercania] = useState(false);

  // Favoritos
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const token = localStorage.getItem("cc_token") ?? "";

  useEffect(() => {
    Promise.all([
      obtenerActividades(),
      obtenerBarrios(),
      obtenerCategorias(),
      token ? obtenerIdsFavoritos(token).catch(() => []) : Promise.resolve([])
    ])
      .then(([acts, barrs, cats, favs]) => {
        setActividades(acts);
        setBarrios(barrs);
        setCategorias(cats);
        setFavoritosIds(favs);
      })
      .catch(() => setError("No se pudieron cargar las actividades."))
      .finally(() => setCargando(false));
  }, [token]);

  function solicitarUbicacion() {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionUsuario({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setOrdenarPorCercania(true);
        setBuscandoUbicacion(false);
      },
      () => {
        alert("No se pudo obtener tu ubicación. Verificá los permisos de GPS.");
        setBuscandoUbicacion(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async function handleToggleFavorito(actividadId: string) {
    if (!token) {
      alert("Iniciá sesión para guardar actividades en favoritos.");
      return;
    }
    const esFav = favoritosIds.includes(actividadId);
    try {
      if (esFav) {
        await eliminarFavorito(token, actividadId);
        setFavoritosIds((prev) => prev.filter((id) => id !== actividadId));
      } else {
        await agregarFavorito(token, actividadId);
        setFavoritosIds((prev) => [...prev, actividadId]);
      }
    } catch {
      alert("No se pudo actualizar favoritos.");
    }
  }

  let filtradas = actividades.filter((a) => {
    if (barrioSeleccionado && a.barrio.slug !== barrioSeleccionado) return false;
    if (categoriaSeleccionada && a.categoria.slug !== categoriaSeleccionada) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const coincide =
        a.nombre.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        a.direccion.toLowerCase().includes(q);
      if (!coincide) return false;
    }
    return true;
  });

  // Si hay ubicación activa, calcular distancias
  if (ubicacionUsuario) {
    filtradas = filtradas.map((a) => ({
      ...a,
      distanciaKm: calcularDistancia(
        ubicacionUsuario.lat,
        ubicacionUsuario.lng,
        a.lat,
        a.lng
      )
    }));

    if (ordenarPorCercania) {
      filtradas.sort((a, b) => (a.distanciaKm ?? 999) - (b.distanciaKm ?? 999));
    }
  }

  return (
    <div className="main">
      <div style={{ marginBottom: "28px" }}>
        <h1>📋 Catálogo y Agenda Cultural</h1>
        <p style={{ color: "var(--gris)", marginTop: "8px" }}>
          {actividades.length} actividades en los barrios de Mataderos y alrededores.
          Buscá, ordená por cercanía en tiempo real y descubrí qué hacer cerca tuyo.
        </p>
      </div>

      {/* Barra de herramientas: Búsqueda y Geolocalización */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre, taller, dirección o palabra clave…"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radio)",
              border: "1px solid var(--borde)",
              fontSize: "0.95rem"
            }}
          />
        </div>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={solicitarUbicacion}
          disabled={buscandoUbicacion}
          style={{
            padding: "10px 18px",
            borderColor: ordenarPorCercania ? "var(--naranja)" : "var(--borde)",
            color: ordenarPorCercania ? "var(--naranja)" : "var(--texto)",
            background: ordenarPorCercania ? "#fffaf5" : "var(--blanco)",
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}
        >
          {buscandoUbicacion ? "📍 Obteniendo GPS…" : ordenarPorCercania ? "✓ Ordenado por cercanía" : "📍 Cerca de mí"}
        </button>

        {ordenarPorCercania && (
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => setOrdenarPorCercania(false)}
            style={{ padding: "10px 14px", fontSize: "0.85rem" }}
          >
            Quitar orden GPS
          </button>
        )}
      </div>

      <Filtros
        barrios={barrios}
        categorias={categorias}
        barrioSeleccionado={barrioSeleccionado}
        categoriaSeleccionada={categoriaSeleccionada}
        onBarrioChange={setBarrioSeleccionado}
        onCategoriaChange={setCategoriaSeleccionada}
        onLimpiar={() => {
          setBarrioSeleccionado("");
          setCategoriaSeleccionada("");
          setBusqueda("");
        }}
      />

      {cargando && <p className="cargando">Cargando actividades…</p>}
      {error && <div className="alerta alerta-error">{error}</div>}

      {!cargando && !error && filtradas.length === 0 && (
        <div className="alerta">
          No hay actividades que coincidan con los filtros o tu búsqueda. Probá cambiar los términos
          o hacer clic en "Limpiar filtros".
        </div>
      )}

      {!cargando && !error && filtradas.length > 0 && (
        <div className="grilla">
          {filtradas.map((a) => (
            <ActividadCard
              key={a.id}
              actividad={a}
              esFavorito={favoritosIds.includes(a.id)}
              onToggleFavorito={token ? handleToggleFavorito : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
