const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');

// Script para verificar el estado de la base de datos
async function verificarBaseDatos() {
  console.log('🔍 === VERIFICACIÓN DE BASE DE DATOS ===\n');
  
  try {
    // Inicializar conexión
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conectado a la base de datos');
    }
    
    const cartaRepo = AppDataSource.getRepository(Carta);
    
    // Estadísticas generales
    console.log('📊 ESTADÍSTICAS GENERALES:');
    const totalCartas = await cartaRepo.count();
    console.log(`   • Total cartas en BD: ${totalCartas.toLocaleString()}`);
    
    if (totalCartas === 0) {
      console.log('📭 La base de datos está vacía - lista para migración');
      return;
    }
    
    // Análisis por sets
    console.log('\n🎮 ANÁLISIS POR SETS:');
    const cartasPorSet = await cartaRepo
      .createQueryBuilder('carta')
      .select('carta.set', 'set')
      .addSelect('carta.serie', 'serie') 
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('carta.set')
      .addGroupBy('carta.serie')
      .orderBy('COUNT(*)', 'DESC')
      .limit(20)
      .getRawMany();
    
    console.log(`   Top 20 sets con más cartas:`);
    cartasPorSet.forEach((set, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${set.set} (${set.serie}): ${set.cantidad} cartas`);
    });
    
    // Análisis por tipos
    console.log('\n🌟 ANÁLISIS POR TIPOS:');
    const cartasPorTipo = await cartaRepo
      .createQueryBuilder('carta')
      .select('carta.supertipo', 'supertipo')
      .addSelect('COUNT(*)', 'cantidad')
      .where('carta.supertipo IS NOT NULL')
      .groupBy('carta.supertipo')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();
    
    console.log(`   Distribución por supertipo:`);
    cartasPorTipo.forEach((tipo) => {
      console.log(`   • ${tipo.supertipo}: ${tipo.cantidad} cartas`);
    });
    
    // Análisis por rareza
    console.log('\n💎 ANÁLISIS POR RAREZA:');
    const cartasPorRareza = await cartaRepo
      .createQueryBuilder('carta')
      .select('carta.rareza', 'rareza')
      .addSelect('COUNT(*)', 'cantidad')
      .where('carta.rareza IS NOT NULL')
      .groupBy('carta.rareza')
      .orderBy('COUNT(*)', 'DESC')
      .limit(15)
      .getRawMany();
    
    console.log(`   Top 15 rarezas:`);
    cartasPorRareza.forEach((rareza, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${rareza.rareza}: ${rareza.cantidad} cartas`);
    });
    
    // Verificar integridad de datos
    console.log('\n🔍 VERIFICACIÓN DE INTEGRIDAD:');
    
    // Cartas sin imágenes
    const sinImagenes = await cartaRepo
      .createQueryBuilder('carta')
      .where('carta.imagenPequena IS NULL OR carta.imagenGrande IS NULL')
      .getCount();
    console.log(`   • Cartas sin imágenes: ${sinImagenes}`);
    
    // Cartas sin set
    const sinSet = await cartaRepo
      .createQueryBuilder('carta')
      .where('carta.set IS NULL OR carta.set = \'\'')
      .getCount();
    console.log(`   • Cartas sin información de set: ${sinSet}`);
    
    // Cartas con precios
    const conPrecioNormal = await cartaRepo
      .createQueryBuilder('carta')
      .where('carta.precioNormal IS NOT NULL AND carta.precioNormal > 0')
      .getCount();
    console.log(`   • Cartas con precio normal: ${conPrecioNormal}`);
    
    const conPrecioHolo = await cartaRepo
      .createQueryBuilder('carta')
      .where('carta.precioHolofoil IS NOT NULL AND carta.precioHolofoil > 0')
      .getCount();
    console.log(`   • Cartas con precio holofoil: ${conPrecioHolo}`);
    
    // Ejemplos de cartas
    console.log('\n🎯 EJEMPLOS DE CARTAS EN BD:');
    const ejemplos = await cartaRepo
      .createQueryBuilder('carta')
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();
    
    ejemplos.forEach((carta, index) => {
      console.log(`\n   Ejemplo ${index + 1}:`);
      console.log(`   • ID: ${carta.id}`);
      console.log(`   • Nombre: ${carta.nombre}`);
      console.log(`   • Set: ${carta.set} (${carta.serie})`);
      console.log(`   • Número: ${carta.numero}`);
      console.log(`   • Tipo: ${carta.supertipo}`);
      console.log(`   • HP: ${carta.hp || 'N/A'}`);
      console.log(`   • Rareza: ${carta.rareza || 'N/A'}`);
      console.log(`   • Imagen: ${carta.imagenPequena ? 'Sí' : 'No'}`);
      console.log(`   • Precio Normal: ${carta.precioNormal || 'N/A'}`);
      console.log(`   • Fecha creación: ${carta.fechaCreacion?.toLocaleDateString() || 'N/A'}`);
    });
    
    // Cartas más recientes
    console.log('\n⏰ CARTAS MÁS RECIENTES:');
    const recientes = await cartaRepo
      .createQueryBuilder('carta')
      .orderBy('carta.fechaCreacion', 'DESC')
      .limit(10)
      .getMany();
    
    recientes.forEach((carta, index) => {
      console.log(`   ${index + 1}. ${carta.nombre} (${carta.set}) - ${carta.fechaCreacion?.toLocaleDateString()}`);
    });
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('💥 Error en verificación:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Función para limpiar completamente la tabla (usar con cuidado)
async function limpiarCompletaTablaCartas() {
  console.log('🧹 === LIMPIEZA COMPLETA DE TABLA CARTAS ===\n');
  console.log('⚠️  ADVERTENCIA: Esta acción eliminará TODAS las cartas de la base de datos');
  console.log('⚠️  Esta acción NO se puede deshacer');
  
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const cartaRepo = AppDataSource.getRepository(Carta);
    const totalAntes = await cartaRepo.count();
    
    console.log(`📊 Cartas actuales: ${totalAntes.toLocaleString()}`);
    
    if (totalAntes === 0) {
      console.log('✅ La tabla ya está vacía');
      return;
    }
    
    console.log('🗑️ Procediendo con limpieza...');
    
    // Eliminar todos los registros
    await cartaRepo.clear();
    
    const totalDespues = await cartaRepo.count();
    console.log(`✅ Limpieza completada. Cartas restantes: ${totalDespues}`);
    
    // Reset del autoincrement (PostgreSQL)
    await AppDataSource.query('ALTER SEQUENCE cartas_id_seq RESTART WITH 1');
    console.log('🔄 Secuencia de ID reiniciada');
    
  } catch (error) {
    console.error('💥 Error en limpieza:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar según argumentos
if (require.main === module) {
  const args = process.argv.slice(2);
  
  console.log('🎯 Script de verificación de BD');
  console.log('💡 Opciones:');
  console.log('   node verificarBD.js           - Verificar estado actual');
  console.log('   node verificarBD.js clean     - ⚠️ LIMPIAR TABLA COMPLETA');
  console.log('');
  
  if (args.includes('clean')) {
    console.log('🚨 Modo de limpieza activado');
    console.log('⏰ Iniciando en 3 segundos... (Ctrl+C para cancelar)');
    setTimeout(() => {
      limpiarCompletaTablaCartas();
    }, 3000);
  } else {
    verificarBaseDatos();
  }
}

module.exports = { verificarBaseDatos, limpiarCompletaTablaCartas };
