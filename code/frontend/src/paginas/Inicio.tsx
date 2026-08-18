import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      <section className="portada">
        <h1>
          Conectando <span className="resaltado">Cultura</span>
        </h1>
        <p>
          Un solo lugar para encontrar las actividades culturales y sociales de los barrios de la
          Ciudad de Buenos Aires: ferias, peñas, museos, bibliotecas, cines y mucho más.
        </p>
        <div className="botones-accion">
          <Link className="btn btn-primario" to="/registro">
            Crear cuenta
          </Link>
          <Link className="btn btn-secundario" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </section>

      <section className="grilla" aria-label="Propuesta del proyecto">
        <article className="tarjeta">
          <h3>🗺️ Mapa interactivo</h3>
          <p>Actividades geolocalizadas en Mataderos con puntos de colores según su categoría.</p>
        </article>
        <article className="tarjeta">
          <h3>📋 Listado organizado</h3>
          <p>Centralizamos la información de los centros culturales, bibliotecas y eventos del barrio.</p>
        </article>
        <article className="tarjeta">
          <h3>🔔 Avisos por correo</h3>
          <p>Te avisamos cuando se publica una actividad nueva de lo que te interesa seguir.</p>
        </article>
        <article className="tarjeta">
          <h3>👤 Cuenta de usuario</h3>
          <p>Registrate e iniciá sesión para guardar tus preferencias y no perderte nada.</p>
        </article>
      </section>

      <aside className="aviso">
        <strong>En desarrollo:</strong> el mapa interactivo, el listado de actividades y las
        notificaciones se encuentran en desarrollo. Mientras tanto, creá tu cuenta para
        personalizar tu experiencia.
      </aside>
    </>
  );
}