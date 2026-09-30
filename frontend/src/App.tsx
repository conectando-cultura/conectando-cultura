import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Bienvenido from "./paginas/Bienvenido";
import Mapa from "./paginas/Mapa";
import Actividades from "./paginas/Actividades";
import ActividadDetalle from "./paginas/ActividadDetalle";
import Contacto from "./paginas/Contacto";
import Favoritos from "./paginas/Favoritos";
import Preferencias from "./paginas/Preferencias";
import AdminActividades from "./paginas/AdminActividades";
import ProtegidaAdmin from "./paginas/ProtegidaAdmin";
import { AuthProvider } from "./contexto/AuthContext";
import Protegida from "./paginas/Protegida";

function Footer() {
  return (
    <footer className="footer" style={{ borderTop: "2px solid var(--borde)", padding: "28px 20px", marginTop: "auto", background: "var(--gris-claro)", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginBottom: "12px", fontSize: "0.95rem" }}>
        <Link to="/" style={{ color: "var(--texto)" }}>Inicio</Link>
        <Link to="/mapa" style={{ color: "var(--texto)" }}>Mapa</Link>
        <Link to="/actividades" style={{ color: "var(--texto)" }}>Actividades</Link>
        <Link to="/contacto" style={{ color: "var(--texto)" }}>Contacto y Soporte</Link>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--gris)" }}>
        © {new Date().getFullYear()} Conectando Cultura — Polo Educativo de Mataderos, CABA.
        Hecho con ❤️ para la comunidad barrial.
      </p>
    </footer>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/actividades/:id" element={<ActividadDetalle />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Rutas protegidas */}
          <Route
            path="/bienvenido"
            element={
              <Protegida>
                <Bienvenido />
              </Protegida>
            }
          />
          <Route
            path="/favoritos"
            element={
              <Protegida>
                <Favoritos />
              </Protegida>
            }
          />
          <Route
            path="/preferencias"
            element={
              <Protegida>
                <Preferencias />
              </Protegida>
            }
          />

          {/* Admin (requiere auth + rol admin) */}
          <Route
            path="/admin"
            element={
              <ProtegidaAdmin>
                <AdminActividades />
              </ProtegidaAdmin>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="main" style={{ textAlign: "center", padding: "60px 20px" }}>
                <h1>404</h1>
                <p style={{ color: "var(--gris)", marginTop: "12px" }}>
                  La página que buscás no existe.
                </p>
                <a href="/" className="btn btn-primario" style={{ marginTop: "20px", display: "inline-block" }}>
                  Volver al inicio
                </a>
              </div>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
