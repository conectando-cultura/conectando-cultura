import type { Sesion } from "../types.js";

const DIAS_DE_VIGENCIA = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Repositorio de sesiones (en memoria).
 *
 * Módulo de alcance reducido: el sprint requiere sesiones funcionales y
 * simples, sin la complejidad de un store persistente. Al migrar a
 * Supabase/servicio de auth real (tarea 2.2 del Product Backlog), esta
 * capa se reemplaza sin tocar el resto.
 */
export class SesionRepository {
  private sesiones = new Map<string, Sesion>();

  crear(usuarioId: string): Sesion {
    const sesion: Sesion = {
      token: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""),
      usuarioId,
      expiraEn: Date.now() + DIAS_DE_VIGENCIA * MS_POR_DIA
    };
    this.sesiones.set(sesion.token, sesion);
    return sesion;
  }

  buscarActiva(token: string): Sesion | null {
    const sesion = this.sesiones.get(token);
    if (!sesion) {
      return null;
    }
    if (sesion.expiraEn < Date.now()) {
      this.sesiones.delete(token);
      return null;
    }
    return sesion;
  }

  eliminar(token: string): void {
    this.sesiones.delete(token);
  }
}