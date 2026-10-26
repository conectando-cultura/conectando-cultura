import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { cargarEnv } from "./supabase.js";

/**
 * Cliente de MySQL — Base de datos principal de Conectando Cultura.
 *
 * Administra un pool de conexiones `mysql2/promise` contra la instancia
 * MySQL local o del servidor propio configurada en `.env`.
 */

cargarEnv();

export interface ConfiguracionMysql {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function obtenerConfigMysql(): ConfiguracionMysql {
  return {
    host: (process.env.MYSQL_HOST ?? "127.0.0.1").trim() || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? "3306") || 3306,
    user: (process.env.MYSQL_USER ?? "root").trim() || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: (process.env.MYSQL_DATABASE ?? "conectando_cultura").trim() || "conectando_cultura"
  };
}

export function esMysqlConfigurado(): boolean {
  const cfg = obtenerConfigMysql();
  return Boolean(cfg.host && cfg.user && cfg.database);
}

export function exigirMysql(): void {
  if (esMysqlConfigurado()) return;
  throw new Error(
    "MySQL no está configurado correctamente. Revisá MYSQL_HOST, MYSQL_PORT, MYSQL_USER y MYSQL_DATABASE en .env."
  );
}

const configInicial = obtenerConfigMysql();

export const mysqlPool: Pool = mysql.createPool({
  host: configInicial.host,
  port: configInicial.port,
  user: configInicial.user,
  password: configInicial.password,
  database: configInicial.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z"
});

export type ValorSqlMysql = string | number | boolean | Date | null;

export async function ejecutarConsulta<T extends RowDataPacket[]>(
  sql: string,
  parametros: readonly ValorSqlMysql[] = []
): Promise<T> {
  exigirMysql();
  const [filas] = await mysqlPool.query<T>(sql, [...parametros]);
  return filas;
}

export async function ejecutarComando(
  sql: string,
  parametros: readonly ValorSqlMysql[] = []
): Promise<ResultSetHeader> {
  exigirMysql();
  const [resultado] = await mysqlPool.execute<ResultSetHeader>(sql, [...parametros]);
  return resultado;
}

export async function verificarConexionMysql(): Promise<{
  conectado: boolean;
  latenciaMs: number | null;
  error: string | null;
}> {
  const inicio = Date.now();
  try {
    exigirMysql();
    await mysqlPool.query("SELECT 1 AS ok");
    return {
      conectado: true,
      latenciaMs: Date.now() - inicio,
      error: null
    };
  } catch (err) {
    return {
      conectado: false,
      latenciaMs: null,
      error: err instanceof Error ? err.message : "Error al conectar con MySQL."
    };
  }
}

/** Normaliza un valor Date o string de MySQL a ISO-8601. */
export function aIso(valor: Date | string | null | undefined): string {
  if (!valor) return new Date().toISOString();
  if (valor instanceof Date) return valor.toISOString();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toISOString();
}

/** Normaliza un valor DATE de MySQL a formato YYYY-MM-DD o null. */
export function aFechaSimple(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  const texto = String(valor).trim();
  return texto ? texto.slice(0, 10) : null;
}

/** Convierte un campo JSON de MySQL (que puede venir como string o array) a string[]. */
export function parsearJsonArrayStrings(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item));
  }
  if (typeof valor === "string" && valor.trim().length > 0) {
    try {
      const parseado: unknown = JSON.parse(valor);
      if (Array.isArray(parseado)) {
        return parseado.map((item) => String(item));
      }
    } catch {
      return [];
    }
  }
  return [];
}

interface ErrorMysqlConCodigo {
  code?: string;
  errno?: number;
  message?: string;
}

/** Traduce errores frecuentes de MySQL/InnoDB a mensajes claros en español. */
export function describirErrorMysql(
  error: unknown,
  mensajeDuplicado = "Ya existe un registro con esos datos únicos."
): string {
  if (!error || typeof error !== "object") {
    return "Error desconocido de base de datos MySQL.";
  }
  const err = error as ErrorMysqlConCodigo;
  if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
    return mensajeDuplicado;
  }
  if (
    err.code === "ER_NO_REFERENCED_ROW_2" ||
    err.code === "ER_ROW_IS_REFERENCED_2" ||
    err.errno === 1451 ||
    err.errno === 1452
  ) {
    return "La referencia indicada no existe (clave foránea).";
  }
  if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" || err.errno === 3819) {
    return "Un valor no cumple una restricción de la tabla.";
  }
  if (err.code === "ECONNREFUSED") {
    return "No se pudo conectar al servidor MySQL local. Verificá que el servicio MySQL esté iniciado.";
  }
  return err.message || "Error de base de datos MySQL.";
}
