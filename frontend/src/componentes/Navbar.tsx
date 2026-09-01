import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const ruta = useLocation().pathname;

  return (
    <nav className="nav">
      <Link className="nav-marca" to="/">
        <span className="nav-logo">CC</span>
        Conectando Cultura
      </Link>

      <div className="nav-enlaces">
        <Link className="nav-enlace" to="/mapa">
          🗺️ Mapa
        </Link>
        <Link className="nav-enlace" to="/actividades">
          📋 Actividades
        </Link>

        {usuario ? (
          <>
            {usuario.rol === "admin" && (
              <Link
                className={`nav-enlace ${ruta === "/admin" ? "activo" : ""}`}
                to="/admin"
              >
                ⚙️ Admin
              </Link>
            )}
            <Link className="nav-enlace" to="/preferencias">
              ⚙️ Preferencias
            </Link>
            <span
              className="nav-enlace"
              style={{ color: "var(--naranja)", cursor: "default" }}
            >
              {usuario.nombre}
            </span>
            <button
              className="btn btn-secundario"
              style={{ padding: "6px 16px", fontSize: "0.85rem" }}
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link
              className="nav-enlace"
              to="/login"
              style={ruta === "/login" ? { color: "var(--naranja)" } : {}}
            >
              Iniciar sesión
            </Link>
            <Link
              className="btn btn-primario"
              to="/registro"
              style={{ padding: "8px 18px", fontSize: "0.9rem" }}
            >
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
