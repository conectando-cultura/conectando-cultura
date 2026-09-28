# **Sprint 3: Datos y Preferencias — Desarrollo de la Actividad**

**Proyecto Integrador III — "Conectando Cultura"**  
*Escuela Técnica N°20 DE 20 "Carolina Muzilli" — Polo Educativo de Mataderos*

**Profesores:** Camila Lambertucci y Sebastian Anderson  
**Estudiantes:** Damian Orellana, Dante Battiato, Juan Mendoza, Kevin Machaca  
**Curso:** 6° 2°  

---

## 1. Objetivo del sprint

Implementar la persistencia de datos centralizada de **Conectando Cultura**, incorporando el inventario sociocultural inicial de Mataderos y el panel de configuración de preferencias para los vecinos registrados. Este sprint cumple con las tareas 3.1, 3.2 y 3.3 del Product Backlog general (Actividad 18) y con el objetivo de persistencia definido en la arquitectura técnica (Actividad 24):

- **3.1:** Diseño del esquema de la base de datos relacional (tablas `categorias`, `vecindes`/`barrios`, `actividades`, `preferencias_usuario`).
- **3.2:** Dashboard de Preferencias (`/preferencias`): formulario interactivo para que el vecino elija sus barrios de interés y categorías de actividades preferidas.
- **3.3:** Carga del inventario inicial con 26+ instituciones, espacios culturales, clubes y sitios históricos de Mataderos con coordenadas geográficas reales (latitud y longitud).

El desarrollo se diseñó bajo una **arquitectura desacoplada y resiliente**: soporte nativo para **Supabase (PostgreSQL)** mediante migraciones SQL versionadas (`supabase/migrations/001_initial_schema.sql`), junto con un repositorio de persistencia local en JSON (`backend/data/`) que garantiza alta disponibilidad, ejecución offline y facilidad de prueba en entornos de desarrollo sin fricciones de infraestructura.

**Criterio de "Definición de Listo" (DoD):**  
El catálogo de 26+ actividades de Mataderos se encuentra disponible y categorizado en la API; los usuarios registrados pueden consultar y actualizar sus preferencias de barrio y rubros desde la interfaz web, persistiendo los cambios de forma inmediata.

---

## 2. KPI que determina el cumplimiento del objetivo

**KPI:** Porcentaje de funcionalidades de datos y preferencias implementadas y verificadas.

**Fórmula:**

$$\text{KPI} = \left( \frac{\text{funcionalidades verificadas}}{\text{funcionalidades planificadas}} \right) \times 100$$

**Meta del sprint:** 100% (5/5 funcionalidades).

**Funcionalidades planificadas (criterios de cumplimiento):**

| # | Funcionalidad | Criterio de verificación |
| :---: | :--- | :--- |
| **F1** | Esquema de Base de Datos y Migraciones | Tablas creadas con claves primarias, foráneas, constraints de unicidad y políticas de seguridad (RLS). |
| **F2** | Carga de Inventario Cultural de Mataderos | 26+ actividades emblemáticas con nombre, descripción, horarios, dirección, lat/lng, barrio y categoría disponibles vía `GET /api/actividades`. |
| **F3** | Endpoints de Barrios y Categorías | Consultas públicas `GET /api/actividades/barrios` y `GET /api/actividades/categorias` con colores e iconos de rubros. |
| **F4** | Dashboard de Preferencias del Vecino | Interfaz `/preferencias` protegida que permite marcar/desmarcar categorías y seleccionar el barrio habitual. |
| **F5** | Persistencia de Preferencias por Usuario | `PUT /api/preferencias` actualiza la selección del usuario logueado y `GET /api/preferencias` la recupera fielmente al recargar. |

---

## 3. Historias de usuario

### HU-S3.1: Configuración de intereses culturales
> *Como* vecino registrado de Mataderos,  
> *quiero* seleccionar mis categorías de interés (ej. Ferias, Cine y Teatro, Gastronomía) y mi barrio de preferencia,  
> *para* personalizar la información cultural que consumo y preparar el sistema para recibir avisos relevantes.

**Criterios de aceptación:**
- **Dado que** inicio sesión y navego a `/preferencias`, **cuando** carga la página, **entonces** veo la lista completa de categorías con sus colores distintivos y el selector de barrios.
- **Dado que** selecciono una o varias categorías y un barrio, **cuando** hago clic en "Guardar preferencias", **entonces** el sistema guarda mis datos y muestra un mensaje de éxito sin recargar la página.
- **Dado que** vuelvo a ingresar al sitio en otra sesión, **cuando** visito `/preferencias`, **entonces** mis elecciones anteriores aparecen marcadas por defecto.

### HU-S3.2: Exploración del inventario barrial
> *Como* vecino o visitante de Mataderos,  
> *quiero* acceder a un listado organizado de actividades socioculturales con sus datos de contacto y ubicación,  
> *para* conocer qué propuestas existen en el barrio y cómo llegar a ellas.

**Criterios de aceptación:**
- **Dado que** accedo a `/actividades` o `/mapa`, **cuando** el sistema consulta a la API, **entonces** recibe las actividades activas del barrio con sus coordenadas geográficas, horarios y direcciones exactas.
- **Dado que** aplico un filtro por categoría o barrio, **cuando** cambia la selección, **entonces** la lista se actualiza mostrando únicamente las actividades coincidentes.

---

## 4. Sprint Backlog

Tareas ordenadas por **prioridad** y **dependencia técnica**:

| ID | Tarea | Prioridad | Depende de | Estado |
| :---: | :--- | :---: | :--- | :---: |
| **S3-01** | Redactar scripts de migración SQL para Supabase (`001_initial_schema.sql`) definiendo tipos ENUM, tablas, claves foráneas y RLS. | Alta | — | ✅ Hecho |
| **S3-02** | Relevar y estructurar el dataset inicial de 26+ actividades culturales de Mataderos a partir de la investigación previa (Actividades 1 a 10 de la bitácora). | Alta | S3-01 | ✅ Hecho |
| **S3-03** | Crear repositorios de datos locales (`barrios.json`, `categorias.json`, `actividades.json`, `preferencias.json`) para soporte offline y desacoplamiento. | Alta | S3-02 | ✅ Hecho |
| **S3-04** | Implementar `ActividadesService` con métodos de listado general, filtrado por slug de categoría/barrio y fallback de contingencia. | Alta | S3-03 | ✅ Hecho |
| **S3-05** | Exponer endpoints REST en `actividades.routes.ts`: `GET /api/actividades`, `/barrios` y `/categorias`. | Alta | S3-04 | ✅ Hecho |
| **S3-06** | Implementar `PreferenciasService` y rutas REST `GET /api/preferencias` y `PUT /api/preferencias` asociadas al token del usuario autenticado. | Alta | S3-05 | ✅ Hecho |
| **S3-07** | Desarrollar la página `/preferencias` en React con feedback visual interactivo, grid de checkboxes con diseño DS 60-30-10 y botón de guardado. | Media | S3-06 | ✅ Hecho |
| **S3-08** | Conectar la vista de catálogo (`Actividades.tsx`) y mapa Leaflet (`Mapa.tsx`) con los datos provistos por la API. | Media | S3-05 | ✅ Hecho |
| **S3-09** | Ejecutar pruebas de integración con cURL / PowerShell y verificar el cumplimiento estricto del KPI del sprint. | Media | S3-07, S3-08 | ✅ Hecho |
| **S3-10** | Documentar el sprint en la bitácora técnica y actualizar el tablero Kanban. | Baja | S3-09 | ✅ Hecho |

---

## 5. Desarrollo de lo planificado (aplicación de la teoría)

### 5.1. Arquitectura de persistencia desacoplada

Siguiendo el principio de **bajo acoplamiento** y **alta cohesión**, el backend aísla por completo el almacenamiento respecto a las rutas HTTP y la capa de presentación:

```
backend/
├── data/                                → Persistencia local / Offline Mock
│   ├── actividades.json                 → 26+ actividades de Mataderos con coordenadas
│   ├── barrios.json                     → Barrios de la Comuna 9 y aledaños
│   ├── categorias.json                  → 9 rubros culturales con color e icono
│   └── preferencias.json                → Preferencias registradas por usuario
└── src/
    ├── lib/supabase.ts                  → Cliente Supabase resiliente (detección de entorno)
    ├── repositories/
    │   └── local-data.repository.ts     → Acceso tipado a JSON con transacciones seguras
    ├── services/
    │   ├── actividades.service.ts       → Reglas de negocio y consultas culturales
    │   └── preferencias.service.ts      → Lógica de asociación usuario-intereses
    └── routes/
        ├── actividades.routes.ts        → Endpoints /api/actividades/*
        └── preferencias.routes.ts       → Endpoints /api/preferencias (protegidos)
```

### 5.2. Modelo de datos relacional

El esquema SQL implementado en `supabase/migrations/001_initial_schema.sql` establece la siguiente estructura:

1. **`vecindes` (barrios):** `id (UUID PK)`, `nombre (TEXT UNIQUE)`, `slug (TEXT UNIQUE)`.
2. **`categorias`:** `id (UUID PK)`, `nombre (TEXT UNIQUE)`, `slug (TEXT UNIQUE)`, `color (CHAR(7))`, `icono (TEXT)`.
3. **`actividades`:** `id (UUID PK)`, `nombre`, `slug`, `descripcion`, `horarios`, `direccion`, `lat (DECIMAL)`, `lng (DECIMAL)`, `url`, `imagen_url`, `categoria_id (FK)`, `barrio_id (FK)`, `destacado (BOOL)`, `activo (BOOL)`.
4. **`preferencias_usuario`:** `usuario_id (UUID PK)`, `barrio_id (UUID FK NULL)`, `categoria_ids (UUID[] DEFAULT '{}')`, `updated_at`.

### 5.3. Catálogo representativo de Mataderos sembrado

Se integraron 26 lugares de valor histórico, patrimonial y social documentados en la bitácora del proyecto:
- **Ferias y Mercados:** Feria de Mataderos (Av. Lisandro de la Torre y De los Corrales).
- **Cine y Teatro:** Cine Teatro El Plata (Av. Juan B. Alberdi 5765), Centro Macedonio Fernández, Teatro Comunitario Res o No Res.
- **Bares Notables y Gastronomía:** Bar Pizzería El Cedrón (Alberdi 6101), Bar Oviedo (Lisandro de la Torre 2407), Bar del Glorias (Andalgalá 1982).
- **Museos y Patrimonio:** Museo Criollo de los Corrales (De los Corrales 6501), Taller de Fileteado Memo Caviglia.
- **Música y Peñas:** Club Glorias Argentinas (Bragado 6875), El Fortín de Celia Rocha (Chascomús 5240), Catedral del Tango.
- **Educación y Bibliotecas:** E.T. N°20 DE 20 "Carolina Muzilli", Biblioteca Popular José E. Rodó, Biblioteca Benito Lynch.
- **Deportes y Clubes:** Club Nueva Chicago (Lisandro de la Torre 2288), Polideportivo Santojanni.
- **Comunitarios y Parques:** Parque Alberdi, Plaza Salaberry (con su Calesita), FM La Milagrosa 88.3, Radio Frecuencia Zero 92.5, Parroquia San Vicente de Paul.

---

## 6. Verificación del KPI y pruebas

Se ejecutaron pruebas automatizadas y funcionales vía HTTP sobre la API REST proxeada:

| # | Prueba realizada | Comando / Solicitud | Resultado esperado | Resultado obtenido |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Listar actividades | `GET /api/actividades` | HTTP 200, array con 26 actividades | ✅ 26 actividades recibidas |
| 2 | Filtrar por categoría | `GET /api/actividades?categoriaSlug=ferias` | HTTP 200, solo rubro Ferias | ✅ Feria de Mataderos filtrada |
| 3 | Listar barrios | `GET /api/actividades/barrios` | HTTP 200, lista de 6 barrios | ✅ 6 barrios con slug |
| 4 | Listar categorías | `GET /api/actividades/categorias` | HTTP 200, 9 categorías con iconos | ✅ 9 categorías con color |
| 5 | Guardar preferencias | `PUT /api/preferencias` (con Bearer token) | HTTP 200, objeto con selecciones | ✅ Preferencias guardadas |
| 6 | Recuperar preferencias | `GET /api/preferencias` (con Bearer token) | HTTP 200, devuelve barrios y categorías | ✅ Coincidencia idéntica |

**Cálculo del KPI:**

$$\text{KPI} = \left( \frac{5}{5} \right) \times 100 = 100\%$$

---

## 7. Instrumento de seguimiento grupal (Tablero Kanban)

```
[ BACKLOG ]
- S5-01: Marcadores enriquecidos con Leaflet
- S6-01: Interacción con popups informativos
- S8-01: Notificaciones por correo electrónico

[ HECHO (DONE) - SPRINT 3 ]
- ✅ S3-01: Schema SQL y migraciones en Supabase
- ✅ S3-02: Relevamiento y coordenadas de 26+ sitios de Mataderos
- ✅ S3-03: Repositorio local resiliente en backend/data/
- ✅ S3-04: Lógica de ActividadesService con filtros
- ✅ S3-05: Endpoints públicos de catálogo, barrios y categorías
- ✅ S3-06: Endpoints y servicio de preferencias de usuario
- ✅ S3-07: Pantalla interactiva /preferencias con feedback
- ✅ S3-08: Integración en vistas de Mapa y Listado
- ✅ S3-09: Verificación de KPI (100%)
- ✅ S3-10: Documentación formal del Sprint 3
```

**Conclusión:**  
El Sprint 3 se completó con éxito, logrando una plataforma alimentada con información sociocultural auténtica de Mataderos y un sistema de preferencias completamente operativo que personaliza la experiencia del vecino.
