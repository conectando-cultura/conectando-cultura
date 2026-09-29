import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../services/auth.service.js";

declare module "express-serve-static-core" {
  interface Request {
    usuarioPublico?: import("../types.js").UsuarioPublico;
    token?: string;
  }
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
 * Exige rol "admin" sobre el usuario ya autenticado.
 * Usar SIEMPRE después de autenticacionRequerida.
 */
export function adminRequerido(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const usuario = req.usuarioPublico;
  if (!usuario) {
    // Sólo posible si se encadenó mal; se responde 401 por seguridad.
    res.status(401).json({ mensaje: "Sesión no válida." });
    return;
  }

  if (usuario.rol !== "admin") {
    res.status(403).json({
      mensaje: "Acceso denegado. Necesitás permisos de administrador."
    });
    return;
  }

  next();
}
