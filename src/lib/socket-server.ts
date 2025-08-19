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
    console.log('Initializing Socket.IO server...');
    
    io = new SocketIOServer(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Join room for WhatsApp updates
      socket.join('whatsapp-updates');
      
      // Send current status to new client
      const status = whatsappBot.getStatus();
      socket.emit('whatsapp:status', status);
    });

    // Set the socket server to whatsapp bot
    whatsappBot.setSocketIO(io);
  }
  
  return io;
}