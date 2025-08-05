const { AppDataSource } = require('../data-source');
const tiendaService = require('../services/tiendaService');

async function probarCrearTienda() {
  try {
    // Inicializar conexión a la base de datos
    await AppDataSource.initialize();
    console.log('📦 Conectado a la base de datos para pruebas');

    // Datos de ejemplo para crear una tienda
    const datosEjemplo = {
      nombre: "Tienda de Prueba TCG",
      descripcion: "Una tienda de prueba para cartas Pokemon TCG",
      valoracion: 4.5,
      urlBusqueda: "https://tiendaprueba.com/search?q=BUSQUEDA",
      tipoBusqueda: "shopify",
      urlBase: "https://tiendaprueba.com",
      direccion: "Calle Falsa 123, Ciudad",
      telefono: "+56912345678",
      logo: "https://tiendaprueba.com/logo.png",
      activo: true
    };

    console.log('🏪 Creando tienda de prueba...');
    console.log('📝 Datos:', datosEjemplo);

    const nuevaTienda = await tiendaService.crearTienda(datosEjemplo);
    
    console.log('✅ ¡Tienda creada exitosamente!');
    console.log('🆔 ID:', nuevaTienda.id);
    console.log('🏪 Nombre:', nuevaTienda.nombre);
    console.log('🌐 URL Base:', nuevaTienda.urlBase);
    console.log('🖼️ Logo:', nuevaTienda.logo);

    // Probar obtener la tienda creada
    console.log('\n🔍 Probando obtener tienda por ID...');
    const tiendaObtenida = await tiendaService.obtenerTiendaPorId(nuevaTienda.id);
    console.log('✅ Tienda obtenida:', tiendaObtenida.nombre);

    // Probar listar todas las tiendas
    console.log('\n📋 Probando listar todas las tiendas...');
    const todasLasTiendas = await tiendaService.obtenerTiendas();
    console.log(`✅ Total de tiendas: ${todasLasTiendas.length}`);

    // Probar actualizar la tienda
    console.log('\n✏️ Probando actualizar tienda...');
    const datosActualizacion = {
      descripcion: "Descripción actualizada de la tienda de prueba",
      valoracion: 5.0
    };
    
    const tiendaActualizada = await tiendaService.actualizarTienda(nuevaTienda.id, datosActualizacion);
    console.log('✅ Tienda actualizada:', tiendaActualizada.descripcion);
    console.log('⭐ Nueva valoración:', tiendaActualizada.valoracion);

    // Probar validación de datos inválidos
    console.log('\n🚫 Probando validación con datos inválidos...');
    try {
      await tiendaService.crearTienda({
        nombre: "", // Nombre vacío - debería fallar
        urlBusqueda: "url-invalida"
      });
    } catch (error) {
      console.log('✅ Validación funcionando correctamente:', error.message);
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  } finally {
    // Cerrar conexión
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar las pruebas
probarCrearTienda();
