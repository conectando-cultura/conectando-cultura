import { Router } from "express";
import { ErrorAplicacion } from "../types.js";
import type { AuthService } from "../services/auth.service.js";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";

/**
 * Rutas HTTP del módulo de autenticación. Alta cohesión: solo traducen
 * peticiones/errores a HTTP; la lógica vive en AuthService (bajo
 * acoplamiento con el almacenamiento y la sesión).
 */
export function crearRutasAuth(auth: AuthService): Router {
  const rutas = Router();

  rutas.post("/registro", (req, res) => {
    try {
      const usuario = auth.registrar(req.body);
      res.status(201).json({ usuario });
    } catch (error) {
      manejarError(res, error);
    }
  });

  rutas.post("/login", (req, res) => {
    try {
      const resultado = auth.iniciarSesion(req.body);
      res.json(resultado);
    } catch (error) {
      manejarError(res, error);
    }
  });

  rutas.get("/me", autenticacionRequerida(auth), (req, res) => {
    res.json({ usuario: req.usuarioPublico });
  });

  rutas.post("/logout", autenticacionRequerida(auth), (req, res) => {
    auth.cerrarSesion(req.token as string);
    res.status(204).end();
  });

  return rutas;
}

function manejarError(res: import("express").Response, error: unknown): void {
  if (error instanceof ErrorAplicacion) {
    res.status(error.status).json({ mensaje: error.message });
    return;
  }
  console.error("Error no controlado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor. Intentalo nuevamente." });
}