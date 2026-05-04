import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './Landing';
import CartaDetalle from './detalleCarta';
import BuscarCartas from './BuscarCarta';
import BuscarCartaAdmin from './BuscarCartaAdmin';
import AdminPrecios from './AdminPrecios';
import AgregarTienda from './AgregarTienda';
import EditarTiendas from './EditarTiendas';
import Tiendas from './Tiendas';
import TiendaDetalle from './TiendaDetalle';
import NotFound from './NotFound';
import Coleccion from './Coleccion';
import Mercado from './Mercado';
import MiTienda from './MiTienda';
import Mensajes from './Mensajes';
import MiPerfil from './MiPerfil';
import PerfilPublico from './PerfilPublico';
import AdminModeracion from './AdminModeracion';
import AdminReportes from './AdminReportes';
import AdminUsuarios from './AdminUsuarios';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/buscar" replace />} />
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
