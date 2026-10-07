import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { Campo, Boton } from "../componentes/base";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="contendor-form">
      <section className="caja-form" style={{ maxWidth: "460px" }}>
        <h1 style={{ fontFamily: "var(--fuente-titulo)", fontSize: "28px", margin: "0 0 8px 0", textAlign: "center" }}>
          Crear cuenta
        </h1>
        <p className="sub" style={{ textAlign: "center", marginBottom: "24px" }}>
          Guardá tus preferencias y enterate de lo nuevo.
        </p>

        {errorGeneral && (
          <div className="alerta alerta-error" role="alert" style={{ marginBottom: "20px" }}>
            {errorGeneral}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

          <div style={{ position: "relative" }}>
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

          <div style={{ marginTop: "24px" }}>
            <Boton type="submit" variante="principal" bloque disabled={enviando}>
              {enviando ? "Creando cuenta..." : "Crear cuenta"}
            </Boton>
          </div>
        </form>

        <p className="pie-form" style={{ textAlign: "center", marginTop: "20px" }}>
          ¿Ya tenés cuenta? <Link to="/login" style={{ color: "var(--chapa)", fontWeight: 700 }}>Ingresar</Link>
        </p>
      </section>
    </div>
  );
}