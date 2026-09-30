/** Tipos para actividades y preferencias (derivados del schema de Supabase) */

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmacion: string;
}

export interface UsuarioPublico {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: "usuario" | "admin";
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  color: string; // "#rrggbb"
  icono: string;
}

export interface Barrio {
  id: string;
  nombre: string;
  slug: string;
}

export interface Actividad {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  horarios: string;
  direccion: string;
  lat: number;
  lng: number;
  url: string;
  imagenUrl: string;
  categoria: Categoria;
  barrio: Barrio;
  destacado: boolean;
}

export interface Preferencias {
  barrioId: string | null;
  barrio: Barrio | null;
  categorias: Categoria[];
}

export interface MensajeContacto {
  id: string;
  nombre: string;
  correo: string;
  mensaje: string;
  leido: boolean;
  creado_en: string;
}

