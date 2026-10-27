---
name: domain-ui-adapters
description: "Trigger: domain components, CategoriaChip, MapaLeaflet, useFiltrosExplorar, RBAC. Adapt Croquis visuals to Conectando-Cultura domain logic."
license: Apache-2.0
metadata:
  author: "conectando-cultura"
  version: "1.0"
---

## Activation Contract

Load this skill when:
- Modifying domain components that have no equivalent in `Croquis-Conectando-Cultura-main`.
- Editing `CategoriaChip.tsx`, `PinCategoria.tsx`, `MapaLeaflet.tsx`, `ActividadCard.tsx`, `Explorar.tsx`, `DetalleActividad.tsx`, `Preferencias.tsx`, or `paginas/panel/*`.
- Integrating icons, category colors, URL query filters, Leaflet markers, or RBAC permissions during the UI redesign.

## Hard Rules

- **WCAG >= 4.8:1 Category Contrast**: Always compute dynamic category colors through `frontend/src/utiles/colorCategoria.ts` (`coloresCategoria`, `colorSimbolo`) and bind them via `--chip-bg`, `--chip-fg`, `--chip-border`, and `--pin-color`. Never replace dynamic category colors with hardcoded Tailwind palette classes.
- **Zero Emojis Policy**: Never introduce emoji characters in source files, UI strings, or comments (`npm run sin-emojis` must pass with 0 violations). Always resolve icons via `frontend/src/componentes/iconos.tsx` (`IconoCategoria`, `ICONOS_UI`).
- **Interactive Leaflet Map Invariants**: Preserve `AjusteZoom`, `Centrador`, `L.divIcon` SVG pins (`frontend/src/utiles/iconosSvg.ts`), category pin colors, and bidirectional card-to-pin selection sync (`seleccionadaId`, `alSeleccionar`) in `frontend/src/componentes/MapaLeaflet.tsx`.
- **URL Filter State Sync**: Preserve `frontend/src/hooks/useFiltrosExplorar.ts` query synchronization (`?q=&barrio=&categorias=&vista=`) and split-screen view modes (`lista`, `mapa`, `ambas`) in `Explorar.tsx`.
- **Auth & RBAC Invariants**: Preserve `useAuth()` from `frontend/src/contexto/AuthContext.tsx` (`cc_token` Bearer session), `ProtegidaPermiso`, and permission checks from `frontend/src/utiles/permisos.ts` (`usuario`, `gestor`, `admin`, `puedeUsuario` with `"panel:acceder"`, `"actividades:escribir"`, `"usuarios:gestionar"`).

## Decision Gates

| Domain Feature | Croquis Visual Shell to Adapt | Mandatory Conectando-Cultura Invariant |
|----------------|-------------------------------|----------------------------------------|
| Cultural category pills (`CategoriaChip`) | Rounded pill geometry (`rounded-full`, `Poppins` semibold) | Runtime `--chip-bg` / `--chip-fg` contrast from `colorCategoria.ts` + `IconoCategoria` |
| Activity catalog & filters (`Explorar`) | `SearchResultsPage.tsx` (`/prenota`) search bar, orange filter bands, counter | `useFiltrosExplorar` URL state + `Mapa \| Lista \| Ambas` toggle + `MapaLeaflet` |
| Activity detail (`DetalleActividad`) | `PackageDetailPage.tsx` (`DesignHero`, `1fr_327px` `DetailIntro`, `FeatureList`) | Route `/actividades/:barrio/:slug`, `Actividad` fields (`horarios`, `direccion`, `lat`, `lng`, `url`, `categoria`, `barrio`), mini `MapaLeaflet`, related neighborhood activities |
| Barrios & categories on Home (`Inicio`) | `DestinationsGrid.tsx` (`DestinationCard`) & `holidayTypes` grid | 3 Comuna 9 `Barrio` cards (`Liniers`, `Mataderos`, `Parque Avellaneda` -> `/explorar?barrio=slug`) & 9 `Categoria` cards (`-> /explorar?categorias=slug`) |
| Admin CRUD & geocoding (`paginas/panel/*`) | Croquis card/table surfaces (`rounded-3xl`, `brand-orange` headers, pill actions) | `LayoutPanel` & `ProtegidaPermiso` RBAC guards (`/admin`, `/admin/actividades`, `/admin/usuarios`), Nominatim geocoding modal, `BarraConfirmacion`, and `api/actividades.ts` contracts |

## Execution Steps

1. Read the target component and its imported domain utilities (`tipos.ts`, `colorCategoria.ts`, `iconos.tsx`, `useFiltrosExplorar.ts`, `permisos.ts`) before modifying JSX or styles.
2. Preserve all existing props, event callbacks, API calls, and accessibility attributes (`aria-pressed`, `aria-label`, `role="status"`).
3. Apply Croquis visual shells around the domain logic using Tailwind v4 classes and `tokens.css` variables.
4. Verify zero emojis (`npm run sin-emojis`) and strict TypeScript compliance (`npx tsc --noEmit` with `strict: true`, `noUnusedLocals`, `noUnusedParameters`).

## Output Contract

Return:
- Adapted domain components preserving all runtime invariants (`colorCategoria`, `iconos.tsx`, `MapaLeaflet`, `useFiltrosExplorar`, `AuthContext`/`permisos`).
- Verification output from `npx tsc --noEmit` and `npm run sin-emojis`.

## References

- `frontend/src/utiles/colorCategoria.ts` — Runtime WCAG >= 4.8:1 contrast derivation for categories and map pins.
- `frontend/src/componentes/iconos.tsx` — Canonical Lucide icon resolver (`IconoCategoria`, `ICONOS_UI`).
- `frontend/src/hooks/useFiltrosExplorar.ts` — URL query state hook for `/explorar`.
- `frontend/src/utiles/permisos.ts` — Role-based access control helpers (`usuario`, `gestor`, `admin`).
