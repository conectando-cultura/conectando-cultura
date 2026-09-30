import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import { ActividadesService } from "./actividades.service.js";
import type { ActividadPublica } from "../types-db.js";

export class FavoritosService {
  private actividadesService = new ActividadesService();

  async obtenerIdsFavoritos(usuarioId: string): Promise<string[]> {
    exigirSupabase();

    const { data, error } = await supabaseAdmin
      .from("favoritos_usuario")
      .select("actividad_id")
      .eq("usuario_id", usuarioId);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.actividad_id);
  }

  async obtenerActividadesFavoritas(usuarioId: string): Promise<ActividadPublica[]> {
    exigirSupabase();

    const ids = await this.obtenerIdsFavoritos(usuarioId);
    if (ids.length === 0) return [];

    const todas = await this.actividadesService.listar();
    return todas.filter((a) => ids.includes(a.id));
  }

  async agregarFavorito(usuarioId: string, actividadId: string): Promise<void> {
    exigirSupabase();

    const { error } = await supabaseAdmin
      .from("favoritos_usuario")
      .upsert(
        { usuario_id: usuarioId, actividad_id: actividadId },
        { onConflict: "usuario_id,actividad_id" }
      );

    if (error) throw new Error(error.message);
  }

  async eliminarFavorito(usuarioId: string, actividadId: string): Promise<void> {
    exigirSupabase();

    const { error } = await supabaseAdmin
      .from("favoritos_usuario")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("actividad_id", actividadId);

    if (error) throw new Error(error.message);
  }
}
