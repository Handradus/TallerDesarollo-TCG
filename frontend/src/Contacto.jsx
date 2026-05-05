import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/contacto.css';

export default function Contacto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: 'publicidad',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.mensaje) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos.', 'error');
      return;
    }
    setEnviando(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Ajustar URL base según entorno (asumiendo que las otras llamadas usan fetch a /api o API URL)
      // Como no se importa API_URL aquí, usar endpoint relativo si Vite hace proxy, o usar el estándar de tu app
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      Swal.fire('¡Mensaje Enviado!', 'Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.', 'success');
      setFormData({ nombre: '', email: '', asunto: 'publicidad', mensaje: '' });
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema enviando tu mensaje. Intenta más tarde.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="contacto-container">
      <div className="contacto-header">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1 className="contacto-main-title">Contacto & Publicidad</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="contacto-content">
        <div className="contacto-info">
          <h2>Anúnciate con nosotros</h2>
          <p>
            ¿Tienes una tienda de TCG, organizas torneos o vendes productos relacionados?
            Llega a miles de entrenadores y coleccionistas anunciándote en nuestra plataforma.
          </p>
          <ul className="beneficios-lista">
            <li>🎯 Audiencia segmentada (jugadores y coleccionistas)</li>
            <li>📊 Alta visibilidad en búsquedas de cartas</li>
            <li>🤝 Precios accesibles para tiendas emergentes</li>
          </ul>
          <div className="info-extra">
            <p><strong>Email:</strong> Softguaren@gmail.com</p>

          </div>
        </div>

        <div className="contacto-form-container">
          <form className="contacto-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Tu nombre o el de tu tienda" />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
            </div>

            <div className="form-group">
              <label>Asunto</label>
              <select name="asunto" value={formData.asunto} onChange={handleChange}>
                <option value="publicidad">Información sobre Publicidad y Banners</option>
                <option value="sugerencia">Sugerencia o Feedback</option>
                <option value="soporte">Soporte Técnico</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mensaje *</label>
              <textarea name="mensaje" value={formData.mensaje} onChange={handleChange} rows="5" placeholder="¿En qué podemos ayudarte?"></textarea>
            </div>

            <button type="submit" className="btn-enviar" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
