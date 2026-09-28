# **Sprint 4: Gestión Admin y Geolocalización — Desarrollo de la Actividad**

**Proyecto Integrador III — "Conectando Cultura"**  
*Escuela Técnica N°20 DE 20 "Carolina Muzilli" — Polo Educativo de Mataderos*

**Profesores:** Camila Lambertucci y Sebastian Anderson  
**Estudiantes:** Damian Orellana, Dante Battiato, Juan Mendoza, Kevin Machaca  
**Curso:** 6° 2°  

---

## 1. Objetivo del sprint

Desarrollar el panel de gestión administrativa (CRUD) y el sistema de geolocalización asistida de **Conectando Cultura**, garantizando que los administradores del proyecto puedan mantener actualizado el catálogo de actividades socioculturales con coordenadas precisas y acceso protegido por roles. Este sprint da cumplimiento directo a las tareas 4.1, 4.2 y 4.3 del Product Backlog general (Actividad 18):

- **4.1:** Desarrollo de Formularios CRUD para administradores (alta, edición, activación/desactivación y borrado de actividades).
- **4.2:** Implementación de Protección de Rutas y control de acceso basado en roles (RBAC: `admin` vs `usuario`), restringiendo endpoints sensibles del backend y vistas privadas en frontend.
- **4.3:** Lógica de Geolocalización asistida mediante la API pública de **Nominatim (OpenStreetMap)** para autocompletar automáticamente latitud y longitud a partir de la dirección ingresada.

**Criterio de "Definición de Listo" (DoD):**  
Un usuario con credenciales de administrador puede iniciar sesión, acceder al panel `/admin`, buscar las coordenadas de cualquier dirección en Mataderos con un solo clic, crear y modificar actividades en tiempo real, mientras que los usuarios comunes o no autenticados tienen el acceso estrictamente denegado con código HTTP 403 / 401.

---

## 2. KPI que determina el cumplimiento del objetivo

**KPI:** Porcentaje de funcionalidades de gestión administrativa y geolocalización implementadas y verificadas.

**Fórmula:**

$$\text{KPI} = \left( \frac{\text{funcionalidades verificadas}}{\text{funcionalidades planificadas}} \right) \times 100$$

**Meta del sprint:** 100% (5/5 funcionalidades).

**Funcionalidades planificadas (criterios de cumplimiento):**

| # | Funcionalidad | Criterio de verificación |
| :---: | :--- | :--- |
| **F1** | Control de Acceso Basado en Roles (RBAC) | Distinción de roles (`usuario` / `admin`). Middleware backend `adminRequerido` rechaza no-admins con HTTP 403; frontend `ProtegidaAdmin` bloquea vistas. |
| **F2** | Visualización y Métricas en Panel Admin | Vista `/admin` lista todas las actividades (activas e inactivas) y consume estadísticas del sistema (`/api/admin/estadisticas`). |
| **F3** | Alta de Actividad (Create) | Modal interactivo para dar de alta actividades con validaciones de campos obligatorios, guardando en persistencia. |
| **F4** | Modificación y Borrado Lógico (Update/Delete) | Edición de datos (PATCH) y desactivación lógica (DELETE) que oculta la actividad del catálogo público sin perder su historial. |
| **F5** | Geocodificación Automática con Nominatim | Botón "📍 Ubicar en mapa" que consulta la API de OpenStreetMap y completa automáticamente los campos `lat` y `lng`. |

---

## 3. Historias de usuario

### HU-S4.1: ABM de actividades por administradores
> *Como* administrador de la plataforma Conectando Cultura,  
> *quiero* disponer de un panel de control para crear, modificar o dar de baja eventos e instituciones culturales,  
> *para* asegurar que la oferta comunitaria publicada para los vecinos sea verídica, vigente y de calidad.

**Criterios de aceptación:**
- **Dado que** inicio sesión con una cuenta con rol `admin`, **cuando** accedo al menú superior, **entonces** visualizo el enlace directo "⚙️ Admin".
- **Dado que** completo el formulario modal con los datos de una nueva actividad y presiono "Crear actividad", **cuando** la API responde con éxito, **entonces** la actividad aparece inmediatamente en la tabla del panel y en el catálogo público.
- **Dado que** selecciono "Eliminar", **cuando** confirmo la acción, **entonces** la actividad cambia su estado a inactiva y deja de mostrarse a los vecinos comunes.

### HU-S4.2: Geolocalización asistida
> *Como* administrador cargando una propuesta cultural barrial,  
> *quiero* ingresar la dirección de la calle y que el sistema calcule automáticamente sus coordenadas geográficas,  
> *para* no tener que buscar manualmente la latitud y longitud en mapas externos, reduciendo tiempos y errores humanos.

**Criterios de aceptación:**
- **Dado que** escribo una dirección de Mataderos (ej. "Av. de los Corrales 6600") en el formulario admin, **cuando** presiono "📍 Ubicar en mapa", **entonces** el sistema consulta la API de Nominatim y rellena los campos de latitud y longitud.
- **Dado que** la dirección no arroja resultados, **cuando** finaliza la consulta, **entonces** el sistema alerta al operador permitiendo ingresar las coordenadas de forma manual.

### HU-S4.3: Seguridad y restricción de privilegios
> *Como* desarrollador y responsable de la seguridad del sistema,  
> *quiero* que solo los usuarios verificados con rol `admin` puedan alterar los datos maestros del sitio,  
> *para* proteger la integridad de la base de datos contra accesos no autorizados o ataques malintencionados.

**Criterios de aceptación:**
- **Dado que** un usuario común intenta enviar una petición POST/PATCH/DELETE a `/api/actividades`, **cuando** el backend procesa el token, **entonces** retorna código de estado HTTP 403 Forbidden ("Acceso denegado").
- **Dado que** un usuario sin rol administrativo navega directamente a la URL `/admin`, **cuando** el componente `ProtegidaAdmin` evalúa su rol, **entonces** se le presenta una pantalla clara de acceso denegado con opción de volver al inicio.

---

## 4. Sprint Backlog

| ID | Tarea | Prioridad | Depende de | Estado |
| :---: | :--- | :---: | :--- | :---: |
| **S4-01** | Definir el campo `rol: "usuario" \| "admin"` en el modelo del usuario y actualizar los repositorios (`usuario.repository.ts` y SQL `002_admin_roles.sql`). | Alta | — | ✅ Hecho |
| **S4-02** | Desarrollar el middleware backend `adminRequerido` para validar el rol del usuario autenticado y retornar 403 ante permisos insuficientes. | Alta | S4-01 | ✅ Hecho |
| **S4-03** | Crear rutas protegidas de administración en backend: `POST /api/actividades`, `PATCH /api/actividades/:id`, `DELETE /api/actividades/:id` y `GET /api/admin/estadisticas`. | Alta | S4-02 | ✅ Hecho |
| **S4-04** | Configurar usuario administrador inicial (`admin@conectandocultura.ar` / `Admin123!`) en la base de usuarios sembrada. | Alta | S4-01 | ✅ Hecho |
| **S4-05** | Crear la guarda de rutas en React `ProtegidaAdmin.tsx` para bloquear visualmente el acceso a usuarios no autorizados. | Alta | S4-02 | ✅ Hecho |
| **S4-06** | Maquetar y programar el panel `AdminActividades.tsx` con tabla de gestión, filtros de estado (todas / activas / inactivas) y acciones de fila. | Alta | S4-03, S4-05 | ✅ Hecho |
| **S4-07** | Implementar formulario modal para crear y editar actividades con validaciones y feedback de carga. | Media | S4-06 | ✅ Hecho |
| **S4-08** | Integrar servicio de geocodificación libre con la API de Nominatim (`https://nominatim.openstreetmap.org/search`). | Media | S4-07 | ✅ Hecho |
| **S4-09** | Actualizar la barra de navegación (`Navbar.tsx`) para mostrar el enlace "⚙️ Admin" únicamente a usuarios con rol administrativo. | Baja | S4-05 | ✅ Hecho |
| **S4-10** | Verificar exhaustivamente el KPI mediante pruebas HTTP y documentar el informe del sprint. | Media | S4-08, S4-09 | ✅ Hecho |

---

## 5. Desarrollo de lo planificado (aplicación de la teoría)

### 5.1. Seguridad y Control de Acceso por Roles (RBAC)

La arquitectura asegura que la seguridad se valide en dos niveles complementarios:

1. **Defensa en Profundidad en el Backend:**
   En [`backend/src/middlewares/autenticacion.middleware.ts`](file:///c:/Users/damia/OneDrive/Documentos/GitHub/conectando-cultura/backend/src/middlewares/autenticacion.middleware.ts), el middleware `adminRequerido` se encadena inmediatamente después de `autenticacionRequerida(auth)`:
   ```typescript
   export function adminRequerido(req: Request, res: Response, next: NextFunction): void {
     const usuario = req.usuarioPublico;
     if (!usuario || usuario.rol !== "admin") {
       res.status(403).json({ mensaje: "Acceso denegado. Necesitás permisos de administrador." });
       return;
     }
     next();
   }
   ```
2. **Defensa en la Interfaz (Frontend):**
   El componente [`ProtegidaAdmin.tsx`](file:///c:/Users/damia/OneDrive/Documentos/GitHub/conectando-cultura/frontend/src/paginas/ProtegidaAdmin.tsx) evalúa el contexto de autenticación: si no hay sesión redirige a `/login`; si el usuario no tiene rol admin, bloquea el renderizado y muestra una pantalla de acceso restringido.

### 5.2. Asistente de Geolocalización con Nominatim

Para evitar depender de servicios de pago como Google Maps API y mantener la filosofía de software comunitario de código abierto, se integró el servicio de geocodificación directa de **Nominatim**:

```typescript
async function buscarCoordenadas() {
  if (!form.direccion.trim()) {
    setMensajeGeo("Escribí una dirección primero.");
    return;
  }
  setBuscandoGeo(true);
  try {
    const consulta = encodeURIComponent(`${form.direccion}, Mataderos, CABA, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${consulta}&limit=1`);
    const datos = await res.json();
    if (datos && datos.length > 0) {
      setForm((prev) => ({
        ...prev,
        lat: parseFloat(datos[0].lat).toFixed(6),
        lng: parseFloat(datos[0].lon).toFixed(6)
      }));
      setMensajeGeo("✅ Coordenadas encontradas.");
    } else {
      setMensajeGeo("⚠️ No se encontró la dirección exacta. Podés ingresarlas manualmente.");
    }
  } catch {
    setMensajeGeo("Error al consultar el servicio de mapa.");
  } finally {
    setBuscandoGeo(false);
  }
}
```

---

## 6. Verificación del KPI y pruebas

Se realizaron pruebas con cURL / PowerShell sobre las rutas seguras y de administración:

| # | Prueba realizada | Petición / Contexto | Código esperado | Resultado |
| :---: | :--- | :--- | :---: | :---: |
| 1 | Intento de acceso admin con usuario común | `GET /api/admin/estadisticas` (Token de usuario normal) | HTTP 403 Forbidden | ✅ 403 Acceso denegado |
| 2 | Acceso a estadísticas con usuario admin | `GET /api/admin/estadisticas` (`admin@conectandocultura.ar`) | HTTP 200 OK con contadores | ✅ 200 OK (26 act, 4 usr) |
| 3 | Alta de nueva actividad cultural | `POST /api/actividades` (payload completo + token admin) | HTTP 201 Created | ✅ 201 Actividad creada |
| 4 | Modificación de actividad existente | `PATCH /api/actividades/:id` (actualización de nombre/horario) | HTTP 200 OK con datos nuevos | ✅ 200 OK Modificada |
| 5 | Eliminación lógica de actividad | `DELETE /api/actividades/:id` (token admin) | HTTP 204 No Content | ✅ 204 (activo: false) |
| 6 | Verificación de aislamiento en catálogo | `GET /api/actividades` público tras borrado lógico | Exclusión de la actividad dada de baja | ✅ Oculta para vecinos |

**Cálculo del KPI:**

$$\text{KPI} = \left( \frac{5}{5} \right) \times 100 = 100\%$$

---

## 7. Instrumento de seguimiento grupal (Tablero Kanban)

```
[ BACKLOG FUTURO ]
- S5-01: Configuración de Leaflet e interactividad geográfica
- S8-01: Alertas por correo vía Resend

[ HECHO (DONE) - SPRINT 4 ]
- ✅ S4-01: Modelo de rol (usuario/admin) en tipos y repositorios
- ✅ S4-02: Middleware backend adminRequerido con HTTP 403
- ✅ S4-03: Endpoints CRUD de actividades y métricas del sistema
- ✅ S4-04: Usuario administrador inicial (admin@conectandocultura.ar)
- ✅ S4-05: Componente frontend ProtegidaAdmin
- ✅ S4-06: Panel administrativo /admin con tabla de actividades
- ✅ S4-07: Formulario modal con validación y estados de carga
- ✅ S4-08: Integración de geocodificación con Nominatim
- ✅ S4-09: Navbar con visibilidad condicional de acceso admin
- ✅ S4-10: Verificación de KPI (100%) y documentación académica
```

**Conclusión:**  
El Sprint 4 dota al proyecto de una administración robusta, segura y autónoma. El equipo y los referentes barriales disponen de una herramienta completa para autogestionar el mapa sociocultural de Mataderos de manera ágil y georreferenciada.
