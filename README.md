# Conectando Cultura 🌿

Plataforma cultural comunitaria para los barrios de Mataderos y alrededores, Ciudad de Buenos Aires.

Mapa interactivo y catálogo de actividades socioculturales — ferias, cines, teatros, museos,
bibliotecas, bares notables, parques y más — con registro de vecinos, preferencias
personalizadas y un panel de administración para mantener el catálogo al día.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · TypeScript 5.7 · Vite 5.4 · React Router 6 · Leaflet + OpenStreetMap |
| Backend | Node.js 18+ · Express 4 · TypeScript 5.7 |
| Base de datos | Supabase (PostgreSQL) — única fuente de persistencia |
| Geocodificación | Nominatim (OpenStreetMap) — sin API key |
| Mapas | Leaflet con capas de Google Maps y OpenStreetMap |

---

## Inicio rápido

### 1. Instalar dependencias

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configurar el entorno

```bash
cp .env.example backend/.env
# Editar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
```

**Obligatorio.** El backend usa Supabase como única fuente de datos: sin esas dos
variables se niega a arrancar y lo explica. La clave tiene que ser la **service role**
(del panel: Settings → API → *service_role*, o `sb_secret_...` en el panel nuevo), no la
publicable/anon — la publicable no salta RLS y el backend no podría leer ni escribir.

El backend carga el `.env` por su cuenta, no hace falta `--env-file` ni `dotenv`.

### 3. Levantar los servidores

```bash
# Terminal 1 — API en http://localhost:3001
cd backend
npm run dev

# Terminal 2 — Frontend en http://localhost:5173
cd frontend
npm run dev
```

Abrí <http://localhost:5173>. El frontend proxea `/api` al backend automáticamente.

### 4. Crear el schema

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Ejecutá `supabase/migrations/001_initial_schema.sql` y luego
   `supabase/migrations/002_contacto_notificaciones.sql` desde **SQL Editor**.
3. Poné `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `backend/.env`.
4. Reiniciá el backend.

La migración 001 incluye el seed: 6 barrios, 9 categorías y 30 actividades de Mataderos,
así que la API devuelve contenido apenas se levanta.

---

## Scripts

| Comando | Directorio | Descripción |
|---|---|---|
| `npm run dev` | `backend/` | API con recarga automática (tsx watch) |
| `npm run build` | `backend/` | Compila TypeScript a `dist/` |
| `npm run typecheck` | ambos | `tsc --noEmit` |
| `npm run dev` | `frontend/` | Vite dev server en :5173 |
| `npm run build` | `frontend/` | `tsc --noEmit && vite build` |
| `npm run preview` | `frontend/` | Sirve el build de producción |

---

## Endpoints de la API

Base: `/api` (en desarrollo, `http://localhost:3001/api`).

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | No | Crear cuenta |
| POST | `/api/auth/login` | No | Iniciar sesión (devuelve token Bearer) |
| GET | `/api/auth/me` | Sí | Datos del usuario de la sesión |
| POST | `/api/auth/logout` | Sí | Cerrar sesión |

### Catálogo (lectura pública)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/actividades` | No | Listar actividades. Filtros: `barrioSlug`, `categoriaSlug`, `limite` |
| GET | `/api/actividades/barrios` | No | Listar barrios |
| GET | `/api/actividades/categorias` | No | Listar categorías con color e ícono |
| GET | `/api/actividades/:slug/:barrioSlug` | No | Detalle de una actividad |
| GET | `/api/estado` | No | Health check |

### Preferencias

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/preferencias` | Sí | Preferencias del usuario actual |
| PUT | `/api/preferencias` | Sí | Guardar barrio y categorías |

### Administración (requiere rol `admin`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/actividades?admin=true` | Sí | Listar también las inactivas |
| POST | `/api/actividades` | Sí | Crear actividad |
| PATCH | `/api/actividades/:id` | Sí | Editar actividad |
| DELETE | `/api/actividades/:id` | Sí | Baja lógica (`activo = false`) |
| GET | `/api/admin/estadisticas` | Sí | Métricas del sistema |
| GET | `/api/admin/usuarios` | Sí | Listar usuarios |
| PATCH | `/api/admin/usuarios/:id/rol` | Sí | Cambiar rol (`usuario` / `admin`) |

Respuesta de error estándar: `{ "mensaje": "..." }` con código HTTP 400 / 401 / 403 / 404 / 500.

---

## Seguridad

- **Contraseñas:** scrypt con sal de 16 bytes y comparación con `timingSafeEqual`.
  Nunca se devuelven los hashes: todo sale por `aPublico()`.
- **Sesiones:** token Bearer de 64 caracteres hex, generado con `crypto.randomUUID()`,
  con vigencia de 7 días.
- **RBAC:** `autenticacionRequerida` adjunta el usuario a la petición; `adminRequerido`
  responde 403 si el rol no es `admin`. El panel `/admin` además tiene guarda de ruta en
  el frontend.
- **RLS:** activo en todas las tablas. El backend usa la service role key (que ignora RLS),
  por lo que el control efectivo está en el middleware; las políticas protegen frente a
  un uso accidental de la anon key.
- **Validación:** todas las entradas se validan en los servicios, no en las rutas.

---

## Estructura

```
.
├── backend/          API Express + TypeScript
│   └── src/          routes / services / repositories / middlewares / lib
├── frontend/         SPA React + Vite
│   └── src/          paginas / componentes / contexto / api
├── supabase/
│   └── migrations/   Esquema, RLS y seed
├── docs/README.md    Documentación técnica extendida
└── AGENTS.md         Guía para agentes de desarrollo
```

---

## Estado del proyecto

Sprint 1 (auth) a Sprint 4 (panel admin + geolocalización) completados y verificados.

Pendiente, en el backlog del curso: alertas por correo electrónico (Resend), formulario
de contacto, code splitting y auditoría Lighthouse. El schema de `mensajes_contacto` y
`notificaciones` ya está preparado en la migración 002.

---

## Documentación

- [`AGENTS.md`](./AGENTS.md) — arquitectura, convenciones y reglas para agentes
- [`docs/README.md`](./docs/README.md) — referencia técnica detallada
- Bitácoras de sprint en la raíz (`Sprint *- Desarrollo.md`)
