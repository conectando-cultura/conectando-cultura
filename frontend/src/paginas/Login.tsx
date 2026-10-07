import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import { obtenerPreferencias } from "../api/actividades";
import { Campo, Boton } from "../componentes/base";
import { Eye, EyeOff } from "lucide-react";

export default function Login(): React.JSX.Element {
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Redirección si ya está autenticado
  useEffect(() => {
    if (usuario) {
      if (puedeUsuario(usuario, "panel:acceder")) {
        navegar("/admin", { replace: true });
      } else {
        navegar("/explorar", { replace: true });
      }
    }
  }, [usuario, navegar]);

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!correo.trim() || !contrasena) {
      setError("Completá tu correo y contraseña.");
      return;
    }

    setEnviando(true);

    try {
      const { usuario: u, token } = await iniciarSesion(correo.trim(), contrasena);

      // Redirección por rol
      if (puedeUsuario(u, "panel:acceder")) {
        navegar("/admin", { replace: true });
        return;
      }

      // Si venía de una ruta protegida previa
      const origen = (ubicacion.state as { from?: { pathname: string } })?.from?.pathname;
      if (origen && origen !== "/login" && origen !== "/registro") {
        navegar(origen, { replace: true });
        return;
      }

      // Verificar si tiene preferencias guardadas
      try {
        const prefs = await obtenerPreferencias(token);
        if (prefs && (prefs.barrioId || (prefs.categorias && prefs.categorias.length > 0))) {
          navegar("/explorar", { replace: true });
          return;
        }
      } catch {
        // En caso de que no tenga aún preferencias
      }

      navegar("/preferencias", { replace: true });
    } catch {
      setError("Correo o contraseña incorrectos. Revisalos e intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contendor-form">
      <section className="caja-form" style={{ maxWidth: "420px" }}>
        <h1 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "28px", margin: "0 0 8px 0", textAlign: "center" }}>
          Ingresar
        </h1>
        <p className="sub" style={{ textAlign: "center", marginBottom: "24px" }}>
          Accedé para ver tus actividades y preferencias.
        </p>

        {error && (
          <div className="alerta alerta-error" role="alert" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <Campo
            etiqueta="Correo electrónico"
            type="email"
            id="login-correo"
            name="correo"
            autoComplete="email"
            placeholder="tunombre@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <div style={{ position: "relative" }}>
            <Campo
              etiqueta="Contraseña"
              type={mostrarContrasena ? "text" : "password"}
              id="login-contrasena"
              name="contrasena"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              style={{
                position: "absolute",
                right: "12px",
                top: "38px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--texto-suave)"
              }}
              aria-label={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Boton type="submit" variante="principal" bloque disabled={enviando}>
              {enviando ? "Ingresando..." : "Ingresar"}
            </Boton>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--texto-suave)" }}>
          <p style={{ margin: "0 0 8px 0" }}>
            ¿Primera vez? <Link to="/registro" style={{ color: "var(--chapa)", fontWeight: 700 }}>Crear cuenta</Link>
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/explorar" style={{ color: "var(--texto-suave)", textDecoration: "underline" }}>
              Seguir explorando sin cuenta
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}