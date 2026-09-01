/**
 * Cliente HTTP de la API (bajo acoplamiento): las páginas solo llaman a
 * estas funciones y nunca construyen peticiones ni conocen la URL base.
 */
const BASE = "/api";

interface RespuestaError {
  mensaje?: string;
}

export class ErrorApi extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export async function api<T>(
  ruta: string,
  opciones: RequestInit = {},
  token?: string
): Promise<T> {
  const cabeceras: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { ...cabeceras, ...(opciones.headers ?? {}) }
  });

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as RespuestaError | T | null;

  if (!respuesta.ok) {
    const mensaje =
      cuerpo && typeof cuerpo === "object" && "mensaje" in cuerpo && cuerpo.mensaje
        ? cuerpo.mensaje
        : "Ocurrió un error. Intentalo nuevamente.";
    throw new ErrorApi(mensaje);
  }

  return cuerpo as T;
}