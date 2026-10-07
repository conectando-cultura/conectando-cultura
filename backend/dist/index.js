import express from "express";
import cors from "cors";
import { AuthService } from "./services/auth.service.js";
import { UsuarioRepository, SesionRepository } from "./repositories/usuario.repository.js";
import { crearRutasAuth } from "./routes/auth.routes.js";
import { crearRutasPreferencias } from "./routes/preferencias.routes.js";
import { crearRutasActividades } from "./routes/actividades.routes.js";
import { crearRutasAdmin } from "./routes/admin.routes.js";
import { exigirSupabase, esSupabaseConfigurado } from "./lib/supabase.js";
const PUERTO = Number(process.env.PORT ?? 3001);
const repositorioUsuarios = new UsuarioRepository();
const repositorioSesiones = new SesionRepository();
const servicioAuth = new AuthService(repositorioUsuarios, repositorioSesiones);
const app = express();
app.use(cors());
app.use(express.json());
// ── Health check ─────────────────────────────────────────────
// Anónimo y sin tocar la base: sirve para verificar que el proceso
// vive, y devuelve si la configuración de Supabase es válida.
app.get("/api/estado", (_req, res) => {
    res.json({
        servicio: "Conectando Cultura API",
        version: "1.0.0",
        baseDeDatos: esSupabaseConfigurado() ? "supabase" : "sin-configurar"
    });
});
// ── Auth ──────────────────────────────────────────────────────
app.use("/api/auth", crearRutasAuth(servicioAuth));
// ── Preferencias (requiere sesión) ────────────────────────────
app.use("/api/preferencias", crearRutasPreferencias(servicioAuth));
// ── Actividades (GET público; escritura = admin) ───────────────
app.use("/api/actividades", crearRutasActividades(servicioAuth));
// ── Administración (requiere sesión + rol admin) ───────────────
app.use("/api/admin", crearRutasAdmin(servicioAuth));
// ── Manejo de errores ─────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada." });
});
// No se filtra el stack ni el mensaje interno al cliente.
app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
});
// El servidor no arranca sin credenciales utilizables: es preferible
// fallar en el boot que descubrirlo en el primer request del cliente.
try {
    exigirSupabase();
}
catch (error) {
    console.error("\n✖ No se puede iniciar el backend.\n");
    console.error(error instanceof Error ? error.message : error);
    console.error("\nRevisá backend/.env o .env y volvé a intentarlo.\n");
    process.exit(1);
}
const server = app.listen(PUERTO, () => {
    console.log(`API de Conectando Cultura escuchando en http://localhost:${PUERTO}`);
    console.log(`Persistencia: Supabase (PostgreSQL)`);
});
export { app, server };
