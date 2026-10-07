// Única tabla de permisos. La usan el menú, las guardas y los botones.
// El backend debe aplicar la misma tabla: el frontend solo mejora la experiencia.
export const ROLES = { USUARIO: 'usuario', GESTOR: 'gestor', ADMIN: 'admin' };

export const ETIQUETA_ROL = { usuario: 'Usuario', gestor: 'Gestor', admin: 'SuperAdmin' };

export const PERMISOS = {
  'panel:acceder': [ROLES.GESTOR, ROLES.ADMIN],
  'actividades:escribir': [ROLES.GESTOR, ROLES.ADMIN],
  'usuarios:gestionar': [ROLES.ADMIN],
};

export const puede = (rol, permiso) => (PERMISOS[permiso] ?? []).includes(rol);

// Ítems del menú del panel; se filtran con puede().
export const MENU_PANEL = [
  { ruta: '/admin', etiqueta: 'Dashboard', icono: 'Dashboard', permiso: 'panel:acceder' },
  { ruta: '/admin/actividades', etiqueta: 'Actividades', icono: 'Actividades', permiso: 'actividades:escribir' },
  { ruta: '/admin/usuarios', etiqueta: 'Usuarios y roles', icono: 'Usuarios', permiso: 'usuarios:gestionar' },
];
