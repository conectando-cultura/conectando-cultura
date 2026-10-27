# Conectando Cultura

Plataforma cultural comunitaria para la Comuna 9 (Liniers, Mataderos y Parque Avellaneda), Ciudad de Buenos Aires.

Mapa interactivo y catálogo de actividades socioculturales — ferias, cines, teatros, museos, bibliotecas, bares notables, parques y más — con registro de vecinos, preferencias personalizadas, reseñas comunitarias, favoritos, roles diferenciados (`usuario`, `gestor`, `admin`) y panel de gestión/administración con monitoreo de infraestructura de datos.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · TypeScript 5.7 · Vite 5.4 · Tailwind CSS v4 + `tokens.css` · React Router 6 · Lucide React · Leaflet + OpenStreetMap |
| Backend | Node.js 18+ · Express 4 · TypeScript 5.7 · `mysql2/promise` |
| Base de datos primaria | **MySQL 8.0+ Local / Servidor Propio** (`mysql/001_schema_y_seed.sql`) |
| Base de datos de respaldo | **Supabase (PostgreSQL)** — Espejo asíncrono en segundo plano + Keep-Alive automático (`SELECT 1` cada 3 días) |
| Geocodificación | Nominatim (OpenStreetMap) |
| Mapas | Leaflet con marcadores temáticos vectoriales por categoría |
| Diseño y Tokens | Sistema de Diseño Croquis + Tokens CSS de alto contraste (WCAG AA/AAA >= 4.8:1) |

---

## Arquitectura de Persistencia: MySQL Primario + Supabase Backup & Keep-Alive

El sistema opera con una arquitectura de doble capa pensada para despliegue en servidor propio sin perder el respaldo en la nube:

1. **Motor Primario — MySQL 8.0+ Local (`backend/src/lib/mysql.ts`)**:
   - Todas las lecturas y escrituras principales de la aplicación (catálogo, actividades, usuarios, sesiones, preferencias, favoritos, reseñas, mensajes de contacto, notificaciones y estado del monitor) se ejecutan contra el pool de conexiones `mysql2/promise`.
2. **Respaldo en la Nube — Supabase (`backend/src/lib/supabase.ts` y `supabase-mirror.ts`)**:
   - Si `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configurados en `.env`, cada alta, edición o baja en MySQL se replica de forma asíncrona (write-behind) hacia Supabase sin bloquear la respuesta al vecino.
   - Además, los usuarios con rol `admin` pueden disparar una **sincronización completa bajo demanda (`MySQL -> Supabase`)** desde el Panel de Administración.
3. **Protección Anti-Pausa en Plan Gratuito — Keep-Alive cada 3 días (`backend/src/services/supabase-monitor.service.ts`)**:
   - El plan gratuito (Free Tier) de Supabase pausa los proyectos tras 7 días sin actividad.
   - `SupabaseMonitorService` ejecuta automáticamente una consulta ultraliviana **`SELECT 1`** cada **3 días (72 horas)** mediante la función RPC `ping_keepalive()` (con fallback transparente a consulta PostgREST sobre `barrios`), registrando fecha/hora del último ping, próximo ping programado, estado y latencia en `ms` en la tabla `sistema_estado_supabase`.

---

## Inicio rápido

### 1. Instalar dependencias

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Inicializar la base de datos primaria MySQL

Asegurate de tener **MySQL 8.0+** corriendo localmente y ejecutá el script unificado de esquema y seed inicial (crea la base `conectando_cultura`, las 11 tablas y carga los 3 barrios de la Comuna 9 — Liniers, Mataderos y Parque Avellaneda —, 9 categorías y actividades iniciales de Mataderos):

```bash
mysql -u root -p < mysql/001_schema_y_seed.sql
```

### 3. Configurar el entorno (`.env`)

```bash
cp .env.example backend/.env
```

Variables principales en `backend/.env` (o `.env` en la raíz):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto HTTP del backend Express (por defecto `3001`) |
| `MYSQL_HOST` | Sí | Host del servidor MySQL local (por defecto `127.0.0.1`) |
| `MYSQL_PORT` | Sí | Puerto MySQL (por defecto `3306`) |
| `MYSQL_USER` | Sí | Usuario de MySQL (por defecto `root`) |
| `MYSQL_PASSWORD` | Segun entorno | Contraseña del usuario MySQL |
| `MYSQL_DATABASE` | Sí | Nombre de la base primaria (por defecto `conectando_cultura`) |
| `SUPABASE_URL` | Opcional (Backup) | URL del proyecto en Supabase (`https://<id>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional (Backup) | Clave `service_role` / `sb_secret_...` para replicación y keep-alive |
| `RESEND_API_KEY` | Opcional | API Key de Resend para alertas por correo |
| `RESEND_FROM_EMAIL` | Opcional | Remitente de notificaciones por correo |

### 4. (Opcional) Configurar migraciones en Supabase para Backup y RPC Keep-Alive

Si utilizás Supabase como base de respaldo, ejecutá en el **SQL Editor** de Supabase:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_contacto_notificaciones.sql`
3. `supabase/migrations/003_roles_y_permisos.sql`
4. `supabase/migrations/004_keepalive_ping.sql` — Crea la función SQL `public.ping_keepalive()` (`SELECT 1`) invocada cada 3 días por el monitor automático.

### 5. Levantar los servidores

```bash
# Terminal 1 — API en http://localhost:3001
cd backend
npm run dev

# Terminal 2 — Frontend en http://localhost:5173
cd frontend
npm run dev
```

El frontend proxea automáticamente las peticiones `/api` al backend en el puerto `3001`.

---

## Scripts

| Comando | Directorio | Descripción |
|---|---|---|
| `npm run dev` | `backend/` | API con recarga automática (`tsx watch`) |
| `npm run build` | `backend/` | Compila TypeScript a `dist/` |
| `npm run typecheck` | ambos | Verificación estricta de tipos (`tsc --noEmit`) |
| `npm run dev` | `frontend/` | Servidor de desarrollo Vite en `:5173` |
| `npm run build` | `frontend/` | Compilación de producción (`tsc --noEmit && vite build`) |
| `npm run sin-emojis` | `frontend/` | Linter que audita cero emojis en `frontend/src/` |
| `npm run preview` | `frontend/` | Previsualiza el build de producción |

---

## Roles, Permisos y Monitor de Base de Datos (Exclusivo Admin)

El sistema implementa control de acceso basado en roles (RBAC):
- **Usuario (`usuario`)**: Vecino registrado. Puede explorar, guardar preferencias, marcar favoritos y publicar reseñas.
- **Gestor (`gestor`)**: Gestor cultural o comunitario. Acceso al panel (`/admin`) para crear, editar y administrar actividades culturales.
- **Administrador (`admin`)**: Superadministrador. Acceso total a gestión de usuarios, asignación de roles y al **Monitor de Estado de Base de Datos y Keep-Alive de Supabase** en el Dashboard (`/admin`):
  - Visualiza estado y latencia en `ms` de **MySQL Local (Primaria)** y **Supabase (Backup)**.
  - Muestra la política activa de protección anti-pausa (**`SELECT 1` cada 3 días / 72 h**), fecha del último ping, próximo ping programado y estadísticas de replicación.
  - Permite disparar manualmente **"Enviar SELECT 1 ahora"** y **"Sincronizar MySQL a Supabase"**.

---

## Endpoints de la API

Base: `/api` (en desarrollo, `http://localhost:3001/api`).

### Autenticación
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | No | Crear cuenta |
| POST | `/api/auth/login` | No | Iniciar sesión (token Bearer) |
| GET | `/api/auth/me` | Sí | Perfil y rol del usuario actual |
| POST | `/api/auth/logout` | Sí | Cerrar sesión activa |

### Catálogo, Favoritos, Reseñas y Contacto
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/actividades` | No | Listar actividades públicas (filtros: `barrio`, `categorias`, `q`, `destacados`, `limite`) |
| GET | `/api/actividades/barrios` | No | Listar barrios disponibles |
| GET | `/api/actividades/categorias` | No | Listar categorías culturales |
| GET | `/api/actividades/:barrioSlug/:slug` | No | Detalle de una actividad |
| GET | `/api/favoritos` | Sí | Actividades favoritas del vecino |
| GET | `/api/resenas/:actividadId` | No | Reseñas y promedio de calificación |
| POST | `/api/resenas/:actividadId` | Sí | Publicar reseña (1 a 5) |
| POST | `/api/contacto` | No | Enviar mensaje de contacto o sugerencia |
| GET | `/api/estado` | No | Health check (`baseDeDatosPrimaria: "mysql"`, `backupSupabase`) |

### Preferencias
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/preferencias` | Sí | Preferencias del vecino autenticado |
| PUT | `/api/preferencias` | Sí | Actualizar barrio y categorías de interés |

### Gestión y Administración (`gestor` o `admin`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/api/actividades/admin/todas` | `gestor` | Listado paginado de actividades (incluye inactivas) |
| POST | `/api/actividades` | `gestor` | Crear nueva actividad |
| PATCH | `/api/actividades/:id` | `gestor` | Editar actividad existente |
| DELETE | `/api/actividades/:id` | `gestor` | Desactivar actividad |
| PATCH | `/api/actividades/:id/reactivar` | `gestor` | Reactivar actividad |
| GET | `/api/admin/estadisticas` | `gestor` | Métricas operativas del catálogo y usuarios |
| GET | `/api/admin/usuarios` | `admin` | Listar usuarios del sistema |
| PATCH | `/api/admin/usuarios/:id/rol` | `admin` | Cambiar rol de usuario (`usuario`, `gestor`, `admin`) |
| DELETE | `/api/admin/usuarios/:id/sesiones` | `admin` | Revocar sesiones activas de un usuario |
| GET | `/api/admin/sistema/estado-bd` | `admin` | Estado de MySQL primario, backup Supabase y keep-alive `SELECT 1` |
| POST | `/api/admin/sistema/supabase-ping` | `admin` | Ejecutar ping `SELECT 1` manual contra Supabase |
| POST | `/api/admin/sistema/supabase-sync` | `admin` | Sincronizar todas las tablas de MySQL hacia Supabase |

---

## Diseño y Accesibilidad

- **Tokens de diseño:** Definidos en [`frontend/src/tokens.css`](./frontend/src/tokens.css) en coexistencia con Tailwind CSS v4 (`brand-*`), garantizando ratios de contraste WCAG AA/AAA.
- **Iconografía formal:** Integrada mediante `lucide-react` con asignación semántica según la naturaleza de la actividad (cero emojis en interfaz).
- **Marcadores dinámicos:** Pines vectoriales de mapa Leaflet adaptados a la categoría de cada evento o institución.

---

## Documentación

- [`AGENTS.md`](./AGENTS.md) — Reglas, arquitectura y convenciones para agentes de desarrollo.
- [`frontend/AGENTS.md`](./frontend/AGENTS.md) — Reglas específicas del sistema de diseño Croquis y puertas de calidad de frontend.
- [`conectando-cultura-docs/`](./conectando-cultura-docs/) — Paquete de planificación detallada (flujos, sistema visual, wireframes y contratos de API).
