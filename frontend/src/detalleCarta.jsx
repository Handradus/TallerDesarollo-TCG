import './css/detalleCarta.css';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from './context/AuthContext';

export default function CartaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carta, setCarta] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalColeccion, setMostrarModalColeccion] = useState(false);
  const [binders, setBinders] = useState([]);
  const [selectedBinder, setSelectedBinder] = useState('');
  const [cargandoTiendas, setCargandoTiendas] = useState(false);
  const [hasFetchedTiendas, setHasFetchedTiendas] = useState(false);
  const [preciosPriceCharting, setPreciosPriceCharting] = useState(null);
  const [cargandoPreciosPriceCharting, setCargandoPreciosPriceCharting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuth();

  const fetchBinders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/api/collection/binders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBinders(res.data);
    } catch (error) {
      console.error('Error fetching binders:', error);
    }
  };

  const abrirModalColeccion = () => {
    if (!user) return alert('Debes iniciar sesión');
    fetchBinders();
    setMostrarModalColeccion(true);
  };

  const confirmarAgregarColeccion = async (forceAdd = false) => {
    try {
      const token = localStorage.getItem('token');
      const payload = { cartaId: carta.id, isOwned: true, forceAdd };
      if (selectedBinder) {
        payload.binderId = selectedBinder;
      }
      
      await axios.post(`${apiUrl}/api/collection/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Carta agregada a tu colección!');
      setMostrarModalColeccion(false);
      setSelectedBinder('');
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        if (window.confirm(error.response.data.error || 'Ya tienes esta carta. ¿Deseas agregarla de todas formas?')) {
          confirmarAgregarColeccion(true);
        }
      } else if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Error al agregar carta');
      }
    }
  };

  const agregarDeseado = async () => {
    if (!user) return alert('Debes iniciar sesión');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/api/collection/add`,
        { cartaId: carta.id, isOwned: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Carta agregada a tus deseados!');
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.message === 'Item already owned') {
        alert('Ya tienes esta carta en tu colección.');
      } else {
        alert('Error al agregar a deseados');
      }
    }
  };

  const venderCarta = () => {
    if (!user) return alert('Debes iniciar sesión');
    navigate('/mi-tienda', { state: { sellCard: carta } });
  };

  const limpiarCacheTiendas = async () => {
    if (!window.confirm('\u00bfBorrar el caché de tiendas para esta carta? Se volverá a scrapear la próxima vez que alguien la consulte.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${apiUrl}/api/cartas/${id}/tiendas/cache`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`\u2705 ${res.data.mensaje}`);
      // Forzar re-fetch de tiendas
      setHasFetchedTiendas(false);
      setCarta(prev => ({ ...prev, tiendasDisponibles: undefined }));
    } catch (error) {
      console.error(error);
      alert('Error al borrar caché');
    }
  };

  // 🟡 Si se recibió una sugerencia en lugar de una carta válida
  const sugerenciaUrl = location.state?.sugerenciaUrl;
  const sugerenciaMensaje = location.state?.mensaje;
  const terminoBuscado = location.state?.terminoBuscado;

  if (sugerenciaUrl) {
    const terminoProcesado = terminoBuscado ? terminoBuscado.replace(/\bpromo\b/gi, '').replace(/\s+/g, ' ').trim() : '';
    return (
      <div className="detalle-container">
        <div className="sugerencia-container">
          <h2>🔍 Carta no encontrada</h2>
          <p className="sugerencia-intro">
            No encontramos "<strong>{terminoBuscado}</strong>" en nuestra base de datos.
          </p>
          <p className="sugerencia-mensaje">
            {sugerenciaMensaje || "Parece que esta carta es una promoción exclusiva o muy rara. Te recomendamos buscar en PriceCharting o Pokumon.com:"}
          </p>
          <div className="sugerencia-acciones">
            <a
              href={`https://www.pricecharting.com/search-products?q=${encodeURIComponent(terminoProcesado)}&type=prices`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sugerencia btn-sugerencia-price"
            >
              📈 Buscar en PriceCharting
            </a>
            <a
              href={`https://pokumon.com/cards?search=${encodeURIComponent(terminoProcesado)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sugerencia btn-sugerencia-pokumon"
            >
              🌐 Buscar en Pokumon.com
            </a>
          </div>
          <div className="sugerencia-nav">
            <button
              className="btn-volver"
              onClick={() => navigate(-1)}
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
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
            .filter(([nombre, datos]) => datos.url && datos.disponible !== false) // Solo tiendas con URL válida y stock disponible
            .map(([nombre, datos]) => ({
              id: datos.id, // ← Incluir ID de la tienda
              nombre,
              url: datos.url,
              verificada: datos.verificada,
              precio: datos.precio,
              disponible: datos.disponible !== undefined ? datos.disponible : true
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

        {/* Action Buttons for User */}
        {user && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <button
              onClick={abrirModalColeccion}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '1.2rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              + Agregar a Colección
            </button>
            <button
              onClick={agregarDeseado}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '1.2rem', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              title="Marcar como 'Lo Quiero' (se mostrará gris en tu colección)"
            >
              ❤️ Lo Quiero
            </button>
            <button
              onClick={venderCarta}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '1.2rem', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              $ Vender Carta
            </button>
          </div>
        )}

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
                    {!cargandoPreciosPriceCharting && preciosPriceCharting && !preciosPriceCharting.error && user?.role === 'admin' && (
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
                          {user?.role === 'admin' && (
                            <button
                              className="btn-reintentar"
                              onClick={() => obtenerPreciosPriceCharting(true)}
                            >
                              Reintentar
                            </button>
                          )}
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

        {/* Tiendas disponibles - sección independiente debajo de imagen y precios */}
        <div className="tiendas-seccion-completa">
          <div className="precios">
            <h3>🏪 Disponibilidad en tiendas
              {user?.role === 'admin' && (
                <button
                  onClick={limpiarCacheTiendas}
                  title="Borrar caché de precios y re-scrapear"
                  style={{
                    marginLeft: '12px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    verticalAlign: 'middle',
                    fontWeight: 'bold'
                  }}
                >
                  🗑️ Borrar caché
                </button>
              )}
            </h3>
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

      {/* Modal para elegir carpeta al agregar a colección */}
      {mostrarModalColeccion && (
        <div className="modal-overlay" onClick={() => setMostrarModalColeccion(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setMostrarModalColeccion(false)}>&times;</button>
            <h2 style={{ marginTop: 0, color: '#333' }}>Agregar a Colección</h2>
            
            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Elige dónde guardar esta carta:</label>
              <select 
                value={selectedBinder} 
                onChange={e => setSelectedBinder(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1rem' }}
              >
                <option value="">Colección General</option>
                {binders.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setMostrarModalColeccion(false)}
                style={{ padding: '8px 15px', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => confirmarAgregarColeccion(false)}
                style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✅ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
