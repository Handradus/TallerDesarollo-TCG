const { AppDataSource } = require('./src/data-source');
const Tienda = require('./src/entities/Tienda');
const { buscarEnTiendaJumpseller } = require('./src/helpers/buscadores');

async function testJumpsellerScraper() {
  try {
    console.log('🔄 Initializing database source...');
    await AppDataSource.initialize();
    
    const tiendaRepo = AppDataSource.getRepository(Tienda);
    
    const artesanime = await tiendaRepo.findOne({ 
      where: { nombre: 'Artesanime' }
    });
    
    if (!artesanime) {
      console.log('❌ Artesanime not found.');
      await AppDataSource.destroy();
      return;
    }
    
    // We search for card 91/98. On Jumpseller we can query "91 98" or "91/98"
    // Since we now normalize the query, we can mock it here
    const mockupCard = {
      nombre: '', // Searching just by number is common
      numero: '91',
      printedTotal: 98,
      set: ''
    };
    
    console.log(`🔍 Scraping for card 91/98...`);
    
    const result = await buscarEnTiendaJumpseller(artesanime, mockupCard);
    
    console.log('\n📊 SCRAPING RESULT:');
    console.log('='.repeat(40));
    console.log(result);
    console.log('='.repeat(40));
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('💥 Error running diagnostic:', error.message);
  }
}

testJumpsellerScraper();
