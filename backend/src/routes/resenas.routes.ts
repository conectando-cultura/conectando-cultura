import { Router } from "express";
import { ResenasService } from "../services/resenas.service.js";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";

export function crearRutasResenas(auth: AuthService): Router {
  const router = Router();
  const servicio = new ResenasService();

  // GET /api/resenas/:actividadId (público)
  router.get("/:actividadId", async (req, res) => {
    try {
      const resultado = await servicio.obtenerResenas(req.params.actividadId);
      res.json(resultado);
    } catch (err) {
      res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al obtener reseñas." });
    }
  });

  // POST /api/resenas/:actividadId (requiere auth)
  router.post("/:actividadId", autenticacionRequerida(auth), async (req, res) => {
    try {
      const { calificacion, comentario } = req.body as {
        calificacion?: number;
        comentario?: string;
      };

      if (!calificacion || !comentario) {
        res.status(400).json({ mensaje: "Calificación y comentario son obligatorios." });
        return;
      }

      const resena = await servicio.crearResena(
        req.usuarioPublico!.id,
        req.params.actividadId,
        Number(calificacion),
        comentario
      );

      res.status(201).json({ resena, mensaje: "¡Gracias por tu reseña comunitaria!" });
    } catch (err) {
      res.status(400).json({ mensaje: err instanceof Error ? err.message : "Error al publicar reseña." });
    }
  });

  return router;
}
