import type { UsuarioPublico } from "../tipos";

// Única tabla de permisos. La usan el menú, las guardas y los botones.
// El backend aplica la misma tabla.
export const ROLES = {
  USUARIO: "usuario",
  GESTOR: "gestor",
  ADMIN: "admin"
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ETIQUETA_ROL: Record<Rol, string> = {
  usuario: "Usuario",
  gestor: "Gestor",
  admin: "SuperAdmin"
};

export const PERMISOS = {
  "panel:acceder": [ROLES.GESTOR, ROLES.ADMIN],
  "actividades:escribir": [ROLES.GESTOR, ROLES.ADMIN],
  "usuarios:gestionar": [ROLES.ADMIN]
} as const;

export type Permiso = keyof typeof PERMISOS;

export const puede = (rol?: string | null, permiso?: Permiso): boolean => {
  if (!rol || !permiso) return false;
  const rolesPermitidos: readonly string[] = PERMISOS[permiso] ?? [];
  return rolesPermitidos.includes(rol);
};

export const puedeUsuario = (usuario?: UsuarioPublico | null, permiso?: Permiso): boolean => {
  return puede(usuario?.rol, permiso);
};

// Ítems del menú del panel; se filtran con puede().
export const MENU_PANEL = [
  { ruta: "/admin", etiqueta: "Dashboard", icono: "Dashboard", permiso: "panel:acceder" as Permiso },
  { ruta: "/admin/actividades", etiqueta: "Actividades", icono: "Actividades", permiso: "actividades:escribir" as Permiso },
  { ruta: "/admin/usuarios", etiqueta: "Usuarios y roles", icono: "Usuarios", permiso: "usuarios:gestionar" as Permiso }
];
