import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
function aPublica(fila) {
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
        destacado: fila.destacado ?? false
    };
}
/**
 * Traduce el `error` de PostgREST a un mensaje útil.
 * Sin esto el cliente vería "TypeError: fetch failed" y no sabría qué pasó.
 */
function describirError(error) {
    if (!error)
        return "Error desconocido de Supabase.";
    if (error.code === "PGRST116")
        return "No se encontró el registro solicitado.";
    if (error.code === "23505")
        return "Ya existe un registro con esos datos únicos.";
    if (error.code === "23503")
        return "La referencia indicada no existe (clave foránea).";
    if (error.code === "23514")
        return "Un valor no cumple una restricción de la tabla.";
    return error.message || "Error de base de datos.";
}
const SELECCION = `
  id, nombre, slug, descripcion, horarios, direccion, lat, lng,
  url, imagen_url, destacado, activo,
  categoria_id, categorias(nombre, slug, color, icono),
  barrio_id, barrios(nombre, slug)
`;
export class ActividadesService {
    /** Catálogo público: sólo actividades activas. */
    async listar(filtros = {}) {
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
        return data.map(aPublica);
    }
    async listarBarrios() {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("barrios")
            .select("id, nombre, slug, created_at")
            .order("nombre");
        if (error)
            throw new Error(describirError(error));
        return data ?? [];
    }
    async listarCategorias() {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("categorias")
            .select("id, nombre, slug, color, icono, created_at")
            .order("nombre");
        if (error)
            throw new Error(describirError(error));
        return data ?? [];
    }
    async obtenerPorSlug(slug, barrioSlug) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("actividades")
            .select(SELECCION)
            .eq("slug", slug)
            .eq("activo", true)
            .maybeSingle();
        if (error)
            throw new Error(describirError(error));
        if (!data)
            return null;
        const fila = data;
        if (fila.barrios.slug !== barrioSlug)
            return null;
        return aPublica(fila);
    }
    async crear(datos, usuarioId) {
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
            created_by: usuarioId,
            updated_by: usuarioId,
            activo: true
        })
            .select(SELECCION)
            .single();
        if (error)
            throw new Error(describirError(error));
        return aPublica(data);
    }
    async actualizar(id, datos, usuarioId) {
        exigirSupabase();
        const updates = { updated_by: usuarioId };
        if (datos.nombre !== undefined)
            updates.nombre = datos.nombre;
        if (datos.descripcion !== undefined)
            updates.descripcion = datos.descripcion;
        if (datos.horarios !== undefined)
            updates.horarios = datos.horarios;
        if (datos.direccion !== undefined)
            updates.direccion = datos.direccion;
        if (datos.lat !== undefined)
            updates.lat = datos.lat;
        if (datos.lng !== undefined)
            updates.lng = datos.lng;
        if (datos.url !== undefined)
            updates.url = datos.url;
        if (datos.imagenUrl !== undefined)
            updates.imagen_url = datos.imagenUrl;
        if (datos.categoriaId !== undefined)
            updates.categoria_id = datos.categoriaId;
        if (datos.barrioId !== undefined)
            updates.barrio_id = datos.barrioId;
        if (datos.destacado !== undefined)
            updates.destacado = datos.destacado;
        if (datos.activo !== undefined)
            updates.activo = datos.activo;
        const { data, error } = await supabaseAdmin
            .from("actividades")
            .update(updates)
            .eq("id", id)
            .select(SELECCION)
            .maybeSingle();
        if (error)
            throw new Error(describirError(error));
        if (!data)
            throw new Error("Actividad no encontrada.");
        return aPublica(data);
    }
    /** Borrado lógico: la fila se conserva, `activo` pasa a false. */
    async eliminar(id) {
        exigirSupabase();
        const { error } = await supabaseAdmin
            .from("actividades")
            .update({ activo: false })
            .eq("id", id);
        if (error)
            throw new Error(describirError(error));
    }
    /** Reactivación lógica: `activo` pasa a true. */
    async reactivar(id, usuarioId) {
        return this.actualizar(id, { activo: true }, usuarioId);
    }
    /** Listado para el panel admin: soporta filtros, búsqueda, orden y paginación. */
    async listarTodasAdmin(opciones = {}) {
        exigirSupabase();
        const pagina = Math.max(1, Number(opciones.pagina) || 1);
        const limite = opciones.limite ? Math.max(1, Math.min(100, Number(opciones.limite))) : 50;
        const desde = (pagina - 1) * limite;
        const hasta = desde + limite - 1;
        let consulta = supabaseAdmin
            .from("actividades")
            .select(SELECCION, { count: "exact" });
        if (opciones.activo !== undefined) {
            consulta = consulta.eq("activo", opciones.activo);
        }
        if (opciones.q && opciones.q.trim()) {
            const termino = opciones.q.trim();
            consulta = consulta.or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%,direccion.ilike.%${termino}%`);
        }
        switch (opciones.orden) {
            case "antiguas":
                consulta = consulta.order("created_at", { ascending: true });
                break;
            case "nombre_asc":
                consulta = consulta.order("nombre", { ascending: true });
                break;
            case "nombre_desc":
                consulta = consulta.order("nombre", { ascending: false });
                break;
            case "recientes":
            default:
                consulta = consulta.order("created_at", { ascending: false });
                break;
        }
        if (opciones.pagina !== undefined || opciones.limite !== undefined) {
            consulta = consulta.range(desde, hasta);
        }
        const { data, count, error } = await consulta;
        if (error)
            throw new Error(describirError(error));
        const actividades = (data ?? []).map((fila) => ({
            ...aPublica(fila),
            activo: fila.activo !== false
        }));
        return {
            actividades,
            total: count ?? actividades.length,
            pagina,
            limite
        };
    }
}
