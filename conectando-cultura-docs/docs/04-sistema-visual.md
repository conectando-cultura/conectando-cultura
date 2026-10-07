# 04 · Sistema visual

Concepto: **"Un barrio, muchos colores".** El color vive en las categorías, que ya traen el suyo desde la base de datos. El resto de la interfaz es sobria, para que ese mosaico sea lo que se recuerda.

## Decisiones de fondo
- El botón principal va en tinta. No hay color de marca propio que compita con pines y chips.
- Títulos en Archivo condensado (cercano a la rotulación de calle). Cuerpo en Atkinson Hyperlegible (pensada para baja visión).
- El color nunca va solo: ícono + texto en categorías, borde + tilde en selección, palabra en estados.
- Descartado a propósito: fondo crema con serif y terracota, y un azul de marca para botones.
- **Sin emojis.** Los íconos son de `lucide-react`.

## Tokens
Fuente de verdad: `codigo-de-referencia/tokens.css`. Se importa una vez en la raíz de la app.

### Color base (modo claro, contrastes calculados)

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--tinta` | `#1B2A4A` | Texto y botón principal | 14,2:1 sobre blanco; 12,9:1 sobre papel |
| `--papel` | `#F2F4F8` | Fondo de página | |
| `--blanco` | `#FFFFFF` | Superficies y tarjetas | |
| `--texto-suave` | `#4F5B73` | Apoyo y metadatos | 6,8:1 sobre blanco |
| `--chapa` | `#2A55C9` | Enlaces y foco | 6,5:1 sobre blanco |
| `--cartel` | `#FFC933` | Solo la marca "Destacada" | 9,3:1 con tinta encima |
| `--borde-campo` | `#7C869B` | Bordes de inputs y controles | 3,3:1 o más |
| `--linea` | `#D5DAE4` | Divisores decorativos | no cumple 3:1, no usar para delimitar controles |
| `--peligro` | `#B42318` | Errores y baja | 6,6:1 sobre blanco |
| `--exito` | `#1B7A4B` | Confirmaciones | 5,3:1 sobre blanco |
| `--aviso` | `#7A4700` | Ocultas y avisos | 6,9:1 sobre `#FFF1D6` |

Modo oscuro: los neutrales cambian (ver tokens, con `light-dark()`); los chips de categoría se mantienen claros. **Los valores oscuros son una propuesta y falta verificar su contraste.**

### Colores de categoría
Cada categoría tiene tres colores: sólido (pin y borde de selección), fondo suave (chip) y texto oscuro (chip).

Los colores reales vienen de la base (`color`, hex de 7 caracteres). **Regla:** el texto sobre el fondo suave debe llegar a 4,5:1 o más. Para no depender de que los datos cumplan, se derivan en tiempo de ejecución con `codigo-de-referencia/colorCategoria.js`. La tabla es de referencia, con colores propuestos.

| Categoría | Sólido | Fondo suave | Texto | Ícono (`lucide-react`) | Clave en BD |
|---|---|---|---|---|---|
| Ferias | `#E4572E` | `#FCEBE6` | `#B83C18` | `Tent` | `feria` |
| Cines | `#6A4C93` | `#EDEAF2` | `#6A4C93` | `Clapperboard` | `cine` |
| Teatros | `#C2185B` | `#F8E3EB` | `#C2185B` | `Drama` | `teatro` |
| Museos | `#1F6FB2` | `#E4EEF6` | `#1D6AA9` | `Landmark` | `museo` |
| Bibliotecas | `#0F8B8D` | `#E2F1F1` | `#0C7071` | `Library` | `biblioteca` |
| Bares | `#B7791F` | `#F6EFE4` | `#8B5C18` | `Beer` | `bar` |
| Parques | `#3E8E41` | `#E8F1E8` | `#337536` | `Trees` | `parque` |
| Otras (hasta 9) | `#7A5C2E`, `#5C6B7A` | | | `MapPin` (ícono por defecto) | cualquier otra |

Pin de mapa: forma de gota con el color sólido, borde blanco de 3 px y contorno oscuro fino, y el ícono de la categoría en blanco (o en tinta si el sólido no llega a 3:1 con blanco). El color solo no alcanza sobre un mapa.

## Íconos
- Librería: **`lucide-react`**. Un único punto de importación: `codigo-de-referencia/iconos.jsx`.
- Tamaños: 16 (en texto y chips), 20 (botones y menú), 24 (encabezados), 32 a 48 (ilustración de estados vacíos). Trazo `strokeWidth={1.75}`.
- Siempre `aria-hidden="true"` cuando acompañan un texto. Un ícono solo (botón de lupa) lleva `aria-label`.
- El campo `icono` de `categorias` hoy puede guardar un emoji. Pasa a guardar una **clave de texto** (`feria`, `cine`...). Si llega un valor desconocido o un emoji heredado, se usa `MapPin`.

Íconos de interfaz usados:

| Función | Ícono |
|---|---|
| Buscar | `Search` |
| Mapa / Lista | `Map` / `List` |
| Ubicación | `MapPin` |
| Cómo llegar | `Navigation` |
| Compartir | `Share2` |
| Sitio web | `ExternalLink` |
| Horarios | `Clock` |
| Destacada | `Star` |
| Menú / Cerrar | `Menu` / `X` |
| Seleccionado | `Check` |
| Desplegar | `ChevronDown` |
| Mostrar / Ocultar contraseña | `Eye` / `EyeOff` |
| Ingresar / Salir | `LogIn` / `LogOut` |
| Nuevo / Editar | `Plus` / `Pencil` |
| Desactivar / Reactivar | `Power` / `RotateCcw` |
| Oculta | `EyeOff` |
| Sin acceso | `Lock` |
| Dashboard / Actividades / Usuarios | `LayoutDashboard` / `CalendarDays` / `Users` |
| Error / Aviso | `AlertCircle` / `TriangleAlert` |

Control en CI para impedir emojis en el código: `node codigo-de-referencia/sin-emojis.mjs src` (copiarlo al proyecto, p. ej. a `scripts/`). Sale con error si encuentra alguno. No usar un `grep` con `|| exit 0`: si `grep` falla por el idioma del sistema, aprueba en falso.

## Tipografía
- Títulos: **Archivo**, ancho 75 (condensado), peso 700. Variable, eje `wdth`.
- Cuerpo y controles: **Atkinson Hyperlegible**, pesos 400 y 700.
- Recomendado autoalojar con `@fontsource-variable/archivo` (importar la variante con eje de ancho) y `@fontsource/atkinson-hyperlegible`. Verificar el nombre exacto del archivo CSS del eje de ancho al instalar.
- Pilas de respaldo: `"Archivo", "Arial Narrow", sans-serif` y `"Atkinson Hyperlegible", system-ui, sans-serif`.

| Rol | Tamaño | Notas |
|---|---|---|
| Título de página | `clamp(40px, 8vw, 68px)` en Inicio; 32 a 40 en el resto | Archivo 700, interlineado 1,1 |
| Título de sección | 30 | Archivo 700 |
| Subtítulo | 20 | Archivo 700 |
| Cuerpo | 16 / 1,6 | Línea de 68 caracteres como máximo |
| Apoyo | 14 | `--texto-suave` |
| Mínimo | 12 | Nada menor |

Oración normal en todo el texto: sin mayúsculas sostenidas.

## Componentes

| Componente | Especificación |
|---|---|
| Botón | Alto mínimo 44 px, radio 6, peso 700. Variantes: principal (fondo tinta, texto blanco), secundario (borde tinta), peligro (borde y texto `--peligro`), texto (enlace subrayado). Uno principal por vista |
| Campo | Etiqueta arriba (14 px), alto mínimo 44, borde 1,5 px `--borde-campo`, radio 6. Error: borde `--peligro` y mensaje debajo con `aria-describedby` |
| Chip de categoría | Píldora: ícono 16 + texto 14. Fondo suave y texto oscuro de la categoría. Seleccionado: borde 2 px del color sólido + `Check`. Es un `<button>` con `aria-pressed` |
| Estado (badge) | Píldora con palabra: Activa (éxito), Inactiva (neutral), Oculta (aviso), Destacada (cartel con tinta) |
| Tarjeta | Fondo blanco, borde 1 px `--linea`, radio 12, relleno 14. Sin sombra |
| Tarjeta de actividad | Imagen (o bloque con color suave e ícono), chip de categoría, nombre, "barrio · horario", marca Destacada |
| Pin de mapa | Ver Colores de categoría. Seleccionado: escala 1,35 |
| Barra de confirmación | Fondo suave, texto del efecto, botones Cancelar y Confirmar. Reemplaza modales para acciones reversibles |
| Menú lateral | Ítems con ícono 20 + texto. Activo: fondo `--papel` y peso 700. Solo lo permitido por rol |
| Esqueleto | Bloques `--linea` con la forma del contenido, sin animación si hay `prefers-reduced-motion` |
| Estado vacío / error | Ícono 32 a 48 de trazo fino, título, una línea de ayuda y una acción |

## Reglas
- Espaciado en múltiplos de 4: 4, 8, 12, 16, 24, 32, 48.
- Radios: 6 controles, 12 tarjetas, píldora en chips.
- Sin sombras: bordes finos.
- Foco visible de 3 px en `--chapa`, con separación de 2 px, en todo elemento interactivo.
- Movimiento solo como respuesta a una acción, de 150 ms o menos, y apagado con `prefers-reduced-motion`.
- Puntos de corte, mobile primero: 480, 768, 1024.
- Área táctil mínima: 44 × 44 px.
