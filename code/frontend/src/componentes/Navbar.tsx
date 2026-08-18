import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  async function manejarCierre() {
    await cerrarSesion();
    navegar("/login");
  }

  return (
    <header className="nav">
      <Link className="nav-marca" to="/">
        <span className="nav-logo" aria-hidden="true">
          CC
        </span>
        <span>Conectando Cultura</span>
      </Link>
      <nav className="nav-enlaces" aria-label="Menú principal">
        <Link className="nav-enlace" to="/">
          Inicio
        </Link>
        {usuario ? (
          <button className="nav-enlace" type="button" onClick={manejarCierre}>
            Cerrar sesión
          </button>
        ) : (
          <>
            <Link className="nav-enlace" to="/login">
              Ingresar
            </Link>
            <Link className="btn btn-primario" to="/registro">
              Registrarse
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}