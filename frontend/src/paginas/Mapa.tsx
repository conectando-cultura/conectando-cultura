import { useEffect, useState } from "react";
import MapaLeaflet from "../componentes/MapaLeaflet";
import ActividadCard from "../componentes/ActividadCard";
import Filtros from "../componentes/Filtros";
import { obtenerActividades, obtenerBarrios, obtenerCategorias } from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";

export default function Mapa() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [vista, setVista] = useState<"mapa" | "lista">("mapa");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([obtenerActividades(), obtenerBarrios(), obtenerCategorias()])
      .then(([acts, barrs, cats]) => {
        setActividades(acts);
        setBarrios(barrs);
        setCategorias(cats);
      })
      .catch(() => setError("No se pudieron cargar las actividades."))
      .finally(() => setCargando(false));
  }, []);

  const filtradas = actividades.filter((a) => {
    if (barrioSeleccionado && a.barrio.slug !== barrioSeleccionado) return false;
    if (categoriaSeleccionada && a.categoria.slug !== categoriaSeleccionada)
      return false;
    return true;
  });

  return (
    <div className="main">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <h1>🗺️ Mapa de Actividades</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={vista === "mapa" ? "btn btn-primario" : "btn btn-secundario"}
            onClick={() => setVista("mapa")}
          >
            Mapa
          </button>
          <button
            className={vista === "lista" ? "btn btn-primario" : "btn btn-secundario"}
            onClick={() => setVista("lista")}
          >
            Lista ({filtradas.length})
          </button>
        </div>
      </div>

      <Filtros
        barrios={barrios}
        categorias={categorias}
        barrioSeleccionado={barrioSeleccionado}
        categoriaSeleccionada={categoriaSeleccionada}
        onBarrioChange={setBarrioSeleccionado}
        onCategoriaChange={setCategoriaSeleccionada}
        onLimpiar={() => { setBarrioSeleccionado(""); setCategoriaSeleccionada(""); }}
      />

      {cargando && <p className="cargando">Cargando mapa…</p>}
      {error && <div className="alerta alerta-error">{error}</div>}

      {!cargando && !error && vista === "mapa" && (
        <MapaLeaflet actividades={filtradas} />
      )}

      {!cargando && !error && vista === "lista" && (
        <>
          {filtradas.length === 0 ? (
            <div className="alerta">
              No hay actividades que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="grilla">
              {filtradas.map((a) => (
                <ActividadCard key={a.id} actividad={a} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
