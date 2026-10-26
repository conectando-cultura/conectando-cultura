import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import {
  esMysqlConfigurado,
  ejecutarConsulta,
  ejecutarComando,
  parsearJsonArrayStrings
} from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";

interface FilaPreferenciaNotificacionMysql extends RowDataPacket {
  usuario_id: string;
  barrio_id: string | null;
  categoria_ids: unknown;
}

export class NotificacionesService {
  /**
   * Registra las notificaciones para todos los usuarios con preferencias
   * coincidentes en categoría o barrio en MySQL y replica en Supabase.
   */
  async notificarNuevaActividad(actividad: {
    id: string;
    nombre: string;
    categoriaId: string;
    barrioId: string;
  }): Promise<number> {
    if (!esMysqlConfigurado()) return 0;

    try {
      const preferencias = await ejecutarConsulta<FilaPreferenciaNotificacionMysql[]>(
        `SELECT usuario_id, barrio_id, categoria_ids FROM preferencias_usuario`
      );

      if (!preferencias || preferencias.length === 0) {
        return 0;
      }

      const usuariosInteresados = new Set<string>();
      for (const pref of preferencias) {
        const categorias = parsearJsonArrayStrings(pref.categoria_ids);
        const coincideBarrio = pref.barrio_id === actividad.barrioId;
        const coincideCategoria = categorias.includes(actividad.categoriaId);

        if (coincideBarrio || coincideCategoria) {
          usuariosInteresados.add(pref.usuario_id);
        }
      }

      if (usuariosInteresados.size === 0) return 0;

      const ahora = new Date();
      const ahoraIso = ahora.toISOString();
      const registrosSupabase: Array<{
        id: string;
        usuario_id: string;
        actividad_id: string;
        categoria_id: string;
        barrio_id: string;
        canal: string;
        estado: string;
        enviado_en: string;
      }> = [];

      for (const usuarioId of usuariosInteresados) {
        const id = randomUUID();
        await ejecutarComando(
          `INSERT INTO notificaciones (
            id, usuario_id, actividad_id, categoria_id, barrio_id, canal, estado, enviado_en
          ) VALUES (?, ?, ?, ?, ?, 'email', 'enviado', ?)`,
          [id, usuarioId, actividad.id, actividad.categoriaId, actividad.barrioId, ahora]
        );
        registrosSupabase.push({
          id,
          usuario_id: usuarioId,
          actividad_id: actividad.id,
          categoria_id: actividad.categoriaId,
          barrio_id: actividad.barrioId,
          canal: "email",
          estado: "enviado",
          enviado_en: ahoraIso
        });
      }

      replicarEnSupabase("notificaciones.insertarLote", () =>
        supabaseAdmin.from("notificaciones").upsert(registrosSupabase, { onConflict: "id" })
      );

      return usuariosInteresados.size;
    } catch (err) {
      console.warn("Error no bloqueante en notificaciones:", err);
      return 0;
    }
  }
}
