// Único punto de importación de íconos. Sin emojis en la interfaz.
// Verificar los nombres contra la versión instalada de lucide-react.
import {
  Tent, Clapperboard, Drama, Landmark, Library, Beer, Trees, MapPin,
  Search, Map as IconoMapaBase, List, Navigation, Share2, ExternalLink, Clock, Star,
  Menu, X, Check, ChevronDown, Eye, EyeOff, LogIn, LogOut, Plus, Pencil, Power,
  RotateCcw, Lock, LayoutDashboard, CalendarDays, Users, AlertCircle, TriangleAlert,
} from 'lucide-react';

// La columna categorias.icono guarda una clave de texto.
export const ICONOS_CATEGORIA = {
  feria: Tent,
  cine: Clapperboard,
  teatro: Drama,
  museo: Landmark,
  biblioteca: Library,
  bar: Beer,
  parque: Trees,
};

// Si la clave no existe (o llega un emoji heredado), se usa MapPin.
export function IconoCategoria({ clave, tamano = 16, ...resto }) {
  const Icono = ICONOS_CATEGORIA[clave] ?? MapPin;
  return <Icono size={tamano} strokeWidth={1.75} aria-hidden="true" {...resto} />;
}

export const ICONOS_UI = {
  Buscar: Search, Mapa: IconoMapaBase, Lista: List, Ubicacion: MapPin,
  ComoLlegar: Navigation, Compartir: Share2, SitioWeb: ExternalLink, Horarios: Clock,
  Destacada: Star, Menu, Cerrar: X, Seleccionado: Check, Desplegar: ChevronDown,
  Mostrar: Eye, Ocultar: EyeOff, Ingresar: LogIn, Salir: LogOut, Nuevo: Plus,
  Editar: Pencil, Desactivar: Power, Reactivar: RotateCcw, SinAcceso: Lock,
  Dashboard: LayoutDashboard, Actividades: CalendarDays, Usuarios: Users,
  Error: AlertCircle, Aviso: TriangleAlert,
};
