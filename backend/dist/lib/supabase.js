import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
/**
 * Cliente de Supabase — Base de datos secundaria de respaldo (backup) y
 * objetivo del monitor Keep-Alive cada 3 días para el plan gratuito.
 *
 * La base de datos principal es MySQL local (`backend/src/lib/mysql.ts`).
 * Cuando Supabase está configurado, las mutaciones se replican en segundo
 * plano y el administrador puede disparar sincronizaciones completas o
 * pings manuales `SELECT 1` desde el Panel de Administración.
 */
const DIR_RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Valores de fallback para que `createClient` no falle al importar el módulo cuando sólo se usa MySQL. */
const URL_PLACEHOLDER = "https://placeholder.supabase.co";
const KEY_PLACEHOLDER = "placeholder-key";
let envCargado = false;
/**
 * Carga las variables de entorno desde backend/.env o .env de la raíz.
 * Se ejecuta antes de leer process.env porque el backend se lanza con
 * `tsx`/`node` sin flag `--env-file`, así que process.env llega vacío.
 * Las variables ya presentes en el entorno real tienen prioridad.
 */
export function cargarEnv() {
    if (envCargado)
        return;
    envCargado = true;
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
            if ((valor.startsWith('"') && valor.endsWith('"')) ||
                (valor.startsWith("'") && valor.endsWith("'"))) {
                valor = valor.slice(1, -1);
            }
            if (clave && process.env[clave] === undefined) {
                process.env[clave] = valor;
            }
        }
        break;
    }
}
cargarEnv();
/**
 * Determina si las credenciales de Supabase son reales y utilizables.
 * Rechaza los placeholders de .env.example y las claves publicables/anon.
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
    if (key.startsWith("sb_publishable_"))
        return false;
    return true;
}
/**
 * Lanza un error descriptivo si se exige Supabase para una operación de backup
 * y las credenciales no están configuradas.
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
            "El backend necesita la service role key (sb_secret_... o la JWT service_role).");
    }
    throw new Error(`Supabase (backup) no está configurado correctamente (URL: ${url}). ` +
        (pistas.length ? pistas.join(" | ") : "Revisá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env."));
}
const supabaseUrl = esSupabaseConfigurado()
    ? process.env.SUPABASE_URL
    : URL_PLACEHOLDER;
const supabaseKey = esSupabaseConfigurado()
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : KEY_PLACEHOLDER;
/**
 * Cliente con service role: operaciones privilegiadas del servidor
 * para replicación de respaldo y keep-alive de Supabase.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
