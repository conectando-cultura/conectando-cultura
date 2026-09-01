import { supabaseAdmin } from "../lib/supabase.js";
export class PreferenciasService {
    /**
     * Obtiene las preferencias del usuario autenticado con datos expandidos.
     */
    async obtener(usuarioId) {
        const { data, error } = await supabaseAdmin
            .from("preferencias_usuario")
            .select(`
        *,
        barrio:vecindes!barrio_id(*),
        categorias:categoria_id_fk(*)
      `)
            .eq("usuario_id", usuarioId)
            .single();
        if (error || !data)
            return null;
        const row = data;
        return {
            barrioId: row.barrio_id,
            barrio: row.barrio ?? null,
            categorias: row.categorias ?? []
        };
    }
    /**
     * Actualiza las preferencias del usuario autenticado.
     * @param usuarioId UID de Supabase Auth
     * @param barrioId UUID del barrio elegido (null = todos)
     * @param categoriaIds UUIDs de categorías seleccionadas
     */
    async actualizar(usuarioId, barrioId, categoriaIds) {
        // Validar que existan las categorías
        if (categoriaIds.length > 0) {
            const { data: cats, error: errCats } = await supabaseAdmin
                .from("categorias")
                .select("id")
                .in("id", categoriaIds);
            if (errCats || !cats || cats.length !== categoriaIds.length) {
                throw new Error("Una o más categorías seleccionadas no existen.");
            }
        }
        // Validar barrio si no es null
        if (barrioId) {
            const { data: barrio } = await supabaseAdmin
                .from("vecindes")
                .select("id")
                .eq("id", barrioId)
                .single();
            if (!barrio) {
                throw new Error("El barrio seleccionado no existe.");
            }
        }
        const { data, error } = await supabaseAdmin
            .from("preferencias_usuario")
            .update({ barrio_id: barrioId, categoria_ids: categoriaIds })
            .eq("usuario_id", usuarioId)
            .select(`
        *,
        barrio:vecindes!barrio_id(*),
        categorias:categoria_id_fk(*)
      `)
            .single();
        if (error || !data) {
            throw new Error("No se pudieron guardar las preferencias.");
        }
        const row = data;
        return {
            barrioId: row.barrio_id,
            barrio: row.barrio ?? null,
            categorias: row.categorias ?? []
        };
    }
}
