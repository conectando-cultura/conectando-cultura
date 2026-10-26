# Feature: Local MySQL Primary Database with Supabase Backup & 3-Day Keep-Alive Admin Monitor

- **Repository Locator**: `odd/tasks/mysql-primary-supabase-backup.md`
- **Engram Topic Key**: `odd/mysql-primary-supabase-backup/tasks`
- **Delivery Strategy**: `single-pr` (User explicitly requested full implementation, README update, commit, and push of all changes)
- **Forecast Authored Changed Lines**: ~950 lines across `TASK-1` and `TASK-2`
- **Running Authored Changed Lines**: 2,612 (excluding `package-lock.json`; work-unit commits `834e96f` + `TASK-2` on `main`)

## Objective

Switch the primary persistence layer of `Conectando-Cultura` to local MySQL (`mysql2/promise`) while keeping Supabase (PostgreSQL) as an asynchronous backup mirror with on-demand full sync, a 3-day automatic `SELECT 1` keep-alive scheduler to prevent Supabase Free Tier pausing, and an exclusive Admin-only (`rol === "admin"`) status and control section in the Admin Panel.

## Problem & Why

The user is deploying `Conectando-Cultura` on their own server with a local MySQL instance as the primary database, while retaining Supabase on the Free Tier as a backup. Because Supabase Free Tier pauses projects after 7 days of inactivity, the backend must automatically execute a lightweight `SELECT 1` keep-alive query every 3 days (72 hours) and expose connection status, latency, keep-alive timestamps, manual ping, and backup sync controls exclusively to `admin` users in the Admin Panel.

## Scope & Constraints

- **Primary Database**: Local MySQL 8.0+ via `mysql2/promise` connection pool (`backend/src/lib/mysql.ts`), configured via `.env` (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`).
- **Backup Database**: Supabase remains configured in `backend/src/lib/supabase.ts` as an asynchronous write mirror (`backend/src/lib/supabase-mirror.ts`) plus manual synchronization (`MySQL -> Supabase`) from the Admin Panel.
- **3-Day Keep-Alive (`SELECT 1`)**: `SupabaseMonitorService` executes a keep-alive every 72 hours (and on boot if overdue), calling `SELECT 1` via RPC (`ping_keepalive`) with fallback to a lightweight PostgREST `HEAD`/`SELECT` query on `barrios`, recording latency, status, last run, and next scheduled run in MySQL (`sistema_estado_supabase`).
- **Admin-Only Visibility**: All new endpoints (`/api/admin/sistema/*`) are protected by `permisoRequerido("usuarios:gestionar")` (`rol === "admin"` only), and the frontend UI section in `Dashboard.tsx` is rendered strictly inside `{esAdmin && (...)}`.
- **Quality Gates**: Preserve `strict: true`, zero `any`, `npx tsc --noEmit` in both `backend/` and `frontend/`, and `npm run sin-emojis` in `frontend/`.

## Authorized Scope

- `mysql/001_schema_y_seed.sql`
- `supabase/migrations/004_keepalive_ping.sql`
- `backend/package.json`, `backend/package-lock.json`, `.env.example`
- `backend/src/lib/mysql.ts`, `backend/src/lib/supabase.ts`, `backend/src/lib/supabase-mirror.ts`
- `backend/src/repositories/usuario.repository.ts`
- `backend/src/services/actividades.service.ts`, `backend/src/services/preferencias.service.ts`, `backend/src/services/favoritos.service.ts`, `backend/src/services/resenas.service.ts`, `backend/src/services/contacto.service.ts`, `backend/src/services/notificaciones.service.ts`, `backend/src/services/supabase-monitor.service.ts`
- `backend/src/routes/admin.routes.ts`, `backend/src/index.ts`
- `frontend/src/api/admin.ts`, `frontend/src/paginas/panel/Dashboard.tsx`
- `README.md`, `AGENTS.md`

## Actionable Checklist

- [x] **TASK-1**: Implement MySQL 8.0+ schema & seed (`mysql/001_schema_y_seed.sql`), Supabase keep-alive RPC migration (`supabase/migrations/004_keepalive_ping.sql`), `mysql2` pool & async Supabase backup mirror (`backend/src/lib/mysql.ts`, `backend/src/lib/supabase.ts`, `backend/src/lib/supabase-mirror.ts`), and migrate all repositories and domain services (`usuario.repository.ts`, `actividades.service.ts`, `preferencias.service.ts`, `favoritos.service.ts`, `resenas.service.ts`, `contacto.service.ts`, `notificaciones.service.ts`).
  - **Route**: `delegated` (Writer trigger: executed via bounded writer `ab8e3738-3e1d-4c2b-a570-d53be5317797`, verified by independent verifier `1ebff056-3f12-43b2-81c1-4fcfa4a53862`).
  - **Risk Tier**: `high` (database persistence migration and schema translation).
  - **Checks**: `npx.cmd tsc --noEmit` (exit 0), `npm.cmd run build` (exit 0), zero `any` verified across `backend/src/**`, 11 tables verified in `mysql/001_schema_y_seed.sql`. Work-unit commit: `834e96f`.
- [x] **TASK-2**: Implement `SupabaseMonitorService` (3-day `SELECT 1` keep-alive scheduler + manual ping + MySQL-to-Supabase backup sync), Admin-only API endpoints (`backend/src/routes/admin.routes.ts`, `backend/src/index.ts`), Admin Panel UI section (`frontend/src/api/admin.ts`, `frontend/src/paginas/panel/Dashboard.tsx`), and update documentation (`README.md`, `AGENTS.md`, `.env.example`).
  - **Route**: `delegated` (Writer trigger: executed via bounded writer `e646686c-32bf-4bc2-a86b-2ab6a74886c6`, verified by independent verifier `e17330ee-2231-45f0-b547-944e399078b0`).
  - **Risk Tier**: `high` (RBAC-protected admin infrastructure endpoints and frontend admin panel).
  - **Checks**: `backend`: `npx.cmd tsc --noEmit` (exit 0), `npm.cmd run build` (exit 0); `frontend`: `npx.cmd tsc --noEmit` (exit 0), `npm.cmd run sin-emojis` (exit 0), `npm.cmd run build` (exit 0); zero `any` verified across `backend/src` and `frontend/src`.

## Acceptance Criteria

1. `mysql/001_schema_y_seed.sql` defines all 10 domain tables plus the `sistema_keepalive` tracking table in valid MySQL 8.0+ syntax with full seed data.
2. All repositories and services read/write against MySQL primary pool (`mysqlPool`) and asynchronously mirror mutations to Supabase when Supabase is configured.
3. `SupabaseMonitorService` runs a keep-alive `SELECT 1` ping every 3 days (72 hours), tracks status/latency/timestamps, and supports manual ping and manual backup sync from MySQL to Supabase.
4. `/api/admin/sistema/*` routes require `permisoRequerido("usuarios:gestionar")` (`admin` only) and `Dashboard.tsx` displays the Supabase connection status & keep-alive control panel exclusively when `esAdmin` is true.
5. `README.md`, `AGENTS.md`, and `.env.example` document the MySQL primary + Supabase backup setup.
6. Both `backend` and `frontend` pass `npx tsc --noEmit`, `npm run build`, and `frontend` passes `npm run sin-emojis`.

## Progress & Verification Evidence

- **Status**: `TASK-1` and `TASK-2` completed, verified by writer self-checks, independent read-only verifiers (`1ebff056-3f12-43b2-81c1-4fcfa4a53862`, `e17330ee-2231-45f0-b547-944e399078b0`), and parent spot-checks.
- **Observed Checks**:
  - `cd backend && npx.cmd tsc --noEmit`: 0 errors.
  - `cd backend && npm.cmd run build`: 0 errors.
  - `cd frontend && npx.cmd tsc --noEmit`: 0 errors.
  - `cd frontend && npm.cmd run sin-emojis`: 0 errors (`Sin emojis.`).
  - `cd frontend && npm.cmd run build`: 0 errors.
- **Next Step**: Commit `TASK-2` and push to `origin/main`.
