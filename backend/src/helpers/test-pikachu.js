const { buscarEnTiendaShopify } = require('./buscadores');

async function testPikachuEspecifico() {
  // Simular la carta Pikachu 025/165 exactamente como estaría en la BD
  const cartaTest = {
    nombre: "Pikachu", 
    numero: 25,
    printedTotal: 165,
    set: "sv" // Scarlet Violet
  };

  // Tienda Game of Magic Singles
  const tiendaTest = {
    nombre: 'Game of Magic Singles',
    urlBusqueda: 'https://gameofmagicsingles.cl/search?q=BUSQUEDA',
    urlBase: 'https://gameofmagicsingles.cl'
  };

  console.log(`🎯 TEST ESPECÍFICO: Buscando Pikachu 025/165 en Game of Magic`);
  console.log(`📋 Datos carta:`);
  console.log(`   - Nombre: "${cartaTest.nombre}"`);
  console.log(`   - Número: ${cartaTest.numero}`);
  console.log(`   - PrintedTotal: ${cartaTest.printedTotal}`);
  console.log(`   - Set: "${cartaTest.set}"`);
  
  try {
    const resultado = await buscarEnTiendaShopify(tiendaTest, cartaTest);
    
    if (resultado) {
      console.log(`\n✅ ÉXITO: Carta encontrada!`);
      console.log(`   URL: ${resultado.url}`);
      console.log(`   Precio: ${resultado.precio}`);
    } else {
      console.log(`\n❌ FALLO: No se encontró la carta`);
    }
    
  } catch (error) {
    console.error(`❌ ERROR EN TEST:`, error.message);
  }
}

// Ejecutar el test
testPikachuEspecifico();
