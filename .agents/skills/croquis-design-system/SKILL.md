---
name: croquis-design-system
description: "Trigger: UI redesign, Tailwind classes, Croquis tokens, layout styling. Apply Croquis visual design tokens and Tailwind v4 patterns."
license: Apache-2.0
metadata:
  author: "conectando-cultura"
  version: "1.0"
---

## Activation Contract

Load this skill when:
- Porting visual shells, cards, headers, footers, or page layouts from `Croquis-Conectando-Cultura-main`.
- Configuring or editing `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/src/tokens.css`, or `frontend/src/index.css`.
- Styling any component in `Conectando-Cultura/frontend/src/` under Option A (Tailwind CSS v4 + `tokens.css` coexistence).

## Hard Rules

- Enforce **Option A coexistence**: use Tailwind CSS v4 (`@tailwindcss/postcss` + `@config "../tailwind.config.ts"`) for layout, spacing, typography, and `brand-*` colors while preserving `frontend/src/tokens.css` CSS custom properties for existing CSS Modules and runtime calculations.
- Use only the canonical Croquis brand palette:
  - `brand-orange`: `#FF8F50` (`--color-acento`)
  - `brand-orange-light`: `#FFAA5C` (`--color-acento-suave`)
  - `brand-ink`: `#1B160E` (`--color-texto`)
  - `brand-gray`: `#302D27` (`--color-texto-secundario`)
  - `brand-gray-light`: `#E3E3E1` (`--color-borde`)
  - `brand-muted`: `#6B7D8D` (`--color-texto-tenue`)
  - `brand-bg`: `#F4F4F4` (`--color-fondo`)
  - `brand-white`: `#FEFEFE` (`--color-superficie`)
- Use the 3-tier font stack loaded in `frontend/index.html`:
  - `font-display` (`Kavoon`): brand wordmark, hero titles, and high-emphasis section callouts.
  - `font-sans` (`Poppins`): UI headings, navigation links, buttons, chips, and badges.
  - `font-body` (`Montserrat`): body copy, descriptions, metadata, and form inputs.
- Apply signature Croquis geometry and elevation:
  - Cards and major containers: `rounded-3xl` (`24px`) or `rounded-[21px]` with `shadow-[0_6px_11px_rgba(0,0,0,0.1)]`.
  - Interactive pills, search bars, and primary CTAs: `rounded-full`.
- Never copy `Croquis` relaxed TypeScript patterns (`any`, unused imports) or tourism-specific domain copy into `Conectando-Cultura`.

## Decision Gates

| Styling Scenario | Required Mechanism |
|------------------|--------------------|
| Page layout, flex/grid, spacing, typography, static `brand-*` surfaces | Tailwind CSS v4 utility classes (`bg-brand-bg`, `text-brand-ink`, `font-display`, `rounded-3xl`) |
| Dynamic runtime category contrast (`CategoriaChip`, `PinCategoria`) | CSS custom properties (`--chip-bg`, `--chip-fg`, `--pin-color`) backed by `utiles/colorCategoria.ts` |
| Existing `.module.css` files during incremental migration | Map legacy variables in `frontend/src/tokens.css` to Croquis hex/font values or convert cleanly to Tailwind utilities |
| Card header callouts (`Antes de ir`, `Vista previa`, filter panels) | `bg-brand-orange-light` or `bg-brand-orange` top band (`rounded-t-[21px]` / `rounded-t-3xl`) over `bg-brand-white` body |

## Execution Steps

1. Inspect the corresponding reference component in `../Croquis-Conectando-Cultura-main/client/` before editing a target file.
2. Map layout containers to `max-w-7xl mx-auto px-4 md:px-8` and section backgrounds to `bg-brand-bg` or `bg-brand-white`.
3. Apply `font-display` (`Kavoon`), `font-sans` (`Poppins`), and `font-body` (`Montserrat`) hierarchy consistently.
4. Verify that `frontend/src/tokens.css` variables remain aligned with `frontend/tailwind.config.ts` so hybrid components render identically.
5. Run `npx tsc --noEmit` and `npm run sin-emojis` in `frontend/` before completing the task.

## Output Contract

Return:
- Target files created or updated in `Conectando-Cultura/frontend/`.
- Confirmation that Tailwind v4 utilities and `tokens.css` variables adhere to the Croquis palette and typography contract.
- Verification results for `npx tsc --noEmit` and `npm run sin-emojis`.

## References

- `../Croquis-Conectando-Cultura-main/tailwind.config.ts` — Reference `brand.*` palette and font family definitions.
- `../Croquis-Conectando-Cultura-main/client/global.css` — Reference Google Fonts import and base styles.
- `frontend/src/tokens.css` — Local CSS custom property bridge for Option A coexistence.
- `frontend/AGENTS.md` — Frontend redesign routing and quality gates.
