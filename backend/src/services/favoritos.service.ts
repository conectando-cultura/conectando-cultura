import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { ejecutarConsulta, ejecutarComando, describirErrorMysql } from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";
import { ActividadesService } from "./actividades.service.js";
import type { ActividadPublica } from "../types-db.js";

interface FilaFavoritoMysql extends RowDataPacket {
  actividad_id: string;
}

export class FavoritosService {
  private actividadesService = new ActividadesService();

  async obtenerIdsFavoritos(usuarioId: string): Promise<string[]> {
    try {
      const filas = await ejecutarConsulta<FilaFavoritoMysql[]>(
        `SELECT actividad_id FROM favoritos_usuario WHERE usuario_id = ?`,
        [usuarioId]
      );
      return filas.map((row) => row.actividad_id);
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }

  async obtenerActividadesFavoritas(usuarioId: string): Promise<ActividadPublica[]> {
    const ids = await this.obtenerIdsFavoritos(usuarioId);
    if (ids.length === 0) return [];

    const todas = await this.actividadesService.listar();
    return todas.filter((a) => ids.includes(a.id));
  }

  async agregarFavorito(usuarioId: string, actividadId: string): Promise<void> {
    const id = randomUUID();
    try {
      await ejecutarComando(
        `INSERT IGNORE INTO favoritos_usuario (id, usuario_id, actividad_id)
         VALUES (?, ?, ?)`,
        [id, usuarioId, actividadId]
      );

      replicarEnSupabase("favoritos.agregar", () =>
        supabaseAdmin.from("favoritos_usuario").upsert(
          { id, usuario_id: usuarioId, actividad_id: actividadId },
          { onConflict: "usuario_id,actividad_id" }
        )
      );
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }

  async eliminarFavorito(usuarioId: string, actividadId: string): Promise<void> {
    try {
      await ejecutarComando(
        `DELETE FROM favoritos_usuario WHERE usuario_id = ? AND actividad_id = ?`,
        [usuarioId, actividadId]
      );

      replicarEnSupabase("favoritos.eliminar", () =>
        supabaseAdmin
          .from("favoritos_usuario")
          .delete()
          .eq("usuario_id", usuarioId)
          .eq("actividad_id", actividadId)
      );
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }
}
