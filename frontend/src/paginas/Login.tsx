import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { puedeUsuario } from "../utiles/permisos";
import { obtenerPreferencias } from "../api/actividades";
import { Campo, Boton } from "../componentes/base";
import { Eye, EyeOff, Sparkles, MapPin, Compass, ArrowRight } from "lucide-react";

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
    <div className="min-h-[calc(100vh-140px)] bg-brand-bg py-8 md:py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-3xl shadow-[0_6px_11px_rgba(0,0,0,0.1)] overflow-hidden bg-brand-white border border-brand-gray-light grid grid-cols-1 md:grid-cols-2">
        {/* Columna Izquierda: Panel Editorial Cultural */}
        <div className="bg-brand-ink text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-48 h-48 bg-brand-orange-light/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange text-brand-ink mb-6">
              <Sparkles size={13} />
              Comuna 9 · CABA
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4 leading-tight">
              Tu cultura barrial en un solo lugar
            </h2>
            <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-6">
              Accedé a tu cuenta para guardar tus barrios y categorías preferidas, enterarte de nuevas propuestas y sumarte a la agenda vecinal.
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10 text-xs md:text-sm text-white/70">
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-brand-orange shrink-0" />
              <span>Mataderos, Liniers y Parque Avellaneda conectados</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Compass size={16} className="text-brand-orange shrink-0" />
              <span>Filtros personalizados por cercanía y tipo de actividad</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl text-brand-ink mb-2">
              Ingresar
            </h1>
            <p className="font-body text-sm text-brand-gray">
              Accedé para ver tus actividades y preferencias.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate className="space-y-4">
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

            <div className="relative">
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
                className="absolute right-3 top-[38px] text-brand-muted hover:text-brand-ink p-1 transition-colors"
                aria-label={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="pt-2">
              <Boton type="submit" variante="principal" bloque disabled={enviando}>
                {enviando ? "Ingresando..." : "Ingresar"}
              </Boton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-gray-light text-center font-body text-sm text-brand-gray space-y-2">
            <p>
              ¿Primera vez?{" "}
              <Link to="/registro" className="text-brand-orange font-semibold hover:underline">
                Crear cuenta
              </Link>
            </p>
            <p>
              <Link
                to="/explorar"
                className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-ink transition-colors"
              >
                Seguir explorando sin cuenta
                <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
