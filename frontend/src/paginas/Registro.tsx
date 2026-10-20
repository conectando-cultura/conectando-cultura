import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { Campo, Boton } from "../componentes/base";
import { Eye, EyeOff, Sparkles, MapPin, Users, Heart } from "lucide-react";

const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro(): React.JSX.Element {
  const { usuario, registrar } = useAuth();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    confirmacion: ""
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) {
      navegar("/preferencias", { replace: true });
    }
  }, [usuario, navegar]);

  const validarCampo = (campo: string, valor: string): string => {
    switch (campo) {
      case "nombre":
        return valor.trim() ? "" : "Completá tu nombre.";
      case "apellido":
        return valor.trim() ? "" : "Completá tu apellido.";
      case "correo":
        if (!valor.trim()) return "Completá tu correo electrónico.";
        if (!EXPRESION_EMAIL.test(valor.trim())) return "Revisá el formato del correo.";
        return "";
      case "contrasena":
        if (!valor) return "Ingresá una contraseña.";
        if (valor.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
        return "";
      case "confirmacion":
        if (!valor) return "Repetí tu contraseña.";
        if (valor !== formulario.contrasena) return "Las contraseñas no coinciden.";
        return "";
      default:
        return "";
    }
  };

  const manejarCambio = (campo: string, valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: "" }));
    }
  };

  const manejarBlur = (campo: string) => {
    const error = validarCampo(campo, formulario[campo as keyof typeof formulario]);
    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);

    const nuevosErrores: Record<string, string> = {};
    Object.keys(formulario).forEach((c) => {
      const err = validarCampo(c, formulario[c as keyof typeof formulario]);
      if (err) nuevosErrores[c] = err;
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);

    try {
      await registrar(formulario);
      // Redirige directamente a la configuración inicial de preferencias
      navegar("/preferencias", { replace: true, state: { primeraVez: true } });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error al crear la cuenta.";
      if (mensaje.includes("correo") && mensaje.includes("registrado")) {
        setErrores((prev) => ({
          ...prev,
          correo: "Ese correo ya tiene cuenta. Ingresá o usá otro."
        }));
      } else {
        setErrorGeneral(mensaje);
      }
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
              Sumate a la red
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4 leading-tight">
              Creá tu cuenta comunitaria
            </h2>
            <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-6">
              Sé parte activa del circuito cultural de la Comuna 9. Personalizá tus salidas y apoyá las expresiones barriales independientes.
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10 text-xs md:text-sm text-white/70">
            <div className="flex items-center gap-2.5">
              <Heart size={16} className="text-brand-orange shrink-0" />
              <span>Guardá tus intereses y recibí sugerencias relevantes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={16} className="text-brand-orange shrink-0" />
              <span>Espacios, centros culturales y talleres autogestionados</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-brand-orange shrink-0" />
              <span>100% público, gratuito y pensado para el barrio</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl text-brand-ink mb-2">
              Crear cuenta
            </h1>
            <p className="font-body text-sm text-brand-gray">
              Guardá tus preferencias y enterate de lo nuevo.
            </p>
          </div>

          {errorGeneral && (
            <div
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
              role="alert"
            >
              {errorGeneral}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo
                etiqueta="Nombre"
                id="registro-nombre"
                name="nombre"
                placeholder="Ej: Ana"
                autoComplete="given-name"
                value={formulario.nombre}
                onChange={(e) => manejarCambio("nombre", e.target.value)}
                onBlur={() => manejarBlur("nombre")}
                error={errores.nombre}
                required
              />
              <Campo
                etiqueta="Apellido"
                id="registro-apellido"
                name="apellido"
                placeholder="Ej: Gómez"
                autoComplete="family-name"
                value={formulario.apellido}
                onChange={(e) => manejarCambio("apellido", e.target.value)}
                onBlur={() => manejarBlur("apellido")}
                error={errores.apellido}
                required
              />
            </div>

            <Campo
              etiqueta="Correo electrónico"
              type="email"
              id="registro-correo"
              name="correo"
              placeholder="tunombre@ejemplo.com"
              autoComplete="email"
              value={formulario.correo}
              onChange={(e) => manejarCambio("correo", e.target.value)}
              onBlur={() => manejarBlur("correo")}
              error={errores.correo}
              required
            />

            <div className="relative">
              <Campo
                etiqueta="Contraseña"
                type={mostrarContrasena ? "text" : "password"}
                id="registro-contrasena"
                name="contrasena"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={formulario.contrasena}
                onChange={(e) => manejarCambio("contrasena", e.target.value)}
                onBlur={() => manejarBlur("contrasena")}
                error={errores.contrasena}
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

            <Campo
              etiqueta="Repetir contraseña"
              type={mostrarContrasena ? "text" : "password"}
              id="registro-confirmacion"
              name="confirmacion"
              placeholder="Repetí la contraseña elegida"
              autoComplete="new-password"
              value={formulario.confirmacion}
              onChange={(e) => manejarCambio("confirmacion", e.target.value)}
              onBlur={() => manejarBlur("confirmacion")}
              error={errores.confirmacion}
              required
            />

            <div className="pt-2">
              <Boton type="submit" variante="principal" bloque disabled={enviando}>
                {enviando ? "Creando cuenta..." : "Crear cuenta"}
              </Boton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-gray-light text-center font-body text-sm text-brand-gray">
            <p>
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-brand-orange font-semibold hover:underline">
                Ingresar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
