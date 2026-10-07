import React from "react";
import { IconoCategoria } from "./iconos";
import { colorSimbolo } from "../utiles/colorCategoria";
import type { Categoria } from "../tipos";
import estilos from "./PinCategoria.module.css";

export interface PinCategoriaProps {
  categoria: Categoria | { color: string; icono: string };
  seleccionado?: boolean;
}

export default function PinCategoria({
  categoria,
  seleccionado = false
}: PinCategoriaProps): React.JSX.Element {
  const variables = {
    "--cat-solido": categoria.color,
    "--cat-simbolo": colorSimbolo(categoria.color)
  } as React.CSSProperties;

  return (
    <span
      className={`${estilos.pin} ${seleccionado ? estilos.seleccionado : ""}`}
      style={variables}
    >
      <span className={estilos.icono}>
        <IconoCategoria clave={categoria.icono} tamano={16} />
      </span>
    </span>
  );
}
