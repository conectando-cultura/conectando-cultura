-- ============================================================
-- CONECTANDO CULTURA — Migración 003: roles y permisos
-- Supabase / PostgreSQL
-- ============================================================
-- 1. Permite rol 'gestor' además de 'usuario' y 'admin'.
-- 2. Migra la columna `icono` de categorias a claves de texto
--    (reemplazo de emojis para alinearse al sistema de iconos de Lucide).
-- ============================================================

BEGIN;

-- ── 1. Modificar constraint de rol en usuarios ──────────────
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_valido;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_valido CHECK (rol IN ('usuario', 'gestor', 'admin'));

-- ── 2. Claves de icono en categorias ────────────────────────
-- Reemplaza los emojis iniciales por claves semánticas de texto
UPDATE categorias SET icono = 'feria' WHERE slug = 'ferias';
UPDATE categorias SET icono = 'cine' WHERE slug = 'cine-teatro';
UPDATE categorias SET icono = 'museo' WHERE slug = 'museos';
UPDATE categorias SET icono = 'teatro' WHERE slug = 'musica';
UPDATE categorias SET icono = 'bar' WHERE slug = 'gastronomia';
UPDATE categorias SET icono = 'biblioteca' WHERE slug = 'educacion';
UPDATE categorias SET icono = 'parque' WHERE slug = 'naturaleza';
UPDATE categorias SET icono = '' WHERE slug IN ('actividad-fisica', 'comunitario');

COMMIT;
