import { Routes, Route } from 'react-router-dom';
import CartaDetalle from './detalleCarta';
import BuscarCartas from './BuscarCarta';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BuscarCartas />} />
      <Route path="/carta/:id" element={<CartaDetalle />} />
      <Route path="/sugerencia-promocional" element={<CartaDetalle />} />
    </Routes>
  );
}
