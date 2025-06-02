const express = require('express');
const { AppDataSource } = require('./data-source');
require('dotenv').config();

const cartaRoutes = require('./routes/cartaRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log('📦 Conectado a PostgreSQL correctamente');

    // Rutas
    app.use('/api/cartas', cartaRoutes);
    

    app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor escuchando en http://${HOST}:${PORT}`);
  });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });
