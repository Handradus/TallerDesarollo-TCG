import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import CartaDetalle from './pages/detalleCarta';
import BuscarCartas from './pages/BuscarCarta';
import BuscarCartaAdmin from './pages/admin/BuscarCartaAdmin';
import AdminPrecios from './pages/admin/AdminPrecios';
import AgregarTienda from './pages/AgregarTienda';
import EditarTiendas from './pages/EditarTiendas';
import Tiendas from './pages/Tiendas';
import TiendaDetalle from './pages/TiendaDetalle';
import NotFound from './pages/NotFound';
import Coleccion from './pages/Coleccion';
import Mercado from './pages/Mercado';
import MiTienda from './pages/MiTienda';
import Mensajes from './pages/Mensajes';
import MiPerfil from './pages/MiPerfil';
import PerfilPublico from './pages/PerfilPublico';
import AdminModeracion from './pages/admin/AdminModeracion';
import AdminReportes from './pages/admin/AdminReportes';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import Contacto from './pages/Contacto';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/buscar" replace />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/buscar" element={<BuscarCartas />} />
      <Route path="/admin-buscar" element={<BuscarCartaAdmin />} />
      <Route path="/admin-precios" element={<AdminPrecios />} />
      <Route path="/carta/:id" element={<CartaDetalle />} />
      <Route path="/sugerencia-promocional" element={<CartaDetalle />} />
      <Route path="/agregar-tienda" element={<AgregarTienda />} />
      <Route path="/editar-tiendas" element={<EditarTiendas />} />
      <Route path="/admin-moderacion" element={<AdminModeracion />} />
      <Route path="/admin-reportes" element={<AdminReportes />} />
      <Route path="/admin-usuarios" element={<AdminUsuarios />} />
      <Route path="/tiendas" element={<Tiendas />} />
      <Route path="/tienda/:nombreTienda" element={<TiendaDetalle />} />
      <Route path="/coleccion" element={<Coleccion />} />
      <Route path="/mercado" element={<Mercado />} />
      <Route path="/mi-tienda" element={<MiTienda />} />
      <Route path="/mensajes" element={<Mensajes />} />
      <Route path="/perfil" element={<MiPerfil />} />
      <Route path="/profile/:userId" element={<PerfilPublico />} />
      {/* Ruta 404 - debe ir al final */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
