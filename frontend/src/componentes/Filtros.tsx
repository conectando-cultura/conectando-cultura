import type { Barrio, Categoria } from "../tipos";

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
  const hayFiltro = barrioSeleccionado || categoriaSeleccionada;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: "20px",
        padding: "14px 18px",
        background: "var(--gris-claro)",
        borderRadius: "var(--radio)",
        border: "1px solid var(--borde)"
      }}
    >
      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gris)" }}>
        Filtrar por:
      </span>

      <select
        value={barrioSeleccionado}
        onChange={(e) => onBarrioChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "2px solid var(--borde)",
          fontFamily: "var(--tipografia-texto)",
          fontSize: "0.9rem",
          cursor: "pointer"
        }}
      >
        <option value="">Todos los barrios</option>
        {barrios.map((b) => (
          <option key={b.id} value={b.slug}>
            {b.nombre}
          </option>
        ))}
      </select>

      <select
        value={categoriaSeleccionada}
        onChange={(e) => onCategoriaChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "2px solid var(--borde)",
          fontFamily: "var(--tipografia-texto)",
          fontSize: "0.9rem",
          cursor: "pointer"
        }}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.icono} {c.nombre}
          </option>
        ))}
      </select>

      {hayFiltro && (
        <button className="btn btn-secundario" onClick={onLimpiar} style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
