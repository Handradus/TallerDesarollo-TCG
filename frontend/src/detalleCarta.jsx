import './css/detalleCarta.css';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Swal from 'sweetalert2';
import ScrapingLoader from './components/ScrapingLoader';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import spriteFuego from './assets/sprites/fuego.png';
import spriteAgua from './assets/sprites/agua.png';
import spritePlanta from './assets/sprites/planta.png';
import spriteElectrica from './assets/sprites/electrica.png';
import spritePsiquica from './assets/sprites/psiquica.png';
import spriteDragon from './assets/sprites/dragon.png';
import spriteSiniestra from './assets/sprites/siniestra.png';
import spriteHada from './assets/sprites/hada.png';
import spriteLucha from './assets/sprites/lucha.png';
import spriteMetal from './assets/sprites/metal.png';
import spriteNormal from './assets/sprites/normal.png';

export default function CartaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carta, setCarta] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalColeccion, setMostrarModalColeccion] = useState(false);
  const [mostrarModalDeseado, setMostrarModalDeseado] = useState(false);
  const [binders, setBinders] = useState([]);
  const [selectedBinder, setSelectedBinder] = useState('');
  const [selectedBinderDeseado, setSelectedBinderDeseado] = useState('');
  const [newBinderName, setNewBinderName] = useState('');
  const [newBinderNameDeseado, setNewBinderNameDeseado] = useState('');
  const [cargandoTiendas, setCargandoTiendas] = useState(false);
  const [hasFetchedTiendas, setHasFetchedTiendas] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('tiendas');
  const [marketItems, setMarketItems] = useState([]);
  const [cargandoMarket, setCargandoMarket] = useState(false);
  const [hasFetchedMarket, setHasFetchedMarket] = useState(false);
  const [preciosPriceCharting, setPreciosPriceCharting] = useState(null);
  const [cargandoPreciosPriceCharting, setCargandoPreciosPriceCharting] = useState(false);
  const [vistaPriceCharting, setVistaPriceCharting] = useState('actual');
  const [historialPriceCharting, setHistorialPriceCharting] = useState(null);
  const [cargandoHistorialPriceCharting, setCargandoHistorialPriceCharting] = useState(false);
  const [hasFetchedHistorialPriceCharting, setHasFetchedHistorialPriceCharting] = useState(false);
  const [historialPrecios, setHistorialPrecios] = useState(null);
  const [cargandoHistorialPrecios, setCargandoHistorialPrecios] = useState(false);
  const [hasFetchedHistorialPrecios, setHasFetchedHistorialPrecios] = useState(false);
  const [tiendaGraficoSeleccionada, setTiendaGraficoSeleccionada] = useState('all');
  const [alternativasCarta, setAlternativasCarta] = useState([]);
  const [cargandoAlternativas, setCargandoAlternativas] = useState(false);
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
    if (!user) {
      Swal.fire('Atención', 'Debes iniciar sesión', 'warning');
      return;
    }
    setNewBinderName('');
    setSelectedBinder('');
    fetchBinders();
    setMostrarModalColeccion(true);
  };

  const abrirModalDeseado = () => {
    if (!user) {
      Swal.fire('Atención', 'Debes iniciar sesión', 'warning');
      return;
    }
    setNewBinderNameDeseado('');
    setSelectedBinderDeseado('');
    fetchBinders();
    setMostrarModalDeseado(true);
  };

  const confirmarAgregarColeccion = async (forceAdd = false) => {
    try {
      const token = localStorage.getItem('token');
      let finalBinderId = selectedBinder;

      // Si eligió crear nueva carpeta
      if (selectedBinder === 'NEW') {
        if (!newBinderName.trim()) {
          Swal.fire('Atención', 'Ingresa un nombre para la carpeta', 'warning');
          return;
        }
        const res = await axios.post(`${apiUrl}/api/collection/binders`, { name: newBinderName.trim() }, { headers: { Authorization: `Bearer ${token}` } });
        finalBinderId = res.data.id;
        setBinders(prev => [...prev, res.data]);
        setNewBinderName('');
      }

      const payload = { cartaId: carta.id, isOwned: true, forceAdd };
      if (finalBinderId && finalBinderId !== 'NEW') payload.binderId = finalBinderId;

      await axios.post(`${apiUrl}/api/collection/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('¡Éxito!', 'Carta agregada a tu colección!', 'success');
      setMostrarModalColeccion(false);
      setSelectedBinder('');
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        const confirmResult = await Swal.fire({
          title: '¿Confirmar?',
          text: error.response.data.error || 'Ya tienes esta carta. ¿Deseas agregarla de todas formas?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, agregar',
          cancelButtonText: 'Cancelar'
        });
        if (confirmResult.isConfirmed) {
          confirmarAgregarColeccion(true);
        }
      } else if (error.response?.data?.error) {
        Swal.fire('Error', error.response.data.error, 'error');
      } else {
        Swal.fire('Error', 'Error al agregar carta', 'error');
      }
    }
  };

  const agregarDeseado = () => abrirModalDeseado();

  const confirmarDeseado = async () => {
    try {
      const token = localStorage.getItem('token');
      let finalBinderId = selectedBinderDeseado;

      // Si eligió crear nueva carpeta
      if (selectedBinderDeseado === 'NEW') {
        if (!newBinderNameDeseado.trim()) {
          Swal.fire('Atención', 'Ingresa un nombre para la carpeta', 'warning');
          return;
        }
        const res = await axios.post(`${apiUrl}/api/collection/binders`, { name: newBinderNameDeseado.trim() }, { headers: { Authorization: `Bearer ${token}` } });
        finalBinderId = res.data.id;
        setBinders(prev => [...prev, res.data]);
        setNewBinderNameDeseado('');
      }

      const payload = { cartaId: carta.id, isOwned: false };
      if (finalBinderId && finalBinderId !== 'NEW') payload.binderId = finalBinderId;

      await axios.post(`${apiUrl}/api/collection/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('¡Éxito!', 'Carta agregada a tus deseados!', 'success');
      setMostrarModalDeseado(false);
      setSelectedBinderDeseado('');
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        Swal.fire('Atención', 'Ya tienes esta carta en tu lista de deseados.', 'warning');
      } else {
        Swal.fire('Error', 'Error al agregar a deseados', 'error');
      }
    }
  };

  const venderCarta = () => {
    if (!user) {
      Swal.fire('Atención', 'Debes iniciar sesión', 'warning');
      return;
    }
    navigate('/mi-tienda', { state: { sellCard: carta } });
  };

  const limpiarCacheTiendas = async () => {
    const confirmResult = await Swal.fire({
      title: '¿Borrar caché?',
      text: '\u00bfBorrar el caché de tiendas para esta carta? Se volverá a scrapear la próxima vez que alguien la consulte.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${apiUrl}/api/cartas/${id}/tiendas/cache`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('¡Éxito!', `\u2705 ${res.data.mensaje}`, 'success');
      // Forzar re-fetch de tiendas
      setHasFetchedTiendas(false);
      setCarta(prev => ({ ...prev, tiendasDisponibles: undefined }));
    } catch (error) {
      console.error(error);
      const detalle = error?.response?.data?.detalle || error?.response?.data?.error || error.message;
      Swal.fire('Error', `Error al borrar caché: ${detalle}`, 'error');
    }
  };

  const fetchMarketItems = async () => {
    if (!id || id === 'undefined' || sugerenciaUrl) return;

    setCargandoMarket(true);
    try {
      const res = await axios.get(`${apiUrl}/api/market/carta/${id}`);
      setMarketItems(Array.isArray(res.data) ? res.data : []);
      setHasFetchedMarket(true);
    } catch (error) {
      console.error('❌ Error al obtener mercado de la carta:', error);
      setMarketItems([]);
      setHasFetchedMarket(true);
    } finally {
      setCargandoMarket(false);
    }
  };

  const fetchHistorialPriceCharting = async () => {
    if (!id || id === 'undefined' || sugerenciaUrl) return;

    setCargandoHistorialPriceCharting(true);
    try {
      const response = await axios.get(`${apiUrl}/api/cartas/${id}/precios-pricecharting/historial?days=365`);
      setHistorialPriceCharting(response.data);
      setHasFetchedHistorialPriceCharting(true);
    } catch (error) {
      console.error('❌ Error al obtener historial de PriceCharting:', error);
      setHistorialPriceCharting(null);
      setHasFetchedHistorialPriceCharting(true);
    } finally {
      setCargandoHistorialPriceCharting(false);
    }
  };

  const fetchHistorialPrecios = async () => {
    if (!id || id === 'undefined' || sugerenciaUrl) return;

    setCargandoHistorialPrecios(true);
    try {
      const response = await axios.get(`${apiUrl}/api/cartas/${id}/precios-historial?days=120`);
      setHistorialPrecios(response.data);
      setTiendaGraficoSeleccionada(response.data?.tiendas?.[0]?.id ?? 'all');
      setHasFetchedHistorialPrecios(true);
    } catch (error) {
      console.error('❌ Error al obtener historial de precios:', error);
      setHistorialPrecios(null);
      setHasFetchedHistorialPrecios(true);
    } finally {
      setCargandoHistorialPrecios(false);
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
    if (!tipos || tipos.length === 0) return <span className="tipo-sprite-fallback">⭐</span>;
    const tipo = tipos[0].toLowerCase();

    const map = {
      // Primary mappings (english)
      fire: spriteFuego,
      water: spriteAgua,
      grass: spritePlanta,
      electric: spriteElectrica,
      psychic: spritePsiquica,
      dragon: spriteDragon,
      dark: spriteSiniestra,
      fairy: spriteHada,
      normal: spriteNormal,
      fighting: spriteLucha,
      steel: spriteMetal,
      // aliases and Spanish names
      fuego: spriteFuego,
      agua: spriteAgua,
      planta: spritePlanta,
      electrica: spriteElectrica,
      electrico: spriteElectrica,
      psiquica: spritePsiquica,
      psíquica: spritePsiquica,
      dragón: spriteDragon,
      darknes: spriteSiniestra,
      darkness: spriteSiniestra,
      siniestra: spriteSiniestra,
      siniestro: spriteSiniestra,
      hada: spriteHada,
      lucha: spriteLucha,
      metal: spriteMetal,
      // fallbacks for related types
      bug: spritePlanta,
      insecto: spritePlanta,
      ice: spriteAgua,
      hielo: spriteAgua,
      poison: spritePlanta,
      poisonous: spritePlanta,
      tierra: spriteNormal,
      ground: spriteNormal,
      flying: spriteNormal,
      rock: spriteNormal,
      roca: spriteNormal,
      ghost: spriteSiniestra,
      fantasma: spriteSiniestra
    };

    const src = map[tipo];
    if (src) {
      return (
        <img
          src={src}
          alt={tipo}
          className="tipo-sprite-icon"
          style={{ width: '1em', height: '1em', verticalAlign: '-0.12em', marginRight: '0.4rem', objectFit: 'contain' }}
        />
      );
    }

    return <span className="tipo-sprite-fallback">⭐</span>;
  };

  const normalizarTextoComparacion = (valor) => {
    return (valor || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const obtenerArrayNormalizado = (valor) => {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) => normalizarTextoComparacion(item))
      .filter(Boolean)
      .sort();
  };

  const obtenerAtaquesNormalizados = (cartaData) => {
    if (!Array.isArray(cartaData?.ataques)) return [];
    return cartaData.ataques
      .map((ataque) => normalizarTextoComparacion(ataque?.name || ataque?.nombre || ''))
      .filter(Boolean)
      .sort();
  };

  const interseccionCount = (arrA, arrB) => {
    const setB = new Set(arrB);
    return arrA.filter((item) => setB.has(item)).length;
  };

  const sonArraysIguales = (arrA, arrB) => {
    if (arrA.length !== arrB.length) return false;
    return arrA.every((value, index) => value === arrB[index]);
  };

  const calcularPuntajeAlternativa = (base, candidata) => {
    const nombreBase = normalizarTextoComparacion(base?.nombre);
    const nombreCandidata = normalizarTextoComparacion(candidata?.nombre);
    if (!nombreBase || nombreBase !== nombreCandidata) {
      return 0;
    }

    const hpBase = normalizarTextoComparacion(base?.hp);
    const hpCandidata = normalizarTextoComparacion(candidata?.hp);
    const tiposBase = obtenerArrayNormalizado(base?.tipos);
    const tiposCandidata = obtenerArrayNormalizado(candidata?.tipos);
    const subtiposBase = obtenerArrayNormalizado(base?.subtipos);
    const subtiposCandidata = obtenerArrayNormalizado(candidata?.subtipos);
    const ataquesBase = obtenerAtaquesNormalizados(base);
    const ataquesCandidata = obtenerAtaquesNormalizados(candidata);
    const reglasBase = obtenerArrayNormalizado(base?.reglas);
    const reglasCandidata = obtenerArrayNormalizado(candidata?.reglas);
    const ilustradorBase = normalizarTextoComparacion(base?.ilustrador);
    const ilustradorCandidata = normalizarTextoComparacion(candidata?.ilustrador);

    const tiposCoincidentes = interseccionCount(tiposBase, tiposCandidata);
    const subtiposCoincidentes = interseccionCount(subtiposBase, subtiposCandidata);
    const ataquesCoincidentes = interseccionCount(ataquesBase, ataquesCandidata);
    const reglasCoincidentes = interseccionCount(reglasBase, reglasCandidata);

    let score = 40;

    if (hpBase && hpCandidata && hpBase === hpCandidata) score += 18;
    if (tiposBase.length > 0 && sonArraysIguales(tiposBase, tiposCandidata)) score += 18;
    else if (tiposCoincidentes > 0) score += 8;

    if (subtiposBase.length > 0 && sonArraysIguales(subtiposBase, subtiposCandidata)) score += 12;
    else if (subtiposCoincidentes > 0) score += 6;

    if (ataquesCoincidentes > 0) score += Math.min(28, ataquesCoincidentes * 14);
    if (reglasCoincidentes > 0) score += Math.min(16, reglasCoincidentes * 8);
    if (ilustradorBase && ilustradorCandidata && ilustradorBase === ilustradorCandidata) score += 14;

    if (normalizarTextoComparacion(base?.set) !== normalizarTextoComparacion(candidata?.set)) score += 6;

    const senalFuerte =
      (ilustradorBase && ilustradorCandidata && ilustradorBase === ilustradorCandidata && ataquesCoincidentes > 0) ||
      (hpBase && hpCandidata && hpBase === hpCandidata && tiposCoincidentes > 0 && ataquesCoincidentes > 0) ||
      (ataquesCoincidentes > 0 && reglasCoincidentes > 0);

    if (!senalFuerte) {
      return 0;
    }

    return score;
  };

  useEffect(() => {
    // No ejecutar fetch si es una sugerencia promocional o no hay ID válido
    if (sugerenciaUrl || !id || id === 'undefined') {
      return;
    }

    setAlternativasCarta([]);
    setCargandoAlternativas(false);

    fetch(`${apiUrl}/api/cartas/${id}`)
      .then(res => res.json())
      .then(data => {
        setCarta(data);
        setHasFetchedTiendas(false);
        setHasFetchedMarket(false);
        setMarketItems([]);
        // Obtener precios de PriceCharting si la carta ya los tiene o si han pasado más de 24 horas
        obtenerPreciosPriceCharting();
      })
      .catch(err => console.error("❌ Error al obtener carta:", err));
  }, [id, sugerenciaUrl]);

  useEffect(() => {
    const cargarAlternativas = async () => {
      if (sugerenciaUrl || !carta?.id || !carta?.nombre) {
        setAlternativasCarta([]);
        return;
      }

      setCargandoAlternativas(true);
      try {
        const response = await fetch(`${apiUrl}/api/cartas?nombre=${encodeURIComponent(carta.nombre)}&tipo=carta`);
        if (!response.ok) {
          setAlternativasCarta([]);
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          setAlternativasCarta([]);
          return;
        }

        const nombreBase = normalizarTextoComparacion(carta.nombre);
        const alternativasFiltradas = data
          .filter((candidata) => candidata?.id && String(candidata.id) !== String(carta.id))
          .filter((candidata) => normalizarTextoComparacion(candidata?.nombre) === nombreBase)
          .map((candidata) => ({
            ...candidata,
            _score: calcularPuntajeAlternativa(carta, candidata)
          }))
          .filter((candidata) => candidata._score >= 80)
          .sort((a, b) => b._score - a._score)
          .slice(0, 6)
          .map(({ _score, ...candidata }) => candidata);

        setAlternativasCarta(alternativasFiltradas);
      } catch (error) {
        console.error('❌ Error al buscar alternativas de edición:', error);
        setAlternativasCarta([]);
      } finally {
        setCargandoAlternativas(false);
      }
    };

    cargarAlternativas();
  }, [apiUrl, carta, sugerenciaUrl]);

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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${apiUrl}/api/cartas/${id}/tiendas`, { headers })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('⚠️ Error al obtener tiendas:', errData.error || res.status);
            setCarta(prev => ({
              ...prev,
              tiendasDisponibles: [],
              tiendasError: errData.error || `Error ${res.status} al cargar tiendas`
            }));
            setHasFetchedTiendas(true);
            return null;
          }
          return res.json();
        })
        .then(tiendas => {
          if (!tiendas) return;
          const hayExpirado = Object.values(tiendas).some(d => d.cache_expirado);
          const tiendasArray = Object.entries(tiendas)
            .filter(([nombre, datos]) => datos.url && datos.disponible !== false)
            .map(([nombre, datos]) => ({
              id: datos.id,
              nombre,
              url: datos.url,
              verificada: datos.verificada,
              precio: datos.precio,
              disponible: datos.disponible !== undefined ? datos.disponible : true,
              cacheExpirado: datos.cache_expirado || false
            }));
          setCarta(prev => ({
            ...prev,
            tiendasDisponibles: tiendasArray,
            tiendasError: null,
            tiendasCacheExpirado: hayExpirado
          }));
          setHasFetchedTiendas(true);
        })
        .catch(err => console.error("❌ Error al obtener tiendas:", err))
        .finally(() => setCargandoTiendas(false));
    }
  }, [carta, hasFetchedTiendas, id, sugerenciaUrl]);

  useEffect(() => {
    if (seccionActiva === 'mercado' && !hasFetchedMarket && carta?.id && !sugerenciaUrl) {
      fetchMarketItems();
    }
  }, [seccionActiva, hasFetchedMarket, carta?.id, sugerenciaUrl]);

  useEffect(() => {
    if (vistaPriceCharting === 'historial' && !hasFetchedHistorialPriceCharting && carta?.id && !sugerenciaUrl) {
      fetchHistorialPriceCharting();
    }
  }, [vistaPriceCharting, hasFetchedHistorialPriceCharting, carta?.id, sugerenciaUrl]);

  useEffect(() => {
    if (seccionActiva === 'graficos' && !hasFetchedHistorialPrecios && carta?.id && !sugerenciaUrl) {
      fetchHistorialPrecios();
    }
  }, [seccionActiva, hasFetchedHistorialPrecios, carta?.id, sugerenciaUrl]);

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
  const formatearPrecioCLP = (valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return valor;
    return new Intl.NumberFormat('es-CL').format(numero);
  };

  const formatearFechaGrafico = (fecha) => {
    if (!fecha) return '';
    const date = new Date(`${fecha}T12:00:00`);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
  };

  const tiendasConHistorial = historialPrecios?.tiendas || [];
  const tiendaSeleccionada = tiendaGraficoSeleccionada === 'all'
    ? null
    : tiendasConHistorial.find((tienda) => String(tienda.id) === String(tiendaGraficoSeleccionada));

  const dataPromedioGeneral = (historialPrecios?.overallSeries || []).map((item) => ({
    fecha: formatearFechaGrafico(item.fecha),
    promedio: Number(item.precioPromedio),
    muestras: item.muestras,
  }));

  const dataTiendaSeleccionada = (tiendaSeleccionada?.serie || []).map((item) => ({
    fecha: formatearFechaGrafico(item.fecha),
    precio: Number(item.precio),
  }));

  const dataPriceCharting = (historialPriceCharting?.serie || []).map((item) => ({
    fecha: formatearFechaGrafico(item.fecha),
    precioPromedio: Number(item.precioPromedio),
    muestras: item.muestras,
  }));

  const coloresTiendas = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

  return (
    <div className="detalle-container">
      {/* Eliminada la nav custom ("carta-navbar") para usar la principal del sitio */ }

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

                <div className="pricecharting-toggle-row">
                  <button
                    type="button"
                    className={`pricecharting-toggle ${vistaPriceCharting === 'actual' ? 'active' : ''}`}
                    onClick={() => setVistaPriceCharting('actual')}
                  >
                    Precio de referencia
                  </button>
                  <button
                    type="button"
                    className={`pricecharting-toggle ${vistaPriceCharting === 'historial' ? 'active' : ''}`}
                    onClick={() => setVistaPriceCharting('historial')}
                  >
                    Historial
                  </button>
                </div>

                {cargandoPreciosPriceCharting && (
                  <ScrapingLoader text="Consultando PriceCharting..." />
                )}

                {!cargandoPreciosPriceCharting && vistaPriceCharting === 'actual' && preciosPriceCharting && (
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
                              <strong>Precio de referencia:</strong> ${preciosPriceCharting.precioPriceCharting}
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

                {!cargandoPreciosPriceCharting && vistaPriceCharting === 'historial' && (
                  <div className="pricecharting-history-wrap">
                    {cargandoHistorialPriceCharting ? (
                      <div className="loading-precios">
                        <div className="spinner"></div>
                        <span>Cargando historial de PriceCharting...</span>
                      </div>
                    ) : dataPriceCharting.length > 0 ? (
                      <div className="pricecharting-history-card">
                        <div className="grafico-card-header">
                          <h4>Evolución del precio en PriceCharting</h4>
                          <span className="grafico-badge">{dataPriceCharting.length} puntos</span>
                        </div>
                        <div className="grafico-chart-area">
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={dataPriceCharting}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="fecha" stroke="#64748b" />
                              <YAxis stroke="#64748b" tickFormatter={(value) => `$${formatearPrecioCLP(value)}`} />
                              <Tooltip formatter={(value) => [`$${formatearPrecioCLP(value)}`, 'PriceCharting']} />
                              <Legend />
                              <Line type="monotone" dataKey="precioPromedio" name="PriceCharting" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="precio-no-disponible">
                        📭 Todavía no hay historial de PriceCharting para esta carta.
                      </div>
                    )}
                  </div>
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

              {carta.tiendasDisponibles && carta.tiendasDisponibles.length > 0 && (
                (() => {
                  const tiendasConPrecio = carta.tiendasDisponibles.filter(t => t.precio != null && t.precio !== '');
                  if (tiendasConPrecio.length === 0) return null;
                  const tiendaMasBarata = tiendasConPrecio.reduce((min, t) => {
                    const p1 = parseInt(String(min.precio).replace(/[^\d]/g, ''), 10) || Infinity;
                    const p2 = parseInt(String(t.precio).replace(/[^\d]/g, ''), 10) || Infinity;
                    return p2 < p1 ? t : min;
                  }, tiendasConPrecio[0]);
                  return (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.95rem', color: '#166534' }}>
                      <strong>🏷️ Mejor precio en tiendas:</strong> ${tiendaMasBarata.precio} en{' '}
                      <button 
                        onClick={() => handleTiendaClick(tiendaMasBarata)} 
                        style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 'bold' }}
                      >
                        {tiendaMasBarata.nombre}
                      </button>
                    </div>
                  );
                })()
              )}

              <p className="precio-disclaimer">
                💡 Los precios son referenciales y pueden variar según la condición y disponibilidad.
              </p>
            </div>
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

          <div className="detalle-tabs">
            <button
              className={`detalle-tab ${seccionActiva === 'tiendas' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('tiendas')}
            >
              🏪 Tiendas {carta.tiendasDisponibles ? `(${carta.tiendasDisponibles.length})` : ''}
            </button>
            <button
              className={`detalle-tab ${seccionActiva === 'mercado' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('mercado')}
            >
              🛒 Mercado {hasFetchedMarket ? `(${marketItems.length})` : ''}
            </button>
            <button
              className={`detalle-tab ${seccionActiva === 'graficos' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('graficos')}
            >
              📈 Gráficos {historialPrecios ? `(${historialPrecios.tiendas?.length || 0})` : ''}
            </button>
          </div>

          {seccionActiva === 'tiendas' ? (
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
                  <ScrapingLoader text="Buscando disponibilidad en tiendas..." />
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
                  <>
                    {carta.tiendasError && (
                      <div style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '10px',
                        fontSize: '0.9rem',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>⚠️</span>
                        <span>{carta.tiendasError}. Los datos mostrados pueden estar desactualizados. Intenta de nuevo más tarde.</span>
                      </div>
                    )}
                    {carta.tiendasCacheExpirado && !carta.tiendasError && (
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '10px',
                        fontSize: '0.85rem',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🕐</span>
                        <span>Los datos de algunas tiendas pueden estar desactualizados (cuota de actualización agotada por hoy).</span>
                      </div>
                    )}
                    <p className="no-tiendas">No hay tiendas disponibles para esta carta.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            seccionActiva === 'graficos' ? (
              <div className="tiendas-seccion-completa">
                <div className="precios grafico-wrap">
                  <h3>📈 Historial de precios</h3>
                  <p style={{ marginTop: '-0.5rem', color: '#4b5563' }}>
                    Promedio general y evolución de precios por tienda en el tiempo.
                  </p>

                  {cargandoHistorialPrecios ? (
                    <p>Cargando historial de precios...</p>
                  ) : historialPrecios && (dataPromedioGeneral.length > 0 || tiendasConHistorial.length > 0) ? (
                    <div className="grafico-layout">
                      <section className="grafico-card">
                        <div className="grafico-card-header">
                          <h4>Promedio general de todas las tiendas</h4>
                          <span className="grafico-badge">{dataPromedioGeneral.length} puntos</span>
                        </div>
                        {dataPromedioGeneral.length > 0 ? (
                          <div className="grafico-chart-area">
                            <ResponsiveContainer width="100%" height={320}>
                              <AreaChart data={dataPromedioGeneral}>
                                <defs>
                                  <linearGradient id="averageFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="fecha" stroke="#64748b" />
                                <YAxis stroke="#64748b" tickFormatter={(value) => `$${formatearPrecioCLP(value)}`} />
                                <Tooltip formatter={(value) => [`$${formatearPrecioCLP(value)}`, 'Promedio']} />
                                <Legend />
                                <Area type="monotone" dataKey="promedio" name="Promedio" stroke="#2563eb" fill="url(#averageFill)" strokeWidth={3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p className="no-tiendas">Aún no hay historial suficiente para graficar el promedio.</p>
                        )}
                      </section>

                      <section className="grafico-card">
                        <div className="grafico-card-header">
                          <h4>Historial por tienda</h4>
                          <span className="grafico-badge">{tiendasConHistorial.length} tiendas</span>
                        </div>

                        {tiendasConHistorial.length > 0 ? (
                          <>
                            <div className="grafico-tiendas-selector">
                              <button
                                className={`detalle-tab grafico-selector ${tiendaGraficoSeleccionada === 'all' ? 'active' : ''}`}
                                onClick={() => setTiendaGraficoSeleccionada('all')}
                              >
                                Todas
                              </button>
                              {tiendasConHistorial.map((tienda, index) => (
                                <button
                                  key={tienda.id}
                                  className={`detalle-tab grafico-selector ${String(tiendaGraficoSeleccionada) === String(tienda.id) ? 'active' : ''}`}
                                  onClick={() => setTiendaGraficoSeleccionada(tienda.id)}
                                >
                                  {tienda.nombre}
                                </button>
                              ))}
                            </div>

                            <div className="grafico-chart-area">
                              {tiendaGraficoSeleccionada === 'all' ? (
                                <p className="grafico-empty-state">
                                  Selecciona una tienda para ver su historial individual.
                                </p>
                              ) : dataTiendaSeleccionada.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                  <LineChart data={dataTiendaSeleccionada}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="fecha" stroke="#64748b" />
                                    <YAxis stroke="#64748b" tickFormatter={(value) => `$${formatearPrecioCLP(value)}`} />
                                    <Tooltip formatter={(value) => [`$${formatearPrecioCLP(value)}`, tiendaSeleccionada?.nombre || 'Precio']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="precio" name={tiendaSeleccionada?.nombre || 'Precio'} stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <p className="grafico-empty-state">No hay suficientes datos para esa tienda.</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="no-tiendas">Todavía no hay tiendas con historial de precios disponible.</p>
                        )}
                      </section>
                    </div>
                  ) : (
                    <p className="no-tiendas">No hay historial de precios para esta carta.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="tiendas-seccion-completa">
                <div className="precios">
                  <h3>🛒 Mercado de la página</h3>
                  <p style={{ marginTop: '-0.5rem', color: '#4b5563' }}>
                    Publicaciones activas para esta carta dentro del mercado.
                  </p>

                  {cargandoMarket ? (
                    <p>Cargando publicaciones del mercado...</p>
                  ) : marketItems.length > 0 ? (
                    <div className="mercado-grid-detalle">
                      {marketItems.map((item) => {
                        const cartaMercado = item.carta || carta;
                        return (
                          <article key={item.id} className="mercado-card-detalle">
                            <div className="mercado-card-imagen">
                              <img
                                src={item.realImage ? `${apiUrl}${item.realImage}` : (cartaMercado.imagenPequena || carta.imagenPequena)}
                                alt={cartaMercado.nombre || carta.nombre}
                                onError={(e) => {
                                  e.target.src = cartaMercado.imagenPequena || carta.imagenPequena || '/placeholder-card.png';
                                }}
                              />
                            </div>

                            <div className="mercado-card-body">
                              <div className="mercado-card-topline">
                                <span className="mercado-card-price">${formatearPrecioCLP(item.price)}</span>
                                <span className="mercado-card-qty">x{item.quantity || 1}</span>
                              </div>

                              <h4>{cartaMercado.nombre || carta.nombre}</h4>

                              <div className="mercado-card-meta">
                                <span>🧾 Nº {cartaMercado.numero || carta.numero}</span>
                                <span>📚 {cartaMercado.set || carta.set}</span>
                                <span>👤 {item.user?.name || 'Vendedor'}</span>
                              </div>

                              <div className="mercado-card-meta">
                                {item.deliveryType && <span>🚚 {item.deliveryType}</span>}
                                {item.region && <span>📍 {item.region}</span>}
                              </div>

                              {item.description && (
                                <p className="mercado-card-description">{item.description}</p>
                              )}

                              <div className="mercado-card-footer">
                                <small>📅 {new Date(item.createdAt).toLocaleDateString()}</small>
                                <button
                                  className="btn-mercado-ver-completo"
                                  onClick={() => navigate('/mercado')}
                                >
                                  Ver mercado completo
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-tiendas">No hay publicaciones activas para esta carta.</p>
                  )}
                </div>
              </div>
            )
          )}

          {(cargandoAlternativas || alternativasCarta.length > 0) && (
            <section className="alternativas-edicion-panel">
              <div className="alternativas-edicion-header">
                <h2>Misma carta en otra edición</h2>
                {!cargandoAlternativas && (
                  <span>{alternativasCarta.length} alternativa{alternativasCarta.length === 1 ? '' : 's'}</span>
                )}
              </div>

              {cargandoAlternativas ? (
                <p className="alternativas-edicion-loading">Buscando versiones equivalentes...</p>
              ) : (
                <div className="alternativas-edicion-grid">
                  {alternativasCarta.map((alternativa) => (
                    <button
                      key={alternativa.id}
                      type="button"
                      className="alternativa-edicion-card"
                      onClick={() => navigate(`/carta/${alternativa.id}`)}
                    >
                      <img
                        src={alternativa.imagenPequena || alternativa.imagenGrande || '/placeholder-card.png'}
                        alt={alternativa.nombre}
                        onError={(e) => {
                          e.target.src = '/placeholder-card.png';
                        }}
                      />
                      <strong>{alternativa.nombre}</strong>
                      <span>{alternativa.set}</span>
                      <span>#{alternativa.numero}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
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
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--panel-border)', fontSize: '1rem', marginBottom: selectedBinder === 'NEW' ? '10px' : '0' }}
              >
                <option value="">🗂️ Colección General</option>
                {binders.map(b => (
                  <option key={b.id} value={b.id}>📁 {b.name}</option>
                ))}
                <option value="NEW">➕ Crear nueva carpeta...</option>
              </select>
              {selectedBinder === 'NEW' && (
                <input
                  type="text"
                  placeholder="Nombre de la nueva carpeta"
                  value={newBinderName}
                  onChange={e => setNewBinderName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--panel-border)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setMostrarModalColeccion(false)}
                style={{ padding: '8px 15px', border: '1px solid var(--panel-border)', background: 'var(--sub-panel-bg)', borderRadius: '4px', cursor: 'pointer' }}
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

      {/* Modal para elegir carpeta al marcar como 'Lo Quiero' */}
      {mostrarModalDeseado && (
        <div className="modal-overlay" onClick={() => setMostrarModalDeseado(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setMostrarModalDeseado(false)}>✕</button>
            <h2 style={{ marginTop: 0, color: '#333' }}>❤️ Lo Quiero</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>La carta se guardará como "deseada" en tu colección.</p>

            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Elige dónde guardar:</label>
              <select
                value={selectedBinderDeseado}
                onChange={e => setSelectedBinderDeseado(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--panel-border)', fontSize: '1rem', marginBottom: selectedBinderDeseado === 'NEW' ? '10px' : '0' }}
              >
                <option value="">🗂️ Colección General</option>
                {binders.map(b => (
                  <option key={b.id} value={b.id}>📁 {b.name}</option>
                ))}
                <option value="NEW">➕ Crear nueva carpeta...</option>
              </select>
              {selectedBinderDeseado === 'NEW' && (
                <input
                  type="text"
                  placeholder="Nombre de la nueva carpeta"
                  value={newBinderNameDeseado}
                  onChange={e => setNewBinderNameDeseado(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--panel-border)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setMostrarModalDeseado(false)}
                style={{ padding: '8px 15px', border: '1px solid var(--panel-border)', background: 'var(--sub-panel-bg)', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={confirmarDeseado}
                style={{ padding: '8px 15px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ❤️ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
