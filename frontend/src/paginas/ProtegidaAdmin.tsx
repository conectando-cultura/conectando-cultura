import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import { Lock } from "lucide-react";

export default function ProtegidaAdmin({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="cargando">Verificando permisos…</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!puedeUsuario(usuario, "panel:acceder")) {
    return (
      <div className="main" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--peligro-fondo)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            color: "var(--peligro)"
          }}
        >
          <Lock size={32} />
        </div>
        <h1>Acceso denegado</h1>
        <p style={{ color: "var(--gris)", marginTop: "12px", maxWidth: "400px", margin: "12px auto 0" }}>
          No tenés permisos de administrador para acceder a esta sección.
        </p>
        <a href="/" className="btn btn-primario" style={{ marginTop: "24px", display: "inline-block" }}>
          Volver al inicio
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
