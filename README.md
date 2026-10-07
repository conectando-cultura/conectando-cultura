# Conectando Cultura

Plataforma cultural comunitaria para los barrios de Mataderos y alrededores, Ciudad de Buenos Aires.

Mapa interactivo y catálogo de actividades socioculturales — ferias, cines, teatros, museos, bibliotecas, bares notables, parques y más — con registro de vecinos, preferencias personalizadas, roles diferenciados y panel de gestión/administración para mantener la oferta cultural al día.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · TypeScript 5.7 · Vite 5.4 · React Router 6 · Lucide React · Leaflet + OpenStreetMap |
| Backend | Node.js 18+ · Express 4 · TypeScript 5.7 |
| Base de datos | Supabase (PostgreSQL) — única fuente de persistencia (sin fallback local) |
| Geocodificación | Nominatim (OpenStreetMap) |
| Mapas | Leaflet con marcadores temáticos vectoriales por categoría |
| Diseño y Tokens | Tokens CSS de alto contraste (WCAG AA/AAA, paleta institucional CABA/Mataderos) |

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
# Configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
```

**Obligatorio.** El backend usa Supabase como única fuente de datos. Requiere la clave **service role** (`sb_secret_...` o `service_role` del dashboard de Supabase).

### 3. Levantar los servidores

```bash
# Terminal 1 — API en http://localhost:3001
cd backend
npm run dev

# Terminal 2 — Frontend en http://localhost:5173
cd frontend
npm run dev
```

El frontend proxea automáticamente las peticiones `/api` al backend en el puerto 3001.

### 4. Crear o actualizar el esquema de base de datos

Desde el **SQL Editor** de Supabase, ejecutar en orden:
1. `supabase/migrations/001_initial_schema.sql` (esquema inicial, categorías, barrios, actividades seed).
2. `supabase/migrations/002_contacto_notificaciones.sql` (notificaciones y mensajes).
3. `supabase/migrations/003_roles_y_permisos.sql` (roles `usuario`, `gestor`, `admin` y permisos granulares).

---

## Scripts

| Comando | Directorio | Descripción |
|---|---|---|
| `npm run dev` | `backend/` | API con recarga automática (`tsx watch`) |
| `npm run build` | `backend/` | Compila TypeScript a `dist/` |
| `npm run typecheck` | ambos | Verificación de tipos (`tsc --noEmit`) |
| `npm run dev` | `frontend/` | Servidor de desarrollo Vite en `:5173` |
| `npm run build` | `frontend/` | Compilación de producción (`tsc --noEmit && vite build`) |
| `npm run sin-emojis` | `frontend/` | Linter que audita la ausencia de emojis en el código |
| `npm run preview` | `frontend/` | Previsualiza el build de producción |

---

## Roles y Permisos

El sistema contempla control de acceso basado en roles (RBAC):
- **Usuario (`usuario`)**: Vecino registrado. Puede explorar, guardar preferencias y marcar actividades.
- **Gestor (`gestor`)**: Gestor cultural o comunitario. Acceso al panel para crear y editar actividades culturales.
- **Administrador (`admin`)**: Superadministrador. Gestión integral de usuarios, asignación de roles, métricas completas y actividades.

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

### Catálogo y Actividades
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/actividades` | No | Listar actividades públicas (filtros: `barrioSlug`, `categoriaSlug`, `limite`) |
| GET | `/api/actividades/barrios` | No | Listar barrios disponibles |
| GET | `/api/actividades/categorias` | No | Listar categorías culturales |
| GET | `/api/actividades/:slug/:barrioSlug` | No | Detalle de una actividad |
| GET | `/api/estado` | No | Health check |

### Preferencias
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/preferencias` | Sí | Preferencias del vecino autenticado |
| PUT | `/api/preferencias` | Sí | Actualizar barrio y categorías de interés |

### Gestión y Administración (requiere `gestor` o `admin`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/api/actividades?admin=true` | `gestor` | Listado ampliado (incluye inactivas) |
| POST | `/api/actividades` | `gestor` | Crear nueva actividad |
| PATCH | `/api/actividades/:id` | `gestor` | Editar actividad existente |
| DELETE | `/api/actividades/:id` | `admin` | Baja lógica de actividad |
| GET | `/api/admin/estadisticas` | `gestor` | Métricas de actividades y catálogo |
| GET | `/api/admin/usuarios` | `admin` | Listar usuarios del sistema |
| PATCH | `/api/admin/usuarios/:id/rol` | `admin` | Cambiar rol de usuario (`usuario`, `gestor`, `admin`) |

---

## Diseño y Accesibilidad

- **Tokens de diseño:** Definidos en [`frontend/src/tokens.css`](./frontend/src/tokens.css), garantizando ratios de contraste WCAG AA/AAA.
- **Iconografía formal:** Integrada mediante `lucide-react` con asignación semántica según la naturaleza de la actividad (sin emojis en interfaz).
- **Marcadores dinámicos:** Pines vectoriales de mapa Leaflet adaptados a la categoría de cada evento o institución.

---

## Documentación

- [`AGENTS.md`](./AGENTS.md) — Reglas, arquitecturas y convenciones para agentes de desarrollo.
- [`conectando-cultura-docs/`](./conectando-cultura-docs/) — Paquete de planificación detallada (flujos, sistema visual, wireframes y contratos de API).
