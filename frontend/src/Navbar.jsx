import { useNavigate, useLocation } from 'react-router-dom';
import './css/navbar.css';
import tituloWebImg from './assets/tituloWeb.jpg';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      label: '🏠 Inicio',
      title: 'Ir al inicio'
    },
    {
      path: '/tiendas',
      label: '🏪 Tiendas',
      title: 'Ver todas las tiendas disponibles'
    },
    {
      path: '/agregar-tienda',
      label: '➕ Agregar Tienda',
      title: 'Agregar nueva tienda'
    },
    {
      path: '/editar-tiendas',
      label: '✏️ Editar Tiendas',
      title: 'Editar tiendas existentes'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {/* Menu Items */}
        <div className="navbar-menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.title}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
