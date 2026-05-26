import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/BuscarCarta.css';
import './css/BuscarCartaAdmin.css';
import tituloWebImg from './assets/tituloWeb.png';

export default function BuscarCartasAdmin() {
  const [nombre, setNombre] = useState('');
  const [cartasAPI, setCartasAPI] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('carta');
  const [resultadoActualizacion, setResultadoActualizacion] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "🔧 Admin - Actualizar BD desde API";
    
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const buscarEnAPI = async () => {
    if (!nombre.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setError('');
    setCartasAPI([]);
    setResultadoActualizacion(null);

    try {
      console.log(`🔧 Buscando "${nombre}" en API (admin)...`);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/cartas/admin?nombre=${encodeURIComponent(nombre)}&tipo=${tipoBusqueda}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const cartas = await response.json();
      console.log(`✅ Admin API encontró ${cartas.length} cartas`);
      
      setCartasAPI(cartas);

    } catch (err) {
      console.error('❌ Error buscando en API:', err);
      setError('Error al buscar cartas en la API');
    } finally {
      setLoading(false);
    }
  };

  const actualizarBD = async () => {
    if (cartasAPI.length === 0) {
      setError('No hay cartas para actualizar');
      return;
    }

    setActualizando(true);
    setResultadoActualizacion(null);
    setError('');

    try {
      console.log(`💾 Enviando ${cartasAPI.length} cartas para actualizar BD...`);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/cartas/actualizar-bd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartas: cartasAPI })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la base de datos');
      }

      const resultado = await response.json();
      console.log('✅ BD actualizada:', resultado);
      
      setResultadoActualizacion(resultado);
      
      // Limpiar cartas después de actualizar
      setTimeout(() => {
        setCartasAPI([]);
        setNombre('');
      }, 3000);

    } catch (err) {
      console.error('❌ Error actualizando BD:', err);
      setError('Error al actualizar la base de datos');
    } finally {
      setActualizando(false);
    }
  };

  const limpiarBusqueda = () => {
    setNombre('');
    setCartasAPI([]);
    setError('');
    setResultadoActualizacion(null);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="app-container">
      {/* Logo y botón home */}
      <div className="logo-principal">
        <img 
          src={tituloWebImg} 
          alt="Pokémon TCG" 
          className="titulo-web-img"
          onClick={goHome}
          style={{ cursor: 'pointer' }}
        />
        <div className="admin-header">
          <h1>🔧 Administrador - Actualizar BD desde API</h1>
          <p>Busca cartas solo en la API de Pokémon TCG y actualiza tu base de datos</p>
        </div>
      </div>

      {/* Botón limpiar */}
      <div className="search-actions">
        <button onClick={limpiarBusqueda} className="btn-limpiar-busqueda">
          🧹 Limpiar Búsqueda
        </button>
        <button onClick={goHome} className="home-button">
          🏠 Volver al Inicio
        </button>
      </div>

      {/* Sección de búsqueda */}
      <div className="search-section">
        <div className="search-container">
          <div className="input-container">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Buscar cartas en API..."
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && buscarEnAPI()}
            />
          </div>
          
          <button 
            onClick={buscarEnAPI}
            disabled={loading || !nombre.trim()}
            className="search-button"
          >
            {loading ? '🔍 Buscando...' : '🔍 Buscar en API'}
          </button>
        </div>

        {/* Selector de tipo */}
        <div className="search-type-selector">
          <label>
            <input
              type="radio"
              name="tipoBusqueda"
              value="carta"
              checked={tipoBusqueda === 'carta'}
              onChange={(e) => setTipoBusqueda(e.target.value)}
            />
            <span>🎮 Buscar cartas individuales</span>
          </label>
          <label>
            <input
              type="radio"
              name="tipoBusqueda"
              value="set"
              checked={tipoBusqueda === 'set'}
              onChange={(e) => setTipoBusqueda(e.target.value)}
            />
            <span>📦 Buscar sets/colecciones</span>
          </label>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Botón para actualizar BD */}
      {cartasAPI.length > 0 && (
        <div className="update-section">
          <div className="update-info">
            <h3>📡 Cartas encontradas en API: {cartasAPI.length}</h3>
            <p>Estas cartas se pueden guardar/actualizar en tu base de datos</p>
          </div>
          
          <button 
            onClick={actualizarBD}
            disabled={actualizando}
            className="update-button"
          >
            {actualizando ? '💾 Actualizando BD...' : `💾 Actualizar BD (${cartasAPI.length} cartas)`}
          </button>
        </div>
      )}

      {/* Resultado de actualización */}
      {resultadoActualizacion && (
        <div className="update-result">
          <h3>✅ Actualización completada</h3>
          <div className="result-stats">
            <div className="stat-item nuevas">
              <strong>➕ Cartas nuevas:</strong> {resultadoActualizacion.resumen.totalNuevas}
            </div>
            <div className="stat-item actualizadas">
              <strong>🔄 Cartas actualizadas:</strong> {resultadoActualizacion.resumen.totalActualizadas}
            </div>
            <div className="stat-item errores">
              <strong>❌ Errores:</strong> {resultadoActualizacion.resumen.totalErrores}
            </div>
          </div>

          {/* Mostrar cartas nuevas */}
          {resultadoActualizacion.nuevas && resultadoActualizacion.nuevas.length > 0 && (
            <div className="cartas-nuevas">
              <h4>➕ Cartas nuevas guardadas:</h4>
              <ul>
                {resultadoActualizacion.nuevas.map((carta, index) => (
                  <li key={index}>
                    <strong>{carta.nombre}</strong> ({carta.numero}) - {carta.set}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mostrar cartas actualizadas */}
          {resultadoActualizacion.actualizadas && resultadoActualizacion.actualizadas.length > 0 && (
            <div className="cartas-actualizadas">
              <h4>🔄 Cartas actualizadas:</h4>
              <ul>
                {resultadoActualizacion.actualizadas.map((carta, index) => (
                  <li key={index}>
                    <strong>{carta.nombre}</strong> ({carta.numero}) - {carta.set}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mostrar errores si los hay */}
          {resultadoActualizacion.errores && resultadoActualizacion.errores.length > 0 && (
            <div className="cartas-errores">
              <h4>❌ Errores:</h4>
              <ul>
                {resultadoActualizacion.errores.map((error, index) => (
                  <li key={index}>
                    {error.carta} ({error.numero}): {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Vista previa de cartas de API */}
      {cartasAPI.length > 0 && !resultadoActualizacion && (
        <>
          <div className="search-info">
            🎮 Mostrando {cartasAPI.length} cartas desde la API de Pokémon TCG
          </div>
          
          <div className="cartas-grid">
            {cartasAPI.map((carta, index) => (
              <div key={`${carta.numero}-${carta.set}-${index}`} className="carta-item api-carta">
                <h2>{carta.nombre}</h2>
                <div className="carta-imagen-container">
                  <img 
                    src={carta.imagen} 
                    alt={carta.nombre}
                    loading="lazy"
                  />
                </div>
                <div className="carta-info">
                  <p><strong>Número:</strong> {carta.numero}</p>
                  <p><strong>Set:</strong> {carta.set}</p>
                  <p><strong>Rareza:</strong> {carta.rareza}</p>
                  {carta.precio && <p><strong>Precio:</strong> ${carta.precio}</p>}
                  <div className="carta-origen">
                    <span className="origen-api">📡 Desde API</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Scroll to top */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="scroll-to-top"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}
