import './css/detalleCarta.css';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CartaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carta, setCarta] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargandoTiendas, setCargandoTiendas] = useState(false);
  const [hasFetchedTiendas, setHasFetchedTiendas] = useState(false);
  const [preciosPriceCharting, setPreciosPriceCharting] = useState(null);
  const [cargandoPreciosPriceCharting, setCargandoPreciosPriceCharting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // 🟡 Si se recibió una sugerencia en lugar de una carta válida
  const sugerenciaUrl = location.state?.sugerenciaUrl;
  const sugerenciaMensaje = location.state?.mensaje;
  const terminoBuscado = location.state?.terminoBuscado;

  if (sugerenciaUrl) {
    return (
      <div className="detalle-container">
        <div className="sugerencia-container">
          <h2>🔍 Carta no encontrada</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            No encontramos "<strong>{terminoBuscado}</strong>" en nuestra base de datos.
          </p>
          <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
            {sugerenciaMensaje || "Parece que esta carta es una promoción exclusiva o muy rara. Te recomendamos buscar en Pokumon.com:"}
          </p>
          <a 
            href={sugerenciaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-sugerencia"
          >
            🌐 Buscar en Pokumon.com
          </a>
          <div style={{ marginTop: '2rem' }}>
            <button 
              className="btn-volver" 
              onClick={() => navigate(-1)}
              style={{ marginRight: '1rem' }}
            >
              ← Volver atrás
            </button>
            <button 
              className="btn-volver" 
              onClick={() => navigate('/')}
            >
              🏠 Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Función para obtener el color según el tipo de Pokémon
  const getTipoColor = (tipos) => {
    if (!tipos || tipos.length === 0) return '#6c757d';
    const tipo = tipos[0].toLowerCase();
    const colores = {
      fire: '#ff6b35', water: '#3498db', grass: '#2ecc71', electric: '#f1c40f',
      psychic: '#9b59b6', ice: '#85c1e9', dragon: '#8e44ad', dark: '#34495e',
      fairy: '#fd79a8', normal: '#95a5a6', fighting: '#e74c3c', poison: '#8e44ad',
      ground: '#d4ac0d', flying: '#5dade2', bug: '#58d68d', rock: '#a6acaf',
      ghost: '#6c5ce7', steel: '#85929e'
    };
    return colores[tipo] || '#6c757d';
  };

  const getTipoIcon = (tipos) => {
    if (!tipos || tipos.length === 0) return '⭐';
    const tipo = tipos[0].toLowerCase();
    const iconos = {
      fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', psychic: '🔮',
      ice: '❄️', dragon: '🐉', dark: '🌑', fairy: '🧚', normal: '⭐',
      fighting: '👊', poison: '☠️', ground: '🌍', flying: '🌪️',
      bug: '🐛', rock: '🗿', ghost: '👻', steel: '⚔️'
    };
    return iconos[tipo] || '⭐';
  };

  useEffect(() => {
    // No ejecutar fetch si es una sugerencia promocional o no hay ID válido
    if (sugerenciaUrl || !id || id === 'undefined') {
      return;
    }
    
    fetch(`${apiUrl}/api/cartas/${id}`)
      .then(res => res.json())
      .then(data => {
        setCarta(data);
        setHasFetchedTiendas(false);
        // Obtener precios de PriceCharting si la carta ya los tiene o si han pasado más de 24 horas
        obtenerPreciosPriceCharting();
      })
      .catch(err => console.error("❌ Error al obtener carta:", err));
  }, [id, sugerenciaUrl]);

  // Actualizar título del documento cuando se carga la carta
  useEffect(() => {
    if (carta.nombre) {
      document.title = `${carta.nombre} | Pokémon TCG`;
    }
    
    // Limpiar título al desmontar el componente
    return () => {
      document.title = "Pokémon TCG";
    };
  }, [carta.nombre]);

  // Efecto para manejar el scroll y mostrar/ocultar el título en la navbar
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.carta-navbar');
      const scrolled = window.scrollY > 200; // Mostrar título después de 200px de scroll
      
      if (navbar) {
        if (scrolled) {
          navbar.classList.add('navbar-scrolled');
        } else {
          navbar.classList.remove('navbar-scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para manejar clicks en tiendas y registrar visitas
  const handleTiendaClick = async (tienda) => {
    try {
      // Registrar la visita usando el ID de la tienda
      await fetch(`${apiUrl}/api/historial/tiendas/${tienda.id}/visita`, {
        method: 'POST'
      });
      console.log(`📊 Visita registrada para tienda ${tienda.nombre} (ID: ${tienda.id})`);
    } catch (err) {
      console.error('Error al registrar visita a tienda:', err);
    }
    
    // Abrir tienda en nueva pestaña
    window.open(tienda.url, '_blank');
  };

  const obtenerPreciosPriceCharting = async (forzar = false) => {
    // No ejecutar si es una sugerencia promocional o no hay ID válido
    if (sugerenciaUrl || !id || id === 'undefined') {
      return;
    }
    
    setCargandoPreciosPriceCharting(true);
    try {
      const url = `${apiUrl}/api/cartas/${id}/precios-pricecharting${forzar ? '?forzar=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setPreciosPriceCharting(data);
        console.log('✅ Precios de PriceCharting obtenidos:', data);
        console.log('🔗 URL de PriceCharting:', data?.url);
        console.log('🔍 Tipo de URL:', typeof data?.url);
      } else {
        console.error('❌ Error al obtener precios de PriceCharting:', data.mensaje);
        setPreciosPriceCharting({ error: data.mensaje || 'Error al consultar precios' });
      }
    } catch (error) {
      console.error('❌ Error en consulta de PriceCharting:', error);
      setPreciosPriceCharting({ error: 'Error de conexión' });
    } finally {
      setCargandoPreciosPriceCharting(false);
    }
  };

  useEffect(() => {
    // No ejecutar si es una sugerencia promocional o no hay ID válido
    if (sugerenciaUrl || !id || id === 'undefined') {
      return;
    }
    
    if (!hasFetchedTiendas && carta && carta.id) {
      setCargandoTiendas(true);
      fetch(`${apiUrl}/api/cartas/${id}/tiendas`)
        .then(res => res.json())
        .then(tiendas => {
          // Convertir objeto de tiendas a array para el frontend
          const tiendasArray = Object.entries(tiendas)
            .filter(([nombre, datos]) => datos.url) // Solo tiendas con URL válida
            .map(([nombre, datos]) => ({
              id: datos.id, // ← Incluir ID de la tienda
              nombre,
              url: datos.url,
              verificada: datos.verificada,
              precio: datos.precio
            }));
          
          setCarta(prev => ({
            ...prev,
            tiendasDisponibles: tiendasArray
          }));
          setHasFetchedTiendas(true);
        })
        .catch(err => console.error("❌ Error al obtener tiendas:", err))
        .finally(() => setCargandoTiendas(false));
    }
  }, [carta, hasFetchedTiendas, id, sugerenciaUrl]);

  // Efecto para manejar la tecla ESC en el modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) { // ESC key
        setMostrarModal(false);
      }
    };
    
    if (mostrarModal) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [mostrarModal]);

  if (!carta || !carta.nombre) {
    return (
      <div className="loading-container">
        <div className="pokeball-loader"></div>
        <p>Cargando carta...</p>
      </div>
    );
  }

  const tipoColor = getTipoColor(carta.tipos);

  return (
    <div className="detalle-container">
      {/* Navbar fija */}
      <nav className="carta-navbar">
        <div className="navbar-content">
          <div className="nav-buttons">
            <button 
              className="btn-nav btn-volver" 
              onClick={() => navigate(-1)}
              title="Volver a la página anterior"
            >
              ← Volver
            </button>
            <button 
              className="btn-nav btn-home" 
              onClick={() => navigate('/')}
              title="Ir al inicio"
            >
              🏠 Inicio
            </button>
          </div>
          <div className="navbar-title">
            <span style={{ background: `linear-gradient(135deg, ${tipoColor}, ${tipoColor}dd)` }}>
              {getTipoIcon(carta.tipos)} {carta.nombre}
            </span>
          </div>
        </div>
      </nav>

      <div className="carta-detalle">
        {/* Título principal arriba de todo */}
        <div className="carta-titulo-principal">
          <h1 style={{ background: `linear-gradient(135deg, ${tipoColor}, ${tipoColor}dd)` }}>
            {getTipoIcon(carta.tipos)} {carta.nombre}
          </h1>
        </div>

        {/* Contenido principal - grid de 2 columnas: Imagen y Precios */}
        <div className="carta-contenido">
          {/* Columna izquierda: Imagen */}
          <div className="carta-imagen-seccion">
            <div className="carta-imagen">
              <img 
                src={carta.imagenGrande || carta.imagenPequena || '/placeholder-card.png'} 
                alt={carta.nombre}
                onClick={() => setMostrarModal(true)}
                style={{ cursor: 'pointer' }}
                title="Clic para ver en pantalla completa"
                onError={(e) => {
                  e.target.src = '/placeholder-card.png';
                }}
              />
            </div>
          </div>

          {/* Columna derecha: Precios - a la altura de la imagen */}
          <div className="carta-precios">
            {(carta.precioNormal || carta.precioHolofoil || preciosPriceCharting?.precioPriceCharting) && (
              <div className="precios">
                <h3>💰 Precios estimados</h3>
                
                {/* Precios TCGPlayer */}
                {(carta.precioNormal || carta.precioHolofoil) && (
                  <div className="precio-section">
                    <div className="precio-source">
                      <span className="tcgplayer-badge">📊 Precios de TCGPlayer</span>
                    </div>
                    <div className="precio-grid">
                      {carta.precioNormal && (
                        <div className="precio-item">
                          <strong>Normal:</strong> ${carta.precioNormal}
                        </div>
                      )}
                      {carta.precioHolofoil && (
                        <div className="precio-item">
                          <strong>Holofoil:</strong> ${carta.precioHolofoil}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Precios PriceCharting */}
                <div className="precio-section">
                  <div className="precio-source">
                    {(() => {
                      console.log('🔍 Debug PriceCharting:', {
                        preciosPriceCharting,
                        url: preciosPriceCharting?.url,
                        hasUrl: !!preciosPriceCharting?.url
                      });
                      return null;
                    })()}
                    {preciosPriceCharting?.url ? (
                      <a 
                        href={preciosPriceCharting.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="pricecharting-badge pricecharting-link"
                        title="Ver en PriceCharting (abre en nueva pestaña)"
                      >
                        📈 PriceCharting
                      </a>
                    ) : (
                      <span className="pricecharting-badge">📈 PriceCharting</span>
                    )}
                    {!cargandoPreciosPriceCharting && preciosPriceCharting && !preciosPriceCharting.error && (
                      <button 
                        className="btn-actualizar-precios"
                        onClick={() => obtenerPreciosPriceCharting(true)}
                        title="Actualizar precio de PriceCharting"
                      >
                        🔄
                      </button>
                    )}
                  </div>
                  
                  {cargandoPreciosPriceCharting && (
                    <div className="loading-precios">
                      <div className="spinner"></div>
                      <span>Consultando PriceCharting...</span>
                    </div>
                  )}
                  
                  {!cargandoPreciosPriceCharting && preciosPriceCharting && (
                    <>
                      {preciosPriceCharting.error ? (
                        <div className="precio-error">
                          ⚠️ {preciosPriceCharting.error}
                          <button 
                            className="btn-reintentar"
                            onClick={() => obtenerPreciosPriceCharting(true)}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : (
                        <>
                          {preciosPriceCharting.precioPriceCharting ? (
                            <div className="precio-grid">
                              <div className="precio-item">
                                <strong>Precio actual:</strong> ${preciosPriceCharting.precioPriceCharting}
                              </div>
                            </div>
                          ) : (
                            <div className="precio-no-disponible">
                              📭 No se encontró precio en PriceCharting
                              {preciosPriceCharting.url && (
                                <a 
                                  href={preciosPriceCharting.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn-ver-en-sitio"
                                >
                                  Ver en PriceCharting
                                </a>
                              )}
                            </div>
                          )}
                          
                          {preciosPriceCharting.fechaActualizacion && (
                            <div className="precio-timestamp">
                              🕒 Actualizado: {new Date(preciosPriceCharting.fechaActualizacion).toLocaleString()}
                              {preciosPriceCharting.desde_cache && " (desde caché)"}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  
                  {!cargandoPreciosPriceCharting && !preciosPriceCharting && (
                    <div className="precio-no-consultado">
                      <button 
                        className="btn-consultar-precios"
                        onClick={() => obtenerPreciosPriceCharting(false)}
                      >
                        🔍 Consultar precio en PriceCharting
                      </button>
                    </div>
                  )}
                </div>

                <p className="precio-disclaimer">
                  💡 Los precios son referenciales y pueden variar según la condición y disponibilidad.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tiendas disponibles - sección independiente debajo de imagen y precios */}
        <div className="tiendas-seccion-completa">
          <div className="precios">
            <h3>🏪 Disponibilidad en tiendas</h3>
            {cargandoTiendas ? (
              <p>Cargando tiendas...</p>
            ) : carta.tiendasDisponibles && carta.tiendasDisponibles.length > 0 ? (
              <div className="tiendas-grid">
                {carta.tiendasDisponibles.map((tienda, index) => (
                  <div key={index} className="tienda-item">
                    <div className="tienda-info">
                      {tienda.logo ? (
                        <div className="tienda-logo-section">
                          <img 
                            src={tienda.logo} 
                            alt={`Logo ${tienda.nombre}`}
                            className="tienda-logo-small"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'inline';
                            }}
                          />
                          <span className="tienda-nombre-fallback" style={{ display: 'none' }}>
                            🏪
                          </span>
                        </div>
                      ) : (
                        <span className="tienda-icon">🏪</span>
                      )}
                      <button 
                        onClick={() => handleTiendaClick(tienda)}
                        className="tienda-link"
                      >
                        {tienda.nombre}
                      </button>
                    </div>
                    <div className="tienda-details">
                      {tienda.precio && (
                        <span className="tienda-precio">${tienda.precio}</span>
                      )}
                      {tienda.verificada && (
                        <span className="tienda-verificada">✅ Verificada</span>
                      )}
                      {tienda.valoracion && (
                        <span className="tienda-valoracion">⭐ {tienda.valoracion}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-tiendas">No hay tiendas disponibles para esta carta.</p>
            )}
          </div>
        </div>

        {/* Información adicional - debajo de imagen y precios */}
        <div className="carta-info-adicional">
          <div className="precios">
            <h3>📋 Información básica</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Número:</strong> {carta.numero}
              </div>
              <div className="info-item">
                <strong>Set:</strong> {carta.set}
              </div>
              {carta.serie && (
                <div className="info-item">
                  <strong>Serie:</strong> {carta.serie}
                </div>
              )}
              {carta.rareza && (
                <div className="info-item">
                  <strong>Rareza:</strong> {carta.rareza}
                </div>
              )}
              {carta.hp && (
                <div className="info-item">
                  <strong>HP:</strong> {carta.hp}
                </div>
              )}
              {carta.tipos && carta.tipos.length > 0 && (
                <div className="info-item">
                  <strong>Tipos:</strong> {carta.tipos.join(', ')}
                </div>
              )}
              {carta.ilustrador && (
                <div className="info-item">
                  <strong>Ilustrador:</strong> {carta.ilustrador}
                </div>
              )}
            </div>
          </div>

          {/* Ataques */}
          {carta.ataques && carta.ataques.length > 0 && (
            <div className="precios">
              <h3>⚔️ Ataques</h3>
              <div className="ataques-lista">
                {carta.ataques.map((ataque, index) => (
                  <div key={index} className="ataque-item">
                    <div className="ataque-nombre">
                      <strong>{ataque.name}</strong>
                      {ataque.damage && <span className="damage">• {ataque.damage}</span>}
                    </div>
                    {ataque.text && (
                      <div className="ataque-descripcion">{ataque.text}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagen en pantalla completa */}
      {mostrarModal && (
        <div 
          className="modal-overlay"
          onClick={() => setMostrarModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setMostrarModal(false)}
              title="Cerrar (ESC)"
            >
              ✕
            </button>
            <img 
              src={carta.imagenGrande || carta.imagenPequena || '/placeholder-card.png'}
              alt={carta.nombre}
              className="modal-image"
              onError={(e) => {
                e.target.src = '/placeholder-card.png';
              }}
            />
            <div className="modal-info">
              <h3>{carta.nombre}</h3>
              <p>{carta.numero} • {carta.set}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
