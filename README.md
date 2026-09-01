# Conectando Cultura 🌿

Plataforma cultural comunitaria para los barrios de Mataderos y alrededores, Ciudad de Buenos Aires.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express + TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Email:** Resend
- **Despliegue:** Vercel

## Primeros pasos

### 1. Instalar dependencias

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Variables de entorno

Copiar `.env.example` a `.env` y completar con las credenciales:

```bash
cp .env.example backend/.env
```

### 3. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ejecutar las migraciones en `supabase/migrations/001_initial_schema.sql`
   desde el dashboard de Supabase → SQL Editor
3. Obtener `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de Settings → API
4. Completar `.env` del backend

### 4. Correr localmente

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

El frontend queda en `http://localhost:5173` y llama al backend en `http://localhost:3001/api`.

## Despliegue

### Backend (Vercel)

```bash
cd backend
vercel --prod
```

Configurar las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el dashboard de Vercel.

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Vercel redeploya automáticamente en cada push a `main`.

## API — Endpoints

| Método | Ruta                          | Auth | Descripción                    |
|--------|-------------------------------|------|--------------------------------|
| POST   | /api/auth/registro            | No   | Crear cuenta                   |
| POST   | /api/auth/login               | No   | Iniciar sesión                 |
| GET    | /api/auth/me                 | Yes  | Datos del usuario logueado    |
| POST   | /api/auth/logout             | Yes  | Cerrar sesión                  |
| GET    | /api/actividades             | No   | Listar actividades (filtros)   |
| GET    | /api/actividades/barrios      | No   | Listar barrios                 |
| GET    | /api/actividades/categorias  | No   | Listar categorías             |
| GET    | /api/actividades/:slug/:barrio| No   | Detalle de actividad          |
| GET    | /api/preferencias            | Yes  | Obtener preferencias usuario   |
| PUT    | /api/preferencias            | Yes  | Guardar preferencias usuario   |
