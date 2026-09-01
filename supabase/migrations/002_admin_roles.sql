-- ============================================================
-- CONECTANDO CULTURA — Sprint 4: Gestión Admin + RLS refinada
-- Supabase / PostgreSQL
-- ============================================================

-- ── 1. Extensiones ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Tablas existentes (referencia) ──────────────────────
-- categorias, barrios, actividades, preferencias_usuario,
-- sesiones, usuarios, notificaciones — creadas en 001_initial_schema

-- ── 3. Nuevo enum para roles ────────────────────────────────
CREATE TYPE rol AS ENUM ('usuario', 'admin');
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol rol NOT NULL DEFAULT 'usuario';

-- ── 4. Columnas para gestión de actividades ─────────────────
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activo    boolean NOT NULL DEFAULT true;

-- ── 5. Índice para búsquedas frecuentes ─────────────────────
CREATE INDEX IF NOT EXISTS idx_actividades_baruario ON actividades(barrio_id);
CREATE INDEX IF NOT EXISTS idx_actividades_categoria ON actividades(categoria_id);
CREATE INDEX IF NOT EXISTS idx_actividades_activo   ON actividades(activo) WHERE activo = true;

-- ── 6. Tabla de mensajes de contacto (Sprint 8 pre-built) ───
CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      text NOT NULL,
  correo      text NOT NULL,
  mensaje     text NOT NULL,
  leido       boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

-- ── 7. RLS actualizada ──────────────────────────────────────
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

-- Reemplazar políticas anteriores
DROP POLICY IF EXISTS "lectura publica de actividades" ON actividades;
DROP POLICY IF EXISTS "usuarios ven sus propias preferencias" ON preferencias_usuario;
DROP POLICY IF EXISTS "usuarios actualizan sus propias preferencias" ON preferencias_usuario;
DROP POLICY IF EXISTS "usuarios insertan sus propias preferencias" ON preferencias_usuario;

-- Actividades: lectura pública para activos
CREATE POLICY "lectura publica de actividades"
  ON actividades FOR SELECT
  USING (activo = true);

-- Actividades: admins pueden hacer todo
CREATE POLICY "admins gestionan actividades"
  ON actividades TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
  );

-- Actividades: usuarios normales pueden hacer SELECT (sin modificar RLS del schema)
-- Preferencias: solo el dueño lee/escribe
CREATE POLICY "lectura propia de preferencias"
  ON preferencias_usuario FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "escritura propia de preferencias"
  ON preferencias_usuario FOR ALL
  USING (usuario_id = auth.uid());

-- ── 8. Seed: rol admin para el primer usuario ───────────────
-- Para activar: UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu@email.com';

-- ── 9. Seed: mensaje de contacto inicial ───────────────────
INSERT INTO mensajes_contacto (nombre, correo, mensaje)
VALUES ('Equipo Conectando Cultura', 'notificaciones@conectandocultura.ar',
        '¡Bienvenido a Conectando Cultura! Este es tu primer mensaje de contacto.')
ON CONFLICT DO NOTHING;
