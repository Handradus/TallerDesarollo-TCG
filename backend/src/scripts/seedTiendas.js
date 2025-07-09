// src/seeders/seedTiendas.js (ajusta según tu estructura)
const { AppDataSource } = require('../data-source'); // tu conexión TypeORM
const Tienda = require('../entities/Tienda');

const tiendasPredefinidas = [
  {
    nombre: 'Game of Magic Singles',
    descripcion: 'Tienda especializada en cartas individuales de Magic y otros TCGs.',
    valoracion: 4.6,
    urlBusqueda: 'https://gameofmagicsingles.cl/search?q=BUSQUEDA',
    tipoBusqueda: 'shopify',
    urlBase: 'https://gameofmagicsingles.cl',
    direccion: 'Online, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Level Up Store',
    descripcion: 'Tienda chilena con productos de TCG, videojuegos y cultura geek.',
    valoracion: 4.4,
    urlBusqueda: 'https://www.tiendaslevelup.cl/?s=BUSQUEDA&post_type=product&dgwt_wcas=1',
    tipoBusqueda: 'levelup',
    urlBase: 'https://www.tiendaslevelup.cl',
    direccion: 'Av. Apoquindo 1234, Las Condes, Santiago, Chile',
    telefono: '+56 9 8765 4321',
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Hunter Card TCG',
    descripcion: 'Tienda chilena especializada en cartas Pokémon, Yugioh y más.',
    valoracion: 4.5,
    urlBusqueda: 'https://www.huntercardtcg.com/?s=BUSQUEDA&post_type=product',
    tipoBusqueda: 'levelup',
    urlBase: 'https://www.huntercardtcg.com',
    direccion: 'Online, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Playset',
    descripcion: 'Tienda chilena dedicada a la venta de cartas coleccionables y accesorios TCG.',
    valoracion: 4.3,
    urlBusqueda: 'https://www.playset.cl/?s=BUSQUEDA&post_type=product',
    tipoBusqueda: 'levelup',
    urlBase: 'https://www.playset.cl',
    direccion: 'Online, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Collector Center - Singles',
    descripcion: 'Sección especializada en cartas individuales de Collector Center.',
    valoracion: 4.2,
    urlBusqueda: 'https://singles.collectorcenter.cl/?s=BUSQUEDA&asp_active=1&p_asid=2&p_asp_data=1&aspf[_stock_status__1]=instock&filters_initial=1&filters_changed=0&qtranslate_lang=0&woo_currency=CLP&current_page_id=40',
    tipoBusqueda: 'levelup',
    urlBase: 'https://singles.collectorcenter.cl',
    direccion: 'Online, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Oasis Games',
    descripcion: 'Tienda chilena de cartas coleccionables, accesorios y productos geek.',
    valoracion: 4.4,
    urlBusqueda: 'https://www.oasisgames.cl/search?type=product&options[prefix]=last&q=BUSQUEDA',
    tipoBusqueda: 'shopify',
    urlBase: 'https://www.oasisgames.cl',
    direccion: 'Santiago, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
  {
    nombre: 'Pokestop',
    descripcion: 'Tienda chilena especializada en cartas Pokémon y accesorios TCG.',
    valoracion: 4.3,
    urlBusqueda: 'https://pokestop.cl/search/?q=BUSQUEDA',
    tipoBusqueda: 'shopify',
    urlBase: 'https://pokestop.cl',
    direccion: 'Online, Chile',
    telefono: null,
    logo: null,
    ultimaActualizacion: null,
    activo: true,
  },
];

async function seedTiendas() {
  const tiendaRepo = AppDataSource.getRepository(Tienda);

  for (const tienda of tiendasPredefinidas) {
    const yaExiste = await tiendaRepo.findOneBy({ nombre: tienda.nombre });
    if (!yaExiste) {
      await tiendaRepo.save(tienda);
      console.log(`✅ Insertada tienda: ${tienda.nombre}`);
    } else {
      console.log(`ℹ️ Ya existe tienda: ${tienda.nombre}`);
    }
  }
}

module.exports = { seedTiendas };
