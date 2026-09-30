import { Router } from "express";
import { ContactoService } from "../services/contacto.service.js";

export function crearRutasContacto(): Router {
  const router = Router();
  const servicio = new ContactoService();

  // POST /api/contacto
  router.post("/", async (req, res) => {
    try {
      const { nombre, correo, mensaje } = req.body as {
        nombre?: string;
        correo?: string;
        mensaje?: string;
      };

      if (!nombre || !correo || !mensaje) {
        res.status(400).json({
          mensaje: "Todos los campos (nombre, correo, mensaje) son obligatorios."
        });
        return;
      }

      await servicio.crearMensaje(nombre, correo, mensaje);

      res.status(201).json({
        ok: true,
        mensaje: "¡Gracias por contactarte! Tu mensaje fue recibido correctamente."
      });
    } catch (err) {
      console.error("Error en contacto:", err);
      res.status(400).json({
        mensaje: err instanceof Error ? err.message : "Error al enviar el mensaje."
      });
    }
  });

  return router;
}
