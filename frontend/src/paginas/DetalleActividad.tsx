import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerActividad, obtenerActividades } from "../api/actividades";
import type { Actividad } from "../tipos";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import CategoriaChip from "../componentes/CategoriaChip";
import { Badge, Esqueleto, EstadoError } from "../componentes/base";
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
  Check,
  ChevronRight
} from "lucide-react";
import estilos from "./DetalleActividad.module.css";

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
      <div className="w-full bg-brand-bg py-10 font-body">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Esqueleto alto={28} ancho="30%" className="mb-6 rounded-full" />
          <Esqueleto alto={420} className="mb-8 rounded-3xl" />
          <Esqueleto alto={40} ancho="65%" className="mb-4 rounded-xl" />
          <Esqueleto alto={120} className="rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="w-full bg-brand-bg py-16 font-body">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <EstadoError
            titulo="Actividad no encontrada"
            descripcion="La actividad que buscás no existe o fue dada de baja en este barrio."
            textoReintentar="Volver al catálogo"
            onReintentar={() => window.location.assign("/explorar")}
          />
        </div>
      </div>
    );
  }

  const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${actividad.lat},${actividad.lng}`;

  return (
    <article className="w-full bg-brand-bg font-body text-brand-ink">
      
      {/* ── DesignHero: Portada inmersiva con gradiente y título Kavoon ── */}
      <section className="relative flex h-[380px] md:h-[500px] items-center justify-center overflow-hidden bg-brand-ink">
        {actividad.imagenUrl ? (
          <img
            src={actividad.imagenUrl}
            alt={actividad.nombre}
            className={`absolute inset-0 h-full w-full object-cover ${estilos.heroImagen}`}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-40"
            style={{ backgroundColor: actividad.categoria.color }}
            aria-hidden="true"
          >
            <IconoCategoria
              clave={actividad.categoria.icono}
              slug={actividad.categoria.slug}
              nombre={actividad.categoria.nombre}
              tamano={120}
            />
          </div>
        )}

        {/* Gradiente oscuro superior e inferior Croquis */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75" />

        {/* Contenido centrado del Hero */}
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-8 text-center">
          {/* Miga de pan sutil integrada */}
          <nav
            aria-label="Miga de pan"
            className="mb-4 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-black/40 px-4 py-1.5 text-xs font-sans text-brand-white backdrop-blur-sm"
          >
            <Link to="/" className="text-white/80 hover:text-white transition-colors hover:no-underline">
              Inicio
            </Link>
            <ChevronRight size={13} className="text-white/60" aria-hidden="true" />
            <Link to="/explorar" className="text-white/80 hover:text-white transition-colors hover:no-underline">
              Explorar
            </Link>
            <ChevronRight size={13} className="text-white/60" aria-hidden="true" />
            <Link
              to={`/explorar?barrio=${actividad.barrio.slug}`}
              className="text-white/80 hover:text-white transition-colors hover:no-underline"
            >
              {actividad.barrio.nombre}
            </Link>
          </nav>

          {/* Título en tipografía display Kavoon */}
          <h1 className="mx-auto max-w-4xl font-display text-3xl md:text-5xl lg:text-6xl leading-tight text-white drop-shadow-md">
            {actividad.nombre}
          </h1>

          {/* Categoría y barrio badges en hero */}
          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            <CategoriaChip categoria={actividad.categoria} />
            {actividad.destacado && <Badge tipo="destacada" />}
            <span className="rounded-full bg-brand-orange px-3.5 py-1 font-sans text-xs font-bold text-brand-ink shadow-sm">
              {actividad.barrio.nombre}
            </span>
          </div>
        </div>
      </section>

      {/* ── DetailIntro: Cuerpo principal con layout 1fr y sidebar 327px ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        
        {/* Barra de acción rápida superior (RBAC + Compartir) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-brand-gray-light pb-4">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-semibold tracking-wide text-brand-orange uppercase">
              {actividad.barrio.nombre}
            </span>
            <span className="text-brand-muted">·</span>
            <span className="font-body text-sm text-brand-gray">
              {actividad.categoria.nombre}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {puedeEditar && (
              <Link
                to="/admin/actividades"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-ink bg-brand-white px-4 py-2 font-sans text-xs font-bold text-brand-ink transition-colors hover:bg-brand-ink hover:text-brand-white hover:no-underline"
              >
                <Pencil size={14} aria-hidden="true" />
                <span>Editar en panel</span>
              </Link>
            )}

            <button
              type="button"
              onClick={compartir}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-gray-light bg-brand-white px-4 py-2 font-sans text-xs font-semibold text-brand-gray shadow-sm transition-colors hover:border-brand-orange hover:text-brand-orange"
            >
              {copiado ? <Check size={14} className="text-brand-orange" /> : <Share2 size={14} />}
              <span>{copiado ? "Enlace copiado" : "Compartir"}</span>
            </button>
          </div>
        </div>

        {/* Layout en grilla estilo Croquis PackageDetailPage / DetailIntro */}
        <div className="grid gap-8 lg:grid-cols-[1fr_327px] items-start">
          
          {/* Columna Principal: Descripción, CTAs de navegación y Mini Mapa */}
          <div className="flex flex-col gap-8">
            {/* Descripción completa */}
            <section className="rounded-3xl border border-brand-gray-light bg-brand-white p-6 md:p-8 shadow-[0_6px_11px_rgba(0,0,0,0.06)]">
              <h2 className="font-display text-2xl md:text-3xl text-brand-gray mb-4">
                Sobre esta actividad
              </h2>
              <p className="font-body text-base md:text-lg leading-relaxed text-brand-gray whitespace-pre-line">
                {actividad.descripcion}
              </p>

              {/* Botones de acción principales Croquis */}
              <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-brand-gray-light">
                <a
                  href={urlGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 font-sans text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-orange-light hover:no-underline"
                >
                  <Navigation size={17} aria-hidden="true" />
                  <span>Cómo llegar</span>
                </a>

                {actividad.url && (
                  <a
                    href={actividad.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-gray-light bg-brand-white px-5 py-3 font-sans text-sm font-semibold text-brand-gray transition-colors hover:border-brand-orange hover:text-brand-orange hover:no-underline"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    <span>Sitio web oficial</span>
                  </a>
                )}
              </div>
            </section>

            {/* Ubicación interactiva con Mini MapaLeaflet */}
            <section className="rounded-3xl border border-brand-gray-light bg-brand-white p-6 shadow-[0_6px_11px_rgba(0,0,0,0.06)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-brand-gray">Ubicación en el barrio</h3>
                  <p className="font-body text-xs text-brand-muted mt-0.5">
                    {actividad.direccion} · {actividad.barrio.nombre}
                  </p>
                </div>
                <a
                  href={urlGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 font-sans text-xs font-semibold text-brand-orange hover:text-brand-orange-light underline underline-offset-4"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-brand-gray-light">
                <MapaLeaflet
                  actividades={[actividad]}
                  centro={[actividad.lat, actividad.lng]}
                  zoom={15}
                  altura="100%"
                />
              </div>
            </section>
          </div>

          {/* Columna Lateral (Sidebar 327px): Tarjeta "Antes de ir" estilo FeatureList */}
          <aside className="sticky top-6 flex flex-col gap-6">
            <div className={estilos.tarjetaAntesDeIr}>
              <div className={estilos.cabeceraAntesDeIr}>
                <h3 className="font-sans text-base font-bold text-brand-ink">
                  Antes de ir
                </h3>
              </div>
              <ul className="space-y-4 p-6">
                {/* Dirección */}
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-orange">
                    <MapPin size={16} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <span className="block font-sans text-xs font-bold text-brand-ink uppercase tracking-wider">
                      Dirección
                    </span>
                    <p className="mt-0.5 font-body text-sm leading-snug text-brand-gray">
                      {actividad.direccion}
                    </p>
                    <span className="font-body text-xs text-brand-muted">
                      {actividad.barrio.nombre}
                    </span>
                  </div>
                </li>

                {/* Horarios si existen */}
                {actividad.horarios && (
                  <li className="flex items-start gap-3 pt-3 border-t border-brand-gray-light">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-orange">
                      <Clock size={16} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <span className="block font-sans text-xs font-bold text-brand-ink uppercase tracking-wider">
                        Horarios de atención
                      </span>
                      <p className="mt-0.5 font-body text-sm leading-snug text-brand-gray">
                        {actividad.horarios}
                      </p>
                    </div>
                  </li>
                )}

                {/* Categoría cultural */}
                <li className="flex items-start gap-3 pt-3 border-t border-brand-gray-light">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-orange">
                    <IconoCategoria
                      clave={actividad.categoria.icono}
                      slug={actividad.categoria.slug}
                      nombre={actividad.categoria.nombre}
                      tamano={16}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block font-sans text-xs font-bold text-brand-ink uppercase tracking-wider">
                      Categoría
                    </span>
                    <p className="mt-0.5 font-body text-sm font-medium text-brand-gray">
                      {actividad.categoria.nombre}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

        </div>

        {/* ── Actividades Relacionadas en el mismo barrio ── */}
        {relacionadas.length > 0 && (
          <section className="mt-16 border-t border-brand-gray-light pt-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-orange">
                  Seguí descubriendo
                </p>
                <h2 className="mt-1 font-display text-2xl md:text-3xl text-brand-gray">
                  Más actividades en {actividad.barrio.nombre}
                </h2>
              </div>
              <Link
                to={`/explorar?barrio=${actividad.barrio.slug}`}
                className="hidden sm:inline-flex items-center gap-1 font-sans text-xs font-semibold text-brand-orange hover:text-brand-orange-light underline underline-offset-4"
              >
                <span>Ver todas en {actividad.barrio.nombre}</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionadas.map((rel) => (
                <ActividadCard key={rel.id} actividad={rel} />
              ))}
            </div>
          </section>
        )}

      </div>
    </article>
  );
}
