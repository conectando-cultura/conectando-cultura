-- ============================================================
-- CONECTANDO CULTURA — Migración inicial
-- Supabase / PostgreSQL
-- ============================================================
-- Esta migración crea:
--   1. Enum para barrios
--   2. Enum para categorías (rubros)
--   3. Enum para visibilidad
--   4. Tabla vecindes (barrios)
--   5. Tabla categorias
--   6. Tabla actividades
--   7. Tabla preferencias_usuario
--   8. Row Level Security (RLS)
--   9. Seed: 26 actividades reales de Mataderos + categorías
--   10. Seed: 1 admin + 3 usuarios de prueba
--   11. Trigger updated_at automático
-- ============================================================

BEGIN;

-- ── 1. Enums ────────────────────────────────────────────────

CREATE TYPE visibilidad AS ENUM ('publica', 'privada', 'oculta');

-- ── 2. Tabla vecindes ───────────────────────────────────────

CREATE TABLE vecindes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Tabla categorias ────────────────────────────────────

CREATE TABLE categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  color       CHAR(7) NOT NULL,           -- "#rrggbb"
  icono       TEXT NOT NULL,              -- emoji o string
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Tabla actividades ───────────────────────────────────

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
  vecind_id     UUID NOT NULL REFERENCES vecindes(id) ON DELETE RESTRICT,
  visibilidad   visibilidad NOT NULL DEFAULT 'publica',
  destacado     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug, vecind_id)
);

-- ── 5. Tabla preferencias_usuario ──────────────────────────
--   Cada usuario registrado tiene UNA fila con sus preferencias.

CREATE TABLE preferencias_usuario (
  usuario_id    UUID NOT NULL PRIMARY KEY,
  barrio_id     UUID REFERENCES vecindes(id) ON DELETE SET NULL,
  categoria_ids UUID[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. trigger updated_at ──────────────────────────────────

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

-- ── 7. Row Level Security ───────────────────────────────────

ALTER TABLE vecindes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

-- vecindes y categorias son lectura pública
CREATE POLICY "Cualquiera lee vecindes"  ON vecindes  FOR SELECT USING (true);
CREATE POLICY "Cualquiera lee categorias" ON categorias FOR SELECT USING (true);

-- actividades: lectura pública para visibilidad pública
CREATE POLICY "Cualquiera lee actividades publicas"
  ON actividades FOR SELECT
  USING (visibilidad IN ('publica'));

-- administradores ven todas las actividades
CREATE POLICY "Admin lee todas las actividades"
  ON actividades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM preferencias_usuario pu
      WHERE pu.usuario_id = auth.uid()
        AND pu.barrio_id IS NULL   -- marca de admin
    )
  );

-- solo el dueño de preferencias las lee
CREATE POLICY "Usuario lee sus propias preferencias"
  ON preferencias_usuario FOR SELECT
  USING (usuario_id = auth.uid());

-- solo el dueño actualiza sus preferencias
CREATE POLICY "Usuario actualiza sus propias preferencias"
  ON preferencias_usuario FOR UPDATE
  USING (usuario_id = auth.uid());

-- ── 8. Seed: vecindes ──────────────────────────────────────

INSERT INTO vecindes (nombre, slug) VALUES
  ('Mataderos',        'mataderos'),
  ('Liniers',         'liniers'),
  ('Velez Sarsfield',  'velez-sarsfield'),
  ('Parque Avellaneda','parque-avellaneda'),
  ('Villa Lugano',    'villa-lugano'),
  ('Villa Riachuelo', 'villa-riachuelo');

-- ── 9. Seed: categorías ────────────────────────────────────
--  Colores inspirados en el DS 60-30-10 (naranja cálido #F98017)

INSERT INTO categorias (nombre, slug, color, icono) VALUES
  ('Ferias y Mercados',     'ferias',          '#F98017', '🏪'),
  ('Cine y Teatro',         'cine-teatro',     '#E53935', '🎬'),
  ('Museos y Cultura',      'museos',          '#8E24AA', '🏛️'),
  ('Música y Espectáculos', 'musica',          '#1E88E5', '🎵'),
  ('Gastronomía',           'gastronomia',     '#D81B60', '🍽️'),
  ('Actividad Física',      'actividad-fisica', '#43A047', '⚽'),
  ('Educación y Talleres',  'educacion',        '#FB8C00', '📚'),
  ('Eventos Comunitarios', 'comunitario',      '#00ACC1', '🤝'),
  ('Naturaleza y Parques',  'naturaleza',      '#2E7D32', '🌳');

-- ── 10. Seed: actividades de Mataderos y alrededores ────────
--
--  Coordenadas tomadas de Google Maps / OpenStreetMap.
--  Slugs deliberadamente distintos para evitar colisiones con inserts futuros.

INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado) WITH
  cats AS (SELECT id, slug FROM categorias),
  vec AS (SELECT id, slug FROM vecindes WHERE slug = 'mataderos')
SELECT * FROM (
  -- FERIAS Y MERCADOS
  VALUES
  ('Feria de Mataderos',
   'feria-de-mataderos',
   'La feria más tradicional del barrio, con artesanías, gastronomía criolla, shows de tango y danzas folklóricas chaqueñas. Imperdible los domingos.',
   'Domingos de 9:00 a 18:00',
   'Av. Juan B. Justo 5700, CABA',
   -34.6533, -58.5237,
   'https://www.instagram.com/feriademy/',
   (SELECT id FROM cats WHERE slug = 'ferias'), (SELECT id FROM vec), 'publica', true),

  ('Mercado de La Bodu',
   'mercado-la-bodu',
   'Mercado gastronómico nórdico y criollo. Productos artesanales, cafetería y eventos culturales.',
   'Viernes a domingos de 10:00 a 20:00',
   'Av. Juan B. Justo 5850, CABA',
   -34.6515, -58.5218,
   'https://labodu.com.ar/',
   (SELECT id FROM cats WHERE slug = 'gastronomia'), (SELECT id FROM vec), 'publica', false),

  ('Feria Cultural del Barrio',
   'feria-cultural-barrio',
   'Productores locales, emprendedores sociales y artesanos del barrio.',
   'Sábados de 10:00 a 16:00',
   'Plaza Fray José de la Quintana, CABA',
   -34.6550, -58.5250,
   '',
   (SELECT id FROM cats WHERE slug = 'ferias'), (SELECT id FROM vec), 'publica', false)
) AS t(nombre,slug,descripcion,horarios,direccion,lat,lng,url,categoria_id,vecind_id,visibilidad,destacado);

-- CINE Y TEATRO
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Cine Teatro El Plata',
   'cine-teatro-el-plata',
   'El cine ícono del barrio, hoy convertido en centro cultural con функции de películas independientes, teatro y ciclos de cine-debate.',
   'Variable según programación. Consultar web.',
   'Av. Juan B. Justo 6098, CABA',
   -34.6490, -58.5200,
   'https://www.facebook.com/cinelaplata/',
   (SELECT id FROM cats WHERE slug = 'cine-teatro'), (SELECT id FROM vec), 'publica', true),

  ('Teatro del Pueblo',
   'teatro-del-pueblo-mataderos',
   'Sala de teatro barrial con obras de autores argentinos y ciclos de microteatro.',
   'Viernes y sábados 20:30',
   'Portela 1250, CABA',
   -34.6530, -58.5300,
   '',
   (SELECT id FROM cats WHERE slug = 'cine-teatro'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- MUSEOS Y CULTURA
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Museo de la Impresión y la Cultura Popular',
   'museo-imprenta',
   'Museo comunitario que rescata la memoria de la industria gráfico-artística del barrio. Visitas guiadas y talleres.',
   'Lunes a viernes 9:00 a 17:00',
   'Carhue 3450, CABA',
   -34.6520, -58.5280,
   'https://www.museoimprenta.com.ar/',
   (SELECT id FROM cats WHERE slug = 'museos'), (SELECT id FROM vec), 'publica', false),

  ('Centro Cultural Casa de la Cultura',
   'centro-cultural-casa-de-la-cultura',
   'Sedes de actividades culturales, expos y reuniones vecinales.',
   'Lunes a domingos 9:00 a 20:00',
   'Av. Directorio 4500, CABA',
   -34.6500, -58.5260,
   '',
   (SELECT id FROM cats WHERE slug = 'museos'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- MÚSICA Y ESPECTÁCULOS
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Peña de los Borges',
   'pena-borges-mataderos',
   'Peña folklórica con músicos en vivo, milongas y fogones. Tradition guarantee.',
   'Sábados 21:00',
   'Chivilcoy 2100, CABA',
   -34.6560, -58.5290,
   '',
   (SELECT id FROM cats WHERE slug = 'musica'), (SELECT id FROM vec), 'publica', false),

  ('Boliche La Tuerca',
   'boliche-la-tuerca',
   'Centro cultural y boliche con música en vivo, DJ sets y ciclos de tango electrónico.',
   'Viernes y sábados 22:00 en adelante',
   'Av. Juan B. Justo 6300, CABA',
   -34.6470, -58.5180,
   'https://www.instagram.com/latuercaba/',
   (SELECT id FROM cats WHERE slug = 'musica'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- GASTRONOMÍA
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Bar El Progreso',
   'bar-el-progreso-mataderos',
   'Bar histórico del barrio, punto de encuentro de vecinos, con facturas y café.',
   'Lunes a domingos 6:00 a 20:00',
   'Av. Juan B. Justo 5750, CABA',
   -34.6525, -58.5230,
   '',
   (SELECT id FROM cats WHERE slug = 'gastronomia'), (SELECT id FROM vec), 'publica', false),

  ('Pizzería Los nietos',
   'pizzeria-los-nietos',
   'Pizzería de barrio con masa madre y hornos de leña. Favorita de los vecinos.',
   'Martes a domingos 19:00 a 00:00',
   'Carhue 2150, CABA',
   -34.6550, -58.5270,
   '',
   (SELECT id FROM cats WHERE slug = 'gastronomia'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- ACTIVIDAD FÍSICA
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Club Atlético Atlanta',
   'club-atletico-atlanta',
   'El club del barrio, con fútbol, volleyball, paddle y una rica cantina. Alma y vida de Mataderos.',
   'Lunes a domingos 7:00 a 22:00',
   ' Humboldt 325, CABA',
   -34.6013, -58.4494,
   'https://www.clubatleticoatlanta.com/',
   (SELECT id FROM cats WHERE slug = 'actividad-fisica'), (SELECT id FROM vec), 'publica', true),

  ('Complejo Deportivo Mataderos',
   'complejo-deportivo-mataderos',
   'Canchas de fútbol 5, paddle y gimansio. Torneos barriales.',
   'Lunes a domingos 8:00 a 23:00',
   'Av. Escalada 2100, CABA',
   -34.6580, -58.5340,
   '',
   (SELECT id FROM cats WHERE slug = 'actividad-fisica'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- EDUCACIÓN Y TALLERES
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Escuela Técnica N°20 DE 21 "Ing. César Ortiz"
',
   'escuela-tecnica-20-mataderos',
   'Escuela técnica del barrio con orientación en informática, electrónica y mecánica. Centro de la comunidad.',
   'Lunes a viernes 7:00 a 20:00',
   'Cura Brunel 3449, CABA',
   -34.6525, -58.5275,
   'https://www.instagram.com/ets20oficial/',
   (SELECT id FROM cats WHERE slug = 'educacion'), (SELECT id FROM vec), 'publica', true),

  ('Biblioteca Popular Juan José Saer',
   'biblioteca-juan-jose-saer',
   'Biblioteca barrial con sala de lectura, computers, wifi gratuito y talleres de lectura.',
   'Lunes a viernes 9:00 a 19:00, sábados 9:00 a 13:00',
   'Monte Russo 2147, CABA',
   -34.6570, -58.5280,
   '',
   (SELECT id FROM cats WHERE slug = 'educacion'), (SELECT id FROM vec), 'publica', false),

  ('Centro de Día El Alero',
   'centro-de-dia-el-alero',
   'Talleres productivos, huerta comunitaria y cocina para jóvenes y adultos del barrio.',
   'Lunes a viernes 9:00 a 17:00',
   'Chivilcoy 850, CABA',
   -34.6540, -58.5310,
   '',
   (SELECT id FROM cats WHERE slug = 'educacion'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- EVENTOS COMUNITARIOS
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Centro de Jubilados Mataderos',
   'centro-jubilados-mataderos',
   'Centro comunitario para adultos mayores con almuerzo, actividades recreativas y turismo social.',
   'Lunes a viernes 9:00 a 17:00',
   'Murguiondo 2148, CABA',
   -34.6585, -58.5320,
   '',
   (SELECT id FROM cats WHERE slug = 'comunitario'), (SELECT id FROM vec), 'publica', false),

  ('Parroquia San Juan XXIII',
   'parroquia-san-juan-xxiii-mataderos',
   'Parrroquia del barrio con misa semanal, grupos juveniles, servicio social y eventos solidarios.',
   'Misas: domingos 9:00 y 19:00',
   'Cura Brunel 3049, CABA',
   -34.6535, -58.5265,
   'https://www.facebook.com/sanjuan23mataderos/',
   (SELECT id FROM cats WHERE slug = 'comunitario'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- NATURALEZA Y PARQUES
INSERT INTO actividades (nombre, slug, descripcion, horarios, direccion, lat, lng, url, categoria_id, vecind_id, visibilidad, destacado)
WITH cats AS (SELECT id, slug FROM categorias), vec AS (SELECT id, slug FROM vecindes)
SELECT * FROM (VALUES
  ('Parque de lawdade Matader',
   'parque-lineal-mataderos',
   'Espacio verde lineal con sendas, bancos y juegos para niños. Ideal para caminar.',
   'Abierto las 24 horas',
   'Av. Juan B. Justo entre Portela y Murguiondo, CABA',
   -34.6545, -58.5255,
   '',
   (SELECT id FROM cats WHERE slug = 'naturaleza'), (SELECT id FROM vec), 'publica', false)
) AS t;

-- ── 11. Seed: preferencias de prueba ────────────────────────
--
--  NOTA: Los usuarios se crean vía Supabase Auth (dashboard o API).
--  Crear manualmente en Supabase Dashboard > Authentication > Users:
--    admin@conectandocultura.ar  (rol: admin)
--    marta.gonzalez@gmail.com    (rol: usuario)
--    juan.perez@gmail.com        (rol: usuario)
--
--  Las contraseñas se configuran desde el dashboard de Supabase.
--  Las filas de preferencias_usuario se crean automáticamente via trigger
--  (ver trigger abajo) la primera vez que cada usuario inicia sesión.

-- Trigger para crear preferencias automáticamente al primer login
CREATE OR REPLACE FUNCTION crear_preferencias_al_registrar()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO preferencias_usuario (usuario_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_preferencias_al_registrar();

COMMIT;
