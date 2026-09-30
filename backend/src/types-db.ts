/**
 * Tipos derivados del esquema Supabase (ver supabase/migrations/001_initial_schema.sql).
 *
 * Nomenclatura alineada con lo que el backend consulta realmente:
 * tabla `barrios` con columna `barrio_id`. Los ids de usuario son TEXT
 * porque la autenticación es propia (no Supabase Auth).
 */

/** Barrio del catálogo público. */
export interface DbBarrio {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
}

/** Categoría (rubro) del catálogo público. */
export interface DbCategoria {
  id: string;
  nombre: string;
  slug: string;
  color: string; // "#rrggbb"
  icono: string;
  created_at: string;
}

/** Fila de `actividades` tal como la devuelve Supabase. */
export interface DbActividad {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  horarios: string;
  direccion: string;
  lat: number;
  lng: number;
  url: string;
  imagen_url: string;
  categoria_id: string;
  barrio_id: string;
  visibilidad: "publica" | "privada" | "oculta";
  destacado: boolean;
  activo: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** `actividades` con las relaciones anidadas del `select` de Supabase. */
export interface DbActividadFull extends DbActividad {
  categorias: Pick<DbCategoria, "nombre" | "slug" | "color" | "icono">;
  barrios: Pick<DbBarrio, "nombre" | "slug">;
}

/** Fila de `preferencias_usuario`. */
export interface DbPreferenciasUsuario {
  usuario_id: string;
  barrio_id: string | null;
  categoria_ids: string[];
  created_at: string;
  updated_at: string;
}

/** Tipo público de actividad para el frontend. */
export interface ActividadPublica {
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
  categoria: { id: string; nombre: string; slug: string; color: string; icono: string };
  barrio: { id: string; nombre: string; slug: string };
  destacado: boolean;
}

/** Preferencias del usuario logueado, con datos expandidos. */
export interface PreferenciasUsuario {
  barrioId: string | null;
  barrio: DbBarrio | null;
  categorias: DbCategoria[];
}

/** Fila de `mensajes_contacto` (Sprint 8: soporte y contacto). */
export interface DbMensajeContacto {
  id: string;
  nombre: string;
  correo: string;
  mensaje: string;
  leido: boolean;
  creado_en: string;
}

/** Fila de `notificaciones` (Sprint 8: bitácora de alertas). */
export interface DbNotificacion {
  id: string;
  usuario_id: string;
  actividad_id: string | null;
  categoria_id: string | null;
  barrio_id: string | null;
  canal: "email";
  estado: "pendiente" | "enviado" | "fallido";
  error: string | null;
  enviado_en: string | null;
  creado_en: string;
}

