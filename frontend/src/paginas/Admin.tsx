import { Lock, Wrench, CalendarDays, FolderOpen, Users, BarChart3 } from "lucide-react";

export default function Admin() {
  return (
    <div className="main">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Lock size={24} color="var(--tinta)" />
        <h1>Panel de Administración</h1>
      </div>
      <p style={{ color: "var(--texto-suave)", marginTop: "8px" }}>
        Sección protegida para gestores y administradores.
      </p>

      <div
        style={{
          marginTop: "32px",
          padding: "32px",
          background: "var(--papel)",
          borderRadius: "var(--radio-tarjeta)",
          border: "1px solid var(--linea)",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--boton-fondo)",
            color: "var(--boton-texto)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px"
          }}
        >
          <Wrench size={24} />
        </div>
        <h2 style={{ marginBottom: "12px", fontFamily: "var(--fuente-titulo)" }}>
          Panel en evolución
        </h2>
        <p style={{ color: "var(--texto-suave)", maxWidth: "420px", margin: "0 auto" }}>
          El módulo de administración incluye gestión de actividades, estadísticas y asignación de roles.
        </p>
      </div>

      <div className="grilla" style={{ marginTop: "28px" }}>
        {[
          { icono: <CalendarDays size={28} />, titulo: "Gestionar Actividades", estado: "Disponible" },
          { icono: <FolderOpen size={28} />, titulo: "Gestionar Categorías", estado: "Catálogo activo" },
          { icono: <Users size={28} />, titulo: "Gestionar Usuarios", estado: "Disponible para Admin" },
          { icono: <BarChart3 size={28} />, titulo: "Estadísticas", estado: "Disponible" }
        ].map((item) => (
          <div key={item.titulo} className="tarjeta">
            <div style={{ color: "var(--chapa)", marginBottom: "10px" }}>{item.icono}</div>
            <h3>{item.titulo}</h3>
            <p style={{ color: "var(--chapa)", fontSize: "0.88rem", fontWeight: 600 }}>
              {item.estado}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
