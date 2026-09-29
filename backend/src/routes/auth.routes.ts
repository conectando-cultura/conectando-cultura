import { Router, type Response } from "express";
import { ErrorAplicacion } from "../types.js";
import type { AuthService } from "../services/auth.service.js";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";

/**
 * Rutas HTTP de autenticación. Traducen peticiones/errores a HTTP;
 * la lógica vive en AuthService.
 */
export function crearRutasAuth(auth: AuthService): Router {
  const rutas = Router();

  rutas.post("/registro", async (req, res) => {
    try {
      const usuario = await auth.registrar(req.body);
      res.status(201).json({ usuario });
    } catch (error) {
      manejarError(res, error);
    }
  });

  rutas.post("/login", async (req, res) => {
    try {
      const resultado = await auth.iniciarSesion(req.body);
      res.json(resultado);
    } catch (error) {
      manejarError(res, error);
    }
  });

  rutas.get("/me", autenticacionRequerida(auth), (req, res) => {
    res.json({ usuario: req.usuarioPublico });
  });

  rutas.post("/logout", autenticacionRequerida(auth), async (req, res) => {
    try {
      await auth.cerrarSesion(req.token as string);
      res.status(204).end();
    } catch (error) {
      manejarError(res, error);
    }
  });

  return rutas;
}

/**
 * Los errores de negocio (ErrorAplicacion) conservan su status.
 * El resto se registra y se devuelve 500 sin filtrar detalles internos.
 */
function manejarError(res: Response, error: unknown): void {
  if (error instanceof ErrorAplicacion) {
    res.status(error.status).json({ mensaje: error.message });
    return;
  }

  console.error("Error no controlado:", error);
  res.status(500).json({
    mensaje: "Error interno del servidor. Intentá nuevamente."
  });
}
