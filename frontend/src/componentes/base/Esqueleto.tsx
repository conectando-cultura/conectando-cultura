import React from "react";
import estilos from "./Esqueleto.module.css";

export interface EsqueletoProps extends React.HTMLAttributes<HTMLDivElement> {
  ancho?: string | number;
  alto?: string | number;
  circular?: boolean;
}

export default function Esqueleto({
  ancho = "100%",
  alto = "1rem",
  circular = false,
  className = "",
  style,
  ...resto
}: EsqueletoProps): React.JSX.Element {
  const estilo = {
    width: typeof ancho === "number" ? `${ancho}px` : ancho,
    height: typeof alto === "number" ? `${alto}px` : alto,
    ...style
  };

  const clases = [
    estilos.esqueleto,
    circular ? estilos.circular : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={clases} style={estilo} aria-hidden="true" {...resto} />;
}
