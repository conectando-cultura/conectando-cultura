# Phase 1 — Global Layout Shell (`Navbar`, `Footer`) & Base UI Primitives

Ports the Croquis navigation header, wordmark, 3-column dark ink footer, and base UI primitives (`Boton`, `Tarjeta`, `Campo`, `Badge`, `EstadoVacio`, `EstadoError`, `Esqueleto`) while preserving `Conectando-Cultura` authentication state, role-based panel routing, and strict zero-emoji icon resolution.

## Quick path

1. Redesign `Navbar.tsx` using Croquis `Header.tsx` + `Logo.tsx` (`Kavoon` wordmark, `Poppins` links, pill CTAs, mobile drawer, and RBAC `Panel` link).
2. Redesign `App.tsx` (`Layout`, 3-column `Footer` in `bg-brand-ink` with `brand-orange-light/40` dividers, and 404 page) without changing any route paths or guards.
3. Update `componentes/base/*` primitives and `ComponentesDemo.tsx` to use Croquis geometry (`rounded-full` buttons/badges, `rounded-3xl` cards, `brand-orange` accents) and verify build gates.

## Skills to load before work

- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\croquis-design-system\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\domain-ui-adapters\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.opencode\skills\typescript-magician\SKILL.md`

## Reference files in Croquis-Conectando-Cultura-main

- `Croquis-Conectando-Cultura-main/client/components/Layout.tsx` (`Header`, `Logo`, `Footer`, `Newsletter`, `Button`)
- `Croquis-Conectando-Cultura-main/client/components/sections.tsx` (`SectionTitle`)
- `Croquis-Conectando-Cultura-main/client/pages/NotFound.tsx`

## Allowed edit surfaces in Conectando-Cultura

- `Conectando-Cultura/frontend/src/componentes/Navbar.tsx`
- `Conectando-Cultura/frontend/src/componentes/Navbar.module.css`
- `Conectando-Cultura/frontend/src/App.tsx`
- `Conectando-Cultura/frontend/src/App.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/Boton.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/Boton.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/Tarjeta.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/Tarjeta.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/Campo.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/Campo.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/Badge.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/Badge.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/EstadoVacio.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/EstadoError.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/EstadoBloque.module.css`
- `Conectando-Cultura/frontend/src/componentes/base/Esqueleto.tsx`
- `Conectando-Cultura/frontend/src/componentes/base/Esqueleto.module.css`
- `Conectando-Cultura/frontend/src/paginas/ComponentesDemo.tsx`
- `Conectando-Cultura/frontend/src/paginas/ComponentesDemo.module.css`

## Component & Data Adaptation Table

| Target Component | Croquis Visual Shell | Conectando-Cultura Invariant to Preserve |
|------------------|----------------------|------------------------------------------|
| `Navbar.tsx` | `Header.tsx` + `Logo.tsx`: white bar (`h-[100px]`), `Kavoon` wordmark (`Conectando Cultura` + `Comuna 9` badge), `Poppins` nav links (`Inicio`, `Explorar`, `Mapa` -> `/explorar?vista=mapa`, `Mi barrio` -> `/preferencias`), mobile slide-down menu | `useAuth()` session display (`usuario.nombre`, role badge), `puedeUsuario(usuario, "panel:acceder")` check for `/admin`, `cerrarSesion()` handler, `aria-expanded` mobile toggle |
| `App.tsx` (`Layout`, `Footer`, `NoEncontrado`) | `Footer.tsx`: `bg-brand-ink text-brand-white` 3-column grid with `bg-brand-orange-light/40` vertical dividers on `lg+`, `Kavoon` headings, neighborhood links, and ET N°20 DE 20 institutional credit | All `<Routes>` paths (`/`, `/explorar`, `/actividades/:barrio/:slug`, `/mapa`, `/actividades`, `/preferencias`, `/login`, `/registro`, `/bienvenido`, `/admin`, `/admin/actividades`, `/admin/usuarios`, `/componentes`, `*`) and `<Protegida>` / `<ProtegidaPermiso>` wrappers |
| `Boton.tsx`, `Tarjeta.tsx`, `Campo.tsx`, `Badge.tsx` | Pill buttons (`rounded-full`, `bg-brand-orange hover:bg-brand-orange-light`), `rounded-3xl` cards with `shadow-[0_6px_11px_rgba(0,0,0,0.1)]`, pill/rounded inputs with `brand-orange` focus ring | Existing TypeScript prop interfaces (`VarianteBoton`, `TamanoBoton`, `PropsTarjeta`, `PropsCampo`, `PropsBadge`) so downstream consumers compile unchanged |
| `EstadoVacio.tsx`, `EstadoError.tsx`, `Esqueleto.tsx` | Warm editorial empty/error states (`bg-brand-white rounded-3xl p-8`) and soft shimmer skeletons | `role="status"` / `role="alert"` accessibility attributes and optional action callbacks |

## Acceptance Checklist

- [x] `Navbar.tsx` renders the Croquis `Kavoon` brand identity, responsive drawer, auth controls, and RBAC `Panel` link (`/admin`) when `puedeUsuario(usuario, "panel:acceder")` is true.
- [x] `App.tsx` renders the 3-column `bg-brand-ink` Croquis footer with `brand-orange-light/40` dividers and preserves every existing route.
- [x] All `componentes/base/*` primitives preserve their exported prop types and render with Croquis tokens on `/componentes`.
- [x] `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with zero errors.

## Verification Commands

```bash
cd frontend
npm run typecheck
npm run sin-emojis
npm run build
```
