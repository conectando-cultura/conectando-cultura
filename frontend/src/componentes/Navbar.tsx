import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import {
  Home,
  Compass,
  Map,
  Heart,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function Navbar(): React.JSX.Element {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);

  const ruta = location.pathname;
  const tieneAccesoPanel = puedeUsuario(usuario, "panel:acceder");

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname, location.search]);

  const esActivo = (to: string): boolean => {
    if (to === "/") {
      return ruta === "/";
    }
    if (to === "/mapa") {
      return ruta === "/mapa";
    }
    if (to === "/explorar") {
      return ruta === "/explorar" || ruta === "/actividades";
    }
    if (to === "/preferencias") {
      return ruta === "/preferencias";
    }
    if (to === "/admin") {
      return ruta.startsWith("/admin");
    }
    return ruta === to;
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-white border-b border-brand-gray-light">
      <div className="mx-auto flex h-[64px] md:h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Wordmark y Logo oficial Conectando Cultura */}
        <Link
          to="/"
          className="flex items-center gap-2 group no-underline select-none"
        >
          <img
            src="/logo.png"
            alt="Logo Conectando Cultura"
            className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          <div className="flex items-center gap-1">
            <span className="font-display text-[19px] sm:text-[22px] md:text-[25px] leading-none tracking-[-1.5px] bg-gradient-to-b from-[#E15100] from-20% via-brand-orange via-50% to-[#FFD542] bg-clip-text text-transparent [-webkit-text-stroke:1px_#211F1D] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
              Conectando Cultura
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans font-bold bg-brand-orange text-brand-ink px-2 py-0.5 rounded-full ml-1 shrink-0 hidden sm:inline-block">
              Comuna 9
            </span>
          </div>
        </Link>

        {/* Enlaces de navegación desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Navegación principal">
          <NavLink
            to="/"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-semibold transition-colors ${
              esActivo("/")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Home size={17} strokeWidth={2} aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/explorar"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-semibold transition-colors ${
              esActivo("/explorar")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Compass size={17} strokeWidth={2} aria-hidden="true" />
            <span>Explorar</span>
          </NavLink>

          <NavLink
            to="/mapa"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-semibold transition-colors ${
              esActivo("/mapa")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Map size={17} strokeWidth={2} aria-hidden="true" />
            <span>Mapa</span>
          </NavLink>

          <NavLink
            to="/preferencias"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-semibold transition-colors ${
              esActivo("/preferencias")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Heart size={17} strokeWidth={2} aria-hidden="true" />
            <span>Mi barrio</span>
          </NavLink>

          {tieneAccesoPanel && (
            <NavLink
              to="/admin"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-semibold transition-colors ${
                esActivo("/admin")
                  ? "text-brand-orange bg-brand-orange/10"
                  : "text-brand-ink hover:text-brand-orange"
              }`}
            >
              <LayoutDashboard size={17} strokeWidth={2} aria-hidden="true" />
              <span>Panel</span>
            </NavLink>
          )}
        </nav>

        {/* Controles de autenticación desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {usuario ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-brand-ink">
                  <User size={16} className="text-brand-muted" aria-hidden="true" />
                  <span>{usuario.nombre}</span>
                </span>
                <span className="rounded-full text-xs font-sans font-bold px-2.5 py-0.5 bg-brand-orange/20 text-brand-ink border border-brand-orange/30 capitalize">
                  {usuario.rol}
                </span>
              </div>
              <button
                type="button"
                onClick={cerrarSesion}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-gray-light hover:border-brand-gray px-3.5 py-1.5 text-sm font-sans font-semibold text-brand-ink transition-colors cursor-pointer"
              >
                <LogOut size={15} aria-hidden="true" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-base font-sans font-semibold text-brand-ink hover:text-brand-orange px-3 py-2 transition-colors"
              >
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="rounded-full bg-brand-orange hover:bg-brand-orange-light text-brand-ink font-sans font-semibold px-4 py-2 transition-colors inline-flex items-center justify-center text-sm md:text-base shadow-sm"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>

        {/* Botón hamburguesa mobile */}
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            className="p-2 rounded-xl text-brand-ink hover:bg-brand-bg transition-colors"
            aria-label="Menú principal"
            aria-expanded={abierto}
            onClick={() => setAbierto((prev) => !prev)}
          >
            {abierto ? (
              <X size={26} aria-hidden="true" />
            ) : (
              <Menu size={26} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menú drawer desplegable mobile */}
      {abierto && (
        <nav
          className="lg:hidden border-t border-brand-gray-light bg-brand-white px-5 py-4 shadow-lg flex flex-col gap-2"
          aria-label="Menú de navegación móvil"
        >
          <Link
            to="/"
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
              esActivo("/")
                ? "bg-brand-orange/15 text-brand-orange"
                : "text-brand-ink hover:bg-brand-bg"
            }`}
          >
            <Home size={20} aria-hidden="true" />
            <span>Inicio</span>
          </Link>

          <Link
            to="/explorar"
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
              esActivo("/explorar")
                ? "bg-brand-orange/15 text-brand-orange"
                : "text-brand-ink hover:bg-brand-bg"
            }`}
          >
            <Compass size={20} aria-hidden="true" />
            <span>Explorar</span>
          </Link>

          <Link
            to="/mapa"
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
              esActivo("/mapa")
                ? "bg-brand-orange/15 text-brand-orange"
                : "text-brand-ink hover:bg-brand-bg"
            }`}
          >
            <Map size={20} aria-hidden="true" />
            <span>Mapa</span>
          </Link>

          <Link
            to="/preferencias"
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
              esActivo("/preferencias")
                ? "bg-brand-orange/15 text-brand-orange"
                : "text-brand-ink hover:bg-brand-bg"
            }`}
          >
            <Heart size={20} aria-hidden="true" />
            <span>Mi barrio</span>
          </Link>

          {tieneAccesoPanel && (
            <Link
              to="/admin"
              onClick={() => setAbierto(false)}
              className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
                esActivo("/admin")
                  ? "bg-brand-orange/15 text-brand-orange"
                  : "text-brand-ink hover:bg-brand-bg"
              }`}
            >
              <LayoutDashboard size={20} aria-hidden="true" />
              <span>Panel</span>
            </Link>
          )}

          {/* Autenticación mobile */}
          <div className="pt-3 mt-2 border-t border-brand-gray-light flex flex-col gap-2">
            {usuario ? (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 bg-brand-bg rounded-2xl">
                  <span className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-brand-ink">
                    <User size={18} className="text-brand-muted" aria-hidden="true" />
                    <span>{usuario.nombre}</span>
                  </span>
                  <span className="rounded-full text-xs font-sans font-bold px-2.5 py-0.5 bg-brand-orange/20 text-brand-ink border border-brand-orange/30 capitalize">
                    {usuario.rol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAbierto(false);
                    cerrarSesion();
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-brand-gray-light hover:border-brand-gray px-4 py-2.5 text-sm font-sans font-semibold text-brand-ink transition-colors cursor-pointer w-full"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setAbierto(false)}
                  className="flex items-center justify-center rounded-full border border-brand-gray-light px-4 py-2.5 font-sans font-semibold text-brand-ink hover:bg-brand-bg transition-colors text-base"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setAbierto(false)}
                  className="flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-light text-brand-ink font-sans font-semibold px-4 py-2.5 transition-colors text-base shadow-sm"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
