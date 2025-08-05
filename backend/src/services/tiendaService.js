const { AppDataSource } = require('../data-source');
const Tienda = require('../entities/Tienda');

class TiendaService {
  
  /**
   * Crear una nueva tienda
   * @param {Object} datostienda - Datos de la tienda a crear
   * @returns {Object} - La tienda creada
   */
  async crearTienda(datosTienda) {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      // Validar datos requeridos
      this.validarDatosTienda(datosTienda);
      
      // Verificar que no existe una tienda con el mismo nombre
      const tiendaExistente = await tiendaRepo.findOneBy({ nombre: datosTienda.nombre });
      if (tiendaExistente) {
        throw new Error(`Ya existe una tienda con el nombre "${datosTienda.nombre}"`);
      }
      
      // Crear nueva instancia de tienda
      const nuevaTienda = tiendaRepo.create({
        nombre: datosTienda.nombre,
        descripcion: datosTienda.descripcion || null,
        valoracion: datosTienda.valoracion || null,
        urlBusqueda: datosTienda.urlBusqueda,
        tipoBusqueda: datosTienda.tipoBusqueda,
        urlBase: datosTienda.urlBase,
        direccion: datosTienda.direccion || null,
        telefono: datosTienda.telefono || null,
        logo: datosTienda.logo || null,
        ultimaActualizacion: new Date(),
        activo: datosTienda.activo !== undefined ? datosTienda.activo : true
      });
      
      // Guardar en la base de datos
      const tiendaGuardada = await tiendaRepo.save(nuevaTienda);
      
      console.log(`✅ Nueva tienda creada: ${tiendaGuardada.nombre} (ID: ${tiendaGuardada.id})`);
      return tiendaGuardada;
      
    } catch (error) {
      console.error('❌ Error al crear tienda:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener todas las tiendas
   * @param {Boolean} soloActivas - Si solo se deben obtener tiendas activas
   * @returns {Array} - Lista de tiendas
   */
  async obtenerTiendas(soloActivas = false) {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      const opciones = {};
      if (soloActivas) {
        opciones.where = { activo: true };
      }
      
      const tiendas = await tiendaRepo.find(opciones);
      
      console.log(`📋 Obtenidas ${tiendas.length} tienda(s)${soloActivas ? ' activas' : ''}`);
      return tiendas;
      
    } catch (error) {
      console.error('❌ Error al obtener tiendas:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener una tienda por ID
   * @param {Number} id - ID de la tienda
   * @returns {Object} - La tienda encontrada
   */
  async obtenerTiendaPorId(id) {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      const tienda = await tiendaRepo.findOneBy({ id: parseInt(id) });
      
      if (!tienda) {
        throw new Error(`No se encontró tienda con ID ${id}`);
      }
      
      console.log(`🔍 Tienda encontrada: ${tienda.nombre} (ID: ${tienda.id})`);
      return tienda;
      
    } catch (error) {
      console.error('❌ Error al obtener tienda por ID:', error.message);
      throw error;
    }
  }
  
  /**
   * Actualizar una tienda existente
   * @param {Number} id - ID de la tienda a actualizar
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} - La tienda actualizada
   */
  async actualizarTienda(id, datosActualizacion) {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      const tienda = await tiendaRepo.findOneBy({ id: parseInt(id) });
      if (!tienda) {
        throw new Error(`No se encontró tienda con ID ${id}`);
      }
      
      // Actualizar campos permitidos
      const camposPermitidos = [
        'nombre', 'descripcion', 'valoracion', 'urlBusqueda', 
        'tipoBusqueda', 'urlBase', 'direccion', 'telefono', 
        'logo', 'activo'
      ];
      
      camposPermitidos.forEach(campo => {
        if (datosActualizacion[campo] !== undefined) {
          tienda[campo] = datosActualizacion[campo];
        }
      });
      
      tienda.ultimaActualizacion = new Date();
      
      const tiendaActualizada = await tiendaRepo.save(tienda);
      
      console.log(`✅ Tienda actualizada: ${tiendaActualizada.nombre} (ID: ${tiendaActualizada.id})`);
      return tiendaActualizada;
      
    } catch (error) {
      console.error('❌ Error al actualizar tienda:', error.message);
      throw error;
    }
  }
  
  /**
   * Eliminar una tienda (desactivar)
   * @param {Number} id - ID de la tienda a eliminar
   * @returns {Object} - Resultado de la operación
   */
  async eliminarTienda(id) {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      const tienda = await tiendaRepo.findOneBy({ id: parseInt(id) });
      if (!tienda) {
        throw new Error(`No se encontró tienda con ID ${id}`);
      }
      
      // En lugar de eliminar físicamente, desactivamos la tienda
      tienda.activo = false;
      tienda.ultimaActualizacion = new Date();
      
      await tiendaRepo.save(tienda);
      
      console.log(`🗑️ Tienda desactivada: ${tienda.nombre} (ID: ${tienda.id})`);
      return { message: 'Tienda desactivada exitosamente', tienda };
      
    } catch (error) {
      console.error('❌ Error al eliminar tienda:', error.message);
      throw error;
    }
  }
  
  /**
   * Validar datos de tienda
   * @param {Object} datos - Datos a validar
   */
  validarDatosTienda(datos) {
    const errores = [];
    
    // Campos requeridos
    if (!datos.nombre || datos.nombre.trim() === '') {
      errores.push('El nombre de la tienda es requerido');
    } else {
      // Validar longitud del nombre
      if (datos.nombre.length > 100) {
        errores.push('El nombre no puede exceder 100 caracteres');
      }
      // Validar caracteres permitidos en el nombre
      if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-_.&()]+$/.test(datos.nombre)) {
        errores.push('El nombre solo puede contener letras, números, espacios y los caracteres: - _ . & ( )');
      }
    }
    
    // Validar descripción
    if (datos.descripcion && datos.descripcion.length > 500) {
      errores.push('La descripción no puede exceder 500 caracteres');
    }
    
    // Validar dirección
    if (datos.direccion && datos.direccion.length > 200) {
      errores.push('La dirección no puede exceder 200 caracteres');
    }
    
    // Validar teléfono
    if (datos.telefono) {
      const telefonoLimpio = datos.telefono.replace(/[\s\-+()]/g, '');
      if (!/^\d{8,15}$/.test(telefonoLimpio)) {
        errores.push('El teléfono debe contener solo números y tener entre 8 y 15 dígitos');
      }
    }
    
    if (!datos.urlBusqueda || datos.urlBusqueda.trim() === '') {
      errores.push('La URL de búsqueda es requerida');
    }
    
    if (!datos.tipoBusqueda || datos.tipoBusqueda.trim() === '') {
      errores.push('El tipo de búsqueda es requerido');
    }
    
    if (!datos.urlBase || datos.urlBase.trim() === '') {
      errores.push('La URL base es requerida');
    }
    
    // Validaciones de formato
    if (datos.valoracion !== null && datos.valoracion !== undefined) {
      const valoracion = parseFloat(datos.valoracion);
      if (isNaN(valoracion) || valoracion < 0 || valoracion > 5) {
        errores.push('La valoración debe ser un número entre 0 y 5');
      }
    }
    
    // Validar URLs si están presentes
    const urlFields = [
      { field: 'urlBusqueda', name: 'URL de búsqueda' },
      { field: 'urlBase', name: 'URL base' },
      { field: 'logo', name: 'URL del logo' }
    ];
    
    urlFields.forEach(({ field, name }) => {
      if (datos[field]) {
        // Validar longitud de URL
        if (datos[field].length > 500) {
          errores.push(`${name} no puede exceder 500 caracteres`);
        } else if (!this.esUrlValidaConWww(datos[field])) {
          errores.push(`${name} debe ser una URL válida que contenga "www."`);
        }
      }
    });
    
    if (errores.length > 0) {
      throw new Error(`Errores de validación: ${errores.join(', ')}`);
    }
  }
  
  /**
   * Validar si una URL es válida
   * @param {String} url - URL a validar
   * @returns {Boolean} - True si es válida
   */
  esUrlValida(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validar si una URL es válida y contiene www
   * @param {String} url - URL a validar
   * @returns {Boolean} - True si es válida y contiene www
   */
  esUrlValidaConWww(url) {
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
  }
  
  /**
   * Obtener tiendas para administración (incluye inactivas)
   * @returns {Array} - Lista de todas las tiendas
   */
  async obtenerTiendasParaAdmin() {
    try {
      const tiendaRepo = AppDataSource.getRepository(Tienda);
      
      const tiendas = await tiendaRepo.find({
        order: { ultimaActualizacion: 'DESC' }
      });
      
      console.log(`📋 Obtenidas ${tiendas.length} tienda(s) para administración`);
      return tiendas;
      
    } catch (error) {
      console.error('❌ Error al obtener tiendas para admin:', error.message);
      throw error;
    }
  }

  /**
   * Obtener tipos de búsqueda disponibles
   * @returns {Array} - Lista de tipos de búsqueda
   */
  obtenerTiposBusqueda() {
    return [
      'shopify',
      'levelup',
      'woocommerce',
      'prestashop',
      'magento',
      'custom',
      'api'
    ];
  }
}

module.exports = new TiendaService();
