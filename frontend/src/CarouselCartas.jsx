import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/CarouselCartas.css';

export default function CarouselCartas() {
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    cargarUltimasCartas();
  }, []);

  const cargarUltimasCartas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/historial/cartas/ultimas?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setCartas(data);
      } else {
        console.error('Error al cargar últimas cartas:', response.status);
        setCartas([]); // Mostrar carousel vacío en lugar de error
      }
    } catch (err) {
      console.error('Error al conectar con el servidor:', err);
      setCartas([]); // Mostrar carousel vacío en lugar de error
    } finally {
      setLoading(false);
    }
  };

  const handleCartaClick = async (carta) => {
    // Registrar el acceso antes de navegar
    try {
      await fetch(`${apiUrl}/api/historial/cartas/${carta.id}/acceso`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error al registrar acceso:', err);
      // No bloquear la navegación si falla el registro
    }
    
    navigate(`/carta/${carta.id}`);
  };

  if (loading) {
    return (
      <div className="carousel-container">
        <h3>🃏 Últimas cartas vistas</h3>
        <div className="carousel-loading">Cargando cartas...</div>
      </div>
    );
  }

  if (cartas.length === 0) {
    return (
      <div className="carousel-container">
        <h3>🃏 Últimas cartas vistas</h3>
        <div className="carousel-empty">¡Busca algunas cartas para verlas aquí!</div>
      </div>
    );
  }

  return (
    <div className="carousel-container">
      <h3>🃏 Últimas cartas vistas</h3>
      <div className="carousel-cartas-wrapper">
        <div className="carousel-cartas-track">
          {/* Triplicamos las cartas para crear un efecto de loop infinito perfecto */}
          {[...cartas, ...cartas, ...cartas].map((carta, index) => (
            <div 
              key={`${carta.id}-${index}`} 
              className="carousel-carta-item"
              onClick={() => handleCartaClick(carta)}
            >
              <img 
                src={carta.imagenPequena || carta.imagenGrande} 
                alt={carta.nombre}
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/placeholder-card.png'; // Fallback si la imagen falla
                }}
              />
              <h3>{carta.nombre}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
