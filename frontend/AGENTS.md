# Frontend Agent Rules — Conectando Cultura

Contextual governance for agents modifying `Conectando-Cultura/frontend/`. Every frontend task in the Croquis UI redesign executes within a bounded phase spec and loads the required project skills before editing files.

## Quick Path

1. Identify your assigned phase in the **Phase Routing Table** below.
2. Read the phase specification (`../specs/fase-*.spec.md`) and load the required skills from `../.agents/skills/` and `../.opencode/skills/`.
3. Edit only the files listed under `Allowed edit surfaces` in that phase specification.
4. Run `npm run typecheck`, `npm run sin-emojis`, and `npm run build` in `frontend/` before reporting completion.

## Option A Styling Contract (Tailwind CSS v4 + `tokens.css` Coexistence)

- **Tailwind CSS v4 + PostCSS**: Configured via `frontend/postcss.config.js` (`@tailwindcss/postcss`) and `frontend/tailwind.config.ts`, imported in `frontend/src/index.css` via `@import "tailwindcss";` and `@config "../tailwind.config.ts";`.
- **`tokens.css` Bridge**: `frontend/src/tokens.css` remains imported in `frontend/src/index.css` with its CSS custom properties (`--color-acento`, `--color-acento-suave`, `--color-fondo`, `--color-superficie`, `--color-texto`, `--fuente-display`, `--fuente-titulo`, `--fuente-cuerpo`, `--radio-4`, `--sombra-2`) updated to match the Croquis palette and typography.
- **Canonical Palette & Fonts**:
  - Colors: `brand-orange` (`#FF8F50`), `brand-orange-light` (`#FFAA5C`), `brand-ink` (`#1B160E`), `brand-gray` (`#302D27`), `brand-gray-light` (`#E3E3E1`), `brand-muted` (`#6B7D8D`), `brand-bg` (`#F4F4F4`), `brand-white` (`#FEFEFE`).
  - Fonts: `font-display` (`Kavoon`), `font-sans` (`Poppins`), `font-body` (`Montserrat`).
  - Radii & Elevation: `rounded-3xl` (`24px`), `rounded-[21px]`, `rounded-full`, `shadow-[0_6px_11px_rgba(0,0,0,0.1)]`.

## Phase Routing Table

| Phase | Spec File | Scope Summary | Required Skills |
|-------|-----------|---------------|-----------------|
| **Phase 0** | `../specs/fase-0-fundamentos.spec.md` | Tailwind CSS v4 setup, Google Fonts (`Kavoon`, `Poppins`, `Montserrat`), `tokens.css` alignment, `Resena` type in `tipos.ts`, legacy page cleanup | `croquis-design-system`, `typescript-magician` |
| **Phase 1** | `../specs/fase-1-layout-base.spec.md` | `Navbar.tsx`, `App.tsx` (`Layout`, `Footer`, 404), `componentes/base/*` primitives, `ComponentesDemo.tsx` | `croquis-design-system`, `domain-ui-adapters`, `typescript-magician` |
| **Phase 2** | `../specs/fase-2-inicio-barrios.spec.md` | `ActividadCard.tsx`, `CategoriaChip.tsx`, `Inicio.tsx` (Hero + pill search, 9 Categories, Featured Activities, 6 Barrios mosaic, Why Us, CTA) | `croquis-design-system`, `domain-ui-adapters`, `typescript-magician` |
| **Phase 3** | `../specs/fase-3-explorar-detalle.spec.md` | `Explorar.tsx` split catalog, `MapaLeaflet.tsx`, `PinCategoria.tsx`, `DetalleActividad.tsx` (`DesignHero`, `DetailIntro`, `Antes de ir`, mini map) | `croquis-design-system`, `domain-ui-adapters`, `typescript-magician` |
| **Phase 4** | `../specs/fase-4-auth-admin.spec.md` | `Login.tsx`, `Registro.tsx`, `Bienvenido.tsx`, `Preferencias.tsx`, `LayoutPanel.tsx`, `Dashboard.tsx`, `AdminActividades.tsx`, `AdminUsuarios.tsx` | `croquis-design-system`, `domain-ui-adapters`, `typescript-magician` |

## Non-Negotiable Frontend Invariants

| Gate | Requirement | Verification |
|------|-------------|--------------|
| **Strict TypeScript** | `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, zero `any` | `npm run typecheck` (`npx tsc --noEmit`) |
| **Zero Emojis** | No emoji codepoints anywhere in `frontend/src/`; use `componentes/iconos.tsx` (`IconoCategoria`, `ICONOS_UI`) | `npm run sin-emojis` |
| **WCAG Category Contrast** | Runtime contrast >= 4.8:1 via `utiles/colorCategoria.ts` (`--chip-bg`, `--chip-fg`, `--pin-color`); never hardcode category colors | Inspect `CategoriaChip.tsx` & `PinCategoria.tsx` |
| **Leaflet Map Sync** | Preserve `AjusteZoom`, `Centrador`, `L.divIcon` SVG pins, and bidirectional card-to-pin selection sync | Inspect `MapaLeaflet.tsx` & `Explorar.tsx` |
| **URL Query State** | Preserve `useFiltrosExplorar` (`?q=&barrio=&categorias=&vista=`) and `AuthContext` (`cc_token`) | Inspect `Explorar.tsx` & `AuthContext.tsx` |
