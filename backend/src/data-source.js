const { DataSource } = require('typeorm');
const path = require('path');

// Cargar .env relativo a la carpeta `backend` (estamos en backend/src)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// DEBUG: imprimir información mínima sobre las vars de DB (no imprimir la contraseña)
try {
  const pwd = process.env.DB_PASSWORD;
  console.log('🔎 DB env debug:', 'DB_HOST=', process.env.DB_HOST, 'DB_PORT=', process.env.DB_PORT, 'DB_USER=', process.env.DB_USERNAME, 'DB_NAME=', process.env.DB_NAME, 'DB_PASSWORD_present=', !!pwd, 'DB_PASSWORD_type=', typeof pwd, 'DB_PASSWORD_len=', pwd ? pwd.length : 0);
} catch (e) {
  console.log('🔎 Error leyendo env:', e.message);
}

const Carta = require('./entities/Carta');
const ConsultaAPI = require('./entities/ConsultaAPI');
const Tienda = require('./entities/Tienda');
const CartaLink = require('./entities/CartaLink');
const DailyScrapingQuota = require('./entities/DailyScrapingQuota');
const HistorialCarta = require('./entities/HistorialCarta');
const HistorialTienda = require('./entities/HistorialTienda');
const HistorialPrecioTienda = require('./entities/HistorialPrecioTienda');
const HistorialPrecioPriceCharting = require('./entities/HistorialPrecioPriceCharting');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  // Asegurar tipos correctos
  port: Number.isNaN(parseInt(process.env.DB_PORT)) ? 5432 : parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  // Forzar que la contraseña sea string si existe
  password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : undefined,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Carta, ConsultaAPI, Tienda, CartaLink, DailyScrapingQuota, HistorialCarta, HistorialTienda, HistorialPrecioTienda, HistorialPrecioPriceCharting, require('./entities/User'), require('./entities/UserCollection'), require('./entities/MarketItem'), require('./entities/Message'), require('./entities/CustomCollection'), require('./entities/UserComment'), require('./entities/Report')],
});

module.exports = { AppDataSource };
