import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexto/AuthContext";
import Navbar from "./componentes/Navbar";
import Inicio from "./paginas/Inicio";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Bienvenido from "./paginas/Bienvenido";
import Protegida from "./paginas/Protegida";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/bienvenido"
            element={
              <Protegida>
                <Bienvenido />
              </Protegida>
            }
          />
          <Route path="*" element={<Inicio />} />
        </Routes>
      </main>
      <footer className="footer">
        Proyecto Integrador III · Escuela Técnica N°20 DE 20 &quot;Carolina Muzilli&quot; · 6° 2°
      </footer>
    </AuthProvider>
  );
}