import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerActividades, obtenerBarrios, obtenerCategorias } from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";
import ActividadCard from "../componentes/ActividadCard";
import CategoriaChip from "../componentes/CategoriaChip";
import { Esqueleto, Tarjeta } from "../componentes/base";
import { ArrowRight, MapPin } from "lucide-react";

export default function Inicio(): React.JSX.Element {
  const [destacadas, setDestacadas] = useState<Actividad[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      obtenerActividades({ limite: 6 }),
      obtenerCategorias(),
      obtenerBarrios()
    ])
      .then(([actividades, cats, bars]) => {
        setDestacadas(actividades.filter((a) => a.destacado).slice(0, 3));
        setCategorias(cats);
        setBarrios(bars);
      })
      .catch((err) => console.error("Error al cargar datos de inicio:", err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "20px 20px 48px", width: "100%", boxSizing: "border-box" }}>
      {/* ── Portada ─────────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "40px 0 32px" }}>
        <h1
          style={{
            fontFamily: "var(--fuente-titulo)",
            fontSize: "clamp(36px, 6vw, 56px)",
            lineHeight: 1.1,
            color: "var(--tinta)",
            margin: "0 0 16px 0"
          }}
        >
          Un barrio, <span style={{ color: "var(--chapa)" }}>muchos colores</span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "var(--texto-suave)",
            maxWidth: "600px",
            margin: "0 auto 28px",
            lineHeight: 1.5
          }}
        >
          Encontrá las ferias, espectáculos, museos y talleres culturales de Mataderos y barrios linderos en un solo lugar.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/explorar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 24px",
              minHeight: "var(--alto-tactil)",
              backgroundColor: "var(--boton-fondo)",
              color: "var(--boton-texto)",
              borderRadius: "var(--radio-control)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "15px"
            }}
          >
            Explorar actividades
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/registro"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0 20px",
              minHeight: "var(--alto-tactil)",
              backgroundColor: "transparent",
              color: "var(--tinta)",
              border: "2px solid var(--tinta)",
              borderRadius: "var(--radio-control)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "15px"
            }}
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      {/* ── Qué querés hacer (Categorías) ────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "24px", margin: 0, color: "var(--tinta)" }}>
            Qué querés hacer
          </h2>
          <Link
            to="/explorar"
            style={{ fontSize: "14px", fontWeight: 700, color: "var(--chapa)", textDecoration: "none" }}
          >
            Ver todas →
          </Link>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              to={`/explorar?categorias=${cat.slug}`}
              style={{ textDecoration: "none" }}
            >
              <CategoriaChip categoria={cat} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Actividades destacadas ──────────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "24px", margin: 0, color: "var(--tinta)" }}>
            Actividades destacadas
          </h2>
          <Link
            to="/explorar"
            style={{ fontSize: "14px", fontWeight: 700, color: "var(--chapa)", textDecoration: "none" }}
          >
            Ver listado completo →
          </Link>
        </div>
        {cargando ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <Esqueleto alto={260} />
            <Esqueleto alto={260} />
            <Esqueleto alto={260} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {destacadas.map((act) => (
              <ActividadCard key={act.id} actividad={act} />
            ))}
          </div>
        )}
      </section>

      {/* ── Explorá por barrio ───────────────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "24px", margin: "0 0 16px 0", color: "var(--tinta)" }}>
          Explorá por barrio
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          {barrios.map((b) => (
            <Link
              key={b.id}
              to={`/explorar?barrio=${b.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Tarjeta interactiva style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <MapPin size={18} color="var(--chapa)" />
                  <strong style={{ fontSize: "16px" }}>{b.nombre}</strong>
                </div>
                <span style={{ fontSize: "13px", color: "var(--texto-suave)" }}>
                  Ver mapa y actividades →
                </span>
              </Tarjeta>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Enterate primero (CTA registro) ─────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--papel)",
          borderRadius: "var(--radio-tarjeta)",
          padding: "32px 24px",
          textAlign: "center"
        }}
      >
        <h2 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "24px", margin: "0 0 10px 0", color: "var(--tinta)" }}>
          Enterate primero
        </h2>
        <p style={{ color: "var(--texto-suave)", maxWidth: "500px", margin: "0 auto 20px", fontSize: "15px" }}>
          Creá tu cuenta gratis, elegí tus categorías y barrios favoritos para ver primero lo que más te interesa.
        </p>
        <Link
          to="/registro"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0 22px",
            minHeight: "var(--alto-tactil)",
            backgroundColor: "var(--boton-fondo)",
            color: "var(--boton-texto)",
            borderRadius: "var(--radio-control)",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "15px"
          }}
        >
          Crear cuenta
        </Link>
      </section>
    </div>
  );
}