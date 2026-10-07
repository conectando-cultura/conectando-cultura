import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPanel from "../../componentes/panel/LayoutPanel";
import { obtenerEstadisticasAdmin, type EstadisticasAdmin } from "../../api/admin";
import Tarjeta from "../../componentes/base/Tarjeta";
import Esqueleto from "../../componentes/base/Esqueleto";
import EstadoError from "../../componentes/base/EstadoError";
import Boton from "../../componentes/base/Boton";
import { useAuth } from "../../contexto/AuthContext";
import { puedeUsuario } from "../../utiles/permisos";
import {
  CalendarDays,
  CalendarOff,
  Users,
  Heart,
  PlusCircle,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function Dashboard(): React.JSX.Element {
  const { token, usuario } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const esAdmin = puedeUsuario(usuario, "usuarios:gestionar");

  function cargar() {
    if (!token) return;
    setCargando(true);
    setError(null);
    obtenerEstadisticasAdmin(token)
      .then(setEstadisticas)
      .catch((err) => setError(err.message || "Error al cargar las métricas"))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, [token]);

  const inactivas = estadisticas
    ? estadisticas.totalActividades - estadisticas.actividadesActivas
    : 0;

  return (
    <LayoutPanel>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Cabecera */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px"
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--fuente-titulo)",
                fontSize: "28px",
                color: "var(--tinta)",
                margin: "0 0 6px 0"
              }}
            >
              Dashboard
            </h1>
            <p style={{ color: "var(--texto-suave)", fontSize: "15px", margin: 0 }}>
              Resumen general y estado operativo de Conectando Cultura.
            </p>
          </div>

          <Link to="/admin/actividades?accion=nueva" style={{ textDecoration: "none" }}>
            <Boton variante="principal">
              <PlusCircle size={18} />
              Nueva actividad
            </Boton>
          </Link>
        </div>

        {/* Estados de carga y error */}
        {cargando && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <Esqueleto alto="130px" />
            <Esqueleto alto="130px" />
            <Esqueleto alto="130px" />
            <Esqueleto alto="130px" />
          </div>
        )}

        {error && !cargando && (
          <EstadoError
            titulo="No pudimos cargar las estadísticas"
            descripcion={error}
            onReintentar={cargar}
          />
        )}

        {/* Grid de Métricas */}
        {!cargando && estadisticas && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "32px"
              }}
            >
              {/* Tarjeta 1: Actividades activas */}
              <Link
                to="/admin/actividades?activo=true"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Tarjeta style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--texto-suave)" }}>
                      Actividades activas
                    </span>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        display: "grid",
                        placeItems: "center"
                      }}
                    >
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--fuente-titulo)", color: "var(--tinta)" }}>
                      {estadisticas.actividadesActivas}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--chapa)", display: "flex", alignItems: "center", gap: "4px" }}>
                      Ver activas <ArrowRight size={14} />
                    </span>
                  </div>
                </Tarjeta>
              </Link>

              {/* Tarjeta 2: Inactivas / Por revisar */}
              <Link
                to="/admin/actividades?activo=false"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Tarjeta style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--texto-suave)" }}>
                      {esAdmin ? "Inactivas u ocultas" : "Inactivas para revisar"}
                    </span>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "var(--peligro-fondo)",
                        color: "var(--peligro)",
                        display: "grid",
                        placeItems: "center"
                      }}
                    >
                      <CalendarOff size={20} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--fuente-titulo)", color: "var(--tinta)" }}>
                      {inactivas}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--peligro)", display: "flex", alignItems: "center", gap: "4px" }}>
                      Revisar <ArrowRight size={14} />
                    </span>
                  </div>
                </Tarjeta>
              </Link>

              {/* Tarjeta 3: Usuarios registrados */}
              <Link
                to={esAdmin ? "/admin/usuarios" : "#"}
                style={{ textDecoration: "none", color: "inherit", cursor: esAdmin ? "pointer" : "default" }}
              >
                <Tarjeta style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--texto-suave)" }}>
                      Vecinos registrados
                    </span>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        display: "grid",
                        placeItems: "center"
                      }}
                    >
                      <Users size={20} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--fuente-titulo)", color: "var(--tinta)" }}>
                      {estadisticas.totalUsuarios}
                    </span>
                    {esAdmin && (
                      <span style={{ fontSize: "12px", color: "var(--chapa)", display: "flex", alignItems: "center", gap: "4px" }}>
                        Gestionar <ArrowRight size={14} />
                      </span>
                    )}
                  </div>
                </Tarjeta>
              </Link>

              {/* Tarjeta 4: Vecinos con preferencias personalizadas */}
              <Tarjeta style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--texto-suave)" }}>
                    Con preferencias
                  </span>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: "#fdf2f8",
                      color: "#db2777",
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    <Heart size={20} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--fuente-titulo)", color: "var(--tinta)" }}>
                    {estadisticas.totalPreferencias}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--texto-suave)" }}>
                    configuradas
                  </span>
                </div>
              </Tarjeta>
            </div>

            {/* Accesos Rápidos y Ayuda */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <Tarjeta>
                <h2 style={{ fontSize: "18px", fontFamily: "var(--fuente-titulo)", margin: "0 0 12px 0", color: "var(--tinta)" }}>
                  Flujo de trabajo sugerido
                </h2>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--texto-suave)", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>Revisá que las actividades tengan geolocalización correcta antes de publicarlas.</li>
                  <li>Las actividades inactivas no son visibles en el catálogo ni en el mapa para vecinos.</li>
                  <li>Mantené actualizados los horarios y referencias para facilitar la llegada de los vecinos.</li>
                </ul>
              </Tarjeta>

              {esAdmin && (
                <Tarjeta style={{ borderLeft: "4px solid var(--naranja)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <ShieldAlert size={20} style={{ color: "var(--naranja)" }} />
                    <h2 style={{ fontSize: "18px", fontFamily: "var(--fuente-titulo)", margin: 0, color: "var(--tinta)" }}>
                      Panel SuperAdmin
                    </h2>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--texto-suave)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                    Tenés acceso total a la asignación de roles y revocación de sesiones concurrentes de usuarios del sistema.
                  </p>
                  <Link to="/admin/usuarios" style={{ textDecoration: "none" }}>
                    <Boton variante="secundario">
                      Administrar usuarios y permisos
                    </Boton>
                  </Link>
                </Tarjeta>
              )}
            </div>
          </>
        )}
      </div>
    </LayoutPanel>
  );
}
