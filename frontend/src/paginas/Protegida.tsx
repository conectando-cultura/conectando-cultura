import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

/**
 * Ruta protegida: solo se muestra el contenido si hay una sesión activa.
 * Mientras se verifica el token con el backend se muestra un estado de carga.
 */
export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="cargando">Cargando tu sesión…</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}