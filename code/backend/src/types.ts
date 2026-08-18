/** Tipos compartidos del backend (módulo de autenticación). */

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  contrasenaHash: string;
  creadoEn: string;
}

/** Representación pública del usuario: nunca expone datos sensibles. */
export interface UsuarioPublico {
  nombre: string;
  apellido: string;
  correo: string;
}

export interface Sesion {
  token: string;
  usuarioId: string;
  expiraEn: number;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmacion: string;
}

export interface DatosLogin {
  correo: string;
  contrasena: string;
}

export function aPublico(usuario: Usuario): UsuarioPublico {
  return { nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo };
}

export class ErrorAplicacion extends Error {
  status: number;

  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "ErrorAplicacion";
    this.status = status;
  }
}