import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../services/auth.service.js";

declare module "express-serve-static-core" {
  interface Request {
    usuarioPublico?: import("../types.js").UsuarioPublico;
    token?: string;
  }
}

/**
 * Middleware de protección de rutas ("Protección de Rutas" del backlog,
 * versión para usuarios): exige un token válido y adjunta el usuario
 * autenticado a la petición.
 */
export function autenticacionRequerida(auth: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const cabecera = req.headers.authorization ?? "";
    const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : null;

    if (!token) {
      res.status(401).json({ mensaje: "Sesión no válida. Iniciá sesión nuevamente." });
      return;
    }

    const usuario = auth.obtenerUsuarioPorToken(token);
    if (!usuario) {
      res.status(401).json({ mensaje: "Sesión expirada o no válida. Iniciá sesión nuevamente." });
      return;
    }

    req.usuarioPublico = usuario;
    req.token = token;
    next();
  };
}