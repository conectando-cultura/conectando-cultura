# 06 · Plan de desarrollo

Tamaños relativos: S (acotado), M (medio), L (grande). Cada fase termina con la definición de terminado de abajo.

## Definición de terminado (aplica a cada pantalla)
- [ ] Coincide con `03-pantallas.md` y, cuando exista, con el croquis de Figma.
- [ ] Usa solo tokens y componentes base. Sin emojis.
- [ ] Tiene estados de carga, vacío y error implementados.
- [ ] Funciona desde 360 px y con teclado. Foco visible.
- [ ] Pasa los criterios de accesibilidad de `05-arquitectura-frontend.md`.
- [ ] Tiene pruebas de los casos principales.
- [ ] Pasa el control de emojis: `node scripts/sin-emojis.mjs src` (ver `04-sistema-visual.md`).

## Fase 0 · Base (S)
- [ ] Revisar el repositorio actual: stack, rutas existentes, librería de mapa. Anotar diferencias con estos documentos en `08-decisiones-y-pendientes.md`.
- [ ] Instalar `lucide-react` y las fuentes autoalojadas.
- [ ] Copiar `tokens.css` y crear `base.css` (reset, tipografía, foco, `prefers-reduced-motion`).
- [ ] Copiar `iconos.jsx` y `colorCategoria.js`.
- [ ] Estructura de carpetas y cliente de API.
- [ ] Copiar `sin-emojis.mjs` a `scripts/` y agregarlo a CI y al script `npm run lint`.
Aceptación: la app compila, muestra la tipografía correcta y un ícono de prueba.

## Fase 1 · Componentes base (M)
- [ ] Boton, Campo, Chip, Badge, Tarjeta, BarraConfirmacion, Esqueleto, EstadoVacio, EstadoError.
- [ ] CategoriaChip y PinCategoria (usar `codigo-de-referencia/CategoriaChip.jsx` como modelo).
- [ ] Encabezado, Pie y LayoutPublico.
- [ ] Página interna temporal que muestre todos los componentes con sus estados.
Aceptación: contrastes verificados, foco visible, todos los estados dibujados.

## Fase 2 · Público: Inicio, Explorar, Detalle (L)
Depende de: catálogos de barrios y categorías, listado y detalle de actividades.
- [ ] Hook `useFiltrosExplorar` (URL como fuente de verdad) y redirecciones `/mapa` y `/actividades`.
- [ ] Explorar: barra de filtros, chips, lista, mapa con pines, tarjeta emergente, sincronización, selector mapa/lista en móvil.
- [ ] Detalle: todas las secciones, Compartir, Cómo llegar, ocultar filas vacías, 404 para ocultas e inactivas.
- [ ] Inicio: banner de destacadas, categorías, barrios, destacadas.
- [ ] Ocultar "Sumá tu actividad" y "¿Algún dato cambió?" hasta que exista Contacto.
Aceptación: un visitante llega de Inicio a un Detalle en tres toques y puede compartirlo; los filtros sobreviven a recargar y a Atrás.

## Fase 3 · Cuentas: Registro, Login, Preferencias (M)
Depende de: endpoints de auth y de preferencias.
- [ ] AuthContext, cliente con token, manejo de 401.
- [ ] Registro y Login con validación y errores en el campo.
- [ ] Preferencias (primera vez y edición) con resumen en vivo.
- [ ] Aplicar preferencias en Explorar cuando la URL no trae filtros, con aviso "Quitar".
- [ ] Redirecciones de `02-flujos-y-rutas.md`.
Aceptación: registro → preferencias → Explorar filtrado; sesión vencida lleva a Login y regresa.

## Fase 4 · Roles y control de acceso (M)
Depende de: migración de `rol` y guardas en el backend (ver `07-api-y-datos.md`).
- [ ] Migración: `rol` admite `usuario`, `gestor`, `admin`.
- [ ] Backend: reemplazar el chequeo de admin por verificación de permisos (`actividades:escribir`, `usuarios:gestionar`, `panel:acceder`).
- [ ] Frontend: `permisos.js`, `Protegida`, `NoAutorizado`, redirección por rol tras el login.
Aceptación: un gestor no ve ni alcanza Usuarios y roles (ni por URL ni por API); un admin ve todo.

## Fase 5 · Panel de administración (L)
Depende de: Fase 4, paginación en el servidor, endpoint de estadísticas.
- [ ] LayoutPanel con menú lateral por permisos.
- [ ] Dashboard por rol, con tarjetas que enlazan al listado filtrado.
- [ ] Listado de actividades: filtros, paginación, orden y búsqueda en servidor, estados, desactivar con barra de confirmación, reactivar.
- [ ] Formulario: grupos, slug automático, "Ubicar" con geocodificación y salida manual, mini mapa con pin arrastrable, vista previa de imagen, visibilidad, destacada y activa.
- [ ] Usuarios y roles: tabla, selector de rol con confirmación, sesiones activas con "Cerrar", protecciones (propia fila, último SuperAdmin).
Aceptación: un gestor crea, edita, desactiva y reactiva una actividad y la ve reflejada en lo público; un admin cambia el rol de otro usuario con confirmación.

## Fase 6 · Diferido (no empezar sin decisión)
- Contacto y "Sumá tu actividad" (y mostrar los bloques ocultos en las fases anteriores).
- Filtros "Gratis" y "Cuándo" (campos nuevos en `actividades`).
- Auditoría, verificación en dos pasos, Datos con exportación, Moderación, roles `moderador` y `analista`.
- Favoritos y guías editoriales.

## Cambios de backend requeridos (resumen)
1. Migración de `rol` a tres valores.
2. Verificación por permiso en las rutas de actividades y usuarios.
3. Paginación, orden y búsqueda en el listado del panel: `pagina`, `limite`, `orden`, `q`.
4. Cambio de rol que acepte `gestor` y rechace quitar el último admin o cambiar el propio rol.
5. Campo `icono` de `categorias` como clave de texto (`feria`, `cine`...).
6. Confirmar el contrato de estadísticas y de longitud mínima de contraseña.

## Orden recomendado para un agente
Fase 0 → 1 → 2 → 3 → 4 → 5. Entregar y revisar al final de cada fase. No empezar una fase sin cumplir la definición de terminado de la anterior.
