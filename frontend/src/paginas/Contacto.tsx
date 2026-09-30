import { useState } from "react";
import { Link } from "react-router-dom";
import { enviarMensajeContacto } from "../api/actividades";
import { ErrorApi } from "../api/client";

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !mensaje.trim()) {
      setError("Por favor completá todos los campos.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await enviarMensajeContacto({
        nombre: nombre.trim(),
        correo: correo.trim(),
        mensaje: mensaje.trim()
      });
      setExito(true);
      setNombre("");
      setCorreo("");
      setMensaje("");
    } catch (err) {
      setError(
        err instanceof ErrorApi
          ? err.message
          : "Ocurrió un error al enviar tu mensaje. Por favor intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="main">
      <div style={{ marginBottom: "28px" }}>
        <h1>✉️ Contacto y Soporte Comunitario</h1>
        <p style={{ color: "var(--gris)", marginTop: "8px" }}>
          ¿Querés sugerir un nuevo espacio cultural en Mataderos o reportar un error?
          Escribinos y nos pondremos en contacto con vos.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
        {/* Formulario */}
        <div
          style={{
            background: "var(--blanco)",
            padding: "32px",
            borderRadius: "var(--radio)",
            border: "1px solid var(--borde)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <h2 style={{ fontSize: "1.3rem", marginBottom: "18px" }}>Envianos tu mensaje</h2>

          {exito ? (
            <div className="alerta alerta-exito" style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
              <h3 style={{ marginBottom: "8px" }}>¡Mensaje enviado con éxito!</h3>
              <p style={{ color: "#166534", marginBottom: "16px" }}>
                Muchas gracias por colaborar con la comunidad sociocultural de Mataderos.
                Revisaremos tu propuesta a la brevedad.
              </p>
              <button
                type="button"
                className="btn btn-primario"
                onClick={() => setExito(false)}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alerta alerta-error" style={{ marginBottom: "16px" }}>{error}</div>}

              <div className="campo">
                <label htmlFor="nombre">Nombre y Apellido *</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  maxLength={120}
                />
              </div>

              <div className="campo">
                <label htmlFor="correo">Correo Electrónico *</label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  maxLength={200}
                />
              </div>

              <div className="campo">
                <label htmlFor="mensaje">Mensaje o Sugerencia *</label>
                <textarea
                  id="mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Contanos tu sugerencia, propuesta de actividad o consulta…"
                  required
                  maxLength={4000}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primario"
                disabled={enviando}
                style={{ width: "100%", marginTop: "8px", padding: "12px" }}
              >
                {enviando ? "Enviando mensaje…" : "Enviar mensaje"}
              </button>
            </form>
          )}
        </div>

        {/* Panel lateral informativo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="tarjeta">
            <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>🏛️</div>
            <h3 style={{ marginBottom: "8px" }}>Polo Educativo de Mataderos</h3>
            <p style={{ color: "var(--gris)", fontSize: "0.95rem", lineHeight: "1.6" }}>
              <strong>Conectando Cultura</strong> es un proyecto integrador desarrollado
              por estudiantes de la Escuela Técnica N°20 DE 20 "Carolina Muzilli"
              con el objetivo de centralizar y maximizar la difusión de actividades
              socioculturales y barriales en la Ciudad de Buenos Aires.
            </p>
          </div>

          <div className="tarjeta">
            <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>💡</div>
            <h3 style={{ marginBottom: "8px" }}>¿Sos referente de un espacio cultural?</h3>
            <p style={{ color: "var(--gris)", fontSize: "0.95rem", lineHeight: "1.6" }}>
              Si administrás una peña, biblioteca popular, club de barrio, museo o centro
              cultural y querés que tus talleres o eventos aparezcan en la plataforma,
              completá el formulario con los detalles y los incorporaremos al mapa y catálogo.
            </p>
          </div>

          <div className="tarjeta" style={{ background: "var(--gris-claro)" }}>
            <h3 style={{ marginBottom: "8px" }}>🗺️ Explorar la plataforma</h3>
            <p style={{ color: "var(--gris)", fontSize: "0.9rem", marginBottom: "12px" }}>
              Conocé las actividades registradas en el mapa interactivo o configurá tus alertas por barrio y categoría.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link to="/mapa" className="btn btn-secundario" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                Ver Mapa
              </Link>
              <Link to="/actividades" className="btn btn-secundario" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                Ver Actividades
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
