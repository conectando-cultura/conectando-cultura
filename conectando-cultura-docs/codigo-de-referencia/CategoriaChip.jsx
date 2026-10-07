// Elemento distintivo del sistema visual: ícono + texto + color de categoría.
// Sin onAlternar es una etiqueta; con onAlternar es un botón de filtro.
import { Check } from 'lucide-react';
import { IconoCategoria } from './iconos';
import { coloresCategoria } from './colorCategoria';
import estilos from './CategoriaChip.module.css';

export default function CategoriaChip({ categoria, seleccionada = false, onAlternar }) {
  const { solido, fondo, texto } = coloresCategoria(categoria.color);
  const variables = { '--cat-solido': solido, '--cat-fondo': fondo, '--cat-texto': texto };
  const contenido = (
    <>
      <IconoCategoria clave={categoria.icono} />
      <span>{categoria.nombre}</span>
      {seleccionada && <Check size={16} strokeWidth={1.75} aria-hidden="true" />}
    </>
  );

  if (!onAlternar) {
    return <span className={estilos.chip} style={variables}>{contenido}</span>;
  }
  return (
    <button
      type="button"
      className={`${estilos.chip} ${estilos.boton} ${seleccionada ? estilos.seleccionada : ''}`}
      style={variables}
      aria-pressed={seleccionada}
      onClick={() => onAlternar(categoria)}
    >
      {contenido}
    </button>
  );
}
