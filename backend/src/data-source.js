const { DataSource } = require('typeorm');
require('dotenv').config();

const Carta = require('./entities/Carta'); 
const ConsultaAPI = require('./entities/ConsultaAPI');
const Tienda = require('./entities/Tienda');
const CartaLink = require('./entities/CartaLink'); 
const HistorialCarta = require('./entities/HistorialCarta');
const HistorialTienda = require('./entities/HistorialTienda');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Carta,ConsultaAPI,Tienda,CartaLink,HistorialCarta,HistorialTienda], 
});

module.exports = { AppDataSource };
