const express = require('express');
const { AppDataSource } = require('./data-source');
const { seedTiendas } = require('./scripts/seedTiendas');
require('dotenv').config();



const cartaRoutes = require('./routes/cartaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(async () => { // <- esta línea se corrige
    console.log('📦 Conectado a PostgreSQL correctamente');

    await seedTiendas(); // ahora puedes usar await sin error

    // Rutas
    app.use('/api/cartas', cartaRoutes);
    app.use('/api/historial', historialRoutes);
    

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor escuchando en http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });

