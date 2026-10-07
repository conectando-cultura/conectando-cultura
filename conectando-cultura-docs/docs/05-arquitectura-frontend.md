# 05 · Arquitectura del frontend

## Stack
- **React 18+** con **React Router v6**.
- Si el repositorio ya usa JavaScript o TypeScript, **mantener lo que existe**. Para código nuevo, TypeScript es preferible.
- Estilos: variables CSS (`tokens.css`) + **CSS Modules**. Sin framework de utilidades, para que los tokens sean la única fuente de verdad.
- Íconos: `lucide-react`.
- Mapa: mantener la librería de mapa que ya use el proyecto (con capas de tiles). Los pines son íconos HTML propios (ver `CategoriaChip` y `04-sistema-visual.md`).
- Datos: `fetch` envuelto en un cliente propio. Recomendado **TanStack Query** para listas, paginación y reintentos.
- Formularios: controlados con validación propia o React Hook Form. Sin librería de componentes visuales.
- Pruebas: Vitest + Testing Library.

Antes de instalar nada: revisar `package.json` y la carpeta `frontend/` del repositorio. Si algo de lo anterior ya existe con otra herramienta, gana lo existente.

## Estructura de carpetas

```
src/
  estilos/        tokens.css, base.css (reset, tipografía, foco)
  api/            cliente.js, actividades.js, auth.js, admin.js, preferencias.js
  auth/           AuthContext.jsx, useAuth.js, permisos.js
  rutas/          rutas.jsx, Protegida.jsx
  componentes/
    base/         Boton, Campo, Chip, Badge, Tarjeta, BarraConfirmacion, Esqueleto, EstadoVacio, EstadoError
    categoria/    CategoriaChip, PinCategoria, iconos.jsx, colorCategoria.js
    actividad/    TarjetaActividad, ListaActividades, FiltrosExplorar
    mapa/         MapaActividades, TarjetaEmergente
    layout/       Encabezado, Pie, LayoutPublico, LayoutPanel, MenuLateral
  paginas/
    Inicio, Explorar, Detalle, Registro, Login, Preferencias, NoAutorizado, NoEncontrada
    admin/        Dashboard, ListadoActividades, FormularioActividad, UsuariosRoles
  utilidades/     formato.js, url.js (filtros <-> querystring), compartir.js
```

## Convenciones
- Nombres de archivos, componentes y funciones en **español**, igual que el backend (`actividades`, `barrio`, `categoria`).
- Un componente por archivo, con su `.module.css` al lado.
- Ningún valor visual literal en un componente: solo `var(--token)`.
- Ningún emoji. Los íconos entran por `componentes/categoria/iconos.jsx` o se importan de `lucide-react`.
- Cada componente interactivo tiene foco visible, estado deshabilitado y estado de error cuando aplique.
- Los textos de interfaz viven en el componente (sin librería de i18n por ahora), pero los mensajes de error y los vacíos se centralizan en `utilidades/mensajes.js`.

## Autenticación y sesión
- `AuthContext` guarda `{ usuario, rol, token, cargando }` y expone `ingresar`, `registrar`, `salir`, `puede(permiso)`.
- Al montar, si hay token, consulta al backend quién es el usuario. Si responde 401, limpia la sesión.
- El token se envía como `Authorization: Bearer ...`.
- Hoy el token puede estar en `localStorage`. Con roles que editan contenido conviene evaluar una cookie `httpOnly`; queda como decisión abierta (`08-decisiones-y-pendientes.md`).
- El cliente de API, ante un 401 en una ruta que requería sesión, dispara el cierre de sesión y el mensaje "Tu sesión venció. Ingresá de nuevo para seguir."

## Rutas y guardas
Ver `codigo-de-referencia/rutas.jsx`. `Protegida` recibe `permiso` y:
1. Sin sesión: redirige a `/login` guardando la ruta de origen.
2. Con sesión y sin permiso: renderiza `NoAutorizado` sin cambiar la URL.
3. Con permiso: renderiza el contenido.

El menú del panel se arma filtrando la lista de ítems con `puede(permiso)`. **Se oculta, no se deshabilita.**

## Datos y estado
- Filtros de Explorar: la URL es la fuente de verdad (`?barrio=&categorias=&q=&vista=`). Un hook `useFiltrosExplorar` lee y escribe la URL.
- Listas del panel: paginación, orden y búsqueda en el servidor, con TanStack Query y `keepPreviousData`.
- Catálogos de barrios y categorías: se piden una vez y se cachean largo.
- Mutaciones del panel invalidan el listado y las estadísticas.

## Mapa
- Marcadores con ícono HTML: gota coloreada con el ícono `lucide-react` de la categoría. Renderizar a HTML estático para usarlo como marcador.
- Selección sincronizada con la lista (estado compartido en `Explorar`).
- Capas: las existentes (roadmap, satélite, OpenStreetMap).
- En Detalle y en el formulario, mini mapas de un solo pin.

## Accesibilidad (criterios de aceptación transversales)
- Todo se opera con teclado; el orden de tabulación sigue el visual.
- Foco visible en todo elemento interactivo.
- Cada campo con `label` asociado; errores con `aria-describedby`; `role="alert"` en errores de envío.
- Chips y filtros con `aria-pressed`. Contadores de resultados con `aria-live="polite"`.
- El mapa tiene alternativa en lista: nada es accesible solo desde el mapa.
- Contraste mínimo: 4,5:1 en texto, 3:1 en bordes de controles y pines.
- `prefers-reduced-motion` respetado.

## Rendimiento
- Carga diferida (`React.lazy`) del panel y del mapa.
- Imágenes con `loading="lazy"`, dimensiones declaradas y `alt` descriptivo (el nombre de la actividad si no hay otra descripción).
- Fuentes autoalojadas con `font-display: swap`.

## Variables de entorno
- `VITE_API_URL` (o equivalente del bundler en uso) con la base de la API.
- Sin claves privadas en el frontend.
