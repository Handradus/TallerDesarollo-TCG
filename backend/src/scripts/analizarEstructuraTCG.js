const fs = require('fs');
const path = require('path');

// Script para analizar la estructura de datos antes de migrar
async function analizarEstructuraTCG() {
  console.log('🔍 === ANÁLISIS DE ESTRUCTURA TCG-DATA ===\n');
  
  try {
    // Analizar sets
    console.log('📂 ANÁLISIS DE SETS:');
    const setsPath = path.join(__dirname, '../../pokemon-tcg-data-master/sets/en.json');
    
    if (!fs.existsSync(setsPath)) {
      console.error('❌ Archivo de sets no encontrado:', setsPath);
      return;
    }
    
    const setsData = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    console.log(`   • Total de sets: ${setsData.length}`);
    console.log(`   • Primer set: ${setsData[0].name} (${setsData[0].id})`);
    console.log(`   • Último set: ${setsData[setsData.length-1].name} (${setsData[setsData.length-1].id})`);
    
    // Mostrar algunos sets de ejemplo
    console.log('\n📋 Ejemplos de sets:');
    setsData.slice(0, 5).forEach(set => {
      console.log(`   • ${set.id}: "${set.name}" (${set.series}) - ${set.printedTotal} cartas - ${set.releaseDate}`);
    });
    
    // Analizar archivos de cartas
    console.log('\n🃏 ANÁLISIS DE ARCHIVOS DE CARTAS:');
    const cardsDir = path.join(__dirname, '../../pokemon-tcg-data-master/cards/en');
    
    if (!fs.existsSync(cardsDir)) {
      console.error('❌ Directorio de cartas no encontrado:', cardsDir);
      return;
    }
    
    const cardFiles = fs.readdirSync(cardsDir).filter(file => file.endsWith('.json'));
    console.log(`   • Total archivos de cartas: ${cardFiles.length}`);
    
    // Analizar algunos archivos para obtener estadísticas
    let totalCartas = 0;
    let ejemplosCartas = [];
    let setsEncontrados = new Set();
    
    console.log('\n📊 Analizando contenido de archivos...');
    
    for (let i = 0; i < Math.min(10, cardFiles.length); i++) {
      const file = cardFiles[i];
      const filePath = path.join(cardsDir, file);
      const cartasArchivo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      totalCartas += cartasArchivo.length;
      const setId = path.basename(file, '.json');
      setsEncontrados.add(setId);
      
      console.log(`   • ${file}: ${cartasArchivo.length} cartas (setId: ${setId})`);
      
      // Tomar una carta de ejemplo
      if (cartasArchivo.length > 0 && ejemplosCartas.length < 3) {
        ejemplosCartas.push({
          archivo: file,
          carta: cartasArchivo[0]
        });
      }
    }
    
    console.log(`\n📈 Estadísticas preliminares (primeros 10 archivos):`);
    console.log(`   • Total cartas analizadas: ${totalCartas}`);
    console.log(`   • Sets encontrados: ${setsEncontrados.size}`);
    console.log(`   • Promedio cartas por archivo: ${Math.round(totalCartas / Math.min(10, cardFiles.length))}`);
    
    // Mostrar estructura de cartas de ejemplo
    console.log('\n🎯 ESTRUCTURA DE CARTAS DE EJEMPLO:');
    ejemplosCartas.forEach((ejemplo, index) => {
      const carta = ejemplo.carta;
      console.log(`\n   Ejemplo ${index + 1} (${ejemplo.archivo}):`);
      console.log(`   • ID: ${carta.id}`);
      console.log(`   • Nombre: ${carta.name}`);
      console.log(`   • Número: ${carta.number}`);
      console.log(`   • Supertipo: ${carta.supertype}`);
      console.log(`   • Subtipos: ${carta.subtypes?.join(', ') || 'N/A'}`);
      console.log(`   • HP: ${carta.hp || 'N/A'}`);
      console.log(`   • Tipos: ${carta.types?.join(', ') || 'N/A'}`);
      console.log(`   • Rareza: ${carta.rarity || 'N/A'}`);
      console.log(`   • Artista: ${carta.artist || 'N/A'}`);
      console.log(`   • Imagen pequeña: ${carta.images?.small ? 'Sí' : 'No'}`);
      console.log(`   • Imagen grande: ${carta.images?.large ? 'Sí' : 'No'}`);
      console.log(`   • Ataques: ${carta.attacks?.length || 0}`);
      console.log(`   • Debilidades: ${carta.weaknesses?.length || 0}`);
    });
    
    // Verificar correspondencia entre sets y archivos
    console.log('\n🔗 VERIFICACIÓN DE CORRESPONDENCIAS SET-ARCHIVO:');
    const setIds = new Set(setsData.map(s => s.id));
    const fileSetIds = new Set(cardFiles.map(f => path.basename(f, '.json')));
    
    console.log(`   • Sets en sets/en.json: ${setIds.size}`);
    console.log(`   • Sets en archivos de cartas: ${fileSetIds.size}`);
    
    // Sets que están en sets.json pero no tienen archivo de cartas
    const setsSinArchivo = [...setIds].filter(id => !fileSetIds.has(id));
    if (setsSinArchivo.length > 0) {
      console.log(`   ⚠️ Sets sin archivo de cartas: ${setsSinArchivo.length}`);
      console.log(`      ${setsSinArchivo.slice(0, 10).join(', ')}${setsSinArchivo.length > 10 ? '...' : ''}`);
    }
    
    // Archivos que no tienen correspondencia en sets.json
    const archivosSinSet = [...fileSetIds].filter(id => !setIds.has(id));
    if (archivosSinSet.length > 0) {
      console.log(`   ⚠️ Archivos sin set correspondiente: ${archivosSinSet.length}`);
      console.log(`      ${archivosSinSet.slice(0, 10).join(', ')}${archivosSinSet.length > 10 ? '...' : ''}`);
    }
    
    // Estimación total
    console.log('\n💡 ESTIMACIÓN TOTAL:');
    const estimacionTotal = Math.round((totalCartas / Math.min(10, cardFiles.length)) * cardFiles.length);
    console.log(`   • Cartas totales estimadas: ~${estimacionTotal.toLocaleString()}`);
    
    console.log('\n✅ Análisis completado');
    console.log('🚀 Para migrar ejecuta: node migrarDatosTCG.js');
    
  } catch (error) {
    console.error('💥 Error en análisis:', error);
  }
}

// Ejecutar análisis si se llama directamente
if (require.main === module) {
  analizarEstructuraTCG();
}

module.exports = { analizarEstructuraTCG };
