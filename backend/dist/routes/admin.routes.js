import { Router } from "express";
import { autenticacionRequerida, permisoRequerido } from "../middlewares/autenticacion.middleware.js";
import { ejecutarConsulta, aIso, describirErrorMysql } from "../lib/mysql.js";
import { obtenerEstadoSistema, ejecutarPingKeepAlive, sincronizarMysqlASupabase } from "../services/supabase-monitor.service.js";
import { ErrorAplicacion } from "../types.js";
export function crearRutasAdmin(auth) {
    const router = Router();
    // Todo /api/admin exige sesión autenticada
    router.use(autenticacionRequerida(auth));
    // GET /api/admin/estadisticas
    // Accesible por gestores y administradores (permiso panel:acceder)
    router.get("/estadisticas", permisoRequerido("panel:acceder"), async (_req, res) => {
        try {
            const [totalAct, activas, usuarios, preferencias] = await Promise.all([
                ejecutarConsulta(`SELECT COUNT(*) AS total FROM actividades`),
                ejecutarConsulta(`SELECT COUNT(*) AS total FROM actividades WHERE activo = 1`),
                ejecutarConsulta(`SELECT COUNT(*) AS total FROM usuarios`),
                ejecutarConsulta(`SELECT COUNT(*) AS total FROM preferencias_usuario`)
            ]);
            res.json({
                totalActividades: Number(totalAct[0]?.total ?? 0),
                actividadesActivas: Number(activas[0]?.total ?? 0),
                totalUsuarios: Number(usuarios[0]?.total ?? 0),
                totalPreferencias: Number(preferencias[0]?.total ?? 0),
                fecha: new Date().toISOString()
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: describirErrorMysql(err)
            });
        }
    });
    // GET /api/admin/usuarios
    // Solo accesible por administradores (permiso usuarios:gestionar)
    router.get("/usuarios", permisoRequerido("usuarios:gestionar"), async (_req, res) => {
        try {
            // Nunca seleccionar contrasena_hash
            const filas = await ejecutarConsulta(`SELECT id, nombre, apellido, correo, rol, creado_en
         FROM usuarios
         ORDER BY creado_en DESC
         LIMIT 100`);
            const usuarios = filas.map((u) => {
                const creadoIso = aIso(u.creado_en);
                return {
                    id: u.id,
                    nombre: u.nombre,
                    apellido: u.apellido,
                    correo: u.correo,
                    rol: u.rol,
                    creado_en: creadoIso,
                    creadoEn: creadoIso
                };
            });
            res.json({ usuarios });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: describirErrorMysql(err)
            });
        }
    });
    // PATCH /api/admin/usuarios/:id/rol
    // Solo accesible por administradores (permiso usuarios:gestionar)
    router.patch("/usuarios/:id/rol", permisoRequerido("usuarios:gestionar"), async (req, res) => {
        try {
            const { rol } = req.body;
            if (rol !== "usuario" && rol !== "gestor" && rol !== "admin") {
                res.status(400).json({ mensaje: "Rol inválido. Debe ser 'usuario', 'gestor' o 'admin'." });
                return;
            }
            // Regla: no permitir cambiar el propio rol
            if (req.usuarioPublico?.id === req.params.id) {
                res.status(400).json({ mensaje: "No podés cambiar tu propio rol." });
                return;
            }
            // Regla: si se le quita admin al usuario, verificar que no sea el último
            const filasUsuario = await ejecutarConsulta(`SELECT id, rol FROM usuarios WHERE id = ? LIMIT 1`, [req.params.id]);
            const usuarioActual = filasUsuario[0];
            if (!usuarioActual) {
                res.status(404).json({ mensaje: "Usuario no encontrado." });
                return;
            }
            if (usuarioActual.rol === "admin" && rol !== "admin") {
                const conteoAdmins = await ejecutarConsulta(`SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'`);
                if (Number(conteoAdmins[0]?.total ?? 0) <= 1) {
                    res.status(400).json({
                        mensaje: "No podés quitar el último administrador del sistema."
                    });
                    return;
                }
            }
            const usuarioActualizado = await auth.actualizarRol(req.params.id, rol);
            res.json({ usuario: usuarioActualizado });
        }
        catch (err) {
            console.error(err);
            const status = err instanceof ErrorAplicacion ? err.status : 500;
            res.status(status).json({
                mensaje: err instanceof Error ? err.message : describirErrorMysql(err)
            });
        }
    });
    // DELETE /api/admin/usuarios/:id/sesiones
    // Cierra todas las sesiones de un usuario
    router.delete("/usuarios/:id/sesiones", permisoRequerido("usuarios:gestionar"), async (req, res) => {
        try {
            await auth.cerrarSesionesDeUsuario(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: err instanceof Error ? err.message : "Error al cerrar las sesiones del usuario."
            });
        }
    });
    // GET /api/admin/sistema/estado-bd
    // Exclusivo para SuperAdmin (rol === "admin" mediante usuarios:gestionar)
    router.get("/sistema/estado-bd", permisoRequerido("usuarios:gestionar"), async (_req, res) => {
        try {
            const estado = await obtenerEstadoSistema();
            res.json(estado);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: err instanceof Error
                    ? err.message
                    : "Error al obtener el estado de las bases de datos."
            });
        }
    });
    // POST /api/admin/sistema/supabase-ping
    // Ejecuta un ping SELECT 1 manual hacia Supabase y devuelve el estado actualizado
    router.post("/sistema/supabase-ping", permisoRequerido("usuarios:gestionar"), async (_req, res) => {
        try {
            await ejecutarPingKeepAlive("manual");
            const estado = await obtenerEstadoSistema();
            res.json(estado);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: err instanceof Error
                    ? err.message
                    : "Error al ejecutar el ping keep-alive en Supabase."
            });
        }
    });
    // POST /api/admin/sistema/supabase-sync
    // Sincroniza bajo demanda las tablas de MySQL primario hacia el backup de Supabase
    router.post("/sistema/supabase-sync", permisoRequerido("usuarios:gestionar"), async (_req, res) => {
        try {
            const resumen = await sincronizarMysqlASupabase();
            const estado = await obtenerEstadoSistema();
            res.json({
                mensaje: `Sincronización completada: ${resumen.totalRegistros} registros actualizados en Supabase.`,
                resumen,
                estado
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                mensaje: err instanceof Error
                    ? err.message
                    : "Error al sincronizar el backup en Supabase."
            });
        }
    });
    return router;
}
