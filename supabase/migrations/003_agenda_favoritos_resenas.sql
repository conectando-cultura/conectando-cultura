-- ============================================================
-- CONECTANDO CULTURA — Migración 003: Agenda, Favoritos y Reseñas
-- Supabase / PostgreSQL
-- ============================================================

BEGIN;

-- ── 1. Columnas de agenda y fechas estructuradas ──────────────
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin DATE,
  ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS dias_semana TEXT NOT NULL DEFAULT '';

-- ── 2. Tabla de Favoritos de Vecinos ─────────────────────────
CREATE TABLE IF NOT EXISTS favoritos_usuario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  actividad_id  UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, actividad_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_actividad ON favoritos_usuario(actividad_id);

ALTER TABLE favoritos_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios gestionan sus favoritos"
  ON favoritos_usuario FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 3. Tabla de Reseñas y Calificaciones Comunitarias ────────
CREATE TABLE IF NOT EXISTS resenas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  actividad_id  UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  calificacion  SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario    TEXT NOT NULL CHECK (char_length(comentario) BETWEEN 3 AND 1000),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resenas_actividad ON resenas(actividad_id);
CREATE INDEX IF NOT EXISTS idx_resenas_usuario ON resenas(usuario_id);

ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resenas lectura publica"
  ON resenas FOR SELECT
  USING (true);

CREATE POLICY "resenas insercion usuario"
  ON resenas FOR INSERT
  WITH CHECK (true);

COMMIT;
