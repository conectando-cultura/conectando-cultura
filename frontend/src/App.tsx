import React, { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Mail, Globe, Share2, MessageCircle } from "lucide-react";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Explorar from "./paginas/Explorar";
import Mapa from "./paginas/Mapa";
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
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:grid-cols-[1.3fr_1fr_1fr] md:gap-10 md:px-8 md:py-10">
        {/* Col 1: Logo oficial, Wordmark e identidad institucional */}
        <div className="md:border-r md:border-brand-orange-light/20 md:pr-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline group"
          >
            <img
              src="/logo.png"
              alt="Logo Conectando Cultura"
              className="h-10 w-10 rounded-full object-cover border border-brand-orange shadow-sm"
            />
            <span className="font-display text-[26px] md:text-[30px] leading-none tracking-[-1.5px] text-brand-bg drop-shadow-[0_1.3px_1.3px_rgba(0,0,0,0.56)]">
              Conectando Cultura
            </span>
          </Link>
          <p className="mt-3 text-sm md:text-base font-sans tracking-[0.2px] text-brand-orange font-semibold">
            Comuna 9 · Liniers, Mataderos, Parque Avellaneda
          </p>
          <p className="mt-3 max-w-[340px] font-body text-xs md:text-sm text-brand-bg/80 leading-relaxed">
            Proyecto comunitario impulsado junto a estudiantes y docentes de la Escuela Técnica N° 20 D.E. 20 "Carolina Muzzilli".
          </p>
        </div>

        {/* Col 2: Barrios y Mapa */}
        <div className="md:border-r md:border-brand-orange-light/20 md:px-6">
          <h3 className="font-display text-lg text-brand-white">Navegación</h3>
          <ul className="mt-3 space-y-2">
            {[
              ["/explorar?barrio=mataderos", "Mataderos"],
              ["/explorar?barrio=liniers", "Liniers"],
              ["/explorar?barrio=parque-avellaneda", "Parque Avellaneda"],
              ["/explorar", "Explorar catálogo"],
              ["/mapa", "Mapa cultural"],
              ["/componentes", "Componentes"]
            ].map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="font-sans font-medium text-brand-bg/90 hover:text-brand-orange transition-colors text-xs md:text-sm no-underline block"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Comunidad y Contacto */}
        <div className="md:pl-6">
          <h3 className="font-display text-lg text-brand-white">Comunidad y Contacto</h3>
          <p className="mt-3 max-w-[280px] font-body text-xs md:text-sm text-brand-bg/80 leading-relaxed">
            Plataforma comunitaria de acceso abierto para difundir y disfrutar talleres, ferias y actividades barriales.
          </p>
          <div className="mt-3 flex items-center gap-2 text-brand-bg">
            <Mail size={16} className="text-brand-orange shrink-0" aria-hidden="true" />
            <a
              href="mailto:contacto@conectandocultura.ar"
              className="font-body text-xs md:text-sm text-brand-bg/90 hover:text-brand-orange transition-colors no-underline"
            >
              contacto@conectandocultura.ar
            </a>
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <a
              href="mailto:contacto@conectandocultura.ar"
              aria-label="Escribir a la comunidad"
              className="p-1.5 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <MessageCircle size={16} aria-hidden="true" />
            </a>
            <a
              href="/explorar"
              aria-label="Compartir catálogo barrial"
              className="p-1.5 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <Share2 size={16} aria-hidden="true" />
            </a>
            <a
              href="https://buenosaires.gob.ar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sitio web institucional Comuna 9"
              className="p-1.5 rounded-full bg-brand-white/10 text-brand-bg hover:text-brand-orange hover:bg-brand-white/20 transition-colors"
            >
              <Globe size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Barra inferior compacta */}
      <div className="bg-brand-gray border-t border-brand-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between items-center gap-2 px-5 py-2.5 text-xs text-brand-bg/80 md:px-8">
          <span>
            &copy; {new Date().getFullYear()} Conectando Cultura · ET N° 20 D.E. 20 "Carolina Muzzilli"
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

  const esAdmin = pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!esAdmin && <Footer />}
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
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/actividades/:barrio/:slug" element={<DetalleActividad />} />
          <Route path="/actividades" element={<Navigate to="/explorar" replace />} />
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
