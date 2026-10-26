import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPanel from "../../componentes/panel/LayoutPanel";
import {
  obtenerEstadisticasAdmin,
  obtenerEstadoSistemaBd,
  ejecutarPingSupabaseAdmin,
  sincronizarBackupSupabaseAdmin,
  type EstadisticasAdmin,
  type EstadoSistemaBd
} from "../../api/admin";
import Tarjeta from "../../componentes/base/Tarjeta";
import Badge, { type TipoEstadoBadge } from "../../componentes/base/Badge";
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
  ShieldAlert,
  Sparkles,
  Info,
  Database,
  Cloud,
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "Sin registro";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function resolverBadgeSupabase(
  estado: EstadoSistemaBd["supabase"]["estado"]
): { tipo: TipoEstadoBadge; texto: string } {
  if (estado === "activo") {
    return { tipo: "activa", texto: "Activo" };
  }
  if (estado === "pausado_o_error") {
    return { tipo: "inactiva", texto: "Pausado o sin conexión" };
  }
  if (estado === "sin_configurar") {
    return { tipo: "oculta", texto: "Sin configurar" };
  }
  return { tipo: "destacada", texto: "Pendiente de verificación" };
}

export default function Dashboard(): React.JSX.Element {
  const { token, usuario } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasAdmin | null>(null);
  const [estadoBd, setEstadoBd] = useState<EstadoSistemaBd | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ejecutandoPing, setEjecutandoPing] = useState(false);
  const [ejecutandoSync, setEjecutandoSync] = useState(false);
  const [mensajeOperacionBd, setMensajeOperacionBd] = useState<string | null>(null);
  const [errorOperacionBd, setErrorOperacionBd] = useState<string | null>(null);

  const esAdmin = puedeUsuario(usuario, "usuarios:gestionar");

  function cargar(): void {
    if (!token) return;
    setCargando(true);
    setError(null);

    const promesas: [
      Promise<EstadisticasAdmin>,
      Promise<EstadoSistemaBd | null>
    ] = [
      obtenerEstadisticasAdmin(token),
      esAdmin ? obtenerEstadoSistemaBd(token).catch(() => null) : Promise.resolve(null)
    ];

    Promise.all(promesas)
      .then(([stats, bd]) => {
        setEstadisticas(stats);
        if (bd) setEstadoBd(bd);
      })
      .catch((err: unknown) => {
        const mensaje = err instanceof Error ? err.message : "Error al cargar las métricas";
        setError(mensaje);
      })
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, [token, esAdmin]);

  async function manejarPingManual(): Promise<void> {
    if (!token || ejecutandoPing) return;
    setEjecutandoPing(true);
    setMensajeOperacionBd(null);
    setErrorOperacionBd(null);

    try {
      const actualizado = await ejecutarPingSupabaseAdmin(token);
      setEstadoBd(actualizado);
      if (actualizado.supabase.estado === "activo") {
        setMensajeOperacionBd(
          `Consulta SELECT 1 ejecutada correctamente en Supabase (${
            actualizado.supabase.ultimaLatenciaMs ?? 1
          } ms). Próximo keep-alive programado en 3 días.`
        );
      } else {
        setErrorOperacionBd(
          actualizado.supabase.ultimoError ??
            "No se pudo completar el ping contra Supabase. Verificá las credenciales o si el proyecto sigue pausado."
        );
      }
    } catch (err: unknown) {
      setErrorOperacionBd(
        err instanceof Error ? err.message : "Error al enviar SELECT 1 a Supabase."
      );
    } finally {
      setEjecutandoPing(false);
    }
  }

  async function manejarSincronizacionBackup(): Promise<void> {
    if (!token || ejecutandoSync) return;
    setEjecutandoSync(true);
    setMensajeOperacionBd(null);
    setErrorOperacionBd(null);

    try {
      const resultado = await sincronizarBackupSupabaseAdmin(token);
      setEstadoBd(resultado.estado);
      setMensajeOperacionBd(
        `${resultado.mensaje} (Actividades: ${resultado.resumen.actividades}, Usuarios: ${resultado.resumen.usuarios}, Barrios: ${resultado.resumen.barrios}, Categorías: ${resultado.resumen.categorias}).`
      );
    } catch (err: unknown) {
      setErrorOperacionBd(
        err instanceof Error
          ? err.message
          : "Error al sincronizar los datos de MySQL hacia Supabase."
      );
    } finally {
      setEjecutandoSync(false);
    }
  }

  const inactivas = estadisticas
    ? estadisticas.totalActividades - estadisticas.actividadesActivas
    : 0;

  return (
    <LayoutPanel>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-1.5">
              <Sparkles size={12} />
              Panel de control
            </div>
            <h1 className="font-display text-xl md:text-2xl text-brand-ink">
              Dashboard
            </h1>
            <p className="font-body text-xs text-brand-gray mt-0.5">
              Resumen general y estado operativo de Conectando Cultura en Comuna 9.
            </p>
          </div>

          <Link to="/admin/actividades?accion=nueva">
            <Boton variante="principal">
              <PlusCircle size={16} />
              Nueva actividad
            </Boton>
          </Link>
        </div>

        {/* Estados de carga y error */}
        {cargando && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Esqueleto alto="130px" className="rounded-3xl" />
            <Esqueleto alto="130px" className="rounded-3xl" />
            <Esqueleto alto="130px" className="rounded-3xl" />
            <Esqueleto alto="130px" className="rounded-3xl" />
          </div>
        )}

        {error && !cargando && (
          <EstadoError
            titulo="No pudimos cargar las estadísticas"
            descripcion={error}
            onReintentar={cargar}
          />
        )}

        {/* Grid de Métricas con Croquis KPI Cards */}
        {!cargando && estadisticas && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Tarjeta 1: Actividades activas */}
              <Link
                to="/admin/actividades?activo=true"
                className="group block transition-transform hover:-translate-y-1"
              >
                <div className="h-full bg-brand-white rounded-2xl p-4 md:p-5 border border-brand-gray-light shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Actividades activas
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-brand-orange/15 text-brand-orange flex items-center justify-center">
                      <CalendarDays size={17} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-2xl md:text-3xl text-brand-ink mb-1.5">
                      {estadisticas.actividadesActivas}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange group-hover:underline">
                      Ver publicadas <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Tarjeta 2: Inactivas / Por revisar */}
              <Link
                to="/admin/actividades?activo=false"
                className="group block transition-transform hover:-translate-y-1"
              >
                <div className="h-full bg-brand-white rounded-2xl p-4 md:p-5 border border-brand-gray-light shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      {esAdmin ? "Inactivas u ocultas" : "Para revisar"}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CalendarOff size={17} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-2xl md:text-3xl text-brand-ink mb-1.5">
                      {inactivas}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:underline">
                      Revisar inactivas <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Tarjeta 3: Usuarios registrados */}
              <Link
                to={esAdmin ? "/admin/usuarios" : "#"}
                className={`group block transition-transform ${esAdmin ? "hover:-translate-y-1" : "cursor-default"}`}
              >
                <div className="h-full bg-brand-white rounded-2xl p-4 md:p-5 border border-brand-gray-light shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Vecinos registrados
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users size={17} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-2xl md:text-3xl text-brand-ink mb-1.5">
                      {estadisticas.totalUsuarios}
                    </span>
                    {esAdmin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange group-hover:underline">
                        Gestionar roles <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    ) : (
                      <span className="text-xs text-brand-muted">En toda la red</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Tarjeta 4: Vecinos con preferencias personalizadas */}
              <div className="h-full bg-brand-white rounded-2xl p-4 md:p-5 border border-brand-gray-light shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                    Con preferencias
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Heart size={17} />
                  </div>
                </div>
                <div>
                  <span className="block font-display text-2xl md:text-3xl text-brand-ink mb-1.5">
                    {estadisticas.totalPreferencias}
                  </span>
                  <span className="text-xs text-brand-muted">Perfiles activos configurados</span>
                </div>
              </div>
            </div>

            {/* Sección exclusiva SuperAdmin: Estado de Base de Datos y Keep-Alive de Supabase */}
            {esAdmin && estadoBd && (
              <div className="rounded-3xl border border-brand-orange/40 bg-brand-white p-6 md:p-8 shadow-[0_6px_11px_rgba(0,0,0,0.1)] space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-gray-light pb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-2">
                      <Database size={12} />
                      Infraestructura de datos (Solo SuperAdmin)
                    </div>
                    <h2 className="font-display text-xl md:text-2xl text-brand-ink">
                      Estado de Base de Datos y Keep-Alive de Supabase
                    </h2>
                    <p className="font-body text-xs md:text-sm text-brand-gray mt-1">
                      Monitoreo en tiempo real del motor primario MySQL local y del respaldo en la nube con prevención automática de pausa en el plan gratuito de Supabase.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Boton
                      variante="secundario"
                      onClick={() => void manejarPingManual()}
                      disabled={ejecutandoPing || ejecutandoSync || !estadoBd.supabase.configurado}
                    >
                      <Activity size={16} />
                      {ejecutandoPing ? "Enviando SELECT 1..." : "Enviar SELECT 1 ahora"}
                    </Boton>
                    <Boton
                      variante="principal"
                      onClick={() => void manejarSincronizacionBackup()}
                      disabled={ejecutandoSync || ejecutandoPing || !estadoBd.supabase.configurado}
                    >
                      <RefreshCw size={16} className={ejecutandoSync ? "animate-spin" : ""} />
                      {ejecutandoSync ? "Sincronizando..." : "Sincronizar MySQL a Supabase"}
                    </Boton>
                  </div>
                </div>

                {mensajeOperacionBd && (
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-body text-xs md:text-sm">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                    <span>{mensajeOperacionBd}</span>
                  </div>
                )}

                {errorOperacionBd && (
                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-body text-xs md:text-sm">
                    <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorOperacionBd}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Subtarjeta 1: Motor Primario MySQL Local */}
                  <div className="rounded-2xl border border-brand-gray-light bg-brand-bg/50 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink">
                          <Database size={15} className="text-brand-orange" />
                          Motor Primario (MySQL Local)
                        </span>
                        <Badge
                          tipo={estadoBd.mysql.conectado ? "activa" : "inactiva"}
                          texto={estadoBd.mysql.conectado ? "Conectado" : "Error de conexión"}
                        />
                      </div>

                      <dl className="space-y-2 font-body text-xs text-brand-gray">
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Base de datos:</dt>
                          <dd className="font-semibold text-brand-ink">{estadoBd.mysql.baseDeDatos}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Host / Puerto:</dt>
                          <dd className="font-semibold text-brand-ink">{estadoBd.mysql.host}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Latencia SELECT 1:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {estadoBd.mysql.latenciaMs !== null ? `${estadoBd.mysql.latenciaMs} ms` : "N/D"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {estadoBd.mysql.error && (
                      <p className="font-body text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        {estadoBd.mysql.error}
                      </p>
                    )}
                  </div>

                  {/* Subtarjeta 2: Backup en la Nube (Supabase Free Tier) */}
                  <div className="rounded-2xl border border-brand-gray-light bg-brand-bg/50 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink">
                          <Cloud size={15} className="text-brand-orange" />
                          Backup en la Nube (Supabase)
                        </span>
                        <Badge
                          tipo={resolverBadgeSupabase(estadoBd.supabase.estado).tipo}
                          texto={resolverBadgeSupabase(estadoBd.supabase.estado).texto}
                        />
                      </div>

                      <dl className="space-y-2 font-body text-xs text-brand-gray">
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Proyecto:</dt>
                          <dd className="font-semibold text-brand-ink truncate max-w-[190px]">
                            {estadoBd.supabase.urlProyecto ?? "No configurado en .env"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Latencia último ping:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {estadoBd.supabase.ultimaLatenciaMs !== null
                              ? `${estadoBd.supabase.ultimaLatenciaMs} ms`
                              : "Sin mediciones"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Espejo en segundo plano:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {estadoBd.supabase.replicacion.totalExitosas} ok /{" "}
                            {estadoBd.supabase.replicacion.totalFallidas} fallidas
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {estadoBd.supabase.ultimoError && (
                      <p className="font-body text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        Último aviso: {estadoBd.supabase.ultimoError}
                      </p>
                    )}
                  </div>

                  {/* Subtarjeta 3: Protección Anti-Pausa (Keep-Alive SELECT 1 cada 3 días) */}
                  <div className="rounded-2xl border border-brand-gray-light bg-brand-bg/50 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink">
                          <Clock size={15} className="text-brand-orange" />
                          Protección Anti-Pausa
                        </span>
                        <Badge
                          tipo="destacada"
                          texto={`${estadoBd.supabase.consultaKeepAlive} · ${estadoBd.supabase.intervaloDias} días`}
                        />
                      </div>

                      <p className="font-body text-xs text-brand-gray mb-3 leading-relaxed">
                        Consulta automática: <strong className="text-brand-ink">SELECT 1 cada 3 días (72 h)</strong> para evitar pausa por inactividad en plan Free.
                      </p>

                      <dl className="space-y-1.5 font-body text-xs text-brand-gray">
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Último ping SELECT 1:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {formatearFechaHora(estadoBd.supabase.ultimoPingEn)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Próximo ping programado:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {formatearFechaHora(estadoBd.supabase.proximoPingEn)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-brand-muted">Última sincronización:</dt>
                          <dd className="font-semibold text-brand-ink">
                            {formatearFechaHora(estadoBd.supabase.ultimaSincronizacionEn)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accesos Rápidos y Ayuda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Tarjeta className="!rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={20} className="text-brand-orange shrink-0" />
                  <h2 className="font-display text-xl text-brand-ink">
                    Flujo de trabajo sugerido
                  </h2>
                </div>
                <ul className="space-y-3 font-body text-sm text-brand-gray leading-relaxed list-disc list-inside">
                  <li>Revisá que las actividades tengan geolocalización correcta antes de publicarlas.</li>
                  <li>Las actividades inactivas u ocultas no son visibles en el catálogo ni en el mapa para vecinos.</li>
                  <li>Mantené actualizados los horarios y referencias para facilitar la llegada de los vecinos.</li>
                </ul>
              </Tarjeta>

              {esAdmin && (
                <div className="rounded-3xl border border-brand-orange/40 bg-brand-white p-6 md:p-8 shadow-[0_6px_11px_rgba(0,0,0,0.1)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert size={22} className="text-brand-orange shrink-0" />
                      <h2 className="font-display text-xl text-brand-ink">
                        Control de permisos y accesos
                      </h2>
                    </div>
                    <p className="font-body text-sm text-brand-gray mb-6 leading-relaxed">
                      Tenés nivel SuperAdmin. Podés asignar roles de gestor a referentes barriales y revocar sesiones activas de usuarios.
                    </p>
                  </div>
                  <div>
                    <Link to="/admin/usuarios">
                      <Boton variante="secundario">
                        Administrar usuarios y permisos
                      </Boton>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </LayoutPanel>
  );
}
