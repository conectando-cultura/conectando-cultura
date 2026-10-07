// Esqueleto de rutas y guardas. Adaptar a la estructura real del proyecto.
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { puede } from '../auth/permisos';
import Inicio from '../paginas/Inicio';
import Explorar from '../paginas/Explorar';
import Detalle from '../paginas/Detalle';
import Registro from '../paginas/Registro';
import Login from '../paginas/Login';
import Preferencias from '../paginas/Preferencias';
import NoAutorizado from '../paginas/NoAutorizado';
import NoEncontrada from '../paginas/NoEncontrada';
import PantallaCarga from '../componentes/base/PantallaCarga';

const LayoutPanel = lazy(() => import('../componentes/layout/LayoutPanel'));
const Dashboard = lazy(() => import('../paginas/admin/Dashboard'));
const ListadoActividades = lazy(() => import('../paginas/admin/ListadoActividades'));
const FormularioActividad = lazy(() => import('../paginas/admin/FormularioActividad'));
const UsuariosRoles = lazy(() => import('../paginas/admin/UsuariosRoles'));

export function Protegida({ permiso, children }) {
  const { usuario, rol, cargando } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <PantallaCarga />;
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  }
  if (permiso && !puede(rol, permiso)) return <NoAutorizado permiso={permiso} />; // 403 sin cambiar la URL
  return children;
}

// Destino tras ingresar o registrarse. Ver docs/02-flujos-y-rutas.md.
export function destinoTrasLogin({ rol, tienePreferencias }) {
  if (puede(rol, 'panel:acceder')) return '/admin';
  return tienePreferencias ? '/explorar' : '/preferencias';
}

const enPanel = (permiso, elemento) => <Protegida permiso={permiso}>{elemento}</Protegida>;

export default function Rutas() {
  return (
    <Suspense fallback={<PantallaCarga />}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/mapa" element={<Navigate to="/explorar?vista=mapa" replace />} />
        <Route path="/actividades" element={<Navigate to="/explorar?vista=lista" replace />} />
        <Route path="/actividades/:barrio/:slug" element={<Detalle />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/preferencias" element={<Protegida><Preferencias /></Protegida>} />

        <Route path="/admin" element={enPanel('panel:acceder', <LayoutPanel />)}>
          <Route index element={<Dashboard />} />
          <Route path="actividades" element={enPanel('actividades:escribir', <ListadoActividades />)} />
          <Route path="actividades/nueva" element={enPanel('actividades:escribir', <FormularioActividad />)} />
          <Route path="actividades/:id" element={enPanel('actividades:escribir', <FormularioActividad />)} />
          <Route path="usuarios" element={enPanel('usuarios:gestionar', <UsuariosRoles />)} />
        </Route>

        <Route path="/403" element={<NoAutorizado />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  );
}
