const axios = require('axios');
const cheerio = require('cheerio');

class PriceChartingService {
  constructor() {
    this.baseURL = 'https://www.pricecharting.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  normalizarParaBusqueda(texto) {
    return texto
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s#\/\-]/g, " ") // Mantener # / - para números y sets
      .replace(/\s+/g, " ")
      .trim();
  }

  construirURLBusqueda(carta) {
    const nombre = this.normalizarParaBusqueda(carta.nombre);
    const numero = carta.numero || '';
    
    // Query simple: solo nombre + número
    let query = `${nombre}`;
    
    // Agregar número de carta si existe (sin el #)
    if (numero) {
      query += ` ${numero}`;
    }
    
    console.log(`🎯 Query simple construido: "${query}"`);
    const encodedQuery = encodeURIComponent(query);
    return `${this.baseURL}/search-products?type=prices&q=${encodedQuery}&console=pokemon-cards`;
  }

  // Método para verificar si una carta coincide con nuestros criterios (más estricto)
  verificarCoincidenciaCarta(resultadoHTML, carta) {
    const $ = cheerio.load(resultadoHTML);
    const textoCompleto = $(resultadoHTML).text().toLowerCase();
    
    const nombreCarta = this.normalizarParaBusqueda(carta.nombre).toLowerCase();
    const numeroCarta = carta.numero ? carta.numero.toString() : '';
    const setCarta = carta.set ? this.normalizarParaBusqueda(carta.set).toLowerCase() : '';
    
    console.log(`🔍 Verificando coincidencia estricta:`);
    console.log(`   - Nombre esperado: "${nombreCarta}"`);
    console.log(`   - Número esperado: "${numeroCarta}"`);
    console.log(`   - Set esperado: "${setCarta}"`);
    console.log(`   - Texto encontrado: "${textoCompleto.slice(0, 200)}..."`);
    
    // 1. REQUISITO OBLIGATORIO: El nombre debe estar presente
    const tieneNombre = textoCompleto.includes(nombreCarta);
    if (!tieneNombre) {
      console.log(`❌ No coincide el nombre`);
      return false;
    }
    
    // 2. REQUISITO OBLIGATORIO: El número debe estar presente (si se proporciona)
    let tieneNumero = true;
    if (numeroCarta) {
      tieneNumero = textoCompleto.includes(`#${numeroCarta}`) || 
                   textoCompleto.includes(`${numeroCarta}/`) ||
                   textoCompleto.includes(` ${numeroCarta} `) ||
                   textoCompleto.includes(`-${numeroCarta}`) ||
                   textoCompleto.endsWith(numeroCarta);
      
      if (!tieneNumero) {
        console.log(`❌ No coincide el número "${numeroCarta}"`);
        return false;
      }
    }
    
    // 3. REQUISITO OBLIGATORIO: El set debe estar presente (si se proporciona)
    let tieneSet = true;
    if (setCarta) {
      // Buscar set completo o palabras clave del set
      const palabrasSet = setCarta.split(' ');
      tieneSet = palabrasSet.every(palabra => {
        if (palabra.length > 2) { // Solo palabras significativas
          return textoCompleto.includes(palabra);
        }
        return true;
      });
      
      if (!tieneSet) {
        console.log(`❌ No coincide el set "${setCarta}"`);
        return false;
      }
    }
    
    console.log(`✅ Coincidencia VÁLIDA: Nombre=${tieneNombre}, Número=${tieneNumero}, Set=${tieneSet}`);
    return true;
  }

  // Método para calcular puntuación de coincidencia (mayor es mejor)
  calcularPuntuacionCoincidencia(textoResultado, carta) {
    let puntuacion = 0;
    const textoLower = textoResultado.toLowerCase();
    
    const nombreCarta = this.normalizarParaBusqueda(carta.nombre).toLowerCase();
    const numeroCarta = carta.numero ? carta.numero.toString() : '';
    const setCarta = carta.set ? this.normalizarParaBusqueda(carta.set).toLowerCase() : '';
    
    // Puntuación base por nombre exacto (OBLIGATORIO)
    if (textoLower.includes(nombreCarta)) {
      puntuacion += 100;
    }
    
    // Puntuación por número de carta (con diferentes formatos)
    if (numeroCarta) {
      if (textoLower.includes(`#${numeroCarta}`)) {
        puntuacion += 60; // Formato exacto #123
      } else if (textoLower.includes(`${numeroCarta}/`)) {
        puntuacion += 50; // Formato 123/total
      } else if (textoLower.includes(`-${numeroCarta}`)) {
        puntuacion += 45; // Formato set-123
      } else if (textoLower.includes(` ${numeroCarta} `)) {
        puntuacion += 40; // Número aislado
      } else if (textoLower.includes(numeroCarta)) {
        puntuacion += 20; // Número presente pero no ideal
      }
    }
    
    // Puntuación por set (más detallada)
    if (setCarta) {
      const palabrasSet = setCarta.split(' ');
      let coincidenciasSet = 0;
      
      palabrasSet.forEach(palabra => {
        if (palabra.length > 2 && textoLower.includes(palabra)) {
          coincidenciasSet++;
        }
      });
      
      // Puntuación proporcional a las palabras del set que coinciden
      const porcentajeSet = coincidenciasSet / Math.max(palabrasSet.length, 1);
      puntuacion += Math.round(porcentajeSet * 40);
    }
    
    // Bonificación por coincidencia completa y exacta
    if (numeroCarta && setCarta && 
        textoLower.includes(nombreCarta) && 
        (textoLower.includes(`#${numeroCarta}`) || textoLower.includes(`${numeroCarta}/`)) && 
        textoLower.includes(setCarta)) {
      puntuacion += 75; // Bonificación mayor por triple coincidencia exacta
    }
    
    // Penalización si hay información extra que no coincide
    if (textoLower.includes('promo') && !setCarta.includes('promo')) {
      puntuacion -= 10;
    }
    
    console.log(`📊 Puntuación calculada: ${puntuacion} para: "${textoResultado.slice(0, 80)}..."`);
    
    return puntuacion;
  }

  async buscarCarta(carta) {
    try {
      const searchURL = this.construirURLBusqueda(carta);
      console.log(`🔍 Buscando en PriceCharting: ${searchURL}`);
      
      const response = await axios.get(searchURL, { 
        headers: this.headers,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      
      // Buscar todas las cartas que coincidan y verificar precisión
      console.log(`🔍 Analizando resultados de búsqueda...`);
      
      let mejorCoincidencia = null;
      let mejorPuntuacion = 0;
      
      $('#games_table tbody tr').each((i, fila) => {
        const $fila = $(fila);
        const enlaceCarta = $fila.find('td:first-child a').attr('href');
        
        if (!enlaceCarta) return;
        
        // Verificar coincidencia de esta fila
        const htmlFila = $fila.html();
        const coincide = this.verificarCoincidenciaCarta(htmlFila, carta);
        
        if (coincide) {
          console.log(`✅ Carta coincidente encontrada en fila ${i + 1}`);
          
          // Calcular puntuación de coincidencia
          const puntuacion = this.calcularPuntuacionCoincidencia($fila.text(), carta);
          
          if (puntuacion > mejorPuntuacion) {
            mejorPuntuacion = puntuacion;
            mejorCoincidencia = enlaceCarta;
            console.log(`🏆 Nueva mejor coincidencia con puntuación ${puntuacion}`);
          }
        }
      });
      
      if (!mejorCoincidencia) {
        console.log(`❌ No se encontraron coincidencias precisas para: ${carta.nombre} #${carta.numero} (${carta.set})`);
        console.log(`🔍 DEBUG: Resultados encontrados:`);
        
        $('#games_table tbody tr').slice(0, 3).each((i, fila) => {
          const texto = $(fila).text().slice(0, 150);
          console.log(`  - Resultado ${i + 1}: ${texto}...`);
        });
        
        return null;
      }
      
      const urlCompleta = mejorCoincidencia.startsWith('http') ? mejorCoincidencia : `${this.baseURL}${mejorCoincidencia}`;
      
      console.log(`🌐 URL de la mejor coincidencia: ${urlCompleta}`);
      
      // Obtener precios de la página específica de la carta
      return await this.obtenerPreciosDetallados(urlCompleta, carta);
      
    } catch (error) {
      console.error(`❌ Error al buscar en PriceCharting para ${carta.nombre}:`, error.message);
      return null;
    }
  }

  async obtenerPreciosDetallados(url, carta) {
    try {
      console.log(`📊 Obteniendo precios detallados de: ${url}`);
      
      const response = await axios.get(url, { 
        headers: this.headers,
        timeout: 10000 
      });
      
      const $ = cheerio.load(response.data);
      
      const precios = {
        ungraded: null,
        url: url
      };
      
      // Estrategia múltiple para encontrar precios ungraded
      let precioEncontrado = null;
      
      console.log(`🔍 Analizando estructura de página para: ${carta.nombre}`);
      console.log(`📍 URL siendo analizada: ${url}`);
      
      // Estrategia 1: Buscar específicamente la estructura <td>Ungraded</td><td class="price js-price">
      console.log(`🎯 Buscando estructura específica: <td>Ungraded</td><td class="price js-price">`);
      
      $('td').each((i, celda) => {
        const textoCelda = $(celda).text().trim();
        
        // Si encontramos una celda que contenga exactamente "Ungraded"
        if (textoCelda.toLowerCase() === 'ungraded') {
          console.log(`🎯 Celda "Ungraded" encontrada: "${textoCelda}"`);
          
          // Buscar la celda siguiente con clase "price" o "js-price"
          const celdaSiguiente = $(celda).next('td');
          
          if (celdaSiguiente.length > 0) {
            const textoPrecio = celdaSiguiente.text().trim();
            const clasesCelda = celdaSiguiente.attr('class') || '';
            
            console.log(`� Celda siguiente encontrada: "${textoPrecio}" con clases: "${clasesCelda}"`);
            
            // Verificar si tiene las clases esperadas
            if (clasesCelda.includes('price') || clasesCelda.includes('js-price')) {
              console.log(`✅ Celda con clase price/js-price encontrada!`);
              
              const precio = this.extraerPrecio(textoPrecio);
              if (precio && precio > 0) {
                console.log(`� PRECIO UNGRADED ENCONTRADO: $${precio} en celda con clase "${clasesCelda}"`);
                precioEncontrado = precio;
                return false; // Salir del loop
              }
            } else {
              // Si no tiene la clase esperada, intentar extraer precio de todas formas
              const precio = this.extraerPrecio(textoPrecio);
              if (precio && precio > 0) {
                console.log(`💰 PRECIO UNGRADED ENCONTRADO (sin clase price): $${precio}`);
                precioEncontrado = precio;
                return false; // Salir del loop
              }
            }
          } else {
            console.log(`⚠️ No se encontró celda siguiente a "Ungraded"`);
          }
        }
      });
      
      // Estrategia 2: Buscar en toda la fila que contenga "Ungraded"
      if (!precioEncontrado) {
        console.log(`🔍 Estrategia 2: Buscando en filas que contengan "Ungraded"`);
        
        $('tr').each((i, fila) => {
          const textoFila = $(fila).text().toLowerCase();
          
          if (textoFila.includes('ungraded')) {
            console.log(`🎯 Fila con "Ungraded" encontrada: "${textoFila.trim()}"`);
            
            // Buscar todas las celdas con clase price en esta fila
            const celdasPrecio = $(fila).find('td.price, td.js-price, td[class*="price"]');
            
            if (celdasPrecio.length > 0) {
              console.log(`💰 Encontradas ${celdasPrecio.length} celdas de precio en la fila`);
              
              celdasPrecio.each((j, celdaPrecio) => {
                const textoPrecio = $(celdaPrecio).text().trim();
                const precio = this.extraerPrecio(textoPrecio);
                
                if (precio && precio > 0) {
                  console.log(`💰 PRECIO UNGRADED ENCONTRADO en fila: $${precio}`);
                  precioEncontrado = precio;
                  return false; // Salir del loop
                }
              });
            } else {
              // Si no hay celdas con clase price, buscar cualquier precio en la fila
              const celdas = $(fila).find('td');
              celdas.each((j, celda) => {
                const textoCelda = $(celda).text().trim();
                if (!textoCelda.toLowerCase().includes('ungraded')) {
                  const precio = this.extraerPrecio(textoCelda);
                  if (precio && precio > 0) {
                    console.log(`💰 PRECIO UNGRADED ENCONTRADO (sin clase): $${precio}`);
                    precioEncontrado = precio;
                    return false; // Salir del loop
                  }
                }
              });
            }
            
            if (precioEncontrado) return false; // Salir del loop de filas
          }
        });
      }
      
      // Estrategia 2: Buscar precios en divs o spans con clases específicas
      if (!precioEncontrado) {
        const selectoresPrecios = [
          '.price-point',
          '.current-price',
          '.used-price',
          '.market-price',
          '[class*="price"]',
          '.value',
          '.amount'
        ];
        
        for (const selector of selectoresPrecios) {
          const elementos = $(selector);
          elementos.each((i, elem) => {
            const texto = $(elem).text();
            const precio = this.extraerPrecio(texto);
            if (precio && precio > 0) {
              console.log(`💰 Precio encontrado en ${selector}: $${precio}`);
              precioEncontrado = precio;
              return false; // Salir del loop
            }
          });
          
          if (precioEncontrado) break;
        }
      }
      
      // Estrategia 3: Buscar en el texto general de la página
      if (!precioEncontrado) {
        console.log(`🔍 Buscando precios en texto general de la página`);
        
        // Buscar patrones de precio en todo el HTML
        const textoCompleto = $('body').text();
        const preciosEncontrados = textoCompleto.match(/\$[\d,]+\.?\d*/g);
        
        if (preciosEncontrados && preciosEncontrados.length > 0) {
          // Filtrar precios razonables (entre $0.01 y $10,000)
          const preciosValidos = preciosEncontrados
            .map(p => this.extraerPrecio(p))
            .filter(p => p && p >= 0.01 && p <= 10000)
            .sort((a, b) => a - b); // Ordenar de menor a mayor
          
          if (preciosValidos.length > 0) {
            // Tomar el precio más común o el primero si no hay repeticiones
            precioEncontrado = preciosValidos[0];
            console.log(`💰 Precio encontrado en texto general: $${precioEncontrado}`);
          }
        }
      }
      
      if (precioEncontrado) {
        precios.ungraded = precioEncontrado;
      } else {
        console.log(`❌ No se pudo encontrar precio ungraded en: ${url}`);
        
        // Debug: Mostrar estructura de la página
        console.log(`🔍 Estructura de precios encontrada:`);
        $('table, .price, [class*="price"], [id*="price"]').each((i, elem) => {
          const texto = $(elem).text().slice(0, 200);
          console.log(`  - ${elem.tagName}.${$(elem).attr('class') || 'no-class'}: ${texto}...`);
        });
      }
      
      console.log(`💰 Precios encontrados para ${carta.nombre}:`, precios);
      return precios;
      
    } catch (error) {
      console.error(`❌ Error al obtener precios detallados:`, error.message);
      return { ungraded: null, graded: null, url: url };
    }
  }

  extraerPrecio(texto) {
    if (!texto) return null;
    
    // Limpiar el texto
    const textoLimpio = texto.replace(/\s+/g, ' ').trim();
    console.log(`🔍 Intentando extraer precio de: "${textoLimpio}"`);
    
    // Patrón específico para PriceCharting: $XX.XX
    const patron = /\$\s*([\d,]+\.?\d*)/;
    const match = textoLimpio.match(patron);
    
    if (match) {
      const numeroLimpio = match[1].replace(/,/g, '');
      const precio = parseFloat(numeroLimpio);
      
      console.log(`🔍 Patrón $XX.XX -> número: "${numeroLimpio}" -> precio: ${precio}`);
      
      // Validar que el precio esté en un rango razonable
      if (!isNaN(precio) && precio >= 0.01 && precio <= 50000) {
        console.log(`✅ Precio extraído exitosamente: "${textoLimpio}" -> $${precio}`);
        return precio;
      } else {
        console.log(`❌ Precio fuera de rango válido: $${precio}`);
      }
    } else {
      console.log(`❌ No se encontró patrón $XX.XX en: "${textoLimpio}"`);
    }
    
    return null;
  }

  async actualizarPreciosCarta(carta) {
    try {
      const precios = await this.buscarCarta(carta);
      
      if (!precios) {
        return {
          actualizado: false,
          mensaje: `No se encontraron precios en PriceCharting para: ${carta.nombre}`
        };
      }
      
      // Actualizar los campos de precio en la carta
      const resultado = {
        actualizado: false,
        precioPriceCharting: precios.ungraded,
        url: precios.url,
        mensaje: ''
      };
      
      if (precios.ungraded) {
        resultado.actualizado = true;
        resultado.mensaje = `Precio actualizado desde PriceCharting: $${precios.ungraded}`;
      } else {
        resultado.mensaje = `Se encontró la carta en PriceCharting pero no se pudo extraer el precio: ${precios.url}`;
      }
      
      return resultado;
      
    } catch (error) {
      console.error(`❌ Error al actualizar precios para ${carta.nombre}:`, error.message);
      return {
        actualizado: false,
        mensaje: `Error al consultar PriceCharting: ${error.message}`
      };
    }
  }
}

module.exports = new PriceChartingService();
