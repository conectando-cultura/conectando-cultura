import React from "react";
import { AlertCircle } from "lucide-react";
import Boton from "./Boton";
import estilos from "./EstadoMensaje.module.css";

export interface EstadoErrorProps {
  titulo?: string;
  descripcion?: string;
  textoReintentar?: string;
  onReintentar?: () => void;
  icono?: React.ReactNode;
}

export default function EstadoError({
  titulo = "No pudimos cargar esto",
  descripcion = "Revisá tu conexión e intentá de nuevo.",
  textoReintentar = "Reintentar",
  onReintentar,
  icono
}: EstadoErrorProps): React.JSX.Element {
  return (
    <div className={estilos.contenedor} role="alert">
      <div className={`${estilos.icono} ${estilos.iconoError}`} aria-hidden="true">
        {icono ?? <AlertCircle size={40} strokeWidth={1.5} />}
      </div>
      <h3 className={estilos.titulo}>{titulo}</h3>
      <p className={estilos.descripcion}>{descripcion}</p>
      {textoReintentar && onReintentar && (
        <div className={estilos.accion}>
          <Boton variante="principal" onClick={onReintentar}>
            {textoReintentar}
          </Boton>
        </div>
      )}
    </div>
  );
}
