/** Tipos derivados del schema de Supabase */

export interface DbVecind {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
}

export interface DbCategoria {
  id: string;
  nombre: string;
  slug: string;
  color: string; // "#rrggbb"
  icono: string;
  created_at: string;
}

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
  vecind_id: string;
  visibilidad: "publica" | "privada" | "oculta";
  destacado: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbActividadFull extends DbActividad {
  categoria: DbCategoria;
  vecind: DbVecind;
}

export interface DbPreferenciasUsuario {
  usuario_id: string;
  barrio_id: string | null;
  categoria_ids: string[];
  created_at: string;
  updated_at: string;
}

/** Tipo público de actividad para el frontend */
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

/** Preferencias del usuario logueado */
export interface PreferenciasUsuario {
  barrioId: string | null;
  barrio: DbVecind | null;
  categorias: DbCategoria[];
}
