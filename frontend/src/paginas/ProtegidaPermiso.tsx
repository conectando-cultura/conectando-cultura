import React, { type ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario, type Permiso, ETIQUETA_ROL } from "../utiles/permisos";
import { Lock } from "lucide-react";

interface Props {
  permiso: Permiso;
  children: ReactNode;
}

export default function ProtegidaPermiso({ permiso, children }: Props): React.JSX.Element {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="cargando">Verificando permisos...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!puedeUsuario(usuario, permiso)) {
    const etiquetaRol = usuario.rol ? ETIQUETA_ROL[usuario.rol] : "Usuario";

    return (
      <div className="main" style={{ textAlign: "center", padding: "64px 20px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--peligro-fondo)",
            color: "var(--peligro)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px"
          }}
          aria-hidden="true"
        >
          <Lock size={32} />
        </div>
        <h1 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "28px", color: "var(--tinta)", margin: "0 0 12px 0" }}>
          No tenés acceso a esta sección
        </h1>
        <p style={{ color: "var(--texto-suave)", maxWidth: "460px", margin: "0 auto 28px", fontSize: "15px", lineHeight: 1.5 }}>
          Tu rol actual ({etiquetaRol}) no tiene los permisos suficientes para ingresar a este módulo.
          Si considerás que es un error, consultá con un SuperAdmin.
        </p>
        <Link
          to="/admin"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0 22px",
            minHeight: "var(--alto-tactil)",
            backgroundColor: "var(--boton-fondo)",
            color: "var(--boton-texto)",
            borderRadius: "var(--radio-control)",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "14px"
          }}
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
