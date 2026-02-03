import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/BuscarCarta.css';
import './css/BuscarCartaAdmin.css';
import tituloWebImg from './assets/tituloWeb.jpg';

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
      const response = await fetch(`${apiUrl}/api/cartas/admin?nombre=${encodeURIComponent(nombre)}&tipo=${tipoBusqueda}`);
      
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
      
      const response = await fetch(`${apiUrl}/api/cartas/actualizar-bd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        hasSearched: savedHasSearched,
        lastSearchTerm: savedLastSearchTerm,
        updateStats: savedStats
      });
    }

    // Manejar scroll para mostrar botón de "volver arriba"
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Guardar datos en sessionStorage cada vez que cambien las cartas o el estado de búsqueda
  useEffect(() => {
    if (hasSearched) {
      const dataToSave = {
        cartas,
        hasSearched,
        lastSearchTerm,
        updateStats,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pokemon-admin-search-data', JSON.stringify(dataToSave));
      console.log('💾 Admin Frontend: Datos guardados en sessionStorage:', dataToSave);
    }
  }, [cartas, hasSearched, lastSearchTerm, updateStats]);

  // Función para obtener sugerencias
  const obtenerSugerencias = async (texto) => {
    if (!texto || texto.length < 2) {
      setSugerencias([]);
      return;
    }
    
    try {
      const sugerenciasObtenidas = await obtenerSugerenciasHibridas(texto);
      setSugerencias(sugerenciasObtenidas);
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      setSugerencias([]);
    }
  };

  // Debounce para sugerencias
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nombre && mostrarSugerencias) {
        obtenerSugerencias(nombre);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nombre, mostrarSugerencias]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarBusqueda = () => {
    console.log('🧹 Admin Frontend: Limpiando búsqueda manualmente');
    setCartas([]);
    setError('');
    setHasSearched(false);
    setLastSearchTerm('');
    setNombre('');
    setTerminoNormalizado('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setUpdateStats({ nuevas: 0, existentes: 0 });
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('pokemon-admin-search-data');
    
    // Hacer scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aplicarSugerencia = (sugerencia) => {
    console.log('📝 Admin Frontend: Aplicando sugerencia:', sugerencia);
    setNombre(sugerencia);
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  const buscarCartas = async (terminoParaBuscar) => {
    if (!terminoParaBuscar?.trim()) {
      console.warn('⚠️ Admin Frontend: Término de búsqueda vacío');
      return;
    }

    const terminoLimpio = terminoParaBuscar.trim();
    console.log(`🔍 Admin Frontend: Iniciando búsqueda ADMIN para: "${terminoLimpio}"`);

    setLoading(true);
    setError('');
    setCartas([]);
    setSugerencias([]);
    setMostrarSugerencias(false);
    setUpdateStats({ nuevas: 0, existentes: 0 });

    try {
      // Usar el endpoint admin que consulta la API y actualiza la BD
      const res = await fetch(`${apiUrl}/api/cartas/admin?nombre=${encodeURIComponent(terminoLimpio)}&tipo=${tipoBusqueda}`);
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Error ${res.status}: ${errorData}`);
      }

      const data = await res.json();
      console.log(`📊 Admin Frontend: Respuesta del servidor:`, data);

      if (data && data.length > 0) {
        setCartas(data);
        setCartasOriginales(data);
        setLastSearchTerm(terminoLimpio);
        setTerminoNormalizado(normalizarTexto(terminoLimpio));
        
        // Calcular estadísticas de actualización
        const nuevas = data.filter(carta => carta.origen === 'API').length;
        const existentes = data.filter(carta => carta.origen === 'BD').length;
        setUpdateStats({ nuevas, existentes });
        
        console.log(`✅ Admin Frontend: ${data.length} cartas encontradas (${nuevas} nuevas, ${existentes} existentes)`);
      } else {
        console.log('❌ Admin Frontend: No se encontraron cartas');
        setError('No se encontraron cartas con ese término de búsqueda en la API de Pokémon TCG.');
      }
    } catch (error) {
      console.error('💥 Admin Frontend: Error en búsqueda:', error);
      setError(`Error al buscar cartas: ${error.message}`);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await buscarCartas(nombre);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setNombre(valor);
    
    if (valor.trim()) {
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const handleInputFocus = () => {
    if (nombre.trim()) {
      setMostrarSugerencias(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setMostrarSugerencias(false);
    }, 200);
  };

  const handleCardClick = (carta) => {
    console.log('🃏 Admin Frontend: Navegando a carta:', carta.id);
    navigate(`/carta/${carta.id}`);
  };

  return (
    <div className="buscar-cartas">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <img 
            src={tituloWebImg} 
            alt="PokéDex TCG" 
            className="hero-title-image"
          />
          <h1 className="admin-title">🔧 Búsqueda Admin - API y Actualización BD</h1>
          <p className="hero-subtitle">
            Consulta la API oficial de Pokémon TCG y actualiza la base de datos con nuevas cartas
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={nombre}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Buscar carta en API (ej: Pikachu, Charizard, 25/102, etc.)"
                className="search-input"
                disabled={loading}
                autoComplete="off"
              />
              
              {/* Sugerencias Dropdown */}
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="sugerencias-dropdown">
                  {sugerencias.slice(0, 8).map((sugerencia, index) => (
                    <div
                      key={index}
                      className="sugerencia-item"
                      onClick={() => aplicarSugerencia(sugerencia)}
                    >
                      {sugerencia}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selector de tipo de búsqueda */}
            <div className="search-type-selector" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              margin: '10px 0',
              fontSize: '0.9rem'
            }}>
              <span style={{ fontWeight: '500', color: '#555' }}>Buscar:</span>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoBusqueda"
                  value="carta"
                  checked={tipoBusqueda === 'carta'}
                  onChange={(e) => setTipoBusqueda(e.target.value)}
                  style={{ marginRight: '5px' }}
                />
                <span>Carta</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoBusqueda"
                  value="set"
                  checked={tipoBusqueda === 'set'}
                  onChange={(e) => setTipoBusqueda(e.target.value)}
                  style={{ marginRight: '5px' }}
                />
                <span>Set/Colección</span>
              </label>
            </div>
            
            <div className="search-buttons">
              <button 
                type="submit" 
                disabled={loading || !nombre.trim()}
                className="search-button"
              >
                {loading ? '🔄 Consultando API...' : '🔍 Buscar en API'}
              </button>
              
              {hasSearched && (
                <button 
                  type="button" 
                  onClick={limpiarBusqueda}
                  className="clear-button"
                  disabled={loading}
                >
                  🧹 Limpiar
                </button>
              )}
            </div>

            {/* Controles de ordenamiento para Admin */}
            <div className="sort-controls" style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              marginTop: '10px',
              fontSize: '0.9rem',
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '6px'
            }}>
              <label style={{ fontWeight: '500' }}>Ordenar por:</label>
              <select 
                value={ordenar} 
                onChange={(e) => setOrdenar(e.target.value)}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="defecto">Orden original</option>
                <option value="numero">Número de carta</option>
                <option value="rareza">Rareza</option>
                <option value="alfabetico">Alfabético</option>
                <option value="set">Por set</option>
                <option value="fecha">Fecha de lanzamiento</option>
              </select>
              
              <select 
                value={direccion} 
                onChange={(e) => setDireccion(e.target.value)}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>

              {(ordenar !== 'defecto' || direccion !== 'asc') && (
                <button
                  onClick={() => {
                    setOrdenar('defecto');
                    setDireccion('asc');
                  }}
                  style={{
                    padding: '5px 10px',
                    background: '#e5e7eb',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Resetear
                </button>
              )}
            </div>
          </form>

          {/* Admin Info Panel */}
          <div className="admin-info-panel">
            <h3>ℹ️ Información de Búsqueda Admin</h3>
            <ul>
              <li><strong>Función:</strong> Consulta la API oficial de Pokémon TCG</li>
              <li><strong>Actualización:</strong> Guarda automáticamente nuevas cartas en la base de datos</li>
              <li><strong>Uso:</strong> Solo para administradores que necesiten actualizar el catálogo</li>
              <li><strong>Diferencia:</strong> La búsqueda normal solo consulta la base de datos local</li>
            </ul>
          </div>

          {/* Update Statistics */}
          {hasSearched && (updateStats.nuevas > 0 || updateStats.existentes > 0) && (
            <div className="update-stats">
              <h3>📊 Estadísticas de Actualización</h3>
              <div className="stats-grid">
                <div className="stat-card new">
                  <div className="stat-number">{updateStats.nuevas}</div>
                  <div className="stat-label">Cartas Nuevas</div>
                  <div className="stat-description">Agregadas desde la API</div>
                </div>
                <div className="stat-card existing">
                  <div className="stat-number">{updateStats.existentes}</div>
                  <div className="stat-label">Cartas Existentes</div>
                  <div className="stat-description">Ya estaban en BD</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <div className="container text-center">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              🔄 Consultando API de Pokémon TCG y actualizando base de datos...
            </p>
            <p className="loading-subtext">
              Este proceso puede tomar unos momentos mientras descargamos y guardamos las cartas
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-section">
          <div className="container text-center">
            <div className="error-message">
              <h3>⚠️ Error en la búsqueda</h3>
              <p>{error}</p>
              <button onClick={limpiarBusqueda} className="clear-button">
                🔄 Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && !loading && cartas.length > 0 && (
        <section className="results-section">
          <div className="container">
            <div className="results-header">
              <h2>
                🎯 Resultados para "{lastSearchTerm}" 
                <span className="results-count">({cartas.length} cartas)</span>
              </h2>
              
              {updateStats.nuevas > 0 && (
                <div className="update-badge">
                  ✨ {updateStats.nuevas} cartas nuevas agregadas a la BD
                </div>
              )}
            </div>
            
            <CarouselCartas 
              cartas={cartas} 
              onCardClick={handleCardClick}
              terminoNormalizado={terminoNormalizado}
            />
          </div>
        </section>
      )}

      {/* No Results State */}
      {hasSearched && !loading && cartas.length === 0 && !error && (
        <div className="no-results-section">
          <div className="container text-center">
            <div className="no-results-message">
              <h3>🔍 No se encontraron cartas</h3>
              <p>No se encontraron cartas con el término "{lastSearchTerm}" en la API de Pokémon TCG.</p>
              <p>Intenta con:</p>
              <ul className="search-tips">
                <li>Nombres en inglés (ej: "Pikachu" en lugar de "Pikachu")</li>
                <li>Nombres completos de cartas</li>
                <li>Números de carta con formato (ej: "25/102")</li>
                <li>Códigos promocionales (ej: "SWSH001")</li>
              </ul>
              <button onClick={limpiarBusqueda} className="clear-button">
                🔄 Nueva búsqueda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button 
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Volver arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}
