import { Router } from "express";
import { ActividadesService } from "../services/actividades.service.js";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";

export function crearRutasActividades(auth: AuthService): Router {
  const router = Router();
  const servicio = new ActividadesService();

  // GET /api/actividades?barrioSlug=&categoriaSlug=&limite=
  router.get("/", async (req, res) => {
    try {
      const { barrioSlug, categoriaSlug, limite } = req.query as Record<
        string,
        string | undefined
      >;
      const actividades = await servicio.listar({
        barrioSlug,
        categoriaSlug,
        limite: limite ? Number(limite) : undefined
      });
      res.json({ actividades });
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: "Error al obtener actividades." });
    }
  });

  // GET /api/actividades/barrios
  router.get("/barrios", async (_req, res) => {
    try {
      const barrios = await servicio.listarBarrios();
      res.json({ barrios });
    } catch {
      res.status(500).json({ mensaje: "Error al obtener barrios." });
    }
  });

  // GET /api/actividades/categorias
  router.get("/categorias", async (_req, res) => {
    try {
      const categorias = await servicio.listarCategorias();
      res.json({ categorias });
    } catch {
      res.status(500).json({ mensaje: "Error al obtener categorías." });
    }
  });

  // GET /api/actividades/:slug/:barrioSlug
  router.get("/:slug/:barrioSlug", async (req, res) => {
    try {
      const actividad = await servicio.obtenerPorSlug(
        req.params.slug,
        req.params.barrioSlug
      );
      if (!actividad) {
        res.status(404).json({ mensaje: "Actividad no encontrada." });
        return;
      }
      res.json({ actividad });
    } catch {
      res.status(500).json({ mensaje: "Error al obtener actividad." });
    }
  });

  // GET /api/actividades/favoritas (requiere auth)
  router.get(
    "/favoritas",
    autenticacionRequerida(auth),
    async (req, res) => {
      // TODO: implementar favoritos en Sprint 5+
      res.status(501).json({
        mensaje: "Favoritas se implementa en Sprint 5."
      });
    }
  );

  return router;
}
