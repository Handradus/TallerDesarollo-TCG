import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/editarTiendas.css';
import Swal from 'sweetalert2';

export default function EditarTiendas() {
  const navigate = useNavigate();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [datosOriginales, setDatosOriginales] = useState({}); // Datos originales para comparar
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

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

  useEffect(() => {
    cargarTiendas();
  }, []);

  const cargarTiendas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/tiendas/admin`);
      const data = await response.json();
      
      if (data.success) {
        setTiendas(data.tiendas);
      } else {
        mostrarMensaje('error', 'Error al cargar tiendas');
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      mostrarMensaje('error', 'Error de conexión al cargar tiendas');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const iniciarEdicion = (tienda) => {
    setEditando(tienda.id);
    const datosIniciales = {
      nombre: tienda.nombre || '',
      descripcion: tienda.descripcion || '',
      valoracion: tienda.valoracion || '',
      urlBusqueda: tienda.urlBusqueda || '',
      tipoBusqueda: tienda.tipoBusqueda || 'shopify',
      urlBase: tienda.urlBase || '',
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || '',
      logo: tienda.logo || '',
      activo: tienda.activo
    };
    
    setFormData(datosIniciales);
    setDatosOriginales(datosIniciales); // Guardar datos originales para comparar
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormData({});
    setDatosOriginales({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

 
  const hayCambios = () => {
    if (!datosOriginales || Object.keys(datosOriginales).length === 0) {
      return false;
    }

    
    for (const campo in datosOriginales) {
      const valorOriginal = datosOriginales[campo];
      const valorActual = formData[campo];
            
      const normalizar = (valor) => {
        if (valor === null || valor === undefined || valor === '') {
          return '';
        }
        return String(valor);
      };

      if (normalizar(valorOriginal) !== normalizar(valorActual)) {
        console.log(`🔄 Campo modificado: ${campo} | Original: "${valorOriginal}" | Actual: "${valorActual}"`);
        return true;
      }
    }

    return false;
  };
  
  const obtenerCambios = () => {
    const cambios = {};
    const urlFields = ['urlBusqueda', 'urlBase', 'logo'];
    
    for (const campo in datosOriginales) {
      const valorOriginal = datosOriginales[campo];
      let valorActual = formData[campo];
      
      // Auto-completar https:// para campos de URL
      if (urlFields.includes(campo) && valorActual && valorActual.trim() !== '' && !/^https?:\/\//i.test(valorActual)) {
        valorActual = 'https://' + valorActual.trim();
      }
      
      const normalizar = (valor) => {
        if (valor === null || valor === undefined || valor === '') {
          return null; 
        }
        return valor;
      };

      const valorOriginalNorm = normalizar(valorOriginal);
      const valorActualNorm = normalizar(valorActual);

      if (valorOriginalNorm !== valorActualNorm) {
        cambios[campo] = valorActualNorm;
      }
    }

    return cambios;
  };

  
  const esUrlValida = (url) => {
    try {      
      let urlCompleta = url;
      if (!/^https?:\/\//i.test(url)) {
        urlCompleta = 'https://' + url;
      }
            
      const urlObj = new URL(urlCompleta);
            
      return urlObj.hostname.includes('.');
    } catch {
      return false;
    }
  };

  
  const getCharacterCountClass = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'character-danger';
    if (percentage >= 75) return 'character-warning';
    return '';
  };

  const validarFormulario = (datos) => {
    const errores = [];

    
    if (!datos.nombre || !datos.nombre.trim()) {
      errores.push('El nombre de la tienda es requerido');
    } else if (datos.nombre.length > 100) {
      errores.push('El nombre no puede exceder 100 caracteres');
    } else if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-_.&()]+$/.test(datos.nombre)) {
      errores.push('El nombre solo puede contener letras, números, espacios y los caracteres: - _ . & ( )');
    }
    
    if (datos.descripcion && datos.descripcion.length > 500) {
      errores.push('La descripción no puede exceder 500 caracteres');
    }
    
    if (datos.direccion && datos.direccion.length > 200) {
      errores.push('La dirección no puede exceder 200 caracteres');
    }
   
    if (datos.telefono) {
      const telefonoLimpio = datos.telefono.replace(/[\s\-+()]/g, '');
      if (!/^\d{8,15}$/.test(telefonoLimpio)) {
        errores.push('El teléfono debe contener solo números y tener entre 8 y 15 dígitos');
      }
    }

    if (!datos.urlBusqueda || !datos.urlBusqueda.trim()) {
      errores.push('La URL de búsqueda es requerida');
    } else if (!datos.urlBusqueda.includes('BUSQUEDA')) {
      errores.push('La URL debe contener el placeholder "BUSQUEDA"');
    }

    if (!datos.urlBase || !datos.urlBase.trim()) {
      errores.push('La URL base es requerida');
    }
    
    const urlFields = [
      { field: 'urlBusqueda', name: 'URL de búsqueda' },
      { field: 'urlBase', name: 'URL base' },
      { field: 'logo', name: 'URL del logo' }
    ];
    
    urlFields.forEach(({ field, name }) => {
      if (datos[field] && String(datos[field]).trim()) {
        const valorLimpio = String(datos[field]).trim();
        if (valorLimpio.length > 500) {
          errores.push(`${name} no puede exceder 500 caracteres`);
        } else if (!esUrlValida(valorLimpio)) {
          errores.push(`${name} debe ser una URL válida`);
        }
      }
    });

    if (datos.valoracion && (isNaN(datos.valoracion) || datos.valoracion < 0 || datos.valoracion > 5)) {
      errores.push('La valoración debe ser un número entre 0 y 5');
    }

    return errores;
  };

  const guardarCambios = async (id) => {
    console.log('🔄 [guardarCambios] Iniciando proceso de guardado para tienda ID:', id);
    console.log('🔄 [guardarCambios] Datos actuales del formulario:', formData);
    console.log('🔄 [guardarCambios] Datos originales:', datosOriginales);
    
    try {
      setGuardando(true);
      
      
      if (!hayCambios()) {
        console.log('❌ [guardarCambios] No se detectaron cambios');
        mostrarMensaje('error', 'No se detectaron cambios para guardar');
        setGuardando(false);
        return;
      }
      
      const cambios = obtenerCambios();
      console.log('🔄 [guardarCambios] Cambios detectados:', cambios);
            
      console.log('🔄 [guardarCambios] Validando formulario...');
      const erroresValidacion = validarFormulario(formData);
      if (erroresValidacion.length > 0) {
        console.log('❌ [guardarCambios] Errores de validación:', erroresValidacion);
        mostrarMensaje('error', erroresValidacion.join(', '));
        return;
      }
      console.log('✅ [guardarCambios] Validación exitosa');
            
      const dataToSend = { ...cambios };
            
      if (dataToSend.valoracion !== undefined) {
        if (dataToSend.valoracion) {
          dataToSend.valoracion = parseFloat(dataToSend.valoracion);
        } else {
          dataToSend.valoracion = null;
        }
      }
      
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null;
        }
      });

      console.log('🔄 [guardarCambios] Datos finales a enviar:', dataToSend);
      console.log('🔄 [guardarCambios] Enviando PUT a:', `${apiUrl}/api/tiendas/${id}`);

      const response = await fetch(`${apiUrl}/api/tiendas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('🔄 [guardarCambios] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result;
      try {
        result = await response.json();
        console.log('🔄 [guardarCambios] Datos de respuesta:', result);
      } catch (parseError) {
        console.error('❌ [guardarCambios] Error al parsear respuesta JSON:', parseError);
        const textResponse = await response.text();
        console.log('🔄 [guardarCambios] Respuesta como texto:', textResponse);
      }

      if (response.ok && result && result.success) {
        console.log('✅ [guardarCambios] Guardado exitoso');
        mostrarMensaje('success', `Tienda actualizada exitosamente (${Object.keys(dataToSend).length} campos modificados)`);
        setEditando(null);
        setFormData({});
        setDatosOriginales({});
        cargarTiendas(); // Recargar la lista
      } else {
        console.error('❌ [guardarCambios] Error en la respuesta del servidor:', {
          status: response.status,
          result: result
        });
        mostrarMensaje('error', result?.error || 'Error al actualizar tienda');
      }

    } catch (error) {
      console.error('❌ [guardarCambios] Error de red o servidor:', error);
      mostrarMensaje('error', 'Error de conexión al guardar');
    } finally {
      console.log('🔄 [guardarCambios] Finalizando proceso de guardado');
      setGuardando(false);
    }
  };

  const toggleActivarTienda = async (id, nombre, estadoActual) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    const mensaje = estadoActual 
      ? `¿Estás seguro de que quieres desactivar la tienda "${nombre}"?`
      : `¿Estás seguro de que quieres activar la tienda "${nombre}"?`;
    
    const confirmResult = await Swal.fire({
      title: '¿Confirmar acción?',
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      // Usar PUT para cambiar el estado activo/inactivo
      const response = await fetch(`${apiUrl}/api/tiendas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activo: !estadoActual // Cambiar al estado contrario
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        mostrarMensaje('success', `Tienda ${accion === 'desactivar' ? 'desactivada' : 'activada'} exitosamente`);
        cargarTiendas(); // Recargar la lista
      } else {
        mostrarMensaje('error', result.error || `Error al ${accion} tienda`);
      }

    } catch (error) {
      console.error(`Error al ${accion}:`, error);
      mostrarMensaje('error', `Error de conexión al ${accion} tienda`);
    }
  };

  if (loading) {
    return (
      <div className="editar-tiendas-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editar-tiendas-container">
      <div className="editar-tiendas-header">
        <button 
          className="btn-volver"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
        <h1>✏️ Editar Tiendas</h1>
        <button 
          className="btn-agregar"
          onClick={() => navigate('/agregar-tienda')}
        >
          + Agregar Nueva
        </button>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      <div className="tiendas-grid">
        {tiendas.map((tienda) => (
          <div key={tienda.id} className={`tienda-card ${!tienda.activo ? 'inactiva' : ''}`}>
            {editando === tienda.id ? (
              // Modo edición
              <div className="edicion-form">
                <div className="form-group">
                  <label>Nombre:</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    maxLength="100"
                    pattern="[a-zA-Z0-9\s\u00C0-\u017F\-_.&()]+"
                    title="Solo letras, números, espacios y los caracteres: - _ . & ( )"
                  />
                  <small className={getCharacterCountClass(formData.nombre.length, 100)}>
                    {formData.nombre.length}/100 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    maxLength="500"
                  />
                  <small className={getCharacterCountClass(formData.descripcion.length, 500)}>
                    {formData.descripcion.length}/500 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label>Valoración:</label>
                  <input
                    type="number"
                    name="valoracion"
                    value={formData.valoracion}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>URL Base:</label>
                  <input
                    type="url"
                    name="urlBase"
                    value={formData.urlBase}
                    onChange={handleInputChange}
                    placeholder="www.mitienda.com o https://www.mitienda.com"
                    maxLength="500"
                  />
                  <small className={getCharacterCountClass(formData.urlBase.length, 500)}>
                    {formData.urlBase.length}/500 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label>URL Búsqueda:</label>
                  <input
                    type="url"
                    name="urlBusqueda"
                    value={formData.urlBusqueda}
                    onChange={handleInputChange}
                    placeholder="www.mitienda.com/search?q=BUSQUEDA"
                    maxLength="500"
                  />
                  <small>Debe contener "BUSQUEDA" y "www." 
                    <span className={getCharacterCountClass(formData.urlBusqueda.length, 500)}>
                      ({formData.urlBusqueda.length}/500 caracteres)
                    </span>
                  </small>
                </div>

                <div className="form-group">
                  <label>Tipo Búsqueda:</label>
                  <select
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

                <div className="form-group">
                  <label>Dirección:</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    maxLength="200"
                  />
                  <small className={getCharacterCountClass(formData.direccion.length, 200)}>
                    {formData.direccion.length}/200 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    pattern="[\d\s\-+()]+"
                    title="Solo números, espacios, guiones, + y paréntesis"
                    placeholder="+56912345678 (8-15 dígitos)"
                  />
                  <small>Solo números (8-15 dígitos), espacios, -, + y ( ) permitidos</small>
                </div>

                <div className="form-group">
                  <label>Logo URL:</label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="www.mitienda.com/logo.png"
                    maxLength="500"
                  />
                  <small className={getCharacterCountClass(formData.logo.length, 500)}>
                    {formData.logo.length}/500 caracteres
                  </small>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    Tienda activa
                  </label>
                </div>

                <div className="edicion-actions">
                  <button 
                    className="btn-cancelar"
                    onClick={cancelarEdicion}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-guardar"
                    onClick={() => guardarCambios(tienda.id)}
                    disabled={guardando || !hayCambios()}
                    title={!hayCambios() ? 'No hay cambios para guardar' : 'Guardar cambios'}
                  >
                    {guardando ? 'Guardando...' : hayCambios() ? `Guardar cambios` : 'Sin cambios'}
                  </button>
                </div>
              </div>
            ) : (
              
              <div className="tienda-info">
                {/* 1. Nombre */}
                <div className="tienda-nombre">
                  <h3>{tienda.nombre}</h3>
                </div>

                {/* 2. Estado */}
                <div className="tienda-status">
                  <span className={`status-badge ${tienda.activo ? 'activa' : 'inactiva'}`}>
                    {tienda.activo ? '✅ Activa' : '❌ Inactiva'}
                  </span>
                </div>

                {/* 3. Logo/Imagen */}
                {tienda.logo && (
                  <div className="tienda-logo">
                    <img src={tienda.logo} alt={`Logo ${tienda.nombre}`} />
                  </div>
                )}

                {/* 4. Botones */}
                <div className="tienda-actions">
                  <button 
                    className="btn-editar"
                    onClick={() => iniciarEdicion(tienda)}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className={tienda.activo ? "btn-eliminar" : "btn-activar"}
                    onClick={() => toggleActivarTienda(tienda.id, tienda.nombre, tienda.activo)}
                  >
                    {tienda.activo ? "🗑️ Desactivar" : "✅ Activar"}
                  </button>
                </div>

                {/* 5. Datos */}
                <div className="tienda-details">
                  {tienda.descripcion && <p><strong>Descripción:</strong> {tienda.descripcion}</p>}
                  {tienda.valoracion && <p><strong>Valoración:</strong> ⭐ {tienda.valoracion}/5</p>}
                  <p><strong>Tipo:</strong> {tienda.tipoBusqueda}</p>
                  <p><strong>URL Base:</strong> <a href={tienda.urlBase} target="_blank" rel="noopener noreferrer">{tienda.urlBase}</a></p>
                  {tienda.direccion && <p><strong>Dirección:</strong> {tienda.direccion}</p>}
                  {tienda.telefono && <p><strong>Teléfono:</strong> {tienda.telefono}</p>}
                  {tienda.ultimaActualizacion && (
                    <p><strong>Actualizada:</strong> {new Date(tienda.ultimaActualizacion).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tiendas.length === 0 && (
        <div className="no-tiendas">
          <p>No hay tiendas registradas.</p>
          <button 
            className="btn-agregar-primera"
            onClick={() => navigate('/agregar-tienda')}
          >
            Agregar primera tienda
          </button>
        </div>
      )}
    </div>
  );
}
