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
  const busqueda = location.search;
  const tieneAccesoPanel = puedeUsuario(usuario, "panel:acceder");

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname, location.search]);

  const esActivo = (to: string): boolean => {
    if (to === "/") {
      return ruta === "/";
    }
    if (to === "/explorar?vista=mapa") {
      return (ruta === "/explorar" && busqueda.includes("vista=mapa")) || ruta === "/mapa";
    }
    if (to === "/explorar") {
      return (ruta === "/explorar" && !busqueda.includes("vista=mapa")) || ruta === "/actividades";
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
    <header className="sticky top-0 z-40 bg-brand-white border-b border-brand-gray-light">
      <div className="mx-auto flex h-[88px] md:h-[100px] max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-9">
        {/* Wordmark oficial Croquis */}
        <Link
          to="/"
          className="flex items-center gap-1 group no-underline select-none"
        >
          <span className="font-display text-[26px] md:text-[30px] leading-none tracking-[-2.3px] bg-gradient-to-b from-[#E15100] from-20% via-brand-orange via-50% to-[#FFD542] bg-clip-text text-transparent [-webkit-text-stroke:1.2px_#211F1D] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.56)]">
            Conectando Cultura
          </span>
          <span className="text-xs font-sans font-bold bg-brand-orange text-brand-ink px-2.5 py-0.5 rounded-full ml-2 shrink-0">
            Comuna 9
          </span>
        </Link>

        {/* Enlaces de navegación desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Navegación principal">
          <NavLink
            to="/"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-sans font-semibold transition-colors ${
              esActivo("/")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Home size={18} strokeWidth={2} aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/explorar"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-sans font-semibold transition-colors ${
              esActivo("/explorar")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Compass size={18} strokeWidth={2} aria-hidden="true" />
            <span>Explorar</span>
          </NavLink>

          <NavLink
            to="/explorar?vista=mapa"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-sans font-semibold transition-colors ${
              esActivo("/explorar?vista=mapa")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Map size={18} strokeWidth={2} aria-hidden="true" />
            <span>Mapa</span>
          </NavLink>

          <NavLink
            to="/preferencias"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-sans font-semibold transition-colors ${
              esActivo("/preferencias")
                ? "text-brand-orange bg-brand-orange/10"
                : "text-brand-ink hover:text-brand-orange"
            }`}
          >
            <Heart size={18} strokeWidth={2} aria-hidden="true" />
            <span>Mi barrio</span>
          </NavLink>

          {tieneAccesoPanel && (
            <NavLink
              to="/admin"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-base font-sans font-semibold transition-colors ${
                esActivo("/admin")
                  ? "text-brand-orange bg-brand-orange/10"
                  : "text-brand-ink hover:text-brand-orange"
              }`}
            >
              <LayoutDashboard size={18} strokeWidth={2} aria-hidden="true" />
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
            to="/explorar?vista=mapa"
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-sans font-semibold text-base transition-colors ${
              esActivo("/explorar?vista=mapa")
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
