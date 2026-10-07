import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerActividad, obtenerActividades } from "../api/actividades";
import type { Actividad } from "../tipos";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import CategoriaChip from "../componentes/CategoriaChip";
import { Badge, Boton, Esqueleto, EstadoError } from "../componentes/base";
import { IconoCategoria } from "../componentes/iconos";
import ActividadCard from "../componentes/ActividadCard";
import MapaLeaflet from "../componentes/MapaLeaflet";
import {
  Navigation,
  Share2,
  ExternalLink,
  Clock,
  MapPin,
  Pencil,
  Check
} from "lucide-react";

export default function DetalleActividad(): React.JSX.Element {
  const { barrio, slug } = useParams<{ barrio: string; slug: string }>();
  const { usuario } = useAuth();

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [relacionadas, setRelacionadas] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!slug || !barrio) return;

    setCargando(true);
    setError(null);

    obtenerActividad(slug, barrio)
      .then((datos) => {
        setActividad(datos);
        // Cargar otras actividades del mismo barrio
        return obtenerActividades({ barrioSlug: barrio, limite: 4 });
      })
      .then((lista) => {
        // Excluir la actividad actual
        setRelacionadas(lista.filter((a) => a.slug !== slug).slice(0, 3));
      })
      .catch((err) => {
        console.error(err);
        setError("No encontramos esa actividad o no está disponible.");
      })
      .finally(() => setCargando(false));
  }, [slug, barrio]);

  const puedeEditar = puedeUsuario(usuario, "actividades:escribir");

  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: actividad?.nombre,
          text: actividad?.descripcion,
          url
        });
      } catch {
        // El usuario canceló el diálogo nativo
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  if (cargando) {
    return (
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>
        <Esqueleto alto={24} ancho="40%" style={{ marginBottom: "20px" }} />
        <Esqueleto alto={280} style={{ marginBottom: "24px" }} />
        <Esqueleto alto={36} ancho="70%" style={{ marginBottom: "16px" }} />
        <Esqueleto alto={100} />
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px" }}>
        <EstadoError
          titulo="Actividad no encontrada"
          descripcion="La actividad que buscás no existe o fue dada de baja."
          textoReintentar="Volver a explorar"
          onReintentar={() => window.location.assign("/explorar")}
        />
      </div>
    );
  }

  const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${actividad.lat},${actividad.lng}`;

  return (
    <article style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px", fontFamily: "var(--fuente-cuerpo)" }}>
      {/* ── Migas de pan y botón Editar ─────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "14px",
          color: "var(--texto-suave)",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "8px"
        }}
        aria-label="Miga de pan"
      >
        <div>
          <Link to="/" style={{ color: "var(--texto-suave)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <Link to="/explorar" style={{ color: "var(--texto-suave)", textDecoration: "none" }}>Actividades</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <Link to={`/explorar?barrio=${actividad.barrio.slug}`} style={{ color: "var(--texto-suave)", textDecoration: "none" }}>
            {actividad.barrio.nombre}
          </Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--tinta)", fontWeight: 600 }}>{actividad.nombre}</span>
        </div>

        {puedeEditar && (
          <Link
            to={`/admin/actividades`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "var(--radio-control)",
              border: "1px solid var(--tinta)",
              color: "var(--tinta)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px"
            }}
          >
            <Pencil size={14} />
            Editar actividad
          </Link>
        )}
      </nav>

      {/* ── Imagen de cabecera o bloque de categoría ────────────────── */}
      {actividad.imagenUrl ? (
        <div
          style={{
            width: "100%",
            height: "320px",
            borderRadius: "var(--radio-tarjeta)",
            overflow: "hidden",
            marginBottom: "20px"
          }}
        >
          <img
            src={actividad.imagenUrl}
            alt={actividad.nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "180px",
            borderRadius: "var(--radio-tarjeta)",
            backgroundColor: `${actividad.categoria.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: actividad.categoria.color,
            marginBottom: "20px"
          }}
          aria-hidden="true"
        >
          <IconoCategoria
            clave={actividad.categoria.icono}
            slug={actividad.categoria.slug}
            nombre={actividad.categoria.nombre}
            tamano={56}
          />
        </div>
      )}

      {/* ── Chips y Badges ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <CategoriaChip categoria={actividad.categoria} />
        {actividad.destacado && <Badge tipo="destacada" />}
      </div>

      {/* ── Título principal ───────────────────────────────────────── */}
      <h1
        style={{
          fontFamily: "var(--fuente-titulo)",
          fontSize: "32px",
          color: "var(--tinta)",
          margin: "0 0 16px 0",
          lineHeight: 1.15
        }}
      >
        {actividad.nombre}
      </h1>

      {/* ── Botones de acción ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
        <a
          href={urlGoogleMaps}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 18px",
            minHeight: "var(--alto-tactil)",
            backgroundColor: "var(--boton-fondo)",
            color: "var(--boton-texto)",
            borderRadius: "var(--radio-control)",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "15px"
          }}
        >
          <Navigation size={18} />
          Cómo llegar
        </a>

        <Boton
          variante="secundario"
          icono={copiado ? <Check size={18} /> : <Share2 size={18} />}
          onClick={compartir}
        >
          {copiado ? "Enlace copiado" : "Compartir"}
        </Boton>

        {actividad.url && (
          <a
            href={actividad.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 18px",
              minHeight: "var(--alto-tactil)",
              backgroundColor: "transparent",
              color: "var(--tinta)",
              border: "2px solid var(--linea)",
              borderRadius: "var(--radio-control)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "15px"
            }}
          >
            <ExternalLink size={18} />
            Sitio web oficial
          </a>
        )}
      </div>

      {/* ── Bloque Antes de ir + Mini mapa ──────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "36px",
          alignItems: "start"
        }}
      >
        <div
          style={{
            backgroundColor: "var(--blanco)",
            border: "1px solid var(--linea)",
            borderRadius: "var(--radio-tarjeta)",
            padding: "20px"
          }}
        >
          <h2 style={{ fontSize: "18px", margin: "0 0 16px 0", color: "var(--tinta)" }}>
            Antes de ir
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <MapPin size={18} color="var(--texto-suave)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", color: "var(--tinta)" }}>Dirección</strong>
                <span style={{ color: "var(--texto-suave)" }}>{actividad.direccion} ({actividad.barrio.nombre})</span>
              </div>
            </div>

            {actividad.horarios && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <Clock size={18} color="var(--texto-suave)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ display: "block", color: "var(--tinta)" }}>Horarios</strong>
                  <span style={{ color: "var(--texto-suave)" }}>{actividad.horarios}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mini mapa */}
        <div style={{ height: "220px" }}>
          <MapaLeaflet
            actividades={[actividad]}
            centro={[actividad.lat, actividad.lng]}
            zoom={15}
            altura="100%"
          />
        </div>
      </div>

      {/* ── Sobre esta actividad ────────────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "22px", margin: "0 0 14px 0", color: "var(--tinta)" }}>
          Sobre esta actividad
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "var(--tinta)", maxWidth: "68ch" }}>
          {actividad.descripcion}
        </p>
      </section>

      {/* ── Más en este barrio ──────────────────────────────────────── */}
      {relacionadas.length > 0 && (
        <section style={{ borderTop: "1px solid var(--linea)", paddingTop: "36px" }}>
          <h2 style={{ fontSize: "22px", margin: "0 0 20px 0", color: "var(--tinta)" }}>
            Más actividades en {actividad.barrio.nombre}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {relacionadas.map((rel) => (
              <ActividadCard key={rel.id} actividad={rel} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
