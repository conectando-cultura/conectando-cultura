import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
export const esSupabaseConfigurado = () => {
    const url = process.env.SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    return (Boolean(url) &&
        Boolean(key) &&
        !url.includes("placeholder") &&
        !url.includes("your-project-id") &&
        !key.includes("placeholder") &&
        !key.includes("your-service-role-key"));
};
/**
 * Cliente de Supabase con clave de servicio.
 * Usa el service role key para operaciones privilegiadas del servidor
 * (bypass RLS). En el frontend solo se usa la clave anónima.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
