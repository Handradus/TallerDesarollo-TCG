import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/tiendaDetalle.css';

export default function TiendaDetalle() {
  const { nombreTienda } = useParams();
  const navigate = useNavigate();
  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (nombreTienda) {
      cargarTienda();
    }
  }, [nombreTienda]);

  const cargarTienda = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/tiendas-publicas/${nombreTienda}`);
      const data = await response.json();
      
      if (data.success) {
        setTienda(data.tienda);
      } else {
        setError(data.error || 'Tienda no encontrada');
      }
    } catch (error) {
      console.error('Error al cargar tienda:', error);
      setError('Error de conexión al cargar la tienda');
    } finally {
      setLoading(false);
    }
  };

  const abrirEnGoogleMaps = (direccion) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
    window.open(url, '_blank');
  };

  const abrirSitioWeb = (url) => {
    let urlCompleta = url;
    if (!/^https?:\/\//i.test(url)) {
      urlCompleta = 'https://' + url;
    }
    window.open(urlCompleta, '_blank');
  };

  if (loading) {
    return (
      <div className="tienda-detalle-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando información de la tienda...</p>
        </div>
      </div>
    );
  }

  if (error || !tienda) {
    return (
      <div className="tienda-detalle-container">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Tienda no encontrada</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/tiendas')} className="btn-secondary">
              Ver todas las tiendas
            </button>
            <button onClick={() => navigate('/')} className="btn-primary">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tienda-detalle-container">
      <div className="tienda-header">
        <button 
          className="btn-volver"
          onClick={() => navigate('/tiendas')}
        >
          ← Volver a tiendas
        </button>
        <button 
          className="btn-inicio"
          onClick={() => navigate('/')}
        >
          🏠 Inicio
        </button>
      </div>

      <div className="tienda-main">
        <div className="tienda-info-card">
          {/* Logo y nombre */}
          <div className="tienda-header-info">
            <div className="logo-container">
              {tienda.logo ? (
                <img 
                  src={tienda.logo} 
                  alt={`Logo ${tienda.nombre}`}
                  className="tienda-logo-main"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="logo-placeholder-main"
                style={{ display: tienda.logo ? 'none' : 'flex' }}
              >
                🏪
              </div>
            </div>
            
            <div className="tienda-title-section">
              <h1 className="tienda-nombre-main">{tienda.nombre}</h1>
              
              {tienda.valoracion && (
                <div className="valoracion-main">
                  <div className="estrellas-display">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`estrella ${i < Math.floor(tienda.valoracion) ? 'filled' : ''}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="valoracion-numero-main">{tienda.valoracion}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Información detallada */}
          <div className="tienda-details-grid">
            {tienda.descripcion && (
              <div className="detail-card">
                <div className="detail-header">
                  <span className="detail-icon">📝</span>
                  <h3>Descripción</h3>
                </div>
                <p className="detail-content">{tienda.descripcion}</p>
              </div>
            )}

            {tienda.urlBase && (
              <div className="detail-card clickable" onClick={() => abrirSitioWeb(tienda.urlBase)}>
                <div className="detail-header">
                  <span className="detail-icon">🌐</span>
                  <h3>Sitio Web</h3>
                </div>
                <div className="detail-content">
                  <span className="link-preview">{tienda.urlBase}</span>
                  <span className="click-hint">Clic para visitar →</span>
                </div>
              </div>
            )}

            {tienda.direccion && (
              <div className="detail-card clickable" onClick={() => abrirEnGoogleMaps(tienda.direccion)}>
                <div className="detail-header">
                  <span className="detail-icon">📍</span>
                  <h3>Ubicación</h3>
                </div>
                <div className="detail-content">
                  <span className="direccion-text">{tienda.direccion}</span>
                  <span className="click-hint">Clic para ver en mapa →</span>
                </div>
              </div>
            )}

            {tienda.telefono && (
              <div className="detail-card">
                <div className="detail-header">
                  <span className="detail-icon">📞</span>
                  <h3>Teléfono</h3>
                </div>
                <div className="detail-content">
                  <a href={`tel:${tienda.telefono}`} className="phone-link">
                    {tienda.telefono}
                  </a>
                </div>
              </div>
            )}

            {tienda.ultimaActualizacion && (
              <div className="detail-card">
                <div className="detail-header">
                  <span className="detail-icon">🕒</span>
                  <h3>Última Actualización</h3>
                </div>
                <div className="detail-content">
                  <span className="fecha-actualizacion">
                    {new Date(tienda.ultimaActualizacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Acciones principales */}
          <div className="acciones-principales">
            {tienda.urlBase && (
              <button 
                className="btn-accion-principal"
                onClick={() => abrirSitioWeb(tienda.urlBase)}
              >
                🛒 Visitar Tienda
              </button>
            )}
            
            {tienda.direccion && (
              <button 
                className="btn-accion-secundaria"
                onClick={() => abrirEnGoogleMaps(tienda.direccion)}
              >
                🗺️ Ver en Mapa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
