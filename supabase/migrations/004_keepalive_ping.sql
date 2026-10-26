-- ============================================================
-- CONECTANDO CULTURA — Migración 004: Keep-Alive RPC (SELECT 1)
-- Supabase / PostgreSQL
-- ============================================================
-- Función liviana para mantener despierto el proyecto de Supabase
-- (Free Tier se pausa tras 7 días de inactividad). El backend la
-- invoca cada 3 días mediante `supabaseAdmin.rpc("ping_keepalive")`.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.ping_keepalive()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 1;
$$;

GRANT EXECUTE ON FUNCTION public.ping_keepalive() TO anon, authenticated, service_role;

COMMIT;
