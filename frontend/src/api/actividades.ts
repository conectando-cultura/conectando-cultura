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

export { type ErrorApi };
