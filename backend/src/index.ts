import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AuthService } from "./services/auth.service.js";
import { UsuarioRepository } from "./repositories/usuario.repository.js";
import { SesionRepository } from "./repositories/sesion.repository.js";
import { crearRutasAuth } from "./routes/auth.routes.js";
import { crearRutasPreferencias } from "./routes/preferencias.routes.js";
import { crearRutasActividades } from "./routes/actividades.routes.js";

const PUERTO = Number(process.env.PORT ?? 3001);
const DIR_ACTUAL = dirname(fileURLToPath(import.meta.url));
const RUTA_DATOS = join(DIR_ACTUAL, "..", "data", "usuarios.json");

const repositorioUsuarios = new UsuarioRepository(RUTA_DATOS);
const repositorioSesiones = new SesionRepository();
const servicioAuth = new AuthService(repositorioUsuarios, repositorioSesiones);

const app = express();

app.use(cors());
app.use(express.json());

// Auth (login / registro / logout — JSON local en dev)
app.use("/api/auth", crearRutasAuth(servicioAuth));

// Preferencias de usuario (requiere auth; validación via Supabase en producción)
app.use("/api/preferencias", crearRutasPreferencias(servicioAuth));

// Actividades, barrios y categorías (lectura pública)
app.use("/api/actividades", crearRutasActividades(servicioAuth));

app.get("/api/estado", (_req, res) => {
  res.json({ servicio: "Conectando Cultura API", version: "1.0.0" });
});

const server = app.listen(PUERTO, () => {
  console.log(`API de Conectando Cultura escuchando en http://localhost:${PUERTO}`);
});

export { app, server };
