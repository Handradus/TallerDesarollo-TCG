import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/agregarTienda.css';

export default function AgregarTienda() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    valoracion: '',
    urlBusqueda: '',
    tipoBusqueda: 'shopify',
    urlBase: '',
    direccion: '',
    telefono: '',
    logo: '',
    activo: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const tiposBusqueda = [
    'shopify',
    'levelup', 
    'woocommerce',
    'prestashop',
    'magento',
    'custom',
    'api'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la tienda es requerido';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    } else if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-_.&()]+$/.test(formData.nombre)) {
      newErrors.nombre = 'El nombre solo puede contener letras, números, espacios y los caracteres: - _ . & ( )';
    }

    // Validar descripción
    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar dirección
    if (formData.direccion && formData.direccion.length > 200) {
      newErrors.direccion = 'La dirección no puede exceder 200 caracteres';
    }

    // Validar teléfono
    if (formData.telefono) {
      const telefonoLimpio = formData.telefono.replace(/[\s\-+()]/g, '');
      if (!/^\d{8,15}$/.test(telefonoLimpio)) {
        newErrors.telefono = 'El teléfono debe contener solo números y tener entre 8 y 15 dígitos';
      }
    }

    if (!formData.urlBusqueda.trim()) {
      newErrors.urlBusqueda = 'La URL de búsqueda es requerida';
    } else if (!formData.urlBusqueda.includes('BUSQUEDA')) {
      newErrors.urlBusqueda = 'La URL debe contener el placeholder "BUSQUEDA"';
    }

    if (!formData.urlBase.trim()) {
      newErrors.urlBase = 'La URL base es requerida';
    }

    // Validar URLs si están presentes
    const urlFields = ['urlBusqueda', 'urlBase', 'logo'];
    urlFields.forEach(field => {
      if (formData[field] && formData[field].trim()) {
        if (formData[field].length > 500) {
          newErrors[field] = `${field} no puede exceder 500 caracteres`;
        } else if (!esUrlValidaConWww(formData[field])) {
          newErrors[field] = `${field} debe ser una URL válida que contenga "www."`;
        }
      }
    });

    if (formData.valoracion && (isNaN(formData.valoracion) || formData.valoracion < 0 || formData.valoracion > 5)) {
      newErrors.valoracion = 'La valoración debe ser un número entre 0 y 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para validar URLs con www
  const esUrlValidaConWww = (url) => {
    try {
      // Si no tiene protocolo, agregar https://
      let urlCompleta = url;
      if (!/^https?:\/\//i.test(url)) {
        urlCompleta = 'https://' + url;
      }
      
      // Validar que sea una URL válida
      const urlObj = new URL(urlCompleta);
      
      // Verificar que contenga www.
      return urlObj.hostname.includes('www.');
    } catch {
      return false;
    }
  };

  // Función para obtener clase de contador de caracteres
  const getCharacterCountClass = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'character-danger';
    if (percentage >= 75) return 'character-warning';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const dataToSend = { ...formData };
      
      // Convertir valoración a número si está presente
      if (dataToSend.valoracion) {
        dataToSend.valoracion = parseFloat(dataToSend.valoracion);
      } else {
        dataToSend.valoracion = null;
      }

      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null;
        }
      });

      console.log('📤 Enviando datos de tienda:', dataToSend);

      const response = await fetch(`${apiUrl}/api/tiendas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Tienda creada exitosamente:', result.tienda);
        setSuccess(true);
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          descripcion: '',
          valoracion: '',
          urlBusqueda: '',
          tipoBusqueda: 'shopify',
          urlBase: '',
          direccion: '',
          telefono: '',
          logo: '',
          activo: true
        });

        // Mostrar mensaje de éxito por unos segundos
        setTimeout(() => {
          setSuccess(false);
        }, 5000);

      } else {
        console.error('❌ Error al crear tienda:', result.error);
        setErrors({ general: result.error || 'Error al crear la tienda' });
      }

    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agregar-tienda-container">
      <div className="agregar-tienda-header">
        <button 
          className="btn-volver"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
        <h1>🏪 Agregar Nueva Tienda</h1>
      </div>

      {success && (
        <div className="success-message">
          ✅ ¡Tienda creada exitosamente!
        </div>
      )}

      {errors.general && (
        <div className="error-message">
          ❌ {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="agregar-tienda-form">
        {/* Información básica */}
        <div className="form-section">
          <h3>📋 Información básica</h3>
          
          <div className="form-group">
            <label htmlFor="nombre">Nombre de la tienda *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Mi Tienda TCG"
              className={errors.nombre ? 'error' : ''}
              maxLength="100"
              pattern="[a-zA-Z0-9\s\u00C0-\u017F\-_.&()]+"
              title="Solo letras, números, espacios y los caracteres: - _ . & ( )"
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            <small className={getCharacterCountClass(formData.nombre.length, 100)}>
              {formData.nombre.length}/100 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Descripción de la tienda..."
              rows="3"
              maxLength="500"
            />
            <small className={getCharacterCountClass(formData.descripcion.length, 500)}>
              {formData.descripcion.length}/500 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="valoracion">Valoración (0-5)</label>
            <input
              type="number"
              id="valoracion"
              name="valoracion"
              value={formData.valoracion}
              onChange={handleInputChange}
              min="0"
              max="5"
              step="0.1"
              placeholder="Ej: 4.5"
              className={errors.valoracion ? 'error' : ''}
            />
            {errors.valoracion && <span className="error-text">{errors.valoracion}</span>}
          </div>
        </div>

        {/* Configuración técnica */}
        <div className="form-section">
          <h3>⚙️ Configuración técnica</h3>
          
          <div className="form-group">
            <label htmlFor="urlBase">URL base de la tienda *</label>
            <input
              type="url"
              id="urlBase"
              name="urlBase"
              value={formData.urlBase}
              onChange={handleInputChange}
              placeholder="www.mitienda.com o https://www.mitienda.com"
              className={errors.urlBase ? 'error' : ''}
              maxLength="500"
            />
            {errors.urlBase && <span className="error-text">{errors.urlBase}</span>}
            <small className={getCharacterCountClass(formData.urlBase.length, 500)}>
              {formData.urlBase.length}/500 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="urlBusqueda">URL de búsqueda *</label>
            <input
              type="url"
              id="urlBusqueda"
              name="urlBusqueda"
              value={formData.urlBusqueda}
              onChange={handleInputChange}
              placeholder="www.mitienda.com/search?q=BUSQUEDA"
              className={errors.urlBusqueda ? 'error' : ''}
              maxLength="500"
            />
            <small>Debe contener "BUSQUEDA" y "www." en la URL 
              <span className={getCharacterCountClass(formData.urlBusqueda.length, 500)}>
                ({formData.urlBusqueda.length}/500 caracteres)
              </span>
            </small>
            {errors.urlBusqueda && <span className="error-text">{errors.urlBusqueda}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tipoBusqueda">Tipo de búsqueda *</label>
            <select
              id="tipoBusqueda"
              name="tipoBusqueda"
              value={formData.tipoBusqueda}
              onChange={handleInputChange}
            >
              {tiposBusqueda.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="form-section">
          <h3>📞 Información de contacto</h3>
          
          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Av. Principal 123, Ciudad"
              maxLength="200"
            />
            <small className={getCharacterCountClass(formData.direccion.length, 200)}>
              {formData.direccion.length}/200 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="+56912345678 (8-15 dígitos)"
              className={errors.telefono ? 'error' : ''}
              pattern="[\d\s\-+()]+"
              title="Solo números, espacios, guiones, + y paréntesis"
            />
            {errors.telefono && <span className="error-text">{errors.telefono}</span>}
            <small>Solo números (8-15 dígitos), espacios, -, + y ( ) permitidos</small>
          </div>

          <div className="form-group">
            <label htmlFor="logo">URL del logo</label>
            <input
              type="url"
              id="logo"
              name="logo"
              value={formData.logo}
              onChange={handleInputChange}
              placeholder="www.mitienda.com/logo.png"
              className={errors.logo ? 'error' : ''}
              maxLength="500"
            />
            {errors.logo && <span className="error-text">{errors.logo}</span>}
            <small className={getCharacterCountClass(formData.logo.length, 500)}>
              {formData.logo.length}/500 caracteres
            </small>
          </div>
        </div>

        {/* Estado */}
        <div className="form-section">
          <div className="form-group checkbox-group">
            <label htmlFor="activo">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
              />
              Tienda activa
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancelar"
            onClick={() => navigate('/')}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-crear"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Tienda'}
          </button>
        </div>
      </form>
    </div>
  );
}
