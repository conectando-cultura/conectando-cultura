/**
 * Definiciones vectoriales SVG directas de los íconos de categoría
 * para renderizar con nitidez dentro de los marcadores HTML de Leaflet.
 * Se utilizan paths limpios inspirados en Lucide.
 */
export const SVGS_CATEGORIA: Record<string, string> = {
  // Ferias y Mercados (Tent)
  feria: `
    <path d="M3.5 21 12 3l8.5 18"/>
    <path d="M12 3v18"/>
    <path d="M7.75 12h8.5"/>
  `,

  // Cine y Teatro (Clapperboard)
  cine: `
    <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4Z"/>
    <path d="m4 11 3.5-7h12.5l-3.5 7"/>
    <path d="m11 4 2.5 7"/>
    <path d="m7.5 4 2.5 7"/>
  `,

  // Teatro (Drama)
  teatro: `
    <path d="M10 11h.01"/>
    <path d="M14 11h.01"/>
    <path d="M10 15a4 4 0 0 0 4 0"/>
    <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z"/>
  `,

  // Museos y Cultura (Landmark)
  museo: `
    <line x1="3" x2="21" y1="22" y2="22"/>
    <line x1="6" x2="6" y1="11"/>
    <line x1="10" x2="10" y1="11"/>
    <line x1="14" x2="14" y1="11"/>
    <line x1="18" x2="18" y1="11"/>
    <polygon points="12 2 20 7 4 7"/>
  `,

  // Música y Espectáculos (Music)
  musica: `
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  `,

  // Gastronomía / Bar (UtensilsCrossed / Beer)
  bar: `
    <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/>
    <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/>
    <path d="m2.1 21.9 6.4-6.4"/>
    <path d="m19 5-7 7"/>
  `,

  // Educación y Talleres (GraduationCap / Library)
  biblioteca: `
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
    <path d="M22 10v6"/>
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
  `,

  // Naturaleza y Parques (Trees)
  parque: `
    <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
    <path d="M7 16v6"/>
    <path d="M13 19v3"/>
    <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7l-3.3-4.5a1 1 0 0 0-1.4 0L9 7.3a1 1 0 0 0 .8 1.7H10l-3 3.3a1 1 0 0 0 .7 1.7H8l-3 3.3a1 1 0 0 0 .7 1.7H12Z"/>
  `,

  // Actividad Física (Activity)
  deporte: `
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.48 12H2"/>
  `,

  // Eventos Comunitarios (UsersRound)
  comunitario: `
    <path d="M18 21a8 8 0 0 0-16 0"/>
    <circle cx="10" cy="8" r="5"/>
    <path d="M22 20c0-3.37-2-6.5-5-8a5 5 0 0 0-.45-8.3"/>
  `,

  // Ubicación por defecto (MapPin)
  ubicacion: `
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
    <circle cx="12" cy="10" r="3"/>
  `
};

/**
 * Obtiene el código SVG interno para la categoría dada
 */
export function obtenerPathsSvgCategoria(clave?: string, slug?: string, nombre?: string): string {
  const norm = (s?: string) => (s || "").toLowerCase().trim();
  const c = norm(clave);
  const sl = norm(slug);
  const n = norm(nombre);

  if (c === "feria" || sl.includes("feria") || n.includes("feria")) return SVGS_CATEGORIA.feria;
  if (c === "cine" || sl.includes("cine") || n.includes("cine")) return SVGS_CATEGORIA.cine;
  if (c === "teatro" || sl.includes("teatro") || n.includes("teatro")) return SVGS_CATEGORIA.teatro;
  if (c === "museo" || sl.includes("museo") || n.includes("museo")) return SVGS_CATEGORIA.museo;
  if (c === "musica" || sl.includes("musica") || n.includes("músic")) return SVGS_CATEGORIA.musica;
  if (c === "bar" || sl.includes("gastro") || n.includes("gastro") || n.includes("bar")) return SVGS_CATEGORIA.bar;
  if (c === "biblioteca" || sl.includes("educa") || n.includes("educa") || n.includes("taller")) return SVGS_CATEGORIA.biblioteca;
  if (c === "parque" || sl.includes("parque") || sl.includes("naturaleza") || n.includes("parque") || n.includes("naturaleza")) return SVGS_CATEGORIA.parque;
  if (sl.includes("fisic") || sl.includes("deport") || n.includes("físic") || n.includes("deport")) return SVGS_CATEGORIA.deporte;
  if (sl.includes("comunit") || n.includes("comunit")) return SVGS_CATEGORIA.comunitario;

  return SVGS_CATEGORIA.ubicacion;
}
