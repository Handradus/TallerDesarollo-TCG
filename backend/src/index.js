const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { AppDataSource } = require('./data-source');
const { seedTiendas } = require('./scripts/seedTiendas');
const rateLimit = require('express-rate-limit');
require('dotenv').config();



const cartaRoutes = require('./routes/cartaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const tiendaPublicaRoutes = require('./routes/tiendaPublicaRoutes');
const sugerenciasRoutes = require('./routes/sugerenciasRoutes');
const authRoutes = require('./routes/auth.routes');
const collectionRoutes = require('./routes/collection.routes');
const marketRoutes = require('./routes/market.routes');
const messageRoutes = require('./routes/message.routes');
const cors = require('cors');

const path = require('path');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const HOST = '0.0.0.0';
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
    app.use('/api/auth', authRoutes);
    app.use('/api/collection', collectionRoutes);
    app.use('/api/market', marketRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/contact', require('./routes/contact.routes'));
    app.use('/api/profile', require('./routes/profile.routes'));
    app.use('/api/reports', require('./routes/report.routes'));
    app.use('/api/blocks', require('./routes/block.routes'));


    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
      }
    });

    // Make io accessible globally or export it (Quick way: attach to app)
    app.set('socketio', io);

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      socket.on('join_room', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`👤 User ${userId} joined room user_${userId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });
    });

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor escuchando en http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });

