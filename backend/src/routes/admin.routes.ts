import { Router } from "express";
import { autenticacionRequerida, adminRequerido } from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import { ContactoService } from "../services/contacto.service.js";
import { ErrorAplicacion } from "../types.js";

interface ErrorPostgrest {
  code?: string;
  message?: string;
}

function describirError(error: ErrorPostgrest | null): string {
  if (!error) return "Error desconocido de Supabase.";
  if (error.code === "PGRST116") return "Usuario no encontrado.";
  if (error.code === "23505") return "Ese correo ya está registrado.";
  return error.message || "Error de base de datos.";
}

export function crearRutasAdmin(auth: AuthService): Router {
  const router = Router();
  const servicioContacto = new ContactoService();

  // Todo /api/admin exige sesión + rol admin
  router.use(autenticacionRequerida(auth), adminRequerido);

  // GET /api/admin/estadisticas
  router.get("/estadisticas", async (_req, res) => {
    try {
      exigirSupabase();

      const [totalAct, activas, usuarios, preferencias] = await Promise.all([
        supabaseAdmin.from("actividades").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("actividades").select("id", { count: "exact", head: true }).eq("activo", true),
        supabaseAdmin.from("usuarios").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("preferencias_usuario").select("usuario_id", { count: "exact", head: true })
      ]);

      const error = totalAct.error ?? activas.error ?? usuarios.error ?? preferencias.error;
      if (error) throw new Error(describirError(error));

      res.json({
        totalActividades: totalAct.count ?? 0,
        actividadesActivas: activas.count ?? 0,
        totalUsuarios: usuarios.count ?? 0,
        totalPreferencias: preferencias.count ?? 0,
        fecha: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al obtener estadísticas."
      });
    }
  });

  // GET /api/admin/usuarios
  router.get("/usuarios", async (_req, res) => {
    try {
      exigirSupabase();

      const { data, error } = await supabaseAdmin
        .from("usuarios")
        // nunca seleccionar contrasena_hash
        .select("id, nombre, apellido, correo, rol, creado_en")
        .order("creado_en", { ascending: false })
        .limit(100);

      if (error) throw new Error(describirError(error));
      res.json({ usuarios: data ?? [] });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al obtener usuarios."
      });
    }
  });

  // PATCH /api/admin/usuarios/:id/rol
  router.patch("/usuarios/:id/rol", async (req, res) => {
    try {
      const { rol } = req.body as { rol?: unknown };
      if (rol !== "usuario" && rol !== "admin") {
        res.status(400).json({ mensaje: "Rol inválido. Debe ser 'usuario' o 'admin'." });
        return;
      }

      exigirSupabase();

      const { data, error } = await supabaseAdmin
        .from("usuarios")
        .update({ rol })
        .eq("id", req.params.id)
        .select("id, nombre, apellido, correo, rol, creado_en")
        .maybeSingle();

      if (error) throw new Error(describirError(error));
      if (!data) {
        res.status(404).json({ mensaje: "Usuario no encontrado." });
        return;
      }

      res.json({ usuario: data });
    } catch (err) {
      console.error(err);
      const status = err instanceof ErrorAplicacion ? err.status : 500;
      res.status(status).json({
        mensaje: err instanceof Error ? err.message : "Error al actualizar rol."
      });
    }
  });

  // ── Mensajes de contacto (Sprint 8) ──────────────────────────

  // GET /api/admin/mensajes
  router.get("/mensajes", async (_req, res) => {
    try {
      const mensajes = await servicioContacto.listarMensajes();
      res.json({ mensajes });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al listar mensajes de contacto."
      });
    }
  });

  // PATCH /api/admin/mensajes/:id/leido
  router.patch("/mensajes/:id/leido", async (req, res) => {
    try {
      const { leido } = req.body as { leido?: boolean };
      const mensaje = await servicioContacto.marcarLeido(req.params.id, leido !== false);
      res.json({ mensaje });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al actualizar estado del mensaje."
      });
    }
  });

  // DELETE /api/admin/mensajes/:id
  router.delete("/mensajes/:id", async (req, res) => {
    try {
      await servicioContacto.eliminarMensaje(req.params.id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al eliminar mensaje."
      });
    }
  });

  return router;
}
