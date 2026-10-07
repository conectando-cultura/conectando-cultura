import React from "react";
import estilos from "./Tarjeta.module.css";

export interface TarjetaProps extends React.HTMLAttributes<HTMLDivElement> {
  interactiva?: boolean;
  children: React.ReactNode;
}

export default function Tarjeta({
  interactiva = false,
  children,
  className = "",
  ...resto
}: TarjetaProps): React.JSX.Element {
  const clases = [
    estilos.tarjeta,
    interactiva ? estilos.interactiva : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases} {...resto}>
      {children}
    </div>
  );
}
