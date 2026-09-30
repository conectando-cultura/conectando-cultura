import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import type { DbMensajeContacto } from "../types-db.js";

function describirError(error: { code?: string; message?: string } | null): string {
  if (!error) return "Error desconocido de Supabase.";
  if (error.code === "23514") return "Los datos del formulario de contacto no cumplen los límites requeridos.";
  return error.message || "Error al procesar el mensaje de contacto.";
}

export class ContactoService {
  async crearMensaje(
    nombre: string,
    correo: string,
    mensaje: string
  ): Promise<DbMensajeContacto> {
    exigirSupabase();

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

    const { data, error } = await supabaseAdmin
      .from("mensajes_contacto")
      .insert({
        nombre: nombreLimpio,
        correo: correoLimpio,
        mensaje: mensajeLimpio,
        leido: false
      })
      .select("id, nombre, correo, mensaje, leido, creado_en")
      .single();

    if (error) throw new Error(describirError(error));
    return data as DbMensajeContacto;
  }

  async listarMensajes(): Promise<DbMensajeContacto[]> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("mensajes_contacto")
      .select("id, nombre, correo, mensaje, leido, creado_en")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(describirError(error));
    return (data as DbMensajeContacto[]) ?? [];
  }

  async marcarLeido(id: string, leido: boolean = true): Promise<DbMensajeContacto> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("mensajes_contacto")
      .update({ leido })
      .eq("id", id)
      .select("id, nombre, correo, mensaje, leido, creado_en")
      .maybeSingle();

    if (error) throw new Error(describirError(error));
    if (!data) throw new Error("Mensaje no encontrado.");
    return data as DbMensajeContacto;
  }

  async eliminarMensaje(id: string): Promise<void> {
    exigirSupabase();

    const { error } = await supabaseAdmin
      .from("mensajes_contacto")
      .delete()
      .eq("id", id);

    if (error) throw new Error(describirError(error));
  }
}
