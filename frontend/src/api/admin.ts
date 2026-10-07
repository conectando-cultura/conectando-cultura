import { api, type ErrorApi } from "./client";
import type { Actividad, UsuarioPublico, Rol } from "../tipos";

export interface EstadisticasAdmin {
  totalActividades: number;
  actividadesActivas: number;
  totalUsuarios: number;
  totalPreferencias: number;
  fecha: string;
}

export interface RespuestaActividadesAdmin {
  actividades: (Actividad & { activo: boolean })[];
  total: number;
  pagina: number;
  limite: number;
}

export async function obtenerEstadisticasAdmin(token: string): Promise<EstadisticasAdmin> {
  return await api<EstadisticasAdmin>("/admin/estadisticas", {}, token);
}

export async function obtenerActividadesAdmin(
  token: string,
  params?: {
    pagina?: number;
    limite?: number;
    orden?: "recientes" | "antiguas" | "nombre_asc" | "nombre_desc";
    activo?: boolean;
    q?: string;
  }
): Promise<RespuestaActividadesAdmin> {
  const sp = new URLSearchParams();
  if (params?.pagina) sp.set("pagina", String(params.pagina));
  if (params?.limite) sp.set("limite", String(params.limite));
  if (params?.orden) sp.set("orden", params.orden);
  if (params?.activo !== undefined) sp.set("activo", String(params.activo));
  if (params?.q) sp.set("q", params.q);

  const qs = sp.toString();
  return await api<RespuestaActividadesAdmin>(
    `/actividades/admin/todas${qs ? `?${qs}` : ""}`,
    {},
    token
  );
}

export async function desactivarActividad(id: string, token: string): Promise<void> {
  await api(`/actividades/${id}`, { method: "DELETE" }, token);
}

export async function reactivarActividad(id: string, token: string): Promise<void> {
  await api(`/actividades/${id}/reactivar`, { method: "PATCH" }, token);
}

export async function crearActividad(
  datos: Partial<Actividad> & { categoriaId: string; barrioId: string },
  token: string
): Promise<{ actividad: Actividad }> {
  return await api<{ actividad: Actividad }>("/actividades", {
    method: "POST",
    body: JSON.stringify(datos)
  }, token);
}

export async function actualizarActividad(
  id: string,
  datos: Partial<Actividad> & { categoriaId?: string; barrioId?: string },
  token: string
): Promise<{ actividad: Actividad }> {
  return await api<{ actividad: Actividad }>(`/actividades/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos)
  }, token);
}

export async function obtenerUsuariosAdmin(token: string): Promise<UsuarioPublico[]> {
  const res = await api<{ usuarios: UsuarioPublico[] }>("/admin/usuarios", {}, token);
  return res.usuarios;
}

export async function actualizarRolUsuario(
  id: string,
  rol: Rol,
  token: string
): Promise<{ usuario: UsuarioPublico }> {
  return await api<{ usuario: UsuarioPublico }>(`/admin/usuarios/${id}/rol`, {
    method: "PATCH",
    body: JSON.stringify({ rol })
  }, token);
}

export async function cerrarSesionesUsuario(id: string, token: string): Promise<void> {
  await api(`/admin/usuarios/${id}/sesiones`, { method: "DELETE" }, token);
}

export { type ErrorApi };
