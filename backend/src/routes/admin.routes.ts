import { Router } from "express";
import {
  autenticacionRequerida,
  permisoRequerido
} from "../middlewares/autenticacion.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
import { ErrorAplicacion, type Rol } from "../types.js";

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

  // Todo /api/admin exige sesión autenticada
  router.use(autenticacionRequerida(auth));

  // GET /api/admin/estadisticas
  // Accesible por gestores y administradores (permiso panel:acceder)
  router.get("/estadisticas", permisoRequerido("panel:acceder"), async (_req, res) => {
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
  // Solo accesible por administradores (permiso usuarios:gestionar)
  router.get("/usuarios", permisoRequerido("usuarios:gestionar"), async (_req, res) => {
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
  // Solo accesible por administradores (permiso usuarios:gestionar)
  router.patch("/usuarios/:id/rol", permisoRequerido("usuarios:gestionar"), async (req, res) => {
    try {
      const { rol } = req.body as { rol?: unknown };
      if (rol !== "usuario" && rol !== "gestor" && rol !== "admin") {
        res.status(400).json({ mensaje: "Rol inválido. Debe ser 'usuario', 'gestor' o 'admin'." });
        return;
      }

      // Regla: no permitir cambiar el propio rol
      if (req.usuarioPublico?.id === req.params.id) {
        res.status(400).json({ mensaje: "No podés cambiar tu propio rol." });
        return;
      }

      exigirSupabase();

      // Regla: si se le quita admin al usuario, verificar que no sea el último
      const { data: usuarioActual, error: errorBusqueda } = await supabaseAdmin
        .from("usuarios")
        .select("id, rol")
        .eq("id", req.params.id)
        .maybeSingle();

      if (errorBusqueda) throw new Error(describirError(errorBusqueda));
      if (!usuarioActual) {
        res.status(404).json({ mensaje: "Usuario no encontrado." });
        return;
      }

      if (usuarioActual.rol === "admin" && rol !== "admin") {
        const { count, error: countError } = await supabaseAdmin
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("rol", "admin");

        if (countError) throw new Error(describirError(countError));
        if ((count ?? 0) <= 1) {
          res.status(400).json({
            mensaje: "No podés quitar el último administrador del sistema."
          });
          return;
        }
      }

      const usuarioActualizado = await auth.actualizarRol(req.params.id, rol as Rol);
      res.json({ usuario: usuarioActualizado });
    } catch (err) {
      console.error(err);
      const status = err instanceof ErrorAplicacion ? err.status : 500;
      res.status(status).json({
        mensaje: err instanceof Error ? err.message : "Error al actualizar rol."
      });
    }
  });

  // DELETE /api/admin/usuarios/:id/sesiones
  // Cierra todas las sesiones de un usuario
  router.delete("/usuarios/:id/sesiones", permisoRequerido("usuarios:gestionar"), async (req, res) => {
    try {
      await auth.cerrarSesionesDeUsuario(req.params.id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({
        mensaje: err instanceof Error ? err.message : "Error al cerrar las sesiones del usuario."
      });
    }
  });

  return router;
}
