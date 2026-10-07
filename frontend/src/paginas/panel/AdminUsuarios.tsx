import React, { useEffect, useState } from "react";
import LayoutPanel from "../../componentes/panel/LayoutPanel";
import {
  obtenerUsuariosAdmin,
  actualizarRolUsuario,
  cerrarSesionesUsuario
} from "../../api/admin";
import type { UsuarioPublico, Rol } from "../../tipos";
import { useAuth } from "../../contexto/AuthContext";
import { ETIQUETA_ROL } from "../../utiles/permisos";
import Tarjeta from "../../componentes/base/Tarjeta";
import Boton from "../../componentes/base/Boton";
import Badge from "../../componentes/base/Badge";
import BarraConfirmacion from "../../componentes/base/BarraConfirmacion";
import Esqueleto from "../../componentes/base/Esqueleto";
import EstadoError from "../../componentes/base/EstadoError";
import { Search, LogOut, CheckCircle2 } from "lucide-react";

export default function AdminUsuarios(): React.JSX.Element {
  const { token, usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");

  // Estado para confirmación de cambio de rol
  const [cambioPendiente, setCambioPendiente] = useState<{
    usuario: UsuarioPublico;
    nuevoRol: Rol;
  } | null>(null);

  // Estado para confirmación de cierre de sesiones
  const [cierrePendiente, setCierrePendiente] = useState<UsuarioPublico | null>(null);

  // Mensaje de éxito temporal
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    setCargando(true);
    setError(null);
    obtenerUsuariosAdmin(token)
      .then(setUsuarios)
      .catch((err) => setError(err.message || "Error al cargar la lista de usuarios"))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, [token]);

  // Manejador de confirmación de cambio de rol
  async function confirmarCambioRol() {
    if (!token || !cambioPendiente) return;
    try {
      const res = await actualizarRolUsuario(cambioPendiente.usuario.id, cambioPendiente.nuevoRol, token);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === res.usuario.id ? { ...u, rol: res.usuario.rol } : u))
      );
      setMensajeExito(
        `Rol de ${cambioPendiente.usuario.nombre} cambiado a ${ETIQUETA_ROL[cambioPendiente.nuevoRol]}.`
      );
      setCambioPendiente(null);
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "No se pudo actualizar el rol.";
      setError(mensaje);
    }
  }

  // Manejador de cierre de sesiones
  async function confirmarCierreSesiones() {
    if (!token || !cierrePendiente) return;
    try {
      await cerrarSesionesUsuario(cierrePendiente.id, token);
      setMensajeExito(`Sesiones activas de ${cierrePendiente.nombre} cerradas exitosamente.`);
      setCierrePendiente(null);
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error al revocar las sesiones.";
      setError(mensaje);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = filtroTexto.toLowerCase().trim();
    if (!q) return true;
    const nombreCompleto = `${u.nombre} ${u.apellido}`.toLowerCase();
    return nombreCompleto.includes(q) || u.correo.toLowerCase().includes(q);
  });

  return (
    <LayoutPanel>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Cabecera */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "var(--fuente-titulo)",
              fontSize: "28px",
              color: "var(--tinta)",
              margin: "0 0 6px 0"
            }}
          >
            Usuarios y Roles
          </h1>
          <p style={{ color: "var(--texto-suave)", fontSize: "15px", margin: 0 }}>
            Administrá permisos y accesos al panel. Solo administradores autorizados.
          </p>
        </div>

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              backgroundColor: "#ecfdf5",
              color: "#065f46",
              borderRadius: "var(--radio-control)",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={18} />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Buscador */}
        <div style={{ marginBottom: "20px", position: "relative", maxWidth: "420px" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--texto-suave)",
              display: "grid",
              placeItems: "center"
            }}
          >
            <Search size={18} />
          </span>
          <input
            type="search"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{
              width: "100%",
              minHeight: "var(--alto-tactil)",
              paddingLeft: "42px",
              paddingRight: "16px",
              borderRadius: "var(--radio-control)",
              border: "1px solid var(--linea)",
              backgroundColor: "var(--blanco)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        {/* Estados de carga / error */}
        {cargando && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Esqueleto alto="54px" />
            <Esqueleto alto="54px" />
            <Esqueleto alto="54px" />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: "20px" }}>
            <EstadoError titulo="Ocurrió un inconveniente" descripcion={error} onReintentar={cargar} />
          </div>
        )}

        {/* Tabla de Usuarios */}
        {!cargando && (
          <Tarjeta style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--papel)", borderBottom: "1px solid var(--linea)" }}>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Nombre
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Correo
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase" }}>
                      Rol
                    </th>
                    <th style={{ padding: "14px 16px", fontSize: "12px", color: "var(--texto-suave)", textTransform: "uppercase", textAlign: "right" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--texto-suave)" }}>
                        No se encontraron usuarios coincidentes.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const esPropio = u.id === usuarioActual?.id;
                      const rol: Rol = (u.rol as Rol) || "usuario";

                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: "1px solid var(--linea)",
                            backgroundColor: esPropio ? "rgba(249, 128, 23, 0.04)" : "transparent"
                          }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, color: "var(--tinta)", fontSize: "14px" }}>
                              {u.nombre} {u.apellido}
                            </div>
                            {esPropio && (
                              <span style={{ fontSize: "11px", color: "var(--chapa)", fontWeight: 700 }}>
                                (Tu cuenta actual)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", color: "var(--texto-suave)", fontSize: "14px" }}>
                            {u.correo}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {esPropio ? (
                              <Badge tipo="destacada" texto={ETIQUETA_ROL[rol]} />
                            ) : (
                              <select
                                value={rol}
                                onChange={(e) => {
                                  const nuevo = e.target.value as Rol;
                                  setCambioPendiente({ usuario: u, nuevoRol: nuevo });
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "var(--radio-control)",
                                  border: "1px solid var(--linea)",
                                  backgroundColor: "var(--blanco)",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "var(--tinta)",
                                  cursor: "pointer"
                                }}
                              >
                                <option value="usuario">Usuario</option>
                                <option value="gestor">Gestor</option>
                                <option value="admin">SuperAdmin</option>
                              </select>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <Boton
                              variante="texto"
                              onClick={() => setCierrePendiente(u)}
                              disabled={esPropio}
                              title={esPropio ? "No podés cerrar tu propia sesión desde aquí" : "Cerrar sesiones activas"}
                            >
                              <LogOut size={16} />
                              Cerrar sesiones
                            </Boton>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        )}

        {/* Barra de Confirmación: Cambio de Rol */}
        {cambioPendiente && (
          <BarraConfirmacion
            mensaje={
              cambioPendiente.nuevoRol === "gestor"
                ? `${cambioPendiente.usuario.nombre} podrá crear, editar y desactivar actividades. ¿Darle rol de gestor?`
                : cambioPendiente.nuevoRol === "admin"
                ? `${cambioPendiente.usuario.nombre} tendrá acceso total, incluida la gestión de usuarios. ¿Darle rol de SuperAdmin?`
                : `${cambioPendiente.usuario.nombre} dejará de acceder al panel. ¿Quitarle el rol?`
            }
            onConfirmar={confirmarCambioRol}
            onCancelar={() => setCambioPendiente(null)}
            textoConfirmar="Confirmar cambio"
          />
        )}

        {/* Barra de Confirmación: Cierre de Sesiones */}
        {cierrePendiente && (
          <BarraConfirmacion
            mensaje={`Se revocarán todas las sesiones activas de ${cierrePendiente.nombre}. ¿Cerrar sesiones?`}
            onConfirmar={confirmarCierreSesiones}
            onCancelar={() => setCierrePendiente(null)}
            textoConfirmar="Cerrar sesiones"
            esPeligro
          />
        )}
      </div>
    </LayoutPanel>
  );
}
