// src/lib/socket-server.ts
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { whatsappBot } from './whatsapp';

let io: SocketIOServer | null = null;

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function initSocketServer(server: any) {
  if (!io) {
    console.log('🔌 Initializing Socket.IO server...');
    
    io = new SocketIOServer(server, {
      // ✅ Use default path instead of custom path
      // path: '/api/socketio', // Remove this line
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      // ✅ Add connection configuration
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      allowUpgrades: true,
      transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
      console.log('👤 Client connected:', socket.id);

      socket.on('disconnect', (reason) => {
        console.log('👤 Client disconnected:', socket.id, 'Reason:', reason);
      });

      socket.on('error', (error) => {
        console.error('❌ Socket error for client', socket.id, ':', error);
      });

      // Join room for WhatsApp updates
      socket.join('whatsapp-updates');
      
      // Send current status to new client
      try {
        const status = whatsappBot.getStatus();
        const commands = whatsappBot.getCommands();
        
        socket.emit('whatsapp:status', status);
        socket.emit('whatsapp:commands-updated', {
          count: commands.length,
          commands: commands.map(cmd => cmd.trigger),
          timestamp: new Date()
        });
        
        console.log(`📱 Sent initial status to client ${socket.id}:`, {
          connected: status.isConnected,
          commandCount: commands.length
        });
      } catch (error) {
        console.error('❌ Error sending initial status to client:', error);
      }

      // ✅ Add manual command reload handler
      socket.on('whatsapp:reload-commands', async () => {
        try {
          console.log(`🔄 Manual command reload requested by client ${socket.id}`);
          const success = await whatsappBot.reloadCommands();
          
          socket.emit('whatsapp:command-reload-result', {
            success,
            timestamp: new Date(),
            commandCount: whatsappBot.getCommands().length
          });
        } catch (error) {
          console.error('❌ Error reloading commands:', error);
          socket.emit('whatsapp:command-reload-result', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          });
        }
      });

      // ✅ Add ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });
    });

    // ✅ Set the socket server to whatsapp bot
    whatsappBot.setSocketIO(io);
    
    console.log('✅ Socket.IO server initialized successfully');
  }
  
  return io;
}