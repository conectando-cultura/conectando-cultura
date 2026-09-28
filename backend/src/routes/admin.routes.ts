import { Router } from "express";
import { autenticacionRequerida, adminRequerido } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import { supabaseAdmin, esSupabaseConfigurado } from "../lib/supabase.js";
import { localDataRepo } from "../repositories/local-data.repository.js";

export function crearRutasAdmin(auth: AuthService): Router {
  const router = Router();

  // Todas las rutas admin requieren auth + rol admin
  router.use(autenticacionRequerida(auth), adminRequerido);

  // GET /api/admin/estadisticas
  router.get("/estadisticas", async (_req, res) => {
    try {
      if (esSupabaseConfigurado()) {
        try {
          const [actividades, usuarios, prefs] = await Promise.all([
            supabaseAdmin.from("actividades").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("usuarios").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("preferencias_usuario").select("id", { count: "exact", head: true })
          ]);

          res.json({
            totalActividades: actividades.count ?? 0,
            totalUsuarios: usuarios.count ?? 0,
            totalPreferencias: prefs.count ?? 0,
            fecha: new Date().toISOString()
          });
          return;
        } catch {
          // Fallback a repositorio local
        }
      }

      res.json(localDataRepo.obtenerEstadisticas());
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: "Error al obtener estadísticas." });
    }
  });

  // GET /api/admin/usuarios
  router.get("/usuarios", async (_req, res) => {
    try {
      if (esSupabaseConfigurado()) {
        try {
          const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, nombre, apellido, correo, rol, creado_en")
            .order("creado_en", { ascending: false })
            .limit(100);

          if (!error && data) {
            res.json({ usuarios: data });
            return;
          }
        } catch {
          // Fallback
        }
      }

      res.json({ usuarios: auth.listarUsuarios() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: "Error al obtener usuarios." });
    }
  });

  // PATCH /api/admin/usuarios/:id/rol
  router.patch("/usuarios/:id/rol", async (req, res) => {
    try {
      const { rol } = req.body;
      if (rol !== "usuario" && rol !== "admin") {
        res.status(400).json({ mensaje: "Rol inválido. Debe ser 'usuario' o 'admin'." });
        return;
      }

      if (esSupabaseConfigurado()) {
        try {
          const { data, error } = await supabaseAdmin
            .from("usuarios")
            .update({ rol })
            .eq("id", req.params.id)
            .select()
            .single();

          if (!error && data) {
            res.json({ usuario: data });
            return;
          }
        } catch {
          // Fallback
        }
      }

      const usuario = auth.actualizarRol(req.params.id, rol);
      res.json({ usuario });
    } catch (err: any) {
      console.error(err);
      res.status(err.status ?? 500).json({ mensaje: err.message ?? "Error al actualizar rol." });
    }
  });

  return router;
}
