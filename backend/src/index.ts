import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { AuthService } from "./services/auth.service.js";
import { UsuarioRepository, SesionRepository } from "./repositories/usuario.repository.js";
import { crearRutasAuth } from "./routes/auth.routes.js";
import { crearRutasPreferencias } from "./routes/preferencias.routes.js";
import { crearRutasActividades } from "./routes/actividades.routes.js";
import { crearRutasAdmin } from "./routes/admin.routes.js";
import { crearRutasContacto } from "./routes/contacto.routes.js";
import { crearRutasFavoritos } from "./routes/favoritos.routes.js";
import { crearRutasResenas } from "./routes/resenas.routes.js";
import { esSupabaseConfigurado } from "./lib/supabase.js";
import { exigirMysql, obtenerConfigMysql } from "./lib/mysql.js";
import { iniciarSchedulerKeepAlive } from "./services/supabase-monitor.service.js";

const PUERTO = Number(process.env.PORT ?? 8120);

const repositorioUsuarios = new UsuarioRepository();
const repositorioSesiones = new SesionRepository();
const servicioAuth = new AuthService(repositorioUsuarios, repositorioSesiones);

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
// Anónimo y sin tocar la base: sirve para verificar que el proceso
// vive, y reporta la configuración de MySQL primario y backup en Supabase.
app.get("/api/estado", (_req, res) => {
  res.json({
    servicio: "Conectando Cultura API",
    version: "1.0.0",
    baseDeDatos: "mysql",
    baseDeDatosPrimaria: "mysql",
    backupSupabase: esSupabaseConfigurado() ? "configurado" : "sin-configurar"
  });
});

// ── Auth ──────────────────────────────────────────────────────
app.use("/api/auth", crearRutasAuth(servicioAuth));

// ── Preferencias (requiere sesión) ────────────────────────────
app.use("/api/preferencias", crearRutasPreferencias(servicioAuth));

// ── Actividades (GET público; escritura = admin) ───────────────
app.use("/api/actividades", crearRutasActividades(servicioAuth));

// ── Favoritos (requiere sesión) ───────────────────────────────
app.use("/api/favoritos", crearRutasFavoritos(servicioAuth));

// ── Reseñas comunitarias (GET público; POST con sesión) ───────
app.use("/api/resenas", crearRutasResenas(servicioAuth));

// ── Contacto (POST público para soporte y sugerencias) ────────
app.use("/api/contacto", crearRutasContacto());

// ── Administración (requiere sesión + rol gestor/admin) ───────
app.use("/api/admin", crearRutasAdmin(servicioAuth));

// ── Frontend SPA estático (producción) ────────────────────────
const FRONTEND_DIST = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "frontend",
  "dist"
);
const FRONTEND_INDEX = resolve(FRONTEND_DIST, "index.html");

if (existsSync(FRONTEND_INDEX)) {
  app.use(express.static(FRONTEND_DIST));
  app.use("/conectando-cultura", express.static(FRONTEND_DIST));
  app.use("/TICS/2026/6to 2da/conectando-cultura-main", express.static(FRONTEND_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/api") {
      next();
      return;
    }
    res.sendFile(FRONTEND_INDEX);
  });
}

// ── Manejo de errores ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada." });
});

// No se filtra el stack ni el mensaje interno al cliente.
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ): void => {
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
);

// El servidor exige configuración de MySQL como base primaria.
try {
  exigirMysql();
} catch (error) {
  console.error("\n✖ No se puede iniciar el backend.\n");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nRevisá backend/.env o .env y volvé a intentarlo.\n");
  process.exit(1);
}

const cfgMysql = obtenerConfigMysql();
const server = app.listen(PUERTO, "0.0.0.0", () => {
  console.log(`API de Conectando Cultura escuchando en http://0.0.0.0:${PUERTO}`);
  console.log(
    `Persistencia primaria: MySQL (${cfgMysql.host}:${cfgMysql.port}/${cfgMysql.database})`
  );
  console.log(
    `Backup Supabase + Keep-Alive (SELECT 1 cada 3 días): ${
      esSupabaseConfigurado() ? "Activo" : "Sin configurar (modo sólo MySQL local)"
    }`
  );
  iniciarSchedulerKeepAlive();
});

export { app, server };
