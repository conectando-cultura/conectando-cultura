# Phase 2 — Home Page (`Inicio`), Barrios Mosaic & Cultural Activity Cards

Adapts the Croquis landing page (`Index.tsx`), package cards (`PackageCard.tsx`), and destination mosaic (`DestinationsGrid.tsx`) to `Conectando-Cultura`'s neighborhood cultural domain: Comuna 9 Hero + straddling pill search bar, 9 cultural categories grid, featured `ActividadCard` grid, 3-neighborhood Comuna 9 mosaic (`Liniers`, `Mataderos`, `Parque Avellaneda`), community value pillars, and neighborhood onboarding CTA.

## Quick path

1. Redesign `CategoriaChip.tsx` + `CategoriaChip.module.css` with Croquis pill geometry while preserving dynamic WCAG >= 4.8:1 colors from `utiles/colorCategoria.ts` and `IconoCategoria`.
2. Redesign `ActividadCard.tsx` + `ActividadCard.module.css` using Croquis `PackageCard.tsx` (`rounded-3xl`, `h-[234px]` cover image, `brand-orange` barrio badge, `CategoriaChip` overlay, `Kavoon` title, metadata row, and `bg-brand-orange rounded-full` `"Ver detalle"` CTA).
3. Redesign `Inicio.tsx` + `Inicio.module.css` following Croquis `Index.tsx` sections and wire all search/category/barrio links to `/explorar`.

## Skills to load before work

- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\croquis-design-system\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\domain-ui-adapters\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.opencode\skills\typescript-magician\SKILL.md`

## Reference files in Croquis-Conectando-Cultura-main

- `Croquis-Conectando-Cultura-main/client/pages/Index.tsx`
- `Croquis-Conectando-Cultura-main/client/pages/Tipologie.tsx`
- `Croquis-Conectando-Cultura-main/client/components/sections.tsx` (`SearchBar`, `PackageCard`, `DestinationsGrid`)
- `Croquis-Conectando-Cultura-main/client/components/Layout.tsx` (`Newsletter`)
- `Croquis-Conectando-Cultura-main/client/pages/DesignPages.tsx` (`DestinationCards`)

## Allowed edit surfaces in Conectando-Cultura

- `Conectando-Cultura/frontend/src/componentes/CategoriaChip.tsx`
- `Conectando-Cultura/frontend/src/componentes/CategoriaChip.module.css`
- `Conectando-Cultura/frontend/src/componentes/ActividadCard.tsx`
- `Conectando-Cultura/frontend/src/componentes/ActividadCard.module.css`
- `Conectando-Cultura/frontend/src/paginas/Inicio.tsx`
- `Conectando-Cultura/frontend/src/paginas/Inicio.module.css`

## Component & Data Adaptation Table

| Target Component / Section | Croquis Visual Source | Conectando-Cultura Domain Mapping |
|----------------------------|-----------------------|-----------------------------------|
| `CategoriaChip.tsx` | Rounded pill badge (`rounded-full`, `Poppins` semibold) | Preserve `PropsCategoriaChip`, `coloresCategoria(categoria.color)`, `--chip-bg`/`--chip-fg`/`--chip-border`, and `IconoCategoria` |
| `ActividadCard.tsx` | `PackageCard.tsx` (`rounded-3xl`, `shadow-[0_6px_11px_rgba(0,0,0,0.1)]`, `h-[234px]` top image, `Kavoon` title, orange pill CTA) | Map `days` badge -> `actividad.barrio.nombre` (`bg-brand-orange`), top-left chip -> `CategoriaChip` + `"Destacada"` badge when `actividad.destacado`, metadata -> `actividad.horarios` + `actividad.direccion`, CTA -> `/actividades/${actividad.barrio.slug}/${actividad.slug}`. Preserve `seleccionada`, `compacta`, and `alHover` props |
| `Inicio.tsx` — Hero & Pill SearchBar | `Index.tsx` Hero + `SearchBar.tsx` (`rounded-full` straddling bar `-mt-9 z-20`) | Inputs for text query (`q`), `Barrio` selector (`barrios` from API), and `Categoria` selector (`categorias` from API) submitting to `/explorar?q=...&barrio=...&categorias=...` |
| `Inicio.tsx` — 9 Cultural Categories | `Index.tsx` `holidayTypes` grid (`rounded-3xl` white cards with circular icon badge) | Render the 9 cultural `Categoria` items (`musica`, `teatro`, `danza`, `talleres`, `artes-visuales`, `ferias`, `literatura`, `cine`, `comunidad`) with `IconoCategoria` and dynamic accent ring linking to `/explorar?categorias=${cat.id}` |
| `Inicio.tsx` — Featured Activities | `Index.tsx` `"I nostri pacchetti"` 3-column grid | Render up to 6 `ActividadCard` items fetched via `obtenerActividades` + `obtenerBarrios` + `obtenerCategorias`, with `Esqueleto` loading and `EstadoError` retry |
| `Inicio.tsx` — Comuna 9 Barrios Mosaic | `DestinationsGrid.tsx` (`DestinationCard` with gradient overlay & `Kavoon` title) | Render the 3 Comuna 9 neighborhoods (`Liniers`, `Mataderos`, `Parque Avellaneda`) with curated local cultural imagery, description/activity count, and link to `/explorar?barrio=${b.slug}` |
| `Inicio.tsx` — Community Pillars & CTA | `Index.tsx` `whyUs` 3-column block + `Newsletter.tsx` dark banner | 3 community pillars (`Cultura de proximidad`, `Acceso libre y barrial`, `Red de espacios culturales`) + CTA banner (`bg-brand-ink rounded-3xl`) linking guests to `/registro` and logged-in users to `/preferencias` |

## Acceptance Checklist

- [ ] `CategoriaChip.tsx` maintains runtime WCAG >= 4.8:1 contrast via `colorCategoria.ts` and uses `IconoCategoria` with zero emojis.
- [ ] `ActividadCard.tsx` adopts the `PackageCard` visual shell while supporting `seleccionada`, `compacta`, and `alHover` props required by `Explorar.tsx`.
- [ ] `Inicio.tsx` renders Hero + straddling pill search bar, 9 cultural categories, featured activities, 3 Comuna 9 barrios mosaic (`Liniers`, `Mataderos`, `Parque Avellaneda`), community pillars, and onboarding CTA banner.
- [ ] `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with zero errors.

## Verification Commands

```bash
cd frontend
npm run typecheck
npm run sin-emojis
npm run build
```
