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
import Boton from "../../componentes/base/Boton";
import Badge from "../../componentes/base/Badge";
import BarraConfirmacion from "../../componentes/base/BarraConfirmacion";
import Esqueleto from "../../componentes/base/Esqueleto";
import EstadoError from "../../componentes/base/EstadoError";
import Selector from "../../componentes/base/Selector";
import { Search, LogOut, CheckCircle2, Sparkles, UserCheck } from "lucide-react";

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
        `Rol de ${cambioPendiente.usuario.nombre} actualizado a ${ETIQUETA_ROL[cambioPendiente.nuevoRol]}.`
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-2">
              <Sparkles size={13} />
              Gobernanza comunitaria
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-brand-ink">
              Usuarios y Roles
            </h1>
            <p className="font-body text-sm text-brand-gray mt-1">
              Administrá permisos de acceso al panel y niveles de gestión de actividades.
            </p>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Buscador */}
        <div className="relative max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="search"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full min-h-[44px] pl-11 pr-4 rounded-full border border-brand-gray-light bg-brand-white text-brand-ink font-body text-sm placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
          />
        </div>

        {/* Estados de carga / error */}
        {cargando && (
          <div className="space-y-3">
            <Esqueleto alto="64px" className="rounded-2xl" />
            <Esqueleto alto="64px" className="rounded-2xl" />
            <Esqueleto alto="64px" className="rounded-2xl" />
          </div>
        )}

        {error && (
          <EstadoError titulo="Ocurrió un inconveniente" descripcion={error} onReintentar={cargar} />
        )}

        {/* Tabla de Usuarios en Card rounded-3xl */}
        {!cargando && (
          <div className="rounded-3xl border border-brand-gray-light bg-brand-white shadow-[0_6px_11px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/80 border-b border-brand-gray-light">
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Vecino / Referente
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Correo
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Rol
                    </th>
                    <th className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-brand-muted text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-light">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-brand-muted font-body text-sm">
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
                          className={`hover:bg-brand-bg/40 transition-colors ${
                            esPropio ? "bg-brand-orange/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-semibold text-sm text-brand-ink">
                                {u.nombre} {u.apellido}
                              </span>
                              {esPropio && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                                  <UserCheck size={11} />
                                  Tu cuenta
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-body text-xs text-brand-gray">
                            {u.correo}
                          </td>
                          <td className="py-3 px-4">
                            {esPropio ? (
                              <Badge tipo="destacada" texto={ETIQUETA_ROL[rol]} />
                            ) : (
                              <Selector
                                variante="compacto"
                                valor={rol}
                                onChange={(val) => {
                                  const nuevo = val as Rol;
                                  if (nuevo !== rol) {
                                    setCambioPendiente({ usuario: u, nuevoRol: nuevo });
                                  }
                                }}
                                ariaLabel={`Cambiar rol de ${u.nombre} ${u.apellido}`}
                                opciones={[
                                  { valor: "usuario", etiqueta: "Usuario" },
                                  { valor: "gestor", etiqueta: "Gestor" },
                                  { valor: "admin", etiqueta: "SuperAdmin" }
                                ]}
                              />
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Boton
                              variante="texto"
                              onClick={() => setCierrePendiente(u)}
                              disabled={esPropio}
                              title={esPropio ? "No podés cerrar tu propia sesión desde aquí" : "Cerrar sesiones activas"}
                            >
                              <LogOut size={15} />
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
          </div>
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
