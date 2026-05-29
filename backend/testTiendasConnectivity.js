const { AppDataSource } = require('./src/data-source');
const Tienda = require('./src/entities/Tienda');
const axios = require('axios');

async function testTiendas() {
  console.log('🚀 Iniciando escaneo y test de conectividad de tiendas...\n');
  try {
    await AppDataSource.initialize();
    const tiendaRepo = AppDataSource.getRepository(Tienda);
    const tiendas = await tiendaRepo.find({ order: { nombre: 'ASC' } });

    console.log(`📋 Encontradas ${tiendas.length} tiendas en la BD.`);
    console.log(`========================================================================`);
    console.log(`| ID  | Tienda                       | Tipo         | Activa | Estado   | Detalles`);
    console.log(`========================================================================`);

    const reporte = [];

    for (const t of tiendas) {
      let statusIcon = '✅ FUNCIONAL';
      let errorMsg = '';
      const urlToTest = t.urlBase || t.urlBusqueda.replace('BUSQUEDA', 'pikachu');

      try {
        const response = await axios.get(urlToTest, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000,
          validateStatus: () => true
        });

        if (response.status >= 200 && response.status < 400) {
          statusIcon = '✅ FUNCIONAL';
        } else {
          statusIcon = `⚠️ STATUS ${response.status}`;
          errorMsg = `Respondió con código de estado HTTP ${response.status}`;
        }
      } catch (err) {
        statusIcon = '❌ ERROR';
        errorMsg = err.message;
      }

      const activeText = t.activo ? 'SI' : 'NO';
      console.log(`| ${t.id.toString().padEnd(3)} | ${t.nombre.padEnd(28)} | ${t.tipoBusqueda.padEnd(12)} | ${activeText.padEnd(6)} | ${statusIcon.padEnd(10)} | ${errorMsg}`);
      
      reporte.push({
        id: t.id,
        nombre: t.nombre,
        tipoBusqueda: t.tipoBusqueda,
        activo: t.activo,
        estado: statusIcon,
        detalles: errorMsg || 'Conexión exitosa HTTP 2xx/3xx'
      });
    }

    console.log(`========================================================================`);
    console.log('\n📝 Generando reporte en formato markdown...');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error general durante el testeo:', error);
  }
}

testTiendas();
