import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import {
  obtenerPreferencias,
  guardarPreferencias,
  obtenerBarrios,
  obtenerCategorias
} from "../api/actividades";
import type { Barrio, Categoria } from "../tipos";
import CategoriaChip from "../componentes/CategoriaChip";
import { Boton, Esqueleto, EstadoError } from "../componentes/base";
import { Check } from "lucide-react";

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
          setBarrioId(prefs.barrioId ?? "");
          if (prefs.categorias) {
            setSeleccionadas(prefs.categorias.map((x) => x.id));
          }
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

  const barrioElegido = useMemo(() => {
    if (!barrioId) return "todos los barrios";
    const b = barrios.find((x) => x.id === barrioId);
    return b ? b.nombre : "todos los barrios";
  }, [barrios, barrioId]);

  const categoriasElegidasTexto = useMemo(() => {
    if (seleccionadas.length === 0) return "todas las categorías";
    const nombres = categorias
      .filter((c) => seleccionadas.includes(c.id))
      .map((c) => c.nombre);
    return nombres.join(", ");
  }, [categorias, seleccionadas]);

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

      // Construir URL de redirección a Explorar con los filtros elegidos
      const params = new URLSearchParams();
      if (barrioId) {
        const b = barrios.find((x) => x.id === barrioId);
        if (b) params.set("barrio", b.slug);
      }
      if (seleccionadas.length > 0) {
        const slugs = categorias
          .filter((c) => seleccionadas.includes(c.id))
          .map((c) => c.slug);
        if (slugs.length > 0) params.set("categorias", slugs.join(","));
      }

      const qs = params.toString();
      navegar(`/explorar${qs ? `?${qs}` : ""}`, { replace: true });
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
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
        <Esqueleto alto={32} ancho="50%" style={{ marginBottom: "16px" }} />
        <Esqueleto alto={18} ancho="70%" style={{ marginBottom: "32px" }} />
        <Esqueleto alto={80} style={{ marginBottom: "24px" }} />
        <Esqueleto alto={200} />
      </div>
    );
  }

  const titulo = esPrimeraVez && usuario?.nombre
    ? `Te damos la bienvenida, ${usuario.nombre}`
    : "Tus preferencias";

  return (
    <div style={{ maxWidth: "740px", margin: "0 auto", padding: "32px 20px 48px", width: "100%", boxSizing: "border-box" }}>
      <h1
        style={{
          fontFamily: "var(--fuente-titulo)",
          fontSize: "30px",
          color: "var(--tinta)",
          margin: "0 0 8px 0"
        }}
      >
        {titulo}
      </h1>
      <p style={{ color: "var(--texto-suave)", fontSize: "16px", margin: "0 0 28px 0" }}>
        Elegí qué actividades querés ver primero al explorar la plataforma.
      </p>

      {error && <EstadoError descripcion={error} />}

      <form onSubmit={handleGuardar}>
        {/* ── Barrio ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: "28px" }}>
          <label
            htmlFor="pref-barrio"
            style={{ display: "block", fontWeight: 700, fontSize: "15px", marginBottom: "8px", color: "var(--tinta)" }}
          >
            Barrio de preferencia
          </label>
          <select
            id="pref-barrio"
            value={barrioId}
            onChange={(e) => setBarrioId(e.target.value)}
            style={{
              width: "100%",
              minHeight: "var(--alto-tactil)",
              padding: "0 12px",
              borderRadius: "var(--radio-control)",
              border: "1.5px solid var(--borde-campo)",
              backgroundColor: "var(--blanco)",
              color: "var(--tinta)",
              fontFamily: "var(--fuente-cuerpo)",
              fontSize: "15px"
            }}
          >
            <option value="">Todos los barrios</option>
            {barrios.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* ── Categorías ──────────────────────────────────────────── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--tinta)" }}>
              Categorías de interés
            </span>
            <span style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
              {seleccionadas.length === 0
                ? "Ninguna: te mostramos todo"
                : `${seleccionadas.length} seleccionada${seleccionadas.length > 1 ? "s" : ""}`}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
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

        {/* ── Resumen en vivo ─────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: "var(--papel)",
            border: "1px solid var(--linea)",
            borderRadius: "var(--radio-control)",
            padding: "16px 20px",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: 1.5,
            color: "var(--tinta)"
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>
            Vas a ver primero:
          </strong>
          Actividades en <em>{barrioElegido}</em> · <em>{categoriasElegidasTexto}</em>.
        </div>

        {/* ── Botones ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <Boton
            type="submit"
            variante="principal"
            disabled={guardando}
            icono={<Check size={18} />}
          >
            {guardando ? "Guardando..." : "Guardar y explorar"}
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
        </div>
      </form>
    </div>
  );
}
