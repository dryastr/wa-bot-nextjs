// src/hooks/useSocket.ts
'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { WhatsAppStatus, Message } from '@/lib/types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  whatsappStatus: WhatsAppStatus;
  messages: Message[];
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

  useEffect(() => {
    // ✅ PERBAIKAN: Gunakan path default /socket.io (sama dengan server)
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      // Hapus path kustom, biarkan menggunakan default
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      timeout: 60000,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // maxReconnectionAttempts: 5
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
    });

    socketInstance.on('whatsapp:message', (message: Message) => {
      console.log('📨 New message:', message);
      setMessages(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    whatsappStatus,
    messages
  };
}