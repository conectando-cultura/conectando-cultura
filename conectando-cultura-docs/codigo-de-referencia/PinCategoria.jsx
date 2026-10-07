// Pin de mapa: gota con el color sólido de la categoría, borde blanco e ícono.
// Para usarlo como marcador de la librería de mapa, renderizarlo a HTML estático.
import { IconoCategoria } from './iconos';
import { colorSimbolo } from './colorCategoria';
import estilos from './PinCategoria.module.css';

export default function PinCategoria({ categoria, seleccionado = false }) {
  return (
    <span
      className={`${estilos.pin} ${seleccionado ? estilos.seleccionado : ''}`}
      style={{ '--cat-solido': categoria.color, '--cat-simbolo': colorSimbolo(categoria.color) }}
    >
      <span className={estilos.icono}>
        <IconoCategoria clave={categoria.icono} tamano={16} />
      </span>
    </span>
  );
}
