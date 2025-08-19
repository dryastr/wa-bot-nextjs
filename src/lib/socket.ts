// src/lib/socket.ts
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';

interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NetSocket & {
    server: SocketServer;
  };
}

export function initializeSocket(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
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
    });

    res.socket.server.io = io;
    
    // Set the socket server to whatsapp bot
    const { whatsappBot } = require('./whatsapp');
    whatsappBot.setSocketIO(io);
  }
  
  return res.socket.server.io;
}