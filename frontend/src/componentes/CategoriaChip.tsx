import React from "react";
import { Check } from "lucide-react";
import { IconoCategoria } from "./iconos";
import { coloresCategoria } from "../utiles/colorCategoria";
import type { Categoria } from "../tipos";
import estilos from "./CategoriaChip.module.css";

export interface CategoriaChipProps {
  categoria: Categoria | { id?: string; nombre: string; color: string; icono: string; slug?: string };
  seleccionada?: boolean;
  onAlternar?: (categoria: Categoria | { id?: string; nombre: string; color: string; icono: string; slug?: string }) => void;
}

export default function CategoriaChip({
  categoria,
  seleccionada = false,
  onAlternar
}: CategoriaChipProps): React.JSX.Element {
  const { solido, fondo, texto } = coloresCategoria(categoria.color);
  const variables = {
    "--cat-solido": solido,
    "--cat-fondo": fondo,
    "--cat-texto": texto
  } as React.CSSProperties;

  const contenido = (
    <>
      <IconoCategoria
        clave={categoria.icono}
        slug={categoria.slug}
        nombre={categoria.nombre}
        tamano={16}
      />
      <span>{categoria.nombre}</span>
      {seleccionada && <Check size={16} strokeWidth={2} aria-hidden="true" />}
    </>
  );

  if (!onAlternar) {
    return (
      <span className={estilos.chip} style={variables}>
        {contenido}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${estilos.chip} ${estilos.boton} ${seleccionada ? estilos.seleccionada : ""}`}
      style={variables}
      aria-pressed={seleccionada}
      onClick={() => onAlternar(categoria)}
    >
      {contenido}
    </button>
  );
}
