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
import type { DbMensajeContacto } from "../types-db.js";

interface FilaMensajeContactoMysql extends RowDataPacket {
  id: string;
  nombre: string;
  correo: string;
  mensaje: string;
  leido: number | boolean;
  creado_en: Date | string;
}

function mapearMensaje(fila: FilaMensajeContactoMysql): DbMensajeContacto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    mensaje: fila.mensaje,
    leido: Boolean(fila.leido),
    creado_en: aIso(fila.creado_en)
  };
}

export class ContactoService {
  async crearMensaje(
    nombre: string,
    correo: string,
    mensaje: string
  ): Promise<DbMensajeContacto> {
    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const mensajeLimpio = mensaje.trim();

    if (!nombreLimpio || nombreLimpio.length > 120) {
      throw new Error("El nombre debe tener entre 1 y 120 caracteres.");
    }
    if (!correoLimpio || correoLimpio.length < 3 || correoLimpio.length > 200 || !correoLimpio.includes("@")) {
      throw new Error("El correo ingresado no es válido.");
    }
    if (!mensajeLimpio || mensajeLimpio.length > 4000) {
      throw new Error("El mensaje debe tener entre 1 y 4000 caracteres.");
    }

    const id = randomUUID();
    const ahora = new Date();

    try {
      await ejecutarComando(
        `INSERT INTO mensajes_contacto (id, nombre, correo, mensaje, leido, creado_en)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [id, nombreLimpio, correoLimpio, mensajeLimpio, ahora]
      );
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }

    replicarEnSupabase("mensajes_contacto.crear", () =>
      supabaseAdmin.from("mensajes_contacto").upsert(
        {
          id,
          nombre: nombreLimpio,
          correo: correoLimpio,
          mensaje: mensajeLimpio,
          leido: false,
          creado_en: ahora.toISOString()
        },
        { onConflict: "id" }
      )
    );

    return {
      id,
      nombre: nombreLimpio,
      correo: correoLimpio,
      mensaje: mensajeLimpio,
      leido: false,
      creado_en: ahora.toISOString()
    };
  }

  async listarMensajes(): Promise<DbMensajeContacto[]> {
    try {
      const filas = await ejecutarConsulta<FilaMensajeContactoMysql[]>(
        `SELECT id, nombre, correo, mensaje, leido, creado_en
         FROM mensajes_contacto
         ORDER BY creado_en DESC`
      );
      return filas.map(mapearMensaje);
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }

  async marcarLeido(id: string, leido: boolean = true): Promise<DbMensajeContacto> {
    try {
      const resultado = await ejecutarComando(
        `UPDATE mensajes_contacto SET leido = ? WHERE id = ?`,
        [leido ? 1 : 0, id]
      );
      if (resultado.affectedRows === 0) {
        throw new Error("Mensaje no encontrado.");
      }

      replicarEnSupabase("mensajes_contacto.marcarLeido", () =>
        supabaseAdmin.from("mensajes_contacto").update({ leido }).eq("id", id)
      );

      const filas = await ejecutarConsulta<FilaMensajeContactoMysql[]>(
        `SELECT id, nombre, correo, mensaje, leido, creado_en
         FROM mensajes_contacto
         WHERE id = ?
         LIMIT 1`,
        [id]
      );
      const fila = filas[0];
      if (!fila) throw new Error("Mensaje no encontrado.");
      return mapearMensaje(fila);
    } catch (err) {
      if (err instanceof Error && err.message === "Mensaje no encontrado.") {
        throw err;
      }
      throw new Error(describirErrorMysql(err));
    }
  }

  async eliminarMensaje(id: string): Promise<void> {
    try {
      await ejecutarComando(`DELETE FROM mensajes_contacto WHERE id = ?`, [id]);

      replicarEnSupabase("mensajes_contacto.eliminar", () =>
        supabaseAdmin.from("mensajes_contacto").delete().eq("id", id)
      );
    } catch (err) {
      throw new Error(describirErrorMysql(err));
    }
  }
}
