// src/hooks/useSocket.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { WhatsAppStatus, Message } from '@/lib/types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  whatsappStatus: WhatsAppStatus;
  messages: Message[];
  commandCount: number;
  reloadCommands: () => Promise<boolean>;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    qrCode: null,
    clientInfo: null,
    lastSeen: null
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [commandCount, setCommandCount] = useState(0);

  // ✅ Manual command reload function
  const reloadCommands = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        console.warn('❌ Socket not connected, cannot reload commands');
        resolve(false);
        return;
      }

      console.log('🔄 Requesting manual command reload...');

      // Set up one-time listener for reload result
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Command reload timeout');
        resolve(false);
      }, 15000); // 15 second timeout

      socket.once('whatsapp:command-reload-result', (result) => {
        clearTimeout(timeoutId);
        console.log('✅ Command reload result:', result);
        
        if (result.success) {
          setCommandCount(result.commandCount || 0);
        }
        
        resolve(result.success);
      });

      // Emit reload request
      socket.emit('whatsapp:reload-commands');
    });
  }, [socket, isConnected]);

  useEffect(() => {
    // ✅ Use default socket.io path
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      // Remove custom path, let it use default /socket.io/
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      timeout: 60000,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // upgradeTimeout: 30000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server:', reason);
      setIsConnected(false);
    });

    socketInstance.on('whatsapp:status', (status: WhatsAppStatus) => {
      console.log('📱 WhatsApp status updated:', status);
      setWhatsappStatus(status);
    });

    socketInstance.on('whatsapp:qr', (qrCode: string) => {
      console.log('📱 QR code received:', qrCode ? 'QR Code Available' : 'No QR Code');
      setWhatsappStatus(prev => ({ 
        ...prev, 
        qrCode, 
        isConnected: false 
      }));
    });

    socketInstance.on('whatsapp:ready', (clientInfo: any) => {
      console.log('✅ WhatsApp ready:', clientInfo);
      setWhatsappStatus(prev => ({
        ...prev,
        isConnected: true,
        qrCode: null,
        clientInfo: {
          pushname: clientInfo?.pushname,
          number: clientInfo?.wid?.user
        },
        lastSeen: new Date()
      }));
    });

    socketInstance.on('whatsapp:disconnected', () => {
      console.log('❌ WhatsApp disconnected');
      setWhatsappStatus({
        isConnected: false,
        qrCode: null,
        clientInfo: null,
        lastSeen: null
      });
      setMessages([]); // Clear messages on disconnect
      setCommandCount(0); // Clear command count
    });

    socketInstance.on('whatsapp:message', (message: Message) => {
      console.log('📨 New message:', message);
      setMessages(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
    });

    // ✅ Listen for command updates
    socketInstance.on('whatsapp:commands-updated', (data: any) => {
      console.log('🔄 Commands updated:', data);
      setCommandCount(data.count || 0);
    });

    socketInstance.on('whatsapp:commands-reloaded', (data: any) => {
      console.log('🔄 Commands reloaded:', data);
      if (data.success) {
        setCommandCount(data.count || 0);
      }
    });

    // ✅ Handle ping/pong for connection health
    socketInstance.on('pong', (data: any) => {
      console.log('🏓 Pong received:', data);
    });

    // ✅ Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, 30000);

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      clearInterval(pingInterval);
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    whatsappStatus,
    messages,
    commandCount,
    reloadCommands
  };
}