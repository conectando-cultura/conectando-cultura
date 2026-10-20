# Phase 3 — Interactive Catalog (`Explorar`), Leaflet Map & Activity Detail (`DetalleActividad`)

Adapts the Croquis search catalog (`SearchResultsPage.tsx` `/prenota`) and package detail layout (`PackageDetailPage.tsx`: `DesignHero`, `1fr_327px` `DetailIntro`, orange-header `FeatureList`) to `Conectando-Cultura`'s interactive split-screen catalog (`Explorar.tsx`), Leaflet map (`MapaLeaflet.tsx`, `PinCategoria.tsx`), and cultural activity detail page (`DetalleActividad.tsx`).

## Quick path

1. Style `MapaLeaflet.tsx`, `PinCategoria.tsx`, and `PinCategoria.module.css` with Croquis `rounded-3xl` frames, pill layer toggles (` Callejero` / `Satélite`), and `Kavoon`/`Poppins` popups while preserving all Leaflet marker/selection invariants.
2. Redesign `Explorar.tsx` + `Explorar.module.css` using `SearchResultsPage.tsx` search/filter bands while preserving `useFiltrosExplorar` URL state (`?q=&barrio=&categorias=&vista=`) and `Lista | Mapa | Ambas` split view.
3. Redesign `DetalleActividad.tsx` + `DetalleActividad.module.css` using `DesignHero`, `DetailIntro` (`grid-cols-[1fr_327px]`), and `FeatureList` (`"Antes de ir"` orange-header card) plus mini `MapaLeaflet` and `"Más actividades en {barrio}"`.

## Skills to load before work

- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\croquis-design-system\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\domain-ui-adapters\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.opencode\skills\typescript-magician\SKILL.md`

## Reference files in Croquis-Conectando-Cultura-main

- `Croquis-Conectando-Cultura-main/client/pages/DesignPages.tsx` (`SearchResultsPage`, `PackageDetailPage`, `DesignHero`, `DetailIntro`, `FeatureList`)

## Allowed edit surfaces in Conectando-Cultura

- `Conectando-Cultura/frontend/src/paginas/Explorar.tsx`
- `Conectando-Cultura/frontend/src/paginas/Explorar.module.css`
- `Conectando-Cultura/frontend/src/componentes/MapaLeaflet.tsx`
- `Conectando-Cultura/frontend/src/componentes/MapaLeaflet.module.css`
- `Conectando-Cultura/frontend/src/componentes/PinCategoria.tsx`
- `Conectando-Cultura/frontend/src/componentes/PinCategoria.module.css`
- `Conectando-Cultura/frontend/src/paginas/DetalleActividad.tsx`
- `Conectando-Cultura/frontend/src/paginas/DetalleActividad.module.css`

## Component & Data Adaptation Table

| Target Component | Croquis Visual Shell | Conectando-Cultura Invariant to Preserve |
|------------------|----------------------|------------------------------------------|
| `Explorar.tsx` | `SearchResultsPage.tsx`: pill search bar, `bg-brand-orange-light` / `bg-brand-white` filter strip, `Poppins` result counter (`{n} actividades encontradas`), `rounded-3xl` empty state with clear-filters pill | `useFiltrosExplorar()` hook (`q`, `barrio`, `categorias`, `vista`, `establecerQ`, `establecerBarrio`, `alternarCategoria`, `establecerVista`, `limpiar`), multi-select `CategoriaChip` bar, `Lista \| Mapa \| Ambas` split view, and card-to-map hover/selection sync |
| `MapaLeaflet.tsx` & `PinCategoria.tsx` | `rounded-3xl overflow-hidden shadow-[0_6px_11px_rgba(0,0,0,0.1)]` map container, floating `rounded-full` layer switcher, styled popup with `Kavoon` title and orange pill link | `AjusteZoom`, `Centrador`, `crearIconoPin` (`L.divIcon` SVG from `utiles/iconosSvg.ts` + `colorSimbolo` from `utiles/colorCategoria.ts`), `seleccionadaId`, and `alSeleccionar` callback |
| `DetalleActividad.tsx` — Hero & Intro | `DesignHero.tsx` (`h-[400px] md:h-[520px]` image + dark gradient + centered `Kavoon` title & breadcrumb) + `DetailIntro.tsx` (`lg:grid-cols-[1fr_327px]`, `rounded-[21px]` sidebar card) | Fetch activity by `:barrio` & `:slug` (`obtenerActividad(slug, barrio)`), display `CategoriaChip`, `actividad.barrio.nombre`, full `actividad.descripcion`, RBAC edit link (`/admin/actividades` when `puedeUsuario(usuario, "actividades:escribir")`), and action pills (`Cómo llegar`, `Compartir`, `Sitio web oficial`) |
| `DetalleActividad.tsx` — `"Antes de ir"`, Mini Map & Related | `FeatureList.tsx` (`rounded-[21px]` card with `bg-brand-orange-light` header band + icon list) | Render `actividad.direccion`, `actividad.barrio.nombre`, and `actividad.horarios` in `"Antes de ir"`, interactive single-pin `MapaLeaflet` at `[actividad.lat, actividad.lng]`, and up to 3 related `ActividadCard`s from `obtenerActividades({ barrioSlug: barrio, limite: 4 })` |

## Acceptance Checklist

- [ ] `Explorar.tsx` preserves URL query synchronization (`?q=&barrio=&categorias=&vista=`) and split-screen `Lista | Mapa | Ambas` switching with Croquis catalog styling.
- [ ] `MapaLeaflet.tsx` and `PinCategoria.tsx` preserve SVG category markers, `colorSimbolo` contrast, `AjusteZoom`, `Centrador`, and card-to-pin selection sync.
- [ ] `DetalleActividad.tsx` renders the `DesignHero` banner, `1fr_327px` `DetailIntro` grid, orange-header `"Antes de ir"` card, mini `MapaLeaflet`, and related neighborhood activities.
- [ ] `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with zero errors.

## Verification Commands

```bash
cd frontend
npm run typecheck
npm run sin-emojis
npm run build
```
