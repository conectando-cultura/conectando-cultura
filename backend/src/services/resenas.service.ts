import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import {
  ejecutarConsulta,
  ejecutarComando,
  aIso,
  describirErrorMysql
} from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";
import type { DbResenaPublica } from "../types-db.js";

interface FilaResenaJoinMysql extends RowDataPacket {
  id: string;
  usuario_id: string;
  calificacion: number;
  comentario: string;
  creado_en: Date | string;
  usuario_nombre: string | null;
  usuario_apellido: string | null;
}

interface FilaUsuarioNombreMysql extends RowDataPacket {
  nombre: string;
  apellido: string;
}

function formatearNombreVecino(nombre?: string | null, apellido?: string | null): string {
  if (!nombre) return "Vecino de la Comuna 9";
  const inicial = apellido?.charAt(0) ?? "";
  return `${nombre} ${inicial}.`.trim();
}

export class ResenasService {
  async obtenerResenas(actividadId: string): Promise<{
    resenas: DbResenaPublica[];
    promedio: number;
    total: number;
  }> {
    try {
      const filas = await ejecutarConsulta<FilaResenaJoinMysql[]>(
        `SELECT
           r.id,
           r.usuario_id,
           r.calificacion,
           r.comentario,
           r.creado_en,
           u.nombre   AS usuario_nombre,
           u.apellido AS usuario_apellido
         FROM resenas r
         LEFT JOIN usuarios u ON u.id = r.usuario_id
         WHERE r.actividad_id = ?
         ORDER BY r.creado_en DESC`,
        [actividadId]
      );

      if (filas.length === 0) {
        return { resenas: [], promedio: 0, total: 0 };
      }

      const resenas: DbResenaPublica[] = filas.map((r) => ({
        id: r.id,
        usuarioId: r.usuario_id,
        usuarioNombre: formatearNombreVecino(r.usuario_nombre, r.usuario_apellido),
        calificacion: Number(r.calificacion),
        comentario: r.comentario,
        creadoEn: aIso(r.creado_en)
      }));

      const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
      const promedio = Number((suma / resenas.length).toFixed(1));

      return { resenas, promedio, total: resenas.length };
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }

  async crearResena(
    usuarioId: string,
    actividadId: string,
    calificacion: number,
    comentario: string
  ): Promise<DbResenaPublica> {
    const calif = Math.round(Number(calificacion));
    if (calif < 1 || calif > 5) {
      throw new Error("La calificación debe ser un puntaje del 1 al 5.");
    }

    const comentarioLimpio = String(comentario ?? "").trim();
    if (comentarioLimpio.length < 3 || comentarioLimpio.length > 1000) {
      throw new Error("El comentario debe tener entre 3 y 1000 caracteres.");
    }

    const id = randomUUID();
    const ahora = new Date();

    try {
      await ejecutarComando(
        `INSERT INTO resenas (id, usuario_id, actividad_id, calificacion, comentario, creado_en)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, usuarioId, actividadId, calif, comentarioLimpio, ahora]
      );
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }

    replicarEnSupabase("resenas.crear", () =>
      supabaseAdmin.from("resenas").upsert(
        {
          id,
          usuario_id: usuarioId,
          actividad_id: actividadId,
          calificacion: calif,
          comentario: comentarioLimpio,
          creado_en: ahora.toISOString()
        },
        { onConflict: "id" }
      )
    );

    const usuarios = await ejecutarConsulta<FilaUsuarioNombreMysql[]>(
      `SELECT nombre, apellido FROM usuarios WHERE id = ? LIMIT 1`,
      [usuarioId]
    );
    const usuario = usuarios[0];

    return {
      id,
      usuarioId,
      usuarioNombre: formatearNombreVecino(usuario?.nombre, usuario?.apellido),
      calificacion: calif,
      comentario: comentarioLimpio,
      creadoEn: ahora.toISOString()
    };
  }
}
