-- ============================================================
-- CONECTANDO CULTURA — Esquema y Seed Inicial (MySQL 8.0+)
-- Base de datos principal local con soporte UTF-8 completo
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS conectando_cultura
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE conectando_cultura;

-- ── 1. Tabla barrios ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS barrios (
  id          VARCHAR(36) PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL UNIQUE,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Tabla categorias ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS categorias (
  id          VARCHAR(36) PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL UNIQUE,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  color       CHAR(7) NOT NULL,
  icono       VARCHAR(64) NOT NULL DEFAULT '',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Tabla usuarios (autenticación propia scrypt) ─────────

CREATE TABLE IF NOT EXISTS usuarios (
  id              VARCHAR(64) PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  apellido        VARCHAR(255) NOT NULL,
  correo          VARCHAR(255) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(512) NOT NULL,
  rol             VARCHAR(32) NOT NULL DEFAULT 'usuario',
  creado_en       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT usuarios_rol_valido CHECK (rol IN ('usuario', 'gestor', 'admin')),
  INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Tabla sesiones (tokens Bearer) ───────────────────────

CREATE TABLE IF NOT EXISTS sesiones (
  token       VARCHAR(128) PRIMARY KEY,
  usuario_id  VARCHAR(64) NOT NULL,
  expira_en   DATETIME(3) NOT NULL,
  creado_en   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_sesiones_usuario_id (usuario_id),
  INDEX idx_sesiones_expira_en (expira_en),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Tabla actividades ────────────────────────────────────

CREATE TABLE IF NOT EXISTS actividades (
  id             VARCHAR(36) PRIMARY KEY,
  nombre         VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) NOT NULL,
  descripcion    TEXT NOT NULL,
  horarios       VARCHAR(512) NOT NULL DEFAULT '',
  direccion      VARCHAR(512) NOT NULL DEFAULT '',
  lat            DECIMAL(10, 7) NOT NULL,
  lng            DECIMAL(10, 7) NOT NULL,
  url            VARCHAR(512) NOT NULL DEFAULT '',
  imagen_url     VARCHAR(512) NOT NULL DEFAULT '',
  categoria_id   VARCHAR(36) NOT NULL,
  barrio_id      VARCHAR(36) NOT NULL,
  visibilidad    VARCHAR(32) NOT NULL DEFAULT 'publica',
  destacado      BOOLEAN NOT NULL DEFAULT FALSE,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio   DATE NULL,
  fecha_fin      DATE NULL,
  es_recurrente  BOOLEAN NOT NULL DEFAULT TRUE,
  dias_semana    VARCHAR(255) NOT NULL DEFAULT '',
  created_by     VARCHAR(64) NULL,
  updated_by     VARCHAR(64) NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_actividades_slug_barrio (slug, barrio_id),
  INDEX idx_actividades_barrio_id (barrio_id),
  INDEX idx_actividades_categoria_id (categoria_id),
  INDEX idx_actividades_activas (activo),
  INDEX idx_actividades_slug (slug),
  CONSTRAINT actividades_visibilidad_valida CHECK (visibilidad IN ('publica', 'privada', 'oculta')),
  CONSTRAINT actividades_lat_rango CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT actividades_lng_rango CHECK (lng BETWEEN -180 AND 180),
  CONSTRAINT fk_actividades_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_barrio
    FOREIGN KEY (barrio_id) REFERENCES barrios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_actividades_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Tabla preferencias_usuario ───────────────────────────

CREATE TABLE IF NOT EXISTS preferencias_usuario (
  usuario_id     VARCHAR(64) PRIMARY KEY,
  barrio_id      VARCHAR(36) NULL,
  categoria_ids  JSON NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_preferencias_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_preferencias_barrio
    FOREIGN KEY (barrio_id) REFERENCES barrios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Tabla mensajes_contacto ──────────────────────────────

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id          VARCHAR(36) PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  correo      VARCHAR(200) NOT NULL,
  mensaje     TEXT NOT NULL,
  leido       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_mensajes_contacto_creado (creado_en DESC),
  INDEX idx_mensajes_contacto_leido (leido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Tabla notificaciones ─────────────────────────────────

CREATE TABLE IF NOT EXISTS notificaciones (
  id            VARCHAR(36) PRIMARY KEY,
  usuario_id    VARCHAR(64) NOT NULL,
  actividad_id  VARCHAR(36) NULL,
  categoria_id  VARCHAR(36) NULL,
  barrio_id     VARCHAR(36) NULL,
  canal         VARCHAR(32) NOT NULL DEFAULT 'email',
  estado        VARCHAR(32) NOT NULL DEFAULT 'pendiente',
  error         TEXT NULL,
  enviado_en    DATETIME(3) NULL,
  creado_en     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_notificaciones_usuario (usuario_id),
  INDEX idx_notificaciones_actividad (actividad_id),
  CONSTRAINT notificaciones_canal_valido CHECK (canal IN ('email')),
  CONSTRAINT notificaciones_estado_valido CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
  CONSTRAINT fk_notificaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_notificaciones_actividad
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE,
  CONSTRAINT fk_notificaciones_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  CONSTRAINT fk_notificaciones_barrio
    FOREIGN KEY (barrio_id) REFERENCES barrios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Tabla favoritos_usuario ──────────────────────────────

CREATE TABLE IF NOT EXISTS favoritos_usuario (
  id            VARCHAR(36) PRIMARY KEY,
  usuario_id    VARCHAR(64) NOT NULL,
  actividad_id  VARCHAR(36) NOT NULL,
  creado_en     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_favoritos_usuario_actividad (usuario_id, actividad_id),
  INDEX idx_favoritos_usuario (usuario_id),
  INDEX idx_favoritos_actividad (actividad_id),
  CONSTRAINT fk_favoritos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_actividad
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. Tabla resenas ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS resenas (
  id            VARCHAR(36) PRIMARY KEY,
  usuario_id    VARCHAR(64) NOT NULL,
  actividad_id  VARCHAR(36) NOT NULL,
  calificacion  SMALLINT NOT NULL,
  comentario    TEXT NOT NULL,
  creado_en     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_resenas_actividad (actividad_id),
  INDEX idx_resenas_usuario (usuario_id),
  CONSTRAINT resenas_calificacion_valida CHECK (calificacion BETWEEN 1 AND 5),
  CONSTRAINT fk_resenas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_resenas_actividad
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. Tabla sistema_estado_supabase (Keep-Alive & Backup) ─

CREATE TABLE IF NOT EXISTS sistema_estado_supabase (
  id                        INT PRIMARY KEY DEFAULT 1,
  ultimo_ping_en            DATETIME(3) NULL,
  proximo_ping_en           DATETIME(3) NULL,
  ultimo_estado             VARCHAR(32) NOT NULL DEFAULT 'pendiente',
  ultima_latencia_ms        INT NULL,
  ultimo_error              TEXT NULL,
  ultima_sincronizacion_en  DATETIME(3) NULL,
  updated_at                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sistema_estado_supabase (id, ultimo_estado)
VALUES (1, 'pendiente')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- ── 12. Seed Inicial ────────────────────────────────────────

-- 12.1 Barrios de la Comuna 9 (Liniers, Mataderos y Parque Avellaneda)
INSERT INTO barrios (id, nombre, slug) VALUES
  ('11111111-1111-4111-8111-000000000001', 'Mataderos',         'mataderos'),
  ('11111111-1111-4111-8111-000000000002', 'Liniers',           'liniers'),
  ('11111111-1111-4111-8111-000000000004', 'Parque Avellaneda', 'parque-avellaneda')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre);

DELETE FROM barrios
WHERE slug NOT IN ('mataderos', 'liniers', 'parque-avellaneda');

-- 12.2 Categorías (claves de icono alineadas con 003_roles_y_permisos.sql)
INSERT INTO categorias (id, nombre, slug, color, icono) VALUES
  ('22222222-2222-4222-8222-000000000001', 'Ferias y Mercados',     'ferias',           '#F98017', 'feria'),
  ('22222222-2222-4222-8222-000000000002', 'Cine y Teatro',         'cine-teatro',      '#E53935', 'cine'),
  ('22222222-2222-4222-8222-000000000003', 'Museos y Cultura',      'museos',           '#8E24AA', 'museo'),
  ('22222222-2222-4222-8222-000000000004', 'Música y Espectáculos', 'musica',           '#1E88E5', 'teatro'),
  ('22222222-2222-4222-8222-000000000005', 'Gastronomía',           'gastronomia',      '#D81B60', 'bar'),
  ('22222222-2222-4222-8222-000000000006', 'Actividad Física',      'actividad-fisica', '#43A047', ''),
  ('22222222-2222-4222-8222-000000000007', 'Educación y Talleres',  'educacion',        '#FB8C00', 'biblioteca'),
  ('22222222-2222-4222-8222-000000000008', 'Eventos Comunitarios',  'comunitario',      '#00ACC1', ''),
  ('22222222-2222-4222-8222-000000000009', 'Naturaleza y Parques',  'naturaleza',       '#2E7D32', 'parque')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  color = VALUES(color),
  icono = VALUES(icono);

-- 12.3 Actividades de Mataderos (18 actividades iniciales)
INSERT INTO actividades
  (id, nombre, slug, descripcion, horarios, direccion, lat, lng, url,
   categoria_id, barrio_id, visibilidad, destacado)
VALUES
  ('33333333-3333-4333-8333-000000000001',
   'Feria de Mataderos',
   'feria-de-mataderos',
   'La feria más tradicional del barrio: artesanías, gastronomía criolla, shows de tango y danzas folklóricas. Imperdible los domingos.',
   'Domingos de 9:00 a 18:00',
   'Av. Juan B. Justo 5700, CABA',
   -34.6533, -58.5237,
   '',
   (SELECT id FROM categorias WHERE slug = 'ferias'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('33333333-3333-4333-8333-000000000002',
   'Mercado de La Bodu',
   'mercado-la-bodu',
   'Mercado gastronómico con productos artesanales, cafetería y eventos culturales.',
   'Viernes a domingos de 10:00 a 20:00',
   'Av. Juan B. Justo 5850, CABA',
   -34.6515, -58.5218,
   'https://labodu.com.ar/',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000003',
   'Feria Cultural del Barrio',
   'feria-cultural-barrio',
   'Productores locales, emprendedores sociales y artesanos del barrio.',
   'Sábados de 10:00 a 16:00',
   'Plaza Fray José de la Quintana, CABA',
   -34.6550, -58.5250,
   '',
   (SELECT id FROM categorias WHERE slug = 'ferias'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000004',
   'Cine Teatro El Plata',
   'cine-teatro-el-plata',
   'El cine ícono del barrio, hoy convertido en centro cultural: películas independientes, teatro y ciclos de cine-debate.',
   'Variable según programación. Consultar el sitio oficial.',
   'Av. Juan B. Justo 6098, CABA',
   -34.6490, -58.5200,
   '',
   (SELECT id FROM categorias WHERE slug = 'cine-teatro'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('33333333-3333-4333-8333-000000000005',
   'Teatro del Pueblo',
   'teatro-del-pueblo-mataderos',
   'Sala de teatro barrial con obras de autores argentinos y ciclos de microteatro.',
   'Viernes y sábados 20:30',
   'Portela 1250, CABA',
   -34.6530, -58.5300,
   '',
   (SELECT id FROM categorias WHERE slug = 'cine-teatro'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000006',
   'Museo de la Impresión y la Cultura Popular',
   'museo-imprenta',
   'Museo comunitario que rescata la memoria de la industria gráfico-artística del barrio. Visitas guiadas y talleres.',
   'Lunes a viernes de 9:00 a 17:00',
   'Carhue 3450, CABA',
   -34.6520, -58.5280,
   'https://www.museoimprenta.com.ar/',
   (SELECT id FROM categorias WHERE slug = 'museos'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000007',
   'Centro Cultural Casa de la Cultura',
   'centro-cultural-casa-de-la-cultura',
   'Sede de actividades culturales, exposiciones y reuniones vecinales.',
   'Lunes a domingos de 9:00 a 20:00',
   'Av. Directorio 4500, CABA',
   -34.6500, -58.5260,
   '',
   (SELECT id FROM categorias WHERE slug = 'museos'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000008',
   'Peña de los Borges',
   'pena-borges-mataderos',
   'Peña folklórica con músicos en vivo, milongas y fogones.',
   'Sábados a las 21:00',
   'Chivilcoy 2100, CABA',
   -34.6560, -58.5290,
   '',
   (SELECT id FROM categorias WHERE slug = 'musica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000009',
   'Boliche La Tuerca',
   'boliche-la-tuerca',
   'Centro cultural y boliche con música en vivo, DJ sets y ciclos de tango electrónico.',
   'Viernes y sábados desde las 22:00',
   'Av. Juan B. Justo 6300, CABA',
   -34.6470, -58.5180,
   '',
   (SELECT id FROM categorias WHERE slug = 'musica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000010',
   'Bar El Progreso',
   'bar-el-progreso-mataderos',
   'Bar histórico del barrio, punto de encuentro de vecinos, con facturas y café.',
   'Lunes a domingos de 6:00 a 20:00',
   'Av. Juan B. Justo 5750, CABA',
   -34.6525, -58.5230,
   '',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000011',
   'Pizzería Los Nietos',
   'pizzeria-los-nietos',
   'Pizzería de barrio con masa madre y hornos de leña.',
   'Martes a domingos de 19:00 a 00:00',
   'Carhue 2150, CABA',
   -34.6550, -58.5270,
   '',
   (SELECT id FROM categorias WHERE slug = 'gastronomia'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000012',
   'Club Atlético Atlanta',
   'club-atletico-atlanta',
   'El club del barrio: fútbol, volleyball, pádel y cantina. Alma y vida de Mataderos.',
   'Lunes a domingos de 7:00 a 22:00',
   'Humboldt 325, CABA',
   -34.6013, -58.4494,
   'https://www.clubatleticoatlanta.com/',
   (SELECT id FROM categorias WHERE slug = 'actividad-fisica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('33333333-3333-4333-8333-000000000013',
   'Complejo Deportivo Mataderos',
   'complejo-deportivo-mataderos',
   'Canchas de fútbol 5, pádel y gimnasio. Torneos barriales.',
   'Lunes a domingos de 8:00 a 23:00',
   'Av. Escalada 2100, CABA',
   -34.6580, -58.5340,
   '',
   (SELECT id FROM categorias WHERE slug = 'actividad-fisica'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000014',
   'Escuela Técnica N°20 "Ing. César Ortiz"',
   'escuela-tecnica-20-mataderos',
   'Escuela técnica del barrio con orientación en informática, electrónica y mecánica. Centro de la comunidad.',
   'Lunes a viernes de 7:00 a 20:00',
   'Cura Brunel 3449, CABA',
   -34.6525, -58.5275,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', TRUE),

  ('33333333-3333-4333-8333-000000000015',
   'Biblioteca Popular Juan José Saer',
   'biblioteca-juan-jose-saer',
   'Biblioteca barrial con sala de lectura, computadoras, wifi gratuito y talleres de lectura.',
   'Lunes a viernes de 9:00 a 19:00, sábados de 9:00 a 13:00',
   'Monte Russo 2147, CABA',
   -34.6570, -58.5280,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000016',
   'Centro de Día El Alero',
   'centro-de-dia-el-alero',
   'Talleres productivos, huerta comunitaria y cocina para jóvenes y adultos del barrio.',
   'Lunes a viernes de 9:00 a 17:00',
   'Chivilcoy 850, CABA',
   -34.6540, -58.5310,
   '',
   (SELECT id FROM categorias WHERE slug = 'educacion'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000017',
   'Centro de Jubilados Mataderos',
   'centro-jubilados-mataderos',
   'Centro comunitario para adultos mayores con almuerzo, actividades recreativas y turismo social.',
   'Lunes a viernes de 9:00 a 17:00',
   'Murguiondo 2148, CABA',
   -34.6585, -58.5320,
   '',
   (SELECT id FROM categorias WHERE slug = 'comunitario'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000018',
   'Parroquia San Juan XXIII',
   'parroquia-san-juan-xxiii-mataderos',
   'Parroquia del barrio con misa semanal, grupos juveniles, servicio social y eventos solidarios.',
   'Misas: domingos a las 9:00 y 19:00',
   'Cura Brunel 3049, CABA',
   -34.6535, -58.5265,
   '',
   (SELECT id FROM categorias WHERE slug = 'comunitario'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE),

  ('33333333-3333-4333-8333-000000000019',
   'Parque Lineal de Mataderos',
   'parque-lineal-mataderos',
   'Espacio verde lineal con sendas, bancos y juegos para niños. Ideal para caminar.',
   'Abierto las 24 horas',
   'Av. Juan B. Justo entre Portela y Murguiondo, CABA',
   -34.6545, -58.5255,
   '',
   (SELECT id FROM categorias WHERE slug = 'naturaleza'),
   (SELECT id FROM barrios    WHERE slug = 'mataderos'),
   'publica', FALSE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  horarios = VALUES(horarios),
  direccion = VALUES(direccion),
  lat = VALUES(lat),
  lng = VALUES(lng),
  url = VALUES(url),
  destacado = VALUES(destacado);
