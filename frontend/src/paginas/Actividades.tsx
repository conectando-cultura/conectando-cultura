import { useEffect, useState } from "react";
import ActividadCard from "../componentes/ActividadCard";
import Filtros from "../componentes/Filtros";
import { obtenerActividades, obtenerBarrios, obtenerCategorias } from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
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
      <div style={{ marginBottom: "28px" }}>
        <h1>Actividades Culturales</h1>
        <p style={{ color: "var(--gris)", marginTop: "8px" }}>
          {actividades.length} actividades en los barrios de Mataderos y alrededores.
          Explorá, filtrá y descubrí qué hacer cerca tuyo.
        </p>
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
        }}
      />

      {cargando && <p className="cargando">Cargando actividades…</p>}
      {error && <div className="alerta alerta-error">{error}</div>}

      {!cargando && !error && filtradas.length === 0 && (
        <div className="alerta">
          No hay actividades que coincidan con los filtros. Probá cambiar los filtros
          o hacer click en "Limpiar filtros".
        </div>
      )}

      {!cargando && !error && filtradas.length > 0 && (
        <div className="grilla">
          {filtradas.map((a) => (
            <ActividadCard key={a.id} actividad={a} />
          ))}
        </div>
      )}
    </div>
  );
}
