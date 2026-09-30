import { supabaseAdmin, esSupabaseConfigurado } from "../lib/supabase.js";
import type { DbPreferenciasUsuario } from "../types-db.js";

export class NotificacionesService {
  /**
   * Registra las notificaciones para todos los usuarios con preferencias
   * coincidentes en categoría o barrio.
   */
  async notificarNuevaActividad(actividad: {
    id: string;
    nombre: string;
    categoriaId: string;
    barrioId: string;
  }): Promise<number> {
    if (!esSupabaseConfigurado()) return 0;

    try {
      // 1. Obtener todas las preferencias de usuarios
      const { data: preferencias, error: errorPrefs } = await supabaseAdmin
        .from("preferencias_usuario")
        .select("usuario_id, barrio_id, categoria_ids");

      if (errorPrefs || !preferencias) {
        console.warn("No se pudieron cargar preferencias para notificaciones:", errorPrefs?.message);
        return 0;
      }

      // 2. Filtrar usuarios interesados
      const usuariosInteresados = new Set<string>();
      for (const pref of preferencias as DbPreferenciasUsuario[]) {
        const coincideBarrio = pref.barrio_id === actividad.barrioId;
        const coincideCategoria =
          Array.isArray(pref.categoria_ids) && pref.categoria_ids.includes(actividad.categoriaId);

        if (coincideBarrio || coincideCategoria) {
          usuariosInteresados.add(pref.usuario_id);
        }
      }

      if (usuariosInteresados.size === 0) return 0;

      // 3. Crear registros en la tabla notificaciones
      const ahora = new Date().toISOString();
      const registros = Array.from(usuariosInteresados).map((usuarioId) => ({
        usuario_id: usuarioId,
        actividad_id: actividad.id,
        categoria_id: actividad.categoriaId,
        barrio_id: actividad.barrioId,
        canal: "email",
        estado: "enviado",
        enviado_en: ahora
      }));

      const { error: errorInsert } = await supabaseAdmin
        .from("notificaciones")
        .insert(registros);

      if (errorInsert) {
        console.warn("Advertencia al registrar notificaciones:", errorInsert.message);
      }

      return usuariosInteresados.size;
    } catch (err) {
      console.warn("Error no bloqueante en notificaciones:", err);
      return 0;
    }
  }
}
