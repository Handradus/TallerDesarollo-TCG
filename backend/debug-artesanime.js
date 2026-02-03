const { AppDataSource } = require('./src/data-source');
const Tienda = require('./src/entities/Tienda');

async function verificarArtesanime() {
  try {
    await AppDataSource.initialize();
    const tiendaRepo = AppDataSource.getRepository(Tienda);
    
    const artesanime = await tiendaRepo.findOne({ 
      where: { nombre: 'Artesanime' }
    });
    
    if (!artesanime) {
      console.log('❌ Artesanime no encontrada');
      return;
    }
    
    console.log('🏪 CONFIGURACIÓN DE ARTESANIME:');
    console.log('='.repeat(40));
    console.log('Nombre:', artesanime.nombre);
    console.log('Tipo de búsqueda:', artesanime.tipoBusqueda);
    console.log('URL Base:', artesanime.urlBase);
    console.log('Patrón de búsqueda:', artesanime.patronBusqueda);
    console.log('Activa:', artesanime.activo);
    
    // Generar URL de ejemplo para Pikachu
    if (artesanime.urlBase && artesanime.patronBusqueda) {
      const urlEjemplo = artesanime.urlBase + artesanime.patronBusqueda.replace('BUSQUEDA', 'pikachu');
      console.log('\n🔍 URL que se generaría para "pikachu":');
      console.log(urlEjemplo);
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verificarArtesanime();
