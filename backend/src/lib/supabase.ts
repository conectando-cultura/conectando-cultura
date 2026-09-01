import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  );
}

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
