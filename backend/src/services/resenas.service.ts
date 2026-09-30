import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import type { DbResenaPublica } from "../types-db.js";

export class ResenasService {
  async obtenerResenas(actividadId: string): Promise<{
    resenas: DbResenaPublica[];
    promedio: number;
    total: number;
  }> {
    exigirSupabase();

    const { data: resenasDb, error } = await supabaseAdmin
      .from("resenas")
      .select("id, usuario_id, calificacion, comentario, creado_en")
      .eq("actividad_id", actividadId)
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    if (!resenasDb || resenasDb.length === 0) {
      return { resenas: [], promedio: 0, total: 0 };
    }

    // Obtener nombres de autores
    const userIds = Array.from(new Set(resenasDb.map((r) => r.usuario_id)));
    const { data: usuarios } = await supabaseAdmin
      .from("usuarios")
      .select("id, nombre, apellido")
      .in("id", userIds);

    const nombresMap = new Map<string, string>();
    (usuarios ?? []).forEach((u) => {
      nombresMap.set(u.id, `${u.nombre} ${u.apellido?.charAt(0) ?? ""}.`.trim());
    });

    const resenas: DbResenaPublica[] = resenasDb.map((r) => ({
      id: r.id,
      usuarioId: r.usuario_id,
      usuarioNombre: nombresMap.get(r.usuario_id) || "Vecino de Mataderos",
      calificacion: Number(r.calificacion),
      comentario: r.comentario,
      creadoEn: r.creado_en
    }));

    const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
    const promedio = Number((suma / resenas.length).toFixed(1));

    return { resenas, promedio, total: resenas.length };
  }

  async crearResena(
    usuarioId: string,
    actividadId: string,
    calificacion: number,
    comentario: string
  ): Promise<DbResenaPublica> {
    exigirSupabase();

    const calif = Math.round(Number(calificacion));
    if (calif < 1 || calif > 5) {
      throw new Error("La calificación debe ser un puntaje del 1 al 5.");
    }

    const comentarioLimpio = String(comentario ?? "").trim();
    if (comentarioLimpio.length < 3 || comentarioLimpio.length > 1000) {
      throw new Error("El comentario debe tener entre 3 y 1000 caracteres.");
    }

    const { data, error } = await supabaseAdmin
      .from("resenas")
      .insert({
        usuario_id: usuarioId,
        actividad_id: actividadId,
        calificacion: calif,
        comentario: comentarioLimpio
      })
      .select("id, usuario_id, calificacion, comentario, creado_en")
      .single();

    if (error) throw new Error(error.message);

    // Obtener nombre del usuario
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("nombre, apellido")
      .eq("id", usuarioId)
      .maybeSingle();

    const usuarioNombre = usuario
      ? `${usuario.nombre} ${usuario.apellido?.charAt(0) ?? ""}.`.trim()
      : "Vecino de Mataderos";

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      usuarioNombre,
      calificacion: data.calificacion,
      comentario: data.comentario,
      creadoEn: data.creado_en
    };
  }
}
