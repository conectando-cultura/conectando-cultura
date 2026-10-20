import React, { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Mail, Globe, Share2, MessageCircle } from "lucide-react";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Explorar from "./paginas/Explorar";
import DetalleActividad from "./paginas/DetalleActividad";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Bienvenido from "./paginas/Bienvenido";
import Preferencias from "./paginas/Preferencias";
import Dashboard from "./paginas/panel/Dashboard";
import AdminActividades from "./paginas/panel/AdminActividades";
import AdminUsuarios from "./paginas/panel/AdminUsuarios";
import ProtegidaPermiso from "./paginas/ProtegidaPermiso";
import { AuthProvider } from "./contexto/AuthContext";
import Protegida from "./paginas/Protegida";
import ComponentesDemo from "./paginas/ComponentesDemo";

function Footer(): React.JSX.Element {
  return (
    <footer className="bg-brand-ink text-brand-white">
      <div className="mx-auto grid max-w-[1134px] gap-10 px-5 py-14 md:grid-cols-[1fr_auto_auto] md:gap-0 md:px-0 md:py-[75px]">
        {/* Col 1: Wordmark, bajada e identidad institucional */}
        <div className="md:border-r md:border-brand-orange-light/40 md:pr-[80px]">
          <Link
            to="/"
            className="font-display text-[32px] md:text-[36px] leading-none tracking-[-2.5px] text-brand-bg [-webkit-text-stroke:1.3px_#1B160E] drop-shadow-[0_1.3px_1.3px_rgba(0,0,0,0.56)] no-underline inline-block pt-1"
          >
            Conectando Cultura
          </Link>
          <p className="mt-4 text-lg md:text-xl font-sans tracking-[0.2px] text-brand-white font-semibold">
            Comuna 9 · Liniers, Mataderos, Parque Avellaneda
          </p>
          <p className="mt-6 max-w-[340px] font-body text-sm md:text-base text-brand-bg leading-relaxed">
            Proyecto impulsado por la comunidad junto a estudiantes y docentes de la Escuela Técnica N° 20 D.E. 20 "Paula Albarracín de Sarmiento" para conectar las actividades culturales y barriales de la Comuna 9.
          </p>
        </div>

        {/* Col 2: Barrios y Mapa */}
        <div className="md:border-r md:border-brand-orange-light/40 md:px-[70px]">
          <h3 className="font-display text-[21px] text-brand-white">Barrios y Mapa</h3>
          <ul className="mt-6 space-y-3">
            {[
              ["/explorar?barrio=mataderos", "Mataderos"],
              ["/explorar?barrio=liniers", "Liniers"],
              ["/explorar?barrio=parque-avellaneda", "Parque Avellaneda"],
              ["/explorar", "Explorar catálogo"],
              ["/explorar?vista=mapa", "Mapa cultural"],
              ["/componentes", "Componentes"]
            ].map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="font-sans font-semibold text-brand-bg hover:text-brand-orange-light transition-colors text-sm md:text-base no-underline block"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Comunidad y Contacto */}
        <div className="md:pl-[70px]">
          <h3 className="font-display text-[20px] text-brand-white">Comunidad y Contacto</h3>
          <p className="mt-6 max-w-[280px] font-body text-sm md:text-base text-brand-bg leading-relaxed">
            Plataforma comunitaria de acceso abierto para descubrir y difundir talleres, espectáculos y actividades barriales.
          </p>
          <div className="mt-5 flex items-center gap-2 text-brand-bg">
            <Mail size={18} className="text-brand-orange shrink-0" aria-hidden="true" />
            <a
              href="mailto:contacto@conectandocultura.ar"
              className="font-body text-sm md:text-base text-brand-bg hover:text-brand-orange-light transition-colors no-underline"
            >
              contacto@conectandocultura.ar
            </a>
          </div>
          <p className="mt-6 text-[15px] font-sans font-bold text-brand-white">
            Redes y comunidad
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href="mailto:contacto@conectandocultura.ar"
              aria-label="Escribir a la comunidad"
              className="p-2 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <MessageCircle size={18} aria-hidden="true" />
            </a>
            <a
              href="/explorar"
              aria-label="Compartir catálogo barrial"
              className="p-2 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <Share2 size={18} aria-hidden="true" />
            </a>
            <a
              href="https://buenosaires.gob.ar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sitio web institucional Comuna 9"
              className="p-2 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <Globe size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="bg-brand-gray">
        <div className="mx-auto flex max-w-[1134px] flex-wrap justify-between items-center gap-2 px-5 py-4 text-xs md:text-sm text-brand-bg md:px-0">
          <span>
            &copy; {new Date().getFullYear()} Conectando Cultura · Proyecto comunitario ET N° 20 D.E. 20
          </span>
          <span>Comuna 9 · Liniers, Mataderos y Parque Avellaneda, CABA</span>
        </div>
      </div>
    </footer>
  );
}

function PaginaNoEncontrada(): React.JSX.Element {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-brand-bg px-4 py-16">
      <div className="bg-brand-white rounded-3xl p-8 md:p-12 shadow-[0_6px_11px_rgba(0,0,0,0.1)] text-center max-w-md mx-auto border border-brand-gray-light">
        <h1 className="font-display text-6xl md:text-7xl text-brand-orange mb-3">
          404
        </h1>
        <h2 className="font-display text-2xl md:text-3xl text-brand-ink mb-3">
          Página no encontrada
        </h2>
        <p className="font-body text-brand-muted text-base mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-light text-brand-ink font-sans font-semibold px-6 py-2.5 transition-colors shadow-sm text-base no-underline"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Inicio />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/actividades/:barrio/:slug" element={<DetalleActividad />} />
          <Route path="/mapa" element={<Navigate to="/explorar?vista=mapa" replace />} />
          <Route path="/actividades" element={<Navigate to="/explorar?vista=lista" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/componentes" element={<ComponentesDemo />} />

          {/* Rutas protegidas */}
          <Route
            path="/bienvenido"
            element={
              <Protegida>
                <Bienvenido />
              </Protegida>
            }
          />
          <Route
            path="/preferencias"
            element={
              <Protegida>
                <Preferencias />
              </Protegida>
            }
          />

          {/* Panel de administración (según permisos de rol) */}
          <Route
            path="/admin"
            element={
              <ProtegidaPermiso permiso="panel:acceder">
                <Dashboard />
              </ProtegidaPermiso>
            }
          />
          <Route
            path="/admin/actividades"
            element={
              <ProtegidaPermiso permiso="actividades:escribir">
                <AdminActividades />
              </ProtegidaPermiso>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtegidaPermiso permiso="usuarios:gestionar">
                <AdminUsuarios />
              </ProtegidaPermiso>
            }
          />

          {/* 404 */}
          <Route path="*" element={<PaginaNoEncontrada />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
