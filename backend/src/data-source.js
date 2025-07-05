const { DataSource } = require('typeorm');
require('dotenv').config();

const Carta = require('./entities/Carta'); // ← sin destructuración
const ConsultaAPI = require('./entities/ConsultaAPI');
const Tienda = require('./entities/Tienda');
const CartaLink = require('./entities/CartaLink'); // Asegúrate de importar CartaLink si lo necesitas

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Carta,ConsultaAPI,Tienda,CartaLink], // ← arreglo de entidades reales, no strings
});

module.exports = { AppDataSource };
