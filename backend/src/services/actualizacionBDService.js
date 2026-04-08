// Service para actualizar BD con cartas desde API
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');

// Función para guardar cartas de API a BD
async function guardarCartasDesdeAPI(cartasAPI) {
  console.log(`💾 === ACTUALIZANDO BD === ${cartasAPI.length} cartas desde API`);
  
  const repository = AppDataSource.getRepository(Carta);
  let cartasGuardadas = [];
  let cartasActualizadas = [];
  let errores = [];

  for (const cartaAPI of cartasAPI) {
    try {
      // Buscar si ya existe en BD
      const cartaExistente = await repository.findOne({
        where: {
          numero: cartaAPI.numero,
          set: cartaAPI.set
        }
      });

      if (cartaExistente) {
        // ACTUALIZAR carta existente
        console.log(`🔄 Actualizando: ${cartaAPI.nombre} (${cartaAPI.numero})`);
        
        // Actualizar campos (usar las propiedades correctas de la API)
        cartaExistente.nombre = cartaAPI.nombre;
        cartaExistente.rareza = cartaAPI.rareza;
        cartaExistente.imagenPequena = cartaAPI.imagenPequena || cartaAPI.imagen;
        cartaExistente.imagenGrande = cartaAPI.imagenGrande || cartaAPI.imagen;
        cartaExistente.precioNormal = cartaAPI.precioNormal || cartaAPI.precio;
        cartaExistente.precioHolofoil = cartaAPI.precioHolofoil;
        // No existe fechaActualizacion en la entidad, se omite
        
        const cartaActualizada = await repository.save(cartaExistente);
        cartasActualizadas.push({
          ...cartaActualizada,
          accion: 'ACTUALIZADA',
          fechaOperacion: new Date().toISOString()
        });

      } else {
        // CREAR nueva carta
        console.log(`➕ Guardando nueva: ${cartaAPI.nombre} (${cartaAPI.numero})`);
        
        const nuevaCarta = repository.create({
          nombre: cartaAPI.nombre,
          numero: cartaAPI.numero,
          set: cartaAPI.set,
          rareza: cartaAPI.rareza,
          imagenPequena: cartaAPI.imagenPequena || cartaAPI.imagen,
          imagenGrande: cartaAPI.imagenGrande || cartaAPI.imagen,
          precioNormal: cartaAPI.precioNormal || cartaAPI.precio,
          precioHolofoil: cartaAPI.precioHolofoil,
        });
        
        const cartaGuardada = await repository.save(nuevaCarta);
        cartasGuardadas.push({
          ...cartaGuardada,
          accion: 'NUEVA',
          fechaOperacion: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`❌ Error con ${cartaAPI.nombre}:`, error.message);
      errores.push({
        carta: cartaAPI.nombre,
        error: error.message,
        numero: cartaAPI.numero
      });
    }
  }

  // Resumen de operaciones
  console.log(`✅ ACTUALIZACIÓN COMPLETADA:`);
  console.log(`   • Cartas nuevas guardadas: ${cartasGuardadas.length}`);
  console.log(`   • Cartas actualizadas: ${cartasActualizadas.length}`);
  console.log(`   • Errores: ${errores.length}`);

  return {
    nuevas: cartasGuardadas,
    actualizadas: cartasActualizadas,
    errores: errores,
    resumen: {
      totalNuevas: cartasGuardadas.length,
      totalActualizadas: cartasActualizadas.length,
      totalErrores: errores.length,
      fechaOperacion: new Date().toISOString()
    }
  };
}

module.exports = { guardarCartasDesdeAPI };
