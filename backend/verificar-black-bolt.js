const { AppDataSource } = require('./src/data-source');

async function verificarBlackBolt() {
  try {
    await AppDataSource.initialize();
    const cartaRepo = AppDataSource.getRepository('Carta');
    
    const cartasBlackBolt = await cartaRepo
      .createQueryBuilder('carta')
      .where('LOWER(carta.set) LIKE LOWER(:set)', { set: '%black bolt%' })
      .take(10)
      .getMany();
    
    console.log('🔍 Cartas encontradas con "black bolt" en el set:');
    cartasBlackBolt.forEach((carta, i) => {
      console.log(`   ${i+1}. ${carta.nombre} (${carta.set}) - ${carta.numero}/${carta.printedTotal}`);
    });
    
    if (cartasBlackBolt.length === 0) {
      console.log('❌ No se encontraron cartas con "black bolt" como set');
    } else {
      console.log(`✅ Se encontraron ${cartasBlackBolt.length} cartas con "black bolt" como set`);
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarBlackBolt();
