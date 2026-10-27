import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenerActividades, obtenerBarrios, obtenerCategorias } from "../api/actividades";
import type { Actividad, Barrio, Categoria } from "../tipos";
import ActividadCard from "../componentes/ActividadCard";
import { Esqueleto, EstadoError, Selector } from "../componentes/base";
import { IconoCategoria } from "../componentes/iconos";
import { coloresCategoria } from "../utiles/colorCategoria";
import { useAuth } from "../contexto/AuthContext";
import {
  Search,
  MapPin,
  Tag,
  ArrowRight,
  HeartHandshake,
  Sparkles,
  Compass
} from "lucide-react";
import estilos from "./Inicio.module.css";

// 3 Barrios de la Comuna 9 (Liniers, Mataderos y Parque Avellaneda) con imágenes y descripciones culturales
interface BarrioMosaicData {
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string;
}

const BARRIOS_COMUNA_9: BarrioMosaicData[] = [
  {
    nombre: "Liniers",
    slug: "liniers",
    descripcion: "Punto neurálgico de encuentro, ferias populares, gastronomía diversa y vida comunitaria.",
    imagen: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
  },
  {
    nombre: "Mataderos",
    slug: "mataderos",
    descripcion: "Cuna de la tradición gauchesca, la histórica feria dominguera, peñas y centros gauchescos.",
    imagen: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
  },
  {
    nombre: "Parque Avellaneda",
    slug: "parque-avellaneda",
    descripcion: "El emblemático parque, el Centro de Artes Escénicas La Casona y gestión vecinal asociada.",
    imagen: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80"
  }
];

// 3 Pilares comunitarios estilo Croquis whyUs
const PILARES_COMUNITARIOS = [
  {
    icono: Compass,
    titulo: "Cultura de proximidad",
    descripcion: "Descubrí actividades a pocas cuadras de tu casa. Espacios barriales auténticos lejos del circuito comercial."
  },
  {
    icono: HeartHandshake,
    titulo: "Acceso libre y barrial",
    descripcion: "Promovemos el acceso democrático a ferias, talleres, ciclos de cine, peñas y eventos comunitarios sin barreras."
  },
  {
    icono: Sparkles,
    titulo: "Red de espacios culturales",
    descripcion: "Articulamos centros culturales independientes, bibliotecas populares y clubes barriales de la Comuna 9."
  }
];

export default function Inicio(): React.JSX.Element {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del buscador pill straddling
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>("");
  const [barrioSeleccionado, setBarrioSeleccionado] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");

  const cargarDatos = () => {
    setCargando(true);
    setError(null);

    Promise.all([
      obtenerActividades({ limite: 12 }),
      obtenerCategorias(),
      obtenerBarrios()
    ])
      .then(([listaActividades, listaCategorias, listaBarrios]) => {
        setActividades(listaActividades);
        setCategorias(listaCategorias);
        setBarrios(listaBarrios);
      })
      .catch((err) => {
        const mensaje = err instanceof Error ? err.message : "Error al cargar la información de inicio";
        setError(mensaje);
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Actividades destacadas (priorizando destacadas, luego primeras hasta 6)
  const destacadas = useMemo(() => {
    const sonDestacadas = actividades.filter((a) => a.destacado);
    if (sonDestacadas.length >= 6) {
      return sonDestacadas.slice(0, 6);
    }
    const noDestacadas = actividades.filter((a) => !a.destacado);
    return [...sonDestacadas, ...noDestacadas].slice(0, 6);
  }, [actividades]);

  // Manejo del envío del buscador flotante
  const manejarEnvioBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (terminoBusqueda.trim()) {
      params.set("q", terminoBusqueda.trim());
    }
    if (barrioSeleccionado) {
      params.set("barrio", barrioSeleccionado);
    }
    if (categoriaSeleccionada) {
      params.set("categorias", categoriaSeleccionada);
    }
    const queryString = params.toString();
    navigate(queryString ? `/explorar?${queryString}` : "/explorar");
  };

  return (
    <div className="w-full pb-16">
      {/* ── 1. Hero con Comuna 9 messaging + Buscador straddling flotante ── */}
      <section className={estilos.heroContenedor}>
        <div className={estilos.heroFondo}>
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=2000&q=80"
            alt="Comuna 9 cultural"
            className={estilos.heroImagen}
          />
          <div className={estilos.heroGradiente} />
          <div className={estilos.heroContenido}>
            <span className={estilos.heroKicker}>
              Comuna 9 · Liniers, Mataderos y Parque Avellaneda
            </span>
            <h1 className={estilos.heroTitulo}>
              La cultura de tus barrios <span className={estilos.heroAcento}>en un solo lugar</span>
            </h1>
            <p className={estilos.heroSubtitulo}>
              Descubrí ferias artesanales, talleres, centros culturales, teatro y espectáculos en el suroeste porteño.
            </p>
          </div>
        </div>

        {/* Straddling Pill SearchBar */}
        <div className={estilos.buscadorFlotanteWrapper}>
          <form onSubmit={manejarEnvioBusqueda} className={estilos.buscadorPildora}>
            {/* Campo de texto */}
            <div className={estilos.campoWrapper}>
              <Search size={18} className={estilos.iconoCampo} aria-hidden="true" />
              <input
                type="text"
                placeholder="¿Qué actividad buscás?"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className={estilos.inputTexto}
                aria-label="Buscar actividad por texto"
              />
            </div>

            {/* Selector de Barrio */}
            <div className={estilos.campoWrapper}>
              <Selector
                variante="barra"
                icono={<MapPin size={18} />}
                valor={barrioSeleccionado}
                onChange={setBarrioSeleccionado}
                ariaLabel="Filtrar por barrio"
                opciones={[
                  { valor: "", etiqueta: "Todos los barrios" },
                  ...barrios.map((b) => ({ valor: b.slug, etiqueta: b.nombre }))
                ]}
              />
            </div>

            {/* Selector de Categoría */}
            <div className={estilos.campoWrapper}>
              <Selector
                variante="barra"
                icono={<Tag size={18} />}
                valor={categoriaSeleccionada}
                onChange={setCategoriaSeleccionada}
                ariaLabel="Filtrar por categoría cultural"
                opciones={[
                  { valor: "", etiqueta: "Todas las categorías" },
                  ...categorias.map((cat) => ({
                    valor: cat.slug || cat.id,
                    etiqueta: cat.nombre
                  }))
                ]}
              />
            </div>

            {/* Botón de búsqueda */}
            <button type="submit" className={estilos.botonBuscar}>
              <span>Buscar</span>
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      {/* ── 2. Grid de 9 Categorías Culturales (Croquis holidayTypes style) ── */}
      <section className={estilos.seccion}>
        <div className={estilos.cabeceraSeccion}>
          <h2 className={estilos.tituloSeccion}>
            Categorías <span className="text-brand-orange">Culturales</span>
          </h2>
          <p className={estilos.subtituloSeccion}>
            Explorá la diversidad de expresiones comunitarias y artísticas que dan vida a cada rincón barrial.
          </p>
        </div>

        <div className={estilos.gridCategorias}>
          {categorias.slice(0, 9).map((cat) => {
            const colores = coloresCategoria(cat.color);
            return (
              <Link
                key={cat.id}
                to={`/explorar?categorias=${cat.slug || cat.id}`}
                className={estilos.tarjetaCategoria}
                style={
                  {
                    "--cat-accent": colores.solido
                  } as React.CSSProperties
                }
              >
                <div
                  className={estilos.iconoCategoriaCirculo}
                  style={{
                    backgroundColor: colores.fondo,
                    color: colores.texto
                  }}
                >
                  <IconoCategoria
                    clave={cat.icono}
                    slug={cat.slug}
                    nombre={cat.nombre}
                    tamano={34}
                  />
                </div>
                <h3 className={estilos.nombreCategoria}>{cat.nombre}</h3>
                <span className={estilos.explorarCategoriaLink}>
                  <span>Explorar</span>
                  <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3. Actividades Destacadas (Croquis PackageCard grid) ── */}
      <section className={estilos.seccion}>
        <div className={estilos.cabeceraSeccion}>
          <h2 className={estilos.tituloSeccion}>
            Actividades <span className="text-brand-orange">Destacadas</span>
          </h2>
          <p className={estilos.subtituloSeccion}>
            Propuestas imperdibles de esta semana organizadas por vecinos, centros culturales y gestores barriales.
          </p>
        </div>

        {error ? (
          <EstadoError
            descripcion={error}
            onReintentar={cargarDatos}
          />
        ) : cargando ? (
          <div className={estilos.gridDestacadas}>
            <Esqueleto alto={360} />
            <Esqueleto alto={360} />
            <Esqueleto alto={360} />
          </div>
        ) : (
          <>
            <div className={estilos.gridDestacadas}>
              {destacadas.map((act) => (
                <ActividadCard key={act.id} actividad={act} />
              ))}
            </div>
            <div className={estilos.botonVerTodasContenedor}>
              <Link to="/explorar" className={estilos.botonVerTodas}>
                <span>Ver todas las actividades</span>
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── 4. Mosaico de 3 Barrios Comuna 9 (Croquis DestinationsGrid style) ── */}
      <section className={estilos.seccion}>
        <div className={estilos.cabeceraSeccion}>
          <h2 className={estilos.tituloSeccion}>
            Barrios de la <span className="text-brand-orange">Comuna 9</span>
          </h2>
          <p className={estilos.subtituloSeccion}>
            Cada barrio tiene su propia historia, identidad cultural y ritmo vecinal. Elegí un barrio para recorrerlo.
          </p>
        </div>

        <div className={estilos.mosaicoBarrios}>
          {BARRIOS_COMUNA_9.map((b) => (
            <Link
              key={b.slug}
              to={`/explorar?barrio=${b.slug}`}
              className={estilos.tarjetaBarrio}
            >
              <img
                src={b.imagen}
                alt={b.nombre}
                className={estilos.imagenBarrio}
                loading="lazy"
              />
              <div className={estilos.gradienteBarrio} />
              <div className={estilos.contenidoBarrio}>
                <h3 className={estilos.tituloBarrio}>{b.nombre}</h3>
                <p className={estilos.descripcionBarrio}>{b.descripcion}</p>
                <span className={estilos.linkBarrio}>
                  <span>Ver actividades</span>
                  <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. Pilares Comunitarios (Croquis whyUs style) ── */}
      <section className={estilos.seccion}>
        <div className={estilos.cabeceraSeccion}>
          <h2 className={estilos.tituloSeccion}>
            Por qué conectar con <span className="text-brand-orange">tu comunidad</span>
          </h2>
          <p className={estilos.subtituloSeccion}>
            Construimos una plataforma abierta y participativa para visibilizar el patrimonio vivo de nuestros barrios.
          </p>
        </div>

        <div className={estilos.gridPilares}>
          {PILARES_COMUNITARIOS.map((pilar) => {
            const IconoPilar = pilar.icono;
            return (
              <div key={pilar.titulo} className={estilos.tarjetaPilar}>
                <div className={estilos.iconoPilarCirculo}>
                  <IconoPilar size={36} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <h3 className={estilos.tituloPilar}>{pilar.titulo}</h3>
                <p className={estilos.textoPilar}>{pilar.descripcion}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6. Banner CTA Barrial (Croquis Newsletter style) ── */}
      <div className={estilos.bannerCtaWrapper}>
        <section className={estilos.bannerCta}>
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className={estilos.bannerCtaFondo}
          />
          <div className={estilos.bannerCtaGradiente} />
          <div className={estilos.bannerCtaContenido}>
            <h2 className={estilos.bannerCtaTitulo}>
              Sé parte activa de <span className="text-brand-orange-light">la movida cultural</span>
            </h2>
            <p className={estilos.bannerCtaSubtitulo}>
              {usuario
                ? "Configurá tus categorías e intereses barriales para recibir novedades y recomendaciones personalizadas."
                : "Creá tu cuenta barrial gratuita para guardar actividades favoritas, personalizar tus intereses y recibir lo que pasa en tu zona."}
            </p>
            <Link
              to={usuario ? "/preferencias" : "/registro"}
              className={estilos.bannerCtaBoton}
            >
              <span>{usuario ? "Personalizar mis intereses" : "Crear cuenta gratuita"}</span>
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
