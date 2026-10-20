# Phase 4 — Auth, Onboarding, Neighborhood Preferences & RBAC Admin Panel

Applies the Croquis visual system (`rounded-3xl` elevated cards, `Kavoon` headings, `brand-orange-light` header bands, and `rounded-full` pill actions) to `Conectando-Cultura`'s authentication pages (`Login`, `Registro`, `Bienvenido`), neighborhood preferences configurator (`Preferencias`), and role-gated management panel (`LayoutPanel`, `Dashboard`, `AdminActividades`, `AdminUsuarios`, `BarraConfirmacion`).

## Quick path

1. Redesign `Login.tsx`, `Registro.tsx`, and `Bienvenido.tsx` using Croquis split/card shells, `Kavoon` titles, and `rounded-full` form controls while preserving `useAuth()` flows.
2. Redesign `Preferencias.tsx` with a Croquis `rounded-3xl` form card, `CategoriaChip` multi-select grid, and a sticky `lg:grid-cols-[1fr_340px]` orange-header live preview card.
3. Redesign `LayoutPanel.tsx`, `Dashboard.tsx`, `AdminActividades.tsx` (including Nominatim geocoding modal & `BarraConfirmacion.tsx`), and `AdminUsuarios.tsx` while preserving all RBAC checks (`permisos.ts`) and API calls.

## Skills to load before work

- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\croquis-design-system\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\domain-ui-adapters\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.opencode\skills\typescript-magician\SKILL.md`

## Reference files in Croquis-Conectando-Cultura-main

- `Croquis-Conectando-Cultura-main/client/pages/DesignPages.tsx` (`DetailIntro`, `FeatureList`, `AboutPage`, `SearchResultsPage`)
- `Croquis-Conectando-Cultura-main/client/components/Layout.tsx` (`Newsletter`)
- `Croquis-Conectando-Cultura-main/tailwind.config.ts`

## Allowed edit surfaces in Conectando-Cultura

- `Conectando-Cultura/frontend/src/paginas/Login.tsx`
- `Conectando-Cultura/frontend/src/paginas/Registro.tsx`
- `Conectando-Cultura/frontend/src/paginas/Auth.module.css`
- `Conectando-Cultura/frontend/src/paginas/Bienvenido.tsx`
- `Conectando-Cultura/frontend/src/paginas/Bienvenido.module.css`
- `Conectando-Cultura/frontend/src/paginas/Preferencias.tsx`
- `Conectando-Cultura/frontend/src/paginas/Preferencias.module.css`
- `Conectando-Cultura/frontend/src/componentes/panel/LayoutPanel.tsx`
- `Conectando-Cultura/frontend/src/componentes/panel/LayoutPanel.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/BarraConfirmacion.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/BarraConfirmacion.module.css`
- `Conectando-Cultura/frontend/src/paginas/panel/Dashboard.tsx`
- `Conectando-Cultura/frontend/src/paginas/panel/Dashboard.module.css`
- `Conectando-Cultura/frontend/src/paginas/panel/AdminActividades.tsx`
- `Conectando-Cultura/frontend/src/paginas/panel/AdminActividades.module.css`
- `Conectando-Cultura/frontend/src/paginas/panel/AdminUsuarios.tsx`
- `Conectando-Cultura/frontend/src/paginas/panel/AdminUsuarios.module.css`

## Component & Data Adaptation Table

| Target Surface | Croquis Visual Shell | Conectando-Cultura Invariant to Preserve |
|----------------|----------------------|------------------------------------------|
| `Login.tsx` & `Registro.tsx` | 2-column card (`rounded-3xl shadow-[0_6px_11px_rgba(0,0,0,0.1)] overflow-hidden`): editorial `bg-brand-ink` / `brand-orange` cultural panel on left, `bg-brand-white` form on right with `Kavoon` title and `rounded-full` submit CTA | `useAuth().iniciarSesion` / `registrar`, field validation (`email`, `contrasena`, `nombre`), error banner (`role="alert"`), post-login redirect to `/preferencias` or `/bienvenido` |
| `Bienvenido.tsx` | Centered editorial card (`rounded-3xl bg-brand-white p-8 md:p-12`) with `Kavoon` greeting, role badge, and 3 quick-action cards (`/preferencias`, `/explorar`, `/explorar?vista=mapa`) | Redirect unauthenticated visitors to `/login`; display `usuario.nombre` and `usuario.email` |
| `Preferencias.tsx` | `lg:grid-cols-[1fr_340px]` layout: main `rounded-3xl` card for `Barrio` select + `CategoriaChip` multi-select; sticky right sidebar card with `bg-brand-orange-light` header band (`"Tu resumen cultural"`) | `obtenerPreferencias()` + `guardarPreferencias({ barrioId, categoriaIds })`, live dirty-state indicator, and link to `/explorar` with saved filters |
| `LayoutPanel.tsx` & `Dashboard.tsx` | Warm sidebar/top sub-navigation (`bg-brand-white rounded-3xl`), `Kavoon` panel header, and KPI stat cards with `bg-brand-orange/15` icon badges | `ProtegidaPermiso` (`"panel:acceder"`), role-specific navigation (`/admin`, `/admin/actividades`, `/admin/usuarios` gated by `puedeUsuario`), and real counts from API |
| `AdminActividades.tsx` & `BarraConfirmacion.tsx` | `rounded-3xl` filterable table/card list, `rounded-3xl` modal form with `bg-brand-orange-light` header band, and inline `BarraConfirmacion` pill bar for destructive actions | Full CRUD (`crearActividad`, `actualizarActividad`, `eliminarActividad`), Nominatim geocoding lookup with coordinate preview, and `puedeUsuario(usuario, "actividades:escribir")` / `"actividades:publicar"` checks |
| `AdminUsuarios.tsx` | `rounded-3xl` user directory table with role badges (`usuario`, `gestor`, `admin`) and pill role selector | `ProtegidaPermiso` (`"usuarios:gestionar"`) guard and role update API persistence |

## Acceptance Checklist

- [ ] `Login.tsx`, `Registro.tsx`, and `Bienvenido.tsx` use the Croquis visual language and preserve all `AuthContext` flows and validation messages.
- [ ] `Preferencias.tsx` renders the `1fr_340px` Croquis layout with `CategoriaChip` contrast and saves `{ barrioId, categoriaIds }` via `api/actividades.ts`.
- [ ] `LayoutPanel.tsx`, `Dashboard.tsx`, `AdminActividades.tsx` (including Nominatim geocoding and `BarraConfirmacion`), and `AdminUsuarios.tsx` preserve all RBAC permission gates (`permisos.ts`).
- [ ] `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with zero errors.

## Verification Commands

```bash
cd frontend
npm run typecheck
npm run sin-emojis
npm run build
```
