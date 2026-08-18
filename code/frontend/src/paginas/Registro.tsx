import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import type { DatosRegistro } from "../tipos";

export default function Registro() {
  const { registrar } = useAuth();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState<DatosRegistro>({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    confirmacion: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof DatosRegistro, valor: string) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const mensaje = await registrar(formulario);
    setEnviando(false);

    if (mensaje) {
      setError(mensaje);
      return;
    }

    setExito("¡Cuenta creada con éxito! Redirigiendo al inicio de sesión…");
    window.setTimeout(() => navegar("/login"), 1500);
  }

  return (
    <div className="contendor-form">
      <section className="caja-form">
        <h1>Crear cuenta</h1>
        <p className="sub">Completá tus datos para registrarte en Conectando Cultura</p>

        {error && (
          <div className="alerta alerta-error" role="alert">
            {error}
          </div>
        )}
        {exito && (
          <div className="alerta alerta-exito" role="status">
            {exito}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              placeholder="Ej: Juan"
              autoComplete="given-name"
              value={formulario.nombre}
              onChange={(evento) => actualizar("nombre", evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="apellido">Apellido</label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              placeholder="Ej: Mendoza"
              autoComplete="family-name"
              value={formulario.apellido}
              onChange={(evento) => actualizar("apellido", evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              value={formulario.correo}
              onChange={(evento) => actualizar("correo", evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              type="password"
              id="contrasena"
              name="contrasena"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              value={formulario.contrasena}
              onChange={(evento) => actualizar("contrasena", evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="confirmacion">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmacion"
              name="confirmacion"
              placeholder="Repetí tu contraseña"
              autoComplete="new-password"
              value={formulario.confirmacion}
              onChange={(evento) => actualizar("confirmacion", evento.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primario btn-bloque"
            disabled={enviando || exito !== null}
          >
            {enviando ? "Registrando…" : "Registrarme"}
          </button>
        </form>

        <p className="pie-form">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </section>
    </div>
  );
}