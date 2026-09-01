import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { api } from "../api/client";
import type { DatosRegistro, UsuarioPublico } from "../tipos";

const CLAVE_TOKEN = "cc_token";

interface AuthContexto {
  usuario: UsuarioPublico | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<string | null>;
  registrar: (datos: DatosRegistro) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | null>(null);

/**
 * Contexto de autenticación: única fuente de la sesión en el frontend
 * (alta cohesión). Las páginas no tocan localStorage ni la API de sesión
 * directamente (bajo acoplamiento).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN);

    if (!token) {
      setCargando(false);
      return;
    }

    api<{ usuario: UsuarioPublico }>("/auth/me", {}, token)
      .then((datos) => setUsuario(datos.usuario))
      .catch(() => {
        localStorage.removeItem(CLAVE_TOKEN);
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    try {
      const datos = await api<{ token: string; usuario: UsuarioPublico }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena })
      });
      localStorage.setItem(CLAVE_TOKEN, datos.token);
      setUsuario(datos.usuario);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Ocurrió un error. Intentalo nuevamente.";
    }
  }, []);

  const registrar = useCallback(async (datos: DatosRegistro) => {
    try {
      await api<{ usuario: UsuarioPublico }>("/auth/registro", {
        method: "POST",
        body: JSON.stringify(datos)
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Ocurrió un error. Intentalo nuevamente.";
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token) {
      try {
        await api<void>("/auth/logout", { method: "POST" }, token);
      } catch {
        // El cierre local no debe fallar por un problema de red.
      }
    }
    localStorage.removeItem(CLAVE_TOKEN);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, registrar, cerrarSesion }),
    [usuario, cargando, iniciarSesion, registrar, cerrarSesion]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): AuthContexto {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider.");
  }
  return contexto;
}