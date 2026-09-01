# Plan: Conectando Cultura — terminar todos los sprints + despliegue

> Proyecto: `D:\Proyectos-Programación\Conectando-Cultura`
> Stack actual: React 18 + TS + Vite (frontend), Express + TS (backend), JSON local.
> Stack destino: Vite SPA + Vercel API Routes serverless + Supabase Postgres + Vercel deploy + GitHub.

## Decisiones de arquitectura (validadas con el usuario)

| Decisión | Elegido | Implicancia |
|---|---|---|
| Alcance | Sprints 3-10 completos | ~8 sprints de trabajo |
| Persistencia | Supabase Postgres (reemplaza JSON) | Migrar `repositories/usuario.repository.ts` y agregar `actividad.repository.ts`, `preferencia.repository.ts`, etc. |
| Auth | Mantener scrypt + token Bearer propio. Supabase solo como DB | No migramos a Supabase Auth. El usuario existe en la tabla `usuarios` manejada por nosotros. |
| Backend hosting | Vercel API Routes serverless (en el mismo proyecto que el frontend) | Migrar `backend/src/*` a `api/*.ts` con helper de Postgres. Express deja de existir. |
| Frontend hosting | Vercel (SPA estática) | `vite build` → Vercel sirve `dist/`. Configurar rewrites para `/api/*`. |
| GitHub | Repo nuevo `conectando-cultura`, branch `main`, push por sprint | Crear repo, conectar, definir Conventional Commits. |
| Notificaciones email | Resend (free 3000/mes) vía Vercel API route | Servicio externo simple, sin SMTP propio. |
| Mapa | Leaflet + OpenStreetMap | Sin Google Maps (excluido explícitamente). |

## Estructura del repositorio (target)

```
conectando-cultura/
├── api/                        # Vercel API Routes (serverless)
│   ├── _lib/
│   │   ├── db.ts               # Cliente Supabase (service role)
│   │   ├── auth.ts             # helpers: scrypt, tokens, sesiones
│   │   ├── middleware.ts       # autenticacionRequerida, adminRequerido
│   │   └── errores.ts
│   ├── auth/
│   │   ├── registro.ts
│   │   ├── login.ts
│   │   ├── me.ts
│   │   └── logout.ts
│   ├── actividades/
│   │   ├── index.ts            # GET público, POST admin
│   │   ├── [id].ts             # GET, PATCH, DELETE admin
│   │   └── seed.ts             # POST admin: carga inventario inicial
│   ├── preferencias/
│   │   └── index.ts            # GET/PUT del usuario
│   ├── notificaciones/
│   │   └── enviar.ts           # POST admin: dispara avisos
│   └── contacto.ts             # POST público
├── src/                        # Frontend Vite (mover frontend/src/* acá)
│   ├── paginas/
│   │   ├── Inicio.tsx
│   │   ├── Login.tsx
│   │   ├── Registro.tsx
│   │   ├── Bienvenido.tsx
│   │   ├── Mapa.tsx            # NUEVO: pantalla principal post-login
│   │   ├── Actividades.tsx     # NUEVO: listado
│   │   ├── ActividadDetalle.tsx# NUEVO
│   │   ├── Preferencias.tsx   # NUEVO
│   │   ├── Admin/
│   │   │   ├── Admin.tsx       # NUEVO: panel admin
│   │   │   ├── AdminActividades.tsx
│   │   │   └── AdminUsuarios.tsx
│   │   └── Contacto.tsx        # NUEVO
│   ├── contexto/AuthContext.tsx
│   ├── api/client.ts           # ajustar base a "/api"
│   ├── componentes/
│   │   ├── Navbar.tsx
│   │   ├── MapaLeaflet.tsx     # NUEVO
│   │   ├── Filtros.tsx         # NUEVO
│   │   └── Footer.tsx          # NUEVO
│   └── tipos.ts
├── supabase/
│   └── migrations/             # SQL: tablas, índices, RLS, seed
│       ├── 0001_init.sql
│       ├── 0002_seed_actividades.sql
│       └── 0003_rls_policies.sql
├── index.html
├── package.json
├── vite.config.ts              # actualizar proxy
├── vercel.json                 # rewrites + headers
├── .env.example                # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, JWT_SECRET
├── .gitignore
└── README.md                   # instrucciones de setup
```

El directorio `backend/` actual queda congelado como referencia y se elimina tras verificar que la migración pasó todos los tests.

## Plan por sprint

### Sprint 0 (preparación) — sin push hasta acá
- [ ] Crear repo `conectando-cultura` en GitHub (acción manual: necesito que confirmes usuario/org)
- [ ] Inicializar `git`, agregar `.gitignore`, primer commit del estado actual
- [ ] Crear proyecto Supabase + guardar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Crear cuenta Vercel + linkear repo
- [ ] Definir `DATABASE_SCHEMA.md` con las tablas:
  - `usuarios (id, nombre, apellido, correo UNIQUE, contrasena_hash, rol, creado_en)`
  - `sesiones (token PK, usuario_id FK, expira_en)`
  - `actividades (id, nombre, categoria, direccion, lat, lng, telefono, horario, descripcion, declaracion, creado_en, actualizado_en)`
  - `categorias (id, nombre, color_hex, icono)` — sembrada
  - `barrios (id, nombre)` — sembrada
  - `preferencias_usuario (usuario_id, barrio_id NULL, categoria_id NULL, recibe_email)`
  - `notificaciones (id, usuario_id, actividad_id, enviado_en, canal)`
- [ ] Borrar el viejo `backend/` después de migrar — no ahora

### Sprint 3 — Datos y Preferencias (Base de datos)
- **DoD:** Supabase con todas las tablas + RLS + seed de 25+ actividades de Mataderos + Dashboard de Preferencias funcionando en `/preferencias`.
- Tareas:
  1. Escribir migraciones SQL (tablas, FKs, índices, constraints)
  2. Configurar RLS: políticas restrictivas en `preferencias_usuario` (solo el dueño lee/escribe), `actividades` lectura pública
  3. Seed de las 25+ actividades del doc (mataderos.md → CSV → SQL insert)
  4. Seed de categorías con colores (Peña=#F98017, Cine=#FBC02D, Biblioteca=#0277BD, Museo=#7B1FA2, Bar Notable=#388E3C, Centro Cultural=#D32F2F, Calesita=#F57C00, Danza=#1976D2, Espacio Cultural=#5D4037, Fileteado=#FFC107, Medio=#455A64, Milonga=#C2185B, Radio=#0097A7, Teatro=#512DA8, Sitio Interés=#689F38)
  5. Seed de barrios (Mataderos como default; preparado para escalar)
  6. Backend: `api/_lib/db.ts` con cliente `@supabase/supabase-js`
  7. Backend: `api/preferencias/index.ts` (GET/PUT protegido)
  8. Frontend: página `Preferencias.tsx` con checkboxes de categorías + select de barrio
  9. Tests: smoke E2E con curl
  10. typecheck + push a GitHub → **deploy preview automático en Vercel**
  11. Actualizar bitácora del proyecto (`Conectando Cultura.md`)

### Sprint 4 — Gestión Admin (CRUD)
- **DoD:** Un usuario admin puede crear/editar/borrar actividades desde `/admin`. Rutas `/admin/*` protegidas por rol.
- Tareas:
  1. Backend: `api/actividades/index.ts` (GET público con filtros; POST admin)
  2. Backend: `api/actividades/[id].ts` (GET, PATCH, DELETE admin)
  3. Backend: middleware `adminRequerido`
  4. Backend: seed de un usuario admin inicial (`admin@conectandocultura.local` / pass configurable por env)
  5. Frontend: rutas `/admin` (layout) + `AdminActividades.tsx` (tabla + modal de edición)
  6. Frontend: cliente API para admin (mismo `client.ts` con helper)
  7. Geolocalización: el form admin acepta dirección y usa Nominatim (OpenStreetMap free) para autocompletar lat/lng
  8. Tests + typecheck + push + deploy preview

### Sprint 5 — Integración de Mapas (Leaflet)
- **DoD:** `/mapa` muestra un mapa centrado en Mataderos con todos los marcadores desde la API.
- Tareas:
  1. Instalar `leaflet` + `@types/leaflet`
  2. Frontend: `componentes/MapaLeaflet.tsx` con `MapContainer`, `TileLayer` (OpenStreetMap), `Marker`, bounds de Mataderos (-34.66/-34.72, -58.49/-58.45)
  3. Frontend: hook `useActividades()` que fetch a `/api/actividades`
  4. Frontend: página `Mapa.tsx` (ruta principal post-login + accesible para anónimos)
  5. Frontend: actualizar `Navbar.tsx` para linkear a `/mapa` y `/actividades`
  6. Responsive: mapa full-width en mobile
  7. Tests + typecheck + push + deploy preview

### Sprint 6 — Interacción Geográfica
- **DoD:** Cada marcador tiene color por categoría y popup con detalle.
- Tareas:
  1. Frontend: helper `colorPorCategoria(categoriaId)` que mapea al hex sembrado
  2. Frontend: `L.divIcon` con HTML custom (circulo de color + icono emoji o inicial)
  3. Frontend: popup con nombre, dirección, horario, teléfono, link a `/actividades/:id`
  4. Frontend: página `ActividadDetalle.tsx` con toda la info + mapa pequeño
  5. Tests + typecheck + push + deploy preview

### Sprint 7 — Búsqueda y Filtros
- **DoD:** Filtros en tiempo real por categoría + búsqueda por nombre.
- Tareas:
  1. Frontend: componente `Filtros.tsx` con checkboxes de categoría + input de búsqueda
  2. Frontend: estado compartido (URL params o context) entre Mapa y Listado
  3. Frontend: página `Actividades.tsx` (vista lista) sincronizada con los mismos filtros
  4. Frontend: contador "Mostrando X de Y"
  5. Tests + typecheck + push + deploy preview

### Sprint 8 — Alertas y Soporte (Email + Contacto)
- **DoD:** Al crear actividad, los usuarios suscriptos a su categoría o barrio reciben email. Form de contacto funciona.
- Tareas:
  1. Instalar `resend` (SDK Node)
  2. Backend: `api/notificaciones/enviar.ts` — query a usuarios con preferencia que matchea categoría/barrio, envía email con Resend
  3. Backend: trigger desde `api/actividades/index.ts` (POST) y `[id].ts` (PATCH si cambia fecha) — debe ser async fire-and-forget
  4. Backend: `api/contacto.ts` (POST público) — guarda en tabla `mensajes_contacto` y notifica a admin
  5. Frontend: página `Contacto.tsx` con form
  6. Plantilla HTML de email simple con link a la actividad
  7. Tests + typecheck + push + deploy preview

### Sprint 9 — Calidad y UX
- **DoD:** Lighthouse mobile > 90, sin errores de consola, accesible.
- Tareas:
  1. Auditoría Lighthouse desktop + mobile, documentar baseline
  2. Optimizaciones: lazy-load de Leaflet, imágenes optimizadas, code splitting por ruta
  3. Accesibilidad: contraste WCAG AA en el design system actual (verificar naranja #F98017 sobre blanco — ya validado en Sprint 1)
  4. Accesibilidad: roles ARIA, focus visible, navegación por teclado, skip-link
  5. Pruebas manuales en Chrome DevTools con throttling 3G
  6. Pruebas en mobile real si hay disponible
  7. Fix de issues encontrados
  8. Tests + typecheck + push + deploy preview

### Sprint 10 — Lanzamiento y Cierre
- **DoD:** Producción funcionando, README completo, bitácora actualizada.
- Tareas:
  1. Configurar dominio custom en Vercel (opcional — por defecto `*.vercel.app`)
  2. Configurar secrets en Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
  3. Crear `MANUAL_TRANSFERENCIA.md` con: cómo crear admin, cómo rotar secrets, cómo correr local, esquema de DB, arquitectura
  4. Crear `ROADMAP_FUTURO.md` con lo que quedó pendiente (push notifications, geolocalización real, 2FA, escalar a otros barrios)
  5. Smoke test completo en producción: registro → login → ver mapa → filtrar → crear actividad como admin → recibir email
  6. Actualizar `Conectando Cultura.md` con screenshots y URLs reales
  7. Tag `v1.0.0` en GitHub
  8. Push final

## Convenciones

- Commits en español, formato: `sprint(N): descripcion corta`. Ej: `sprint(3): agregar migraciones supabase y seed de actividades`
- Push por sprint a `main` → Vercel hace deploy preview automático. El deploy "production" solo se gatilla manualmente en Sprint 10.
- Cada sprint arranca con un push vacío de "inicio de sprint" y cierra con un push "cierre sprint N: <DoD cumplido>".

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El usuario no tiene GitHub/Vercel/Supabase creados | Necesito acción manual al inicio (ver Sprint 0). Sin esas cuentas no puedo pushear ni hacer deploy real. |
| Nominatim (geocoding) tiene rate limit | Cachear resultados en DB después del primer lookup |
| Vercel serverless cold start puede hacer lento el primer request | Aceptable para MVP; documentar en roadmap |
| Resend free tier se queda sin créditos | Fallback: loggear emails enviados en tabla `notificaciones` aunque falle el envío |
| El plan completo puede tomar muchas horas en ejecutarse | Ir sprint por sprint. Cada uno es un ciclo corto con push verificable. |

## Lo que necesito del usuario (acciones manuales)

1. **Crear la organización/cuenta de GitHub** donde irá el repo (o decirme el nombre exacto)
2. **Confirmar el email** que asociaremos al primer admin del sistema
3. **Aprobar el primer push a GitHub** (te paso el remote y vos das merge/accept de la PR inicial si querés ir por PRs)
4. **Confirmar las credenciales Vercel/Supabase** después de crearlas (yo guío el paso a paso)
5. **Para Sprint 8**: crear cuenta en resend.com y verificar dominio (o usar el sandbox `onresend.dev` para pruebas)