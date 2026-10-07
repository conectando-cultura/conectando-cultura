# Conectando Cultura · Paquete de documentación para desarrollo

Plataforma cultural comunitaria para Mataderos y barrios cercanos (Buenos Aires). Este paquete reúne **todas las decisiones de UX y de diseño visual** y el **plan de desarrollo del frontend en React**, para que un agente (o una persona) programe la interfaz sin ambigüedades.

## Orden de lectura

| # | Archivo | Para qué sirve |
|---|---|---|
| 1 | `docs/01-producto-y-alcance.md` | Qué se construye, para quién y qué queda fuera |
| 2 | `docs/02-flujos-y-rutas.md` | Flujo de navegación, rutas, guardas y redirecciones |
| 3 | `docs/03-pantallas.md` | Especificación pantalla por pantalla, con estados y textos |
| 4 | `docs/04-sistema-visual.md` | Colores, tipografía, íconos, componentes y reglas |
| 5 | `docs/05-arquitectura-frontend.md` | Stack, estructura de carpetas, convenciones |
| 6 | `docs/06-plan-de-desarrollo.md` | Fases, tareas y criterios de aceptación |
| 7 | `docs/07-api-y-datos.md` | Contratos de API, modelo de datos y cambios requeridos |
| 8 | `docs/08-decisiones-y-pendientes.md` | Registro de decisiones y preguntas abiertas |
| 9 | `codigo-de-referencia/` | Tokens CSS, íconos, color de categorías, permisos, rutas, chip y pin de ejemplo, y el control `sin-emojis.mjs` |

## Reglas de oro (no negociables)

1. **Sin emojis en la interfaz.** Todo ícono sale de `lucide-react`. Ver `docs/04-sistema-visual.md`, sección Íconos.
2. **Solo tokens.** Ningún color, tamaño de letra ni radio escrito a mano en componentes: se usan las variables de `codigo-de-referencia/tokens.css`.
3. **El color nunca va solo.** Categoría = ícono + texto + color. Estado = palabra. Selección = borde + tilde.
4. **Dos roles de panel por ahora:** `gestor` y `admin` (SuperAdmin), más `usuario` (vecino). No implementar moderador ni analista.
5. **Textos en español rioplatense**, voz activa, oración normal (sin mayúsculas sostenidas). Los errores explican qué pasó y cómo arreglarlo, sin disculparse.
6. **Mobile primero.** Todo debe funcionar desde 360 px de ancho.
7. **Accesibilidad mínima:** foco visible, objetivos táctiles de 44 px, etiquetas asociadas a cada campo, errores vinculados al campo (`aria-describedby`).
8. **No inventar endpoints.** Usar los de `docs/07-api-y-datos.md`; lo marcado como "propuesto" requiere confirmar o construir el backend antes.
9. **Los permisos se leen de una sola tabla** (`codigo-de-referencia/permisos.js`) tanto para el menú como para las guardas.
10. **El croquis de Figma manda sobre los wireframes de este paquete** en cuanto a disposición de elementos (ver abajo).

## Croquis de Figma: pendiente de incorporar

La disposición de elementos debe parecerse al archivo de Figma **"croquis - conectando cultura"**. Los esquemas ASCII de `docs/03-pantallas.md` son provisionales hasta que ese archivo se lea.

Cuando exista el enlace de Figma (con `node-id` de cada pantalla):

1. Cargar la guía `figma-design-to-code` **antes** de llamar a `get_design_context`.
2. Llamar a `get_design_context` por pantalla, con `clientFrameworks: react`.
3. Adaptar el código de referencia al proyecto: reemplazar valores sueltos por tokens, reutilizar los componentes base y cambiar cualquier ícono o emoji por su equivalente de `lucide-react`.
4. Registrar la equivalencia nodo de Figma → componente en `docs/09-layout-figma.md`.

## Estado

- Listo: flujo, pantallas, sistema visual, plan, arquitectura.
- Pendiente: layout del croquis, campos nuevos para filtros "Gratis" y "Cuándo", definición de visibilidad `privada`, contrato real del endpoint de estadísticas. Detalle en `docs/08-decisiones-y-pendientes.md`.
