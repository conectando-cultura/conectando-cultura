import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
const SELECCION = "*, barrios(nombre, slug, id, created_at)";
function describirError(error) {
    if (!error)
        return "Error desconocido de Supabase.";
    if (error.code === "PGRST116")
        return "No se encontraron preferencias.";
    if (error.code === "23503")
        return "El barrio o la categoría indicada no existe.";
    return error.message || "Error de base de datos.";
}
export class PreferenciasService {
    /**
     * Preferencias del usuario autenticado, con barrio y categorías expandidos.
     * Devuelve valores vacíos si el usuario todavía no guardó nada.
     */
    async obtener(usuarioId) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("preferencias_usuario")
            .select(SELECCION)
            .eq("usuario_id", usuarioId)
            .maybeSingle();
        if (error && error.code !== "PGRST116") {
            throw new Error(describirError(error));
        }
        if (!data) {
            return { barrioId: null, barrio: null, categorias: [] };
        }
        const fila = data;
        const categorias = await this.filtrarCategorias(fila.categoria_ids);
        return { barrioId: fila.barrio_id, barrio: fila.barrios ?? null, categorias };
    }
    /**
     * Guarda las preferencias del usuario autenticado.
     * @param usuarioId id del usuario (TEXT, ver migración 001)
     * @param barrioId UUID del barrio elegido (null = todos)
     * @param categoriaIds UUIDs de categorías seleccionadas
     */
    async actualizar(usuarioId, barrioId, categoriaIds) {
        exigirSupabase();
        // Validar que las categorías existan antes de escribir
        if (categoriaIds.length > 0) {
            const { data: cats, error: errCats } = await supabaseAdmin
                .from("categorias")
                .select("id")
                .in("id", categoriaIds);
            if (errCats)
                throw new Error(describirError(errCats));
            if (!cats || cats.length !== categoriaIds.length) {
                throw new Error("Una o más categorías seleccionadas no existen.");
            }
        }
        // Validar el barrio si se envió
        if (barrioId) {
            const { data: barrio, error: errBarrio } = await supabaseAdmin
                .from("barrios")
                .select("id")
                .eq("id", barrioId)
                .maybeSingle();
            if (errBarrio)
                throw new Error(describirError(errBarrio));
            if (!barrio)
                throw new Error("El barrio seleccionado no existe.");
        }
        // upsert: la fila puede no existir todavía
        const { data, error } = await supabaseAdmin
            .from("preferencias_usuario")
            .upsert({ usuario_id: usuarioId, barrio_id: barrioId, categoria_ids: categoriaIds }, { onConflict: "usuario_id" })
            .select(SELECCION)
            .single();
        if (error)
            throw new Error(describirError(error));
        const fila = data;
        const categorias = await this.filtrarCategorias(fila.categoria_ids);
        return { barrioId: fila.barrio_id, barrio: fila.barrios ?? null, categorias };
    }
    /** Devuelve sólo las categorías indicadas, en el orden del catálogo. */
    async filtrarCategorias(ids) {
        if (!ids || ids.length === 0)
            return [];
        const { data, error } = await supabaseAdmin
            .from("categorias")
            .select("id, nombre, slug, color, icono, created_at")
            .order("nombre");
        if (error)
            throw new Error(describirError(error));
        return (data ?? []).filter((c) => ids.includes(c.id));
    }
}
