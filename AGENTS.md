# AGENTS.md — Conectando Cultura

Proyecto Integrador III — Escuela Técnica N°20 DE 20 "Carolina Muzilli" (Polo Educativo de Mataderos). Plataforma sociocultural para vecinos de Mataderos.

## Stack

- **Frontend:** React 18 + TypeScript 5.7 + Vite 5.4 + react-router-dom 6 (`frontend/`)
- **Backend:** Node.js + Express 4 + TypeScript 5.7 (`backend/`)
- **Persistencia:** `backend/data/usuarios.json` (simula PostgreSQL/Supabase — Sprint 3 migra a Supabase)
- **API:** REST exclusiva entre frontend y backend. Frontend proxea `/api` al backend via Vite (`vite.config.ts`).
- **Auth:** hash scrypt (`backend/src/services/password.ts`), tokens Bearer aleatorios 64 chars / 7 días, middleware `autenticacionRequerida`.

## Estructura

```
backend/src/
  index.ts, types.ts
  routes/auth.routes.ts      -> /api/auth/{registro,login,me,logout}
  services/auth.service.ts, password.ts
  repositories/usuario.repository.ts, sesion.repository.ts (memoria)
  middlewares/autenticacion.middleware.ts
frontend/src/
  App.tsx, main.tsx, tipos.ts, index.css (Design System 60-30-10)
  api/client.ts              -> único cliente HTTP
  contexto/AuthContext.tsx    -> única fuente de sesión
  paginas/{Inicio,Login,Registro,Bienvenido,Protegida}.tsx
  componentes/Navbar.tsx
```

## Comandos

```bash
# Backend http://localhost:3001
cd backend && npm install && npm run dev   # tsx watch src/index.ts
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/

# Frontend http://localhost:5173 (proxy /api -> backend)
cd frontend && npm install && npm run dev  # vite
npm run typecheck
npm run build       # tsc --noEmit && vite build
```

## Convenciones

- TypeScript `strict: true` en ambos proyectos. `noUnusedLocals/Parameters` activo en frontend.
- Idioma: código/comentarios en español donde ya existe (tipos `Usuario`, `Sesion`), mantener coherencia. Mensajes API en español (`{mensaje}`).
- DTOs: nunca exponer hash/password; usar `aPublico()` -> `{nombre, apellido, correo}`.
- Cohesión alta / bajo acoplamiento: páginas solo usan `useAuth()` + `api/client.ts`; rutas solo delegan a `AuthService`; repositorios aíslan persistencia.
- Design System: paleta 60-30-10 blanco / naranja #F98017 / amarillo #FBC02D, Poppins, botones redondeados, mobile-first.

## Skills disponibles

- `typescript-magician` (`.opencode/skills/typescript-magician/SKILL.md`): usar para errores TS, eliminar `any`, generics, type guards, `infer`/`extends`/conditional/mapped/template literal types, branded types, utility types. Flujo: `tsc --noEmit` -> diagnosticar -> fix type-safe -> `tsc --noEmit` de nuevo.

## Reglas para agentes

1. Ejecuta `tsc --noEmit` en `backend/` y `frontend/` antes y después de cambios TS.
2. No introducir `any`; preferir `unknown` + type guards si hace falta.
3. Mantener API REST como único contrato frontend<->backend. Si cambia persistencia, solo tocar `repositories/`.
4. Respetar seguridad: scrypt + tokens Bearer; no loguear ni devolver secretos.
5. Commits en español, siguiendo Sprint Backlog de `Sprint 1_ Login y Register - Desarrollo.md`.

## Verificación rápida

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
# Probar API real: POST /api/auth/registro|login, GET /api/auth/me, POST /api/auth/logout
```
