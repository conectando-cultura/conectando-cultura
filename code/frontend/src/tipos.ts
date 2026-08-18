/** Tipos compartidos del frontend (módulo de autenticación). */

export interface UsuarioPublico {
  nombre: string;
  apellido: string;
  correo: string;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmacion: string;
}