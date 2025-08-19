// src/app/api/socketio/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Socket.IO will be handled by the custom server
  return new Response('Socket.IO endpoint - use custom server for full functionality', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

export async function POST(request: NextRequest) {
  return new Response('Socket.IO POST endpoint', { status: 200 });
}