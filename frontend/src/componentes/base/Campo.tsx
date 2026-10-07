import React, { useId } from "react";
import estilos from "./Campo.module.css";

export interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | null;
  ayuda?: string;
  multilinea?: boolean;
  filas?: number;
}

export default function Campo({
  etiqueta,
  error,
  ayuda,
  multilinea = false,
  filas = 3,
  id,
  className = "",
  required,
  ...resto
}: CampoProps): React.JSX.Element {
  const idGenerado = useId();
  const campoId = id ?? idGenerado;
  const errorId = `${campoId}-error`;
  const ayudaId = `${campoId}-ayuda`;

  const ariaDescribedBy = [
    error ? errorId : null,
    ayuda ? ayudaId : null
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const clasesInput = [
    estilos.input,
    multilinea ? estilos.textarea : "",
    error ? estilos.conError : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={estilos.contenedor}>
      <label htmlFor={campoId} className={estilos.etiqueta}>
        {etiqueta}
        {required && <span className={estilos.requerido} aria-hidden="true">*</span>}
      </label>

      {multilinea ? (
        <textarea
          id={campoId}
          className={clasesInput}
          rows={filas}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          required={required}
          {...(resto as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={campoId}
          className={clasesInput}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          required={required}
          {...resto}
        />
      )}

      {error && (
        <span id={errorId} className={estilos.mensajeError} role="alert">
          {error}
        </span>
      )}

      {!error && ayuda && (
        <span id={ayudaId} className={estilos.ayuda}>
          {ayuda}
        </span>
      )}
    </div>
  );
}
