# Feature: Croquis Redesign Governance & Phased Specifications

- **Repository Locator**: `odd/tasks/croquis-redesign-governance.md`
- **Engram Topic Key**: `odd/croquis-redesign-governance/tasks`
- **Delivery Strategy**: `ask-on-risk` (Chain strategy: `stacked-to-main`)
- **Forecast Authored Changed Lines**: ~467 lines for `TASK-1` (governance, skills, and phase specs); >1,500 lines across full redesign (`TASK-2`..`TASK-6`, sliced by phase work units).
- **Running Authored Changed Lines**: 467 (uncommitted work unit on `feat/croquis-redesign-governance`, chain strategy: `stacked-to-main`)

## Objective

Establish a modular multi-agent governance system (`AGENTS.md`, `frontend/AGENTS.md`, LLM-first `SKILL.md` contracts, `.atl/skill-registry.md`, and phase-by-phase `specs/fase-0..4-*.spec.md`) to remake the UI design of `Conectando-Cultura` using `Croquis-Conectando-Cultura-main` as the visual skeleton under **Option A (Tailwind CSS v4 + `tokens.css` coexistence)** while adapting neighborhood-specific features (`Actividades`, `Barrios`, `MapaLeaflet`, WCAG `CategoriaChip`, Auth, `Preferencias`, and RBAC Admin Panel).

## Problem & Why

`Croquis-Conectando-Cultura-main` is a static tourism template built with Tailwind CSS v4 (`@tailwindcss/postcss`, `tailwind.config.ts`), `Kavoon`/`Poppins`/`Montserrat` typography, and relaxed TypeScript (`strict: false`). `Conectando-Cultura` is a production neighborhood cultural platform with strict TypeScript (`strict: true`, `noUnusedLocals`, `noUnusedParameters`), a zero-emoji policy (`scripts/sin-emojis.mjs`), runtime WCAG >= 4.8:1 contrast derivation (`colorCategoria.ts`), interactive Leaflet maps (`MapaLeaflet.tsx`), and custom scrypt/Bearer RBAC (`usuario`, `gestor`, `admin`). Agents executing the redesign need modular, phase-scoped contracts with explicit file boundaries so they can port `Croquis`'s visual identity without breaking `Conectando-Cultura`'s domain logic or overflowing context windows.

## Scope & Constraints

- **Selected Styling Architecture (Option A)**: Install and configure Tailwind CSS v4 + PostCSS in `Conectando-Cultura/frontend` alongside `frontend/src/tokens.css` and CSS Modules.
- **Strict Type & Quality Gates**: Preserve `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, zero `any`, and zero emojis (`npm run sin-emojis`) in `frontend/src/`.
- **Backend & Persistence Invariants**: Do not alter Supabase schema contracts, Bearer token auth (`cc_token`), or API response shapes in `frontend/src/api/*`.
- **Legacy Isolation**: Remove or archive the 8 unrouted legacy files in `frontend/src/paginas/` during Phase 0 so agents only touch active routed components.

## Authorized Scope

- **Completed**: `TASK-1` — Materialize `AGENTS.md` updates, `frontend/AGENTS.md`, project skills in `.agents/skills/*`, `.atl/skill-registry.md`, and modular phase specifications `specs/fase-0..4-*.spec.md`.
- **Subsequent Tasks (`TASK-2`..`TASK-6`)**: Tracked below as the execution roadmap for Phases 0–4 once the user authorizes code execution per phase.

## Actionable Checklist

- [x] **TASK-1**: Materialize Multi-Agent Governance (`AGENTS.md`, `frontend/AGENTS.md`), Project Skills (`croquis-design-system`, `domain-ui-adapters`, `.atl/skill-registry.md`), and Modular Phase Specs (`specs/fase-0..4-*.spec.md`) for Option A.
  - **Route**: `delegated` (Writer trigger: created/updated 10 governance, skill, and specification files via bounded writer `8dce4e2b-cab4-45f4-a7c4-8844f9e541cd`).
  - **Risk Tier**: `passive` (documentation, agent rules, skills, and phase specs; no runtime code mutation).
  - **Checks**: Structural readback completed across all 10 files; scoped path correction applied to `specs/fase-1..4-*.spec.md` and `AGENTS.md` to reference exact `Croquis` container files (`Layout.tsx`, `sections.tsx`, `DesignPages.tsx`) and `componentes/base/BarraConfirmacion.tsx`. Spot check confirmed all 10 files exist and are non-empty.
- [x] **TASK-2**: Execute Phase 0 (`specs/fase-0-fundamentos.spec.md`) — Tailwind CSS v4 + `tokens.css` integration, Google Fonts (`Kavoon`, `Poppins`, `Montserrat`), `Resena` type cleanup in `tipos.ts`, and removal of 8 unrouted legacy pages.
  - **Route**: `delegated` (Executed via subagent `f0610d80-950f-488d-8b5e-cbc40b60cd14`).
  - **Risk Tier**: `medium` (build/config and stylesheet changes verified by `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run sin-emojis`).
  - **Checks**: Installed `@tailwindcss/postcss@^4.3.3`, `tailwindcss@^4.3.3`, `postcss@^8.5.23`. Created `tailwind.config.ts` and `postcss.config.js`. Configured Google Fonts in `index.html`. Bridged Croquis tokens and Tailwind v4 in `tokens.css` and `index.css`. Added `Resena` in `tipos.ts`. Deleted 8 unrouted legacy files. Verified with clean `typecheck`, `sin-emojis`, and `build` (all passed, 0 errors).
- [x] **TASK-3**: Execute Phase 1 (`specs/fase-1-layout-base.spec.md`) — Redesign Global Shell (`Navbar.tsx`, `App.tsx` `Layout`/`Footer`/404) and `componentes/base/*` primitives (`Boton`, `Tarjeta`, `Campo`, `Badge`, `EstadoVacio`, `EstadoError`, `Esqueleto`, `ComponentesDemo.tsx`).
  - **Route**: `delegated` (Executed via subagent `6954e0d1-66cb-4514-88ee-fe398d159a54`).
  - **Risk Tier**: `medium` (verified by `npm run typecheck`, `npm run build`, `npm run sin-emojis`).
  - **Checks**: Redesigned `Navbar.tsx` with sticky white bar, Kavoon wordmark gradient, Comuna 9 badge, Poppins navigation links, RBAC Panel link, responsive mobile drawer, and auth controls. Redesigned `App.tsx` with scroll-to-top layout, 3-column Croquis ink footer with ET N° 20 DE 20 attribution and Comuna 9 links, Croquis 404 card, and preserved all routes and guards. Updated all base UI primitives (`Boton`, `Tarjeta`, `Campo`, `Badge`, `EstadoVacio`, `EstadoError`, `Esqueleto`, `BarraConfirmacion`) to Croquis geometry and tokens. Refactored `ComponentesDemo.tsx` with Croquis section cards and typography. Verified with clean `typecheck`, `sin-emojis`, and `build` (all passed, 0 errors).
- [x] **TASK-4**: Execute Phase 2 (`specs/fase-2-inicio-barrios.spec.md`) — Redesign `ActividadCard.tsx`, `CategoriaChip.tsx`, and `Inicio.tsx` (Hero + floating pill `SearchBar`, 9 Cultural Categories grid, Featured Activities grid, Comuna 9 Barrios mosaic, Community Pillars & Registration CTA).
  - **Route**: `delegated` (Executed via subagent `03f67372-c237-4683-b0b0-56343d91478a`).
  - **Risk Tier**: `medium` (verified by `npm run typecheck`, `npm run build`, `npm run sin-emojis`).
  - **Checks**: Redesigned `CategoriaChip` with Croquis pill geometry and dynamic runtime WCAG contrast. Redesigned `ActividadCard` with Croquis `PackageCard` visual shell (24px radius, cover image, barrio badge, Kavoon typography, metadata row, orange CTA) preserving existing interactive props. Redesigned `Inicio.tsx` with Comuna 9 Hero + straddling pill search bar, 9 cultural categories grid, featured activities with `Esqueleto`/`EstadoError`, 6-neighborhood Comuna 9 mosaic, community pillars, and neighborhood CTA banner. Verified with clean `typecheck`, `sin-emojis`, and `build` (all passed, 0 errors).
- [x] **TASK-5**: Execute Phase 3 (`specs/fase-3-explorar-detalle.spec.md`) — Redesign `Explorar.tsx` split-screen catalog, `MapaLeaflet.tsx` + `PinCategoria.tsx`, and `DetalleActividad.tsx` (`DesignHero` + `1fr_327px` `DetailIntro` + orange-header `"Antes de ir"` card + mini map + related neighborhood activities).
  - **Route**: `delegated` (Executed via subagent `80aafda5-6950-4e22-ac78-0ed47228adc2`).
  - **Risk Tier**: `medium` (verified by `npm run typecheck`, `npm run build`, `npm run sin-emojis`).
  - **Checks**: Redesigned `MapaLeaflet.tsx` and `PinCategoria.tsx` with Croquis 24px rounded frame, floating layer selector, and styled popups while preserving marker/selection invariants. Redesigned `Explorar.tsx` following `SearchResultsPage.tsx` search and filter strips, preserving URL query synchronization (`?q=&barrio=&categorias=&vista=`) and `Lista | Mapa | Ambas` split view. Redesigned `DetalleActividad.tsx` with `DesignHero`, `DetailIntro` (`1fr_327px`), orange-header `"Antes de ir"` sidebar card, mini map, and related neighborhood activities. Verified with clean `typecheck`, `sin-emojis`, and `build` (all passed, 0 errors).
- [x] **TASK-6**: Execute Phase 4 (`specs/fase-4-auth-admin.spec.md`) — Redesign Auth (`Login.tsx`, `Registro.tsx`, `Bienvenido.tsx`), `Preferencias.tsx`, and RBAC Admin Panel (`LayoutPanel.tsx`, `Dashboard.tsx`, `AdminActividades.tsx`, `AdminUsuarios.tsx`, `BarraConfirmacion.tsx`).
  - **Route**: `delegated` (Executed via subagent `074d6245-5cfa-4e7b-ac37-851ac328acfe`).
  - **Risk Tier**: `high` (touches auth flows and permission-gated admin CRUD; verified by `npm run typecheck`, `npm run build`, `npm run sin-emojis`).
  - **Checks**: Redesigned `Login.tsx` and `Registro.tsx` as 2-column cards (`rounded-3xl shadow-[0_6px_11px_rgba(0,0,0,0.1)]`) with editorial ink/orange panel on the left and form on the right, preserving `useAuth()`, field validation, and redirects. Redesigned `Bienvenido.tsx` with centered card, role badge, and 3 quick action cards. Redesigned `Preferencias.tsx` in `lg:grid-cols-[1fr_340px]` with `CategoriaChip` multi-select, dirty-state indicator, and sticky `"Tu resumen cultural"` card with orange header band. Redesigned `LayoutPanel.tsx` with responsive navigation drawer and warm sidebar. Redesigned `Dashboard.tsx` with Croquis KPI stat cards (`bg-brand-orange/15` icon badges). Redesigned `AdminActividades.tsx` with Croquis table, state pill filters, and modal with `bg-brand-orange-light` header band and OpenStreetMap Nominatim geocoding. Redesigned `AdminUsuarios.tsx` with user directory table, role selector, and confirmation bars. Verified with clean `typecheck`, `sin-emojis`, and `build` (all passed, 0 errors).

## Acceptance Criteria (`TASK-1`, `TASK-2` & `TASK-3`)

1. `Conectando-Cultura/AGENTS.md` and `Conectando-Cultura/frontend/AGENTS.md` document the Option A (`Tailwind CSS v4 + tokens.css`) architecture, phase routing, and strict quality gates (`tsc --noEmit`, `npm run sin-emojis`, zero `any`).
2. `.agents/skills/croquis-design-system/SKILL.md` and `.agents/skills/domain-ui-adapters/SKILL.md` follow the LLM-first Skill Style Guide and are indexed in `.atl/skill-registry.md`.
3. Five modular specification files (`specs/fase-0..4-*.spec.md`) declare exact source files from `Croquis-Conectando-Cultura-main`, allowed edit surfaces, and verification commands.
4. Phase 0 implemented: Tailwind CSS v4 + `tokens.css` coexisting cleanly, Google Fonts (`Kavoon`, `Poppins`, `Montserrat`) loaded, `Resena` type exported, 8 unrouted legacy pages purged, and `npm run typecheck`, `npm run sin-emojis`, and `npm run build` pass with 0 errors.
5. Phase 1 implemented: Global shell (`Navbar.tsx`, `App.tsx` layout/footer/404) and base primitives (`Boton`, `Tarjeta`, `Campo`, `Badge`, `EstadoVacio`, `EstadoError`, `Esqueleto`, `ComponentesDemo.tsx`) ported to Croquis visual tokens and geometry with 0 type errors, 0 emoji violations, and clean production build.

## Progress & Verification Evidence

- **Status**: `TASK-1`, `TASK-2`, and `TASK-3` completed and verified.
- **Observed Checks**:
  - `cmd /c "npm run typecheck"` in `frontend/`: 0 errors.
  - `cmd /c "npm run sin-emojis"` in `frontend/`: 0 errors.
  - `cmd /c "npm run build"` in `frontend/`: 0 errors (built in ~4.2s).
- **Next Step**: Await user authorization to execute `TASK-4` (`Phase 2: specs/fase-2-inicio-barrios.spec.md`). Chain strategy locked to `stacked-to-main`.
