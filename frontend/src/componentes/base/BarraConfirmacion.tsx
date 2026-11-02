import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import Boton from "./Boton";
import estilos from "./BarraConfirmacion.module.css";

export interface BarraConfirmacionProps {
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  esPeligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function BarraConfirmacion({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  esPeligro = false,
  onConfirmar,
  onCancelar
}: BarraConfirmacionProps): React.JSX.Element {
  const idBase = useId();
  const tituloId = `${idBase}-titulo`;
  const mensajeId = `${idBase}-mensaje`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const presionoFueraRef = useRef(false);

  const tituloResuelto =
    titulo ?? (esPeligro ? "Confirmar acción" : "Confirmar cambios");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // En entornos sin soporte completo de showModal, mantener atributo open
        dialog.setAttribute("open", "");
      }
    }

    const manejarCancel = (e: Event) => {
      e.preventDefault();
      onCancelar();
    };

    dialog.addEventListener("cancel", manejarCancel);
    return () => {
      dialog.removeEventListener("cancel", manejarCancel);
      if (dialog.open) {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute("open");
        }
      }
    };
  }, [onCancelar]);

  const esClickFuera = (
    e: React.PointerEvent<HTMLDialogElement>,
    dialog: HTMLDialogElement
  ): boolean => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloId}
      aria-describedby={mensajeId}
      {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      onPointerDown={(e) => {
        if (dialogRef.current) {
          presionoFueraRef.current = esClickFuera(e, dialogRef.current);
        }
      }}
      onPointerUp={(e) => {
        if (
          presionoFueraRef.current &&
          dialogRef.current &&
          esClickFuera(e, dialogRef.current)
        ) {
          onCancelar();
        }
        presionoFueraRef.current = false;
      }}
      className={estilos.dialogo}
    >
      <div
        className={`${estilos.cabecera} ${
          esPeligro ? estilos.cabeceraPeligro : estilos.cabeceraNormal
        }`}
      >
        <div className={estilos.cabeceraInfo}>
          <span
            className={`${estilos.iconoCircular} ${
              esPeligro ? estilos.iconoPeligro : estilos.iconoNormal
            }`}
            aria-hidden="true"
          >
            {esPeligro ? <AlertTriangle size={18} /> : <HelpCircle size={18} />}
          </span>
          <div>
            <span className={estilos.kicker}>
              {esPeligro ? "Atención requerida" : "Confirmación"}
            </span>
            <h2 id={tituloId} className={estilos.titulo}>
              {tituloResuelto}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelar}
          className={estilos.botonCerrar}
          aria-label="Cerrar ventana de confirmación"
        >
          <X size={17} />
        </button>
      </div>

      <div className={estilos.cuerpo}>
        <p id={mensajeId} className={estilos.mensaje}>
          {mensaje}
        </p>

        <div className={estilos.acciones}>
          <Boton variante="secundario" autoFocus onClick={onCancelar}>
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
    </dialog>
  );
}
