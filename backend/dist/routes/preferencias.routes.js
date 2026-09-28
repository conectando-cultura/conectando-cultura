import { Router } from "express";
import { autenticacionRequerida } from "../middlewares/autenticacion.middleware.js";
import { PreferenciasService } from "../services/preferencias.service.js";
export function crearRutasPreferencias(auth) {
    const router = Router();
    const servicio = new PreferenciasService();
    // GET /api/preferencias
    router.get("/", autenticacionRequerida(auth), async (req, res) => {
        try {
            const usuario = req.usuarioPublico;
            const prefs = (await servicio.obtener(usuario.id)) ?? {
                barrioId: null,
                barrio: null,
                categorias: []
            };
            res.json({ preferencias: prefs });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ mensaje: "Error al obtener preferencias." });
        }
    });
    // PUT /api/preferencias
    router.put("/", autenticacionRequerida(auth), async (req, res) => {
        try {
            const usuario = req.usuarioPublico;
            const { barrioId, categoriaIds } = req.body;
            if (barrioId !== null && barrioId !== undefined && typeof barrioId !== "string") {
                res.status(400).json({ mensaje: "barrioId debe ser un string o null." });
                return;
            }
            if (categoriaIds !== undefined &&
                (!Array.isArray(categoriaIds) ||
                    !categoriaIds.every((c) => typeof c === "string"))) {
                res.status(400).json({ mensaje: "categoriaIds debe ser un array de strings." });
                return;
            }
            const prefs = await servicio.actualizar(usuario.id, barrioId ?? null, categoriaIds ?? []);
            res.json({ preferencias: prefs });
        }
        catch (err) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar preferencias.";
            res.status(400).json({ mensaje });
        }
    });
    return router;
}
