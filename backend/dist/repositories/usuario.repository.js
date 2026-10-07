import { randomBytes, randomUUID } from "node:crypto";
import { supabaseAdmin, exigirSupabase } from "../lib/supabase.js";
/**
 * Repositorio de usuarios sobre Supabase.
 *
 * El hash de contraseña (scrypt, formato "sal:hash") se calcula en Node y
 * se guarda en la columna `contrasena_hash`. La columna nunca se selecciona
 * en las lecturas: `mapearUsuario` la espera, no la exige.
 */
function describirError(error) {
    if (!error)
        return "Error desconocido de Supabase.";
    if (error.code === "23505")
        return "Ya existe una cuenta con ese correo electrónico.";
    if (error.code === "PGRST116")
        return "Usuario no encontrado.";
    return error.message || "Error de base de datos.";
}
/** Genera un id de usuario. El formato `u<epoch>` es el que espera la tabla. */
function nuevoId() {
    return `u${Date.now()}`;
}
const CAMPOS = "id, nombre, apellido, correo, rol, creado_en";
function esRolValido(rol) {
    return rol === "admin" || rol === "gestor" || rol === "usuario";
}
function mapearUsuario(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        apellido: fila.apellido,
        correo: fila.correo,
        // El hash sólo viene en las lecturas que lo piden explícitamente.
        contrasenaHash: fila.contrasena_hash ?? "",
        rol: esRolValido(fila.rol) ? fila.rol : "usuario",
        creadoEn: fila.creado_en
    };
}
export class UsuarioRepository {
    async buscarPorCorreo(correo) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select(`${CAMPOS}, contrasena_hash`)
            .eq("correo", correo.trim().toLowerCase())
            .maybeSingle();
        if (error)
            throw new Error(describirError(error));
        return data ? mapearUsuario(data) : null;
    }
    async buscarPorId(id) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select(CAMPOS)
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw new Error(describirError(error));
        return data ? mapearUsuario(data) : null;
    }
    /** El id se genera en Node para no depender del default de la tabla. */
    async crear(datos) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .insert({
            id: nuevoId(),
            nombre: datos.nombre,
            apellido: datos.apellido,
            correo: datos.correo.trim().toLowerCase(),
            contrasena_hash: datos.contrasenaHash,
            rol: datos.rol ?? "usuario"
        })
            .select(CAMPOS)
            .single();
        if (error)
            throw new Error(describirError(error));
        return mapearUsuario(data);
    }
    async listarTodos() {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select(CAMPOS)
            .order("creado_en", { ascending: true });
        if (error)
            throw new Error(describirError(error));
        return (data ?? []).map(mapearUsuario);
    }
    async actualizarRol(id, rol) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .update({ rol })
            .eq("id", id)
            .select(CAMPOS)
            .maybeSingle();
        if (error)
            throw new Error(describirError(error));
        return data ? mapearUsuario(data) : null;
    }
}
/**
 * Repositorio de sesiones sobre Supabase.
 *
 * Antes vivía en un Map en memoria, lo que significaba que reiniciar el
 * backend expulsaba a todos los usuarios. En la tabla, las sesiones
 * sobreviven al reinicio; las vencidas se limpian al consultar.
 */
const DIAS_DE_VIGENCIA = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
export class SesionRepository {
    async crear(usuarioId) {
        exigirSupabase();
        const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
        const expiraEn = Date.now() + DIAS_DE_VIGENCIA * MS_POR_DIA;
        const { error } = await supabaseAdmin.from("sesiones").insert({
            token,
            usuario_id: usuarioId,
            expira_en: new Date(expiraEn).toISOString()
        });
        if (error)
            throw new Error(error.message || "Error al crear la sesión.");
        return { token, usuarioId, expiraEn };
    }
    /** Devuelve la sesión si sigue vigente; si venció, la borra y devuelve null. */
    async buscarActiva(token) {
        exigirSupabase();
        const { data, error } = await supabaseAdmin
            .from("sesiones")
            .select("token, usuario_id, expira_en")
            .eq("token", token)
            .maybeSingle();
        if (error)
            throw new Error(error.message || "Error al verificar la sesión.");
        if (!data)
            return null;
        const fila = data;
        if (new Date(fila.expira_en).getTime() < Date.now()) {
            await this.eliminar(token);
            return null;
        }
        return { usuarioId: fila.usuario_id };
    }
    async eliminar(token) {
        exigirSupabase();
        const { error } = await supabaseAdmin.from("sesiones").delete().eq("token", token);
        if (error)
            throw new Error(error.message || "Error al cerrar la sesión.");
    }
    /** Cierra todas las sesiones de un usuario (para el panel admin). */
    async eliminarPorUsuario(usuarioId) {
        exigirSupabase();
        const { error } = await supabaseAdmin.from("sesiones").delete().eq("usuario_id", usuarioId);
        if (error)
            throw new Error(error.message || "Error al cerrar las sesiones del usuario.");
    }
    /** Purga housekeeping: borra las sesiones vencidas. */
    async limpiarVencidas() {
        exigirSupabase();
        await supabaseAdmin
            .from("sesiones")
            .delete()
            .lt("expira_en", new Date().toISOString());
    }
}
/** Token de 32 bytes en hex, por si se necesita fuera de SesionRepository. */
export function generarToken() {
    return randomBytes(32).toString("hex");
}
