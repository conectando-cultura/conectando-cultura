import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { ETIQUETA_ROL } from "../utiles/permisos";
import { Boton } from "../componentes/base";
import { CheckCircle2, Compass, Sliders, MapPin, ArrowRight } from "lucide-react";

export default function Bienvenido(): React.JSX.Element {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim() || usuario.nombre || "Vecino";
  const rolEtiqueta = usuario.rol ? ETIQUETA_ROL[usuario.rol] : "Vecino de la Comuna 9";

  return (
    <div className="min-h-[calc(100vh-140px)] bg-brand-bg py-10 md:py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-brand-white border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)] p-8 md:p-12 text-center">
        {/* Badge & Icono de Éxito */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-orange/15 text-brand-orange mb-4">
          <span>{rolEtiqueta}</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-brand-ink mb-3 leading-tight">
          ¡Te damos la bienvenida, {nombreCompleto}!
        </h1>
        <p className="font-body text-base text-brand-gray max-w-lg mx-auto mb-2">
          Tu cuenta comunitaria está activa. Ya podés descubrir la oferta cultural de Mataderos, Liniers y Parque Avellaneda.
        </p>
        <p className="font-body text-xs text-brand-muted mb-8">
          Conectado como <strong className="text-brand-ink font-medium">{usuario.correo}</strong>
        </p>

        {/* 3 Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
          <Link
            to="/preferencias"
            className="group p-5 rounded-2xl bg-brand-bg hover:bg-brand-orange/10 border border-brand-gray-light transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-white text-brand-orange flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <Sliders size={20} />
              </div>
              <h3 className="font-sans font-semibold text-sm text-brand-ink mb-1">
                Preferencias
              </h3>
              <p className="font-body text-xs text-brand-muted leading-relaxed">
                Elegí tus barrios y categorías culturales.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange">
              Configurar
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            to="/explorar"
            className="group p-5 rounded-2xl bg-brand-bg hover:bg-brand-orange/10 border border-brand-gray-light transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-white text-brand-orange flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <Compass size={20} />
              </div>
              <h3 className="font-sans font-semibold text-sm text-brand-ink mb-1">
                Catálogo
              </h3>
              <p className="font-body text-xs text-brand-muted leading-relaxed">
                Explorá la cartelera de actividades barriales.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange">
              Ver actividades
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            to="/explorar?vista=mapa"
            className="group p-5 rounded-2xl bg-brand-bg hover:bg-brand-orange/10 border border-brand-gray-light transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-white text-brand-orange flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <MapPin size={20} />
              </div>
              <h3 className="font-sans font-semibold text-sm text-brand-ink mb-1">
                Mapa Cultural
              </h3>
              <p className="font-body text-xs text-brand-muted leading-relaxed">
                Descubrí qué pasa cerca de tu casa en el mapa.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange">
              Abrir mapa
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        <div>
          <Link to="/">
            <Boton variante="secundario">
              Volver al inicio
            </Boton>
          </Link>
        </div>
      </div>
    </div>
  );
}
