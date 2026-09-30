import { Router } from "express";
import { FavoritosService } from "../services/favoritos.service.js";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";

export function crearRutasFavoritos(auth: AuthService): Router {
  const router = Router();
  const servicio = new FavoritosService();

  // Todas las rutas de favoritos requieren auth
  router.use(autenticacionRequerida(auth));

  // GET /api/favoritos (lista completa de actividades favoritas)
  router.get("/", async (req, res) => {
    try {
      const actividades = await servicio.obtenerActividadesFavoritas(req.usuarioPublico!.id);
      res.json({ actividades });
    } catch (err) {
      res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al obtener favoritos." });
    }
  });

  // GET /api/favoritos/ids (solo array de strings de IDs)
  router.get("/ids", async (req, res) => {
    try {
      const ids = await servicio.obtenerIdsFavoritos(req.usuarioPublico!.id);
      res.json({ ids });
    } catch (err) {
      res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al obtener IDs de favoritos." });
    }
  });

  // POST /api/favoritos/:actividadId (agregar a favoritos)
  router.post("/:actividadId", async (req, res) => {
    try {
      await servicio.agregarFavorito(req.usuarioPublico!.id, req.params.actividadId);
      res.status(201).json({ ok: true, mensaje: "Agregado a favoritos." });
    } catch (err) {
      res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al guardar favorito." });
    }
  });

  // DELETE /api/favoritos/:actividadId (quitar de favoritos)
  router.delete("/:actividadId", async (req, res) => {
    try {
      await servicio.eliminarFavorito(req.usuarioPublico!.id, req.params.actividadId);
      res.json({ ok: true, mensaje: "Eliminado de favoritos." });
    } catch (err) {
      res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al eliminar favorito." });
    }
  });

  return router;
}
