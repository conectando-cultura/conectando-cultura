import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import {
  obtenerPreferencias,
  guardarPreferencias,
  obtenerBarrios,
  obtenerCategorias
} from "../api/actividades";
import type { Barrio, Categoria } from "../tipos";
import CategoriaChip from "../componentes/CategoriaChip";
import { Boton, Esqueleto, EstadoError, Selector } from "../componentes/base";
import { Check, Sparkles, MapPin, Compass, ArrowRight, Layers } from "lucide-react";

export default function Preferencias(): React.JSX.Element {
  const { usuario, token } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrioId, setBarrioId] = useState<string>("");
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirty state tracking
  const [guardadasBarrioId, setGuardadasBarrioId] = useState<string>("");
  const [guardadasSeleccionadas, setGuardadasSeleccionadas] = useState<string[]>([]);

  const esPrimeraVez = Boolean(
    (ubicacion.state as { primeraVez?: boolean })?.primeraVez
  );

  useEffect(() => {
    if (!token) return;

    Promise.all([
      obtenerBarrios(),
      obtenerCategorias(),
      obtenerPreferencias(token).catch(() => null)
    ])
      .then(([b, c, prefs]) => {
        setBarrios(b);
        setCategorias(c);
        if (prefs) {
          const bId = prefs.barrioId ?? "";
          const catIds = prefs.categorias ? prefs.categorias.map((x) => x.id) : [];
          setBarrioId(bId);
          setSeleccionadas(catIds);
          setGuardadasBarrioId(bId);
          setGuardadasSeleccionadas(catIds);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("No pudimos cargar tus preferencias.");
      })
      .finally(() => setCargando(false));
  }, [token]);

  const alternarCategoria = (id: string) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodas = () => {
    setSeleccionadas(categorias.map((c) => c.id));
  };

  const deseleccionarTodas = () => {
    setSeleccionadas([]);
  };

  const barrioElegidoObj = useMemo(() => {
    if (!barrioId) return null;
    return barrios.find((x) => x.id === barrioId) || null;
  }, [barrios, barrioId]);

  const categoriasElegidasList = useMemo(() => {
    return categorias.filter((c) => seleccionadas.includes(c.id));
  }, [categorias, seleccionadas]);

  // Chequeo si hay cambios sin guardar
  const tieneCambios = useMemo(() => {
    if (barrioId !== guardadasBarrioId) return true;
    if (seleccionadas.length !== guardadasSeleccionadas.length) return true;
    const setGuardadas = new Set(guardadasSeleccionadas);
    return seleccionadas.some((id) => !setGuardadas.has(id));
  }, [barrioId, seleccionadas, guardadasBarrioId, guardadasSeleccionadas]);

  // Parámetros de URL para explorar
  const queryStringExplorar = useMemo(() => {
    const params = new URLSearchParams();
    if (barrioElegidoObj) {
      params.set("barrio", barrioElegidoObj.slug);
    }
    if (categoriasElegidasList.length > 0) {
      params.set("categorias", categoriasElegidasList.map((c) => c.slug).join(","));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [barrioElegidoObj, categoriasElegidasList]);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setGuardando(true);
    setError(null);

    try {
      await guardarPreferencias(token, {
        barrioId: barrioId || null,
        categoriaIds: seleccionadas
      });

      setGuardadasBarrioId(barrioId);
      setGuardadasSeleccionadas(seleccionadas);

      navegar(`/explorar${queryStringExplorar}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar preferencias.");
    } finally {
      setGuardando(false);
    }
  }

  function omitir() {
    navegar("/explorar", { replace: true });
  }

  if (cargando) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <Esqueleto alto="40px" ancho="40%" className="mb-4" />
        <Esqueleto alto="20px" ancho="60%" className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <Esqueleto alto="420px" className="rounded-3xl" />
          <Esqueleto alto="360px" className="rounded-3xl" />
        </div>
      </div>
    );
  }

  const titulo = esPrimeraVez && usuario?.nombre
    ? `Te damos la bienvenida, ${usuario.nombre}`
    : "Tus preferencias culturales";

  return (
    <div className="min-h-screen bg-brand-bg py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Cabecera de Página */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-3">
            <Sparkles size={13} />
            Personalización de cartelera
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-brand-ink mb-2">
            {titulo}
          </h1>
          <p className="font-body text-base text-brand-gray max-w-2xl">
            Elegí qué barrio y qué temáticas culturales querés que prioricemos cuando explores la plataforma.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <EstadoError descripcion={error} />
          </div>
        )}

        <form onSubmit={handleGuardar}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Columna Principal: Configuración */}
            <div className="bg-brand-white rounded-3xl border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] p-6 md:p-8 space-y-8">
              {/* Sección Barrio */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="pref-barrio"
                    className="font-sans font-semibold text-base text-brand-ink flex items-center gap-2"
                  >
                    <MapPin size={18} className="text-brand-orange" />
                    Barrio de preferencia
                  </label>
                  <span className="text-xs text-brand-muted font-body">Comuna 9 · CABA</span>
                </div>
                <p className="font-body text-xs text-brand-gray mb-3">
                  Si elegís uno en particular, te mostraremos primero las actividades que quedan a pocas cuadras.
                </p>
                <Selector
                  id="pref-barrio"
                  variante="campo"
                  icono={<MapPin size={16} />}
                  valor={barrioId}
                  onChange={setBarrioId}
                  ariaLabel="Barrio de preferencia"
                  opciones={[
                    { valor: "", etiqueta: "Todos los barrios de la comuna" },
                    ...barrios.map((b) => ({ valor: b.id, etiqueta: b.nombre }))
                  ]}
                />
              </div>

              {/* Sección Categorías */}
              <div className="pt-6 border-t border-brand-gray-light">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="font-sans font-semibold text-base text-brand-ink flex items-center gap-2">
                      <Layers size={18} className="text-brand-orange" />
                      Categorías de interés
                    </label>
                    <p className="font-body text-xs text-brand-gray mt-1">
                      Tocá las opciones para activar o desactivar lo que te entusiasma.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={seleccionarTodas}
                      className="text-brand-orange hover:underline font-semibold"
                    >
                      Todas
                    </button>
                    <span className="text-brand-muted">·</span>
                    <button
                      type="button"
                      onClick={deseleccionarTodas}
                      className="text-brand-muted hover:text-brand-ink hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {categorias.map((cat) => (
                    <CategoriaChip
                      key={cat.id}
                      categoria={cat}
                      seleccionada={seleccionadas.includes(cat.id)}
                      onAlternar={() => alternarCategoria(cat.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-6 border-t border-brand-gray-light flex flex-wrap items-center gap-4">
                <Boton
                  type="submit"
                  variante="principal"
                  disabled={guardando}
                  icono={<Check size={18} />}
                >
                  {guardando ? "Guardando preferencias..." : "Guardar y explorar"}
                </Boton>

                {esPrimeraVez && (
                  <Boton
                    type="button"
                    variante="secundario"
                    onClick={omitir}
                    disabled={guardando}
                  >
                    Omitir por ahora
                  </Boton>
                )}

                {tieneCambios && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-orange font-semibold">
                    <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                    Cambios sin guardar
                  </span>
                )}
              </div>
            </div>

            {/* Columna Lateral Sticky: Resumen Cultural */}
            <aside className="sticky top-24 rounded-3xl overflow-hidden border border-brand-gray-light bg-brand-white shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
              <div className="bg-brand-orange-light px-6 py-4 flex items-center justify-between">
                <h2 className="font-display text-lg text-brand-ink">
                  Tu resumen cultural
                </h2>
                <Compass size={20} className="text-brand-ink/80" />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-brand-muted font-bold mb-1">
                    Barrio principal
                  </span>
                  <div className="flex items-center gap-2 font-sans font-medium text-sm text-brand-ink">
                    <MapPin size={16} className="text-brand-orange shrink-0" />
                    <span>{barrioElegidoObj ? barrioElegidoObj.nombre : "Todos los barrios"}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-brand-muted font-bold">
                      Categorías elegidas
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-bg text-brand-gray">
                      {seleccionadas.length === 0 ? "Todas" : seleccionadas.length}
                    </span>
                  </div>

                  {categoriasElegidasList.length === 0 ? (
                    <p className="font-body text-xs text-brand-muted italic">
                      Te mostraremos todas las categorías culturales sin filtros.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {categoriasElegidasList.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2.5 py-1 rounded-full text-xs font-sans font-medium bg-brand-bg text-brand-ink border border-brand-gray-light"
                        >
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-brand-gray-light text-xs text-brand-gray font-body space-y-3">
                  <p>
                    Cuando entres a la cartelera, estos filtros se aplicarán automáticamente a tus búsquedas.
                  </p>
                  <Link
                    to={`/explorar${queryStringExplorar}`}
                    className="inline-flex items-center gap-1.5 text-brand-orange font-semibold hover:underline"
                  >
                    Ver vista previa en catálogo
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
