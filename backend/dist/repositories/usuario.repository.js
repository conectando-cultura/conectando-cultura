import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
/**
 * Repositorio de usuarios.
 *
 * En este sprint la persistencia es un archivo JSON local que simula la
 * base de datos PostgreSQL (Supabase) prevista en la arquitectura del
 * proyecto (Actividad 24). Al conectar Supabase (Sprint 3 del backlog),
 * solo se reemplaza esta capa: el resto del sistema no se modifica.
 */
export class UsuarioRepository {
    ruta;
    constructor(ruta) {
        this.ruta = ruta;
    }
    leer() {
        try {
            const contenido = readFileSync(this.ruta, "utf-8");
            const datos = JSON.parse(contenido);
            return Array.isArray(datos) ? datos : [];
        }
        catch {
            return [];
        }
    }
    escribir(usuarios) {
        mkdirSync(dirname(this.ruta), { recursive: true });
        const temporal = `${this.ruta}.tmp`;
        writeFileSync(temporal, JSON.stringify(usuarios, null, 2), "utf-8");
        renameSync(temporal, this.ruta);
    }
    buscarPorCorreo(correo) {
        const objetivo = correo.toLowerCase();
        return this.leer().find((u) => u.correo.toLowerCase() === objetivo) ?? null;
    }
    buscarPorId(id) {
        return this.leer().find((u) => u.id === id) ?? null;
    }
    crear(datos) {
        const usuario = {
            ...datos,
            id: `u${Date.now()}`,
            creadoEn: new Date().toISOString()
        };
        const usuarios = this.leer();
        usuarios.push(usuario);
        this.escribir(usuarios);
        return usuario;
    }
}
