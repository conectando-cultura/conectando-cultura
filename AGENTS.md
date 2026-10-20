# AGENTS.md — Conectando Cultura

> **Proyecto**: Integrador III — Escuela Técnica N°20 DE 20 "Carolina Muzilli" (Polo Educativo de Mataderos).
> Plataforma sociocultural para vecinos de Mataderos y barrios linderos, CABA.
> **Estado**: Sprints 1-4 completados (auth, catálogo, mapa, preferencias, panel admin).

---

## Stack

- **Frontend:** React 18 + TypeScript 5.7 + Vite 5.4 + Tailwind CSS v4 (`@tailwindcss/postcss`) + `tokens.css` (Opción A: coexistencia con CSS Modules) + react-router-dom 6 + Lucide React + Leaflet (`frontend/`)
- **Backend:** Node.js + Express 4 + TypeScript 5.7 (`backend/`)
- **Persistencia:** Supabase (PostgreSQL), única fuente de verdad. **No hay fallback local.**
- **API:** REST. El frontend proxea `/api` al backend por Vite (`vite.config.ts`).
- **Auth & RBAC:** scrypt (`services/password.ts`) + token Bearer aleatorio de 64 chars hex / 7 días. Roles: `usuario`, `gestor`, `admin`. **No se usa Supabase Auth.**

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
  tokens.css, index.css        # Tokens CSS + Tailwind CSS v4 (Opción A coexistencia)
  tipos.ts                     # Categoria, Barrio, Actividad, Preferencias, Resena
  api/
    client.ts                  # ÚNICO cliente HTTP (fetch + manejo de errores)
    actividades.ts             # Wrappers tipados sobre client.ts
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
    panel/                                        # Dashboard, AdminActividades, AdminUsuarios
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
npm run sin-emojis  # verifica cero emojis en frontend/src
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
- Design System (Croquis + Opción A): paleta cálida editorial (`brand-orange` `#FF8F50`,
  `brand-orange-light` `#FFAA5C`, `brand-ink` `#1B160E`, `brand-bg` `#F4F4F4`,
  `brand-white` `#FEFEFE`), jerarquía tipográfica `Kavoon` (`font-display`) / `Poppins`
  (`font-sans`) / `Montserrat` (`font-body`), bordes `rounded-3xl` / `rounded-full`,
  contraste dinámico WCAG >= 4.8:1 en categorías (`colorCategoria.ts`) y política de cero
  emojis (`npm run sin-emojis`).

---

## Gobernanza Multi-Agente (Rediseño UI Croquis)

Cualquier agente que modifique `frontend/` durante el rediseño visual basado en `Croquis-Conectando-Cultura-main` debe seguir la arquitectura modular por fases:

1. **Reglas contextuales de Frontend**: leer `frontend/AGENTS.md` antes de editar cualquier archivo en `frontend/`.
2. **Skills de proyecto obligatorias** (registradas en `.atl/skill-registry.md`):
   - `.agents/skills/croquis-design-system/SKILL.md`: tokens visuales Croquis, coexistencia Tailwind CSS v4 + `tokens.css` (Opción A), tipografías y geometría.
   - `.agents/skills/domain-ui-adapters/SKILL.md`: invariantes de dominio (`CategoriaChip` WCAG >= 4.8:1, `MapaLeaflet`, `useFiltrosExplorar`, `iconos.tsx` sin emojis, RBAC).
   - `.opencode/skills/typescript-magician/SKILL.md`: tipado estricto sin `any`.
3. **Especificaciones modulares por fase (`specs/`)**:
   - `specs/fase-0-fundamentos.spec.md` — Setup Tailwind v4 + `tokens.css`, fuentes Google, tipo `Resena` y limpieza de páginas legacy no ruteadas.
   - `specs/fase-1-layout-base.spec.md` — `Navbar`, `Footer`, `Layout` (`App.tsx`) y primitivos en `componentes/base/*`.
   - `specs/fase-2-inicio-barrios.spec.md` — `ActividadCard`, `CategoriaChip` y portada `Inicio.tsx` (Hero, buscador píldora, 9 categorías, destacadas, mosaico de 6 barrios de Comuna 9 y CTA).
   - `specs/fase-3-explorar-detalle.spec.md` — Catálogo `Explorar.tsx`, `MapaLeaflet.tsx`, `PinCategoria.tsx` y `DetalleActividad.tsx`.
   - `specs/fase-4-auth-admin.spec.md` — `Login`, `Registro`, `Bienvenido`, `Preferencias` y panel RBAC (`LayoutPanel`, `Dashboard`, `AdminActividades`, `AdminUsuarios`).

---

## Reglas para agentes

1. Correr `npx tsc --noEmit` en `backend/` y `frontend/` **antes y después** de tocar
   TypeScript, y `npm run sin-emojis` en `frontend/` al tocar componentes UI.
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
