import { Routes, Route } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Bienvenido from "./paginas/Bienvenido";
import Mapa from "./paginas/Mapa";
import Actividades from "./paginas/Actividades";
import Preferencias from "./paginas/Preferencias";
import Admin from "./paginas/Admin";
import { AuthProvider } from "./contexto/AuthContext";
import Protegida from "./paginas/Protegida";

function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Conectando Cultura — Barrio Mataderos, CABA.
        Hecho con ❤️ por la comunidad.
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
            path="/preferencias"
            element={
              <Protegida>
                <Preferencias />
              </Protegida>
            }
          />

          {/* Admin (placeholder — Sprint 4 implementa protección real) */}
          <Route path="/admin" element={<Admin />} />

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
