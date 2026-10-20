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
  ShieldAlert,
  Sparkles,
  Info
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-2">
              <Sparkles size={13} />
              Panel de control
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-brand-ink">
              Dashboard
            </h1>
            <p className="font-body text-sm text-brand-gray mt-1">
              Resumen general y estado operativo de Conectando Cultura en Comuna 9.
            </p>
          </div>

          <Link to="/admin/actividades?accion=nueva">
            <Boton variante="principal">
              <PlusCircle size={18} />
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
                <div className="h-full bg-brand-white rounded-3xl p-6 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Actividades activas
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center">
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-4xl text-brand-ink mb-2">
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
                <div className="h-full bg-brand-white rounded-3xl p-6 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      {esAdmin ? "Inactivas u ocultas" : "Para revisar"}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CalendarOff size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-4xl text-brand-ink mb-2">
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
                <div className="h-full bg-brand-white rounded-3xl p-6 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Vecinos registrados
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="block font-display text-4xl text-brand-ink mb-2">
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
              <div className="h-full bg-brand-white rounded-3xl p-6 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-muted">
                    Con preferencias
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Heart size={20} />
                  </div>
                </div>
                <div>
                  <span className="block font-display text-4xl text-brand-ink mb-2">
                    {estadisticas.totalPreferencias}
                  </span>
                  <span className="text-xs text-brand-muted">Perfiles activos configurados</span>
                </div>
              </div>
            </div>

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
