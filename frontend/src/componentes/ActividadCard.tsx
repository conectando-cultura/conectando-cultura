import React from "react";
import { Link } from "react-router-dom";
import type { Actividad } from "../tipos";
import CategoriaChip from "./CategoriaChip";
import { Badge } from "./base";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { IconoCategoria } from "./iconos";
import estilos from "./ActividadCard.module.css";

export interface ActividadCardProps {
  actividad: Actividad;
  seleccionada?: boolean;
  compacta?: boolean;
  alHover?: (actividad: Actividad | null) => void;
  onSeleccionar?: () => void;
  className?: string;
}

export default function ActividadCard({
  actividad,
  seleccionada = false,
  compacta = false,
  alHover,
  onSeleccionar,
  className = ""
}: ActividadCardProps): React.JSX.Element {
  const detalleUrl = `/actividades/${actividad.barrio.slug}/${actividad.slug}`;

  const claseArticulo = [
    estilos.card,
    seleccionada ? estilos.seleccionada : "",
    compacta ? estilos.compacta : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={claseArticulo}
      onClick={onSeleccionar}
      onMouseEnter={() => alHover?.(actividad)}
      onMouseLeave={() => alHover?.(null)}
      style={{ cursor: onSeleccionar ? "pointer" : "default" }}
    >
      {/* Contenedor de Portada (PackageCard shell) */}
      <div className={estilos.coverContenedor}>
        {actividad.imagenUrl ? (
          <img
            src={actividad.imagenUrl}
            alt={actividad.nombre}
            className={estilos.coverImagen}
            loading="lazy"
          />
        ) : (
          <div className={estilos.coverFallback} aria-hidden="true">
            <IconoCategoria
              clave={actividad.categoria.icono}
              slug={actividad.categoria.slug}
              nombre={actividad.categoria.nombre}
              tamano={44}
            />
          </div>
        )}

        {/* Chips flotantes: CategoriaChip + Destacada */}
        <div className={estilos.chipsContenedor}>
          <CategoriaChip categoria={actividad.categoria} />
          {actividad.destacado && <Badge tipo="destacada" />}
        </div>

        {/* Insignia barrio estilo Croquis orange badge */}
        <span className={estilos.insigniaBarrio}>
          {actividad.barrio.nombre}
        </span>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className={estilos.cuerpo}>
        {/* Titulo en tipografía Kavoon (Croquis display) */}
        <h3 className={estilos.titulo}>
          <Link
            to={detalleUrl}
            className={estilos.tituloLink}
            onClick={(e) => e.stopPropagation()}
          >
            {actividad.nombre}
          </Link>
        </h3>

        {/* Metadatos: Ubicación y Horarios */}
        <div className={estilos.metadatos}>
          <div className={estilos.filaMetadato} title={`${actividad.direccion} · ${actividad.barrio.nombre}`}>
            <MapPin size={15} strokeWidth={1.8} className={estilos.iconoMetadato} aria-hidden="true" />
            <span>{actividad.direccion} · {actividad.barrio.nombre}</span>
          </div>
          {actividad.horarios && (
            <div className={estilos.filaMetadato} title={actividad.horarios}>
              <Clock size={15} strokeWidth={1.8} className={estilos.iconoMetadato} aria-hidden="true" />
              <span>{actividad.horarios}</span>
            </div>
          )}
        </div>

        {/* Descripción truncada */}
        {actividad.descripcion && !compacta && (
          <p className={estilos.descripcion}>
            {actividad.descripcion}
          </p>
        )}

        {/* Pie: CTA Botón de detalle naranja redondeado */}
        <div className={estilos.pie}>
          <Link
            to={detalleUrl}
            className={estilos.botonDetalle}
            onClick={(e) => e.stopPropagation()}
          >
            <span>Ver detalle</span>
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
