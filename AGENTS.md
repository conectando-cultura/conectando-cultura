# AGENTS.md — Conectando Cultura

> **Proyecto**: Integrador III — Escuela Técnica N°20 DE 20 "Carolina Muzilli" (Polo Educativo de Mataderos).
> Plataforma sociocultural para vecinos de la Comuna 9 (Liniers, Mataderos y Parque Avellaneda), CABA.
> **Estado**: Sprints 1-4 completados + Rediseño Croquis + Persistencia primaria en MySQL 8.0+ con Backup y Keep-Alive en Supabase.

---

## Stack

- **Frontend:** React 18 + TypeScript 5.7 + Vite 5.4 + Tailwind CSS v4 (`@tailwindcss/postcss`) + `tokens.css` (Opción A: coexistencia con CSS Modules) + react-router-dom 6 + Lucide React + Leaflet (`frontend/`)
- **Backend:** Node.js + Express 4 + TypeScript 5.7 + `mysql2/promise` (`backend/`)
- **Persistencia Primaria:** **MySQL 8.0+ Local / Servidor Propio** (`backend/src/lib/mysql.ts`, esquema e inicialización en `mysql/001_schema_y_seed.sql`).
- **Persistencia de Respaldo y Keep-Alive:** **Supabase (PostgreSQL)** (`backend/src/lib/supabase.ts`, `backend/src/lib/supabase-mirror.ts`, `backend/src/services/supabase-monitor.service.ts`). Espejo asíncrono en segundo plano + consulta automática `SELECT 1` cada 3 días (72 h) para evitar pausa por inactividad en el plan gratuito.
- **API:** REST. El frontend proxea `/api` al backend por Vite (`vite.config.ts`).
- **Auth & RBAC:** scrypt (`services/password.ts`) + token Bearer aleatorio de 64 chars hex / 7 días. Roles: `usuario`, `gestor`, `admin`. **No se usa Supabase Auth.**

---

## Arquitectura de Persistencia: MySQL Primario + Supabase Backup

1. **MySQL 8.0+ como fuente primaria de verdad (`backend/src/lib/mysql.ts`)**:
   - Todos los repositorios y servicios (`usuario.repository.ts`, `actividades.service.ts`, `preferencias.service.ts`, `favoritos.service.ts`, `resenas.service.ts`, `contacto.service.ts`, `notificaciones.service.ts`, `admin.routes.ts`) leen y escriben directamente contra `mysqlPool` (`ejecutarConsulta` / `ejecutarComando`).
   - `exigirMysql()` se valida en el arranque del servidor.
   - Los errores de MySQL/InnoDB se traducen a mensajes claros en español mediante `describirErrorMysql()`.
2. **Supabase como espejo asíncrono de respaldo (`backend/src/lib/supabase-mirror.ts`)**:
   - Cuando `esSupabaseConfigurado()` es `true`, cada escritura confirmada en MySQL dispara `replicarEnSupabase(operacion, fn)` en segundo plano (write-behind), sin bloquear ni hacer fallar la petición principal si Supabase está temporalmente inaccesible.
3. **Keep-Alive cada 3 días (`SELECT 1`) y Sincronización Manual (`backend/src/services/supabase-monitor.service.ts`)**:
   - `iniciarSchedulerKeepAlive()` verifica al iniciar y cada 1 hora si transcurrieron `INTERVALO_KEEPALIVE_MS` (3 días = 72 horas) desde `ultimo_ping_en` en la tabla `sistema_estado_supabase` (`id = 1`).
   - `ejecutarPingKeepAlive()` invoca `supabaseAdmin.rpc("ping_keepalive")` (`SELECT 1` definido en `supabase/migrations/004_keepalive_ping.sql`) y, si la función RPC aún no existe (`PGRST202`), hace fallback automático a una consulta `HEAD` liviana sobre `barrios`.
   - `sincronizarMysqlASupabase()` permite al SuperAdmin (`rol === "admin"`) volcar todas las tablas de MySQL hacia Supabase respetando el orden de claves foráneas.

---

## Estructura

```
mysql/
  001_schema_y_seed.sql        # Esquema completo MySQL 8.0+ (11 tablas) + seed de Comuna 9

supabase/migrations/
  001_initial_schema.sql       # Esquema PostgreSQL inicial + seed
  002_contacto_notificaciones.sql
  003_roles_y_permisos.sql
  004_keepalive_ping.sql       # Función RPC public.ping_keepalive() -> SELECT 1

backend/src/
  index.ts                     # Express app, puerto 3001, exigirMysql(), iniciarSchedulerKeepAlive()
  types.ts                     # Usuario, UsuarioPublico, Sesion, ErrorAplicacion, permisos RBAC
  types-db.ts                  # Tipos de entidades de base de datos y DTOs públicos
  lib/
    mysql.ts                   # Pool mysql2/promise, ejecutarConsulta, ejecutarComando, verificarConexionMysql
    supabase.ts                # Carga .env, esSupabaseConfigurado(), exigirSupabase(), supabaseAdmin
    supabase-mirror.ts         # replicarEnSupabase() y métricas de replicación asíncrona
  middlewares/
    autenticacion.middleware.ts # autenticacionRequerida(auth), permisoRequerido(permiso), adminRequerido
  repositories/
    usuario.repository.ts      # UsuarioRepository + SesionRepository (MySQL + espejo Supabase)
  services/
    auth.service.ts            # Validación de registro/login y gestión de sesiones/roles
    password.ts                # hashContrasena / verificarContrasena (scrypt + timingSafeEqual)
    actividades.service.ts     # Listado, filtros, CRUD y geocodificación (MySQL + espejo Supabase)
    preferencias.service.ts    # Lectura/escritura de preferencias (MySQL + espejo Supabase)
    favoritos.service.ts       # Favoritos de vecinos (MySQL + espejo Supabase)
    resenas.service.ts         # Reseñas y calificaciones (MySQL + espejo Supabase)
    contacto.service.ts        # Mensajes de contacto (MySQL + espejo Supabase)
    notificaciones.service.ts  # Alertas por correo Resend + bitácora (MySQL + espejo Supabase)
    supabase-monitor.service.ts # Keep-Alive SELECT 1 cada 3 días, estado BD y sync MySQL -> Supabase
  routes/
    auth.routes.ts             # /api/auth/{registro,login,me,logout}
    actividades.routes.ts      # /api/actividades/*
    preferencias.routes.ts     # /api/preferencias
    favoritos.routes.ts        # /api/favoritos
    resenas.routes.ts          # /api/resenas
    contacto.routes.ts         # /api/contacto
    admin.routes.ts            # /api/admin/* (estadisticas, usuarios, sistema/estado-bd, supabase-ping, supabase-sync)

frontend/src/
  main.tsx, App.tsx            # Router + Layout (Navbar / Routes / Footer)
  tokens.css, index.css        # Tokens CSS + Tailwind CSS v4 (Opción A coexistencia)
  tipos.ts                     # Categoria, Barrio, Actividad, Preferencias, Resena
  api/
    client.ts                  # ÚNICO cliente HTTP (fetch + manejo de errores)
    actividades.ts             # Wrappers tipados de catálogo, favoritos, reseñas y contacto
    admin.ts                   # Wrappers de administración y monitor de BD / Keep-Alive Supabase
  contexto/AuthContext.tsx     # Única fuente de sesión (token en localStorage "cc_token")
  componentes/
    Navbar.tsx                 # Navegación + acceso a Panel según permisos RBAC
    MapaLeaflet.tsx            # Mapa interactivo con marcadores SVG por categoría
    ActividadCard.tsx, CategoriaChip.tsx, PinCategoria.tsx, iconos.tsx
    base/                      # Primitivos UI (Boton, Tarjeta, Campo, Badge, BarraConfirmacion, etc.)
    panel/                     # LayoutPanel
  paginas/
    Inicio, Explorar, DetalleActividad            # públicas / catálogo y mapa
    Login, Registro, Bienvenido                   # auth y onboarding
    Preferencias, Protegida.tsx                   # requiere auth
    panel/                                        # Dashboard (con monitor BD para admin), AdminActividades, AdminUsuarios
```

---

## Comandos

```bash
# Inicializar MySQL 8.0+ local
mysql -u root -p < mysql/001_schema_y_seed.sql

# Backend -> http://localhost:3001
cd backend && npm install
npm run dev         # tsx watch src/index.ts
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/

# Frontend -> http://localhost:5173 (proxy /api -> :3001)
cd frontend && npm install
npm run dev         # vite
npm run typecheck   # tsc --noEmit
npm run sin-emojis  # verifica cero emojis en frontend/src
npm run build       # tsc --noEmit && vite build
```

## Variables de entorno

`backend/.env` (o `.env` en la raíz):

```env
PORT=3001

# Base de datos primaria: MySQL 8.0+
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=conectando_cultura

# Base de datos de respaldo (Backup & Keep-Alive cada 3 días): Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

El backend carga el `.env` automáticamente (`lib/supabase.ts`); no hace falta `--env-file` ni `dotenv`.

---

## Base de datos

### 1. MySQL 8.0+ (Primaria)
- `mysql/001_schema_y_seed.sql`: crea la base `conectando_cultura`, las 10 tablas de dominio (`barrios`, `categorias`, `usuarios`, `sesiones`, `actividades`, `preferencias_usuario`, `mensajes_contacto`, `notificaciones`, `favoritos_usuario`, `resenas`), la tabla de control `sistema_estado_supabase` (`id = 1`) y carga el seed completo de Comuna 9.

### 2. Supabase / PostgreSQL (Backup & Keep-Alive)
| Archivo | Qué hace |
|---|---|
| `001_initial_schema.sql` | Tablas iniciales, índices, trigger `updated_at`, RLS y seed en PostgreSQL. |
| `002_contacto_notificaciones.sql` | `mensajes_contacto` y `notificaciones`. |
| `003_roles_y_permisos.sql` | Columna `rol` en `usuarios`, índices y alineación de íconos. |
| `004_keepalive_ping.sql` | Función SQL `public.ping_keepalive()` (`SELECT 1`) para el keep-alive cada 3 días. |

---

## Convenciones

- TypeScript `strict: true` en ambos proyectos. El frontend además tiene `noUnusedLocals` / `noUnusedParameters`.
- **Nada de `any`.** Usar `unknown` + type narrowing o interfaces tipadas (`RowDataPacket`).
- Español en identificadores, comentarios y mensajes de API (`{ mensaje }`).
- Cohesión alta / acoplamiento bajo: las páginas sólo usan `useAuth()` + `api/`; las rutas sólo delegan a un servicio; los repositorios aíslan la persistencia.
- DTOs: nunca exponer `contrasenaHash`. Todo pasa por `aPublico()`.
- Design System (Croquis + Opción A): paleta cálida editorial (`brand-orange` `#FF8F50`, `brand-orange-light` `#FFAA5C`, `brand-ink` `#1B160E`, `brand-bg` `#F4F4F4`, `brand-white` `#FEFEFE`), jerarquía tipográfica `Kavoon` (`font-display`) / `Poppins` (`font-sans`) / `Montserrat` (`font-body`), bordes `rounded-3xl` / `rounded-full`, contraste dinámico WCAG >= 4.8:1 en categorías (`colorCategoria.ts`) y política de cero emojis (`npm run sin-emojis`).

---

## Gobernanza Multi-Agente (Rediseño UI Croquis)

1. **Reglas contextuales de Frontend**: leer `frontend/AGENTS.md` antes de editar cualquier archivo en `frontend/`.
2. **Skills de proyecto obligatorias** (registradas en `.atl/skill-registry.md`):
   - `.agents/skills/croquis-design-system/SKILL.md`
   - `.agents/skills/domain-ui-adapters/SKILL.md`
   - `.opencode/skills/typescript-magician/SKILL.md`

---

## Reglas para agentes

1. Correr `npx tsc --noEmit` en `backend/` y `frontend/` **antes y después** de tocar TypeScript, y `npm run sin-emojis` en `frontend/` al tocar componentes UI.
2. Si tocás el schema, actualizá `mysql/001_schema_y_seed.sql` y `backend/src/types-db.ts` en el mismo cambio.
3. Mantener la exclusividad RBAC (`permisoRequerido("usuarios:gestionar")` en backend y `esAdmin` en frontend) para las rutas y controles de infraestructura `/api/admin/sistema/*`.
4. No tocar la seguridad: scrypt + tokens Bearer, y no loguear ni devolver secretos.
