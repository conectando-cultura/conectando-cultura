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
  ExternalLink
} from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const ICONOS_MENU: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={20} />,
  Actividades: <CalendarDays size={20} />,
  Usuarios: <Users size={20} />
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
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "var(--radio-control)",
              backgroundColor: activo ? "var(--papel)" : "transparent",
              color: activo ? "var(--chapa)" : "var(--tinta)",
              fontWeight: activo ? 700 : 500,
              fontSize: "14px",
              textDecoration: "none",
              transition: "background-color 0.15s ease"
            }}
          >
            <span style={{ color: activo ? "var(--chapa)" : "var(--texto-suave)" }}>
              {ICONOS_MENU[item.icono]}
            </span>
            {item.etiqueta}
          </Link>
        );
      })}

      <div style={{ margin: "16px 0 8px 0", borderTop: "1px solid var(--linea)" }} />

      <Link
        to="/explorar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 14px",
          borderRadius: "var(--radio-control)",
          color: "var(--texto-suave)",
          fontSize: "14px",
          textDecoration: "none"
        }}
      >
        <ExternalLink size={18} />
        Ver sitio público
      </Link>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)", width: "100%", position: "relative" }}>
      {/* Botón cajón en móviles */}
      <div
        style={{
          display: "none",
          padding: "12px 16px",
          backgroundColor: "var(--blanco)",
          borderBottom: "1px solid var(--linea)",
          width: "100%",
          position: "sticky",
          top: 60,
          zIndex: 90
        }}
        className="barra-movil-panel"
      >
        <button
          type="button"
          onClick={() => setCajonAbierto(!cajonAbierto)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "1px solid var(--linea)",
            borderRadius: "var(--radio-control)",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--tinta)"
          }}
        >
          {cajonAbierto ? <X size={18} /> : <Menu size={18} />}
          Menú del panel
        </button>
      </div>

      {/* Menú lateral de escritorio */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "var(--blanco)",
          borderRight: "1px solid var(--linea)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0
        }}
      >
        <div>
          <div style={{ marginBottom: "24px", paddingLeft: "8px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--texto-suave)", fontWeight: 700 }}>
              Panel de administración
            </span>
          </div>
          {renderNavLinks()}
        </div>

        {/* Pie del menú con rol y sesión */}
        <div style={{ borderTop: "1px solid var(--linea)", paddingTop: "16px", paddingLeft: "8px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", fontSize: "14px", color: "var(--tinta)" }}>
              {usuario?.nombre} {usuario?.apellido}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--chapa)", fontWeight: 600 }}>
              {etiquetaRol}
            </span>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 0",
              background: "none",
              border: "none",
              color: "var(--peligro)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal del panel */}
      <main style={{ flex: 1, backgroundColor: "var(--papel)", padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
