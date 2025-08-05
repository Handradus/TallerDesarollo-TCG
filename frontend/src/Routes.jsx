import { Routes, Route } from 'react-router-dom';
import CartaDetalle from './detalleCarta';
import BuscarCartas from './BuscarCarta';
import AgregarTienda from './AgregarTienda';
import EditarTiendas from './EditarTiendas';
import Tiendas from './Tiendas';
import TiendaDetalle from './TiendaDetalle';
import NotFound from './NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BuscarCartas />} />
      <Route path="/carta/:id" element={<CartaDetalle />} />
      <Route path="/sugerencia-promocional" element={<CartaDetalle />} />
      <Route path="/agregar-tienda" element={<AgregarTienda />} />
      <Route path="/editar-tiendas" element={<EditarTiendas />} />
      <Route path="/tiendas" element={<Tiendas />} />
      <Route path="/tienda/:nombreTienda" element={<TiendaDetalle />} />
      {/* Ruta 404 - debe ir al final */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
