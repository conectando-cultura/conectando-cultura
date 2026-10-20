# Phase 0 — Design Tokens, Tailwind CSS v4 Coexistence & Legacy Cleanup

Establishes the Option A styling foundation (`Tailwind CSS v4` + `tokens.css` coexistence), loads the Croquis 3-tier Google Fonts stack (`Kavoon`, `Poppins`, `Montserrat`), restores the `Resena` type in `tipos.ts`, and removes the 8 unrouted legacy pages so subsequent phases operate exclusively on active routes.

## Quick path

1. Install and configure Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`) in `frontend/` and create `frontend/tailwind.config.ts` + `frontend/postcss.config.js`.
2. Load `Kavoon`, `Poppins`, and `Montserrat` in `frontend/index.html` and bridge Croquis design tokens in `frontend/src/tokens.css` and `frontend/src/index.css`.
3. Add the `Resena` interface to `frontend/src/tipos.ts`, delete the 8 unrouted legacy files in `frontend/src/paginas/`, and verify clean builds.

## Skills to load before work

- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.agents\skills\croquis-design-system\SKILL.md`
- `d:\Programming-Projects\actividades-barriales\Conectando-Cultura\.opencode\skills\typescript-magician\SKILL.md`

## Reference files in Croquis-Conectando-Cultura-main

- `Croquis-Conectando-Cultura-main/tailwind.config.ts`
- `Croquis-Conectando-Cultura-main/postcss.config.js`
- `Croquis-Conectando-Cultura-main/client/global.css`
- `Croquis-Conectando-Cultura-main/index.html`

## Allowed edit surfaces in Conectando-Cultura

- `Conectando-Cultura/frontend/package.json`
- `Conectando-Cultura/frontend/tailwind.config.ts`
- `Conectando-Cultura/frontend/postcss.config.js`
- `Conectando-Cultura/frontend/index.html`
- `Conectando-Cultura/frontend/src/tokens.css`
- `Conectando-Cultura/frontend/src/index.css`
- `Conectando-Cultura/frontend/src/tipos.ts`
- Delete unrouted legacy files:
  - `Conectando-Cultura/frontend/src/paginas/ActividadDetalle.tsx`
  - `Conectando-Cultura/frontend/src/paginas/Actividades.tsx`
  - `Conectando-Cultura/frontend/src/paginas/Mapa.tsx`
  - `Conectando-Cultura/frontend/src/paginas/Favoritos.tsx`
  - `Conectando-Cultura/frontend/src/paginas/Contacto.tsx`
  - `Conectando-Cultura/frontend/src/paginas/Admin.tsx`
  - `Conectando-Cultura/frontend/src/paginas/AdminActividades.tsx` (root unrouted duplicate; preserve `paginas/panel/AdminActividades.tsx`)
  - `Conectando-Cultura/frontend/src/paginas/ProtegidaAdmin.tsx`

## Component & Data Adaptation Table

| Target Surface | Adaptation Contract |
|----------------|---------------------|
| `frontend/tailwind.config.ts` & `postcss.config.js` | Configure `@tailwindcss/postcss` and define `colors.brand` (`orange: #FF8F50`, `orange-light: #FFAA5C`, `ink: #1B160E`, `gray: #302D27`, `gray-light: #E3E3E1`, `muted: #6B7D8D`, `bg: #F4F4F4`, `white: #FEFEFE`) and `fontFamily` (`display: ["Kavoon", "serif"]`, `sans: ["Poppins", "sans-serif"]`, `body: ["Montserrat", "sans-serif"]`) scanning `./index.html` and `./src/**/*.{ts,tsx}`. |
| `frontend/index.html` | Load Google Fonts `Kavoon`, `Poppins:wght@400;500;600;700`, and `Montserrat:wght@400;500;600;700`. |
| `frontend/src/tokens.css` & `frontend/src/index.css` | Add `@import "tailwindcss";` and `@config "../tailwind.config.ts";` alongside `@import "./tokens.css";`. Update CSS custom properties (`--color-acento: #FF8F50`, `--color-acento-suave: #FFAA5C`, `--color-fondo: #F4F4F4`, `--color-superficie: #FEFEFE`, `--color-texto: #1B160E`, `--color-texto-secundario: #302D27`, `--color-texto-tenue: #6B7D8D`, `--color-borde: #E3E3E1`, `--fuente-display`, `--fuente-titulo`, `--fuente-cuerpo`, `--radio-4: 24px`, `--sombra-2: 0 6px 11px rgba(0,0,0,0.1)`). |
| `frontend/src/tipos.ts` | Export `interface Resena { id: string; actividadId: string; usuarioId: string; autorNombre: string; calificacion: 1 \| 2 \| 3 \| 4 \| 5; comentario: string; fecha: string; }` without altering existing `Categoria`, `Barrio`, `Actividad`, or `Preferencias` contracts. |
| Legacy `paginas/*` cleanup | Delete the 8 unrouted legacy files listed above while keeping all active routed pages in `App.tsx` untouched. |

## Acceptance Checklist

- [ ] `frontend/tailwind.config.ts` and `frontend/postcss.config.js` exist and expose the exact `brand-*` colors and `font-display`/`font-sans`/`font-body` families.
- [ ] `frontend/src/tokens.css` and `frontend/src/index.css` coexist cleanly with Tailwind CSS v4 without breaking existing CSS Modules.
- [ ] `Resena` is exported from `frontend/src/tipos.ts` and all 8 unrouted legacy files are deleted.
- [ ] `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with zero errors.

## Verification Commands

```bash
cd frontend
npm run typecheck
npm run sin-emojis
npm run build
```
