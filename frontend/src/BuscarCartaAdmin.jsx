import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/BuscarCarta.css';
import './css/BuscarCartaAdmin.css';
import tituloWebImg from './assets/tituloWeb.png';
import { getSpellingSuggestion } from './utils/similarity';

export default function BuscarCartasAdmin() {
  const [activeTab, setActiveTab] = useState('importar'); // 'importar' o 'coleccionar'
  const [nombre, setNombre] = useState('');
  const [cartasAPI, setCartasAPI] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('carta');
  const [supertipo, setSupertipo] = useState('');
  
  // Selección múltiple
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());
  
  // Estados para base de datos
  const [resultadoActualizacion, setResultadoActualizacion] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  
  // Estados para colecciones (Tab 2)
  const [binders, setBinders] = useState([]);
  const [targetBinder, setTargetBinder] = useState('');
  const [loadingBinders, setLoadingBinders] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 20;

  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = activeTab === 'importar' ? "🔌 Actualizador de BD" : "🗂️ Gestión de Colección Admin";
    
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Manejo de cambio de pestañas
  useEffect(() => {
    setCartasAPI([]);
    setError('');
    setResultadoActualizacion(null);
    setSelectedCards(new Set());
    setNombre('');
    setSupertipo('');
    setIsMultiSelectMode(false); // Reinicia el modo de selección por defecto
    setCurrentPage(1);
  }, [activeTab]);

  // Resetear página cuando cambian los resultados
  useEffect(() => {
    setCurrentPage(1);
  }, [cartasAPI]);

  const cargarCarpetas = async () => {
    setLoadingBinders(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/collection/binders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBinders(data);
      }
    } catch (e) {
      console.error("Error cargando carpetas:", e);
    } finally {
      setLoadingBinders(false);
    }
  };

  const crearNuevaCarpeta = async () => {
    const { value: nombreCarpeta } = await Swal.fire({
      title: 'Crear nueva carpeta',
      input: 'text',
      inputLabel: 'Nombre de la carpeta',
      inputPlaceholder: 'Ej: Entrenadores Raros',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (nombreCarpeta && nombreCarpeta.trim()) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/collection/binders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: nombreCarpeta.trim() })
        });
        if (res.ok) {
          const nueva = await res.json();
          setBinders([...binders, nueva]);
          setTargetBinder(nueva.id);
          Swal.fire('¡Éxito!', 'Carpeta creada correctamente', 'success');
        } else {
          throw new Error();
        }
      } catch (e) {
        Swal.fire('Error', 'No se pudo crear la carpeta', 'error');
      }
    }
  };

  const buscarEnAPI = async (overrideTerm) => {
    const terminoParaBuscar = typeof overrideTerm === 'string' ? overrideTerm : nombre;
    if (!terminoParaBuscar.trim() && !supertipo) {
      setError('Por favor ingresa un término de búsqueda o selecciona un tipo de carta');
      return;
    }

    setLoading(true);
    setError('');
    setCartasAPI([]);
    setResultadoActualizacion(null);
    setSelectedCards(new Set());
    setLastSearchTerm(terminoParaBuscar);

    try {
      const origenParam = activeTab === 'coleccionar' ? 'bd' : 'api';
      console.log(`🔧 Buscando "${terminoParaBuscar}" con tipo: "${tipoBusqueda}", supertipo: "${supertipo}", origen: "${origenParam}"...`);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/cartas/admin?nombre=${encodeURIComponent(terminoParaBuscar)}&tipo=${tipoBusqueda}&supertipo=${supertipo}&origen=${origenParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const cartas = await response.json();
      console.log(`✅ Búsqueda finalizó. Encontró ${cartas.length} cartas`);
      setCartasAPI(cartas);

      // Cargar carpetas si el admin realiza una búsqueda en la pestaña de colección
      if (activeTab === 'coleccionar') {
        cargarCarpetas();
      }

    } catch (err) {
      console.error('❌ Error buscando:', err);
      setError('Error al buscar cartas');
    } finally {
      setLoading(false);
    }
  };

  const actualizarBD = async () => {
    const cartasParaEnviar = isMultiSelectMode && selectedCards.size > 0
      ? cartasAPI.filter((_, idx) => selectedCards.has(idx))
      : cartasAPI;

    if (cartasParaEnviar.length === 0) {
      setError('Por favor selecciona al menos una carta para actualizar');
      return;
    }

    setActualizando(true);
    setResultadoActualizacion(null);
    setError('');

    try {
      console.log(`💾 Enviando ${cartasParaEnviar.length} cartas para actualizar BD...`);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/cartas/actualizar-bd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartas: cartasParaEnviar })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la base de datos');
      }

      const resultado = await response.json();
      console.log('✅ BD actualizada:', resultado);
      setResultadoActualizacion(resultado);
      
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

  const initiateSingleAddToCollection = async (e, carta) => {
    e.stopPropagation();
    
    // Construir desplegable de binders para SweetAlert2
    const optionsHtml = `
      <select id="swal-binder-select" class="swal2-select" style="display: flex; margin: 10px auto; min-width: 200px;">
        <option value="">🗂️ Colección General</option>
        ${binders.map(b => `<option value="${b.id}">📂 ${b.name}</option>`).join('')}
      </select>
    `;

    const { value: binderId } = await Swal.fire({
      title: `Agregar a Colección`,
      html: `
        <p>Selecciona la carpeta para agregar <strong>${carta.nombre}</strong>:</p>
        ${optionsHtml}
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const select = document.getElementById('swal-binder-select');
        return select ? select.value : '';
      }
    });

    if (binderId !== undefined) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/collection/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cartaId: carta.id,
            binderId: binderId || null,
            isOwned: true
          })
        });
        if (res.ok) {
          Swal.fire('¡Éxito!', `¡${carta.nombre} agregada a tu colección!`, 'success');
        } else {
          throw new Error();
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo agregar la carta a tu colección', 'error');
      }
    }
  };

  const agregarVariosAColeccion = async () => {
    if (selectedCards.size === 0) {
      Swal.fire('Atención', 'Selecciona al menos una carta para agregar', 'warning');
      return;
    }

    setIsAddingToCollection(true);
    try {
      const token = localStorage.getItem('token');
      const promesas = Array.from(selectedCards).map(index => {
        const carta = cartasAPI[index];
        return fetch(`${apiUrl}/api/collection/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cartaId: carta.id,
            binderId: targetBinder || null,
            isOwned: true
          })
        }).catch(err => console.error("Error al agregar carta:", carta.nombre, err));
      });

      await Promise.all(promesas);
      
      Swal.fire({
        title: '¡Éxito!',
        text: `Se agregaron ${selectedCards.size} cartas a tu colección exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#28a745'
      });

      setSelectedCards(new Set());
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema al agregar algunas cartas', 'error');
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const limpiarBusqueda = () => {
    setNombre('');
    setSupertipo('');
    setSelectedCards(new Set());
    setCartasAPI([]);
    setError('');
    setResultadoActualizacion(null);
    setLastSearchTerm('');
  };

  const toggleCardSelection = (index) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedCards(newSelection);
  };

  const seleccionarTodas = () => {
    if (selectedCards.size === cartasAPI.length) {
      setSelectedCards(new Set());
    } else {
      const allIndexes = cartasAPI.map((_, idx) => idx);
      setSelectedCards(new Set(allIndexes));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    navigate('/');
  };

  // Cálculo de paginación
  const totalPages = Math.ceil(cartasAPI.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = cartasAPI.slice(indexOfFirstCard, indexOfLastCard);

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
        <div className="admin-header" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
          <h1>⚙️ Panel de Administración</h1>
          <p>Herramientas avanzadas de base de datos y colecciones</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="admin-tabs-header">
        <button 
          onClick={() => setActiveTab('importar')}
          className={`admin-tab-btn ${activeTab === 'importar' ? 'active' : ''}`}
        >
          🔌 Importar & Sincronizar (API)
        </button>
        <button 
          onClick={() => setActiveTab('coleccionar')}
          className={`admin-tab-btn ${activeTab === 'coleccionar' ? 'active' : ''}`}
        >
          🗂️ Agregar a Colección (BD Local)
        </button>
      </div>

      {/* Botón limpiar */}
      <div className="search-actions">
        <button onClick={limpiarBusqueda} className="btn-limpiar-busqueda">
          🧹 Limpiar Campos
        </button>
        <button onClick={goHome} className="home-button">
          🏠 Volver al Inicio
        </button>
      </div>

      {/* Sección de búsqueda */}
      <div className="search-section" style={{ border: activeTab === 'coleccionar' ? '1px solid rgba(40, 167, 69, 0.2)' : '' }}>
        <div className="search-container">
          <div className="input-container">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={activeTab === 'coleccionar' ? "Buscar cartas en la base de datos por nombre..." : "Buscar cartas en API de Pokémon TCG..."}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && buscarEnAPI()}
            />
          </div>

          <div className="select-container">
            <select
              value={supertipo}
              onChange={(e) => setSupertipo(e.target.value)}
              className="supertipo-select"
            >
              <option value="">🔮 Todos los tipos</option>
              <option value="Pokémon">🐉 Pokémon</option>
              <option value="Trainer">🎒 Entrenadores (Trainer)</option>
              <option value="Energy">⚡ Energías (Energy)</option>
            </select>
          </div>
          
          <button 
            onClick={buscarEnAPI}
            disabled={loading || (!nombre.trim() && !supertipo)}
            className="search-button"
            style={{
              background: activeTab === 'coleccionar' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : ''
            }}
          >
            {loading ? '🔍 Buscando...' : (activeTab === 'coleccionar' ? '💾 Buscar en BD' : '🔍 Buscar en API')}
          </button>
        </div>

        {/* Selector de tipo de búsqueda */}
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

      {/* Alerta de sin resultados con sugerencia ortográfica */}
      {!loading && lastSearchTerm && cartasAPI.length === 0 && !resultadoActualizacion && (
        <div className="no-results-warning" style={{
          gridColumn: '1 / -1',
          background: 'white',
          borderLeft: '5px solid #ff9800',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          textAlign: 'left',
          maxWidth: '600px',
          margin: '20px auto',
          color: '#4a5568'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
            ⚠️ Búsqueda sin resultados
          </h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
            No encontramos cartas para "<strong>{lastSearchTerm}</strong>" {activeTab === 'coleccionar' ? 'en la base de datos local' : 'en la API de Pokémon TCG'}.
          </p>

          {(() => {
            const sugerencia = getSpellingSuggestion(lastSearchTerm);
            if (sugerencia) {
              return (
                <div style={{
                  margin: '15px 0',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#0369a1', fontWeight: 'bold' }}>🔮 ¿Quizás quisiste decir:</span>
                  <button
                    onClick={() => {
                      setNombre(sugerencia);
                      buscarEnAPI(sugerencia);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontWeight: '800',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: 0
                    }}
                  >
                    {sugerencia}
                  </button>
                  <span style={{ color: '#0369a1', fontWeight: 'bold' }}>?</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Tab 1: Botón para actualizar BD */}
      {activeTab === 'importar' && cartasAPI.length > 0 && (
        <div className="update-section">
          <div className="update-info">
            <h3>📡 Cartas encontradas en API: {cartasAPI.length}</h3>
            <p>Puedes activar la selección múltiple para guardar solo las cartas que elijas, o actualizarlas todas en lote</p>
          </div>
          
          <div className="action-buttons-container">
            <button 
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedCards(new Set());
              }}
              className={`btn-admin-action ${isMultiSelectMode ? 'toggle-active' : 'toggle-inactive'}`}
            >
              {isMultiSelectMode ? '🚫 Cancelar Selección' : '☑️ Selección Múltiple'}
            </button>

            {isMultiSelectMode && (
              <button 
                onClick={seleccionarTodas}
                className="btn-admin-action select-all"
              >
                {selectedCards.size === cartasAPI.length ? '🔲 Deseleccionar' : '☑️ Seleccionar Todas'}
              </button>
            )}

            <button 
              onClick={actualizarBD}
              disabled={actualizando}
              className="update-button"
              style={{ margin: 0 }}
            >
              {actualizando 
                ? '💾 Guardando...' 
                : isMultiSelectMode && selectedCards.size > 0 
                  ? `💾 Guardar Seleccionadas (${selectedCards.size})` 
                  : `💾 Guardar Todo (${cartasAPI.length})`
              }
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Botón para añadir a Colecciones */}
      {activeTab === 'coleccionar' && cartasAPI.length > 0 && (
        <div className="update-section" style={{ border: '2px solid #28a745', background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%)' }}>
          <div className="update-info">
            <h3 style={{ color: '#155724' }}>🗂️ Agregar a Colección</h3>
            <p style={{ color: '#155724' }}>Usa la selección múltiple para guardar varias cartas juntas, o agrégalas de forma individual</p>
          </div>

          <div className="action-buttons-container" style={{ borderColor: 'rgba(40, 167, 69, 0.3)', background: 'rgba(255, 255, 255, 0.7)' }}>
            <button 
              onClick={crearNuevaCarpeta}
              className="btn-admin-action select-all"
              style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', boxShadow: '0 4px 15px rgba(40, 167, 69, 0.2)' }}
            >
              ➕ Crear Carpeta
            </button>

            <button 
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedCards(new Set());
              }}
              className={`btn-admin-action ${isMultiSelectMode ? 'toggle-active' : 'toggle-inactive'}`}
              style={!isMultiSelectMode ? { background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', boxShadow: '0 4px 15px rgba(40, 167, 69, 0.2)' } : {}}
            >
              {isMultiSelectMode ? '🚫 Cancelar Selección' : '☑️ Selección Múltiple'}
            </button>

            {isMultiSelectMode && (
              <button 
                onClick={seleccionarTodas}
                className="btn-admin-action select-all"
                style={{ background: '#34495e' }}
              >
                {selectedCards.size === cartasAPI.length ? '🔲 Deseleccionar' : '☑️ Seleccionar Todas'}
              </button>
            )}

            {isMultiSelectMode && (
              <div className="select-container" style={{ minWidth: '220px' }}>
                <select
                  value={targetBinder}
                  onChange={(e) => setTargetBinder(e.target.value)}
                  className="supertipo-select"
                  style={{ borderColor: '#28a745', cursor: 'pointer' }}
                >
                  <option value="">🗂️ Colección General</option>
                  {binders.map(b => (
                    <option key={b.id} value={b.id}>📂 {b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isMultiSelectMode && (
              <button 
                onClick={agregarVariosAColeccion}
                disabled={isAddingToCollection || selectedCards.size === 0}
                className="update-button"
                style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', margin: 0, boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)' }}
              >
                {isAddingToCollection 
                  ? '💾 Guardando...' 
                  : `✅ Agregar Seleccionadas (${selectedCards.size})`
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resultado de actualización (Solo Tab 1) */}
      {activeTab === 'importar' && resultadoActualizacion && (
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

      {/* Vista previa de cartas */}
      {cartasAPI.length > 0 && !resultadoActualizacion && (
        <>
          <div className="search-info" style={{ borderLeftColor: activeTab === 'coleccionar' ? '#28a745' : '#ff6b35', background: activeTab === 'coleccionar' ? 'linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%)' : '' }}>
            {activeTab === 'coleccionar' ? '💾' : '🎮'} Mostrando {indexOfFirstCard + 1}-{Math.min(indexOfLastCard, cartasAPI.length)} de {cartasAPI.length} cartas {activeTab === 'coleccionar' ? 'encontradas en tu Base de Datos local' : 'desde la API de Pokémon TCG'}
          </div>
          
          <div className="cartas-grid">
            {currentCards.map((carta, indexOnPage) => {
              const globalIndex = (currentPage - 1) * cardsPerPage + indexOnPage;
              return (
                <div 
                  key={`${carta.numero}-${carta.set}-${globalIndex}`} 
                  className={`carta-item ${carta.origen === 'BD' ? 'bd-carta' : 'api-carta'} ${isMultiSelectMode && selectedCards.has(globalIndex) ? 'selected' : ''}`}
                  onClick={() => isMultiSelectMode && toggleCardSelection(globalIndex)}
                  style={isMultiSelectMode ? { 
                    border: selectedCards.has(globalIndex) ? (activeTab === 'coleccionar' ? '3px solid #28a745' : '3px solid #ff6b35') : '2px dashed #bbb', 
                    cursor: 'pointer',
                    transform: selectedCards.has(globalIndex) ? 'scale(1.02)' : 'none',
                    boxShadow: selectedCards.has(globalIndex) ? (activeTab === 'coleccionar' ? '0 8px 30px rgba(40, 167, 69, 0.25)' : '0 8px 30px rgba(255, 107, 53, 0.25)') : 'none'
                  } : {}}
                >
                  {isMultiSelectMode && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCards.has(globalIndex)} 
                        onChange={() => {}} // Manejado por el click en la carta
                        style={{ 
                          transform: 'scale(1.8)', 
                          cursor: 'pointer',
                          accentColor: activeTab === 'coleccionar' ? '#28a745' : '#ff6b35'
                        }}
                      />
                    </div>
                  )}
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
                    
                    {/* Botón de añadir individualmente (solo en pestaña Colección y modo Selección inactivo) */}
                    {activeTab === 'coleccionar' && !isMultiSelectMode && (
                      <button
                        onClick={(e) => initiateSingleAddToCollection(e, carta)}
                        className="btn-admin-action"
                        style={{
                          marginTop: '10px',
                          padding: '8px',
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          color: 'white',
                          fontSize: '0.85rem',
                          width: '100%',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)'
                        }}
                      >
                        ➕ Agregar a Colección
                      </button>
                    )}

                    <div className="carta-origen" style={{ marginTop: activeTab === 'coleccionar' && !isMultiSelectMode ? '8px' : '0.5rem' }}>
                      {carta.origen === 'BD' ? (
                        <span className="origen-bd">💾 En BD Local</span>
                      ) : (
                        <span className="origen-api">📡 Desde API</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Componente de Paginación Premium */}
          {totalPages > 1 && (
            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '2rem 0', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-admin-action"
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? '#ccc' : (activeTab === 'coleccionar' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'),
                  color: 'white',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ◀ Anterior
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Limitar números mostrados para no saturar la pantalla
                if (totalPages > 8 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} style={{ padding: '8px', color: '#777', fontWeight: 'bold' }}>...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className="btn-admin-action"
                    style={{
                      padding: '8px 14px',
                      background: currentPage === pageNum ? '#34495e' : 'transparent',
                      border: currentPage === pageNum ? 'none' : `1px solid ${activeTab === 'coleccionar' ? '#28a745' : '#ff6b35'}`,
                      color: currentPage === pageNum ? 'white' : (activeTab === 'coleccionar' ? '#28a745' : '#ff6b35'),
                      fontSize: '0.9rem',
                      borderRadius: '8px'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-admin-action"
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? '#ccc' : (activeTab === 'coleccionar' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'),
                  color: 'white',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Scroll to top */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="scroll-to-top"
          aria-label="Volver arriba"
          style={{ background: activeTab === 'coleccionar' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '' }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
