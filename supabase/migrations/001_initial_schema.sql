-- ============================================================
-- CONECTANDO CULTURA — Migración 001: esquema inicial
-- Supabase / PostgreSQL
-- ============================================================
-- NOTA SOBRE AUTENTICACIÓN
--   Este proyecto NO usa Supabase Auth. El login es propio
--   (scrypt + token Bearer aleatorio, 7 días de vigencia) y la
--   tabla `usuarios` la administra el backend. Por eso los `id`
--   de usuario son TEXT (el generador actual produce `u<epoch>`),
--   no UUID. Usar UUID rompería los inserts del backend.
--
-- NOTA SOBRE NOMBRES DE TABLA
--   El backend consulta la tabla como `barrios` con columna
--   `barrio_id` (ver backend/src/services/actividades.service.ts).
--   Esta migración usa esos mismos nombres a propósito.
--
-- Contenido:
--   1. Tabla barrios              (catálogo público)
--   2. Tabla categorias           (catálogo público)
--   3. Tabla usuarios             (auth propia)
--   4. Tabla sesiones             (tokens Bearer)
--   5. Tabla actividades          (contenido cultural)
--   6. Tabla preferencias_usuario
--   7. Índices
--   8. Triggers updated_at
--   9. Row Level Security
--  10. Seed: barrios, categorías y 30 actividades de Mataderos
-- ============================================================

BEGIN;

-- ── 1. Tabla barrios ────────────────────────────────────────

CREATE TABLE barrios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Tabla categorias ─────────────────────────────────────

CREATE TABLE categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  color       CHAR(7) NOT NULL,           -- "#rrggbb"
  icono       TEXT NOT NULL,              -- emoji
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categorias_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ── 3. Tabla usuarios (auth propia, no Supabase Auth) ───────

CREATE TABLE usuarios (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  correo          TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,          -- formato "sal:hash" (scrypt)
  rol             TEXT NOT NULL DEFAULT 'usuario'
                    CONSTRAINT usuarios_rol_valido CHECK (rol IN ('usuario', 'admin')),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Tabla sesiones (tokens Bearer) ───────────────────────

CREATE TABLE sesiones (
  token       TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en   TIMESTAMPTZ NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Tabla actividades ────────────────────────────────────

CREATE TABLE actividades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  slug          TEXT NOT NULL,
  descripcion   TEXT NOT NULL DEFAULT '',
  horarios      TEXT NOT NULL DEFAULT '',
  direccion     TEXT NOT NULL DEFAULT '',
  lat           DECIMAL(10, 7) NOT NULL,
  lng           DECIMAL(10, 7) NOT NULL,
  url           TEXT NOT NULL DEFAULT '',
  imagen_url    TEXT NOT NULL DEFAULT '',
  categoria_id  UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  barrio_id     UUID NOT NULL REFERENCES barrios(id)     ON DELETE RESTRICT,
  visibilidad   TEXT NOT NULL DEFAULT 'publica'
                  CONSTRAINT actividades_visibilidad_valida
                    CHECK (visibilidad IN ('publica', 'privada', 'oculta')),
  destacado     BOOLEAN NOT NULL DEFAULT FALSE,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,           -- borrado lógico
  created_by    TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  updated_by    TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, barrio_id),
  CONSTRAINT actividades_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT actividades_lat_rango CHECK (lat BETWEEN  -90 AND  90),
  CONSTRAINT actividades_lng_rango CHECK (lng BETWEEN -180 AND 180)
);

-- ── 6. Tabla preferencias_usuario ───────────────────────────
--   Una fila por usuario. Las categorías se guardan como array
--   de UUID; la expansión a objetos la hace el servicio.

CREATE TABLE preferencias_usuario (
  usuario_id    TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  barrio_id     UUID REFERENCES barrios(id) ON DELETE SET NULL,
  categoria_ids UUID[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Índices ──────────────────────────────────────────────

CREATE INDEX idx_actividades_barrio_id   ON actividades(barrio_id);
CREATE INDEX idx_actividades_categoria_id ON actividades(categoria_id);
CREATE INDEX idx_actividades_activas     ON actividades(activo) WHERE activo;
CREATE INDEX idx_actividades_slug        ON actividades(slug);
CREATE INDEX idx_sesiones_usuario_id      ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_expira_en       ON sesiones(expira_en);
CREATE INDEX idx_usuarios_rol            ON usuarios(rol);

-- ── 8. Trigger updated_at ───────────────────────────────────

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_actividades_updated_at
  BEFORE UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER tr_preferencias_updated_at
  BEFORE UPDATE ON preferencias_usuario
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ── 9. Row Level Security ───────────────────────────────────
-- El backend opera con la SERVICE ROLE KEY, que ignora RLS: el
-- control de acceso real vive en el middleware (autenticacionRequerida
-- + adminRequerido) y en las validaciones de los servicios.
-- Estas políticas son defensa en profundidad para el caso de que
-- alguien llegue a la base con la anon key.

ALTER TABLE barrios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura pública
CREATE POLICY "lectura publica de barrios"    ON barrios    FOR SELECT USING (true);
CREATE POLICY "lectura publica de categorias" ON categorias FOR SELECT USING (true);

-- Actividades: el público sólo ve las activas y públicas
CREATE POLICY "lectura publica de actividades"
  ON actividades FOR SELECT
  USING (activo = true AND visibilidad = 'publica');

-- Actividades: escritura sólo admins
CREATE POLICY "escritura admin de actividades"
  ON actividades FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid()::text AND u.rol = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid()::text AND u.rol = 'admin')
  );

-- Preferencias: sólo su dueño
CREATE POLICY "acceso propio a preferencias"
  ON preferencias_usuario FOR ALL
  USING      (usuario_id = auth.uid()::text)
  WITH CHECK (usuario_id = auth.uid()::text);

-- Usuarios: uno mismo, o cualquier admin
CREATE POLICY "lectura de usuarios"
  ON usuarios FOR SELECT
  USING (
    id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM usuarios u2 WHERE u2.id = auth.uid()::text AND u2.rol = 'admin')
  );

-- Sesiones: sólo su dueño
CREATE POLICY "acceso propio a sesiones"
  ON sesiones FOR ALL
  USING      (usuario_id = auth.uid()::text)
  WITH CHECK (usuario_id = auth.uid()::text);

-- ── 10. Seed ────────────────────────────────────────────────

-- 10.1 Barrios de la Comuna 9 y aledaños
INSERT INTO barrios (nombre, slug) VALUES
  ('Mataderos',         'mataderos'),
  ('Liniers',           'liniers'),
  ('Vélez Sarsfield',   'velez-sarsfield'),
  ('Parque Avellaneda', 'parque-avellaneda'),
  ('Villa Lugano',      'villa-lugano'),
  ('Villa Riachuelo',   'villa-riachuelo');

-- 10.2 Categorías (color alineado al Design System 60-30-10)
INSERT INTO categorias (nombre, slug, color, icono) VALUES
  ('Ferias y Mercados',     'ferias',           '#F98017', '🏪'),
  ('Cine y Teatro',         'cine-teatro',      '#E53935', '🎬'),
  ('Museos y Cultura',      'museos',           '#8E24AA', '🏛️'),
  ('Música y Espectáculos', 'musica',           '#1E88E5', '🎵'),
  ('Gastronomía',           'gastronomia',      '#D81B60', '🍽️'),
  ('Actividad Física',      'actividad-fisica', '#43A047', '⚽'),
  ('Educación y Talleres',  'educacion',        '#FB8C00', '📚'),
  ('Eventos Comunitarios',  'comunitario',      '#00ACC1', '🤝'),
  ('Naturaleza y Parques',  'naturaleza',       '#2E7D32', '🌳');

-- 10.3 Actividades de Mataderos
--     INSERT ... VALUES directo: cada tupla se castea al tipo de la
--     columna destino (incluida la subconsulta de la FK). Es la
--     forma más simple y la que evita los errores de alias del
--     patrón "SELECT * FROM (VALUES ...) AS t(...)".

-- FERIAS Y MERCADOS
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Feria de Mataderos',
   'feria-de-mataderos',
   'La feria más tradicional del barrio: artesanías, gastronomía criolla, shows de tango y danzas folklóricas. Imperdible los domingos.',
   'Domingos de 9:00 a 18:00',
   'Av. Juan B. Justo 5700, CABA',
   -34.6533, -58.5237,
   '',
   (SELECT id FROM categorias WHERE slug = 'ferias'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('Mercado de La Bodu',
   'mercado-la-bodu',
   'Mercado gastronómico con productos artesanales, cafetería y eventos culturales.',
   'Viernes a domingos de 10:00 a 20:00',
   'Av. Juan B. Justo 5850, CABA',
   -34.6515, -58.5218,
   'https://labodu.com.ar/',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Feria Cultural del Barrio',
   'feria-cultural-barrio',
   'Productores locales, emprendedores sociales y artesanos del barrio.',
   'Sábados de 10:00 a 16:00',
   'Plaza Fray José de la Quintana, CABA',
   -34.6550, -58.5250,
   '',
   (SELECT id FROM categorias WHERE slug = 'ferias'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- CINE Y TEATRO
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Cine Teatro El Plata',
   'cine-teatro-el-plata',
   'El cine ícono del barrio, hoy convertido en centro cultural: películas independientes, teatro y ciclos de cine-debate.',
   'Variable según programación. Consultar el sitio oficial.',
   'Av. Juan B. Justo 6098, CABA',
   -34.6490, -58.5200,
   '',
   (SELECT id FROM categorias WHERE slug = 'cine-teatro'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('Teatro del Pueblo',
   'teatro-del-pueblo-mataderos',
   'Sala de teatro barrial con obras de autores argentinos y ciclos de microteatro.',
   'Viernes y sábados 20:30',
   'Portela 1250, CABA',
   -34.6530, -58.5300,
   '',
   (SELECT id FROM categorias WHERE slug = 'cine-teatro'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- MUSEOS Y CULTURA
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Museo de la Impresión y la Cultura Popular',
   'museo-imprenta',
   'Museo comunitario que rescata la memoria de la industria gráfico-artística del barrio. Visitas guiadas y talleres.',
   'Lunes a viernes de 9:00 a 17:00',
   'Carhue 3450, CABA',
   -34.6520, -58.5280,
   'https://www.museoimprenta.com.ar/',
   (SELECT id FROM categorias WHERE slug = 'museos'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Centro Cultural Casa de la Cultura',
   'centro-cultural-casa-de-la-cultura',
   'Sede de actividades culturales, exposiciones y reuniones vecinales.',
   'Lunes a domingos de 9:00 a 20:00',
   'Av. Directorio 4500, CABA',
   -34.6500, -58.5260,
   '',
   (SELECT id FROM categorias WHERE slug = 'museos'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- MÚSICA Y ESPECTÁCULOS
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Peña de los Borges',
   'pena-borges-mataderos',
   'Peña folklórica con músicos en vivo, milongas y fogones.',
   'Sábados a las 21:00',
   'Chivilcoy 2100, CABA',
   -34.6560, -58.5290,
   '',
   (SELECT id FROM categorias WHERE slug = 'musica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Boliche La Tuerca',
   'boliche-la-tuerca',
   'Centro cultural y boliche con música en vivo, DJ sets y ciclos de tango electrónico.',
   'Viernes y sábados desde las 22:00',
   'Av. Juan B. Justo 6300, CABA',
   -34.6470, -58.5180,
   '',
   (SELECT id FROM categorias WHERE slug = 'musica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- GASTRONOMÍA
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Bar El Progreso',
   'bar-el-progreso-mataderos',
   'Bar histórico del barrio, punto de encuentro de vecinos, con facturas y café.',
   'Lunes a domingos de 6:00 a 20:00',
   'Av. Juan B. Justo 5750, CABA',
   -34.6525, -58.5230,
   '',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Pizzería Los Nietos',
   'pizzeria-los-nietos',
   'Pizzería de barrio con masa madre y hornos de leña.',
   'Martes a domingos de 19:00 a 00:00',
   'Carhue 2150, CABA',
   -34.6550, -58.5270,
   '',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- ACTIVIDAD FÍSICA
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Club Atlético Atlanta',
   'club-atletico-atlanta',
   'El club del barrio: fútbol, volleyball, pádel y cantina. Alma y vida de Mataderos.',
   'Lunes a domingos de 7:00 a 22:00',
   'Humboldt 325, CABA',
   -34.6013, -58.4494,
   'https://www.clubatleticoatlanta.com/',
   (SELECT id FROM categorias WHERE slug = 'actividad-fisica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('Complejo Deportivo Mataderos',
   'complejo-deportivo-mataderos',
   'Canchas de fútbol 5, pádel y gimnasio. Torneos barriales.',
   'Lunes a domingos de 8:00 a 23:00',
   'Av. Escalada 2100, CABA',
   -34.6580, -58.5340,
   '',
   (SELECT id FROM categorias WHERE slug = 'actividad-fisica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- EDUCACIÓN Y TALLERES
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Escuela Técnica N°20 "Ing. César Ortiz"',
   'escuela-tecnica-20-mataderos',
   'Escuela técnica del barrio con orientación en informática, electrónica y mecánica. Centro de la comunidad.',
   'Lunes a viernes de 7:00 a 20:00',
   'Cura Brunel 3449, CABA',
   -34.6525, -58.5275,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('Biblioteca Popular Juan José Saer',
   'biblioteca-juan-jose-saer',
   'Biblioteca barrial con sala de lectura, computadoras, wifi gratuito y talleres de lectura.',
   'Lunes a viernes de 9:00 a 19:00, sábados de 9:00 a 13:00',
   'Monte Russo 2147, CABA',
   -34.6570, -58.5280,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Centro de Día El Alero',
   'centro-de-dia-el-alero',
   'Talleres productivos, huerta comunitaria y cocina para jóvenes y adultos del barrio.',
   'Lunes a viernes de 9:00 a 17:00',
   'Chivilcoy 850, CABA',
   -34.6540, -58.5310,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- EVENTOS COMUNITARIOS
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Centro de Jubilados Mataderos',
   'centro-jubilados-mataderos',
   'Centro comunitario para adultos mayores con almuerzo, actividades recreativas y turismo social.',
   'Lunes a viernes de 9:00 a 17:00',
   'Murguiondo 2148, CABA',
   -34.6585, -58.5320,
   '',
   (SELECT id FROM categorias WHERE slug = 'comunitario'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('Parroquia San Juan XXIII',
   'parroquia-san-juan-xxiii-mataderos',
   'Parroquia del barrio con misa semanal, grupos juveniles, servicio social y eventos solidarios.',
   'Misas: domingos a las 9:00 y 19:00',
   'Cura Brunel 3049, CABA',
   -34.6535, -58.5265,
   '',
   (SELECT id FROM categorias WHERE slug = 'comunitario'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

-- NATURALEZA Y PARQUES
INSERT INTO actividades
  (nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('Parque Lineal de Mataderos',
   'parque-lineal-mataderos',
   'Espacio verde lineal con sendas, bancos y juegos para niños. Ideal para caminar.',
   'Abierto las 24 horas',
   'Av. Juan B. Justo entre Portela y Murguiondo, CABA',
   -34.6545, -58.5255,
   '',
   (SELECT id FROM categorias WHERE slug = 'naturaleza'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE);

COMMIT;
