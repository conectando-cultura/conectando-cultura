import type { Actividad, Barrio, Categoria, Preferencias } from "../tipos";
import { api, type ErrorApi } from "./client";

export interface PreferenciasApi {
  barrioId: string | null;
  categoriaIds: string[];
}

export async function obtenerActividades(params?: {
  barrioSlug?: string;
  categoriaSlug?: string;
  limite?: number;
}): Promise<Actividad[]> {
  const sp = new URLSearchParams();
  if (params?.barrioSlug) sp.set("barrioSlug", params.barrioSlug);
  if (params?.categoriaSlug) sp.set("categoriaSlug", params.categoriaSlug);
  if (params?.limite) sp.set("limite", String(params.limite));
  const qs = sp.toString();

  const datos = await api<{ actividades: Actividad[] }>(
    `/actividades${qs ? `?${qs}` : ""}`
  );
  return datos.actividades;
}

export async function obtenerBarrios(): Promise<Barrio[]> {
  const datos = await api<{ barrios: Barrio[] }>("/actividades/barrios");
  return datos.barrios;
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const datos = await api<{ categorias: Categoria[] }>(
    "/actividades/categorias"
  );
  return datos.categorias;
}

export async function obtenerActividad(
  slug: string,
  barrioSlug: string
): Promise<Actividad> {
  const datos = await api<{ actividad: Actividad }>(
    `/actividades/${slug}/${barrioSlug}`
  );
  return datos.actividad;
}

export async function obtenerActividadPorId(id: string): Promise<Actividad> {
  const datos = await api<{ actividad: Actividad }>(`/actividades/${id}`);
  return datos.actividad;
}

export async function enviarMensajeContacto(datos: {
  nombre: string;
  correo: string;
  mensaje: string;
}): Promise<{ ok: boolean; mensaje: string }> {
  return api<{ ok: boolean; mensaje: string }>("/contacto", {
    method: "POST",
    body: JSON.stringify(datos)
  });
}

export async function obtenerPreferencias(token: string): Promise<Preferencias> {
  const datos = await api<{ preferencias: Preferencias }>(
    "/preferencias",
    {},
    token
  );
  return datos.preferencias;
}

export async function guardarPreferencias(
  token: string,
  prefs: PreferenciasApi
): Promise<Preferencias> {
  const datos = await api<{ preferencias: Preferencias }>("/preferencias", {
    method: "PUT",
    body: JSON.stringify(prefs)
  }, token);
  return datos.preferencias;
}

// ── Favoritos ──────────────────────────────────────────────────
export async function obtenerFavoritos(token: string): Promise<Actividad[]> {
  const datos = await api<{ actividades: Actividad[] }>("/favoritos", {}, token);
  return datos.actividades;
}

export async function obtenerIdsFavoritos(token: string): Promise<string[]> {
  const datos = await api<{ ids: string[] }>("/favoritos/ids", {}, token);
  return datos.ids;
}

export async function agregarFavorito(token: string, actividadId: string): Promise<void> {
  await api(`/favoritos/${actividadId}`, { method: "POST" }, token);
}

export async function eliminarFavorito(token: string, actividadId: string): Promise<void> {
  await api(`/favoritos/${actividadId}`, { method: "DELETE" }, token);
}

// ── Reseñas ───────────────────────────────────────────────────
export async function obtenerResenasActividad(actividadId: string): Promise<{
  resenas: import("../tipos").Resena[];
  promedio: number;
  total: number;
}> {
  return api<{
    resenas: import("../tipos").Resena[];
    promedio: number;
    total: number;
  }>(`/resenas/${actividadId}`);
}

export async function publicarResena(
  token: string,
  actividadId: string,
  calificacion: number,
  comentario: string
): Promise<{ resena: import("../tipos").Resena; mensaje: string }> {
  return api<{ resena: import("../tipos").Resena; mensaje: string }>(
    `/resenas/${actividadId}`,
    {
      method: "POST",
      body: JSON.stringify({ calificacion, comentario })
    },
    token
  );
}

export { type ErrorApi };


