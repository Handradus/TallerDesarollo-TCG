const express = require('express');
const { AppDataSource } = require('./data-source');
const { seedTiendas } = require('./scripts/seedTiendas');
require('dotenv').config();



const cartaRoutes = require('./routes/cartaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const tiendaPublicaRoutes = require('./routes/tiendaPublicaRoutes');
const sugerenciasRoutes = require('./routes/sugerenciasRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(async () => { 
    console.log('📦 Conectado a PostgreSQL correctamente');

    await seedTiendas(); 

    // Rutas
    app.use('/api/cartas', cartaRoutes);
    app.use('/api/historial', historialRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/tiendas', tiendaRoutes);
    app.use('/api/tiendas-publicas', tiendaPublicaRoutes);
    app.use('/api/sugerencias', sugerenciasRoutes);
    

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor escuchando en http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });

