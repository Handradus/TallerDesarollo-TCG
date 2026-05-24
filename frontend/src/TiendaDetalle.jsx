import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './css/tiendaDetalle.css';
import Swal from 'sweetalert2';

export default function TiendaDetalle() {
  const { nombreTienda } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ promedio: null, cantidad: 0 });
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [sendingReview, setSendingReview] = useState(false);

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
        await cargarResenas();
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

  const cargarResenas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/tiendas-publicas/${nombreTienda}/resenas`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setReviewStats({ promedio: data.promedio ?? null, cantidad: data.cantidad ?? 0 });
      }
    } catch (err) {
      console.error('Error al cargar reseñas:', err);
    }
  };

  const publicarResena = async () => {
    if (!user) {
      Swal.fire({
        title: 'Atención',
        text: 'Debes iniciar sesión para comentar.',
        icon: 'warning'
      });
      return;
    }

    if (!reviewText.trim()) {
      return;
    }

    try {
      setSendingReview(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tiendas-publicas/${nombreTienda}/resenas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: reviewText,
          rating
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo publicar la reseña');
      }

      setReviewText('');
      setRating(5);
      await cargarResenas();
    } catch (err) {
      console.error('Error al publicar reseña:', err);
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error al publicar reseña',
        icon: 'error'
      });
    } finally {
      setSendingReview(false);
    }
  };

  const abrirEnGoogleMaps = (direccion) => {
    let query = direccion;
    if (tienda && tienda.region) {
      query += `, ${tienda.region}`;
    }
    query += `, Chile`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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

  const valoracionVisible = reviewStats.promedio && reviewStats.promedio > 0
    ? reviewStats.promedio
    : tienda.valoracion;

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
              
              {valoracionVisible && (
                <div className="valoracion-main">
                  <div className="estrellas-display">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`estrella ${i < Math.floor(valoracionVisible) ? 'filled' : ''}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="valoracion-numero-main">{Number(valoracionVisible).toFixed(1)}/5</span>
                  <span className="valoracion-total-main">({reviewStats.cantidad || 0} reseñas)</span>
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

            {tienda.direccion && tienda.tipo !== 'online' && !tienda.direccion.toLowerCase().includes('online') && (
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
            
            {tienda.direccion && tienda.tipo !== 'online' && !tienda.direccion.toLowerCase().includes('online') && (
              <button 
                className="btn-accion-secundaria"
                onClick={() => abrirEnGoogleMaps(tienda.direccion)}
              >
                🗺️ Ver en Mapa
              </button>
            )}
          </div>

          <div className="reviews-section">
            <h2>Reseñas de usuarios</h2>

            {user ? (
              <div className="review-form-card">
                <h3>Valorar y comentar esta tienda</h3>
                <div className="review-form-row">
                  <label htmlFor="review-rating">Calificación:</label>
                  <select
                    id="review-rating"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value, 10))}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                    <option value="4">⭐⭐⭐⭐ Bueno</option>
                    <option value="3">⭐⭐⭐ Regular</option>
                    <option value="2">⭐⭐ Malo</option>
                    <option value="1">⭐ Muy mala</option>
                  </select>
                </div>

                <textarea
                  className="review-textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntale a otros usuarios cómo fue tu experiencia con esta tienda..."
                />

                <button
                  className="btn-review-submit"
                  onClick={publicarResena}
                  disabled={sendingReview || !reviewText.trim()}
                >
                  {sendingReview ? 'Publicando...' : 'Publicar reseña'}
                </button>
              </div>
            ) : (
              <div className="review-login-hint">
                Inicia sesión para valorar y comentar esta tienda.
              </div>
            )}

            <div className="review-list">
              {reviews.length === 0 ? (
                <p className="review-empty">Aún no hay reseñas para esta tienda.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-card-header">
                      <span className="review-author">{review.user?.name || 'Usuario'}</span>
                      <span className="review-date">{new Date(review.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="review-stars">{'⭐'.repeat(review.rating || 5)}</div>
                    <p className="review-content">{review.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
