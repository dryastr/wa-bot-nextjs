// server.js
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');

// Import WhatsApp Bot - perlu kompilasi TypeScript dulu
let whatsappBot;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔄 Preparing Next.js...');
    await app.prepare();

    // Import WhatsAppBot setelah Next.js ready (untuk handle TypeScript)
    try {
      const whatsappModule = await import('./src/lib/whatsapp.js');
      whatsappBot = whatsappModule.whatsappBot;
    } catch (error) {
      console.error('❌ Failed to import WhatsApp Bot:', error);
      console.log('💡 Make sure to build TypeScript files first or use .js extension');
      process.exit(1);
    }

    const expressApp = express();
    const server = createServer(expressApp);

    // Socket.IO dengan konfigurasi yang lebih lengkap
    const io = new SocketIOServer(server, {
      cors: {
        origin: dev ? "http://localhost:3000" : false,
        methods: ["GET", "POST"]
      },
      // Gunakan path default /socket.io 
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    console.log('🔄 Setting up WhatsApp Bot...');
    // Hubungkan WhatsAppBot dengan socket
    whatsappBot.setSocketIO(io);
    
    // Simpan io ke global untuk akses dari WhatsAppBot
    global.io = io;

    // Initialize WhatsApp Bot (akan generate QR code)
    console.log('🔄 Initializing WhatsApp Bot...');
    whatsappBot.initialize().then(() => {
      console.log('✅ WhatsApp Bot initialized');
    }).catch((error) => {
      console.error('❌ Failed to initialize WhatsApp Bot:', error);
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('👤 Client connected:', socket.id);

      // Kirim status awal ke client yang baru connect
      const status = whatsappBot.getStatus();
      socket.emit('whatsapp:status', status);
      
      // Jika ada QR code, kirim ke client
      if (status.qrCode) {
        socket.emit('whatsapp:qr', status.qrCode);
      }

      // Handle manual message sending dari client
      socket.on('send:message', async (data) => {
        try {
          const { number, message } = data;
          await whatsappBot.sendMessage(number, message);
          socket.emit('message:sent', { success: true });
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message:sent', { success: false, error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log('👤 Client disconnected:', socket.id);
      });
    });

    // Middleware untuk parsing JSON
    expressApp.use(express.json());

    // API Routes untuk WhatsApp Bot
    expressApp.get('/api/whatsapp/status', (req, res) => {
      res.json(whatsappBot.getStatus());
    });

    expressApp.get('/api/whatsapp/commands', (req, res) => {
      res.json(whatsappBot.getCommands());
    });

    expressApp.post('/api/whatsapp/send', async (req, res) => {
      try {
        const { number, message } = req.body;
        const result = await whatsappBot.sendMessage(number, message);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Serve static files
    expressApp.use('/public', express.static(path.join(__dirname, 'public')));

    // Handle Next.js routes
    expressApp.all('*', (req, res) => {
      return handle(req, res);
    });

    // Start server
    server.listen(port, () => {
      console.log(`🚀 Server ready on http://localhost:${port}`);
      console.log(`🔌 Socket.IO ready on ws://localhost:${port}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      try {
        if (whatsappBot) {
          await whatsappBot.disconnect();
          console.log('✅ WhatsApp Bot disconnected');
        }
        server.close(() => {
          console.log('✅ HTTP server closed');
          process.exit(0);
        });
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();