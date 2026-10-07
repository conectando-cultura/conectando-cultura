import React from "react";
import estilos from "./Boton.module.css";

export type VarianteBoton = "principal" | "secundario" | "peligro" | "texto";

export interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  bloque?: boolean;
  icono?: React.ReactNode;
  children: React.ReactNode;
}

export default function Boton({
  variante = "principal",
  bloque = false,
  icono,
  children,
  className = "",
  type = "button",
  ...resto
}: BotonProps): React.JSX.Element {
  const clases = [
    estilos.boton,
    estilos[variante],
    bloque ? estilos.bloque : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={clases} {...resto}>
      {icono && <span aria-hidden="true">{icono}</span>}
      {children}
    </button>
  );
}
