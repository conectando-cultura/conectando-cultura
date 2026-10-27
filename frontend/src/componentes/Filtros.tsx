import type { Barrio, Categoria } from "../tipos";
import { Selector } from "./base";
import { MapPin, Tag, RotateCcw } from "lucide-react";

interface Props {
  barrios: Barrio[];
  categorias: Categoria[];
  barrioSeleccionado: string;
  categoriaSeleccionada: string;
  onBarrioChange: (slug: string) => void;
  onCategoriaChange: (slug: string) => void;
  onLimpiar: () => void;
}

export default function Filtros({
  barrios,
  categorias,
  barrioSeleccionado,
  categoriaSeleccionada,
  onBarrioChange,
  onCategoriaChange,
  onLimpiar
}: Props) {
  const hayFiltro = Boolean(barrioSeleccionado || categoriaSeleccionada);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl border border-brand-gray-light bg-brand-white p-3.5 shadow-[0_6px_11px_rgba(0,0,0,0.06)]">
      <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-muted px-2">
        Filtrar por:
      </span>

      <div className="min-w-[200px] flex-1 sm:flex-none">
        <Selector
          variante="compacto"
          icono={<MapPin size={14} />}
          valor={barrioSeleccionado}
          onChange={onBarrioChange}
          ariaLabel="Filtrar por barrio"
          opciones={[
            { valor: "", etiqueta: "Todos los barrios" },
            ...barrios.map((b) => ({ valor: b.slug, etiqueta: b.nombre }))
          ]}
        />
      </div>

      <div className="min-w-[210px] flex-1 sm:flex-none">
        <Selector
          variante="compacto"
          icono={<Tag size={14} />}
          valor={categoriaSeleccionada}
          onChange={onCategoriaChange}
          ariaLabel="Filtrar por categoría"
          opciones={[
            { valor: "", etiqueta: "Todas las categorías" },
            ...categorias.map((c) => ({ valor: c.slug, etiqueta: c.nombre }))
          ]}
        />
      </div>

      {hayFiltro && (
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-gray-light bg-brand-bg px-3.5 py-1.5 font-sans text-xs font-semibold text-brand-gray transition-colors hover:border-brand-orange hover:text-brand-ink"
        >
          <RotateCcw size={13} className="text-brand-orange" />
          <span>Limpiar filtros</span>
        </button>
      )}
    </div>
  );
}
