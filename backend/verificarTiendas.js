const { AppDataSource } = require('./src/data-source');
const Tienda = require('./src/entities/Tienda');

async function verificarTiendas() {
  try {
    await AppDataSource.initialize();
    const tiendaRepo = AppDataSource.getRepository(Tienda);
    
    const totalTiendas = await tiendaRepo.count();
    const tiendasActivas = await tiendaRepo.count({ where: { activo: true } });
    const tiendasInactivas = await tiendaRepo.count({ where: { activo: false } });
    
    console.log('📊 ESTADÍSTICAS DE TIENDAS:');
    console.log('- Total de tiendas:', totalTiendas);
    console.log('- Tiendas activas:', tiendasActivas);
    console.log('- Tiendas inactivas:', tiendasInactivas);
    
    const tiendas = await tiendaRepo.find({ 
      select: ['id', 'nombre', 'activo', 'tipoBusqueda'],
      order: { nombre: 'ASC' }
    });
    
    console.log('\n📋 LISTADO DE TIENDAS:');
    tiendas.forEach(t => {
      const estado = t.activo ? '✅' : '❌';
      console.log(`${estado} ${t.nombre} (${t.tipoBusqueda})`);
    });
    
    // Ver cuáles están siendo usadas en verificarTiendas.js
    const tiendasActivasLista = tiendas.filter(t => t.activo);
    console.log(`\n🔍 Se buscarán en ${tiendasActivasLista.length} tiendas activas`);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verificarTiendas();
