const { AppDataSource } = require('./src/data-source');
const { buscarEnBD } = require('./src/services/busquedaBDService');

async function probarBlackBolt() {
  try {
    // Inicializar la conexión
    await AppDataSource.initialize();
    
    console.log('🧪 === PROBANDO BÚSQUEDA "BLACK BOLT" ===');
    const resultado = await buscarEnBD('black bolt');
    
    console.log(`\n✅ Resultado: ${resultado.length} cartas encontradas`);
    resultado.slice(0, 5).forEach((carta, i) => {
      console.log(`   ${i+1}. ${carta.nombre} (${carta.set}) - ${carta.numero}/${carta.printedTotal}`);
    });
    
    if (resultado.length > 5) {
      console.log(`   ... y ${resultado.length - 5} cartas más`);
    }
    
    // Cerrar conexión
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

probarBlackBolt();
