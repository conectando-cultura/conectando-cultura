# AGENTS.md — Conectando Cultura

> **Proyecto**: Integrador III — Escuela Técnica N°20 DE 20 "Carolina Muzilli" (Polo Educativo de Mataderos).
> Plataforma sociocultural para vecinos de Mataderos y barrios linderos, CABA.
> **Estado**: Sprints 1-4 completados (auth, catálogo, mapa, preferencias, panel admin).

---

## Stack

- **Frontend:** React 18 + TypeScript 5.7 + Vite 5.4 + react-router-dom 6 + Leaflet (`frontend/`)
- **Backend:** Node.js + Express 4 + TypeScript 5.7 (`backend/`)
- **Persistencia:** Supabase (PostgreSQL), única fuente de verdad. **No hay fallback local.**
- **API:** REST. El frontend proxea `/api` al backend por Vite (`vite.config.ts`).
- **Auth:** scrypt (`services/password.ts`) + token Bearer aleatorio de 64 chars hex / 7 días. **No se usa Supabase Auth.**

---

## Persistencia: sólo Supabase

El proyecto usa Supabase (PostgreSQL) como **única** fuente de datos. Ya no hay
repositorio local en JSON: `backend/data/` y `local-data.repository.ts` se eliminaron.

Consecuencias:

- Los servicios (`actividades.service.ts`, `preferencias.service.ts`, `admin.routes.ts`)
  llaman a Supabase directamente y propagan el error. No hay `catch` que caiga a otro
  backend: un fallo de base es un 500, no un "resultado falso".
- `exigirSupabase()` se llama al arrancar y en cada servicio. Si faltan credenciales,
  el proceso muere en el boot con un mensaje explicativo, en vez de fallar en el primer
  request.
- Los errores de PostgREST se traducen a mensajes legibles (`describirError`) en vez de
  exponer "fetch failed" al cliente.
- Las sesiones viven en la tabla `sesiones`, no en memoria: reiniciar el backend ya no
  expulsa a los usuarios.

---

## Estructura

```
backend/src/
  index.ts                     # Express app, puerto 3001
  types.ts                     # Usuario, UsuarioPublico, Sesion, ErrorAplicacion
  types-db.ts                  # Tipos del schema Supabase (barrio_id, no vecind_id)
  lib/supabase.ts              # Carga .env, esSupabaseConfigurado(), exigirSupabase()
  middlewares/autenticacion.middleware.ts
                               #   autenticacionRequerida(auth) -> adjunta req.usuarioPublico
                               #   adminRequerido -> 403 si el rol no es "admin"
  repositories/
    usuario.repository.ts      # UsuarioRepository + SesionRepository (Supabase)
  services/
    auth.service.ts            # Validación de registro/login, sin acceso a HTTP
    password.ts                # hashContrasena / verificarContrasena (scrypt + timingSafeEqual)
    actividades.service.ts     # Listado, filtros, CRUD
    preferencias.service.ts    # Lectura/escritura de preferencias del usuario
  routes/
    auth.routes.ts             # /api/auth/{registro,login,me,logout}
    actividades.routes.ts      # /api/actividades/*  (GET público, escritura admin)
    preferencias.routes.ts     # /api/preferencias  (GET/PUT, requiere auth)
    admin.routes.ts            # /api/admin/*        (requiere auth + rol admin)

frontend/src/
  main.tsx, App.tsx            # Router + Layout (Navbar / Routes / Footer)
  tipos.ts                     # Categoria, Barrio, Actividad, Preferencias
  api/
    client.ts                  # ÚNICO cliente HTTP (fetch + manejo de errores)
    actividades.ts             # Wrappers tipados sobre client.ts
  contexto/AuthContext.tsx     # Única fuente de sesión (token en localStorage "cc_token")
  componentes/
    Navbar.tsx                 # Enlace "Admin" visible sólo para rol admin
    MapaLeaflet.tsx            # Mapa con marcadores por categoría
    ActividadCard.tsx, Filtros.tsx
  paginas/
    Inicio, Login, Registro, Bienvenido           # públicas / auth
    Mapa, Actividades                             # públicas
    Preferencias                                  # requiere auth
    AdminActividades                              # requiere auth + rol admin
    Protegida.tsx, ProtegidaAdmin.tsx             # guardas de ruta
```

---

## Comandos

```bash
# Backend -> http://localhost:3001
cd backend && npm install
npm run dev         # tsx watch src/index.ts
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/

# Frontend -> http://localhost:5173 (proxy /api -> :3001)
cd frontend && npm install
npm run dev         # vite
npm run typecheck   # tsc --noEmit
npm run build       # tsc --noEmit && vite build
```

## Variables de entorno

`backend/.env` (o `.env` en la raíz, según dónde se ejecute):

```env
PORT=3001
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Las dos variables son obligatorias.** Sin ellas —o con una clave publicable
(`sb_publishable_`) en vez de la service role— el backend se niega a arrancar y
explica por qué.

El backend carga el `.env` por su cuenta (`lib/supabase.ts`); no hace falta
`--env-file` ni `dotenv`. Las variables ya presentes en el entorno real tienen
prioridad sobre el archivo.

---

## Base de datos

Migraciones en `supabase/migrations/`, en orden:

| Archivo | Qué hace |
|---|---|
| `001_initial_schema.sql` | Tablas `barrios`, `categorias`, `usuarios`, `sesiones`, `actividades`, `preferencias_usuario`; índices; trigger `updated_at`; RLS; seed de 6 barrios, 9 categorías y 30 actividades. |
| `002_contacto_notificaciones.sql` | `mensajes_contacto` y `notificaciones` (Sprint 8), con índice de deduplicación de avisos. |

Ejecutar desde el dashboard de Supabase → SQL Editor, o `supabase db push`.

**Puntos que ya están resueltos y conviene no volver a romper:**

- Los ids de usuario son `TEXT`, no `UUID`. El generador actual produce `u<epoch>` y la
  autenticación es propia. Cambiarlo a UUID rompe los inserts.
- La tabla de barrios se llama `barrios` con columna `barrio_id`. El código la consulta
  con esos nombres.
- No hay trigger sobre `auth.users`: ese esquema no existe en este proyecto. Las
  preferencias se crean con `upsert` desde `preferencias.service.ts`.
- El backend usa la **service role key**, que ignora RLS. El control de acceso real está en
  el middleware. Las políticas RLS son defensa en profundidad frente a la anon key.

---

## Convenciones

- TypeScript `strict: true` en ambos proyectos. El frontend además tiene
  `noUnusedLocals` / `noUnusedParameters`.
- **Nada de `any`.** Usar `unknown` + type narrowing, o un `Record<string, unknown>`
  acotado cuando se accede a algo de librerías externas sin tipar.
- Español en identificadores, comentarios y mensajes de API (`{ mensaje }`).
- Cohesión alta / acoplamiento bajo: las páginas sólo usan `useAuth()` + `api/`;
  las rutas sólo delegan a un servicio; los repositorios aíslan la persistencia.
- DTOs: nunca exponer `contrasenaHash`. Todo pasa por `aPublico()`.
- Design System: 60-30-10, blanco / naranja `#F98017` / amarillo `#FBC02D`, Poppins,
  botones redondeados, mobile-first.

---

## Reglas para agentes

1. Correr `npx tsc --noEmit` en `backend/` y `frontend/` **antes y después** de tocar
   TypeScript.
2. Si tocás el schema, actualizá `backend/src/types-db.ts` en el mismo cambio: los tipos
  derivados son la única forma de que el typecheck detecte el desalineamiento.
3. No reintroducir un fallback de datos. Si Supabase falla, el error sube al cliente:
   un sistema que "funciona" con datos de mentira esconde el problema hasta producción.
4. No tocar la seguridad: scrypt + tokens Bearer, y no loguear ni devolver secretos.
5. Al agregar un endpoint: ruta en `routes/`, lógica en `services/`, validaciones de
   entrada, y middlewares `autenticacionRequerida` / `adminRequerido` según corresponda.
6. Commits en español, formato `sprint(N): descripcion`.

---

## Verificación rápida

```bash
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# API real (con el backend corriendo en :3001)
curl http://localhost:3001/api/estado
curl http://localhost:3001/api/actividades
curl http://localhost:3001/api/actividades/barrios
curl http://localhost:3001/api/actividades/categorias

# Con token (registro/login primero)
curl http://localhost:3001/api/preferencias -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3001/api/preferencias \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"barrioId":null,"categoriaIds":[]}'
```
