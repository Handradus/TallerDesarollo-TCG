import { useState, useEffect } from 'react';
import './css/CarouselTiendas.css';
import { Store, Star } from 'pixelarticons/react';
import PixelIcon from './components/PixelIcon';

export default function CarouselTiendas() {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    cargarUltimasTiendas();
  }, []);

  const cargarUltimasTiendas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/historial/tiendas/ultimas?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTiendas(data);
      } else {
        console.error('Error al cargar últimas tiendas:', response.status);
        setTiendas([]); // Mostrar carousel vacío en lugar de error
      }
    } catch (err) {
      console.error('Error al conectar con el servidor:', err);
      setTiendas([]); // Mostrar carousel vacío en lugar de error
    } finally {
      setLoading(false);
    }
  };

  const handleTiendaClick = async (tienda) => {
    // Registrar la visita antes de abrir
    try {
      await fetch(`${apiUrl}/api/historial/tiendas/${tienda.id}/visita`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error al registrar visita:', err);
      // No bloquear la navegación si falla el registro
    }
    
    // Abrir tienda en nueva pestaña
    window.open(tienda.urlBase, '_blank');
  };

  if (loading) {
    return (
      <div className="carousel-container">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><PixelIcon icon={Store} size={20} /> Últimas tiendas visitadas</h3>
        <div className="carousel-loading">Cargando tiendas...</div>
      </div>
    );
  }

  if (tiendas.length === 0) {
    return (
      <div className="carousel-container">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><PixelIcon icon={Store} size={20} /> Últimas tiendas visitadas</h3>
        <div className="carousel-empty">¡Visita algunas tiendas para verlas aquí!</div>
      </div>
    );
  }

  return (
    <div className="carousel-container">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><PixelIcon icon={Store} size={20} /> Últimas tiendas visitadas</h3>
      <div className="carousel-track-container">
        <div className="carousel-tiendas-wrapper">
          <div className="carousel-tiendas-track">
            {/* Triplicamos las tiendas para crear un efecto de loop infinito perfecto */}
            {[...tiendas, ...tiendas, ...tiendas].map((tienda, index) => (
              <div 
                key={`${tienda.id}-${index}`} 
                className="carousel-tienda-item"
                onClick={() => handleTiendaClick(tienda)}
              >
                {tienda.logo ? (
                  <div className="tienda-logo-container">
                    <img 
                      src={tienda.logo} 
                      alt={`Logo ${tienda.nombre}`}
                      className="tienda-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <h3 className="tienda-nombre-fallback" style={{ display: 'none' }}>
                      {tienda.nombre}
                    </h3>
                  </div>
                ) : (
                  <h3>{tienda.nombre}</h3>
                )}
                {!tienda.logo && tienda.valoracion && (
                  <div className="tienda-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <PixelIcon icon={Star} size={14} color="#ffd700" /> {tienda.valoracion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
