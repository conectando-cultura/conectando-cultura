# 08 · Decisiones y pendientes

## Registro de decisiones

| Id | Decisión | Motivo |
|---|---|---|
| D-01 | Mapa y lista son una sola pantalla, Explorar, con selector en móvil | Comparten filtros y datos |
| D-02 | Detalle tiene URL propia `/actividades/:barrio/:slug` | Permite compartir por WhatsApp |
| D-03 | Bienvenido y Preferencias son una sola pantalla | Un paso sin función menos, y recompensa visible |
| D-04 | Login único para todos los roles, con redirección según rol | Menos superficie que un login de administrador aparte |
| D-05 | Dos roles de panel por ahora: `gestor` y `admin` | Moderación y analista no tienen módulos todavía |
| D-06 | El gestor ve y edita todas las actividades | Equipo chico; `updated_by` registra quién editó |
| D-07 | Alta de gestor: registro como vecino y cambio de rol por un SuperAdmin | No hay flujo de invitación |
| D-08 | Menú del panel lateral y filtrado por permisos; se oculta, no se deshabilita | Un control deshabilitado no explica nada |
| D-09 | Estadísticas se fusionan con el Dashboard | Menos pestañas |
| D-10 | Desactivar usa barra de confirmación ligera, no modal | La baja es lógica y reversible |
| D-11 | Cambio de rol pide confirmación con el efecto explicado | Única acción sensible del panel |
| D-12 | Filtros en la URL | Compartir vistas y Atrás |
| D-13 | Color en las categorías; chrome sobrio; botón principal en tinta | Identidad = mosaico de categorías |
| D-14 | Archivo condensado (títulos) y Atkinson Hyperlegible (cuerpo) | Letra de calle y legibilidad |
| D-15 | **Sin emojis: íconos de `lucide-react`** | Consistencia, accesibilidad y control del trazo |
| D-16 | `categorias.icono` guarda una clave de texto con `MapPin` como respaldo | Los emojis heredados no rompen la interfaz |
| D-17 | Colores de categoría derivados en ejecución con regla de contraste | No depender de que los datos de la base cumplan |
| D-18 | Verificación en dos pasos, auditoría, Datos y Moderación quedan diferidos | Fuera del alcance de dos roles |
| D-19 | Estilos con variables CSS y CSS Modules | Los tokens son la única fuente de verdad |
| D-20 | El croquis de Figma manda sobre los wireframes de este paquete | Es la referencia de disposición pedida |

## Pendientes

| Id | Pendiente | Quién decide | Bloquea |
|---|---|---|---|
| P-01 | **Leer el croquis de Figma** y registrar la equivalencia nodo → componente en `docs/09-layout-figma.md` | Necesita el enlace con `node-id` | Fase 2 y 5 (disposición) |
| P-02 | Campos de precio y fecha para "Gratis" y "Cuándo" | Producto y backend | Esos dos filtros |
| P-03 | Significado de la visibilidad `privada` | Producto | Detalle y formulario |
| P-04 | Contrato real de estadísticas | Backend | Dashboard |
| P-05 | Longitud mínima de contraseña y rutas exactas de auth | Backend | Registro |
| P-06 | Contraste del modo oscuro | Diseño | Modo oscuro |
| P-07 | Colores y claves de ícono reales de las categorías en la base | Datos | Íconos y chips |
| P-08 | Token en `localStorage` o cookie `httpOnly` | Backend y seguridad | Fase 3 |
| P-09 | Contacto y "Sumá tu actividad" | Producto | Bloques ocultos en Inicio y Detalle |
| P-10 | Gestor ve todo o solo lo propio | Producto (hoy: todo) | Listado del panel |
| P-11 | Revisar `nyctourism.com/maps-guides` para el mapa | Diseño | Opcional |
