const fs = require('fs');
const path = require('path');
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');

// Script de migración para importar datos de pokemon-tcg-data-master
async function migrarDatosTCG() {
  console.log('🚀 === INICIANDO MIGRACIÓN DE DATOS TCG ===');
  
  try {
    // Inicializar conexión a BD
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Base de datos conectada');
    }

    const cartaRepo = AppDataSource.getRepository(Carta);
    
    // Paso 1: Cargar información de sets
    console.log('📂 Paso 1: Cargando información de sets...');
    const setsPath = path.join(__dirname, '../../pokemon-tcg-data-master/sets/en.json');
    const setsData = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    
    // Crear un mapa de sets para hacer JOIN rápido
    const setsMap = {};
    setsData.forEach(set => {
      setsMap[set.id] = {
        name: set.name,
        series: set.series,
        printedTotal: set.printedTotal,
        releaseDate: set.releaseDate
      };
    });
    
    console.log(`✅ ${setsData.length} sets cargados en memoria`);
    
    // Paso 2: Procesar archivos de cartas
    console.log('🃏 Paso 2: Procesando archivos de cartas...');
    const cardsDir = path.join(__dirname, '../../pokemon-tcg-data-master/cards/en');
    const cardFiles = fs.readdirSync(cardsDir).filter(file => file.endsWith('.json'));
    
    console.log(`📁 Encontrados ${cardFiles.length} archivos de cartas`);
    
    let totalCartasProcesadas = 0;
    let cartasInsertadas = 0;
    let errores = 0;
    
    // Procesar archivos en lotes para evitar sobrecarga de memoria
    const LOTE_SIZE = 10;
    
    for (let i = 0; i < cardFiles.length; i += LOTE_SIZE) {
      const lote = cardFiles.slice(i, i + LOTE_SIZE);
      console.log(`\n📦 Procesando lote ${Math.floor(i/LOTE_SIZE) + 1}/${Math.ceil(cardFiles.length/LOTE_SIZE)}: archivos ${i+1}-${i+lote.length}`);
      
      for (const file of lote) {
        try {
          console.log(`  🔍 Procesando: ${file}`);
          
          // Extraer setId del nombre del archivo (ej: base1.json -> base1)
          const setId = path.basename(file, '.json');
          const setInfo = setsMap[setId];
          
          if (!setInfo) {
            console.warn(`  ⚠️  Set no encontrado para archivo: ${file} (setId: ${setId})`);
            continue;
          }
          
          // Leer cartas del archivo
          const filePath = path.join(cardsDir, file);
          const cartasArchivo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          console.log(`    📊 ${cartasArchivo.length} cartas en ${file}`);
          
          // Procesar cada carta
          for (const cartaJson of cartasArchivo) {
            try {
              // Verificar si la carta ya existe (por id único de la API)
              const existeId = cartaJson.id; // ej: "base1-1"
              const existe = await cartaRepo.findOne({ 
                where: { 
                  numero: cartaJson.number,
                  set: setInfo.name 
                } 
              });
              
              if (existe) {
                totalCartasProcesadas++;
                continue; // Skip carta duplicada
              }
              
              // Mapear datos de la carta
              const nuevaCarta = {
                nombre: cartaJson.name,
                numero: cartaJson.number,
                set: setInfo.name,
                setId: setId,
                serie: setInfo.series,
                printedTotal: setInfo.printedTotal,
                fechaLanzamiento: setInfo.releaseDate ? new Date(setInfo.releaseDate) : null,
                supertipo: cartaJson.supertype,
                subtipos: cartaJson.subtypes,
                nivel: cartaJson.level,
                hp: cartaJson.hp,
                tipos: cartaJson.types,
                evolucionaA: cartaJson.evolvesTo, // Nota: mapeo corregido
                retreatCost: cartaJson.retreatCost,
                debilidades: cartaJson.weaknesses,
                ataques: cartaJson.attacks,
                reglas: cartaJson.rules,
                rareza: cartaJson.rarity,
                ilustrador: cartaJson.artist,
                flavorText: cartaJson.flavorText,
                pokedexIds: cartaJson.nationalPokedexNumbers,
                imagenPequena: cartaJson.images?.small,
                imagenGrande: cartaJson.images?.large,
                // Precios se mantendrán null ya que no están en los JSON
                precioNormal: null,
                precioHolofoil: null,
                precioPriceCharting: null,
                urlPriceCharting: null,
                precioGradedPriceCharting: null,
                fechaActualizacionPrecios: null
              };
              
              await cartaRepo.save(nuevaCarta);
              cartasInsertadas++;
              totalCartasProcesadas++;
              
              // Mostrar progreso cada 100 cartas
              if (totalCartasProcesadas % 100 === 0) {
                console.log(`    ✨ Progreso: ${totalCartasProcesadas} cartas procesadas (${cartasInsertadas} insertadas)`);
              }
              
            } catch (error) {
              errores++;
              console.error(`    ❌ Error al procesar carta ${cartaJson.name || 'sin nombre'} de ${file}:`, error.message);
            }
          }
          
          console.log(`    ✅ ${file} completado`);
          
        } catch (error) {
          errores++;
          console.error(`  ❌ Error al procesar archivo ${file}:`, error.message);
        }
      }
      
      // Pausa breve entre lotes para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Estadísticas finales
    console.log('\n🎉 === MIGRACIÓN COMPLETADA ===');
    console.log(`📊 Estadísticas:`);
    console.log(`   • Total cartas procesadas: ${totalCartasProcesadas}`);
    console.log(`   • Cartas insertadas: ${cartasInsertadas}`);
    console.log(`   • Cartas duplicadas (saltadas): ${totalCartasProcesadas - cartasInsertadas}`);
    console.log(`   • Errores: ${errores}`);
    console.log(`   • Sets procesados: ${Object.keys(setsMap).length}`);
    console.log(`   • Archivos de cartas: ${cardFiles.length}`);
    
    // Verificación final
    const totalEnBD = await cartaRepo.count();
    console.log(`🗄️ Total de cartas en BD después de migración: ${totalEnBD}`);
    
  } catch (error) {
    console.error('💥 Error fatal en migración:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión a BD cerrada');
    }
  }
}

// Función auxiliar para limpiar datos antes de migrar (opcional)
async function limpiarTablaCartas() {
  console.log('🧹 === LIMPIANDO TABLA CARTAS ===');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  const cartaRepo = AppDataSource.getRepository(Carta);
  
  // Contar cartas actuales
  const totalAntes = await cartaRepo.count();
  console.log(`📊 Cartas actuales en BD: ${totalAntes}`);
  
  if (totalAntes > 0) {
    // Preguntar confirmación (en un entorno real usarías readline)
    console.log('⚠️ ADVERTENCIA: Esto eliminará TODAS las cartas existentes');
    console.log('💡 Para continuar, descomenta la línea de DELETE en el código');
    
    // Descomenta la siguiente línea si quieres limpiar la tabla
    // await cartaRepo.clear();
    
    console.log('✅ Tabla cartas limpiada (si descomentaste la línea)');
  } else {
    console.log('✅ Tabla cartas ya está vacía');
  }
}

// Ejecutar migración
if (require.main === module) {
  console.log('🎯 Iniciando script de migración...');
  console.log('💡 Opciones:');
  console.log('   node migrarDatosTCG.js        - Migrar datos (sin limpiar)');
  console.log('   node migrarDatosTCG.js clean  - Limpiar tabla primero');
  console.log('');
  
  const args = process.argv.slice(2);
  
  if (args.includes('clean')) {
    limpiarTablaCartas().then(() => {
      console.log('🔄 Ahora ejecuta sin "clean" para migrar datos');
    });
  } else {
    migrarDatosTCG();
  }
}

module.exports = { migrarDatosTCG, limpiarTablaCartas };
