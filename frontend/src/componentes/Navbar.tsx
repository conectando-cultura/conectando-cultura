import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import { Map, SlidersHorizontal, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar(): React.JSX.Element {
  const { usuario, cerrarSesion } = useAuth();
  const ruta = useLocation().pathname;

  const tieneAccesoPanel = puedeUsuario(usuario, "panel:acceder");

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        backgroundColor: "var(--blanco)",
        borderBottom: "1px solid var(--linea)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxSizing: "border-box"
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 700,
          fontSize: "18px",
          color: "var(--tinta)",
          textDecoration: "none",
          fontFamily: "var(--fuente-titulo)"
        }}
      >
        <span
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radio-control)",
            backgroundColor: "var(--tinta)",
            color: "var(--blanco)",
            display: "grid",
            placeItems: "center",
            fontSize: "14px",
            fontWeight: 700
          }}
        >
          CC
        </span>
        Conectando Cultura
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <Link
          to="/explorar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: ruta.startsWith("/explorar") ? "var(--chapa)" : "var(--tinta)",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none"
          }}
        >
          <Map size={16} aria-hidden="true" />
          Explorar
        </Link>

        {usuario ? (
          <>
            {tieneAccesoPanel && (
              <Link
                to="/admin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: ruta.startsWith("/admin") ? "var(--chapa)" : "var(--tinta)",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none"
                }}
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                Panel
              </Link>
            )}
            <Link
              to="/preferencias"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: ruta === "/preferencias" ? "var(--chapa)" : "var(--tinta)",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none"
              }}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Preferencias
            </Link>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--tinta)",
                paddingLeft: "6px"
              }}
            >
              {usuario.nombre}
            </span>
            <button
              type="button"
              onClick={cerrarSesion}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radio-control)",
                border: "1px solid var(--linea)",
                backgroundColor: "transparent",
                color: "var(--tinta)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <LogOut size={14} aria-hidden="true" />
              Salir
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                color: "var(--tinta)",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none"
              }}
            >
              Ingresar
            </Link>
            <Link
              to="/registro"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "var(--radio-control)",
                backgroundColor: "var(--boton-fondo)",
                color: "var(--boton-texto)",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none"
              }}
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
