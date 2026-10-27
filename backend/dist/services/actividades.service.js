import { randomUUID } from "node:crypto";
import { ejecutarConsulta, ejecutarComando, aIso, aFechaSimple, describirErrorMysql } from "../lib/mysql.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { replicarEnSupabase } from "../lib/supabase-mirror.js";
import { NotificacionesService } from "./notificaciones.service.js";
const servicioNotificaciones = new NotificacionesService();
const SQL_BASE_ACTIVIDADES = `
  SELECT
    a.id,
    a.nombre,
    a.slug,
    a.descripcion,
    a.horarios,
    a.direccion,
    a.lat,
    a.lng,
    a.url,
    a.imagen_url,
    a.destacado,
    a.activo,
    a.fecha_inicio,
    a.fecha_fin,
    a.es_recurrente,
    a.dias_semana,
    a.categoria_id,
    c.nombre AS categoria_nombre,
    c.slug   AS categoria_slug,
    c.color  AS categoria_color,
    c.icono  AS categoria_icono,
    a.barrio_id,
    b.nombre AS barrio_nombre,
    b.slug   AS barrio_slug
  FROM actividades a
  INNER JOIN categorias c ON c.id = a.categoria_id
  INNER JOIN barrios b    ON b.id = a.barrio_id
`;
function mapearActividadPublica(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        slug: fila.slug,
        descripcion: fila.descripcion,
        horarios: fila.horarios ?? "",
        direccion: fila.direccion,
        lat: Number(fila.lat),
        lng: Number(fila.lng),
        url: fila.url ?? "",
        imagenUrl: fila.imagen_url ?? "",
        categoria: {
            id: fila.categoria_id,
            nombre: fila.categoria_nombre,
            slug: fila.categoria_slug,
            color: fila.categoria_color,
            icono: fila.categoria_icono
        },
        barrio: {
            id: fila.barrio_id,
            nombre: fila.barrio_nombre,
            slug: fila.barrio_slug
        },
        destacado: Boolean(fila.destacado),
        fechaInicio: aFechaSimple(fila.fecha_inicio),
        fechaFin: aFechaSimple(fila.fecha_fin),
        esRecurrente: fila.es_recurrente === null ? true : Boolean(fila.es_recurrente),
        diasSemana: fila.dias_semana ?? ""
    };
}
export class ActividadesService {
    /** Catálogo público: sólo actividades activas. */
    async listar(filtros = {}) {
        try {
            const condiciones = ["a.activo = 1"];
            const parametros = [];
            if (filtros.barrioSlug) {
                condiciones.push("b.slug = ?");
                parametros.push(filtros.barrioSlug);
            }
            if (filtros.categoriaSlug) {
                condiciones.push("c.slug = ?");
                parametros.push(filtros.categoriaSlug);
            }
            let sql = `${SQL_BASE_ACTIVIDADES} WHERE ${condiciones.join(" AND ")} ORDER BY a.nombre ASC`;
            if (filtros.limite && filtros.limite > 0) {
                sql += " LIMIT ?";
                parametros.push(Number(filtros.limite));
            }
            const filas = await ejecutarConsulta(sql, parametros);
            return filas.map(mapearActividadPublica);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async listarBarrios() {
        try {
            const filas = await ejecutarConsulta(`SELECT id, nombre, slug, created_at FROM barrios ORDER BY nombre ASC`);
            return filas.map((b) => ({
                id: b.id,
                nombre: b.nombre,
                slug: b.slug,
                created_at: aIso(b.created_at)
            }));
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async listarCategorias() {
        try {
            const filas = await ejecutarConsulta(`SELECT id, nombre, slug, color, icono, created_at FROM categorias ORDER BY nombre ASC`);
            return filas.map((c) => ({
                id: c.id,
                nombre: c.nombre,
                slug: c.slug,
                color: c.color,
                icono: c.icono,
                created_at: aIso(c.created_at)
            }));
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async obtenerPorSlug(slug, barrioSlug) {
        try {
            const filas = await ejecutarConsulta(`${SQL_BASE_ACTIVIDADES} WHERE a.slug = ? AND b.slug = ? AND a.activo = 1 LIMIT 1`, [slug, barrioSlug]);
            const fila = filas[0];
            return fila ? mapearActividadPublica(fila) : null;
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async obtenerPorId(id, incluirInactivas = false) {
        try {
            const filtroActivo = incluirInactivas ? "" : "AND a.activo = 1";
            const filas = await ejecutarConsulta(`${SQL_BASE_ACTIVIDADES} WHERE a.id = ? ${filtroActivo} LIMIT 1`, [id]);
            const fila = filas[0];
            return fila ? mapearActividadPublica(fila) : null;
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    async crear(datos, usuarioId) {
        const id = randomUUID();
        const nombre = String(datos.nombre ?? "").trim();
        const slug = nombre
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const descripcion = String(datos.descripcion ?? "");
        const horarios = String(datos.horarios ?? "");
        const direccion = String(datos.direccion ?? "");
        const lat = Number(datos.lat) || -34.653;
        const lng = Number(datos.lng) || -58.517;
        const url = String(datos.url ?? "");
        const imagenUrl = String(datos.imagenUrl ?? "");
        const categoriaId = String(datos.categoriaId ?? "");
        const barrioId = String(datos.barrioId ?? "");
        const destacado = Boolean(datos.destacado);
        const fechaInicio = datos.fechaInicio ? String(datos.fechaInicio) : null;
        const fechaFin = datos.fechaFin ? String(datos.fechaFin) : null;
        const esRecurrente = datos.esRecurrente !== undefined ? Boolean(datos.esRecurrente) : true;
        const diasSemana = datos.diasSemana !== undefined ? String(datos.diasSemana ?? "") : "";
        try {
            await ejecutarComando(`INSERT INTO actividades (
          id, nombre, slug, descripcion, horarios, direccion, lat, lng,
          url, imagen_url, categoria_id, barrio_id, destacado, activo,
          fecha_inicio, fecha_fin, es_recurrente, dias_semana,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`, [
                id,
                nombre,
                slug,
                descripcion,
                horarios,
                direccion,
                lat,
                lng,
                url,
                imagenUrl,
                categoriaId,
                barrioId,
                destacado ? 1 : 0,
                fechaInicio,
                fechaFin,
                esRecurrente ? 1 : 0,
                diasSemana,
                usuarioId,
                usuarioId
            ]);
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
        replicarEnSupabase("actividades.crear", () => supabaseAdmin.from("actividades").upsert({
            id,
            nombre,
            slug,
            descripcion,
            horarios,
            direccion,
            lat,
            lng,
            url,
            imagen_url: imagenUrl,
            categoria_id: categoriaId,
            barrio_id: barrioId,
            destacado,
            activo: true,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            es_recurrente: esRecurrente,
            dias_semana: diasSemana,
            created_by: usuarioId,
            updated_by: usuarioId
        }, { onConflict: "id" }));
        if (categoriaId || barrioId) {
            servicioNotificaciones
                .notificarNuevaActividad({
                id,
                nombre,
                categoriaId,
                barrioId
            })
                .catch((err) => console.warn("Fallo al notificar nueva actividad:", err));
        }
        const creada = await this.obtenerPorId(id, true);
        if (!creada) {
            throw new Error("No se pudo recuperar la actividad recién creada.");
        }
        return creada;
    }
    async actualizar(id, datos, usuarioId) {
        const setsMysql = ["updated_by = ?"];
        const paramsMysql = [usuarioId];
        const updatesSupabase = { updated_by: usuarioId };
        if (datos.nombre !== undefined) {
            setsMysql.push("nombre = ?");
            paramsMysql.push(String(datos.nombre));
            updatesSupabase.nombre = datos.nombre;
        }
        if (datos.descripcion !== undefined) {
            setsMysql.push("descripcion = ?");
            paramsMysql.push(String(datos.descripcion));
            updatesSupabase.descripcion = datos.descripcion;
        }
        if (datos.horarios !== undefined) {
            setsMysql.push("horarios = ?");
            paramsMysql.push(String(datos.horarios));
            updatesSupabase.horarios = datos.horarios;
        }
        if (datos.direccion !== undefined) {
            setsMysql.push("direccion = ?");
            paramsMysql.push(String(datos.direccion));
            updatesSupabase.direccion = datos.direccion;
        }
        if (datos.lat !== undefined) {
            setsMysql.push("lat = ?");
            paramsMysql.push(Number(datos.lat));
            updatesSupabase.lat = datos.lat;
        }
        if (datos.lng !== undefined) {
            setsMysql.push("lng = ?");
            paramsMysql.push(Number(datos.lng));
            updatesSupabase.lng = datos.lng;
        }
        if (datos.url !== undefined) {
            setsMysql.push("url = ?");
            paramsMysql.push(String(datos.url));
            updatesSupabase.url = datos.url;
        }
        if (datos.imagenUrl !== undefined) {
            setsMysql.push("imagen_url = ?");
            paramsMysql.push(String(datos.imagenUrl));
            updatesSupabase.imagen_url = datos.imagenUrl;
        }
        if (datos.categoriaId !== undefined) {
            setsMysql.push("categoria_id = ?");
            paramsMysql.push(String(datos.categoriaId));
            updatesSupabase.categoria_id = datos.categoriaId;
        }
        if (datos.barrioId !== undefined) {
            setsMysql.push("barrio_id = ?");
            paramsMysql.push(String(datos.barrioId));
            updatesSupabase.barrio_id = datos.barrioId;
        }
        if (datos.destacado !== undefined) {
            setsMysql.push("destacado = ?");
            paramsMysql.push(Boolean(datos.destacado) ? 1 : 0);
            updatesSupabase.destacado = Boolean(datos.destacado);
        }
        if (datos.activo !== undefined) {
            setsMysql.push("activo = ?");
            paramsMysql.push(Boolean(datos.activo) ? 1 : 0);
            updatesSupabase.activo = Boolean(datos.activo);
        }
        if (datos.fechaInicio !== undefined) {
            const fInicio = datos.fechaInicio ? String(datos.fechaInicio) : null;
            setsMysql.push("fecha_inicio = ?");
            paramsMysql.push(fInicio);
            updatesSupabase.fecha_inicio = fInicio;
        }
        if (datos.fechaFin !== undefined) {
            const fFin = datos.fechaFin ? String(datos.fechaFin) : null;
            setsMysql.push("fecha_fin = ?");
            paramsMysql.push(fFin);
            updatesSupabase.fecha_fin = fFin;
        }
        if (datos.esRecurrente !== undefined) {
            setsMysql.push("es_recurrente = ?");
            paramsMysql.push(Boolean(datos.esRecurrente) ? 1 : 0);
            updatesSupabase.es_recurrente = Boolean(datos.esRecurrente);
        }
        if (datos.diasSemana !== undefined) {
            setsMysql.push("dias_semana = ?");
            paramsMysql.push(String(datos.diasSemana));
            updatesSupabase.dias_semana = String(datos.diasSemana);
        }
        paramsMysql.push(id);
        try {
            const resultado = await ejecutarComando(`UPDATE actividades SET ${setsMysql.join(", ")} WHERE id = ?`, paramsMysql);
            if (resultado.affectedRows === 0) {
                throw new Error("Actividad no encontrada.");
            }
        }
        catch (err) {
            if (err instanceof Error && err.message === "Actividad no encontrada.") {
                throw err;
            }
            throw new Error(describirErrorMysql(err));
        }
        replicarEnSupabase("actividades.actualizar", () => supabaseAdmin.from("actividades").update(updatesSupabase).eq("id", id));
        const actualizada = await this.obtenerPorId(id, true);
        if (!actualizada)
            throw new Error("Actividad no encontrada.");
        return actualizada;
    }
    /** Borrado lógico: la fila se conserva, `activo` pasa a false. */
    async eliminar(id) {
        try {
            await ejecutarComando(`UPDATE actividades SET activo = 0 WHERE id = ?`, [id]);
            replicarEnSupabase("actividades.eliminar", () => supabaseAdmin.from("actividades").update({ activo: false }).eq("id", id));
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
    /** Reactivación lógica: `activo` pasa a true. */
    async reactivar(id, usuarioId) {
        return this.actualizar(id, { activo: true }, usuarioId);
    }
    /** Listado para el panel admin: soporta filtros, búsqueda, orden y paginación. */
    async listarTodasAdmin(opciones = {}) {
        try {
            const pagina = Math.max(1, Number(opciones.pagina) || 1);
            const limite = opciones.limite ? Math.max(1, Math.min(100, Number(opciones.limite))) : 50;
            const offset = (pagina - 1) * limite;
            const condiciones = [];
            const parametrosFiltro = [];
            if (opciones.activo !== undefined) {
                condiciones.push("a.activo = ?");
                parametrosFiltro.push(opciones.activo ? 1 : 0);
            }
            if (opciones.q && opciones.q.trim()) {
                const patron = `%${opciones.q.trim()}%`;
                condiciones.push("(a.nombre LIKE ? OR a.descripcion LIKE ? OR a.direccion LIKE ?)");
                parametrosFiltro.push(patron, patron, patron);
            }
            const clausulaWhere = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
            let clausulaOrden = "ORDER BY a.created_at DESC";
            switch (opciones.orden) {
                case "antiguas":
                    clausulaOrden = "ORDER BY a.created_at ASC";
                    break;
                case "nombre_asc":
                    clausulaOrden = "ORDER BY a.nombre ASC";
                    break;
                case "nombre_desc":
                    clausulaOrden = "ORDER BY a.nombre DESC";
                    break;
                case "recientes":
                default:
                    clausulaOrden = "ORDER BY a.created_at DESC";
                    break;
            }
            const filasConteo = await ejecutarConsulta(`SELECT COUNT(*) AS total FROM actividades a ${clausulaWhere}`, parametrosFiltro);
            const total = Number(filasConteo[0]?.total ?? 0);
            let sqlDatos = `${SQL_BASE_ACTIVIDADES} ${clausulaWhere} ${clausulaOrden}`;
            const parametrosDatos = [...parametrosFiltro];
            if (opciones.pagina !== undefined || opciones.limite !== undefined) {
                sqlDatos += " LIMIT ? OFFSET ?";
                parametrosDatos.push(limite, offset);
            }
            const filas = await ejecutarConsulta(sqlDatos, parametrosDatos);
            const actividades = filas.map((fila) => ({
                ...mapearActividadPublica(fila),
                activo: Boolean(fila.activo)
            }));
            return {
                actividades,
                total,
                pagina,
                limite
            };
        }
        catch (err) {
            throw new Error(describirErrorMysql(err));
        }
    }
}
