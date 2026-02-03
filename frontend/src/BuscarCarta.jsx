import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/BuscarCarta.css';
import { obtenerSugerenciasHibridas } from './utils/sugerenciasBackend';
import { normalizarTexto } from './utils/sugerencias';
import { ordenarCartas } from './utils/ordenarCartas';
import CarouselCartas from './CarouselCartas';
import CarouselTiendas from './CarouselTiendas';
import tituloWebImg from './assets/tituloWeb.jpg';
import { useAuth } from './context/AuthContext';
import axios from 'axios';

export default function BuscarCartas() {
  const [nombre, setNombre] = useState('');
  const [cartas, setCartas] = useState([]);
  const [cartasOriginales, setCartasOriginales] = useState([]); // Para mantener el orden original
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [terminoNormalizado, setTerminoNormalizado] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tipoBusqueda, setTipoBusqueda] = useState('carta'); // 'carta' o 'set'
  // Estados para ordenamiento
  const [ordenar, setOrdenar] = useState('defecto');
  const [direccion, setDireccion] = useState('asc');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Binder State
  const [binders, setBinders] = useState([]);
  const [showBinderModal, setShowBinderModal] = useState(false);
  const [selectedCardForBind, setSelectedCardForBind] = useState(null);
  const [targetBinderId, setTargetBinderId] = useState('');

  const initiateAddToCollection = async (e, carta) => {
    e.stopPropagation();
    if (!user) return alert('Debes iniciar sesión');

    // Fetch binders first
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/collection/binders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userBinders = res.data;

      if (userBinders.length === 0) {
        // No binders, immediate add
        addToCollection(carta.id, null);
      } else {
        setBinders(userBinders);
        setSelectedCardForBind(carta.id);
        setShowBinderModal(true);
      }
    } catch (e) { console.error(e); }
  };

  const addToCollection = async (cartaId, binderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/collection/add`, { cartaId, binderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Carta agregada a tu colección!');
      setShowBinderModal(false);
      setTargetBinderId('');
    } catch (error) {
      console.error(error);
      alert('Error al agregar carta');
    }
  };

  const venderCarta = (e, carta) => {
    e.stopPropagation();
    if (!user) return alert('Debes iniciar sesión');
    navigate('/mi-tienda', { state: { sellCard: carta } });
  };



  // Efecto para re-ordenar cuando cambian los parámetros de ordenamiento
  useEffect(() => {
    if (hasSearched && lastSearchTerm && cartas.length > 0) {
      console.log(`🔄 Reordenando ${cartas.length} cartas por ${ordenar} (${direccion})`);
      buscarCartasConTermino(lastSearchTerm);
    }
  }, [ordenar, direccion]); // Solo se ejecuta cuando cambian estos parámetros

  // Cargar datos del sessionStorage al montar el componente
  useEffect(() => {
    // Actualizar título del documento
    document.title = "⚡ PokéDex TCG - Centro de Entrenadores";

    const savedData = sessionStorage.getItem('pokemon-search-data');
    if (savedData) {
      const { cartas: savedCartas, hasSearched: savedHasSearched, lastSearchTerm: savedLastSearchTerm } = JSON.parse(savedData);

      // Si la última búsqueda falló (no hay cartas), limpiar el estado completamente
      if (savedHasSearched && (!savedCartas || savedCartas.length === 0)) {
        console.log('🧹 Frontend: Última búsqueda falló, limpiando estado automáticamente');
        sessionStorage.removeItem('pokemon-search-data');
        // Limpiar todos los estados para que no quede rastro de la búsqueda fallida
        setCartas([]);
        setHasSearched(false);
        setLastSearchTerm('');
        setNombre('');
        setTerminoNormalizado('');
        setSugerencias([]);
        setMostrarSugerencias(false);
        setError('');
        return;
      }

      // Solo cargar si hay resultados exitosos
      setCartas(savedCartas || []);
      setHasSearched(savedHasSearched || false);
      setLastSearchTerm(savedLastSearchTerm || '');
    }
  }, []);

  // Guardar datos en sessionStorage cuando cambien
  useEffect(() => {
    if (hasSearched) {
      sessionStorage.setItem('pokemon-search-data', JSON.stringify({
        cartas,
        hasSearched,
        lastSearchTerm
      }));
    }
  }, [cartas, hasSearched, lastSearchTerm]);

  // Normalizar texto y obtener sugerencias en tiempo real
  useEffect(() => {
    const normalizado = normalizarTexto(nombre);
    setTerminoNormalizado(normalizado);

    // Obtener sugerencias si hay al menos 2 caracteres
    if (nombre.length >= 2) {
      // Usar función async para obtener sugerencias del backend
      const fetchSugerencias = async () => {
        try {
          const nuevasSugerencias = await obtenerSugerenciasHibridas(nombre);
          setSugerencias(nuevasSugerencias);
          setMostrarSugerencias(nuevasSugerencias.length > 0);
        } catch (error) {
          console.warn('Error al obtener sugerencias:', error);
          setSugerencias([]);
          setMostrarSugerencias(false);
        }
      };

      // Debounce para evitar demasiadas consultas
      const timeoutId = setTimeout(fetchSugerencias, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [nombre]);

  // Manejar el scroll para mostrar/ocultar el botón de volver arriba
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para ordenar los resultados
  // Usar la utilidad de ordenamiento
  const obtenerCartasOrdenadas = (cartasParaOrdenar, criterio, dir) => {
    if (criterio === 'defecto') {
      return [...cartasOriginales]; // Mantener orden original
    }
    return ordenarCartas(cartasParaOrdenar, criterio, dir);
  };

  // Efecto para aplicar ordenamiento cuando cambian los criterios
  useEffect(() => {
    if (cartasOriginales.length > 0) {
      const cartasOrdenadas = obtenerCartasOrdenadas(cartasOriginales, ordenar, direccion);
      setCartas(cartasOrdenadas);
      console.log(`🔄 Cartas reordenadas por ${ordenar} (${direccion}): ${cartasOrdenadas.length} cartas`);
    }
  }, [ordenar, direccion, cartasOriginales]);

  const buscarCartas = async () => {
    const termino = nombre.trim();
    return buscarCartasConTermino(termino);
  };

  const buscarCartasConTermino = async (termino) => {

    // Ocultar sugerencias al iniciar búsqueda
    setMostrarSugerencias(false);

    if (!termino) {
      setError('Por favor, ingresa el nombre de una carta para buscar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (termino.length > 300) {
      setError('El nombre de búsqueda no puede exceder 300 caracteres');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (termino.length < 2 && !/^\d+$/.test(termino)) {
      setError('Ingresa al menos 2 caracteres para buscar (excepto números)');
      setTimeout(() => setError(''), 3000);
      return;
    }


    if (/^\d+$/.test(termino)) {

      if (termino.length > 5) {
        setError('Los números de serie de cartas no superan los 5 dígitos (ej: 025, 150)');
        setTimeout(() => setError(''), 4000);
        return;
      }

      console.log('🔢 Búsqueda por número de serie válida:', termino);
    }


    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(termino)) {
      setError('Ingresa al menos una letra o número en el nombre de la carta');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (/(.)\1{4,}/.test(termino)) {
      setError('Evita repetir el mismo carácter más de 4 veces seguidas');
      setTimeout(() => setError(''), 4000);
      return;
    }


    const numeroAlInicio = termino.match(/^\d+/);
    if (numeroAlInicio && numeroAlInicio[0].length > 5) {
      setError('Máximo 5 números seguidos al inicio (ej: 025 Pikachu)');
      setTimeout(() => setError(''), 4000);
      return;
    }


    if (/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-'.]{3,}/.test(termino)) {
      setError('Demasiados caracteres especiales consecutivos');
      setTimeout(() => setError(''), 4000);
      return;
    }


    const palabrasProhibidas = ['test', 'admin', 'null', 'undefined', 'script', 'alert', 'hack'];
    const terminoLower = termino.toLowerCase();
    if (palabrasProhibidas.some(palabra => terminoLower.includes(palabra))) {
      setError('Término de búsqueda no válido, intenta con el nombre de una carta Pokémon');
      setTimeout(() => setError(''), 4000);
      return;
    }


    const terminoParaBuscar = normalizarTexto(termino);


    if (terminoParaBuscar === lastSearchTerm && hasSearched) {
      return;
    }

    console.log('🔍 Frontend: Buscando con término validado y normalizado:', terminoParaBuscar);
    if (termino !== terminoParaBuscar) {
      console.log('🔄 Frontend: Normalización aplicada:', termino, '→', terminoParaBuscar);
    }

    setLoading(true);
    setCartas([]);
    setError('');
    try {
      // Construcción de la URL con parámetros
      const res = await fetch(`${apiUrl}/api/cartas?nombre=${encodeURIComponent(terminoParaBuscar)}&tipo=${tipoBusqueda}`);
      const data = await res.json();

      if (data.length === 1 && data[0].sugerenciaUrl) {
        console.log('🎯 Frontend: Detectada sugerencia promocional:', data[0]);

        navigate(`/sugerencia-promocional`, {
          state: {
            sugerenciaUrl: data[0].sugerenciaUrl,
            mensaje: data[0].mensaje,
            terminoBuscado: terminoParaBuscar
          }
        });
        return;
      }

      if (data.length === 1) {

        setCartas(data);
        setCartasOriginales(data);
        setHasSearched(true);
        setLastSearchTerm(terminoParaBuscar);
        navigate(`/carta/${data[0].id}`);
      } else {
        setCartas(data);
        setCartasOriginales(data);
        setHasSearched(true);
        setLastSearchTerm(terminoParaBuscar);

        if (data.length === 0) {
          console.log('⚠️ Frontend: Búsqueda sin resultados guardada:', terminoParaBuscar);
        } else {
          console.log('✅ Frontend: Búsqueda exitosa:', data.length, 'resultado(s) para:', terminoParaBuscar);
        }
      }
    } catch (err) {
      console.error('Error al buscar cartas:', err);
      setError('Error al conectar con el servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setMostrarSugerencias(false);
      buscarCartas();
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false);
    }
  };

  const seleccionarSugerencia = (sugerencia) => {
    setNombre(sugerencia);
    setMostrarSugerencias(false);
    // Buscar inmediatamente usando la sugerencia directamente
    buscarCartasConTermino(sugerencia);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const limpiarBusqueda = () => {
    setNombre('');
    setCartas([]);
    setHasSearched(false);
    setLastSearchTerm('');
    setTerminoNormalizado('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setError('');
    sessionStorage.removeItem('pokemon-search-data');
  };

  return (
    <div className="app-container">
      {/* Logo principal de la página */}
      <div className="logo-principal">
        <img
          src={tituloWebImg}
          alt="PokéDex TCG - Centro de Entrenadores"
          className="titulo-web-img"
          onClick={() => {
            limpiarBusqueda();
            window.scrollTo(0, 0);
          }}
          style={{ cursor: 'pointer' }}
          title="Volver al inicio"
        />
      </div>

      {/* Botón de limpiar búsqueda cuando sea necesario */}
      {(hasSearched || cartas.length > 0) && (
        <div className="search-actions">
          <button
            onClick={limpiarBusqueda}
            className="btn-limpiar-busqueda"
            title="Volver al inicio"
          >
            🏠 Limpiar Búsqueda
          </button>
        </div>
      )}

      {/* Sección de búsqueda - siempre visible */}
      <div className="search-section" style={{ position: 'relative', paddingBottom: '2.5rem' }}>
        <div className="search-container">
          <div className="input-container" style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setMostrarSugerencias(sugerencias.length > 0)}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)} // Delay para permitir clicks
              placeholder="Ej: Pikachu, 025, Charizard, 150 (máx. 300 caracteres)"
              className={`search-input ${nombre.length > 280 ? 'search-input-warning' : ''}`}
              maxLength={300}
              minLength={2}
              style={{
                width: '100%',
                borderColor: nombre.length > 280 ? '#ef4444' : nombre.length > 250 ? '#f59e0b' : undefined,
                boxShadow: nombre.length > 280 ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined
              }}
            />

            {/* Contador de caracteres */}
            <div className="character-counter" style={{
              position: 'absolute',
              bottom: '-18px',
              right: '0',
              fontSize: '0.75rem',
              color: nombre.length > 280 ? '#ef4444' : nombre.length > 250 ? '#f59e0b' : '#6b7280',
              fontWeight: nombre.length > 280 ? '600' : '400'
            }}>
              {nombre.length}/300
            </div>

            {/* Lista de sugerencias */}
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div className="suggestions-dropdown">
                {sugerencias.map((sugerencia, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => seleccionarSugerencia(sugerencia)}
                  >
                    {sugerencia}
                  </div>
                ))}
              </div>
            )}
            {/* Contador de sugerencias - Absolute para evitar saltos */}
            {nombre.length >= 2 && sugerencias.length > 0 && !mostrarSugerencias && (
              <div style={{
                fontSize: '0.75rem',
                color: '#888',
                position: 'absolute',
                bottom: '-18px',
                left: '0',
                whiteSpace: 'nowrap'
              }}>
                {sugerencias.length} sugerencia{sugerencias.length !== 1 ? 's' : ''} disponible{sugerencias.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <button
            onClick={buscarCartas}
            className="search-button"
            disabled={!nombre.trim() || loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Selector de tipo de búsqueda movido aquí */}
        <div className="search-type-selector" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          margin: '15px 0 5px 0',
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

        {/* Mostrar normalización en tiempo real */}
        {nombre.trim() && terminoNormalizado && nombre.trim() !== terminoNormalizado && (
          <div className="normalization-hint" style={{
            fontSize: '0.9em',
            color: '#666',
            fontStyle: 'italic',
            position: 'absolute',
            bottom: '10px',
            left: '0',
            right: '0',
            textAlign: 'center'
          }}>
            Búsqueda será: "{terminoNormalizado}"
          </div>
        )}


      </div>

      {/* Carousels de historial - solo mostrar si no hay búsqueda activa */}
      {!hasSearched && (
        <div className="carousels-section">
          <CarouselCartas />
          <CarouselTiendas />
        </div>
      )}

      {/* Información de búsqueda y resultados */}
      {hasSearched && lastSearchTerm && (
        <>
          <div className="search-info">
            Resultados para: "<strong>{lastSearchTerm}</strong>" ({cartas.length} {cartas.length === 1 ? 'carta' : 'cartas'})
          </div>

          {/* Controles de ordenamiento - ahora debajo de los resultados */}
          {cartas.length > 0 && (
            <div className="sort-controls" style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '10px 0 20px 0',
              fontSize: '0.9rem',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
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
                    background: '#f3f4f6',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Resetear
                </button>
              )}
            </div>
          )}
        </>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading && <p className="loading-message">Buscando cartas...</p>}

      {/* Grid de resultados */}
      <div
        className="cartas-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem',
          margin: '2rem auto',
          maxWidth: '1200px',
          width: '100%',
          padding: '1rem'
        }}
      >
        {!loading && !hasSearched && <p className="no-search-message">Busca una carta para ver los resultados</p>}
        {!loading && hasSearched && cartas.length === 0 && <p className="no-results-message">No se encontraron cartas para "{lastSearchTerm}"</p>}

        {cartas.map((carta) => (
          <div
            key={carta.id}
            className="carta-item"
            onClick={() => navigate(`/carta/${carta.id}`)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e0e0',
              borderRadius: '16px',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              minHeight: '450px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <h2>{carta.nombre}</h2>
            <div className="carta-imagen-container">
              <img src={carta.imagenPequena || carta.imagenGrande} alt={carta.nombre} />
            </div>
            <div className="carta-info">
              <p><strong>Número:</strong> {carta.numero}</p>
              <p><strong>Set:</strong> {carta.set}</p>
              <p><strong>Serie:</strong> {carta.serie}</p>
              <p><strong>Rareza:</strong> {carta.rareza}</p>
              {user && (
                <button
                  onClick={(e) => initiateAddToCollection(e, carta)}
                  className="add-collection-btn"
                  style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  + Colección
                </button>
              )}
              {user && (
                <button
                  onClick={(e) => venderCarta(e, carta)}
                  style={{
                    marginTop: '5px',
                    padding: '8px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  $ Vender
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botón de volver arriba */}
      {/* Binder Selection Modal */}
      {showBinderModal && (
        <div className="modal-overlay" onClick={() => setShowBinderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Agregar a...</h3>
            <select
              className="filter-select"
              value={targetBinderId}
              onChange={e => setTargetBinderId(e.target.value)}
              style={{ width: '100%', marginBottom: '20px', padding: '10px' }}
            >
              <option value="">🗂️ Colección General</option>
              {binders.map(b => (
                <option key={b.id} value={b.id}>📁 {b.name}</option>
              ))}
            </select>
            <div style={{ textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setShowBinderModal(false)} style={{ marginRight: '10px' }}>Cancelar</button>
              <button className="btn-primary" onClick={() => addToCollection(selectedCardForBind, targetBinderId || null)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

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
