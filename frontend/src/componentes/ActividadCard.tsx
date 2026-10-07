import React from "react";
import { Link } from "react-router-dom";
import type { Actividad } from "../tipos";
import CategoriaChip from "./CategoriaChip";
import { Badge } from "./base";
import { MapPin, Clock } from "lucide-react";
import { IconoCategoria } from "./iconos";

interface Props {
  actividad: Actividad;
  seleccionada?: boolean;
  onSeleccionar?: () => void;
}

export default function ActividadCard({
  actividad,
  seleccionada = false,
  onSeleccionar
}: Props): React.JSX.Element {
  const detalleUrl = `/actividades/${actividad.barrio.slug}/${actividad.slug}`;

  return (
    <article
      onClick={onSeleccionar}
      style={{
        backgroundColor: "var(--blanco)",
        border: seleccionada ? "2px solid var(--chapa)" : "1px solid var(--linea)",
        borderRadius: "var(--radio-tarjeta)",
        padding: "14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: onSeleccionar ? "pointer" : "default",
        transition: "border-color 0.15s ease",
        position: "relative"
      }}
    >
      {/* Vista previa: Imagen o bloque visual de respaldo */}
      {actividad.imagenUrl ? (
        <div
          style={{
            width: "100%",
            height: "140px",
            borderRadius: "var(--radio-control)",
            overflow: "hidden",
            backgroundColor: "var(--papel)"
          }}
        >
          <img
            src={actividad.imagenUrl}
            alt={actividad.nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100px",
            borderRadius: "var(--radio-control)",
            backgroundColor: `${actividad.categoria.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: actividad.categoria.color
          }}
          aria-hidden="true"
        >
          <IconoCategoria
            clave={actividad.categoria.icono}
            slug={actividad.categoria.slug}
            nombre={actividad.categoria.nombre}
            tamano={32}
          />
        </div>
      )}

      {/* Cabecera: Chip y Destacada */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <CategoriaChip categoria={actividad.categoria} />
        {actividad.destacado && <Badge tipo="destacada" />}
      </div>

      {/* Título */}
      <h3
        style={{
          margin: 0,
          fontFamily: "var(--fuente-titulo)",
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--tinta)"
        }}
      >
        <Link
          to={detalleUrl}
          style={{ color: "inherit", textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          {actividad.nombre}
        </Link>
      </h3>

      {/* Metadatos: barrio y horario */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "var(--texto-suave)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={15} strokeWidth={1.75} aria-hidden="true" />
          <span>{actividad.direccion} · {actividad.barrio.nombre}</span>
        </div>
        {actividad.horarios && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>{actividad.horarios}</span>
          </div>
        )}
      </div>

      {/* Descripción corta */}
      {actividad.descripcion && (
        <p
          style={{
            margin: "2px 0 0 0",
            fontSize: "14px",
            color: "var(--tinta)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {actividad.descripcion}
        </p>
      )}

      {/* Acción ver detalle */}
      <div style={{ marginTop: "auto", paddingTop: "8px" }}>
        <Link
          to={detalleUrl}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--chapa)",
            textDecoration: "none"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Ver detalle →
        </Link>
      </div>
    </article>
  );
}
