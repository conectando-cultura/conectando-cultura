# Conectando Cultura — Documentación técnica

Referencia extendida de la arquitectura. Para el uso rápido ver el
[`README.md`](../README.md); para las convenciones de desarrollo ver el
[`AGENTS.md`](../AGENTS.md).

---

## 1. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  Navegador                                                   │
│  React 18 + Vite (SPA) — leaflet, react-router-dom           │
└───────────────────────────┬──────────────────────────────────┘
                            │ fetch /api/*  (mismo origen)
                            │ Authorization: Bearer <token>
┌───────────────────────────▼──────────────────────────────────┐
│  Vite dev server (:5173)                                     │
│  proxy /api -> http://localhost:3001                         │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│  Express (:3001)                                             │
│                                                              │
│   routes/ ──────► services/ ──────► repositories/            │
│   (HTTP)          (reglas de        (persistencia)           │
│                    negocio)                                   │
│                                                              │
│   middlewares/autenticacionRequerida → adminRequerido         │
└───────────────────────────────┬──────────────────────────┘
                                │
      ┌─────────────────────────▼──────────────────────────┐
      │  Supabase (PostgreSQL)                            │
      │  service role key — única fuente de datos,        │
      │  sin fallback local.                               │
      └────────────────────────────────────────────────────┘
```

### Capas y responsabilidades

| Capa | Archivo | Responsabilidad | Qué **no** hace |
|---|---|---|---|
| Rutas | `routes/*.routes.ts` | Traducir HTTP ↔ servicio; validar formato de la entrada | Reglas de negocio, acceso a datos |
| Servicios | `services/*.service.ts` | Reglas de negocio, validaciones, elegir backend de datos | Tocar `req`/`res` |
| Repositorios | `repositories/*.repository.ts` | Leer y escribir en Supabase | Conocer el dominio |
| Middleware | `middlewares/*.ts` | Autenticación y autorización | Consultar la base |

---

## 2. Modelo de datos

### `barrios` / `categorias` — catálogos públicos

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | `gen_random_uuid()` |
| `nombre` | `TEXT` | `UNIQUE`, no nulo |
| `slug` | `TEXT` | `UNIQUE`, no nulo — se usa en las URLs de la API |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` |

`categorias` además tiene `color CHAR(7)` (validado con regex `^#[0-9A-Fa-f]{6}$`) e
`icono` (emoji), que el frontend usa para pintar marcadores y chips.

### `actividades`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | |
| `nombre`, `slug` | `TEXT` | `slug` validado como `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `descripcion`, `horarios`, `direccion` | `TEXT` | default `''` |
| `lat`, `lng` | `DECIMAL(10,7)` | con CHECK de rango válido |
| `url`, `imagen_url` | `TEXT` | default `''` |
| `categoria_id` | `UUID` FK → `categorias` | `ON DELETE RESTRICT` |
| `barrio_id` | `UUID` FK → `barrios` | `ON DELETE RESTRICT` |
| `visibilidad` | `TEXT` | CHECK en `publica`/`privada`/`oculta` |
| `destacado` | `BOOLEAN` | default `FALSE` |
| `activo` | `BOOLEAN` | default `TRUE` — **borrado lógico** |
| `created_by`, `updated_by` | `TEXT` FK → `usuarios` | `ON DELETE SET NULL` |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | `updated_at` lo mantiene un trigger |

`UNIQUE (slug, barrio_id)`.

### `usuarios` y `sesiones`

| `usuarios` | Tipo | Notas |
|---|---|---|
| `id` | `TEXT` PK | ⚠️ **TEXT, no UUID** — ver §3 |
| `nombre`, `apellido` | `TEXT` | |
| `correo` | `TEXT` `UNIQUE` | |
| `contrasena_hash` | `TEXT` | formato `sal:hash` (scrypt) |
| `rol` | `TEXT` | CHECK en `usuario` / `admin` |
| `creado_en` | `TIMESTAMPTZ` | |

| `sesiones` | Tipo | Notas |
|---|---|---|
| `token` | `TEXT` PK | 64 chars hex |
| `usuario_id` | `TEXT` FK → `usuarios` | `ON DELETE CASCADE` |
| `expira_en` | `TIMESTAMPTZ` | 7 días |

### `preferencias_usuario`

| Columna | Tipo | Notas |
|---|---|---|
| `usuario_id` | `TEXT` PK FK → `usuarios` | `ON DELETE CASCADE` |
| `barrio_id` | `UUID` FK → `barrios` | `NULL` = todos los barrios |
| `categoria_ids` | `UUID[]` | default `'{}'` |

Las categorías se guardan como **array de UUID**, no como tabla puente. El servicio
expande los UUID a objetos cuando arma la respuesta.

---

## 3. Decisiones de diseño que conviene no deshacer

### Los ids de usuario son `TEXT`, no `UUID`

La autenticación es propia (scrypt + token Bearer), no Supabase Auth. El generador de
`UsuarioRepository` produce ids con el formato `u<epoch-ms>`. Si la columna fuera `UUID`,
todos los inserts fallarían con un error de cast.

Consecuencia: en las políticas RLS el `auth.uid()` se castea con `::text`.

### La tabla es `barrios`, con columna `barrio_id`

El código la consulta con esos nombres (`supabaseAdmin.from("barrios")`,
`.eq("barrio_id", ...)`). La migración 001 usa esos mismos nombres a propósito. No
introducir `vecindes` / `vecind_id`: fueron nombres de una versión anterior que quedó
desalineada con el código.

### No existe trigger sobre `auth.users`

Ese esquema pertenece a Supabase Auth, que este proyecto no usa. Las preferencias se
crean con `upsert` desde `preferencias.service.ts` la primera vez que el usuario guarda.

### No hay persistencia local

`backend/data/` y `repositories/local-data.repository.ts` se eliminaron. Supabase es la
única fuente de datos. Si una consulta falla, el error sube al cliente como 500: no se
sustituye por un resultado vacío ni por datos de otro origen.

Dos razones:

1. El fallback anterior ocultaba los fallos de base. Mientras las credenciales no llegaran
   a `process.env` (no había carga de `.env`), el sistema usaba el JSON sin avisar y parecía
   sano.
2. `process.env` nunca se poblaba porque no había `dotenv`. Ahora `lib/supabase.ts` carga
   el archivo al importar el módulo y `exigirSupabase()` aborta el arranque si falta algo.

`esSupabaseConfigurado()` rechaza explícitamente las claves publicables (`sb_publishable_`):
no saltan RLS, así que el backend no podría operar con ellas.

### Las sesiones viven en la base

Estaban en un `Map` en memoria: reiniciar el backend expulsaba a todos los usuarios. Ahora
están en la tabla `sesiones` con su `expira_en`, y `buscarActiva()` borra la fila cuando
venció.

### El borrado de actividades es lógico

`DELETE /api/actividades/:id` no borra la fila: la marca `activo = false`. El catálogo
público filtra por `activo = true`, así que la actividad desaparece para los vecinos pero
se conserva el registro. El panel admin puede volver a activarla con `PATCH`.

### RLS vs. middleware: quién manda

El backend se autentica con la **service role key**, que ignora RLS por diseño. El control
de acceso efectivo es el middleware:

```
autenticacionRequerida(auth)  → 401 si no hay token válido
adminRequerido                → 403 si el rol no es "admin"
```

Las políticas RLS defienden la base frente a un uso accidental de la anon key. No son
la barrera principal.

---

## 4. Seguridad

### Hash de contraseñas

```ts
// backend/src/services/password.ts
const sal  = randomBytes(16).toString("hex");
const hash = scryptSync(contrasena, sal, 64).toString("hex");
// se almacena `${sal}:${hash}`
```

La verificación usa `timingSafeEqual` y compara longitudes antes, para no filtrar
información por tiempo de respuesta.

### Sesiones

El token se genera con dos `crypto.randomUUID()` concatenados (64 chars hex), vive 7 días
y se guarda en `localStorage` bajo la clave `cc_token`. El `AuthContext` es la única fuente
de sesión en el frontend: las páginas nunca tocan `localStorage` directamente.

Al cargar la app, `AuthContext` llama a `GET /api/auth/me`; si responde 401, borra el token
y deja al usuario como anónimo.

### RBAC

| Nivel | Backend | Frontend |
|---|---|---|
| Requiere sesión | `autenticacionRequerida(auth)` | `<Protegida>` |
| Requiere rol admin | `+ adminRequerido` | `<ProtegidaAdmin>` + enlace oculto en `Navbar` |

La defensa es en profundidad: que el backend rechace la operación es lo que protege los
datos. La guarda del frontend es sólo experiencia de usuario.

### Validación de entrada

- `auth.service.ts` valida registro y login (formato de correo, longitud mínima de
  contraseña, coincidencia de confirmación, duplicados).
- `preferencias.routes.ts` valida los tipos de `barrioId` y `categoriaIds`.
- `actividades.routes.ts` exige `nombre`, `descripcion` y `direccion` al crear.
- `admin.routes.ts` valida que `rol` sea `usuario` o `admin`.

---

## 5. Frontend

### Rutas

| Ruta | Componente | Acceso |
|---|---|---|
| `/` | `Inicio` | público |
| `/login` | `Login` | público |
| `/registro` | `Registro` | público |
| `/mapa` | `Mapa` | público |
| `/actividades` | `Actividades` | público |
| `/bienvenido` | `Bienvenido` | sesión |
| `/preferencias` | `Preferencias` | sesión |
| `/admin` | `AdminActividades` | sesión + admin |
| `*` | 404 | público |

### Cliente HTTP

`frontend/src/api/client.ts` es el **único** lugar donde se hace `fetch`. Normaliza el
token en el header `Authorization`, convierte `204` en `undefined` y normaliza todos los
errores a `ErrorApi` con el `mensaje` del backend. `api/actividades.ts` agrega los
wrappers tipados encima.

### Mapa

`MapaLeaflet.tsx` monta un `MapContainer` con tres capas seleccionables (Google Maps
roadmap, Google Maps satélite, OpenStreetMap). Cada actividad genera un `L.divIcon` con un
SVG pin coloreado según su categoría, y un popup con nombre, dirección, horarios,
descripción y enlace a Google Maps.

Dos detalles que ya están resueltos y no hay que deshacer:

- `L.Icon.Default.prototype._getIconUrl` se borra para que Vite resuelva los PNG del
  marcador; si se restaura, los marceros aparecen rotos.
- El centro por defecto es `[-34.656, -58.504]` (Alberdi y Directorio).

### Geocodificación

El botón "📍 Ubicar" del formulario admin consulta
`https://nominatim.openstreetmap.org/search` y completa `lat` / `lng`. Es un servicio
público con rate limit: si no devuelve resultados, el campo permite carga manual.

---

## 6. Despliegue

El proyecto es un backend Express y una SPA de Vite, desplegables por separado.

### Frontend (Vercel / Netlify / cualquier hosting estático)

```bash
cd frontend && npm run build   # genera dist/
```

- `dist/` es el artefacto a publicar.
- `vercel.json` ya trae la configuración de rewrite de `/api`.
- El frontend llama a rutas relativas (`/api`), así que el backend tiene que quedar en el
  mismo dominio (reverse proxy) o hay que cambiar `BASE` en `api/client.ts`.

### Backend (Railway / Render / Fly.io / VPS)

```bash
cd backend && npm run build && npm start
```

Variables de entorno en el hosting:

```env
PORT=3001
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

En Vercel como serverless habría que migrar `backend/src` a API Routes: Express con
`app.listen()` no corre en el modelo serverless sin adaptador.

### Checklist antes de publicar

- [ ] `npm run typecheck` limpio en backend y frontend
- [ ] Migraciones de `supabase/migrations/` aplicadas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (y **no** expuesta al frontend)
- [ ] `JWT_SECRET` / claves rotadas si se agregan
- [ ] `CORS` restringido al dominio real (hoy `app.use(cors())` está abierto — revisar
      antes de producción)
- [ ] Un usuario con rol `admin` existe en la base

---

## 7. Problemas frecuentes

**El backend no arranca y muestra "Supabase no está configurado correctamente"**
Faltan `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` en `backend/.env`, o la clave es la
publicable (`sb_publishable_`) en vez de la service role. `GET /api/estado` devuelve
`baseDeDatos: "sin-configurar"` mientras la configuración no sea válida.

**`401` en todos los requests aunque el login funcione**
La fila del usuario existe pero las sesiones no: revisá que la tabla `sesiones` se haya
creado (migración 001).

**`insert into "preferencias_usuario" violates foreign key constraint`**
El `usuario_id` no existe en la tabla `usuarios`. Como la autenticación es propia, los
usuarios se crean al registrarse; si se importó el catálogo viejo, hay que migrar esos
registros a `usuarios` con su `contrasena_hash`.

**Los marcadores del mapa salen rotos / no cargan**
Se restauró `L.Icon.Default.prototype._getIconUrl`. Verificar el bloque de iconos al
principio de `MapaLeaflet.tsx`.

**`403` en todas las rutas de admin**
El usuario no tiene `rol = 'admin'`. Con Supabase:
`UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu@email.com';`

**El typecheck falla con `has no exported member 'DbVecind'`**
`backend/src/types-db.ts` quedó desalineado con el schema. Ese archivo es la única fuente
de los tipos derivados: debe actualizarse en el mismo commit que el SQL.

---

## 8. Verificación

```bash
# Tipos
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build completo
cd frontend && npm run build

# API (backend corriendo en :3001)
curl http://localhost:3001/api/estado
curl http://localhost:3001/api/actividades | head -c 300
curl http://localhost:3001/api/actividades/barrios
curl http://localhost:3001/api/actividades/categorias
```

Pruebas de autorización:

```bash
# Sin token -> 401
curl -i http://localhost:3001/api/preferencias

# Con token de usuario normal contra /api/admin -> 403
curl -i http://localhost:3001/api/admin/estadisticas -H "Authorization: Bearer $TOKEN"
```
