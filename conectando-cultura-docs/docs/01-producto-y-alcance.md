# 01 · Producto y alcance

## Qué es
Plataforma cultural comunitaria para Mataderos y barrios cercanos de Buenos Aires. Ofrece un mapa y un catálogo de actividades (ferias, cines, teatros, museos, bibliotecas, bares notables, parques y otras categorías), cuentas de vecinos con preferencias y un panel de administración.

## Usuarios y roles

| Rol | Cómo se obtiene | Qué puede hacer |
|---|---|---|
| Visitante | Sin cuenta | Explorar mapa, lista y detalle. Registrarse o ingresar |
| Vecino (`usuario`) | Registro | Lo anterior, más guardar preferencias de barrio y categorías |
| Gestor (`gestor`) | Un SuperAdmin cambia su rol | Crear, editar y desactivar actividades en el panel |
| SuperAdmin (`admin`) | Un SuperAdmin cambia su rol | Todo lo del gestor, más gestionar usuarios y roles |

Alta de gestores: la persona se registra como vecino y un SuperAdmin cambia su rol. No hay flujo de invitación.

## Objetivos de producto
1. Un vecino encuentra qué hacer cerca en pocos toques.
2. Una actividad se puede compartir por WhatsApp con un enlace propio.
3. Un gestor carga y mantiene actividades sin ayuda técnica.
4. Un SuperAdmin controla quién puede editar.

## Alcance de esta etapa
Incluye: Inicio, Explorar (mapa + lista), Detalle de actividad, Registro, Login, Preferencias, panel (Dashboard, Actividades, Usuarios y roles), pantalla 403 y estados de carga, vacío y error.

Diseñado pero diferido (no programar todavía):
- Contacto y "Sumá tu actividad" (formulario pendiente en el backlog del proyecto).
- Moderación, Datos con exportación CSV, Auditoría, verificación en dos pasos, roles `moderador` y `analista`.
- Filtros "Gratis" y "Cuándo" (requieren campos nuevos en `actividades`).
- Favoritos, guías editoriales, selector de idioma.

## Referencias tomadas de nyctourism.com
Se revisaron la home y "Things to Do". No se revisó Maps & Guides.

| Patrón | Decisión |
|---|---|
| Navegación corta con búsqueda siempre visible | Adoptado |
| Banner de lo que pasa ahora | Adoptado: "Ahora en Mataderos", con actividades destacadas |
| Categorías como puerta de entrada | Adoptado: chips con ícono y color |
| Bloque por barrio con una línea de descripción | Adoptado: "Explorá por barrio" |
| Colecciones temáticas (presupuesto, temporada) | Adaptado: filtros Gratis y Cuándo, diferidos |
| Newsletter | Adoptado como "Enterate primero", enlazado a registro |
| Enlace para el sector profesional | Adaptado: "Sumá tu actividad", diferido |
| Tarjetas editoriales, idiomas, herramienta con IA, videos, hoteles | Descartado o pospuesto |
