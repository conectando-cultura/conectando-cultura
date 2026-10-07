import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
/**
 * Cliente de Supabase — única fuente de persistencia del proyecto.
 *
 * No hay fallback local: si la base no está disponible, la API falla y
 * el error sube al cliente. Es intencional; un sistema que "funciona" con
 * datos de mentira esconde el problema hasta que se descubre en producción.
 *
 * La autenticación es propia (scrypt + token Bearer), NO Supabase Auth:
 * por eso los ids de usuario son TEXT y `usuarios` la administra el backend.
 */
const DIR_RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Valores de fallback para que `createClient` no tire al importar el módulo. */
const URL_PLACEHOLDER = "https://placeholder.supabase.co";
const KEY_PLACEHOLDER = "placeholder-key";
/**
 * Carga las variables de entorno desde backend/.env o .env de la raíz.
 * Se ejecuta antes de leer process.env porque el backend se lanza con
 * `tsx`/`node` sin flag `--env-file`, así que process.env llega vacío.
 * Las variables ya presentes en el entorno real tienen prioridad.
 */
function cargarEnv() {
    // El .env puede estar en backend/ o en la raíz del repo (según dónde
    // se clonó el proyecto); se prueban ambos más el cwd actual.
    const candidatos = [
        resolve(DIR_RAIZ, ".env"),
        resolve(DIR_RAIZ, "..", ".env"),
        resolve(process.cwd(), ".env")
    ];
    for (const ruta of candidatos) {
        if (!existsSync(ruta))
            continue;
        for (const linea of readFileSync(ruta, "utf-8").split("\n")) {
            const limpia = linea.trim();
            if (limpia === "" || limpia.startsWith("#"))
                continue;
            const separador = limpia.indexOf("=");
            if (separador === -1)
                continue;
            const clave = limpia.slice(0, separador).trim();
            let valor = limpia.slice(separador + 1).trim();
            // Quitar comillas envolventes si las hay
            if ((valor.startsWith('"') && valor.endsWith('"')) ||
                (valor.startsWith("'") && valor.endsWith("'"))) {
                valor = valor.slice(1, -1);
            }
            // El entorno real gana sobre el archivo
            if (clave && !process.env[clave]) {
                process.env[clave] = valor;
            }
        }
        break; // primer archivo encontrado alcanza
    }
}
cargarEnv();
const supabaseUrl = process.env.SUPABASE_URL || URL_PLACEHOLDER;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || KEY_PLACEHOLDER;
/**
 * Determina si las credenciales son reales y utilizables.
 * Rechaza los placeholders de .env.example y las claves publicables/anon
 * (`sb_publishable__`, `sb_secret_` es la nueva service role): el backend
 * necesita acceso privilegiado porque ignora RLS por diseño.
 */
export function esSupabaseConfigurado() {
    const url = process.env.SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!url || !key)
        return false;
    if (url.includes("placeholder") || url.includes("your-project-id"))
        return false;
    if (key.includes("placeholder") || key.includes("your-service-role-key"))
        return false;
    // La clave publicable/anon no sirve para el backend: no salta RLS.
    if (key.startsWith("sb_publishable_"))
        return false;
    return true;
}
/**
 * Lanza un error descriptive si falta configuración, en lugar de dejar que
 * la app arranque y falle en la primera consulta con un error incomprensible.
 */
export function exigirSupabase() {
    if (esSupabaseConfigurado())
        return;
    const url = process.env.SUPABASE_URL ?? "(vacío)";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "(vacío)";
    const pistas = [];
    if (!process.env.SUPABASE_URL) {
        pistas.push("Falta SUPABASE_URL en backend/.env o .env");
    }
    if (key.startsWith("sb_publishable_")) {
        pistas.push("SUPABASE_SERVICE_ROLE_KEY es una clave publicable (sb_publishable__). " +
            "El backend necesita la service role key (sb_secret_... en el panel nuevo, " +
            "o la JWT clásica en Settings → API).");
    }
    throw new Error(`Supabase no está configurado correctamente (URL: ${url}). ` +
        (pistas.length ? pistas.join(" | ") : "Revisá backend/.env."));
}
/**
 * Cliente con service role: operaciones privilegiadas del servidor
 * (bypass de RLS). Nunca debe exponerse al frontend.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
