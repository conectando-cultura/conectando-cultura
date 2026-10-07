import React from "react";
import { Search } from "lucide-react";
import Boton from "./Boton";
import estilos from "./EstadoMensaje.module.css";

export interface EstadoVacioProps {
  titulo?: string;
  descripcion?: string;
  textoBoton?: string;
  onAccion?: () => void;
  icono?: React.ReactNode;
}

export default function EstadoVacio({
  titulo = "No hay resultados",
  descripcion = "No encontramos actividades para los filtros seleccionados.",
  textoBoton,
  onAccion,
  icono
}: EstadoVacioProps): React.JSX.Element {
  return (
    <div className={estilos.contenedor} role="status">
      <div className={estilos.icono} aria-hidden="true">
        {icono ?? <Search size={40} strokeWidth={1.5} />}
      </div>
      <h3 className={estilos.titulo}>{titulo}</h3>
      <p className={estilos.descripcion}>{descripcion}</p>
      {textoBoton && onAccion && (
        <div className={estilos.accion}>
          <Boton variante="secundario" onClick={onAccion}>
            {textoBoton}
          </Boton>
        </div>
      )}
    </div>
  );
}
