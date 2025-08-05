import { useNavigate } from 'react-router-dom';
import './css/notFound.css';
import missingnoImg from './assets/missignno.png';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Título 404 */}
        <div className="error-code">
          <span className="error-number">4</span>
          <span className="error-number">0</span>
          <span className="error-number">4</span>
        </div>

        {/* Imagen de Missingno */}
        <div className="missingno-container">
          <img 
            src={missingnoImg} 
            alt="Missingno - Pokémon no encontrado"
            className="missingno-image"
          />
        </div>

        {/* Mensaje de error */}
        <div className="error-message">
          <h2>¡Página no encontrada!</h2>
          <p>Al igual que Missingno, esta página parece no existir...</p>
          <p>Es posible que la URL esté mal escrita o que la página haya sido movida.</p>
        </div>

        {/* Botones de navegación */}
        <div className="error-actions">
          <button 
            className="btn-home"
            onClick={() => navigate('/')}
          >
            🏠 Volver al inicio
          </button>
          <button 
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            ← Página anterior
          </button>
        </div>

        {/* Texto adicional temático */}
        <div className="error-flavor">
          <p className="glitch-text">
            Un Pokémon glitch ha aparecido en tu navegador...
          </p>
        </div>
      </div>
    </div>
  );
}
