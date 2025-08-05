import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/tiendas.css';

export default function Tiendas() {
  const navigate = useNavigate();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tiendasFiltradas, setTiendasFiltradas] = useState([]);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    cargarTiendas();
  }, []);

  useEffect(() => {
    filtrarTiendas();
  }, [busqueda, tiendas]);

  const cargarTiendas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/tiendas-publicas`);
      const data = await response.json();
      
      if (data.success) {
        setTiendas(data.tiendas);
        setTiendasFiltradas(data.tiendas);
      } else {
        setError('Error al cargar las tiendas');
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setError('Error de conexión al cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  const filtrarTiendas = () => {
    if (!busqueda.trim()) {
      setTiendasFiltradas(tiendas);
    } else {
      const filtradas = tiendas.filter(tienda =>
        tienda.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setTiendasFiltradas(filtradas);
    }
  };

  const generarUrlTienda = (nombreTienda) => {
    return nombreTienda
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const irATienda = (tienda) => {
    const urlAmigable = generarUrlTienda(tienda.nombre);
    navigate(`/tienda/${urlAmigable}`);
  };

  if (loading) {
    return (
      <div className="tiendas-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tiendas-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={cargarTiendas} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tiendas-container">
      <div className="tiendas-header">
        <button 
          className="btn-volver"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
        <h1>🏪 Tiendas Disponibles</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar tiendas por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button 
              className="clear-search"
              onClick={() => setBusqueda('')}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        
        {busqueda && (
          <p className="search-results">
            Mostrando {tiendasFiltradas.length} de {tiendas.length} tiendas
          </p>
        )}
      </div>

      <div className="tiendas-grid">
        {tiendasFiltradas.length > 0 ? (
          tiendasFiltradas.map((tienda) => (
            <div 
              key={tienda.id} 
              className="tienda-item"
              onClick={() => irATienda(tienda)}
            >
              <div className="tienda-logo-container">
                {tienda.logo ? (
                  <img 
                    src={tienda.logo} 
                    alt={`Logo ${tienda.nombre}`}
                    className="tienda-logo-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="tienda-logo-placeholder"
                  style={{ display: tienda.logo ? 'none' : 'flex' }}
                >
                  🏪
                </div>
              </div>
              
              <div className="tienda-info">
                <h3 className="tienda-nombre">{tienda.nombre}</h3>
                
                {tienda.valoracion && (
                  <div className="tienda-valoracion">
                    <span className="estrellas">⭐</span>
                    <span className="valoracion-numero">{tienda.valoracion}/5</span>
                  </div>
                )}
                
                <div className="tienda-tipo">
                  <span className="tipo-badge">{tienda.tipoBusqueda}</span>
                </div>
                
                <div className="ver-mas">
                  Ver detalles →
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No se encontraron tiendas</h3>
            <p>
              {busqueda 
                ? `No hay tiendas que coincidan con "${busqueda}"`
                : 'No hay tiendas disponibles en este momento'
              }
            </p>
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="btn-clear-search"
              >
                Mostrar todas las tiendas
              </button>
            )}
          </div>
        )}
      </div>

      {tiendas.length > 0 && (
        <div className="tiendas-stats">
          <p>Total de tiendas disponibles: <strong>{tiendas.length}</strong></p>
        </div>
      )}
    </div>
  );
}
