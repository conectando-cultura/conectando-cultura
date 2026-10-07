import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Explorar from "./paginas/Explorar";
import DetalleActividad from "./paginas/DetalleActividad";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Bienvenido from "./paginas/Bienvenido";
import Preferencias from "./paginas/Preferencias";
import Dashboard from "./paginas/panel/Dashboard";
import AdminActividades from "./paginas/panel/AdminActividades";
import AdminUsuarios from "./paginas/panel/AdminUsuarios";
import ProtegidaPermiso from "./paginas/ProtegidaPermiso";
import { AuthProvider } from "./contexto/AuthContext";
import Protegida from "./paginas/Protegida";
import ComponentesDemo from "./paginas/ComponentesDemo";

function Footer() {
  return (
    <footer className="footer">
      <p>
        (c) {new Date().getFullYear()} Conectando Cultura. Barrio Mataderos, CABA.
        Hecho por la comunidad.
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
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/actividades/:barrio/:slug" element={<DetalleActividad />} />
          <Route path="/mapa" element={<Navigate to="/explorar?vista=mapa" replace />} />
          <Route path="/actividades" element={<Navigate to="/explorar?vista=lista" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/componentes" element={<ComponentesDemo />} />

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

          {/* Panel de administración (según permisos de rol) */}
          <Route
            path="/admin"
            element={
              <ProtegidaPermiso permiso="panel:acceder">
                <Dashboard />
              </ProtegidaPermiso>
            }
          />
          <Route
            path="/admin/actividades"
            element={
              <ProtegidaPermiso permiso="actividades:escribir">
                <AdminActividades />
              </ProtegidaPermiso>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtegidaPermiso permiso="usuarios:gestionar">
                <AdminUsuarios />
              </ProtegidaPermiso>
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
