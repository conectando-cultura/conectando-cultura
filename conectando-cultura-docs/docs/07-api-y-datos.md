# 07 · API y datos

> Este resumen sale de la documentación del repositorio revisada (README y `docs/`). Las rutas exactas, los nombres de campos de entrada y los códigos de error **deben verificarse contra el repositorio** antes de programar. Lo marcado **(propuesto)** no existe todavía.

## Autenticación
- Sesión por token guardado en la tabla `sesiones`, con vigencia de 7 días. Se envía como `Authorization: Bearer`.
- Un 401 deja al usuario como anónimo.
- Contraseñas con hash scrypt.
- Pendiente de confirmar: longitud mínima de contraseña y rutas exactas de registro, login, cierre de sesión y "quién soy".

## Actividades (público)
| Necesidad | Endpoint |
|---|---|
| Listado con filtros (barrio, categoría, límite) | `GET /api/actividades` |
| Barrios | `GET /api/actividades/barrios` |
| Categorías | `GET /api/actividades/categorias` |
| Detalle | `GET /api/actividades/:slug/:barrioSlug` |

Reglas: el público solo recibe actividades activas y visibles. Con `?admin=true` (con permiso) también llegan las inactivas.

## Panel
| Necesidad | Endpoint |
|---|---|
| Crear, editar, desactivar, reactivar actividad | Rutas de administración de actividades. Reactivar usa el mismo `PATCH` |
| Estadísticas | `GET /api/admin/estadisticas` (contrato por confirmar) |
| Listar usuarios y cambiar rol | Rutas de administración de usuarios y roles |
| Geocodificación | Servicio externo Nominatim, un pedido por clic |

## Preferencias
Guardan `barrio_id` (vacío = todos los barrios) y `categoria_ids` (arreglo; vacío = todas).

## Modelo de datos relevante
| Tabla | Campos que importan al frontend |
|---|---|
| `usuarios` | nombre, apellido, correo, `rol` |
| `sesiones` | token, usuario, vencimiento (sirve para "sesiones activas") |
| `barrios` | nombre, slug, descripción (6 sembrados) |
| `categorias` | nombre, slug, `color` (hex), `icono` |
| `actividades` | nombre, slug (único por barrio), descripción, horarios, dirección, latitud, longitud, url, imagen_url, categoría, barrio, visibilidad (`publica`, `privada`, `oculta`), destacado, activo, created_by, updated_by |
| `preferencias` | usuario, barrio_id, categoria_ids |
| `mensajes_contacto` | para el formulario de Contacto (diferido) |

## Cambios requeridos
1. `usuarios.rol` admite `usuario`, `gestor`, `admin`.
2. **(propuesto)** Mapa de permisos en el servidor: `panel:acceder`, `actividades:escribir`, `usuarios:gestionar`. Es la misma tabla que `codigo-de-referencia/permisos.js`.
3. **(propuesto)** Listado del panel con `pagina`, `limite`, `orden`, `q`, y respuesta con total.
4. **(propuesto)** Reglas del cambio de rol: aceptar `gestor`; rechazar cambiar el rol propio; rechazar dejar el sistema sin `admin`.
5. **(propuesto)** `categorias.icono` guarda una clave de texto. Migración sugerida: reemplazar cada emoji existente por su clave (`feria`, `cine`, `teatro`, `museo`, `biblioteca`, `bar`, `parque`); lo que no se reconozca queda vacío y el frontend usa `MapPin`.
6. **(propuesto)** Para "Gratis" y "Cuándo": campos de precio y de fecha o recurrencia en `actividades`.
7. Definir qué significa la visibilidad `privada` y quién la ve.

## Seguridad a revisar con los nuevos roles
- Token en `localStorage` frente a cookie `httpOnly`.
- CORS abierto.
- Límite de pedidos en login y registro.
