export default function Admin() {
  return (
    <div className="main">
      <h1>🔒 Panel de Administración</h1>
      <p style={{ color: "var(--gris)", marginTop: "8px" }}>
        Sección protegida. Solo administradores pueden acceder.
      </p>

      <div
        style={{
          marginTop: "32px",
          padding: "32px",
          background: "var(--gris-claro)",
          borderRadius: "var(--radio)",
          border: "1px solid var(--borde)",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--naranja)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            fontSize: "2rem"
          }}
        >
          🔧
        </div>
        <h2 style={{ marginBottom: "12px" }}>Panel en construcción</h2>
        <p style={{ color: "var(--gris)", maxWidth: "400px", margin: "0 auto" }}>
          El panel de administración (CRUD de actividades, gestión de categorías y
          usuarios) se implementa en el{" "}
          <strong>Sprint 4</strong> del roadmap del proyecto.
        </p>
        <p style={{ color: "var(--gris)", marginTop: "12px", fontSize: "0.9rem" }}>
          Si tenés el rol de administrador asignado en Supabase, contactá al equipo
          de desarrollo para activar el acceso.
        </p>
      </div>

      <div className="grilla" style={{ marginTop: "28px" }}>
        {[
          { icono: "📋", titulo: "Gestionar Actividades", estado: "Pendiente Sprint 4" },
          { icono: "📂", titulo: "Gestionar Categorías", estado: "Pendiente Sprint 4" },
          { icono: "👥", titulo: "Gestionar Usuarios", estado: "Pendiente Sprint 4" },
          { icono: "📊", titulo: "Reportes", estado: "Pendiente Sprint 4" }
        ].map((item) => (
          <div key={item.titulo} className="tarjeta">
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{item.icono}</div>
            <h3>{item.titulo}</h3>
            <p style={{ color: "var(--naranja)", fontSize: "0.88rem", fontWeight: 600 }}>
              {item.estado}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
