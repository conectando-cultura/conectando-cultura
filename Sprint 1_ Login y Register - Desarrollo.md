# **Sprint 1: Login y Register — Desarrollo de la Actividad**

**Proyecto Integrador III — "Conectando Cultura"**
*Escuela Técnica N°20 DE 20 "Carolina Muzilli" — Polo Educativo de Mataderos*

**Profesores:** Camila Lambertucci y Sebastian Anderson
**Estudiantes:** Damian Orellana, Dante Battiato, Juan Mendoza, Kevin Machaca
**Curso:** 6° 2°

---

## 1. Objetivo del sprint

Implementar el módulo de autenticación de **Conectando Cultura** (registro e inicio de sesión de usuarios), de forma que un vecino pueda crear su cuenta y acceder al sistema para personalizar su experiencia, cumpliendo con el PMV definido en el proyecto: *"Sistema de Login Básico: Registro simple para habilitar la personalización del usuario"* (Actividad 15) y con la tarea 2.1 del Product Backlog: *"Diseño UI de formularios de Login y Registro"*.

El desarrollo se realizará aplicando los criterios de **cohesión**, **bajo acoplamiento** y **buenas prácticas** vistos en la teoría, y de acuerdo con la **arquitectura definida en la Actividad 24**: frontend en **React + TypeScript**, backend en **Node.js + Express** con **API REST**, base de datos **PostgreSQL (Supabase)** a conectar en el Sprint 3 y despliegue en Vercel. En este sprint la persistencia se implementa con un archivo JSON que simula la base de datos, y la autenticación real se hará en el backend (contraseñas con hash).

**Criterio de "Definición de Listo" (DoD):** el usuario puede registrarse con validación de datos, iniciar sesión con sus credenciales y ser redirigido a una página de bienvenida personalizada que muestra su nombre de usuario.

---

## 2. KPI que determina el cumplimiento del objetivo

**KPI:** Porcentaje de funcionalidades de autenticación implementadas y verificadas.

**Fórmula:**

> KPI = (funcionalidades verificadas / funcionalidades planificadas) × 100

**Meta del sprint:** 100% (5/5 funcionalidades).

**Funcionalidades planificadas (criterios de cumplimiento):**

| # | Funcionalidad | Criterio de verificación |
| :---: | :--- | :--- |
| F1 | Registro de usuario | Permite ingresar nombre, apellido, correo y contraseña; valida formato de correo, contraseñas coincidentes y evita cuentas duplicadas. |
| F2 | Inicio de sesión | Valida las credenciales contra los usuarios registrados y muestra error ante datos incorrectos. |
| F3 | Página de bienvenida | Al iniciar sesión redirige a una página que muestra "Bienvenido usuario {nombre}" e indica que la página continúa en desarrollo. |
| F4 | Sesión persistente | La sesión se mantiene al recargar la página y la página de bienvenida está protegida (sin sesión, redirige al login). |
| F5 | Cierre de sesión | El usuario puede cerrar sesión y es devuelto al login. |

---

## 3. Historia de usuario

**HU-S1: Registro e inicio de sesión**

> *Como* vecino de Mataderos interesado en las actividades socioculturales del barrio,
> *quiero* poder crear una cuenta e iniciar sesión en el sitio,
> *para* personalizar mi experiencia y, en futuras versiones, recibir avisos de las actividades y categorías que me interesan.

**Criterios de aceptación**
- Dado que soy un vecino nuevo, cuando completo el formulario de registro con datos válidos, entonces se crea mi cuenta y puedo iniciar sesión.
- Dado que ya tengo cuenta, cuando ingreso mi correo y contraseña correctos, entonces el sistema me redirige a una página con mi nombre de usuario y un mensaje de página en desarrollo.
- Dado que ingreso credenciales incorrectas, entonces el sistema muestra un mensaje de error claro.
- Dado que estoy logueado y recargo la página, entonces mi sesión continúa activa.
- Dado que tengo una sesión activa, cuando cierro sesión, entonces vuelvo al login y no puedo acceder a la página de bienvenida sin iniciar sesión.

---

## 4. Sprint Backlog

Tareas necesarias para cumplir el objetivo, ordenadas por **prioridad** (Alta → Baja) y **dependencia** (las tareas dependientes se ejecutan después de la que las antecede).

| ID | Tarea | Prioridad | Depende de | Estado |
| :---: | :--- | :---: | :--- | :--- |
| S1-01 | Definir modelo de datos del usuario (nombre, apellido, correo, contraseña) y la persistencia del backend (repositorio sobre archivo JSON que simula PostgreSQL/Supabase). | Alta | — | ✅ Hecho |
| S1-02 | Maquetar el formulario de Registro (HTML semántico) con los campos del prototipo de baja fidelidad (Pantalla 4: nombre, apellido, correo, contraseña y confirmación). | Alta | S1-01 | ✅ Hecho |
| S1-03 | Maquetar el formulario de Login (HTML semántico) con correo y contraseña. | Alta | S1-01 | ✅ Hecho |
| S1-04 | Implementar la validación del registro en el backend (formato de correo, contraseñas coincidentes, usuario duplicado) y del lado del cliente con los mensajes de la API. | Alta | S1-02 | ✅ Hecho |
| S1-05 | Implementar la lógica de inicio de sesión en el backend (verificación de hash y emisión de token de sesión) con manejo claro de errores. | Alta | S1-03, S1-04 | ✅ Hecho |
| S1-06 | Implementar la gestión de sesión por token (guardar en el navegador, verificar con `GET /me`) y proteger la página de bienvenida. | Alta | S1-05 | ✅ Hecho |
| S1-07 | Crear la página de bienvenida personalizada ("Bienvenido usuario {nombre}. La página continúa en desarrollo.") con botón de cierre de sesión. | Media | S1-06 | ✅ Hecho |
| S1-08 | Aplicar el Design System del proyecto al módulo (paleta 60-30-10: blanco, naranja #F98017, amarillo #FBC02D; tipografía Poppins; botones redondeados y diseño responsive/mobile-first). | Media | S1-02, S1-03 | ✅ Hecho |
| S1-09 | Verificar el KPI (probar las 5 funcionalidades en navegador y consola sin errores). | Media | S1-07 | ✅ Hecho |
| S1-10 | Actualizar el instrumento de seguimiento grupal (tablero Kanban) y documentar la actividad. | Baja | S1-09 | ✅ Hecho |

**Justificación del orden:** el modelo de datos (S1-01) es la base de todo, por lo que se prioriza primero. Luego se construyen los formularios (S1-02/S1-03) porque el resto de la lógica (S1-04/S1-05) opera sobre ellos. La sesión (S1-06) y la página de bienvenida (S1-07) dependen del login funcional. El diseño (S1-08) acompaña a los formularios, y la verificación (S1-09) y el seguimiento (S1-10) cierran el sprint.

---

## 5. Desarrollo de lo planificado (aplicación de la teoría)

### 5.1. Arquitectura del código y buenas prácticas

La entrega se desarrolló con el stack definido en la **Actividad 24 (Arquitectura del Proyecto)**: React (Frontend), Node.js + Express (Backend) y API REST como única vía de comunicación entre ambos.

```
Conectando-Cultura/
├── backend/                         → Capa de negocio (Node.js + Express + TypeScript)
│   ├── package.json / tsconfig.json
│   └── src/
│       ├── index.ts                 → Bootstrap del servidor (app Express, rutas, puerto)
│       ├── types.ts                 → Tipos del dominio (Usuario, Sesión, DTOs, errores)
│       ├── routes/
│       │   └── auth.routes.ts       → Rutas HTTP: /api/auth/{registro|login|me|logout}
│       ├── middlewares/
│       │   └── autenticacion.middleware.ts  → Protección de rutas (valida token Bearer)
│       ├── services/
│       │   ├── auth.service.ts      → Toda la lógica de negocio de autenticación
│       │   └── password.ts          → Hashing scrypt (hash, verificación, tokens)
│       └── repositories/
│           ├── usuario.repository.ts → Persistencia de usuarios (JSON → Supabase en Sprint 3)
│           └── sesion.repository.ts  → Sesiones activas en memoria (token, expiración)
└── frontend/                        → Capa de presentación (React + TypeScript + Vite)
    ├── package.json / tsconfig.json / vite.config.ts
    └── src/
        ├── main.tsx / App.tsx       → Montaje, rutas (/) (/login) (/registro) (/bienvenido)
        ├── index.css                → Design System del proyecto (paleta 60-30-10)
        ├── tipos.ts                 → Tipos compartidos del frontend
        ├── api/
        │   └── client.ts            → Cliente HTTP de la API REST (fetch)
        ├── contexto/
        │   └── AuthContext.tsx      → Única fuente de la sesión en el frontend
        ├── componentes/
        │   └── Navbar.tsx           → Barra de navegación (cambia según haya sesión)
        └── paginas/
            ├── Inicio.tsx           → Landing de Conectando Cultura
            ├── Login.tsx            → Formulario de inicio de sesión
            ├── Registro.tsx         → Formulario de registro
            ├── Bienvenido.tsx       → Página de bienvenida personalizada
            └── Protegida.tsx        → Envoltura de ruta protegida (sin sesión → /login)
```

### 5.2. Cohesión

El sistema se diseñó con **alta cohesión**, agrupando el código según su única responsabilidad:

- **Capa de presentación (React):**
  - **`AuthContext.tsx`** concentra toda la lógica de sesión del frontend (iniciar sesión, registrar, cerrar sesión, mantener el usuario autenticado) y es la **única** fuente de estado de autenticación.
  - **`api/client.ts`** centraliza todas las peticiones HTTP: las páginas nunca construyen `fetch` ni conocen las URLs, solo llaman a funciones del contexto.
  - **`paginas/`** contiene una página por ruta del árbol web, cada una con una única responsabilidad (mostrar formulario, mostrar bienvenida, proteger rutas).
- **Capa de negocio (Node.js):**
  - **`auth.service.ts`** posee toda la lógica de validación y autenticación: rutas, middleware y repositorios no repiten reglas.
  - **`password.ts`** aísla las operaciones criptográficas (hash y verificación con scrypt, generación de tokens).
  - **`repositories/`** agrupa el acceso a datos: `usuario.repository.ts` (persistencia) y `sesion.repository.ts` (token + expiración).
- **Cada clase/función tiene una única responsabilidad:** `AuthService.registrar` solo registra, `UsuarioRepository.crear` solo persiste y `autenticacionRequerida` solo valida el token. Esto facilita leer, probar y corregir cada pieza por separado.
- **TypeScript en todo el stack** (tipos compartidos en `types.ts`/`tipos.ts`) documenta los contratos entre capas y evita errores silenciosos en tiempo de ejecución.

### 5.3. Acoplamiento

Se buscó un **bajo acoplamiento** entre capas:

- **Frontend ↔ Backend:** la comunicación es exclusivamente por **API REST** (`/api/auth/...`), como se definió en la Actividad 24 ("Exceptions lo que la interfaz (React) se comunique con la lógica de negocio (Node.js) exclusivamente a través de una API REST"). El frontend no conoce el almacenamiento ni la fuente de los datos.
- **Páginas ↔ estado:** los formularios llaman solo a `useAuth()` (`iniciarSesion`, `registrar`, `cerrarSesion`) y a `api/client.ts`. Si cambia el backend (ej. migración a Supabase en el Sprint 3), **no se toca ninguna página**.
- **Rutas ↔ servicio:** `auth.routes.ts` traduce HTTP a llamadas y `autenticacion.middleware.ts` solo valida tokens; ninguno conoce cómo se guardan usuarios o sesiones.
- **Manejo de errores desacoplado:** el backend responde mensajes claros en español (`{mensaje}`) y el frontend los muestra tal cual, sin duplicar reglas de validación.
- **DTOs:** la API nunca expone datos sensibles: `aPublico()` devuelve solo `{nombre, apellido, correo}`.

### 5.4. Seguridad e implementación (según la Arquitectura del Proyecto)

De acuerdo con la Declaración de Alcance, el Project Charter (Actividades 11 y 12) y la Arquitectura (Actividad 24):

- **Contraseñas con hash:** se almacenan con **scrypt** (derivación de clave de la librería estándar de Node, con sal aleatoria y comparación en tiempo constante), nunca en texto plano.
- **Sesiones por token:** al iniciar sesión, el backend emite un token aleatorio de 64 caracteres con vigencia de 7 días; el frontend lo conserva en el navegador y lo envía como `Authorization: Bearer ...`. La ruta `/me` y el cierre de sesión están protegidos por middleware, anticipando la **"Protección de Rutas"** del backlog (tarea 4.2).
- **Persistencia:** en este sprint los usuarios se guardan en un archivo JSON local (`backend/data/usuarios.json`) que **simula la base PostgreSQL (Supabase)** prevista en la Arquitectura. Al conectar Supabase en el Sprint 3 del backlog, solo se reemplaza la capa de repositorio: el resto del sistema no se modifica.
- **Exclusiones respetadas:** no se implementaron 2FA ni recuperación de contraseña compleja, como establece el Alcance.
- **Sesiones en memoria:** el repositorio de sesiones vive en memoria del servidor (suficiente para el sprint); se documenta su reemplazo por el store de Supabase al integrar el provider de auth (tarea 2.2 del Product Backlog).

### 5.5. Alineación con el proyecto

- **Prototipo (Actividad 25, Pantalla 4):** el login pide *"Gmail/Número y Contraseña"* y el registro *"nombre, apellido, correo y confirmación de contraseña"*; se respetó ese diseño.
- **Design System (Actividad 26):** paleta 60-30-10 (blanco, naranja `#F98017`, amarillo `#FBC02D`), tipografía Poppins (subtítulos y texto; se usa la misma familia para títulos con mayor peso, con fallback a fuentes del sistema), botones con bordes redondeados, iconografía simple y diseño **mobile-first / responsive**.
- **Árbol web (Actividad 15):** el flujo `Login/Registro → Configuración de la Cuenta` se respeta: tras autenticarse, el usuario llega a su página de bienvenida (pendiente de desarrollo, según indica el propio mensaje).
- **Requerimiento funcional (Actividad 15):** *"El sistema debe incluir un módulo de autenticación (Login/Registro) para que los usuarios gestionen sus preferencias"* — cumplido en su versión básica.

---

## 6. Instrumento de seguimiento grupal (actualizado)

Tablero Kanban del Sprint 1 (Login y Register) — modelo Scrumban del proyecto. Estado al cierre del sprint.

| Estado | Tareas |
| :--- | :--- |
| **Por hacer (Backlog)** | — (sin tareas pendientes) |
| **En progreso (Doing)** | — |
| **Hecho (Done)** | S1-01 Modelo de datos y localStorage · S1-02 Formulario de Registro · S1-03 Formulario de Login · S1-04 Validación del registro · S1-05 Lógica de inicio de sesión · S1-06 Sesión persistente y protección de ruta · S1-07 Página de bienvenida personalizada · S1-08 Aplicación del Design System · S1-09 Verificación del KPI · S1-10 Documentación y seguimiento |

**Roles del sprint (rotación):** por el tamaño del sprint, el equipo completo participó en el desarrollo, con Kevin (Scrum Master) coordinando la división de tareas según la disponibilidad semanal (1-3 horas por integrante) y Dante (Product Owner) validando los criterios de aceptación contra el prototipo.

**Decisiones registradas:**
- Se implementó el stack de la Actividad 24: React + TypeScript + Vite (frontend) y Node.js + Express + TypeScript (backend), comunicados por API REST.
- La base de datos se simula con un archivo JSON (`backend/data/usuarios.json`) a la espera de conectar PostgreSQL/Supabase en el Sprint 3 del backlog.
- Las contraseñas se guardan con hash scrypt y las sesiones usan tokens Bearer con expiración (no hay contraseñas en texto plano ni credenciales en el frontend).
- La lógica de autenticación quedó aislada en el backend (`AuthService` + repositorios) para facilitar la futura migración a Supabase/Firebase (tarea 2.2 del Product Backlog) sin tocar las páginas.

---

## 7. Verificación del cumplimiento del KPI

**KPI = (funcionalidades verificadas / 5) × 100**

| # | Funcionalidad | Verificación realizada | Resultado |
| :---: | :--- | :--- | :---: |
| F1 | Registro con validación | Pruebas automatizadas contra la API real (`POST /api/auth/registro`): datos vacíos → 400; correo inválido → 400; contraseñas distintas → 400; contraseña corta → 400; datos válidos → 201 (cuenta creada, sin datos sensibles); correo duplicado (con distinta capitalización) → 409. | ✅ Cumple |
| F2 | Inicio de sesión | `POST /api/auth/login`: credenciales correctas → 200 + token; contraseña incorrecta → 401 "Correo o contraseña incorrectos"; usuario inexistente → 401. | ✅ Cumple |
| F3 | Página de bienvenida | Tras el login, la ruta `/bienvenido` (protegida) muestra **"Bienvenido usuario {nombre}. La página continúa en desarrollo."** — se verificó vía `GET /api/auth/me` que el usuario logueado llega con nombre y apellido correctos y el componente los renderiza. | ✅ Cumple |
| F4 | Sesión persistente | `GET /api/auth/me` con el token devuelve el usuario (200); sin token o con token inválido → 401 y el frontend redirige a `/login` (ruta protegida). Al recargar la página, el contexto restaura la sesión desde el token guardado. | ✅ Cumple |
| F5 | Cierre de sesión | `POST /api/auth/logout` → 204; al reutilizar el mismo token en `/me` → 401 (la sesión quedó efectivamente cerrada en el servidor). En la UI, "Cerrar sesión" limpia el token y devuelve al login. | ✅ Cumple |

**Resultado: 5/5 = 100% → KPI de cumplimiento del sprint: cumplido (meta 100%).**

**Verificaciones adicionales de calidad (KPI colateral):**
- **16 pruebas automatizadas** de la API (registro, login, sesión, logout) ejecutadas contra el servidor real: todas pasaron.
- `tsc --noEmit` (typecheck) sin errores en **backend** y **frontend**; build de producción de Vite exitoso (≈56 kB gzip).
- Sin contraseñas en texto plano en ningún archivo (solo hash scrypt); la API nunca devuelve datos sensibles del usuario.
- El diseño se adapta a pantallas de celular y escritorio (mobile-first), según el Design System de la Actividad 26.

---

**Cómo ejecutar la entrega (local):**

```bash
# Backend (API en http://localhost:3001)
cd backend
npm install
npm run dev

# Frontend (sitio en http://localhost:5173)
cd frontend
npm install
npm run dev
```

El frontend redirige `/api` al backend mediante el proxy de Vite. Para producción, `npm run build` en el frontend genera `dist/` (desplegable en Vercel).

---

## Conclusión

El sprint cumplió su objetivo: **Conectando Cultura** cuenta con un módulo de autenticación funcional (registro, login, sesión persistente por token, cierre de sesión y página de bienvenida personalizada), desarrollado sobre la arquitectura React + TypeScript / Node.js + Express de la Actividad 24, con alta cohesión y bajo acoplamiento entre capas, contraseñas con hash y alineado con el Design System del proyecto. Esto habilita el siguiente paso del roadmap: el dashboard de preferencias (Sprint 3: Datos y Preferencias), donde el usuario podrá elegir barrios y categorías para recibir notificaciones.