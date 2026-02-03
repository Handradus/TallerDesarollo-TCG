// Utilidades para ordenar resultados de cartas
export const ordenarCartas = (cartas, criterio, direccion) => {
  if (criterio === 'defecto' || !cartas || cartas.length === 0) {
    return [...cartas];
  }

  const cartasOrdenadas = [...cartas].sort((a, b) => {
    let valorA, valorB;

    switch (criterio) {
      case 'numero':
        // Ordenar por número de carta (manejar formatos como "25/102", "SWSH001", etc.)
        const numA = a.numero ? parseInt(a.numero.replace(/[^\d]/g, '')) || 0 : 0;
        const numB = b.numero ? parseInt(b.numero.replace(/[^\d]/g, '')) || 0 : 0;
        valorA = numA;
        valorB = numB;
        break;

      case 'rareza':
        // Definir orden de rareza (de común a ultra raro)
        const ordenRareza = {
          'common': 1, 'uncommon': 2, 'rare': 3, 'rare holo': 4,
          'rare ultra': 5, 'secret rare': 6, 'amazing rare': 7,
          'radiant rare': 8, 'classic collection': 9,
          'promo': 10, 'special': 11
        };
        valorA = ordenRareza[a.rareza?.toLowerCase()] || 999;
        valorB = ordenRareza[b.rareza?.toLowerCase()] || 999;
        break;

      case 'alfabetico':
        valorA = a.nombre?.toLowerCase() || '';
        valorB = b.nombre?.toLowerCase() || '';
        break;

      case 'set':
        valorA = a.set?.toLowerCase() || '';
        valorB = b.set?.toLowerCase() || '';
        break;

      case 'fecha':
        valorA = a.fechaLanzamiento ? new Date(a.fechaLanzamiento).getTime() : 0;
        valorB = b.fechaLanzamiento ? new Date(b.fechaLanzamiento).getTime() : 0;
        break;

      default:
        valorA = a.nombre?.toLowerCase() || '';
        valorB = b.nombre?.toLowerCase() || '';
        break;
    }

    // Aplicar dirección del ordenamiento
    if (direccion === 'desc') {
      return valorB > valorA ? 1 : valorB < valorA ? -1 : 0;
    } else {
      return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
    }
  });

  return cartasOrdenadas;
};
