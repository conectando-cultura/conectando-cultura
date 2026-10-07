# 03 · Pantallas

> Los esquemas son **provisionales**. Cuando se lea el croquis de Figma, su disposición manda (ver README). Lo que no cambia: contenido, acciones, estados, textos y permisos.
> Íconos: nombres de `lucide-react` entre corchetes, p. ej. [Search]. Nunca emojis.

## Estados globales (todas las pantallas con datos)

| Estado | Qué mostrar |
|---|---|
| Carga | Esqueleto con la forma del contenido, sin spinner suelto |
| Vacío | Texto que dice qué pasó y qué hacer: "No hay actividades en este barrio. Probá con todos los barrios." + botón para limpiar filtros |
| Error de red o 500 | "No pudimos cargar esto. Revisá tu conexión e intentá de nuevo." + botón Reintentar |
| 404 | "No encontramos esa página." + enlace a Inicio |
| 403 | [Lock] "No tenés acceso a esta sección". "Tu rol no incluye {sección}. Si creés que es un error, pedile acceso a un SuperAdmin." + botón "Volver al panel" |
| Sesión vencida | Ver `02-flujos-y-rutas.md` |

## 1. Inicio `/`
Objetivo: del momento a lo permanente, y entradas hacia Explorar.

```
[Encabezado: logo | Qué hacer | Mapa | Barrios | [Search] | Ingresar]
[Banner "Ahora en Mataderos": imagen, título, barrio · horario, Ver detalle, puntos]
[Qué querés hacer: chips de categoría + Ver todas]
[Explorá por barrio: tarjetas (nombre + una línea)]
[Destacadas: 3 tarjetas + Ver todas]
[Sumá tu actividad]  [Enterate primero]
[Pie]
```
- Banner: actividades con `destacado = true`, hasta 5. Si no hay, se oculta el bloque. Rotación manual (puntos), sin autoavance.
- Chips de categoría y tarjetas de barrio llevan a `/explorar` con el filtro aplicado.
- "Sumá tu actividad": ocultar hasta que exista `/contacto`.
- "Enterate primero": lleva a `/registro`. No hay newsletter propio todavía.
- Encabezado en móvil: logo, [Search], [Menu] (menú colapsable).

## 2. Explorar `/explorar`
Objetivo: encontrar actividades por mapa o lista con los mismos filtros.

```
[Barra de filtros: búsqueda | Barrio ▾ | (Cuándo ▾) | (Gratis) | Mapa/Lista]
[Chips de categoría: Todas | Ferias | Cines | ...]
[Lista (columna izquierda, "12 actividades · Mataderos")] [Mapa (derecha)]
```
- `(Cuándo)` y `(Gratis)`: solo si existen los campos en la base. Si no, no se dibujan.
- Escritorio: lista (≈ 320 px) + mapa. Móvil: una sola vista con selector [Map]/[List].
- Lista y mapa sincronizados: tocar tarjeta resalta el pin y centra; tocar pin resalta la tarjeta y abre la tarjeta emergente.
- Tarjeta emergente: categoría, nombre, dirección, horarios, botones "Cómo llegar" [Navigation] y "Ver detalle".
- Controles de mapa: acercar, alejar, capas (roadmap, satélite, OpenStreetMap; las que ya existen).
- Chips de categoría: selección múltiple. "Todas" se activa cuando no hay ninguna elegida.
- Si el usuario tiene preferencias y no hay filtros en la URL, se aplican las preferencias y se muestra "Filtrando por tus preferencias · Quitar".
- Estados: carga (esqueletos en lista, mapa gris), vacío (texto + "Quitar filtros"), error (Reintentar).

## 3. Detalle `/actividades/:barrio/:slug`

```
[Ruta: Inicio › Actividades › Barrio › Nombre]            [Editar: gestor/admin]
[Imagen]  [chip categoría] [Destacada]
[Título]  [Cómo llegar] [Compartir] [Sitio web]
[Antes de ir: Horarios | Dirección | Sitio]  [Mini mapa]
[Sobre esta actividad: descripción]
[Más en {barrio}: 3 tarjetas]
[¿Algún dato cambió? Avisanos]
```
- Acción principal: "Cómo llegar" abre Google Maps con latitud y longitud.
- "Compartir": `navigator.share` si existe; si no, copiar el enlace y avisar "Enlace copiado".
- "Sitio web" solo si hay `url`.
- Cada fila de "Antes de ir" se oculta si no tiene dato. Sin imagen: bloque con el color suave de la categoría y su ícono grande.
- Actividad `oculta` o con `activo = false`: 404 para vecinos; para gestor/admin se muestra con aviso "Inactiva" o "Oculta".
- "¿Algún dato cambió?": oculto hasta que exista `/contacto`.
- Móvil: una columna, "Cómo llegar" fijo abajo; el mini mapa va después de la descripción.

## 4. Registro `/registro`
Campos: nombre, apellido, correo, contraseña, repetir contraseña. Botón "Crear cuenta". Enlace "¿Ya tenés cuenta? Ingresar".
- Título "Crear cuenta". Subtítulo: "Guardá tus preferencias y enterate de lo nuevo."
- Validación al salir del campo y al enviar. Requisitos de contraseña visibles mientras se escribe. Longitud mínima: confirmar con el backend.
- Errores en el campo: "Ese correo ya tiene cuenta. Ingresá o usá otro." / "Las contraseñas no coinciden." / "Revisá el formato del correo."
- Mostrar/ocultar contraseña con [Eye] / [EyeOff].
- Éxito: sesión iniciada y redirección a `/preferencias`.

## 5. Login `/login`
Campos: correo, contraseña. Botón "Ingresar". Enlace "¿Primera vez? Crear cuenta". Enlace "Seguir explorando sin cuenta".
- Error genérico en banner: "Correo o contraseña incorrectos. Revisalos e intentá de nuevo."
- Redirección según `02-flujos-y-rutas.md`.

## 6. Preferencias `/preferencias`
Título: "Te damos la bienvenida, {nombre}" (primera vez) o "Tus preferencias" (edición).
- Barrio: selección única con "Todos los barrios" (equivale a `barrio_id` vacío).
- Categorías: selección múltiple (`categoria_ids`). Ninguna elegida = ver todo; lo dice el contador: "Ninguna: te mostramos todo".
- Resumen en vivo: "Vas a ver primero: Actividades en {barrio} · {categorías}".
- Botones: "Guardar y explorar" (principal) y "Omitir por ahora" (solo en la primera vez).
- Los chips se cargan desde la API de barrios y categorías.
- Móvil: una columna, botón principal fijo abajo.

## 7. Panel `/admin`
Estructura: menú lateral + contenido. Menú según permisos:
- [LayoutDashboard] Dashboard (gestor, admin)
- [CalendarDays] Actividades (gestor, admin)
- [Users] Usuarios y roles (solo admin)
Móvil: menú en cajón. Al pie: nombre y rol de la sesión, y "Salir" [LogOut].

### 7.1 Dashboard
- Admin: tarjetas "Actividades activas", "Inactivas u ocultas", "Vecinos registrados", "Gestores y SuperAdmin".
- Gestor: "Actividades activas", "Inactivas para revisar", "Sin imagen o ubicación", "Editadas por mí, 7 días".
- Botón "Nueva actividad". Cada tarjeta lleva al listado ya filtrado.
- El contenido real depende del endpoint de estadísticas (ver `07-api-y-datos.md`).

### 7.2 Actividades `/admin/actividades`
- Barra: búsqueda por nombre, filtro de estado (Todas, Activas, Inactivas), barrio, categoría, botón "Nueva actividad".
- Tabla: Nombre (con marca "destacada"), Barrio, Categoría, Estado, Acciones. Filas inactivas atenuadas.
- Estados con palabra y color: Activa, Inactiva, Oculta.
- Acciones: Editar [Pencil], Desactivar [Power] o Reactivar. Desactivar pide confirmación ligera en una barra: "Dejará de verse para los vecinos. Podés reactivarla cuando quieras."
- Paginación, orden y búsqueda desde el servidor (ver API).
- Gestor y admin ven y editan todas las actividades.

### 7.3 Formulario `/admin/actividades/nueva` y `/:id`
Grupos, de lo esencial a lo opcional:
1. Datos básicos: nombre*, slug (se genera solo, editable, único dentro del barrio), categoría*, barrio*.
2. Ubicación: dirección*, botón "Ubicar" [MapPin] (geocodifica con Nominatim), latitud, longitud, mini mapa con pin arrastrable.
3. Contenido: descripción*, horarios, sitio web, imagen (URL) con vista previa.
4. Publicación: visibilidad (Pública, Privada, Oculta), Destacada, Activa.
Pie: "Guardar cambios", "Cancelar", "Ver cómo se ve →" (abre el Detalle).
- Obligatorios (*): nombre, descripción, dirección, categoría, barrio.
- Si "Ubicar" no encuentra la dirección: "No encontramos esa dirección. Probá con otra o cargá las coordenadas a mano." No bloquea el guardado.
- Nominatim tiene límite de uso: un pedido por clic, sin autobúsqueda al tipear.

### 7.4 Usuarios y roles `/admin/usuarios` (solo admin)
- Búsqueda por nombre o correo. Tabla: Nombre, Correo, Rol (selector Usuario / Gestor / SuperAdmin), Sesiones activas con "Cerrar".
- Cambiar rol pide confirmación con texto del efecto:
  - Gestor: "{nombre} podrá crear, editar y desactivar actividades. ¿Darle rol de gestor?"
  - SuperAdmin: "{nombre} tendrá acceso total, incluida la gestión de usuarios. ¿Darle rol de SuperAdmin?"
  - Usuario: "{nombre} dejará de acceder al panel. ¿Quitarle el rol?"
- Protecciones: la fila propia no permite cambiar el rol. Siempre debe quedar al menos un SuperAdmin (reforzar en backend).

## 8. Contacto `/contacto` (pendiente)
No programar. Cuando se haga: nombre, correo, tipo (Avisar un cambio / Sumar mi actividad / Otro), mensaje. Guarda en `mensajes_contacto`.
