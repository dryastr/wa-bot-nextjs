// src/lib/types.ts
export interface Command {
  id: string;
  trigger: string;
  response: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppStatus {
  isConnected: boolean;
  qrCode: string | null;
  clientInfo: {
    pushname?: string;
    number?: string;
  } | null;
  lastSeen: Date | null;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
}

export interface SendMessageRequest {
  number: string;
  message: string;
}

export interface SocketEvents {
  'whatsapp:status': (status: WhatsAppStatus) => void;
  'whatsapp:message': (message: Message) => void;
  'whatsapp:qr': (qr: string) => void;
  'whatsapp:ready': (clientInfo: any) => void;
  'whatsapp:disconnected': () => void;
}