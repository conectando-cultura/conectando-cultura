import { supabaseAdmin } from "../lib/supabase.js";
import type { DbActividadFull, ActividadPublica } from "../types-db.js";

function aPublica(fila: DbActividadFull): ActividadPublica {
  return {
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    descripcion: fila.descripcion,
    horarios: fila.horarios ?? "",
    direccion: fila.direccion,
    lat: fila.lat,
    lng: fila.lng,
    url: fila.url ?? "",
    imagenUrl: fila.imagen_url ?? "",
    categoria: { id: fila.categoria_id, ...fila.categorias },
    barrio: { id: fila.vecind_id, ...fila.barrios },
    destacado: fila.destacado ?? false
  };
}

export class ActividadesService {
  async listar(filtros: { barrioSlug?: string; categoriaSlug?: string; limite?: number } = {}) {
    let consulta = supabaseAdmin
      .from("actividades")
      .select(`
        id, nombre, slug, descripcion, horarios, direccion, lat, lng, url, imagen_url, destacado, activo,
        categoria_id, categorias(nombre, slug, color, icono),
        barrio_id, barrios(nombre, slug)
      `)
      .eq("activo", true)
      .order("nombre");

    if (filtros.barrioSlug) {
      consulta = consulta.eq("barrios.slug", filtros.barrioSlug);
    }
    if (filtros.categoriaSlug) {
      consulta = consulta.eq("categorias.slug", filtros.categoriaSlug);
    }
    if (filtros.limite) {
      consulta = consulta.limit(filtros.limite);
    }

    const { data, error } = await consulta;
    if (error) throw error;
    return (data ?? []).map((r) => aPublica(r as unknown as DbActividadFull));
  }

  async listarBarrios() {
    const { data, error } = await supabaseAdmin.from("barrios").select("id, nombre, slug").order("nombre");
    if (error) throw error;
    return data ?? [];
  }

  async listarCategorias() {
    const { data, error } = await supabaseAdmin.from("categorias").select("id, nombre, slug, color, icono").order("nombre");
    if (error) throw error;
    return data ?? [];
  }

  async obtenerPorSlug(slug: string, barrioSlug: string) {
    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(`
        id, nombre, slug, descripcion, horarios, direccion, lat, lng, url, imagen_url, destacado,
        categoria_id, categorias(nombre, slug, color, icono),
        barrio_id, barrios(nombre, slug)
      `)
      .eq("slug", slug)
      .eq("activo", true)
      .single();

    if (error || !data) return null;
    const fila = data as unknown as DbActividadFull;
    if (fila.barrios.slug !== barrioSlug) return null;
    return aPublica(fila);
  }

  async crear(datos: Record<string, unknown>, usuarioId: string) {
    const slug = String(datos.nombre).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabaseAdmin
      .from("actividades")
      .insert({
        nombre: datos.nombre,
        slug,
        descripcion: datos.descripcion,
        horarios: datos.horarios ?? "",
        direccion: datos.direccion,
        lat: datos.lat ?? -34.653,
        lng: datos.lng ?? -58.517,
        url: datos.url ?? "",
        imagen_url: datos.imagenUrl ?? "",
        categoria_id: datos.categoriaId,
        barrio_id: datos.barrioId,
        destacado: datos.destacado ?? false,
        created_by: usuarioId,
        updated_by: usuarioId,
        activo: true
      })
      .select()
      .single();

    if (error) throw error;
    return aPublica(data as unknown as DbActividadFull);
  }

  async actualizar(id: string, datos: Record<string, unknown>, usuarioId: string) {
    const updates: Record<string, unknown> = { updated_by: usuarioId };
    if (datos.nombre !== undefined) updates.nombre = datos.nombre;
    if (datos.descripcion !== undefined) updates.descripcion = datos.descripcion;
    if (datos.horarios !== undefined) updates.horarios = datos.horarios;
    if (datos.direccion !== undefined) updates.direccion = datos.direccion;
    if (datos.lat !== undefined) updates.lat = datos.lat;
    if (datos.lng !== undefined) updates.lng = datos.lng;
    if (datos.url !== undefined) updates.url = datos.url;
    if (datos.imagenUrl !== undefined) updates.imagen_url = datos.imagenUrl;
    if (datos.categoriaId !== undefined) updates.categoria_id = datos.categoriaId;
    if (datos.barrioId !== undefined) updates.barrio_id = datos.barrioId;
    if (datos.destacado !== undefined) updates.destacado = datos.destacado;

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return aPublica(data as unknown as DbActividadFull);
  }

  async eliminar(id: string) {
    // Eliminación lógica: marcar como inactivo
    const { error } = await supabaseAdmin
      .from("actividades")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;
  }

  async listarTodasAdmin() {
    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(`
        id, nombre, slug, descripcion, horarios, direccion, lat, lng, url, imagen_url, destacado, activo, creado_en,
        categoria_id, categorias(nombre, slug, color, icono),
        barrio_id, barrios(nombre, slug)
      `)
      .order("creado_en", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => ({ ...aPublica(r as unknown as DbActividadFull), activo: (r as any).activo }));
  }
}
