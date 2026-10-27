import type { RowDataPacket } from "mysql2/promise";
import {
  ejecutarConsulta,
  ejecutarComando,
  esMysqlConfigurado,
  obtenerConfigMysql,
  verificarConexionMysql,
  aIso,
  aFechaSimple,
  parsearJsonArrayStrings
} from "../lib/mysql.js";
import {
  supabaseAdmin,
  esSupabaseConfigurado,
  exigirSupabase
} from "../lib/supabase.js";
import {
  obtenerEstadoReplicacionSupabase,
  type EstadoReplicacionSupabase
} from "../lib/supabase-mirror.js";

/**
 * Servicio de monitoreo, Keep-Alive cada 3 días (`SELECT 1`) y sincronización
 * de respaldo desde MySQL local hacia Supabase (PostgreSQL).
 *
 * El plan gratuito de Supabase pausa proyectos tras 7 días sin actividad.
 * Este servicio ejecuta automáticamente `SELECT 1` cada 3 días (72 horas)
 * y persiste las marcas de tiempo en la tabla `sistema_estado_supabase` (`id = 1`).
 */

/** 3 días (72 horas) en milisegundos: 259.200.000 ms */
export const INTERVALO_KEEPALIVE_MS = 3 * 24 * 60 * 60 * 1000;

/** Revisión horaria (1 h) para evitar desbordamiento de 32 bits en timers y verificar vencimiento */
export const INTERVALO_REVISION_MS = 60 * 60 * 1000;

export type EstadoConexionSupabase =
  | "activo"
  | "pausado_o_error"
  | "sin_configurar"
  | "pendiente";

export interface EstadoSistemaBd {
  mysql: {
    configurado: boolean;
    conectado: boolean;
    host: string;
    baseDeDatos: string;
    latenciaMs: number | null;
    error: string | null;
  };
  supabase: {
    configurado: boolean;
    estado: EstadoConexionSupabase;
    urlProyecto: string | null;
    consultaKeepAlive: "SELECT 1";
    intervaloDias: 3;
    ultimoPingEn: string | null;
    proximoPingEn: string | null;
    ultimaLatenciaMs: number | null;
    ultimoError: string | null;
    ultimaSincronizacionEn: string | null;
    replicacion: EstadoReplicacionSupabase;
  };
}

export interface ResumenSincronizacionSupabase {
  barrios: number;
  categorias: number;
  usuarios: number;
  actividades: number;
  preferencias_usuario: number;
  favoritos_usuario: number;
  resenas: number;
  mensajes_contacto: number;
  totalRegistros: number;
  sincronizadoEn: string;
}

interface EstadoInternoSupabase {
  ultimoPingEn: string | null;
  proximoPingEn: string | null;
  ultimoEstado: EstadoConexionSupabase;
  ultimaLatenciaMs: number | null;
  ultimoError: string | null;
  ultimaSincronizacionEn: string | null;
}

interface FilaEstadoSupabaseMysql extends RowDataPacket {
  id: number;
  ultimo_ping_en: Date | string | null;
  proximo_ping_en: Date | string | null;
  ultimo_estado: string;
  ultima_latencia_ms: number | null;
  ultimo_error: string | null;
  ultima_sincronizacion_en: Date | string | null;
}

interface FilaBarrioSync extends RowDataPacket {
  id: string;
  nombre: string;
  slug: string;
  created_at: Date | string;
}

interface FilaCategoriaSync extends RowDataPacket {
  id: string;
  nombre: string;
  slug: string;
  color: string;
  icono: string;
  created_at: Date | string;
}

interface FilaUsuarioSync extends RowDataPacket {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena_hash: string;
  rol: string;
  creado_en: Date | string;
}

interface FilaActividadSync extends RowDataPacket {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  horarios: string;
  direccion: string;
  lat: number | string;
  lng: number | string;
  url: string;
  imagen_url: string;
  categoria_id: string;
  barrio_id: string;
  visibilidad: string;
  destacado: number | boolean;
  activo: number | boolean;
  fecha_inicio: Date | string | null;
  fecha_fin: Date | string | null;
  es_recurrente: number | boolean;
  dias_semana: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface FilaPreferenciaSync extends RowDataPacket {
  usuario_id: string;
  barrio_id: string | null;
  categoria_ids: unknown;
  created_at: Date | string;
  updated_at: Date | string;
}

interface FilaFavoritoSync extends RowDataPacket {
  id: string;
  usuario_id: string;
  actividad_id: string;
  creado_en: Date | string;
}

interface FilaResenaSync extends RowDataPacket {
  id: string;
  usuario_id: string;
  actividad_id: string;
  calificacion: number;
  comentario: string;
  creado_en: Date | string;
}

interface FilaMensajeContactoSync extends RowDataPacket {
  id: string;
  nombre: string;
  correo: string;
  mensaje: string;
  leido: number | boolean;
  creado_en: Date | string;
}

const estadoMemoria: EstadoInternoSupabase = {
  ultimoPingEn: null,
  proximoPingEn: null,
  ultimoEstado: esSupabaseConfigurado() ? "pendiente" : "sin_configurar",
  ultimaLatenciaMs: null,
  ultimoError: null,
  ultimaSincronizacionEn: null
};

let schedulerActivo: ReturnType<typeof setInterval> | null = null;

function normalizarEstado(valor: string | null | undefined): EstadoConexionSupabase {
  if (!esSupabaseConfigurado()) return "sin_configurar";
  if (valor === "activo" || valor === "pausado_o_error" || valor === "pendiente") {
    return valor;
  }
  return "pendiente";
}

function obtenerUrlProyectoEnmascarada(): string | null {
  if (!esSupabaseConfigurado()) return null;
  const raw = (process.env.SUPABASE_URL ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return raw;
  }
}

async function leerEstadoPersistido(): Promise<EstadoInternoSupabase> {
  try {
    const filas = await ejecutarConsulta<FilaEstadoSupabaseMysql[]>(
      `SELECT
         id,
         ultimo_ping_en,
         proximo_ping_en,
         ultimo_estado,
         ultima_latencia_ms,
         ultimo_error,
         ultima_sincronizacion_en
       FROM sistema_estado_supabase
       WHERE id = 1
       LIMIT 1`
    );

    const fila = filas[0];
    if (!fila) {
      return {
        ...estadoMemoria,
        ultimoEstado: esSupabaseConfigurado() ? estadoMemoria.ultimoEstado : "sin_configurar"
      };
    }

    const estado: EstadoInternoSupabase = {
      ultimoPingEn: fila.ultimo_ping_en ? aIso(fila.ultimo_ping_en) : estadoMemoria.ultimoPingEn,
      proximoPingEn: fila.proximo_ping_en ? aIso(fila.proximo_ping_en) : estadoMemoria.proximoPingEn,
      ultimoEstado: normalizarEstado(fila.ultimo_estado),
      ultimaLatenciaMs:
        fila.ultima_latencia_ms !== null && fila.ultima_latencia_ms !== undefined
          ? Number(fila.ultima_latencia_ms)
          : estadoMemoria.ultimaLatenciaMs,
      ultimoError: fila.ultimo_error ?? estadoMemoria.ultimoError,
      ultimaSincronizacionEn: fila.ultima_sincronizacion_en
        ? aIso(fila.ultima_sincronizacion_en)
        : estadoMemoria.ultimaSincronizacionEn
    };

    Object.assign(estadoMemoria, estado);
    return estado;
  } catch {
    return {
      ...estadoMemoria,
      ultimoEstado: esSupabaseConfigurado() ? estadoMemoria.ultimoEstado : "sin_configurar"
    };
  }
}

async function guardarEstadoPing(datos: {
  ultimoPingEn: Date;
  proximoPingEn: Date;
  ultimoEstado: EstadoConexionSupabase;
  ultimaLatenciaMs: number | null;
  ultimoError: string | null;
}): Promise<void> {
  estadoMemoria.ultimoPingEn = datos.ultimoPingEn.toISOString();
  estadoMemoria.proximoPingEn = datos.proximoPingEn.toISOString();
  estadoMemoria.ultimoEstado = datos.ultimoEstado;
  estadoMemoria.ultimaLatenciaMs = datos.ultimaLatenciaMs;
  estadoMemoria.ultimoError = datos.ultimoError;

  try {
    await ejecutarComando(
      `INSERT INTO sistema_estado_supabase
         (id, ultimo_ping_en, proximo_ping_en, ultimo_estado, ultima_latencia_ms, ultimo_error)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ultimo_ping_en = VALUES(ultimo_ping_en),
         proximo_ping_en = VALUES(proximo_ping_en),
         ultimo_estado = VALUES(ultimo_estado),
         ultima_latencia_ms = VALUES(ultima_latencia_ms),
         ultimo_error = VALUES(ultimo_error)`,
      [
        datos.ultimoPingEn,
        datos.proximoPingEn,
        datos.ultimoEstado,
        datos.ultimaLatenciaMs,
        datos.ultimoError
      ]
    );
  } catch (err) {
    console.warn(
      "[Supabase Monitor] No se pudo persistir el estado de keep-alive en MySQL:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Ejecuta la consulta liviana `SELECT 1` contra Supabase para mantener activo
 * el proyecto en el plan gratuito (evita la pausa por 7 días de inactividad).
 *
 * Primero invoca la función RPC `ping_keepalive` (`SELECT 1`). Si la migración
 * 004 aún no fue corrida en el proyecto remoto (`PGRST202`), hace fallback
 * automático a una consulta `HEAD` liviana sobre `barrios` para garantizar
 * actividad real en PostgREST + PostgreSQL.
 */
export async function ejecutarPingKeepAlive(
  origen: "automatico" | "manual" = "automatico"
): Promise<void> {
  if (!esSupabaseConfigurado()) {
    estadoMemoria.ultimoEstado = "sin_configurar";
    return;
  }

  const inicio = Date.now();
  const ahora = new Date();
  const proximo = new Date(ahora.getTime() + INTERVALO_KEEPALIVE_MS);

  try {
    const rpcResult = await supabaseAdmin.rpc("ping_keepalive");

    if (rpcResult.error) {
      const codigo = rpcResult.error.code ?? "";
      const mensaje = rpcResult.error.message ?? "";
      const esFuncionNoEncontrada =
        codigo === "PGRST202" ||
        codigo === "42883" ||
        mensaje.toLowerCase().includes("ping_keepalive") ||
        mensaje.toLowerCase().includes("could not find the function");

      if (esFuncionNoEncontrada) {
        const fallback = await supabaseAdmin
          .from("barrios")
          .select("id", { count: "exact", head: true })
          .limit(1);

        if (fallback.error) {
          throw new Error(fallback.error.message || "Error en consulta keep-alive de Supabase.");
        }
      } else {
        throw new Error(mensaje || "Error al ejecutar RPC ping_keepalive en Supabase.");
      }
    }

    const latenciaMs = Math.max(1, Date.now() - inicio);

    await guardarEstadoPing({
      ultimoPingEn: ahora,
      proximoPingEn: proximo,
      ultimoEstado: "activo",
      ultimaLatenciaMs: latenciaMs,
      ultimoError: null
    });

    console.log(
      `[Supabase Keep-Alive] SELECT 1 (${origen}) exitoso en ${latenciaMs} ms. Próximo ping: ${proximo.toISOString()}`
    );
  } catch (err) {
    const latenciaMs = Math.max(1, Date.now() - inicio);
    const detalleError =
      err instanceof Error
        ? err.message
        : "No se pudo conectar con Supabase (posible proyecto pausado o sin red).";

    await guardarEstadoPing({
      ultimoPingEn: ahora,
      proximoPingEn: proximo,
      ultimoEstado: "pausado_o_error",
      ultimaLatenciaMs: latenciaMs,
      ultimoError: detalleError
    });

    console.warn(`[Supabase Keep-Alive] Falló ping (${origen}): ${detalleError}`);
  }
}

/**
 * Inicia el planificador automático que verifica cada 1 hora si transcurrieron
 * los 3 días (72 h) desde el último `SELECT 1` y dispara el ping en caso necesario.
 */
export function iniciarSchedulerKeepAlive(): void {
  if (schedulerActivo) return;

  void (async () => {
    if (!esSupabaseConfigurado()) {
      estadoMemoria.ultimoEstado = "sin_configurar";
      return;
    }

    const estado = await leerEstadoPersistido();
    const ahoraMs = Date.now();
    const ultimoMs = estado.ultimoPingEn ? Date.parse(estado.ultimoPingEn) : Number.NaN;
    const proximoMs = estado.proximoPingEn ? Date.parse(estado.proximoPingEn) : Number.NaN;

    const debeEjecutar =
      !estado.ultimoPingEn ||
      Number.isNaN(ultimoMs) ||
      ahoraMs - ultimoMs >= INTERVALO_KEEPALIVE_MS ||
      (!Number.isNaN(proximoMs) && ahoraMs >= proximoMs);

    if (debeEjecutar) {
      await ejecutarPingKeepAlive("automatico");
    }
  })();

  schedulerActivo = setInterval(() => {
    void (async () => {
      if (!esSupabaseConfigurado()) return;
      const estado = await leerEstadoPersistido();
      const ahoraMs = Date.now();
      const ultimoMs = estado.ultimoPingEn ? Date.parse(estado.ultimoPingEn) : Number.NaN;
      const proximoMs = estado.proximoPingEn ? Date.parse(estado.proximoPingEn) : Number.NaN;

      const vencido =
        !estado.ultimoPingEn ||
        Number.isNaN(ultimoMs) ||
        ahoraMs - ultimoMs >= INTERVALO_KEEPALIVE_MS ||
        (!Number.isNaN(proximoMs) && ahoraMs >= proximoMs);

      if (vencido) {
        await ejecutarPingKeepAlive("automatico");
      }
    })();
  }, INTERVALO_REVISION_MS);

  schedulerActivo.unref();
}

/**
 * Sincroniza bajo demanda todos los datos de MySQL (base primaria) hacia
 * Supabase (base de respaldo), respetando el orden de claves foráneas.
 */
export async function sincronizarMysqlASupabase(): Promise<ResumenSincronizacionSupabase> {
  exigirSupabase();

  const [
    barrios,
    categorias,
    usuarios,
    actividades,
    preferencias,
    favoritos,
    resenas,
    mensajes
  ] = await Promise.all([
    ejecutarConsulta<FilaBarrioSync[]>(
      `SELECT id, nombre, slug, created_at FROM barrios ORDER BY nombre ASC`
    ),
    ejecutarConsulta<FilaCategoriaSync[]>(
      `SELECT id, nombre, slug, color, icono, created_at FROM categorias ORDER BY nombre ASC`
    ),
    ejecutarConsulta<FilaUsuarioSync[]>(
      `SELECT id, nombre, apellido, correo, contrasena_hash, rol, creado_en FROM usuarios`
    ),
    ejecutarConsulta<FilaActividadSync[]>(
      `SELECT
         id, nombre, slug, descripcion, horarios, direccion, lat, lng,
         url, imagen_url, categoria_id, barrio_id, visibilidad,
         destacado, activo, fecha_inicio, fecha_fin, es_recurrente, dias_semana,
         created_by, updated_by, created_at, updated_at
       FROM actividades`
    ),
    ejecutarConsulta<FilaPreferenciaSync[]>(
      `SELECT usuario_id, barrio_id, categoria_ids, created_at, updated_at FROM preferencias_usuario`
    ),
    ejecutarConsulta<FilaFavoritoSync[]>(
      `SELECT id, usuario_id, actividad_id, creado_en FROM favoritos_usuario`
    ),
    ejecutarConsulta<FilaResenaSync[]>(
      `SELECT id, usuario_id, actividad_id, calificacion, comentario, creado_en FROM resenas`
    ),
    ejecutarConsulta<FilaMensajeContactoSync[]>(
      `SELECT id, nombre, correo, mensaje, leido, creado_en FROM mensajes_contacto`
    )
  ]);

  if (barrios.length > 0) {
    const slugsVigentes = barrios.map((b) => b.slug);
    const { data: barriosRemotos } = await supabaseAdmin
      .from("barrios")
      .select("id, slug");

    if (barriosRemotos && barriosRemotos.length > 0) {
      const idsObsoletos = barriosRemotos
        .filter((b) => !slugsVigentes.includes(b.slug))
        .map((b) => b.id);

      if (idsObsoletos.length > 0) {
        await supabaseAdmin.from("barrios").delete().in("id", idsObsoletos);
      }
    }

    const { error } = await supabaseAdmin.from("barrios").upsert(
      barrios.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        slug: b.slug,
        created_at: aIso(b.created_at)
      })),
      { onConflict: "slug" }
    );
    if (error) throw new Error(`Error al sincronizar barrios en Supabase: ${error.message}`);
  }

  if (categorias.length > 0) {
    const { error } = await supabaseAdmin.from("categorias").upsert(
      categorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        slug: c.slug,
        color: c.color,
        icono: c.icono,
        created_at: aIso(c.created_at)
      })),
      { onConflict: "id" }
    );
    if (error) throw new Error(`Error al sincronizar categorías en Supabase: ${error.message}`);
  }

  if (usuarios.length > 0) {
    const { error } = await supabaseAdmin.from("usuarios").upsert(
      usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        correo: u.correo,
        contrasena_hash: u.contrasena_hash,
        rol: u.rol,
        creado_en: aIso(u.creado_en)
      })),
      { onConflict: "id" }
    );
    if (error) throw new Error(`Error al sincronizar usuarios en Supabase: ${error.message}`);
  }

  if (actividades.length > 0) {
    const { error } = await supabaseAdmin.from("actividades").upsert(
      actividades.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        slug: a.slug,
        descripcion: a.descripcion,
        horarios: a.horarios,
        direccion: a.direccion,
        lat: Number(a.lat),
        lng: Number(a.lng),
        url: a.url,
        imagen_url: a.imagen_url,
        categoria_id: a.categoria_id,
        barrio_id: a.barrio_id,
        visibilidad: a.visibilidad,
        destacado: Boolean(a.destacado),
        activo: Boolean(a.activo),
        fecha_inicio: aFechaSimple(a.fecha_inicio),
        fecha_fin: aFechaSimple(a.fecha_fin),
        es_recurrente: Boolean(a.es_recurrente),
        dias_semana: a.dias_semana ?? "",
        created_by: a.created_by,
        updated_by: a.updated_by,
        created_at: aIso(a.created_at),
        updated_at: aIso(a.updated_at)
      })),
      { onConflict: "id" }
    );
    if (error) throw new Error(`Error al sincronizar actividades en Supabase: ${error.message}`);
  }

  if (preferencias.length > 0) {
    const { error } = await supabaseAdmin.from("preferencias_usuario").upsert(
      preferencias.map((p) => ({
        usuario_id: p.usuario_id,
        barrio_id: p.barrio_id,
        categoria_ids: parsearJsonArrayStrings(p.categoria_ids),
        created_at: aIso(p.created_at),
        updated_at: aIso(p.updated_at)
      })),
      { onConflict: "usuario_id" }
    );
    if (error) {
      throw new Error(`Error al sincronizar preferencias en Supabase: ${error.message}`);
    }
  }

  if (favoritos.length > 0) {
    const { error } = await supabaseAdmin.from("favoritos_usuario").upsert(
      favoritos.map((f) => ({
        id: f.id,
        usuario_id: f.usuario_id,
        actividad_id: f.actividad_id,
        creado_en: aIso(f.creado_en)
      })),
      { onConflict: "id" }
    );
    if (error) throw new Error(`Error al sincronizar favoritos en Supabase: ${error.message}`);
  }

  if (resenas.length > 0) {
    const { error } = await supabaseAdmin.from("resenas").upsert(
      resenas.map((r) => ({
        id: r.id,
        usuario_id: r.usuario_id,
        actividad_id: r.actividad_id,
        calificacion: Number(r.calificacion),
        comentario: r.comentario,
        creado_en: aIso(r.creado_en)
      })),
      { onConflict: "id" }
    );
    if (error) throw new Error(`Error al sincronizar reseñas en Supabase: ${error.message}`);
  }

  if (mensajes.length > 0) {
    const { error } = await supabaseAdmin.from("mensajes_contacto").upsert(
      mensajes.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        correo: m.correo,
        mensaje: m.mensaje,
        leido: Boolean(m.leido),
        creado_en: aIso(m.creado_en)
      })),
      { onConflict: "id" }
    );
    if (error) {
      throw new Error(`Error al sincronizar mensajes de contacto en Supabase: ${error.message}`);
    }
  }

  const ahora = new Date();
  const ahoraIso = ahora.toISOString();
  estadoMemoria.ultimaSincronizacionEn = ahoraIso;
  estadoMemoria.ultimoEstado = "activo";
  estadoMemoria.ultimoError = null;

  try {
    await ejecutarComando(
      `INSERT INTO sistema_estado_supabase (id, ultimo_estado, ultima_sincronizacion_en, ultimo_error)
       VALUES (1, 'activo', ?, NULL)
       ON DUPLICATE KEY UPDATE
         ultimo_estado = 'activo',
         ultima_sincronizacion_en = VALUES(ultima_sincronizacion_en),
         ultimo_error = NULL`,
      [ahora]
    );
  } catch (err) {
    console.warn(
      "[Supabase Monitor] No se pudo actualizar ultima_sincronizacion_en en MySQL:",
      err instanceof Error ? err.message : err
    );
  }

  const totalRegistros =
    barrios.length +
    categorias.length +
    usuarios.length +
    actividades.length +
    preferencias.length +
    favoritos.length +
    resenas.length +
    mensajes.length;

  return {
    barrios: barrios.length,
    categorias: categorias.length,
    usuarios: usuarios.length,
    actividades: actividades.length,
    preferencias_usuario: preferencias.length,
    favoritos_usuario: favoritos.length,
    resenas: resenas.length,
    mensajes_contacto: mensajes.length,
    totalRegistros,
    sincronizadoEn: ahoraIso
  };
}

/**
 * Obtiene el estado integral de persistencia (MySQL primario + Supabase backup y keep-alive).
 */
export async function obtenerEstadoSistema(): Promise<EstadoSistemaBd> {
  const cfgMysql = obtenerConfigMysql();
  const [estadoMysql, estadoSupabase] = await Promise.all([
    verificarConexionMysql(),
    leerEstadoPersistido()
  ]);

  const configuradoSupabase = esSupabaseConfigurado();

  return {
    mysql: {
      configurado: esMysqlConfigurado(),
      conectado: estadoMysql.conectado,
      host: `${cfgMysql.host}:${cfgMysql.port}`,
      baseDeDatos: cfgMysql.database,
      latenciaMs: estadoMysql.latenciaMs,
      error: estadoMysql.error
    },
    supabase: {
      configurado: configuradoSupabase,
      estado: configuradoSupabase ? estadoSupabase.ultimoEstado : "sin_configurar",
      urlProyecto: obtenerUrlProyectoEnmascarada(),
      consultaKeepAlive: "SELECT 1",
      intervaloDias: 3,
      ultimoPingEn: estadoSupabase.ultimoPingEn,
      proximoPingEn: estadoSupabase.proximoPingEn,
      ultimaLatenciaMs: estadoSupabase.ultimaLatenciaMs,
      ultimoError: estadoSupabase.ultimoError,
      ultimaSincronizacionEn: estadoSupabase.ultimaSincronizacionEn,
      replicacion: obtenerEstadoReplicacionSupabase()
    }
  };
}

export class SupabaseMonitorService {
  ejecutarPingKeepAlive(origen: "automatico" | "manual" = "automatico"): Promise<void> {
    return ejecutarPingKeepAlive(origen);
  }

  iniciarSchedulerKeepAlive(): void {
    iniciarSchedulerKeepAlive();
  }

  sincronizarMysqlASupabase(): Promise<ResumenSincronizacionSupabase> {
    return sincronizarMysqlASupabase();
  }

  obtenerEstadoSistema(): Promise<EstadoSistemaBd> {
    return obtenerEstadoSistema();
  }
}
