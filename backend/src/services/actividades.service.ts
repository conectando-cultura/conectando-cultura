import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import type { DbActividadFull, ActividadPublica } from "../types-db.js";
import { NotificacionesService } from "./notificaciones.service.js";

const servicioNotificaciones = new NotificacionesService();

/** Fila de `actividades` con las relaciones anidadas del `select` de Supabase. */
type ActividadConRelaciones = DbActividadFull & { activo?: boolean };

function aPublica(fila: ActividadConRelaciones): ActividadPublica {
  return {
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    descripcion: fila.descripcion,
    horarios: fila.horarios ?? "",
    direccion: fila.direccion,
    lat: Number(fila.lat),
    lng: Number(fila.lng),
    url: fila.url ?? "",
    imagenUrl: fila.imagen_url ?? "",
    categoria: { id: fila.categoria_id, ...fila.categorias },
    barrio: { id: fila.barrio_id, ...fila.barrios },
    destacado: fila.destacado ?? false,
    fechaInicio: fila.fecha_inicio ?? null,
    fechaFin: fila.fecha_fin ?? null,
    esRecurrente: fila.es_recurrente !== false,
    diasSemana: fila.dias_semana ?? ""
  };
}

/**
 * Traduce el `error` de PostgREST a un mensaje útil.
 * Sin esto el cliente vería "TypeError: fetch failed" y no sabría qué pasó.
 */
function describirError(error: { code?: string; message?: string; details?: string } | null): string {
  if (!error) return "Error desconocido de Supabase.";
  if (error.code === "PGRST116") return "No se encontró el registro solicitado.";
  if (error.code === "23505") return "Ya existe un registro con esos datos únicos.";
  if (error.code === "23503") return "La referencia indicada no existe (clave foránea).";
  if (error.code === "23514") return "Un valor no cumple una restricción de la tabla.";
  return error.message || "Error de base de datos.";
}

const SELECCION = `
  id, nombre, slug, descripcion, horarios, direccion, lat, lng,
  url, imagen_url, destacado, activo, fecha_inicio, fecha_fin, es_recurrente, dias_semana,
  categoria_id, categorias(nombre, slug, color, icono),
  barrio_id, barrios(nombre, slug)
`;

export class ActividadesService {
  /** Catálogo público: sólo actividades activas. */
  async listar(
    filtros: { barrioSlug?: string; categoriaSlug?: string; limite?: number } = {}
  ): Promise<ActividadPublica[]> {
    exigirSupabase();

    let consulta = supabaseAdmin
      .from("actividades")
      .select(SELECCION)
      .eq("activo", true)
      .order("nombre");

    if (filtros.barrioSlug) {
      consulta = consulta.eq("barrios.slug", filtros.barrioSlug);
    }
    if (filtros.categoriaSlug) {
      consulta = consulta.eq("categorias.slug", filtros.categoriaSlug);
    }
    if (filtros.limite && filtros.limite > 0) {
      consulta = consulta.limit(filtros.limite);
    }

    const { data, error } = await consulta;
    if (error) {
      throw new Error(describirError(error));
    }

    return (data as unknown as ActividadConRelaciones[]).map(aPublica);
  }

  async listarBarrios() {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("barrios")
      .select("id, nombre, slug, created_at")
      .order("nombre");

    if (error) throw new Error(describirError(error));
    return data ?? [];
  }

  async listarCategorias() {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("categorias")
      .select("id, nombre, slug, color, icono, created_at")
      .order("nombre");

    if (error) throw new Error(describirError(error));
    return data ?? [];
  }

  async obtenerPorSlug(slug: string, barrioSlug: string): Promise<ActividadPublica | null> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(SELECCION)
      .eq("slug", slug)
      .eq("activo", true)
      .maybeSingle();

    if (error) throw new Error(describirError(error));
    if (!data) return null;

    const fila = data as unknown as ActividadConRelaciones;
    if (fila.barrios.slug !== barrioSlug) return null;

    return aPublica(fila);
  }

  async obtenerPorId(id: string): Promise<ActividadPublica | null> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(SELECCION)
      .eq("id", id)
      .eq("activo", true)
      .maybeSingle();

    if (error) throw new Error(describirError(error));
    if (!data) return null;

    return aPublica(data as unknown as ActividadConRelaciones);
  }

  async crear(datos: Record<string, unknown>, usuarioId: string): Promise<ActividadPublica> {
    exigirSupabase();

    const nombre = String(datos.nombre ?? "").trim();
    const slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .insert({
        nombre,
        slug,
        descripcion: String(datos.descripcion ?? ""),
        horarios: String(datos.horarios ?? ""),
        direccion: String(datos.direccion ?? ""),
        lat: Number(datos.lat) || -34.653,
        lng: Number(datos.lng) || -58.517,
        url: String(datos.url ?? ""),
        imagen_url: String(datos.imagenUrl ?? ""),
        categoria_id: String(datos.categoriaId ?? ""),
        barrio_id: String(datos.barrioId ?? ""),
        destacado: Boolean(datos.destacado),
        fecha_inicio: datos.fechaInicio ? String(datos.fechaInicio) : null,
        fecha_fin: datos.fechaFin ? String(datos.fechaFin) : null,
        es_recurrente: datos.esRecurrente !== undefined ? Boolean(datos.esRecurrente) : true,
        dias_semana: String(datos.diasSemana ?? ""),
        created_by: usuarioId,
        updated_by: usuarioId,
        activo: true
      })
      .select(SELECCION)
      .single();

    if (error) throw new Error(describirError(error));

    // Notificación asincrónica a usuarios interesados (Sprint 8)
    const categoriaId = String(datos.categoriaId ?? "");
    const barrioId = String(datos.barrioId ?? "");
    if (categoriaId || barrioId) {
      servicioNotificaciones
        .notificarNuevaActividad({
          id: data.id,
          nombre,
          categoriaId,
          barrioId
        })
        .catch((err) => console.warn("Fallo al notificar nueva actividad:", err));
    }

    return aPublica(data as unknown as ActividadConRelaciones);
  }

  async actualizar(
    id: string,
    datos: Record<string, unknown>,
    usuarioId: string
  ): Promise<ActividadPublica> {
    exigirSupabase();

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
    if (datos.activo !== undefined) updates.activo = datos.activo;
    if (datos.fechaInicio !== undefined) updates.fecha_inicio = datos.fechaInicio || null;
    if (datos.fechaFin !== undefined) updates.fecha_fin = datos.fechaFin || null;
    if (datos.esRecurrente !== undefined) updates.es_recurrente = Boolean(datos.esRecurrente);
    if (datos.diasSemana !== undefined) updates.dias_semana = String(datos.diasSemana);

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .update(updates)
      .eq("id", id)
      .select(SELECCION)
      .maybeSingle();

    if (error) throw new Error(describirError(error));
    if (!data) throw new Error("Actividad no encontrada.");

    return aPublica(data as unknown as ActividadConRelaciones);
  }

  /** Borrado lógico: la fila se conserva, `activo` pasa a false. */
  async eliminar(id: string): Promise<void> {
    exigirSupabase();

    const { error } = await supabaseAdmin
      .from("actividades")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw new Error(describirError(error));
  }

  /** Listado para el panel admin: incluye activas e inactivas. */
  async listarTodasAdmin(): Promise<Array<ActividadPublica & { activo: boolean }>> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("actividades")
      .select(SELECCION)
      .order("created_at", { ascending: false });

    if (error) throw new Error(describirError(error));

    return ((data as unknown as ActividadConRelaciones[]) ?? []).map((fila) => ({
      ...aPublica(fila),
      activo: fila.activo !== false
    }));
  }
}
