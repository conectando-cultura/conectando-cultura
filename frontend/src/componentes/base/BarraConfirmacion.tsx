import React from "react";
import Boton from "./Boton";
import estilos from "./BarraConfirmacion.module.css";

export interface BarraConfirmacionProps {
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  esPeligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function BarraConfirmacion({
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  esPeligro = false,
  onConfirmar,
  onCancelar
}: BarraConfirmacionProps): React.JSX.Element {
  return (
    <div
      className={`${estilos.barra} ${esPeligro ? estilos.peligro : ""}`}
      role="alert"
    >
      <span className={estilos.mensaje}>{mensaje}</span>
      <div className={estilos.acciones}>
        <Boton variante="secundario" onClick={onCancelar}>
          {textoCancelar}
        </Boton>
        <Boton
          variante={esPeligro ? "peligro" : "principal"}
          onClick={onConfirmar}
        >
          {textoConfirmar}
        </Boton>
      </div>
    </div>
  );
}
