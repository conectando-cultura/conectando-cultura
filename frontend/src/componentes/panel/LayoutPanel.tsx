import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexto/AuthContext";
import { MENU_PANEL, puedeUsuario, ETIQUETA_ROL } from "../../utiles/permisos";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const ICONOS_MENU: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={19} />,
  Actividades: <CalendarDays size={19} />,
  Usuarios: <Users size={19} />
};

export default function LayoutPanel({ children }: Props): React.JSX.Element {
  const { usuario, cerrarSesion } = useAuth();
  const ruta = useLocation().pathname;
  const [cajonAbierto, setCajonAbierto] = useState(false);

  // Filtrar ítems del menú por permisos reales del usuario
  const itemsVisibles = MENU_PANEL.filter((item) =>
    puedeUsuario(usuario, item.permiso)
  );

  const etiquetaRol = usuario?.rol ? ETIQUETA_ROL[usuario.rol] : "Usuario";

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1.5" aria-label="Menú del panel">
      {itemsVisibles.map((item) => {
        const activo =
          item.ruta === "/admin"
            ? ruta === "/admin"
            : ruta.startsWith(item.ruta);

        return (
          <Link
            key={item.ruta}
            to={item.ruta}
            onClick={() => setCajonAbierto(false)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl font-sans text-sm transition-all ${
              activo
                ? "bg-brand-orange text-brand-ink font-semibold shadow-xs"
                : "text-brand-gray hover:bg-brand-bg hover:text-brand-ink font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activo ? "text-brand-ink" : "text-brand-muted"}>
                {ICONOS_MENU[item.icono]}
              </span>
              <span>{item.etiqueta}</span>
            </div>
            {activo && <ChevronRight size={16} className="text-brand-ink/70" />}
          </Link>
        );
      })}

      <div className="my-3 border-t border-brand-gray-light" />

      <Link
        to="/explorar"
        className="flex items-center gap-3 px-4 py-3 rounded-2xl font-sans text-sm text-brand-muted hover:bg-brand-bg hover:text-brand-ink transition-colors"
      >
        <ExternalLink size={18} />
        <span>Ver catálogo público</span>
      </Link>
    </nav>
  );

  return (
    <div className="min-h-[calc(100vh-65px)] bg-brand-bg flex flex-col md:flex-row relative">
      {/* Botón cajón en móviles */}
      <div className="md:hidden sticky top-[60px] z-40 bg-brand-white border-b border-brand-gray-light px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => setCajonAbierto(!cajonAbierto)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-brand-gray-light bg-brand-bg text-brand-ink font-sans text-xs font-semibold hover:border-brand-orange transition-colors"
        >
          {cajonAbierto ? <X size={16} /> : <Menu size={16} />}
          <span>Navegación del panel</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-orange/15 text-brand-orange">
          <ShieldCheck size={12} />
          {etiquetaRol}
        </span>
      </div>

      {/* Drawer móvil cuando está abierto */}
      {cajonAbierto && (
        <div className="md:hidden bg-brand-white border-b border-brand-gray-light px-4 py-4 space-y-4 shadow-md">
          {renderNavLinks()}
          <div className="pt-3 border-t border-brand-gray-light flex items-center justify-between">
            <span className="text-xs text-brand-gray font-medium">
              {usuario?.nombre} {usuario?.apellido}
            </span>
            <button
              type="button"
              onClick={cerrarSesion}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Menú lateral de escritorio */}
      <aside className="hidden md:flex w-72 flex-col justify-between shrink-0 bg-brand-white border-r border-brand-gray-light p-6">
        <div className="space-y-6">
          <div className="px-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
              Administración
            </span>
            <span className="font-display text-xl text-brand-ink">
              Conectando Cultura
            </span>
          </div>

          {renderNavLinks()}
        </div>

        {/* Pie del menú con rol y sesión */}
        <div className="pt-6 border-t border-brand-gray-light px-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block text-sm font-sans font-semibold text-brand-ink">
                {usuario?.nombre} {usuario?.apellido}
              </strong>
              <span className="inline-flex items-center gap-1 text-xs text-brand-orange font-semibold">
                <ShieldCheck size={12} />
                {etiquetaRol}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal del panel */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
