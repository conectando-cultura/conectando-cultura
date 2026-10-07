// Único punto de importación de íconos. Sin emojis en la interfaz.
import React from "react";
import {
  Tent,
  Clapperboard,
  Drama,
  Landmark,
  Library,
  Beer,
  Trees,
  Music,
  UtensilsCrossed,
  Activity,
  GraduationCap,
  UsersRound,
  MapPin,
  Search,
  Map as IconoMapaBase,
  List,
  Navigation,
  Share2,
  ExternalLink,
  Clock,
  Star,
  Menu,
  X,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Power,
  RotateCcw,
  Lock,
  LayoutDashboard,
  CalendarDays,
  Users,
  AlertCircle,
  TriangleAlert,
  type LucideIcon,
  type LucideProps
} from "lucide-react";

// Mapeo exhaustivo tanto por clave semántica como por slug y términos comunes de BD
export const ICONOS_CATEGORIA: Record<string, LucideIcon> = {
  feria: Tent,
  ferias: Tent,
  "ferias-y-mercados": Tent,

  cine: Clapperboard,
  "cine-teatro": Clapperboard,
  teatro: Drama,

  museo: Landmark,
  museos: Landmark,
  "museos-y-cultura": Landmark,

  musica: Music,
  "musica-y-espectaculos": Music,

  bar: Beer,
  gastronomia: UtensilsCrossed,

  biblioteca: Library,
  educacion: GraduationCap,
  "educacion-y-talleres": GraduationCap,

  parque: Trees,
  naturaleza: Trees,
  "naturaleza-y-parques": Trees,

  "actividad-fisica": Activity,
  deporte: Activity,

  comunitario: UsersRound,
  "eventos-comunitarios": UsersRound
};

export interface IconoCategoriaProps extends LucideProps {
  clave?: string | null;
  slug?: string | null;
  nombre?: string | null;
  tamano?: number;
}

/**
 * Resuelve el ícono apropiado de la categoría evaluando clave, slug o nombre,
 * evitando caer al MapPin genérico cuando la categoría tiene su propia identidad.
 */
export function resolverIconoCategoria(
  clave?: string | null,
  slug?: string | null,
  nombre?: string | null
): LucideIcon {
  const normalizar = (s?: string | null) => (s || "").toLowerCase().trim();

  const c = normalizar(clave);
  if (c && ICONOS_CATEGORIA[c]) return ICONOS_CATEGORIA[c];

  const sl = normalizar(slug);
  if (sl && ICONOS_CATEGORIA[sl]) return ICONOS_CATEGORIA[sl];

  const n = normalizar(nombre);
  if (n.includes("feria") || n.includes("mercado")) return Tent;
  if (n.includes("cine")) return Clapperboard;
  if (n.includes("teatro") || n.includes("espectac")) return Drama;
  if (n.includes("museo") || n.includes("patrimonio")) return Landmark;
  if (n.includes("músic") || n.includes("music") || n.includes("concierto")) return Music;
  if (n.includes("gastro") || n.includes("bar") || n.includes("comida")) return UtensilsCrossed;
  if (n.includes("biblio") || n.includes("libro")) return Library;
  if (n.includes("educa") || n.includes("taller")) return GraduationCap;
  if (n.includes("parque") || n.includes("naturaleza") || n.includes("plaza")) return Trees;
  if (n.includes("físic") || n.includes("fisic") || n.includes("deport")) return Activity;
  if (n.includes("comunit") || n.includes("vecin") || n.includes("social")) return UsersRound;

  return MapPin;
}

export function IconoCategoria({
  clave,
  slug,
  nombre,
  tamano = 16,
  ...resto
}: IconoCategoriaProps): React.JSX.Element {
  const Icono = resolverIconoCategoria(clave, slug, nombre);
  return <Icono size={tamano} strokeWidth={1.75} aria-hidden="true" {...resto} />;
}

export const ICONOS_UI: Record<string, LucideIcon> = {
  Buscar: Search,
  Mapa: IconoMapaBase,
  Lista: List,
  Ubicacion: MapPin,
  ComoLlegar: Navigation,
  Compartir: Share2,
  SitioWeb: ExternalLink,
  Horarios: Clock,
  Destacada: Star,
  Menu,
  Cerrar: X,
  Seleccionado: Check,
  Desplegar: ChevronDown,
  Mostrar: Eye,
  Ocultar: EyeOff,
  Ingresar: LogIn,
  Salir: LogOut,
  Nuevo: Plus,
  Editar: Pencil,
  Desactivar: Power,
  Reactivar: RotateCcw,
  SinAcceso: Lock,
  Dashboard: LayoutDashboard,
  Actividades: CalendarDays,
  Usuarios: Users,
  Error: AlertCircle,
  Aviso: TriangleAlert
};
