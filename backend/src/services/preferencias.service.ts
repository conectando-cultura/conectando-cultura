import type { RowDataPacket } from "mysql2/promise";
import {
  ejecutarConsulta,
  ejecutarComando,
  aIso,
  parsearJsonArrayStrings,
  describirErrorMysql
} from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";
import type {
  DbCategoria,
  DbBarrio,
  PreferenciasUsuario
} from "../types-db.js";

interface FilaPreferenciaMysql extends RowDataPacket {
  usuario_id: string;
  barrio_id: string | null;
  categoria_ids: unknown;
  barrio_nombre: string | null;
  barrio_slug: string | null;
  barrio_created_at: Date | string | null;
}

interface FilaCategoriaMysql extends RowDataPacket {
  id: string;
  nombre: string;
  slug: string;
  color: string;
  icono: string;
  created_at: Date | string;
}

interface FilaIdMysql extends RowDataPacket {
  id: string;
}

export class PreferenciasService {
  /**
   * Preferencias del usuario autenticado, con barrio y categorías expandidos.
   * Devuelve valores vacíos si el usuario todavía no guardó nada.
   */
  async obtener(usuarioId: string): Promise<PreferenciasUsuario> {
    try {
      const filas = await ejecutarConsulta<FilaPreferenciaMysql[]>(
        `SELECT
           p.usuario_id,
           p.barrio_id,
           p.categoria_ids,
           b.nombre     AS barrio_nombre,
           b.slug       AS barrio_slug,
           b.created_at AS barrio_created_at
         FROM preferencias_usuario p
         LEFT JOIN barrios b ON b.id = p.barrio_id
         WHERE p.usuario_id = ?
         LIMIT 1`,
        [usuarioId]
      );

      const fila = filas[0];
      if (!fila) {
        return { barrioId: null, barrio: null, categorias: [] };
      }

      const categoriaIds = parsearJsonArrayStrings(fila.categoria_ids);
      const categorias = await this.filtrarCategorias(categoriaIds);
      const barrio: DbBarrio | null =
        fila.barrio_id && fila.barrio_nombre && fila.barrio_slug
          ? {
              id: fila.barrio_id,
              nombre: fila.barrio_nombre,
              slug: fila.barrio_slug,
              created_at: aIso(fila.barrio_created_at)
            }
          : null;

      return { barrioId: fila.barrio_id, barrio, categorias };
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }

  /**
   * Guarda las preferencias del usuario autenticado en MySQL y replica en Supabase.
   */
  async actualizar(
    usuarioId: string,
    barrioId: string | null,
    categoriaIds: string[]
  ): Promise<PreferenciasUsuario> {
    try {
      if (categoriaIds.length > 0) {
        const placeholders = categoriaIds.map(() => "?").join(", ");
        const cats = await ejecutarConsulta<FilaIdMysql[]>(
          `SELECT id FROM categorias WHERE id IN (${placeholders})`,
          categoriaIds
        );
        if (cats.length !== categoriaIds.length) {
          throw new Error("Una o más categorías seleccionadas no existen.");
        }
      }

      if (barrioId) {
        const barrios = await ejecutarConsulta<FilaIdMysql[]>(
          `SELECT id FROM barrios WHERE id = ? LIMIT 1`,
          [barrioId]
        );
        if (barrios.length === 0) {
          throw new Error("El barrio seleccionado no existe.");
        }
      }

      const jsonCategorias = JSON.stringify(categoriaIds);

      await ejecutarComando(
        `INSERT INTO preferencias_usuario (usuario_id, barrio_id, categoria_ids)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           barrio_id = VALUES(barrio_id),
           categoria_ids = VALUES(categoria_ids),
           updated_at = CURRENT_TIMESTAMP(3)`,
        [usuarioId, barrioId, jsonCategorias]
      );

      replicarEnSupabase("preferencias.actualizar", () =>
        supabaseAdmin.from("preferencias_usuario").upsert(
          {
            usuario_id: usuarioId,
            barrio_id: barrioId,
            categoria_ids: categoriaIds
          },
          { onConflict: "usuario_id" }
        )
      );

      return await this.obtener(usuarioId);
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(describirErrorMysql(err));
    }
  }

  /** Devuelve sólo las categorías indicadas, en el orden del catálogo. */
  private async filtrarCategorias(ids: string[]): Promise<DbCategoria[]> {
    if (!ids || ids.length === 0) return [];

    const filas = await ejecutarConsulta<FilaCategoriaMysql[]>(
      `SELECT id, nombre, slug, color, icono, created_at FROM categorias ORDER BY nombre ASC`
    );

    return filas
      .filter((c) => ids.includes(c.id))
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        slug: c.slug,
        color: c.color,
        icono: c.icono,
        created_at: aIso(c.created_at)
      }));
  }
}
