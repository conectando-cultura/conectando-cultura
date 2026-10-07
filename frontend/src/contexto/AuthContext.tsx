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

interface ResultadoAuth {
  usuario: UsuarioPublico;
  token: string;
}

interface AuthContexto {
  usuario: UsuarioPublico | null;
  token: string | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<ResultadoAuth>;
  registrar: (datos: DatosRegistro) => Promise<ResultadoAuth>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(CLAVE_TOKEN));
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem(CLAVE_TOKEN);

    if (!tokenGuardado) {
      setCargando(false);
      return;
    }

    api<{ usuario: UsuarioPublico }>("/auth/me", {}, tokenGuardado)
      .then((datos) => {
        setUsuario(datos.usuario);
        setToken(tokenGuardado);
      })
      .catch(() => {
        localStorage.removeItem(CLAVE_TOKEN);
        setUsuario(null);
        setToken(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string): Promise<ResultadoAuth> => {
    const datos = await api<{ token: string; usuario: UsuarioPublico }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, contrasena })
    });
    localStorage.setItem(CLAVE_TOKEN, datos.token);
    setToken(datos.token);
    setUsuario(datos.usuario);
    return datos;
  }, []);

  const registrar = useCallback(async (datos: DatosRegistro): Promise<ResultadoAuth> => {
    await api<{ usuario: UsuarioPublico }>("/auth/registro", {
      method: "POST",
      body: JSON.stringify(datos)
    });
    // Inicia sesión automáticamente tras el registro exitoso
    return iniciarSesion(datos.correo, datos.contrasena);
  }, [iniciarSesion]);

  const cerrarSesion = useCallback(async () => {
    const tokenActual = localStorage.getItem(CLAVE_TOKEN);
    if (tokenActual) {
      try {
        await api<void>("/auth/logout", { method: "POST" }, tokenActual);
      } catch {
        // Cierre local no afectado
      }
    }
    localStorage.removeItem(CLAVE_TOKEN);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, token, cargando, iniciarSesion, registrar, cerrarSesion }),
    [usuario, token, cargando, iniciarSesion, registrar, cerrarSesion]
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