import React from "react";
import estilos from "./Badge.module.css";

export type TipoEstadoBadge = "activa" | "inactiva" | "oculta" | "destacada";

export interface BadgeProps {
  tipo: TipoEstadoBadge;
  texto?: string;
  icono?: React.ReactNode;
}

const TEXTOS_POR_DEFECTO: Record<TipoEstadoBadge, string> = {
  activa: "Activa",
  inactiva: "Inactiva",
  oculta: "Oculta",
  destacada: "Destacada"
};

export default function Badge({
  tipo,
  texto,
  icono
}: BadgeProps): React.JSX.Element {
  const etiqueta = texto ?? TEXTOS_POR_DEFECTO[tipo];

  return (
    <span className={`${estilos.badge} ${estilos[tipo]}`}>
      {icono && <span aria-hidden="true">{icono}</span>}
      {etiqueta}
    </span>
  );
}
