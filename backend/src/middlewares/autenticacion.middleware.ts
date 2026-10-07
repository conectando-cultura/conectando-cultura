import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { Permiso, Rol } from "../types.js";

declare module "express-serve-static-core" {
  interface Request {
    usuarioPublico?: import("../types.js").UsuarioPublico;
    token?: string;
  }
}

/**
 * Tabla de permisos única para el backend, alineada con codigo-de-referencia/permisos.js.
 */
export const PERMISOS: Record<Permiso, readonly Rol[]> = {
  "panel:acceder": ["gestor", "admin"],
  "actividades:escribir": ["gestor", "admin"],
  "usuarios:gestionar": ["admin"]
};

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return (PERMISOS[permiso] ?? []).includes(rol);
}

/**
 * Exige un token Bearer válido y adjunta el usuario a la petición.
 * El servicio es asíncrono (Supabase), así que el middleware también.
 */
export function autenticacionRequerida(auth: AuthService) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const cabecera = req.headers.authorization ?? "";
      const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : null;

      if (!token) {
        res.status(401).json({ mensaje: "Sesión no válida. Iniciá sesión nuevamente." });
        return;
      }

      const usuario = await auth.obtenerUsuarioPorToken(token);
      if (!usuario) {
        res.status(401).json({ mensaje: "Sesión expirada o no válida. Iniciá sesión nuevamente." });
        return;
      }

      req.usuarioPublico = usuario;
      req.token = token;
      next();
    } catch (error) {
      // Un fallo de base de datos no es "no autenticado": es un 500.
      console.error(error);
      res.status(500).json({ mensaje: "No se pudo verificar la sesión. Intentá nuevamente." });
    }
  };
}

/**
 * Exige un permiso específico sobre el usuario ya autenticado.
 * Usar SIEMPRE después de autenticacionRequerida.
 */
export function permisoRequerido(permiso: Permiso) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = req.usuarioPublico;
    if (!usuario) {
      res.status(401).json({ mensaje: "Sesión no válida." });
      return;
    }

    if (!tienePermiso(usuario.rol, permiso)) {
      res.status(403).json({
        mensaje: "Acceso denegado. No tenés permisos suficientes para realizar esta acción."
      });
      return;
    }

    next();
  };
}

/**
 * Exige rol "admin" (permiso "usuarios:gestionar").
 * Mantenido por retrocompatibilidad con las rutas existentes.
 */
export const adminRequerido = permisoRequerido("usuarios:gestionar");
