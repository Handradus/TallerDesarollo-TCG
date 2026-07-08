import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/tiendas.css';
import AdBanner from './components/AdBanner';
import Swal from 'sweetalert2';
import tiendaLogo from './assets/Tienda_logo.png';
import { Close, Lightbulb, Store, Star, Search } from 'pixelarticons/react';
import PixelIcon from './components/PixelIcon';

export default function Tiendas() {
  const navigate = useNavigate();
  const [tiendas, setTiendasFiltradas] = useState([]); // reused names slightly confusing, let's clean up
  // Actually, let's keep it simple.
  const [tiendasList, setTiendasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [busqueda, setBusqueda] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos'); // todos, online, fisica

  // Suggestion Modal
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionData, setSuggestionData] = useState({
    nombre: '', urlBase: '', urlBusqueda: '', tipoBusqueda: 'shopify',
    tipo: 'ambos', region: '', descripcion: ''
  });

  const regionesChile = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble",
    "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
  ];

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    cargarTiendas();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarTiendas();
    }, 400); // Debounce de 400ms para evitar demasiadas llamadas al servidor

    return () => clearTimeout(timeoutId);
  }, [busqueda, regionFilter, typeFilter]); // Reload when filters change (server side filtering)

  // Old client side filtering removed in favor of server side + search
  // But search is client side in original code?
  // User asked for region/online filtering.
  // Let's make search client-side still if backend search endpoint isn't being used for text?
  // Backend `buscarTiendas` endpoint exists but `tiendas-publicas` returns all.
  // We updated `tiendas-publicas` to accept Filters!
  // So we should use server side filtering for Region/Type.
  // For Search (text), we can keep client side or move to server.
  // Original code loaded ALL then filtered client side.
  // Let's load with Region/Type from server, then filter name client side.

  const cargarTiendas = async () => {
    try {
      setLoading(true);
      let url = `${apiUrl}/api/tiendas-publicas?`;
      if (regionFilter) url += `&region=${encodeURIComponent(regionFilter)}`;
      if (typeFilter && typeFilter !== 'todos') url += `&tipo=${typeFilter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filtered = data.tiendas;
        if (busqueda) {
          filtered = filtered.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase()));
        }
        setTiendasList(filtered);
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

  const handleSuggest = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return Swal.fire({
          title: 'Atención',
          text: 'Debes iniciar sesión para sugerir',
          icon: 'warning'
        });
      }

      await fetch(`${apiUrl}/api/tiendas/sugerir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(suggestionData)
      });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Sugerencia enviada a revisión!',
        icon: 'success'
      });
      setShowSuggestModal(false);
      setSuggestionData({
        nombre: '', urlBase: '', urlBusqueda: '', tipoBusqueda: 'shopify',
        tipo: 'ambos', region: '', descripcion: ''
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: 'Error',
        text: 'Error enviando sugerencia',
        icon: 'error'
      });
    }
  }

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
        <h1 className="tiendas-main-title">
          <img src={tiendaLogo} alt="Logo Tiendas" className="tiendas-header-logo" />
          Tiendas Disponibles
        </h1>
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
              <PixelIcon icon={Close} size={16} />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="filters-row" style={{ marginTop: '10px' }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="online">Online</option>
            <option value="fisica">Física</option>
          </select>

          {(typeFilter !== 'online') && (
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las Regiones</option>
              {regionesChile.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          <button
            className="btn-primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowSuggestModal(true)}
          >
            <PixelIcon icon={Lightbulb} size={16} /> Sugerir Tienda
          </button>
        </div>

        {busqueda && (
          <p className="search-results">
            Mostrando {tiendasList.length} tiendas
          </p>
        )}
      </div>

      {/* Banners publicitarios */}
      <AdBanner layout="bottom" />

      <div className="tiendas-grid">
        {tiendasList.length > 0 ? (
          tiendasList.map((tienda) => (
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
                  <PixelIcon icon={Store} size={32} />
                </div>
              </div>

              <div className="tienda-info">
                <h3 className="tienda-nombre">{tienda.nombre}</h3>

                {tienda.valoracion && (
                  <div className="tienda-valoracion">
                    <span className="estrellas"><PixelIcon icon={Star} size={14} color="#ffd700" /></span>
                    <span className="valoracion-numero">{tienda.valoracion}/5</span>
                  </div>
                )}


                <div className="ver-mas">
                  Ver detalles →
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon"><PixelIcon icon={Search} size={32} /></div>
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


      {
        showSuggestModal && (
          <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <button className="modal-close" onClick={() => setShowSuggestModal(false)}>&times;</button>
              <h2><PixelIcon icon={Lightbulb} size={20} /> Sugerir Nueva Tienda</h2>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                Ayúdanos a crecer. Tu sugerencia será revisada por un administrador.
              </p>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="Nombre de la Tienda" className="text-input"
                  value={suggestionData.nombre} onChange={e => setSuggestionData({ ...suggestionData, nombre: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="URL Base (ej: https://mitienda.cl)" className="text-input"
                  value={suggestionData.urlBase} onChange={e => setSuggestionData({ ...suggestionData, urlBase: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <select className="filter-select" style={{ width: '100%' }}
                  value={suggestionData.tipo} onChange={e => setSuggestionData({ ...suggestionData, tipo: e.target.value })}>
                  <option value="ambos">Ambos (Online y Física)</option>
                  <option value="online">Solo Online</option>
                  <option value="fisica">Solo Física</option>
                </select>
              </div>
              {suggestionData.tipo !== 'online' && (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <select className="filter-select" style={{ width: '100%' }}
                    value={suggestionData.region} onChange={e => setSuggestionData({ ...suggestionData, region: e.target.value })}>
                    <option value="">-- Región --</option>
                    {regionesChile.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button className="btn-primary" onClick={handleSuggest}>Enviar Sugerencia</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
