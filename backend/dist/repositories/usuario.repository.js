import { randomBytes, randomUUID } from "node:crypto";
import { ejecutarConsulta, ejecutarComando, aIso, describirErrorMysql } from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";
/**
 * Repositorio de usuarios sobre MySQL local con espejo de respaldo en Supabase.
 *
 * El hash de contraseña (scrypt, formato "sal:hash") se calcula en Node y
 * se guarda en la columna `contrasena_hash`.
 */
function nuevoId() {
    return `u${Date.now()}`;
}
function esRolValido(rol) {
    return rol === "admin" || rol === "gestor" || rol === "usuario";
}
function mapearUsuario(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        apellido: fila.apellido,
        correo: fila.correo,
        contrasenaHash: fila.contrasena_hash ?? "",
        rol: esRolValido(fila.rol) ? fila.rol : "usuario",
        creadoEn: aIso(fila.creado_en)
    };
}
export class UsuarioRepository {
    async buscarPorCorreo(correo) {
        try {
            const filas = await ejecutarConsulta(`SELECT id, nombre, apellido, correo, rol, creado_en, contrasena_hash
         FROM usuarios
         WHERE correo = ?
         LIMIT 1`, [correo.trim().toLowerCase()]);
            const fila = filas[0];
            return fila ? mapearUsuario(fila) : null;
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async buscarPorId(id) {
        try {
            const filas = await ejecutarConsulta(`SELECT id, nombre, apellido, correo, rol, creado_en
         FROM usuarios
         WHERE id = ?
         LIMIT 1`, [id]);
            const fila = filas[0];
            return fila ? mapearUsuario(fila) : null;
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async crear(datos) {
        const id = nuevoId();
        const correoLimpio = datos.correo.trim().toLowerCase();
        const rol = datos.rol ?? "usuario";
        const ahora = new Date();
        try {
            await ejecutarComando(`INSERT INTO usuarios (id, nombre, apellido, correo, contrasena_hash, rol, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, datos.nombre, datos.apellido, correoLimpio, datos.contrasenaHash, rol, ahora]);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err, "Ya existe una cuenta con ese correo electrónico."));
        }
        replicarEnSupabase("usuarios.crear", () => supabaseAdmin.from("usuarios").upsert({
            id,
            nombre: datos.nombre,
            apellido: datos.apellido,
            correo: correoLimpio,
            contrasena_hash: datos.contrasenaHash,
            rol,
            creado_en: ahora.toISOString()
        }, { onConflict: "id" }));
        return {
            id,
            nombre: datos.nombre,
            apellido: datos.apellido,
            correo: correoLimpio,
            contrasenaHash: "",
            rol,
            creadoEn: ahora.toISOString()
        };
    }
    async listarTodos() {
        try {
            const filas = await ejecutarConsulta(`SELECT id, nombre, apellido, correo, rol, creado_en
         FROM usuarios
         ORDER BY creado_en ASC`);
            return filas.map(mapearUsuario);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async actualizarRol(id, rol) {
        try {
            const resultado = await ejecutarComando(`UPDATE usuarios SET rol = ? WHERE id = ?`, [rol, id]);
            if (resultado.affectedRows === 0)
                return null;
            replicarEnSupabase("usuarios.actualizarRol", () => supabaseAdmin.from("usuarios").update({ rol }).eq("id", id));
            return await this.buscarPorId(id);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
}
/**
 * Repositorio de sesiones sobre MySQL local con espejo en Supabase.
 */
const DIAS_DE_VIGENCIA = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
export class SesionRepository {
    async crear(usuarioId) {
        const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
        const expiraEn = Date.now() + DIAS_DE_VIGENCIA * MS_POR_DIA;
        const fechaExpira = new Date(expiraEn);
        try {
            await ejecutarComando(`INSERT INTO sesiones (token, usuario_id, expira_en) VALUES (?, ?, ?)`, [token, usuarioId, fechaExpira]);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err, "Error al crear la sesión."));
        }
        replicarEnSupabase("sesiones.crear", () => supabaseAdmin.from("sesiones").upsert({
            token,
            usuario_id: usuarioId,
            expira_en: fechaExpira.toISOString()
        }, { onConflict: "token" }));
        return { token, usuarioId, expiraEn };
    }
    async buscarActiva(token) {
        try {
            const filas = await ejecutarConsulta(`SELECT token, usuario_id, expira_en FROM sesiones WHERE token = ? LIMIT 1`, [token]);
            const fila = filas[0];
            if (!fila)
                return null;
            if (new Date(fila.expira_en).getTime() < Date.now()) {
                await this.eliminar(token);
                return null;
            }
            return { usuarioId: fila.usuario_id };
        }
        catch (err) {
            throw new Error(describirErrorMysql(err, "Error al verificar la sesión."));
        }
    }
    async eliminar(token) {
        try {
            await ejecutarComando(`DELETE FROM sesiones WHERE token = ?`, [token]);
            replicarEnSupabase("sesiones.eliminar", () => supabaseAdmin.from("sesiones").delete().eq("token", token));
        }
        catch (err) {
            throw new Error(describirErrorMysql(err, "Error al cerrar la sesión."));
        }
    }
    async eliminarPorUsuario(usuarioId) {
        try {
            await ejecutarComando(`DELETE FROM sesiones WHERE usuario_id = ?`, [usuarioId]);
            replicarEnSupabase("sesiones.eliminarPorUsuario", () => supabaseAdmin.from("sesiones").delete().eq("usuario_id", usuarioId));
        }
        catch (err) {
            throw new Error(describirErrorMysql(err, "Error al cerrar las sesiones del usuario."));
        }
    }
    async limpiarVencidas() {
        await ejecutarComando(`DELETE FROM sesiones WHERE expira_en < NOW(3)`);
        replicarEnSupabase("sesiones.limpiarVencidas", () => supabaseAdmin.from("sesiones").delete().lt("expira_en", new Date().toISOString()));
    }
}
export function generarToken() {
    return randomBytes(32).toString("hex");
}
