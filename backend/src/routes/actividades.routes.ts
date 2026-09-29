import { Router } from "express";
import { ActividadesService } from "../services/actividades.service.js";
import { autenticacionRequerida, adminRequerido } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import { ErrorAplicacion } from "../types.js";

export function crearRutasActividades(auth: AuthService): Router {
  const router = Router();
  const servicio = new ActividadesService();

  // ── Público ────────────────────────────────────────────────

  // GET /api/actividades?barrioSlug=&categoriaSlug=&limite=
  // Catálogo público: sólo actividades activas.
  router.get("/", async (req, res) => {
    try {
      const { barrioSlug, categoriaSlug, limite } = req.query as Record<string, string | undefined>;

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

  // GET /api/actividades/admin/todas
  // Listado completo (incluye inactivas). Va en una ruta separada y
  // protegida: si compartiera handler con la pública, el flag `admin=true`
  // expondría las actividades dadas de baja a cualquier visitante.
  router.get(
    "/admin/todas",
    autenticacionRequerida(auth),
    adminRequerido,
    async (_req, res) => {
      try {
        const actividades = await servicio.listarTodasAdmin();
        res.json({ actividades });
      } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: "Error al obtener actividades." });
      }
    }
  );

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
      const actividad = await servicio.obtenerPorSlug(req.params.slug, req.params.barrioSlug);
      if (!actividad) {
        res.status(404).json({ mensaje: "Actividad no encontrada." });
        return;
      }
      res.json({ actividad });
    } catch {
      res.status(500).json({ mensaje: "Error al obtener actividad." });
    }
  });

  // ── Admin ─────────────────────────────────────────────────

  // POST /api/actividades (crear)
  router.post(
    "/",
    autenticacionRequerida(auth),
    adminRequerido,
    async (req, res) => {
      try {
        const datos = req.body;
        if (!datos.nombre || !datos.descripcion || !datos.direccion) {
          throw new ErrorAplicacion("Faltan campos obligatorios: nombre, descripcion, direccion.");
        }
        const actividad = await servicio.crear(datos, req.usuarioPublico!.id);
        res.status(201).json({ actividad });
      } catch (err) {
        const status = err instanceof ErrorAplicacion ? err.status : 500;
        res.status(status).json({ mensaje: err instanceof Error ? err.message : "Error al crear actividad." });
      }
    }
  );

  // PATCH /api/actividades/:id (editar)
  router.patch(
    "/:id",
    autenticacionRequerida(auth),
    adminRequerido,
    async (req, res) => {
      try {
        const actividad = await servicio.actualizar(req.params.id, req.body, req.usuarioPublico!.id);
        res.json({ actividad });
      } catch (err) {
        const status = err instanceof ErrorAplicacion ? err.status : 500;
        res.status(status).json({ mensaje: err instanceof Error ? err.message : "Error al actualizar actividad." });
      }
    }
  );

  // DELETE /api/actividades/:id (eliminar lógico)
  router.delete(
    "/:id",
    autenticacionRequerida(auth),
    adminRequerido,
    async (req, res) => {
      try {
        await servicio.eliminar(req.params.id);
        res.status(204).send();
      } catch (err) {
        res.status(500).json({ mensaje: err instanceof Error ? err.message : "Error al eliminar actividad." });
      }
    }
  );

  return router;
}
