const axios = require('axios');
const cheerio = require('cheerio');

function normalizarParaUrl(texto) {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Función auxiliar para analizar coincidencias de carta en URLs y texto
function analizarCoincidenciasCarta(carta, href, textoElemento, tienda) {
  const nombreCarta = carta.nombre.toLowerCase();
  
  // NÚMEROS ESTRICTOS: número de carta y total del set
  const numeroCarta = String(carta.numero);
  const totalSet = carta.printedTotal ? String(carta.printedTotal) : null;
  const numeroFormateado = numeroCarta.padStart(3, '0'); // Para comparaciones con formato 001, 025, etc.
  
  console.log(`🔍 [${tienda.nombre}] Analizando carta: "${carta.nombre}"`);
  console.log(`   🔢 Número carta: "${numeroCarta}" (formateado: "${numeroFormateado}")`);
  console.log(`   📊 Total set: ${totalSet ? `"${totalSet}"` : 'N/A'}`);
  
  // Múltiples variaciones del nombre para mayor flexibilidad
  const nombreNormalizado = carta.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nombreConGuiones = carta.nombre.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  const nombreSinApostrofes = carta.nombre.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  
  // Análisis del texto visible del enlace (más estricto con número)
  const textoLower = textoElemento.toLowerCase();
  const incluyeNombreTexto = textoLower.includes(nombreCarta) || 
                             textoLower.includes(nombreCarta.replace(/'/g, ''));
  
  // NÚMERO ESTRICTO: buscar patrones con MÚLTIPLES SEPARADORES
  let incluyeNumeroTexto = false;
  
  if (totalSet) {
    // Buscar patrones con diferentes separadores: /, -, _, espacio
    const separadores = ['/', '-', '_', ' '];
    const patronesCompletos = [];
    
    separadores.forEach(sep => {
      patronesCompletos.push(
        `${numeroCarta}${sep}${totalSet}`,
        `${numeroFormateado}${sep}${totalSet}`
      );
    });
    
    incluyeNumeroTexto = patronesCompletos.some(patron => textoElemento.includes(patron));
    
    console.log(`   🔍 Buscando patrones (${patronesCompletos.length}): ${patronesCompletos.slice(0, 4).join(', ')}...`);
  } else {
    // Si no hay total del set, buscar solo el número
    incluyeNumeroTexto = textoElemento.includes(numeroCarta) || 
                        textoElemento.includes(numeroFormateado);
    
    console.log(`   🔍 Buscando números: "${numeroCarta}", "${numeroFormateado}"`);
  }
  
  console.log(`   📊 Texto: "${textoElemento}"`);
  console.log(`   ✅ Incluye nombre: ${incluyeNombreTexto}`);
  console.log(`   ✅ Incluye número: ${incluyeNumeroTexto}`);

  // Análisis de la URL del producto (más variaciones pero estricto con número)
  const hrefLower = href.toLowerCase();
  const incluyeNombreUrl = hrefLower.includes(nombreNormalizado) || 
                           hrefLower.includes(nombreConGuiones) ||
                           hrefLower.includes(nombreSinApostrofes);
  
  // NÚMERO ESTRICTO EN URL: buscar patrones completos con múltiples separadores
  let incluyeNumeroUrl = false;
  
  if (totalSet) {
    // Las URLs pueden usar diferentes separadores
    const separadoresUrl = ['-', '_', '/', '%2F']; // %2F es / codificado en URL
    const patronesUrl = [];
    
    separadoresUrl.forEach(sep => {
      patronesUrl.push(
        `${numeroCarta}${sep}${totalSet}`,
        `${numeroFormateado}${sep}${totalSet}`
      );
    });
    
    incluyeNumeroUrl = patronesUrl.some(patron => hrefLower.includes(patron));
    
    console.log(`   🔗 Buscando en URL (${patronesUrl.length}): ${patronesUrl.slice(0, 4).join(', ')}...`);
  } else {
    // Si no hay total del set, buscar solo el número
    incluyeNumeroUrl = hrefLower.includes(numeroCarta) || 
                      hrefLower.includes(numeroFormateado);
    
    console.log(`   🔗 Buscando en URL: "${numeroCarta}", "${numeroFormateado}"`);
  }
  
  console.log(`   🔗 URL: "${href}"`);
  console.log(`   ✅ URL incluye nombre: ${incluyeNombreUrl}`);
  console.log(`   ✅ URL incluye número: ${incluyeNumeroUrl}`);
  
  // Verificar el set en la URL si está disponible
  let incluyeSetUrl = true;
  if (carta.set) {
    const setNormalizado = carta.set.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
    incluyeSetUrl = hrefLower.includes(setNormalizado);
  }

  const coincideTexto = incluyeNombreTexto && incluyeNumeroTexto;
  const coincideUrl = incluyeNombreUrl && incluyeNumeroUrl && incluyeSetUrl;

  return {
    coincideTexto,
    coincideUrl,
    coincideAlguno: coincideTexto || coincideUrl,
    detalles: {
      nombreCarta,
      nombreNormalizado,
      nombreConGuiones,
      nombreSinApostrofes,
      numeroCarta,
      totalSet,
      numeroFormateado,
      incluyeNombreTexto,
      incluyeNumeroTexto,
      incluyeNombreUrl,
      incluyeNumeroUrl,
      incluyeSetUrl
    }
  };
}

async function urlExiste(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      timeout: 3000,
      maxRedirects: 3,
      validateStatus: () => true
    });

    console.log(`📡 urlExiste respuesta: ${url} → ${res.status}`);
    return [200, 301, 302].includes(res.status);
  } catch (err) {
    console.warn(`⚠️ urlExiste falló con ${url} → ${err.response?.status || err.message}`);
    return false;
  }
}

async function buscarEnTiendaShopify(tienda, carta) {
  // TÉRMINO DE BÚSQUEDA MEJORADO: usar espacios en lugar de caracteres especiales
  let termino;
  if (carta.printedTotal) {
    // Usar espacios para la búsqueda, no caracteres especiales
    termino = `${carta.nombre} ${carta.numero} ${carta.printedTotal}`;
    console.log(`🔍 Término de búsqueda optimizado: "${termino}"`);
    console.log(`🔍 Patrones que se buscarán: ${carta.numero}/${carta.printedTotal}, ${carta.numero}-${carta.printedTotal}, etc.`);
  } else {
    termino = `${carta.nombre} ${carta.numero}`;
    console.log(`🔍 Término de búsqueda: "${termino}" (sin total del set)`);
  }
  
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));
  console.log(`🛒 [${tienda.nombre}] Iniciando búsqueda Shopify para carta: "${carta.nombre}"`);
  console.log(`🔍 [${tienda.nombre}] URL de búsqueda: ${urlBusqueda}`);

  try {
    const res = await axios.get(urlBusqueda);
    const $ = cheerio.load(res.data);
    const enlaces = $('a[href^="/products/"]');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const texto = link.text().toLowerCase();
      const href = link.attr('href');
      const urlCompleta = `${tienda.urlBase}${href}`;

      const analisis = analizarCoincidenciasCarta(carta, href, texto, tienda);

      console.log(`🔍 Comparando [${tienda.nombre}]:`);
      console.log(`   ↪ texto = "${texto}"`);
      console.log(`   ↪ href = "${href}"`);
      console.log(`   ↪ coincideTexto = ${analisis.coincideTexto}`);
      console.log(`   ↪ coincideUrl = ${analisis.coincideUrl}`);

      if (analisis.coincideAlguno) {
        // VALIDACIÓN ESTRICTA UNIFICADA
        const textoCompleto = `${texto} ${href}`.toLowerCase();
        const nombreCartaLower = carta.nombre.toLowerCase();
        
        console.log(`🔍 [${tienda.nombre}] Iniciando validación estricta...`);
        console.log(`   📝 Texto completo: "${textoCompleto}"`);
        console.log(`   🎯 Carta buscada: "${carta.nombre}"`);
        
        // 1. FILTRO DE PRODUCTOS NO CARTAS
        const terminosNoCartas = ['protector', 'sleeve', 'binder', 'portfolio', 'deck box', 'playmat', 'mat'];
        if (terminosNoCartas.some(term => textoCompleto.includes(term))) {
          console.log(`❌ [${tienda.nombre}] RECHAZADO: No es una carta (contiene: ${terminosNoCartas.find(term => textoCompleto.includes(term))})`);
          continue;
        }
        
        // 2. FILTRO DE SET ESTRICTO (MEJORADO)
        if (carta.set) {
          const setEsperado = carta.set.toLowerCase();
          const setsComunes = ['sv', 'swsh', 'sm', 'xy', 'bw', 'dp', 'ex', 'neo', 'base', 'sw', 'celebrations'];
          
          // Mapeo de sets abreviados a nombres completos
          const mapeosSet = {
            'sv': ['sv', 'scarlet-violet', 'scarlet', 'violet'],
            'swsh': ['swsh', 'sword-shield', 'sword', 'shield'], 
            'sm': ['sm', 'sun-moon', 'sun', 'moon'],
            'xy': ['xy'],
            'bw': ['bw', 'black-white', 'black', 'white'],
            'sw': ['sw', 'sword-shield'] // alias para swsh
          };
          
          const setEncontrado = setsComunes.find(s => textoCompleto.includes(s));
          
          if (setEncontrado && setEncontrado !== setEsperado) {
            // Verificar si es un mapeo válido
            const variacionesValidas = mapeosSet[setEsperado] || [setEsperado];
            const esVariacionValida = variacionesValidas.some(variacion => 
              textoCompleto.includes(variacion) || setEncontrado === variacion
            );
            
            if (!esVariacionValida) {
              console.log(`❌ [${tienda.nombre}] RECHAZADO: Set incorrecto (esperaba "${carta.set}", encontró "${setEncontrado}")`);
              continue;
            } else {
              console.log(`✅ [${tienda.nombre}] Set válido: "${setEncontrado}" es variación de "${setEsperado}"`);
            }
          }
        }
        
        // 3. FILTRO DE NOMBRES COMPUESTOS
        const nombresPokemon = [
          'electrode', 'raichu', 'surfing', 'flying', 'team', 'rocket', 'aqua', 'magma', 'plasma',
          'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew', 'lugia', 'ho-oh',
          'rayquaza', 'dialga', 'palkia', 'giratina', 'arceus', 'reshiram', 'zekrom'
        ];
        const tieneOtroPokemon = nombresPokemon.some(pokemon => 
          textoCompleto.includes(pokemon) && !nombreCartaLower.includes(pokemon)
        );
        
        if (tieneOtroPokemon) {
          const pokemonEncontrado = nombresPokemon.find(pokemon => 
            textoCompleto.includes(pokemon) && !nombreCartaLower.includes(pokemon)
          );
          console.log(`❌ [${tienda.nombre}] RECHAZADO: Contiene otro Pokémon ("${pokemonEncontrado}")`);
          continue;
        }
        
        // 4. FILTRO DE VARIANTES NO DESEADAS
        const variantesEspeciales = ['\\bv\\b', '\\bex\\b', '\\bgx\\b', 'vmax', 'vstar', 'mega', 'break', 'prime'];
        const cartaTieneVariantes = variantesEspeciales.some(variante => {
          const regex = new RegExp(variante, 'i');
          return regex.test(nombreCartaLower);
        });
        
        if (!cartaTieneVariantes) {
          const tieneVarianteNoDeseada = variantesEspeciales.some(variante => {
            const regex = new RegExp(variante, 'i');
            return regex.test(textoCompleto);
          });
          
          if (tieneVarianteNoDeseada) {
            const varianteEncontrada = variantesEspeciales.find(variante => {
              const regex = new RegExp(variante, 'i');
              return regex.test(textoCompleto);
            });
            console.log(`❌ [${tienda.nombre}] RECHAZADO: Contiene variante no deseada ("${varianteEncontrada}")`);
            continue;
          }
        }
        
        // 5. VALIDACIÓN DE NÚMERO EXACTO CON MÚLTIPLES SEPARADORES (MEJORADA)
        const numeroCartaValidacion = String(carta.numero);
        const totalSetValidacion = carta.printedTotal ? String(carta.printedTotal) : null;
        const numeroFormateadoValidacion = numeroCartaValidacion.padStart(3, '0');
        
        console.log(`🔢 [${tienda.nombre}] Validando números exactos:`);
        console.log(`   🎯 Número carta: "${numeroCartaValidacion}" (formateado: "${numeroFormateadoValidacion}")`);
        console.log(`   📊 Total set: ${totalSetValidacion ? `"${totalSetValidacion}"` : 'N/A'}`);
        console.log(`   📝 Texto completo a analizar: "${textoCompleto}"`);
        
        let tieneNumeroExacto = false;
        
        if (totalSetValidacion) {
          // PATRÓN MEJORADO: Buscar el patrón número/total pero siendo flexible con contenido adicional
          const separadores = ['/', '-', '_', ' ', '.', '|'];
          const patronesCompletos = [];
          
          separadores.forEach(sep => {
            // Escape del separador para regex si es necesario
            const sepEscaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Crear patrones más flexibles que manejen paréntesis y otros caracteres
            // Ejemplo: buscar "025/165" en "(025/165)" o "pikachu (025/165)"
            patronesCompletos.push({
              patron: `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroCartaValidacion}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
            patronesCompletos.push({
              patron: `${numeroFormateadoValidacion}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroFormateadoValidacion}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
          });
          
          // Buscar usando regex para mayor precisión
          for (const item of patronesCompletos) {
            if (item.regex.test(textoCompleto)) {
              tieneNumeroExacto = true;
              console.log(`✅ [${tienda.nombre}] PATRÓN REGEX ENCONTRADO: "${item.patron}"`);
              console.log(`   📋 Regex usada: ${item.regex}`);
              break;
            }
          }
          
          if (!tieneNumeroExacto) {
            // Fallback: búsqueda simple por si las regex fallan
            const patronesSimples = [];
            separadores.forEach(sep => {
              patronesSimples.push(
                `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
                `${numeroFormateadoValidacion}${sep}${totalSetValidacion}`
              );
            });
            
            tieneNumeroExacto = patronesSimples.some(patron => textoCompleto.includes(patron));
            
            if (tieneNumeroExacto) {
              const patronEncontrado = patronesSimples.find(patron => textoCompleto.includes(patron));
              console.log(`✅ [${tienda.nombre}] PATRÓN SIMPLE ENCONTRADO: "${patronEncontrado}"`);
            } else {
              console.log(`❌ [${tienda.nombre}] PATRÓN NO ENCONTRADO en "${textoCompleto}"`);
              console.log(`   🔍 Se probaron ${patronesCompletos.length} patrones regex y ${patronesSimples.length} simples`);
              console.log(`   📋 Ejemplos buscados: ${patronesSimples.slice(0, 4).join(', ')}`);
              
              // ANÁLISIS DETALLADO para debug
              console.log(`   🔍 ANÁLISIS DETALLADO:`);
              const numerosEnTexto = textoCompleto.match(/\d+/g) || [];
              console.log(`   🔢 Números encontrados en texto: [${numerosEnTexto.join(', ')}]`);
              
              // Verificar si los números individuales están presentes
              const tieneNumeroIndividual = numerosEnTexto.includes(numeroCartaValidacion) || 
                                          numerosEnTexto.includes(numeroFormateadoValidacion);
              const tieneTotalIndividual = numerosEnTexto.includes(totalSetValidacion);
              
              console.log(`   ✅ Contiene número carta "${numeroCartaValidacion}": ${numerosEnTexto.includes(numeroCartaValidacion)}`);
              console.log(`   ✅ Contiene número formateado "${numeroFormateadoValidacion}": ${numerosEnTexto.includes(numeroFormateadoValidacion)}`);
              console.log(`   ✅ Contiene total set "${totalSetValidacion}": ${tieneTotalIndividual}`);
              
              if (tieneNumeroIndividual && tieneTotalIndividual) {
                console.log(`   ⚠️ [${tienda.nombre}] NÚMEROS PRESENTES INDIVIDUALMENTE - ACEPTANDO POR PROXIMIDAD`);
                tieneNumeroExacto = true;
              }
            }
          }
        } else {
          // Si no hay total del set, buscar solo números individuales
          const numerosEncontrados = textoCompleto.match(/\b\d{1,3}\b/g) || [];
          tieneNumeroExacto = numerosEncontrados.includes(numeroCartaValidacion) || 
                             numerosEncontrados.includes(numeroFormateadoValidacion);
          
          if (tieneNumeroExacto) {
            console.log(`✅ [${tienda.nombre}] NÚMERO INDIVIDUAL ENCONTRADO`);
          } else {
            console.log(`❌ [${tienda.nombre}] NÚMERO NO ENCONTRADO: esperaba "${numeroCartaValidacion}" o "${numeroFormateadoValidacion}", encontró: [${numerosEncontrados.join(', ')}]`);
          }
        }
        
        if (!tieneNumeroExacto) {
          console.log(`❌ [${tienda.nombre}] NÚMERO NO EXACTO - RECHAZADO`);
          continue;
        }
        
        console.log(`✅ [${tienda.nombre}] VALIDACIÓN APROBADA - Es la carta correcta`);
        
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (href && existe) {
          console.log(`🛒 [${tienda.nombre}] URL existe, iniciando scraping de precio...`);
          const precio = await scrapearPrecioShopify(urlCompleta, tienda.nombre);
          console.log(`🛒 [${tienda.nombre}] Scraping completado, precio obtenido: ${precio}`);
          return { 
            url: urlCompleta, 
            verificada: true,
            precio: precio
          };
        } else {
          console.log(`❌ [${tienda.nombre}] URL no existe o href vacío`);
        }
      } else {
        console.log(`❌ [${tienda.nombre}] Sin coincidencia`);
      }
    }

    console.log(`⛔ [${tienda.nombre}] No coincidencia exacta encontrada`);
    return null;
  } catch (error) {
    console.log(`❌ [${tienda.nombre}] Error en búsqueda: ${error.message}`);
    return null;
  }
}

async function buscarEnTiendaLevelUp(tienda, carta) {
  // TÉRMINO DE BÚSQUEDA MEJORADO: usar espacios en lugar de caracteres especiales
  let termino;
  if (carta.printedTotal) {
    // Usar espacios para la búsqueda, no caracteres especiales
    termino = `${carta.nombre} ${carta.numero} ${carta.printedTotal}`;
    console.log(`🔍 Término de búsqueda optimizado: "${termino}"`);
    console.log(`🔍 Patrones que se buscarán: ${carta.numero}/${carta.printedTotal}, ${carta.numero}-${carta.printedTotal}, etc.`);
  } else {
    termino = `${carta.nombre} ${carta.numero}`;
    console.log(`🔍 Término de búsqueda: "${termino}" (sin total del set)`);
  }
  
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));
  console.log(`🎮 [LevelUp] Iniciando búsqueda LevelUp para carta: "${carta.nombre}"`);
  console.log(`🔍 [LevelUp] URL de búsqueda: ${urlBusqueda}`);

  try {
    const res = await axios.get(urlBusqueda, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });

    const $ = cheerio.load(res.data);
    const enlaces = $('a.woocommerce-LoopProduct-link');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const href = link.attr('href') || "";
      const textoElemento = link.text().toLowerCase();
      const urlCompleta = href.startsWith("http") ? href : `${tienda.urlBase}${href}`;

      const analisis = analizarCoincidenciasCarta(carta, href, textoElemento, tienda);

      console.log(`🔍 Comparando [${tienda.nombre}]: "${textoElemento}" → coincide: ${analisis.coincideAlguno}`);

      if (analisis.coincideAlguno) {
        // Aplicar las mismas validaciones que Shopify
        const textoCompleto = `${textoElemento} ${href}`.toLowerCase();
        const nombreCartaLower = carta.nombre.toLowerCase();
        
        // Filtros de validación (mismos que Shopify)
        const terminosNoCartas = ['protector', 'sleeve', 'binder', 'portfolio', 'deck box', 'playmat', 'mat'];
        if (terminosNoCartas.some(term => textoCompleto.includes(term))) {
          console.log(`❌ [${tienda.nombre}] RECHAZADO: No es una carta`);
          continue;
        }
        
        if (carta.set) {
          const setEsperado = carta.set.toLowerCase();
          const setsComunes = ['sv', 'swsh', 'sm', 'xy', 'bw', 'dp', 'ex', 'neo', 'base', 'sw', 'celebrations'];
          
          // Mapeo de sets abreviados a nombres completos
          const mapeosSet = {
            'sv': ['sv', 'scarlet-violet', 'scarlet', 'violet'],
            'swsh': ['swsh', 'sword-shield', 'sword', 'shield'], 
            'sm': ['sm', 'sun-moon', 'sun', 'moon'],
            'xy': ['xy'],
            'bw': ['bw', 'black-white', 'black', 'white'],
            'sw': ['sw', 'sword-shield'] // alias para swsh
          };
          
          const setEncontrado = setsComunes.find(s => textoCompleto.includes(s));
          
          if (setEncontrado && setEncontrado !== setEsperado) {
            // Verificar si es un mapeo válido
            const variacionesValidas = mapeosSet[setEsperado] || [setEsperado];
            const esVariacionValida = variacionesValidas.some(variacion => 
              textoCompleto.includes(variacion) || setEncontrado === variacion
            );
            
            if (!esVariacionValida) {
              console.log(`❌ [${tienda.nombre}] RECHAZADO: Set incorrecto`);
              continue;
            }
          }
        }
        
        // Validación de número exacto CON MÚLTIPLES SEPARADORES (MEJORADA)
        const numeroCartaValidacion = String(carta.numero);
        const totalSetValidacion = carta.printedTotal ? String(carta.printedTotal) : null;
        let tieneNumeroExacto = false;
        
        if (totalSetValidacion) {
          // PATRÓN MEJORADO: Usar regex para mayor precisión
          const separadores = ['/', '-', '_', ' ', '.', '|'];
          const patronesCompletos = [];
          
          separadores.forEach(sep => {
            const sepEscaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            patronesCompletos.push({
              patron: `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroCartaValidacion}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
            patronesCompletos.push({
              patron: `${numeroCartaValidacion.padStart(3, '0')}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroCartaValidacion.padStart(3, '0')}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
          });
          
          // Buscar usando regex
          for (const item of patronesCompletos) {
            if (item.regex.test(textoCompleto)) {
              tieneNumeroExacto = true;
              console.log(`✅ [${tienda.nombre}] PATRÓN REGEX ENCONTRADO: "${item.patron}"`);
              break;
            }
          }
          
          if (!tieneNumeroExacto) {
            // Fallback: búsqueda simple y análisis por proximidad
            const patronesSimples = [];
            separadores.forEach(sep => {
              patronesSimples.push(
                `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
                `${numeroCartaValidacion.padStart(3, '0')}${sep}${totalSetValidacion}`
              );
            });
            
            tieneNumeroExacto = patronesSimples.some(patron => textoCompleto.includes(patron));
            
            if (!tieneNumeroExacto) {
              // Análisis de proximidad: si están los números individuales, aceptar
              const numerosEnTexto = textoCompleto.match(/\d+/g) || [];
              const tieneNumeroIndividual = numerosEnTexto.includes(numeroCartaValidacion) || 
                                          numerosEnTexto.includes(numeroCartaValidacion.padStart(3, '0'));
              const tieneTotalIndividual = numerosEnTexto.includes(totalSetValidacion);
              
              if (tieneNumeroIndividual && tieneTotalIndividual) {
                console.log(`⚠️ [${tienda.nombre}] NÚMEROS INDIVIDUALES PRESENTES - ACEPTANDO`);
                tieneNumeroExacto = true;
              } else {
                console.log(`❌ [${tienda.nombre}] PATRÓN NO ENCONTRADO (${patronesCompletos.length} patrones probados)`);
              }
            }
          }
        } else {
          const numerosEncontrados = textoCompleto.match(/\b\d{1,3}\b/g) || [];
          tieneNumeroExacto = numerosEncontrados.includes(numeroCartaValidacion);
          
          if (!tieneNumeroExacto) {
            console.log(`❌ [${tienda.nombre}] NÚMERO NO ENCONTRADO: esperaba "${numeroCartaValidacion}", encontró: [${numerosEncontrados.join(', ')}]`);
          }
        }
        
        if (!tieneNumeroExacto) {
          console.log(`❌ [${tienda.nombre}] NÚMERO NO EXACTO - RECHAZADO`);
          continue;
        }
        
        console.log(`✅ [${tienda.nombre}] VALIDACIÓN APROBADA`);
        
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (existe) {
          console.log(`🎮 [LevelUp] Iniciando scraping de precio...`);
          const precio = await scrapearPrecioLevelUp(urlCompleta);
          console.log(`🎮 [LevelUp] Scraping completado, precio obtenido: ${precio}`);
          return { 
            url: urlCompleta, 
            verificada: true,
            precio: precio
          };
        }
      }
    }

    console.log(`⛔ No se encontró coincidencia exacta en ${tienda.nombre}`);
  } catch (error) {
    console.error(`❌ Error buscando en tienda ${tienda.nombre}:`, error.message);
  }

  return null;
}

async function scrapearPrecioShopify(url, nombreTienda) {
  try {
    console.log(`💰 Scrapeando precio Shopify en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 
    });

    const $ = cheerio.load(res.data);
    
    // IGNORAR elementos en secciones de productos relacionados/sugeridos
    const sectoresIgnorar = [
      '.product-recommendations',
      '.related-products', 
      '.related',
      '.suggestions',
      '.you-may-also-like',
      '.recommended',
      '.similar-products',
      '.cross-sell',
      '.upsell',
      '[class*="related"]',
      '[class*="recommend"]',
      '[class*="suggest"]',
      '[id*="related"]',
      '[id*="recommend"]',
      '.shopify-section-recommended-products'
    ];
    
    // Remover todas las secciones de productos relacionados del DOM
    sectoresIgnorar.forEach(selector => {
      $(selector).remove();
    });
    
    console.log(`🚫 Elementos de productos relacionados removidos de ${nombreTienda}`);
    
    const selectoresPrecio = [
      '.price .money',
      '.product-price .money', 
      '.price-current .money',
      '.product__price .money',
      '.product-form .money',
      '.product-info .money',
      '.product-details .money',
      '.money',
      '.price',
      '.product-price'
    ];

    for (const selector of selectoresPrecio) {
      const elementos = $(selector);
      
      // Filtrar elementos que NO estén en secciones relacionadas
      let elementosValidos = elementos.filter((i, el) => {
        const elemento = $(el);
        const textoCompleto = elemento.closest('div').text().toLowerCase();
        
        // Verificar si el elemento está en una sección relacionada por texto
        const terminosRelacionados = [
          'related', 'recommend', 'suggest', 'similar', 'you may also like', 
          'customers also viewed', 'otros productos', 'productos relacionados',
          'te puede interesar', 'sugerencias', 'más productos'
        ];
        
        const estaEnSeccionRelacionada = terminosRelacionados.some(termino => 
          textoCompleto.includes(termino)
        );
        
        return !estaEnSeccionRelacionada;
      });
      
      const elementoPrecio = elementosValidos.first();
      if (elementoPrecio.length > 0) {
        let textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);
        
        if (precioLimpio) {
          console.log(`💰 Precio encontrado en ${nombreTienda}: ${precioLimpio} (selector: ${selector})`);
          return precioLimpio;
        }
      }
    }

    console.log(`⚠️ No se pudo encontrar precio en ${nombreTienda}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error scrapeando precio Shopify en ${nombreTienda}:`, error.message);
    return null;
  }
}

async function scrapearPrecioLevelUp(url) {
  try {
    console.log(`💰 Scrapeando precio LevelUp en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 
    });

    const $ = cheerio.load(res.data);
    
    // IGNORAR elementos en secciones de productos relacionados/sugeridos
    const sectoresIgnorar = [
      '.related-products',
      '.cross-sells',
      '.upsells', 
      '.related',
      '.suggestions',
      '.recommended-products',
      '.you-may-also-like',
      '.similar-products',
      '.product-recommendations',
      '[class*="related"]',
      '[class*="cross-sell"]',
      '[class*="upsell"]',
      '[class*="recommend"]',
      '[class*="suggest"]',
      '.woocommerce-output-related-products'
    ];
    
    // Remover todas las secciones de productos relacionados del DOM
    sectoresIgnorar.forEach(selector => {
      $(selector).remove();
    });
    
    console.log(`🚫 Elementos de productos relacionados removidos de LevelUp`);
    
    const selectoresPrecio = [
      '.woocommerce-Price-amount',
      '.price .woocommerce-Price-amount',
      'ins .woocommerce-Price-amount',
      '.product-price .woocommerce-Price-amount',
      '.single-product .woocommerce-Price-amount',
      '.entry-summary .woocommerce-Price-amount',
      '.price',
      '.amount'
    ];

    for (const selector of selectoresPrecio) {
      const elementos = $(selector);
      
      // Filtrar elementos que NO estén en secciones relacionadas
      let elementosValidos = elementos.filter((i, el) => {
        const elemento = $(el);
        const contenedorPadre = elemento.closest('.product, .entry-summary, .single-product');
        const textoContenedor = contenedorPadre.text().toLowerCase();
        
        // Verificar si el elemento está en una sección relacionada por texto
        const terminosRelacionados = [
          'related', 'recommend', 'suggest', 'similar', 'you may also like', 
          'customers also viewed', 'cross-sell', 'upsell', 'otros productos', 
          'productos relacionados', 'te puede interesar', 'sugerencias', 'más productos'
        ];
        
        const estaEnSeccionRelacionada = terminosRelacionados.some(termino => 
          textoContenedor.includes(termino)
        );
        
        return !estaEnSeccionRelacionada;
      });
      
      const elementoPrecio = elementosValidos.first();
      if (elementoPrecio.length > 0) {
        let textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);
        
        if (precioLimpio) {
          console.log(`💰 Precio encontrado en LevelUp: ${precioLimpio} (selector: ${selector})`);
          return precioLimpio;
        }
      }
    }

    console.log(`⚠️ No se pudo encontrar precio en LevelUp`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error scrapeando precio LevelUp:`, error.message);
    return null;
  }
}

function limpiarPrecio(textoPrecio) {
  if (!textoPrecio) return null;
  
  textoPrecio = textoPrecio.replace(/\s+/g, ' ').trim();
  
  const patronesPrecio = [
    /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/,  // $1,234.56
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*\$/,  // 1,234.56$
    /(\d+(?:[.,]\d{1,2})?)/,                       // 1234.56
  ];

  for (const patron of patronesPrecio) {
    const match = textoPrecio.match(patron);
    if (match) {
      let numeroLimpio = match[1]
        .replace(/\./g, '')  // Remover puntos de miles
        .replace(/,/g, '.'); // Convertir comas decimales a puntos
      
      const numeroValidado = parseFloat(numeroLimpio);
      if (!isNaN(numeroValidado)) {
        return numeroValidado.toString();
      }
    }
  }
  
  return null;
}

module.exports = {
  buscarEnTiendaShopify,
  buscarEnTiendaLevelUp,
  scrapearPrecioShopify,
  scrapearPrecioLevelUp,
  limpiarPrecio
};
