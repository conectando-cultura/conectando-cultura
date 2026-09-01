import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const mensaje = await iniciarSesion(correo, contrasena);
    setEnviando(false);

    if (mensaje) {
      setError(mensaje);
      return;
    }

    navegar("/bienvenido");
  }

  return (
    <div className="contendor-form">
      <section className="caja-form">
        <h1>Iniciar sesión</h1>
        <p className="sub">Ingresá con tu correo electrónico y contraseña</p>

        {error && (
          <div className="alerta alerta-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              type="password"
              id="contrasena"
              name="contrasena"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
            {enviando ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="pie-form">
          ¿No tenés cuenta? <Link to="/registro">Registrate acá</Link>
        </p>
      </section>
    </div>
  );
}