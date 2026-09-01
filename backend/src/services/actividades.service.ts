import { supabaseAdmin } from "../lib/supabase.js";
import type { DbActividadFull, ActividadPublica } from "../types-db.js";

function aPublica(fila: DbActividadFull): ActividadPublica {
  return {
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    descripcion: fila.descripcion,
    horarios: fila.horarios,
    direccion: fila.direccion,
    lat: Number(fila.lat),
    lng: Number(fila.lng),
    url: fila.url,
    imagenUrl: fila.imagen_url,
    categoria: {
      id: fila.categoria.id,
      nombre: fila.categoria.nombre,
      slug: fila.categoria.slug,
      color: fila.categoria.color,
      icono: fila.categoria.icono
    },
    barrio: {
      id: fila.vecind.id,
      nombre: fila.vecind.nombre,
      slug: fila.vecind.slug
    },
    destacado: fila.destacado
  };
}

export class ActividadesService {
  /**
   * Lista actividades públicas con filtros opcionales.
   */
  async listar(params: {
    barrioSlug?: string;
    categoriaSlug?: string;
    limite?: number;
  }): Promise<ActividadPublica[]> {
    let query = supabaseAdmin
      .from("actividades")
      .select(
        `
        *,
        categoria:categorias!categoria_id(*),
        vecind:vecindes!vecind_id(*)
      `
      )
      .eq("visibilidad", "publica")
      .order("destacado", { ascending: false });

    if (params.categoriaSlug) {
      query = query.eq("categoria.slug", params.categoriaSlug);
    }
    if (params.barrioSlug) {
      query = query.eq("vecind.slug", params.barrioSlug);
    }
    if (params.limite) {
      query = query.limit(params.limite);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("No se pudieron obtener las actividades.");
    }

    return (data as unknown as DbActividadFull[]).map(aPublica);
  }

  /**
   * Obtiene una actividad por su slug + barrio.
   */
  async obtenerPorSlug(
    slug: string,
    barrioSlug: string
  ): Promise<ActividadPublica | null> {
    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(
        `
        *,
        categoria:categorias!categoria_id(*),
        vecind:vecindes!vecind_id(*)
      `
      )
      .eq("slug", slug)
      .eq("vecind.slug", barrioSlug)
      .eq("visibilidad", "publica")
      .single();

    if (error || !data) return null;
    return aPublica(data as unknown as DbActividadFull);
  }

  /**
   * Obtiene todos los barrios (para filtros).
   */
  async listarBarrios() {
    const { data } = await supabaseAdmin
      .from("vecindes")
      .select("id, nombre, slug")
      .order("nombre");
    return data ?? [];
  }

  /**
   * Obtiene todas las categorías (para filtros).
   */
  async listarCategorias() {
    const { data } = await supabaseAdmin
      .from("categorias")
      .select("id, nombre, slug, color, icono")
      .order("nombre");
    return data ?? [];
  }
}
