// Script de prueba para verificar conectividad del backend
async function probarConexion() {
  console.log('🔍 Probando conexión al backend...');
  
  const endpoints = [
    'http://localhost:3000/api/cartas/222/tiendas',
    'http://localhost:3001/api/cartas/222/tiendas'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando: ${endpoint}`);
      const response = await fetch(endpoint);
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Respuesta recibida:`, Object.keys(data));
        break;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Ejecutar cuando la página esté cargada
if (typeof window !== 'undefined') {
  window.probarConexion = probarConexion;
  console.log('💡 Ejecuta probarConexion() en la consola para probar la conexión');
}
