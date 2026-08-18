import { Link } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export default function Bienvenido() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();

  return (
    <section className="bienvenida">
      <div className="icono" aria-hidden="true">
        ✓
      </div>
      <h1>
        Bienvenido usuario <span className="usuario">{nombreCompleto}</span>
      </h1>
      <p>La página continúa en desarrollo.</p>
      <Link className="btn btn-secundario" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}