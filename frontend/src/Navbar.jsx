import { useNavigate, useLocation } from 'react-router-dom';
import './css/navbar.css';
import tituloWebImg from './assets/tituloWeb.png';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import LoginButton from './components/LoginButton';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
    setShowAdminMenu(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Effect 1: Fetch initial count only when user logs in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Effect 2: Listen for socket events
  useEffect(() => {
    if (socket && user) {
      const handleNotification = (data) => {
        if (data && data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        } else {
          fetchUnreadCount();
        }
      };

      socket.on('notification', handleNotification);
      return () => socket.off('notification', handleNotification);
    }
  }, [socket, user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.count);
    } catch (e) { console.error(e); }
  }

  const menuItems = [
    {
      path: '/buscar',
      label: '🏠 Inicio',
      title: 'Ir al inicio'
    },
    {
      path: '/coleccion',
      label: '🎴 Mi Colección',
      title: 'Ver mi colección',
      roles: ['user', 'admin', 'tienda']
    },
    {
      path: '/mercado',
      label: '🏪 Mercado',
      title: 'Explorar cartas en venta',
      roles: ['public', 'user', 'admin']
    },
    {
      path: '/mi-tienda',
      label: '💰 Mi Tienda',
      title: 'Vender mis cartas',
      roles: ['user', 'admin', 'tienda']
    },
    {
      path: '/mensajes',
      label: '📨 Mensajes',
      title: 'Mis mensajes',
      roles: ['user', 'admin', 'tienda']
    },
    {
      path: '/perfil',
      label: '👤 Mi Perfil',
      title: 'Editar perfil y redes',
      roles: ['user', 'admin', 'tienda']
    },
    {
      path: '/tiendas',
      label: '🏪 Tiendas',
      title: 'Ver todas las tiendas disponibles',
      roles: ['public', 'user', 'admin', 'tienda']
    }
  ];

  const adminLinks = [
    { path: '/admin-buscar', label: '🔧 Búsqueda Admin' },
    { path: '/admin-precios', label: '🔥 Forzar Precios' },
    { path: '/admin-usuarios', label: '👤 Aprobar Usuarios' },
    { path: '/agregar-tienda', label: '➕ Agregar Tienda' },
    { path: '/editar-tiendas', label: '✏️ Editar Tiendas' },
    { path: '/admin-moderacion', label: '⚖️ Moderación Tiendas' },
    { path: '/admin-reportes', label: '🚩 Reportes Usuarios' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
    setShowAdminMenu(false);
  };

  return (
    <>
      {/* Overlay for mobile menu */}
      <div
        className={`navbar-overlay ${menuOpen ? 'overlay-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <nav className="main-navbar" ref={menuRef}>
        <div className="navbar-container">
          {/* Hamburger button — only visible on mobile */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Menu Items */}
          <div className={`navbar-menu ${menuOpen ? 'menu-open' : ''}`}>
            {menuItems.filter(item => {
              if (item.roles) {
                if (item.roles.includes('public')) return true;
                if (!user) return false;
                return item.roles.includes(user.role);
              }
              return true; // Default public
            }).map((item) => (
              <button
                key={item.path}
                className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={item.title}
                style={{ position: 'relative' }}
              >
                {item.label}
                {item.path === '/mensajes' && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-8px',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}

            {user && user.role === 'admin' && (
              <div style={{ position: 'relative' }}>
                <button
                  className={`navbar-item ${showAdminMenu ? 'active' : ''}`}
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                >
                  🔧 Admin ▼
                </button>
                {/* Dropdown */}
                {showAdminMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    background: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {adminLinks.map(link => (
                      <button
                        key={link.path}
                        onClick={() => handleNavigate(link.path)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          padding: '10px 15px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderBottom: '1px solid #4a5568'
                        }}
                        onMouseOver={e => e.target.style.background = '#4a5568'}
                        onMouseOut={e => e.target.style.background = 'transparent'}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="navbar-auth" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!user ? (
              <LoginButton />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                <img
                  src={user.picture || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'}
                  alt={user.name}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'; }}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
                />
                <span>{user.name}</span>
                <button onClick={logout} className="navbar-item" style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
