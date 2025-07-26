import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/BuscarCarta.css';
import { obtenerSugerencias, normalizarTexto } from './utils/sugerencias';
import CarouselCartas from './CarouselCartas';
import CarouselTiendas from './CarouselTiendas';
import tituloWebImg from './assets/tituloWeb.jpg';

export default function BuscarCartas() {
  const [nombre, setNombre] = useState('');
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [terminoNormalizado, setTerminoNormalizado] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

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
      const nuevasSugerencias = obtenerSugerencias(nombre);
      setSugerencias(nuevasSugerencias);
      setMostrarSugerencias(nuevasSugerencias.length > 0);
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

  const buscarCartas = async () => {
    const termino = nombre.trim();
    
    // 🛡️ VALIDACIONES DE ENTRADA PARA EVITAR BÚSQUEDAS BASURA
    
    // 1. Verificar que haya texto
    if (!termino) {
      setError('Por favor, ingresa el nombre de una carta para buscar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // 2. Límite de 300 caracteres
    if (termino.length > 300) {
      setError('El nombre de búsqueda no puede exceder 300 caracteres');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // 3. Mínimo 2 caracteres para texto, pero permitir números de 1 dígito
    if (termino.length < 2 && !/^\d+$/.test(termino)) {
      setError('Ingresa al menos 2 caracteres para buscar (excepto números)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // 4. Validación inteligente de números
    if (/^\d+$/.test(termino)) {
      // Permitir números, pero con restricciones específicas para cartas TCG
      if (termino.length > 5) {
        setError('Los números de serie de cartas no superan los 5 dígitos (ej: 025, 150)');
        setTimeout(() => setError(''), 4000);
        return;
      }
      // Permitir números de 1-5 dígitos (números de cartas válidos)
      console.log('🔢 Búsqueda por número de serie válida:', termino);
    }

    // 5. Evitar solo caracteres especiales o espacios (pero permitir números puros)
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(termino)) {
      setError('Ingresa al menos una letra o número en el nombre de la carta');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // 6. Evitar repetición excesiva del mismo carácter (aaaaaaa, 1111111)
    if (/(.)\1{4,}/.test(termino)) {
      setError('Evita repetir el mismo carácter más de 4 veces seguidas');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // 7. Validación especial para números al inicio (máximo 5 dígitos seguidos)
    const numeroAlInicio = termino.match(/^\d+/);
    if (numeroAlInicio && numeroAlInicio[0].length > 5) {
      setError('Máximo 5 números seguidos al inicio (ej: 025 Pikachu)');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // 8. Evitar demasiados caracteres especiales consecutivos
    if (/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-'.]{3,}/.test(termino)) {
      setError('Demasiados caracteres especiales consecutivos');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // 9. Filtrar palabras inapropiadas básicas
    const palabrasProhibidas = ['test', 'admin', 'null', 'undefined', 'script', 'alert', 'hack'];
    const terminoLower = termino.toLowerCase();
    if (palabrasProhibidas.some(palabra => terminoLower.includes(palabra))) {
      setError('Término de búsqueda no válido, intenta con el nombre de una carta Pokémon');
      setTimeout(() => setError(''), 4000);
      return;
    }

    // Usar el término normalizado para la búsqueda
    const terminoParaBuscar = terminoNormalizado || termino;

    // Solo buscar si el término es diferente al último buscado
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
      const res = await fetch(`${apiUrl}/api/cartas?nombre=${encodeURIComponent(terminoParaBuscar)}`);
      const data = await res.json();

      // 🔍 Verificar si es una sugerencia promocional
      if (data.length === 1 && data[0].sugerenciaUrl) {
        console.log('🎯 Frontend: Detectada sugerencia promocional:', data[0]);
        // Navegar a página de detalle con sugerencia
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
        // Guardar el estado antes de navegar
        setCartas(data);
        setHasSearched(true);
        setLastSearchTerm(terminoParaBuscar);
        navigate(`/carta/${data[0].id}`);
      } else {
        setCartas(data);
        setHasSearched(true);
        setLastSearchTerm(terminoParaBuscar);
        
        // Log específico para búsquedas sin resultados
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
    // Opcional: buscar automáticamente
    // buscarCartas();
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
      {/* Header con título y botón home */}
      <div className="app-header">
        <img 
          src={tituloWebImg} 
          alt="PokéDex TCG - Centro de Entrenadores" 
          className="titulo-web-img"
        />
        {(hasSearched || cartas.length > 0) && (
          <button 
            onClick={limpiarBusqueda} 
            className="home-button"
            title="Volver al inicio"
          >
            🏠 Inicio
          </button>
        )}
      </div>

      {/* Sección de búsqueda - siempre visible */}
      <div className="search-section">
        <div className="search-container" style={{ position: 'relative' }}>
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
            <div className="suggestions-dropdown" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {sugerencias.map((sugerencia, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: index < sugerencias.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '0.9em'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  onClick={() => seleccionarSugerencia(sugerencia)}
                >
                  {sugerencia}
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={buscarCartas} 
            className="search-button"
            disabled={!nombre.trim() || loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Mostrar normalización en tiempo real */}
        {nombre.trim() && terminoNormalizado && nombre.trim() !== terminoNormalizado && (
          <div className="normalization-hint" style={{ 
            fontSize: '0.9em', 
            color: '#666', 
            marginTop: '5px',
            fontStyle: 'italic'
          }}>
            Búsqueda será: "{terminoNormalizado}"
          </div>
        )}

        {/* Mostrar contador de sugerencias */}
        {nombre.length >= 2 && sugerencias.length > 0 && !mostrarSugerencias && (
          <div style={{ 
            fontSize: '0.8em', 
            color: '#888', 
            marginTop: '3px' 
          }}>
            {sugerencias.length} sugerencia{sugerencias.length !== 1 ? 's' : ''} disponible{sugerencias.length !== 1 ? 's' : ''} - Haz click en el campo para verlas
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
        <div className="search-info">
          Resultados para: "<strong>{lastSearchTerm}</strong>" ({cartas.length} {cartas.length === 1 ? 'carta' : 'cartas'})
        </div>
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
            </div>
          </div>
        ))}
      </div>

      {/* Botón de volver arriba */}
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
