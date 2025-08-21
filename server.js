// server.js
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
const { whatsappBot } = require('./src/lib/whatsapp');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔄 Preparing Next.js...');
    await app.prepare();
    
    const expressApp = express();
    const server = createServer(expressApp);

    // Socket.IO dengan konfigurasi yang diperlukan
    const io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Izinkan semua origin untuk pengembangan
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    console.log('🔄 Setting up WhatsApp Bot...');
    // Hubungkan WhatsAppBot dengan socket
    whatsappBot.setSocketIO(io);
    
    // Simpan io ke global untuk akses dari WhatsAppBot
    global.io = io;

    // Initialize WhatsApp Bot
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

      // Handle bot start/disconnect actions
      socket.on('whatsapp:start', async () => {
        try {
          console.log('[SOCKET] Starting WhatsApp bot...');
          await whatsappBot.initialize();
          socket.emit('whatsapp:status', whatsappBot.getStatus());
        } catch (error) {
          console.error('[SOCKET] Error starting bot:', error);
          socket.emit('whatsapp:error', { message: error.message });
        }
      });
      
      socket.on('whatsapp:disconnect', async () => {
        try {
          console.log('[SOCKET] Disconnecting WhatsApp bot...');
          await whatsappBot.disconnect();
          socket.emit('whatsapp:status', whatsappBot.getStatus());
        } catch (error) {
          console.error('[SOCKET] Error disconnecting bot:', error);
          socket.emit('whatsapp:error', { message: error.message });
        }
      });

      // Handle manual command reload request
      socket.on('whatsapp:reload-commands', async () => {
        try {
          console.log('[SOCKET] Manual command reload requested...');
          await whatsappBot.loadCommandsFromApi();
          socket.emit('whatsapp:commands-reloaded', { success: true });
        } catch (error) {
          console.error('[SOCKET] Error reloading commands:', error);
          socket.emit('whatsapp:commands-reloaded', { success: false, message: error.message });
        }
      });

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

    // Handle API Routes
    expressApp.all('/api/*', (req, res) => {
      return handle(req, res);
    });
    
    // Serve static files
    expressApp.use('/public', express.static(path.join(__dirname, 'public')));

    // Handle Next.js pages routes
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