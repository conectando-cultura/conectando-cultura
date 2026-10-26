import { esSupabaseConfigurado } from "./supabase.js";

/**
 * Espejo asincrónico de respaldo (Write-Behind Backup Mirror) hacia Supabase.
 *
 * Todas las escrituras principales ocurren en MySQL local. Si Supabase está
 * configurado en `.env`, las mutaciones se replican en segundo plano sin
 * bloquear ni hacer fallar la respuesta principal de la API.
 */

export interface EstadoReplicacionSupabase {
  ultimaOperacion: string | null;
  ultimaReplicacionEn: string | null;
  ultimoError: string | null;
  totalExitosas: number;
  totalFallidas: number;
}

const estadoReplicacion: EstadoReplicacionSupabase = {
  ultimaOperacion: null,
  ultimaReplicacionEn: null,
  ultimoError: null,
  totalExitosas: 0,
  totalFallidas: 0
};

export function obtenerEstadoReplicacionSupabase(): EstadoReplicacionSupabase {
  return { ...estadoReplicacion };
}

export function replicarEnSupabase(
  operacion: string,
  fn: () => PromiseLike<{ error: { message?: string } | null }>
): void {
  if (!esSupabaseConfigurado()) return;

  void Promise.resolve()
    .then(() => fn())
    .then((resultado) => {
      estadoReplicacion.ultimaOperacion = operacion;
      if (resultado?.error) {
        estadoReplicacion.totalFallidas += 1;
        estadoReplicacion.ultimoError =
          resultado.error.message ?? `Error al replicar ${operacion} en Supabase.`;
        console.warn(`[Supabase Backup] Falló replicación (${operacion}):`, estadoReplicacion.ultimoError);
      } else {
        estadoReplicacion.totalExitosas += 1;
        estadoReplicacion.ultimaReplicacionEn = new Date().toISOString();
        estadoReplicacion.ultimoError = null;
      }
    })
    .catch((err: unknown) => {
      estadoReplicacion.ultimaOperacion = operacion;
      estadoReplicacion.totalFallidas += 1;
      estadoReplicacion.ultimoError =
        err instanceof Error ? err.message : `Excepción al replicar ${operacion} en Supabase.`;
      console.warn(`[Supabase Backup] Excepción en replicación (${operacion}):`, estadoReplicacion.ultimoError);
    });
}
