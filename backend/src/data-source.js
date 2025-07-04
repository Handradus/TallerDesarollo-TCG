const { DataSource } = require('typeorm');
require('dotenv').config();

const Carta = require('./entities/Carta'); // ← sin destructuración
const ConsultaAPI = require('./entities/ConsultaAPI');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Carta,ConsultaAPI], // ← arreglo de entidades reales, no strings
});

module.exports = { AppDataSource };
