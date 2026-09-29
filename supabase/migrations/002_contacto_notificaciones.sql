-- ============================================================
-- CONECTANDO CULTURA — Migración 002: contacto y notificaciones
-- Supabase / PostgreSQL
-- ============================================================
-- La 001 ya crea usuarios.rol, actividades.activo/created_by/updated_by
-- y los índices correspondientes. Esta migración sólo agrega lo que
-- falta para el Sprint 8 (alertas por correo y formulario de contacto).
--
-- Todas las sentencias son idempotentes: se puede correr más de una vez.
-- ============================================================

BEGIN;

-- ── 1. Extensión para generación de UUID ────────────────────
-- pgcrypto provee gen_random_uuid(); uuid-ossp es el fallback.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Mensajes del formulario de contacto ──────────────────

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  correo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  leido       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_contacto_creado
  ON mensajes_contacto(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_mensajes_contacto_leido
  ON mensajes_contacto(leido) WHERE NOT leido;

ALTER TABLE mensajes_contacto ENABLE ROW LEVEL SECURITY;

-- Inserción pública (formulario de contacto sin sesión).
-- El servicio corre con service role, así que esto sólo aplica si
-- alguien expusiera la anon key: se permite escritura pero no
-- lectura del buzón.
CREATE POLICY "contacto publico inserta"
  ON mensajes_contacto FOR INSERT
  WITH CHECK (
    char_length(nombre) BETWEEN 1 AND 120
    AND char_length(correo)   BETWEEN 3 AND 200
    AND char_length(mensaje)  BETWEEN 1 AND 4000
  );

-- Lectura restringida al admin de turno.
CREATE POLICY "admin lee mensajes de contacto"
  ON mensajes_contacto FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::text AND u.rol = 'admin'
    )
  );

-- Marcar como leído: sólo admin.
CREATE POLICY "admin marca mensajes leidos"
  ON mensajes_contacto FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::text AND u.rol = 'admin'
    )
  );

-- ── 3. Bitácora de notificaciones enviadas ──────────────────
-- Aunque Resend falle, el envío queda registrado: permite auditar
-- y reintentar sin duplicar avisos.

CREATE TABLE IF NOT EXISTS notificaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  actividad_id  UUID REFERENCES actividades(id) ON DELETE CASCADE,
  categoria_id  UUID REFERENCES categorias(id) ON DELETE SET NULL,
  barrio_id     UUID REFERENCES barrios(id)     ON DELETE SET NULL,
  canal         TEXT NOT NULL DEFAULT 'email'
                  CONSTRAINT notificaciones_canal_valido CHECK (canal IN ('email')),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                  CONSTRAINT notificaciones_estado_valido
                    CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
  error         TEXT,
  enviado_en    TIMESTAMPTZ,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_actividad ON notificaciones(actividad_id);
-- Evita reenviar el mismo aviso al mismo usuario por la misma actividad.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notificaciones_dedupe
  ON notificaciones(usuario_id, actividad_id, canal)
  WHERE actividad_id IS NOT NULL AND estado = 'enviado';

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin gestiona notificaciones"
  ON notificaciones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::text AND u.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::text AND u.rol = 'admin'
    )
  );

COMMIT;
